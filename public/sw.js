// Service Worker for Trading Dashboard - minimal cache, no API caching
const CACHE_NAME = 'trading-dashboard-v1';
// Only cache these at install - minimal set to avoid cache bloat
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Requests that should NEVER be served from or written to cache (APIs, dynamic data)
function shouldBypassCache(request) {
  const url = new URL(request.url);
  // Bypass cache for API, chart, auth, payment, strategy, subscription, etc.
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/api/')) return true;
  if (url.pathname.startsWith('/chart') || url.pathname.includes('chart')) return true;
  if (url.pathname.includes('auth') || url.pathname.includes('payment') || url.pathname.includes('strategy') || url.pathname.includes('subscription')) return true;
  if (request.method !== 'GET') return true;
  return false;
}

// Install event - cache only minimal resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache).catch(() => {}))
      .catch(() => {})
  );
  self.skipWaiting();
});

// Fetch: use cache ONLY for static assets; never cache or serve cache for API/dynamic
self.addEventListener('fetch', (event) => {
  if (shouldBypassCache(event.request)) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// Activate - delete ALL old caches to prevent buildup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const deleteOld = cacheNames
        .filter((name) => name !== CACHE_NAME)
        .map((name) => caches.delete(name));
      return Promise.all(deleteOld);
    }).then(() => self.clients.claim())
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(Promise.resolve());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Trading Dashboard', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
