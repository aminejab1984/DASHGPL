# GPL Tawssil COD Dashboard — Netlify + Netlify Blobs

Cette version conserve le dashboard HTML et remplace la persistance locale des données par une persistance en ligne via Netlify Functions + Netlify Blobs.

## Architecture

- `public/index.html` : dashboard
- `netlify/functions/data.mjs` : API `/api/data`
- `netlify.toml` : configuration Netlify
- `package.json` : dépendance `@netlify/blobs`

## Déploiement

1. Créer un dépôt GitHub et y envoyer le contenu de ce dossier.
2. Dans Netlify : Add new project → Import an existing project → GitHub.
3. Build settings : Publish directory `public`. Les Functions sont détectées dans `netlify/functions`.
4. Ajouter la variable d'environnement `GPL_PIN` dans les variables du projet. Si elle n'est pas définie, le code utilise `CMGPL` comme PIN de secours.
5. Déployer.

## Utilisation

- Tous les visiteurs peuvent consulter les données publiées.
- Importer un Excel demande le PIN administrateur.
- L'import est découpé en lots et stocké dans Netlify Blobs, puis publié en une seule opération `commit`.
- Le bouton Reset demande le PIN et supprime les données publiées.
- Le PIN n'est pas enregistré dans le navigateur.

## Limite pratique

Netlify impose une limite de payload pour les Functions et Netlify Blobs impose une taille maximale par valeur. Le dashboard découpe donc les lignes en chunks avant stockage.
