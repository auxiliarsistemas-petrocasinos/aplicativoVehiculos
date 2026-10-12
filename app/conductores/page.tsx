import { redirect } from 'next/navigation';
import { pageData } from '@/lib/page-data';
import { Shell } from '@/components/shell';
import { AccountsPanel } from '@/components/accounts-panel';
export default async function Accounts() {
  const data = await pageData();
  if (data.profile.role === 'driver') redirect('/');
  return (
    <Shell profile={data.profile}>
      <AccountsPanel data={data} />
    </Shell>
  );
}
