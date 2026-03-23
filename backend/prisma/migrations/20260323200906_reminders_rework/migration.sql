-- CreateEnum
CREATE TYPE "ReminderUnit" AS ENUM ('minutes', 'hours', 'days');

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "unit" "ReminderUnit" NOT NULL DEFAULT 'days';

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "reminderEnabled" SET DEFAULT false;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "defaultReminderEnabled" SET DEFAULT false;

-- CreateTable
CREATE TABLE "UserDefaultReminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "value" INTEGER NOT NULL,
    "unit" "ReminderUnit" NOT NULL DEFAULT 'days',

    CONSTRAINT "UserDefaultReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserDefaultReminder_userId_idx" ON "UserDefaultReminder"("userId");

-- AddForeignKey
ALTER TABLE "UserDefaultReminder" ADD CONSTRAINT "UserDefaultReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: seed UserDefaultReminder from existing user defaults
INSERT INTO "UserDefaultReminder" ("id", "userId", "type", "value", "unit")
SELECT
  gen_random_uuid(),
  id,
  'email'::"AlertType",
  "defaultReminderDays",
  'days'::"ReminderUnit"
FROM "User"
WHERE "defaultReminderEnabled" = true AND "defaultReminderDays" > 0;

-- DataMigration: seed Alert records for subscriptions with reminders but no existing alerts
INSERT INTO "Alert" ("id", "subscriptionId", "type", "daysBefore", "unit", "isEnabled")
SELECT
  gen_random_uuid(),
  s.id,
  'email'::"AlertType",
  s."reminderDays",
  'days'::"ReminderUnit",
  true
FROM "Subscription" s
WHERE s."reminderEnabled" = true
  AND s."reminderDays" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "Alert" a WHERE a."subscriptionId" = s.id
  );
