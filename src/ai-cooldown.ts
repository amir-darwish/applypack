/*
 * In-process cooldown for AI engines (docs/ai-engine-improvements.md item 2).
 * Without it, a dead primary engine burns its retries + timeout on EVERY job
 * of a bulk run before the chain falls over. After `threshold` consecutive
 * failures an engine is skipped for `cooldownMs`; one success resets it.
 * A refused key or sign-in is skipped at once and for longer (H40) — but only
 * while that credential is in play: a new key pasted on /settings is tried on
 * the next call, in this process and in the other one.
 * Pure factory with an injectable clock — unit-tested.
 */

export interface CooldownTracker {
  failure(id: string): void;
  /** The vendor turned this credential away; `credential` is a fingerprint, never the key. */
  refused(id: string, credential: string): void;
  success(id: string): void;
  /** Epoch ms until which the engine should be skipped, or null. A new credential lifts a refusal. */
  blockedUntil(id: string, credential?: string): number | null;
}

const COOLDOWN_FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 60_000;
/** A refused key stays refused until someone changes it; the wait only bounds a guess that was wrong. */
const REFUSED_COOLDOWN_MS = 10 * 60_000;

export function createCooldownTracker(
  opts: { threshold?: number; cooldownMs?: number; refusedMs?: number; now?: () => number } = {},
): CooldownTracker {
  const threshold = opts.threshold ?? COOLDOWN_FAILURE_THRESHOLD;
  const cooldownMs = opts.cooldownMs ?? COOLDOWN_MS;
  const refusedMs = opts.refusedMs ?? REFUSED_COOLDOWN_MS;
  const now = opts.now ?? Date.now;
  const state = new Map<string, { failures: number; until: number; credential?: string }>();

  return {
    failure(id) {
      const s = state.get(id) ?? { failures: 0, until: 0 };
      s.failures += 1;
      // A plain failure never shortens a refusal already standing.
      if (s.failures >= threshold) s.until = Math.max(s.until, now() + cooldownMs);
      state.set(id, s);
    },
    refused(id, credential) {
      state.set(id, { failures: threshold, until: now() + refusedMs, credential });
    },
    success(id) {
      state.delete(id);
    },
    blockedUntil(id, credential) {
      const s = state.get(id);
      if (!s || s.until <= now()) return null;
      if (s.credential !== undefined && credential !== undefined && credential !== s.credential) {
        state.delete(id);
        return null;
      }
      return s.until;
    },
  };
}
