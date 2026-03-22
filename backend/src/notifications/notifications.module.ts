import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email/email.service';
import { WebPushService } from './webpush/webpush.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, WebPushService],
  exports: [EmailService, WebPushService],
})
export class NotificationsModule {}
