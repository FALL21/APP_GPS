# Application GPS - Suivi en Temps Réel

Application GPS responsive pour suivre la position des utilisateurs (ex: chauffeurs) en temps réel.

## Technologies

- **Frontend**: Next.js 14, React, TypeScript, Leaflet
- **Backend**: NestJS, WebSocket (Socket.io), TypeORM
- **Base de données**: MySQL 8.0
- **Docker**: Orchestration complète

## Structure du Projet

```
App_GPS/
├── backend/          # API NestJS
│   ├── src/
│   │   ├── auth/     # Module d'authentification
│   │   ├── location/ # Module de géolocalisation
│   │   └── main.ts   # Point d'entrée
│   └── Dockerfile
├── frontend/         # Application Next.js
│   ├── src/
│   │   ├── app/      # Pages Next.js
│   │   ├── components/ # Composants React
│   │   └── lib/      # Services API et WebSocket
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Installation

### Prérequis

- Docker et Docker Compose installés
- Node.js 20+ (pour le développement local)

### Avec Docker (Recommandé)

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes (ATTENTION: supprime les données)
docker-compose down -v
```

### Développement local

#### 1. Base de données MySQL

```bash
# Démarrer uniquement MySQL avec Docker
docker run -d \
  --name gps_mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=gps_tracking \
  -e MYSQL_USER=gpsuser \
  -e MYSQL_PASSWORD=gpspassword \
  -p 3306:3306 \
  mysql:8.0
```

#### 2. Backend

```bash
cd backend
npm install

# Créer un fichier .env
echo "DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=gpsuser
DB_PASSWORD=gpspassword
DB_DATABASE=gps_tracking
JWT_SECRET=your-secret-key-change-in-production
PORT=3001" > .env

# Démarrer en mode développement
npm run start:dev
```

#### 3. Frontend

```bash
cd frontend
npm install

# Créer un fichier .env.local (optionnel, les valeurs par défaut fonctionnent)
echo "NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001" > .env.local

# Démarrer en mode développement (par défaut sur le port 3000)
# Pour utiliser le port 8080 : PORT=8080 npm run dev
npm run dev
```

## Accès

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001
- **MySQL**: localhost:3306

## Utilisation

### 1. Créer un compte

1. Accédez à http://localhost:8080
2. Cliquez sur "S'inscrire"
3. Remplissez le formulaire (nom, email, mot de passe, rôle)
4. Rôles disponibles:
   - **driver**: Chauffeur qui partage sa position
   - **admin**: Administrateur qui peut voir tous les utilisateurs

### 2. Se connecter

1. Utilisez votre email et mot de passe pour vous connecter
2. Vous serez redirigé vers le tableau de bord

### 3. Démarrer le suivi GPS

1. Sur le tableau de bord, cliquez sur "📍 Démarrer le suivi"
2. Autorisez l'accès à la géolocalisation dans votre navigateur
3. Votre position sera automatiquement enregistrée et affichée sur la carte
4. Les autres utilisateurs connectés verront vos mises à jour en temps réel via WebSocket

### 4. Visualiser l'historique

- L'historique des dernières positions s'affiche sous la carte
- Le tracé bleu sur la carte montre votre parcours

## Fonctionnalités

- ✅ **Authentification sécurisée** avec JWT
- ✅ **Suivi GPS en temps réel** avec WebSocket
- ✅ **Interface responsive** pour mobile et desktop
- ✅ **Historique des positions** avec sauvegarde en base de données
- ✅ **Carte interactive** avec OpenStreetMap/Leaflet
- ✅ **Affichage de la vitesse** et direction
- ✅ **Multi-utilisateurs** avec suivi en temps réel

## API Endpoints

### Authentification

- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion

### Positions (nécessite authentification)

- `POST /locations` - Créer une position
- `GET /locations` - Liste des positions
- `GET /locations/latest` - Dernière position
- `GET /locations/history?limit=100` - Historique

## WebSocket Events

### Émettre (Client → Serveur)

- `join_tracking` - Rejoindre le suivi d'un utilisateur
- `leave_tracking` - Quitter le suivi
- `update_location` - Mettre à jour la position

### Recevoir (Serveur → Client)

- `location_updated` - Position mise à jour en temps réel

## Développement

### Structure Backend

```
backend/src/
├── auth/
│   ├── dto/           # Data Transfer Objects
│   ├── entities/      # Entités TypeORM (User)
│   ├── guards/        # Guards JWT
│   └── *.service.ts   # Services
├── location/
│   ├── dto/
│   ├── entities/      # Entités (Location)
│   ├── *.gateway.ts   # WebSocket Gateway
│   └── *.service.ts
└── main.ts            # Point d'entrée
```

### Structure Frontend

```
frontend/src/
├── app/               # Pages Next.js (App Router)
│   ├── login/         # Page de connexion
│   ├── register/      # Page d'inscription
│   └── dashboard/     # Tableau de bord
├── components/        # Composants React
│   └── Map/           # Composant de carte
├── lib/               # Services
│   ├── api.ts         # Client API Axios
│   └── socket.ts      # Client WebSocket
└── types/             # Types TypeScript
```

## Notes importantes

- ⚠️ En production, changez le `JWT_SECRET` et les mots de passe de la base de données
- ⚠️ Configurez HTTPS pour la géolocalisation en production
- ⚠️ Le mode `synchronize: true` de TypeORM est désactivé en production
- 📱 L'application fonctionne sur mobile (nécessite autorisation GPS)
- 🌐 La géolocalisation nécessite HTTPS en production (sauf localhost)

## Dépannage

### Le backend ne démarre pas

- Vérifiez que MySQL est démarré et accessible
- Vérifiez les variables d'environnement dans docker-compose.yml

### La géolocalisation ne fonctionne pas

- Autorisez l'accès à la géolocalisation dans votre navigateur
- En production, utilisez HTTPS (la géolocalisation nécessite une connexion sécurisée)

### WebSocket ne se connecte pas

- Vérifiez que le backend est bien démarré
- Vérifiez les URLs dans les variables d'environnement du frontend

## Licence

MIT
