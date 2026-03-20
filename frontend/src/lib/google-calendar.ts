import type { Subscription } from '@subtracker/shared';
import i18n from './i18n';

type CalendarExportSubscription = Subscription & {
  intervalDays?: number | null;
};

const GOOGLE_CALENDAR_BASE_URL = 'https://calendar.google.com/calendar/render';

export function buildGoogleCalendarUrl(subscription: CalendarExportSubscription): string | null {
  const datePart = getDatePart(subscription.nextBillingDate);
  if (!datePart) {
    return null;
  }

  const url = new URL(GOOGLE_CALENDAR_BASE_URL);
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', subscription.name);
  url.searchParams.set(
    'details',
    [
      i18n.t('subscriptions.googleCalendarDescription.title'),
      i18n.t('subscriptions.googleCalendarDescription.amount', {
        value: subscription.amount,
        currency: subscription.currency,
      }),
      i18n.t('subscriptions.googleCalendarDescription.billingCycle', {
        value: i18n.t(`subscriptions.modal.billingCycles.${subscription.billingCycle}`, {
          defaultValue: subscription.billingCycle,
        }),
      }),
      i18n.t('subscriptions.googleCalendarDescription.category', {
        value: i18n.t(`subscriptions.modal.categories.${subscription.category}`, {
          defaultValue: subscription.category,
        }),
      }),
    ].join('\n'),
  );
  url.searchParams.set(
    'dates',
    `${formatGoogleDate(datePart)}/${formatGoogleDate(addDays(datePart, 1))}`,
  );

  const recurrenceRule = getRecurrenceRule(subscription);
  if (recurrenceRule) {
    url.searchParams.set('recur', `RRULE:${recurrenceRule}`);
  }

  return url.toString();
}

function getDatePart(dateString?: string): string | null {
  if (!dateString) {
    return null;
  }

  const matchedDate = /^\d{4}-\d{2}-\d{2}/.exec(dateString)?.[0];
  if (matchedDate) {
    return matchedDate;
  }

  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
}

function formatGoogleDate(datePart: string): string {
  return datePart.replaceAll('-', '');
}

function addDays(datePart: string, days: number): string {
  const date = new Date(`${datePart}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getRecurrenceRule(subscription: CalendarExportSubscription): string | null {
  switch (subscription.billingCycle) {
    case 'monthly':
      return 'FREQ=MONTHLY';
    case 'yearly':
      return 'FREQ=YEARLY';
    case 'custom':
      return subscription.intervalDays ? `FREQ=DAILY;INTERVAL=${subscription.intervalDays}` : null;
    default:
      return null;
  }
}
