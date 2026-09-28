/*
 * Release versions compared (the optional update check, TASKS N9). Pure.
 * Only plain `X.Y.Z` releases take part: a tag this does not read is
 * nothing to announce.
 */

/** "v2.21.0" or "2.21.0" → [2, 21, 0]; anything else → null. */
export function parseVersion(value: string): [number, number, number] | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** True when `latest` is a later release than `current`. */
export function isNewer(current: string, latest: string): boolean {
  const a = parseVersion(current);
  const b = parseVersion(latest);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (b[i]! !== a[i]!) return b[i]! > a[i]!;
  }
  return false;
}
