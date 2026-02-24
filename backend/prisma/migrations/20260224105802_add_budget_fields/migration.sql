-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastBudgetAlertSentAt" TIMESTAMP(3),
ADD COLUMN     "monthlyBudget" DECIMAL(65,30);
