import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import {
  buildAlertEmailHtml,
  buildBudgetAlertEmailHtml,
  buildDailyDigestEmailHtml,
  buildPasswordResetEmailHtml,
  buildVerificationEmailHtml,
  buildWeeklyReportEmailHtml,
} from './email-templates';

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

    const transportOptions: SMTPTransport.Options = { host, port, secure };

    if (user && pass) {
      transportOptions.auth = { user, pass };
    }

    this.transporter = nodemailer.createTransport(transportOptions);

    this.logger.log(`[SMTP] Transport configured (host=${host}, port=${port}, secure=${secure})`);
  }

  private getNumberEnv(key: string, fallback: number): number {
    const raw = this.configService.get<string>(key);
    if (!raw) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private getBooleanEnv(key: string, fallback: boolean): boolean {
    const raw = this.configService.get<string>(key);
    if (!raw) return fallback;
    return raw.trim().toLowerCase() === 'true';
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    fromKey?: 'SMTP_FROM_ALERTS' | 'SMTP_FROM_AUTH';
    fallbackFrom: string;
  }) {
    const possiblePaths = [
      path.join(process.cwd(), 'assets', 'logo-email.png'),
      path.join(process.cwd(), 'backend', 'assets', 'logo-email.png'),
    ];

    let logoPath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        logoPath = p;
        break;
      }
    }

    const attachments = [];
    if (logoPath) {
      attachments.push({
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo',
      });
    }

    try {
      await this.transporter.sendMail({
        from:
          (options.fromKey ? this.configService.get<string>(options.fromKey) : undefined) ||
          this.configService.get<string>('SMTP_FROM', options.fallbackFrom),
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[SMTP] Failed to send email to ${options.to}: ${message}`);
      throw error;
    }
  }

  async sendAlert(
    email: string,
    subscriptionName: string,
    daysBefore: number,
    amount: number,
    currency: string,
    language: string = 'en',
    accentColor?: string,
    theme?: string,
    name?: string,
  ) {
    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const { subject, html } = buildAlertEmailHtml({
      email,
      subscriptionName,
      daysBefore,
      amount,
      currency,
      language,
      accentColor,
      theme,
      name,
      appUrl,
    });

    await this.sendEmail({
      to: email,
      subject,
      html,
      fromKey: 'SMTP_FROM_ALERTS',
      fallbackFrom: '"SubTracker" <alerts@subtracker.local>',
    });
    this.logger.log(`[SMTP] Successfully sent warning email to ${email} for ${subscriptionName}`);
  }

  async sendBudgetAlert(
    email: string,
    amount: number,
    budget: number,
    currency: string,
    accentColor?: string,
    theme?: string,
    language: string = 'en',
    name?: string,
  ) {
    const appUrl =
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    const { subject, html } = buildBudgetAlertEmailHtml({
      email,
      amount,
      budget,
      currency,
      accentColor,
      theme,
      language,
      name,
      appUrl,
    });

    await this.sendEmail({
      to: email,
      subject,
      html,
      fromKey: 'SMTP_FROM_ALERTS',
      fallbackFrom: '"SubTracker" <alerts@subtracker.local>',
    });
    this.logger.log(`[SMTP] Successfully sent budget alert email to ${email}`);
  }

  async sendDailyDigest(
    email: string,
    stats: { totalActive: number; totalMonthly: number; upcomingThisWeek: number },
    paidYesterday: { name: string; amount: number; currency: string }[],
    currency: string,
    language: string = 'en',
    accentColor?: string,
    theme?: string,
    name?: string,
  ) {
    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    const { subject, html } = buildDailyDigestEmailHtml({
      email,
      stats,
      paidYesterday,
      currency,
      language,
      accentColor,
      theme,
      name,
      appUrl,
    });

    await this.sendEmail({
      to: email,
      subject,
      html,
      fromKey: 'SMTP_FROM_ALERTS',
      fallbackFrom: '"SubTracker" <alerts@subtracker.local>',
    });
    this.logger.log(`[SMTP] Successfully sent daily digest email to ${email}`);
  }

  async sendWeeklyReport(
    email: string,
    stats: { totalActive: number; totalMonthly: number; upcomingThisWeek: number },
    currency: string,
    language: string = 'en',
    accentColor?: string,
    theme?: string,
    name?: string,
    reportType: 'previous' | 'next' = 'next',
  ) {
    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    const { subject, html } = buildWeeklyReportEmailHtml({
      email,
      stats,
      currency,
      language,
      accentColor,
      theme,
      name,
      appUrl,
      reportType,
    });

    await this.sendEmail({
      to: email,
      subject,
      html,
      fromKey: 'SMTP_FROM_ALERTS',
      fallbackFrom: '"SubTracker" <alerts@subtracker.local>',
    });
    this.logger.log(`[SMTP] Successfully sent weekly report email to ${email}`);
  }

  async sendVerificationEmail(email: string, name: string, token: string, language: string = 'en') {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const { subject, html } = buildVerificationEmailHtml({
      email,
      name,
      token,
      language,
      frontendUrl,
    });

    await this.sendEmail({
      to: email,
      subject,
      html,
      fromKey: 'SMTP_FROM_AUTH',
      fallbackFrom: '"SubTracker" <auth@subtracker.local>',
    });
    this.logger.log(`[SMTP] Successfully sent verification email to ${email}`);
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
    language: string = 'en',
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const { subject, html } = buildPasswordResetEmailHtml({
      email,
      name,
      token,
      language,
      frontendUrl,
    });

    await this.sendEmail({
      to: email,
      subject,
      html,
      fromKey: 'SMTP_FROM_AUTH',
      fallbackFrom: '"SubTracker" <auth@subtracker.local>',
    });
    this.logger.log(`[SMTP] Successfully sent password reset email to ${email}`);
  }
}
