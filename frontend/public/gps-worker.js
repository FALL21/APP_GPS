// Web Worker pour le tracking GPS - Exécution isolée
let watchId = null;
let isTracking = false;

// Écouter les messages du thread principal
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'START_TRACKING':
      startTracking(data);
      break;
    case 'STOP_TRACKING':
      stopTracking();
      break;
    case 'PING':
      // Répondre pour maintenir le worker actif
      self.postMessage({ type: 'PONG' });
      break;
    default:
      console.log('[GPS Worker] Type de message inconnu:', type);
  }
});

function startTracking(options = {}) {
  if (isTracking) {
    console.log('[GPS Worker] Le tracking est déjà actif');
    return;
  }

  if (!self.navigator.geolocation) {
    self.postMessage({
      type: 'ERROR',
      error: 'La géolocalisation n\'est pas supportée',
    });
    return;
  }

  isTracking = true;
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
  } = options;

  watchId = self.navigator.geolocation.watchPosition(
    (position) => {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed ? position.coords.speed * 3.6 : undefined,
        heading: position.coords.heading || undefined,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      // Envoyer la position au thread principal
      self.postMessage({
        type: 'POSITION_UPDATE',
        location: locationData,
      });
    },
    (error) => {
      // Ne pas arrêter le tracking pour les timeouts
      if (error.code === 3) {
        console.warn('[GPS Worker] Timeout de géolocalisation, mais le suivi continue...');
        return;
      }

      // Arrêter le tracking pour les autres erreurs
      if (error.code === 1 || error.code === 2) {
        isTracking = false;
        if (watchId !== null) {
          self.navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
      }

      self.postMessage({
        type: 'ERROR',
        error: {
          code: error.code,
          message: error.message,
        },
      });
    },
    {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }
  );

  self.postMessage({ type: 'TRACKING_STARTED' });
}

function stopTracking() {
  if (!isTracking || watchId === null) {
    return;
  }

  self.navigator.geolocation.clearWatch(watchId);
  watchId = null;
  isTracking = false;

  self.postMessage({ type: 'TRACKING_STOPPED' });
}

// Envoyer un ping périodique pour maintenir le worker actif
setInterval(() => {
  if (isTracking) {
    self.postMessage({ type: 'WORKER_ALIVE' });
  }
}, 30000); // Toutes les 30 secondes

