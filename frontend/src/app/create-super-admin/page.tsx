'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import styles from '../login/login.module.css';

export default function CreateSuperAdminPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    secretCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/create-super-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création du super admin');
      }

      // Sauvegarder le token et rediriger
      if (data.accessToken) {
        document.cookie = `token=${data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
        document.cookie = `user=${JSON.stringify(data.user)}; path=/; max-age=${7 * 24 * 60 * 60}`;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du super admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoSection}>
          <h1>PRODIS GPS</h1>
          <p>Création d&apos;un Super Admin</p>
        </div>

        {error && (
          <div className={styles.error} style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nom complet</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Votre nom"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="votre@email.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              placeholder="Minimum 6 caractères"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="secretCode">Code secret</label>
            <input
              type="password"
              id="secretCode"
              value={formData.secretCode}
              onChange={(e) => setFormData({ ...formData, secretCode: e.target.value })}
              required
              minLength={8}
              placeholder="Code secret pour créer un super admin"
            />
            <small style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Le code secret est défini dans la variable d&apos;environnement SUPER_ADMIN_SECRET_CODE
            </small>
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer le Super Admin'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <a href="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}


