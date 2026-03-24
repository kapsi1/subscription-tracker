import { test, expect } from '@playwright/test';
import { Client } from 'pg';
import { cleanupUser } from './test-utils';

test.describe('Settings Search', () => {
  let testEmail: string;
  const testPassword = 'StrongPassword123!';

  async function ensureVerified(email: string) {
    const client = new Client({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5433/subscription_tracker?schema=public',
    });

    await client.connect();
    try {
      await client.query(
        'UPDATE "User" SET "isVerified" = true, "verificationToken" = NULL, "verificationTokenExpiresAt" = NULL WHERE email = $1',
        [email],
      );
    } finally {
      await client.end();
    }
  }

  test.beforeEach(async ({ page }) => {
    testEmail = `testuser-search-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
    // Register a new user
    await page.goto('/login');
    await page.getByRole('button', { name: 'Switch to Register' }).click();
    await page.getByLabel('Full Name').fill('Search Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();

    try {
      await page.waitForURL('**/dashboard', { timeout: 30000 });
    } catch {
      await ensureVerified(testEmail);
      await page.goto('/login');
      await page.getByLabel('Email').fill(testEmail);
      await page.getByLabel('Password').fill(testPassword);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL('**/dashboard', { timeout: 30000 });
    }
    
    // Go to settings
    await page.goto('/settings/preferences');
    await expect(page).toHaveURL(/\/settings\/preferences/);
  });

  test.afterEach(async () => {
    await cleanupUser(testEmail);
  });


  test('should highlight matches in section titles', async ({ page }) => {
    const searchInput = page.locator('#settings-search-input');
    await searchInput.fill('Localization');

    // Section should be visible
    const localizationHeading = page.getByRole('heading', { name: 'Localization' });
    await expect(localizationHeading).toBeVisible();

    // Check for highlight (mark tag)
    const highlight = localizationHeading.locator('mark');
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveText('Localization');
    await expect(highlight).toHaveCSS('background-color', 'rgb(254, 240, 138)'); // #fef08a
  });

  test('should filter sections by description', async ({ page }) => {
    const searchInput = page.locator('#settings-search-input');
    await searchInput.fill('color mode');

    // Appearance section should be visible because of "Select your preferred color mode"
    await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
    
    // Localization section should NOT be visible
    await expect(page.getByRole('heading', { name: 'Localization' })).not.toBeVisible();

    const highlight = page.locator('mark').first();
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveText(/color mode/i);
  });

  test('should match terms in extra search keys', async ({ page }) => {
    const searchInput = page.locator('#settings-search-input');
    // "icons" is a searchKey for Category Management
    await searchInput.fill('icons');

    await expect(page.getByRole('heading', { name: 'Category Management' })).toBeVisible();
    
    // Localization should not match "icons"
    await expect(page.getByRole('heading', { name: 'Localization' })).not.toBeVisible();
  });

  test('should show no results message for non-matching queries', async ({ page }) => {
    const searchInput = page.locator('#settings-search-input');
    await searchInput.fill('xyznonexistentsearchterm');

    await expect(page.getByText(/No results found for "xyznonexistentsearchterm"/i)).toBeVisible();
    
    // No headings should be visible
    await expect(page.getByRole('heading', { name: 'Localization' })).not.toBeVisible();
  });

  test('should clear search results when clicking X button', async ({ page }) => {
    const searchInput = page.locator('#settings-search-input');
    await searchInput.fill('Localization');
    
    await expect(page.getByRole('heading', { name: 'Localization' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Appearance' })).not.toBeVisible();

    const clearButton = page.locator('#clear-settings-search');
    await clearButton.click();

    await expect(searchInput).toHaveValue('');
    await expect(page.getByRole('heading', { name: 'Localization' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
  });

  test('should persist search query when switching tabs', async ({ page }) => {
    const searchInput = page.locator('#settings-search-input');
    await searchInput.fill('Localization');

    // Verify search works on Preferences tab
    await expect(page.getByRole('heading', { name: 'Localization' })).toBeVisible();

    // Switch to Profile tab via click
    await page.getByRole('link', { name: 'Profile' }).click();
    await expect(page).toHaveURL(/\/settings\/profile/);

    // Search query should still be there
    await expect(searchInput).toHaveValue('Localization');
    
    // Verify results persist and display on the new tab
    await expect(page.getByRole('heading', { name: 'Localization' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Change Password' })).not.toBeVisible();
  });
});
