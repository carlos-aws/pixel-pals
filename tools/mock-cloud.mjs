// Local stand-in for the cloud backend: serves the game plus an in-memory
// profile API using the same rules as the Lambda (infra/api/logic.mjs) and a
// fake sign-in. Handy for trying cloud mode (and the one-device lock) at home:
//
//   node tools/mock-cloud.mjs            # http://localhost:8090
//   PORT=9000 node tools/mock-cloud.mjs
//
// Open the address on two devices/browsers to see the "in use" behaviour.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createService, route, memoryDb } from '../infra/api/logic.mjs';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };

export function startMockCloud({ port = 0, root = process.cwd(), now = () => Date.now() } = {}) {
  const db = memoryDb();
  const service = createService(db, now);
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/config.json') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ mode: 'cloud', auth: 'mock', apiUrl: `http://localhost:${server.address().port}/api`, mockUser: 'parent@example.com' }));
      return;
    }
    if (url.pathname.startsWith('/api/')) {
      const auth = req.headers.authorization || '';
      if (!auth.startsWith('Bearer ')) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end('{"error":"unauthorized"}'); return; }
      let raw = '';
      for await (const chunk of req) raw += chunk;
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { res.writeHead(400); res.end('{"error":"bad json"}'); return; }
      const out = await route(service, { method: req.method, path: url.pathname.slice(4), sub: 'mock-user', query: Object.fromEntries(url.searchParams), body });
      res.writeHead(out.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(out.body));
      return;
    }
    let p = decodeURIComponent(url.pathname);
    if (p === '/') p = '/index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, () => resolve({ server, db, service, port: server.address().port })));
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const { port } = await startMockCloud({ port: Number(process.env.PORT || 8090) });
  console.log(`Pixel Pals mock cloud: http://localhost:${port}  (profiles are kept in memory until you stop this)`);
}
