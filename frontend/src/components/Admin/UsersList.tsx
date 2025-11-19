'use client';

import { useState } from 'react';
import { User } from '@/types';
import styles from './users-list.module.css';

interface UsersListProps {
  users: User[];
  onUserSelect?: (userId: number) => void;
  onEdit?: (user: User) => void;
  onDelete?: (userId: number) => void;
  onRefresh?: () => void;
  onCreate?: () => void;
  onBulkDelete?: (userIds: number[]) => void;
  filters?: {
    search?: string;
    role?: string;
    isActive?: boolean;
  };
  onFiltersChange?: (filters: any) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function UsersList({
  users,
  onUserSelect,
  onEdit,
  onDelete,
  onRefresh,
  onCreate,
  onBulkDelete,
  filters = {},
  onFiltersChange,
  canEdit = false,
  canDelete = false,
}: UsersListProps) {
  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      user: 'Utilisateur',
      admin: 'Administrateur',
      super_admin: 'Super Admin',
    };
    return labels[role] || role;
  };

  const getRoleBadgeClass = (role: string) => {
    const classes: { [key: string]: string } = {
      user: styles.badgeUser,
      admin: styles.badgeAdmin,
      super_admin: styles.badgeSuperAdmin,
    };
    return classes[role] || '';
  };

  // Sélection multiple (visible seulement si suppression autorisée)
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allSelected = selectedIds.length > 0 && selectedIds.length === users.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? users.map(u => u.id) : []);
  };

  const toggleSelect = (userId: number, checked: boolean) => {
    setSelectedIds(prev => checked ? Array.from(new Set([...prev, userId])) : prev.filter(id => id !== userId));
  };

  const handleBulkDelete = () => {
    if (!canDelete || !onBulkDelete || selectedIds.length === 0) return;
    if (!confirm(`Supprimer ${selectedIds.length} utilisateur(s) ?`)) return;
    onBulkDelete(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Liste des Utilisateurs ({users.length})</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onCreate && (
            <button onClick={onCreate} className="btn btn-primary">
              ➕ Créer Utilisateur
            </button>
          )}
          {onRefresh && (
            <button onClick={onRefresh} className="btn btn-outline">
              🔄 Actualiser
            </button>
          )}
        </div>
      </div>

      {onFiltersChange && (
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            className="input"
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
          <select
            className="input"
            value={filters.role || ''}
            onChange={(e) => onFiltersChange({ ...filters, role: e.target.value || undefined })}
          >
            <option value="">Tous les rôles</option>
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select
            className="input"
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={(e) => onFiltersChange({
              ...filters,
              isActive: e.target.value === '' ? undefined : e.target.value === 'true',
            })}
          >
            <option value="">Tous les statuts</option>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </div>
      )}

      <div className={styles.table}>
        {canDelete && selectedIds.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div>{selectedIds.length} sélectionné(s)</div>
            {onBulkDelete && (
              <button className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={handleBulkDelete}>
                🗑️ Supprimer la sélection
              </button>
            )}
          </div>
        )}
        <table>
          <thead>
            <tr>
              {canDelete && (
                <th>
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Date de création</th>
              {(canEdit || canDelete || onUserSelect) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={canDelete ? 7 : 6} className={styles.noData}>
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  {canDelete && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={(e) => toggleSelect(user.id, e.target.checked)}
                      />
                    </td>
                  )}
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.badge} ${getRoleBadgeClass(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${user.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  {(canEdit || canDelete || onUserSelect) && (
                    <td>
                      <div className={styles.actions}>
                        {onUserSelect && (
                          <button
                            onClick={() => onUserSelect(user.id)}
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          >
                            📍 Voir
                          </button>
                        )}
                        {canEdit && onEdit && (
                          <button
                            onClick={() => onEdit(user)}
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          >
                            ✏️ Modifier
                          </button>
                        )}
                        {canDelete && onDelete && (
                          <button
                            onClick={() => {
                              if (confirm('Supprimer cet utilisateur ?')) onDelete(user.id);
                            }}
                            className="btn btn-outline"
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.875rem',
                              color: '#ef4444',
                              borderColor: '#ef4444',
                            }}
                          >
                            🗑️ Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
