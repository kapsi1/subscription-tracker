import type { AlertType } from '@prisma/client';

export interface AlertJobData {
  alertId: string;
  subscriptionId: string;
  type: AlertType;
  daysBefore: number;
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
