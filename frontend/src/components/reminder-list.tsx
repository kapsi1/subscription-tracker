'use client';

import type { ReminderUnit } from '@subtracker/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export interface ReminderRow {
  id: string;
  type: 'email' | 'webpush';
  value: number;
  unit: ReminderUnit;
}

interface ReminderListProps {
  reminders: ReminderRow[];
  onChange: (reminders: ReminderRow[]) => void;
  context: 'modal' | 'settings';
  onRequestPushPermission?: () => Promise<boolean>;
  maxReminders?: number;
}

export function ReminderList({
  reminders,
  onChange,
  context,
  onRequestPushPermission,
  maxReminders = 5,
}: ReminderListProps) {
  const { t } = useTranslation();

  const addReminder = () => {
    if (reminders.length >= maxReminders) return;
    onChange([
      ...reminders,
      { id: crypto.randomUUID(), type: 'webpush', value: 1, unit: 'days' },
    ]);
  };

  const removeReminder = (id: string) => {
    onChange(reminders.filter((r) => r.id !== id));
  };

  const updateReminder = async (id: string, field: keyof ReminderRow, rawValue: unknown) => {
    if (field === 'type' && rawValue === 'webpush' && onRequestPushPermission) {
      const granted = await onRequestPushPermission();
      if (!granted) return; // revert — don't update
    }
    onChange(
      reminders.map((r) =>
        r.id === id
          ? {
              ...r,
              [field]: field === 'value' ? Math.max(1, Number(rawValue)) : rawValue,
            }
          : r,
      ),
    );
  };

  return (
    <div className="space-y-2">
      {reminders.map((reminder) => (
        <div key={reminder.id} className="flex items-center gap-2">
          <Select
            value={reminder.type}
            onValueChange={(v) => updateReminder(reminder.id, 'type', v)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="webpush">
                {t('subscriptions.modal.reminderTypeNotification')}
              </SelectItem>
              <SelectItem value="email">{t('subscriptions.modal.reminderTypeEmail')}</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            min="1"
            className="w-16"
            value={reminder.value}
            onChange={(e) => updateReminder(reminder.id, 'value', e.target.value)}
          />

          <Select
            value={reminder.unit}
            onValueChange={(v) => updateReminder(reminder.id, 'unit', v)}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">
                {t('subscriptions.modal.reminderUnitMinutes')}
              </SelectItem>
              <SelectItem value="hours">{t('subscriptions.modal.reminderUnitHours')}</SelectItem>
              <SelectItem value="days">{t('subscriptions.modal.reminderUnitDays')}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeReminder(reminder.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}

      {reminders.length < maxReminders && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={addReminder}
        >
          <Plus className="w-4 h-4" />
          {t('subscriptions.modal.addReminder')}
        </Button>
      )}

      {context === 'modal' && reminders.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t('subscriptions.modal.reminderSettingsHint')}
        </p>
      )}
    </div>
  );
}
