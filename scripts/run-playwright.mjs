import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const baseUrl = 'http://127.0.0.1:3000';
const cli = resolve('node_modules/@playwright/test/cli.js');
let server;
let ownsServer = false;

async function available() {
  try {
    const response = await fetch(`${baseUrl}/login`, { signal: AbortSignal.timeout(2000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (await available()) return;
    if (server?.exitCode !== null) throw new Error('El servidor E2E terminó antes de estar listo.');
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }
  throw new Error('El servidor E2E no estuvo disponible en 120 segundos.');
}

function stopServer() {
  if (!ownsServer || !server?.pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      server.kill('SIGTERM');
    }
  }
}

async function main() {
  if (!(await available())) {
    ownsServer = true;
    server = spawn(process.execPath, ['scripts/test-server.mjs'], {
      detached: process.platform !== 'win32',
      env: process.env,
      stdio: 'inherit',
    });
    await waitForServer();
  }

  const tests = spawn(process.execPath, [cli, 'test', ...process.argv.slice(2)], {
    env: process.env,
    stdio: 'inherit',
  });
  const exitCode = await new Promise((resolveExit) => tests.once('exit', resolveExit));
  process.exitCode = exitCode ?? 1;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    stopServer();
    process.exit(1);
  });
}

try {
  await main();
} finally {
  stopServer();
}
