# AI Development Guide - SubTracker

This document is designed to provide high-context, low-token overhead for AI agents working on this codebase.

## General instructions
If there's documentation, update it after changes. For any new feature add unit and E2E tests. Add TODOs when user asks for something that's not in TODOs yet. If there's a TODO done, check it. If user asks to do a TODO, do only that TODO and nothing else.

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
│   ├── src/            # Modular structure (see Backend Modules below)
│   └── prisma/         # Schema and migrations
├── frontend/           # Next.js application
│   └── src/app/        # App Router pages and layouts
├── packages/shared/    # Shared library (MUST be built to be used)
├── e2e/                # Playwright test suites
├── scripts/            # Utility scripts (e.g., run-e2e.mjs)
└── CLAUDE.md           # Primary AI command reference (Read first!)
```

## 🧩 Backend Modules

| Module | Path | Responsibility |
|--------|------|----------------|
| `auth` | `src/auth/` | JWT auth, Google OAuth, email verification, password reset |
| `users` | `src/users/` | User profile, settings, account management, push subscriptions |
| `subscriptions` | `src/subscriptions/` | Subscription CRUD, billing date logic, JSON import/export |
| `dashboard` | `src/dashboard/` | Summary stats, monthly payments, 12-month forecast |
| `payments` | `src/payments/` | Payment history CRUD, standalone payments |
| `categories` | `src/categories/` | Category CRUD, reordering, reset to defaults |
| `alerts` | `src/alerts/` | Alert config CRUD, cron scheduler, BullMQ job processor |
| `notifications` | `src/notifications/` | Email (templates + sending), web push |
| `health` | `src/health/` | Health check endpoint (DB + Redis) |
| `common` | `src/common/` | Pipes (sanitize, validation), utils (encryption), filters |
| `prisma` | `src/prisma/` | PrismaService singleton |

## 🖥️ Frontend Routes

| Route | File | Notes |
|-------|------|-------|
| `/` | `app/page.tsx` | Redirects to `/dashboard` or `/login` |
| `/login` | `app/login/page.tsx` | Login + language selector |
| `/forgot-password` | `app/forgot-password/page.tsx` | Request password reset |
| `/reset-password` | `app/reset-password/page.tsx` | Set new password via token |
| `/verify-email` | `app/verify-email/page.tsx` | Verify email via token |
| `/auth/callback` | `app/auth/callback/page.tsx` | Google OAuth callback |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Main dashboard |
| `/manage` | `app/(dashboard)/manage/page.tsx` | Redirects to `/manage/subscriptions` |
| `/manage/subscriptions` | `app/(dashboard)/manage/subscriptions/page.tsx` | Subscription list + management |
| `/manage/history` | `app/(dashboard)/manage/history/page.tsx` | Full payment history |
| `/subscriptions` | `app/(dashboard)/subscriptions/page.tsx` | All subscriptions table view |
| `/settings` | `app/(dashboard)/settings/page.tsx` | Redirects to `/settings/preferences` |
| `/settings/preferences` | `app/(dashboard)/settings/preferences/page.tsx` | Appearance, localization, notifications, categories, budget |
| `/settings/profile` | `app/(dashboard)/settings/profile/page.tsx` | Profile, change password/email, delete account |

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

1. **Avoid full codebase scans**: Most business logic is in `backend/src/subscriptions/`, `backend/src/dashboard/`, and `backend/src/alerts/`.
2. **Shared Package**: If you change `packages/shared`, you MUST ensure it is built/watched, or types in frontend/backend will be stale.
3. **E2E Testing Port**: Backend is 3001, Frontend is 3000. Playwright looks for these.
4. **Auth Flow**: Uses JWT (localStorage + Cookies). If auth fails in E2E, check `x-e2e-testing` header or `process.env.E2E_TESTING`. Auth supports both email/password and Google OAuth. Email verification is required before login.
5. **Prisma**: Always run `npx prisma generate` after schema changes.
6. **Email Templates**: All email HTML builders are in `backend/src/notifications/email/email-templates.ts`. Do not split this file.
7. **Settings URL structure**: Settings has sub-routes — `/settings/preferences` and `/settings/profile`. The `/settings` route redirects to preferences.

## 🌍 Translations (i18n)

The app supports **English (`en`)** and **Polish (`pl`)**, using `react-i18next` + `i18next` on the frontend and direct locale object access on the backend.

### Architecture

- **Single source of truth**: All translation strings live in `packages/shared/src/locales/`. Both frontend and backend import from there via `@subtracker/shared`.
- **Frontend**: `i18next` with `i18next-browser-languagedetector` (reads from `localStorage`, falls back to browser language, then `en`).
- **Backend**: No i18n library — the email service selects strings by language key.
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

## 📦 Shared Package Exports

`packages/shared/src/index.ts` exports:

| Export | Type | Description |
|--------|------|-------------|
| `Subscription` | interface | Subscription shape used across frontend and backend |
| `Settings` | interface | User settings shape |
| `ForecastPayment` | interface | Individual payment in a forecast bucket |
| `ForecastItem` | interface | Monthly forecast bucket with payments |
| `DashboardSummary` | interface | Summary card data |
| `Category` | interface | Category with id, name, color, icon, order |
| `PaymentHistory` | interface | Payment record |
| `BillingCycle` | enum | `monthly` \| `yearly` \| `custom` |
| `COLORS` | `ColorsConfig` | Accent color definitions (light/dark variants) |
| `CURRENCIES` | array | List of supported currencies |
| `LOCALES` | object | `{ en, pl }` locale strings |
| `DEFAULT_CATEGORIES` | array | Default category list |
| `CATEGORY_ICONS` | object | Icon name map for categories |
| `getAccentColor()` | function | Resolve accent color config by name |

## 🔍 Key Files to Check First
- `CLAUDE.md`: Quick command reference and simplified architecture.
- `package.json` (root): Workspace script definitions.
- `backend/src/app.module.ts`: Backend module graph.
- `frontend/src/lib/api.ts`: Axios configuration for API calls.
- `packages/shared/src/types.ts`: Global types shared between frontend and backend.
- `backend/src/notifications/email/email-templates.ts`: All email HTML template builders.
- `packages/shared/src/locales/`: Translation files (en.json, pl.json).
