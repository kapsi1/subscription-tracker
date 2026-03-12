import { test, expect } from '@playwright/test';
import { cleanupUser, closePool } from './test-utils';

test.describe('User Settings Persistence', () => {
  let testEmail: string;
  const testPassword = 'StrongPassword123!';

  test.beforeEach(async ({ page }) => {
    testEmail = `testuser-settings-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
    // Register a new user
    await page.goto('/login');
    await page.getByRole('button', { name: 'Switch to Register' }).click();
    await page.getByLabel('Full Name').fill('Settings Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30000 });
  });

  test.afterEach(async () => {
    await cleanupUser(testEmail);
  });

  test.afterAll(async () => {
    await closePool();
  });

  test('should persist accent color across page reloads', async ({ page }) => {
    await page.goto('/settings/preferences');
    await expect(page).toHaveURL(/\/settings\/preferences/);

    const patchPromise = page.waitForResponse(
      (resp) => resp.url().includes('/users/settings') && resp.request().method() === 'PATCH',
    );

    // Select Crimson accent preset in Appearance section
    await page.getByTitle('Crimson').click();
    await patchPromise;

    // Verify the primary color is updated
    const primaryColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim().toLowerCase(),
    );
    expect(['#be123c', '#f43f5e']).toContain(primaryColor);

    // Reload the page
    await page.reload();
    await expect(page).toHaveURL(/\/settings\/preferences/);

    // Verify it persists
    const persistedColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim().toLowerCase(),
    );
    expect(['#be123c', '#f43f5e']).toContain(persistedColor);
  });

  test('should persist theme across page reloads', async ({ page }) => {
    await page.goto('/settings/preferences');
    await expect(page).toHaveURL(/\/settings\/preferences/);

    const patchPromise = page.waitForResponse(
      (resp) => resp.url().includes('/users/settings') && resp.request().method() === 'PATCH',
    );

    // Pick dark theme from Appearance section
    await page.getByRole('button', { name: /Dark Theme|Ciemny motyw/ }).click();
    await patchPromise;

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Reload page and verify persistence
    await page.reload();
    await expect(html).toHaveClass(/dark/);
  });

  test('should persist notification settings in Settings page', async ({ page }) => {
    await page.waitForTimeout(2000);
    const settingsResponse = page.waitForResponse(
      (resp) => resp.url().includes('/users/me') && resp.request().method() === 'GET',
    );
    await page.goto('/settings');
    await settingsResponse;
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Preferences' }).click();
    // Toggle email notifications
    const emailToggle = page.getByLabel('Enable Email Notifications');
    await emailToggle.click();

    // Set a webhook URL
    await page.getByLabel('Enable Webhooks').click();
    await page.getByLabel('Webhook URL').fill('https://example.com/webhook');

    // Autosave should persist these changes
    // Wait for the debounced save to complete
    await page.waitForResponse(
      (resp) => resp.url().includes('/users/settings') && resp.request().method() === 'PATCH',
    );
    await page.waitForTimeout(1000); // Extra buffer for DB/State to settle

    // Reload page
    await page.reload();

    // Verify values persisted
    // Expect the opposite of default (default is true for email, false for webhook)
    await expect(emailToggle).not.toBeChecked();
    await expect(page.getByLabel('Webhook URL')).toHaveValue('https://example.com/webhook');
  });
});
