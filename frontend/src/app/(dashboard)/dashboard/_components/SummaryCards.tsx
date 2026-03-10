'use client';

import { Calendar, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface SummaryCardsProps {
  summary: {
    totalMonthlyCost: number;
    totalYearlyCost: number;
    activeSubscriptions: number;
    currency: string;
  };
  monthlyPaymentsDoneCount: number;
  monthlyPaymentsTotalCount: number;
}

function SummaryCard({ title, icon, value }: { title: string; icon: ReactNode; value: ReactNode }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-col items-center justify-center pb-2 px-4 h-24 text-center">
        <div className="flex flex-row items-center justify-center gap-2">
          <CardTitle className="text-md font-medium text-muted-foreground leading-tight">
            {title}
          </CardTitle>
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl text-center font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({
  summary,
  monthlyPaymentsDoneCount,
  monthlyPaymentsTotalCount,
}: SummaryCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <SummaryCard
        title={t('dashboard.totalMonthlyCost')}
        icon={<DollarSign className="w-4 h-4 text-primary" />}
        value={formatCurrency(summary.totalMonthlyCost, summary.currency)}
      />
      <SummaryCard
        title={t('dashboard.totalYearlyCost')}
        icon={<TrendingUp className="w-4 h-4 text-primary" />}
        value={formatCurrency(summary.totalYearlyCost, summary.currency, 0)}
      />
      <SummaryCard
        title={t('dashboard.monthlyPayments')}
        icon={<Calendar className="w-4 h-4 text-primary" />}
        value={`${monthlyPaymentsDoneCount}/${monthlyPaymentsTotalCount}`}
      />
      <SummaryCard
        title={t('dashboard.activeSubscriptions')}
        icon={<CreditCard className="w-4 h-4 text-primary" />}
        value={summary.activeSubscriptions}
      />
    </div>
  );
}
