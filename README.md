[README.md](https://github.com/user-attachments/files/32607164/README.md)
# DASHGPL — Netlify + stockage persistant

## Structure obligatoire

```text
DASHGPL/
├── public/
│   └── index.html
├── netlify/
│   └── functions/
│       └── data.mjs
├── netlify.toml
├── package.json
└── README.md
```

## Déploiement GitHub / Netlify

1. Mettre le contenu de ce dossier à la racine du dépôt GitHub `aminejab1984/DASHGPL`.
2. Vérifier que `public/index.html` est visible directement à la racine du dépôt.
3. Dans Netlify : Build command = vide ; Publish directory = `public`.
4. Les Functions sont dans `netlify/functions` via `netlify.toml`.
5. Redéployer le site.

Le dashboard envoie désormais les données importées à `/.netlify/functions/data`.
La Function utilise le store site-wide Netlify Blobs `gpl-dashboard` et la clé `latest-dashboard-data`.

Après import Excel : les données sont sauvegardées côté serveur. Après F5, le dashboard tente d'abord de restaurer les données depuis le serveur, puis utilise localStorage uniquement comme secours.
