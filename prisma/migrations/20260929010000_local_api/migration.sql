-- ADR 0057: the local engine's Ollama address and its context window, set on the AI tab.
-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "localAiUrl" TEXT,
ADD COLUMN     "localContextTokens" INTEGER;
