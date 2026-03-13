# AI Development Guide - SubTracker

This document is designed to provide high-context, low-token overhead for AI agents working on this codebase.

## 🏗️ Architecture Overview

The project is a **pnpm monorepo** using a modern TypeScript stack:

- **Frontend**: Next.js 15+ (App Router), React 19, Tailwind CSS, TanStack Query, Axios. (Port 3000)
- **Backend**: NestJS 11, Prisma ORM, PostgreSQL, Redis, BullMQ for background jobs. (Port 3001)
- **Shared**: `@subtracker/shared` - Common types, constants, and logic.
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

## 🌍 Translations (i18n)

The app supports **English (`en`)** and **Polish (`pl`)**, using `react-i18next` + `i18next` on the frontend and direct locale object access on the backend.

### Architecture

- **Single source of truth**: All translation strings live in `packages/shared/src/locales/`. Both frontend and backend import from there via `@subtracker/shared`.
- **Frontend**: `i18next` with `i18next-browser-languagedetector` (reads from `localStorage`, falls back to browser language, then `en`).
- **Backend**: No i18n library — the email service imports `LOCALES` directly and selects strings by language key.
- **Persistence**: The user's language preference is stored in the database (`user.language`) and synced to the frontend i18n instance on login via `I18nProvider`.

### Key Files

| File | Purpose |
|------|---------|
| `packages/shared/src/locales/en.json` | English translations (UI + emails) |
| `packages/shared/src/locales/pl.json` | Polish translations (UI + emails) |

### Usage Patterns

**Frontend — component:**
```typescript
const { t, i18n } = useTranslation();
t('auth.status.loginSuccess')   // access a nested key
i18n.changeLanguage('pl')       // switch language
```

**Backend — email service:**
```typescript
import { LOCALES } from '@subtracker/shared';
const strings = LOCALES[language];  // 'en' | 'pl'
```

### Translation Key Structure (top-level namespaces)

`auth` · `common` · `nav` · `dashboard` · `theme` · `language` · `colors` · `subscriptions` · `settings` · `emails`

### AI Tips

- To add a new string, add it to **both** `en.json` and `pl.json` in `packages/shared/src/locales/`, then rebuild shared (`pnpm run build:shared`).
- To add a new language, add a locale file under `packages/shared/src/locales/`, export it from `packages/shared/src/index.ts`, and register it in `frontend/src/lib/i18n.ts`.

## 🔍 Key Files to Check First
- `CLAUDE.md`: Quick command reference and simplified architecture.
- `package.json` (root): Workspace script definitions.
- `backend/src/app.module.ts`: Backend module graph.
- `frontend/src/lib/api.ts`: Axios configuration for API calls.
- `packages/shared/src/types.ts`: Global types.
