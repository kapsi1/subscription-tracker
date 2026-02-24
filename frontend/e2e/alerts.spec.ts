import { test, expect } from '@playwright/test';
import { cleanupUser, closePool } from './test-utils';

test.describe('Alert Settings Flow', () => {
  const testEmail = `testuser-alerts-${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';

  test.afterAll(async () => {
    await cleanupUser(testEmail);
    await closePool();
  });

  test('should persist alert configuration in local storage', async ({ page }) => {
    // 1. Setup: Register
    await page.goto('/login');
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });

    // 2. Navigate to Alerts
    await page.goto('/alerts');
    await expect(page.getByRole('heading', { name: 'Alerts & Notifications' })).toBeVisible();

    // 3. Configure Alerts
    // Check if email toggle is already on by default in state, 
    // usually Radix switch has role 'switch'
    const emailSwitch = page.getByRole('switch', { name: /Enable Email Notifications/i });
    
    // If it's not checked by default, toggle it
    const isEmailChecked = await emailSwitch.getAttribute('aria-checked');
    if (isEmailChecked === 'false') {
        await emailSwitch.click();
    }
    await page.getByPlaceholder('you@example.com').fill(testEmail);

    const webhookSwitch = page.getByRole('switch', { name: /Enable Webhooks/i });
    const isWebhookChecked = await webhookSwitch.getAttribute('aria-checked');
    if (isWebhookChecked === 'false') {
        await webhookSwitch.click();
    }
    await page.getByPlaceholder('https://your-domain.com/webhook').fill('https://example.com/hook');

    // Configure Budget — scroll down to make it visible first
    const budgetInput = page.getByLabel(/Monthly Budget/i);
    await budgetInput.scrollIntoViewIfNeeded();
    await budgetInput.fill('500');

    // 4. Save
    const saveButton = page.getByRole('button', { name: 'Save Settings' });
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click();
    // Verify success toast appears
    await expect(page.getByText('Settings saved successfully')).toBeVisible({ timeout: 15_000 });

    // 5. Reload and Verify API-persisted settings survive
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Alerts & Notifications' })).toBeVisible();

    // Email switch defaults to true and email address comes from user profile
    await expect(emailSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByPlaceholder('you@example.com')).toHaveValue(testEmail);
    // monthlyBudget is persisted via API
    const budgetAfterReload = page.getByLabel(/Monthly Budget/i);
    await budgetAfterReload.scrollIntoViewIfNeeded();
    await expect(budgetAfterReload).toHaveValue('500');
  });
});
