import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { createHmac } from 'node:crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  async sendAlert(
    url: string,
    secret: string | undefined,
    subscriptionName: string,
    daysBefore: number,
    amount: number,
    currency: string
  ) {
    const payload = {
      subscriptionName,
      daysBefore,
      amount,
      currency,
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (secret) {
      const signature = createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    try {
      await axios.post(url, payload, { headers });
      this.logger.log(`[WEBHOOK] Successfully sent request to ${url} for ${subscriptionName}`);
    } catch (error: any) {
      this.logger.error(`[WEBHOOK] Failed to send request to ${url}: ${error.message}`);
      throw error;
    }
  }
}
