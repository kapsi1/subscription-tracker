import { test, expect } from '@playwright/test';
import { cleanupUser } from './test-utils';

test.describe('Authentication Flow', () => {
  const testPassword = 'StrongPassword123!';
  const createdEmails: string[] = [];

  const generateTestEmail = () => {
    const email = `testuser-auth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    createdEmails.push(email);
    return email;
  };

  // Cleanup after all tests in this execution block finish
  test.afterAll(async () => {
    for (const email of createdEmails) {
      await cleanupUser(email);
    }
  });

  test('should navigate to login page and show correct elements', async ({ page }) => {
    await page.goto('/login');
    
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/SubTracker/);

    // Verify form elements exist
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should redirect unauthenticated users from root directly to login without dashboard flash', async ({ page }) => {
    const visitedUrls: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        visitedUrls.push(frame.url());
      }
    });

    await page.goto('/').catch(e => {
      if (!e.message.includes('ERR_ABORTED')) throw e;
    });
    await page.waitForURL('**/login', { timeout: 30_000 });

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    const visitedDashboard = visitedUrls.some((url) => {
      try {
        return new URL(url).pathname === '/dashboard';
      } catch {
        return false;
      }
    });
    expect(visitedDashboard).toBeFalsy();
  });

  test('should complete the registration, login and logout cycle', async ({ page }) => {
    const testEmail = generateTestEmail();

    // 1. Registration
    await page.goto('/login');
    
    // Switch to Sign Up mode
    await page.getByRole('button', { name: "Switch to Register" }).click();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

    // Fill the form
    await page.getByLabel('Full Name').fill('Auth Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    
    // Submit
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // 2. Logout
    await page.getByRole('button', { name: 'User menu' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    // Verify redirect to login
    await page.waitForURL('**/login', { timeout: 30_000 });
    await expect(page).toHaveURL(/\/login/);

    // 3. Login
    // Ensure we're in Sign In mode (route state can preserve Sign Up mode).
    const createAccountButton = page.getByRole('button', { name: 'Create Account' });
    if (await createAccountButton.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'Switch to Login' }).click();
    }

    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    
    // Submit
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify redirect to dashboard again
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should redirect authenticated users from root to dashboard without auth loading gate flash', async ({ page }) => {
    const testEmail = generateTestEmail();

    await page.goto('/login');
    await page.getByRole('button', { name: "Switch to Register" }).click();
    await page.getByLabel('Full Name').fill('Auth Redirect User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });

    await page.goto('/');
    await page.waitForURL('**/dashboard', { timeout: 30_000 });

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).not.toBeVisible();
    await expect(page.getByText('Redirecting to login...')).not.toBeVisible();
    await expect(page.getByText('Initializing application...')).not.toBeVisible();
  });
});
