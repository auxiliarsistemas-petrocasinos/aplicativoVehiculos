import { pageData } from '@/lib/page-data';
import { listVehicles } from '@/lib/supabase/queries';
import { serverClient } from '@/lib/supabase/server';
import { Shell } from '@/components/shell';
import { VehiclesPanel } from '@/components/admin-panels';
import { Pagination } from '@/components/pagination';
export default async function Vehicles({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; field?: string; status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const data = await pageData(() => listVehicles(params));
  const db = await serverClient();
  const { data: documents, error } = await db
    .from('vehicle_documents')
    .select('id,vehicle_id,name,expires_on,required')
    .order('id')
    .limit(200);
  if (error) throw new Error('Error consultando documentos');
  return (
    <Shell profile={data.profile}>
      <VehiclesPanel data={data} documents={documents ?? []} />
      <Pagination nextCursor={data.nextCursor} params={params} />
    </Shell>
  );
}
