import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { CategorySection } from './CategorySection';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mockCategories = [
  { id: 'cat-1', name: 'Entertainment', color: '#a855f7' },
  { id: 'cat-2', name: 'Productivity', color: '#3b82f6' },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CategorySection', () => {
  beforeEach(() => {
    mockApi.get.mockResolvedValue({ data: mockCategories });
  });

  it('renders category list after loading', async () => {
    const { Wrapper } = createWrapper();
    render(<CategorySection />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Entertainment')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Productivity')).toBeInTheDocument();
    });
  });

  it('calls GET /categories on mount', async () => {
    const { Wrapper } = createWrapper();
    render(<CategorySection />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/categories');
    });
  });

  it('calls POST /categories when Add Category button is clicked and saved', async () => {
    mockApi.post.mockResolvedValue({
      data: { id: 'cat-new', name: 'New Category', color: '#6366f1' },
    });
    mockApi.post.mockResolvedValueOnce({ data: { id: 'cat-new', name: 'New Category', color: '#6366f1' } }); // for single post
    mockApi.post.mockResolvedValue({ data: [] }); // for /categories/reorder
    const { Wrapper } = createWrapper();
    render(<CategorySection />, { wrapper: Wrapper });

    await waitFor(() => screen.getByDisplayValue('Entertainment'));

    const addButton = screen.getByRole('button', { name: /settings.categories.addCategory/i });

    await act(async () => {
      fireEvent.click(addButton);
    });
    
    const saveButton = screen.getByRole('button', { name: /settings.categories.save/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/categories', {
        name: 'New Category',
        color: '#6366f1',
      });
    });
  });

  it('calls DELETE /categories/:id when delete button is clicked and saved', async () => {
    mockApi.delete.mockResolvedValue({});
    mockApi.post.mockResolvedValue({ data: [] }); // for /categories/reorder
    const { Wrapper } = createWrapper();
    render(<CategorySection />, { wrapper: Wrapper });

    await waitFor(() => screen.getByDisplayValue('Entertainment'));

    // Delete buttons are hidden (opacity-0) but can be clicked — find all and click first
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    // Delete buttons are icon-only Trash2 buttons, filter by those without visible text
    const trashButtons = deleteButtons.filter(
      (btn) => btn.querySelector('svg') && !btn.textContent?.trim(),
    );

    await act(async () => {
      fireEvent.click(trashButtons[0]);
    });

    const saveButton = screen.getByRole('button', { name: /settings.categories.save/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockApi.delete).toHaveBeenCalledWith('/categories/cat-1');
    });
  });

  it('calls POST /categories/reset when Reset button is clicked and confirmed', async () => {
    mockApi.post.mockResolvedValue({ data: mockCategories });
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    const { Wrapper } = createWrapper();
    render(<CategorySection />, { wrapper: Wrapper });

    await waitFor(() => screen.getByDisplayValue('Entertainment'));

    const resetButton = screen.getByRole('button', {
      name: /settings.categories.resetToDefaults/i,
    });

    await act(async () => {
      fireEvent.click(resetButton);
    });

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/categories/reset');
    });

    vi.unstubAllGlobals();
  });

  it('does not call reset API when user cancels confirmation', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
    const { Wrapper } = createWrapper();
    render(<CategorySection />, { wrapper: Wrapper });

    await waitFor(() => screen.getByDisplayValue('Entertainment'));

    const resetButton = screen.getByRole('button', {
      name: /settings.categories.resetToDefaults/i,
    });
    fireEvent.click(resetButton);

    expect(mockApi.post).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('calls PATCH /categories/:id when a category name is changed, blurred, and saved', async () => {
    mockApi.patch.mockResolvedValue({
      data: { id: 'cat-1', name: 'Movies', color: '#a855f7' },
    });
    mockApi.post.mockResolvedValue({ data: [] }); // for /categories/reorder
    const { Wrapper } = createWrapper();
    render(<CategorySection />, { wrapper: Wrapper });

    await waitFor(() => screen.getByDisplayValue('Entertainment'));

    const input = screen.getByDisplayValue('Entertainment');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Movies' } });
      fireEvent.blur(input);
    });

    const saveButton = screen.getByRole('button', { name: /settings.categories.save/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith('/categories/cat-1', {
        name: 'Movies',
        color: '#a855f7',
      });
    });
  });

  it('restores original name and shows error toast when blurred with empty name', async () => {
    const { toast } = await import('sonner');
    const { Wrapper } = createWrapper();
    render(<CategorySection />, { wrapper: Wrapper });

    await waitFor(() => screen.getByDisplayValue('Entertainment'));

    const input = screen.getByDisplayValue('Entertainment');

    await act(async () => {
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);
    });

    expect(screen.getByDisplayValue('Entertainment')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('settings.categories.noName');
  });
});
