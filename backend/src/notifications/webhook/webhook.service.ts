import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
    currency: string,
  ) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      throw new BadRequestException('Invalid webhook URL');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new BadRequestException('Invalid webhook protocol');
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const isPrivateIP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/.test(hostname);
    
    if (process.env.NODE_ENV === 'production' && (isLocalhost || isPrivateIP)) {
      this.logger.warn(`[WEBHOOK] Blocked attempt to call internal URL: ${url}`);
      throw new BadRequestException('Webhook URL points to an internal network');
    }

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
      this.logger.log(
        `[WEBHOOK] Successfully sent request to ${url} for ${subscriptionName}`,
      );
    } catch (error: any) {
      this.logger.error(
        `[WEBHOOK] Failed to send request to ${url}: ${error.message}`,
      );
      throw error;
    }
  }
}
