## Plan opérationnel de déploiement Railway

Plan d’exécution pas-à-pas pour publier l’application GPS (NestJS + Next.js + MySQL) sur Railway.

---

### Phase 0 — Préparation (Jour 0)
1. **Vérifier code & branches**
   - Branche `main` à jour avec les derniers commits validés.
   - Lint/tests : `cd backend && npm run lint && npm test`, `cd frontend && npm run lint`.
2. **Adapter Dockerfiles pour la prod**
   - Backend : activer `RUN npm run build` et `CMD ["node","dist/main.js"]`.
   - Frontend : activer `RUN npm run build` et `CMD ["npm","start"]`.
3. **Fichiers d’environnement**
   - Créer `.env.example` (backend) et `.env.local.example` (frontend) listant toutes les variables nécessaires.
4. **Checklist sécurité**
   - Nouveau `JWT_SECRET`.
   - Mots de passe MySQL forts.
   - Vérifier `app.enableCors` avec domaine Railway.

Résultat attendu : dépôt prêt, Dockerfiles prod, secrets identifiés.

---

### Phase 1 — Création du projet Railway (Jour 1)
1. Connexion : https://railway.app
2. `New Project` → `Deploy from GitHub Repo` → sélectionner `App_GPS`.
3. Railway crée un projet vide relié à Git (surveiller `main`).

Commandes associées (facultatif CLI) :
```bash
railway login
railway init  # si vous souhaitez gérer depuis CLI
```

---

### Phase 2 — Provisionner MySQL managé
1. Dans le projet Railway : `+ New → Database → MySQL`.
2. Patienter la création, puis ouvrir l’onglet `Variables`.
3. Sauvegarder les champs suivants :
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`.

Vérifier l’accès :
```bash
railway sql --service mysql --command "SELECT 1;"
```

---

### Phase 3 — Déployer le backend NestJS
1. `+ New → GitHub Repo → backend/`.
2. Paramètres service :
   - `Root Directory`: `backend`
   - `Install Command`: `npm install`
   - `Build Command`: `npm run build`
   - `Start Command`: `npm run start:prod`
3. Variables d’environnement à saisir :
   ```
   PORT=3001
   DB_HOST=<MYSQLHOST>
   DB_PORT=<MYSQLPORT>
   DB_USERNAME=<MYSQLUSER>
   DB_PASSWORD=<MYSQLPASSWORD>
   DB_DATABASE=<MYSQLDATABASE>
   JWT_SECRET=<secret fort>
   TYPEORM_SYNCHRONIZE=false
   FRONTEND_PUBLIC_URL=https://<frontend-app>.up.railway.app
   ```
4. Lancer le déploiement (Railway build auto dès qu’on sauvegarde).
5. Vérifier les logs :
   ```bash
   railway logs --service backend
   ```
6. Tester l’API :
   ```bash
   curl https://<backend>.up.railway.app/auth/health
   ```
7. Migrer la base si nécessaire :
   ```bash
   railway shell --service backend
   npm run migration:run
   exit
   ```

---

### Phase 4 — Déployer le frontend Next.js
1. `+ New → GitHub Repo → frontend/`.
2. Paramètres :
   - `Root Directory`: `frontend`
   - `Install Command`: `npm install`
   - `Build Command`: `npm run build`
   - `Start Command`: `npm run start`
3. Variables :
   ```
   NEXT_PUBLIC_API_URL=https://<backend>.up.railway.app
   NEXT_PUBLIC_WS_URL=wss://<backend>.up.railway.app
   NODE_ENV=production
   PORT=3000
   ```
4. Déploiement automatique → surveiller `railway logs --service frontend`.
5. Tester l’UI via l’URL `https://<frontend>.up.railway.app`.
6. Après mise en ligne, retourner sur le backend et mettre à jour `FRONTEND_PUBLIC_URL` (saisir l’URL réelle) puis redeployer.

---

### Phase 5 — Tests bout en bout
1. Inscription + connexion via l’URL frontend.
2. Démarrage du suivi GPS (vérifier permissions HTTPS).
3. Observer les évènements WebSocket (console navigateur).
4. Vérifier la console backend (`railway logs backend`) pour détecter erreurs CORS/WS.
5. Consulter la base via `railway sql --service mysql "SELECT COUNT(*) FROM location;"`.

---

### Phase 6 — Durcissement & monitoring
1. Configurer alertes quotas dans Railway (`Settings → Metrics → Alerts`).
2. Activer un plan payant si trafic > limites gratuites (WebSocket inactif sinon).
3. Ajouter domaines personnalisés :
   - Frontend service → `Domains → Add Domain`.
   - Créer CNAME chez DNS provider.
4. Mettre à jour `NEXT_PUBLIC_API_URL`/`WS_URL` et `FRONTEND_PUBLIC_URL` si domaine custom.
5. S’assurer que `NODE_ENV=production`, `JWT_SECRET` stocké uniquement dans Railway.

---

### Phase 7 — CI/CD et maintenance continue
1. Créer workflow GitHub Actions (`.github/workflows/deploy.yml`) :
   ```yaml
   on:
     push:
       branches: [main]
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - run: cd backend && npm ci && npm run lint && npm test
         - run: cd frontend && npm ci && npm run lint
   ```
   (Railway se charge ensuite du build/déploiement depuis Git).
2. Mettre en place une branche `staging` reliée à un second projet Railway pour pré-production.
3. Planifier révisions mensuelles :
   - Rotation des secrets.
   - Vérification des mises à jour Node/Nest/Next.
   - Nettoyage des logs/monitoring.

---

### Résumé des commandes clés
```bash
# CLI Railway
railway login
railway init
railway logs --service backend
railway logs --service frontend
railway sql --service mysql --command "SELECT 1;"
railway shell --service backend

# Tests locaux
cd backend && npm run lint && npm test
cd frontend && npm run lint

# Vérification API
curl https://<backend>.up.railway.app/auth/health
```

Maintenir ce plan à jour dès qu’un service ou une configuration change pour assurer un déploiement reproductible.

