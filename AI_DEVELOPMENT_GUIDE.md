# AI Development Guide - SubTracker

This document is designed to provide high-context, low-token overhead for AI agents working on this codebase.

## General instructions
If there's documentation, update it after changes. For any new feature add unit and E2E tests. Add TODOs when user asks for something that's not in TODOs yet. If there's a TODO done, check it. If user asks to do a TODO, do only that TODO and nothing else.
All temporary files should go into untracked /temp directory.

## 🏗️ Architecture Overview

The project is a **pnpm monorepo** using a modern TypeScript stack:

- **Frontend**: Next.js 15+ (App Router), React 19, Tailwind CSS, TanStack Query, Axios. (Port 3000)
- **Backend**: NestJS 11, Prisma ORM, PostgreSQL, Redis, BullMQ for background jobs. (Port 3001)
- **Shared**: `@subtracker/shared` - Common types, constants, and localized strings.
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
| `users` | `src/users/` | User profile, settings, account management, budget config |
| `subscriptions` | `src/subscriptions/` | Subscription CRUD, billing date logic, JSON import/export |
| `dashboard` | `src/dashboard/` | Summary stats, monthly payments, 12-month forecast |
| `payments` | `src/payments/` | Payment history CRUD, standalone payments |
| `categories` | `src/categories/` | Category CRUD, default icons/colors, reset to defaults |
| `alerts` | `src/alerts/` | Alert config CRUD, cron scheduler, BullMQ job processor |
| `notifications` | `src/notifications/` | Email (templates + sending), web push |
| `health` | `src/health/` | Health check endpoint (DB + Redis + Queue) |
| `common` | `src/common/` | Pipes (sanitize, validation), utils, filters |

## 🖥️ Frontend Routes

| Route | File | Notes |
|-------|------|-------|
| `/` | `app/page.tsx` | Redirects to `/dashboard` or `/login` |
| `/login` | `app/login/page.tsx` | Login + language selector |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Main dashboard with summary cards and calendar |
| `/manage/subscriptions` | `app/(dashboard)/manage/subscriptions/page.tsx` | Main subscription management tab |
| `/manage/categories` | `app/(dashboard)/manage/categories/page.tsx` | Category management sub-tab |
| `/manage/history` | `app/(dashboard)/manage/history/page.tsx` | Full payment history sub-tab |
| `/subscriptions` | `app/(dashboard)/subscriptions/page.tsx` | All subscriptions sortable table view |
| `/settings/preferences` | `app/(dashboard)/settings/preferences/page.tsx` | Accent color, currency, language, default reminders, budget |
| `/settings/profile` | `app/(dashboard)/settings/profile/page.tsx` | Profile info, change password/email, delete account |

## 🚀 Development & Commands

### 🛠️ Environment Setup
1. `docker-compose up -d` (PostgreSQL, Redis, Mailpit)
2. `pnpm install`
3. `pnpm run build:shared` (Crucial for first run)
4. `pnpm run dev` (Starts backend, frontend, and shared in watch mode)

### 🧪 Testing & Verification
- **E2E**: `pnpm run e2e`.
  - **AI Tip**: The backend respects `x-e2e-testing: true` header to bypass email verification and use test-mode logic.
- **Backend / Frontend**: `pnpm test` in respective directories.
- **Lint**: `pnpm run lint:write`.

## 💡 AI Optimization Tips (Token Saving)

1. **Shared Package**: If you change `packages/shared`, you MUST rebuild it (`pnpm build:shared`).
2. **E2E Testing Port**: Backend is 3001, Frontend is 3000.
3. **Auth Flow**: Uses JWT. Google OAuth is supported. Email verification is enabled.
4. **Email Templates**: HTML builders are in `backend/src/notifications/email/email-templates.ts`.
5. **Analytics**: Uses `NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_GTM_ID`.

## 🌍 Translations (i18n)

The app supports **11 languages** (en, pl, de, es, fr, it, ja, ko, pt, ru, zh).

### Architecture

- **Single source of truth**: All translation strings live in `packages/shared/src/locales/`.
- **Frontend**: Using `i18next`. Language is detected from browser/localStorage/user profile.
- **Backend**: Email service selects strings from `LOCALES` object by user language.

### AI Tips

- To add a new string, add it to **all** relevant JSON files in `packages/shared/src/locales/`, then rebuild shared.
- To add a new language, add a locale file, export it from `packages/shared/src/index.ts`, and register it in `frontend/src/lib/i18n.ts`.

## 📦 Shared Package Exports

| Export | Type | Description |
|--------|------|-------------|
| `Subscription` | interface | Primary subscription model |
| `Settings` | interface | User preference shape |
| `DashboardSummary` | interface | Aggregated stats for cards |
| `Category` | interface | Category with icon, color, and order |
| `LOCALES` | object | Dictionary of all 11 language strings |
| `DEFAULT_CATEGORIES` | array | Base category list (translated) |
| `CATEGORY_ICONS` | object | Lucide icon name mapping |

## 🔍 Key Files to Check First
- `CLAUDE.md`: Quick command reference.
- `package.json` (root): Workspace script definitions.
- `packages/shared/src/types.ts`: Global shared types.
- `backend/src/notifications/email/email-templates.ts`: Email HTML templates.
- `packages/shared/src/locales/`: All translation files.
