/*
 * The edits the suggestion cards can make to the resume text: replace a quoted
 * span, cut one, add a term to a skills line — and the inverse of any of them,
 * which is what Undo restores. Dependency-free ES module, no DOM — served
 * as-is and unit-tested from src/web/text-edits.test.ts.
 *
 * There is deliberately no "move this bullet to the top". 24 stored actions use
 * move/lead wording, and reading them shows the model means "make the first
 * bullet say this" — it quotes the leading bullet and proposes new words for
 * it, which is a replacement. A real move applied to only 4 of the 24.
 *
 * Every function is total: it returns either { text, span, change } — the
 * whole new text, where the edit landed (so the caller can outline it) and
 * exactly what it replaced (so Undo can put it back) — or { error }, never a
 * partial write and never a throw. Nothing here mutates.
 *
 * It lives beside target.mjs rather than inside it because the landing demo
 * ships a byte copy of that file (site-vendor.test.ts) and imports it in the
 * browser; this module is dashboard-only.
 */

import { locateQuote, findTerm } from './target.mjs';

/*
 * The contact line is protected: gotcha 11 is that removal quotes leak into it,
 * and 7 of the 237 quoted spans in the live corpus sit on the line carrying the
 * email and phone. These two patterns are copied from
 * src/resume/parse-warnings.ts — a browser module cannot import TypeScript, so
 * they are kept in step by hand.
 */
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RUN_RE = /\+?\d[\d\s().\/-]{6,}\d/g;
/** A phone needs ≥9 digits in one run — "2022-2026" date ranges have 8. */
const PHONE_MIN_DIGITS = 9;

function isContactLine(line) {
  if (EMAIL_RE.test(line)) return true;
  return (line.match(PHONE_RUN_RE) ?? []).some((run) => (run.match(/\d/g) ?? []).length >= PHONE_MIN_DIGITS);
}

/** Start of the line containing `index`. */
function lineStart(text, index) {
  return text.lastIndexOf('\n', index - 1) + 1;
}

/** End of the line containing `index`, not counting the newline. */
function lineEnd(text, index) {
  const next = text.indexOf('\n', index);
  return next === -1 ? text.length : next;
}

/** Every line the span [start, end) touches, as one string. */
function affectedLines(text, start, end) {
  return text.slice(lineStart(text, start), lineEnd(text, end));
}

// A bullet marker the edit must not eat when it replaces the words after it.
const BULLET = /^(\s*(?:[-•*·–—]|\d+[.)])\s+)/;

/**
 * Replace the quoted span with `replacement`. The span is found the same way
 * the editor highlights it, so what gets replaced is what was outlined.
 * A leading bullet marker survives: the model quotes the sentence, not the "• ".
 */
export function applyReplacement(text, quote, replacement) {
  const loc = locateQuote(text, quote);
  if (!loc) return { error: 'not-found' };
  if (typeof replacement !== 'string' || replacement.trim() === '') return { error: 'no-replacement' };
  const start = lineStart(text, loc.start);
  const marker = BULLET.exec(text.slice(start, loc.end));
  // Only when the quote swallowed the marker: otherwise it is already outside the span.
  const keep = marker && loc.start <= start + marker[1].length ? marker[1] : '';
  const body = keep + replacement.trim();
  const from = keep ? start : loc.start;
  return {
    text: text.slice(0, from) + body + text.slice(loc.end),
    span: { start: from, end: from + body.length },
    change: { start: from, removed: text.slice(from, loc.end), inserted: body },
  };
}

/**
 * Cut the quoted span. When the quote is the whole line, the line goes with its
 * newline so no blank gap is left behind. Refuses on the contact line — dropping
 * a ZIP code there has taken the email with it before (gotcha 11).
 */
export function removeSpan(text, quote) {
  const loc = locateQuote(text, quote);
  if (!loc) return { error: 'not-found' };
  if (affectedLines(text, loc.start, loc.end).split('\n').some(isContactLine)) return { error: 'protected' };
  const start = lineStart(text, loc.start);
  const end = lineEnd(text, loc.end);
  const before = text.slice(start, loc.start);
  const after = text.slice(loc.end, end);
  // A quote of a bullet's words is the bullet: cutting only the words left a
  // lone "• " behind (measured on the live corpus, the formula bullet).
  const bareBefore = before.trim() === '' || before.replace(BULLET, '') === '';
  const wholeLine = bareBefore && after.trim() === '';
  let from = wholeLine ? start : loc.start;
  // Take the trailing newline with the line; at the end of the text take the leading one.
  let to = wholeLine ? (end < text.length ? end + 1 : end) : loc.end;
  if (!wholeLine) {
    // Part of a line: take the separator on the open side with it, so a cut
    // from a list leaves "Go, JavaScript" rather than "Go, , JavaScript", and
    // one at the start of a line leaves no space in front of it.
    if (bareBefore || SEPARATOR_AT.test(text.slice(from - 2, from))) {
      while (to < end && SEPARATOR_CHAR.test(text[to])) to++;
    } else if (after.trim() === '') {
      while (from > start && SEPARATOR_CHAR.test(text[from - 1])) from--;
    }
  }
  const cutLeadingNewline = wholeLine && end >= text.length && from > 0;
  const at = cutLeadingNewline ? from - 1 : from;
  return {
    text: text.slice(0, at) + text.slice(to),
    span: { start: at, end: at },
    change: { start: at, removed: text.slice(at, to), inserted: '' },
  };
}

/** What stands between two items of a line — a cut takes one side's with it. */
const SEPARATOR_CHAR = /[\s,;·∙•|]/;
const SEPARATOR_AT = /[,;·∙•|]\s?$/;

/** The separators a skills line uses between terms, most specific first. */
const SEPARATORS = [' | ', ' · ', ' • ', '; ', ', '];

/**
 * Is this line a list of terms, rather than a bare label or a run of labels?
 * Measured need: on all six resumes in the live corpus the skills section is a
 * column of bare labels with the values stacked below, so appending to "the
 * line that says Programming" would write the term onto a label while the real
 * list sits further down.
 */
function termList(line) {
  const colon = line.indexOf(':');
  const body = (colon === -1 ? line : line.slice(colon + 1)).trim();
  if (body === '') return null;
  for (const sep of SEPARATORS) {
    const parts = body.split(sep).map((p) => p.trim());
    // Two real items, and no item that is itself another label.
    if (parts.length >= 2 && parts.every((p) => p !== '' && !p.endsWith(':'))) return { body, sep };
  }
  return null;
}

const SKILLS_HEADING = /skills|technolog|stack|competenc/i;
const HEADING_MAX = 60;

/**
 * Add `term` to a skills line. Only ever writes inside a skills section: a term
 * list somewhere else is not a skills list, and the first walk of this shipped
 * appending a keyword to the contact line, which split on ", " into four parts
 * and passed for one. Returns `no-skills-list` when there is nothing safe to
 * write to — the caller must then not offer the button at all rather than offer
 * one that writes nonsense. A term already present is a no-op.
 */
export function insertIntoSkills(text, term, where) {
  const clean = String(term ?? '').trim();
  if (clean === '') return { error: 'no-term' };
  if (findTerm(text, clean).length > 0) return { error: 'already-present' };

  const lines = text.split('\n');
  const lists = [];
  let underHeading = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const list = termList(line);
    // A bare label ("Programming:") belongs to the section it sits in and must
    // not close it — every stored resume stacks its labels that way.
    const isLabel = line.trimEnd().endsWith(':');
    if (!list && !isLabel && line.trim() !== '' && line.length < HEADING_MAX) {
      underHeading = SKILLS_HEADING.test(line);
    }
    if (list && underHeading && !isContactLine(line)) lists.push({ i, ...list });
  }
  if (lists.length === 0) return { error: 'no-skills-list' };

  // The hint names a category ("Key Skills, Programming line"); prefer a list whose label says so.
  const hint = String(where ?? '').toLowerCase();
  const hintWords = hint.match(/[a-z]{4,}/g) ?? [];
  const label = (i) => lines[i].toLowerCase().slice(0, lines[i].indexOf(':') + 1 || HEADING_MAX);
  const target = lists.find((l) => hintWords.some((w) => label(l.i).includes(w))) ?? lists[0];

  const line = lines[target.i];
  const kept = line.replace(/\s*$/, '');
  lines[target.i] = kept + target.sep + clean;
  const lineAt = lines.slice(0, target.i).reduce((n, l) => n + l.length + 1, 0);
  const start = lineAt + kept.length + target.sep.length;
  return {
    text: lines.join('\n'),
    span: { start, end: start + clean.length },
    change: { start: lineAt + kept.length, removed: line.slice(kept.length), inserted: target.sep + clean },
  };
}

/**
 * Add `wording` as the line after the one the model anchored it to
 * (`insert_after`, stage 3). The anchor is found the way Locate finds it; the
 * new line takes the anchor's bullet marker unless the wording brought its own,
 * so a bullet added under a bullet reads as one of the list.
 */
export function insertAfterLine(text, anchor, wording) {
  const loc = locateQuote(text, anchor);
  if (!loc) return { error: 'not-found' };
  if (typeof wording !== 'string' || wording.trim() === '') return { error: 'no-replacement' };
  const end = lineEnd(text, loc.end);
  const anchorLine = text.slice(lineStart(text, loc.start), lineEnd(text, loc.start));
  const body = wording.trim();
  const marker = BULLET.exec(anchorLine)?.[1] ?? '';
  const line = (marker && !BULLET.test(body) ? marker : '') + body;
  return {
    text: text.slice(0, end) + '\n' + line + text.slice(end),
    span: { start: end + 1, end: end + 1 + line.length },
    change: { start: end, removed: '', inserted: '\n' + line },
  };
}

/**
 * The smallest edit that turns `before` into `after`: the common prefix and
 * suffix are untouched, everything between them changed. Undo stores this
 * rather than a copy of the whole resume — it is one sentence, it survives a
 * reload in localStorage, and it says exactly what to put back.
 */
export function inverseEdit(before, after) {
  let head = 0;
  while (head < before.length && head < after.length && before[head] === after[head]) head++;
  let tail = 0;
  while (
    tail < before.length - head &&
    tail < after.length - head &&
    before[before.length - 1 - tail] === after[after.length - 1 - tail]
  ) {
    tail++;
  }
  return {
    start: head,
    removed: before.slice(head, before.length - tail),
    inserted: after.slice(head, after.length - tail),
  };
}

/** Characters of the unchanged text kept either side of an edit, so Undo can find it after the text moved. */
const UNDO_CONTEXT = 32;

/**
 * An inverse edit that remembers what stood around it in `after`. Apply all
 * makes a dozen edits in a row, and every one above a card shifts the offsets
 * below it: an edit that only knew its offset could no longer be undone on its
 * own — and a removal, whose `inserted` is empty, would have put its text back
 * at the old offset, inside some other sentence.
 */
export function withContext(after, edit) {
  const end = edit.start + edit.inserted.length;
  return {
    ...edit,
    lead: after.slice(Math.max(0, edit.start - UNDO_CONTEXT), edit.start),
    trail: after.slice(end, end + UNDO_CONTEXT),
  };
}

/**
 * Put `edit.removed` back where `edit.inserted` still stands. Refuses when the
 * text has moved on, so Undo can never silently overwrite later typing. An
 * edit carrying its context (`withContext`) is found again when other edits
 * moved it — only where exactly one place in the text still reads so.
 */
export function undoEdit(text, edit) {
  const at = locateEdit(text, edit);
  if (at === null) return { error: 'moved-on' };
  const next = text.slice(0, at) + edit.removed + text.slice(at + edit.inserted.length);
  return { text: next, span: { start: at, end: at + edit.removed.length } };
}

/** Shortest run of text a relocated edit is found by; under this a match proves nothing. */
const MIN_NEEDLE = 12;

/**
 * Where `edit.inserted` stands now. An edit stored before context existed
 * knows only its offset. One with context is found at its offset when either
 * side still reads the same, else by its context: both sides, then each alone
 * — the neighbour Apply all changed next to it spoils one side, rarely both —
 * and only where exactly one place in the text matches.
 */
function locateEdit(text, edit) {
  const ins = edit.inserted;
  const at = edit.start;
  const insertedAt = text.slice(at, at + ins.length) === ins;
  if (edit.lead === undefined) return insertedAt ? at : null;
  const { lead, trail } = edit;
  // An empty side confirms nothing: at the end of the text, trail is '' everywhere.
  const leadAt = lead.length > 0 && at >= lead.length && text.slice(at - lead.length, at) === lead;
  const trailAt = trail.length > 0 && text.slice(at + ins.length, at + ins.length + trail.length) === trail;
  if (insertedAt && (leadAt || trailAt || (lead.length === 0 && trail.length === 0))) return at;
  // No trail means the edit ended the text, no lead that it opened it — the
  // ends of the text are anchors of their own, whatever changed next to them.
  if (trail.length === 0 && text.endsWith(ins)) return text.length - ins.length;
  if (lead.length === 0 && text.startsWith(ins)) return 0;
  for (const [before, after] of [[lead, trail], [lead, ''], ['', trail]]) {
    const needle = before + ins + after;
    if (needle.length < MIN_NEEDLE) continue;
    const first = text.indexOf(needle);
    if (first !== -1 && text.indexOf(needle, first + 1) === -1) return first + before.length;
  }
  return null;
}
