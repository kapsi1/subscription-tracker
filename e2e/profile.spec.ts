import { expect, test } from '@playwright/test';
import { cleanupUser, closePool } from './test-utils';

test.describe('Change Password and Change Email', () => {
  const testPassword = 'StrongPassword123!';
  const createdEmails: string[] = [];

  const generateTestEmail = () => {
    const email = `testuser-profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    createdEmails.push(email);
    return email;
  };

  const registerAndLogin = async (page: import('@playwright/test').Page, email: string) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Switch to Register' }).click();
    await page.getByLabel('Full Name').fill('Profile Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30000 });
  };

  test.afterAll(async () => {
    for (const email of createdEmails) {
      await cleanupUser(email);
    }
    await closePool();
  });

  test('should change password successfully', async ({ page }) => {
    const email = generateTestEmail();
    await registerAndLogin(page, email);

    await page.goto('/settings/profile');
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible();

    const newPassword = 'NewPassword456!';
    await page.getByLabel('Current Password').fill(testPassword);
    await page.getByLabel('New Password').fill(newPassword);
    await page.getByLabel('Confirm New Password').fill(newPassword);
    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(page.getByText('Password changed successfully')).toBeVisible({ timeout: 5000 });

    // Verify the new password works by logging in again
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(newPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('should show error when current password is wrong', async ({ page }) => {
    const email = generateTestEmail();
    await registerAndLogin(page, email);

    await page.goto('/settings/profile');
    await page.getByLabel('Current Password').fill('wrongpassword');
    await page.getByLabel('New Password').fill('NewPassword456!');
    await page.getByLabel('Confirm New Password').fill('NewPassword456!');
    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(page.getByText('Current password is incorrect')).toBeVisible({ timeout: 5000 });
  });

  test('should show error when new passwords do not match', async ({ page }) => {
    const email = generateTestEmail();
    await registerAndLogin(page, email);

    await page.goto('/settings/profile');
    await page.getByLabel('Current Password').fill(testPassword);
    await page.getByLabel('New Password').fill('NewPassword456!');
    await page.getByLabel('Confirm New Password').fill('DifferentPassword789!');
    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(page.getByText('New passwords do not match')).toBeVisible({ timeout: 5000 });
  });

  test('should change email successfully', async ({ page }) => {
    const email = generateTestEmail();
    const newEmail = generateTestEmail();
    await registerAndLogin(page, email);

    await page.goto('/settings/profile');
    await expect(page.getByRole('heading', { name: 'Change Email' })).toBeVisible();

    await page.getByLabel('New Email Address').fill(newEmail);
    await page.getByLabel('Current Password').last().fill(testPassword);
    await page.getByRole('button', { name: 'Change Email' }).click();

    await expect(page.getByText('Email changed successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should show error when email change password is wrong', async ({ page }) => {
    const email = generateTestEmail();
    const newEmail = generateTestEmail();
    await registerAndLogin(page, email);

    await page.goto('/settings/profile');
    await page.getByLabel('New Email Address').fill(newEmail);
    await page.getByLabel('Current Password').last().fill('wrongpassword');
    await page.getByRole('button', { name: 'Change Email' }).click();

    await expect(page.getByText('Current password is incorrect')).toBeVisible({ timeout: 5000 });
  });

  test('should show error when new email is already in use', async ({ page }) => {
    const email1 = generateTestEmail();
    const email2 = generateTestEmail();

    // Register both users
    await registerAndLogin(page, email1);
    await page.goto('/login');
    await page.getByRole('button', { name: 'Switch to Register' }).click();
    await page.getByLabel('Full Name').fill('Second User');
    await page.getByLabel('Email').fill(email2);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Try to change email to the first user's email
    await page.goto('/settings/profile');
    await page.getByLabel('New Email Address').fill(email1);
    await page.getByLabel('Current Password').last().fill(testPassword);
    await page.getByRole('button', { name: 'Change Email' }).click();

    await expect(page.getByText('This email address is already in use')).toBeVisible({ timeout: 5000 });
  });
});
