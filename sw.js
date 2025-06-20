const CACHE_NAME = 'daily-productivity-cache-v4'; // Incremented version
const CORE_ASSETS = [ // Assets that use CacheFirst strategy
  '/',
  '/index.html',
  '/dp.png',
  '/dp_192.png',
  '/dp_512.png',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=swap',
];

// index.js and index.css will be handled with NetworkFirst

self.addEventListener('install', event => {
  self.skipWaiting(); // Ensure the new service worker activates immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching core assets:', CORE_ASSETS);
        const requests = CORE_ASSETS.map(url => {
          if (url.startsWith('https://fonts.googleapis.com/') || url.startsWith('https://fonts.gstatic.com/')) {
            return new Request(url, { mode: 'cors' });
          }
          return new Request(url);
        });
        return cache.addAll(requests)
          .catch(error => {
            console.error('Failed to cache one or more core assets during install:', error);
            requests.forEach(req => {
                cache.match(req.url).then(res => {
                    if (!res) console.error('Failed to cache core asset:', req.url);
                });
            });
          });
      })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Network First, then Cache for index.js and index.css
  if (requestUrl.pathname === '/index.js' || requestUrl.pathname === '/index.css') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
            // Network failed or returned an error, try cache
            console.warn(`Network fetch for ${requestUrl.pathname} failed, trying cache.`);
            return caches.match(event.request).then(cachedResponse => {
                return cachedResponse || networkResponse; // Return cached or original network error
            });
          }
          // Network fetch successful, cache it and return
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Truly offline or network error, try to serve from cache
          console.warn(`Network completely unavailable for ${requestUrl.pathname}, serving from cache if possible.`);
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If not in cache and network fails, the browser will handle the error.
            // Optionally, return a specific offline response for these critical files if needed.
            console.error(`${requestUrl.pathname} not found in cache and network failed.`);
            // For a critical file like index.js, if it's not in cache and network fails,
            // this could lead to the app not loading. Ensure it's cached during install
            // if offline fallback for it is absolutely critical after first load.
            // However, NetworkFirst implies we want the freshest.
            return new Response(`${requestUrl.pathname} not available`, { status: 404, statusText: 'Not Found' });
          });
        })
    );
    return;
  }

  // Cache First, then Network for other assets (core assets)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(
          networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        ).catch(error => {
          console.error('Fetch failed for a non-critical asset; returning offline page instead.', error);
          // Optionally, return a custom offline page or a generic fallback for other assets.
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
