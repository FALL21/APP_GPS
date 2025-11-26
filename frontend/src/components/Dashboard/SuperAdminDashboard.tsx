'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, GpsActivity, Location } from '@/types';
import { locationApi, usersApi } from '@/lib/api';
import { socketService } from '@/lib/socket';
import dynamic from 'next/dynamic';
import styles from './dashboard.module.css';
import UsersList from '@/components/Admin/UsersList';
import ActivityList from '@/components/Admin/ActivityList';
import UserForm from '@/components/Admin/UserForm';
import RouteView from '@/components/Admin/RouteView';
import Modal from '@/components/Common/Modal';
import ProdisLogo from '@/components/Brand/ProdisLogo';

const MapComponent = dynamic(() => import('@/components/Map/AdminMapComponent'), {
  ssr: false,
});

interface SuperAdminDashboardProps {
  user: User | null;
  onLogout: () => void;
}

export default function SuperAdminDashboard({ user, onLogout }: SuperAdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'map' | 'users' | 'activity' | 'routes'>('map');
  const [activities, setActivities] = useState<GpsActivity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: undefined as boolean | undefined,
  });
  const filtersRef = useRef(filters);

  const loadData = useCallback(async (overrideFilters?: typeof filters) => {
    try {
      const params = overrideFilters ?? filtersRef.current;
      const [activityData, usersData, locationsData] = await Promise.all([
        locationApi.getActivity(),
        usersApi.list({ ...params, limit: 100 }),
        locationApi.getAll(),
      ]);

      setActivities(activityData);
      setUsers(usersData.data);
      setAllLocations(locationsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeSocket = useCallback(() => {
    socketService.connect();
    
    const handleLocationUpdate = (data: { userId: number; location: any }) => {
      console.log('[SuperAdmin] Location update received:', data);
      setActivities(prev => {
        const exists = prev.some(activity => activity.userId === data.userId);
        if (!exists) {
          console.log(`[SuperAdmin] User ${data.userId} not in activities, skipping update`);
          return prev;
        }
        return prev.map(activity =>
          activity.userId === data.userId
            ? {
                ...activity,
                lastLocation: {
                  id: data.location.id ?? activity.lastLocation?.id ?? 0,
                  userId: data.userId,
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                  speed: data.location.speed ?? null,
                  heading: data.location.heading ?? null,
                  timestamp: data.location.timestamp ?? new Date().toISOString(),
                  address: data.location.address ?? activity.lastLocation?.address,
                },
                lastUpdate: data.location.timestamp ?? new Date().toISOString(),
                isTracking: true,
              }
            : activity
        );
      });

      setAllLocations(prev => [data.location, ...prev].slice(0, 500));
    };
    
    socketService.onLocationUpdate(handleLocationUpdate);
    
    // Refresh aggregated lists periodically to keep filters/users in sync
    // Mais ne pas recharger tout à chaque update pour éviter les flickers
  }, []);

  useEffect(() => {
    filtersRef.current = filters;
    loadData(filters);
  }, [filters, loadData]);

  useEffect(() => {
    initializeSocket();

    return () => {
      socketService.disconnect();
    };
  }, [initializeSocket]);

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    setActiveTab('map');
  };

  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setShowCreateModal(true);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowCreateModal(true);
  };

  const handleUserSaved = () => {
    setEditingUser(null);
    setShowCreateModal(false);
    loadData();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Utilisateur créé', { body: 'Le compte a été créé avec succès.' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await usersApi.delete(userId);
        loadData();
      } catch (error) {
        alert('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Chargement...</div>
      </div>
    );
  }

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
              <span className={styles.brandSubtitle}>Super Administration</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.userName}>{user?.name} (Super Admin)</span>
            <button onClick={onLogout} className={`btn btn-outline ${styles.logoutButton}`}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'map' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('map')}
        >
          🗺️ Carte
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Utilisateurs
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'activity' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📊 Activité GPS
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'routes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          🗺️ Itinéraires
        </button>
        {/* Bouton de création retiré de la barre d'onglets (création via la liste) */}
      </div>

      <main className={styles.main}>
        {activeTab === 'map' && (
          <div className={styles.mapContainer}>
            <MapComponent
              activities={activities}
              allLocations={allLocations}
              selectedUserId={selectedUserId}
              onUserSelect={handleUserSelect}
              height="700px"
            />
          </div>
        )}

        {activeTab === 'users' && (
          <UsersList
            users={users}
            onUserSelect={handleUserSelect}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onRefresh={loadData}
            onCreate={handleCreateUser}
            filters={filters}
            onFiltersChange={setFilters}
            canEdit={true}
            canDelete={true}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityList activities={activities} onRefresh={loadData} />
        )}

        {activeTab === 'routes' && (
          <RouteView users={users} />
        )}

        <Modal open={showCreateModal} title="Créer un utilisateur" onClose={() => setShowCreateModal(false)}>
          <UserForm
            user={editingUser}
            currentUserRole={user?.role}
            onSave={handleUserSaved}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      </main>
    </div>
  );
}
