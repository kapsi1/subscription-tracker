'use client';

import type { Settings } from '@subtracker/shared';
import { BadgeDollarSign, SendHorizonal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchHighlight, useSettingsSearch } from './SettingsSearchContext';

interface BudgetSectionProps {
  monthlyBudget: number | null | undefined;
  currency: string;
  onSettingsChange: (updates: Partial<Settings>) => void;
  showTestControls: boolean;
  testBudgetEmailLanguage: 'en' | 'pl';
  setTestBudgetEmailLanguage: (lang: 'en' | 'pl') => void;
  onTestBudgetEmail: () => void;
  isSendingBudgetTestEmail: boolean;
  isSendingTestEmail: boolean;
}

export function BudgetSection({
  monthlyBudget,
  currency,
  onSettingsChange,
  showTestControls,
  testBudgetEmailLanguage,
  setTestBudgetEmailLanguage,
  onTestBudgetEmail,
  isSendingBudgetTestEmail,
  isSendingTestEmail,
}: BudgetSectionProps) {
  const { t } = useTranslation();
  const { searchQuery } = useSettingsSearch();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BadgeDollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>
              <SearchHighlight text={t('settings.budget.title')} query={searchQuery} />
            </CardTitle>
            <CardDescription>
              <SearchHighlight text={t('settings.budget.desc')} query={searchQuery} />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="monthlyBudget">
            <SearchHighlight text={t('settings.budget.label')} query={searchQuery} />
          </Label>
          <div className="flex gap-2 items-center">
            <span className="text-muted-foreground font-medium text-sm">{currency}</span>
            <Input
              id="monthlyBudget"
              name="monthlyBudget"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 50.00"
              className="max-w-32"
              value={monthlyBudget ?? ''}
              onChange={(e) =>
                onSettingsChange({
                  monthlyBudget: e.target.value === '' ? null : parseFloat(e.target.value),
                })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            <SearchHighlight text={t('settings.budget.help')} query={searchQuery} />
          </p>
        </div>
        {showTestControls && (
          <div className="border-t pt-4 space-y-3">
            <div className="text-sm font-medium leading-none">
              {t('settings.notifications.email.testBudgetTitle')}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('settings.notifications.email.testBudgetDesc')}
            </p>

            <div className="space-y-2">
              <div className="text-sm font-medium leading-none">
                {t('settings.notifications.email.testLanguage')}
              </div>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="testBudgetEmailLanguage-en"
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    id="testBudgetEmailLanguage-en"
                    type="radio"
                    name="testBudgetEmailLanguage"
                    value="en"
                    checked={testBudgetEmailLanguage === 'en'}
                    onChange={() => setTestBudgetEmailLanguage('en')}
                  />
                  English
                </label>
                <label
                  htmlFor="testBudgetEmailLanguage-pl"
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    id="testBudgetEmailLanguage-pl"
                    type="radio"
                    name="testBudgetEmailLanguage"
                    value="pl"
                    checked={testBudgetEmailLanguage === 'pl'}
                    onChange={() => setTestBudgetEmailLanguage('pl')}
                  />
                  Polski
                </label>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onTestBudgetEmail}
              disabled={isSendingTestEmail || isSendingBudgetTestEmail}
              className="gap-1.5"
            >
              <SendHorizonal className="w-4 h-4" />
              {isSendingBudgetTestEmail
                ? t('settings.notifications.email.testSending')
                : t('settings.notifications.email.testBudgetSend')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
