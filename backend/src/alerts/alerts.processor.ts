import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../notifications/email/email.service';
import { WebhookService } from '../notifications/webhook/webhook.service';
import { WebPushService } from '../notifications/webpush/webpush.service';
import { PrismaService } from '../prisma/prisma.service';
import { AlertType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { EncryptionUtil } from '../common/utils/encryption.util';

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

interface BudgetAlertJobData {
  userEmail: string;
  amount: number;
  budget: number;
  currency: string;
}

@Processor('alertQueue')
export class AlertsProcessor extends WorkerHost {
  private readonly logger = new Logger(AlertsProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly webhookService: WebhookService,
    private readonly webPushService: WebPushService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(
    job: Job<any, unknown, string>,
  ): Promise<{ success: boolean }> {
    if (job.name === 'processBudgetAlert') {
      return this.processBudgetAlert(job as Job<BudgetAlertJobData, unknown, string>);
    }
    const {
      type,
      alertId,
      subscriptionId,
      userEmail,
      subscriptionName,
      daysBefore,
      amount,
      currency,
      webhookUrl,
      webhookSecret: encryptedSecret,
    } = job.data;

    let webhookSecret: string | undefined;
    if (encryptedSecret) {
      const encryptionSecret = this.configService.get<string>('WEBHOOK_SECRET_KEY');
      if (!encryptionSecret) {
        throw new Error('WEBHOOK_SECRET_KEY must be set in the environment to process webhooks with secrets');
      }
      webhookSecret = EncryptionUtil.decrypt(encryptedSecret, encryptionSecret);
    }

    this.logger.log({
      msg: 'Processing alert job',
      event: 'alert_job_processing',
      jobId: job.id,
      alertId,
      alertType: type,
      subscriptionId,
      subscriptionName,
      attempt: job.attemptsMade + 1,
    });

    try {
      if (type === AlertType.email) {
        await this.emailService.sendAlert(
          userEmail,
          subscriptionName,
          daysBefore,
          amount,
          currency,
        );
        this.logger.log({
          msg: 'Email alert sent successfully',
          event: 'alert_email_sent',
          jobId: job.id,
          alertId,
          subscriptionId,
          recipient: userEmail,
        });
      } else if (type === AlertType.webhook && webhookUrl) {
        await this.webhookService.sendAlert(
          webhookUrl,
          webhookSecret,
          subscriptionName,
          daysBefore,
          amount,
          currency,
        );
        this.logger.log({
          msg: 'Webhook alert sent successfully',
          event: 'alert_webhook_sent',
          jobId: job.id,
          alertId,
          subscriptionId,
        });
      } else if (type === AlertType.webpush) {
        // Fetch push subscriptions for the user
        const user = await this.prisma.user.findUnique({
          where: { email: userEmail },
          include: { pushSubscriptions: true },
        });

        if (user && user.pushSubscriptions.length > 0) {
          const payload = {
            title: `Subscription Alert: ${subscriptionName}`,
            body: `Amount: ${amount} ${currency}\nRenewing in: ${daysBefore} days`,
            data: { subscriptionId },
          };

          const pushPromises = user.pushSubscriptions.map(sub =>
            this.webPushService.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payload
            ).catch(err => {
              // If subscription is invalid (e.g. 410 Gone), remove it
              if (err.statusCode === 410 || err.statusCode === 404) {
                this.logger.warn(`Push subscription expired. Removing ${sub.endpoint}`);
                return this.prisma.pushSubscription.delete({ where: { id: sub.id } });
              }
              throw err;
            })
          );

          await Promise.allSettled(pushPromises);
          
          this.logger.log({
            msg: 'Web Push alerts sent successfully',
            event: 'alert_webpush_sent',
            jobId: job.id,
            alertId,
            subscriptionId,
          });
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error({
        msg: 'Failed to process alert job',
        event: 'alert_job_failed',
        jobId: job.id,
        alertId,
        alertType: type,
        subscriptionId,
        subscriptionName,
        attempt: job.attemptsMade + 1,
        error: errorMessage,
        stack: errorStack,
      });

      throw error; // Let BullMQ catch it and respect the retry backoff configurations
    }

    this.logger.log({
      msg: 'Alert job completed',
      event: 'alert_job_completed',
      jobId: job.id,
      alertId,
      subscriptionId,
    });

    return { success: true };
  }

  private async processBudgetAlert(job: Job<BudgetAlertJobData, unknown, string>) {
    const { userEmail, amount, budget, currency } = job.data;
    try {
      await this.emailService.sendBudgetAlert(userEmail, amount, budget, currency);
      return { success: true };
    } catch (error: any) {
      this.logger.error({
        msg: 'Failed to process budget alert',
        jobId: job.id,
        userEmail,
        error: error.message,
      });
      throw error;
    }
  }
}
