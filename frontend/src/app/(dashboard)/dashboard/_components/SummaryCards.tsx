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
    <Card className="min-w-0 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex h-20 flex-col justify-center px-6 pb-1 text-center md:h-[5.5rem] lg:h-24">
        <div className="min-w-0 flex items-center justify-center">
          <div className="flex h-9 w-9 min-w-9 items-center justify-center rounded-lg bg-secondary mr-4 lg:mr-0">
            {icon}
          </div>
          <CardTitle className="min-w-0 text-center text-base font-medium leading-tight text-muted-foreground md:text-lg">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-4 md:pb-5 lg:pb-6">
        <div className="overflow-hidden text-center text-[2.65rem] font-semibold leading-none text-balance wrap-break-word md:text-[3rem] lg:text-4xl">
          {value}
        </div>
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
    <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
