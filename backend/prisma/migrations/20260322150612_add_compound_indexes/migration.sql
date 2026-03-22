-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "billingMonthShortageOffset" SET DEFAULT 1;

-- CreateIndex
CREATE INDEX "PaymentHistory_userId_paidAt_idx" ON "PaymentHistory"("userId", "paidAt");

-- CreateIndex
CREATE INDEX "Subscription_userId_isActive_idx" ON "Subscription"("userId", "isActive");
