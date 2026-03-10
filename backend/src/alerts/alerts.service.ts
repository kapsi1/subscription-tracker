import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertType, type Prisma, type Subscription } from '@prisma/client';
import type { Queue } from 'bullmq';
import { DashboardService } from '../dashboard/dashboard.service';

import { PaymentsService } from '../payments/payments.service';

import { PrismaService } from '../prisma/prisma.service';

import type { AlertJobData } from './alerts.types';

type AlertWithSub = Prisma.AlertGetPayload<{
  include: {
    subscription: {
      include: {
        user: true;
      };
    };
  };
}>;

type SubWithUser = Prisma.SubscriptionGetPayload<{
  include: {
    user: true;
  };
}>;

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardService: DashboardService,
    private readonly paymentsService: PaymentsService,
    @InjectQueue('alertQueue') private readonly alertQueue: Queue,
  ) {}

  // Run scheduler every hour
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log({
      msg: 'Alert scheduler started',
      event: 'alert_scheduler_start',
    });

    const _now = new Date();

    // We check all active subscriptions with enabled alerts OR subscription-level reminders
    const alerts = (await this.prisma.alert.findMany({
      where: {
        isEnabled: true,
        subscription: {
          isActive: true,
        },
      },
      include: {
        subscription: {
          include: {
            user: true,
          },
        },
      },
    })) as AlertWithSub[];

    const subsWithReminders = (await this.prisma.subscription.findMany({
      where: {
        isActive: true,
        reminderEnabled: true,
      },
      include: {
        user: true,
      },
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
        alert.webhookUrl ?? undefined,
        alert.webhookSecret ?? undefined,
      );
      if (success) enqueued++;
      else skipped++;
    }

    // Process subscription-level reminders
    for (const sub of subsWithReminders) {
      const success = await this.enqueueIfNecessary(
        `sub-reminder-${sub.id}`,
        sub,
        AlertType.email,
        sub.reminderDays,
      );
      if (success) enqueued++;
      else skipped++;
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
    sub: SubWithUser,
    type: AlertType,
    daysBefore: number,
    webhookUrl?: string,
    webhookSecret?: string,
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
        },
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

  // Run budget check daily at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleBudgetAlertsCron() {
    this.logger.log({
      msg: 'Budget alert scheduler started',
      event: 'budget_scheduler_start',
    });

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Find users with a monthly budget defined
    const usersWithBudget = await this.prisma.user.findMany({
      where: {
        monthlyBudget: { not: null },
      },
    });

    // Fetch all active subscriptions for these users in one query
    const userIdsWithBudget = usersWithBudget.map((u) => u.id);
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        userId: { in: userIdsWithBudget },
        isActive: true,
      },
    });

    const subsByUser = activeSubscriptions.reduce(
      (acc, sub) => {
        acc[sub.userId] = acc[sub.userId] || [];
        acc[sub.userId].push(sub);
        return acc;
      },
      {} as Record<string, Subscription[]>,
    );

    let countSent = 0;

    for (const user of usersWithBudget) {
      if (!user.monthlyBudget) continue; // safety check
      const monthlyBudget = Number(user.monthlyBudget);

      // Check if already sent an alert this month
      if (user.lastBudgetAlertSentAt && user.lastBudgetAlertSentAt >= currentMonthStart) {
        continue; // Alert already sent this month
      }

      // Calculate the user's total monthly cost locally instead of querying the DB again
      const userSubs = subsByUser[user.id] || [];
      const summary = this.dashboardService.calculateCosts(userSubs);

      if (summary.totalMonthlyCost > monthlyBudget) {
        await Promise.all([
          this.alertQueue.add(
            'processBudgetAlert',
            {
              userEmail: user.email,
              amount: summary.totalMonthlyCost,
              budget: monthlyBudget,
              currency: user.currency,
            },
            {
              jobId: `budget-alert:${user.id}:${currentMonthStart.getTime()}`,
              removeOnComplete: true,
            },
          ),
          this.prisma.user.update({
            where: { id: user.id },
            data: { lastBudgetAlertSentAt: now },
          }),
        ]);

        countSent++;
      }
    }

    this.logger.log({
      msg: 'Budget alert scheduler completed',
      event: 'budget_scheduler_complete',
      totalUsersChecked: usersWithBudget.length,
      alertsEnqueued: countSent,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyDigestCron() {
    this.logger.log({
      msg: 'Daily digest scheduler started',
      event: 'daily_digest_scheduler_start',
    });

    try {
      await this.paymentsService.processPaymentsAndSendDigests();
    } catch (error) {
      this.logger.error(`Daily digest scheduler failed: ${error.message}`);
    }

    this.logger.log({
      msg: 'Daily digest scheduler completed',
      event: 'daily_digest_scheduler_complete',
    });
  }
}
