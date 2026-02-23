-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "reminderDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultReminderDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "defaultReminderEnabled" BOOLEAN NOT NULL DEFAULT true;
