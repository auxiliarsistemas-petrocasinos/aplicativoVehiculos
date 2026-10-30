import 'server-only';
import { serverClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';
export async function session(allowPasswordChange = false) {
  const db = await serverClient();
  const { data, error } = await db.auth.getClaims();
  const userId = data?.claims.sub;
  const issuedAt = Number(data?.claims.iat);
  if (error || typeof userId !== 'string' || !Number.isFinite(issuedAt))
    throw new Error('Inicia sesión para continuar.');
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (profileError || !profile || !profile.active || profile.reset_in_progress)
    throw new Error('Cuenta no disponible. Contacta al administrador.');
  if (issuedAt <= Number(profile.invalid_before))
    throw new Error('Inicia sesión nuevamente después del restablecimiento.');
  if (!allowPasswordChange && profile.must_change_password)
    throw new Error('Debes cambiar tu contraseña temporal.');
  return { db, profile: profile as Profile };
}
