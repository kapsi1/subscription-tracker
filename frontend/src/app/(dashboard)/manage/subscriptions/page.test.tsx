'use client';

import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import ManageSubscriptionsPage from './page';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));
vi.mock('@tanstack/react-query', async () => {
  const original =
    await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...original,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
  };
});

describe('ManageSubscriptionsPage - Import Flow', () => {
  let queryClient: QueryClient;

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.mocked(useQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as never);
    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
    } as never);
  });

  it('should show import preview modal when valid file is selected', async () => {
    const mockJson = {
      subscriptions: [
        {
          name: 'Netflix',
          amount: 15,
          currency: 'USD',
          billingCycle: 'monthly',
          category: 'Entertainment',
        },
      ],
      categories: [{ name: 'Entertainment', color: '#ff0000', icon: 'Play' }],
      payments: [],
    };

    render(
      <QueryClientProvider client={queryClient}>
        <ManageSubscriptionsPage />
      </QueryClientProvider>,
    );

    const input = screen.getAllByLabelText('Import subscriptions from JSON')[0];
    const file = new File([JSON.stringify(mockJson)], 'test.json', { type: 'application/json' });

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('subscriptions.importPreview.title')).toBeInTheDocument();
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });
  });

  it('should call api.post with replace=true when checkbox is checked and confirmed', async () => {
    const mockJson = {
      subscriptions: [
        {
          name: 'Netflix',
          amount: 15,
          currency: 'USD',
          billingCycle: 'monthly',
          category: 'Entertainment',
        },
      ],
    };

    render(
      <QueryClientProvider client={queryClient}>
        <ManageSubscriptionsPage />
      </QueryClientProvider>,
    );

    const input = screen.getAllByLabelText('Import subscriptions from JSON')[0];
    const file = new File([JSON.stringify(mockJson)], 'test.json', { type: 'application/json' });

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('subscriptions.importPreview.title')).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText('subscriptions.importPreview.replace');
    fireEvent.click(checkbox);

    const confirmButton = screen.getByText('subscriptions.importPreview.confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/subscriptions/import',
        expect.objectContaining({
          replace: true,
          subscriptions: expect.any(Array),
        }),
      );
    });
  });
});
