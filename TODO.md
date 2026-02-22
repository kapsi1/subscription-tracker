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
- [x] Create NestJS project
- [x] Configure global validation pipe
- [x] Setup environment config module
- [x] Configure CORS
- [x] Setup global error filter
- [x] Setup structured logging

---

## 1.2 Database (PostgreSQL + Prisma)

### 1.2.1 Prisma Setup
- [x] Install Prisma
- [x] Configure `schema.prisma`
- [x] Setup migrations
- [x] Enable strict null checks

### 1.2.2 Database Models

- [x] Create `User` model
  - [x] id (uuid)
  - [x] email (unique)
  - [x] passwordHash
  - [x] createdAt
  - [x] updatedAt

- [x] Create `Subscription` model
  - [x] id (uuid)
  - [x] userId (relation)
  - [x] name
  - [x] amount (decimal)
  - [x] currency (ISO 4217 string)
  - [x] billingCycle (enum: monthly, yearly, custom)
  - [x] intervalDays (optional)
  - [x] nextBillingDate
  - [x] category
  - [x] isActive
  - [x] createdAt
  - [x] updatedAt

- [x] Create `Alert` model
  - [x] id
  - [x] subscriptionId (relation)
  - [x] type (enum: email, webhook)
  - [x] daysBefore
  - [x] isEnabled

- [x] Create `PaymentHistory` model (optional)
  - [x] id
  - [x] subscriptionId
  - [x] amount
  - [x] currency
  - [x] paidAt

- [x] Run initial migration
- [x] Seed development data

---

## 1.3 Authentication
- [x] Implement registration endpoint
- [x] Implement login endpoint
- [x] Hash passwords (bcrypt)
- [x] Generate JWT access tokens
- [x] Implement refresh tokens
- [x] Create auth guard
- [x] Protect subscription endpoints
- [x] Implement logout logic

---

## 1.4 Subscription Module

### 1.4.1 CRUD
- [x] Create subscription
- [x] Get all subscriptions (scoped per user)
- [x] Get subscription by ID
- [x] Update subscription
- [x] Delete or deactivate subscription

### 1.4.2 Business Logic
- [x] Calculate next billing date
- [x] Handle monthly rollover correctly
- [x] Handle yearly rollover correctly
- [x] Handle custom intervals
- [x] Validate positive amounts
- [x] Validate ISO currency codes

---

## 1.5 Cost Aggregation
- [x] Calculate total monthly cost
- [x] Calculate total yearly cost
- [x] Convert yearly to monthly equivalent
- [x] Group subscriptions by category
- [x] Implement `/dashboard/summary` endpoint
- [x] Implement `/dashboard/forecast?months=12` endpoint

---

## 1.6 Alert System (BullMQ + Redis)

### 1.6.1 Queue Setup
- [x] Install BullMQ
- [x] Connect to Redis
- [x] Create `alertQueue`
- [x] Configure retry strategy
- [x] Configure exponential backoff

### 1.6.2 Scheduler (Cron)
- [x] Add cron job (e.g., hourly)
- [x] Query upcoming billing events
- [x] Compare against alert thresholds
- [x] Push alert jobs to queue

### 1.6.3 Worker
- [x] Create queue processor
- [x] Implement email sender service
- [x] Implement webhook sender
- [x] Log failed jobs
- [x] Add idempotency protection (prevent duplicates)

---

## 1.7 Email Service
- [x] Configure SMTP (dev + prod)
- [x] Create HTML email template
- [x] Handle send failures gracefully

---

## 1.8 API Documentation
- [x] Setup Swagger/OpenAPI
- [x] Document endpoints
- [x] Add DTO validation
- [x] Provide example payloads

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