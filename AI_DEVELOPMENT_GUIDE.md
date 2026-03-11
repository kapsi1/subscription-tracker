# AI Development Guide - Subscription Cost Tracker

This document is designed to provide high-context, low-token overhead for AI agents working on this codebase.

## 🏗️ Architecture Overview

The project is a **pnpm monorepo** using a modern TypeScript stack:

- **Frontend**: Next.js 15+ (App Router), React 19, Tailwind CSS, TanStack Query, Axios. (Port 3000)
- **Backend**: NestJS 11, Prisma ORM, PostgreSQL, Redis, BullMQ for background jobs. (Port 3001)
- **Shared**: `@subscription-tracker/shared` - Common types, constants, and logic.
- **Testing**:
  - **E2E**: Playwright (against live/dev server).
  - **Backend**: Jest (Unit & Integration).
  - **Frontend**: Vitest (Unit).
- **Tooling**: Biome (Linting & Formatting).

## 📁 Repository Structure

```text
/
├── backend/            # NestJS application
│   ├── src/            # Modular structure (auth, subs, dashboard, etc.)
│   └── prisma/         # Schema and migrations
├── frontend/           # Next.js application
│   └── src/app/        # App Router pages and layouts
├── packages/shared/    # Shared library (MUST be built to be used)
├── e2e/                # Playwright test suites
├── scripts/            # Utility scripts (e.g., run-e2e.mjs)
└── CLAUDE.md           # Primary AI command reference (Read first!)
```

## 🚀 Development & Commands

### 🛠️ Environment Setup
1. `docker-compose up -d` (PostgreSQL, Redis, Mailpit)
2. `pnpm install`
3. `pnpm run build:shared` (Crucial for first run)
4. `pnpm run dev` (Starts backend, frontend, and shared in watch mode)

### 🧪 Testing & Verification
- **E2E**: `pnpm run e2e` (Headless) or `pnpm run e2e:ui`.
  - **AI Tip**: The backend respects `x-e2e-testing: true` header to bypass email verification and use test-mode logic without restarting the server.
- **Backend**: `cd backend && pnpm test`.
- **Frontend**: `cd frontend && pnpm test`.
- **Lint**: `pnpm run lint:write`.

### 🗄️ Database
- `cd backend && npx prisma migrate dev`
- `cd backend && npx prisma db seed`

## 💡 AI Optimization Tips (Token Saving)

1. **Avoid full codebase scans**: Most business logic is in `backend/src/subscriptions/` and `backend/src/dashboard/`.
2. **Shared Package**: If you change `packages/shared`, you MUST ensure it is built/watched, or types in frontend/backend will be stale.
3. **E2E Testing Port**: Backend is 3001, Frontend is 3000. Playwright looks for these.
4. **Auth Flow**: Uses JWT (localStorage + Cookies). If auth fails in E2E, check `x-e2e-testing` header or `process.env.E2E_TESTING`.
5. **Prisma**: Always run `npx prisma generate` after schema changes.

## 🔍 Key Files to Check First
- `CLAUDE.md`: Quick command reference and simplified architecture.
- `package.json` (root): Workspace script definitions.
- `backend/src/app.module.ts`: Backend module graph.
- `frontend/src/lib/api.ts`: Axios configuration for API calls.
- `packages/shared/src/types.ts`: Global types.
