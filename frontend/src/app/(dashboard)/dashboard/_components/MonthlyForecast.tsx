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

const CustomTooltip = ({ active, payload, label, t, i18n }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const monthlySpending = payload.find((p: any) => p.dataKey === 'amount')?.value;
    const cumulativeSpending = payload.find((p: any) => p.dataKey === 'cumulativeAmount')?.value;
    const payments = data.payments || [];

    return (
      <div className="z-100 min-w-[180px] max-w-[220px] rounded-md bg-card p-2 text-xs text-foreground border shadow-lg animate-in fade-in-0 zoom-in-95">
        <div className="flex justify-between items-baseline font-bold mb-1 border-b pb-1">
          <span>{label} {data.year}</span>
          <span className="text-[10px] font-medium opacity-70">
            {payments.length} {payments.length === 1 ? t('subscriptions.payment') : t('subscriptions.payments')}
          </span>
        </div>
        
        <div className="space-y-0.5 mb-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("dashboard.monthly")}</span>
            <span className="font-bold text-primary">${Number(monthlySpending || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("dashboard.cumulative")}</span>
            <span className="font-bold text-chart-bar">${Number(cumulativeSpending || 0).toFixed(2)}</span>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="mt-1 flex flex-col min-h-0">
            <ul className="space-y-0.5 max-h-32 overflow-y-auto custom-scrollbar pr-1 border-t pt-1.5">
              {[...payments]
                .sort((a, b) => {
                  const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
                  if (dateDiff !== 0) return dateDiff;
                  return a.amount - b.amount;
                })
                .map((p: any) => (
                  <li 
                    key={p.id} 
                    className="flex justify-between items-center gap-2 px-1 py-0.5 rounded hover:bg-primary/10 transition-colors cursor-default group/item text-[11px]"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-semibold text-foreground leading-tight" title={p.name}>
                        {p.name}
                      </span>
                      <span className="text-[9px] text-muted-foreground group-hover/item:text-foreground/70 transition-colors">
                        {new Date(p.date).toLocaleDateString(i18n.language === "pl" ? "pl-PL" : "en-US", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <span className="shrink-0 font-bold text-primary whitespace-nowrap">
                      ${Number(p.amount).toFixed(2)}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function MonthlyForecast({ forecast }: MonthlyForecastProps) {
  const { t, i18n } = useTranslation();

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
              content={<CustomTooltip t={t} i18n={i18n} />}
              cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
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
