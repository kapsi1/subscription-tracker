# SubTracker – Setup & Deployment Guide

## Development Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS+ | https://nodejs.org |
| pnpm | 10+ | `npm install -g pnpm` |
| Docker Desktop | latest | https://docs.docker.com/get-docker/ |
| Git | any | https://git-scm.com |

---

### Step 1 – Clone the repository

```bash
git clone <repository-url> subtracker
cd subtracker
```

### Step 2 – Start infrastructure with Docker Compose

```bash
docker compose up -d
```

| Service | Host port | Description |
|---------|-----------|-------------|
| PostgreSQL | 5433 | Primary database |
| Redis | 6379 | Queue / cache |
| Mailpit | 1025 (SMTP) / 8025 (UI) | Local email catcher |

Wait a few seconds for the database to be ready before the next step.

### Step 3 – Install & Build Shared Package

```bash
pnpm install
pnpm run build:shared
```

The shared package (`@subtracker/shared`) MUST be built before the frontend and backend can be started for the first time.

### Step 4 – Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and at minimum set:

- `DATABASE_URL` – your Postgres connection string (defaults to `subtracker.local` in example)
- `JWT_SECRET` – a random string for technical authentication

For the frontend, create `frontend/.env.local`:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > frontend/.env.local
echo "NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX" >> frontend/.env.local # optional
```

See [ENV_VARS.md](ENV_VARS.md) for the full variable reference.

### Step 5 – Initialise the database

```bash
cd backend
pnpm prisma migrate dev
```

Optionally seed the database with sample data:

```bash
pnpm prisma db seed
cd ..
```

Or import the bundled test subscriptions JSON via the app's **Manage → Import** page after creating an account.

### Step 6 – Start development servers

```bash
pnpm dev
```

This starts three processes concurrently:

| Process | URL | Notes |
|---------|-----|-------|
| Next.js frontend | http://localhost:3000 | Main user interface |
| NestJS backend | http://localhost:3001 | REST API server |
| Shared package | – | Watched for type changes |

### Step 7 – Verify everything works

- Open http://localhost:3000 and create an account.
- Check http://localhost:8025 (Mailpit) for the verification email.
- Open http://localhost:3001/api/docs to browse the Swagger documentation.
- Check http://localhost:3001/health for system health status.

---

## Running Tests

### Unit & Integration tests

```bash
# Backend (Jest)
cd backend && pnpm test

# Frontend (Vitest)
cd frontend && pnpm test

# All (from root)
pnpm test:all
```

### End-to-end tests (Playwright)

The E2E suite requires the dev servers to be running first:

```bash
# Terminal 1
pnpm dev

# Terminal 2
pnpm e2e          # headless
pnpm e2e:ui       # with Playwright UI explorer
```

Test reports are saved to `playwright-report/`.

---

## Production Deployment

### Environment variables

Create all required environment variables on your hosting platform. See [ENV_VARS.md](ENV_VARS.md) and the template at `backend/.env.production.example`.

Critical values (example for subtracker.cc):

```
NODE_ENV=production
JWT_SECRET=<long-random-string>
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?schema=public
REDIS_HOST=<redis-host>
SMTP_HOST=<your-smtp-relay>
SMTP_FROM="SubTracker" <noreply@subtracker.cc>
FRONTEND_URL=https://app.subtracker.cc
NEXT_PUBLIC_API_URL=https://api.subtracker.cc
NEXT_PUBLIC_GA_ID=<your-ga-id>
```

### Build

```bash
pnpm build
```

This builds the shared package, the NestJS backend, and the Next.js frontend (using standalone output).

### Database migrations

Run migrations against the production database before starting the process:

```bash
cd backend
DATABASE_URL=<prod-db-url> pnpm prisma migrate deploy
```

### Starting the processes

**Backend**
```bash
node backend/dist/main.js
```

**Frontend**
```bash
node frontend/.next/standalone/server.js
```

> Ensure `output: 'standalone'` is set in `next.config.ts`.

### Docker Deployment

Each sub-app ships with a `Dockerfile`. A `docker-compose.yml` is provided for local stack orchestration; adapt it for production as needed.

### Health checks

The backend exposes a health endpoint at `GET /health` that verifies Database, Redis, and BullMQ connectivity. Configure your platform to monitor this endpoint.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED 5433` | Run `docker compose up -d` and wait for Postgres |
| `Shared package types stale` | Run `pnpm run build:shared` then restart `pnpm dev` |
| `Prisma engine not found` | Run `pnpm install` then `cd backend && pnpm prisma generate` |
| `JWT_SECRET` errors | Ensure `JWT_SECRET` is set in `backend/.env` |
| Port 3000 or 3001 in use | Kill the conflicting process or change ports in `.env` |
| Google OAuth redirect mismatch | Ensure `GOOGLE_CALLBACK_URL` matches your registered origin |
