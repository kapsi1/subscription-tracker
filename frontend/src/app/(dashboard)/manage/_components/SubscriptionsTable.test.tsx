import type { Category, Subscription } from '@subtracker/shared';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildGoogleCalendarUrl } from '@/lib/google-calendar';
import { SubscriptionsTable } from './SubscriptionsTable';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: { subscriptionName?: string; defaultValue?: string }) => {
        if (key === 'subscriptions.openInGoogleCalendar') {
          return 'Open in Google Calendar';
        }

        if (key === 'subscriptions.exportToGoogleCalendar') {
          return `Export ${options?.subscriptionName ?? 'subscription'} to Google Calendar`;
        }

        if (options?.defaultValue) {
          return options.defaultValue;
        }

        return key;
      },
    }),
  };
});

vi.mock('@/components/DynamicIcon', () => ({
  DynamicIcon: () => <span data-testid="dynamic-icon" />,
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: import('react').ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: import('react').ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: import('react').ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: import('react').ReactNode }) => <>{children}</>,
}));

afterEach(() => {
  cleanup();
});

describe('SubscriptionsTable', () => {
  it('renders a per-row Google Calendar export link', () => {
    const subscription: Subscription = {
      id: 'sub-1',
      name: 'Netflix',
      amount: 15.99,
      currency: 'USD',
      billingCycle: 'monthly',
      nextBillingDate: '2026-04-15T00:00:00.000Z',
      category: 'Entertainment',
    };

    const categories: Category[] = [
      { id: 'cat-1', name: 'Entertainment', color: '#123456', icon: 'film', order: 0 },
    ];

    render(
      <SubscriptionsTable
        filteredSubscriptions={[subscription]}
        categories={categories}
        searchQuery=""
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    const link = screen.getByRole('link', {
      name: 'Export Netflix to Google Calendar',
    });

    expect(link).toHaveAttribute('href', buildGoogleCalendarUrl(subscription));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
  });
});
