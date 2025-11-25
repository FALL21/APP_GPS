# Icônes PWA pour PRODIS GPS

Pour que l'application fonctionne comme une PWA installable, vous devez créer deux icônes :

## Icônes requises

1. **icon-192.png** : 192x192 pixels
2. **icon-512.png** : 512x512 pixels

## Comment créer les icônes

### Option 1 : Utiliser le logo PRODIS existant

Si vous avez le logo `prodis.jpeg` dans `frontend/src/app/`, vous pouvez :

1. Ouvrir le logo dans un éditeur d'images (GIMP, Photoshop, etc.)
2. Redimensionner à 192x192 et 512x512 pixels
3. Exporter comme PNG avec fond transparent si possible
4. Placer les fichiers dans `frontend/public/`

### Option 2 : Utiliser un outil en ligne

- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

### Option 3 : Créer manuellement

Utilisez le logo PRODIS et créez deux versions carrées avec :
- Fond transparent ou couleur de thème (#0b2c5e)
- Logo centré
- Format PNG

## Emplacement

Les icônes doivent être placées dans :
```
frontend/public/icon-192.png
frontend/public/icon-512.png
```

## Note

L'application fonctionnera sans ces icônes, mais l'installation PWA ne sera pas optimale.

