import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsAllController, PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [DashboardModule, NotificationsModule],
  controllers: [PaymentsAllController, PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
