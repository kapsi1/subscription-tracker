"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LoadingState } from "@/components/loading-state";
import { useAuth } from "@/components/auth-provider";
import { SummaryCards } from "./_components/SummaryCards";
import { MonthlyPayments, MonthlyPayment } from "./_components/MonthlyPayments";
import { MonthlyForecast } from "./_components/MonthlyForecast";
import { CostByCategory } from "./_components/CostByCategory";
import { SubscriptionModal, Subscription } from "@/components/subscription-modal";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>({
    totalMonthlyCost: 0,
    totalYearlyCost: 0,
    activeSubscriptions: 0,
    categoryBreakdown: {},
  });
  const [forecast, setForecast] = useState<any[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear());
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const fetchDashboardData = async (date: Date) => {
    setIsLoading(true);
    try {
      const month = date.getMonth();
      const year = date.getFullYear();

      const [summaryRes, forecastRes, monthlyPaymentsRes] = await Promise.all([
        api.get(`/dashboard/summary?month=${month}&year=${year}`),
        api.get("/dashboard/forecast?months=12"),
        api.get(`/dashboard/monthly-payments?month=${month}&year=${year}`),
      ]);

      setSummary(summaryRes.data);

      const forecastWithCumulative = summaryRes.data && forecastRes.data.reduce((acc: any[], item: any, index: number) => {
        const previousCumulative = index > 0 ? acc[index - 1].cumulativeAmount : 0;
        acc.push({
          ...item,
          cumulativeAmount: previousCumulative + item.amount
        });
        return acc;
      }, []);
      setForecast(forecastWithCumulative || []);
      setMonthlyPayments(monthlyPaymentsRes.data || []);
    } catch (err: any) {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate]);

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const handleResetMonth = () => {
    const now = new Date();
    setSelectedDate(now);
    setPickerYear(now.getFullYear());
  };

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedDate(new Date(pickerYear, monthIndex, 1));
    setIsPickerOpen(false);
  };

  const handleEditSubscription = async (id: string) => {
    try {
      const res = await api.get(`/subscriptions/${id}`);
      setEditingSubscription(res.data);
      setModalOpen(true);
    } catch (err) {
      toast.error(t('subscriptions.loadError', { defaultValue: 'Failed to load subscription details' }));
    }
  };

  const handleSaveSubscription = async (subscription: Partial<Subscription>) => {
    try {
      if (subscription.id) {
        const { id, ...updateData } = subscription;
        await api.patch(`/subscriptions/${id}`, updateData);
        toast.success(t('subscriptions.updateSuccess'));
        // Refresh dashboard data
        fetchDashboardData(selectedDate);
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(t('subscriptions.saveError', { defaultValue: 'Failed to save subscription' }));
      throw err;
    }
  };

  if (isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  const monthlyPaymentsDoneCount = monthlyPayments.filter(
    (payment) => payment.status === "done",
  ).length;

  const greetingName =
    user?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.greeting", { name: greetingName })}
          </p>
          <h1 className="text-3xl font-semibold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/50 border rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8"
              aria-label={t("common.previous")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <DropdownMenu
              open={isPickerOpen}
              onOpenChange={(open) => {
                setIsPickerOpen(open);
                if (open) setPickerYear(selectedDate.getFullYear());
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="min-w-[140px] font-medium hover:bg-accent/50 focus-visible:ring-0">
                  {selectedDate.toLocaleDateString(i18n.language === "pl" ? "pl-PL" : "en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="p-3 w-64">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPickerYear(prev => prev - 1); }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="font-semibold text-sm">{pickerYear}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPickerYear(prev => prev + 1); }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {monthNames.map((month, index) => {
                    const isSelected = selectedDate.getMonth() === index && selectedDate.getFullYear() === pickerYear;
                    return (
                      <Button
                        key={month}
                        variant={isSelected ? "default" : "ghost"}
                        className="h-9 w-full text-xs font-medium"
                        onClick={() => handleMonthSelect(index)}
                      >
                        {i18n.language === "pl"
                          ? new Date(2000, index).toLocaleDateString("pl-PL", { month: "short" })
                          : month
                        }
                      </Button>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8"
              aria-label={t("common.next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetMonth}
              className="text-xs px-2 h-7 ml-1"
            >
              {t("dashboard.thisMonth")}
            </Button>
          </div>
          <Link href="/subscriptions">
            <Button className="gap-2 sm:w-auto">
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

      <MonthlyPayments 
        monthlyPayments={monthlyPayments} 
        onEdit={handleEditSubscription}
      />

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
