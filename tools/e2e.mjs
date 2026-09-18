// End-to-end smoke test: creates a player, plays an activity, visits every
// screen, and saves screenshots to tools/out/. Fails on console errors.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';
const root = process.cwd();
fs.mkdirSync('tools/out', { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(root, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { errors.push(m.text()); console.log('[console]', m.type(), m.text()); } });
page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
const shot = (name) => page.screenshot({ path: `tools/out/${name}.png` });
const tapText = async (text, i = 0) => { await page.locator(`button:has-text("${text}")`).nth(i).tap(); };

await page.goto(base + '/?debug=1');
await page.waitForTimeout(600);
await shot('01-profiles');
await tapText('New player');
await page.fill('input[placeholder="Your name"]', 'Ana');
await page.locator('.egg-pick button').nth(2).tap(); // rex
await page.waitForTimeout(200);
await shot('02-new-player');
await tapText('Start!');
await page.waitForTimeout(1200);
await shot('03-home-egg');

// First activity: Feed → maths, hatches the egg afterwards.
await tapText('Feed');
await page.waitForTimeout(700);
await shot('04-activity-math');
// answer the round by reading the correct answer from the app state
async function answerRound() {
  for (let guard = 0; guard < 12; guard++) {
    const done = await page.locator('button:has-text("Done!")').count();
    if (done) { await tapText('Done!'); return; }
    const gotIt = await page.locator('button:has-text("Got it!")').count();
    if (gotIt) { await tapText('Got it!'); await page.waitForTimeout(300); continue; }
    const tiles = await page.locator('.tiles button').count();
    if (tiles) {
      const word = await page.locator('.slots').evaluate((n) => n.children.length);
      // spell by trying tiles in order of the hidden answer: read from window state is not exposed; brute force each slot
      for (let s = 0; s < word; s++) {
        const btns = page.locator('.tiles button:not([disabled])');
        const n = await btns.count();
        for (let k = 0; k < n; k++) {
          const before = await page.locator('.slots i.filled').count();
          await btns.nth(k).tap(); await page.waitForTimeout(80);
          const after = await page.locator('.slots i.filled').count();
          if (after > before) break;
        }
      }
      await page.waitForTimeout(1400);
      continue;
    }
    const answers = page.locator('.answers button');
    const n = await answers.count();
    if (!n) { await page.waitForTimeout(300); continue; }
    // tap options until one is marked correct
    for (let k = 0; k < n; k++) {
      const b = answers.nth(k);
      if (await b.isDisabled()) continue;
      await b.tap();
      await page.waitForTimeout(150);
      if (await b.evaluate((x) => x.classList.contains('correct'))) break;
      if (await page.locator('.answers button.correct').count()) break;
    }
    await page.waitForTimeout(1900);
  }
}
await answerRound();
await page.waitForTimeout(500);
await shot('05-after-feed');
await page.waitForTimeout(4200); // hatch animation + modal
await shot('06-hatched');
const helloBtn = page.locator('button:has-text("Hello!")');
if (await helloBtn.count()) await helloBtn.tap();
await page.waitForTimeout(800);
await shot('07-home-baby');

// English via Play
await tapText('Play');
await page.waitForTimeout(700);
await shot('08-activity-english');
await answerRound();
await page.waitForTimeout(3200);
// Science via Explore
await tapText('Explore');
await page.waitForTimeout(700);
await shot('09-activity-science');
await answerRound();
await page.waitForTimeout(3200);
await shot('10-home-after-three');

// Other screens
await tapText('Games'); await page.waitForTimeout(400); await shot('11-games');
await page.locator('.card').nth(0).tap(); await page.waitForTimeout(1500); await shot('12-catch');
await tapText('Quit'); await page.waitForTimeout(400);
await page.locator('.card').nth(1).tap(); await page.waitForTimeout(1200); await shot('13-bubbles');
await tapText('Quit'); await page.waitForTimeout(400);
await page.locator('.card').nth(2).tap(); await page.waitForTimeout(400); await page.locator('.cardm').nth(0).tap(); await page.waitForTimeout(300); await shot('14-memory');
await tapText('Quit'); await page.waitForTimeout(300);
await page.locator('button[aria-label="Back"]').first().tap(); await page.waitForTimeout(400);
await tapText('Shop'); await page.waitForTimeout(400); await shot('15-shop');
await page.locator('button[aria-label="Back"]').first().tap(); await page.waitForTimeout(300);
await tapText('Album'); await page.waitForTimeout(400); await shot('16-album');
await page.locator('button[aria-label="Back"]').first().tap(); await page.waitForTimeout(300);
await tapText('Parents'); await page.waitForTimeout(400); await shot('17-parents-gate');
// solve the gate
const q = await page.locator('.title.big').textContent();
const [a, b] = q.match(/\d+/g).map(Number);
await tapText(String(a * b)); await page.waitForTimeout(400); await shot('18-parents');
await page.locator('button[aria-label="Back"]').first().tap(); await page.waitForTimeout(300);

// Sleep toggle + night check
await tapText('Sleep'); await page.waitForTimeout(1600); await shot('19-sleep');
await tapText('Wake'); await page.waitForTimeout(1400);

// state sanity
const state = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpals.v1')));
const prof = state.profiles[0];
console.log('profile:', prof.name, 'pet stage', prof.pet.stage, 'stars', prof.pet.stars, 'today', JSON.stringify(prof.today), 'coins', prof.coins);
await browser.close(); server.close();
if (errors.length) { console.log('ERRORS:', errors.length); process.exit(1); }
console.log('e2e ok');
