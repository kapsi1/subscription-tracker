-- DropForeignKey
ALTER TABLE "PaymentHistory" DROP CONSTRAINT "PaymentHistory_subscriptionId_fkey";

-- AlterTable: add columns as nullable first
ALTER TABLE "PaymentHistory" ADD COLUMN "subscriptionName" TEXT,
ADD COLUMN "userId" TEXT;

-- Backfill existing rows from Subscription
UPDATE "PaymentHistory"
SET "userId" = s."userId",
    "subscriptionName" = s."name"
FROM "Subscription" s
WHERE "PaymentHistory"."subscriptionId" = s."id";

-- Make columns non-nullable after backfill
ALTER TABLE "PaymentHistory" ALTER COLUMN "subscriptionName" SET NOT NULL;
ALTER TABLE "PaymentHistory" ALTER COLUMN "userId" SET NOT NULL;

-- Make subscriptionId nullable
ALTER TABLE "PaymentHistory" ALTER COLUMN "subscriptionId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PaymentHistory_userId_idx" ON "PaymentHistory"("userId");

-- AddForeignKey (subscriptionId -> Subscription with SET NULL)
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey (userId -> User with CASCADE)
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
