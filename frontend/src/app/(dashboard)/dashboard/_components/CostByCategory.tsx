"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from "recharts";

import { formatCurrency } from "@/lib/utils";

interface CostByCategoryProps {
  categoryBreakdown: Record<string, number>;
  currency?: string;
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

export function CostByCategory({ categoryBreakdown, currency = "USD" }: CostByCategoryProps) {
  const { t } = useTranslation();
  const [selectedChart, setSelectedChart] = useState<"pie" | "bar">("pie");

  const categoryData = Object.keys(categoryBreakdown).map((key, index) => {
    const chartVar = `--chart-${(index % 5) + 1}`;
    return {
      name: key,
      value: categoryBreakdown[key],
      color: `var(${chartVar})`,
    };
  });

  const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name, value }: PieLabelProps) => {
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
        textAnchor={x > cx ? "start" : "end"}
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
                label={renderPieLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | string | undefined) => [
                  formatCurrency(Number(value || 0), currency),
                  t("subscriptions.modal.amount")
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
              <YAxis 
                stroke="#64748b"
                tickFormatter={(value) => formatCurrency(value, currency, 0)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
                labelFormatter={(label: string | number) => t(`subscriptions.modal.categories.${label}`, { defaultValue: String(label) })}
                formatter={(value: number | string | undefined) => [formatCurrency(Number(value || 0), currency), t("subscriptions.modal.amount")]}
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
  );
}
