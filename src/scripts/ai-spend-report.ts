import { prisma } from '../db';
import { spendReportLines, type ReportRow } from '../ai-spend';

/*
 * The AI ledger per UTC day, engine and model, tab-separated (ADR 0055):
 *
 *   npm run spend:report -- [--from 2026-09-01] [--to 2026-09-27]
 *
 * Paste it beside the vendor's own usage and cost report (the Claude Console
 * → Usage, the OpenAI usage page) and compare closed days: vendors bucket by
 * UTC day and update with a delay. The `aborted` column is the first place
 * to look for a difference — a call ApplyPack timed out may still have been
 * billed. Reads only; spends nothing. The vendor's admin key never enters
 * ApplyPack: the comparison is by hand, on purpose.
 */

const DAY_MS = 86_400_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function dateArg(name: string, fallback: Date): Date {
  const i = process.argv.indexOf(`--${name}`);
  const value = i === -1 ? undefined : process.argv[i + 1];
  if (value === undefined) return fallback;
  if (!DATE.test(value)) throw new Error(`--${name} takes a UTC date, YYYY-MM-DD; got "${value}"`);
  return new Date(`${value}T00:00:00.000Z`);
}

async function main(): Promise<void> {
  const now = new Date();
  const from = dateArg('from', new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
  // --to is inclusive: the whole of that UTC day.
  const to = new Date(dateArg('to', new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))).getTime() + DAY_MS);
  const rows = await prisma.$queryRaw<
    (Omit<ReportRow, 'input' | 'cacheWrite' | 'cacheWrite1h' | 'cacheRead' | 'output' | 'searches' | 'ourMicro' | 'vendorMicro'> &
      Record<'input' | 'cacheWrite' | 'cacheWrite1h' | 'cacheRead' | 'output' | 'searches' | 'ourMicro' | 'vendorMicro', bigint>)[]
  >`
    SELECT to_char("at", 'YYYY-MM-DD') AS "day", "engine", COALESCE("resolvedModel", "model") AS "model", "billing",
      count(*)::int AS "calls",
      count(*) FILTER (WHERE "outcome" <> 'ok' AND "inputTokens" IS NULL AND "outputTokens" IS NULL)::int AS "aborted",
      COALESCE(sum("inputTokens"), 0)::bigint AS "input",
      COALESCE(sum("cacheWriteTokens"), 0)::bigint AS "cacheWrite",
      COALESCE(sum("cacheWrite1hTokens"), 0)::bigint AS "cacheWrite1h",
      COALESCE(sum("cacheReadTokens"), 0)::bigint AS "cacheRead",
      COALESCE(sum("outputTokens"), 0)::bigint AS "output",
      COALESCE(sum("webSearches"), 0)::bigint AS "searches",
      COALESCE(sum("costMicroUsd"), 0)::bigint AS "ourMicro",
      COALESCE(sum("reportedMicroUsd"), 0)::bigint AS "vendorMicro"
    FROM "ai_call"
    WHERE "at" >= ${from} AND "at" < ${to}
    GROUP BY 1, 2, 3, 4
    ORDER BY 1, 2, 3, 4`;
  const report = rows.map((r) => ({
    ...r,
    input: Number(r.input),
    cacheWrite: Number(r.cacheWrite),
    cacheWrite1h: Number(r.cacheWrite1h),
    cacheRead: Number(r.cacheRead),
    output: Number(r.output),
    searches: Number(r.searches),
    ourMicro: Number(r.ourMicro),
    vendorMicro: Number(r.vendorMicro),
  }));
  for (const line of spendReportLines(report)) console.log(line);
  if (report.length === 0) console.log(`# no AI calls recorded from ${from.toISOString().slice(0, 10)} to ${new Date(to.getTime() - DAY_MS).toISOString().slice(0, 10)}`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
