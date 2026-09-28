-- The AI spend ledger (ADR 0055): one row per AI attempt, metadata only, and
-- the monthly budget on billed money with the last warning it sent.
-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "aiBudgetAlerted" TEXT,
ADD COLUMN     "aiBudgetCents" INTEGER;

-- CreateTable
CREATE TABLE "ai_call" (
    "id" SERIAL NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER NOT NULL,
    "engine" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "resolvedModel" TEXT,
    "feature" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "viaFallback" BOOLEAN NOT NULL DEFAULT false,
    "billing" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "cacheWriteTokens" INTEGER,
    "cacheWrite1hTokens" INTEGER,
    "cacheReadTokens" INTEGER,
    "outputTokens" INTEGER,
    "webSearches" INTEGER,
    "costMicroUsd" INTEGER,
    "reportedMicroUsd" INTEGER,
    "priceAsOf" TEXT,
    "jobId" INTEGER,
    "resumeId" INTEGER,

    CONSTRAINT "ai_call_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_call_at_idx" ON "ai_call"("at");

-- CreateIndex
CREATE INDEX "ai_call_jobId_idx" ON "ai_call"("jobId");

-- CreateIndex
CREATE INDEX "ai_call_feature_at_idx" ON "ai_call"("feature", "at");
