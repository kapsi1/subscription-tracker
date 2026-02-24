import { Module } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { WebhookService } from './webhook/webhook.service';
import { WebPushService } from './webpush/webpush.service';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, WebhookService, WebPushService],
  exports: [EmailService, WebhookService, WebPushService],
})
export class NotificationsModule {}
