"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Settings } from "@/types/settings";

interface ReminderSectionProps {
  defaultReminderEnabled: boolean;
  defaultReminderDays: string;
  onSettingsChange: (updates: Partial<Settings>) => void;
}

export function ReminderSection({
  defaultReminderEnabled,
  defaultReminderDays,
  onSettingsChange,
}: ReminderSectionProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <CardTitle>{t('settings.notifications.default.title')}</CardTitle>
            <CardDescription>
              {t('settings.notifications.default.desc')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
          <div className="space-y-0.5">
            <Label htmlFor="defaultEnabled">{t('settings.notifications.default.enable')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('settings.notifications.default.enableDesc')}
            </p>
          </div>
          <Switch
            id="defaultEnabled"
            checked={defaultReminderEnabled}
            onCheckedChange={(checked) =>
              onSettingsChange({ defaultReminderEnabled: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultDays">{t('settings.notifications.default.days')}</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="defaultDays"
              type="number"
              min="1"
              max="30"
              className="max-w-24"
              value={defaultReminderDays}
              onChange={(e) =>
                onSettingsChange({ defaultReminderDays: e.target.value })
              }
            />
            <span className="text-sm text-muted-foreground">
              {t('settings.notifications.default.beforePayment')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('settings.notifications.default.daysDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
