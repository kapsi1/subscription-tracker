import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendAlert(email: string, subscriptionName: string, daysBefore: number, amount: number, currency: string) {
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #4A90E2; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">Subscription Alert</h2>
        <p>Hello,</p>
        <p>This is a friendly reminder regarding your <strong>${subscriptionName}</strong> subscription.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Amount:</strong> <span style="font-size: 1.2em; color: #e74c3c;">${amount} ${currency}</span></p>
          <p style="margin: 5px 0;"><strong>Renewing In:</strong> ${daysBefore} day(s)</p>
        </div>
        <p>If you wish to manage or cancel this subscription, please log in to your dashboard.</p>
        <p style="margin-top: 30px; font-size: 0.9em; color: #777;">Thank you,<br>Subscription Tracker Team</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM', '"Subscription Tracker" <alerts@subscription-tracker.local>'),
        to: email,
        subject: `Upcoming Subscription Renewal: ${subscriptionName}`,
        html: htmlTemplate,
      });
      this.logger.log(`[SMTP] Successfully sent warning email to ${email} for ${subscriptionName}`);
    } catch (error: any) {
      this.logger.error(`[SMTP] Failed to send email to ${email} for ${subscriptionName}: ${error.message}`);
      // Throw the error so it bubbles up to BullMQ to utilize the configured retry mechanisms
      throw error;
    }
  }
}
