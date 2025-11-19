# Comptes de Test

Ce document explique comment créer des comptes de test pour tester l'application avec les différents rôles.

## Méthode 1 : Script TypeScript (Recommandé)

Si le backend est démarré et accessible:

```bash
cd backend
npx ts-node scripts/create-test-users.ts
```

## Méthode 2 : Via l'interface web (Super Admin requis)

1. Connectez-vous d'abord en tant que super_admin (créez-en un via l'interface d'inscription si nécessaire)
2. Allez dans l'onglet "Créer Utilisateur"
3. Créez les comptes suivants:

### Utilisateur Simple
- Email: `user@test.com`
- Mot de passe: `password123`
- Nom: `Utilisateur Test`
- Rôle: `user`

### Admin
- Email: `admin@test.com`
- Mot de passe: `password123`
- Nom: `Admin Test`
- Rôle: `admin`

### Super Admin
- Email: `superadmin@test.com`
- Mot de passe: `password123`
- Nom: `Super Admin Test`
- Rôle: `super_admin`

## Méthode 3 : Script SQL Direct

1. Générez les hash de mots de passe:
```bash
node scripts/create-test-users.js
```

2. Connectez-vous à MySQL:
```bash
docker-compose exec mysql mysql -u gpsuser -pgpspassword gps_tracking
```

3. Exécutez les commandes SQL générées

## Méthode 4 : Via l'API HTTP (cURL)

### Créer un utilisateur simple (pas besoin d'authentification)
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123",
    "name": "Utilisateur Test"
  }'
```

### Créer admin/super_admin (nécessite un token JWT de super_admin)

1. Connectez-vous d'abord pour obtenir un token:
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@test.com","password":"password123"}' | jq -r '.accessToken')
```

2. Créez les autres comptes:
```bash
curl -X POST http://localhost:3001/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "name": "Admin Test",
    "role": "admin"
  }'
```

## Comptes de Test Créés

Une fois créés, vous pouvez utiliser ces comptes:

| Email | Mot de passe | Rôle | Accès |
|-------|--------------|------|-------|
| `user@test.com` | `password123` | Utilisateur | Dashboard utilisateur uniquement |
| `admin@test.com` | `password123` | Admin | Dashboard admin (carte, liste utilisateurs, activité) |
| `superadmin@test.com` | `password123` | Super Admin | Dashboard super admin (CRUD complet) |

## Permissions par Rôle

### Utilisateur (user)
- ✅ Se connecter
- ✅ Activer/désactiver son GPS
- ✅ Voir sa propre position
- ✅ Voir son historique

### Admin
- ✅ Toutes les fonctionnalités utilisateur
- ✅ Voir toutes les positions en temps réel
- ✅ Voir la liste des utilisateurs (lecture seule)
- ✅ Voir l'activité GPS consolidée
- ❌ Modifier/supprimer des utilisateurs
- ❌ Créer des super_admins

### Super Admin
- ✅ Toutes les fonctionnalités admin
- ✅ CRUD complet sur tous les utilisateurs
- ✅ Créer/modifier/supprimer des admins et super_admins
- ✅ Gestion complète du système
