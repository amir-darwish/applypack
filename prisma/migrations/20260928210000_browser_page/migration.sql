-- TASKS N8: a careers page that draws its jobs in the browser, and what the
-- user pasted from it. Nothing in this release writes BROWSER_PAGE in the
-- same transaction, which Postgres would refuse for a value added here.
-- AlterEnum
ALTER TYPE "AtsType" ADD VALUE 'BROWSER_PAGE';

-- AlterTable
ALTER TABLE "company" ADD COLUMN     "pastedAt" TIMESTAMP(3),
ADD COLUMN     "pastedLines" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pastedNew" TEXT[] DEFAULT ARRAY[]::TEXT[];

