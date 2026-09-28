import { statSync } from 'node:fs';
import { config } from '../config';
import { basicAuthHeader, heartbeatFresh } from '../heartbeat';

/*
 * The container healthcheck (docker-compose.yml): exit 0 when healthy, 1 when
 * not. `web` asks the dashboard's own /health — the database included — with
 * the Basic Auth credentials when the dashboard is locked, so the lock stays
 * on for everyone else. `worker` reads the age of the file the worker touches
 * every minute (`heartbeat.ts`).
 *
 *   node dist/scripts/health-check.js web|worker
 */

const WEB_TIMEOUT_MS = 5_000;

/** Null when healthy, else the reason `docker inspect` shows. */
async function webProblem(): Promise<string | null> {
  const response = await fetch(`http://127.0.0.1:${config.WEB_PORT}/health`, {
    headers: basicAuthHeader(config.WEB_BASIC_AUTH),
    signal: AbortSignal.timeout(WEB_TIMEOUT_MS),
  });
  return response.ok ? null : `/health answered ${response.status}`;
}

function workerProblem(): string | null {
  if (!config.HEARTBEAT_FILE) return 'HEARTBEAT_FILE is not set';
  const writtenAt = statSync(config.HEARTBEAT_FILE).mtimeMs;
  return heartbeatFresh(writtenAt, Date.now()) ? null : `heartbeat ${Math.round((Date.now() - writtenAt) / 1000)} s old`;
}

async function main(): Promise<void> {
  const role = process.argv[2];
  if (role !== 'web' && role !== 'worker') throw new Error(`usage: health-check web|worker (got ${role ?? 'nothing'})`);
  const problem = role === 'web' ? await webProblem() : workerProblem();
  if (problem) {
    process.stderr.write(`${problem}\n`);
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
