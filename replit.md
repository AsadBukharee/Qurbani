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

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
