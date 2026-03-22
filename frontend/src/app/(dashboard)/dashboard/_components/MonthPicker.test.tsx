'use client';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MonthPicker } from './MonthPicker';

// Mock useTranslation
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en' },
    }),
  };
});

// Mock ResizeObserver for Radix components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('MonthPicker', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the selected month and year', () => {
    const selectedDate = new Date(2024, 0, 1); // January 2024
    const setSelectedDate = vi.fn();
    render(<MonthPicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />);

    // Check if the year 2024 is rendered (part of the localized date string)
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('navigates to the previous month', () => {
    const selectedDate = new Date(2024, 0, 1); // January 2024
    const setSelectedDate = vi.fn();
    render(<MonthPicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />);

    const prevBtn = screen.getByLabelText('common.previous');
    fireEvent.click(prevBtn);

    expect(setSelectedDate).toHaveBeenCalled();
    const calledDate = setSelectedDate.mock.calls[0][0] as Date;
    expect(calledDate.getMonth()).toBe(11); // December
    expect(calledDate.getFullYear()).toBe(2023);
  });

  it('navigates to the next month', () => {
    const selectedDate = new Date(2024, 0, 1); // January 2024
    const setSelectedDate = vi.fn();
    render(<MonthPicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />);

    const nextBtn = screen.getByLabelText('common.next');
    fireEvent.click(nextBtn);

    expect(setSelectedDate).toHaveBeenCalled();
    const calledDate = setSelectedDate.mock.calls[0][0] as Date;
    expect(calledDate.getMonth()).toBe(1); // February
    expect(calledDate.getFullYear()).toBe(2024);
  });

  it('resets to current month when "This Month" is clicked', () => {
    const selectedDate = new Date(2020, 0, 1);
    const setSelectedDate = vi.fn();
    render(<MonthPicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />);

    const resetBtn = screen.getByText('dashboard.thisMonth');
    fireEvent.click(resetBtn);

    expect(setSelectedDate).toHaveBeenCalled();
    const calledDate = setSelectedDate.mock.calls[0][0] as Date;
    const now = new Date();
    expect(calledDate.getMonth()).toBe(now.getMonth());
    expect(calledDate.getFullYear()).toBe(now.getFullYear());
  });
});
