import { test, expect } from '@playwright/test';
import { cleanupUser, closePool } from './test-utils';

test.describe('Subscriptions Flow', () => {
  const testEmail = `testuser-subs-${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';

  test.afterAll(async () => {
    await cleanupUser(testEmail);
    await closePool();
  });

  test('should manage subscriptions (CRUD)', async ({ page }) => {
    // 1. Setup: Register and Login
    await page.goto('/login');
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });

    // Navigate to Subscriptions
    await page.goto('/subscriptions');
    await expect(page.getByRole('heading', { name: 'Subscriptions', exact: true })).toBeVisible();

    // Verify empty state
    await expect(page.getByText('No subscriptions found')).toBeVisible();

    // 2. Create Subscription
    await page.getByRole('button', { name: 'Add Subscription' }).first().click();
    
    // Default cycle is monthly
    await page.getByLabel('Service Name').fill('Netflix');
    await page.getByLabel('Amount').fill('15.99');
    
    // Select category (Select component in Radix requires clicking trigger then item)
    await page.getByRole('combobox', { name: /Category/i }).click();
    await page.getByRole('option', { name: 'Entertainment' }).click();

    await page.getByRole('button', { name: 'Add Subscription' }).click();

    // Wait for modal to close and row to appear in table
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('cell', { name: 'Netflix' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '$15.99' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Monthly' })).toBeVisible();

    // 3. Read/Search Subscription
    await page.getByPlaceholder('Search subscriptions').fill('Spotify');
    // Should be empty again
    await expect(page.getByText('No subscriptions found')).toBeVisible();
    
    await page.getByPlaceholder('Search subscriptions').fill('Net');
    // Netflix should return
    await expect(page.getByRole('cell', { name: 'Netflix' })).toBeVisible();

    // 4. Update Subscription
    // Clear search
    await page.getByPlaceholder('Search subscriptions').clear();
    
    // Click edit on the row
    await page.getByRole('row', { name: /Netflix/ }).getByRole('button').first().click(); // First button is Edit (pencil)
    
    await expect(page.getByRole('dialog', { name: 'Edit Subscription' })).toBeVisible();
    await page.getByLabel('Amount').fill('17.99');
    await page.getByRole('button', { name: 'Update Subscription' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('cell', { name: '$17.99' })).toBeVisible();

    // 5. Delete Subscription
    page.once('dialog', dialog => dialog.accept()); // Handle confirm dialog automatically
    
    // Click delete
    await page.getByRole('row', { name: /Netflix/ }).getByRole('button').nth(1).click(); // Second button is Trash
    
    // Verify it disappeared and empty state returned
    await expect(page.getByRole('cell', { name: 'Netflix' })).not.toBeVisible();
    await expect(page.getByText('No subscriptions found')).toBeVisible();

    // 6. Test Export
    // First let's add two simple ones to export
    await page.getByRole('button', { name: 'Add Subscription' }).first().click();
    await page.getByLabel('Service Name').fill('Spotify');
    await page.getByLabel('Amount').fill('10.99');
    await page.getByRole('combobox', { name: /Category/i }).click();
    await page.getByRole('option', { name: 'Entertainment' }).click();
    await page.getByRole('button', { name: 'Add Subscription' }).click();
    await expect(page.getByRole('cell', { name: 'Spotify' })).toBeVisible();

    // Click Export button and intercept download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('subscriptions.json');

    // 7. Test Import
    // We already have 1 subscription. We'll simulate importing a JSON file
    // with 2 new subscriptions. (We bypass actual UI file drop because Playwright gives us `setInputFiles`).
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Import' }).click();
    const fileChooser = await fileChooserPromise;

    const importData = {
      subscriptions: [
        { name: 'Hulu', amount: 12.99, currency: 'USD', billingCycle: 'monthly', category: 'Entertainment' },
        { name: 'AWS', amount: 45.0, currency: 'USD', billingCycle: 'monthly', category: 'Cloud Services' }
      ]
    };

    const importBuffer = Buffer.from(JSON.stringify(importData));
    await fileChooser.setFiles({
        name: 'import.json',
        mimeType: 'application/json',
        buffer: importBuffer
    });

    await expect(page.getByText('Successfully imported subscriptions')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Hulu' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'AWS' })).toBeVisible();
  });
});
