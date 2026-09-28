/*
 * A posting a whole board listing no longer carries has been taken down
 * (TASKS S13, ADR 0016's `api_delisted`). This decides which stored rows of
 * one board to mark, and which to mark back when a posting returns — only the
 * ones this rule marked, never an `expired` a verification found. Pure —
 * tested in delisted.test.ts; the walk writes it (fetchers/index.ts).
 */

/** The liveness code a board listing writes: "the board API no longer lists it". */
export const DELISTED_CODE = 'api_delisted';
/** And when the posting is back on the board. */
export const RELISTED_CODE = 'api_ok';

export interface BoardRow {
  id: number;
  externalId: string;
  liveness: string | null;
  livenessCode: string | null;
}

export function delistPlan(stored: readonly BoardRow[], listed: ReadonlySet<string>): { delisted: number[]; relisted: number[] } {
  return {
    delisted: stored.filter((r) => !listed.has(r.externalId) && r.liveness !== 'expired').map((r) => r.id),
    relisted: stored
      .filter((r) => listed.has(r.externalId) && r.liveness === 'expired' && r.livenessCode === DELISTED_CODE)
      .map((r) => r.id),
  };
}
