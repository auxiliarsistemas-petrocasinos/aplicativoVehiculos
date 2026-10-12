import { redirect } from 'next/navigation';
import { configured } from '@/lib/supabase/server';
import { session } from '@/features/auth/session';
import { getSnapshot } from '@/lib/supabase/queries';
export async function pageData() {
  if (!configured()) redirect('/login');
  let current;
  try {
    current = await session(true);
  } catch {
    redirect('/login');
  }
  if (current.profile.must_change_password) redirect('/change-password');
  return getSnapshot();
}
