import fs from 'node:fs';
import path from 'node:path';

/*
 * How to start a CLI engine on this platform (TASKS S8). Everywhere but
 * Windows the name is the command. On Windows npm installs `claude`,
 * `gemini` and `codex` as `.cmd` shims, which Node refuses to start without
 * a shell — and a shell would read the prompt, which carries a posting's and
 * a resume's text, as cmd.exe syntax. So the shim is read for the script it
 * runs, and that script runs under this Node directly: no shell, the
 * arguments exactly as they are. A native `.exe` runs as itself.
 */

export interface CliCommand {
  /** The executable to start. */
  file: string;
  /** Arguments that go before the call's own: the script a shim runs. */
  prefix: string[];
}

/** What a `.cmd` shim's last line runs: `"%dp0%\node_modules\…\cli.js" %*` (cmd-shim), `"%~dp0\…"` in older npm. */
const SHIM_SCRIPT = /"%~?dp0%?\\([^"%]+\.[cm]?js)"/i;

/** The script an npm `.cmd` shim runs, as a full path, or null when the text is not one. */
export function shimScript(shimText: string, shimDir: string): string | null {
  const match = SHIM_SCRIPT.exec(shimText);
  return match ? path.win32.join(shimDir, match[1]!) : null;
}

export interface CliLookup {
  platform: NodeJS.Platform;
  env: NodeJS.ProcessEnv;
  /** The Node running ApplyPack — what a shim's script runs under. */
  node: string;
  exists(file: string): boolean;
  read(file: string): string;
}

/**
 * The command for `bin` (a name like `claude`, or a path). On Windows the
 * name is looked up on PATH the way cmd.exe would, by PATHEXT; a `.cmd` or
 * `.bat` that is an npm shim becomes Node + its script. Anything else — no
 * match, a shim of another shape — is left to execFile, whose error then says
 * what happened.
 */
export function resolveCliCommand(bin: string, lookup: CliLookup): CliCommand {
  const plain: CliCommand = { file: bin, prefix: [] };
  if (lookup.platform !== 'win32') return plain;
  const found = path.win32.extname(bin) || /[\\/]/.test(bin) ? (lookup.exists(bin) ? bin : null) : onPath(bin, lookup);
  if (!found) return plain;
  if (!/\.(cmd|bat)$/i.test(found)) return { file: found, prefix: [] };
  const script = shimScript(lookup.read(found), path.win32.dirname(found));
  return script ? { file: lookup.node, prefix: [script] } : plain;
}

function onPath(name: string, lookup: CliLookup): string | null {
  const dirs = (lookup.env.PATH ?? lookup.env.Path ?? '').split(';').filter(Boolean);
  const exts = (lookup.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean);
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = path.win32.join(dir, name + ext.toLowerCase());
      if (lookup.exists(candidate)) return candidate;
    }
  }
  return null;
}

const resolved = new Map<string, CliCommand>();

/** `resolveCliCommand` on this machine, once per binary per process. */
export function cliCommand(bin: string): CliCommand {
  const cached = resolved.get(bin);
  if (cached) return cached;
  const command = resolveCliCommand(bin, {
    platform: process.platform,
    env: process.env,
    node: process.execPath,
    exists: (file) => fs.existsSync(file),
    read: (file) => fs.readFileSync(file, 'utf8'),
  });
  resolved.set(bin, command);
  return command;
}
