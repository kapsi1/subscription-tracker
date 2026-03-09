For any new feature add unit and E2E tests

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
- [x] Unit tests for billing date logic
- [x] Unit tests for cost aggregation
- [x] Unit tests for alert threshold logic
- [x] Integration tests for auth + subscriptions
- [x] Test cron logic
- [x] Test queue worker behavior

---

# 2. Frontend (Next.js)

## 2.1 Setup
- [x] Create Next.js app (App Router)
- [x] Setup Tailwind CSS
- [x] Configure API client (Axios with JWT interceptors)
- [x] Setup environment variables (`.env.local`)
- [x] Setup ESLint + Prettier

---

## 2.2 Authentication UI
- [x] Registration page
- [x] Login page
- [x] Store access token securely
- [x] Implement refresh logic
- [x] Protect routes
- [x] Logout functionality

---

## 2.3 Dashboard
- [x] Display total monthly cost
- [x] Display total yearly cost
- [x] Show upcoming payments (next 30 days)
- [x] Show cost by category (pie + bar chart)
- [x] Display 12-month forecast chart

---

## 2.4 Subscription Management UI
- [x] List subscriptions (with search/filter)
- [x] Create subscription form (modal)
- [x] Edit subscription form (modal)
- [x] Delete confirmation modal
- [x] Date picker component
- [x] Currency selector
- [x] Billing cycle selector

---

## 2.5 Alert Management UI
- [x] Add alert configuration
- [x] Enable/disable alerts (email + webhook toggles)
- [x] Set daysBefore value
- [x] Configure webhook URL

---

## 2.6 UX Enhancements
- [x] Loading states
- [x] Error states
- [x] Form validation messages
- [x] Toast notifications (sonner)
- [x] Responsive layout
- [x] Optional dark mode (next-themes)

## 2.7 Frontend E2E Testing
- [x] Initialize Playwright
- [x] Write auth flow tests
- [x] Write dashboard + subscriptions flow tests

---

# 3. Observability & DevOps
- [x] Structured logs
- [x] Include request ID
- [x] Log alert executions
- [x] Health check endpoint
- [x] Redis health check
- [x] Database health check
- [x] Dockerize backend
- [x] Dockerize frontend
- [x] Configure production environment variables
- [x] Deploy Postgres
- [x] Deploy Redis
- [x] Setup CI/CD pipeline

---

# 4. Advanced (Optional)
- [x] JSON import/export
- [x] Web push notifications
- [x] Budget threshold alerts
- [x] Analytics integration

---

# 5. Security Checklist
- [x] Rate limiting
- [x] Security headers (Helmet)
- [x] CSRF protection (if needed)
- [x] Input sanitization
- [x] Secure JWT handling
- [x] Encrypt webhook secrets

---

# 6. Documentation
- [ ] Architecture overview diagram
- [ ] API documentation
- [ ] Setup instructions
- [ ] Environment variables documentation
- [ ] ADR (Architecture Decision Records)

# 7. Additional
- [ ] Push notifications not working on Opera
- [ ] Push notifications not working when Chrome is not running
- [ ] Email notifications on production
- [x] Webhook integration
- [ ] Default reminders
- [ ] Budget threshold alerts
- [x] Google Auth
- [ ] Custom billing cycle
- [ ] Category management
- [x] Currency management
- [x] Payment history
- [x] When adding or saving subscription, check all fields for validity and show error messages
- [x] "Daily Digest" emails should be sent at midnight, when a subscription was paid a previous day.  They should include all subscriptions paid that day.
- [x] Add user name field to registration and use it for personalized greetings in dashboard and emails.
- [x] Show user's initials in the top right corner of the dashboard, instead of the logout button.  Clicking on it should open a dropdown with "Logout"
- [ ] After registration send user a verification email and don't allow login until verified. Create a flow for verification including a way to resend the verification email.
- [ ] Add a "Forgot Password" flow.
- [x] Create user profile page. Make the profile page a tab in Settings page. Currents Settings page should be renamed to "Preferences".
- [ ] Add Change Password and Change Email flow in user profile
- [ ] Add Delete Account flow in user profile
- [x] Save settings on any change, remove the Save Settings button
- [x] Instead of "Upcoming Payments" show payments for this month. Include done payments as well, with a suitablestyle to indicate they are done The list should be sorted by date, with a button to change sort direction. Also enable sorting by amount. Adjust the card's subtitle. 
- [x] Make the main container of dashboard full width with a small margin, on small and medium screen width.
- [x] Add buttons to switch the month to previous and next, and display the current month and year. Implement month switching. The whole dashboard should be showing data for the selected month, except 12-month forecast chart.
- [ ] Make the 12-month forecast chart full-width on large screen width. In forecast chart for each column, under month names, add a circle with a hover effect (like the color chooser in the top nav bar). Background should be transparent by default, and accent color on hover. Inside the circle there should be a number of payments done that month. Hovering over the circle shows a html tooltip with a list of payments for this month (date, name, cost)
- [ ] Billing cycle -> custom does nothing
