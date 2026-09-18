// Service worker: cache everything so the game works offline once installed.
const VERSION = 'pixelpals-v1';
const ASSETS = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './src/main.js', './src/util.js', './src/sprites.js', './src/scene.js', './src/pet.js', './src/storage.js', './src/store.js', './src/audio.js', './src/speech.js', './src/ui.js', './src/badges.js',
  './src/cloud/config.js', './src/cloud/auth.js', './src/cloud/api.js',
  './src/content/index.js', './src/content/math.js', './src/content/english.js', './src/content/science.js',
  './src/screens/profiles.js', './src/screens/signin.js', './src/screens/home.js', './src/screens/activity.js', './src/screens/games.js', './src/screens/shop.js', './src/screens/album.js', './src/screens/parents.js',
  './src/minigames/common.js', './src/minigames/catch.js', './src/minigames/bubbles.js', './src/minigames/memory.js',
  './assets/fonts/PressStart2P-latin.woff2', './assets/fonts/PixelifySans-latin.woff2',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // API and sign-in calls go straight to the network
  if (url.pathname.endsWith('/config.json')) {
    // Deployment settings: always try the network first so a site can switch modes.
    e.respondWith(fetch(e.request).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(e.request).then((res) => {
        if (res && res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    }),
  );
});
