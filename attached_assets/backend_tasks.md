# Qurbani — Backend Tasks

> Tasks needed by the **mobile app** (Expo) so the recent UI/UX changes are
> backed by real APIs. The frontend is already wired to existing endpoints in
> `lib/api.ts`; everything below is **net new**.
>
> Priority key: **P0** = blocks shipped UI · **P1** = important · **P2** = nice-to-have.

---

## 1. User profile — saved location (P0)

The mobile app now persists the user's selected location in `AsyncStorage`
(under key `user_location`) and uses it both to filter the home feed ("near
you") and to pre-fill the create-ad wizard.

**We need to mirror this on the server** so the location follows the user
across devices.

### Schema (User model)

Add to the `users` table:

| field            | type            | notes                                     |
| ---------------- | --------------- | ----------------------------------------- |
| `location_city`     | `varchar(120)`  | nullable                                  |
| `location_province` | `varchar(120)`  | nullable                                  |
| `location_address`  | `varchar(255)`  | nullable                                  |
| `location_lat`      | `numeric(10,7)` | nullable                                  |
| `location_lng`      | `numeric(10,7)` | nullable                                  |
| `location_source`   | `varchar(10)`   | enum: `gps` \| `manual`                   |
| `location_updated_at` | `timestamptz` | auto-managed                              |

### Endpoints

- `PATCH /api/users/me/location`
  - body: `{ city, province?, address?, lat?, lng?, source }` (Zod-validated)
  - returns updated `UserLocation`
- `GET /api/users/me` — include `location` object in the response payload so
  the app can hydrate from server on login.

---

## 2. Wishlist (P0)

The drawer now exposes a **Wishlist** entry that routes to `/wishlist`. The
screen already exists locally but uses the in-memory `favorites` array. We
need a real persistent wishlist tied to the user.

### Schema

```sql
CREATE TABLE wishlist_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  animal_id    uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, animal_id)
);
CREATE INDEX wishlist_items_user_idx ON wishlist_items (user_id, created_at DESC);
```

### Endpoints

- `GET /api/wishlist` → `{ items: Animal[] }` (joined animal data, paginated)
- `POST /api/wishlist/{animalId}` → `{ added: true }`
- `DELETE /api/wishlist/{animalId}` → `{ removed: true }`
- `GET /api/wishlist/ids` → `{ ids: string[] }` (lightweight, for marking
  hearts on cards without re-fetching each animal)

---

## 3. Theme preference (P1)

The drawer now has a **Dark / Light** toggle. Currently it's local-only.
Persist it on the user so themes follow them across devices.

### Schema

Add to `users`:

| field        | type          | notes                         |
| ------------ | ------------- | ----------------------------- |
| `theme_pref` | `varchar(8)`  | enum: `dark` \| `light` \| `system`. default `dark`. |

### Endpoint

- `PATCH /api/users/me/preferences`
  - body: `{ theme?: "dark" | "light" | "system", language?: "en" | "ur" }`
  - returns updated `UserPreferences`

(Language already toggles in the drawer too — folding it into the same
endpoint keeps things tidy.)

---

## 4. Animals search — proximity + full filters (P0)

The home screen now searches "near user's location" by default. The Search
tab (formerly "Browse") exposes the full filter set. Both call the same
`GET /api/animals` endpoint, so it must accept these query params:

| param           | type     | notes                                                    |
| --------------- | -------- | -------------------------------------------------------- |
| `q`             | string   | full-text search across `title`, `breed`, `description`  |
| `category`      | enum     | `goat` \| `cow` \| `sheep` \| `dumba` \| `camel` \| `buffalo` |
| `animalProperty`| enum     | `khasi` \| `andal`                                       |
| `province`      | string   | exact match                                              |
| `city`          | string   | exact match — used by home feed for "near you"           |
| `minPrice`      | int      |                                                          |
| `maxPrice`      | int      |                                                          |
| `minWeight`     | int      | kg                                                       |
| `maxWeight`     | int      | kg                                                       |
| `lat`, `lng`    | float    | when both supplied, server should rank by distance and  |
|                 |          | accept `radiusKm` (default 50) for hard cutoff           |
| `radiusKm`      | int      | optional                                                 |
| `sort`          | enum     | `newest` \| `price_low` \| `price_high` \| `weight_high` \| `nearest` |
| `page`, `limit` | int      | pagination                                               |

Response shape (already used by the app):

```ts
{
  items: Animal[],
  page: number,
  limit: number,
  total: number,
  hasMore: boolean,
}
```

> **Distance**: use PostGIS `ST_DistanceSphere` if available, otherwise the
> Haversine formula in SQL. Add a GiST index on `animals(lat, lng)` (or a
> `geography(Point)` column if PostGIS).

---

## 5. Notifications inbox (P1)

The bell icon in the header is currently decorative. We want it to open a
real notifications screen.

### Schema

```sql
CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        varchar(40) NOT NULL,    -- 'boli_outbid', 'wishlist_price_drop', 'ad_approved', ...
  title       varchar(160) NOT NULL,
  body        text,
  data        jsonb,                   -- deep-link payload, e.g. { animalId }
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC);
```

### Endpoints

- `GET /api/notifications?unreadOnly=true&page=1&limit=20`
- `POST /api/notifications/{id}/read`
- `POST /api/notifications/read-all`
- `GET /api/notifications/unread-count` → `{ count: number }` (for the red
  dot on the bell)

---

## 6. Wallet endpoints (P2 — only if not already present)

The drawer routes to `/wallet`. If the wallet API isn't built yet, we need:

- `GET /api/wallet/balance` → `{ balance: number, currency: "PKR" }`
- `GET /api/wallet/transactions?page=1&limit=20`
- `POST /api/wallet/topup` → `{ amount, method }`

---

## 7. Reference data (P2)

Pakistan provinces & cities are currently hard-coded in the app
(`data/pakistan_locations.ts`). It's fine for now, but a small endpoint
would let us update lists without an app release:

- `GET /api/locations/provinces` → `{ provinces: { name, nameUr, cities: string[] }[] }`
  (cacheable for 1 day).

---

## OpenAPI / contract

This repo uses contract-first codegen (`pnpm --filter @workspace/api-spec
run codegen`). Please add the new endpoints + schemas to
`lib/api-spec/openapi.yaml` so the mobile app picks up typed hooks
automatically.

## Auth note

All endpoints above are **authenticated** (session cookie). The location
endpoint may be called immediately after login, so it must work with the
session created by `/api/auth/login`.
