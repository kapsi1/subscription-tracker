# SubTracker

**SubTracker** is a full-stack subscription cost tracker that helps you manage your recurring expenses, set billing reminders, and visualise spending trends.

## Features

- 📊 **Interactive Dashboard** – Monthly & yearly cost summaries, dynamic cost-by-category charts, 12-month forecast, and a monthly payment calendar with tooltips.
- 🔔 **Intelligent Alerts** – Configurable email reminders (1-30 days before billing) and web-push notifications; daily digest emails for yesterday's payments.
- 🗂️ **Subscription Management** – CRUD with advanced search/filter/sort; custom billing cycles (specific days of the month); bulk import/export via JSON with data preview.
- 📅 **External Export** – Export individual subscriptions to **Google Calendar** with a single click.
- 💰 **Budgeting** – Set monthly budget thresholds and receive email alerts when your total costs exceed your budget.
- 👤 **Account & Security** – Email/password and **Google OAuth** login; email verification; forgot-password flow; secure profile settings and account deletion.
- ⚙️ **Customisation** – Advanced category management (custom icons & colors), custom accent-color picker, dark/light/system theme support, and currency selection.
- 🌍 **Internationalisation** – Support for **11 languages** (English, Polish, German, Spanish, French, Italian, Portuguese, Russian, Chinese, Japanese, Korean) with localized date/number formatting.
- 📱 **PWA Support** – Installable on mobile devices with modern PWA features for a native-like experience.
- 🔒 **Security** – JWT + refresh tokens, rate limiting, Helmet headers, input sanitisation, and bcrypt password hashing.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11 · TypeScript · Prisma ORM |
| Database | PostgreSQL |
| Queue / Cache | Redis + BullMQ |
| Frontend | Next.js 15 (App Router) · Tailwind CSS · TanStack Query |
| Analytics | Google Analytics 4 (GA4) · Google Tag Manager (GTM) |
| Shared types | `@subtracker/shared` workspace package |
| Email | Nodemailer (dev: Mailpit, prod: SMTP relay) |
| API Docs | Swagger / OpenAPI |
| Testing | Vitest (unit) · Playwright (E2E) |
| Infra | Docker Compose |

## Quick Start

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- [pnpm 10+](https://pnpm.io) (`npm install -g pnpm`)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)

### 1 – Start infrastructure services

```bash
docker compose up -d
```

This starts PostgreSQL (port **5433**), Redis (port **6379**), and Mailpit (SMTP **1025**, web UI **8025**).

### 2 – Install & Build

```bash
pnpm install
pnpm run build:shared
```

### 3 – Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values (DATABASE_URL, JWT_SECRET, etc.)
```

See [docs/ENV_VARS.md](docs/ENV_VARS.md) for a full reference of every environment variable.

### 4 – Set up the database

```bash
cd backend
pnpm prisma migrate dev
pnpm prisma db seed   # optional – loads sample data
cd ..
```

### 5 – Run development servers

```bash
pnpm dev
```

This concurrently starts the shared package watcher, the NestJS backend (**:3001**), and the Next.js frontend (**:3000**).

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Useful URLs

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend application |
| http://localhost:3001/api/docs | Swagger API documentation |
| http://localhost:3001/health | Backend health check status |
| http://localhost:8025 | Mailpit email UI (dev) |

## Project Structure

```
subtracker/
├── backend/          # NestJS API server
│   ├── prisma/       # Prisma schema & migrations
│   └── src/          # Application modules (auth, subs, dashboard, alerts, etc.)
├── frontend/         # Next.js application
│   └── src/
│       ├── app/      # App Router pages & layouts
│       ├── components/ # Atomic UI components
│       └── lib/      # API client & i18n config
├── packages/
│   └── shared/       # Shared TypeScript types & localized strings
├── e2e/              # Playwright end-to-end tests
├── docker-compose.yml
└── docs/             # Technical documentation & setup guides
```

## Running Tests

```bash
# Unit tests (backend)
cd backend && pnpm test

# Unit tests (frontend)
cd frontend && pnpm test

# All unit tests from root
pnpm test:all

# E2E tests (requires dev servers running)
pnpm e2e

# E2E tests with Playwright UI
pnpm e2e:ui
```

## Production Deployment

See [docs/SETUP.md](docs/SETUP.md) for full production deployment instructions.

A Docker-based deployment is recommended. Each service has its own `Dockerfile`. For a manual build:

1. Set all environment variables (see [docs/ENV_VARS.md](docs/ENV_VARS.md))
2. Build all: `pnpm build`
3. Run migrations: `cd backend && pnpm prisma migrate deploy`
4. Start processes: `node backend/dist/main.js` and `node frontend/.next/standalone/server.js`

## API Documentation

Interactive Swagger UI is available at `/api/docs` on the backend port. Most endpoints require a `Bearer` JWT token.

## License

ISC © Kamil Kapsiak
