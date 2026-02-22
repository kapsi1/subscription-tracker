import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  async sendAlert(subscriptionName: string, daysBefore: number, amount: number, currency: string) {
    // Basic mock of a webhook HTTP call
    this.logger.log(`[WEBHOOK] Sending POST request for ${subscriptionName} charging ${amount} ${currency} in ${daysBefore} days.`);
  }
}
