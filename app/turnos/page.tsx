import { pageData } from '@/lib/page-data';
import { listShifts } from '@/lib/supabase/queries';
import { Shell } from '@/components/shell';
import { ShiftsPanel } from '@/components/shifts-panel';
import { Pagination } from '@/components/pagination';
export default async function Shifts({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; field?: string; status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const data = await pageData(() => listShifts(params));
  return (
    <Shell profile={data.profile}>
      <ShiftsPanel data={data} />
      <Pagination nextCursor={data.nextCursor} params={params} />
    </Shell>
  );
}
