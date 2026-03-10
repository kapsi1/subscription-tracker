# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

pnpm monorepo with three packages:
- `frontend/` — Next.js 16 + React 19 (port 3000)
- `backend/` — NestJS 11 (port 3001)
- `packages/shared/` — TypeScript types, colors, currencies, locales shared by both

## Commands

### Development
```bash
docker-compose up -d          # Start PostgreSQL (port 5433), Redis, Mailpit
pnpm install                  # Install all workspace dependencies
pnpm run dev                  # Start shared (watch) + backend + frontend concurrently
pnpm run dev:backend          # Backend only
pnpm run dev:frontend         # Frontend only
```

### Build
```bash
pnpm run build                # Build all packages
pnpm run build:shared         # Build shared package only
```

### Linting & Formatting
```bash
pnpm run lint           # Check all packages (Biome)
pnpm run lint:write     # Check and auto-fix all packages
```

### Testing
```bash
# Backend (Jest)
cd backend && pnpm test               # All unit tests
cd backend && pnpm test:watch         # Watch mode
cd backend && pnpm test:cov           # Coverage
cd backend && pnpm test:e2e           # E2E (Jest)
cd backend && pnpm test -- --testPathPattern=auth  # Single test file

# Frontend (Vitest)
cd frontend && pnpm test              # All unit tests (run once)
cd frontend && pnpm test:watch        # Watch mode

# E2E (Playwright — from root)
pnpm run e2e                          # Headless
pnpm run e2e:ui                       # UI mode
```

### Database
```bash
cd backend && npx prisma migrate dev          # Apply migrations
cd backend && npx prisma migrate dev --name <name>  # Create migration
cd backend && npx prisma db seed              # Seed database
cd backend && npx prisma studio               # Open GUI
cd backend && npx prisma generate             # Regenerate client after schema changes
```

## Architecture

### Data Flow
Frontend → Axios (with JWT interceptor) → NestJS REST API → Prisma → PostgreSQL

Background jobs: NestJS alerts module → BullMQ → Redis → Email/Webhook/WebPush

### Backend (NestJS)
Standard NestJS module structure: `routes → controllers → services → Prisma service`

Key modules: `auth`, `users`, `subscriptions`, `dashboard`, `alerts`, `notifications`, `payments`, `health`

- `src/prisma/` — PrismaService (global singleton)
- `src/common/` — Global exception filter, request ID middleware, sanitize pipe
- Validation: `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`
- Logging: pino + nestjs-pino (redacts Authorization/Cookie headers)
- API docs: Swagger at `/api/docs`

### Frontend (Next.js App Router)
- `src/app/(dashboard)/` — Protected route group (layout enforces auth)
- `src/app/auth/` — Login, signup, OAuth callback
- `src/lib/api.ts` — Axios instance; request interceptor injects JWT from localStorage; response interceptor dispatches "unauthorized" event on 401
- `src/lib/query-client.ts` — TanStack Query config (5-min stale, 30-min cache, 1 retry, no refetch on focus)
- `src/components/providers.tsx` — Wraps app with QueryClient, Theme, Auth, i18n providers
- `src/components/auth-provider.tsx` — Auth context (user, login, logout, fetchUser)

### Shared Package
Import as `@subscription-tracker/shared`. Contains shared TypeScript interfaces, colors, currencies, and locale strings. Must be built (`pnpm run build:shared`) before backend or frontend can use it. In dev, run `pnpm run dev:shared` to watch for changes.

### Authentication
- JWT stored in localStorage (`accessToken`, `refreshToken`) and cookie (`accessToken`)
- Google OAuth flow: frontend → `/auth/callback` → backend issues JWT
- Backend guards: `JwtAuthGuard` (Passport strategy) on protected controllers

### Biome Configuration
Single quotes, 2-space indent, 100-char line width. Biome is the formatter/linter for all packages. `noExplicitAny` is disabled. Config is at the root `biome.json`.

### Environment
Backend reads from `backend/.env`. Frontend reads `NEXT_PUBLIC_API_URL` (defaults to `http://127.0.0.1:3001`).

Key backend env vars: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `SMTP_*`, Google OAuth credentials.
