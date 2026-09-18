// Entry point: global app state, a tiny screen router, autosave and timers.
// Profiles live in a "store": localStorage by default, or the cloud API when a
// config.json is present (see src/store.js).

import { createLocalStore, createCloudStore, StoreError } from './store.js';
import { loadCloudConfig } from './cloud/config.js';
import { tick, ensureToday } from './pet.js';
import { unlockAudio, startMusic, setAudioPrefs, pauseMusic, resumeMusic } from './audio.js';
import { setSpeechEnabled } from './speech.js';
import { modal, toast } from './ui.js';
import { renderProfiles } from './screens/profiles.js';
import { renderHome } from './screens/home.js';
import { renderActivity } from './screens/activity.js';
import { renderGames } from './screens/games.js';
import { renderShop } from './screens/shop.js';
import { renderAlbum } from './screens/album.js';
import { renderParents } from './screens/parents.js';
import { renderSignIn } from './screens/signin.js';

const SCREENS = { profiles: renderProfiles, home: renderHome, activity: renderActivity, games: renderGames, shop: renderShop, album: renderAlbum, parents: renderParents, signin: renderSignIn };

const screenRoot = document.getElementById('screen');
const overlayRoot = document.getElementById('overlay');
const params = new URLSearchParams(location.search);

export const app = {
  store: null,
  state: null,
  profile: null,
  home: null,
  debug: params.has('debug'),
  stack: [],
  now: () => {
    const t = params.get('time');
    if (!t) return new Date();
    const [h, m = '0'] = t.split(':');
    const d = new Date(); d.setHours(+h, +m, 0, 0); return d;
  },

  // ---- saving -------------------------------------------------------------
  save() {
    clearTimeout(this._saveT);
    this._saveT = setTimeout(() => this.flush(), 400);
  },
  saveNow() { return this.flush(); },
  /** Persist the open profile. Saves are serialised so versions never race. */
  flush(opts = {}) {
    clearTimeout(this._saveT);
    const profile = this.profile;
    if (!profile) return Promise.resolve();
    this._chain = (this._chain || Promise.resolve())
      .then(() => this.store.save(profile, opts))
      .then(() => { if (this._offline) { this._offline = false; toast('Back online: progress saved', 'check'); } }, (e) => this.handleSaveError(e));
    return this._chain;
  },
  handleSaveError(e) {
    if (!(e instanceof StoreError)) { console.error(e); return; }
    if (e.code === 'lock') this.kicked(e.deviceName);
    else if (e.code === 'version' || e.code === 'missing') this.kicked(null);
    else if (e.code === 'auth') { this.profile = null; this.go('signin'); }
    else if (e.code === 'network') { if (!this._offline) { this._offline = true; toast('No internet: will save when it is back'); } }
    else console.error(e);
  },

  // ---- profiles -----------------------------------------------------------
  async openProfile(id, { force = false } = {}) {
    let res;
    try { res = await this.store.open(id, { force }); }
    catch (e) {
      if (e.code === 'auth') { this.go('signin'); return false; }
      toast(e.code === 'network' ? 'No internet connection' : 'Could not open this player');
      return false;
    }
    if (res.missing) { toast('That player is gone'); await this.refreshProfiles(); this.go('profiles'); return false; }
    if (res.locked) {
      const p = this.state.profiles.find((x) => x.id === id);
      const take = await modal({
        title: 'IN USE',
        body: `${p?.name || 'This player'} is open on ${res.deviceName || 'another device'}. Only one device can play a player at a time.`,
        actions: [{ label: 'Play here instead', cls: 'yellow', value: true }, { label: 'Cancel', value: false }],
      });
      if (!take) return false;
      return this.openProfile(id, { force: true });
    }
    this.selectProfile(res.profile);
    this.go('home');
    return true;
  },
  selectProfile(profile) {
    this.profile = profile;
    this.store.setLast(profile.id);
    tick(profile.pet, Date.now());
    ensureToday(profile, this.now());
    this.applyPrefs();
    this.save();
  },
  async createProfile(profile) {
    await this.store.create(profile);
    this.selectProfile(profile);
    this.go('home');
  },
  async leaveProfile() {
    if (this.profile) await this.flush({ release: true });
    await this.store.close();
    this.profile = null;
    this.store.setLast(null);
    await this.refreshProfiles();
    this.go('profiles');
  },
  async deleteProfile(id) {
    await this.store.remove(id);
    this.profile = null;
    this.store.setLast(null);
    this.go('profiles');
  },
  async refreshProfiles() {
    if (!this.store.refresh) return;
    try { await this.store.refresh(); } catch { /* keep the list we have */ }
  },
  /** Another device took the player over (or the data changed elsewhere). */
  async kicked(deviceName) {
    if (this._kicking) return;
    this._kicking = true;
    this.closeAll();
    this.profile = null;
    this.store.setLast(null);
    await modal({
      title: 'PLAYER MOVED',
      body: deviceName ? `This player is now being played on ${deviceName}. You can take it back from the player list.` : 'This player was changed on another device. Pick it again to continue.',
      actions: [{ label: 'OK', cls: 'yellow', value: true }], dismissable: false,
    });
    this._kicking = false;
    await this.refreshProfiles();
    this.go('profiles');
  },
  applyPrefs() {
    const s = this.profile?.settings;
    if (!s) return;
    setAudioPrefs({ sound: s.sound, music: s.music });
    setSpeechEnabled(s.speech);
  },

  // ---- screens ------------------------------------------------------------
  /** Replace the base screen. */
  go(name, p = {}) {
    this.closeAll();
    this.home = null;
    screenRoot.replaceChildren();
    const node = SCREENS[name](this, p, () => {});
    screenRoot.append(node);
  },
  /** Push an overlay screen; resolves with the value passed to `done`. */
  push(name, p = {}) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'screen';
      const entry = { wrap, resolve, cleanup: null };
      this.stack.push(entry);
      const node = SCREENS[name](this, p, (value) => this.pop(entry, value));
      if (node?.cleanup) entry.cleanup = node.cleanup;
      wrap.append(node);
      overlayRoot.append(wrap);
      this.home?.setPaused(true);
    });
  },
  pop(entry, value) {
    const i = this.stack.indexOf(entry);
    if (i === -1) return;
    this.stack.splice(i, 1);
    entry.cleanup?.();
    entry.wrap.remove();
    if (this.stack.length === 0) this.home?.setPaused(false);
    entry.resolve(value);
  },
  closeAll() {
    for (const e of this.stack.splice(0)) { e.cleanup?.(); e.wrap.remove(); e.resolve(null); }
    overlayRoot.replaceChildren();
  },
};

// ---- boot -------------------------------------------------------------------

async function boot() {
  const cfg = await loadCloudConfig();
  app.store = cfg ? createCloudStore(cfg) : createLocalStore();
  app.state = app.store.state;
  document.body.dataset.mode = app.store.mode;
  const r = await app.store.init();
  if (r.needsSignIn) { app.go('signin', { error: r.error }); return; }
  if (r.error) { app.go('signin', { offline: true }); return; }
  const last = app.state.lastProfileId && app.state.profiles.find((p) => p.id === app.state.lastProfileId);
  if (last && !params.has('profiles')) {
    if (await app.openProfile(last.id)) return;
  }
  app.go('profiles');
}

// Unlock audio on the first interaction (required on mobile browsers).
let unlocked = false;
const unlock = () => {
  if (unlocked) return;
  unlocked = true;
  unlockAudio();
  if (app.profile?.settings.music !== false) startMusic();
};
window.addEventListener('pointerdown', unlock, { passive: true });
window.addEventListener('keydown', unlock);

// Keep the pet's clock ticking (and the cloud lease alive) while the app is open.
setInterval(() => {
  if (!app.profile || document.hidden) return;
  tick(app.profile.pet, Date.now());
  ensureToday(app.profile, app.now());
  app.home?.refresh();
  app.flush();
}, 30000);

document.addEventListener('visibilitychange', async () => {
  if (document.hidden) {
    pauseMusic();
    app.home?.setPaused(true);
    // Save and hand the lease back so another device can pick the player up.
    if (app.profile) app.flush({ release: app.store.mode === 'cloud', keepalive: true });
    return;
  }
  if (unlocked) resumeMusic();
  if (!app.profile) return;
  tick(app.profile.pet, Date.now());
  ensureToday(app.profile, app.now());
  if (app.store.mode === 'cloud') {
    const r = await app.store.resume();
    if (r.locked) return app.kicked(r.deviceName);
    if (r.missing) return app.kicked(null);
    if (r.changed) {
      app.profile = r.profile;
      tick(app.profile.pet, Date.now());
      ensureToday(app.profile, app.now());
      app.go('home');
      toast('Synced from the cloud', 'check');
      return;
    }
  }
  app.home?.refresh();
  if (app.stack.length === 0) app.home?.setPaused(false);
});
window.addEventListener('pagehide', () => { if (app.profile) app.flush({ release: app.store.mode === 'cloud', keepalive: true }); });
window.addEventListener('resize', () => app.home?.resize());

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

boot();
window.__pixelpals = app; // handy for debugging / tests
