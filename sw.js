const CACHE_NAME = 'af-inspection-v1';
const BASE = '/AFH';

const FILES_TO_CACHE = [
  BASE + '/af_home_inspection_app.html',
  BASE + '/manifest.json',
  BASE + '/icon-180.png',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Install — cache all files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.allSettled(
          FILES_TO_CACHE.map(url =>
            cache.add(url).catch(err => console.warn('Failed to cache:', url, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then(networkResponse => {
            // Cache successful GET requests dynamically
            if (
              event.request.method === 'GET' &&
              networkResponse &&
              networkResponse.status === 200
            ) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail, return the main app page
            if (event.request.destination === 'document') {
              return caches.match(BASE + '/af_home_inspection_app.html');
            }
          });
      })
  );
});
