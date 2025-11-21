# Configuration des Variables d'Environnement Railway

## Variables Frontend (Service: Frontend)

Ces variables **DOIVENT** être définies dans Railway pour que le frontend se connecte au backend :

```
NEXT_PUBLIC_API_URL=https://backend-production-ee03.up.railway.app
NEXT_PUBLIC_WS_URL=wss://backend-production-ee03.up.railway.app
NODE_ENV=production
```

⚠️ **IMPORTANT** : Les variables `NEXT_PUBLIC_*` sont injectées au moment du **BUILD** Next.js. 
- Si tu modifies ces variables, tu **DOIS** redéployer le frontend pour que les changements prennent effet.
- Railway redéploie automatiquement quand tu modifies les variables, mais assure-toi que le build se termine avec succès.

## Variables Backend (Service: Backend)

Ces variables sont déjà configurées via les références aux variables MySQL :

```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQL_DATABASE}}
FRONTEND_PUBLIC_URL=https://prodis-gps.up.railway.app
NODE_ENV=production
TYPEORM_SYNCHRONIZE=false
```

## Vérification

1. **Frontend** : Ouvre la console du navigateur (F12) et vérifie que les requêtes API pointent vers `https://backend-production-ee03.up.railway.app` et non `localhost:3001`.

2. **Backend** : Vérifie les logs pour confirmer que CORS accepte les requêtes depuis `https://prodis-gps.up.railway.app`.

## En cas de problème

Si le frontend essaie toujours de se connecter à `localhost:3001` :
1. Vérifie que les variables sont bien définies dans Railway (Service Frontend → Variables)
2. Force un redéploiement en poussant un commit ou en cliquant sur "Redeploy"
3. Vérifie les Build Logs pour confirmer que les variables sont bien injectées

