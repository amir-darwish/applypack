-- ADR 0056: who hires, a mute list, and the re-apply window. The old rows'
-- employer keys are filled once by init.ts (employersFilledAt), not here: the
-- key is employer.ts:employerKey, and SQL would be a second copy of it.
-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "employersFilledAt" TIMESTAMP(3),
ADD COLUMN     "reapplyDays" INTEGER;

-- AlterTable
ALTER TABLE "job" ADD COLUMN     "employer" TEXT,
ADD COLUMN     "employerKey" TEXT;

-- CreateTable
CREATE TABLE "company_mute" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_mute_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "job_employerKey_idx" ON "job"("employerKey");

