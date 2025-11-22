# Correction du problème de démarrage du Backend sur Railway

## Problème
Le backend ne démarre pas avec l'erreur : `Cannot find module '/app/dist/main.js'`

## Causes possibles

### 1. Railway utilise les commandes npm au lieu du Dockerfile

Si tu as configuré les commandes dans Railway Settings, Railway peut ignorer le Dockerfile.

**Solution :** Vérifie dans Railway → Backend Service → Settings :

#### Option A : Utiliser le Dockerfile (Recommandé)
1. Va dans **Settings** → **Build & Deploy**
2. **Désactive** ou **supprime** les commandes personnalisées :
   - Laisse **vide** : `Install Command`
   - Laisse **vide** : `Build Command`  
   - Laisse **vide** : `Start Command`
3. Railway utilisera automatiquement le `Dockerfile` présent dans le dossier `backend/`

#### Option B : Utiliser les commandes npm (Alternative)
Si tu préfères utiliser les commandes npm, assure-toi que :
1. **Root Directory** : `backend`
2. **Install Command** : `npm install` (ou `npm ci`)
3. **Build Command** : `npm run build`
4. **Start Command** : `npm run start:prod`

⚠️ **Important** : Si tu utilises les commandes npm, assure-toi que le dossier `dist/` est bien généré après le build.

---

## Vérification

### 1. Vérifier les logs de build

Dans Railway → Backend Service → **Build Logs**, tu devrais voir :
```
✅ dist/main.js existe
```

Si tu vois :
```
❌ ERREUR: dist/main.js n'existe pas après le build!
```

Cela signifie que le build a échoué ou que les fichiers ne sont pas au bon endroit.

### 2. Vérifier les logs de déploiement

Dans Railway → Backend Service → **Deploy Logs**, tu devrais voir :
```
🚀 Backend GPS démarré sur le port 3001
```

Si tu vois toujours `Cannot find module '/app/dist/main.js'`, cela signifie que :
- Le build n'a pas généré les fichiers
- Les fichiers ne sont pas au bon endroit
- Railway utilise les mauvaises commandes

---

## Solution recommandée

### Utiliser le Dockerfile (Recommandé)

1. **Dans Railway** → Backend Service → **Settings** → **Build & Deploy** :
   - **Root Directory** : `backend`
   - **Install Command** : **LAISSE VIDE**
   - **Build Command** : **LAISSE VIDE**
   - **Start Command** : **LAISSE VIDE**

2. Railway détectera automatiquement le `Dockerfile` dans `backend/Dockerfile` et l'utilisera.

3. Le Dockerfile fait :
   - Build dans un conteneur temporaire
   - Copie `dist/` dans le conteneur final
   - Lance `node dist/main.js`

### Alternative : Utiliser les commandes npm

Si tu préfères utiliser les commandes npm :

1. **Dans Railway** → Backend Service → **Settings** → **Build & Deploy** :
   - **Root Directory** : `backend`
   - **Install Command** : `npm ci`
   - **Build Command** : `npm run build`
   - **Start Command** : `npm run start:prod`

2. **Important** : Assure-toi que le build génère bien `dist/main.js`

3. Vérifie les **Build Logs** pour confirmer que le build s'est bien passé.

---

## Après correction

Une fois la configuration corrigée :

1. **Force un redéploiement** :
   - Va dans Railway → Backend Service → **Deployments**
   - Clique sur **Redeploy** ou pousse un nouveau commit

2. **Surveille les logs** :
   - **Build Logs** : Vérifie que le build réussit
   - **Deploy Logs** : Vérifie que le backend démarre correctement

3. **Teste l'API** :
   ```bash
   curl https://backend-production-ee03.up.railway.app/health
   ```

4. **Crée le super admin** :
   ```bash
   curl -X POST https://backend-production-ee03.up.railway.app/auth/seed-super-admin
   ```

---

## Dépannage

### Le build échoue
- Vérifie que toutes les dépendances sont dans `package.json`
- Vérifie les **Build Logs** pour voir l'erreur exacte

### Le build réussit mais le démarrage échoue
- Vérifie que `dist/main.js` existe dans les **Build Logs**
- Vérifie que la commande `Start Command` est correcte

### Railway ne détecte pas le Dockerfile
- Assure-toi que le Dockerfile est dans `backend/Dockerfile`
- Vérifie que **Root Directory** est bien `backend`
- Force un redéploiement

