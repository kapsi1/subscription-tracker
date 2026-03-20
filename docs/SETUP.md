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

### Step 3 – Install Node dependencies

```bash
pnpm install
```

### Step 4 – Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and at minimum set:

- `DATABASE_URL` – update with your Postgres host/credentials
- `JWT_SECRET` – any random string for development

For the frontend, create `frontend/.env.local`:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > frontend/.env.local
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

Or import the bundled test subscriptions JSON via the app's Settings → Import page after creating an account.

### Step 6 – Start development servers

```bash
pnpm dev
```

This starts three processes concurrently:

| Process | URL |
|---------|-----|
| Next.js frontend | http://localhost:3000 |
| NestJS backend | http://localhost:3001 |
| Shared package (watcher) | (build output only) |

### Step 7 – Verify everything works

- Open http://localhost:3000 and create an account.
- Check http://localhost:8025 (Mailpit) for the verification email.
- Open http://localhost:3001/api/docs to browse the Swagger API.

---

## Running Tests

### Unit tests

```bash
# Backend
cd backend && pnpm test

# Frontend
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

Create all required production environment variables on your hosting platform. See [ENV_VARS.md](ENV_VARS.md) and the template at `backend/.env.production.example`.

Critical values to set:

```
NODE_ENV=production
JWT_SECRET=<long random string>
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?schema=public
REDIS_HOST=<redis-host>
SMTP_HOST=<your-smtp-relay>
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
SMTP_FROM="SubTracker" <noreply@yourdomain.com>
FRONTEND_URL=https://app.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Build

```bash
pnpm build
```

This builds the shared package, the NestJS backend (`backend/dist`), and the Next.js frontend (`.next/`).

### Database migrations

Run migrations against the production database before starting the server:

```bash
cd backend
DATABASE_URL=<prod-db-url> pnpm prisma migrate deploy
```

### Starting the processes

**Backend**

```bash
node backend/dist/main.js
```

Or use a process manager:

```bash
pm2 start backend/dist/main.js --name subtracker-api
```

**Frontend**

```bash
node frontend/.next/standalone/server.js
```

> Enable standalone output in `next.config.ts`: `output: 'standalone'`

### Docker-based deployment

Each sub-app ships with a `Dockerfile`. Adapt `docker-compose.yml` for production by adding the `backend` and `frontend` services and pointing them at production environment variables.

Typical single-server setup:

```
[Nginx / Caddy reverse proxy]
   ├── / → frontend:3000
   └── /api → backend:3001
```

### Health checks

The backend exposes a health endpoint at `GET /health` that verifies database and Redis connectivity. Configure your load-balancer or orchestrator to poll this endpoint.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED 5433` | Run `docker compose up -d` and wait for Postgres to be ready |
| `Prisma engine not found` | Run `pnpm install` then `cd backend && pnpm prisma generate` |
| Emails not arriving (dev) | Open http://localhost:8025 – Mailpit catches all SMTP traffic |
| `JWT_SECRET` errors | Set `JWT_SECRET` in `backend/.env` |
| Port 3000 or 3001 already in use | Kill the conflicting process or change `PORT` in `.env` / `next.config.ts` |
| Google OAuth redirect mismatch | Ensure `GOOGLE_CALLBACK_URL` exactly matches the URI registered in Google Cloud Console |
