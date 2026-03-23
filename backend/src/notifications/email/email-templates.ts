import { COLORS, type ColorsConfig, getAccentColor, LOCALES } from '@subtracker/shared';

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

export function resolveTheme(theme?: string): AppTheme {
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    return theme;
  }
  return 'system';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
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

function mixHex(hexA: string, hexB: string, ratioB: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const ratioA = 1 - ratioB;
  const mix = (x: number, y: number) => Math.round(x * ratioA + y * ratioB);
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(mix(a.r, b.r))}${toHex(mix(a.g, b.g))}${toHex(mix(a.b, b.b))}`;
}

function toRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getEmailColors(
  accentColor: string | undefined,
  mode: 'light' | 'dark',
): EmailColors {
  const accent = getAccentColor(accentColor || DEFAULT_ACCENT_NAME, ACCENT_DEFINITIONS);

  if (mode === 'dark') {
    return {
      appBg: accent.darkBg,
      cardBg: mixHex(accent.darkBg, '#ffffff', 0.04),
      border: toRgba(accent.darkPrimary, 0.3),
      primary: accent.darkPrimary,
      accentBg: accent.darkAccent,
      text: '#f8fafc',
      muted: '#94a3b8',
      danger: '#ef4444',
    };
  }

  return {
    appBg: accent.lightBg,
    cardBg: mixHex('#ffffff', accent.lightPrimary, 0.02),
    border: toRgba(accent.lightPrimary, 0.2),
    primary: accent.lightPrimary,
    accentBg: accent.lightAccent,
    text: '#0f172a',
    muted: '#64748b',
    danger: '#dc2626',
  };
}

function buildThemeCss(
  accentColor: string | undefined,
  theme: AppTheme,
): { css: string; colorScheme: string } {
  const light = getEmailColors(accentColor, 'light');
  const dark = getEmailColors(accentColor, 'dark');

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

export function buildEmailDocument(
  bodyHtml: string,
  accentColor: string | undefined,
  theme: AppTheme,
): string {
  const { css, colorScheme } = buildThemeCss(accentColor, theme);

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

export function getEmailHeader(appUrl: string): string {
  return `
    <div class="email-header">
      <a href="${appUrl}" class="email-logo-container">
        <img src="cid:logo" alt="" class="email-logo" />
        <span class="email-brand-text">SubTracker</span>
      </a>
    </div>
  `;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildAlertEmailHtml(params: {
  subscriptionName: string;
  daysBefore: number;
  amount: number;
  currency: string;
  language?: string;
  accentColor?: string;
  theme?: string;
  name?: string;
  email: string;
  appUrl: string;
}): { subject: string; html: string } {
  const {
    language = 'en',
    accentColor,
    theme,
    name,
    email,
    subscriptionName,
    daysBefore,
    amount,
    currency,
    appUrl,
  } = params;
  const locale = LOCALES[language as keyof typeof LOCALES] || LOCALES.en;
  const emails = locale.emails;
  const themeMode = resolveTheme(theme);
  const safeSubscriptionName = escapeHtml(subscriptionName);
  const subject = `${emails.upcomingRenewal}: ${subscriptionName}`;
  const greeting = emails.greetingWithName.replace('{{name}}', name || email);
  const teamNameHtml = locale.emails.teamName;

  const logInTextMap: Record<string, string> = {
    en: 'log in to your dashboard',
    pl: 'zaloguj się do panelu',
    de: 'melden Sie sich bitte in Ihrem Dashboard an',
    es: 'inicia sesión en tu panel de control',
    fr: 'connectez-vous à votre tableau de bord',
    it: 'accedi alla tua dashboard',
    pt: 'entre no seu painel',
    ru: 'войдите в панель управления',
    zh: '登录仪表板',
    ja: 'ダッシュボードにログイン',
    ko: '대시보드에 로그인',
  };

  const logInText = logInTextMap[language] || logInTextMap.en;
  const managePromptHtml = locale.emails.managePrompt.replace(
    logInText,
    `<a href="${appUrl}" style="color: inherit; text-decoration: underline; font-weight: 600;">${logInText}</a>`,
  );

  const bodyHtml = `
    <div class="email-card">
      <div class="email-topbar-bg"></div>
      <div class="email-content">
        ${getEmailHeader(appUrl)}
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

  return { subject, html: buildEmailDocument(bodyHtml, accentColor, themeMode) };
}

export function buildBudgetAlertEmailHtml(params: {
  email: string;
  amount: number;
  budget: number;
  currency: string;
  accentColor?: string;
  theme?: string;
  language?: string;
  name?: string;
  appUrl: string;
}): { subject: string; html: string } {
  const {
    language = 'en',
    accentColor,
    theme,
    name,
    email,
    amount,
    budget,
    currency,
    appUrl,
  } = params;
  const locale = LOCALES[language as keyof typeof LOCALES] || LOCALES.en;
  const emails = locale.emails;
  const themeMode = resolveTheme(theme);
  const greeting = emails.greetingWithName.replace('{{name}}', name || email);
  const teamNameHtml = locale.emails.teamName;

  const logInTextMap: Record<string, string> = {
    en: 'log in to your dashboard',
    pl: 'zaloguj się do panelu',
    de: 'melden Sie sich bitte in Ihrem Dashboard an',
    es: 'inicia sesión en tu panel de control',
    fr: 'connectez-vous à votre tableau de bord',
    it: 'accedi alla tua dashboard',
    pt: 'entre no seu painel',
    ru: 'войдите в панель управления',
    zh: '登录仪表板',
    ja: 'ダッシュボードにログイン',
    ko: '대시보드에 로그인',
  };

  const logInText = logInTextMap[language] || logInTextMap.en;
  const managePromptHtml = locale.emails.managePrompt.replace(
    logInText,
    `<a href="${appUrl}" style="color: inherit; text-decoration: underline; font-weight: 600;">${logInText}</a>`,
  );

  const bodyHtml = `
    <div class="email-card">
      <div class="email-danger-topbar-bg"></div>
      <div class="email-content">
        ${getEmailHeader(appUrl)}
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

  return {
    subject: locale.emails.budgetAlert,
    html: buildEmailDocument(bodyHtml, accentColor, themeMode),
  };
}

export function buildDailyDigestEmailHtml(params: {
  email: string;
  stats: { totalActive: number; totalMonthly: number; upcomingThisWeek: number };
  paidYesterday: { name: string; amount: number; currency: string }[];
  currency: string;
  language?: string;
  accentColor?: string;
  theme?: string;
  name?: string;
  appUrl: string;
}): { subject: string; html: string } {
  const {
    language = 'en',
    accentColor,
    theme,
    name,
    email,
    stats,
    paidYesterday,
    currency,
    appUrl,
  } = params;
  const locale = LOCALES[language as keyof typeof LOCALES] || LOCALES.en;
  const emails = locale.emails;
  const themeMode = resolveTheme(theme);
  const greeting = emails.greetingWithName.replace('{{name}}', name || email);
  const teamNameHtml = locale.emails.teamName;

  const logInTextMap: Record<string, string> = {
    en: 'log in to your dashboard',
    pl: 'zaloguj się do panelu',
    de: 'melden Sie sich bitte in Ihrem Dashboard an',
    es: 'inicia sesión en tu panel de control',
    fr: 'connectez-vous à votre tableau de bord',
    it: 'accedi alla tua dashboard',
    pt: 'entre no seu painel',
    ru: 'войдите в панель управления',
    zh: '登录仪表板',
    ja: 'ダッシュボードにログイン',
    ko: '대시보드에 로그인',
  };

  const logInText = logInTextMap[language] || logInTextMap.en;
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
          `<li style="margin-bottom: 8px;"><strong>${escapeHtml(p.name)}</strong>: ${p.amount.toFixed(2)} ${p.currency}</li>`,
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
        ${getEmailHeader(appUrl)}
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

  return {
    subject: emails.dailyDigestSubject,
    html: buildEmailDocument(bodyHtml, accentColor, themeMode),
  };
}

export function buildWeeklyReportEmailHtml(params: {
  email: string;
  stats: { totalActive: number; totalMonthly: number; upcomingThisWeek: number };
  currency: string;
  language?: string;
  accentColor?: string;
  theme?: string;
  name?: string;
  appUrl: string;
  reportType?: 'previous' | 'next';
}): { subject: string; html: string } {
  const {
    language = 'en',
    accentColor,
    theme,
    name,
    email,
    stats,
    currency,
    appUrl,
    reportType = 'next',
  } = params;
  const locale = LOCALES[language as keyof typeof LOCALES] || LOCALES.en;
  const emails = locale.emails;
  const themeMode = resolveTheme(theme);
  const greeting = emails.greetingWithName.replace('{{name}}', name || email);
  const teamNameHtml = locale.emails.teamName;

  const logInTextMap: Record<string, string> = {
    en: 'log in to your dashboard',
    pl: 'zaloguj się do panelu',
    de: 'melden Sie sich bitte in Ihrem Dashboard an',
    es: 'inicia sesión en tu panel de control',
    fr: 'connectez-vous à votre tableau de bord',
    it: 'accedi alla tua dashboard',
    pt: 'entre no seu painel',
    ru: 'войдите в панель управления',
    zh: '登录仪表板',
    ja: 'ダッシュボードにログイン',
    ko: '대시보드에 로그인',
  };

  const logInText = logInTextMap[language] || logInTextMap.en;
  const managePromptHtml = locale.emails.managePrompt.replace(
    logInText,
    `<a href="${appUrl}" style="color: inherit; text-decoration: underline; font-weight: 600;">${logInText}</a>`,
  );

  const digest = emails.digest;
  const isPrevious = reportType === 'previous';

  const title = isPrevious
    ? (emails.previousWeekReportTitle ?? emails.weeklyReportTitle)
    : (emails.nextWeekReportTitle ?? emails.weeklyReportTitle);
  const subject = isPrevious
    ? (emails.previousWeekReportSubject ?? emails.weeklyReportSubject)
    : (emails.nextWeekReportSubject ?? emails.weeklyReportSubject);
  const summary = isPrevious
    ? (digest.previousWeekSummary ?? digest.summary)
    : (digest.nextWeekSummary ?? digest.summary);
  const upcomingLabel = isPrevious
    ? (digest.paidLastWeek ?? digest.upcomingThisWeek)
    : (digest.upcomingNextWeek ?? digest.upcomingThisWeek);

  const bodyHtml = `
    <div class="email-card">
      <div class="email-topbar-bg"></div>
      <div class="email-content">
        ${getEmailHeader(appUrl)}
        <h2 class="email-title">${title}</h2>
        <p class="email-greeting">${greeting}</p>
        <p class="email-text">${summary}</p>
        <div class="email-highlight">
          <p class="email-metric"><strong>${digest.totalActive}:</strong> ${stats.totalActive}</p>
          <p class="email-metric"><strong>${upcomingLabel}:</strong> ${stats.upcomingThisWeek}</p>
          <p class="email-metric"><strong>${digest.totalMonthly}:</strong> <span class="email-amount">${stats.totalMonthly.toFixed(2)} ${currency}</span></p>
        </div>
        <p class="email-text">${managePromptHtml}</p>
        <p class="email-signoff email-muted">${locale.emails.thankYou},<br>${teamNameHtml}</p>
      </div>
    </div>
  `;

  return {
    subject,
    html: buildEmailDocument(bodyHtml, accentColor, themeMode),
  };
}

export function buildVerificationEmailHtml(params: {
  email: string;
  name: string;
  token: string;
  language?: string;
  frontendUrl: string;
}): { subject: string; html: string } {
  const { language = 'en', name, email, token, frontendUrl } = params;
  const locale = LOCALES[language as keyof typeof LOCALES] || LOCALES.en;
  const emails = locale.emails;
  const verification = emails.verification;
  const themeMode = resolveTheme('system');

  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
  const teamNameHtml = locale.emails.teamName;

  const bodyHtml = `
    <div class="email-card">
      <div class="email-topbar-bg"></div>
      <div class="email-content">
        ${getEmailHeader(frontendUrl)}
        <h2 class="email-title">${verification.title}</h2>
        <p class="email-greeting">${emails.greetingWithName.replace('{{name}}', name || email)}</p>
        <p class="email-text">${verification.text}</p>
        
        <div style="margin: 32px 0; text-align: center;">
          <a href="${verificationUrl}" style="background-color: ${getEmailColors(undefined, 'light').primary}; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
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

  return {
    subject: verification.subject,
    html: buildEmailDocument(bodyHtml, undefined, themeMode),
  };
}

export function buildPasswordResetEmailHtml(params: {
  email: string;
  name: string;
  token: string;
  language?: string;
  frontendUrl: string;
}): { subject: string; html: string } {
  const { language = 'en', name, email, token, frontendUrl } = params;
  const locale = LOCALES[language as keyof typeof LOCALES] || LOCALES.en;
  const emails = locale.emails;
  const passwordReset = emails.passwordReset;
  const themeMode = resolveTheme('system');

  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
  const teamNameHtml = locale.emails.teamName;

  const bodyHtml = `
    <div class="email-card">
      <div class="email-topbar-bg"></div>
      <div class="email-content">
        ${getEmailHeader(frontendUrl)}
        <h2 class="email-title">${passwordReset.title}</h2>
        <p class="email-greeting">${emails.greetingWithName.replace('{{name}}', name || email)}</p>
        <p class="email-text">${passwordReset.text}</p>
        
        <div style="margin: 32px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: ${getEmailColors(undefined, 'light').primary}; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
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

  return {
    subject: passwordReset.subject,
    html: buildEmailDocument(bodyHtml, undefined, themeMode),
  };
}
