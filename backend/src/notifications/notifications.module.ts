import { Module } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { WebhookService } from './webhook/webhook.service';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, WebhookService],
  exports: [EmailService, WebhookService],
})
export class NotificationsModule {}
