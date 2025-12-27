import { precacheAndRoute } from 'workbox-precaching';

// This is a placeholder for the precache manifest injected by VitePWA
precacheAndRoute(self.__WB_MANIFEST);

const THEME_CACHE_NAME = 'dynamic-theme-assets';

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_THEME_ASSETS') {
    const assetsToCache = event.data.payload;
    if (assetsToCache && assetsToCache.length > 0) {
      caches.open(THEME_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching theme assets:', assetsToCache);
        cache.addAll(assetsToCache).catch(error => {
          console.error('Service Worker: Failed to cache theme assets:', error);
        });
      });
    }
  }
});
