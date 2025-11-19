## Guide de déploiement Railway – Application GPS

Ce document décrit, étape par étape, comment publier l’API NestJS, le frontend Next.js et la base MySQL sur Railway. Il repose sur l’architecture existante décrite dans `README.md` (backend temps réel + frontend temps réel + MySQL).

---

### 1. Pré-requis

- Compte Railway (plan Starter ou supérieur pour MySQL + 2 services Node).
- Railway CLI `npm i -g @railway/cli` (facultatif mais conseillé).
- Repository Git disponible (GitHub, GitLab, Bitbucket) ou import via CLI.
- Variables sensibles prêtes (JWT secret, mots de passe DB).

---

### 2. Préparer le dépôt

1. Vérifier que les Dockerfiles sont prêts pour la prod (`RUN npm run build` + `CMD ["node","dist/main.js"]` côté backend, `npm run build/start` côté frontend).
2. Ajouter un fichier `.env.example` regroupant toutes les variables du backend et du frontend (facilite la saisie dans Railway).
3. Push sur une branche propre (Railway déploie depuis Git par défaut).

---

### 3. Créer le projet Railway

1. Se connecter sur https://railway.app → `New Project`.
2. Choisir `Deploy from GitHub Repo` (ou `Empty project` si vous préférez créer les services manuellement avec la CLI).
3. Authentifier Railway auprès de GitHub et sélectionner le repo `App_GPS`.

Railway crée alors un projet vide lié au dépôt. Nous allons y ajouter 3 services :

- `mysql` (base managée par Railway)
- `backend` (NestJS REST + WebSocket)
- `frontend` (Next.js 14)

---

### 4. Service MySQL

1. Dans le projet Railway, `+ New → Database → MySQL`.
2. Railway provisionne une instance (URL, host, port, user, password, database).
3. Copier les valeurs (bouton `Variables`) : nous les réutiliserons côté backend.

Optionnel : via CLI

```bash
railway add --service mysql
railway variables --service mysql
```

---

### 5. Service Backend (NestJS)

1. `+ New → GitHub Repo → backend/` (Railway détecte automatiquement le dossier si monorepo).
2. Dans l’onglet `Settings` du service :
   - `Root directory`: `backend`
   - `Install command`: `npm install`
   - `Build command`: `npm run build`
   - `Start command`: `npm run start:prod`
3. Configurer les variables d’environnement :

| Variable              | Valeur conseillée                                                           |
| --------------------- | --------------------------------------------------------------------------- |
| `PORT`                | `3001` (Railway injecte aussi `PORT`, pensez à utiliser `process.env.PORT`) |
| `DB_HOST`             | host fourni par le service MySQL                                            |
| `DB_PORT`             | port MySQL Railway                                                          |
| `DB_USERNAME`         | user Railway                                                                |
| `DB_PASSWORD`         | password Railway                                                            |
| `DB_DATABASE`         | database Railway                                                            |
| `JWT_SECRET`          | secret robuste                                                              |
| `TYPEORM_SYNCHRONIZE` | `false` (production)                                                        |
| `FRONTEND_PUBLIC_URL` | URL finale du frontend (pour CORS)                                          |

4. Autoriser le backend à écouter la variable `PORT` : dans `main.ts`, `await app.listen(process.env.PORT || 3001);` (déjà le cas si Nest CLI par défaut).
5. Activer CORS en prod (`app.enableCors({ origin: process.env.FRONTEND_PUBLIC_URL, ... })`).
6. Déployer : Railway lance automatiquement le pipeline (install → build → start).
7. Tester l’API : dans l’onglet `Deployments`, copier le domaine `https://<backend>.up.railway.app` et vérifier `/auth/health` ou `/locations`.

#### Migrations & données

- Utiliser les scripts TypeORM existants (`npm run migration:run`).
- Commander la migration via Railway Shell :
  ```bash
  railway shell --service backend
  npm run migration:run
  ```
- Ou exécuter la commande depuis un workflow CI connecté au service.

---

### 6. Service Frontend (Next.js 14)

1. `+ New → GitHub Repo → frontend/`.
2. Paramètres :
   - `Root directory`: `frontend`
   - `Install command`: `npm install`
   - `Build command`: `npm run build`
   - `Start command`: `npm run start`
3. Variables d’environnement :

| Variable              | Valeur                                                      |
| --------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL HTTPS du backend (Railway)                              |
| `NEXT_PUBLIC_WS_URL`  | `wss://<backend>.up.railway.app` (important pour Socket.io) |
| `NODE_ENV`            | `production`                                                |
| `PORT`                | `3000` (ou laissez Railway définir automatiquement)         |

4. Déployer et noter l’URL générée `https://<frontend>.up.railway.app`.
5. Ajouter cette URL dans `FRONTEND_PUBLIC_URL` côté backend (pour CORS).
6. Tester la chaîne complète : inscription, login, géolocalisation (utiliser HTTPS → Railway fournit TLS nativement).

---

### 7. Domaines personnalisés (optionnel)

1. Dans le service frontend → `Domains → Add Domain`.
2. Ajouter un sous-domaine (ex: `gps.mondomaine.com`).
3. Créer le CNAME côté DNS pointant vers `<frontend>.up.railway.app`.
4. Répéter pour le backend si vous exposez l’API sur un domaine dédié (sinon conserver le domaine Railway).

---

### 8. Gestion des WebSockets

- Railway supporte nativement WebSocket sur HTTPS (`wss`).
- Vérifier que Socket.io utilise `transports: ['websocket']` pour éviter le polling si nécessaire.
- Mettre à jour `NEXT_PUBLIC_WS_URL` après chaque changement de domaine.
- Sur Next.js, valider que le client n'utilise pas `localhost` en dur.

---

### 9. Observabilité & montée en charge

- Onglet `Metrics` de chaque service pour CPU/RAM.
- Configurer des alertes Railway (quota).
- Monter en plan payant si besoin de connexions WebSocket nombreuses (les dynos gratuits dorment).
- Activer des logs structurés dans NestJS (`Logger`) et Next.js (middleware) pour faciliter le debugging.

---

### 10. CI/CD recommandé

1. Utiliser GitHub Actions pour lancer tests + lint avant que Railway ne construise :
   ```yaml
   - run: cd backend && npm ci && npm run lint && npm run test
   - run: cd frontend && npm ci && npm run lint
   ```
2. Branches :
   - `main` → Railway prod
   - `staging` → Railway env de staging (duplication du projet).

---

### 11. Checklist finale

- [ ] Backend écoute `process.env.PORT`.
- [ ] JWT secret fort et stocké uniquement dans Railway.
- [ ] CORS autorise le domaine du frontend.
- [ ] URLs `NEXT_PUBLIC_*` mises à jour.
- [ ] Base Railway testée (connexion via `mysql` CLI).
- [ ] HTTPS vérifié (géolocalisation).
- [ ] Scripts de migrations disponibles et documentés.
- [ ] Monitoring Railway activé.

---

### 12. Dépannage spécifique Railway

- **Build échoue pour manque de RAM** : activer `Skip Install` (Railway gère `npm install`) ou utiliser `NODE_OPTIONS=--max_old_space_size=512`.
- **WebSocket 400/502** : vérifier `NEXT_PUBLIC_WS_URL` et l’activation CORS/WS côté Nest (`cors: { origin, credentials: true }` + `allowEIO3: true`).
- **Timeout DB** : ajouter `DB_SSL=true` si Railway force SSL (variable `MYSQLSSL` dans certains plans).
- **Données perdues** : Railway bases gratuites sont éphémères → plan Hobby pour stockage persistant.

---

### 13. Ressources utiles

- Docs Railway : https://docs.railway.app
- CLI Railway : https://docs.railway.app/reference/cli
- NestJS déploiement sur Railway : https://docs.railway.app/deploy/nest
- Next.js sur Railway : https://docs.railway.app/deploy/nextjs

---

> Maintenez ce guide à jour à chaque évolution de l’infrastructure (nouvelles variables, services supplémentaires, workers, etc.).
