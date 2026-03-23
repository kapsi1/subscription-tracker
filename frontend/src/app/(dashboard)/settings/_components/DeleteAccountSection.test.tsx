import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type AuthContextType, type User, useAuth } from '@/components/auth-provider';
import api from '@/lib/api';
import { DeleteAccountSection } from './DeleteAccountSection';
import { SettingsSearchProvider } from './SettingsSearchContext';

vi.mock('@/lib/api', () => ({
  default: {
    delete: vi.fn(),
  },
}));

vi.mock('@/components/auth-provider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock ResizeObserver which is used by Radix UI
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    language: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    defaultReminderEnabled: true,
    defaultReminderDays: 3,
    monthlyBudget: null,
    lastBudgetAlertSentAt: null,
    theme: 'system',
    accentColor: 'Indigo',
    recentAccentColors: [],
    emailNotifications: true,
    dailyDigest: false,
    previousWeekReport: false,
    nextWeekReport: false,
    dashboardSortBy: 'date',
    dashboardSortOrder: 'asc',
    showPaidPayments: true,
    hasSeenManageHint: false,
    currency: 'USD',
    avatarUrl: null,
    googleId: null,
    ...overrides,
  };
}

const mockLogout = vi.fn();
const defaultAuthValue: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  logout: mockLogout,
  fetchUser: vi.fn(),
};

describe('DeleteAccountSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(defaultAuthValue);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the delete account button', () => {
    render(
      <SettingsSearchProvider>
        <DeleteAccountSection />
      </SettingsSearchProvider>,
    );
    const deleteButton = screen.getByRole('button', { name: /settings\.deleteAccount\.button/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it('opens the confirmation dialog when button is clicked', async () => {
    render(
      <SettingsSearchProvider>
        <DeleteAccountSection />
      </SettingsSearchProvider>,
    );

    const deleteButton = screen.getByRole('button', { name: /settings\.deleteAccount\.button/i });
    fireEvent.click(deleteButton);

    // Radix Dialog renders in a portal
    const title = await screen.findByText(/settings\.deleteAccount\.confirmTitle/i);
    expect(title).toBeInTheDocument();
  });

  it('requires password for regular accounts', async () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthValue,
      user: makeUser(),
    });
    vi.mocked(api.delete).mockResolvedValue({});

    render(
      <SettingsSearchProvider>
        <DeleteAccountSection />
      </SettingsSearchProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /settings\.deleteAccount\.button/i }));

    const passwordInput = await screen.findByLabelText(/settings\.deleteAccount\.passwordLabel/i);
    expect(passwordInput).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', {
      name: /settings\.deleteAccount\.confirmButton/i,
    });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(confirmButton).not.toBeDisabled();

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/users/me', {
        data: { password: 'password123' },
        _skipAuthRedirect: true,
      });
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('does not require password for Google accounts', async () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthValue,
      user: makeUser({ googleId: 'google-1' }),
    });
    vi.mocked(api.delete).mockResolvedValue({});

    render(
      <SettingsSearchProvider>
        <DeleteAccountSection />
      </SettingsSearchProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /settings\.deleteAccount\.button/i }));

    await screen.findByText(/settings\.deleteAccount\.confirmTitle/i);
    expect(
      screen.queryByPlaceholderText('settings.deleteAccount.passwordPlaceholder'),
    ).not.toBeInTheDocument();

    const confirmButton = screen.getByRole('button', {
      name: /settings\.deleteAccount\.confirmButton/i,
    });
    expect(confirmButton).not.toBeDisabled();

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/users/me', {
        data: { password: '' },
        _skipAuthRedirect: true,
      });
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('shows error toast on incorrect password', async () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthValue,
      user: makeUser(),
    });

    // Simulate axios 401 response
    const { default: axios } = await import('axios');
    const error = new axios.AxiosError('Unauthorized', '401', undefined, undefined, {
      status: 401,
      data: { message: 'Incorrect password' },
    } as unknown as import('axios').AxiosResponse);

    vi.mocked(api.delete).mockRejectedValue(error);
    const { toast } = await import('sonner');

    render(
      <SettingsSearchProvider>
        <DeleteAccountSection />
      </SettingsSearchProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /settings\.deleteAccount\.button/i }));
    const passwordInput = await screen.findByLabelText(/settings\.deleteAccount\.passwordLabel/i);
    fireEvent.change(passwordInput, { target: { value: 'wrong-pass' } });
    fireEvent.click(
      screen.getByRole('button', { name: /settings\.deleteAccount\.confirmButton/i }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('settings.deleteAccount.errorIncorrect');
    });
  });

  it('closes the dialog and clears password when cancel is clicked', async () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthValue,
      user: makeUser(),
    });

    render(
      <SettingsSearchProvider>
        <DeleteAccountSection />
      </SettingsSearchProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /settings\.deleteAccount\.button/i }));
    const passwordInput = await screen.findByLabelText(/settings\.deleteAccount\.passwordLabel/i);
    fireEvent.change(passwordInput, { target: { value: 'some-pass' } });

    const cancelButton = screen.getByRole('button', {
      name: /settings\.deleteAccount\.cancelButton/i,
    });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/settings\.deleteAccount\.confirmTitle/i)).not.toBeInTheDocument();
    });

    // Re-open and check password is empty
    fireEvent.click(screen.getByRole('button', { name: /settings\.deleteAccount\.button/i }));
    const newPasswordInput = await screen.findByLabelText(
      /settings\.deleteAccount\.passwordLabel/i,
    );
    expect((newPasswordInput as HTMLInputElement).value).toBe('');
  });
});
