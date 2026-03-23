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

vi.mock('@/components/ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
    id,
  }: {
    checked: boolean;
    onCheckedChange: (v: boolean) => void;
    id: string;
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      data-testid="reminder-toggle"
    />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  // biome-ignore lint/a11y/noLabelWithoutControl: <bla>
  Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
}));

vi.mock('lucide-react', () => ({
  Bell: () => null,
}));

describe('ReminderSection', () => {
  const baseProps = {
    defaultReminderEnabled: false,
    defaultReminders: [],
    onSettingsChange: vi.fn(),
    onRequestPushPermission: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
  };

  it('does NOT render ReminderList when toggle is off', () => {
    render(<ReminderSection {...baseProps} defaultReminderEnabled={false} />);
    expect(screen.queryByTestId('reminder-list')).toBeNull();
  });

  it('renders ReminderList when toggle is on', () => {
    render(<ReminderSection {...baseProps} defaultReminderEnabled={true} />);
    expect(screen.getByTestId('reminder-list')).toBeTruthy();
  });

  it('calls onSettingsChange with defaultReminderEnabled=true when toggle is turned on', () => {
    const onSettingsChange = vi.fn();
    render(
      <ReminderSection
        {...baseProps}
        defaultReminderEnabled={false}
        onSettingsChange={onSettingsChange}
      />,
    );
    fireEvent.click(screen.getByTestId('reminder-toggle'));
    expect(onSettingsChange).toHaveBeenCalledWith({ defaultReminderEnabled: true });
  });

  it('calls onSettingsChange with defaultReminderEnabled=false and empty reminders when toggled off', () => {
    const onSettingsChange = vi.fn();
    render(
      <ReminderSection
        {...baseProps}
        defaultReminderEnabled={true}
        onSettingsChange={onSettingsChange}
      />,
    );
    fireEvent.click(screen.getByTestId('reminder-toggle'));
    expect(onSettingsChange).toHaveBeenCalledWith({ defaultReminderEnabled: false });
    expect(onSettingsChange).toHaveBeenCalledWith({ defaultReminders: [] });
  });

  it('initializes ReminderList with defaultReminders mapped from props', () => {
    const defaultReminders = [{ id: 'x', type: 'email' as const, value: 7, unit: 'days' as const }];
    render(
      <ReminderSection
        {...baseProps}
        defaultReminderEnabled={true}
        defaultReminders={defaultReminders}
      />,
    );
    expect(screen.getByTestId('reminder-count').textContent).toBe('1');
  });

  it('calls onSettingsChange with stripped reminders when ReminderList onChange fires', () => {
    const onSettingsChange = vi.fn();
    render(
      <ReminderSection
        {...baseProps}
        defaultReminderEnabled={true}
        onSettingsChange={onSettingsChange}
      />,
    );
    fireEvent.click(screen.getByTestId('trigger-change'));
    expect(onSettingsChange).toHaveBeenCalledWith({
      defaultReminders: [{ type: 'email', value: 5, unit: 'days' }],
    });
  });
});
