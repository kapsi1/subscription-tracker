import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

interface AccentPalette {
  primary: string;
  accent: string;
  background: string;
  border: string;
}

const DEFAULT_PALETTE: AccentPalette = {
  primary: '#4F46E5',
  accent: '#e0e7ff',
  background: '#F8FAFC',
  border: '#e2e8f0',
};

const ACCENT_PALETTES: Record<string, AccentPalette> = {
  Indigo: { primary: '#4F46E5', accent: '#e0e7ff', background: '#F5F7FF', border: '#d8dcfe' },
  Crimson: { primary: '#BE123C', accent: '#ffe4e6', background: '#FFF1F2', border: '#fecdd3' },
  Rose: { primary: '#DB2777', accent: '#fce7f3', background: '#FFF0F6', border: '#fbcfe8' },
  Lavender: { primary: '#7C3AED', accent: '#f3e8ff', background: '#F9F5FF', border: '#e9d5ff' },
  Cobalt: { primary: '#1D4ED8', accent: '#dbeafe', background: '#F0F7FF', border: '#bfdbfe' },
  Navy: { primary: '#1E3A8A', accent: '#eff6ff', background: '#F0F4FF', border: '#dbeafe' },
  Mint: { primary: '#059669', accent: '#ecfdf5', background: '#F0FDF9', border: '#a7f3d0' },
  Forest: { primary: '#15803D', accent: '#dcfce7', background: '#F0FDF4', border: '#bbf7d0' },
  Sage: { primary: '#4D7C0F', accent: '#f7fee7', background: '#FAFEF0', border: '#d9f99d' },
  Amber: { primary: '#D97706', accent: '#fef3c7', background: '#FFFBEB', border: '#fde68a' },
  Gold: { primary: '#B45309', accent: '#fef3c7', background: '#FFFCEB', border: '#fde68a' },
  Terracotta: { primary: '#9A3412', accent: '#ffedd5', background: '#FFF5F0', border: '#fed7aa' },
  Coffee: { primary: '#78350F', accent: '#fef3c7', background: '#FFF9F0', border: '#fde68a' },
  Sand: { primary: '#A16207', accent: '#fefce8', background: '#FFFBF0', border: '#fef08a' },
  Slate: { primary: '#475569', accent: '#f1f5f9', background: '#F8FAFC', border: '#cbd5e1' },
  Charcoal: { primary: '#334155', accent: '#f8fafc', background: '#F1F5F9', border: '#cbd5e1' },
};

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

  private getPalette(accentColor?: string): AccentPalette {
    if (!accentColor) {
      return DEFAULT_PALETTE;
    }
    return ACCENT_PALETTES[accentColor] ?? DEFAULT_PALETTE;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatRecipientName(email: string): string {
    const localPart = email.split('@')[0] ?? '';
    const normalized = localPart.replace(/[._-]+/g, ' ').trim();
    if (!normalized) {
      return 'there';
    }
    return normalized
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  async sendAlert(
    email: string,
    subscriptionName: string,
    daysBefore: number,
    amount: number,
    currency: string,
    language: 'en' | 'pl' = 'en',
    accentColor?: string,
  ) {
    const isPolish = language === 'pl';
    const palette = this.getPalette(accentColor);
    const recipientName = this.escapeHtml(this.formatRecipientName(email));
    const safeSubscriptionName = this.escapeHtml(subscriptionName);
    const subject = isPolish
      ? `Nadchodzące odnowienie subskrypcji: ${subscriptionName}`
      : `Upcoming Subscription Renewal: ${subscriptionName}`;

    const htmlTemplate = isPolish
      ? `
      <html style="background:${palette.background};">
        <div style="margin:0; padding:24px; background:${palette.background}; font-family: Inter,Segoe UI,Arial,sans-serif; color:#0f172a;">
          <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid ${palette.border}; border-radius:12px; overflow:hidden;">
            <div style="height:6px; background:${palette.primary};"></div>
            <div style="padding:24px;">
              <h2 style="margin:0 0 16px; font-size:32px; line-height:1.2; font-weight:600; color:${palette.primary};">Alert subskrypcji</h2>
              <p style="margin:0 0 18px; font-size:20px; line-height:1.4;">Cześć, ${recipientName},</p>
              <p style="margin:0 0 18px; font-size:18px; line-height:1.5;">To przypomnienie o Twojej subskrypcji <strong>${safeSubscriptionName}</strong>.</p>
              <div style="background:${palette.accent}; border:1px solid ${palette.border}; border-radius:10px; padding:16px; margin:20px 0;">
                <p style="margin:0 0 8px; font-size:18px; line-height:1.4;"><strong>Kwota:</strong> <span style="font-size:30px; line-height:1.1; font-weight:700; color:${palette.primary};">${amount} ${currency}</span></p>
                <p style="margin:0; font-size:18px; line-height:1.4;"><strong>Odnowienie za:</strong> ${daysBefore} dni</p>
              </div>
              <p style="margin:0 0 20px; font-size:18px; line-height:1.5;">Jeśli chcesz zarządzać lub anulować tę subskrypcję, zaloguj się do panelu.</p>
              <p style="margin:24px 0 0; color:#64748b; font-size:16px; line-height:1.5;">Dziękujemy,<br>Zespół Subscription Tracker</p>
            </div>
          </div>
        </div>
      </html>
    `
      : `
      <html style="background:${palette.background};">
        <div style="margin:0; padding:24px; background:${palette.background}; font-family: Inter,Segoe UI,Arial,sans-serif; color:#0f172a;">
          <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid ${palette.border}; border-radius:12px; overflow:hidden;">
            <div style="height:6px; background:${palette.primary};"></div>
            <div style="padding:24px;">
              <h2 style="margin:0 0 16px; font-size:32px; line-height:1.2; font-weight:600; color:${palette.primary};">Subscription Alert</h2>
              <p style="margin:0 0 18px; font-size:20px; line-height:1.4;">Hello, ${recipientName},</p>
              <p style="margin:0 0 18px; font-size:18px; line-height:1.5;">This is a friendly reminder regarding your <strong>${safeSubscriptionName}</strong> subscription.</p>
              <div style="background:${palette.accent}; border:1px solid ${palette.border}; border-radius:10px; padding:16px; margin:20px 0;">
                <p style="margin:0 0 8px; font-size:18px; line-height:1.4;"><strong>Amount:</strong> <span style="font-size:30px; line-height:1.1; font-weight:700; color:${palette.primary};">${amount} ${currency}</span></p>
                <p style="margin:0; font-size:18px; line-height:1.4;"><strong>Renewing In:</strong> ${daysBefore} day(s)</p>
              </div>
              <p style="margin:0 0 20px; font-size:18px; line-height:1.5;">If you wish to manage or cancel this subscription, please log in to your dashboard.</p>
              <p style="margin:24px 0 0; color:#64748b; font-size:16px; line-height:1.5;">Thank you,<br>Subscription Tracker Team</p>
            </div>
          </div>
        </div>
      </html>
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
      throw error;
    }
  }

  async sendBudgetAlert(
    email: string,
    amount: number,
    budget: number,
    currency: string,
    accentColor?: string,
  ) {
    const palette = this.getPalette(accentColor);
    const recipientName = this.escapeHtml(this.formatRecipientName(email));
    const htmlTemplate = `
      <div style="margin:0; padding:24px; background:${palette.background}; font-family: Inter,Segoe UI,Arial,sans-serif; color:#0f172a;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid ${palette.border}; border-radius:12px; overflow:hidden;">
          <div style="height:6px; background:#ef4444;"></div>
          <div style="padding:24px;">
            <h2 style="margin:0 0 16px; font-size:32px; line-height:1.2; font-weight:600; color:#dc2626;">Budget Limit Exceeded</h2>
            <p style="margin:0 0 18px; font-size:20px; line-height:1.4;">Hello, ${recipientName},</p>
            <p style="margin:0 0 18px; font-size:18px; line-height:1.5;">This is an automated alert to inform you that your total monthly subscription cost has exceeded your configured budget.</p>
            <div style="background:${palette.accent}; border:1px solid ${palette.border}; border-radius:10px; padding:16px; margin:20px 0;">
              <p style="margin:0 0 8px; font-size:18px; line-height:1.4;"><strong>Current Monthly Cost:</strong> <span style="font-size:30px; line-height:1.1; font-weight:700; color:#dc2626;">${amount.toFixed(2)} ${currency}</span></p>
              <p style="margin:0; font-size:18px; line-height:1.4;"><strong>Your Budget:</strong> ${budget.toFixed(2)} ${currency}</p>
            </div>
            <p style="margin:0 0 20px; font-size:18px; line-height:1.5;">Log in to your dashboard to review and manage your active subscriptions.</p>
            <p style="margin:24px 0 0; color:#64748b; font-size:16px; line-height:1.5;">Thank you,<br>Subscription Tracker Team</p>
          </div>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'SMTP_FROM',
          '"Subscription Tracker" <alerts@subscription-tracker.local>',
        ),
        to: email,
        subject: 'Budget Alert: Monthly Limit Exceeded',
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
