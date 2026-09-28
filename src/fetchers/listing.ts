/*
 * Which boards handed over their whole listing this read (TASKS S13, the
 * gate ADR 0019 wrote down). A job missing from a list is proof it was taken
 * down only when the list is known to be whole: a truncated page or a capped
 * read would otherwise call a live posting dead, and ADR 0016's asymmetry
 * says that is the mistake we never make. So a fetcher says "in full" only
 * when it can: the vendor's own total met by the rows received, or an API
 * that lists every open posting by contract. The walk clears the mark before
 * asking a board and reads it once after — see fetchers/index.ts.
 */

const inFull = new Set<number>();

/** This read carried every posting the board has open. */
export function listedInFull(companyId: number): void {
  inFull.add(companyId);
}

/** Before a board is asked: a mark left by an earlier read that then failed is void. */
export function forgetListing(companyId: number): void {
  inFull.delete(companyId);
}

/** After a read: whether it was whole. Answers once. */
export function wasListedInFull(companyId: number): boolean {
  return inFull.delete(companyId);
}
