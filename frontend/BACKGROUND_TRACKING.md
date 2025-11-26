# Système de Tracking GPS en Arrière-Plan

Ce système combine plusieurs techniques pour maximiser la persistance du tracking GPS en arrière-plan.

## Technologies Utilisées

### 1. Service Worker (`/public/sw.js`)
- Maintient l'application active même quand l'onglet est en arrière-plan
- Cache les requêtes de localisation pour synchronisation ultérieure
- Implémente Background Sync pour synchroniser les positions même hors ligne
- Envoie des messages keep-alive pour maintenir la connexion

### 2. Web Worker (`/public/gps-worker.js`)
- Exécute le tracking GPS dans un thread séparé
- Continue de fonctionner même si l'interface utilisateur est suspendue
- Isolé du thread principal pour de meilleures performances

### 3. Wake Lock API
- Empêche l'écran de s'éteindre pendant le tracking
- Améliore les chances que le GPS reste actif
- Supporté sur Chrome/Edge Android et certains navigateurs desktop

### 4. Page Visibility API
- Détecte quand la page passe en arrière-plan
- Ajuste le comportement du tracking selon la visibilité
- Réactive automatiquement le Wake Lock quand la page revient au premier plan

### 5. PWA (Progressive Web App)
- Permet l'installation de l'application sur l'appareil
- Améliore la persistance en arrière-plan sur Android
- Manifest.json configuré pour l'installation

## Support par Plateforme

### Android (Chrome/Edge)
- ✅ Service Worker : Oui
- ✅ Web Worker : Oui
- ✅ Wake Lock : Oui
- ✅ Background Sync : Oui (limité)
- ⚠️ **Résultat** : Bon support, tracking peut continuer en arrière-plan pendant plusieurs minutes/heures

### iOS (Safari)
- ⚠️ Service Worker : Support limité
- ✅ Web Worker : Oui
- ❌ Wake Lock : Non supporté
- ❌ Background Sync : Non supporté
- ⚠️ **Résultat** : Support limité, tracking s'arrête généralement après quelques secondes/minutes en arrière-plan

### Desktop (Chrome/Edge/Firefox)
- ✅ Service Worker : Oui
- ✅ Web Worker : Oui
- ✅ Wake Lock : Oui (Chrome/Edge)
- ✅ Background Sync : Oui
- ⚠️ **Résultat** : Bon support si l'onglet reste ouvert

## Limitations

### iOS
- **Problème principal** : iOS suspend agressivement les applications web en arrière-plan
- **Solution** : Une application native (React Native/Capacitor) serait nécessaire pour un tracking continu fiable sur iOS

### Tous les navigateurs
- Le tracking peut s'arrêter si :
  - L'utilisateur ferme complètement le navigateur
  - Le système manque de mémoire
  - L'utilisateur désactive les permissions de localisation
  - La batterie est en mode économie d'énergie

## Utilisation

Le système est automatiquement activé quand un utilisateur démarre le tracking GPS. Aucune action supplémentaire n'est requise.

### Vérification du support

Le système vérifie automatiquement les capacités du navigateur et utilise les techniques disponibles. Les fonctionnalités non supportées sont ignorées silencieusement.

### Logs de débogage

Les logs de débogage sont disponibles dans la console du navigateur avec le préfixe `[Background Tracking]` et `[SW]`.

## Améliorations Futures Possibles

1. **Application Native** : Utiliser React Native ou Capacitor pour un support iOS complet
2. **Notifications Push** : Utiliser les notifications pour réveiller l'application périodiquement
3. **Geofencing** : Utiliser l'API Geofencing pour déclencher des événements basés sur la position
4. **Battery Optimization** : Implémenter des stratégies pour réduire la consommation de batterie

## Notes Importantes

- **Aucun script ne peut "forcer" une application web à s'exécuter en arrière-plan de manière fiable**
- Ce système **maximise les chances** que le tracking continue, mais ne garantit pas un fonctionnement 100% fiable
- Pour un tracking GPS continu garanti, une application native est recommandée


