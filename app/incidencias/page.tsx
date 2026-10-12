import { pageData } from '@/lib/page-data';
import { serverClient } from '@/lib/supabase/server';
import { Shell } from '@/components/shell';
import { IncidentsPanel } from '@/components/incidents-panel';
export default async function Incidents({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const data = await pageData();
  const db = await serverClient();
  const results = await Promise.all([
    db.from('incident_actions').select('*'),
    db.from('evidences').select('id,entity_id').eq('entity_type', 'incident'),
    db.from('operation_drafts').select('data,shift_id').eq('kind', 'incident'),
  ]);
  if (results.some((r) => r.error)) throw new Error('No fue posible consultar incidencias.');
  const shift = data.shifts.find((s) => ['active', 'closing'].includes(s.status));
  const draft = results[2].data?.find((d) => d.shift_id === shift?.id)?.data ?? {};
  return (
    <Shell profile={data.profile}>
      <IncidentsPanel
        data={data}
        actions={results[0].data ?? []}
        evidences={results[1].data ?? []}
        draft={draft}
        newReport={(await searchParams).new === '1'}
      />
    </Shell>
  );
}
