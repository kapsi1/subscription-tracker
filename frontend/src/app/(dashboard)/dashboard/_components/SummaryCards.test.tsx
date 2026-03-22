import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SummaryCards } from './SummaryCards';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

describe('SummaryCards', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders done and total counts for this month payments', () => {
    render(
      <SummaryCards
        summary={{
          totalMonthlyCost: 29.99,
          totalYearlyCost: 359.88,
          activeSubscriptions: 4,
          currency: 'USD',
        }}
        monthlyPaymentsDoneCount={2}
        monthlyPaymentsTotalCount={10}
      />,
    );

    expect(screen.getByText('2/10')).toBeInTheDocument();
  });
});
