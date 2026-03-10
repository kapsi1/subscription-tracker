import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email/email.service';
import { WebhookService } from './webhook/webhook.service';
import { WebPushService } from './webpush/webpush.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, WebhookService, WebPushService],
  exports: [EmailService, WebhookService, WebPushService],
})
export class NotificationsModule {}
