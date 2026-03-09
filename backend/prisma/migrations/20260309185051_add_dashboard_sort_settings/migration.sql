-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dashboardSortBy" TEXT NOT NULL DEFAULT 'date',
ADD COLUMN     "dashboardSortOrder" TEXT NOT NULL DEFAULT 'asc';
