const CACHE_NAME = 'azos-cache-network-first-v1';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests and not chrome extension requests.
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // We got a response from the network.
        // Let's cache it and return it.
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
             // Don't cache vite-specific things in dev
            if (event.request.url.includes('@vite') || event.request.url.includes('@fs')) {
                return;
            }
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // The network request failed, probably because of being offline.
        // Let's try to get it from the cache.
        return caches.match(event.request);
      })
  );
});