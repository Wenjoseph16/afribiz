const CACHE_NAME = 'afribiz-v2';

// Routes critiques pré-cachées : le comptoir (POS), le catalogue et la page
// hors-ligne doivent s'ouvrir même sans réseau.
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/dashboard/business/pos',
  '/marketplace',
  '/dashboard',
];

// Install: cache les assets statiques critiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll échoue si une route échoue — on ajoute route par route avec catch
      return Promise.all(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            /* route non disponible au premier chargement — ignorée */
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: nettoie les anciens caches (v1 → v2)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ============== PUSH NOTIFICATIONS ==============
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || 'AfriBiz';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/badge-72.png',
      data: data.data || {},
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // Fallback for plain text payload
    event.waitUntil(
      self.registration.showNotification('AfriBiz', { body: event.data.text() })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  const urlToOpen = new URL(target, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Fetch: stratégie Network First avec fallback cache
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les API calls, les requêtes non-GET ou les flux temps réel
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;
  if (event.request.url.includes('/socket.io/')) return;
  if (event.request.url.includes('chrome-extension')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache les réponses réussies
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback vers le cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Pour les pages HTML, rediriger vers l'offline
          if (event.request.headers.get('Accept')?.includes('text/html')) {
            return caches.match('/offline');
          }
          return new Response('', { status: 408 });
        });
      })
  );
});
