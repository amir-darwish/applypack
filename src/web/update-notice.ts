import { APP_VERSION } from '../app-version';
import { getSettings } from '../settings';
import { isNewer } from '../versions';

/*
 * What the sidebar says about a newer release (TASKS N9). The worker's weekly
 * check writes it, so this web-side copy lives an hour — gotcha 9 in the
 * other direction: a stale "v2.23.0 is out" for an hour costs nothing, a
 * settings read on every page would.
 */
const TTL_MS = 60 * 60 * 1000;

let cached: { latest: string | null; at: number } | null = null;

export async function ensureUpdateNotice(now = Date.now()): Promise<void> {
  if (cached && now - cached.at < TTL_MS) return;
  const settings = await getSettings();
  cached = { latest: settings.updateCheck ? settings.latestVersion : null, at: now };
}

/** The newer release, when the check is on and has seen one; sync, for the layout. */
export function newerRelease(): string | null {
  const latest = cached?.latest;
  return latest && isNewer(APP_VERSION, latest) ? latest : null;
}

/** The settings route changed the switch or the check just looked: read it again on the next request. */
export function forgetUpdateNotice(): void {
  cached = null;
}
