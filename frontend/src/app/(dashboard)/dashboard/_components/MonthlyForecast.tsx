'use client';

import type { ForecastItem } from '@subscription-tracker/shared';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface MonthlyForecastProps {
  forecast: ForecastItem[];
  currency?: string;
}

interface RechartsPayloadItem {
  payload: unknown;
  value: number | string | undefined;
  dataKey?: string | number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: RechartsPayloadItem[];
  label?: string;
  t: TFunction;
  currency?: string;
}

const CustomTooltip = ({ active, payload, label, t, currency = 'USD' }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ForecastItem;
    const monthlySpending = payload.find((p) => p.dataKey === 'amount')?.value;
    const cumulativeSpending = payload.find((p) => p.dataKey === 'cumulativeAmount')?.value;
    const payments = data.payments || [];

    return (
      <div className="z-100 min-w-[180px] max-w-[220px] rounded-md bg-card p-2 text-xs text-foreground border shadow-lg animate-in fade-in-0 zoom-in-95">
        <div className="flex justify-between items-baseline font-bold mb-1 border-b pb-1">
          <span>
            {label} {data.year}
          </span>
          <span className="text-[10px] font-medium opacity-70">
            {t('subscriptions.paymentCount', { count: payments.length })}
          </span>
        </div>

        <div className="space-y-0.5">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t('dashboard.monthly')}</span>
            <span className="font-bold text-primary">
              {formatCurrency(Number(monthlySpending || 0), currency)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t('dashboard.cumulative')}</span>
            <span className="font-bold text-chart-bar">
              {formatCurrency(Number(cumulativeSpending || 0), currency)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function MonthlyForecast({ forecast, currency = 'USD' }: MonthlyForecastProps) {
  const { t } = useTranslation();

  return (
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
              height={30}
            />
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value, currency, 0)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value, currency, 0)}
            />
            <Tooltip
              content={<CustomTooltip t={t} currency={currency} />}
              cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
            />
            <Legend iconType="circle" />
            <Bar
              yAxisId="right"
              dataKey="cumulativeAmount"
              name={t('dashboard.cumulativeSpending')}
              fill="var(--chart-bar)"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="amount"
              name={t('dashboard.monthlySpending')}
              stroke="var(--primary)"
              strokeWidth={3}
              dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
