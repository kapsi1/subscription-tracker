import { test, expect } from '@playwright/test';
import { Client } from 'pg';
import { cleanupUser } from './test-utils';

const testPassword = 'StrongPassword123!';
const createdEmails: string[] = [];

async function registerAndLogin(
  page: import('@playwright/test').Page,
  email: string,
  name: string,
) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Switch to Register' }).click();
  await page.getByLabel('Full Name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(testPassword);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
}

async function seedCalendarPayments(email: string) {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5433/subscription_tracker?schema=public',
  });

  const now = new Date();
  const targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15, 12, 0, 0));
  const dayKey = targetDate.toISOString().slice(0, 10);

  await client.connect();

  try {
    const userRes = await client.query('SELECT id FROM "User" WHERE email = $1', [email]);
    const userId = userRes.rows[0]?.id as string;

    const subscriptionId = crypto.randomUUID();
    const createdAt = new Date();
    await client.query(
      `INSERT INTO "Subscription"
        (id, "userId", name, amount, currency, "billingCycle", "nextBillingDate", category, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        subscriptionId,
        userId,
        'Calendar Subscription',
        '18.00',
        'USD',
        'monthly',
        targetDate,
        'Entertainment',
        createdAt,
        createdAt,
      ],
    );

    await client.query(
      `INSERT INTO "PaymentHistory"
        (id, "userId", "subscriptionId", "subscriptionName", amount, currency, "paidAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        crypto.randomUUID(),
        userId,
        subscriptionId,
        'Calendar Subscription',
        '18.00',
        'USD',
        targetDate,
      ],
    );

    await client.query(
      `INSERT INTO "PaymentHistory"
        (id, "userId", "subscriptionId", "subscriptionName", amount, currency, "paidAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        crypto.randomUUID(),
        userId,
        null,
        'Calendar Standalone',
        '7.50',
        'USD',
        targetDate,
      ],
    );

    return { dayKey, targetDate };
  } finally {
    await client.end();
  }
}

test.describe('Dashboard Payment Calendar', () => {
  test.afterAll(async () => {
    for (const email of createdEmails) {
      await cleanupUser(email);
    }
  });

  test('shows grouped payment counts and opens the day modal', async ({ page }) => {
    const email = `calendar-e2e-${Date.now()}@example.com`;
    createdEmails.push(email);

    const { dayKey } = await test.step('register user and seed payments', async () => {
      await registerAndLogin(page, email, 'Calendar E2E User');
      return seedCalendarPayments(email);
    });

    await page.goto('/dashboard');

    const dayButton = page.getByTestId(`payment-calendar-day-${dayKey}`);
    await expect(dayButton).toBeVisible();
    await expect(dayButton.getByText('2', { exact: true })).toBeVisible();

    await dayButton.click();

    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: /Payments on / })).toBeVisible();
    await expect(modal.getByText('Calendar Subscription')).toBeVisible();
    await expect(modal.getByText('Calendar Standalone')).toBeVisible();
  });

  test('opens standalone payment details from the day modal', async ({ page }) => {
    const email = `calendar-standalone-${Date.now()}@example.com`;
    createdEmails.push(email);

    const { dayKey } = await test.step('register user and seed payments', async () => {
      await registerAndLogin(page, email, 'Standalone Drilldown User');
      return seedCalendarPayments(email);
    });

    await page.goto('/dashboard');
    await page.getByTestId(`payment-calendar-day-${dayKey}`).click();

    const dayModal = page.getByRole('dialog');
    await dayModal.getByText('Calendar Standalone').click();

    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: 'Payment Details' })).toBeVisible();
    await expect(page.locator('#edit-name')).toHaveValue('Calendar Standalone');
  });
});
