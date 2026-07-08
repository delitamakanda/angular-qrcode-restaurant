# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Angular 21 application for restaurant ordering via QR code. It simulates the customer journey: pick an order mode (`dine_in`, `take_away`, `delivery`), browse the menu, customize a product, review the cart, check out, and confirm/track an order. Data comes from a mock API (`mock-api/db.json` via `json-server`) locally, or from a Cloudflare Pages Function (`functions/api/[[path]].ts`) reading the same `db.json` when deployed.

## Commands

```bash
npm start                     # serve the Angular app (dev server on :4200, proxies /api to :3000)
npm run build                 # production build
npm run watch                 # dev build with --watch
npx ng test --watch=false     # run unit tests once (Vitest via @angular/build:unit-test)
npx ng test                   # run unit tests in watch mode
npm run lint                  # ng lint (ESLint + angular-eslint)
npm run format                # prettier --write .
npm run format:check          # prettier --check .
```

Run a single test file: `npx ng test --watch=false --include='**/cart.store.spec.ts'` (adjust the glob to the target spec).

Mock API (separate `npm` project in `mock-api/`):

```bash
cd mock-api && npm ci         # install once
npm run mock:api               # from repo root: starts json-server with static build served from mock-api/public
cd mock-api && npm start       # or run json-server directly, watching db.json
```

The Angular dev server must run alongside the mock API — `proxy.conf.json` forwards `/api/*` to `http://localhost:3000`.

The pre-commit hook (`.husky/pre-commit`) runs `npm run lint && npx ng test --watch=false && npm run format:check` — expect these three to pass before committing.

## Architecture

### Layering: core / features / shared / state

- `src/app/core/` — cross-cutting singletons: `api/` (HTTP services per resource: menu, order, payment, store, tracking), `interceptors/` (auth, error, loading, locale — registered in `app.config.ts`), `guards/` (`store-loaded.guard`, `checkout-access.guard`), `resolvers/` (`store.resolver`, `menu.resolver`), `mappers/` (raw API payload → domain model), `models/`, `constants/`, `utils/`.
- `src/app/features/` — one directory per route/domain (`welcome`, `menu`, `product-customization`, `cart`, `checkout`, `order-confirmation`, `order-tracking`, `profile`, `auth`, `promotions`, `shop-shell`, `splash-screen`), each split into `pages/` (routed, smart) and `components/` (dumb, presentational). Some features add `dialogs/` or `sheets/` for Taiga UI overlay components.
- `src/app/shared/` — reusable `ui/` components (buttons, cards, chips, dialogs, feedback, forms, layout, navigation), `directives/`, `pipes/`, `validators/`, `types/`. Nothing here should depend on `features/`.
- `src/app/state/` — app-wide signal-based stores, one per domain (`app.store`, `cart.store`, `checkout.store`, `menu.store`, `order-tracking.store`, `shop.store`, `ui.store`), each `@Injectable({ providedIn: 'root' })`. State is plain `signal()`/`computed()`, not NgRx. `CartStore` persists to `localStorage` via an `effect()`; look there for the pattern used elsewhere.
- `src/app/layouts/` — shell layouts (`centered-layout`, `mobile-order-layout`) used by routed pages.

### Routing

All routes live under `/store/:storeId/...` (see `src/app/app.routes.ts`) and are lazy-loaded with `loadComponent`. `storeLoadedGuard` guards the whole `store/:storeId` subtree; `checkoutAccessGuard` additionally guards `/checkout`. The default route and wildcard both redirect to `store/demo/welcome`. Route-level preloading combines `PreloadAllModules` with a custom `NetworkAwarePreloadingStrategy` (`core/preload/`).

### App bootstrap (`app.config.ts`)

Zoneless change detection (`provideZonelessChangeDetection`), `provideHttpClient` with `withFetch()` and the three interceptors above, Taiga UI (`provideTaiga()`), and the service worker (`provideServiceWorker`, enabled only outside dev mode). `API_CONFIG` (base API URL, from `core/config/env.config.ts` / `@environments/environment`) is provided via the `APP_TOKEN_CONFIG` injection token — inject this instead of importing `environment` directly in feature code.

### Path aliases

TypeScript paths (`tsconfig.json`): `@app/*` → `src/app/*`, `@shared/*` → `src/app/shared/*`, `@assets/*` → `src/assets/*`, `@environments/*` → `src/environments/*`. Use these instead of relative `../../..` imports.

### Mock API / Cloudflare Function parity

`mock-api/db.json` is the single source of demo data, consumed two ways:

1. Locally, `json-server` serves it directly on `:3000` (proxied through `/api`).
2. In deployment, `functions/api/[[path]].ts` re-implements the same REST surface (stores, categories, menus, groups, options, orders — including `POST /api/orders`) by reading the same `db.json` and hand-rolling filtering/sorting/routing, since Cloudflare Pages Functions don't run `json-server`. Orders created against the Cloudflare function are in-memory only (reset on redeploy/restart). When changing an API shape or adding an endpoint, update both `mock-api/db.json`-consumers in parallel: the `core/api/*.service.ts` client and the `functions/api/[[path]].ts` handler.

## Coding conventions (enforced by lint/review, not just style)

- Standalone components only; do **not** set `standalone: true` explicitly (it's the default).
- Use `input()`/`output()` functions, not `@Input()`/`@Output()` decorators.
- Use `inject()` for DI, not constructor injection.
- Signals for state: `computed()` for derived values, `update()`/`set()` — never call `.mutate()`.
- `changeDetection: ChangeDetectionStrategy.OnPush` on every component.
- No `@HostBinding`/`@HostListener` — use the `host` object in the decorator instead.
- Templates use native control flow (`@if`/`@for`/`@switch`), not `*ngIf`/`*ngFor`/`*ngSwitch`; bind `class`/`style` directly instead of `ngClass`/`ngStyle`.
- Reactive forms over template-driven forms.
- `NgOptimizedImage` for static images (not applicable to inline base64).
- Must meet WCAG AA / pass AXE checks — mind focus management, color contrast, ARIA.
- Component/directive selectors are prefixed `app-` (kebab-case for components, camelCase for directives) — enforced by `eslint.config.js`.
- TypeScript: strict mode is on (`strict`, `strictTemplates`, `strictInjectionParameters`, etc. in `tsconfig.json`) — avoid `any`, prefer `unknown` when the type is genuinely uncertain.
