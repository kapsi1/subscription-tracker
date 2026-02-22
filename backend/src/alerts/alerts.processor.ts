import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../notifications/email/email.service';
import { WebhookService } from '../notifications/webhook/webhook.service';
import { AlertType } from '@prisma/client';

@Processor('alertQueue')
export class AlertsProcessor extends WorkerHost {
  private readonly logger = new Logger(AlertsProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly webhookService: WebhookService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing alert job: ${job.id}`);
    
    const { 
      type, 
      userEmail, 
      subscriptionName, 
      daysBefore, 
      amount, 
      currency 
    } = job.data;

    try {
      if (type === AlertType.email) {
        await this.emailService.sendAlert(userEmail, subscriptionName, daysBefore, amount, currency);
      } else if (type === AlertType.webhook) {
        await this.webhookService.sendAlert(subscriptionName, daysBefore, amount, currency);
      }
    } catch (error: any) {
      this.logger.error(`Failed to process alert job ${job.id}`, error.stack);
      throw error; // Let BullMQ catch it and respect the retry backoff configurations
    }
    
    return { success: true };
  }
}
