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

interface CostByCategoryProps {
  categoryBreakdown: Record<string, number>;
}

export function CostByCategory({ categoryBreakdown }: CostByCategoryProps) {
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
  );
}
