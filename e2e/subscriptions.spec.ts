import { Buffer } from 'node:buffer';
import { test, expect } from '@playwright/test';
import { cleanupUser } from './test-utils';

test.describe('Subscriptions Flow', () => {
  const testEmail = `testuser-subs-${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';

  test.afterAll(async () => {
    await cleanupUser(testEmail);
  });

  test('should manage subscriptions (CRUD)', async ({ page }) => {
    // 1. Setup: Register and Login
    await page.goto('/login');
    await page.getByRole('button', { name: "Switch to Register" }).click();
    await page.getByLabel('Full Name').fill('Subscriptions Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });

    // Navigate to Subscriptions
    await page.waitForTimeout(1000);
    await page.goto('/subscriptions');
    await expect(page).toHaveURL(/\/manage\/subscriptions/);
    await expect(page.getByRole('button', { name: 'Add Subscription' }).first()).toBeVisible();

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
    await expect(page.getByRole('cell', { name: 'Netflix', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: '$15.99' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Monthly' })).toBeVisible();

    // 3. Read/Search Subscription
    await page.getByPlaceholder('Search subscriptions').fill('Spotify');
    // Should be empty again
    await expect(page.getByText('No subscriptions found')).toBeVisible();
    
    await page.getByPlaceholder('Search subscriptions').fill('Net');
    // Netflix should return
    await expect(page.getByRole('cell', { name: 'Netflix', exact: true })).toBeVisible();

    // 4. Update Subscription
    // Clear search
    await page.getByPlaceholder('Search subscriptions').clear();
    
    // Open details by clicking the row
    await page.getByRole('row', { name: /Netflix/ }).click();
    
    const detailsDialog = page.getByRole('dialog');
    await expect(detailsDialog).toBeVisible();
    await expect(detailsDialog.getByText('Subscription Details')).toBeVisible();
    await detailsDialog.getByLabel('Amount').fill('17.99');
    await page.waitForTimeout(500); // Wait for potential state settlement
    await detailsDialog.getByRole('button', { name: 'Update Subscription' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('cell', { name: '$17.99' })).toBeVisible();

    // 5. Delete Subscription
    page.once('dialog', dialog => dialog.accept()); // Handle confirm dialog automatically
    
    // Click delete
    const netflixRow = page.getByRole('row', { name: /Netflix/ });
    await netflixRow.hover();
    await netflixRow.getByRole('button').click();
    
    // Verify it disappeared and empty state returned
    await expect(page.getByRole('cell', { name: 'Netflix', exact: true })).not.toBeVisible();
    await expect(page.getByText('No subscriptions found')).toBeVisible();

    // 6. Test Export
    // First let's add two simple ones to export
    await page.getByRole('button', { name: 'Add Subscription' }).first().click();
    await page.getByLabel('Service Name').fill('Spotify');
    await page.getByLabel('Amount').fill('10.99');
    await page.getByRole('combobox', { name: /Category/i }).click();
    await page.getByRole('option', { name: 'Entertainment' }).click();
    await page.getByRole('button', { name: 'Add Subscription' }).click();
    await expect(page.getByRole('cell', { name: 'Spotify', exact: true })).toBeVisible();

    const spotifyRow = page.getByRole('row', { name: /Spotify/ });
    await spotifyRow.hover();

    const googleCalendarLink = spotifyRow.getByRole('link', {
      name: 'Export Spotify to Google Calendar',
    });
    await expect(googleCalendarLink).toBeVisible();
    await expect(googleCalendarLink).toHaveAttribute(
      'href',
      /calendar\.google\.com\/calendar\/render/,
    );
    await expect(googleCalendarLink).toHaveAttribute('href', /text=Spotify/);
    await expect(googleCalendarLink).toHaveAttribute('target', '_blank');

    // Click Export button and intercept download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('subtracker_data.json');

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

    await page.getByRole('button', { name: 'Confirm Import' }).click();
    await expect(page.getByText('Successfully imported subscriptions')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Hulu', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'AWS', exact: true })).toBeVisible();
  });

  test('should persist reminder rows after saving and reopening a subscription', async ({ page }) => {
    // Register and login
    const reminderEmail = `testuser-reminder-subs-${Date.now()}@example.com`;
    await page.goto('/login');
    await page.getByRole('button', { name: 'Switch to Register' }).click();
    await page.getByLabel('Full Name').fill('Reminder Test User');
    await page.getByLabel('Email').fill(reminderEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await page.goto('/subscriptions');
    await expect(page).toHaveURL(/\/manage\/subscriptions/);

    // Open Add Subscription modal
    await page.getByRole('button', { name: 'Add Subscription' }).first().click();
    await page.getByLabel('Service Name').fill('ReminderTest');
    await page.getByLabel('Amount').fill('9.99');
    await page.getByRole('combobox', { name: /Category/i }).click();
    await page.getByRole('option', { name: 'Entertainment' }).click();

    // Click "Add reminder" to add a row (no toggle anymore)
    await page.getByRole('button', { name: 'Add reminder' }).click();

    // Set value to 5
    const valueInput = page.getByRole('spinbutton').last();
    await valueInput.fill('5');

    // Unit is now hardcoded to days
    await expect(page.getByText(/^days$/)).toBeVisible();

    // Save subscription
    await page.getByRole('button', { name: 'Add Subscription' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('cell', { name: 'ReminderTest', exact: true })).toBeVisible();

    // Reopen the subscription
    await page.getByRole('row', { name: /ReminderTest/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify the reminder row persisted with value=5 and unit=days
    await expect(dialog.getByRole('spinbutton').last()).toHaveValue('5');
    await expect(page.getByText(/^days$/)).toBeVisible();

    await cleanupUser(reminderEmail);
  });
});
