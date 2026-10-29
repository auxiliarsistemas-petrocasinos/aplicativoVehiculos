// Reconciliación idempotente. Simulación por defecto; --apply realiza cambios.
import { createClient } from '@supabase/supabase-js';

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SECRET_KEY: key } = process.env;
if (!url || !key) throw new Error('Falta configuración privada.');
const localHosts = new Set(['127.0.0.1', 'localhost', '::1']);
if (!localHosts.has(new URL(url).hostname) && !process.argv.includes('--allow-remote'))
  throw new Error('Destino remoto bloqueado. Requiere --allow-remote y autorización operativa.');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const apply = process.argv.includes('--apply');
const now = new Date();
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

async function listFolder(path = '') {
  const objects = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.storage
      .from('evidence')
      .list(path, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw new Error('No se pudo inventariar Storage.');
    for (const item of data ?? []) {
      const itemPath = path ? `${path}/${item.name}` : item.name;
      if (item.id) objects.push({ ...item, path: itemPath });
      else objects.push(...(await listFolder(itemPath)));
    }
    if (!data || data.length < 1000) break;
  }
  return objects;
}

async function listRows(table, columns) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .order('created_at')
      .order('id')
      .range(offset, offset + 999);
    if (error) throw new Error('No se pudo consultar metadatos de evidencia.');
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

const [intents, evidences, objects] = await Promise.all([
  listRows('evidence_upload_intents', 'id,path,status,expires_at,created_at'),
  listRows('evidences', 'id,path,created_at'),
  listFolder(),
]);

const objectPaths = new Set(objects.map((object) => object.path));
const knownPaths = new Set([
  ...intents.map((intent) => intent.path),
  ...evidences.map((evidence) => evidence.path),
]);
const expired = intents.filter(
  (intent) => intent.status === 'pending' && new Date(intent.expires_at) <= now,
);
const untracked = objects.filter(
  (object) =>
    !knownPaths.has(object.path) && object.created_at && new Date(object.created_at) <= twoHoursAgo,
);
const missing = evidences.filter((evidence) => !objectPaths.has(evidence.path));

console.log(
  JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    expiredIntents: expired.length,
    untrackedObjects: untracked.length,
    missingObjects: missing.length,
  }),
);

if (apply) {
  for (const intent of expired) {
    const { data: claimed, error: claimError } = await db
      .from('evidence_upload_intents')
      .update({ status: 'expired' })
      .eq('id', intent.id)
      .eq('status', 'pending')
      .lte('expires_at', now.toISOString())
      .select('id,path')
      .maybeSingle();
    if (claimError) throw new Error('Fallo reclamando intención vencida.');
    if (!claimed) continue;
    if (objectPaths.has(claimed.path)) {
      const { error } = await db.storage.from('evidence').remove([claimed.path]);
      if (error) throw new Error('Fallo borrando objeto vencido ya reclamado.');
    }
    await db
      .from('audit_events')
      .insert({ action: 'expired_upload_cleanup', entity_id: intent.id });
  }
  for (const object of untracked) {
    const [{ data: intent }, { data: evidence }] = await Promise.all([
      db.from('evidence_upload_intents').select('id').eq('path', object.path).maybeSingle(),
      db.from('evidences').select('id').eq('path', object.path).maybeSingle(),
    ]);
    if (intent || evidence) continue;
    const { error } = await db.storage.from('evidence').remove([object.path]);
    if (error) throw new Error('Fallo borrando objeto sin asociación.');
    await db
      .from('audit_events')
      .insert({ action: 'untracked_object_cleanup', detail: { path_hash_only: true } });
  }
  for (const evidence of missing) {
    await db
      .from('audit_events')
      .insert({ action: 'evidence_object_missing', entity_id: evidence.id });
  }
}
