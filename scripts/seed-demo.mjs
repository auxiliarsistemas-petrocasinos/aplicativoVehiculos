import { createClient } from '@supabase/supabase-js';
const {
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SECRET_KEY: key,
  DEMO_PASSWORD: password,
} = process.env;
if (!url || !key || !password || password.length < 12)
  throw new Error(
    'Configura Supabase y DEMO_PASSWORD (mínimo 12 caracteres), sin versionar valores.',
  );
if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname))
  throw new Error('Este seed solo se ejecuta en Supabase local.');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const accounts = [
  ['demo.conductor', 'Conductor Ficticio Uno', 'driver', '20000000-0000-4000-8000-000000000001'],
  ['demo.conductor.s', 'Conductor Ficticio Dos', 'driver', '20000000-0000-4000-8000-000000000001'],
  [
    'demo.horizonte',
    'Conductor Ficticio Horizonte',
    'driver',
    '20000000-0000-4000-8000-000000000002',
  ],
  ['demo.administrador', 'Administrador Ficticio', 'fleet_admin', null],
  ['demo.gerencia', 'Gerencia Ficticia', 'management', null],
  ['demo.sistemas', 'IT Ficticio', 'it_superadmin', null],
];
for (const [alias, full_name, role, field_id] of accounts) {
  const { data: existing } = await db
    .from('profiles')
    .select('id')
    .eq('alias', alias)
    .maybeSingle();
  if (existing) continue;
  const email = alias + '@example.invalid';
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error('Fallo creando cuenta ficticia.');
  const { error: insertError } = await db.from('profiles').insert({
    id: data.user.id,
    alias,
    full_name,
    role,
    field_id,
    email,
    phone: '0000000000',
    must_change_password: true,
  });
  if (insertError) throw new Error('Fallo creando perfil ficticio.');
  console.log('Cuenta ficticia creada: ' + alias);
}
console.log('Todos los usuarios deben cambiar la contraseña al primer acceso.');
