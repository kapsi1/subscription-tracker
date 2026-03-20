'use client';

import type { Settings } from '@subtracker/shared';
import { Mail, SendHorizonal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SearchHighlight, useSettingsSearch } from './SettingsSearchContext';

interface EmailNotificationsSectionProps {
  emailNotifications: boolean;
  emailAddress: string;
  dailyDigest: boolean;
  weeklyReport: boolean;
  onSettingsChange: (updates: Partial<Settings>) => void;
  showTestControls: boolean;
  testEmailLanguage: 'en' | 'pl';
  setTestEmailLanguage: (lang: 'en' | 'pl') => void;
  onTestEmail: () => void;
  onTestDailyDigest: () => void;
  onTestWeeklyReport: () => void;
  isLoading: {
    email: boolean;
    daily: boolean;
    weekly: boolean;
  };
}

export function EmailNotificationsSection({
  emailNotifications,
  emailAddress,
  dailyDigest,
  weeklyReport,
  onSettingsChange,
  showTestControls,
  testEmailLanguage,
  setTestEmailLanguage,
  onTestEmail,
  onTestDailyDigest,
  onTestWeeklyReport,
  isLoading,
}: EmailNotificationsSectionProps) {
  const { t } = useTranslation();
  const { searchQuery } = useSettingsSearch();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>
              <SearchHighlight text={t('settings.notifications.email.title')} query={searchQuery} />
            </CardTitle>
            <CardDescription>
              <SearchHighlight text={t('settings.notifications.email.desc')} query={searchQuery} />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
          <div className="space-y-0.5">
            <Label htmlFor="emailEnabled">
              <SearchHighlight
                text={t('settings.notifications.email.enable')}
                query={searchQuery}
              />
            </Label>
            <p className="text-sm text-muted-foreground">
              <SearchHighlight
                text={t('settings.notifications.email.enableDesc')}
                query={searchQuery}
              />
            </p>
          </div>
          <Switch
            id="emailEnabled"
            checked={emailNotifications}
            onCheckedChange={(checked) => onSettingsChange({ emailNotifications: checked })}
          />
        </div>

        {emailNotifications && (
          <>
            <div className="space-y-2">
              <Label htmlFor="emailAddress">
                <SearchHighlight
                  text={t('settings.notifications.email.address')}
                  query={searchQuery}
                />
              </Label>
              <Input
                id="emailAddress"
                name="emailAddress"
                type="email"
                placeholder="you@example.com"
                value={emailAddress}
                onChange={(e) => onSettingsChange({ emailAddress: e.target.value })}
              />
            </div>

            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
                <div className="space-y-0.5">
                  <Label htmlFor="dailyDigest">
                    <SearchHighlight
                      text={t('settings.notifications.email.daily')}
                      query={searchQuery}
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <SearchHighlight
                      text={t('settings.notifications.email.dailyDesc')}
                      query={searchQuery}
                    />
                  </p>
                </div>
                <Switch
                  id="dailyDigest"
                  checked={dailyDigest}
                  onCheckedChange={(checked) => onSettingsChange({ dailyDigest: checked })}
                />
              </div>
            </div>

            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklyReport">
                    <SearchHighlight
                      text={t('settings.notifications.email.weekly')}
                      query={searchQuery}
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <SearchHighlight
                      text={t('settings.notifications.email.weeklyDesc')}
                      query={searchQuery}
                    />
                  </p>
                </div>
                <Switch
                  id="weeklyReport"
                  checked={weeklyReport}
                  onCheckedChange={(checked) => onSettingsChange({ weeklyReport: checked })}
                />
              </div>
            </div>

            {showTestControls && (
              <div className="border-t pt-4 space-y-3">
                <div className="text-sm font-medium leading-none">
                  {t('settings.notifications.email.testTitle')}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('settings.notifications.email.testDesc')}
                </p>

                <div className="space-y-2">
                  <div className="text-sm font-medium leading-none">
                    {t('settings.notifications.email.testLanguage')}
                  </div>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="testEmailLanguage-en"
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        id="testEmailLanguage-en"
                        type="radio"
                        name="testEmailLanguage"
                        value="en"
                        checked={testEmailLanguage === 'en'}
                        onChange={() => setTestEmailLanguage('en')}
                      />
                      English
                    </label>
                    <label
                      htmlFor="testEmailLanguage-pl"
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        id="testEmailLanguage-pl"
                        type="radio"
                        name="testEmailLanguage"
                        value="pl"
                        checked={testEmailLanguage === 'pl'}
                        onChange={() => setTestEmailLanguage('pl')}
                      />
                      Polski
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onTestEmail}
                    disabled={isLoading.email || isLoading.daily || isLoading.weekly}
                    className="gap-1.5"
                  >
                    <SendHorizonal className="w-4 h-4" />
                    {isLoading.email
                      ? t('settings.notifications.email.testSending')
                      : t('settings.notifications.email.testSend')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onTestDailyDigest}
                    disabled={isLoading.email || isLoading.daily || isLoading.weekly}
                    className="gap-1.5"
                  >
                    <SendHorizonal className="w-4 h-4" />
                    {isLoading.daily
                      ? t('settings.notifications.email.testSending')
                      : 'Test Daily Digest'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onTestWeeklyReport}
                    disabled={isLoading.email || isLoading.daily || isLoading.weekly}
                    className="gap-1.5"
                  >
                    <SendHorizonal className="w-4 h-4" />
                    {isLoading.weekly
                      ? t('settings.notifications.email.testSending')
                      : 'Test Weekly Report'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
