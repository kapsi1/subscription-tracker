import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../notifications/email/email.service';
import { WebhookService } from '../notifications/webhook/webhook.service';
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

@Processor('alertQueue')
export class AlertsProcessor extends WorkerHost {
  private readonly logger = new Logger(AlertsProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<AlertJobData, unknown, string>): Promise<{ success: boolean }> {
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
      const encryptionSecret = this.configService.get<string>('WEBHOOK_SECRET_KEY') || 'default-webhook-encryption-key';
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
        await this.emailService.sendAlert(userEmail, subscriptionName, daysBefore, amount, currency);
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
          currency
        );
        this.logger.log({
          msg: 'Webhook alert sent successfully',
          event: 'alert_webhook_sent',
          jobId: job.id,
          alertId,
          subscriptionId,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
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
}
