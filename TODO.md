# Subscription Cost Tracker – Task List (Architecture 1: Monolith)

## 0. Project Setup

### 0.1 Repository & Tooling
- [x] Initialize Git repository
- [x] Setup project structure (`frontend/` and `backend/`)
- [x] Configure TypeScript (strict mode enabled)
- [x] Setup Biome
- [x] Create `.env.example`
- [x] Configure Docker + docker-compose (Postgres + Redis)

---

# 1. Backend (NestJS)

## 1.1 Bootstrap Application
- [ ] Create NestJS project
- [ ] Configure global validation pipe
- [ ] Setup environment config module
- [ ] Configure CORS
- [ ] Setup global error filter
- [ ] Setup structured logging

---

## 1.2 Database (PostgreSQL + Prisma)

### 1.2.1 Prisma Setup
- [ ] Install Prisma
- [ ] Configure `schema.prisma`
- [ ] Setup migrations
- [ ] Enable strict null checks

### 1.2.2 Database Models

- [ ] Create `User` model
  - [ ] id (uuid)
  - [ ] email (unique)
  - [ ] passwordHash
  - [ ] createdAt
  - [ ] updatedAt

- [ ] Create `Subscription` model
  - [ ] id (uuid)
  - [ ] userId (relation)
  - [ ] name
  - [ ] amount (decimal)
  - [ ] currency (ISO 4217 string)
  - [ ] billingCycle (enum: monthly, yearly, custom)
  - [ ] intervalDays (optional)
  - [ ] nextBillingDate
  - [ ] category
  - [ ] isActive
  - [ ] createdAt
  - [ ] updatedAt

- [ ] Create `Alert` model
  - [ ] id
  - [ ] subscriptionId (relation)
  - [ ] type (enum: email, webhook)
  - [ ] daysBefore
  - [ ] isEnabled

- [ ] Create `PaymentHistory` model (optional)
  - [ ] id
  - [ ] subscriptionId
  - [ ] amount
  - [ ] currency
  - [ ] paidAt

- [ ] Run initial migration
- [ ] Seed development data

---

## 1.3 Authentication
- [ ] Implement registration endpoint
- [ ] Implement login endpoint
- [ ] Hash passwords (bcrypt)
- [ ] Generate JWT access tokens
- [ ] Implement refresh tokens
- [ ] Create auth guard
- [ ] Protect subscription endpoints
- [ ] Implement logout logic

---

## 1.4 Subscription Module

### 1.4.1 CRUD
- [ ] Create subscription
- [ ] Get all subscriptions (scoped per user)
- [ ] Get subscription by ID
- [ ] Update subscription
- [ ] Delete or deactivate subscription

### 1.4.2 Business Logic
- [ ] Calculate next billing date
- [ ] Handle monthly rollover correctly
- [ ] Handle yearly rollover correctly
- [ ] Handle custom intervals
- [ ] Validate positive amounts
- [ ] Validate ISO currency codes

---

## 1.5 Cost Aggregation
- [ ] Calculate total monthly cost
- [ ] Calculate total yearly cost
- [ ] Convert yearly to monthly equivalent
- [ ] Group subscriptions by category
- [ ] Implement `/dashboard/summary` endpoint
- [ ] Implement `/dashboard/forecast?months=12` endpoint

---

## 1.6 Alert System (BullMQ + Redis)

### 1.6.1 Queue Setup
- [ ] Install BullMQ
- [ ] Connect to Redis
- [ ] Create `alertQueue`
- [ ] Configure retry strategy
- [ ] Configure exponential backoff

### 1.6.2 Scheduler (Cron)
- [ ] Add cron job (e.g., hourly)
- [ ] Query upcoming billing events
- [ ] Compare against alert thresholds
- [ ] Push alert jobs to queue

### 1.6.3 Worker
- [ ] Create queue processor
- [ ] Implement email sender service
- [ ] Implement webhook sender
- [ ] Log failed jobs
- [ ] Add idempotency protection (prevent duplicates)

---

## 1.7 Email Service
- [ ] Configure SMTP (dev + prod)
- [ ] Create HTML email template
- [ ] Handle send failures gracefully

---

## 1.8 API Documentation
- [ ] Setup Swagger/OpenAPI
- [ ] Document endpoints
- [ ] Add DTO validation
- [ ] Provide example payloads

---

## 1.9 Testing
- [ ] Unit tests for billing date logic
- [ ] Unit tests for cost aggregation
- [ ] Unit tests for alert threshold logic
- [ ] Integration tests for auth + subscriptions
- [ ] Test cron logic
- [ ] Test queue worker behavior

---

# 2. Frontend (Next.js)

## 2.1 Setup
- [ ] Create Next.js app (App Router)
- [ ] Setup Tailwind CSS
- [ ] Configure API client (Axios or Fetch wrapper)
- [ ] Setup environment variables
- [ ] Setup ESLint + Prettier

---

## 2.2 Authentication UI
- [ ] Registration page
- [ ] Login page
- [ ] Store access token securely
- [ ] Implement refresh logic
- [ ] Protect routes
- [ ] Logout functionality

---

## 2.3 Dashboard
- [ ] Display total monthly cost
- [ ] Display total yearly cost
- [ ] Show upcoming payments (next 30 days)
- [ ] Show cost by category
- [ ] Display 12-month forecast chart

---

## 2.4 Subscription Management UI
- [ ] List subscriptions
- [ ] Create subscription form
- [ ] Edit subscription form
- [ ] Delete confirmation modal
- [ ] Date picker component
- [ ] Currency selector
- [ ] Billing cycle selector

---

## 2.5 Alert Management UI
- [ ] Add alert configuration
- [ ] Enable/disable alerts
- [ ] Set daysBefore value
- [ ] Configure webhook URL

---

## 2.6 UX Enhancements
- [ ] Loading states
- [ ] Error states
- [ ] Form validation messages
- [ ] Toast notifications
- [ ] Responsive layout
- [ ] Optional dark mode

---

# 3. Observability & DevOps

## 3.1 Logging
- [ ] Structured logs
- [ ] Include request ID
- [ ] Log alert executions

## 3.2 Monitoring
- [ ] Health check endpoint
- [ ] Redis health check
- [ ] Database health check

## 3.3 Deployment
- [ ] Dockerize backend
- [ ] Dockerize frontend
- [ ] Configure production environment variables
- [ ] Deploy Postgres
- [ ] Deploy Redis
- [ ] Setup CI/CD pipeline

---

# 4. Advanced (Optional)

- [ ] Multi-currency conversion (daily rate sync)
- [ ] CSV import/export
- [ ] Web push notifications
- [ ] Team accounts / workspaces
- [ ] Budget threshold alerts
- [ ] Stripe integration
- [ ] Analytics integration

---

# 5. Security Checklist

- [ ] Rate limiting
- [ ] Security headers (Helmet)
- [ ] CSRF protection (if needed)
- [ ] Input sanitization
- [ ] Secure JWT handling
- [ ] Encrypt webhook secrets

---

# 6. Documentation

- [ ] Architecture overview diagram
- [ ] API documentation
- [ ] Setup instructions
- [ ] Environment variables documentation
- [ ] ADR (Architecture Decision Records)