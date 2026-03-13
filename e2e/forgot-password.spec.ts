import { test, expect } from '@playwright/test';
import { cleanupUser, getUserResetToken } from './test-utils';

test.describe('Forgot Password Flow', () => {
  const testPassword = 'StrongPassword123!';
  const newPassword = 'NewStrongPassword456!';
  const createdEmails: string[] = [];

  const generateTestEmail = () => {
    const email = `testuser-forgot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    createdEmails.push(email);
    return email;
  };

  test.afterAll(async () => {
    for (const email of createdEmails) {
      await cleanupUser(email);
    }
  });

  test('should complete the full forgot password and reset flow', async ({ page }) => {
    const testEmail = generateTestEmail();

    // 1. Setup: Register a user first
    await page.goto('/login');
    await page.getByRole('button', { name: "Switch to Register" }).click();
    await page.getByLabel('Full Name').fill('Forgot Pass User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard');

    // Logout to test forgot password
    await page.getByRole('button', { name: 'User menu' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await page.waitForURL('**/login');

    await page.getByText('Forgot password?').click();
    await page.waitForURL('**/forgot-password');
    
    await expect(page.getByText('SubTracker')).toBeVisible();
    await page.getByLabel('Email').fill(testEmail);
    await page.getByRole('button', { name: 'Forgot password?' }).click();

    // Verify success message
    await expect(page.getByText('Check your email')).toBeVisible();
    await expect(page.getByText(/If an account exists/)).toBeVisible();

    // 3. Reset Password (Direct URL Bypass)
    // Get token from DB
    const token = await getUserResetToken(testEmail);
    expect(token).toBeTruthy();

    // Navigate to reset password page with token
    await page.goto(`/reset-password?token=${token}`);
    
    await expect(page.getByText('Password Reset')).toBeVisible();
    
    // Fill new password
    await page.getByLabel('New Password').first().fill(newPassword);
    await page.getByLabel('Confirm New Password').first().fill(newPassword);
    await page.getByRole('button', { name: 'Reset Password' }).click();

    // Verify success and redirect
    await expect(page.getByText('Password reset successfully').first()).toBeVisible();
    await page.waitForURL('**/login', { timeout: 10000 });

    // 4. Verify login with NEW password
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(newPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' }).first()).toBeVisible();
  });

  test('should show error for non-matching passwords', async ({ page }) => {
    const testEmail = generateTestEmail();

    // Register
    await page.goto('/login');
    await page.getByRole('button', { name: "Switch to Register" }).click();
    await page.getByLabel('Full Name').fill('Match Error User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard');

    // Go to forgot password
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByRole('button', { name: 'Forgot password?' }).click();

    const token = await getUserResetToken(testEmail);
    await page.goto(`/reset-password?token=${token}`);

    // Fill non-matching passwords
    await page.getByLabel('New Password').first().fill(newPassword);
    await page.getByLabel('Confirm New Password').first().fill('DifferentPassword!');
    await page.getByRole('button', { name: 'Reset Password' }).click();

    await expect(page.getByText('Passwords do not match').first()).toBeVisible();
  });

  test('should show error for invalid token on submission', async ({ page }) => {
    await page.goto('/reset-password?token=invalid-token-123');
    
    // The page shows the form even for invalid token (validated on submission)
    await page.getByLabel('New Password').first().fill(newPassword);
    await page.getByLabel('Confirm New Password').first().fill(newPassword);
    await page.getByRole('button', { name: 'Reset Password' }).click();

    await expect(page.getByText('Password reset failed').first()).toBeVisible();
  });
});
