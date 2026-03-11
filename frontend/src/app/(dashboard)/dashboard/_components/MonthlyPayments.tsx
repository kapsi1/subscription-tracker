'use client';

import type { Category } from '@subscription-tracker/shared';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, CreditCard } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import api from '@/lib/api';
import { formatCurrency, getCategoryStyle } from '@/lib/utils';

export type MonthlyPayment = {
  id: string;
  subscriptionId: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  status: 'done' | 'upcoming';
};

interface MonthlyPaymentsProps {
  monthlyPayments: MonthlyPayment[];
  onEdit?: (subscriptionId: string) => void;
}

export function MonthlyPayments({ monthlyPayments, onEdit }: MonthlyPaymentsProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [paymentSortBy, setPaymentSortBy] = useState<'date' | 'amount'>('date');
  const [paymentSortDirection, setPaymentSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showPaid, setShowPaid] = useState<boolean>(true);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  const getCategoryColor = (name: string) =>
    categories.find((c) => c.name === name)?.color ?? '#64748b';

  useEffect(() => {
    if (user?.dashboardSortBy) {
      setPaymentSortBy(user.dashboardSortBy as 'date' | 'amount');
    }
    if (user?.dashboardSortOrder) {
      setPaymentSortDirection(user.dashboardSortOrder as 'asc' | 'desc');
    }
    if (user?.showPaidPayments !== undefined) {
      setShowPaid(user.showPaidPayments);
    }
  }, [user]);

  const saveSettings = async (patch: Record<string, unknown>) => {
    try {
      await api.patch('/users/settings', patch);
    } catch (err) {
      console.error('Failed to save settings', err);
    }
  };

  const handleSortByChange = (sortBy: 'date' | 'amount') => {
    setPaymentSortBy(sortBy);
    saveSettings({ dashboardSortBy: sortBy, dashboardSortOrder: paymentSortDirection });
  };

  const handleSortDirectionToggle = () => {
    const newDirection = paymentSortDirection === 'asc' ? 'desc' : 'asc';
    setPaymentSortDirection(newDirection);
    saveSettings({ dashboardSortBy: paymentSortBy, dashboardSortOrder: newDirection });
  };

  const handleToggleShowPaid = (checked: boolean) => {
    setShowPaid(checked);
    saveSettings({ showPaidPayments: checked });
  };

  const sortedMonthlyPayments = useMemo(() => {
    const filtered = showPaid
      ? monthlyPayments
      : monthlyPayments.filter((p) => p.status !== 'done');

    return [...filtered].sort((a, b) => {
      const baseSort =
        paymentSortBy === 'date'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : Number(a.amount) - Number(b.amount);

      if (baseSort !== 0) {
        return paymentSortDirection === 'asc' ? baseSort : -baseSort;
      }

      const dateTieBreak = new Date(a.date).getTime() - new Date(b.date).getTime();
      return paymentSortDirection === 'asc' ? dateTieBreak : -dateTieBreak;
    });
  }, [monthlyPayments, paymentSortBy, paymentSortDirection, showPaid]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const locale = i18n.language === 'pl' ? 'pl-PL' : 'en-US';
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{t('dashboard.monthlyPaymentsTitle')}</CardTitle>
            <CardDescription>{t('dashboard.monthlyPaymentsDesc')}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 mr-2">
              <Switch id="show-paid" checked={showPaid} onCheckedChange={handleToggleShowPaid} />
              <Label htmlFor="show-paid" className="text-sm font-medium cursor-pointer">
                {t('dashboard.showPaid')}
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={paymentSortBy === 'date' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => handleSortByChange('date')}
              >
                {t('dashboard.sortByDate')}
              </Button>
              <Button
                type="button"
                variant={paymentSortBy === 'amount' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => handleSortByChange('amount')}
              >
                {t('dashboard.sortByAmount')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="px-3"
                onClick={handleSortDirectionToggle}
                aria-label={t(
                  paymentSortDirection === 'asc'
                    ? 'dashboard.sortDirectionAsc'
                    : 'dashboard.sortDirectionDesc',
                )}
              >
                {paymentSortDirection === 'asc' ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
              </Button>
            </div>
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
              <button
                key={payment.id}
                type="button"
                onClick={() => onEdit?.(payment.subscriptionId)}
                className={`w-full text-left flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-colors gap-3 cursor-pointer ${
                  payment.status === 'done'
                    ? 'border-dashed bg-muted opacity-70 hover:opacity-100 hover:bg-muted/80'
                    : 'bg-card hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 max-w-full">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-medium truncate cursor-pointer max-w-[180px] sm:max-w-[250px] md:max-w-[350px]">
                              {payment.name}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[300px] wrap-break-word">
                            {payment.name}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {payment.status === 'done' ? (
                        <Badge variant="secondary" className="shrink-0">
                          {t('dashboard.paymentDone')}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(`subscriptions.modal.categories.${payment.category}`)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="hidden sm:flex min-w-[120px] justify-end">
                    <Badge
                      variant="outline"
                      style={getCategoryStyle(getCategoryColor(payment.category), 'dashboard')}
                    >
                      {t(`subscriptions.modal.categories.${payment.category}`, {
                        defaultValue: payment.category,
                      })}
                    </Badge>
                  </div>
                  <div className="text-right min-w-[90px]">
                    <p className="font-semibold">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatDate(payment.date)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
