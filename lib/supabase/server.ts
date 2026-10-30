import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';
export function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export async function serverClient() {
  if (!configured()) throw new Error('Configura Supabase para usar el aplicativo.');
  const jar = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, {
                ...options,
                sameSite: options?.sameSite ?? 'lax',
                secure: Boolean(options?.secure || process.env.NODE_ENV === 'production'),
              }),
            );
          } catch {
            /* Componentes de servidor: la renovación se realiza en proxy. */
          }
        },
      },
    },
  );
}
