export interface ForecastPayment {
  id: string;
  name: string;
  amount: number;
  currency: string;
  date: string;
}

export interface ForecastItem {
  month: string;
  year: number;
  amount: number;
  cumulativeAmount?: number;
  currency: string;
  payments: ForecastPayment[];
}

export interface DashboardSummary {
  totalMonthlyCost: number;
  totalYearlyCost: number;
  activeSubscriptions: number;
  categoryBreakdown: Record<string, number>;
  currency: string;
}
