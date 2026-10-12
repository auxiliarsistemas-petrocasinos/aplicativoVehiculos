import 'server-only';
import { createClient } from '@supabase/supabase-js';
export function adminClient() {
  if (!process.env.SUPABASE_SECRET_KEY)
    throw new Error('Administración de cuentas sin configurar.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
