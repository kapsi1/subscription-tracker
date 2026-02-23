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

    // 4. Save
    await page.getByRole('button', { name: 'Save Settings' }).click();
    // Verify success toast appears
    await expect(page.getByText('Settings saved successfully')).toBeVisible();

    // 5. Reload and Verify Persistence
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Alerts & Notifications' })).toBeVisible();

    await expect(emailSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(webhookSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByPlaceholder('you@example.com')).toHaveValue(testEmail);
    await expect(page.getByPlaceholder('https://your-domain.com/webhook')).toHaveValue('https://example.com/hook');
  });
});
