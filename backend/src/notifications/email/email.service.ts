import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

type AppTheme = 'light' | 'dark' | 'system';

interface AccentDefinition {
  lightPrimary: string;
  darkPrimary: string;
  lightAccent: string;
  darkAccent: string;
  lightBg: string;
  darkBg: string;
}

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

const DEFAULT_ACCENT: AccentDefinition = {
  lightPrimary: '#4F46E5',
  darkPrimary: '#6366f1',
  lightAccent: '#e0e7ff',
  darkAccent: '#312e81',
  lightBg: '#F5F7FF',
  darkBg: '#0B0E2E',
};

const ACCENT_DEFINITIONS: Record<string, AccentDefinition> = {
  Indigo: { lightPrimary: '#4F46E5', darkPrimary: '#6366f1', lightAccent: '#e0e7ff', darkAccent: '#312e81', lightBg: '#F5F7FF', darkBg: '#0B0E2E' },
  Crimson: { lightPrimary: '#BE123C', darkPrimary: '#f43f5e', lightAccent: '#ffe4e6', darkAccent: '#4c0519', lightBg: '#FFF1F2', darkBg: '#1C040E' },
  Rose: { lightPrimary: '#DB2777', darkPrimary: '#f472b6', lightAccent: '#fce7f3', darkAccent: '#500724', lightBg: '#FFF0F6', darkBg: '#1C040D' },
  Lavender: { lightPrimary: '#7C3AED', darkPrimary: '#a78bfa', lightAccent: '#f3e8ff', darkAccent: '#2e1065', lightBg: '#F9F5FF', darkBg: '#0F081C' },
  Cobalt: { lightPrimary: '#1D4ED8', darkPrimary: '#3b82f6', lightAccent: '#dbeafe', darkAccent: '#172554', lightBg: '#F0F7FF', darkBg: '#050B1C' },
  Navy: { lightPrimary: '#1E3A8A', darkPrimary: '#2563eb', lightAccent: '#eff6ff', darkAccent: '#172554', lightBg: '#F0F4FF', darkBg: '#05081A' },
  Mint: { lightPrimary: '#059669', darkPrimary: '#10b981', lightAccent: '#ecfdf5', darkAccent: '#064e3b', lightBg: '#F0FDF9', darkBg: '#02120D' },
  Forest: { lightPrimary: '#15803D', darkPrimary: '#22c55e', lightAccent: '#dcfce7', darkAccent: '#052e16', lightBg: '#F0FDF4', darkBg: '#041408' },
  Sage: { lightPrimary: '#4D7C0F', darkPrimary: '#84cc16', lightAccent: '#f7fee7', darkAccent: '#1a2e05', lightBg: '#FAFEF0', darkBg: '#0D1405' },
  Amber: { lightPrimary: '#D97706', darkPrimary: '#f59e0b', lightAccent: '#fef3c7', darkAccent: '#451a03', lightBg: '#FFFBEB', darkBg: '#170F04' },
  Gold: { lightPrimary: '#B45309', darkPrimary: '#fbbf24', lightAccent: '#fef3c7', darkAccent: '#451a03', lightBg: '#FFFCEB', darkBg: '#150D04' },
  Terracotta: { lightPrimary: '#9A3412', darkPrimary: '#ea580c', lightAccent: '#ffedd5', darkAccent: '#431407', lightBg: '#FFF5F0', darkBg: '#1A0904' },
  Coffee: { lightPrimary: '#78350F', darkPrimary: '#a16207', lightAccent: '#fef3c7', darkAccent: '#271605', lightBg: '#FFF9F0', darkBg: '#140D04' },
  Sand: { lightPrimary: '#A16207', darkPrimary: '#d97706', lightAccent: '#fefce8', darkAccent: '#422006', lightBg: '#FFFBF0', darkBg: '#140F04' },
  Slate: { lightPrimary: '#475569', darkPrimary: '#94a3b8', lightAccent: '#f1f5f9', darkAccent: '#0f172a', lightBg: '#F8FAFC', darkBg: '#0A0C10' },
  Charcoal: { lightPrimary: '#334155', darkPrimary: '#64748b', lightAccent: '#f8fafc', darkAccent: '#1e293b', lightBg: '#F1F5F9', darkBg: '#0C1014' },
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
    const isPolish = language === 'pl';
    const themeMode = this.resolveTheme(theme);
    const safeSubscriptionName = this.escapeHtml(subscriptionName);
    const subject = isPolish
      ? `Nadchodzące odnowienie subskrypcji: ${subscriptionName}`
      : `Upcoming Subscription Renewal: ${subscriptionName}`;

    const bodyHtml = isPolish
      ? `
        <div class="email-root">
          <div class="email-shell">
            <div class="email-card">
              <div class="email-topbar-bg"></div>
              <div class="email-content">
                <h2 class="email-title">Alert subskrypcji</h2>
                <p class="email-greeting">Cześć.</p>
                <p class="email-text">To przypomnienie o Twojej subskrypcji <strong>${safeSubscriptionName}</strong>.</p>
                <div class="email-highlight">
                  <p class="email-metric"><strong>Kwota:</strong> <span class="email-amount">${amount} ${currency}</span></p>
                  <p class="email-metric"><strong>Odnowienie za:</strong> ${daysBefore} dni</p>
                </div>
                <p class="email-text">Jeśli chcesz zarządzać lub anulować tę subskrypcję, zaloguj się do panelu.</p>
                <p class="email-signoff email-muted">Dziękujemy,<br>Zespół Subscription Tracker</p>
              </div>
            </div>
          </div>
        </div>
      `
      : `
        <div class="email-root">
          <div class="email-shell">
            <div class="email-card">
              <div class="email-topbar-bg"></div>
              <div class="email-content">
                <h2 class="email-title">Subscription Alert</h2>
                <p class="email-greeting">Hello.</p>
                <p class="email-text">This is a friendly reminder regarding your <strong>${safeSubscriptionName}</strong> subscription.</p>
                <div class="email-highlight">
                  <p class="email-metric"><strong>Amount:</strong> <span class="email-amount">${amount} ${currency}</span></p>
                  <p class="email-metric"><strong>Renewing In:</strong> ${daysBefore} day(s)</p>
                </div>
                <p class="email-text">If you wish to manage or cancel this subscription, please log in to your dashboard.</p>
                <p class="email-signoff email-muted">Thank you,<br>Subscription Tracker Team</p>
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
    const isPolish = language === 'pl';
    const themeMode = this.resolveTheme(theme);

    const bodyHtml = isPolish
      ? `
      <div class="email-root">
        <div class="email-shell">
          <div class="email-card">
            <div class="email-danger-topbar-bg"></div>
            <div class="email-content">
              <h2 class="email-danger-title">Przekroczono limit budżetu</h2>
              <p class="email-greeting">Cześć.</p>
              <p class="email-text">To automatyczne powiadomienie, że łączny miesięczny koszt Twoich subskrypcji przekroczył ustawiony budżet.</p>
              <div class="email-highlight">
                <p class="email-metric"><strong>Aktualny koszt miesięczny:</strong> <span class="email-danger">${amount.toFixed(2)} ${currency}</span></p>
                <p class="email-metric"><strong>Twój budżet:</strong> ${budget.toFixed(2)} ${currency}</p>
              </div>
              <p class="email-text">Zaloguj się do panelu, aby przejrzeć i zarządzać aktywnymi subskrypcjami.</p>
              <p class="email-signoff email-muted">Dziękujemy,<br>Zespół Subscription Tracker</p>
            </div>
          </div>
        </div>
      </div>
    `
      : `
      <div class="email-root">
        <div class="email-shell">
          <div class="email-card">
            <div class="email-danger-topbar-bg"></div>
            <div class="email-content">
              <h2 class="email-danger-title">Budget Limit Exceeded</h2>
              <p class="email-greeting">Hello.</p>
              <p class="email-text">This is an automated alert to inform you that your total monthly subscription cost has exceeded your configured budget.</p>
              <div class="email-highlight">
                <p class="email-metric"><strong>Current Monthly Cost:</strong> <span class="email-danger">${amount.toFixed(2)} ${currency}</span></p>
                <p class="email-metric"><strong>Your Budget:</strong> ${budget.toFixed(2)} ${currency}</p>
              </div>
              <p class="email-text">Log in to your dashboard to review and manage your active subscriptions.</p>
              <p class="email-signoff email-muted">Thank you,<br>Subscription Tracker Team</p>
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
        subject: isPolish
          ? 'Alert budżetowy: przekroczono limit miesięczny'
          : 'Budget Alert: Monthly Limit Exceeded',
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
