import { isLauncherMessage, type LauncherMessage } from './supervise';

/*
 * The worker's and the dashboard's side of `npm start`. Without a launcher —
 * Docker, CI, `npm run dev` — there is no IPC channel and both are no-ops.
 */

/** Whether `npm start`'s launcher started this process: it talks to it over IPC. */
export function underLauncher(): boolean {
  return typeof process.send === 'function';
}

export function announceReady(): void {
  const ready: LauncherMessage = { type: 'ready' };
  process.send?.(ready);
}

/** Stop when the launcher asks, or when it is gone (killed, or its terminal closed). */
export function onLauncherStop(stop: (reason: string) => void): void {
  if (!process.send) return;
  process.on('message', (message) => {
    if (isLauncherMessage(message, 'shutdown')) stop('launcher');
  });
  process.on('disconnect', () => stop('launcher gone'));
}
