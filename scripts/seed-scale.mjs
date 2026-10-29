// Volumen sintético reproducible para pruebas locales de consultas y paginación.
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const {
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SECRET_KEY: key,
  DEMO_PASSWORD: password,
} = process.env;
if (!url || !key || !password || password.length < 12)
  throw new Error('Configura Supabase local, clave privada y DEMO_PASSWORD.');
if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname))
  throw new Error('El volumen sintético solo se genera en localhost.');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const alpha = (index) => {
  let value = index;
  let result = '';
  do {
    result = String.fromCharCode(97 + (value % 26)) + result;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return result;
};
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

for (let index = 1; index <= 30; index++) {
  const fieldId = `20000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
  const fieldName = `Campo Sintético ${String(index).padStart(2, '0')} · DEMO`;
  const { error: fieldError } = await db
    .from('fields')
    .upsert({ id: fieldId, name: fieldName }, { onConflict: 'id' });
  if (fieldError) throw new Error('Fallo creando campo sintético.');

  const vehicles = [];
  for (let vehicleIndex = 1; vehicleIndex <= 3; vehicleIndex++) {
    const plate = `S${String(index).padStart(2, '0')}${vehicleIndex}D`;
    const { data: vehicle, error } = await db
      .from('vehicles')
      .upsert(
        {
          plate,
          description: `Vehículo sintético ${vehicleIndex}`,
          vehicle_type: vehicleIndex === 3 ? 'heavy' : 'light',
          field_id: fieldId,
          odometer: 10000 + index * 100 + vehicleIndex * 10,
        },
        { onConflict: 'plate' },
      )
      .select('id,plate,odometer')
      .single();
    if (error) throw new Error('Fallo creando vehículo sintético.');
    vehicles.push(vehicle);
  }

  const alias = `demo.campo.${alpha(index - 1)}`;
  const email = `${alias}@example.invalid`;
  let { data: profile } = await db.from('profiles').select('id').eq('alias', alias).maybeSingle();
  if (!profile) {
    const { data: created, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error('Fallo creando conductor sintético.');
    const { data: inserted, error: profileError } = await db
      .from('profiles')
      .insert({
        id: created.user.id,
        alias,
        full_name: `Conductor Sintético ${index}`,
        email,
        phone: '0000000000',
        role: 'driver',
        field_id: fieldId,
        must_change_password: false,
      })
      .select('id')
      .single();
    if (profileError) throw new Error('Fallo creando perfil sintético.');
    profile = inserted;
  }

  const { count } = await db
    .from('shifts')
    .select('id', { count: 'exact', head: true })
    .eq('driver_id', profile.id);
  if ((count ?? 0) > 0) continue;
  for (let historical = 1; historical <= 2; historical++) {
    const shiftId = randomUUID();
    const usageId = randomUUID();
    const vehicle = vehicles[(historical - 1) % vehicles.length];
    const day = String(((index + historical) % 27) + 1).padStart(2, '0');
    const openedAt = `2026-09-${day}T12:00:00Z`;
    const closedAt = `2026-09-${day}T20:00:00Z`;
    const { error: shiftError } = await db.from('shifts').insert({
      id: shiftId,
      driver_id: profile.id,
      field_id: fieldId,
      status: 'closed',
      created_at: openedAt,
      opened_at: openedAt,
      closed_at: closedAt,
    });
    if (shiftError) throw new Error('Fallo creando turno sintético.');
    const { error: usageError } = await db.from('vehicle_usages').insert({
      id: usageId,
      shift_id: shiftId,
      vehicle_id: vehicle.id,
      field_id: fieldId,
      plate_snapshot: vehicle.plate,
      received_at: openedAt,
      delivered_at: closedAt,
      start_km: vehicle.odometer,
      end_km: vehicle.odometer + 35 + historical,
    });
    if (usageError) throw new Error('Fallo creando utilización sintética.');
    if (historical === 1 && index % 3 === 0) {
      const incidentId = randomUUID();
      const evidenceId = randomUUID();
      const path = `${profile.id}/${shiftId}/${evidenceId}`;
      const { error: uploadError } = await db.storage
        .from('evidence')
        .upload(path, png, { contentType: 'image/png', upsert: false });
      if (uploadError) throw new Error('Fallo creando evidencia sintética.');
      await db.from('incidents').insert({
        id: incidentId,
        shift_id: shiftId,
        usage_id: usageId,
        vehicle_id: vehicle.id,
        driver_id: profile.id,
        description: 'Incidencia sintética para pruebas de paginación.',
      });
      await db.from('evidences').insert({
        id: evidenceId,
        owner_id: profile.id,
        shift_id: shiftId,
        kind: 'photo',
        path,
        entity_type: 'incident',
        entity_id: incidentId,
      });
    }
  }
}
console.log('Volumen sintético listo: 30 campos, conductores, vehículos y turnos históricos.');
