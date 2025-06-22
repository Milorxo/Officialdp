
const CACHE_NAME = 'daily-productivity-cache-v5'; // Incremented version
const CORE_ASSETS = [ // Assets that use CacheFirst strategy
  '/',
  '/index.html',
  '/dp.png',
  '/dp_192.png', // Added dp_192.png
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
  if (requestUrl.pathname.endsWith('index.js') || requestUrl.pathname.endsWith('index.css')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return fetch(event.request).then(response => {
          if (response.ok) { // Check if the response is valid
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
          return cache.match(event.request).then(response => {
            return response || new Response("Network error, and not found in cache.", { status: 404, statusText: "Not Found" });
          });
        });
      })
    );
    return;
  }

  // Cache First for core assets
  if (CORE_ASSETS.some(assetPath => requestUrl.pathname.endsWith(assetPath) || requestUrl.href === assetPath || (requestUrl.origin === 'https://fonts.gstatic.com' && CORE_ASSETS.some(coreAsset => coreAsset.includes(requestUrl.pathname))) )) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) { // Check if the response is valid
               cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
             return new Response("Asset not found in cache and network error.", { status: 404, statusText: "Not Found" });
          });
        });
      })
    );
    return;
  }
  
  // Default: try network, then cache for any other GET requests not explicitly handled.
  // This is a general fallback.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return fetch(event.request).then(response => {
        if (response.ok) {
           cache.put(event.request, response.clone());
        }
        return response;
      }).catch(() => {
        return cache.match(event.request).then(response => {
          return response || new Response("Resource not available offline.", { status: 404, statusText: "Not Found" });
        });
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // Delete old caches except the current one
          return cacheName.startsWith('daily-productivity-cache-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Claim clients to ensure the new service worker controls the page immediately
      return self.clients.claim();
    })
  );
});
