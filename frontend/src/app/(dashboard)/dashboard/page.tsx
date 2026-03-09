"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Calendar, CreditCard, TrendingUp, Plus, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
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
  ComposedChart,
} from "recharts";
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
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

type MonthlyPayment = {
  id: string;
  subscriptionId: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  status: "done" | "upcoming";
};

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [selectedChart, setSelectedChart] = useState<"pie" | "bar">("pie");
  const [summary, setSummary] = useState<any>({
    totalMonthlyCost: 0,
    totalYearlyCost: 0,
    activeSubscriptions: 0,
    categoryBreakdown: {},
  });
  const [forecast, setForecast] = useState<any[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [paymentSortBy, setPaymentSortBy] = useState<"date" | "amount">("date");
  const [paymentSortDirection, setPaymentSortDirection] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear());
  const [isPickerOpen, setIsPickerOpen] = useState(false);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const locale = i18n.language === "pl" ? "pl-PL" : "en-US";
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  const sortedMonthlyPayments = useMemo(() => {
    return [...monthlyPayments].sort((a, b) => {
      const baseSort =
        paymentSortBy === "date"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : Number(a.amount) - Number(b.amount);

      if (baseSort !== 0) {
        return paymentSortDirection === "asc" ? baseSort : -baseSort;
      }

      const dateTieBreak = new Date(a.date).getTime() - new Date(b.date).getTime();
      return paymentSortDirection === "asc" ? dateTieBreak : -dateTieBreak;
    });
  }, [monthlyPayments, paymentSortBy, paymentSortDirection]);

  const categoryData = Object.keys(summary.categoryBreakdown).map((key, index) => {
    const chartVar = `--chart-${(index % 5) + 1}`;
    return {
      name: key,
      value: summary.categoryBreakdown[key],
      color: `var(${chartVar})`,
    };
  });

  if (isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-2">
            <CardTitle className="text-md font-medium text-muted-foreground text-center w-full">
              {t('dashboard.totalMonthlyCost')}
            </CardTitle>
            {/* <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div> */}
          </CardHeader>
          <CardContent>
            <div className="text-4xl text-center font-semibold">{formatCurrency(summary.totalMonthlyCost)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-2">
            <CardTitle className="text-md font-medium text-muted-foreground text-center w-full">
              {t('dashboard.totalYearlyCost')}
            </CardTitle>
            {/* <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div> */}
          </CardHeader>
          <CardContent>
            <div className="text-4xl text-center font-semibold">{formatCurrency(summary.totalYearlyCost, 'USD', 0)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-2">
            <CardTitle className="text-md font-medium text-muted-foreground text-center w-full">
              {t('dashboard.monthlyPayments')}
            </CardTitle>
            {/* <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div> */}
          </CardHeader>
          <CardContent>
            <div className="text-4xl text-center font-semibold">{monthlyPayments.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-2">
            <CardTitle className="text-md font-medium text-muted-foreground text-center w-full">
              {t('dashboard.activeSubscriptions')}
            </CardTitle>
            {/* <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary" />
            </div> */}
          </CardHeader>
          <CardContent>
            <div className="text-4xl text-center font-semibold">{summary.activeSubscriptions}</div>
          </CardContent>
        </Card>
      </div>


      {/* Monthly Payments */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{t('dashboard.monthlyPaymentsTitle')}</CardTitle>
              <CardDescription>{t('dashboard.monthlyPaymentsDesc')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={paymentSortBy === "date" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPaymentSortBy("date")}
              >
                {t("dashboard.sortByDate")}
              </Button>
              <Button
                type="button"
                variant={paymentSortBy === "amount" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPaymentSortBy("amount")}
              >
                {t("dashboard.sortByAmount")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="px-3"
                onClick={() =>
                  setPaymentSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
                }
                aria-label={t(
                  paymentSortDirection === "asc"
                    ? "dashboard.sortDirectionAsc"
                    : "dashboard.sortDirectionDesc",
                )}
              >
                {paymentSortDirection === "asc" ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedMonthlyPayments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {t('dashboard.noMonthlyPayments')}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedMonthlyPayments.map((payment) => (
                <div
                  key={payment.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-colors gap-3 ${payment.status === "done"
                    ? "border-dashed bg-muted opacity-70"
                    : "bg-card hover:bg-accent/50"
                    }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={payment.status === "done" ? "font-medium line-through" : "font-medium"}>
                          {payment.name}
                        </p>
                        {payment.status === "done" ? (
                          <Badge variant="secondary">{t("dashboard.paymentDone")}</Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t(`subscriptions.modal.categories.${payment.category}`)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <p
                        className={
                          payment.status === "done" ? "font-semibold line-through" : "font-semibold"
                        }
                      >
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.date)}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Forecast */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>{t('dashboard.forecast')}</CardTitle>
            <CardDescription>{t('dashboard.forecastDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: any, name?: string) => [
                    `$${Number(value || 0).toFixed(2)}`,
                    name
                  ]}
                />
                <Legend iconType="circle" />
                <Bar
                  yAxisId="right"
                  dataKey="cumulativeAmount"
                  name={t("dashboard.cumulativeSpending")}
                  fill="var(--chart-bar)"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="amount"
                  name={t("dashboard.monthlySpending")}
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ fill: "var(--primary)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
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
                  <Tooltip
                    formatter={(value: any, name?: string) => [
                      `$${Number(value || 0).toFixed(2)}`,
                      t(`subscriptions.modal.categories.${name || ''}`, { defaultValue: name })
                    ]}
                  />
                </PieChart>
              ) : (
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tickFormatter={(value) => t(`subscriptions.modal.categories.${value}`, { defaultValue: value })}
                  />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(label: any) => t(`subscriptions.modal.categories.${label}`, { defaultValue: label })}
                    formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, t("subscriptions.modal.amount")]}
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
    </div>
  );
}
