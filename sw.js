const CACHE_NAME = 'baf-v15-06142026';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/utils.js',
  '/bars.csv',
  '/matches.csv',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install Event — Cache Core Assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting()) // Force immediate activation
  );
});

// Activate Event — Clean Up Old Caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of open pages immediately
  );
});

// Fetch Event — Network First, falling back to Cache
self.addEventListener('fetch', (e) => {
  // CRITICAL FIX: Skip non-HTTP protocols (like geo:, mailto:, tel:)
  if (!e.request.url.startsWith('http')) {
    return;
  }

  // OPTIONAL FIX: Don't intercept external map links
  const url = new URL(e.request.url);
  if (url.hostname.includes('google.com') || url.hostname.includes('apple.com')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If valid network response, clone it into the cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If offline/network fails, try the cache
        return caches.match(e.request);
      })
  );
});