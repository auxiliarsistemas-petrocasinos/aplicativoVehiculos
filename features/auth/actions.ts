'use server';
import { createHmac, randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminClient } from '@/lib/supabase/admin';
import { serverClient } from '@/lib/supabase/server';
import { canAssignRole, canManageAccounts, canResetPassword } from './authorization';
import { session } from './session';
import { normalizeAlias, isValidAlias, suggestAlias } from './alias';
export async function login(form: FormData) {
  const alias = normalizeAlias(String(form.get('alias') ?? ''));
  const password = String(form.get('password') ?? '');
  const generic = 'No fue posible iniciar sesión. Verifica tus datos o contacta al administrador.';
  if (!isValidAlias(alias) || !password || password.length > 256) return { error: generic };
  try {
    if (!process.env.AUTH_RATE_LIMIT_SECRET)
      return { error: 'El acceso aún requiere configuración del servidor.' };
    const key = createHmac('sha256', process.env.AUTH_RATE_LIMIT_SECRET)
      .update(alias)
      .digest('hex');
    const admin = adminClient();
    const { data: email, error } = await admin.rpc('resolve_login', {
      alias_input: alias,
      limit_key: key,
    });
    const db = await serverClient();
    // Se realiza una verificación Auth también para alias inexistentes; nunca se devuelve correo/directorio.
    const response = await db.auth.signInWithPassword({
      email: !error && email ? email : `${randomUUID()}@invalid.example`,
      password,
    });
    if (response.error || !email) return { error: generic };
  } catch {
    return { error: 'El servicio de acceso no está disponible. Intenta nuevamente.' };
  }
  redirect('/');
}
export async function changePassword(form: FormData) {
  const password = String(form.get('password') ?? '');
  if (!z.string().min(12).max(128).safeParse(password).success)
    return { error: 'Usa una contraseña de 12 a 128 caracteres.' };
  if (password !== form.get('confirm')) return { error: 'Las contraseñas no coinciden.' };
  try {
    const { db } = await session(true);
    const { error } = await db.auth.updateUser({ password });
    if (error)
      return { error: 'No se pudo cambiar la contraseña. Usa una distinta de la temporal.' };
    const { error: refreshError } = await db.auth.refreshSession();
    if (refreshError) return { error: 'Contraseña cambiada. Inicia sesión nuevamente.' };
  } catch {
    return { error: 'No fue posible cambiar la contraseña.' };
  }
  redirect('/');
}
export async function logout() {
  const db = await serverClient();
  await db.auth.signOut();
  redirect('/login');
}
const accountSchema = z.object({
  first_name: z.string().min(1),
  first_surname: z.string().min(1),
  second_surname: z.string(),
  alias: z.string().refine(isValidAlias),
  email: z.email(),
  phone: z.string().min(1),
  field_id: z.string(),
  role: z.enum(['driver', 'fleet_admin', 'management', 'it_superadmin']),
  password: z.string().min(12).max(128),
});
export async function suggestAccountAlias(
  firstName: string,
  firstSurname: string,
  secondSurname: string,
) {
  try {
    const { profile, db } = await session();
    if (!canManageAccounts(profile.role)) return { alias: null, reason: 'Acceso no autorizado.' };
    const parts = z
      .array(z.string().max(128))
      .length(3)
      .parse([firstName, firstSurname, secondSurname]);
    const base = suggestAlias(parts[0], parts[1], parts[2], []);
    if (!base.alias) return base;
    const candidate = base.alias + '.' + normalizeAlias(parts[2])[0];
    const { data, error } = await db
      .from('profiles')
      .select('alias')
      .in('alias', [base.alias, candidate]);
    if (error) throw error;
    return suggestAlias(
      parts[0],
      parts[1],
      parts[2],
      data.map((p) => p.alias),
    );
  } catch {
    return { alias: null, reason: 'No fue posible comprobar el alias. Intenta nuevamente.' };
  }
}
export async function createAccount(input: unknown) {
  try {
    const { profile } = await session();
    const data = accountSchema.parse(input);
    if (!canAssignRole(profile.role, data.role))
      return { error: 'No tienes permiso para asignar ese rol.' };
    const admin = adminClient();
    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user)
      return { error: 'No fue posible crear la cuenta. Revisa correo y datos.' };
    const { error: provisionError } = await admin.rpc('provision_profile', {
      actor_id: profile.id,
      user_id: created.user.id,
      data: {
        ...data,
        password: undefined,
        full_name: [data.first_name, data.first_surname, data.second_surname]
          .filter(Boolean)
          .join(' '),
      },
    });
    if (provisionError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return { error: 'No fue posible registrar el perfil. Revisa alias único y campo.' };
    }
    revalidatePath('/conductores');
    return { ok: true };
  } catch {
    return { error: 'Revisa los datos y la configuración de cuentas.' };
  }
}
export async function resetPassword(id: string, password: string) {
  try {
    if (password.length < 12 || password.length > 128)
      return { error: 'Usa una contraseña temporal de 12 a 128 caracteres.' };
    const { profile, db } = await session();
    if (!canManageAccounts(profile.role)) return { error: 'Acceso no autorizado.' };
    const { data: target } = await db.from('profiles').select('role').eq('id', id).single();
    if (!target || !canResetPassword(profile.role, target.role, profile.id === id))
      return { error: 'Restablecimiento no autorizado.' };
    const admin = adminClient();
    const { error: guard } = await admin.rpc('reset_password_guard', {
      actor_id: profile.id,
      target_id: id,
      phase: 'begin',
    });
    if (guard) return { error: 'Restablecimiento no autorizado.' };
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error)
      return {
        error: 'No se actualizó la clave; cuenta retenida. IT debe reintentar el restablecimiento.',
      };
    const { error: finish } = await admin.rpc('reset_password_guard', {
      actor_id: profile.id,
      target_id: id,
      phase: 'finish',
    });
    if (finish)
      return { error: 'Clave actualizada; cuenta retenida hasta completar el restablecimiento.' };
    return { ok: true };
  } catch {
    return { error: 'No fue posible completar el restablecimiento.' };
  }
}
