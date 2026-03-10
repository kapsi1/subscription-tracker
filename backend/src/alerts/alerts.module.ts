import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { AlertsProcessor } from './alerts.processor';
import { AlertsService } from './alerts.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'alertQueue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
    NotificationsModule,
    DashboardModule,
    PaymentsModule,
  ],
  providers: [AlertsService, AlertsProcessor],
})
export class AlertsModule {}
