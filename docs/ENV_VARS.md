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

> **Note:** `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` are only consumed by the `docker-compose.yml` and are not read by the NestJS application directly.

### Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_HOST` | ✅ | `localhost` | Redis server hostname |
| `REDIS_PORT` | ⬜ | `6379` | Redis server port |

### Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ⬜ | `development` | Runtime environment (`development` \| `production`). |
| `PORT` | ⬜ | `3001` | TCP port the NestJS server listens on |
| `FRONTEND_URL` | ⬜ | – | Frontend origin added to the CORS allowlist (e.g. `https://app.subtracker.cc`). |

### Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ | – | Secret used to sign JWT access tokens. |
| `JWT_EXPIRES_IN` | ⬜ | `1h` | Access token lifetime (e.g. `15m`, `1h`, `7d`). |

### Google OAuth (optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | ⬜ | – | Google OAuth 2.0 client ID. Required if Google login is enabled. |
| `GOOGLE_CLIENT_SECRET` | ⬜ | – | Google OAuth 2.0 client secret. |
| `GOOGLE_CALLBACK_URL` | ⬜ | – | OAuth redirect URI (e.g. `https://api.subtracker.cc/auth/google/callback`). |

### SMTP (Email)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | ✅ | – | SMTP server hostname (e.g. `smtp.resend.com`) |
| `SMTP_PORT` | ✅ | – | SMTP server port (`465` for SSL, `587` for STARTTLS) |
| `SMTP_SECURE` | ⬜ | `false` | Use TLS (`true` for port 465). |
| `SMTP_USER` | ⬜ | – | SMTP authentication username |
| `SMTP_PASS` | ⬜ | – | SMTP authentication password / API key |
| `SMTP_FROM` | ✅ | – | Default sender address.<br>Format: `"SubTracker" <noreply@subtracker.cc>` |
| `SMTP_FROM_AUTH` | ⬜ | `SMTP_FROM` | Sender for auth emails (verification, password reset) |
| `SMTP_FROM_ALERTS` | ⬜ | `SMTP_FROM` | Sender for alert/notification emails |

### Web Push Notifications (optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VAPID_PUBLIC_KEY` | ⬜ | – | VAPID public key for Web Push. |
| `VAPID_PRIVATE_KEY` | ⬜ | – | VAPID private key. Keep secret. |
| `VAPID_SUBJECT` | ⬜ | – | Contact URI shown to push services (e.g. `mailto:you@subtracker.cc`). |

### Testing

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `E2E_TESTING` | ⬜ | – | Set to `true` to bypass rate limiting during automated E2E test runs. |

---

## Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | – | Absolute URL of the backend API, e.g. `http://localhost:3001`. |
| `NEXT_PUBLIC_GA_ID` | ⬜ | – | Google Analytics (GA4) measurement ID (e.g. `G-XXXXXXXXXX`). |
| `NEXT_PUBLIC_GTM_ID` | ⬜ | – | Google Tag Manager ID (e.g. `GTM-XXXXXXX`). |

---

## Example: Production Checklist

- [ ] Generate a strong `JWT_SECRET` (e.g. `openssl rand -hex 64`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `SMTP_*` for a real relay (e.g. Resend / Brevo)
- [ ] Set `FRONTEND_URL` to your actual frontend origin
- [ ] Set `NEXT_PUBLIC_API_URL` in frontend deployment
- [ ] If using Google OAuth, register production callback URL in Google Cloud Console
- [ ] If using Web Push, generate and configure VAPID keys
- [ ] If using Analytics, set `NEXT_PUBLIC_GA_ID` or `NEXT_PUBLIC_GTM_ID`
