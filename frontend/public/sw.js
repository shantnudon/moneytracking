const CACHE_NAME = 'pwa-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
];

// self.addEventListener('install', (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       return cache.addAll(URLS_TO_CACHE);
//     })
//   );
// });

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'New Notification', body: 'Hello!' };
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});