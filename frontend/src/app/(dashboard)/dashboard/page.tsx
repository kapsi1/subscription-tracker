"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Calendar, CreditCard, TrendingUp, Plus, Bell } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SubscriptionModal, Subscription } from "@/components/subscription-modal";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [selectedChart, setSelectedChart] = useState<"pie" | "bar">("pie");
  const [summary, setSummary] = useState<any>({
    totalMonthlyCost: 0,
    totalYearlyCost: 0,
    activeSubscriptions: 0,
    categoryBreakdown: {},
  });
  const [forecast, setForecast] = useState<any[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, forecastRes, subsRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/forecast?months=12"),
        api.get("/subscriptions"),
      ]);

      setSummary(summaryRes.data);
      setForecast(forecastRes.data);

      // Calculate upcoming payments from subscriptions (next 30 days)
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const upcoming = subsRes.data
        .filter((sub: any) => {
          if (!sub.isActive || !sub.nextBillingDate) return false;
          const nextDate = new Date(sub.nextBillingDate);
          return nextDate >= now && nextDate <= thirtyDaysFromNow;
        })
        .sort((a: any, b: any) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
        .slice(0, 5); // Take top 5

      setUpcomingPayments(upcoming);
    } catch (err: any) {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => `$${(Number(value) || 0).toFixed(2)}`;
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const locale = i18n.language === "pl" ? "pl-PL" : "en-US";
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setModalOpen(true);
  };

  const handleSave = async (subscription: Partial<Subscription>) => {
    try {
      if (subscription.id) {
        // Edit existing
        const { id, ...updateData } = subscription;
        await api.patch(`/subscriptions/${id}`, updateData);
        toast.success(t('subscriptions.updateSuccess', { defaultValue: 'Subscription updated' }));
        fetchDashboardData(); // Refresh all data
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(t('subscriptions.saveError', { defaultValue: 'Failed to save subscription' }));
    }
  };

  const categoryData = Object.keys(summary.categoryBreakdown).map((key, index) => {
    const colors = ["#4F46E5", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b"];
    return {
      name: key,
      value: summary.categoryBreakdown[key],
      color: colors[index % colors.length],
    };
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <Link href="/subscriptions">
          <Button className="gap-2 sm:w-auto">
            <Plus className="w-4 h-4" />
            {t('dashboard.manageSubscriptions')}
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalMonthlyCost')}
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(summary.totalMonthlyCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.currentlyTracked')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalYearlyCost')}
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(summary.totalYearlyCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.projectedAnnual')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.upcomingPayments')}
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-pink-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{upcomingPayments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.next30Days')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.activeSubscriptions')}
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-cyan-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.currentlyTracked')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Forecast */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.forecast')}</CardTitle>
            <CardDescription>{t('dashboard.forecastDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, t("subscriptions.modal.amount")]}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={{ fill: "#4F46E5", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('dashboard.costByCategory')}</CardTitle>
                <CardDescription>{t('dashboard.categoryBreakdownDesc')}</CardDescription>
              </div>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={selectedChart === "pie" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedChart("pie")}
                  className="h-7 text-xs"
                >
                  {t('dashboard.pie')}
                </Button>
                <Button
                  variant={selectedChart === "bar" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedChart("bar")}
                  className="h-7 text-xs"
                >
                  {t('dashboard.bar')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {selectedChart === "pie" ? (
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${t(`subscriptions.modal.categories.${entry.name}`)}: $${entry.value.toFixed(2)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                </PieChart>
              ) : (
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, t("subscriptions.modal.amount")]}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{t('dashboard.upcomingPaymentsTitle')}</CardTitle>
          <CardDescription>{t('dashboard.upcomingPaymentsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingPayments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {t('dashboard.noUpcomingPayments')}
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingPayments.map((payment) => (
                <div
                  key={payment.id}
                  onClick={() => handleEdit(payment)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{payment.name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t(`subscriptions.modal.categories.${payment.category}`)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.nextBillingDate)}
                      </p>
                    </div>
                    <Badge variant="outline" className="hidden sm:inline-flex">
                      {t(`subscriptions.modal.categories.${payment.category}`)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SubscriptionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        subscription={editingSubscription}
        onSave={handleSave}
      />
    </div>
  );
}
