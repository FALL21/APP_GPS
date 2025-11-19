'use client';

import { User, Location } from '@/types';
import dynamic from 'next/dynamic';
import styles from './dashboard.module.css';
import ProdisLogo from '@/components/Brand/ProdisLogo';

const MapComponent = dynamic(() => import('@/components/Map/MapComponent'), {
  ssr: false,
});

interface UserDashboardProps {
  user: User | null;
  isTracking: boolean;
  currentLocation: Location | null;
  locations: Location[];
  onStartTracking: () => void;
  onStopTracking: () => void;
  onLogout: () => void;
}

export default function UserDashboard({
  user,
  isTracking,
  currentLocation,
  locations,
  onStartTracking,
  onStopTracking,
  onLogout,
}: UserDashboardProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.branding}>
            <div className={styles.logoWrapper}>
              <ProdisLogo className={styles.logoImage} width={120} height={80} />
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>PRODIS GPS</span>
              <span className={styles.brandSubtitle}>Mon Tableau de Bord</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.userName}>{user?.name}</span>
            <button onClick={onLogout} className={`btn btn-outline ${styles.logoutButton}`}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.controls}>
          <button
            onClick={isTracking ? onStopTracking : onStartTracking}
            className={`btn ${isTracking ? 'btn-secondary' : 'btn-primary'}`}
          >
            {isTracking ? '🛑 Arrêter le suivi' : '📍 Démarrer le suivi'}
          </button>

          {currentLocation && (
            <div className={styles.locationInfo}>
              <h3>Position actuelle</h3>
              <p>
                <strong>Emplacement:</strong> {currentLocation.address || 'Adresse non disponible'}
              </p>
              {currentLocation.speed && (
                <p>
                  <strong>Vitesse:</strong> {Number(currentLocation.speed).toFixed(1)} km/h
                </p>
              )}
              <p>
                <strong>Dernière mise à jour:</strong>{' '}
                {new Date(currentLocation.timestamp).toLocaleString('fr-FR')}
              </p>
            </div>
          )}
        </div>

        <div className={styles.mapContainer}>
          <MapComponent
            currentLocation={currentLocation}
            locations={locations}
            height="600px"
          />
        </div>

        {/* Section Historique des positions retirée sur demande */}
      </main>
    </div>
  );
}
