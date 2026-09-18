// Entry point: global app state, a tiny screen router, autosave and timers.

import { loadState, saveState } from './storage.js';
import { tick, ensureToday } from './pet.js';
import { unlockAudio, startMusic, setAudioPrefs, pauseMusic, resumeMusic } from './audio.js';
import { setSpeechEnabled } from './speech.js';
import { renderProfiles } from './screens/profiles.js';
import { renderHome } from './screens/home.js';
import { renderActivity } from './screens/activity.js';
import { renderGames } from './screens/games.js';
import { renderShop } from './screens/shop.js';
import { renderAlbum } from './screens/album.js';
import { renderParents } from './screens/parents.js';

const SCREENS = { profiles: renderProfiles, home: renderHome, activity: renderActivity, games: renderGames, shop: renderShop, album: renderAlbum, parents: renderParents };

const screenRoot = document.getElementById('screen');
const overlayRoot = document.getElementById('overlay');
const params = new URLSearchParams(location.search);

export const app = {
  state: loadState(),
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

  save() {
    clearTimeout(this._saveT);
    this._saveT = setTimeout(() => saveState(this.state), 150);
  },
  saveNow() { clearTimeout(this._saveT); saveState(this.state); },

  selectProfile(id) {
    this.profile = this.state.profiles.find((p) => p.id === id) || null;
    this.state.lastProfileId = this.profile?.id ?? null;
    if (this.profile) {
      tick(this.profile.pet, Date.now());
      ensureToday(this.profile, this.now());
      this.applyPrefs();
    }
    this.save();
  },

  applyPrefs() {
    const s = this.profile?.settings;
    if (!s) return;
    setAudioPrefs({ sound: s.sound, music: s.music });
    setSpeechEnabled(s.speech);
  },

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

// ---- boot -----------------------------------------------------------------

function boot() {
  const last = app.state.profiles.find((p) => p.id === app.state.lastProfileId);
  if (last && !params.has('profiles')) { app.selectProfile(last.id); app.go('home'); }
  else app.go('profiles');
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

// Keep the pet's clock ticking while the app is open.
setInterval(() => {
  if (!app.profile) return;
  tick(app.profile.pet, Date.now());
  if (ensureToday(app.profile, app.now())) app.home?.refresh();
  app.home?.refresh();
  app.save();
}, 30000);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { app.saveNow(); pauseMusic(); app.home?.setPaused(true); }
  else {
    if (app.profile) { tick(app.profile.pet, Date.now()); ensureToday(app.profile, app.now()); }
    app.home?.refresh();
    if (app.stack.length === 0) app.home?.setPaused(false);
    if (unlocked) resumeMusic();
  }
});
window.addEventListener('pagehide', () => app.saveNow());
window.addEventListener('resize', () => app.home?.resize());

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

boot();
window.__pixelpals = app; // handy for debugging / tests
