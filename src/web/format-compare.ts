import { extname } from 'node:path';
import { resumeTextKey } from '../resume/duplicate';
import type { DiffOp } from '../resume/line-diff';
import { parseWarnings } from '../resume/parse-warnings';
import { parsedView, type ParsedView } from './parsed-view';

/*
 * The same resume as two files — the .docx and the .pdf exported from it —
 * read side by side (TASKS R14). Gotcha 18 measured one pair at 78 and 69:
 * the .docx reader flattens a table row into one line, the PDF's text layer
 * gives the same table as short lines, and an ATS reads whichever file was
 * sent. This says which one a plain parser reads better and where the two
 * texts differ. Pure: the route extracts both texts and hands in the line
 * diff (`resume/line-diff.ts`).
 */

export interface FormatSide {
  /** A column's title and a sentence's subject: "DOCX", "the DOCX". */
  label: string;
  name: string;
}

export interface FormatReading extends FormatSide {
  view: ParsedView;
  warnings: string[];
}

export interface DiffList<T> {
  lines: T[];
  /** Before the cap. */
  total: number;
}

export interface FormatComparison {
  a: FormatReading;
  b: FormatReading;
  /** The two texts are the same once line ends and blanks are set aside. */
  identical: boolean;
  better: 'a' | 'b' | 'same';
  /** One sentence per measure the two files disagree on, in the order they decide. */
  reasons: string[];
  onlyA: DiffList<string>;
  onlyB: DiffList<string>;
  /** Lines both files carry, in a different place — a section the other file puts elsewhere. */
  moved: DiffList<string>;
  changed: DiffList<{ a: string; b: string }>;
}

/** How many lines of each difference the page lists. */
const MAX_DIFF_LINES = 25;
/** What our own readers draw around a line — a .docx heading as `## `, a bullet as `-` or `•`, an empty table cell as `| |`. */
const LEAD_MARK = /^\s*(?:#{1,6}|[-•*·‣▪])\s+/;
const EMPTY_CELLS = /\s*\|(?:\s*\|)+\s*/g;

const found = (r: FormatReading, labels: string[]) => r.view.contacts.filter((c) => labels.includes(c.label) && c.value !== null).length;

/**
 * What an ATS needs first decides: an email or phone it cannot find loses the
 * application, a role without dates falls out of a years-of-experience
 * filter, then the roles, the sections, the rest of the contact line and the
 * warnings.
 */
const MEASURES: { what: string; of: (r: FormatReading) => number; fewerIsBetter?: true }[] = [
  { what: 'Email and phone found', of: (r) => found(r, ['Email', 'Phone']) },
  { what: 'Roles read with their dates', of: (r) => r.view.roles.filter((role) => role.dates !== null).length },
  { what: 'Roles read', of: (r) => r.view.roles.length },
  { what: 'Sections recognised', of: (r) => r.view.sections.length },
  { what: 'Link and location found', of: (r) => found(r, ['Link', 'Location']) },
  { what: 'Parse warnings', of: (r) => r.warnings.length, fewerIsBetter: true },
];

function reading({ text, ...side }: FormatSide & { text: string }): FormatReading {
  return { ...side, view: parsedView(text), warnings: parseWarnings(text).map((w) => w.message) };
}

/**
 * The lines as the two readers would agree on them: the marks they draw
 * stripped and the blank lines dropped, so "## SKILLS" and "SKILLS", "- Built…"
 * and "• Built…" are one line and the lists keep only what the files
 * themselves disagree on. The diff runs on these lines case-folded; the page
 * shows them as written.
 */
function comparableLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(LEAD_MARK, '').replace(EMPTY_CELLS, ' | ').trim())
    .filter(Boolean);
}

const folded = (lines: string[]) => lines.map((line) => line.toLowerCase()).join('\n');

/** How often each line occurs, case aside. */
function lineCounts(lines: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const line of lines) counts.set(line.toLowerCase(), (counts.get(line.toLowerCase()) ?? 0) + 1);
  return counts;
}

/** Takes one `line` out of `counts`; false when none is left. */
function take(counts: Map<string, number>, line: string): boolean {
  const left = counts.get(line.toLowerCase()) ?? 0;
  if (left === 0) return false;
  counts.set(line.toLowerCase(), left - 1);
  return true;
}

function capped<T>(items: T[]): DiffList<T> {
  return { lines: items.slice(0, MAX_DIFF_LINES), total: items.length };
}

export function compareFormats(
  a: FormatSide & { text: string },
  b: FormatSide & { text: string },
  diffLines: (before: string, after: string) => DiffOp[],
): FormatComparison {
  const ra = reading(a);
  const rb = reading(b);
  const reasons: string[] = [];
  let better: FormatComparison['better'] = 'same';
  for (const m of MEASURES) {
    const x = m.of(ra);
    const y = m.of(rb);
    if (x === y) continue;
    reasons.push(`${m.what}: ${ra.label} ${x}, ${rb.label} ${y}.`);
    if (better === 'same') better = (x > y) !== Boolean(m.fewerIsBetter) ? 'a' : 'b';
  }
  const [la, lb] = [comparableLines(a.text), comparableLines(b.text)];
  const onlyA: string[] = [];
  const onlyB: string[] = [];
  const changed: { a: string; b: string }[] = [];
  for (const op of diffLines(folded(la), folded(lb))) {
    if (op.op === 'delete') onlyA.push(la[op.a.i]!);
    else if (op.op === 'insert') onlyB.push(lb[op.b.i]!);
    else if (op.op === 'change') changed.push({ a: la[op.a.i]!, b: lb[op.b.i]! });
  }
  // The diff reads a moved line as a delete here and an insert there; a line
  // on both lists is in both files.
  const pool = lineCounts(onlyB);
  const moved: string[] = [];
  const keptA: string[] = [];
  for (const line of onlyA) (take(pool, line) ? moved : keptA).push(line);
  const movedPool = lineCounts(moved);
  const keptB = onlyB.filter((line) => !take(movedPool, line));
  return {
    a: ra,
    b: rb,
    identical: resumeTextKey(a.text) === resumeTextKey(b.text),
    better,
    reasons,
    onlyA: capped(keptA),
    onlyB: capped(keptB),
    moved: capped(moved),
    changed: capped(changed),
  };
}

/** "the DOCX" and "the PDF" when the kinds differ — the case this is for — else "your v3" and "the new file". */
export function formatSides(savedFile: string, version: number, uploadedFile: string): [FormatSide, FormatSide] {
  const kind = (file: string) => extname(file).slice(1).toUpperCase();
  const [x, y] = [kind(savedFile), kind(uploadedFile)];
  return x && y && x !== y
    ? [{ label: x, name: `the ${x}` }, { label: y, name: `the ${y}` }]
    : [{ label: `v${version}`, name: `your v${version}` }, { label: 'New file', name: 'the new file' }];
}
