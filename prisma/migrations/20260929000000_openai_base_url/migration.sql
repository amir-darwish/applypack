-- TASKS S1: the OpenAI-compatible engine's server address, set on the AI tab.
-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "openAiBaseUrl" TEXT;

