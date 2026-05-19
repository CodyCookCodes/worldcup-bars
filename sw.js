// ─── East Bay Soccer Trail · Service Worker ──────────────────────────────────
// Cache version is auto-bumped by GitHub Actions on every deploy
const CACHE_NAME = 'worldcup-roots-v1';

// Assets to cache on install — all local files, no external APIs
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/constants.js',
  '/js/utils.js',
  '/js/map.js',
  '/js/ui.js',
  '/js/matches.js',
  '/js/main.js',
  '/assets/Oakland_Roots.png',
  '/assets/Oakland_Soul.png',
  '/assets/3d_crest_roots.png',
  '/assets/roots_mosaic_pattern_big_stroke.svg',
  '/assets/oakland_roots_single_color.svg',
  '/fonts/UnitedSansCdBd.otf',
  '/fonts/texgyreheroscn-regular.otf',
  '/fonts/texgyreheroscn-bold.otf',
  '/fonts/texgyreheroscn-italic.otf',
  '/fonts/texgyreheroscn-bolditalic.otf',
];

// ─── Install — pre-cache all local assets ─────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate — delete old caches ────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch — network-first for JS/HTML, cache-first for everything else ───────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go to network for external APIs — Google Maps, Sheets, flagcdn
  const isExternal = (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('flagcdn.com') ||
    url.hostname.includes('docs.google.com')
  );

  if (isExternal) return;

  // Network-first for HTML and JS — always get fresh code
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.js')) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const toCache = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, toCache));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else (CSS, fonts, images)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, toCache));
        return response;
      });
    })
  );
});