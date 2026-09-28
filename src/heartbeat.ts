/**
 * What the container healthchecks judge (docker-compose.yml). Pure; the
 * worker writes the file (`index.ts`) and `scripts/health-check.ts` reads it.
 *
 * The worker runs no HTTP server (CLAUDE.md), so it proves it is alive the
 * one way left: a file it touches on a timer. A timer fires while the event
 * loop turns, so a stale file means a process that is stuck or gone, not one
 * that is busy — a fetch tick takes many minutes and still lets it fire.
 */

/** How often the worker touches its heartbeat file. */
export const HEARTBEAT_EVERY_MS = 60_000;

/** Three missed beats: older than this, the worker is reported unhealthy. */
export const HEARTBEAT_STALE_MS = 3 * HEARTBEAT_EVERY_MS;

/** Whether a heartbeat written at `writtenAt` still counts at `now`. */
export function heartbeatFresh(writtenAt: number, now: number): boolean {
  return now - writtenAt <= HEARTBEAT_STALE_MS;
}

/** The header `/health` needs when the dashboard is behind `WEB_BASIC_AUTH`; none when it is not. */
export function basicAuthHeader(credentials: string | undefined): Record<string, string> {
  return credentials ? { authorization: `Basic ${Buffer.from(credentials).toString('base64')}` } : {};
}
