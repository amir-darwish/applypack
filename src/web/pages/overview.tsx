/** @jsxImportSource hono/jsx */
import type { FC } from 'hono/jsx';
import type { CronRunStatus } from '@prisma/client';
import { Layout } from '../layout';
import {
  Badge,
  Button,
  Card,
  Empty,
  FitBadge,
  Flash,
  MetricStrip,
  PageHeader,
  SectionTitle,
  StatusBadge,
  TONE_FILL,
  When,
} from '../ui';
import type { FlashMessage } from '../flash';
import type { FetchRun } from '../fetch-runs';
import type { HeldLine } from '../held-line';
import { stageCount, type FunnelView } from '../../funnel';
import type { NextThing } from '../next-things';
import { FetchNowButton } from './fetch-run';
import {
  formatDuration,
  formatRelative,
  statusLabel,
  statusTone,
} from '../format';
import type { Tone } from '../format';

interface JobRow {
  id: number;
  title: string;
  url: string;
  location: string;
  fitScore: number | null;
  fetchedAt: Date;
  alertedAt: Date | null;
  status: 'NEW' | 'ALERTED' | 'APPLIED' | 'DISMISSED' | 'SAVED';
  /** ADR 0056: who hires, when an aggregator named them. */
  employer: string | null;
  company: { name: string };
}

interface RunRow {
  id: number;
  name: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: CronRunStatus;
  stats: unknown;
  errorMessage: string | null;
}

export interface OverviewProps {
  counts: { status: string; count: number }[];
  last24h: { status: string; count: number }[];
  recentAlerts: JobRow[];
  latestRuns: { name: string; run: RunRow | null }[];
  fetchingEnabled: boolean;
  /** "" while the schedule lets every hour through; "Sleeping until Mon 07:05" otherwise (TASKS §16). */
  sleepingUntil: string;
  /** Matches waiting to be sent — for the window, for Alerts, for a chat — or null. */
  held: HeldLine | null;
  /** §17: watched companies, what they put up in the last 24h (ADR 0036), and the pages only a paste can read (TASKS N8). */
  watched: { companies: number; newJobs: number; toPaste: number };
  /** The search funnel over the last 7 days — one line, the card is on /runs. */
  funnelWeek: FunnelView;
  /** The manual fetch in flight, if any — the button turns into a link to it. */
  fetchRun: FetchRun | null;
  /** A wizard step is still undone (skipped or not) — show the way back to /welcome. */
  finishSetup: boolean;
  /** TASKS N11: open a match → compare → tailor, until the first comparison; null hides the card. */
  next: NextThing[] | null;
  flash?: FlashMessage | null;
}

/** The funnel's line: four of its six stages, each count followed by its word. */
const FUNNEL_LINE = ['read', 'passed', 'matches', 'alerted'] as const;
const FUNNEL_WORD: Record<(typeof FUNNEL_LINE)[number], string> = {
  read: 'read',
  passed: 'past the filter',
  matches: 'matches',
  alerted: 'alerted',
};

/** The four statuses worth acting on; Total and Dismissed stay quiet. */
const PRIMARY_STATUSES = ['NEW', 'ALERTED', 'APPLIED', 'SAVED'] as const;


export const OverviewPage: FC<OverviewProps> = ({
  counts,
  last24h,
  recentAlerts,
  latestRuns,
  fetchingEnabled,
  sleepingUntil,
  held,
  watched,
  funnelWeek,
  fetchRun,
  finishSetup,
  next,
  flash,
}) => {
  const byStatus = mapCounts(counts);
  const byStatus24h = mapCounts(last24h);
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const total24h = Object.values(byStatus24h).reduce((a, b) => a + b, 0);
  const failing = latestRuns.filter(({ run }) => run?.status === 'FAILED').length;

  return (
    <Layout title="Overview" active="overview" refresh={30}>
      <PageHeader
        title="Overview"
        meta="Refreshes every 30s"
        actions={
          <>
            {finishSetup && (
              <a href="/welcome" class="inline-flex" title="Some setup steps are still open">
                <Badge tone="warn">Finish setup →</Badge>
              </a>
            )}
            <FetchNowButton run={fetchRun} />
            {/* Quick master switch — same toggle as Settings → General. */}
            <form
              method="post"
              action="/settings/fetching-toggle"
              class="flex items-center gap-2"
            >
              <input type="hidden" name="back" value="/" />
              <Badge tone={fetchingEnabled ? (sleepingUntil ? 'neutral' : 'ok') : 'neutral'}>
                {!fetchingEnabled
                  ? 'Pipeline paused'
                  : sleepingUntil
                    ? `Sleeping until ${sleepingUntil}`
                    : 'Pipeline running'}
              </Badge>
              <Button size="sm" variant="secondary">
                {fetchingEnabled ? 'Pause' : 'Resume'}
              </Button>
            </form>
          </>
        }
      />
      <Flash flash={flash} />

      <MetricStrip
        label="Jobs by status"
        cells={PRIMARY_STATUSES.map((status) => {
          const delta = byStatus24h[status] ?? 0;
          return {
            label: statusLabel(status),
            value: byStatus[status] ?? 0,
            tone: statusTone(status),
            href: `/jobs?status=${status}`,
            delta: delta > 0 ? <span class="font-medium text-ok">+{delta} in the last 24h</span> : '0 in the last 24h',
          };
        })}
        footer={
          <>
            {total.toLocaleString()} jobs tracked all-time · {total24h.toLocaleString()} seen in the last 24h ·{' '}
            {(byStatus.DISMISSED ?? 0).toLocaleString()} dismissed
          </>
        }
      />

      {/* What the four numbers cannot say, together under them. */}
      <div class="mb-8 mt-3 space-y-1">
        {fetchingEnabled && held && (
          <p data-ui="hint" class="text-note leading-5 text-ink-muted">
            {held.text} —{' '}
            <a
              href={held.href}
              class="font-medium text-accent-strong transition-colors duration-150 hover:text-accent-deep"
            >
              {held.action}
            </a>
            .
          </p>
        )}
        {stageCount(funnelWeek, 'read') > 0 && (
          <p data-ui="hint" class="text-note leading-5 tabular-nums text-ink-muted">
            Last 7 days: {FUNNEL_LINE.map((key) => `${stageCount(funnelWeek, key).toLocaleString('en-US')} ${FUNNEL_WORD[key]}`).join(' → ')} —{' '}
            <a
              href="/runs#funnel"
              class="font-medium text-accent-strong transition-colors duration-150 hover:text-accent-deep"
            >
              where the rest went
            </a>
            .
          </p>
        )}
        {watched.companies > 0 && (
          <p data-ui="hint" class="text-note leading-5 text-ink-muted">
            ★ {watched.companies} watched compan{watched.companies === 1 ? 'y' : 'ies'} ·{' '}
            {watched.newJobs === 0 ? (
              'nothing new in the last 24 hours'
            ) : (
              <a
                href="/jobs?watched=1"
                class="font-medium text-accent-strong transition-colors duration-150 hover:text-accent-deep"
              >
                {watched.newJobs} new posting{watched.newJobs === 1 ? '' : 's'} in the last 24 hours
              </a>
            )}
            {watched.toPaste > 0 && (
              <>
                {' · '}
                <a
                  href="/companies#browser-pages"
                  class="font-medium text-accent-strong transition-colors duration-150 hover:text-accent-deep"
                >
                  {watched.toPaste} to paste by hand
                </a>
              </>
            )}
            .
          </p>
        )}
        {!fetchingEnabled && (
          <p data-ui="hint" class="text-note leading-5 text-ink-muted">
            Paused means no new jobs or alerts. Fresh installs start paused so a blank profile
            doesn't spend AI credit —{' '}
            <a
              href="/settings?tab=profile"
              class="font-medium text-accent-strong transition-colors duration-150 hover:text-accent-deep"
            >
              fill the profile
            </a>
            , then press Resume. Fetch now still works while paused — it stores new jobs unscored.
          </p>
        )}
      </div>

      {next && <NextThingsCard steps={next} />}

      <div class="grid items-start gap-6 lg:grid-cols-3">
        <div class="min-w-0 lg:col-span-2">
          <SectionTitle level="section">Recent alerts</SectionTitle>
          {recentAlerts.length === 0 ? (
            <Empty
              title="No alerts yet"
              action={
                <Button href="/jobs" variant="secondary" size="sm">
                  See all jobs
                </Button>
              }
            >
              A job lands here when a running search scores it at or above its threshold.
            </Empty>
          ) : (
            <Card flush>
              <ul class="divide-y divide-line">
                {recentAlerts.map((j) => (
                  <li>
                    <a
                      href={`/jobs/${j.id}`}
                      class="flex items-center justify-between gap-4 px-5 py-3 transition-colors duration-150 hover:bg-surface-overlay/50"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="truncate text-sm font-medium text-ink">{j.title}</div>
                        <div class="mt-0.5 truncate text-note text-ink-faint">
                          {j.employer ?? j.company.name} · {j.location || 'Remote'} ·{' '}
                          <When at={j.alertedAt ?? j.fetchedAt} />
                        </div>
                      </div>
                      <div class="flex shrink-0 items-center gap-3">
                        <FitBadge score={j.fitScore} />
                        <StatusBadge status={j.status} />
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div class="min-w-0">
          <div class="mb-4 flex items-center gap-2.5">
            <h2 class="text-section text-ink">Pipeline health</h2>
            <Badge tone={failing === 0 ? 'ok' : 'danger'}>{failing === 0 ? 'Healthy' : `${failing} failing`}</Badge>
          </div>
          <Card flush>
            <ul class="divide-y divide-line">
              {latestRuns.map(({ name, run }) => (
                <li class="flex items-center gap-2.5 px-5 py-2">
                  <span
                    class={`h-1.5 w-1.5 shrink-0 rounded-full ${run ? TONE_FILL[runTone(run.status)] : 'bg-line-strong'}`}
                    aria-hidden="true"
                  />
                  <span class="min-w-0 flex-1 truncate font-mono text-note text-ink">{name}</span>
                  <span class="shrink-0 text-meta tabular-nums text-ink-faint">
                    {run
                      ? `${formatRelative(run.startedAt)} · ${formatDuration(
                          run.finishedAt ? run.finishedAt.getTime() - run.startedAt.getTime() : null,
                        )}`
                      : 'never ran'}
                  </span>
                  {/* The word, not the dot alone: status never reads by colour only. */}
                  {run && <Badge tone={runTone(run.status)}>{runLabel(run.status)}</Badge>}
                </li>
              ))}
            </ul>
            <div class="border-t border-line px-5 py-2.5 text-right">
              <a
                href="/runs"
                class="text-note font-medium text-accent-strong transition-colors duration-150 hover:text-accent-deep"
              >
                Full history →
              </a>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

function mapCounts(rows: { status: string; count: number }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = r.count;
  return out;
}

export function runTone(status: CronRunStatus): Tone {
  if (status === 'OK') return 'ok';
  if (status === 'FAILED') return 'danger';
  return 'info';
}

export function runLabel(status: CronRunStatus): string {
  if (status === 'OK') return 'OK';
  if (status === 'FAILED') return 'Failed';
  return 'Running';
}

/** The loop the product is for, in three steps, until the user has walked it once (TASKS N11). */
const NextThingsCard: FC<{ steps: NextThing[] }> = ({ steps }) => (
  <Card class="mb-8">
    <SectionTitle>Next: three things</SectionTitle>
    <ol class="mt-3 grid gap-5 md:grid-cols-3">
      {steps.map((s, i) => (
        <li class="min-w-0">
          <div class="text-label text-ink">
            <span class="tabular-nums text-ink-faint">{i + 1}.</span>{' '}
            {s.href ? (
              <a href={s.href} class="font-medium text-accent-strong transition-colors duration-150 hover:text-accent-deep">
                {s.title}
              </a>
            ) : (
              s.title
            )}
          </div>
          <p data-ui="hint" class="mt-1 text-meta text-ink-faint">
            {s.body}
          </p>
        </li>
      ))}
    </ol>
  </Card>
);
