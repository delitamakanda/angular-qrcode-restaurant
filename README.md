# Angular QR Code Restaurant

Application Angular de prise de commande en restaurant via QR code. Le projet simule le parcours client complet : choix du mode de commande, consultation du menu, personnalisation d'un produit, panier, validation de commande et confirmation, avec une API mock servie localement ou via Cloudflare Pages Functions.

## Fonctionnalités

- page d'accueil du restaurant avec choix du mode de commande (`dine_in`, `take_away`, `delivery`)
- catalogue filtré par catégories et recherche produit
- personnalisation des articles avec groupes d'options
- gestion du panier et calcul des totaux
- parcours de checkout avec informations client, moyen de paiement et coupon
- confirmation de commande puis accès à une page de suivi
- mock API basée sur `mock-api/db.json` et exposée sur `/api/*`

## Stack technique

- Angular 21 avec composants standalone
- Signals Angular pour l'état applicatif
- Taiga UI pour une partie des composants d'interface
- `json-server` pour la mock API locale
- Cloudflare Pages Functions pour servir le front et l'API mock sur un même projet

## Structure du dépôt

```text
.
├── functions/api/[[path]].ts   # API mock compatible Cloudflare Pages
├── mock-api/                   # données locales et serveur json-server
├── public/                     # fichiers statiques (_redirects, images...)
└── src/app/                    # application Angular
```

## Prérequis

- Node.js 20+
- npm 11+

## Installation

```bash
npm ci
cd mock-api && npm ci
```

## Lancer le projet en local

1. Démarrer l'API mock dans un premier terminal :

   ```bash
   cd /home/runner/work/angular-qrcode-restaurant/angular-qrcode-restaurant/mock-api
   npm start
   ```

2. Démarrer l'application Angular dans un second terminal :

   ```bash
   cd /home/runner/work/angular-qrcode-restaurant/angular-qrcode-restaurant
   npm start
   ```

3. Ouvrir `http://localhost:4200/`.

Le proxy Angular redirige automatiquement les appels `/api` vers `http://localhost:3000` via `/home/runner/work/angular-qrcode-restaurant/angular-qrcode-restaurant/proxy.conf.json`.

## Parcours disponible

La route par défaut redirige vers :

```text
/store/demo/welcome
```

Routes principales :

- `/store/:storeId/welcome`
- `/store/:storeId/menu`
- `/store/:storeId/cart`
- `/store/:storeId/checkout`
- `/store/:storeId/confirmation/:orderId`
- `/store/:storeId/tracking/:orderId`

## Données mock et API

Les données de démonstration sont définies dans `/home/runner/work/angular-qrcode-restaurant/angular-qrcode-restaurant/mock-api/db.json`.

Ressources disponibles :

- `GET /api/stores/:id`
- `GET /api/categories?store_id=demo&sort=sort_order`
- `GET /api/menus?store_id=demo`
- `GET /api/menus/:id`
- `GET /api/groups?menu_item_id=...`
- `GET /api/options?group_id=...`
- `GET /api/orders/:id`
- `POST /api/orders`

> Les commandes créées en local sont conservées uniquement en mémoire dans la fonction mock tant que le processus tourne.

## Commandes utiles

```bash
npm start                     # lance le front Angular
npm run build                 # build de production
npx ng test --watch=false     # exécute les tests unitaires Angular/Vitest
```

## Déploiement sur Cloudflare Pages

Le dépôt est prêt à servir le front et la mock API dans un même projet Cloudflare Pages.

- **Build command** : `npm run build`
- **Build output directory** : `dist/angular-qrcode-restaurant/browser`
- **Function** : `functions/api/[[path]].ts`
- **Redirects** : `public/_redirects`

## Ressources complémentaires

- Angular CLI : <https://angular.dev/tools/cli>
- Cloudflare Pages Functions : <https://developers.cloudflare.com/pages/functions/>
