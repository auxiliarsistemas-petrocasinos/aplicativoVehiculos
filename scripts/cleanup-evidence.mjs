// Limpieza técnica explícita de archivos huérfanos. Nunca borra evidencia asociada.
import { createClient } from '@supabase/supabase-js';
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SECRET_KEY: key } = process.env;
if (!url || !key) throw new Error('Falta configuración privada.');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const apply = process.argv.includes('--apply');
const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const { data: staged, error } = await db
  .from('evidences')
  .select('id,path,shift_id')
  .is('entity_id', null)
  .lt('created_at', cutoff);
if (error) throw new Error('No se pudo consultar evidencia.');
// Solo turnos finalizados; no destruir fotos de borradores reanudables.
for (const evidence of staged ?? []) {
  const { data: shift } = await db
    .from('shifts')
    .select('status')
    .eq('id', evidence.shift_id)
    .single();
  if (!shift || !['closed', 'regularized'].includes(shift.status)) continue;
  console.log(`${apply ? 'Limpiando' : 'Candidato'}: ${evidence.id}`);
  if (apply) {
    const { error: removed } = await db.storage.from('evidence').remove([evidence.path]);
    if (removed) throw new Error('Fallo limpiando objeto; se conserva el metadato.');
    const { error: deleted } = await db
      .from('evidences')
      .delete()
      .eq('id', evidence.id)
      .is('entity_id', null);
    if (deleted) throw new Error('Fallo limpiando metadato.');
    await db
      .from('audit_events')
      .insert({ action: 'orphan_evidence_cleanup', entity_id: evidence.id });
  }
}
console.log(
  'Finalizado. Los objetos sin metadatos requieren reconciliación de Storage; no se borran automáticamente.',
);
