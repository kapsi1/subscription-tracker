import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { AlertType, Prisma } from '@prisma/client';

type AlertWithSub = Prisma.AlertGetPayload<{
  include: {
    subscription: {
      include: {
        user: true
      }
    }
  }
}>;

type SubWithUser = Prisma.SubscriptionGetPayload<{
  include: {
    user: true
  }
}>;

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

  // Run scheduler every hour
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log({
      msg: 'Alert scheduler started',
      event: 'alert_scheduler_start',
    });

    const now = new Date();
    
    // We check all active subscriptions with enabled alerts OR subscription-level reminders
    const alerts = (await this.prisma.alert.findMany({
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
    })) as AlertWithSub[];

    const subsWithReminders = (await this.prisma.subscription.findMany({
      where: {
        isActive: true,
        // @ts-ignore: Stale IDE error - field exists in generated Prisma client
        reminderEnabled: true,
      },
      include: {
        user: true
      }
    })) as SubWithUser[];

    this.logger.log({
      msg: `Found ${alerts.length} enabled alerts to evaluate`,
      event: 'alert_scheduler_query',
      alertCount: alerts.length,
    });

    let enqueued = 0;
    let skipped = 0;

    // Process legacy alerts
    for (const alert of alerts) {
      const sub = alert.subscription;
      const success = await this.enqueueIfNecessary(
        alert.id,
        sub,
        alert.type,
        alert.daysBefore,
        // @ts-ignore: Stale IDE error - field exists in generated Prisma client
        alert.webhookUrl ?? undefined,
        // @ts-ignore: Stale IDE error - field exists in generated Prisma client
        alert.webhookSecret ?? undefined
      );
      if (success) enqueued++; else skipped++;
    }

    // Process subscription-level reminders
    for (const sub of subsWithReminders) {
      const success = await this.enqueueIfNecessary(
        `sub-reminder-${sub.id}`,
        sub,
        AlertType.email,
        // @ts-ignore: Stale IDE error - field exists in generated Prisma client
        sub.reminderDays
      );
      if (success) enqueued++; else skipped++;
    }

    this.logger.log({
      msg: `Alert scheduler completed`,
      event: 'alert_scheduler_complete',
      totalAlerts: alerts.length,
      totalSubs: subsWithReminders.length,
      enqueued,
      skipped,
    });
  }

  private async enqueueIfNecessary(
    alertId: string,
    sub: any, // Subscription with user
    type: AlertType,
    daysBefore: number,
    webhookUrl?: string,
    webhookSecret?: string
  ): Promise<boolean> {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysBefore);

    if (sub.nextBillingDate <= thresholdDate && sub.nextBillingDate >= now) {
      const jobId = `alert:${alertId}:sub:${sub.id}:${sub.nextBillingDate.getTime()}`;

      await this.alertQueue.add(
        'processAlert',
        {
          alertId,
          subscriptionId: sub.id,
          type,
          daysBefore,
          userEmail: sub.user.email,
          subscriptionName: sub.name,
          amount: Number(sub.amount),
          currency: sub.currency,
          webhookUrl,
          webhookSecret,
        } as AlertJobData,
        {
          jobId,
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      this.logger.log({
        msg: `Alert job enqueued`,
        event: 'alert_job_enqueued',
        jobId,
        alertId,
        alertType: type,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        daysBefore,
        nextBillingDate: sub.nextBillingDate.toISOString(),
      });

      return true;
    }
    return false;
  }
}
