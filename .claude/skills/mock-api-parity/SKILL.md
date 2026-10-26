---
name: mock-api-parity
description: Use when changing the demo API in any way — adding or editing data, fields or collections in mock-api/db.json, adding or changing an HTTP call in src/app/core/api, or touching functions/api. Keeps json-server (local) and the Cloudflare Pages Function (deployed) in sync.
---

# Mock API parity: json-server ↔ Cloudflare Function

`mock-api/db.json` is the single source of demo data, served by **two different
backends** that must answer every request the app makes identically:

|                         | Local (`npm run start:all`)             | Deployed (Cloudflare Pages)                                          |
| ----------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| Server                  | `json-server` v1 on `:3000`             | `functions/api/_handler.ts` (wrapped by `functions/api/[[path]].ts`) |
| Data                    | reads `db.json` live                    | `db.json` **bundled at build time**: data changes need a redeploy    |
| Writes (`POST /orders`) | **persisted into the served `db.json`** | in-memory only, lost on restart/redeploy                             |
| Query support           | full json-server v1                     | only what `_handler.ts` implements (see below)                       |

The client side is `src/app/core/api/*.service.ts`. URLs always start with
`this.config.BASE_API_URL` (inject `APP_TOKEN_CONFIG`, never import `environment`),
and raw payloads are converted to domain models in `src/app/core/mappers/`.

## What the Function supports (and nothing more)

- `GET /api/<collection>` and `GET /api/<collection>/:id` for the keys of the
  `collections` object: `stores`, `categories`, `menus`, `groups`, `options`,
  `promotions`, `orders`. Unknown resources return 404 (`Object.hasOwn` guard,
  so `/constructor` is a 404 too).
- Filters: any non-reserved query key is an **exact string match**
  (`String(item[key]) === value`).
- `_sort=<field>`: numeric or `localeCompare` ascending only.
- `_page`, `_per_page`, `_embed`, `_where` are **ignored** (reserved but not
  implemented). Operators such as `price:gte=` are not supported either.
- `POST /api/orders` only. It fills defaults that json-server does **not**:
  `id`, `status: 'pending'`, `order_number` (`A001`…), `subtotal`/`total`
  (sum of `items[].total_price`), `discount`, `fees`, `created_at`.

If a client call relies on anything outside this list, it works locally and
breaks in production. Implement it in `_handler.ts` first, or don't use it.

## Checklist by type of change

**Data only (new rows or fields in `db.json`)**

1. Edit `mock-api/db.json`. Keep the invariants checked by
   `src/app/core/api/mock-db.spec.ts`: id prefixes (`cat-`, `item-`…), unique ids,
   consecutive category `sort_order`, `image_url`, `mode_availability` keys.
2. Update the model in `src/app/core/models/` and the mapper if the field is used.
3. No Function change is needed, but production only sees it after a redeploy.

**New query parameter or sort on an existing collection**

1. Add it in the `core/api` service with `HttpParams`.
2. Make sure `_handler.ts` interprets it the same way: exact-match filters and
   `_sort` already work. Anything else needs code in `filterByQuery`.
3. Add a case to `api-parity.spec.ts` with the **exact query the service sends**.

**New collection**

1. Add the array to `db.json`.
2. Register it in `collections` in `functions/api/_handler.ts`.
3. Add the service method, model and mapper.
4. Add a parity test (list, `/:id`, unknown id → 404) and integrity checks in
   `mock-db.spec.ts` if it has relations.

**New write endpoint (POST / PATCH / DELETE)**

1. json-server handles it for free locally and **writes into `db.json`**.
   Never commit those writes. Agent workflows serve a copy
   (`scripts/agent/start-app.sh`).
2. The Function needs an explicit branch in `handleRequest`, in-memory like
   `createOrder`. Decide which defaults the server computes, and make the client
   send them explicitly when json-server would not (e.g. `order_number`, totals).
3. Add a parity test for the response shape and for a later `GET /:id`.

**Response shape change**

1. Change `db.json`, model, mapper and the consumers in the same PR.
2. Check `ngsw-config.json` `dataGroups`: `/api/categories**` (24h) and
   `/api/menus**` (1h) are cached by the service worker. Clients may get the
   old shape until expiry, so mappers should tolerate both shapes, or bump the
   group `name` to drop the cache.

## Verify

```bash
npx ng test --watch=false --include='**/core/api/*.spec.ts'   # parity + db integrity
npm run mock:api                                               # then exercise the app locally
```

`api-parity.spec.ts` runs `handleRequest` directly against `db.json`. Every
request issued by `core/api` should have a matching case. After deployment, the
README's "Local vs deployed parity" section has a `curl | jq | diff` snippet to
compare `:3000` with `pages.dev`.
