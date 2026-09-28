-- ADR 0035 trigger: a site's own Crawl-delay for our token, read when a FEED or
-- CAREER_PAGE row is added; null for every row added before, and for the rest.
-- AlterTable
ALTER TABLE "company" ADD COLUMN     "crawlDelayMs" INTEGER;

