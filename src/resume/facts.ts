import type { MatchKeyword } from './prompts';

/*
 * Deterministic post-processing of match keywords — no AI involved:
 *  - applyFacts: user-confirmed / denied CandidateFacts flip ask_user keywords
 *    instantly (and the score is recomputed by score.ts, not by a new AI call);
 *  - annotateElsewhere: a term this resume can't claim but another stored
 *    resume evidences gets an "elsewhere" pointer (blueprint: "you have it,
 *    but this resume hides it").
 * Pure: tested in facts.test.ts.
 */

export interface FactLike {
  term: string;
  status: string; // confirmed | denied | unknown (FACT_ANSWERS)
  note: string | null;
}

export function canonicalTerm(s: string): string {
  return s.trim().toLowerCase();
}

/** All names a keyword answers to, lowercase: the term + its aliases. */
function names(k: MatchKeyword): string[] {
  return [canonicalTerm(k.term), ...k.aliases];
}

/** The note a denial leaves on a keyword. keyword-overrides.ts:confirmable reads it back, so a "no" is not re-asked. */
export const DENIED_NOTE = 'user: does not have it';

/**
 * The note a "not sure" leaves. Not knowing is not a denial: the prompts are
 * never told "no" (they read confirmed and denied facts only). The row stops
 * asking and claims nothing — before this answer existed, the only way to
 * silence a question you could not answer was to lie in one direction.
 */
export const UNSURE_NOTE = 'user: not sure';

/** The three answers a candidate can give about a term. */
export const FACT_ANSWERS = ['confirmed', 'denied', 'unknown'] as const;
export type FactAnswer = (typeof FACT_ANSWERS)[number];

/**
 * Flip keyword statuses from stored facts. Confirmed → "add" (the user's
 * context lands in the note); denied and not sure → "cannot_claim" with the
 * answer's own note, on an ask and on a term the model could not back alike —
 * the confirm card offers both, and `confirmable` reads the note, so neither
 * is asked again. Text evidence outranks every answer: "present"/"add"
 * keywords never get downgraded by a stale fact.
 */
export function applyFacts(
  keywords: MatchKeyword[],
  facts: FactLike[],
): { keywords: MatchKeyword[]; changed: number } {
  if (facts.length === 0) return { keywords, changed: 0 };
  const byName = new Map<string, FactLike>();
  for (const f of facts) byName.set(canonicalTerm(f.term), f);
  let changed = 0;
  const next = keywords.map((k) => {
    if (k.status !== 'ask_user' && k.status !== 'cannot_claim') return k;
    const fact = names(k)
      .map((n) => byName.get(n))
      .find((f) => f !== undefined);
    if (!fact) return k;
    if (fact.status === 'confirmed') {
      changed++;
      return { ...k, status: 'add' as const, note: fact.note ? `user-confirmed: ${fact.note}` : 'user-confirmed' };
    }
    const answered = fact.status === 'denied' ? DENIED_NOTE : fact.status === 'unknown' ? UNSURE_NOTE : null;
    if (answered !== null && k.note !== answered) {
      changed++;
      return { ...k, status: 'cannot_claim' as const, note: answered };
    }
    return k;
  });
  return { keywords: next, changed };
}

/**
 * Point keywords at another stored resume that evidences them, via the
 * scanned skill tags. On an unclaimable keyword it is an opportunity ("in
 * <resume>"); on an `add` it says where the evidence came from — and a skill
 * this resume only borrows does not cover the primary stack (TASKS R2,
 * score.ts). A confirmed fact is the candidate's own word, never borrowed.
 */
export function annotateElsewhere(
  keywords: MatchKeyword[],
  otherSkills: { skill: string; resumeName: string }[],
): MatchKeyword[] {
  if (otherSkills.length === 0) return keywords;
  const byPart = new Map<string, string>();
  for (const s of otherSkills) {
    const key = canonicalTerm(s.skill);
    if (key.length > 0 && !byPart.has(key)) byPart.set(key, s.resumeName);
  }
  return keywords.map((k) => {
    const borrowable = k.status === 'add' && !k.note?.startsWith('user-confirmed');
    if (k.status !== 'ask_user' && k.status !== 'cannot_claim' && !borrowable) return k;
    const hit = names(k)
      .map((n) => byPart.get(n))
      .find((r) => r !== undefined);
    return hit ? { ...k, elsewhere: hit } : k;
  });
}
