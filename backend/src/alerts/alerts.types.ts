import type { AlertType, ReminderUnit } from '@prisma/client';

export interface AlertJobData {
  alertId: string;
  subscriptionId: string;
  type: AlertType;
  daysBefore: number;
  unit: ReminderUnit;
  userEmail: string;
  userName?: string;
  subscriptionName: string;
  amount: number;
  currency: string;
}

export interface BudgetAlertJobData {
  userEmail: string;
  userName?: string;
  amount: number;
  budget: number;
  currency: string;
}
