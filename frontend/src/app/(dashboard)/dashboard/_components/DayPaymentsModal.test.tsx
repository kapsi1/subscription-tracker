import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DayPaymentsModal } from './DayPaymentsModal';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: Record<string, unknown>) => {
        if (key === 'dashboard.paymentCalendarModalTitle') {
          return `Payments on ${options?.date ?? ''}`;
        }
        if (key === 'dashboard.paymentCalendarModalDesc') {
          return `${options?.count ?? 0} payments`;
        }
        if (key === 'dashboard.paymentCalendarEmptyDesc') {
          return `No payments on ${options?.date ?? ''}`;
        }
        if (key === 'subscriptions.history.noPayments') return 'No payments';
        if (key === 'subscriptions.history.table.service') return 'Service';
        if (key === 'subscriptions.history.table.amount') return 'Amount';
        if (key === 'dashboard.paymentDone') return 'Done';
        if (key === 'dashboard.paymentUpcoming') return 'Upcoming';

        return key;
      },
      i18n: { language: 'en-US' },
    }),
  };
});

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
}));

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('DayPaymentsModal', () => {
  it('renders an empty state for days without payments', () => {
    render(
      <DayPaymentsModal
        open
        onOpenChange={vi.fn()}
        selectedDate={new Date(2026, 2, 7)}
        payments={[]}
        onPaymentSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('No payments')).toBeInTheDocument();
    expect(screen.getByText('No payments on March 7, 2026')).toBeInTheDocument();
  });

  it('opens the selected payment from the table', () => {
    const onPaymentSelect = vi.fn();

    render(
      <DayPaymentsModal
        open
        onOpenChange={vi.fn()}
        selectedDate={new Date(2026, 2, 5)}
        payments={[
          {
            id: 'payment-1',
            subscriptionId: 'subscription-1',
            name: 'Netflix',
            category: 'Entertainment',
            amount: 15.99,
            currency: 'USD',
            date: '2026-03-05T12:00:00.000Z',
            status: 'done',
          },
        ]}
        onPaymentSelect={onPaymentSelect}
      />,
    );

    fireEvent.click(screen.getByText('Netflix'));

    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(onPaymentSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'payment-1' }));
  });
});
