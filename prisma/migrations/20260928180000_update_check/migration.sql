-- The optional update check (TASKS N9): off by default, the last release seen.
-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "latestCheckedAt" TIMESTAMP(3),
ADD COLUMN     "latestVersion" TEXT,
ADD COLUMN     "updateCheck" BOOLEAN NOT NULL DEFAULT false;

