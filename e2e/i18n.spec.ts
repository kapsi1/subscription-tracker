import { test, expect } from '@playwright/test';
import { cleanupUser } from './test-utils';

test.describe('Internationalization (i18n) Flow', () => {
  const testEmail = `testuser-i18n-${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';

  // Cleanup after all tests in this execution block finish
  test.afterAll(async () => {
    await cleanupUser(testEmail);
  });

  test('should switch language and persist across reloads', async ({ page }) => {
    // 1. Registration & Navigation
    await page.goto('/login');

    // Switch to Sign Up mode
    await page.getByRole('button', { name: 'Switch to Register' }).click();

    // Fill the form
    await page.getByLabel('Full Name').fill('I18n Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);

    // Submit
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // 2. Language switch moved to Settings > Preferences > Localization
    await page.goto('/settings/preferences');
    await expect(page).toHaveURL(/\/settings\/preferences/);
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();

    const patchPromise = page.waitForResponse(
      (resp) => resp.url().includes('/users/settings') && resp.request().method() === 'PATCH',
    );

    // Select Polish
    await page.getByRole('button', { name: /Polski/ }).click();
    await patchPromise;

    // 3. Verify translation on dashboard navigation
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: 'Subskrypcje' }).first()).toBeVisible();

    // 4. Verify persistence
    await page.reload();
    await expect(page.getByRole('button', { name: 'Subskrypcje' }).first()).toBeVisible();
  });
});
