import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = this.getNumberEnv('SMTP_PORT', 1025);
    const secure = this.getBooleanEnv('SMTP_SECURE', port === 465);
    const user = this.configService.get<string>('SMTP_USER')?.trim();
    const pass = this.configService.get<string>('SMTP_PASS');

    const transportOptions: SMTPTransport.Options = {
      host,
      port,
      secure,
    };

    if (user && pass) {
      transportOptions.auth = { user, pass };
    }

    this.transporter = nodemailer.createTransport(transportOptions);

    this.logger.log(
      `[SMTP] Transport configured (host=${host}, port=${port}, secure=${secure})`,
    );
  }

  private getNumberEnv(key: string, fallback: number): number {
    const raw = this.configService.get<string>(key);
    if (!raw) {
      return fallback;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private getBooleanEnv(key: string, fallback: boolean): boolean {
    const raw = this.configService.get<string>(key);
    if (!raw) {
      return fallback;
    }
    return raw.trim().toLowerCase() === 'true';
  }

  async sendAlert(
    email: string,
    subscriptionName: string,
    daysBefore: number,
    amount: number,
    currency: string,
    language: 'en' | 'pl' = 'en',
  ) {
    const isPolish = language === 'pl';
    const subject = isPolish
      ? `Nadchodzące odnowienie subskrypcji: ${subscriptionName}`
      : `Upcoming Subscription Renewal: ${subscriptionName}`;
    const htmlTemplate = isPolish
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #4A90E2; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">Alert subskrypcji</h2>
        <p>Cześć,</p>
        <p>To przyjazne przypomnienie o Twojej subskrypcji <strong>${subscriptionName}</strong>.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Kwota:</strong> <span style="font-size: 1.2em; color: #e74c3c;">${amount} ${currency}</span></p>
          <p style="margin: 5px 0;"><strong>Odnowienie za:</strong> ${daysBefore} dni</p>
        </div>
        <p>Jeśli chcesz zarządzać lub anulować tę subskrypcję, zaloguj się do panelu.</p>
        <p style="margin-top: 30px; font-size: 0.9em; color: #777;">Dziękujemy,<br>Zespół Subscription Tracker</p>
      </div>
    `
      : `
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
        from: this.configService.get<string>(
          'SMTP_FROM',
          '"Subscription Tracker" <alerts@subscription-tracker.local>',
        ),
        to: email,
        subject,
        html: htmlTemplate,
      });
      this.logger.log(
        `[SMTP] Successfully sent warning email to ${email} for ${subscriptionName}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[SMTP] Failed to send email to ${email} for ${subscriptionName}: ${message}`,
      );
      // Throw the error so it bubbles up to BullMQ to utilize the configured retry mechanisms
      throw error;
    }
  }

  async sendBudgetAlert(
    email: string,
    amount: number,
    budget: number,
    currency: string,
  ) {
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #e74c3c; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">Budget Limit Exceeded</h2>
        <p>Hello,</p>
        <p>This is an automated alert to inform you that your total monthly subscription cost has exceeded your configured budget.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Current Monthly Cost:</strong> <span style="font-size: 1.2em; color: #e74c3c;">${amount.toFixed(2)} ${currency}</span></p>
          <p style="margin: 5px 0;"><strong>Your Budget:</strong> ${budget.toFixed(2)} ${currency}</p>
        </div>
        <p>Log in to your dashboard to review and manage your active subscriptions.</p>
        <p style="margin-top: 30px; font-size: 0.9em; color: #777;">Thank you,<br>Subscription Tracker Team</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'SMTP_FROM',
          '"Subscription Tracker" <alerts@subscription-tracker.local>',
        ),
        to: email,
        subject: `Budget Alert: Monthly Limit Exceeded`,
        html: htmlTemplate,
      });
      this.logger.log(
        `[SMTP] Successfully sent budget alert email to ${email}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[SMTP] Failed to send budget alert email to ${email}: ${message}`,
      );
      throw error;
    }
  }
}
