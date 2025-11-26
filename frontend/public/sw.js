// Service Worker pour PRODIS GPS - Persistance en arrière-plan
const CACHE_NAME = 'prodis-gps-v1';
const API_CACHE_NAME = 'prodis-gps-api-v1';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation du Service Worker');
  self.skipWaiting(); // Activer immédiatement
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation du Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim(); // Prendre le contrôle immédiatement
});

// Intercepter les requêtes réseau
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas intercepter les requêtes WebSocket
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Cache des requêtes API de localisation
  if (url.pathname.includes('/locations') && request.method === 'POST') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Mettre en cache la réponse pour récupération ultérieure
          const responseClone = response.clone();
          caches.open(API_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // En cas d'échec, essayer de récupérer depuis le cache
          return caches.match(request);
        })
    );
    return;
  }

  // Pour les autres requêtes, stratégie réseau d'abord
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background Sync pour synchroniser les positions en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync déclenché:', event.tag);
  
  if (event.tag === 'sync-locations') {
    event.waitUntil(syncLocations());
  }
});

// Fonction pour synchroniser les positions mises en cache
async function syncLocations() {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.method === 'POST' && request.url.includes('/locations')) {
        try {
          const response = await fetch(request.clone());
          if (response.ok) {
            await cache.delete(request);
            console.log('[SW] Position synchronisée avec succès');
          }
        } catch (error) {
          console.error('[SW] Erreur lors de la synchronisation:', error);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Erreur lors de la synchronisation des positions:', error);
  }
}

// Écouter les messages du client
self.addEventListener('message', (event) => {
  console.log('[SW] Message reçu:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SYNC_LOCATIONS') {
    event.waitUntil(syncLocations());
  }
});

// Notification périodique pour maintenir l'application active (toutes les 5 minutes)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'keep-alive') {
    event.waitUntil(keepAlive());
  }
});

async function keepAlive() {
  try {
    // Envoyer un message à tous les clients pour maintenir la connexion
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'KEEP_ALIVE' });
    });
    console.log('[SW] Keep-alive envoyé à', clients.length, 'clients');
  } catch (error) {
    console.error('[SW] Erreur keep-alive:', error);
  }
}


