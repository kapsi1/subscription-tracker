-- CreateIndex
CREATE INDEX "PaymentHistory_paidAt_idx" ON "PaymentHistory"("paidAt");

-- CreateIndex
CREATE INDEX "Subscription_nextBillingDate_idx" ON "Subscription"("nextBillingDate");
