import { test, expect } from '@playwright/test';
import { cleanupUser, closePool } from './test-utils';

test.describe('Authentication Flow', () => {
  const testEmail = `testuser-auth-${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';

  // Cleanup after all tests in this execution block finish
  test.afterAll(async () => {
    await cleanupUser(testEmail);
    await closePool();
  });

  test('should navigate to login page and show correct elements', async ({ page }) => {
    await page.goto('/login');
    
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Subscription Tracker/);

    // Verify form elements exist
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should complete the registration, login and logout cycle', async ({ page }) => {
    // 1. Registration
    await page.goto('/login');
    
    // Switch to Sign Up mode
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

    // Fill the form
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    
    // Submit
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // 2. Logout
    // Click explicit Logout button in the header
    await page.getByRole('button', { name: 'Log out' }).click();

    // Verify redirect to login
    await page.waitForURL('**/login', { timeout: 30_000 });
    await expect(page).toHaveURL(/\/login/);

    // 3. Login
    // Switch should be on Sign In mode by default
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    
    // Submit
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify redirect to dashboard again
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
