/*
 * A dated copy of the database folder, taken as `npm start` starts it (TASKS
 * S6): at most one a day, the newest few kept. Taken before Postgres runs, the
 * copy is whole — what a clean stop left, or what a crash left, which
 * Postgres recovers from like a power cut. Pure: the launcher does the copying.
 */

/** How many to keep when APPLYPACK_SNAPSHOTS does not say; 0 turns them off. */
const DEFAULT_SNAPSHOTS = 3;
const MAX_SNAPSHOTS = 30;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** APPLYPACK_SNAPSHOTS as a count: a whole number from 0 to 30, else the default. */
export function snapshotsToKeep(raw: string | undefined): number {
  const n = Number(raw?.trim());
  return raw?.trim() && Number.isInteger(n) && n >= 0 && n <= MAX_SNAPSHOTS ? n : DEFAULT_SNAPSHOTS;
}

/** The machine's own calendar day, the name a snapshot takes: "2026-09-28". */
export function snapshotDay(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Whether today's snapshot is still to take, and which old ones go once it
 * is. Folders that are not a day's name are not ours, and are left alone.
 */
export function snapshotPlan(existing: readonly string[], today: string, keep: number): { take: boolean; drop: string[] } {
  const days = existing.filter((name) => DAY.test(name));
  if (keep === 0) return { take: false, drop: [] };
  const take = !days.includes(today);
  const after = [...new Set([...days, ...(take ? [today] : [])])].sort().reverse();
  return { take, drop: after.slice(keep) };
}

/** What a copy of the database folder leaves out: the running server's own marker files. */
export function snapshotSkips(name: string): boolean {
  return name === 'postmaster.pid' || name === 'postmaster.opts';
}
