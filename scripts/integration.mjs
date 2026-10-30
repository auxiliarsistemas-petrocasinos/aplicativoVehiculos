import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !['127.0.0.1', 'localhost'].includes(new URL(url).hostname))
  throw new Error('Pruebas destructivas limitadas a entorno local ficticio.');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(url, process.env.SUPABASE_SECRET_KEY, options);
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const catalog = JSON.parse(await readFile('features/inspections/catalog-simplified.json', 'utf8'));
const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log('PASS ' + name);
  } catch (e) {
    results.push({ name, status: 'FAIL', cause: e.message });
    console.error('FAIL ' + name + ': ' + e.message);
    await writeFile('.local/integration-results.json', JSON.stringify(results, null, 2));
    throw e;
  }
}
const ok = (r) => {
  assert.equal(r.error, null, r.error?.message);
  return r.data;
};
const denied = (r) => assert.ok(r.error, 'La operación debía rechazarse');
const command = (db, action, payload = {}, request_id = randomUUID()) =>
  db.rpc('execute_command', { action, payload, request_id });
const login = async (alias, password = process.env.DEMO_PASSWORD) => {
  const db = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  const { data: email, error } = await service.rpc('resolve_login', {
    alias_input: alias,
    identifier_key: randomUUID(),
    network_key: randomUUID(),
  });
  ok({ data: email, error });
  const r = await db.auth.signInWithPassword({ email, password });
  ok(r);
  return { db, id: r.data.user.id, alias };
};
const prepare = async (alias) => {
  let user;
  try {
    user = await login(alias);
  } catch {
    user = await login(alias, process.env.TEST_PASSWORD);
  }
  const p = ok(await user.db.from('profiles').select('*').eq('id', user.id).single());
  if (p.must_change_password) {
    ok(await user.db.auth.updateUser({ password: process.env.TEST_PASSWORD }));
    ok(await user.db.auth.refreshSession());
  }
  return user;
};
let driver, second, admin, manager, it;
const fieldA = '20000000-0000-4000-8000-000000000001';
const fieldB = '20000000-0000-4000-8000-000000000002';
const template = '10000000-0000-4000-8000-000000000002';
const prefix = 'prueba' + randomUUID().replace(/[^a-f]/g, '');
for (const [suffix, role, field_id] of [
  ['conductor', 'driver', fieldA],
  ['conductor.s', 'driver', fieldA],
  ['horizonte', 'driver', fieldB],
  ['administrador', 'fleet_admin', null],
  ['gerencia', 'management', null],
  ['sistemas', 'it_superadmin', null],
]) {
  const alias = prefix + '.' + suffix,
    email = alias + '@example.com';
  const user = ok(
    await service.auth.admin.createUser({
      email,
      password: process.env.DEMO_PASSWORD,
      email_confirm: true,
    }),
  ).user;
  ok(
    await service.from('profiles').insert({
      id: user.id,
      alias,
      full_name: 'Usuario ficticio de integración',
      email,
      phone: '0000000000',
      role,
      field_id,
    }),
  );
}
await test('Cambio obligatorio bloquea RPC y lecturas operativas por API directa', async () => {
  driver = await login(prefix + '.conductor');
  denied(await command(driver.db, 'start_shift'));
  assert.equal(ok(await driver.db.from('vehicles').select('*')).length, 0);
  ok(await driver.db.auth.updateUser({ password: process.env.TEST_PASSWORD }));
  ok(await driver.db.auth.refreshSession());
  assert.equal(
    ok(await driver.db.from('profiles').select('must_change_password').eq('id', driver.id).single())
      .must_change_password,
    false,
  );
});
second = await prepare(prefix + '.conductor.s');
await prepare(prefix + '.horizonte');
admin = await prepare(prefix + '.administrador');
manager = await prepare(prefix + '.gerencia');
it = await prepare(prefix + '.sistemas');
await test('RLS: anon no lee y conductor solo consulta su campo', async () => {
  denied(await anon.from('vehicles').select('*'));
  const fields = ok(await driver.db.from('fields').select('*'));
  assert.equal(fields.length, 1);
  assert.equal(fields[0].id, fieldA);
  assert.ok(ok(await driver.db.from('vehicles').select('*')).every((v) => v.field_id === fieldA));
});
await test('Gerencia no escribe por RPC ni tablas; roles no autoeditables', async () => {
  denied(await command(manager.db, 'create_field', { name: 'No permitido' }));
  denied(await manager.db.from('fields').insert({ name: 'No permitido' }));
  denied(await driver.db.from('profiles').update({ role: 'it_superadmin' }).eq('id', driver.id));
  denied(
    await admin.db.rpc('provision_profile', { actor_id: admin.id, user_id: driver.id, data: {} }),
  );
});
let provisioned;
await test('Administrador crea conductor; prohibido crear rol privilegiado', async () => {
  const email = 'test.' + randomUUID() + '@example.com';
  provisioned = ok(
    await service.auth.admin.createUser({
      email,
      password: process.env.DEMO_PASSWORD,
      email_confirm: true,
    }),
  ).user;
  const body = {
    alias:
      'prueba.' +
      randomUUID()
        .replace(/[^a-f]/g, '')
        .slice(0, 12),
    full_name: 'Conductor de prueba ficticio',
    email,
    phone: '0000000000',
    field_id: fieldA,
    role: 'it_superadmin',
  };
  denied(
    await service.rpc('provision_profile', {
      actor_id: admin.id,
      user_id: provisioned.id,
      data: body,
    }),
  );
  ok(
    await service.rpc('provision_profile', {
      actor_id: admin.id,
      user_id: provisioned.id,
      data: { ...body, role: 'driver' },
    }),
  );
  assert.equal(
    ok(
      await service
        .from('profiles')
        .select('role,must_change_password')
        .eq('id', provisioned.id)
        .single(),
    ).must_change_password,
    true,
  );
});
await test('Reset limitado por rol y sin lectura de clave anterior', async () => {
  const previousSession = createClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    options,
  );
  ok(
    await previousSession.auth.signInWithPassword({
      email: provisioned.email,
      password: process.env.DEMO_PASSWORD,
    }),
  );
  ok(await previousSession.auth.updateUser({ password: process.env.DEMO_PASSWORD + 'Changed' }));
  denied(
    await service.rpc('reset_password_guard', {
      actor_id: admin.id,
      target_id: it.id,
      phase: 'begin',
    }),
  );
  denied(
    await manager.db.rpc('reset_password_guard', {
      actor_id: manager.id,
      target_id: driver.id,
      phase: 'begin',
    }),
  );
  ok(
    await service.rpc('reset_password_guard', {
      actor_id: admin.id,
      target_id: provisioned.id,
      phase: 'begin',
    }),
  );
  ok(
    await service.auth.admin.updateUserById(provisioned.id, {
      password: process.env.TEST_PASSWORD,
    }),
  );
  ok(
    await service.rpc('reset_password_guard', {
      actor_id: admin.id,
      target_id: provisioned.id,
      phase: 'finish',
    }),
  );
  denied(await command(previousSession, 'start_shift'));
  denied(await previousSession.auth.refreshSession());
  await new Promise((resolve) => setTimeout(resolve, 1100));
  const resetSession = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  ok(
    await resetSession.auth.signInWithPassword({
      email: provisioned.email,
      password: process.env.TEST_PASSWORD,
    }),
  );
  denied(await command(resetSession, 'start_shift'));
  assert.equal(
    ok(
      await service
        .from('profiles')
        .select('must_change_password')
        .eq('id', provisioned.id)
        .single(),
    ).must_change_password,
    true,
  );
});
let va, vb, vc;
await test('Administración persistente de campos y flota', async () => {
  const base = Math.random().toString(36).slice(2, 7).toUpperCase();
  va = ok(
    await command(admin.db, 'create_vehicle', {
      plate: 'A' + base,
      description: 'Liviano ficticio de prueba',
      vehicle_type: 'light',
      field_id: fieldA,
      odometer: 100,
    }),
  ).id;
  vb = ok(
    await command(admin.db, 'create_vehicle', {
      plate: 'B' + base,
      description: 'Pesado ficticio de prueba',
      vehicle_type: 'heavy',
      field_id: fieldA,
      odometer: 500,
    }),
  ).id;
  vc = ok(
    await command(admin.db, 'create_vehicle', {
      plate: 'C' + base,
      description: 'Liviano ficticio alterno',
      vehicle_type: 'light',
      field_id: fieldB,
      odometer: 100,
    }),
  ).id;
  assert.ok(va && vb && vc);
});
let sid, sid2;
await test('Inicio crea borrador, reintentos idempotentes y único turno por conductor', async () => {
  const key = randomUUID();
  sid = ok(await command(driver.db, 'start_shift', {}, key)).id;
  assert.equal(ok(await command(driver.db, 'start_shift', {}, key)).id, sid);
  assert.equal(
    ok(await driver.db.from('shifts').select('status').eq('id', sid).single()).status,
    'opening',
  );
  denied(await command(driver.db, 'start_shift'));
  sid2 = ok(await command(second.db, 'start_shift')).id;
});
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
  'base64',
);
async function evidence(user, shift, kind = 'photo', beforeRegister) {
  const intent = ok(
    await user.db.rpc('create_evidence_upload_intent', {
      shift_id_input: shift,
      kind_input: kind,
      mime_type_input: 'image/png',
      expected_bytes_input: png.length,
    }),
  )[0];
  const signed = ok(
    await user.db.storage.from('evidence').createSignedUploadUrl(intent.path, { upsert: false }),
  );
  ok(
    await user.db.storage.from('evidence').uploadToSignedUrl(intent.path, signed.token, png, {
      contentType: 'image/png',
      upsert: false,
    }),
  );
  if (beforeRegister) await beforeRegister(intent.path);
  const id = ok(
    await user.db.rpc('finalize_evidence_upload_intent', { intent_id_input: intent.id }),
  );
  assert.equal(id, intent.id);
  return { id, path: intent.path };
}
const assessment = Object.fromEntries(catalog.fatigue.map((q) => [q.id, false]));
const inspection = (type, km, signature) => ({
  template_id: template,
  odometer: km,
  signature,
  answers: catalog.inspection
    .filter((i) => ['both', type].includes(i.vehicleType))
    .map((i) => ({ item_id: i.id, rating: 'good', observation: '', photos: [] })),
});
let sig1, sig2, photo1;
await test('Storage privado: carga real y asociación; acceso ajeno denegado', async () => {
  sig1 = await evidence(driver, sid, 'signature');
  sig2 = await evidence(second, sid2, 'signature');
  photo1 = await evidence(driver, sid, 'photo', async (path) => {
    ok(await driver.db.storage.from('evidence').download(path));
    denied(await second.db.storage.from('evidence').download(path));
    denied(await admin.db.storage.from('evidence').download(path));
    denied(await manager.db.storage.from('evidence').download(path));
    denied(await anon.storage.from('evidence').download(path));
  });
  denied(await second.db.storage.from('evidence').download(photo1.path));
  denied(await anon.storage.from('evidence').download(photo1.path));
  ok(await driver.db.storage.from('evidence').download(photo1.path));
  denied(
    await second.db.storage
      .from('evidence')
      .upload(`${driver.id}/${sid}/${randomUUID()}`, png, { contentType: 'image/png' }),
  );
});
await test('Apertura incompleta, firma ausente y campo ajeno rechazados', async () => {
  denied(
    await command(driver.db, 'confirm_opening', {
      shift_id: sid,
      vehicle_id: va,
      assessment: {},
      inspection: inspection('light', 100, sig1.id),
    }),
  );
  denied(
    await command(driver.db, 'confirm_opening', {
      shift_id: sid,
      vehicle_id: va,
      assessment,
      inspection: inspection('light', 100),
    }),
  );
  denied(
    await command(driver.db, 'confirm_opening', {
      shift_id: sid,
      vehicle_id: vc,
      assessment,
      inspection: inspection('light', 100, sig1.id),
    }),
  );
});
let opening = inspection('light', 100, sig1.id);
await test('Regular/Malo exige observación y fotografía simultáneas en SQL', async () => {
  for (const rating of ['regular', 'bad']) {
    opening.answers[0] = {
      ...opening.answers[0],
      rating,
      observation: 'Falla ficticia',
      photos: [],
    };
    denied(
      await command(driver.db, 'confirm_opening', {
        shift_id: sid,
        vehicle_id: va,
        assessment,
        inspection: opening,
      }),
    );
    opening.answers[0] = { ...opening.answers[0], observation: ' ', photos: [photo1.id] };
    denied(
      await command(driver.db, 'confirm_opening', {
        shift_id: sid,
        vehicle_id: va,
        assessment,
        inspection: opening,
      }),
    );
  }
  opening.answers[0] = {
    ...opening.answers[0],
    rating: 'regular',
    observation: 'Falla ficticia con evidencia',
    photos: [photo1.id],
  };
});
await test('Concurrencia: dos conductores reciben el mismo vehículo, solo uno confirma', async () => {
  const key = randomUUID();
  const payload = { shift_id: sid, vehicle_id: va, assessment, inspection: opening };
  const results = await Promise.all([
    command(driver.db, 'confirm_opening', payload, key),
    command(second.db, 'confirm_opening', {
      shift_id: sid2,
      vehicle_id: va,
      assessment,
      inspection: inspection('light', 100, sig2.id),
    }),
  ]);
  assert.equal(results.filter((r) => !r.error).length, 1);
  if (results[0].error) {
    [driver, second] = [second, driver];
    [sid, sid2] = [sid2, sid];
  } else assert.equal(ok(await command(driver.db, 'confirm_opening', payload, key)).id, sid);
  assert.equal(
    ok(
      await service
        .from('vehicle_usages')
        .select('*')
        .eq('vehicle_id', va)
        .is('delivered_at', null),
    ).length,
    1,
  );
});
await test('Disponibilidad revela ocupación del campo sin exponer turnos ajenos', async () => {
  const states = ok(await second.db.rpc('vehicle_availability'));
  assert.equal(states.find((v) => v.vehicle_id === va).eligible, false);
  assert.equal(states.find((v) => v.vehicle_id === va).in_use, true);
  assert.ok(!states.some((v) => v.vehicle_id === vc));
  assert.equal(ok(await second.db.from('shifts').select('*').eq('id', sid)).length, 0);
  denied(await anon.rpc('vehicle_availability'));
});
await test('Fatiga solo accesible por autor; inspecciones confirmadas inmutables', async () => {
  assert.equal(ok(await manager.db.from('driver_assessments').select('*')).length, 0);
  assert.equal(ok(await admin.db.from('driver_assessments').select('*')).length, 0);
  assert.equal(ok(await it.db.from('driver_assessments').select('*')).length, 0);
  assert.equal(ok(await second.db.from('shifts').select('*').eq('id', sid)).length, 0);
  const rows = ok(await driver.db.from('driver_assessments').select('*').eq('shift_id', sid));
  assert.equal(rows.length, 1);
  denied(await driver.db.from('inspections').update({ odometer: 9 }).eq('shift_id', sid));
});
await test('No se trasladan unidades con uso vigente; restricciones auditadas', async () => {
  denied(
    await command(admin.db, 'transfer_vehicle', { id: va, field_id: fieldB, reason: 'Prueba' }),
  );
  const restriction = ok(
    await command(admin.db, 'restrict_vehicle', {
      vehicle_id: vb,
      reason: 'Mantenimiento ficticio',
    }),
  ).id;
  denied(
    await command(admin.db, 'authorize_substitution', {
      shift_id: sid,
      replacement_id: vb,
      reason: 'Prueba',
    }),
  );
  ok(
    await command(admin.db, 'lift_restriction', {
      id: restriction,
      reason: 'Revisión ficticia documentada',
    }),
  );
});
let incident;
await test('Incidencia requiere descripción y foto; borrador reanudable no es reporte', async () => {
  ok(
    await driver.db.rpc('save_draft', {
      shift_id: sid,
      kind: 'incident',
      data: { description: 'Pendiente de foto' },
    }),
  );
  assert.equal(
    ok(await driver.db.from('operation_drafts').select('*').eq('shift_id', sid)).length,
    1,
  );
  denied(
    await command(driver.db, 'report_incident', {
      shift_id: sid,
      description: 'Prueba',
      photos: [],
    }),
  );
  const photo = await evidence(driver, sid);
  denied(
    await command(driver.db, 'report_incident', {
      shift_id: sid,
      description: ' ',
      photos: [photo.id],
    }),
  );
  incident = ok(
    await command(driver.db, 'report_incident', {
      shift_id: sid,
      description: 'Incidencia ficticia en prueba',
      photos: [photo.id],
    }),
  ).id;
  assert.equal(
    ok(
      await driver.db
        .from('operation_drafts')
        .select('*')
        .eq('shift_id', sid)
        .eq('kind', 'incident'),
    ).length,
    0,
  );
});
await test('Cambio unilateral rechazado; A→B autorizado conserva el turno y dos segmentos', async () => {
  denied(
    await command(driver.db, 'substitute', {
      shift_id: sid,
      authorization_id: randomUUID(),
      delivery: inspection('light', 110),
      reception: inspection('heavy', 500),
    }),
  );
  denied(
    await command(driver.db, 'authorize_substitution', {
      shift_id: sid,
      replacement_id: vb,
      reason: 'Prueba',
    }),
  );
  const auth = ok(
    await command(admin.db, 'authorize_substitution', {
      shift_id: sid,
      replacement_id: vb,
      reason: 'Reemplazo de prueba',
    }),
  ).id;
  ok(
    await command(driver.db, 'substitute', {
      shift_id: sid,
      authorization_id: auth,
      delivery: inspection('light', 110),
      reception: inspection('heavy', 500),
    }),
  );
  const uses = ok(await driver.db.from('vehicle_usages').select('*').eq('shift_id', sid));
  assert.equal(uses.length, 2);
  assert.equal(uses.filter((u) => !u.delivered_at).length, 1);
  assert.equal(
    ok(await driver.db.from('driver_assessments').select('*').eq('shift_id', sid)).length,
    1,
  );
});
await test('Cierre retomado con incidencia pendiente; suma de kilómetros por segmento', async () => {
  ok(await command(driver.db, 'begin_closing', { shift_id: sid }));
  assert.equal(
    ok(await driver.db.from('shifts').select('status').eq('id', sid).single()).status,
    'closing',
  );
  ok(
    await command(driver.db, 'close_shift', {
      shift_id: sid,
      inspection: inspection('heavy', 515),
    }),
  );
  assert.equal(
    ok(await driver.db.from('incidents').select('status').eq('id', incident).single()).status,
    'pending',
  );
  const uses = ok(await driver.db.from('vehicle_usages').select('*').eq('shift_id', sid));
  assert.equal(
    uses.reduce((n, u) => n + u.end_km - u.start_km, 0),
    25,
  );
  assert.equal(ok(await driver.db.from('inspections').select('*').eq('shift_id', sid)).length, 4);
});
await test('Seguimiento administrativo independiente y Gerencia consulta sin editar', async () => {
  ok(
    await command(admin.db, 'follow_incident', {
      id: incident,
      status: 'resolved',
      comment: 'Verificación ficticia finalizada',
    }),
  );
  assert.equal(
    ok(await manager.db.from('incidents').select('status').eq('id', incident).single()).status,
    'resolved',
  );
  denied(
    await command(manager.db, 'follow_incident', {
      id: incident,
      status: 'pending',
      comment: 'No permitido',
    }),
  );
});
let hold;
await test('Regularización conserva faltantes y retiene vehículo sin entrega', async () => {
  hold = ok(await command(driver.db, 'start_shift')).id;
  const signature = await evidence(driver, hold, 'signature');
  ok(
    await command(driver.db, 'confirm_opening', {
      shift_id: hold,
      vehicle_id: va,
      assessment,
      inspection: inspection('light', 110, signature.id),
    }),
  );
  ok(
    await command(admin.db, 'regularize', {
      shift_id: hold,
      reason: 'Regularización ficticia sin entrega',
    }),
  );
  const row = ok(await driver.db.from('shifts').select('*').eq('id', hold).single());
  assert.equal(row.status, 'regularized');
  assert.ok(row.missing.length > 0);
  assert.equal(
    ok(
      await service
        .from('vehicle_usages')
        .select('*')
        .eq('shift_id', hold)
        .is('delivered_at', null),
    ).length,
    1,
  );
  const sig = await evidence(second, sid2, 'signature');
  denied(
    await command(second.db, 'confirm_opening', {
      shift_id: sid2,
      vehicle_id: va,
      assessment,
      inspection: inspection('light', 110, sig.id),
    }),
  );
});
await test('Documento obligatorio vencido impide nuevas recepciones', async () => {
  ok(
    await command(admin.db, 'add_document', {
      vehicle_id: vb,
      name: 'Documento ficticio obligatorio',
      required: true,
      expires_on: '2000-01-01',
    }),
  );
  const signature = await evidence(second, sid2, 'signature');
  denied(
    await command(second.db, 'confirm_opening', {
      shift_id: sid2,
      vehicle_id: vb,
      assessment,
      inspection: inspection('heavy', 515, signature.id),
    }),
  );
});
await test('Campos, traslado sin uso y correcciones conservan historial', async () => {
  const newField = ok(
    await command(admin.db, 'create_field', { name: 'Sitio ficticio ' + randomUUID() }),
  ).id;
  ok(
    await command(admin.db, 'update_field', {
      id: newField,
      name: 'Sitio actualizado ' + randomUUID(),
      active: true,
    }),
  );
  ok(
    await command(admin.db, 'transfer_vehicle', {
      id: vc,
      field_id: newField,
      reason: 'Prueba administrativa',
    }),
  );
  assert.equal(
    ok(await admin.db.from('field_transfers').select('*').eq('entity_id', vc)).length,
    1,
  );
  const usage = ok(
    await driver.db
      .from('vehicle_usages')
      .select('*')
      .eq('shift_id', sid)
      .order('received_at')
      .limit(1)
      .single(),
  );
  ok(
    await command(admin.db, 'correct_odometer', {
      usage_id: usage.id,
      reading: 'end',
      value: 111,
      reason: 'Corrección ficticia documentada',
    }),
  );
  assert.equal(
    ok(await driver.db.from('vehicle_usages').select('end_km').eq('id', usage.id).single()).end_km,
    110,
  );
  assert.equal(
    ok(await admin.db.from('odometer_corrections').select('*').eq('usage_id', usage.id)).length,
    1,
  );
  denied(
    await command(admin.db, 'create_vehicle', {
      plate: 'NAN' + randomUUID().slice(0, 6).toUpperCase(),
      description: 'Prueba',
      vehicle_type: 'light',
      field_id: fieldA,
      odometer: 'NaN',
    }),
  );
});
await test('Resolución de alias limita intentos sin publicar directorio', async () => {
  const identifier_key = randomUUID();
  const network_key = randomUUID();
  for (let n = 0; n < 10; n++)
    assert.ok(
      ok(
        await service.rpc('resolve_login', {
          alias_input: driver.alias,
          identifier_key,
          network_key,
        }),
      ),
    );
  assert.equal(
    ok(
      await service.rpc('resolve_login', {
        alias_input: driver.alias,
        identifier_key,
        network_key,
      }),
    ),
    null,
  );
  denied(
    await driver.db.rpc('resolve_login', {
      alias_input: driver.alias,
      identifier_key: randomUUID(),
      network_key: randomUUID(),
    }),
  );
});
await test('Cuota de intenciones permanece atómica bajo concurrencia', async () => {
  const quotaShift = ok(await command(driver.db, 'start_shift')).id;
  const attempts = await Promise.all(
    Array.from({ length: 60 }, () =>
      driver.db.rpc('create_evidence_upload_intent', {
        shift_id_input: quotaShift,
        kind_input: 'photo',
        mime_type_input: 'image/png',
        expected_bytes_input: 1,
      }),
    ),
  );
  assert.equal(attempts.filter((attempt) => !attempt.error).length, 50);
  ok(
    await command(admin.db, 'regularize', {
      shift_id: quotaShift,
      reason: 'Finalización de prueba concurrente de cuota',
    }),
  );
});
await test('Auditoría técnica existe y no incluye respuestas de fatiga', async () => {
  const events = ok(await it.db.from('audit_events').select('*'));
  assert.ok(events.some((e) => e.action === 'regularize'));
  assert.ok(events.every((e) => !JSON.stringify(e.detail).includes('F09-')));
  assert.equal(ok(await driver.db.from('audit_events').select('*')).length, 0);
});
// Dejar conductores de demo libres de aperturas incompletas para pruebas de UI.
ok(
  await command(admin.db, 'regularize', {
    shift_id: sid2,
    reason: 'Finalización de preparación de pruebas ficticias',
  }),
);
await writeFile('.local/integration-results.json', JSON.stringify(results, null, 2));
console.log(
  `${results.length} comprobaciones de integración aprobadas. Persistencia, Auth y Storage reales locales.`,
);
