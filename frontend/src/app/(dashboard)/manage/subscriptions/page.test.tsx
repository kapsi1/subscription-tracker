'use client';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ManageSubscriptionsPage from './page';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/lib/api');
jest.mock('@tanstack/react-query', () => {
  const original = jest.requireActual('@tanstack/react-query');
  return {
    ...original,
    useQuery: jest.fn(),
    useMutation: jest.fn(),
  };
});

describe('ManageSubscriptionsPage - Import Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (useMutation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
    });
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

    const input = screen.getByLabelText('Import subscriptions from JSON');
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

    const input = screen.getByLabelText('Import subscriptions from JSON');
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
