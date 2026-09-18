// Verifies the local-mode backup round trip: export a save file on one
// "device" and import it on another (fresh browser context).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from './pw.mjs';
const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(root, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch();
const mk = async () => { const ctx = await browser.newContext({ viewport: { width: 412, height: 860 }, hasTouch: true, isMobile: true, acceptDownloads: true }); const page = await ctx.newPage(); page.on('pageerror', (e) => { console.log('[pageerror]', e.message); process.exitCode = 1; }); return page; };
const tap = (page, text) => page.locator(`button:has-text("${text}")`).first().tap();
async function parents(page) {
  await tap(page, 'Parents'); await page.waitForSelector('.title.big');
  const [a, b] = (await page.locator('.title.big').textContent()).match(/\d+/g).map(Number);
  await tap(page, String(a * b)); await page.waitForSelector('button:has-text("Export save file")');
}

// Device 1: create a player with some progress, then export.
const A = await mk();
await A.goto(base + '/'); await tap(A, 'New player');
await A.fill('input[placeholder="Your name"]', 'Ana'); await A.locator('.egg-pick button').nth(1).tap(); await tap(A, 'Start!');
await A.waitForSelector('button:has-text("Feed")');
await A.evaluate(() => { const p = window.__pixelpals.profile; p.coins = 123; p.pet.stars = 9; p.settings.dailyGoal = 4; window.__pixelpals.saveNow(); });
await parents(A);
const [download] = await Promise.all([A.waitForEvent('download'), tap(A, 'Export save file')]);
const file = path.join('tools/out', download.suggestedFilename());
await download.saveAs(file);
const json = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log('exported', download.suggestedFilename(), 'players:', json.profiles.map((p) => `${p.name}/${p.pet.name} coins=${p.coins} stars=${p.pet.stars} goal=${p.settings.dailyGoal}`));

// Device 2: fresh browser, import the file.
const B = await mk();
await B.goto(base + '/'); await tap(B, 'New player');
await B.fill('input[placeholder="Your name"]', 'Temp'); await tap(B, 'Start!');
await B.waitForSelector('button:has-text("Feed")');
await parents(B);
await B.locator('input[type=file]').setInputFiles(file);
await B.waitForSelector('button:has-text("Restore")'); await tap(B, 'Restore');
await B.waitForSelector('.card');
const names = await B.locator('.card').allTextContents();
console.log('device 2 players after import:', names.map((t) => t.replace(/\s+/g, ' ').trim()));
await B.locator('.card').first().tap(); await B.waitForSelector('button:has-text("Feed")');
const restored = await B.evaluate(() => { const p = window.__pixelpals.profile; return { name: p.name, coins: p.coins, stars: p.pet.stars, goal: p.settings.dailyGoal, species: p.pet.species }; });
console.log('restored profile:', JSON.stringify(restored));
await browser.close(); server.close();
if (restored.name !== 'Ana' || restored.coins !== 123 || restored.stars !== 9 || restored.goal !== 4 || restored.species !== 'pip') { console.log('MISMATCH'); process.exit(1); }
console.log('backup e2e ok');
