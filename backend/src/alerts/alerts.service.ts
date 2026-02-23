import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { AlertType } from '@prisma/client';

interface AlertJobData {
  alertId: string;
  subscriptionId: string;
  type: AlertType;
  daysBefore: number;
  userEmail: string;
  subscriptionName: string;
  amount: number;
  currency: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

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
    this.logger.log({
      msg: 'Alert scheduler started',
      event: 'alert_scheduler_start',
    });

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

    this.logger.log({
      msg: `Found ${alerts.length} enabled alerts to evaluate`,
      event: 'alert_scheduler_query',
      alertCount: alerts.length,
    });

    let enqueued = 0;
    let skipped = 0;

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
            webhookUrl: alert.webhookUrl,
            webhookSecret: alert.webhookSecret,
          } as AlertJobData,
          {
            jobId, // Idempotency protection natively handled by BullMQ
            removeOnComplete: true,
            removeOnFail: false,
          }
        );

        this.logger.log({
          msg: `Alert job enqueued`,
          event: 'alert_job_enqueued',
          jobId,
          alertId: alert.id,
          alertType: alert.type,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          daysBefore: alert.daysBefore,
          nextBillingDate: sub.nextBillingDate.toISOString(),
        });

        enqueued++;
      } else {
        skipped++;
      }
    }

    this.logger.log({
      msg: `Alert scheduler completed`,
      event: 'alert_scheduler_complete',
      totalAlerts: alerts.length,
      enqueued,
      skipped,
    });
  }
}
