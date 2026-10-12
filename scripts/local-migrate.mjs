import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
const args = [
  '--host=unix:///var/run/docker.sock',
  'exec',
  '-i',
  'vehicles-db',
  'psql',
  '-U',
  'postgres',
  '-v',
  'ON_ERROR_STOP=1',
];
execFileSync('docker', args, {
  input:
    "create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims',true)::jsonb->>'sub','')::uuid $$; create or replace function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claims',true)::jsonb->>'role' $$;",
  stdio: ['pipe', 'pipe', 'pipe'],
});
for (const name of (await readdir('supabase/migrations'))
  .filter((n) => n.endsWith('.sql') && (!process.env.MIGRATE_FROM || n >= process.env.MIGRATE_FROM))
  .sort()) {
  execFileSync('docker', args, {
    input: 'begin;\n' + (await readFile('supabase/migrations/' + name, 'utf8')) + '\ncommit;',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  console.log('Aplicada ' + name);
}
execFileSync('docker', args, {
  input: await readFile('supabase/seed.sql'),
  stdio: ['pipe', 'pipe', 'pipe'],
});
execFileSync('docker', args, {
  input:
    "grant select,insert,update,delete on storage.objects to authenticated; grant select on storage.buckets to authenticated; grant all on all tables in schema public to service_role; grant all on all sequences in schema public to service_role; NOTIFY pgrst, 'reload schema';",
  stdio: ['pipe', 'pipe', 'pipe'],
});
console.log('Migraciones y seed local aplicados.');
