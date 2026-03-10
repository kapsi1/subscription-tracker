import { AlertType } from '@prisma/client';

export interface AlertJobData {
  alertId: string;
  subscriptionId: string;
  type: AlertType;
  daysBefore: number;
  userEmail: string;
  subscriptionName: string;
  amount: number;
  currency: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface BudgetAlertJobData {
  userEmail: string;
  amount: number;
  budget: number;
  currency: string;
}
