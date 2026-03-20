# SubTracker – Environment Variables Reference

All backend variables are defined in `backend/.env` (development) or passed as real environment variables in production. Never commit `.env` files containing secrets to version control.

A ready-to-use template for development is at [`backend/.env.example`](../backend/.env.example) and for production at [`backend/.env.production.example`](../backend/.env.production.example).

---

## Backend (`backend/.env`)

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | – | PostgreSQL connection string.<br>Format: `postgresql://<user>:<password>@<host>:<port>/<db>?schema=public` |
| `POSTGRES_USER` | ⬜ | `postgres` | Postgres username (used by Docker Compose) |
| `POSTGRES_PASSWORD` | ⬜ | `postgres` | Postgres password (used by Docker Compose) |
| `POSTGRES_DB` | ⬜ | `subscription_tracker` | Postgres database name (used by Docker Compose) |

> **Note:** `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` are only consumed by the `docker-compose.yml` and are not read by the NestJS application directly. Include them in `.env` if you rely on Docker Compose to create the database.

### Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_HOST` | ✅ | `localhost` | Redis server hostname |
| `REDIS_PORT` | ⬜ | `6379` | Redis server port |

### Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ⬜ | `development` | Runtime environment (`development` \| `production`). Affects logging format, Pino level, and dev-only features. |
| `PORT` | ⬜ | `3001` | TCP port the NestJS server listens on |
| `FRONTEND_URL` | ⬜ | – | Frontend origin added to the CORS allowlist (e.g. `https://app.example.com`). In development `http://localhost:3000` is always allowed. |

### Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ | – | Secret used to sign JWT access tokens. Use a long, random string in production. |
| `JWT_EXPIRES_IN` | ⬜ | `1h` | Access token lifetime. Accepts any [`ms`](https://github.com/vercel/ms) value (e.g. `15m`, `1h`, `7d`). |

### Google OAuth (optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | ⬜ | – | Google OAuth 2.0 client ID. Required if Google login is enabled. |
| `GOOGLE_CLIENT_SECRET` | ⬜ | – | Google OAuth 2.0 client secret. |
| `GOOGLE_CALLBACK_URL` | ⬜ | – | OAuth redirect URI (e.g. `http://localhost:3001/auth/google/callback`). Must be registered in the Google Cloud Console. |

### SMTP (Email)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | ✅ | – | SMTP server hostname (dev: `localhost` / Mailpit, prod: your relay) |
| `SMTP_PORT` | ✅ | – | SMTP server port (`1025` for Mailpit, `587` for most relays) |
| `SMTP_SECURE` | ⬜ | `false` | Use TLS (`true` for port 465). Set `false` for STARTTLS. |
| `SMTP_USER` | ⬜ | – | SMTP authentication username |
| `SMTP_PASS` | ⬜ | – | SMTP authentication password / API key |
| `SMTP_FROM` | ✅ | – | Default sender address for general emails.<br>Format: `"SubTracker" <noreply@yourdomain.com>` |
| `SMTP_FROM_AUTH` | ⬜ | `SMTP_FROM` | Sender for auth emails (verification, password reset) |
| `SMTP_FROM_ALERTS` | ⬜ | `SMTP_FROM` | Sender for alert/notification emails |

### Web Push Notifications (optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VAPID_PUBLIC_KEY` | ⬜ | – | VAPID public key for Web Push. Generate via `web-push generate-vapid-keys`. |
| `VAPID_PRIVATE_KEY` | ⬜ | – | VAPID private key. Keep secret. |
| `VAPID_SUBJECT` | ⬜ | – | Contact URI shown to push services (e.g. `mailto:you@example.com`). |

### Webhooks

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WEBHOOK_SECRET_KEY` | ⬜ | – | AES encryption key used to store per-subscription webhook secrets. Recommended in production. |

### Testing

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `E2E_TESTING` | ⬜ | – | Set to `true` to bypass rate limiting during automated E2E test runs. **Never enable in production.** |

---

## Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | – | Absolute URL of the backend API, e.g. `http://localhost:3001` in dev or `https://api.yourdomain.com` in prod. |

---

## Example: Development Setup

```dotenv
# backend/.env

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=subscription_tracker
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/subscription_tracker?schema=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# App
PORT=3001
NODE_ENV=development

# Auth
JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRES_IN=1h

# SMTP (Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM="SubTracker" <noreply@subtracker.local>
```

```dotenv
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Example: Production Checklist

- [ ] Generate a strong `JWT_SECRET` (e.g. `openssl rand -hex 64`)
- [ ] Generate a strong `WEBHOOK_SECRET_KEY` (e.g. `openssl rand -hex 32`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `SMTP_*` for a real relay (e.g. Brevo / SendGrid)
- [ ] Set `FRONTEND_URL` to your actual frontend origin
- [ ] Set `NEXT_PUBLIC_API_URL` in frontend deployment
- [ ] If using Google OAuth, register production callback URL in Google Cloud Console
- [ ] If using Web Push, generate and configure VAPID keys
