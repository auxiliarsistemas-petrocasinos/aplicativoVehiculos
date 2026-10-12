import { pageData } from '@/lib/page-data';
import { Shell } from '@/components/shell';
import { ShiftsPanel } from '@/components/shifts-panel';
export default async function Shifts() {
  const data = await pageData();
  return (
    <Shell profile={data.profile}>
      <ShiftsPanel data={data} />
    </Shell>
  );
}
