import type { CronStats } from '../jobs/cron-run';
import { filteredReasons, funnelCounts, reasonsText } from '../funnel';
import type { FlashKind } from './flash';
import { formatDuration } from './format';

/*
 * The one-line verdict of a finished "Fetch now" run, built from the
 * CronRun stats runFetchJob returns. Pure — tested in fetch-summary.test.ts.
 */

function num(stats: CronStats, key: string): number {
  const v = stats[key];
  return typeof v === 'number' ? v : 0;
}

/** `label` opens every sentence: "Fetch now", or "Checked Acme" for the watchlist's Check now (TASKS S23). */
export function summarizeFetchRun(stats: CronStats, label = 'Fetch now'): { kind: FlashKind; text: string } {
  if (stats.reason === 'overlap') {
    return {
      kind: 'warn',
      text: `${label} did nothing: another fetch is running (the hourly one, or a fetch-once script), and two at once would score the same postings twice. Its row on /runs shows when it is done.`,
    };
  }
  if (stats.reason === 'no-active-profile') {
    return { kind: 'err', text: `${label}: no running search — create one on Settings → Searches.` };
  }
  const fetched = num(stats, 'fetched');
  const sources = num(stats, 'sources');
  const failed = num(stats, 'sourcesFailed');
  const took = formatDuration(num(stats, 'durationMs'));
  if (stats.reason === 'paused-mid-run') {
    return {
      kind: 'warn',
      text: `${label} stopped: fetching was paused mid-run after ${sources} sources (${fetched} jobs, nothing stored).`,
    };
  }
  const unchanged = num(stats, 'sourcesUnchanged');
  if (fetched === 0) {
    // A source that answered "unchanged" proves the tick reached the boards,
    // so an empty run is the boards having nothing new — not a broken setup.
    if (unchanged > 0) {
      return {
        kind: 'ok',
        text: `${label}: nothing new in ${took} — ${unchanged} of ${sources} sources unchanged since the last tick${failed > 0 ? `, ${failed} failed` : ''}.`,
      };
    }
    return {
      kind: 'warn',
      text: `${label}: no jobs from ${sources} sources${failed > 0 ? ` (${failed} failed)` : ''} in ${took} — check the network, then the Quiet sources card on /companies.`,
    };
  }
  const persisted = num(stats, 'persisted');
  const head = `${label}: ${fetched} jobs from ${sources} sources${sourceNotes(unchanged, failed)} in ${took} — ${persisted} new stored`;
  if (stats.classify === false) {
    return {
      kind: 'ok',
      text: `${head} unscored, no AI spent while the pipeline is paused.${filteredClause(stats)} Score them later with Save & re-classify on Settings → Searches.`,
    };
  }
  if (stats.skippedBlankProfile === 1) {
    return {
      kind: 'warn',
      text: `${label}: ${fetched} jobs from ${sources} sources in ${took}, nothing stored — every running search is empty, so classification is idle.`,
    };
  }
  if (stats.abortedMidRun === 1) {
    return { kind: 'warn', text: `${head}; the rest was skipped when fetching was paused mid-run.` };
  }
  return { kind: 'ok', text: `${head}, ${num(stats, 'classified')} scored, ${num(stats, 'alerted')} alerted.${filteredClause(stats)}` };
}

/** " The filter set aside 500: 480 without a title keyword, 20 outside your places." — its two largest gates (N2). */
function filteredClause(stats: CronStats): string {
  const why = reasonsText(filteredReasons(funnelCounts(stats)), 2);
  return why ? ` The filter set aside ${num(stats, 'filterRejected')}: ${why}.` : '';
}

/** "(44 unchanged, 2 failed)" — whichever of the two happened. */
function sourceNotes(unchanged: number, failed: number): string {
  const notes = [
    ...(unchanged > 0 ? [`${unchanged} unchanged`] : []),
    ...(failed > 0 ? [`${failed} failed`] : []),
  ];
  return notes.length > 0 ? ` (${notes.join(', ')})` : '';
}
