import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
const root = process.cwd();
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  const type = f.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8';
  res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/tools/icon.html`);
await page.waitForFunction(() => window.__icons);
const icons = await page.evaluate(() => window.__icons);
const out = (name, data) => fs.writeFileSync(path.join(root, 'assets/icons', name), Buffer.from(data.split(',')[1], 'base64'));
out('icon-192.png', icons.i192); out('icon-512.png', icons.i512); out('icon-maskable-512.png', icons.m512);
await browser.close(); server.close();
console.log('icons written');
