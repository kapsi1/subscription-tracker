# SubTracker – System Assumptions

## Functional Requirements

### 1. User Management

- The system shall allow users to register using email and password.
- The system shall allow users to log in and log out securely.
- The system shall issue access and refresh tokens upon successful authentication.
- The system shall restrict access to user data based on authentication and authorization rules.

---

### 2. Subscription Management

- The system shall allow users to create a subscription entry.
- The system shall allow users to edit existing subscriptions.
- The system shall allow users to delete or deactivate subscriptions.
- Each subscription shall include:
  - Name
  - Amount
  - Currency (ISO 4217 code)
  - Billing cycle (monthly, yearly, custom interval)
  - Next billing date
  - Category
  - Alert configuration (optional)
- The system shall calculate and update the next billing date based on billing cycle rules.
- The system shall validate input data and prevent invalid values (e.g., negative amounts, invalid currency codes).

---

### 3. Cost Calculation & Aggregation

- The system shall calculate total monthly cost across all active subscriptions.
- The system shall calculate total yearly cost across all active subscriptions.
- The system shall normalize yearly subscriptions into monthly equivalents for dashboard display.
- The system shall provide cost breakdown by category.
- The system shall generate a 12-month forecast based on recurring billing cycles.

---

### 4. Alerts & Notifications

- The system shall allow users to configure reminder alerts per subscription.
- The system shall support alert thresholds defined as “X days before billing date.”
- The system shall execute scheduled background checks for upcoming billing events.
- The system shall send email notifications when alert conditions are met.
- The system shall prevent duplicate alerts for the same billing event.

---

### 5. Dashboard & Reporting

- The system shall display a dashboard overview including:
  - Total monthly cost
  - Total yearly cost
  - Upcoming payments (next 30 days)
  - Number of active subscriptions
- The system shall display graphical representations (e.g., forecast chart, category distribution).
- The system shall support filtering and sorting subscriptions.

---

### 6. Data Persistence

- The system shall persist user and subscription data in a relational database.
- The system shall optionally maintain historical payment data.
- The system shall ensure referential integrity between users and subscriptions.

---

# Non-Functional Requirements

## 1. Performance

- API response time for standard CRUD operations shall not exceed 300 ms under normal load.
- Dashboard aggregation endpoints shall respond within 500 ms for up to 500 subscriptions per user.
- Alert processing shall complete within 5 minutes of scheduled execution.

---

## 2. Scalability

- The system shall support horizontal scaling of the backend service.
- Background job processing shall be isolated from API request handling.
- The system shall handle at least 10,000 users without architectural changes.

---

## 3. Reliability

- The system shall ensure that no billing alert is lost due to transient failures.
- The alert system shall implement retry mechanisms with exponential backoff.
- The system shall maintain data consistency during concurrent updates.

---

## 4. Security

- All communication shall use HTTPS.
- Passwords shall be hashed using a strong one-way hashing algorithm (e.g., bcrypt).
- JWT tokens shall have expiration times and refresh mechanisms.
- The system shall implement rate limiting on authentication endpoints.
- Sensitive configuration values shall be stored in environment variables.

---

## 5. Availability

- The system shall target 99% uptime in production.
- Health check endpoints shall be provided for infrastructure monitoring.

---

## 6. Maintainability

- The system shall follow modular architecture principles.
- The codebase shall enforce strict TypeScript typing.
- Automated tests shall cover critical business logic (billing calculations, alert triggers).
- The system shall provide API documentation (e.g., Swagger/OpenAPI).

---

## 7. Usability

- The UI shall be responsive and usable on desktop and mobile devices.
- The system shall provide clear validation and error feedback.
- The system shall maintain accessible color contrast and semantic structure.

---

## 8. Observability

- The system shall provide structured logging.
- Failed alert jobs shall be logged and traceable.
- The system shall expose monitoring or metrics endpoints.