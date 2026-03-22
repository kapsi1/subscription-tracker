import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MonthlyPaymentsCalendar } from './MonthlyPaymentsCalendar';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: Record<string, unknown>) => {
        if (key === 'dashboard.paymentCalendarTitle') return 'Payment Calendar';
        if (key === 'dashboard.paymentCalendarDesc') return 'Calendar description';
        if (key === 'dashboard.paymentCalendarOpenDay') {
          return `Open payments for ${options?.date ?? ''}`;
        }
        if (key === 'subscriptions.paymentCount') {
          return `${options?.count ?? 0} payments`;
        }

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

describe('MonthlyPaymentsCalendar', () => {
  it('groups payments by local day and forwards the selected day payload', () => {
    const onSelectDay = vi.fn();

    render(
      <MonthlyPaymentsCalendar
        selectedDate={new Date(2026, 2, 1)}
        monthlyPayments={[
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
          {
            id: 'payment-2',
            subscriptionId: null,
            name: 'Domain',
            category: 'Services',
            amount: 9.99,
            currency: 'USD',
            date: '2026-03-05T15:00:00.000Z',
            status: 'done',
          },
          {
            id: 'payment-3',
            subscriptionId: 'subscription-2',
            name: 'Spotify',
            category: 'Entertainment',
            amount: 5.99,
            currency: 'USD',
            date: '2026-03-08T10:00:00.000Z',
            status: 'upcoming',
          },
        ]}
        onSelectDay={onSelectDay}
      />,
    );

    const selectedDay = screen.getByTestId('payment-calendar-day-2026-03-05');
    expect(selectedDay).toHaveTextContent('5');
    expect(selectedDay).toHaveTextContent('2');

    fireEvent.click(selectedDay);

    expect(onSelectDay).toHaveBeenCalledTimes(1);
    expect(onSelectDay).toHaveBeenCalledWith(
      expect.any(Date),
      expect.arrayContaining([
        expect.objectContaining({ id: 'payment-1' }),
        expect.objectContaining({ id: 'payment-2' }),
      ]),
    );
  });
});
