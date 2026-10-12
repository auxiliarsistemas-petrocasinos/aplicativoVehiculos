import { pageData } from '@/lib/page-data';
import { serverClient } from '@/lib/supabase/server';
import { Shell } from '@/components/shell';
import { VehiclesPanel } from '@/components/admin-panels';
export default async function Vehicles() {
  const data = await pageData();
  const db = await serverClient();
  const { data: documents, error } = await db.from('vehicle_documents').select('*');
  if (error) throw new Error('Error consultando documentos');
  return (
    <Shell profile={data.profile}>
      <VehiclesPanel data={data} documents={documents ?? []} />
    </Shell>
  );
}
