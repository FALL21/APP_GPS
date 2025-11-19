'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { authApi, locationApi, usersApi } from '@/lib/api';
import { socketService } from '@/lib/socket';
import { Location, User, GpsActivity } from '@/types';
import styles from './dashboard.module.css';
import UserDashboard from '@/components/Dashboard/UserDashboard';
import AdminDashboard from '@/components/Dashboard/AdminDashboard';
import SuperAdminDashboard from '@/components/Dashboard/SuperAdminDashboard';

// Charger le composant de carte dynamiquement (car il utilise Leaflet qui nécessite window)
const MapComponent = dynamic(() => import('@/components/Map/MapComponent'), {
  ssr: false,
});

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInitialData = useCallback(async () => {
    try {
      const latest = await locationApi.getLatest();
      if (latest) {
        setCurrentLocation(latest);
      }

      const history = await locationApi.getHistory(undefined, 50);
      setLocations(history);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeSocket = useCallback(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) return;

    socketService.connect();
    socketService.joinTracking(currentUser.id);

    // Écouter les mises à jour de position
    socketService.onLocationUpdate((data) => {
      if (data.userId === currentUser.id) {
        setCurrentLocation(data.location);
        setLocations(prev => [data.location, ...prev].slice(0, 100));
      }
    });
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    const currentUser = authApi.getCurrentUser();
    if (!currentUser) return;

    setIsTracking(true);

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed ? (position.coords.speed * 3.6) : undefined, // Convertir m/s en km/h
          heading: position.coords.heading || undefined,
        };

        try {
          // Sauvegarder via l'API
          const savedLocation = await locationApi.create(locationData);
          setCurrentLocation(savedLocation);
          setLocations(prev => [savedLocation, ...prev].slice(0, 100));

          // Émettre via WebSocket pour les autres clients
          socketService.updateLocation(currentUser.id, locationData);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde de la position:', error);
        }
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        alert('Erreur de géolocalisation. Vérifiez les permissions de votre navigateur.');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    watchIdRef.current = id;
  };

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    // Vérifier l'authentification
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);
    loadInitialData();
    initializeSocket();

    return () => {
      stopTracking();
      socketService.disconnect();
    };
  }, [router, loadInitialData, initializeSocket, stopTracking]);

  const handleLogout = () => {
    authApi.logout();
    stopTracking();
    socketService.disconnect();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Chargement...</div>
      </div>
    );
  }

  // Afficher le dashboard selon le rôle
  if (user?.role === 'super_admin') {
    return (
      <SuperAdminDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  if (user?.role === 'admin') {
    return (
      <AdminDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // Dashboard utilisateur simple
  return (
    <UserDashboard
      user={user}
      isTracking={isTracking}
      currentLocation={currentLocation}
      locations={locations}
      onStartTracking={startTracking}
      onStopTracking={stopTracking}
      onLogout={handleLogout}
    />
  );
}
