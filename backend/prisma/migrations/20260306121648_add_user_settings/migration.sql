-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accentColor" TEXT NOT NULL DEFAULT 'Indigo',
ADD COLUMN     "dailyDigest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'system',
ADD COLUMN     "webhookEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "webhookUrl" TEXT,
ADD COLUMN     "weeklyReport" BOOLEAN NOT NULL DEFAULT true;
