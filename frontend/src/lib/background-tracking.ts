// Utilitaires pour le tracking en arrière-plan
// Combine Wake Lock API, Page Visibility API, et Service Worker

// Types pour Wake Lock API (non encore dans les types TypeScript standard)
interface WakeLockSentinel extends EventTarget {
  released: boolean;
  type: 'screen';
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
}

interface Navigator {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  };
}

export class BackgroundTrackingManager {
  private wakeLock: WakeLockSentinel | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private isPageVisible = true;
  private visibilityChangeHandler: (() => void) | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private watchId: number | null = null;

  constructor() {
    if (typeof window === 'undefined') return;
    this.init();
  }

  private async init() {
    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('[Background Tracking] Service Worker enregistré');

        // Écouter les mises à jour du Service Worker
        this.serviceWorkerRegistration.addEventListener('updatefound', () => {
          console.log('[Background Tracking] Nouvelle version du Service Worker disponible');
        });
      } catch (error) {
        console.error('[Background Tracking] Erreur lors de l\'enregistrement du Service Worker:', error);
      }
    }

    // Écouter les changements de visibilité
    this.setupVisibilityListener();
  }

  // Activer le Wake Lock pour empêcher l'écran de s'éteindre
  async requestWakeLock(): Promise<boolean> {
    if (!('wakeLock' in navigator)) {
      console.warn('[Background Tracking] Wake Lock API non supportée');
      return false;
    }

    try {
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('[Background Tracking] Wake Lock activé');

      // Écouter la libération du Wake Lock
      this.wakeLock?.addEventListener('release', () => {
        console.log('[Background Tracking] Wake Lock libéré');
        this.wakeLock = null;
      });

      return true;
    } catch (error: any) {
      console.error('[Background Tracking] Erreur Wake Lock:', error);
      // L'utilisateur a peut-être refusé ou l'écran s'est éteint
      if (error.name === 'NotAllowedError') {
        console.warn('[Background Tracking] Permission Wake Lock refusée');
      }
      return false;
    }
  }

  // Libérer le Wake Lock
  async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('[Background Tracking] Wake Lock libéré manuellement');
      } catch (error) {
        console.error('[Background Tracking] Erreur lors de la libération du Wake Lock:', error);
      }
    }
  }

  // Configurer l'écouteur de visibilité de la page
  private setupVisibilityListener() {
    if (typeof document === 'undefined') return;

    this.visibilityChangeHandler = () => {
      const wasVisible = this.isPageVisible;
      this.isPageVisible = !document.hidden;

      if (wasVisible && !this.isPageVisible) {
        console.log('[Background Tracking] Page en arrière-plan');
        // La page est passée en arrière-plan
        // Le Service Worker et le GPS Worker continueront de fonctionner
      } else if (!wasVisible && this.isPageVisible) {
        console.log('[Background Tracking] Page au premier plan');
        // La page est revenue au premier plan
        // Réactiver le Wake Lock si nécessaire
        if (this.wakeLock === null) {
          this.requestWakeLock();
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  // Démarrer le tracking avec toutes les optimisations
  async startTracking(
    onPositionUpdate: (location: any) => void,
    onError?: (error: any) => void
  ): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      throw new Error('geolocation-not-supported');
    }

    // 1. Activer le Wake Lock
    await this.requestWakeLock();

    // 2. Démarrer le suivi de géolocalisation côté main thread
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed ? position.coords.speed * 3.6 : undefined,
          heading: position.coords.heading || undefined,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        onPositionUpdate(locationData);
      },
      (error) => {
        if (error.code === 3) {
          console.warn('[Background Tracking] Timeout de géolocalisation, mais le suivi continue...');
          return;
        }

        if (error.code === 1 || error.code === 2) {
          this.stopTracking();
        }

        if (onError) {
          onError(error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    // 3. Démarrer le keep-alive
    this.startKeepAlive();

    // 4. Demander la synchronisation en arrière-plan
    if (this.serviceWorkerRegistration && 'sync' in this.serviceWorkerRegistration) {
      try {
        await (this.serviceWorkerRegistration as any).sync.register('sync-locations');
        console.log('[Background Tracking] Background Sync enregistré');
      } catch (error) {
        console.error('[Background Tracking] Erreur Background Sync:', error);
      }
    }

    return true;
  }

  // Arrêter le tracking
  async stopTracking(): Promise<void> {
    // 1. Arrêter la géolocalisation
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // 2. Libérer le Wake Lock
    await this.releaseWakeLock();

    // 3. Arrêter le keep-alive
    this.stopKeepAlive();
  }

  // Maintenir le Service Worker actif
  private startKeepAlive() {
    if (this.keepAliveInterval) {
      return;
    }

    // Envoyer un ping au Service Worker toutes les 2 minutes
    this.keepAliveInterval = setInterval(() => {
      if (this.serviceWorkerRegistration?.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'KEEP_ALIVE',
        });
      }
    }, 120000); // 2 minutes
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  // Nettoyer les ressources
  cleanup() {
    this.stopTracking();
    
    if (this.visibilityChangeHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }

  }

  // Vérifier si le tracking en arrière-plan est supporté
  static isSupported(): {
    serviceWorker: boolean;
    wakeLock: boolean;
    webWorker: boolean;
    backgroundSync: boolean;
  } {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      wakeLock: 'wakeLock' in navigator,
      webWorker: typeof Worker !== 'undefined',
      backgroundSync: 'serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any),
    };
  }
}

