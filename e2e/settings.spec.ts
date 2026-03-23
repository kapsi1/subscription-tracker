import { test, expect } from '@playwright/test';
import { cleanupUser } from './test-utils';

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
    await page.goto('/settings/preferences');
    await settingsResponse;
    await expect(page.getByRole('heading', { name: 'Preferences', exact: true })).toBeVisible();
    // Toggle email notifications
    const emailToggle = page.getByLabel('Enable Email Notifications');
    await emailToggle.click();

    // Autosave should persist these changes
    // Wait for the debounced save to complete
    await page.waitForResponse(
      (resp) => resp.url().includes('/users/settings') && resp.request().method() === 'PATCH',
    );
    await page.waitForTimeout(1000); // Extra buffer for DB/State to settle

    // Reload page
    await page.reload();

    // Verify values persisted
    // Expect the opposite of default (default is true for email)
    await expect(emailToggle).not.toBeChecked();
  });

  test('should persist default reminder settings across page reloads', async ({ page }) => {
    const settingsResponse = page.waitForResponse(
      (resp) => resp.url().includes('/users/me') && resp.request().method() === 'GET',
    );
    await page.goto('/settings/preferences');
    await settingsResponse;
    await expect(page.getByRole('heading', { name: 'Preferences', exact: true })).toBeVisible();

    // Enable default reminders toggle (default is disabled for new users)
    const reminderToggle = page.getByLabel('Default Payment Reminders');
    await reminderToggle.click();
    await expect(reminderToggle).toBeChecked();

    // Click "Add reminder" to add a row
    await page.getByRole('button', { name: 'Add reminder' }).click();

    // Set value to 7
    const valueInput = page.getByRole('spinbutton').first();
    await valueInput.fill('7');

    // Change unit from days to hours via the unit combobox (second combobox in the row)
    const comboboxes = page.getByRole('combobox');
    const unitCombobox = comboboxes.last();
    await unitCombobox.click();
    await page.getByRole('option', { name: 'hours' }).click();

    // Wait for autosave
    await page.waitForResponse(
      (resp) => resp.url().includes('/users/settings') && resp.request().method() === 'PATCH',
    );
    await page.waitForTimeout(1000);

    // Reload and verify persistence
    await page.reload();
    await page.waitForResponse(
      (resp) => resp.url().includes('/users/me') && resp.request().method() === 'GET',
    );
    await page.waitForTimeout(500); // allow key-based remount

    await expect(reminderToggle).toBeChecked();
    await expect(page.getByRole('spinbutton').first()).toHaveValue('7');
    await expect(page.getByRole('combobox').last()).toHaveText('hours');
  });
});
