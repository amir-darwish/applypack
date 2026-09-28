-- ADR 0035 / TASKS S31: the conditional-request validators on the row, so a
-- restart (npm start installs restart with the laptop) keeps them.
-- AlterTable
ALTER TABLE "company" ADD COLUMN     "validator" JSONB;

