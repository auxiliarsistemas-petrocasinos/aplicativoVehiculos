import { pageData } from '@/lib/page-data';
import { listIncidents } from '@/lib/supabase/queries';
import { serverClient } from '@/lib/supabase/server';
import { Shell } from '@/components/shell';
import { IncidentsPanel } from '@/components/incidents-panel';
import { Pagination } from '@/components/pagination';
export default async function Incidents({
  searchParams,
}: {
  searchParams: Promise<{
    new?: string;
    cursor?: string;
    field?: string;
    status?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await pageData(() => listIncidents(params));
  const db = await serverClient();
  const results = await Promise.all([
    db
      .from('incident_actions')
      .select('id,incident_id,comment,status,created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    db.from('evidences').select('id,entity_id').eq('entity_type', 'incident').limit(200),
    db.from('operation_drafts').select('data,shift_id').eq('kind', 'incident').limit(50),
  ]);
  if (results.some((r) => r.error)) throw new Error('No fue posible consultar incidencias.');
  const shift = data.shifts.find((s) => ['active', 'closing'].includes(s.status));
  const draft = (results[2].data?.find((d) => d.shift_id === shift?.id)?.data ?? {}) as {
    description?: string;
    photos?: string[];
  };
  return (
    <Shell profile={data.profile}>
      <IncidentsPanel
        data={data}
        actions={results[0].data ?? []}
        evidences={results[1].data ?? []}
        draft={draft}
        newReport={params.new === '1'}
      />
      <Pagination nextCursor={data.nextCursor} params={params} />
    </Shell>
  );
}
