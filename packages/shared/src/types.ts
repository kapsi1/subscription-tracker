export type ReminderUnit = 'minutes' | 'hours' | 'days';

export interface Reminder {
  id?: string;
  type: 'email' | 'webpush';
  value: number;
  unit: ReminderUnit;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  intervalDays?: number | null;
  billingDays?: number[];
  billingMonthShortageOffset?: number;
  billingMonthShortageDirection?: 'before' | 'after' | 'skip';
  nextBillingDate?: string;
  category: string;
  isActive?: boolean;
  reminderEnabled?: boolean;
  reminders?: Reminder[];
  /** @deprecated use reminders instead */
  reminderDays?: number;
}

export interface Settings {
  name?: string;
  defaultReminderEnabled?: boolean;
  defaultReminders: Reminder[];
  /** @deprecated use defaultReminders instead */
  defaultReminderDays?: number;
  emailNotifications: boolean;
  dailyDigest: boolean;
  previousWeekReport: boolean;
  nextWeekReport: boolean;
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

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  order: number;
}

export interface PaymentHistory {
  id: string;
  subscriptionId: string | null;
  subscriptionName: string;
  amount: number;
  currency: string;
  paidAt: string;
}

export enum BillingCycle {
  weekly = 'weekly',
  monthly = 'monthly',
  yearly = 'yearly',
  custom = 'custom',
}
