// Renders the home scene for many combinations (species × stage, backgrounds,
// night) into tools/out/gallery-*.png so the pixel art can be eyeballed.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(root, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch();
const [vw, vh] = (process.argv[2] || '412x860').split('x').map(Number);
const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text()); });

async function setup(mod) {
  await page.goto(base + '/tools/emoji.html');
  await page.evaluate((mod) => {
    const now = Date.now();
    const mk = (id, species, stage, hat, bg, extra = {}) => ({ id, name: 'Test', createdAt: now, coins: 999, streak: 3, lastActiveDate: null,
      settings: { dailyGoal: 6, sound: false, music: false, speech: false, autoLevel: true, level: { math: 1, english: 1, science: 1 } },
      skills: { math: { level: 1, streak: 0, misses: 0, right: 0, answered: 0 }, english: { level: 1, streak: 0, misses: 0, right: 0, answered: 0 }, science: { level: 1, streak: 0, misses: 0, right: 0, answered: 0 } },
      pet: { species, name: 'Pet', stage, stars: 0, bornAt: now, stageStartedAt: now, lastTick: now, sleeping: false, stats: { food: 80, fun: 80, brain: 80, clean: 80, energy: 80 }, care: {}, ...extra },
      inventory: { hats: Object.keys({}), backgrounds: ['meadow', 'bedroom', 'beach', 'forest', 'space'] }, equipped: { hat, background: bg }, album: [], badges: [], missed: [], seenFacts: [], today: null, totals: { activities: 0, stars: 0, correct: 0, answered: 0 }, lastGiftDate: new Date().toISOString().slice(0, 10) });
    const p = mk('p1', mod.species, mod.stage, mod.hat, mod.bg, mod.extra || {});
    localStorage.setItem('pixelpals.v1', JSON.stringify({ version: 1, profiles: [p], lastProfileId: 'p1' }));
  }, mod);
}
const shots = [
  { name: 'mochi-1-meadow', species: 'mochi', stage: 1, hat: null, bg: 'meadow' },
  { name: 'mochi-3-bedroom-bow', species: 'mochi', stage: 3, hat: 'bow', bg: 'bedroom' },
  { name: 'mochi-5-space-halo', species: 'mochi', stage: 5, hat: 'halo', bg: 'space' },
  { name: 'pip-2-beach', species: 'pip', stage: 2, hat: 'cap', bg: 'beach' },
  { name: 'pip-4-forest-crown', species: 'pip', stage: 4, hat: 'crown', bg: 'forest' },
  { name: 'rex-3-meadow-night', species: 'rex', stage: 3, hat: 'wizard', bg: 'meadow', time: '22:00' },
  { name: 'rex-4-bedroom-night-dirty', species: 'rex', stage: 4, hat: 'party', bg: 'bedroom', time: '21:30', extra: { stats: { food: 20, fun: 50, brain: 70, clean: 20, energy: 60 } } },
  { name: 'rex-2-beach-dusk', species: 'rex', stage: 2, hat: 'headphones', bg: 'beach', time: '19:40' },
];
for (const s of shots) {
  await setup(s);
  await page.goto(base + '/' + (s.time ? `?time=${s.time}` : ''));
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `tools/out/gallery-${vw}-${s.name}.png` });
}
await browser.close(); server.close();
console.log('gallery done');
