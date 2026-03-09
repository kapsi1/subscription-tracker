-- AlterTable
ALTER TABLE "User" ADD COLUMN     "webhookSecret" TEXT;

-- CreateIndex
CREATE INDEX "Alert_subscriptionId_idx" ON "Alert"("subscriptionId");

-- CreateIndex
CREATE INDEX "PaymentHistory_subscriptionId_idx" ON "PaymentHistory"("subscriptionId");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
