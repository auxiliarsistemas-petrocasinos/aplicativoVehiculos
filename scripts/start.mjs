import { cpSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

if (!existsSync('.next/standalone/server.js'))
  throw new Error('Ejecuta npm run build antes de iniciar el servidor.');
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
cpSync('.next/static', '.next/standalone/.next/static', { recursive: true });
if (existsSync('public')) cpSync('public', '.next/standalone/public', { recursive: true });
const server = spawn(process.execPath, ['.next/standalone/server.js'], {
  stdio: 'inherit',
  env: { ...process.env, HOSTNAME: process.env.APP_HOST || '0.0.0.0' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('error', () => {
  console.error('No fue posible iniciar el servidor compilado.');
  process.exitCode = 1;
});
server.on('exit', (code) => {
  process.exitCode = code ?? 0;
});
