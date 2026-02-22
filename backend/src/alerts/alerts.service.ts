import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('alertQueue') private readonly alertQueue: Queue,
  ) {}

  // Run every hour
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.debug('Running scheduled check for upcoming subscriptions.');
    const now = new Date();
    
    // We check all active subscriptions with enabled alerts
    const alerts = await this.prisma.alert.findMany({
      where: {
        isEnabled: true,
        subscription: {
          isActive: true
        }
      },
      include: {
        subscription: {
          include: {
            user: true
          }
        }
      }
    });

    for (const alert of alerts) {
      const sub = alert.subscription;
      
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + alert.daysBefore);
      
      // If the subscription is expected to renew on or before the threshold computed today.
      // E.g., next billing date is within `daysBefore` days.
      if (sub.nextBillingDate <= thresholdDate && sub.nextBillingDate >= now) {
        
        // Use an idempotency key consisting of the SubID, the AlertID, and the exact nextBillingDate
        // so we don't spam the user 24 times a day since this runs hourly.
        const jobId = `alert:${alert.id}:sub:${sub.id}:${sub.nextBillingDate.getTime()}`;

        await this.alertQueue.add(
          'processAlert',
          {
            alertId: alert.id,
            subscriptionId: sub.id,
            type: alert.type,
            daysBefore: alert.daysBefore,
            userEmail: sub.user.email,
            subscriptionName: sub.name,
            amount: Number(sub.amount),
            currency: sub.currency,
          },
          {
            jobId, // Idempotency protection natively handled by BullMQ
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
        this.logger.debug(`Enqueued alert job ${jobId} for subscription ${sub.name}`);
      }
    }
  }
}
