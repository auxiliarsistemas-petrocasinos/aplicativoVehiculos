import { createClient } from '@supabase/supabase-js';
const {
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SECRET_KEY: key,
  BOOTSTRAP_EMAIL: email,
  BOOTSTRAP_PASSWORD: password,
  BOOTSTRAP_ALIAS: alias,
} = process.env;
if (!url || !key || !email || !password || !alias)
  throw new Error('Configura las variables BOOTSTRAP_* y Supabase en el entorno privado.');
if (password.length < 12 || !/^[a-z]+\.[a-z]+(?:\.[a-z]+)?$/.test(alias))
  throw new Error('Revisa alias y longitud de contraseña.');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { count, error: check } = await db
  .from('profiles')
  .select('id', { count: 'exact', head: true })
  .eq('role', 'it_superadmin');
if (check || count !== 0)
  throw new Error(
    'Bootstrap permitido únicamente sin cuentas IT existentes y con migraciones aplicadas.',
  );
const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
if (error) throw new Error('No fue posible crear la cuenta inicial.');
const { error: profileError } = await db.from('profiles').insert({
  id: data.user.id,
  alias,
  full_name: 'Administrador técnico inicial',
  email,
  role: 'it_superadmin',
  must_change_password: true,
});
if (profileError) {
  await db.auth.admin.deleteUser(data.user.id);
  throw new Error('No fue posible crear el perfil inicial.');
}
await db
  .from('audit_events')
  .insert({ actor_id: data.user.id, action: 'it_bootstrap', entity_id: data.user.id });
console.log(
  'Cuenta inicial creada. Cambia su contraseña temporal al ingresar. No se han mostrado credenciales.',
);
