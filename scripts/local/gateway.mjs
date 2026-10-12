// Proxy HTTP solo para pruebas locales: los permisos se aplican en Auth/PostgREST/Storage.
import http from 'node:http';
http
  .createServer((req, res) => {
    const mapping = [
      ['/auth/v1', 54331],
      ['/rest/v1', 54332],
      ['/storage/v1', 54333],
    ].find(([prefix]) => req.url.startsWith(prefix));
    if (!mapping) {
      res.writeHead(404);
      res.end();
      return;
    }
    const [prefix, port] = mapping;
    const origin = req.headers.origin;
    const cors = ['http://127.0.0.1:3000', 'http://localhost:3000'].includes(origin)
      ? {
          'access-control-allow-origin': origin,
          'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
          'access-control-allow-headers':
            'authorization,apikey,content-type,x-client-info,x-upsert,x-supabase-api-version,cache-control',
          vary: 'Origin',
        }
      : {};
    if (req.method === 'OPTIONS') {
      res.writeHead(cors['access-control-allow-origin'] ? 204 : 403, cors);
      res.end();
      return;
    }
    const upstream = http.request(
      {
        host: '127.0.0.1',
        port,
        path: req.url.slice(prefix.length) || '/',
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${port}` },
      },
      (response) => {
        res.writeHead(response.statusCode ?? 502, { ...response.headers, ...cors });
        response.pipe(res);
      },
    );
    upstream.on('error', () => {
      res.writeHead(502);
      res.end('Servicio local no disponible');
    });
    req.pipe(upstream);
  })
  .listen(Number(process.env.TEST_GATEWAY_PORT || 54321), '127.0.0.1', () =>
    console.log('Gateway local de pruebas listo.'),
  );
