# SubTracker – Backend

NestJS REST API for the SubTracker subscription management application.

## Quick start

> Run from the **monorepo root** with `pnpm dev` to start all services together.

To run the backend in isolation:

```bash
# Install dependencies (if not done at root)
pnpm install

# Apply database migrations
pnpm prisma migrate dev

# Start in watch mode
pnpm dev
```

The API server starts on **http://localhost:3001**.  
Swagger UI is available at **http://localhost:3001/api/docs**.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start with hot-reload (ts-node-dev) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start:prod` | Run the compiled build |
| `pnpm test` | Run unit tests (Vitest/Jest) |
| `pnpm test:cov` | Run tests with coverage report |
| `pnpm prisma migrate dev` | Apply and generate DB migrations |
| `pnpm prisma db seed` | Seed development data |
| `pnpm prisma studio` | Open Prisma Studio GUI |

## Module structure

```
src/
├── auth/           # JWT auth, Google OAuth, registration, email verification
├── users/          # User profile management
├── subscriptions/  # Subscription CRUD & billing-date logic
├── dashboard/      # Cost aggregation & forecast endpoints
├── alerts/         # Alert configuration per subscription
├── categories/     # User-owned category management
├── payments/       # Payment history
├── notifications/  # Web Push subscriptions
├── health/         # /health endpoint (DB + Redis)
└── common/         # Shared filters, pipes, guards, middleware
```

## Environment variables

See [docs/ENV_VARS.md](../docs/ENV_VARS.md) for the full reference.  
Copy `backend/.env.example` to `backend/.env` to get started.

## Tests

```bash
pnpm test           # unit tests
pnpm test:cov       # with coverage
```

E2E tests live in the monorepo root `e2e/` directory and are run via `pnpm e2e`.
