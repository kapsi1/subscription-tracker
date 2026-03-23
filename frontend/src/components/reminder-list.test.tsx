import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReminderList, type ReminderRow } from './reminder-list';

afterEach(cleanup);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: React.ReactNode;
  }) => (
    <select data-testid="select" value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

vi.mock('./ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    'data-testid': testId,
    className,
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { 'data-testid'?: string }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={className}
    >
      {children}
    </button>
  ),
}));

vi.mock('./ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

const makeRow = (overrides: Partial<ReminderRow> = {}): ReminderRow => ({
  id: 'r1',
  type: 'email',
  value: 3,
  unit: 'days',
  ...overrides,
});

describe('ReminderList', () => {
  it('renders reminder rows', () => {
    const reminders = [
      makeRow({ id: 'r1', value: 2 }),
      makeRow({ id: 'r2', value: 5, unit: 'hours' }),
    ];
    const { container } = render(
      <ReminderList reminders={reminders} onChange={vi.fn()} context="settings" />,
    );
    const inputs = container.querySelectorAll('input[type="number"]');
    expect(inputs).toHaveLength(2);
  });

  it('calls onChange with new row when Add is clicked', () => {
    const onChange = vi.fn();
    render(<ReminderList reminders={[]} onChange={onChange} context="settings" />);

    fireEvent.click(screen.getByText('subscriptions.modal.addReminder'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [newRows] = onChange.mock.calls[0];
    expect(newRows).toHaveLength(1);
    expect(newRows[0]).toMatchObject({ type: 'webpush', value: 1, unit: 'days' });
    expect(typeof newRows[0].id).toBe('string');
  });

  it('calls onChange without the deleted row when trash is clicked', () => {
    const onChange = vi.fn();
    const reminders = [makeRow({ id: 'a' }), makeRow({ id: 'b' })];
    const { container } = render(
      <ReminderList reminders={reminders} onChange={onChange} context="settings" />,
    );
    // Trash buttons are inside row divs — click the first one
    const trashButtons = container.querySelectorAll('.space-y-2 > div > button');
    fireEvent.click(trashButtons[0]);
    expect(onChange).toHaveBeenCalledWith([makeRow({ id: 'b' })]);
  });

  it('hides add button when at maxReminders limit', () => {
    const reminders = Array.from({ length: 5 }, (_, i) => makeRow({ id: String(i) }));
    render(
      <ReminderList reminders={reminders} onChange={vi.fn()} context="settings" maxReminders={5} />,
    );
    expect(screen.queryByText('subscriptions.modal.addReminder')).toBeNull();
  });

  it('shows add button when below max', () => {
    const reminders = Array.from({ length: 4 }, (_, i) => makeRow({ id: String(i) }));
    render(
      <ReminderList reminders={reminders} onChange={vi.fn()} context="settings" maxReminders={5} />,
    );
    expect(screen.getByText('subscriptions.modal.addReminder')).toBeTruthy();
  });

  it('shows settings hint in modal context when rows exist', () => {
    render(<ReminderList reminders={[makeRow()]} onChange={vi.fn()} context="modal" />);
    expect(screen.getByText('subscriptions.modal.reminderSettingsHint')).toBeTruthy();
  });

  it('does NOT show settings hint in settings context', () => {
    render(<ReminderList reminders={[makeRow()]} onChange={vi.fn()} context="settings" />);
    expect(screen.queryByText('subscriptions.modal.reminderSettingsHint')).toBeNull();
  });

  it('does NOT show settings hint in modal context when no rows', () => {
    render(<ReminderList reminders={[]} onChange={vi.fn()} context="modal" />);
    expect(screen.queryByText('subscriptions.modal.reminderSettingsHint')).toBeNull();
  });

  it('requests push permission and updates row if granted', async () => {
    const onChange = vi.fn();
    const onRequestPushPermission = vi.fn().mockResolvedValue(true);
    const reminders = [makeRow({ id: 'r1', type: 'email' })];

    const { container } = render(
      <ReminderList
        reminders={reminders}
        onChange={onChange}
        context="settings"
        onRequestPushPermission={onRequestPushPermission}
      />,
    );

    // First select is the type select
    const typeSelect = container.querySelectorAll('select')[0];
    fireEvent.change(typeSelect, { target: { value: 'webpush' } });

    await waitFor(() => expect(onRequestPushPermission).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.calls[0][0][0].type).toBe('webpush');
  });

  it('does NOT update row if push permission is denied', async () => {
    const onChange = vi.fn();
    const onRequestPushPermission = vi.fn().mockResolvedValue(false);
    const reminders = [makeRow({ id: 'r1', type: 'email' })];

    const { container } = render(
      <ReminderList
        reminders={reminders}
        onChange={onChange}
        context="settings"
        onRequestPushPermission={onRequestPushPermission}
      />,
    );

    const typeSelect = container.querySelectorAll('select')[0];
    fireEvent.change(typeSelect, { target: { value: 'webpush' } });

    await waitFor(() => expect(onRequestPushPermission).toHaveBeenCalledTimes(1));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clamps value input to minimum of 1', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ReminderList
        reminders={[makeRow({ id: 'r1', value: 3 })]}
        onChange={onChange}
        context="settings"
      />,
    );

    const valueInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: '0' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][0].value).toBe(1);
  });
});
