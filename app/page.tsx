import { pageData } from '@/lib/page-data';
import { getDashboardData } from '@/lib/supabase/queries';
import { Shell } from '@/components/shell';
import { Dashboard } from '@/components/dashboard';
export default async function Home() {
  const data = await pageData(getDashboardData);
  return (
    <Shell profile={data.profile}>
      <Dashboard data={data} />
    </Shell>
  );
}
