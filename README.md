# SubTracker

**SubTracker** is a full-stack subscription cost tracker that helps you manage your recurring expenses, set billing reminders, and visualise spending trends.

## Features

- 📊 **Dashboard** – Monthly & yearly cost summaries, cost-by-category charts, 12-month forecast, and an interactive payment calendar
- 🔔 **Alerts** – Email and web-push reminders before each billing date; daily digest emails
- 🗂️ **Subscription Management** – CRUD with search/filter/sort; bulk import via JSON; payment history
- 👤 **Accounts** – Email/password and Google OAuth; email verification; forgot-password flow; profile settings
- ⚙️ **Settings** – Custom categories (with icons & colors), accent-color picker, language selector, currency selector, push notifications
- 🌐 **Internationalisation** – Multiple languages via `next-intl`
- 🔒 **Security** – JWT + refresh tokens, rate limiting, Helmet headers, input sanitisation, bcrypt passwords

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS · TypeScript · Prisma ORM |
| Database | PostgreSQL |
| Queue / Cache | Redis + BullMQ |
| Frontend | Next.js (App Router) · Tailwind CSS |
| Shared types | `@subtracker/shared` workspace package |
| Email | Nodemailer (dev: Mailpit, prod: SMTP relay) |
| API Docs | Swagger / OpenAPI at `/api/docs` |
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

### 2 – Install dependencies

```bash
pnpm install
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
| http://localhost:3001/health | Backend health check |
| http://localhost:8025 | Mailpit email UI (dev) |

## Project Structure

```
subtracker/
├── backend/          # NestJS API server
│   ├── prisma/       # Prisma schema & migrations
│   └── src/          # Application source
│       ├── auth/
│       ├── subscriptions/
│       ├── dashboard/
│       ├── alerts/
│       ├── categories/
│       ├── payments/
│       ├── notifications/
│       ├── users/
│       └── health/
├── frontend/         # Next.js application
│   └── src/
│       ├── app/      # App Router pages & layouts
│       ├── components/
│       └── lib/
├── packages/
│   └── shared/       # Shared TypeScript types & utilities
├── e2e/              # Playwright end-to-end tests
├── docker-compose.yml
└── docs/             # Additional documentation
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

Key steps at a glance:

1. Set all required environment variables (see [docs/ENV_VARS.md](docs/ENV_VARS.md))
2. Build: `pnpm build`
3. Run migrations: `cd backend && pnpm prisma migrate deploy`
4. Start: `node backend/dist/main.js` and `node frontend/.next/standalone/server.js`

A Docker-based deployment is recommended. Each service (`backend`, `frontend`) has its own `Dockerfile`.

## API Documentation

Interactive Swagger UI is available at `http://localhost:3001/api/docs` when the backend is running. All endpoints require a `Bearer` JWT token (except `/auth/login` and `/auth/register`).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a high-level API overview.

## Contributing

1. Fork the repo and create a feature branch
2. Make changes and add/update tests
3. Run `pnpm lint` and fix any issues
4. Open a pull request

## License

ISC © Kamil Kapsiak
