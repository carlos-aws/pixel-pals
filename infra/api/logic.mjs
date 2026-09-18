// Profile store rules, independent of DynamoDB so they can be unit-tested and
// reused by the local mock server (tools/mock-cloud.mjs).
//
// Each profile is one item owned by a signed-in user. A device must hold the
// profile's lease ("lock") to save it. Leases expire after LOCK_TTL_MS without
// a heartbeat so a crashed or sleeping device never blocks another one forever.

export const LOCK_TTL_MS = 3 * 60 * 1000;

const pk = (sub) => `USER#${sub}`;
const sk = (id) => `PROFILE#${id}`;

export function summaryOf(profile) {
  const p = profile || {};
  return {
    name: p.name || 'Player',
    petName: p.pet?.name || '',
    species: p.pet?.species || 'mochi',
    stage: p.pet?.stage ?? 0,
    stars: p.pet?.stars ?? 0,
    hat: p.equipped?.hat || null,
    createdAt: p.createdAt || 0,
  };
}

function lockOf(item, t) {
  if (!item.lockDeviceId || !(item.lockUntil > t)) return null;
  return { deviceId: item.lockDeviceId, deviceName: item.lockDeviceName || 'another device', since: item.lockSince || 0 };
}

/**
 * db adapter: { get(pk, sk), query(pk), put(item, cond), delete(pk, sk) }
 * put(item, { ifNotExists: true }) or put(item, { ifVersion: n }) must return
 * false (not throw) when the condition fails.
 */
export function createService(db, now = () => Date.now()) {
  const withLease = (item, deviceId, deviceName, t, keepSince) => ({
    ...item,
    lockDeviceId: deviceId,
    lockDeviceName: deviceName || 'device',
    lockUntil: t + LOCK_TTL_MS,
    lockSince: keepSince || t,
  });

  return {
    async list(sub) {
      const items = await db.query(pk(sub));
      const t = now();
      return items
        .map((i) => ({ id: i.id, version: i.version, updatedAt: i.updatedAt, summary: i.summary, lock: lockOf(i, t) }))
        .sort((a, b) => (a.summary?.createdAt || 0) - (b.summary?.createdAt || 0));
    },

    /** Acquire (or refresh) the lease and return the full profile. */
    async open(sub, id, { deviceId, deviceName, force = false }) {
      if (!deviceId) return { status: 400, body: { error: 'deviceId required' } };
      const item = await db.get(pk(sub), sk(id));
      if (!item) return { status: 404, body: { error: 'not found' } };
      const t = now();
      const lock = lockOf(item, t);
      if (lock && lock.deviceId !== deviceId && !force) {
        return { status: 409, body: { locked: true, deviceName: lock.deviceName, since: lock.since } };
      }
      const keep = lock && lock.deviceId === deviceId ? lock.since : 0;
      const updated = withLease(item, deviceId, deviceName, t, keep);
      await db.put(updated);
      return { status: 200, body: { id, version: item.version, data: item.data, lockUntil: updated.lockUntil } };
    },

    /**
     * Save profile data. `version` is the version the client last saw (0 to
     * create). `release` drops the lease afterwards. `force` overwrites
     * regardless of lease or version (used by parents restoring a backup).
     */
    async save(sub, id, { deviceId, deviceName, version, data, release = false, force = false }) {
      if (!deviceId) return { status: 400, body: { error: 'deviceId required' } };
      if (!data || typeof data !== 'object') return { status: 400, body: { error: 'data required' } };
      const t = now();
      const item = await db.get(pk(sub), sk(id));
      const dataStr = JSON.stringify(data);
      if (dataStr.length > 200000) return { status: 413, body: { error: 'profile too large' } };
      if (!item) {
        if (version !== 0 && !force) return { status: 409, body: { reason: 'missing' } };
        let fresh = { PK: pk(sub), SK: sk(id), id, version: 1, data: dataStr, summary: summaryOf(data), createdAt: t, updatedAt: t };
        fresh = release ? fresh : withLease(fresh, deviceId, deviceName, t, 0);
        const ok = await db.put(fresh, { ifNotExists: true });
        if (!ok) return { status: 409, body: { reason: 'version' } };
        return { status: 200, body: { version: 1, lockUntil: fresh.lockUntil || 0 } };
      }
      const lock = lockOf(item, t);
      if (!force) {
        if (lock && lock.deviceId !== deviceId) return { status: 409, body: { reason: 'lock', deviceName: lock.deviceName } };
        if (item.version !== version) return { status: 409, body: { reason: 'version', version: item.version } };
      }
      let updated = { ...item, version: item.version + 1, data: dataStr, summary: summaryOf(data), updatedAt: t };
      if (release) { delete updated.lockDeviceId; delete updated.lockDeviceName; delete updated.lockUntil; delete updated.lockSince; }
      else updated = withLease(updated, deviceId, deviceName, t, lock && lock.deviceId === deviceId ? lock.since : 0);
      const ok = await db.put(updated, force ? undefined : { ifVersion: item.version });
      if (!ok) return { status: 409, body: { reason: 'version' } };
      return { status: 200, body: { version: updated.version, lockUntil: updated.lockUntil || 0 } };
    },

    /** Drop the lease if this device holds it. Always succeeds. */
    async release(sub, id, { deviceId }) {
      const item = await db.get(pk(sub), sk(id));
      if (item && item.lockDeviceId === deviceId) {
        const updated = { ...item };
        delete updated.lockDeviceId; delete updated.lockDeviceName; delete updated.lockUntil; delete updated.lockSince;
        await db.put(updated);
      }
      return { status: 200, body: { ok: true } };
    },

    async remove(sub, id, { deviceId, force = false }) {
      const item = await db.get(pk(sub), sk(id));
      if (!item) return { status: 200, body: { ok: true } };
      const lock = lockOf(item, now());
      if (lock && lock.deviceId !== deviceId && !force) return { status: 409, body: { locked: true, deviceName: lock.deviceName } };
      await db.delete(pk(sub), sk(id));
      return { status: 200, body: { ok: true } };
    },
  };
}

/** Route an HTTP-style request to the service. Shared by Lambda and the mock. */
export async function route(service, { method, path, sub, query = {}, body = {} }) {
  const parts = path.replace(/^\/+|\/+$/g, '').split('/');
  if (parts[0] !== 'profiles') return { status: 404, body: { error: 'not found' } };
  if (parts.length === 1 && method === 'GET') return { status: 200, body: await service.list(sub) };
  const id = parts[1];
  if (!id || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return { status: 400, body: { error: 'bad id' } };
  const action = parts[2];
  if (!action) {
    if (method === 'PUT') return service.save(sub, id, body);
    if (method === 'DELETE') return service.remove(sub, id, { deviceId: query.deviceId, force: query.force === '1' });
  }
  if (action === 'lock' && method === 'POST') return service.open(sub, id, body);
  if (action === 'unlock' && method === 'POST') return service.release(sub, id, body);
  return { status: 404, body: { error: 'not found' } };
}

/** In-memory adapter used by tests and the local mock server. */
export function memoryDb() {
  const items = new Map();
  const key = (p, s) => `${p}|${s}`;
  return {
    async get(p, s) { const v = items.get(key(p, s)); return v ? structuredClone(v) : null; },
    async query(p) { return [...items.values()].filter((i) => i.PK === p).map((i) => structuredClone(i)); },
    async put(item, cond) {
      const k = key(item.PK, item.SK);
      const cur = items.get(k);
      if (cond?.ifNotExists && cur) return false;
      if (cond?.ifVersion !== undefined && (!cur || cur.version !== cond.ifVersion)) return false;
      items.set(k, structuredClone(item));
      return true;
    },
    async delete(p, s) { items.delete(key(p, s)); },
    _items: items,
  };
}
