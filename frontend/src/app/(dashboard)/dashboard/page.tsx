'use client';

import type {
  Category,
  DashboardSummary,
  ForecastItem,
  PaymentHistory,
  Subscription,
} from '@subtracker/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { InstallAppButton } from '@/components/install-app-button';
import { LoadingState } from '@/components/loading-state';
import api from '@/lib/api';
import { type MonthlyPayment, MonthlyPayments } from './_components/MonthlyPayments';
import { MonthlyPaymentsCalendar } from './_components/MonthlyPaymentsCalendar';
import { MonthPicker } from './_components/MonthPicker';
import { SummaryCards } from './_components/SummaryCards';

const SubscriptionModal = dynamic(
  () =>
    import('@/components/subscription-modal').then((module) => ({
      default: module.SubscriptionModal,
    })),
  { ssr: false },
);
const PaymentDetailsModal = dynamic(
  () =>
    import('@/components/payment-details-modal').then((module) => ({
      default: module.PaymentDetailsModal,
    })),
  { ssr: false },
);
const DayPaymentsModal = dynamic(
  () =>
    import('./_components/DayPaymentsModal').then((module) => ({
      default: module.DayPaymentsModal,
    })),
  { ssr: false },
);
const MonthlyForecast = dynamic(
  () =>
    import('./_components/MonthlyForecast').then((module) => ({
      default: module.MonthlyForecast,
    })),
  {
    ssr: false,
    loading: () => <DashboardSectionSkeleton minHeight={350} />,
  },
);
const CostByCategory = dynamic(
  () =>
    import('./_components/CostByCategory').then((module) => ({
      default: module.CostByCategory,
    })),
  {
    ssr: false,
    loading: () => <DashboardSectionSkeleton minHeight={300} />,
  },
);

function DashboardSectionSkeleton({ minHeight }: { minHeight: number }) {
  return (
    <div
      className="rounded-xl border bg-card/60 p-6 shadow-sm"
      style={{ minHeight }}
      aria-hidden="true"
    >
      <div className="h-6 w-40 rounded-md bg-muted" />
      <div className="mt-3 h-4 w-64 rounded-md bg-muted/80" />
      <div className="mt-6 h-[calc(100%-3rem)] min-h-[220px] rounded-xl bg-muted/50" />
    </div>
  );
}

function DeferredSection({
  children,
  minHeight,
  rootMargin = '200px',
}: {
  children: React.ReactNode;
  minHeight: number;
  rootMargin?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isVisible) {
      return;
    }

    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={ref}>{isVisible ? children : <DashboardSectionSkeleton minHeight={minHeight} />}</div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | null>(null);
  const handleDateChange = (newDate: Date) => {
    const direction =
      newDate.getFullYear() > selectedDate.getFullYear() ||
      (newDate.getFullYear() === selectedDate.getFullYear() &&
        newDate.getMonth() > selectedDate.getMonth())
        ? 'next'
        : 'prev';
    setSlideDirection(direction);
    setSelectedDate(newDate);
  };

  // Subscription modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  // Payment details modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<PaymentHistory | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [selectedCalendarPayments, setSelectedCalendarPayments] = useState<MonthlyPayment[]>([]);
  const [dayPaymentsModalOpen, setDayPaymentsModalOpen] = useState(false);

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

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
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

  const isLoading =
    isSummaryLoading || isForecastLoading || isPaymentsLoading || isCategoriesLoading;

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

  const openStandalonePayment = (payment: MonthlyPayment) => {
    setViewingPayment({
      id: payment.id,
      subscriptionId: null,
      subscriptionName: payment.name,
      amount: payment.amount,
      currency: payment.currency,
      paidAt: payment.date,
    });
    setPaymentModalOpen(true);
  };

  const handleSelectCalendarDay = (date: Date, payments: MonthlyPayment[]) => {
    setSelectedCalendarDate(date);
    setSelectedCalendarPayments(payments);
    setDayPaymentsModalOpen(true);
  };

  const handleSelectCalendarPayment = (payment: MonthlyPayment) => {
    setDayPaymentsModalOpen(false);

    if (payment.subscriptionId) {
      handleEditSubscription(payment.subscriptionId);
      return;
    }

    openStandalonePayment(payment);
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
  const shouldRenderSubscriptionModal = modalOpen || editingSubscription !== null;
  const shouldRenderPaymentModal = paymentModalOpen || viewingPayment !== null;
  const shouldRenderDayPaymentsModal = dayPaymentsModalOpen || selectedCalendarDate !== null;

  return (
    <div className="min-w-0 space-y-6 animate-page-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h1 className="text-3xl font-semibold">{t('dashboard.title')}</h1>
          <InstallAppButton variant="outline" className="sm:hidden" />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <MonthPicker selectedDate={selectedDate} setSelectedDate={handleDateChange} />
        </div>
      </div>

      <div
        key={`${year}-${month}`}
        className={
          slideDirection === 'next'
            ? 'animate-month-next space-y-6'
            : slideDirection === 'prev'
              ? 'animate-month-prev space-y-6'
              : 'space-y-6'
        }
      >
        <SummaryCards
          summary={summary}
          monthlyPaymentsDoneCount={monthlyPaymentsDoneCount}
          monthlyPaymentsTotalCount={monthlyPayments.length}
        />

        <MonthlyPayments
          monthlyPayments={monthlyPayments}
          onEdit={handleEditSubscription}
          onViewPayment={openStandalonePayment}
        />

        <MonthlyPaymentsCalendar
          monthlyPayments={monthlyPayments}
          selectedDate={selectedDate}
          onSelectDay={handleSelectCalendarDay}
        />

        <DeferredSection minHeight={350}>
          <Suspense fallback={<DashboardSectionSkeleton minHeight={350} />}>
            <MonthlyForecast forecast={forecast} currency={summary.currency} />
          </Suspense>
        </DeferredSection>

        <DeferredSection minHeight={300}>
          <Suspense fallback={<DashboardSectionSkeleton minHeight={300} />}>
            <CostByCategory
              categoryBreakdown={summary.categoryBreakdown}
              currency={summary.currency}
              categories={categories}
            />
          </Suspense>
        </DeferredSection>
      </div>

      {shouldRenderSubscriptionModal ? (
        <SubscriptionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          subscription={editingSubscription}
          onSave={handleSaveSubscription}
        />
      ) : null}

      {shouldRenderPaymentModal ? (
        <PaymentDetailsModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          payment={viewingPayment}
        />
      ) : null}

      {shouldRenderDayPaymentsModal ? (
        <DayPaymentsModal
          open={dayPaymentsModalOpen}
          onOpenChange={setDayPaymentsModalOpen}
          selectedDate={selectedCalendarDate}
          payments={selectedCalendarPayments}
          onPaymentSelect={handleSelectCalendarPayment}
        />
      ) : null}
    </div>
  );
}
