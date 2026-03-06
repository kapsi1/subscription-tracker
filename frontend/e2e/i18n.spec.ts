import { test, expect } from '@playwright/test';
import { cleanupUser, closePool } from './test-utils';

test.describe('Internationalization (i18n) Flow', () => {
  const testEmail = `testuser-i18n-${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';

  // Cleanup after all tests in this execution block finish
  test.afterAll(async () => {
    await cleanupUser(testEmail);
    await closePool();
  });

  test('should switch language and persist across reloads', async ({ page }) => {
    // 1. Registration & Navigation
    await page.goto('/login');
    
    // Switch to Sign Up mode
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();
    
    // Fill the form
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    
    // Submit
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    
    // Wait for Dashboard English title
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // 2. Language Switcher Interaction
    // We can select by the accessible label or title.
    await page.getByRole('button', { name: 'Switch Language', exact: false }).click();
    
    // Prepare to wait for the patch request
    const patchPromise = page.waitForResponse(resp => resp.url().includes('/users/settings') && resp.request().method() === 'PATCH');
    
    // Select Polski
    await page.getByRole('menuitem', { name: 'Polski', exact: false }).click();
    await patchPromise;

    // 3. Verify Translation
    // Verify the title translated to 'Panel główny'
    await expect(page.getByRole('heading', { name: 'Panel główny' })).toBeVisible();
    
    // Verify a sidebar item translated
    await expect(page.getByRole('button', { name: 'Subskrypcje' }).first()).toBeVisible();

    // 4. Verify Persistence
    await page.reload();

    // Should still be in Polish after reload
    await expect(page.getByRole('heading', { name: 'Panel główny' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Subskrypcje' }).first()).toBeVisible();
  });
});
