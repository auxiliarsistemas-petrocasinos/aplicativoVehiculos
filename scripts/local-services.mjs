// Entorno de integración alternativo a Supabase CLI en hosts con Docker VFS y poco disco.
// Usa servicios upstream reales, sin simular Auth, consultas ni Storage. SOLO localhost.
import { execFileSync } from 'node:child_process';
import { randomBytes, createHmac } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(new URL('..', import.meta.url).pathname);
const local = resolve(root, '.local');
const docker = (args) =>
  execFileSync('docker', ['--host=unix:///var/run/docker.sock', ...args], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
await mkdir(local, { recursive: true, mode: 0o700 });
const jwtSecret = randomBytes(40).toString('hex');
const jwt = (role) => {
  const enc = (x) => Buffer.from(JSON.stringify(x)).toString('base64url');
  const text =
    enc({ alg: 'HS256', typ: 'JWT' }) +
    '.' +
    enc({
      role,
      iss: 'supabase-local',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 30,
    });
  return text + '.' + createHmac('sha256', jwtSecret).update(text).digest('base64url');
};
const anon = jwt('anon'),
  service = jwt('service_role');
const settings = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: anon,
  SUPABASE_SECRET_KEY: service,
  AUTH_RATE_LIMIT_SECRET: randomBytes(32).toString('hex'),
  DEMO_PASSWORD: 'Demo-' + randomBytes(18).toString('hex'),
  TEST_PASSWORD: 'Prueba-' + randomBytes(18).toString('hex'),
};
try {
  await readFile(resolve(root, '.env.local'));
  throw new Error(
    'Ya existe .env.local; conserva su configuración. El arranque inicial no sobrescribe secretos.',
  );
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
await writeFile(
  resolve(root, '.env.local'),
  Object.entries(settings)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n',
  { mode: 0o600 },
);
try {
  docker(['network', 'create', 'vehicles-local']);
} catch {}
console.log('Iniciando PostgreSQL 17 local…');
docker([
  'run',
  '-d',
  '--name',
  'vehicles-db',
  '--network',
  'vehicles-local',
  '-p',
  '127.0.0.1:54322:5432',
  '-e',
  'POSTGRES_PASSWORD=local-test-only',
  'postgres:17-alpine',
]);
let ready = false;
for (let n = 0; n < 60; n++) {
  try {
    docker(['exec', 'vehicles-db', 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres']);
    ready = true;
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
  }
}
if (!ready) throw new Error('PostgreSQL local no inició. Revisa sus logs.');
execFileSync(
  'docker',
  [
    '--host=unix:///var/run/docker.sock',
    'exec',
    '-i',
    'vehicles-db',
    'psql',
    '-U',
    'postgres',
    '-v',
    'ON_ERROR_STOP=1',
  ],
  {
    input: await readFile(resolve(root, 'scripts/local/init.sql')),
    stdio: ['pipe', 'pipe', 'pipe'],
  },
);
async function serviceContainer(name, image, port, env) {
  const path = resolve(local, name + '.env');
  await writeFile(
    path,
    Object.entries(env)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') + '\n',
    { mode: 0o600 },
  );
  docker([
    'run',
    '-d',
    '--name',
    name,
    '--network',
    'vehicles-local',
    '-p',
    `127.0.0.1:${port}`,
    '--env-file',
    path,
    image,
  ]);
}
await serviceContainer('vehicles-auth', 'supabase/gotrue:v2.186.0', '54331:9999', {
  GOTRUE_API_HOST: '0.0.0.0',
  GOTRUE_API_PORT: 9999,
  API_EXTERNAL_URL: 'http://127.0.0.1:54321',
  GOTRUE_DB_DRIVER: 'postgres',
  GOTRUE_DB_DATABASE_URL:
    'postgres://supabase_auth_admin:local-test-only@vehicles-db:5432/postgres',
  GOTRUE_SITE_URL: 'http://127.0.0.1:3000',
  GOTRUE_URI_ALLOW_LIST: 'http://127.0.0.1:3000',
  GOTRUE_DISABLE_SIGNUP: true,
  GOTRUE_JWT_SECRET: jwtSecret,
  GOTRUE_JWT_EXP: 3600,
  GOTRUE_JWT_AUD: 'authenticated',
  GOTRUE_JWT_ADMIN_ROLES: 'service_role',
  GOTRUE_JWT_DEFAULT_GROUP_NAME: 'authenticated',
  GOTRUE_EXTERNAL_EMAIL_ENABLED: true,
  GOTRUE_MAILER_AUTOCONFIRM: true,
  GOTRUE_PASSWORD_MIN_LENGTH: 12,
});
await serviceContainer('vehicles-rest', 'postgrest/postgrest:v14.3', '54332:3000', {
  PGRST_DB_URI: 'postgres://authenticator:local-test-only@vehicles-db:5432/postgres',
  PGRST_DB_SCHEMAS: 'public',
  PGRST_DB_ANON_ROLE: 'anon',
  PGRST_JWT_SECRET: jwtSecret,
  PGRST_DB_EXTRA_SEARCH_PATH: 'public,extensions',
  PGRST_DB_MAX_ROWS: 1000,
});
await serviceContainer('vehicles-storage', 'supabase/storage-api:v1.35.3', '54333:5000', {
  ANON_KEY: anon,
  SERVICE_KEY: service,
  POSTGREST_URL: 'http://vehicles-rest:3000',
  PGRST_JWT_SECRET: jwtSecret,
  AUTH_JWT_SECRET: jwtSecret,
  DATABASE_URL: 'postgres://supabase_storage_admin:local-test-only@vehicles-db:5432/postgres',
  FILE_SIZE_LIMIT: 8388608,
  STORAGE_BACKEND: 'file',
  FILE_STORAGE_BACKEND_PATH: '/var/lib/storage',
  TENANT_ID: 'local-test',
  REGION: 'local',
  GLOBAL_S3_BUCKET: 'local-test',
  ENABLE_IMAGE_TRANSFORMATION: false,
});
for (const [name, address] of [
  ['Auth', 'http://127.0.0.1:54331/health'],
  ['Storage', 'http://127.0.0.1:54333/status'],
]) {
  let healthy = false;
  for (let attempt = 0; attempt < 45; attempt++) {
    try {
      if ((await fetch(address)).ok) {
        healthy = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!healthy) throw new Error(`${name} no inició. Revisa los logs de su contenedor.`);
}
console.log(
  'Servicios locales listos. Inicia node scripts/local/gateway.mjs y aplica migraciones con node scripts/local-migrate.mjs. Secretos aleatorios guardados en .env.local; no impresos.',
);
