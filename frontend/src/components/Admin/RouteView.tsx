'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Location } from '@/types';
import { locationApi } from '@/lib/api';
import dynamic from 'next/dynamic';
import styles from './route-view.module.css';

const RouteMapComponent = dynamic(() => import('@/components/Map/RouteMapComponent'), {
  ssr: false,
});

interface RouteViewProps {
  users: User[];
}

export default function RouteView({ users }: RouteViewProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [range, setRange] = useState<'24h' | '48h' | '72h'>('24h');
  const [routeLocations, setRouteLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadRoute = useCallback(async () => {
    if (!selectedUserId) return;
    
    setLoading(true);
    setError('');
    try {
      const locations = await locationApi.getRoute(selectedUserId, range);
      setRouteLocations(locations);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'itinéraire');
      setRouteLocations([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, range]);

  useEffect(() => {
    if (selectedUserId) {
      loadRoute();
    } else {
      setRouteLocations([]);
    }
  }, [selectedUserId, loadRoute]);

  const selectedUser = users.find(u => u.id === selectedUserId);
  const firstLocation = routeLocations[0];
  const lastLocation = routeLocations[routeLocations.length - 1];

  const formatLocationAddress = (location?: Location) => {
    if (!location) return 'Non disponible';
    if (location.address && location.address.trim() !== '') {
      return location.address;
    }
    const lat = Number(location.latitude);
    const lng = Number(location.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    return 'Non disponible';
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label htmlFor="user-select" className="label">
            Sélectionner un utilisateur
          </label>
          <select
            id="user-select"
            className="input"
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">-- Sélectionner un utilisateur --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor="range-select" className="label">
            Période
          </label>
          <select
            id="range-select"
            className="input"
            value={range}
            onChange={(e) => setRange(e.target.value as '24h' | '48h' | '72h')}
            disabled={!selectedUserId}
          >
            <option value="24h">24 dernières heures</option>
            <option value="48h">48 dernières heures</option>
            <option value="72h">72 dernières heures</option>
          </select>
        </div>

        {selectedUserId && (
          <button
            onClick={loadRoute}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Chargement...' : '🔄 Actualiser'}
          </button>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {selectedUserId && routeLocations.length === 0 && !loading && !error && (
        <div className={styles.info}>
          Aucune position enregistrée pour cette période.
        </div>
      )}

      <div className={styles.mapContainer}>
        {selectedUserId ? (
          <RouteMapComponent locations={routeLocations} user={selectedUser} height="550px" />
        ) : (
          <div className={styles.placeholder}>Sélectionnez un utilisateur pour afficher l&rsquo;itinéraire.</div>
        )}
      </div>

      {routeLocations.length > 0 && (
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <strong>Début:</strong> {new Date(routeLocations[0].timestamp).toLocaleString('fr-FR')}
            <div className={styles.subText}>
              Emplacement: {formatLocationAddress(firstLocation)}
            </div>
          </div>
          <div className={styles.statItem}>
            <strong>Fin:</strong> {new Date(routeLocations[routeLocations.length - 1].timestamp).toLocaleString('fr-FR')}
            <div className={styles.subText}>
              Emplacement: {formatLocationAddress(lastLocation)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

