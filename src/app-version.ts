import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
 * This install's version, read once from package.json: the runtime image
 * ships it next to dist/, and a local install runs from the checkout. The
 * dashboard's footer says it, the User-Agent carries its major.minor, and
 * the optional update check compares against it.
 */
function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export const APP_VERSION = readVersion();
