import { test, expect } from '@playwright/test';

test.describe('Subscriptions Flow', () => {
  test('should redirect unauthenticated users to /login from subscriptions', async ({ page }) => {
    await page.goto('/subscriptions');

    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
