import { applyFacts, canonicalTerm, type FactLike } from './facts';
import { anchorStatuses } from './keyword-anchor';
import type { KeywordMatcher } from './keyword-matcher';
import { effectiveKeywords } from './keyword-overrides';
import type { MatchKeyword } from './prompts';

/**
 * "Missing across your postings" (TASKS §20 `search-funnel` stage 3): what
 * the latest comparison of each posting asked for and the resume does not
 * say, folded across postings. Zero AI — the keyword tables are stored. The
 * resume's text AS IT IS NOW settles presence (ADR 0045), and the confirmed
 * facts as they are now settle a question, so a term written in or answered
 * since a comparison no longer counts as missing.
 */

/** Below this many compared postings, one posting's wording is the whole picture. */
export const MIN_POSTINGS = 5;
/** A term one posting asked for is that posting's; two is a pattern. */
const MIN_MISSING = 2;
/** The card lists this many terms. */
const MAX_TERMS = 10;

/**
 * What it takes to close: `unwritten` = a comparison found the experience
 * behind it (`add`), so it is a word to write; `unconfirmed` = no comparison
 * could tell (`ask_user`); `gap` = the resume has nothing behind it.
 */
export type CoverageKind = 'unwritten' | 'unconfirmed' | 'gap';

export interface CoverageTerm {
  /** The spelling the postings used first. */
  term: string;
  /** Postings that want it and do not find it in the text. */
  missing: number;
  /** Of those, the ones that list it as a must. */
  must: number;
  kind: CoverageKind;
}

export interface Coverage {
  /** How many postings the tables came from. */
  postings: number;
  terms: CoverageTerm[];
}

const KIND_ORDER: Record<MatchKeyword['status'], CoverageKind | null> = {
  present: null,
  add: 'unwritten',
  ask_user: 'unconfirmed',
  cannot_claim: 'gap',
};
/** When postings disagree, the most actionable reading wins: a word to write beats a question beats a gap. */
const KIND_RANK: Record<CoverageKind, number> = { unwritten: 0, unconfirmed: 1, gap: 2 };

/**
 * Fold the latest keyword table of each compared posting into the terms the
 * resume keeps missing. A `context` row is the posting describing itself, not
 * asking. A term inside an "any of" group (ADR 0044) is not missing when the
 * resume has another member of the same group in that posting.
 */
export function coverage(
  tables: readonly MatchKeyword[][],
  resumeText: string,
  facts: readonly FactLike[],
  matcher: KeywordMatcher,
): Coverage {
  const byTerm = new Map<string, CoverageTerm>();
  for (const table of tables) {
    const confirmed = applyFacts(effectiveKeywords(table), [...facts]).keywords;
    const rows = anchorStatuses(confirmed, resumeText, matcher).keywords.filter((k) => k.requirement !== 'context');
    const metGroups = new Set(rows.filter((k) => k.status === 'present' && k.group).map((k) => groupKey(k.group!)));
    // One posting counts a term once, however many rows spell it.
    const seen = new Set<string>();
    for (const k of rows) {
      const kind = KIND_ORDER[k.status];
      const key = canonicalTerm(k.term);
      if (kind === null || seen.has(key) || (k.group && metGroups.has(groupKey(k.group)))) continue;
      seen.add(key);
      const row = byTerm.get(key) ?? { term: k.term.trim(), missing: 0, must: 0, kind };
      row.missing++;
      if (k.requirement === 'must') row.must++;
      if (KIND_RANK[kind] < KIND_RANK[row.kind]) row.kind = kind;
      byTerm.set(key, row);
    }
  }
  const terms = [...byTerm.values()]
    .filter((t) => t.missing >= MIN_MISSING)
    .sort((a, b) => b.missing - a.missing || b.must - a.must || a.term.localeCompare(b.term))
    .slice(0, MAX_TERMS);
  return { postings: tables.length, terms };
}

function groupKey(group: string): string {
  return group.trim().toLowerCase();
}
