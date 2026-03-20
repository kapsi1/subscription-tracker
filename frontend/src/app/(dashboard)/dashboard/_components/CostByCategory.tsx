'use client';

import type { Category } from '@subtracker/shared';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { formatCurrency } from '@/lib/utils';

interface CostByCategoryProps {
  categoryBreakdown: Record<string, number>;
  currency?: string;
  categories: Category[];
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  name?: string;
  value?: number;
}

interface RechartsPayloadItem {
  color?: string;
  name?: string;
  value?: number | string;
  payload?: {
    color?: string;
    name?: string;
    value?: number | string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: RechartsPayloadItem[];
  label?: string;
  currency: string;
  t: ReturnType<typeof useTranslation>['t'];
}

const CustomTooltip = ({ active, payload, label, currency, t }: CustomTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  const rawCategoryName = label || item.name || item.payload?.name || '';
  const translatedCategoryName = t(`subscriptions.modal.categories.${rawCategoryName}`, {
    defaultValue: rawCategoryName,
  });
  const amount = Number(item.value ?? item.payload?.value ?? 0);
  const color = item.color || item.payload?.color || 'var(--primary)';

  return (
    <div className="z-100 min-w-[180px] max-w-[220px] rounded-md border bg-card p-2 text-xs text-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
      <div className="flex items-center justify-between gap-3 font-bold">
        <span>{translatedCategoryName}</span>
        <span className="flex items-center gap-1.5 text-primary">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          {formatCurrency(amount, currency)}
        </span>
      </div>
    </div>
  );
};

export function CostByCategory({
  categoryBreakdown,
  currency = 'USD',
  categories,
}: CostByCategoryProps) {
  const { t } = useTranslation();
  const [selectedChart, setSelectedChart] = useState<'pie' | 'bar'>('pie');

  const categoryData = Object.keys(categoryBreakdown).map((key) => {
    const categoryColor = categories.find((c) => c.name === key)?.color;
    return {
      name: key,
      value: categoryBreakdown[key],
      color: categoryColor || 'var(--primary)',
    };
  });

  const renderPieLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
    value,
  }: PieLabelProps) => {
    if (
      cx === undefined ||
      cy === undefined ||
      midAngle === undefined ||
      outerRadius === undefined ||
      percent === undefined ||
      !name ||
      value === undefined
    ) {
      return null;
    }

    // Skip narrow slices to avoid stacked collisions; details remain available in the tooltip.
    if (percent < 0.05) {
      return null;
    }

    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return (
      <text
        x={x}
        y={y}
        fill="currentColor"
        fontSize={12}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${t(`subscriptions.modal.categories.${name}`, { defaultValue: name })}: ${formatCurrency(value, currency)}`}
      </text>
    );
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('dashboard.costByCategory')}</CardTitle>
            <CardDescription>{t('dashboard.categoryBreakdownDesc')}</CardDescription>
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={selectedChart === 'pie' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedChart('pie')}
              className="h-7 text-xs"
            >
              {t('dashboard.pie')}
            </Button>
            <Button
              variant={selectedChart === 'bar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedChart('bar')}
              className="h-7 text-xs"
            >
              {t('dashboard.bar')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {selectedChart === 'pie' ? (
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderPieLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currency={currency} t={t} />} />
            </PieChart>
          ) : (
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tickFormatter={(value) =>
                  t(`subscriptions.modal.categories.${value}`, { defaultValue: value })
                }
              />
              <YAxis
                stroke="#64748b"
                tickFormatter={(value) => formatCurrency(value, currency, 0)}
              />
              <Tooltip content={<CustomTooltip currency={currency} t={t} />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {categoryData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
