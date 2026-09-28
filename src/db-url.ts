/**
 * A database URL for a client that must hold one connection — the fetch lock
 * (`jobs/fetch-lock.ts`): a Postgres session lock belongs to the connection
 * that took it, and a pooled client could release it on another. Pure.
 */
export function singleConnectionUrl(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set('connection_limit', '1');
  return parsed.toString();
}
