import { pageData } from '@/lib/page-data';
import { getFieldsData } from '@/lib/supabase/queries';
import { Shell } from '@/components/shell';
import { FieldsPanel } from '@/components/admin-panels';
export default async function Fields() {
  const data = await pageData(getFieldsData);
  return (
    <Shell profile={data.profile}>
      <FieldsPanel data={data} />
    </Shell>
  );
}
