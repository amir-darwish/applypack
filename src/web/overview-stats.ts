import { JobStatus, type Prisma } from '@prisma/client';
import { prisma } from '../db';
import { funnelView, readCounts, sumDays, type FunnelView } from '../funnel';
import { KPI_STATUSES, SPARK_DAYS, kpiTrends, topTerms, type KpiStatus, type KpiTrend, type TermCount } from './overview-numbers';
import {
  RANGES,
  countByDay,
  dayNumber,
  dayStart,
  niceTicks,
  rangePoints,
  rangeTotals,
  trend,
  type RangeKey,
  type SeriesPoint,
  type Trend,
} from './stats-series';

/*
 * What the Overview's statistics are read from. Zero AI: two sources, each
 * for what it is good at.
 *
 * - `funnel_day` (one row per UTC day, never pruned) carries the matches of
 *   every day the install has lived, so the chart can look back 180 days.
 * - The jobs themselves carry the technologies (`techMatch`), but a dismissed
 *   job is deleted after 30 days (cleanup-job.ts). So anything by technology
 *   — the chart under a `stack` filter, the "by stack" list — reads the last
 *   30 days only, where nothing has been deleted yet.
 */

const DAY_MS = 86_400_000;
/** The cleanup's window: within it every job a tick stored is still a row. */
const STACK_DAYS = 30;
/** Bars in the "by stack" list, and options in the chart's filter. */
const STACK_BARS = 8;
const STACK_OPTIONS = 12;


/**
 * A posting a search kept after scoring, whatever the user did with it
 * since: still kept, or alerted / held before it was dismissed by hand.
 */
const WAS_MATCH: Prisma.JobWhereInput = {
  fitScore: { not: null },
  OR: [{ status: { not: JobStatus.DISMISSED } }, { alertedAt: { not: null } }, { alertHeldAt: { not: null } }],
};

export interface OverviewChart {
  range: RangeKey;
  /** The technology the series is narrowed to, or null for every match. */
  stack: string | null;
  points: SeriesPoint[];
  ticks: number[];
  /** Matches in the range. */
  total: number;
  /** Against the equal range before it; null when the install (or the jobs kept) does not reach back that far. */
  trend: Trend | null;
  /** The filter's options: what the last 30 days' matches name most. */
  options: TermCount[];
  /** False on a range the jobs no longer cover — the filter is switched off there. */
  stackAllowed: boolean;
}

export interface OverviewActivity {
  fetched24h: number;
  lastFetchedAt: Date | null;
  matches24h: number;
  lastMatchAt: Date | null;
  alerts24h: number;
  lastAlertAt: Date | null;
}

export interface OverviewStats {
  kpi: Record<KpiStatus, KpiTrend>;
  chart: OverviewChart;
  /** The search funnel over the chart's range. */
  funnel: FunnelView;
  /** What the last 30 days' matches name, most named first, and how many matches that is out of. */
  stack: { terms: TermCount[]; matches: number };
  activity: OverviewActivity;
  /** When a fetch — the hourly one or "Fetch now" — last started. */
  lastCheckedAt: Date | null;
}

export async function loadOverviewStats(
  opts: { range: RangeKey; stack: string | null; unmuted: Prisma.JobWhereInput },
  now = new Date(),
): Promise<OverviewStats> {
  const { range, unmuted } = opts;
  const today = dayNumber(now);
  const { days } = RANGES[range];
  const since24h = new Date(now.getTime() - DAY_MS);
  const sinceSpark = dayStart(today - (SPARK_DAYS - 1));
  const sinceStack = dayStart(today - (STACK_DAYS - 1));
  const stackAllowed = days <= STACK_DAYS;
  const stack = stackAllowed ? opts.stack : null;

  const [funnelRows, firstFunnelDay, kpiRows, matchRows, fetched, alerts, lastAlert, lastCheck] = await Promise.all([
    prisma.funnelDay.findMany({ where: { day: { gte: dayStart(today - (2 * days - 1)) } } }),
    prisma.funnelDay.findFirst({ orderBy: { day: 'asc' }, select: { day: true } }),
    prisma.job.findMany({
      // AND, not a spread: the muted clause is an OR of its own (employer.ts:withoutMuted).
      where: {
        AND: [
          {
            status: { in: [...KPI_STATUSES] },
            OR: [{ fetchedAt: { gte: sinceSpark } }, { alertedAt: { gte: sinceSpark } }, { appliedAt: { gte: sinceSpark } }],
          },
          unmuted,
        ],
      },
      select: { status: true, fetchedAt: true, alertedAt: true, appliedAt: true },
    }),
    prisma.job.findMany({
      where: { AND: [WAS_MATCH, unmuted], fetchedAt: { gte: sinceStack } },
      select: { fetchedAt: true, techMatch: true },
    }),
    prisma.job.aggregate({ where: { fetchedAt: { gte: since24h }, ...unmuted }, _count: { _all: true }, _max: { fetchedAt: true } }),
    prisma.job.count({ where: { alertedAt: { gte: since24h }, ...unmuted } }),
    prisma.job.aggregate({ where: unmuted, _max: { alertedAt: true } }),
    prisma.cronRun.findFirst({
      where: { name: { in: ['fetch', 'fetch-now'] } },
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true },
    }),
  ]);

  const funnelDays = funnelRows.map((r) => ({ day: r.day, counts: readCounts(r.counts) }));
  const options = topTerms(matchRows, STACK_OPTIONS);
  // A filter nothing in the window names would draw a flat line and explain nothing.
  const term = stack && options.some((o) => o.term === stack) ? stack : null;

  let counts: Map<number, number>;
  let comparable: boolean;
  if (term) {
    counts = countByDay(matchRows.filter((r) => r.techMatch.some((t) => t.trim().toLowerCase() === term)).map((r) => r.fetchedAt));
    // The jobs reach back 30 days: a week has a week before it, a month does not.
    comparable = 2 * days <= STACK_DAYS;
  } else {
    counts = new Map(funnelDays.map((r) => [dayNumber(r.day), r.counts.matched ?? 0]));
    comparable = firstFunnelDay !== null && dayNumber(firstFunnelDay.day) <= today - (2 * days - 1);
  }
  const points = rangePoints(counts, range, now);
  const totals = rangeTotals(counts, range, now);
  const recentMatches = matchRows.filter((r) => r.fetchedAt.getTime() >= since24h.getTime());

  return {
    kpi: kpiTrends(kpiRows as Parameters<typeof kpiTrends>[0], now),
    chart: {
      range,
      stack: term,
      points,
      ticks: niceTicks(Math.max(0, ...points.map((p) => p.value))),
      total: totals.current,
      trend: comparable ? trend(totals.current, totals.previous) : null,
      options,
      stackAllowed,
    },
    funnel: funnelView(sumDays(funnelDays, days, now)),
    stack: { terms: options.slice(0, STACK_BARS), matches: matchRows.length },
    activity: {
      fetched24h: fetched._count._all,
      lastFetchedAt: fetched._max.fetchedAt,
      matches24h: recentMatches.length,
      lastMatchAt: matchRows.reduce<Date | null>((latest, r) => (latest === null || r.fetchedAt > latest ? r.fetchedAt : latest), null),
      alerts24h: alerts,
      lastAlertAt: lastAlert._max.alertedAt,
    },
    lastCheckedAt: lastCheck?.startedAt ?? null,
  };
}
