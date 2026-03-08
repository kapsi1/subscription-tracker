import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { COLORS, LOCALES, ColorsConfig } from '@subscription-tracker/shared';

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

const DEFAULT_ACCENT = COLORS.Indigo;
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

    this.logger.log(
      `[SMTP] Transport configured (host=${host}, port=${port}, secure=${secure})`,
    );
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
    const fullHex = sanitized.length === 3
      ? sanitized.split('').map((c) => c + c).join('')
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
    const accent = ACCENT_DEFINITIONS[accentColor ?? ''] ?? DEFAULT_ACCENT;

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

  private buildThemeCss(accentColor: string | undefined, theme: AppTheme): { css: string; colorScheme: string } {
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

  private buildEmailDocument(bodyHtml: string, accentColor: string | undefined, theme: AppTheme): string {
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
          ${bodyHtml}
        </body>
      </html>
    `;
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
  ) {
    const locale = LOCALES[language];
    const themeMode = this.resolveTheme(theme);
    const safeSubscriptionName = this.escapeHtml(subscriptionName);
    const subject = `${locale.emails.upcomingRenewal}: ${subscriptionName}`;

    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const teamNameHtml = locale.emails.teamName.replace(
      'Subscription Tracker',
      `<a href="${appUrl}" style="color: inherit; text-decoration: none; font-weight: 600;">Subscription Tracker</a>`
    );

    const logInText = language === 'pl' ? 'zaloguj się do panelu' : 'log in to your dashboard';
    const managePromptHtml = locale.emails.managePrompt.replace(
      logInText,
      `<a href="${appUrl}" style="color: inherit; text-decoration: underline; font-weight: 600;">${logInText}</a>`
    );

    const bodyHtml = `
        <div class="email-root">
          <div class="email-shell">
            <div class="email-card">
              <div class="email-topbar-bg"></div>
              <div class="email-content">
                <h2 class="email-title">${locale.emails.subscriptionAlert}</h2>
                <p class="email-greeting">${locale.emails.greeting}</p>
                <p class="email-text">${locale.emails.reminder.replace('{{name}}', safeSubscriptionName)}</p>
                <div class="email-highlight">
                  <p class="email-metric"><strong>${locale.emails.amount}:</strong> <span class="email-amount">${amount} ${currency}</span></p>
                  <p class="email-metric"><strong>${locale.emails.renewingIn}:</strong> ${daysBefore} ${locale.emails.days}</p>
                </div>
                <p class="email-text">${managePromptHtml}</p>
                <p class="email-signoff email-muted">${locale.emails.thankYou},<br>${teamNameHtml}</p>
              </div>
            </div>
          </div>
        </div>
      `;

    const htmlTemplate = this.buildEmailDocument(bodyHtml, accentColor, themeMode);

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
    theme?: string,
    language: 'en' | 'pl' = 'en',
  ) {
    const locale = LOCALES[language];
    const themeMode = this.resolveTheme(theme);

    const appUrl = this.configService.get<string>('APP_URL') || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const teamNameHtml = locale.emails.teamName.replace(
      'Subscription Tracker',
      `<a href="${appUrl}" style="color: inherit; text-decoration: none; font-weight: 600;">Subscription Tracker</a>`
    );

    const logInText = language === 'pl' ? 'zaloguj się do panelu' : 'log in to your dashboard';
    const managePromptHtml = locale.emails.managePrompt.replace(
      logInText,
      `<a href="${appUrl}" style="color: inherit; text-decoration: underline; font-weight: 600;">${logInText}</a>`
    );

    const bodyHtml = `
      <div class="email-root">
        <div class="email-shell">
          <div class="email-card">
            <div class="email-danger-topbar-bg"></div>
            <div class="email-content">
              <h2 class="email-danger-title">${locale.emails.budgetExceeded}</h2>
              <p class="email-greeting">${locale.emails.greeting}</p>
              <p class="email-text">${locale.emails.budgetLimitDesc}</p>
              <div class="email-highlight">
                <p class="email-metric"><strong>${locale.emails.currentMonthly}:</strong> <span class="email-danger">${amount.toFixed(2)} ${currency}</span></p>
                <p class="email-metric"><strong>${locale.emails.yourBudget}:</strong> ${budget.toFixed(2)} ${currency}</p>
              </div>
              <p class="email-text">${managePromptHtml}</p>
              <p class="email-signoff email-muted">${locale.emails.thankYou},<br>${teamNameHtml}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const htmlTemplate = this.buildEmailDocument(bodyHtml, accentColor, themeMode);

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'SMTP_FROM',
          '"Subscription Tracker" <alerts@subscription-tracker.local>',
        ),
        to: email,
        subject: locale.emails.budgetAlert,
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

  async sendDailyDigest(
    email: string,
    stats: { totalActive: number; totalMonthly: number; upcomingThisWeek: number },
    paidYesterday: { name: string; amount: number; currency: string }[],
    currency: string,
    language: 'en' | 'pl' = 'en',
    accentColor?: string,
    theme?: string,
  ) {
    const locale = LOCALES[language];
    const themeMode = this.resolveTheme(theme);

    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const teamNameHtml = locale.emails.teamName.replace(
      'Subscription Tracker',
      `<a href="${appUrl}" style="color: inherit; text-decoration: none; font-weight: 600;">Subscription Tracker</a>`
    );

    const logInText = language === 'pl' ? 'zaloguj się do panelu' : 'log in to your dashboard';
    const managePromptHtml = locale.emails.managePrompt.replace(
      logInText,
      `<a href="${appUrl}" style="color: inherit; text-decoration: underline; font-weight: 600;">${logInText}</a>`
    );

    const emails = locale.emails as Record<string, string>;

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
          <h3 style="font-size: 20px; margin-bottom: 12px;">${emails.paidYesterday}</h3>
          <ul style="padding-left: 20px; margin: 0;">${items}</ul>
        </div>
      `;
    } else {
      paidYesterdayHtml = `
        <div style="margin-top: 20px;">
          <p class="email-text email-muted">${emails.noPaymentsPaidYesterday}</p>
        </div>
      `;
    }

    const bodyHtml = `
      <div class="email-root">
        <div class="email-shell">
          <div class="email-card">
            <div class="email-topbar-bg"></div>
            <div class="email-content">
              <h2 class="email-title">${emails.dailyDigestTitle}</h2>
              <p class="email-greeting">${locale.emails.greeting}</p>
              <p class="email-text">${emails.digestSummary}</p>
              <div class="email-highlight">
                <p class="email-metric"><strong>${emails.totalActive}:</strong> ${stats.totalActive}</p>
                <p class="email-metric"><strong>${emails.upcomingThisWeek}:</strong> ${stats.upcomingThisWeek}</p>
                <p class="email-metric"><strong>${emails.totalMonthly}:</strong> <span class="email-amount">${stats.totalMonthly.toFixed(2)} ${currency}</span></p>
              </div>
              ${paidYesterdayHtml}
              <p class="email-text" style="margin-top: 24px;">${managePromptHtml}</p>
              <p class="email-signoff email-muted">${locale.emails.thankYou},<br>${teamNameHtml}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const htmlTemplate = this.buildEmailDocument(bodyHtml, accentColor, themeMode);

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'SMTP_FROM',
          '"Subscription Tracker" <alerts@subscription-tracker.local>',
        ),
        to: email,
        subject: emails.dailyDigestSubject,
        html: htmlTemplate,
      });
      this.logger.log(`[SMTP] Successfully sent daily digest email to ${email}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[SMTP] Failed to send daily digest to ${email}: ${message}`);
      throw error;
    }
  }

  async sendWeeklyReport(
    email: string,
    stats: { totalActive: number; totalMonthly: number; upcomingThisWeek: number },
    currency: string,
    language: 'en' | 'pl' = 'en',
    accentColor?: string,
    theme?: string,
  ) {
    const locale = LOCALES[language];
    const themeMode = this.resolveTheme(theme);

    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const teamNameHtml = locale.emails.teamName.replace(
      'Subscription Tracker',
      `<a href="${appUrl}" style="color: inherit; text-decoration: none; font-weight: 600;">Subscription Tracker</a>`
    );

    const logInText = language === 'pl' ? 'zaloguj się do panelu' : 'log in to your dashboard';
    const managePromptHtml = locale.emails.managePrompt.replace(
      logInText,
      `<a href="${appUrl}" style="color: inherit; text-decoration: underline; font-weight: 600;">${logInText}</a>`
    );

    const emails = locale.emails as Record<string, string>;

    const bodyHtml = `
      <div class="email-root">
        <div class="email-shell">
          <div class="email-card">
            <div class="email-topbar-bg"></div>
            <div class="email-content">
              <h2 class="email-title">${emails.weeklyReportTitle}</h2>
              <p class="email-greeting">${locale.emails.greeting}</p>
              <p class="email-text">${emails.digestSummary}</p>
              <div class="email-highlight">
                <p class="email-metric"><strong>${emails.totalActive}:</strong> ${stats.totalActive}</p>
                <p class="email-metric"><strong>${emails.upcomingThisWeek}:</strong> ${stats.upcomingThisWeek}</p>
                <p class="email-metric"><strong>${emails.totalMonthly}:</strong> <span class="email-amount">${stats.totalMonthly.toFixed(2)} ${currency}</span></p>
              </div>
              <p class="email-text">${managePromptHtml}</p>
              <p class="email-signoff email-muted">${locale.emails.thankYou},<br>${teamNameHtml}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const htmlTemplate = this.buildEmailDocument(bodyHtml, accentColor, themeMode);

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'SMTP_FROM',
          '"Subscription Tracker" <alerts@subscription-tracker.local>',
        ),
        to: email,
        subject: emails.weeklyReportSubject,
        html: htmlTemplate,
      });
      this.logger.log(`[SMTP] Successfully sent weekly report email to ${email}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[SMTP] Failed to send weekly report to ${email}: ${message}`);
      throw error;
    }
  }
}
