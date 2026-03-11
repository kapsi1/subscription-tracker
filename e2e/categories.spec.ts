import { expect, test } from '@playwright/test';
import { cleanupUser, closePool } from './test-utils';

test.describe('Category Management', () => {
  const testEmail = `testuser-categories-${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/login');
    await page.getByRole('button', { name: 'Switch to Register' }).click();
    await page.getByLabel('Full Name').fill('Category Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await page.close();
  });

  test.afterAll(async () => {
    await cleanupUser(testEmail);
    await closePool();
  });

  async function navigateToCategories(page: import('@playwright/test').Page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Preferences' }).click();
    // Wait until the category section is fully rendered
    await expect(page.getByRole('button', { name: /add category/i })).toBeVisible({
      timeout: 10_000,
    });
  }

  /** Returns the Locator for a category name input matching the given current value. */
  async function getCategoryInput(page: import('@playwright/test').Page, name: string) {
    const inputs = page.getByRole('textbox');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      if ((await inputs.nth(i).inputValue()) === name) {
        return inputs.nth(i);
      }
    }
    throw new Error(`Category input "${name}" not found`);
  }

  /** Asserts (with retries) that a category input with the given name exists. */
  async function expectCategoryExists(page: import('@playwright/test').Page, name: string) {
    await expect(async () => {
      const values = await page
        .getByRole('textbox')
        .evaluateAll((els: HTMLInputElement[]) => els.map((el) => el.value));
      expect(values).toContain(name);
    }).toPass({ timeout: 5_000 });
  }

  /** Asserts (with retries) that no category input with the given name exists. */
  async function expectCategoryGone(page: import('@playwright/test').Page, name: string) {
    await expect(async () => {
      const values = await page
        .getByRole('textbox')
        .evaluateAll((els: HTMLInputElement[]) => els.map((el) => el.value));
      expect(values).not.toContain(name);
    }).toPass({ timeout: 5_000 });
  }

  test('should display default categories on first visit', async ({ page }) => {
    await navigateToCategories(page);

    await expectCategoryExists(page, 'Entertainment');
    await expectCategoryExists(page, 'Productivity');
    await expectCategoryExists(page, 'Other');
  });

  test('should add a new category', async ({ page }) => {
    await navigateToCategories(page);

    await page.getByRole('button', { name: /add category/i }).click();
    await page.waitForResponse(
      (r) => r.url().includes('/categories') && r.request().method() === 'POST',
    );

    await expectCategoryExists(page, 'New Category');

    const newInput = await getCategoryInput(page, 'New Category');
    await newInput.fill('My Custom Category');
    await newInput.blur();

    await page.waitForResponse(
      (r) => r.url().includes('/categories/') && r.request().method() === 'PATCH',
    );

    await expectCategoryExists(page, 'My Custom Category');
  });

  test('should rename a category', async ({ page }) => {
    await navigateToCategories(page);

    const input = await getCategoryInput(page, 'Entertainment');
    await input.fill('Movies & TV');
    await input.blur();

    await page.waitForResponse(
      (r) => r.url().includes('/categories/') && r.request().method() === 'PATCH',
    );
    await expectCategoryExists(page, 'Movies & TV');

    // Rename back to avoid affecting other tests
    const renamed = await getCategoryInput(page, 'Movies & TV');
    await renamed.fill('Entertainment');
    await renamed.blur();
    await page.waitForResponse(
      (r) => r.url().includes('/categories/') && r.request().method() === 'PATCH',
    );
  });

  test('should delete a category', async ({ page }) => {
    await navigateToCategories(page);

    // Add a temporary category to delete
    await page.getByRole('button', { name: /add category/i }).click();
    await page.waitForResponse(
      (r) => r.url().includes('/categories') && r.request().method() === 'POST',
    );

    await expectCategoryExists(page, 'New Category');
    const newInput = await getCategoryInput(page, 'New Category');
    await newInput.fill('To Be Deleted');
    await newInput.blur();

    await page.waitForResponse(
      (r) => r.url().includes('/categories/') && r.request().method() === 'PATCH',
    );
    await expectCategoryExists(page, 'To Be Deleted');

    // Hover over the row to reveal the delete button (direct parent of the input)
    const row = (await getCategoryInput(page, 'To Be Deleted')).locator('..');
    await row.hover();
    await row.getByRole('button').click();

    await page.waitForResponse(
      (r) => r.url().includes('/categories/') && r.request().method() === 'DELETE',
    );
    await expectCategoryGone(page, 'To Be Deleted');
  });

  test('should reset categories to defaults', async ({ page }) => {
    await navigateToCategories(page);

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /reset to defaults/i }).click();

    await page.waitForResponse(
      (r) => r.url().includes('/categories/reset') && r.request().method() === 'POST',
    );

    await expectCategoryExists(page, 'Entertainment');
    await expectCategoryExists(page, 'Productivity');
    await expectCategoryExists(page, 'Other');
  });

  test('should show categories in subscription modal dropdown', async ({ page }) => {
    await navigateToCategories(page);

    await page.goto('/subscriptions');
    await expect(page.getByRole('heading', { name: 'Subscriptions', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Add Subscription' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('combobox', { name: /category/i }).click();

    await expect(page.getByRole('option', { name: /entertainment/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /productivity/i })).toBeVisible();
  });
});
