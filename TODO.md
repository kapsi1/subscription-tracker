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
  - [x] type (enum: email, webpush)
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
- [x] Implement `/Dashboard/summary` endpoint
- [x] Implement `/Dashboard/forecast?months=12` endpoint

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
- [x] Enable/disable alerts (email)
- [x] Set daysBefore value

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
- [x] Write Dashboard + subscriptions flow tests

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

---

# 6. Documentation
- [x] Architecture overview diagram
- [x] API documentation
- [x] Setup instructions
- [x] Environment variables documentation
- [x] README.md for Github

# 7. Repeatable tasks
- [ ] Review translations for spelling, grammar, consistency, capitalization and style. Check for and remove unused translations
- [ ] Review code for security vulnerabilities and best practices.
- [ ] Review code for performance issues and improvements
- [ ] Review code for "any" type usage in TypeScript and replace it with appropriate types. You can skip any types in test mocks, but add linter exceptions so there's no warnings.
- [ ] Review code for areas that can be shortened or simplified. Split large files, functions, components, etc. into smaller ones, where it makes sense to do so.
- [ ] Review code for areas where interfaces can be shared between frontend and backend, then extract them and share.
- [ ] Find and fix compiler & linter errors and warnings. Use pnpm lint:write first, then fix the remaining errors manually.
- [ ] Remove unused code.
- [ ] Update documentation and AI_DEVELOPMENT_GUIDE.md to reflect current state of the project.

# 8. Additional
- [x] Google Auth
- [x] Add category management. In settings, add a category management section. In this section, show a list of categories. Each row should have a color swatch, category name (editable in place), color picker (editable in place), and a delete button. Add a button to add a new category. This should add a new row with an empty name and default color, and focus on the name field. Add a button to reset categories to default values.
- [x] Currency management
- [x] Payment history
- [x] When adding or saving subscription, check all fields for validity and show error messages
- [x] "Daily Digest" emails should be sent at midnight, when a subscription was paid a previous day. They should include all subscriptions paid that day.
- [x] Add user name field to registration and use it for personalized greetings in Dashboard and emails.
- [x] Show user's initials in the top right corner of the Dashboard, instead of the logout button. Clicking on it should open a dropdown with "Logout"
- [x] After registration send user a verification email and don't allow login until verified. Create a flow for verification including a way to resend the verification email.
- [x] Add a "Forgot Password" flow. Make sure UI is in line with other flows. Add tests.
- [x] Create user profile page. Make the profile page a tab in Settings page. Currents Settings page should be renamed to "Preferences".
- [x] Add Change Password and Change Email flow in user profile
- [x] Save settings on any change, remove the Save Settings button
- [x] Instead of "Upcoming Payments" show payments for this month. Include done payments as well, with a suitablestyle to indicate they are done The list should be sorted by date, with a button to change sort direction. Also enable sorting by amount. Adjust the card's subtitle.
- [x] Make the main container of Dashboard full width with a small margin, on small and medium screen width.
- [x] Add buttons to switch the month to previous and next, and display the current month and year. Implement month switching. The whole Dashboard should be showing data for the selected month, except 12-month forecast chart.
- [x] Make the 12-month forecast chart full-width on large screen width. In forecast chart for each column, under month names, add a circle with a hover effect (like the color chooser in the top nav bar). Background should be transparent by default, and accent color on hover. Inside the circle there should be a number of payments done that month. Hovering over the circle shows a html tooltip with a list of payments for this month (date, name, cost)
- [x] Only one currency should be allowed. In settings, add a currency selector. It should be a dropdown with a list of currencies. Each row should show currency code, name and flag. There should be an input field for currency code or name. Design UI and make it look in line with the rest of the app. Validate on backend. Selected currency should be used for all subscriptions. Remove the currency selector in the subscription form.
- [x] If user is logged with a Google account, show their profile picture in corner, instead of initials. Also add a link to user profile page above the logout button. Settings page should have its subpages in url, so we can link to them.
- [x] Add "system" theme to existing toggle. The toggle should have 3 states: light, dark and system, with appropriate icons. System should use the system theme.
- [x] Bug: can't scroll the payments list in the 12-month forecast tooltip. Remove the list.
- [x] Refactor settings page: split it into multiple components, by section
- [x] Add a language selector to the login/register pages
- [x] Create a JSON with test subscriptions data that can be imported in the app. Include different currencies, billing cycles, categories, payment history, etc. Make different months have different amount of subscriptions. Include some very long subscription names to test the subscriptions list.
- [x] This Month Payments (in SummaryCards.tsx): show done this month/total this month, e.g. 2/10
- [x] In All Subscriptions table, make the column headers clickable (add cursor-pointer class), and clicking them sort the table. Show up/down chevrons next to column name, to show sort order. Default order is Next Billing / ascending (chronological).
- [x] Make the category background colors in /subscriptions more muted. Use the same colors for categories in Dashboard. For light theme make backgrounds of category badges in Dashboard darker. Make text color same as surrounding text color.
- [x] Add "resend verification email" button to the Email Sent page
- [x] Replace the email "auth@subscription-tracker.local" with an environment variable
- [x] Remove the language and color selectors from the top bar. Clean up references to those features, if they're not needed.
- [x] Add a custom color picker to the settings page, which should allow users to pick any color as accent color.
- [x] Add a find/filter functionality to settings. Show an input field at the top of the settings page, which should allow users to find/filter settings by any string. If something is typed into the input, show setting sections that contain that string, and hide the rest. If the input is empty, show all sections. In displayed sections, highlight the string that matched the filter. Search in sections from both Preferences and Profile tabs. Add a button to clear the filter. Add unit and E2E tests.
- [x] Rethink and unify save strategy for settings. Some settings are saved automatically, others have a save button. Make the button placements and when they appear consistent in every section..
- [x] Categories should have icons. Add appropriate icons to default categories. Add a selector, opening a popup with a library of icons, to each row in Category Management. Show the icons in This Month's Payments and All Subscriptions - left side.
- [x] Content is scrollable horizontally for screen width about 640-708 and 768-804 pixels. It shouldn't be.
- [x] Add a new logo, include different versions of it for different contexts (favicon, app icon, etc.). Include it in email templates as well.
- [x] Branding: find instances of "Subscription Tracker" visible to the user, and replace them with "SubTracker". Also replace "Subscription Tracker" with "SubTracker" in code, if it's not used anywhere else.
- [x] In Profile/Account Profile remove Email Address section. Remove "Member since".
- [x] Custom billing cycle: when selecting it in a form, open a calendar. Inside user can toggle days in the current month, and the selected days will be the billing days for each month. Add Save and Cancel buttons. Change "Custom" to "Custom..." in the dropdown. If a subscription's billing cycle is set to custom, change the dropdown text to "Custom: x days" and show the selected days in the tooltip.
- [x] Delete Account flow in user profile. Include a full screen warning/confirmation modal. Add tests.
- [x] Make the tooltip in Cost by Category chart have the same style and appearance as the tooltip on 12-month forecast chart
- [x] Make the app look more "premium". Add some animations, transitions, etc. Make it more "alive" and "fun" to use.
- [x] In /settings make search switch search input with tab chooser, make search full width
- [x] Make error toasts have red background, and success toasts green.
- [x] On login page, instead of "Invalid credentials" show "Invalid email or password". Also add a 5 second lock for the login button, so user can't spam it.
- [x] Don't show the "Successfully logged in" toast after login.
- [x] Don't show "Failed to load settings" toast after logout.
- [x] Make colors in "Cost by Category" charts same as category colors in Settings.
- [x] Make category badge colors in All Subscriptions table same as on Dashboard. Clean up code from redundant color definitions.
- [x] Make main container background color a subtle gradient: top -> down, top color is as now, bottom color is slightly darker. Do it for all pages.
- [x] Bug: change color in Settings, switch to another tab and back to Settings, the color switches back to the old one. On page reload the color is correct (the new one). It doesn't matter how fast you switch to another tab after changing the color, or from another tab back to Settings. Bug doesn't happen when changing color, then switching to Dashboard and then to Subscriptions tab (or the other way), only when going to Settings tab from another tab.
- [x] In light mode make the toast background colors darker, and text on them black.
- [x] In light mode you can't see if Profile or Preferences subtab is selected in Settings
- [x] Analyze code and find large files that can be refactored into smaller files.
- [x] Remove placeholders from password fields
- [x] When Polish language is selected, use a non-breaking space for a digit group separator (e.g. 10 000 instead of 10,000), and a comma for decimal separator (e.g. 10,50 instead of 10.50)
- [x] Where possible, use currency symbols instead of codes (e.g. $ instead of USD). In the currency chooser in settings, show both symbol and code. In other places only symbol.
- [x] Changing currency requires a page reload to take effect. Make it not require a page reload.
- [x] Don't show decimals if value is integer (i.e. $50 instead of $50.00)
- [x] Add payment history: propose UI to manage payment history. I'm thinking of adding a tab in the Edit Subscription modal, but I'm open to suggestions. It should show previous payments, and allow user to edit, add or delete them. Instead of just a Subscription, we should have a Payment entity. Subscription should have a list of payments. Each payment should have a date, amount, and a link to the subscription. User should be able to update subscription cost. Make sure already paid payments don't change. When deleting a subscription, make sure previous payments aren't deleted.
- [x] Google Calendar export for subscriptions: in Subscriptions tab show a button to export each subscription row to Google Calendar. Skip the above-table bulk Google Calendar button because the app does not currently have Google Calendar API authorization/storage for exporting all subscriptions. Add unit and E2E tests.
- [x] Show a translated string for Polish, for "Network error" in toast. Find other places with hardcoded strings and add translations for them.
- [x] After user's first login, add a glow/slow pulsate effect to the Manage Subscriptions button, to direct user's attention to it.
- [x] Move category management from Settings to Manage tab, as a new sub-tab.
- [x] On tabs with sub-tabs, when changing sub-tab update the tab's title (<h1> element) to match the sub-tab name.
- [x] Import data functionality: after a file is selected by user and validated, show a modal with a preview of the data to be imported. Let user confirm or cancel the import. Add a checkbox to replace existing data with imported data. Add unit and E2E tests.
- [x] Clicking on a standalone payment in Dashboard shows an error. Instead it should open a modal with payment name, date, amount, and buttons to edit/delete. Make it look similar to Payment History in Edit Subscription. Title it "Payment Details". Also rename Edit Subscription modal to "Subscription Details". Add "Add Payment" button to Manage page, to the left of "Add Subscription".
- [x] Edit subscription modal can be cut off if screen height is small. Add a scrollbar to the modal.
- [x] Find instances of Primary (Save/Add Subscription etc) and Cancel button pairs and make them consistent - primary on the right, cancel on the left. Make styles and distance between them be consistent too. Add missing Cancel buttons.
- [x] In Dashboard, under This Month's Payments, add a new section: a calendar showing days (as buttons) of currently selected month. Days with payments in them should have a dot with the payment count, in the style of "unread notifications" dots in other applications (red dot). On hover for the day show a tooltip with list of payments for that day. Make the calendar look consistent with the rest of the app. On click for the day show a modal with a table of payments for that day, looking and acting like the Payment History table in Subscription Details modal.
- [x] Default reminders
- [x] Budget threshold alerts
- [x] Add more translations for major languages: German, Spanish, French, Italian, Portuguese, Russian, Chinese, Japanese, Korean
- [x] Improve UI & UX on small screens
- [x] Make the web app installable on mobile devices. Add a manifest file and a service worker. Add a button to install the app on mobile devices.
- [x] Add translations for default categories. If "Reset to Defaults" is clicked, the categories should be reset to default values in the current language.
- [x] Make the tab buttons in nav bar bigger on mobile devices. They should fill available space.
- [x] Production deployment checklist:
    - [x] Email notifications - set an external service
    - [x] Delete production database and DB migrations from code, we'll deploy it from scratch.
    - [x] Google Auth setup in Google Cloud Console
    - [x] App installation on mobile - works with Chrome
    - [x] Add a domain: done - subtracker.cc
    - [x] Test Google Analytics and Google Tag Manager
- [x] Add a footer with "Made by Kamil Kapsiak" and a link to report an issue.
- [x] Review the frontend code for switches and make them look consistent - positioned to the left of their labels.
- [x] Reminders rework:
  - Make them work like in Google Calendar. When the Payment Reminders switch is set on, show 3 inline inputs: Notification/Email (notification means push notification, notification is set default), number (1 by default), unit (minutes, hours, days - days is default). At the end add a delete button. Add a plus button below to add more reminders - adds a new row. Limit to 5 reminders. Reminders are off by default. The same UI should be used in modals and in Settings page, for default reminders. Make sure UI is consistent with the rest of the app. If Payment Reminders switch is turned on in a modal, under the list of reminders show a message: "You can change default reminders in Settings".
  - Remove the "Browser Push Notifications" section from Settings. App should request permission for push notifications when first turning on reminders in Settings or in a modal.
  - Add unit and E2E tests.
- [x] Move the Install App button from the dropdown menu next to (to the left of) the right button on the nav bar. On mobile screens it should instead go on the same line as Dashboard title, but aligned to the right. It should have a "download" icon and Install App text.
- [x] Analyze Lighthouse report and create a plan to fix issues. Ask the user for confirmations if proposed changes are very complicated or time consuming.
- [x] Remove Default Payment Reminders switch in Settings, by default it should be the "Add reminder" button.
- [x] Remove email field from Enable Email Reports, since it's not used.
- [x] Remove minutes/hours options for reminders, and remove the dropdown, days should be hardcoded.
- [x] Clicking Save in Custom Billing Days shows a warning in console: Tooltip is changing from controlled to uncontrolled. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.
- [x] Setting a custom billing cycle should automatically update Next Billing Date, and disable that field from being edited, until Billing Cycle is set to weekly/monthly/yearly.
- [x] This Month's Payments and Payment Calendar in Dashboard use only Next Billing Date for subscription and ignore custom billing cycles. Fix this and other places that use billing dates.
- [ ] Make sections in Dashboard collapsible. Collapsed section should show only the title and a chevron icon. Collapse icon should be a chevron, and be positioned in top right. Save collapsed state in database. Add unit and E2E tests.
- [ ] Push notifications not working on Opera (desktop)
- [ ] Push notifications not working when Chrome (desktop) is not running
- [x] Add SEO (meta tags, sitemap.xml, etc.)