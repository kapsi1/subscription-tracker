"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, CreditCard, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  summary: {
    totalMonthlyCost: number;
    totalYearlyCost: number;
    activeSubscriptions: number;
    currency: string;
  };
  monthlyPaymentsCount: number;
}

export function SummaryCards({ summary, monthlyPaymentsCount }: SummaryCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-col items-center justify-center pb-2 px-4 h-24 text-center">
          <div className="flex flex-row items-center justify-center gap-2">
            <CardTitle className="text-md font-medium text-muted-foreground leading-tight">
              {t('dashboard.totalMonthlyCost')}
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl text-center font-semibold">{formatCurrency(summary.totalMonthlyCost, summary.currency)}</div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-col items-center justify-center pb-2 px-4 h-24 text-center">
          <div className="flex flex-row items-center justify-center gap-2">
            <CardTitle className="text-md font-medium text-muted-foreground leading-tight">
              {t('dashboard.totalYearlyCost')}
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl text-center font-semibold">{formatCurrency(summary.totalYearlyCost, summary.currency, 0)}</div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-col items-center justify-center pb-2 px-4 h-24 text-center">
          <div className="flex flex-row items-center justify-center gap-2">
            <CardTitle className="text-md font-medium text-muted-foreground leading-tight">
              {t('dashboard.monthlyPayments')}
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl text-center font-semibold">{monthlyPaymentsCount}</div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-col items-center justify-center pb-2 px-4 h-24 text-center">
          <div className="flex flex-row items-center justify-center gap-2">
            <CardTitle className="text-md font-medium text-muted-foreground leading-tight">
              {t('dashboard.activeSubscriptions')}
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl text-center font-semibold">{summary.activeSubscriptions}</div>
        </CardContent>
      </Card>
    </div>
  );
}
