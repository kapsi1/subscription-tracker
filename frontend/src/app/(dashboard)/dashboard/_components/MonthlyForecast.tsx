"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";

interface MonthlyForecastProps {
  forecast: any[];
}

export function MonthlyForecast({ forecast }: MonthlyForecastProps) {
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
  );
}
