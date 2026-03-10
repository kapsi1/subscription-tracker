import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as webpush from 'web-push';

@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);

  constructor(private readonly configService: ConfigService) {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT', 'mailto:admin@localhost');

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } else {
      this.logger.warn('VAPID keys not configured. Web push notifications will fail.');
    }
  }

  async sendNotification(sub: webpush.PushSubscription, payload: unknown) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload), {
        TTL: 86400, // 24 hours
        urgency: 'high',
      });
      this.logger.log(`[WebPush] Successfully sent notification to endpoint: ${sub.endpoint}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[WebPush] Failed to send notification: ${message}`);
      throw error;
    }
  }
}
