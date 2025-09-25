const CACHE_NAME = 'framer-motion-bubbles-cache-v1';
const API_CACHE_NAME = 'framer-motion-bubbles-api-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.0f5045b3.chunk.css', // Note: These filenames are based on your project structure but might need updating if hashes change
  '/static/js/main.7459756e.chunk.js',
  '/static/js/2.e4e414ac.chunk.js',
  '/static/js/runtime~main.a8a9905a.js'
];
const SUPABASE_API_HOST = 'supabase.co'; // Replace with your actual Supabase host if different

// Install event: cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event: serve cached content when offline
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Handle Supabase API requests with a network-first strategy
  if (requestUrl.hostname.includes(SUPABASE_API_HOST)) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(cache => {
        return fetch(event.request)
          .then(response => {
            // If the request is successful, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            // If the network request fails (offline), return the cached response if it exists.
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  // For all other requests, use a cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network, then cache it
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
