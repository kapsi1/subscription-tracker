export interface Settings {
  defaultReminderEnabled: boolean;
  defaultReminderDays: string;
  emailNotifications: boolean;
  emailAddress: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookSecret: string;
  dailyDigest: boolean;
  weeklyReport: boolean;
  monthlyBudget: string;
  pushEnabled: boolean;
  currency: string;
}
