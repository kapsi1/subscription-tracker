"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PiggyBank, SendHorizonal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Settings } from "@subscription-tracker/shared";

interface BudgetSectionProps {
  monthlyBudget: number | null | undefined;
  currency: string;
  onSettingsChange: (updates: Partial<Settings>) => void;
  showTestControls: boolean;
  testBudgetEmailLanguage: "en" | "pl";
  setTestBudgetEmailLanguage: (lang: "en" | "pl") => void;
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

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <CardTitle>{t('settings.budget.title')}</CardTitle>
            <CardDescription>
              {t('settings.budget.desc')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="monthlyBudget">{t('settings.budget.label')}</Label>
          <div className="flex gap-2 items-center">
            <span className="text-muted-foreground font-medium text-sm">{currency}</span>
            <Input
              id="monthlyBudget"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 50.00"
              className="max-w-32"
              value={monthlyBudget ?? ""}
              onChange={(e) =>
                onSettingsChange({ monthlyBudget: e.target.value === "" ? null : parseFloat(e.target.value) })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t('settings.budget.help')}
          </p>
        </div>
        {showTestControls && (
          <div className="border-t pt-4 space-y-3">
            <Label>{t("settings.notifications.email.testBudgetTitle")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("settings.notifications.email.testBudgetDesc")}
            </p>

            <div className="space-y-2">
              <Label className="text-sm">{t("settings.notifications.email.testLanguage")}</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="testBudgetEmailLanguage"
                    value="en"
                    checked={testBudgetEmailLanguage === "en"}
                    onChange={() => setTestBudgetEmailLanguage("en")}
                  />
                  English
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="testBudgetEmailLanguage"
                    value="pl"
                    checked={testBudgetEmailLanguage === "pl"}
                    onChange={() => setTestBudgetEmailLanguage("pl")}
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
                ? t("settings.notifications.email.testSending")
                : t("settings.notifications.email.testBudgetSend")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
