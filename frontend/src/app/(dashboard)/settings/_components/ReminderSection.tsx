'use client';

import type { Settings } from '@subtracker/shared';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SearchHighlight, useSettingsSearch } from './SettingsSearchContext';

interface ReminderSectionProps {
  defaultReminderEnabled: boolean;
  defaultReminderDays: number;
  onSettingsChange: (updates: Partial<Settings>) => void;
}

export function ReminderSection({
  defaultReminderEnabled,
  defaultReminderDays,
  onSettingsChange,
}: ReminderSectionProps) {
  const { t } = useTranslation();
  const { searchQuery } = useSettingsSearch();

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
            onCheckedChange={(checked) => onSettingsChange({ defaultReminderEnabled: checked })}
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

        <div className="space-y-2">
          <Label htmlFor="defaultDays">
            <SearchHighlight text={t('settings.notifications.default.days')} query={searchQuery} />
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              id="defaultDays"
              name="defaultDays"
              type="number"
              min="1"
              max="30"
              className="max-w-24"
              value={defaultReminderDays.toString()}
              onChange={(e) =>
                onSettingsChange({ defaultReminderDays: parseInt(e.target.value, 10) || 0 })
              }
            />
            <span className="text-sm text-muted-foreground">
              <SearchHighlight
                text={t('settings.notifications.default.beforePayment')}
                query={searchQuery}
              />
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            <SearchHighlight
              text={t('settings.notifications.default.daysDesc')}
              query={searchQuery}
            />
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
