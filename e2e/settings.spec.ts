import { test, expect } from '@playwright/test';
import { cleanupUser, closePool } from './test-utils';

test.describe('User Settings Persistence', () => {
  let testEmail: string;
  const testPassword = 'StrongPassword123!';

  test.beforeEach(async ({ page }) => {
    testEmail = `testuser-settings-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
    // Register a new user
    await page.goto('/login');
    await page.getByRole('button', { name: "Switch to Register" }).click();
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
    await page.waitForTimeout(1000);
    // Open accent switcher
    await page.getByRole('button', { name: 'Accent Color' }).click();
    
    // Prepare to wait for the patch request
    const patchPromise = page.waitForResponse(resp => resp.url().includes('/users/settings') && resp.request().method() === 'PATCH');
    
    // Select Crimson
    await page.getByRole('button', { name: 'Crimson' }).click();
    await patchPromise; // Wait for save to complete
    
    // Verify the primary color is updated
    const primaryColor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim().toLowerCase());
    expect(['#be123c', '#f43f5e']).toContain(primaryColor);

    // Reload the page
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify it persists
    const persistedColor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim().toLowerCase());
    expect(['#be123c', '#f43f5e']).toContain(persistedColor);
  });

  test('should persist theme across page reloads', async ({ page }) => {
    await page.waitForTimeout(1000);
    // Open accent switcher
    await page.getByRole('button', { name: 'Accent Color' }).click();
    
    // Prepare to wait for the patch request
    const patchPromise = page.waitForResponse(resp => resp.url().includes('/users/settings') && resp.request().method() === 'PATCH');
    
    // Toggle theme - initial is light, so title will be "Switch to dark mode"
    // We use a regex to match both for robustness
    await page.getByRole('button', { name: /Switch to (light|dark) mode/ }).click();
    await patchPromise; 
    
    const html = page.locator('html');
    const isDark = await html.evaluate(el => el.classList.contains('dark'));

    // Reload page
    await page.reload();
    
    // Verify persistence
    if (isDark) {
      await expect(html).toHaveClass(/dark/);
    } else {
      await expect(html).not.toHaveClass(/dark/);
    }
  });

  test('should persist notification settings in Settings page', async ({ page }) => {
    await page.waitForTimeout(2000);
    const settingsResponse = page.waitForResponse(resp => resp.url().includes('/users/me') && resp.request().method() === 'GET');
    await page.goto('/settings');
    await settingsResponse;
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
    // Toggle email notifications
    const emailToggle = page.getByLabel('Enable Email Notifications');
    await emailToggle.click();
    
    // Set a webhook URL
    await page.getByLabel('Enable Webhooks').click();
    await page.getByLabel('Webhook URL').fill('https://example.com/webhook');
    
    // Prepare to wait for the patch request
    const patchPromise = page.waitForResponse(resp => resp.url().includes('/users/settings') && resp.request().method() === 'PATCH');
    
    // Save settings - using exact text from translation
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await patchPromise; 
    
    await expect(page.getByText('Settings saved successfully')).toBeVisible();

    // Reload page
    await page.reload();
    
    // Verify values persisted
    // Expect the opposite of default (default is true for email, false for webhook)
    await expect(emailToggle).not.toBeChecked(); 
    await expect(page.getByLabel('Webhook URL')).toHaveValue('https://example.com/webhook');
  });
});
