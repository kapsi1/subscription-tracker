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
    const serverPort = 9999;
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

    server.listen(serverPort);
    const webhookUrl = `http://localhost:${serverPort}/webhook`;
    const webhookSecret = 'test-secret-123';

    try {
      // 3. Navigate to Settings
      await page.goto('/settings');
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

      // 4. Enable Webhook
      const webhookCard = page.locator('div:has-text("Webhook Integration")').last();
      await webhookCard.getByRole('switch').click();
      
      // 5. Fill details
      await webhookCard.getByLabel(/URL/i).fill(webhookUrl);
      await webhookCard.getByLabel(/Secret/i).fill(webhookSecret);
      
      // 6. Save
      await page.getByRole('button', { name: /Save Settings/i }).click();
      await expect(page.getByText('Settings saved successfully')).toBeVisible();

      // 7. Send Test Webhook
      await webhookCard.getByRole('button', { name: /Send Test Webhook/i }).click();

      // 8. Verify Success Toast
      await expect(page.getByText('Test webhook sent successfully.')).toBeVisible();

      // 9. Verify Webhook Receipt
      // Wait for it (the backend call should be quick as we are on localhost)
      let attempts = 0;
      while (!receivedPayload && attempts < 10) {
        await new Promise(r => setTimeout(r, 200));
        attempts++;
      }

      expect(receivedPayload).toBeTruthy();
      expect(receivedPayload.subscriptionName).toBe('Test Subscription');
      expect(receivedPayload.amount).toBe(19.99);
      expect(receivedPayload.currency).toBe('USD');
      expect(receivedPayload.timestamp).toBeTruthy();

      // 10. Verify Signature
      expect(receivedHeaders['x-webhook-signature']).toBeTruthy();
    } finally {
      server.close();
    }
  });
});
