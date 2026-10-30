/* Lease Coach service worker: offline-first with background refresh.
   Bump VERSION whenever the app files change so installed copies pick up the update. */
const VERSION = 'v1.0.0';
const CACHE = 'lease-coach-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/calc.js',
  './js/data.js',
  './js/advisor.js',
  './js/store.js',
  './js/ui.js',
  './js/content.js',
  './js/views/home.js',
  './js/views/target.js',
  './js/views/check.js',
  './js/views/tools.js',
  './js/views/playbook.js',
  './js/views/offers.js',
  './js/views/settings.js',
  './js/app.js',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('lease-coach-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return hit || network;
    })
  );
});
