// Where profiles live. Two implementations with the same interface:
//   - local: everything in this browser's localStorage (default)
//   - cloud: profiles in the Pixel Pals cloud API, one device at a time per profile
//
// Interface (all async unless noted):
//   mode, state ({ profiles, lastProfileId }), user(), init(), open(id, {force}),
//   create(profile), save(profile, {release}), remove(id), close(), resume(),
//   exportState(profile), importState(text), setLast(id) (sync)

import { loadState, saveState, migrateProfile, exportJSON, importJSON } from './storage.js';
import { createCognitoAuth, createMockAuth } from './cloud/auth.js';
import { createApi, ApiError } from './cloud/api.js';

export class StoreError extends Error {
  constructor(code, extra = {}) { super(code); this.code = code; Object.assign(this, extra); }
}

// ---------------------------------------------------------------- local

export function createLocalStore() {
  const state = loadState();
  return {
    mode: 'local',
    state,
    user: () => null,
    async init() { return { ok: true }; },
    async open(id) {
      const profile = state.profiles.find((p) => p.id === id);
      return profile ? { profile } : { missing: true };
    },
    async create(profile) { state.profiles.push(profile); saveState(state); },
    async save() { saveState(state); },
    async remove(id) { state.profiles = state.profiles.filter((p) => p.id !== id); saveState(state); },
    async close() {},
    async resume() { return { ok: true }; },
    exportState() { return exportJSON(state); },
    async importState(text) {
      const st = importJSON(text);
      state.profiles = st.profiles;
      state.lastProfileId = null;
      saveState(state);
      return st.profiles.length;
    },
    setLast(id) { state.lastProfileId = id; saveState(state); },
  };
}

// ---------------------------------------------------------------- cloud

const DEVICE_KEY = 'pixelpals.device';
const LAST_KEY = 'pixelpals.cloud.last';

function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) { id = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem(DEVICE_KEY, id); }
    return id;
  } catch { return 'dev-' + Math.random().toString(36).slice(2, 10); }
}

export function describeDevice(ua = navigator.userAgent) {
  const os = /Android/.test(ua) ? 'Android' : /iPad|iPhone/.test(ua) ? 'iPhone/iPad' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /CrOS/.test(ua) ? 'Chromebook' : /Linux/.test(ua) ? 'Linux' : '';
  const kind = /iPad|Tablet|(Android(?!.*Mobile))/.test(ua) ? 'tablet' : /Mobile|iPhone/.test(ua) ? 'phone' : 'computer';
  return `${os} ${kind}`.trim();
}

/** Summary rows from the API become light-weight profile stand-ins for the player list. */
function summaryToProfile(row) {
  const s = row.summary || {};
  return {
    id: row.id, name: s.name || 'Player', createdAt: s.createdAt || 0,
    pet: { name: s.petName || '', species: s.species || 'mochi', stage: s.stage || 0, stars: s.stars || 0 },
    equipped: { hat: s.hat || null },
    _summary: true, _lock: row.lock || null, _version: row.version,
  };
}

export function createCloudStore(cfg) {
  const auth = cfg.auth === 'mock' ? createMockAuth(cfg) : createCognitoAuth(cfg);
  const api = createApi(cfg, auth);
  const me = { deviceId: deviceId(), deviceName: describeDevice() };
  const state = { version: 1, profiles: [], lastProfileId: null };
  try { state.lastProfileId = localStorage.getItem(LAST_KEY); } catch { /* ignore */ }
  let current = null; // { id, version }

  const replace = (profile) => {
    const i = state.profiles.findIndex((p) => p.id === profile.id);
    if (i >= 0) state.profiles[i] = profile; else state.profiles.push(profile);
  };
  const wrap = (e) => {
    if (e instanceof ApiError) {
      if (e.network) return new StoreError('network');
      if (e.status === 401) return new StoreError('auth');
      if (e.status === 409) return new StoreError(e.body.locked ? 'lock' : e.body.reason || 'conflict', e.body);
      if (e.status === 404) return new StoreError('missing');
    }
    return new StoreError('unknown', { cause: e });
  };

  async function refreshList() {
    const rows = await api.get('/profiles');
    const open = current ? state.profiles.find((p) => p.id === current.id && !p._summary) : null;
    state.profiles = rows.map((r) => (open && r.id === open.id ? open : summaryToProfile(r)));
  }

  return {
    mode: 'cloud',
    state,
    auth,
    me,
    user: () => auth.user(),
    signIn: () => auth.signIn(),
    async signOut() { await this.close(); auth.signOut(); },

    async init() {
      const cb = await auth.handleCallback();
      if (cb.error) return { needsSignIn: true, error: cb.error };
      if (!auth.isSignedIn()) return { needsSignIn: true };
      try { await refreshList(); return { ok: true }; }
      catch (e) { const err = wrap(e); return err.code === 'auth' ? { needsSignIn: true } : { error: err.code }; }
    },

    async refresh() { try { await refreshList(); } catch (e) { throw wrap(e); } },

    /** Take the profile's lease and load the latest data. */
    async open(id, { force = false } = {}) {
      let res;
      try { res = await api.post(`/profiles/${id}/lock`, { ...me, force }); }
      catch (e) {
        const err = wrap(e);
        if (err.code === 'lock') return { locked: true, deviceName: err.deviceName, since: err.since };
        if (err.code === 'missing') return { missing: true };
        throw err;
      }
      const profile = migrateProfile(JSON.parse(res.data));
      current = { id, version: res.version };
      replace(profile);
      return { profile };
    },

    async create(profile) {
      try {
        const res = await api.put(`/profiles/${profile.id}`, { ...me, version: 0, data: profile });
        current = { id: profile.id, version: res.version };
        replace(profile);
      } catch (e) { throw wrap(e); }
    },

    /** Save the open profile. `release` also drops the lease (used when leaving). */
    async save(profile, { release = false, keepalive = false } = {}) {
      if (!current || current.id !== profile.id) return;
      try {
        const res = await api.put(`/profiles/${profile.id}`, { ...me, version: current.version, data: profile, release }, { keepalive });
        if (current && current.id === profile.id) { current.version = res.version; current.released = release; }
      } catch (e) { throw wrap(e); }
    },

    async remove(id) {
      try { await api.del(`/profiles/${id}?deviceId=${encodeURIComponent(me.deviceId)}&force=1`); }
      catch (e) { throw wrap(e); }
      if (current?.id === id) current = null;
      state.profiles = state.profiles.filter((p) => p.id !== id);
    },

    /** Give the lease back (e.g. when switching player or leaving the page). */
    async close() {
      if (!current) return;
      const id = current.id;
      current = null;
      try { await api.post(`/profiles/${id}/unlock`, { deviceId: me.deviceId }, { keepalive: true }); } catch { /* lease expires anyway */ }
    },

    /** After coming back to the foreground: still ours? Newer data elsewhere? */
    async resume() {
      if (!current) return { ok: true };
      const id = current.id;
      let res;
      try { res = await api.post(`/profiles/${id}/lock`, { ...me }); }
      catch (e) {
        const err = wrap(e);
        if (err.code === 'lock') { current = null; return { locked: true, deviceName: err.deviceName }; }
        if (err.code === 'missing') { current = null; return { missing: true }; }
        return { ok: true, offline: true };
      }
      current.released = false;
      if (res.version !== current.version) {
        const profile = migrateProfile(JSON.parse(res.data));
        current.version = res.version;
        replace(profile);
        return { ok: true, changed: true, profile };
      }
      return { ok: true };
    },

    exportState(profile) {
      return exportJSON({ version: 1, profiles: profile ? [profile] : [], exportedFrom: 'cloud' });
    },

    /** Restore profiles from a backup file into the cloud (overwrites same ids). */
    async importState(text) {
      const st = importJSON(text);
      for (const p of st.profiles) {
        try { await api.put(`/profiles/${p.id}`, { ...me, version: 0, data: p, force: true, release: true }); }
        catch (e) { throw wrap(e); }
      }
      current = null;
      await refreshList();
      return st.profiles.length;
    },

    setLast(id) { state.lastProfileId = id; try { if (id) localStorage.setItem(LAST_KEY, id); else localStorage.removeItem(LAST_KEY); } catch { /* ignore */ } },
  };
}
