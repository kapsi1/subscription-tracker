-- Replace weeklyReport with previousWeekReport and nextWeekReport, disable emailNotifications by default

ALTER TABLE "User" DROP COLUMN "weeklyReport";
ALTER TABLE "User" ADD COLUMN "previousWeekReport" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "nextWeekReport" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ALTER COLUMN "emailNotifications" SET DEFAULT false;
