## Guide de déploiement Fly.io – Application GPS

Ce guide décrit comment déployer la stack complète (NestJS backend + Next.js frontend + MySQL) sur Fly.io en utilisant les machines/vm et des volumes persistants.

---

### 1. Prérequis
- Compte Fly.io avec carte bancaire (obligatoire pour créer des volumes persistants).
- Fly CLI installée : `curl -L https://fly.io/install.sh | sh`.
- Authentification CLI : `fly auth login`.
- Dépôt Git propre (`App_GPS`) avec Dockerfiles prêts pour la prod.

---

### 2. Adaptations nécessaires
1. **Dockerfiles production**
   - Backend : décommenter `RUN npm run build` et `CMD ["node","dist/main.js"]`.
   - Frontend : décommenter `RUN npm run build` et `CMD ["npm","start"]`.
2. **Lecture du port** : `await app.listen(process.env.PORT || 3001);`.
3. **CORS** : autoriser le domaine Fly du frontend.
4. **Variables** : créer `.env.example` rassemblant toutes les clés (API + front) pour faciliter les secrets Fly.

---

### 3. Créer l’organisation et région
```bash
fly auth signup # si nécessaire
fly orgs create gps-team   # optionnel
fly regions list           # choisir ex: cdg (Paris) ou fra (Francfort)
```

---

### 4. Base de données MySQL sur Fly.io
Fly ne fournit pas MySQL managé. On lance un service MySQL dockerisé avec volume.

1. Créer un dossier `infra/mysql` contenant un `fly.toml` spécifique :
   ```toml
   app = "gps-mysql"
   primary_region = "cdg"

   [[mounts]]
     source = "mysql_data"
     destination = "/var/lib/mysql"

   [build]
     image = "mysql:8.0"
   ```
2. Lancer `fly launch --config infra/mysql/fly.toml --no-deploy`.
3. Créer le volume :
   ```bash
   fly volumes create mysql_data --size 10 --region cdg --app gps-mysql
   ```
4. Définir les secrets :
   ```bash
   fly secrets set \
     MYSQL_ROOT_PASSWORD=rootpassword \
     MYSQL_DATABASE=gps_tracking \
     MYSQL_USER=gpsuser \
     MYSQL_PASSWORD=gpspassword \
     --app gps-mysql
   ```
5. Déployer :
   ```bash
   fly deploy --config infra/mysql/fly.toml
   ```
6. Récupérer l’IP privée (WireGuard) :
   ```bash
   fly ips private --app gps-mysql
   ```
   Noter l’adresse `fdaa:...` → à utiliser dans `DB_HOST`.

> Astuce : activer la fonctionnalité `machines` pour un meilleur contrôle (`fly machines list --app gps-mysql`).

---

### 5. Backend NestJS

1. Depuis la racine :
   ```bash
   fly launch --app gps-backend --generate-name --region cdg --no-deploy --copy-config
   ```
   - `Root` : `backend`.
   - Buildpack : Docker (Fly détecte le Dockerfile).

2. Mise à jour du `fly.toml` généré (`backend/fly.toml` recommandé) :
   ```toml
   app = "gps-backend"
   primary_region = "cdg"

   [build]
     dockerfile = "backend/Dockerfile"

   [env]
     PORT = "8080"

   [[services]]
     internal_port = 8080
     protocol = "tcp"

     [[services.ports]]
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```
   > Adapter `internal_port` si vous laissez `3001`. Utiliser `PORT` fourni par Fly (`8080` par défaut).

3. Secrets :
   ```bash
   fly secrets set \
     DB_HOST=<ip_privée_mysql> \
     DB_PORT=3306 \
     DB_USERNAME=gpsuser \
     DB_PASSWORD=gpspassword \
     DB_DATABASE=gps_tracking \
     JWT_SECRET=change-me \
     TYPEORM_SYNCHRONIZE=false \
     FRONTEND_PUBLIC_URL=https://<frontend-app>.fly.dev \
     --app gps-backend
   ```

4. Déploiement :
   ```bash
   fly deploy --config backend/fly.toml
   ```

5. Exécuter les migrations :
   ```bash
   fly ssh console --app gps-backend
   npm run migration:run
   ```

6. Tester : `curl https://gps-backend.fly.dev/auth/health`.

---

### 6. Frontend Next.js

1. Générer le service :
   ```bash
   fly launch --app gps-frontend --region cdg --no-deploy --copy-config --name gps-frontend
   ```
   - `Root directory` : `frontend`.

2. Exemple `frontend/fly.toml` :
   ```toml
   app = "gps-frontend"
   primary_region = "cdg"

   [build]
     dockerfile = "frontend/Dockerfile"

   [env]
     PORT = "3000"
   ```

3. Secrets :
   ```bash
   fly secrets set \
     NEXT_PUBLIC_API_URL=https://gps-backend.fly.dev \
     NEXT_PUBLIC_WS_URL=wss://gps-backend.fly.dev \
     NODE_ENV=production \
     --app gps-frontend
   ```

4. Déployer :
   ```bash
   fly deploy --config frontend/fly.toml
   ```

5. Vérifier l’URL : `https://gps-frontend.fly.dev`.

---

### 7. Réseau privé et sécurité
- Par défaut, les apps Fly partagent un réseau privé `fdaa:...` dans la même organisation. Assurez-vous que `gps-backend` peut atteindre `gps-mysql` via l’IP interne.
- Restreindre le backend pour n’écouter que sur `0.0.0.0`.
- Utiliser `fly m tls` si vous ajoutez un domaine custom.

---

### 8. Gestion des WebSockets
- Fly gère nativement les WebSockets sur ses load balancers.
- Vérifier que Socket.io côté client utilise `wss://gps-backend.fly.dev`.
- Configurer `compression: false` si vous avez des soucis de latence.
- Ajouter `process.env.CORS_ORIGIN` dans le gateway WebSocket Nest.

---

### 9. Observabilité
- Utiliser `fly logs -a gps-backend` et `fly logs -a gps-frontend`.
- Activer les métriques : `fly dashboard`.
- Ajouter un outil externe (Grafana Cloud, Axiom) via les exporters.

---

### 10. CI/CD
- Workflow GitHub Actions recommandé :
  ```yaml
  - run: cd backend && npm ci && npm run lint && npm test
  - run: cd frontend && npm ci && npm run lint
  - uses: superfly/flyctl-actions/setup-flyctl@master
  - run: fly deploy --config backend/fly.toml --app gps-backend
  - run: fly deploy --config frontend/fly.toml --app gps-frontend
  ```
- Stocker `FLY_API_TOKEN` comme secret GitHub.

---

### 11. Checklist
- [ ] Dockerfiles orientés production.
- [ ] Volume MySQL créé et monté.
- [ ] Variables secrètes définies sur chaque app.
- [ ] Backend écoute le port Fly et CORS configuré.
- [ ] Frontend pointe vers l’URL Fly du backend (REST + WebSocket).
- [ ] Migrations exécutées.
- [ ] Monitoring/logs vérifiés.

---

### 12. Dépannage
- **Connexion DB refusée** : vérifier IP privée, firewall Fly (même org), mot de passe.
- **WebSocket 502** : s’assurer que Nest expose bien le port et que `allowEIO3` est activé si clients anciens.
- **Machine redémarre** : augmenter la taille (`fly scale vm shared-cpu-1x --memory 512`).
- **Stockage insuffisant** : `fly volumes extend mysql_data --size 20`.

---

### 13. Ressources
- Docs Fly : https://fly.io/docs/
- Déployer NestJS : https://fly.io/docs/app-guides/nestjs/
- Next.js + Fly : https://fly.io/docs/app-guides/nextjs/
- Gestion volumes : https://fly.io/docs/reference/volumes/

---

> Maintenez ce guide à jour en fonction des évolutions Fly (machines V2, Firecracker, autoscale) et des besoins (workers supplémentaires, jobs planifiés, etc.).

