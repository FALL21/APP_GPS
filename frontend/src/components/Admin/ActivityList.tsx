'use client';

import { GpsActivity } from '@/types';
import styles from './activity-list.module.css';

interface ActivityListProps {
  activities: GpsActivity[];
  onRefresh?: () => void;
}

export default function ActivityList({ activities, onRefresh }: ActivityListProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Activité GPS des Utilisateurs</h2>
        {onRefresh && (
          <button onClick={onRefresh} className="btn btn-outline">
            🔄 Actualiser
          </button>
        )}
      </div>

      <div className={styles.list}>
        {activities.length === 0 ? (
          <div className={styles.noData}>Aucune activité enregistrée</div>
        ) : (
          activities.map((activity) => (
            <div key={activity.userId} className={styles.activityItem}>
              <div className={styles.activityHeader}>
                <div>
                  <h3>{activity.userName}</h3>
                  <p className={styles.email}>{activity.userEmail}</p>
                </div>
                <div className={styles.status}>
                  <span
                    className={`${styles.statusBadge} ${
                      activity.isTracking ? styles.active : styles.inactive
                    }`}
                  >
                    {activity.isTracking ? '🟢 GPS Actif' : '🔴 GPS Inactif'}
                  </span>
                </div>
              </div>

              <div className={styles.activityDetails}>
                <div className={styles.detail}>
                  <strong>Rôle:</strong> {activity.userRole}
                </div>
                <div className={styles.detail}>
                  <strong>Dernière mise à jour:</strong>{' '}
                  {activity.lastUpdate
                    ? new Date(activity.lastUpdate).toLocaleString('fr-FR')
                    : 'Jamais'}
                </div>
                {activity.lastLocation && (
                  <div className={styles.detail}>
                    <strong>Dernière position:</strong>{' '}
                    {Number(activity.lastLocation.latitude).toFixed(6)}, {Number(activity.lastLocation.longitude).toFixed(6)}
                  </div>
                )}
                <div className={styles.detail}>
                  <strong>Total positions enregistrées:</strong> {activity.totalLocations || 0}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
