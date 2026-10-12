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
    const upstream = http.request(
      {
        host: '127.0.0.1',
        port,
        path: req.url.slice(prefix.length) || '/',
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${port}` },
      },
      (response) => {
        res.writeHead(response.statusCode ?? 502, response.headers);
        response.pipe(res);
      },
    );
    upstream.on('error', () => {
      res.writeHead(502);
      res.end('Servicio local no disponible');
    });
    req.pipe(upstream);
  })
  .listen(54321, '127.0.0.1', () => console.log('Gateway de pruebas en 127.0.0.1:54321'));
