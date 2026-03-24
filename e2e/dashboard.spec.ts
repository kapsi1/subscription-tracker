import { test, expect } from '@playwright/test';
import { cleanupUser } from './test-utils';

test.describe('Dashboard Flow', () => {
  const testEmail = `testuser-dash-${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';

  test.afterAll(async () => {
    await cleanupUser(testEmail);
  });

  test('should display accurate summary cards for active subscriptions', async ({ page }) => {
    // 1. Setup: Register
    await page.goto('/login');
    await page.getByRole('button', { name: "Switch to Register" }).click();
    await page.getByLabel('Full Name').fill('Dashboard Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });

    // 2. Add two subscriptions via the Subscriptions page
    await page.waitForTimeout(1000);
    await page.goto('/subscriptions');
    await expect(page).toHaveURL(/\/manage\/subscriptions/);
    await expect(page.getByRole('heading', { name: 'Subscriptions', exact: true })).toBeVisible();

    // Add first sub (Monthly)
    await page.getByRole('button', { name: 'Add Subscription' }).first().click();
    await page.getByLabel('Service Name').fill('Sub 1');
    await page.getByLabel('Amount').fill('10.00');
    // Default is monthly, USD. Just save.
    await page.getByRole('button', { name: 'Add Subscription' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('cell', { name: 'Sub 1', exact: true })).toBeVisible();

    // Add second sub (Yearly)
    await page.getByRole('button', { name: 'Add Subscription' }).first().click();
    await page.getByLabel('Service Name').fill('Sub 2 Yearly');
    await page.getByLabel('Amount').fill('120.00');
    
    // Change to Yearly
    await page.getByRole('combobox', { name: /Billing Cycle/i }).click();
    await page.getByRole('option', { name: 'Yearly' }).click();
    
    await page.getByRole('button', { name: 'Add Subscription' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('cell', { name: 'Sub 2 Yearly', exact: true })).toBeVisible();

    // 3. Verify Dashboard Summary
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // We have 2 subscriptions. 
    // Dashboard summary currently reports:
    // - Total Monthly Cost: paid payments in the selected month
    // - Total Yearly Cost: paid this year + upcoming this year
    
    // Verify total active subscriptions card
    const activeSubscriptionsCard = page
      .getByRole('heading', { name: 'Subscriptions' })
      .locator('xpath=ancestor::div[@data-slot="card"][1]');
    await expect(activeSubscriptionsCard).toBeVisible();
    await expect(activeSubscriptionsCard.getByText(/^2$/)).toBeVisible();

    // Verify monthly and yearly costs.
    const monthlyCostCard = page
      .getByRole('heading', { name: 'Monthly Cost' })
      .locator('xpath=ancestor::div[@data-slot="card"][1]');
    const yearlyCostCard = page
      .getByRole('heading', { name: 'Yearly Cost' })
      .locator('xpath=ancestor::div[@data-slot="card"][1]');

    // In this flow we only scheduled payments; nothing is marked as paid yet,
    // so this month's paid total should be zero.
    await expect(monthlyCostCard.getByText(/^\$0(?:\.00)?$/)).toBeVisible();

    // Yearly cost depends on the current month (it's paid + upcoming this year).
    await expect(yearlyCostCard.getByText(/^\$\d+(?:\.\d{2})?$/)).toBeVisible();

    // Verify This Month Payments section exists
    await expect(page.getByRole('heading', { name: "This Month's Payments" }).last()).toBeVisible();
  });
});
