import { test, expect } from '@playwright/test';

test.describe('Dashboard Flow', () => {
  // Note: These tests require auth. In a real setup you'd use a storage state or
  // login programmatically before each test. For now, we navigate and verify the redirect.

  test('should redirect unauthenticated users to /login', async ({ page }) => {
    await page.goto('/dashboard');

    // Expect redirect to login
    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show login form elements after redirect', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10_000 });

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });
});
