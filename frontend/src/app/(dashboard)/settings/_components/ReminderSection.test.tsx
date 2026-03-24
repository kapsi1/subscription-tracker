import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReminderSection } from './ReminderSection';

afterEach(cleanup);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./SettingsSearchContext', () => ({
  useSettingsSearch: () => ({ searchQuery: '' }),
  SearchHighlight: ({ text }: { text: string }) => <>{text}</>,
}));

vi.mock('@/components/reminder-list', () => ({
  ReminderList: ({
    reminders,
    onChange,
  }: {
    reminders: Array<{ id: string; type: string; value: number; unit: string }>;
    onChange: (r: typeof reminders) => void;
  }) => (
    <div data-testid="reminder-list">
      <span data-testid="reminder-count">{reminders.length}</span>
      <button
        type="button"
        data-testid="trigger-change"
        onClick={() => onChange([{ id: 'new', type: 'email', value: 5, unit: 'days' }])}
      >
        change
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => ({
  Bell: () => null,
}));

describe('ReminderSection', () => {
  const baseProps = {
    defaultReminders: [],
    onSettingsChange: vi.fn(),
    onRequestPushPermission: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
  };

  it('renders ReminderList by default', () => {
    render(<ReminderSection {...baseProps} />);
    expect(screen.getByTestId('reminder-list')).toBeTruthy();
  });

  it('initializes ReminderList with defaultReminders mapped from props', () => {
    const defaultReminders = [{ id: 'x', type: 'email' as const, value: 7, unit: 'days' as const }];
    render(<ReminderSection {...baseProps} defaultReminders={defaultReminders} />);
    expect(screen.getByTestId('reminder-count').textContent).toBe('1');
  });

  it('calls onSettingsChange with stripped reminders when ReminderList onChange fires', () => {
    const onSettingsChange = vi.fn();
    render(<ReminderSection {...baseProps} onSettingsChange={onSettingsChange} />);
    fireEvent.click(screen.getByTestId('trigger-change'));
    expect(onSettingsChange).toHaveBeenCalledWith({
      defaultReminders: [{ type: 'email', value: 5, unit: 'days' }],
    });
  });
});
