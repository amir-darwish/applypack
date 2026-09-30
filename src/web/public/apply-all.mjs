/*
 * "Apply all": every suggestion the comparison left on the page, applied to
 * the resume text in one press — the changes and additions the gate let
 * through, the removals, and the missing keywords a skills line can take.
 * Dependency-free ES module, no DOM — served as-is and unit-tested from
 * src/web/apply-all.test.ts; target-page.mjs collects the operations off the
 * cards and records what came back.
 *
 * Each operation runs on the text the one before it left, through the same
 * functions a single card's Apply calls, so a batch can do nothing a user
 * pressing every button in turn could not. What one operation cannot place
 * (its quote was edited away, a removal on the contact line) is reported and
 * skipped; the rest still land. Measured on the ten stored comparisons before
 * this was written: 40 of 47 changes, 13 of 14 removals and 5 of 5 keywords
 * land, and no quote goes missing.
 */

import { applyReplacement, insertAfterLine, removeSpan, insertIntoSkills, withContext } from './text-edits.mjs';

/**
 * @typedef {{ key: string, kind: 'change', quote: string, wording: string }
 *   | { key: string, kind: 'add', anchor: string, wording: string }
 *   | { key: string, kind: 'remove', quote: string }
 *   | { key: string, kind: 'keyword', term: string, where?: string }} Operation
 */

/** Run one operation on `text`: the text-edits result, `{ text, span }` or `{ error }`. */
export function runOperation(text, op) {
  switch (op.kind) {
    case 'change':
      return applyReplacement(text, op.quote, op.wording);
    case 'add':
      return insertAfterLine(text, op.anchor, op.wording);
    case 'remove':
      return removeSpan(text, op.quote);
    case 'keyword':
      return insertIntoSkills(text, op.term, op.where);
    default:
      return { error: 'unknown-operation' };
  }
}

/**
 * Apply `ops` in order. Returns the final text, each applied operation with the
 * inverse edit that undoes it (context included, so it can be undone on its
 * own after the others moved it), and each refused one with its reason.
 */
export function applyAll(text, ops) {
  let current = text;
  const done = [];
  const failed = [];
  for (const op of ops) {
    const result = runOperation(current, op);
    // A keyword an earlier change already wrote in is not a failure: it is done.
    if (result.error === 'already-present') continue;
    if (result.error) {
      failed.push({ key: op.key, kind: op.kind, error: result.error });
      continue;
    }
    // The operation's own account of what it changed, not a diff of the two
    // texts: next to a removal, a diff reads an added bullet's "\n• " as the
    // removed line's, and the two could no longer be undone apart.
    done.push({ key: op.key, kind: op.kind, edit: withContext(result.text, result.change) });
    current = result.text;
  }
  return { text: current, done, failed };
}

const NOUNS = {
  change: ['change', 'changes'],
  add: ['addition', 'additions'],
  remove: ['removal', 'removals'],
  keyword: ['keyword', 'keywords'],
};

function counted(n, [one, many]) {
  return `${n} ${n === 1 ? one : many}`;
}

/** One sentence for the status line and a screen reader: what landed, what did not. */
export function applyAllSummary(result) {
  const byKind = {};
  for (const d of result.done) byKind[d.kind] = (byKind[d.kind] ?? 0) + 1;
  const parts = Object.keys(NOUNS)
    .filter((kind) => byKind[kind])
    .map((kind) => counted(byKind[kind], NOUNS[kind]));
  const head = parts.length > 0 ? `Applied ${parts.join(', ')}.` : 'Nothing was applied.';
  const missed = result.failed.length;
  if (missed === 0) return head;
  return `${head} ${missed === 1 ? '1 could not be placed' : `${missed} could not be placed`} — the card says why.`;
}
