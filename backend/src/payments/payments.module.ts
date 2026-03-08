import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { DashboardModule } from '../dashboard/dashboard.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DashboardModule, NotificationsModule],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
