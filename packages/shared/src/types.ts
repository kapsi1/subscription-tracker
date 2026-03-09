export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextBillingDate?: string;
  category: string;
  isActive?: boolean;
  reminderEnabled?: boolean;
  reminderDays?: number;
}

export interface Settings {
  name?: string;
  defaultReminderEnabled: boolean;
  defaultReminderDays: number;
  emailNotifications: boolean;
  emailAddress?: string;
  webhookEnabled: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  dailyDigest: boolean;
  weeklyReport: boolean;
  monthlyBudget?: number | null;
  pushEnabled?: boolean;
  currency: string;
  language?: string;
  theme?: string;
  accentColor?: string;
  dashboardSortBy?: string;
  dashboardSortOrder?: string;
  showPaidPayments?: boolean;
}

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

export enum BillingCycle {
  monthly = 'monthly',
  yearly = 'yearly',
  custom = 'custom',
}
