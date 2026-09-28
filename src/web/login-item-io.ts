import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { loginItemFor, type LoginItem } from '../login-item';
import { dataDirFor } from '../local/data-dir';
import { underLauncher } from '../local/child';

/*
 * Settings → General → "Start with this computer" (TASKS S5, Q29): the
 * dashboard writes or removes the system's login entry for `npm start`. Only
 * an install the launcher started has one to offer — Docker starts with
 * Docker Desktop, and `npm run dev` is somebody working on the code.
 */

const execFileAsync = promisify(execFile);
const COMMAND_TIMEOUT_MS = 10_000;

export interface LoginItemState {
  /** False without the launcher, or on a system it cannot write for. */
  available: boolean;
  on: boolean;
  file: string | null;
  kind: string | null;
}

/**
 * The Node to start at login, by a name that outlives an upgrade: the PATH
 * entry that leads to this Node (Homebrew's /opt/homebrew/bin/node), not the
 * versioned folder it resolves to, which the next upgrade deletes.
 */
function stableNode(): string {
  const real = fs.realpathSync(process.execPath);
  const name = path.basename(process.execPath);
  for (const dir of (process.env.PATH ?? '').split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(dir, name);
    try {
      if (fs.realpathSync(candidate) === real) return candidate;
    } catch {
      // Not in this folder.
    }
  }
  return process.execPath;
}

function currentItem(): { item: LoginItem; logFile: string } | null {
  const logFile = path.join(dataDirFor(process.platform, process.env, os.homedir()), 'logs', 'launcher.log');
  const item = loginItemFor({
    platform: process.platform,
    home: os.homedir(),
    env: process.env,
    node: stableNode(),
    // dist/web → dist/local/launcher.js, and the checkout above dist.
    launcher: path.resolve(__dirname, '..', 'local', 'launcher.js'),
    root: path.resolve(__dirname, '..', '..'),
    logFile,
  });
  return item ? { item, logFile } : null;
}

export function loginItemState(): LoginItemState {
  const current = underLauncher() ? currentItem() : null;
  if (!current) return { available: false, on: false, file: null, kind: null };
  return { available: true, on: fs.existsSync(current.item.file), file: current.item.file, kind: current.item.kind };
}

/** Writes or removes the entry; the reason is a sentence for the flash when it could not. */
export async function setLoginItem(on: boolean): Promise<{ ok: true } | { ok: false; reason: string }> {
  const current = underLauncher() ? currentItem() : null;
  if (!current) return { ok: false, reason: 'only an install started with npm start can start itself at login' };
  const { item, logFile } = current;
  if (on) {
    fs.mkdirSync(path.dirname(item.file), { recursive: true });
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.writeFileSync(item.file, item.contents);
    try {
      for (const [cmd, ...args] of item.enable) await execFileAsync(cmd!, args, { timeout: COMMAND_TIMEOUT_MS });
    } catch (err) {
      fs.rmSync(item.file, { force: true });
      const e = err as { stderr?: unknown; message?: string };
      const why = typeof e.stderr === 'string' && e.stderr.trim() ? e.stderr.trim() : (e.message ?? 'no reason given');
      return { ok: false, reason: `the system would not take it (${why.split('\n')[0]}); nothing was left behind` };
    }
    return { ok: true };
  }
  for (const [cmd, ...args] of item.disable) {
    try {
      await execFileAsync(cmd!, args, { timeout: COMMAND_TIMEOUT_MS });
    } catch {
      // A unit someone already disabled by hand is not a reason to keep the file.
    }
  }
  fs.rmSync(item.file, { force: true });
  return { ok: true };
}
