"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Smartphone, SendHorizonal } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PushNotificationsSectionProps {
  pushEnabled: boolean;
  onPushToggle: (checked: boolean) => void;
  isTogglingPush: boolean;
  showTestControls: boolean;
  testDelay: string;
  setTestDelay: (delay: string) => void;
  onTestPush: () => void;
  isSendingTest: boolean;
  onResetPush: () => void;
}

export function PushNotificationsSection({
  pushEnabled,
  onPushToggle,
  isTogglingPush,
  showTestControls,
  testDelay,
  setTestDelay,
  onTestPush,
  isSendingTest,
  onResetPush,
}: PushNotificationsSectionProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>{t('settings.notifications.push.title')}</CardTitle>
            <CardDescription>{t('settings.notifications.push.desc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
          <div className="space-y-0.5">
            <Label htmlFor="pushEnabled">{t('settings.notifications.push.enable')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('settings.notifications.push.enableDesc')}
            </p>
          </div>
          <Switch
            id="pushEnabled"
            checked={pushEnabled}
            onCheckedChange={onPushToggle}
            disabled={isTogglingPush}
          />
        </div>

        {showTestControls && (
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Test Notification</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground h-7"
              onClick={onResetPush}
            >
              Reset & Clear
            </Button>
          </div>
          {!pushEnabled && (
            <p className="text-sm text-muted-foreground">Enable push notifications above if possible, or try sending anyway if you already allowed it.</p>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="testDelay" className="text-sm text-muted-foreground whitespace-nowrap">Delay (s)</Label>
              <Input
                id="testDelay"
                type="number"
                min="0"
                max="300"
                className="max-w-20"
                value={testDelay}
                onChange={(e) => setTestDelay(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onTestPush}
              disabled={isSendingTest}
              className="gap-1.5"
            >
              <SendHorizonal className="w-4 h-4" />
              {isSendingTest ? "Sending..." : "Send Test"}
            </Button>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
