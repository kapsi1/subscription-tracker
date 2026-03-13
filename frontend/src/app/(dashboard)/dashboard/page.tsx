'use client';

import type { DashboardSummary, ForecastItem, Subscription } from '@subtracker/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { LoadingState } from '@/components/loading-state';
import { SubscriptionModal } from '@/components/subscription-modal';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { CostByCategory } from './_components/CostByCategory';
import { MonthlyForecast } from './_components/MonthlyForecast';
import { type MonthlyPayment, MonthlyPayments } from './_components/MonthlyPayments';
import { MonthPicker } from './_components/MonthPicker';
import { SummaryCards } from './_components/SummaryCards';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary', month, year],
    queryFn: async () => {
      const res = await api.get(`/dashboard/summary?month=${month}&year=${year}`);
      return res.data;
    },
  });

  const { data: rawForecast, isLoading: isForecastLoading } = useQuery<ForecastItem[]>({
    queryKey: ['dashboard', 'forecast'],
    queryFn: async () => {
      const res = await api.get('/dashboard/forecast?months=12');
      return res.data;
    },
  });

  const { data: monthlyPayments = [], isLoading: isPaymentsLoading } = useQuery<MonthlyPayment[]>({
    queryKey: ['dashboard', 'payments', month, year],
    queryFn: async () => {
      const res = await api.get(`/dashboard/monthly-payments?month=${month}&year=${year}`);
      return res.data;
    },
  });

  const forecast = useMemo(() => {
    if (!summary || !rawForecast) return [];

    return rawForecast.reduce((acc: ForecastItem[], item: ForecastItem, index: number) => {
      const previousCumulative = index > 0 ? acc[index - 1].cumulativeAmount || 0 : 0;
      acc.push({
        ...item,
        cumulativeAmount: previousCumulative + item.amount,
      });
      return acc;
    }, []);
  }, [summary, rawForecast]);

  const isLoading = isSummaryLoading || isForecastLoading || isPaymentsLoading;

  const handleEditSubscription = async (id: string) => {
    try {
      const res = await api.get(`/subscriptions/${id}`);
      setEditingSubscription(res.data);
      setModalOpen(true);
    } catch (_err) {
      toast.error(
        t('subscriptions.loadError', { defaultValue: 'Failed to load subscription details' }),
      );
    }
  };

  const handleSaveSubscription = async (subscription: Partial<Subscription>) => {
    try {
      if (subscription.id) {
        const { id, ...updateData } = subscription;
        await api.patch(`/subscriptions/${id}`, updateData);
        toast.success(t('subscriptions.updateSuccess'));

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      toast.error(t('subscriptions.saveError', { defaultValue: 'Failed to save subscription' }));
      throw err;
    }
  };

  if (isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  if (!summary) {
    return null;
  }

  const monthlyPaymentsDoneCount = monthlyPayments.filter(
    (payment) => payment.status === 'done',
  ).length;

  const greetingName = user?.name?.trim() || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {t('dashboard.greeting', { name: greetingName })}
          </p>
          <h1 className="text-3xl font-semibold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex w-auto min-w-0 flex-wrap items-center justify-end gap-2 lg:w-auto lg:flex-nowrap">
          <MonthPicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
          <Link href="/subscriptions" className="shrink-0">
            <Button className="w-auto gap-2 whitespace-nowrap text-center">
              {t('dashboard.manageSubscriptions')}
            </Button>
          </Link>
        </div>
      </div>

      <SummaryCards
        summary={summary}
        monthlyPaymentsDoneCount={monthlyPaymentsDoneCount}
        monthlyPaymentsTotalCount={monthlyPayments.length}
      />

      <MonthlyPayments monthlyPayments={monthlyPayments} onEdit={handleEditSubscription} />

      <MonthlyForecast forecast={forecast} currency={summary.currency} />

      <CostByCategory categoryBreakdown={summary.categoryBreakdown} currency={summary.currency} />

      <SubscriptionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        subscription={editingSubscription}
        onSave={handleSaveSubscription}
      />
    </div>
  );
}
