# Guide de Création d'un Super Admin

Ce guide explique les différentes méthodes pour créer un compte super admin dans l'application PRODIS GPS.

## Méthode 1 : Page dédiée avec code secret (Premier super admin)

Cette méthode est recommandée pour créer le **premier super admin** de l'application.

### Étapes :

1. **Configurer le code secret** dans Railway (ou votre environnement) :
   - Variable d'environnement : `SUPER_ADMIN_SECRET_CODE`
   - Valeur par défaut : `PRODIS_SUPER_ADMIN_2024`
   - **⚠️ Important** : Changez cette valeur en production !

2. **Accéder à la page de création** :
   - URL : `https://votre-frontend.railway.app/create-super-admin`
   - Ou localement : `http://localhost:8080/create-super-admin`

3. **Remplir le formulaire** :
   - Nom complet
   - Email
   - Mot de passe (minimum 6 caractères)
   - Code secret (doit correspondre à `SUPER_ADMIN_SECRET_CODE`)

4. **Sécurité** :
   - Cette méthode ne fonctionne que s'il n'existe **aucun super admin** dans la base de données
   - Si un super admin existe déjà, vous devez utiliser la méthode 2

## Méthode 2 : Interface Admin (Super admin existant requis)

Si vous êtes déjà connecté en tant que super admin, vous pouvez créer d'autres super admins via l'interface d'administration.

### Étapes :

1. **Se connecter** en tant que super admin
2. **Aller dans l'onglet "Utilisateurs"**
3. **Cliquer sur "Créer un utilisateur"**
4. **Sélectionner "Super Admin"** dans le menu déroulant des rôles
5. **Remplir les informations** et créer l'utilisateur

### Limitations :

- Seuls les **super admins** peuvent créer d'autres super admins
- Les **admins** ne peuvent créer que des utilisateurs simples (`user`)

## Méthode 3 : API Directe (Pour scripts/automatisation)

### Endpoint : `POST /auth/create-super-admin`

**Requête :**
```json
{
  "email": "admin@example.com",
  "password": "motdepasse123",
  "name": "Super Admin",
  "secretCode": "PRODIS_SUPER_ADMIN_2024"
}
```

**Réponse (succès) :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Super Admin",
    "role": "super_admin"
  },
  "message": "Super admin créé avec succès"
}
```

**Erreurs possibles :**
- `401 Unauthorized` : Code secret invalide
- `409 Conflict` : Email déjà utilisé ou super admin existe déjà

## Configuration Railway

Pour configurer le code secret sur Railway :

1. Ouvrez votre service **Backend** dans Railway
2. Allez dans l'onglet **Variables**
3. Ajoutez la variable :
   - **Nom** : `SUPER_ADMIN_SECRET_CODE`
   - **Valeur** : Votre code secret personnalisé (ex: `MonCodeSecret2024!`)

4. **Redéployez** le service backend pour que la variable soit prise en compte

## Sécurité

### Bonnes pratiques :

1. **Changez le code secret par défaut** en production
2. **Utilisez un code secret fort** (minimum 16 caractères, mélange de lettres, chiffres et caractères spéciaux)
3. **Ne partagez pas le code secret** publiquement
4. **Limitez l'accès** à la page `/create-super-admin` si possible (par exemple, via un firewall ou une authentification supplémentaire)

### Exemple de code secret fort :
```
PRODIS_SA_2024_Xk9#mP2$vL7@nQ5
```

## Vérification

Pour vérifier qu'un utilisateur est bien super admin :

1. Connectez-vous avec cet utilisateur
2. Vérifiez que vous avez accès à toutes les fonctionnalités d'administration
3. Vérifiez que vous pouvez créer d'autres super admins via l'interface

## Dépannage

### Erreur : "Un super admin existe déjà"
- **Solution** : Utilisez la méthode 2 (interface admin) ou connectez-vous en tant que super admin existant

### Erreur : "Code secret invalide"
- **Vérifiez** que la variable `SUPER_ADMIN_SECRET_CODE` est correctement configurée dans Railway
- **Vérifiez** que vous utilisez exactement le même code (sensible à la casse)
- **Redéployez** le backend après avoir modifié la variable

### Erreur : "Cet email est déjà utilisé"
- L'email existe déjà dans la base de données
- Utilisez un autre email ou connectez-vous avec le compte existant

