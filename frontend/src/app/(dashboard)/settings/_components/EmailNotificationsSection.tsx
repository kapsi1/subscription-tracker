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
  previousWeekReport: boolean;
  nextWeekReport: boolean;
  onSettingsChange: (updates: Partial<Settings>) => void;
  showTestControls: boolean;
  testEmailLanguage: 'en' | 'pl';
  setTestEmailLanguage: (lang: 'en' | 'pl') => void;
  onTestEmail: () => void;
  onTestDailyDigest: () => void;
  onTestPreviousWeekReport: () => void;
  onTestNextWeekReport: () => void;
  isLoading: {
    email: boolean;
    daily: boolean;
    previousWeekly: boolean;
    nextWeekly: boolean;
  };
}

export function EmailNotificationsSection({
  emailNotifications,
  emailAddress,
  dailyDigest,
  previousWeekReport,
  nextWeekReport,
  onSettingsChange,
  showTestControls,
  testEmailLanguage,
  setTestEmailLanguage,
  onTestEmail,
  onTestDailyDigest,
  onTestPreviousWeekReport,
  onTestNextWeekReport,
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
        <div className="flex items-center gap-3 hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
          <Switch
            id="emailEnabled"
            checked={emailNotifications}
            onCheckedChange={(checked) => onSettingsChange({ emailNotifications: checked })}
          />
          <div className="space-y-0.5">
            <Label htmlFor="emailEnabled" className="cursor-pointer">
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

            <div className="border-t pt-2 mb-2">
              <div className="flex items-center gap-3 hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
                <Switch
                  id="dailyDigest"
                  checked={dailyDigest}
                  onCheckedChange={(checked) => onSettingsChange({ dailyDigest: checked })}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="dailyDigest" className="cursor-pointer">
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
              </div>
            </div>

            <div className="border-t pt-2 mb-2">
              <div className="flex items-center gap-3 hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
                <Switch
                  id="previousWeekReport"
                  checked={previousWeekReport}
                  onCheckedChange={(checked) => onSettingsChange({ previousWeekReport: checked })}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="previousWeekReport" className="cursor-pointer">
                    <SearchHighlight
                      text={t('settings.notifications.email.previousWeekReport')}
                      query={searchQuery}
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <SearchHighlight
                      text={t('settings.notifications.email.previousWeekReportDesc')}
                      query={searchQuery}
                    />
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-2 mb-2">
              <div className="flex items-center gap-3 hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
                <Switch
                  id="nextWeekReport"
                  checked={nextWeekReport}
                  onCheckedChange={(checked) => onSettingsChange({ nextWeekReport: checked })}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="nextWeekReport" className="cursor-pointer">
                    <SearchHighlight
                      text={t('settings.notifications.email.nextWeekReport')}
                      query={searchQuery}
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <SearchHighlight
                      text={t('settings.notifications.email.nextWeekReportDesc')}
                      query={searchQuery}
                    />
                  </p>
                </div>
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
                    disabled={isLoading.email || isLoading.daily || isLoading.previousWeekly || isLoading.nextWeekly}
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
                    disabled={isLoading.email || isLoading.daily || isLoading.previousWeekly || isLoading.nextWeekly}
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
                    onClick={onTestPreviousWeekReport}
                    disabled={isLoading.email || isLoading.daily || isLoading.previousWeekly || isLoading.nextWeekly}
                    className="gap-1.5"
                  >
                    <SendHorizonal className="w-4 h-4" />
                    {isLoading.previousWeekly
                      ? t('settings.notifications.email.testSending')
                      : 'Test Previous Week Report'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onTestNextWeekReport}
                    disabled={isLoading.email || isLoading.daily || isLoading.previousWeekly || isLoading.nextWeekly}
                    className="gap-1.5"
                  >
                    <SendHorizonal className="w-4 h-4" />
                    {isLoading.nextWeekly
                      ? t('settings.notifications.email.testSending')
                      : 'Test Next Week Report'}
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
