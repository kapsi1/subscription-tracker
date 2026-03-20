import type { Subscription } from '@subtracker/shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildGoogleCalendarUrl } from './google-calendar';
import i18n from './i18n';

describe('buildGoogleCalendarUrl', () => {
  beforeAll(() => {
    i18n.addResourceBundle(
      'en',
      'translation',
      {
        subscriptions: {
          googleCalendarDescription: {
            title: 'Subscription payment tracked in SubTracker',
            amount: 'Amount: {{value}} {{currency}}',
            billingCycle: 'Billing cycle: {{value}}',
            category: 'Category: {{value}}',
          },
        },
      },
      true,
      true,
    );

    i18n.addResourceBundle(
      'pl',
      'translation',
      {
        subscriptions: {
          googleCalendarDescription: {
            title: 'Płatność za subskrypcję śledzoną w SubTracker',
            amount: 'Kwota: {{value}} {{currency}}',
            billingCycle: 'Cykl rozliczeniowy: {{value}}',
            category: 'Kategoria: {{value}}',
          },
        },
      },
      true,
      true,
    );
  });

  it('builds a recurring monthly Google Calendar event URL', () => {
    const subscription: Subscription = {
      id: 'sub-1',
      name: 'Netflix Premium',
      amount: 15.99,
      currency: 'USD',
      billingCycle: 'monthly',
      nextBillingDate: '2026-04-15T00:00:00.000Z',
      category: 'Entertainment',
    };

    const url = buildGoogleCalendarUrl(subscription);

    expect(url).not.toBeNull();
    if (!url) {
      throw new Error('Expected Google Calendar URL');
    }

    const parsedUrl = new URL(url);
    expect(parsedUrl.origin).toBe('https://calendar.google.com');
    expect(parsedUrl.pathname).toBe('/calendar/render');
    expect(parsedUrl.searchParams.get('action')).toBe('TEMPLATE');
    expect(parsedUrl.searchParams.get('text')).toBe('Netflix Premium');
    expect(parsedUrl.searchParams.get('dates')).toBe('20260415/20260416');
    expect(parsedUrl.searchParams.get('recur')).toBe('RRULE:FREQ=MONTHLY');
    expect(parsedUrl.searchParams.get('details')).toContain('15.99 USD');
    expect(parsedUrl.searchParams.get('details')).toContain('Entertainment');
  });

  it('builds a recurring custom-interval event URL', () => {
    const subscription: Subscription = {
      id: 'sub-2',
      name: 'Domain Renewal',
      amount: 24,
      currency: 'USD',
      billingCycle: 'custom',
      nextBillingDate: '2026-06-10',
      category: 'Utilities',
      reminderDays: 7,
    };

    const url = buildGoogleCalendarUrl({
      ...subscription,
      intervalDays: 45,
    } as Subscription & { intervalDays: number });

    expect(url).not.toBeNull();
    if (!url) {
      throw new Error('Expected Google Calendar URL');
    }

    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get('dates')).toBe('20260610/20260611');
    expect(parsedUrl.searchParams.get('recur')).toBe('RRULE:FREQ=DAILY;INTERVAL=45');
  });

  it('returns null when next billing date is missing', () => {
    const subscription: Subscription = {
      id: 'sub-3',
      name: 'No Date Subscription',
      amount: 9.99,
      currency: 'USD',
      billingCycle: 'monthly',
      category: 'Other',
    };

    expect(buildGoogleCalendarUrl(subscription)).toBeNull();
  });

  it('localizes the event description', async () => {
    const previousLanguage = i18n.language;
    await i18n.changeLanguage('pl');

    try {
      const subscription: Subscription = {
        id: 'sub-4',
        name: 'Netflix Premium',
        amount: 15.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: '2026-04-15T00:00:00.000Z',
        category: 'Entertainment',
      };

      const url = buildGoogleCalendarUrl(subscription);

      expect(url).not.toBeNull();
      if (!url) {
        throw new Error('Expected Google Calendar URL');
      }

      const details = new URL(url).searchParams.get('details');
      expect(details).toContain('Płatność za subskrypcję śledzoną w SubTracker');
      expect(details).toContain('Kwota: 15.99 USD');
      expect(details).toContain('Cykl rozliczeniowy: Miesięcznie');
      expect(details).toContain('Kategoria: Rozrywka');
    } finally {
      await i18n.changeLanguage(previousLanguage);
    }
  });
});
