// Cloud-mode end-to-end test against the local mock backend: sign-in screen,
// profile creation, an activity that saves to the API, and the one-device-
// at-a-time behaviour between two "devices" (browser contexts).
import fs from 'node:fs';
import { chromium } from './pw.mjs';
import { startMockCloud } from './mock-cloud.mjs';

fs.mkdirSync('tools/out', { recursive: true });
const { server, db, port } = await startMockCloud({ port: 0 });
const base = `http://localhost:${port}`;
const browser = await chromium.launch();
const errors = [];
const mkPage = async () => {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' && !/status of 409/.test(m.text())) { errors.push(m.text()); console.log('[console]', m.text()); } });
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  return page;
};
const tap = (page, text, i = 0) => page.locator(`button:has-text("${text}")`).nth(i).tap();
const shot = (page, name) => page.screenshot({ path: `tools/out/cloud-${name}.png` });
const item = () => [...db._items.values()][0];

// ---- device A: sign in and create a player --------------------------------
const A = await mkPage();
await A.goto(base + '/');
await A.waitForSelector('button:has-text("Sign in with Google")');
await shot(A, '01-signin');
await tap(A, 'Sign in with Google');
await A.waitForSelector('button:has-text("New player")');
await shot(A, '02-profiles-empty');
await tap(A, 'New player');
await A.fill('input[placeholder="Your name"]', 'Ana');
await tap(A, 'Start!');
await A.waitForSelector('button:has-text("Feed")');
await A.waitForTimeout(800);
if (!item()) throw new Error('profile was not created in the cloud');
console.log('created in cloud: version', item().version, 'lock', item().lockDeviceName);

// play one activity so a save with real progress happens
await tap(A, 'Feed');
await A.waitForTimeout(600);
for (let guard = 0; guard < 8; guard++) {
  if (await A.locator('button:has-text("Done!")').count()) { await tap(A, 'Done!'); break; }
  const answers = A.locator('.answers button');
  const n = await answers.count();
  for (let k = 0; k < n; k++) {
    const b = answers.nth(k);
    if (await b.isDisabled()) continue;
    await b.tap(); await A.waitForTimeout(150);
    if (await A.locator('.answers button.correct').count()) break;
  }
  await A.waitForTimeout(1900);
}
await A.waitForTimeout(5000); // hatch animation + autosave
const helloBtn = A.locator('button:has-text("Hello!")');
if (await helloBtn.count()) await helloBtn.tap();
await A.waitForTimeout(800);
const saved = JSON.parse(item().data);
console.log('cloud copy: stage', saved.pet.stage, 'stars', saved.pet.stars, 'version', item().version);
if (saved.pet.stars < 1) throw new Error('progress did not reach the cloud');
await shot(A, '03-home-A');

// ---- device B: sees the player in use, takes it over -----------------------
const B = await mkPage();
await B.goto(base + '/');
await tap(B, 'Sign in with Google');
await B.waitForSelector('.card');
await B.waitForTimeout(500);
const badge = await B.locator('.card .stat-chip').count();
if (!badge) throw new Error('device B should see the IN USE badge');
await shot(B, '04-profiles-B-in-use');
await B.locator('.card').first().tap();
await B.waitForSelector('button:has-text("Play here instead")');
await shot(B, '05-takeover-modal');
await tap(B, 'Play here instead');
await B.waitForSelector('button:has-text("Feed")');
await B.waitForTimeout(600);
console.log('lock now held by', item().lockDeviceName, 'device', item().lockDeviceId.slice(0, 6));

// ---- device A: its next save is rejected and it is sent back to the list ----
await A.evaluate(() => window.__pixelpals.flush());
await A.waitForSelector('text=PLAYER MOVED', { timeout: 5000 });
await shot(A, '06-A-kicked');
await tap(A, 'OK');
await A.waitForSelector('.card');
await A.waitForTimeout(400);
if (!(await A.locator('.card .stat-chip').count())) throw new Error('device A should now see the player in use by B');
await shot(A, '07-A-profiles-in-use');

// ---- device B backgrounds the app: lease released; A can open it normally ----
await B.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
await B.waitForTimeout(800);
if (item().lockDeviceId) throw new Error('lease should be released when device B goes to the background');
await A.locator('.card').first().tap();
await A.waitForSelector('button:has-text("Feed")');
await A.waitForTimeout(500);
console.log('A reopened without takeover; lock held by', item().lockDeviceName);

// ---- device B comes back: lease belongs to A now, B is bounced --------------
await B.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
await B.waitForSelector('text=PLAYER MOVED', { timeout: 5000 });
await tap(B, 'OK');
await B.waitForSelector('.card');
await shot(B, '08-B-bounced');

// ---- switch player from the top bar releases the lease ----------------------
await A.locator('.topbar .name').tap();
await A.waitForSelector('button:has-text("New player")');
await A.waitForTimeout(400);
if (item().lockDeviceId) throw new Error('leaving a player should release its lease');
console.log('lease released on switch player; versions:', item().version);

await browser.close();
server.close();
if (errors.length) { console.log('ERRORS:', errors.length); process.exit(1); }
console.log('cloud e2e ok');
