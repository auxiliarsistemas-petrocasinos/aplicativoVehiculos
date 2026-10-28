import { createServer } from 'node:http';
import next from 'next';

const hostname = '127.0.0.1';
const port = 3000;
const app = next({ dev: true, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

createServer((request, response) => handle(request, response)).listen(port, hostname, () => {
  console.log(`Servidor E2E disponible en http://${hostname}:${port}`);
});
