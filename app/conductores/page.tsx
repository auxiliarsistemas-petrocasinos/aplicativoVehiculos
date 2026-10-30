import { redirect } from 'next/navigation';
import { pageData } from '@/lib/page-data';
import { listDrivers } from '@/lib/supabase/queries';
import { Shell } from '@/components/shell';
import { AccountsPanel } from '@/components/accounts-panel';
import { Pagination } from '@/components/pagination';
export default async function Accounts({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; field?: string; status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const data = await pageData(() => listDrivers(params));
  if (data.profile.role === 'driver') redirect('/');
  return (
    <Shell profile={data.profile}>
      <AccountsPanel data={data} />
      <Pagination nextCursor={data.nextCursor} params={params} />
    </Shell>
  );
}
