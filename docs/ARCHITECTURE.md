# SubTracker – Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser / Client                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP / HTTPS
                ┌───────────────▼───────────────┐
                │        Next.js Frontend       │
                │  (App Router · Tailwind CSS)  │
                │          port 3000            │
                └───────────────┬───────────────┘
                                │ REST API calls (JSON)
                ┌───────────────▼────────────────┐
                │       NestJS Backend API       │
                │          port 3001             │
                │                                │
                │  ┌──────────┐  ┌─────────────┐ │
                │  │  Auth    │  │Subscriptions│ │
                │  ├──────────┤  ├─────────────┤ │
                │  │Dashboard │  │  Alerts     │ │
                │  ├──────────┤  ├─────────────┤ │
                │  │Categories│  │  Payments   │ │
                │  ├──────────┤  ├─────────────┤ │
                │  │  Users   │  │  Health     │ │
                │  └──────────┘  └─────────────┘ │
                │                                │
                │   BullMQ scheduler + worker    │
                └──────┬──────────────┬──────────┘
                       │              │
           ┌───────────▼──┐    ┌──────▼──────────┐
           │  PostgreSQL  │    │      Redis      │
           │  (port 5433) │    │  (port 6379)    │
           │              │    │  BullMQ queues  │
           └──────────────┘    └─────────────────┘
                                        │
                               ┌────────▼───────────┐
                               │  Email / Webhook / │
                               │  Web Push sender   │
                               │  (Mailpit dev,     │
                               │   SMTP relay prod) │
                               └────────────────────┘
```

## Components

### Frontend (`frontend/`)

Built with **Next.js 14** using the App Router and **Tailwind CSS v4**.

| Path | Description |
|------|-------------|
| `src/app/` | Pages and layouts (App Router) |
| `src/app/(auth)/` | Login, register, email verification, forgot-password |
| `src/app/(dashboard)/` | Main dashboard, subscriptions, settings |
| `src/components/` | Reusable React components |
| `src/lib/` | API client (Axios with JWT interceptors), utilities |
| `src/i18n/` | Translations and `next-intl` config |

Key libraries: `next-intl`, `recharts`, `react-hook-form`, `zod`, `sonner` (toasts), `next-themes`.

### Backend (`backend/`)

Built with **NestJS** (modular architecture) using **Prisma** for database access.

| Module | Endpoints | Description |
|--------|-----------|-------------|
| `auth` | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/verify-email`, `POST /auth/resend-verification`, `GET /auth/google`, `GET /auth/google/callback` | Authentication (local + Google OAuth) |
| `users` | `GET /users/me`, `PATCH /users/me`, `PATCH /users/me/password`, `PATCH /users/me/email`, `DELETE /users/me` | User profile management |
| `subscriptions` | `GET /subscriptions`, `POST /subscriptions`, `GET /subscriptions/:id`, `PATCH /subscriptions/:id`, `DELETE /subscriptions/:id` | Subscription CRUD |
| `dashboard` | `GET /dashboard/summary`, `GET /dashboard/forecast` | Cost aggregation & forecasting |
| `alerts` | `GET /subscriptions/:id/alerts`, `POST /subscriptions/:id/alerts`, `PATCH /alerts/:id`, `DELETE /alerts/:id` | Per-subscription alert config |
| `categories` | `GET /categories`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id` | Custom subscription categories |
| `payments` | `GET /payments`, `GET /subscriptions/:id/payments` | Payment history |
| `notifications` | `POST /notifications/subscribe`, `DELETE /notifications/subscribe` | Web Push subscriptions |
| `health` | `GET /health` | Health check (DB + Redis) |

> 💡 Full interactive documentation is available at `http://localhost:3001/api/docs` (Swagger UI).

### Shared Package (`packages/shared/`)

A workspace package (`@subtracker/shared`) that provides TypeScript types and utility functions shared between the frontend and backend. This prevents type drift across the full stack.

### Background Jobs

The alert system uses **BullMQ** (backed by Redis) with two moving parts:

1. **Scheduler (cron)** – runs periodically, queries upcoming billing dates, and enqueues alert jobs for subscriptions that cross an alert threshold.
2. **Worker (processor)** – consumes jobs from the queue and dispatches email / webhook / web-push notifications. Implements idempotency to prevent duplicate sends and exponential backoff on failure.

## Data Model

```
User
 ├── Subscription[]
 │    ├── Alert[]
 │    └── PaymentHistory[]
 ├── Category[]
 └── PushSubscription[]
```

### Key relationships

- Each **User** owns many **Subscriptions** (cascading delete).
- Each **Subscription** has an optional list of **Alerts** (email, webhook, web-push).
- **PaymentHistory** records are appended each time a subscription billing cycle rolls over.
- **Category** is user-owned; each row has a name, color, and optional icon. A subscription references a category by name string.

### Enums

| Enum | Values |
|------|--------|
| `BillingCycle` | `monthly`, `yearly`, `custom` |
| `AlertType` | `email`, `webhook`, `webpush` |

## Authentication Flow

```
Client          Backend         Database
  │── POST /auth/login ──────────►│
  │                               │── SELECT user WHERE email ──►│
  │                               │◄─────────────────────────────│
  │                               │   bcrypt.compare(password)
  │◄── { accessToken, refreshToken } ──│
  │
  │── GET /subscriptions (Authorization: Bearer <accessToken>) ──►│
  │                               │   JwtAuthGuard validates token
  │◄── 200 OK ─────────────────────│
  │
  │── POST /auth/refresh (refreshToken in body) ──────────────────►│
  │◄── { accessToken (new) } ──────│
```

Access tokens expire after 1 hour by default (`JWT_EXPIRES_IN`). A refresh token (longer-lived) is used to obtain new access tokens without re-authentication.

## Security Measures

| Measure | Implementation |
|---------|---------------|
| HTTPS | Required in production; configured at reverse-proxy level |
| Password hashing | bcrypt |
| JWT | Short-lived access tokens + refresh tokens |
| Rate limiting | ThrottlerModule (100 req / 60 s per IP) |
| Security headers | Helmet (CSP, HSTS, …) |
| Input sanitisation | Custom `SanitizePipe` strips XSS payloads |
| Validation | `class-validator` + `ValidationPipe` (whitelist + forbidNonWhitelisted) |
| Webhook secrets | Stored AES-encrypted in the database |
| CORS | Explicit allowlist of frontend origin(s) |

## Observability

- **Structured logging** via `nestjs-pino` (pretty-print in dev, JSON in prod)
- **Request IDs** attached to every log line via `X-Request-Id` header
- **Sensitive headers** (`Authorization`, `Cookie`) are redacted from logs
- **Health endpoint** at `GET /health` – checks Postgres and Redis connectivity
