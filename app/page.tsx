import { pageData } from '@/lib/page-data';
import { Shell } from '@/components/shell';
import { Dashboard } from '@/components/dashboard';
export default async function Home() {
  const data = await pageData();
  return (
    <Shell profile={data.profile}>
      <Dashboard data={data} />
    </Shell>
  );
}
