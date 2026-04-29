# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/qurbani-market run dev` — run Qurbani mobile app (Expo) locally
- `pnpm --filter @workspace/qurbani-market run typecheck` — typecheck Qurbani app

## Apps

- **Qurbani** (`artifacts/qurbani-market`) — Expo / React Native mobile app for an animal/livestock marketplace. Cloned from `git@github.com:AsadBukharee/Qurbani.git`. Uses expo-router, AsyncStorage, expo-image, expo-image-picker, expo-location, react-native-reanimated, and the shared API client.
  - **Bottom tabs**: Home, Search (formerly "Browse"), Boli, Karwan, Inbox, Profile. Tasbih is hidden via `href: null` (file kept for deep-link compatibility).
  - **Side drawer** (`components/SettingsDrawer.tsx`) — opened from the home hamburger icon. Houses Language, Notifications, Wishlist, Wallet, Dark/Light theme toggle, My Ads, and Sign Out. Home header only renders the bell + hamburger to keep small devices uncluttered.
  - **Saved location** (`contexts/LocationContext.tsx`) — persisted to AsyncStorage under `user_location` (city, province, address, lat/lng, source). The `LocationFormSheet` component (mirrors step 2 of the create-ad wizard) is the single editor used by both the home "Set location" pill and the create-ad flow. The create wizard pre-fills from saved location and writes back when GPS is fetched.
  - **Home search** has no filter button — by default it filters listings to the user's saved city; pressing return jumps to the Search tab. The Search tab carries the full filter set (FilterModal: city/province/price/weight + sort).
  - Backend dependencies for the new flows are listed in `attached_assets/backend_tasks.md` (saved location, wishlist, theme preference, animals search w/ proximity, notifications, wallet).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
