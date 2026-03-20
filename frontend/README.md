# SubTracker – Frontend

Next.js (App Router) frontend for the SubTracker subscription management application.

## Quick start

> Run from the **monorepo root** with `pnpm dev` to start all services together.

To run the frontend in isolation:

```bash
# Install dependencies (if not done at root)
pnpm install

# Start dev server
pnpm dev
```

The app is available at **http://localhost:3000**.

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server with HMR |
| `pnpm build` | Build production bundle |
| `pnpm start` | Start production server |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:ui` | Vitest UI explorer |
| `pnpm lint` | Run Biome linter |

## Page structure

```
src/app/
├── (auth)/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   └── verify-email/
├── (dashboard)/
│   ├── page.tsx          # Main dashboard
│   ├── subscriptions/    # All subscriptions list
│   └── settings/         # Preferences + Profile tabs
└── layout.tsx
```

## Key libraries

| Library | Purpose |
|---------|---------|
| `next-intl` | Internationalisation |
| `recharts` | Charts (forecast, category distribution) |
| `react-hook-form` + `zod` | Form validation |
| `sonner` | Toast notifications |
| `next-themes` | Light / dark / system theme |
| `axios` | API client with JWT interceptors |
| `@dnd-kit` | Drag-and-drop (category ordering) |

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:3001`) |

## Tests

```bash
pnpm test       # unit/component tests with Vitest
```

E2E tests live in the monorepo root `e2e/` directory and are run via `pnpm e2e`.
