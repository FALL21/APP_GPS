# Création du Compte Super Admin

## Méthode 1 : Via l'Endpoint API (Recommandé)

Une fois que Railway a redéployé le backend avec le nouvel endpoint, tu peux créer le compte super admin en appelant l'API :

### Étape 1 : Récupérer l'URL du backend

1. Va sur [Railway](https://railway.app)
2. Ouvre ton projet
3. Clique sur le service **Backend**
4. Va dans l'onglet **Settings** → **Networking**
5. Copie l'URL du domaine (ex: `https://backend-production-ee03.up.railway.app`)

### Étape 2 : Créer le compte super admin

Utilise `curl` ou un outil comme Postman pour appeler l'endpoint :

```bash
curl -X POST https://<TON-BACKEND-URL>.up.railway.app/auth/seed-super-admin
```

**Remplace `<TON-BACKEND-URL>` par l'URL réelle de ton backend.**

Exemple :
```bash
curl -X POST https://backend-production-ee03.up.railway.app/auth/seed-super-admin
```

### Réponse attendue

Si le compte est créé avec succès, tu recevras :
```json
{
  "message": "Super admin créé avec succès",
  "email": "superadmin@gsp.com"
}
```

Si un super admin existe déjà :
```json
{
  "message": "Un super admin existe déjà",
  "email": "superadmin@gsp.com"
}
```

### Informations de connexion

Une fois le compte créé, tu peux te connecter avec :
- **Email** : `superadmin@gsp.com`
- **Mot de passe** : `GPS@2025`
- **Rôle** : `super_admin`

---

## Méthode 2 : Via Railway Shell (Alternative)

Si tu préfères utiliser Railway CLI :

### Étape 1 : Installer Railway CLI (si pas déjà fait)

```bash
npm i -g @railway/cli
railway login
```

### Étape 2 : Se connecter au shell du backend

```bash
railway shell --service backend
```

### Étape 3 : Exécuter le script de seed

```bash
npm run seed:super-admin
```

### Étape 4 : Quitter le shell

```bash
exit
```

---

## Méthode 3 : Via l'Interface Web (Postman/Insomnia)

1. Ouvre Postman ou Insomnia
2. Crée une nouvelle requête **POST**
3. URL : `https://<TON-BACKEND-URL>.up.railway.app/auth/seed-super-admin`
4. Méthode : **POST**
5. Envoie la requête

---

## Vérification

Après avoir créé le compte, tu peux vérifier qu'il fonctionne en te connectant via l'interface frontend :

1. Va sur l'URL de ton frontend (ex: `https://prodis-gps.up.railway.app`)
2. Clique sur **Se connecter**
3. Entre :
   - Email : `superadmin@gsp.com`
   - Mot de passe : `GPS@2025`
4. Tu devrais être connecté en tant que **Super Admin**

---

## Sécurité

⚠️ **Important** : L'endpoint `/auth/seed-super-admin` est sécurisé :
- Il ne peut créer qu'**un seul** super admin
- Si un super admin existe déjà, il retourne un message d'information
- Il ne peut pas être utilisé pour créer plusieurs super admins

Une fois que tu as créé le compte super admin, tu peux (optionnellement) supprimer cet endpoint pour plus de sécurité, mais ce n'est pas nécessaire car il est déjà protégé.

