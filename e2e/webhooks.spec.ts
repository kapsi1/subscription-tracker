import { test, expect } from '@playwright/test';
import { createServer } from 'http';
import { cleanupUser, closePool } from './test-utils';

test.describe('Webhooks', () => {
  const testEmail = `testuser-webhook-${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';

  test.afterAll(async () => {
    await cleanupUser(testEmail);
    await closePool();
  });

  test('should configure and test webhooks', async ({ page }) => {
    console.log('1. Navigating to login');
    // 1. Setup: Register and Login
    await page.goto('/login');
    console.log('2. Registering');
    await page.getByRole('button', { name: "Switch to Register" }).click();
    await page.getByLabel('Full Name').fill('Webhook Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();
    console.log('3. Waiting for dashboard');
    await page.waitForURL('**/dashboard');
    console.log('4. Starting mock server');

    // 2. Setup mock server to receive webhook
    let receivedPayload: any = null;
    let receivedHeaders: any = null;
    const server = createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        receivedPayload = JSON.parse(body);
        receivedHeaders = req.headers;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      });
    });

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.off('error', reject);
        resolve();
      });
    });
    const serverAddress = server.address();
    if (!serverAddress || typeof serverAddress === 'string') {
      throw new Error('Could not determine mock webhook server port');
    }
    const webhookUrl = `http://127.0.0.1:${serverAddress.port}/webhook`;
    const webhookSecret = 'test-secret-123';

    try {
      // 3. Navigate to Settings
      await page.goto('/settings');
      await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Preferences' }).click();

      // 4. Enable Webhook
      const webhookCard = page.locator('div.shadow-sm', { hasText: 'Webhook Integration' }).last();
      const patchPromise = page.waitForResponse(
        resp => resp.url().includes('/users/settings') && resp.request().method() === 'PATCH',
      );
      await webhookCard.getByRole('switch').click();
      await page.waitForTimeout(500);
      // 5. Fill details
      await webhookCard.getByLabel(/URL/i).fill(webhookUrl);
      await webhookCard.getByLabel(/Secret/i).fill(webhookSecret);
      
      // 6. Autosave
      await patchPromise;

      // 7. Send Test Webhook
      const testWebhookResponsePromise = page.waitForResponse(
        resp => resp.url().includes('/users/test-webhook') && resp.request().method() === 'POST',
      );
      await webhookCard.getByRole('button', { name: /Send Test Webhook/i }).click();
      const testWebhookResponse = await testWebhookResponsePromise;
      expect(testWebhookResponse.ok()).toBeTruthy();

      // 8. Verify Webhook Receipt
      await expect.poll(() => receivedPayload, { timeout: 5000 }).toBeTruthy();

      expect(receivedPayload).toBeTruthy();
      expect(receivedPayload.subscriptionName).toBe('Test Subscription');
      expect(receivedPayload.amount).toBe(19.99);
      expect(receivedPayload.currency).toBe('USD');
      expect(receivedPayload.timestamp).toBeTruthy();

      // 9. Verify Signature
      expect(receivedHeaders['x-webhook-signature']).toBeTruthy();
    } finally {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });
});
