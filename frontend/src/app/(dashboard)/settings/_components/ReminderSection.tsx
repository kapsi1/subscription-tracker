'use client';

import type { Reminder, Settings } from '@subtracker/shared';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReminderList, type ReminderRow } from '@/components/reminder-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { generateId } from '@/lib/id';
import { SearchHighlight, useSettingsSearch } from './SettingsSearchContext';

interface ReminderSectionProps {
  defaultReminderEnabled: boolean;
  defaultReminders: Reminder[];
  onSettingsChange: (updates: Partial<Settings>) => void;
  onRequestPushPermission: () => Promise<boolean>;
}

export function ReminderSection({
  defaultReminderEnabled,
  defaultReminders,
  onSettingsChange,
  onRequestPushPermission,
}: ReminderSectionProps) {
  const { t } = useTranslation();
  const { searchQuery } = useSettingsSearch();

  const [rows, setRows] = useState<ReminderRow[]>(() =>
    defaultReminders.map((r) => ({
      id: r.id ?? generateId(),
      type: r.type,
      value: r.value,
      unit: r.unit,
    })),
  );

  const handleRemindersChange = (reminders: ReminderRow[]) => {
    setRows(reminders);
    onSettingsChange({
      defaultReminders: reminders.map(({ type, value, unit }) => ({ type, value, unit })),
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <CardTitle>
              <SearchHighlight
                text={t('settings.notifications.default.title')}
                query={searchQuery}
              />
            </CardTitle>
            <CardDescription>
              <SearchHighlight
                text={t('settings.notifications.default.desc')}
                query={searchQuery}
              />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
          <Switch
            id="defaultEnabled"
            checked={defaultReminderEnabled}
            onCheckedChange={(checked) => {
              onSettingsChange({ defaultReminderEnabled: checked });
              if (!checked) {
                setRows([]);
                onSettingsChange({ defaultReminders: [] });
              }
            }}
          />
          <div className="space-y-0.5">
            <Label htmlFor="defaultEnabled" className="cursor-pointer">
              <SearchHighlight
                text={t('settings.notifications.default.enable')}
                query={searchQuery}
              />
            </Label>
            <p className="text-sm text-muted-foreground">
              <SearchHighlight
                text={t('settings.notifications.default.enableDesc')}
                query={searchQuery}
              />
            </p>
          </div>
        </div>

        {defaultReminderEnabled && (
          <ReminderList
            reminders={rows}
            onChange={handleRemindersChange}
            context="settings"
            onRequestPushPermission={onRequestPushPermission}
          />
        )}
      </CardContent>
    </Card>
  );
}
