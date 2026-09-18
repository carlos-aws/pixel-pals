import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createService, memoryDb, route, LOCK_TTL_MS } from '../infra/api/logic.mjs';
import { createProfile } from '../src/storage.js';

function setup() {
  let t = 1_000_000;
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const db = memoryDb();
  const svc = createService(db, clock.now);
  return { svc, clock, db };
}
const A = { deviceId: 'dev-a', deviceName: 'Android tablet' };
const B = { deviceId: 'dev-b', deviceName: 'Android phone' };

test('create, list and open a profile', async () => {
  const { svc } = setup();
  const p = createProfile('Ana', 'mochi', 'Mo');
  const r = await svc.save('u1', p.id, { ...A, version: 0, data: p });
  assert.equal(r.status, 200); assert.equal(r.body.version, 1);
  const list = await svc.list('u1');
  assert.equal(list.length, 1);
  assert.equal(list[0].summary.name, 'Ana');
  assert.equal(list[0].lock.deviceId, 'dev-a');
  const o = await svc.open('u1', p.id, A);
  assert.equal(o.status, 200);
  assert.equal(JSON.parse(o.body.data).name, 'Ana');
  assert.equal((await svc.list('u2')).length, 0, 'other users see nothing');
});

test('a second device cannot open or save a leased profile, but can take over', async () => {
  const { svc } = setup();
  const p = createProfile('Ana', 'pip', 'Pi');
  await svc.save('u1', p.id, { ...A, version: 0, data: p });
  const denied = await svc.open('u1', p.id, B);
  assert.equal(denied.status, 409); assert.equal(denied.body.locked, true); assert.equal(denied.body.deviceName, 'Android tablet');
  const saveDenied = await svc.save('u1', p.id, { ...B, version: 1, data: p });
  assert.equal(saveDenied.status, 409); assert.equal(saveDenied.body.reason, 'lock');
  const took = await svc.open('u1', p.id, { ...B, force: true });
  assert.equal(took.status, 200);
  // the first device is now locked out
  const aSave = await svc.save('u1', p.id, { ...A, version: 1, data: p });
  assert.equal(aSave.status, 409); assert.equal(aSave.body.reason, 'lock');
  const aOpen = await svc.open('u1', p.id, A);
  assert.equal(aOpen.status, 409);
});

test('leases expire without heartbeats', async () => {
  const { svc, clock } = setup();
  const p = createProfile('Ana', 'rex', 'Re');
  await svc.save('u1', p.id, { ...A, version: 0, data: p });
  clock.advance(LOCK_TTL_MS - 1000);
  assert.equal((await svc.open('u1', p.id, B)).status, 409);
  clock.advance(2000);
  assert.equal((await svc.open('u1', p.id, B)).status, 200, 'stale lease can be taken');
});

test('version conflicts are detected and saves bump the version', async () => {
  const { svc } = setup();
  const p = createProfile('Ana', 'rex', 'Re');
  await svc.save('u1', p.id, { ...A, version: 0, data: p });
  p.coins = 50;
  const r2 = await svc.save('u1', p.id, { ...A, version: 1, data: p });
  assert.equal(r2.body.version, 2);
  const stale = await svc.save('u1', p.id, { ...A, version: 1, data: p });
  assert.equal(stale.status, 409); assert.equal(stale.body.reason, 'version');
  const forced = await svc.save('u1', p.id, { ...A, version: 0, data: p, force: true });
  assert.equal(forced.status, 200);
});

test('save with release lets another device continue with the latest data', async () => {
  const { svc } = setup();
  const p = createProfile('Ana', 'mochi', 'Mo');
  await svc.save('u1', p.id, { ...A, version: 0, data: p });
  p.coins = 77;
  const r = await svc.save('u1', p.id, { ...A, version: 1, data: p, release: true });
  assert.equal(r.status, 200);
  const o = await svc.open('u1', p.id, B);
  assert.equal(o.status, 200);
  assert.equal(JSON.parse(o.body.data).coins, 77);
  assert.equal(o.body.version, 2);
});

test('explicit release and delete respect the lease', async () => {
  const { svc } = setup();
  const p = createProfile('Ana', 'mochi', 'Mo');
  await svc.save('u1', p.id, { ...A, version: 0, data: p });
  assert.equal((await svc.remove('u1', p.id, B)).status, 409);
  await svc.release('u1', p.id, A);
  assert.equal((await svc.remove('u1', p.id, B)).status, 200);
  assert.equal((await svc.list('u1')).length, 0);
});

test('router maps HTTP requests and rejects bad ids', async () => {
  const { svc } = setup();
  const p = createProfile('Ana', 'mochi', 'Mo');
  assert.equal((await route(svc, { method: 'PUT', path: `/profiles/${p.id}`, sub: 'u1', body: { ...A, version: 0, data: p } })).status, 200);
  assert.equal((await route(svc, { method: 'GET', path: '/profiles', sub: 'u1' })).body.length, 1);
  assert.equal((await route(svc, { method: 'POST', path: `/profiles/${p.id}/lock`, sub: 'u1', body: A })).status, 200);
  assert.equal((await route(svc, { method: 'POST', path: `/profiles/${p.id}/unlock`, sub: 'u1', body: A })).status, 200);
  assert.equal((await route(svc, { method: 'DELETE', path: `/profiles/${p.id}`, sub: 'u1', query: { deviceId: 'dev-a' } })).status, 200);
  assert.equal((await route(svc, { method: 'GET', path: '/profiles/../x', sub: 'u1' })).status, 400);
  assert.equal((await route(svc, { method: 'GET', path: '/nope', sub: 'u1' })).status, 404);
});
