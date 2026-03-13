'use client';

import type { Settings } from '@subtracker/shared';
import { SendHorizonal, Webhook } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SearchHighlight, useSettingsSearch } from './SettingsSearchContext';

interface WebhookSectionProps {
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookSecret: string;
  onSettingsChange: (updates: Partial<Settings>) => void;
  showTestControls: boolean;
  onTestWebhook: () => void;
  isSendingWebhookTest: boolean;
}

export function WebhookSection({
  webhookEnabled,
  webhookUrl,
  webhookSecret,
  onSettingsChange,
  showTestControls,
  onTestWebhook,
  isSendingWebhookTest,
}: WebhookSectionProps) {
  const { t } = useTranslation();
  const { searchQuery } = useSettingsSearch();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Webhook className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <CardTitle>
              <SearchHighlight
                text={t('settings.notifications.webhook.title')}
                query={searchQuery}
              />
            </CardTitle>
            <CardDescription>
              <SearchHighlight
                text={t('settings.notifications.webhook.desc')}
                query={searchQuery}
              />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
          <div className="space-y-0.5">
            <Label htmlFor="webhookEnabled">
              <SearchHighlight
                text={t('settings.notifications.webhook.enable')}
                query={searchQuery}
              />
            </Label>
            <p className="text-sm text-muted-foreground">
              <SearchHighlight
                text={t('settings.notifications.webhook.enableDesc')}
                query={searchQuery}
              />
            </p>
          </div>
          <Switch
            id="webhookEnabled"
            checked={webhookEnabled}
            onCheckedChange={(checked) => onSettingsChange({ webhookEnabled: checked })}
          />
        </div>

        {webhookEnabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">
                <SearchHighlight
                  text={t('settings.notifications.webhook.url')}
                  query={searchQuery}
                />
              </Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://your-domain.com/webhook"
                value={webhookUrl}
                onChange={(e) => onSettingsChange({ webhookUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                <SearchHighlight
                  text={t('settings.notifications.webhook.urlDesc')}
                  query={searchQuery}
                />
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookSecret">
                <SearchHighlight
                  text={t('settings.notifications.webhook.secret')}
                  query={searchQuery}
                />
              </Label>
              <Input
                id="webhookSecret"
                type="password"
                placeholder="Secret key"
                value={webhookSecret}
                onChange={(e) => onSettingsChange({ webhookSecret: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                <SearchHighlight
                  text={t('settings.notifications.webhook.secretDesc')}
                  query={searchQuery}
                />
              </p>
            </div>

            {showTestControls && (
              <div className="border-t pt-4 space-y-3">
                <Label>{t('settings.notifications.webhook.testTitle')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.notifications.webhook.testDesc')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTestWebhook}
                  disabled={isSendingWebhookTest || !webhookUrl}
                  className="gap-1.5"
                >
                  <SendHorizonal className="w-4 h-4" />
                  {isSendingWebhookTest
                    ? t('settings.notifications.webhook.testSending')
                    : t('settings.notifications.webhook.testSend')}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
