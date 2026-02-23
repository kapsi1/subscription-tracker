import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page and show correct elements', async ({ page }) => {
    await page.goto('/login');
    
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Subscription Tracker/);

    // Verify form elements exist
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should toggle between sign in and sign up', async ({ page }) => {
    await page.goto('/login');
    
    // Check initial state is Sign In
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Click toggle
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();
    
    // Check state changed to Sign Up
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    
    // Click toggle back
    await page.getByRole('button', { name: "Already have an account? Sign in" }).click();
    
    // Check state changed back to Sign In
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });
});
