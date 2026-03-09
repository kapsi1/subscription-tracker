import { test, expect } from '@playwright/test';
import { cleanupUser, closePool } from './test-utils';
import { Client } from 'pg';

test.describe('Dashboard Paid Toggle', () => {
  const testEmail = `testuser-paid-${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';

  test.afterAll(async () => {
    await cleanupUser(testEmail);
    await closePool();
  });

  async function insertManualPayment(email: string, subName: string) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/subscription_tracker?schema=public',
    });
    await client.connect();
    try {
      const userRes = await client.query('SELECT id FROM "User" WHERE email = $1', [email]);
      const userId = userRes.rows[0].id;
      
      const subRes = await client.query('SELECT id, amount, currency FROM "Subscription" WHERE "userId" = $1 AND name = $2', [userId, subName]);
      const sub = subRes.rows[0];
      
      await client.query(
        'INSERT INTO "PaymentHistory" (id, "subscriptionId", amount, currency, "paidAt") VALUES ($1, $2, $3, $4, $5)',
        [crypto.randomUUID(), sub.id, sub.amount, sub.currency, new Date()]
      );
    } finally {
      await client.end();
    }
  }

  test('should toggle showing already paid subscriptions and persist state', async ({ page }) => {
    // 1. Setup: Register
    await page.goto('/login');
    await page.getByRole('button', { name: "Switch to Register" }).click();
    await page.getByLabel('Full Name').fill('Paid Toggle User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });

    // 2. Add a subscription
    await page.goto('/subscriptions');
    await page.getByRole('button', { name: 'Add Subscription' }).first().click();
    await page.getByLabel('Service Name').fill('Paid Sub');
    await page.getByLabel('Amount').fill('15.00');
    await page.getByRole('button', { name: 'Add Subscription' }).click();
    await expect(page.getByRole('cell', { name: 'Paid Sub' })).toBeVisible();

    // 3. Manually insert a payment record to make it "Done"
    await insertManualPayment(testEmail, 'Paid Sub');

    // 4. Verify Dashboard
    await page.goto('/dashboard');
    
    // Check toggle is ON by default
    const toggle = page.getByRole('switch', { name: /Show paid/i });
    await expect(toggle).toBeChecked();

    // Check "Paid Sub" is visible and marked as "Done"
    // The payment list might take a moment to refresh from the manual DB insertion
    await page.waitForTimeout(1000);
    await expect(page.getByText('Paid Sub').first()).toBeVisible();
    await expect(page.getByText('Done').first()).toBeVisible();

    // 5. Toggle OFF
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    // Verify "Paid Sub" is HIDDEN
    // Use a negative check. Wait a bit for the UI to update.
    await expect(page.getByText('Paid Sub')).not.toBeVisible();

    // 6. Persistence Check: Reload
    await page.reload();
    await page.waitForURL('**/dashboard');
    
    // Verify toggle is still OFF
    await expect(page.getByRole('switch', { name: /Show paid/i })).not.toBeChecked();
    
    // Verify "Paid Sub" is still HIDDEN
    await expect(page.getByText('Paid Sub')).not.toBeVisible();

    // 7. Toggle back ON
    await page.getByRole('switch', { name: /Show paid/i }).click();
    await expect(page.getByRole('switch', { name: /Show paid/i })).toBeChecked();
    
    // Verify "Paid Sub" is VISIBLE again
    await expect(page.getByText('Paid Sub')).toBeVisible();
  });
});
