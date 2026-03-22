-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "billingMonthShortageDirection" TEXT NOT NULL DEFAULT 'before',
ADD COLUMN     "billingMonthShortageOffset" INTEGER NOT NULL DEFAULT 0;
