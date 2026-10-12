import { pageData } from '@/lib/page-data';
import { Shell } from '@/components/shell';
import { FieldsPanel } from '@/components/admin-panels';
export default async function Fields() {
  const data = await pageData();
  return (
    <Shell profile={data.profile}>
      <FieldsPanel data={data} />
    </Shell>
  );
}
