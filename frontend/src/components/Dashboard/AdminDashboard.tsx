'use client';

import { useCallback, useEffect, useState } from 'react';
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

interface AdminDashboardProps {
  user: User | null;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'map' | 'users' | 'activity' | 'routes'>('map');
  const [activities, setActivities] = useState<GpsActivity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [activityData, usersData, locationsData] = await Promise.all([
        locationApi.getActivity(),
        usersApi.list({ limit: 100 }), // Le backend filtre automatiquement par createdById
        locationApi.getAll(),
      ]);

      setActivities(activityData);
      setUsers(usersData.data);
      // Filtrer les locations pour ne montrer que celles des utilisateurs créés par cet admin
      const userIds = usersData.data.map((u: User) => u.id);
      setAllLocations(locationsData.filter((location: Location) => userIds.includes(location.userId)));
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeSocket = useCallback(() => {
    socketService.connect();
    
    // Écouter les mises à jour de position de tous les utilisateurs
    socketService.onLocationUpdate((data) => {
      // Recharger les données qui filtreront automatiquement pour ne garder que les utilisateurs créés par cet admin
      loadData();
    });
  }, [loadData]);

  useEffect(() => {
    loadData();
    initializeSocket();

    return () => {
      socketService.disconnect();
    };
  }, [loadData, initializeSocket]);

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    setActiveTab('map');
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowCreateModal(true);
  };

  const handleUserSaved = () => {
    setEditingUser(null);
    setShowCreateModal(false);
    loadData();
    // Notification système si disponible
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Utilisateur créé', { body: 'Le compte a été créé avec succès.' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  };

  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setShowCreateModal(true);
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await usersApi.delete(userId);
      await loadData();
    } catch (error) {
      alert("Erreur lors de la suppression de l'utilisateur");
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
              <span className={styles.brandSubtitle}>Espace Administration</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.userName}>{user?.name} (Admin)</span>
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
            onCreate={handleCreateUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onBulkDelete={async (ids: number[]) => {
              try {
                await Promise.all(ids.map((id) => usersApi.delete(id)));
                await loadData();
              } catch (error) {
                alert('Erreur lors de la suppression multiple');
              }
            }}
            onRefresh={loadData}
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
