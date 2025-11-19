'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { usersApi } from '@/lib/api';
import styles from './user-form.module.css';

interface UserFormProps {
  user?: User | null;
  currentUserRole?: 'user' | 'admin' | 'super_admin';
  onSave: () => void;
  onCancel: () => void;
}

export default function UserForm({ user, currentUserRole, onSave, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user' as 'user' | 'admin' | 'super_admin',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        password: '',
        name: user.name || '',
        role: user.role || 'user',
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    } else {
      // Lors de la création, si l'utilisateur actuel est admin, forcer le rôle à 'user'
      if (currentUserRole === 'admin') {
        setFormData(prev => ({ ...prev, role: 'user' }));
      }
    }
  }, [user, currentUserRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        isActive: formData.isActive,
      };

      if (user) {
        // Mise à jour
        if (formData.password) {
          submitData.password = formData.password;
        }
        await usersApi.update(user.id, submitData);
      } else {
        // Création
        if (!formData.password) {
          setError('Le mot de passe est requis pour la création');
          setLoading(false);
          return;
        }
        submitData.password = formData.password;
        await usersApi.create(submitData);
      }

      onSave();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  // Déterminer les rôles disponibles selon l'utilisateur connecté
  const availableRoles = currentUserRole === 'admin' 
    ? ['user'] // Les admins ne peuvent créer que des utilisateurs simples
    : ['user', 'admin', 'super_admin']; // Les super_admins peuvent créer tous les rôles

  return (
    <div className={styles.container}>
      <h2>{user ? 'Modifier un utilisateur' : 'Créer un nouvel utilisateur'}</h2>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className="label">
            Nom complet *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="input"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className="label">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={!!user}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className="label">
            Mot de passe {user ? '(laisser vide pour ne pas modifier)' : '*'}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            value={formData.password}
            onChange={handleChange}
            required={!user}
            minLength={6}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="role" className="label">
            Rôle *
          </label>
          <select
            id="role"
            name="role"
            className="input"
            value={formData.role}
            onChange={handleChange}
            required
            disabled={currentUserRole === 'admin' && !user} // Désactiver le select pour les admins lors de la création
          >
            {availableRoles.includes('user') && <option value="user">Utilisateur</option>}
            {availableRoles.includes('admin') && <option value="admin">Administrateur</option>}
            {availableRoles.includes('super_admin') && <option value="super_admin">Super Admin</option>}
          </select>
          {currentUserRole === 'admin' && !user && (
            <p className={styles.hint}>
              Les administrateurs peuvent uniquement créer des utilisateurs simples.
            </p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            Compte actif
          </label>
        </div>

        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Enregistrement...' : user ? 'Modifier' : 'Créer'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
            disabled={loading}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
