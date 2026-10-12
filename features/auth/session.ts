import 'server-only';
import { serverClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';
export async function session(allowPasswordChange = false) {
  const db = await serverClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new Error('Inicia sesión para continuar.');
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (profileError || !profile || !profile.active || profile.reset_in_progress)
    throw new Error('Cuenta no disponible. Contacta al administrador.');
  const { data: claims } = await db.auth.getClaims();
  if (!claims || Number(claims.claims.iat) <= Number(profile.invalid_before))
    throw new Error('Inicia sesión nuevamente después del restablecimiento.');
  if (!allowPasswordChange && profile.must_change_password)
    throw new Error('Debes cambiar tu contraseña temporal.');
  return { db, user, profile: profile as Profile };
}
