import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { COLORS, type ColorsConfig, getAccentColor, LOCALES } from '@subtracker/shared';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

type AppTheme = 'light' | 'dark' | 'system';

interface EmailColors {
  appBg: string;
  cardBg: string;
  border: string;
  primary: string;
  accentBg: string;
  text: string;
  muted: string;
  danger: string;
}

const DEFAULT_ACCENT_NAME = 'Indigo';
const ACCENT_DEFINITIONS: ColorsConfig = COLORS;

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

  private resolveTheme(theme?: string): AppTheme {
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      return theme;
    }
    return 'system';
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const sanitized = hex.replace('#', '').trim();
    const fullHex =
      sanitized.length === 3
        ? sanitized
            .split('')
            .map((c) => c + c)
            .join('')
        : sanitized;
    const r = Number.parseInt(fullHex.slice(0, 2), 16);
    const g = Number.parseInt(fullHex.slice(2, 4), 16);
    const b = Number.parseInt(fullHex.slice(4, 6), 16);
    return { r, g, b };
  }

  private mixHex(hexA: string, hexB: string, ratioB: number): string {
    const a = this.hexToRgb(hexA);
    const b = this.hexToRgb(hexB);
    const ratioA = 1 - ratioB;
    const mix = (x: number, y: number) => Math.round(x * ratioA + y * ratioB);
    const toHex = (v: number) => v.toString(16).padStart(2, '0');
    return `#${toHex(mix(a.r, b.r))}${toHex(mix(a.g, b.g))}${toHex(mix(a.b, b.b))}`;
  }

  private toRgba(hex: string, alpha: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private getEmailColors(accentColor: string | undefined, mode: 'light' | 'dark'): EmailColors {
    const accent = getAccentColor(accentColor || DEFAULT_ACCENT_NAME, ACCENT_DEFINITIONS);

    if (mode === 'dark') {
      return {
        appBg: accent.darkBg,
        cardBg: this.mixHex(accent.darkBg, '#ffffff', 0.04),
        border: this.toRgba(accent.darkPrimary, 0.3),
        primary: accent.darkPrimary,
        accentBg: accent.darkAccent,
        text: '#f8fafc',
        muted: '#94a3b8',
        danger: '#ef4444',
      };
    }

    return {
      appBg: accent.lightBg,
      cardBg: this.mixHex('#ffffff', accent.lightPrimary, 0.02),
      border: this.toRgba(accent.lightPrimary, 0.2),
      primary: accent.lightPrimary,
      accentBg: accent.lightAccent,
      text: '#0f172a',
      muted: '#64748b',
      danger: '#dc2626',
    };
  }

  private buildThemeCss(
    accentColor: string | undefined,
    theme: AppTheme,
  ): { css: string; colorScheme: string } {
    const light = this.getEmailColors(accentColor, 'light');
    const dark = this.getEmailColors(accentColor, 'dark');

    const lightCss = `
      html, .email-root { background: ${light.appBg}; color: ${light.text}; }
      .email-card { background: ${light.cardBg}; border-color: ${light.border}; }
      .email-topbar, .email-title, .email-amount { color: ${light.primary}; }
      .email-topbar-bg { background: ${light.primary}; }
      .email-highlight { background: ${light.accentBg}; border-color: ${light.border}; }
      .email-muted { color: ${light.muted}; }
      .email-danger, .email-danger-topbar, .email-danger-title { color: ${light.danger}; }
      .email-danger-topbar-bg { background: ${light.danger}; }
      .email-brand-text { color: ${light.primary}; }
    `;

    const darkCss = `
      html, .email-root { background: ${dark.appBg}; color: ${dark.text}; }
      .email-card { background: ${dark.cardBg}; border-color: ${dark.border}; }
      .email-topbar, .email-title, .email-amount { color: ${dark.primary}; }
      .email-topbar-bg { background: ${dark.primary}; }
      .email-highlight { background: ${dark.accentBg}; border-color: ${dark.border}; }
      .email-muted { color: ${dark.muted}; }
      .email-danger, .email-danger-topbar, .email-danger-title { color: ${dark.danger}; }
      .email-danger-topbar-bg { background: ${dark.danger}; }
      .email-brand-text { color: ${dark.primary}; }
    `;

    if (theme === 'dark') {
      return { css: darkCss, colorScheme: 'dark' };
    }

    if (theme === 'light') {
      return { css: lightCss, colorScheme: 'light' };
    }

    return {
      css: `
        ${lightCss}
        @media (prefers-color-scheme: dark) {
          ${darkCss}
        }
      `,
      colorScheme: 'light dark',
    };
  }

  private buildEmailDocument(
    bodyHtml: string,
    accentColor: string | undefined,
    theme: AppTheme,
  ): string {
    const { css, colorScheme } = this.buildThemeCss(accentColor, theme);

    return `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="color-scheme" content="${colorScheme}" />
          <meta name="supported-color-schemes" content="${colorScheme}" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            }
            .email-root {
              margin: 0;
              padding: 24px;
            }
            .email-shell {
              max-width: 640px;
              margin: 0 auto;
            }
            .email-header {
              padding-bottom: 32px;
              text-align: center;
            }
            .email-logo-container {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              text-decoration: none;
            }
            .email-logo {
              height: 100px;
              width: auto;
              display: block;
            }
            .email-brand-text {
              margin-left: 16px;
              font-size: 42px;
              font-weight: 700;
              letter-spacing: -0.04em;
              line-height: 1;
            }
            .email-card {
              border: 1px solid;
              border-radius: 12px;
              overflow: hidden;
            }
            .email-topbar-bg,
            .email-danger-topbar-bg {
              height: 6px;
            }
            .email-content {
              padding: 24px;
            }
            .email-title,
            .email-danger-title {
              margin: 0 0 16px;
              font-size: 32px;
              line-height: 1.2;
              font-weight: 600;
            }
            .email-greeting {
              margin: 0 0 18px;
              font-size: 20px;
              line-height: 1.4;
            }
            .email-text {
              margin: 0 0 18px;
              font-size: 18px;
              line-height: 1.5;
            }
            .email-highlight {
              border: 1px solid;
              border-radius: 10px;
              padding: 16px;
              margin: 20px 0;
            }
            .email-metric {
              margin: 0 0 8px;
              font-size: 18px;
              line-height: 1.4;
            }
            .email-metric:last-child {
              margin-bottom: 0;
            }
            .email-amount,
            .email-danger {
              font-size: 30px;
              line-height: 1.1;
              font-weight: 700;
            }
            .email-signoff {
              margin: 24px 0 0;
              font-size: 16px;
              line-height: 1.5;
            }
            ${css}
          </style>
        </head>
        <body>
          <div class="email-root">
            <div class="email-shell">
              ${bodyHtml}
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getEmailHeader(appUrl: string): string {
    return `
      <div class="email-header">
        <a href="${appUrl}" class="email-logo-container">
          <img src="cid:logo" alt="" class="email-logo" />
          <span class="email-brand-text">SubTracker</span>
        </a>
      </div>
    `;
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

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async sendAlert(
    email: string,
    subscriptionName: string,
    daysBefore: number,
    amount: number,
    currency: string,
    language: 'en' | 'pl' = 'en',
    accentColor?: string,
    theme?: string,
    name?: string,
  ) {
    const locale = LOCALES[language];
    const emails = locale.emails;
    const themeMode = this.resolveTheme(theme);
    const safeSubscriptionName = this.escapeHtml(subscriptionName);
    const subject = `${emails.upcomingRenewal}: ${subscriptionName}`;
    const greeting = emails.greetingWithName.replace('{{name}}', name || email);

    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const teamNameHtml = locale.emails.teamName;

    const logInText = language === 'pl' ? 'zaloguj się do panelu' : 'log in to your dashboard';
    const managePromptHtml = locale.emails.managePrompt.replace(
      logInText,
      `<a href="${appUrl}" style="color: inherit; text-decoration: underline; font-weight: 600;">${logInText}</a>`,
    );

    const bodyHtml = `
              <div class="email-topbar-bg"></div>
              <div class="email-content">
                ${this.getEmailHeader(appUrl)}
                <h2 class="email-title">${emails.subscriptionAlert}</h2>
                <p class="email-greeting">${greeting}</p>
                <p class="email-text">${emails.reminder.replace('{{name}}', safeSubscriptionName)}</p>
                <div class="email-highlight">
                  <p class="email-metric"><strong>${locale.emails.amount}:</strong> <span class="email-amount">${amount} ${currency}</span></p>
                  <p class="email-metric"><strong>${locale.emails.renewingIn}:</strong> ${daysBefore} ${locale.emails.days}</p>
                </div>
                <p class="email-text">${managePromptHtml}</p>
                <p class="email-signoff email-muted">${locale.emails.thankYou},<br>${teamNameHtml}</p>
              </div>
            </div>
      `;

    const htmlTemplate = this.buildEmailDocument(bodyHtml, accentColor, themeMode);

    await this.sendEmail({
      to: email,
      subject,
      html: htmlTemplate,
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
    language: 'en' | 'pl' = 'en',
    name?: string,
  ) {
    const locale = LOCALES[language];
    const emails = locale.emails;
    const themeMode = this.resolveTheme(theme);
    const greeting = emails.greetingWithName.replace('{{name}}', name || email);

    const appUrl =
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const teamNameHtml = locale.emails.teamName;

    const logInText = language === 'pl' ? 'zaloguj się do panelu' : 'log in to your dashboard';
    const managePromptHtml = locale.emails.managePrompt.replace(
      logInText,
      `<a href="${appUrl}" style="color: inherit; text-decoration: underline; font-weight: 600;">${logInText}</a>`,
    );

    const bodyHtml = `
          <div class="email-card">
            <div class="email-danger-topbar-bg"></div>
            <div class="email-content">
              ${this.getEmailHeader(appUrl)}
              <h2 class="email-danger-title">${emails.budgetExceeded}</h2>
              <p class="email-greeting">${greeting}</p>
              <p class="email-text">${emails.budgetLimitDesc}</p>
              <div class="email-highlight">
                <p class="email-metric"><strong>${locale.emails.currentMonthly}:</strong> <span class="email-danger">${amount.toFixed(2)} ${currency}</span></p>
                <p class="email-metric"><strong>${locale.emails.yourBudget}:</strong> ${budget.toFixed(2)} ${currency}</p>
              </div>
              <p class="email-text">${managePromptHtml}</p>
              <p class="email-signoff email-muted">${locale.emails.thankYou},<br>${teamNameHtml}</p>
            </div>
          </div>
    `;

    const htmlTemplate = this.buildEmailDocument(bodyHtml, accentColor, themeMode);

    await this.sendEmail({
      to: email,
      subject: locale.emails.budgetAlert,
      html: htmlTemplate,
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
    language: 'en' | 'pl' = 'en',
    accentColor?: string,
    theme?: string,
    name?: string,
  ) {
    const locale = LOCALES[language];
    const emails = locale.emails;
    const themeMode = this.resolveTheme(theme);
    const greeting = emails.greetingWithName.replace('{{name}}', name || email);

    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const teamNameHtml = locale.emails.teamName;

    const logInText = language === 'pl' ? 'zaloguj się do panelu' : 'log in to your dashboard';
    const managePromptHtml = locale.emails.managePrompt.replace(
      logInText,
      `<a href="${appUrl}" style="color: inherit; text-decoration: underline; font-weight: 600;">${logInText}</a>`,
    );

    const digest = emails.digest;

    let paidYesterdayHtml = '';
    if (paidYesterday.length > 0) {
      const items = paidYesterday
        .map(
          (p) =>
            `<li style="margin-bottom: 8px;"><strong>${this.escapeHtml(p.name)}</strong>: ${p.amount.toFixed(2)} ${p.currency}</li>`,
        )
        .join('');
      paidYesterdayHtml = `
        <div style="margin-top: 20px;">
          <h3 style="font-size: 20px; margin-bottom: 12px;">${digest.paidYesterday}</h3>
          <ul style="padding-left: 20px; margin: 0;">${items}</ul>
        </div>
      `;
    } else {
      paidYesterdayHtml = `
        <div style="margin-top: 20px;">
          <p class="email-text email-muted">${digest.noPaymentsPaidYesterday}</p>
        </div>
      `;
    }

    const bodyHtml = `
          <div class="email-card">
            <div class="email-topbar-bg"></div>
            <div class="email-content">
              ${this.getEmailHeader(appUrl)}
              <h2 class="email-title">${emails.dailyDigestTitle}</h2>
              <p class="email-greeting">${greeting}</p>
              <p class="email-text">${digest.summary}</p>
              <div class="email-highlight">
                <p class="email-metric"><strong>${digest.totalActive}:</strong> ${stats.totalActive}</p>
                <p class="email-metric"><strong>${digest.upcomingThisWeek}:</strong> ${stats.upcomingThisWeek}</p>
                <p class="email-metric"><strong>${digest.totalMonthly}:</strong> <span class="email-amount">${stats.totalMonthly.toFixed(2)} ${currency}</span></p>
              </div>
              ${paidYesterdayHtml}
              <p class="email-text" style="margin-top: 24px;">${managePromptHtml}</p>
              <p class="email-signoff email-muted">${locale.emails.thankYou},<br>${teamNameHtml}</p>
            </div>
          </div>
    `;

    const htmlTemplate = this.buildEmailDocument(bodyHtml, accentColor, themeMode);

    await this.sendEmail({
      to: email,
      subject: emails.dailyDigestSubject,
      html: htmlTemplate,
      fromKey: 'SMTP_FROM_ALERTS',
      fallbackFrom: '"SubTracker" <alerts@subtracker.local>',
    });
    this.logger.log(`[SMTP] Successfully sent daily digest email to ${email}`);
  }

  async sendWeeklyReport(
    email: string,
    stats: { totalActive: number; totalMonthly: number; upcomingThisWeek: number },
    currency: string,
    language: 'en' | 'pl' = 'en',
    accentColor?: string,
    theme?: string,
    name?: string,
  ) {
    const locale = LOCALES[language];
    const emails = locale.emails;
    const themeMode = this.resolveTheme(theme);
    const greeting = emails.greetingWithName.replace('{{name}}', name || email);

    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const teamNameHtml = locale.emails.teamName;

    const logInText = language === 'pl' ? 'zaloguj się do panelu' : 'log in to your dashboard';
    const managePromptHtml = locale.emails.managePrompt.replace(
      logInText,
      `<a href="${appUrl}" style="color: inherit; text-decoration: underline; font-weight: 600;">${logInText}</a>`,
    );

    const digest = emails.digest;

    const bodyHtml = `
          <div class="email-card">
            <div class="email-topbar-bg"></div>
            <div class="email-content">
              ${this.getEmailHeader(appUrl)}
              <h2 class="email-title">${emails.weeklyReportTitle}</h2>
              <p class="email-greeting">${greeting}</p>
              <p class="email-text">${digest.summary}</p>
              <div class="email-highlight">
                <p class="email-metric"><strong>${digest.totalActive}:</strong> ${stats.totalActive}</p>
                <p class="email-metric"><strong>${digest.upcomingThisWeek}:</strong> ${stats.upcomingThisWeek}</p>
                <p class="email-metric"><strong>${digest.totalMonthly}:</strong> <span class="email-amount">${stats.totalMonthly.toFixed(2)} ${currency}</span></p>
              </div>
              <p class="email-text">${managePromptHtml}</p>
              <p class="email-signoff email-muted">${locale.emails.thankYou},<br>${teamNameHtml}</p>
            </div>
          </div>
    `;

    const htmlTemplate = this.buildEmailDocument(bodyHtml, accentColor, themeMode);

    await this.sendEmail({
      to: email,
      subject: emails.weeklyReportSubject,
      html: htmlTemplate,
      fromKey: 'SMTP_FROM_ALERTS',
      fallbackFrom: '"SubTracker" <alerts@subtracker.local>',
    });
    this.logger.log(`[SMTP] Successfully sent weekly report email to ${email}`);
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
    language: 'en' | 'pl' = 'en',
  ) {
    const locale = LOCALES[language];
    const emails = locale.emails;
    const verification = emails.verification;
    const themeMode = this.resolveTheme('system');

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const appUrl = frontendUrl;
    const teamNameHtml = locale.emails.teamName;

    const bodyHtml = `
          <div class="email-card">
            <div class="email-topbar-bg"></div>
            <div class="email-content">
              ${this.getEmailHeader(appUrl)}
              <h2 class="email-title">${verification.title}</h2>
              <p class="email-greeting">${emails.greetingWithName.replace('{{name}}', name || email)}</p>
              <p class="email-text">${verification.text}</p>
              
              <div style="margin: 32px 0; text-align: center;">
                <a href="${verificationUrl}" style="background-color: ${this.getEmailColors(undefined, 'light').primary}; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                  ${verification.button}
                </a>
              </div>

              <p class="email-text email-muted" style="font-size: 14px;">
                ${verification.footer}
              </p>
              
              <p class="email-signoff email-muted">${locale.emails.thankYou},<br>${teamNameHtml}</p>
            </div>
          </div>
    `;

    const htmlTemplate = this.buildEmailDocument(bodyHtml, undefined, themeMode);

    await this.sendEmail({
      to: email,
      subject: verification.subject,
      html: htmlTemplate,
      fromKey: 'SMTP_FROM_AUTH',
      fallbackFrom: '"SubTracker" <auth@subtracker.local>',
    });
    this.logger.log(`[SMTP] Successfully sent verification email to ${email}`);
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
    language: 'en' | 'pl' = 'en',
  ) {
    const locale = LOCALES[language];
    const emails = locale.emails;
    const passwordReset = emails.passwordReset;
    const themeMode = this.resolveTheme('system');

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const appUrl = frontendUrl;
    const teamNameHtml = locale.emails.teamName;

    const bodyHtml = `
          <div class="email-card">
            <div class="email-topbar-bg"></div>
            <div class="email-content">
              ${this.getEmailHeader(appUrl)}
              <h2 class="email-title">${passwordReset.title}</h2>
              <p class="email-greeting">${emails.greetingWithName.replace('{{name}}', name || email)}</p>
              <p class="email-text">${passwordReset.text}</p>
              
              <div style="margin: 32px 0; text-align: center;">
                <a href="${resetUrl}" style="background-color: ${this.getEmailColors(undefined, 'light').primary}; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                  ${passwordReset.button}
                </a>
              </div>

              <p class="email-text email-muted" style="font-size: 14px;">
                ${passwordReset.footer}
              </p>
              
              <p class="email-signoff email-muted">${locale.emails.thankYou},<br>${teamNameHtml}</p>
            </div>
          </div>
    `;

    const htmlTemplate = this.buildEmailDocument(bodyHtml, undefined, themeMode);

    await this.sendEmail({
      to: email,
      subject: passwordReset.subject,
      html: htmlTemplate,
      fromKey: 'SMTP_FROM_AUTH',
      fallbackFrom: '"SubTracker" <auth@subtracker.local>',
    });
    this.logger.log(`[SMTP] Successfully sent password reset email to ${email}`);
  }
}
