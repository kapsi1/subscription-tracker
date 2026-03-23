'use client';

import { Calendar, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/components/ui/utils';
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

function SummaryCard({
  title,
  icon,
  value,
  iconBgClass,
}: {
  title: string;
  icon: ReactNode;
  value: ReactNode;
  iconBgClass: string;
}) {
  return (
    <Card className="min-w-0 animate-card-in bg-card transition-all hover:bg-accent/50 @container">
      <CardHeader className="flex flex-col items-center justify-center px-4 pt-4 pb-0 text-center sm:px-6 sm:pt-6">
        <div className="min-w-0 flex items-center justify-center">
          <div
            className={cn(
              'flex h-9 w-9 min-w-9 items-center justify-center rounded-lg mr-4 lg:mr-0',
              iconBgClass,
            )}
          >
            {icon}
          </div>
          <CardTitle className="min-w-0 text-center text-base font-medium leading-tight text-muted-foreground md:text-lg">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 md:pb-5 lg:pb-6 pt-0">
        <div className="overflow-hidden text-center text-[clamp(1.5rem,14cqw,2.2rem)] font-semibold leading-none whitespace-nowrap sm:text-[clamp(1.5rem,14cqw,2.65rem)] md:text-[clamp(1.5rem,14cqw,3rem)] lg:text-[clamp(1rem,12cqw,2.4rem)]">
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
        icon={<DollarSign className="w-4 h-4 text-[#3b82f6]" />}
        value={formatCurrency(summary.totalMonthlyCost, summary.currency)}
        iconBgClass="bg-[#3b82f6]/10"
      />
      <SummaryCard
        title={t('dashboard.totalYearlyCost')}
        icon={<TrendingUp className="w-4 h-4 text-[#10b981]" />}
        value={formatCurrency(summary.totalYearlyCost, summary.currency, 0)}
        iconBgClass="bg-[#10b981]/10"
      />
      <SummaryCard
        title={t('dashboard.monthlyPayments')}
        icon={<Calendar className="w-4 h-4 text-[#f59e0b]" />}
        value={`${monthlyPaymentsDoneCount}/${monthlyPaymentsTotalCount}`}
        iconBgClass="bg-[#f59e0b]/10"
      />
      <SummaryCard
        title={t('dashboard.activeSubscriptions')}
        icon={<CreditCard className="w-4 h-4 text-[#8b5cf6]" />}
        value={summary.activeSubscriptions}
        iconBgClass="bg-[#8b5cf6]/10"
      />
    </div>
  );
}
