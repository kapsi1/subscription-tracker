-- Convert legacy minute/hour reminders to whole days, rounding up so reminders
-- are not delivered later than their previous threshold.
UPDATE "Alert"
SET
  "daysBefore" = CASE
    WHEN "unit" = 'minutes' THEN GREATEST(1, CEIL("daysBefore" / 1440.0)::INTEGER)
    WHEN "unit" = 'hours' THEN GREATEST(1, CEIL("daysBefore" / 24.0)::INTEGER)
    ELSE "daysBefore"
  END,
  "unit" = 'days'
WHERE "unit" IN ('minutes', 'hours');

UPDATE "UserDefaultReminder"
SET
  "value" = CASE
    WHEN "unit" = 'minutes' THEN GREATEST(1, CEIL("value" / 1440.0)::INTEGER)
    WHEN "unit" = 'hours' THEN GREATEST(1, CEIL("value" / 24.0)::INTEGER)
    ELSE "value"
  END,
  "unit" = 'days'
WHERE "unit" IN ('minutes', 'hours');

-- Narrow the database enum after all existing values have been normalized.
ALTER TABLE "Alert" ALTER COLUMN "unit" DROP DEFAULT;
ALTER TABLE "UserDefaultReminder" ALTER COLUMN "unit" DROP DEFAULT;

CREATE TYPE "ReminderUnit_new" AS ENUM ('days');

ALTER TABLE "Alert"
ALTER COLUMN "unit" TYPE "ReminderUnit_new"
USING ("unit"::TEXT::"ReminderUnit_new");

ALTER TABLE "UserDefaultReminder"
ALTER COLUMN "unit" TYPE "ReminderUnit_new"
USING ("unit"::TEXT::"ReminderUnit_new");

DROP TYPE "ReminderUnit";
ALTER TYPE "ReminderUnit_new" RENAME TO "ReminderUnit";

ALTER TABLE "Alert" ALTER COLUMN "unit" SET DEFAULT 'days';
ALTER TABLE "UserDefaultReminder" ALTER COLUMN "unit" SET DEFAULT 'days';
