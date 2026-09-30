import type { PdfItem, PdfPage } from './pdf-geometry';

/*
 * How a PDF resume is laid out, read off its geometry (pdf-geometry.ts): the
 * lines the page sets in two places, the label column of a skills table, and
 * the look of each kind of line — the name, the headings, a role's company,
 * place, title and dates, the body, a "Technology Stack:" label. Pure: pages
 * in, a layout out.
 *
 * Its reader is the clean version (ADR 0039). The text of a PDF loses all of
 * this: the skills table comes out as eight labels above eight value lines,
 * a company and its place as one line, every colour and weight gone — and a
 * version re-set from the text alone read as someone else's resume (measured
 * on the owner's own file, 2026-09-30). Everything here is what the page
 * itself shows; nothing is inferred from what resumes usually look like.
 */

export interface Look {
  bold: boolean;
  /** Six hex digits, no hash; null where the page did not say. */
  color: string | null;
  size: number | null;
}

export type LookRole =
  | 'name'
  | 'label'
  | 'contact'
  | 'link'
  | 'heading'
  | 'company'
  | 'place'
  | 'position'
  | 'dates'
  | 'body'
  | 'skillLabel'
  | 'skillValues'
  | 'stackLabel'
  | 'stackValues';

export interface Looks {
  roles: Partial<Record<LookRole, Look>>;
  /** A rule drawn under the header block, and under each heading. */
  headerRule: boolean;
  headingRule: boolean;
  /** Body paragraphs set flush on both sides. */
  justify: boolean;
  /** How far from the left margin a skills table's value column starts, in points. */
  labelColumnPt: number | null;
}

export interface PdfLayout {
  /** Lines the page sets in two places — a company on the left, its place flush right — as their two parts. */
  columns: Array<[string, string]>;
  /** A skills table's labels and the values on their baseline, in the page's order. */
  pairs: Array<{ label: string; values: string }>;
  looks: Looks;
}

/** A gap this wide on one baseline is two columns, not two words — under it, justified text spreads its words. */
const COLUMN_GAP_PT = 18;
const COLUMN_GAP_EM = 2;
/** The gap after a "Label:" that makes it a table cell rather than the start of a sentence. */
const LABEL_GAP_PT = 4;
/** A right-hand part this close to the right edge of the text is flush right. */
const FLUSH_RIGHT_PT = 6;
/** Two x positions this close are one column. */
const SAME_COLUMN_PT = 2.5;
/** A line this close to the right edge ends flush; enough of them and the body is justified. */
const JUSTIFY_PT = 1.5;
const JUSTIFY_SHARE = 0.6;
const JUSTIFY_MIN_LINES = 4;
const HEADING_MAX_CHARS = 44;
const CONTACT = /@|https?:\/\/|www\.|linkedin|github|\.com\/|\+?\d[\d ().-]{7,}\d/i;
const BULLET_GLYPH = /^[•●▪‣◦*·-]/;

interface Char {
  ch: string;
  bold: boolean;
  size: number;
  color: string | null;
}

interface Segment {
  text: string;
  chars: Char[];
  x0: number;
  x1: number;
}

interface Line {
  page: number;
  y: number;
  size: number;
  segments: Segment[];
}

export function readLayout(pages: PdfPage[]): PdfLayout {
  const lines = pages.flatMap((p, n) => linesOf(p.items, n));
  const right = Math.max(0, ...lines.flatMap((l) => l.segments.map((s) => s.x1)));
  const left = Math.min(...lines.flatMap((l) => l.segments.map((s) => s.x0)));

  const columns: Array<[string, string]> = [];
  for (const line of lines) {
    if (line.segments.length < 2) continue;
    const last = line.segments[line.segments.length - 1]!;
    if (right - last.x1 > FLUSH_RIGHT_PT) continue;
    columns.push([line.segments.slice(0, -1).map((s) => s.text).join(' '), last.text]);
  }

  const { pairs, pairLines, valueX } = readPairs(lines, right);
  const looks = readLooks(pages, lines, { right, left, pairLines, valueX });
  return { columns, pairs, looks };
}

/* ---------- lines and segments ---------- */

/** A text item's vertical band: most of a glyph sits above the baseline. */
function band(item: { y: number; size: number }): [number, number] {
  return [item.y - item.size * 0.2, item.y + item.size * 0.8];
}

function overlap(a: [number, number], b: [number, number]): number {
  return Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
}

/**
 * Items into lines by the band they occupy rather than their exact baseline —
 * a formula's sub- and superscripts sit a few points off it — then each line
 * into segments where a gap is wider than words are ever set apart, or where
 * a "Label:" stands off from its value as a table cell does.
 */
function linesOf(items: PdfItem[], page: number): Line[] {
  const sorted = items.filter((i) => i.str.length > 0).sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: Array<{ band: [number, number]; y: number; size: number; items: PdfItem[] }> = [];
  for (const item of sorted) {
    const b = band(item);
    const row = rows.find((r) => overlap(r.band, b) > 0.5 * Math.min(r.band[1] - r.band[0], b[1] - b[0]));
    if (row) {
      row.items.push(item);
      if (item.str.trim() && item.size > row.size) { row.size = item.size; row.y = item.y; }
    } else rows.push({ band: b, y: item.y, size: item.size, items: [item] });
  }
  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) => ({ page, y: row.y, size: row.size, segments: segmentsOf(row.items.sort((a, b) => a.x - b.x), row.size) }))
    .filter((l) => l.segments.length > 0);
}

function segmentsOf(items: PdfItem[], size: number): Segment[] {
  const out: Segment[] = [];
  let current: Segment | null = null;
  let previous: PdfItem | null = null;
  const gapLimit = Math.max(COLUMN_GAP_PT, COLUMN_GAP_EM * size);
  for (const item of items) {
    const gap = previous ? item.x - (previous.x + previous.width) : 0;
    const labelEnds = previous !== null && /:\s*$/.test(previous.str) && gap >= LABEL_GAP_PT && previous.bold !== item.bold;
    if (!current || gap > gapLimit || labelEnds) {
      if (current) out.push(current);
      current = { text: '', chars: [], x0: item.x, x1: item.x };
    } else if (gap > size * 0.15 && !/\s$/.test(current.text) && !/^\s/.test(item.str)) {
      current.text += ' ';
      current.chars.push({ ch: ' ', bold: false, size: item.size, color: null });
    }
    [...item.str].forEach((ch, i) => {
      current!.text += ch;
      current!.chars.push({ ch, bold: item.bold, size: item.size, color: item.colors[i] ?? null });
    });
    if (item.str.trim()) current.x1 = Math.max(current.x1, item.x + item.width);
    previous = item;
  }
  if (current) out.push(current);
  return out
    .map((s) => ({ ...s, text: s.text.replace(/\s+/g, ' ').trim() }))
    .filter((s) => s.text.length > 0);
}

/* ---------- a skills table ---------- */

/**
 * "Programming:" and "PHP, Go, …" on one baseline, in two columns: a label
 * ending in a colon, and a value that starts where the other rows' values
 * start. A value line under it with nothing in the label column wraps the
 * row. The pairing is the page's, not a guess: the text alone gives eight
 * labels and then eight values, and the structure reader will not pair them
 * without this (ADR 0039).
 */
function readPairs(lines: Line[], right: number) {
  const pairs: Array<{ label: string; values: string }> = [];
  const pairLines = new Set<Line>();
  // A labelled row whose value is not flush right: a company and its place are not a table.
  const candidates = lines.filter((l) => l.segments.length === 2 && /:$/.test(l.segments[0]!.text) && right - l.segments[1]!.x1 > FLUSH_RIGHT_PT);
  // The value column is where most labelled rows put their value.
  const xs = candidates.map((l) => l.segments[1]!.x0);
  const valueX = mode(xs);
  if (valueX === null || xs.filter((x) => Math.abs(x - valueX) <= SAME_COLUMN_PT).length < 2) {
    return { pairs, pairLines, valueX: null };
  }
  let open: { label: string; values: string[] } | null = null;
  for (const line of lines) {
    const [first, second] = line.segments;
    if (line.segments.length === 2 && /:$/.test(first!.text) && Math.abs(second!.x0 - valueX) <= SAME_COLUMN_PT) {
      if (open) pairs.push({ label: open.label, values: open.values.join(' ') });
      open = { label: first!.text, values: [second!.text] };
      pairLines.add(line);
      continue;
    }
    if (open && line.segments.length === 1 && Math.abs(first!.x0 - valueX) <= SAME_COLUMN_PT) {
      open.values.push(first!.text);
      pairLines.add(line);
      continue;
    }
    if (open) { pairs.push({ label: open.label, values: open.values.join(' ') }); open = null; }
  }
  if (open) pairs.push({ label: open.label, values: open.values.join(' ') });
  return { pairs, pairLines, valueX };
}

/* ---------- looks ---------- */

function readLooks(
  pages: PdfPage[],
  lines: Line[],
  at: { right: number; left: number; pairLines: Set<Line>; valueX: number | null },
): Looks {
  const roles: Partial<Record<LookRole, Look>> = {};
  const used = new Set<Line>();
  const firstPage = lines.filter((l) => l.page === 0);

  // The name is the largest line at the top; the header runs down to the first heading.
  const nameLine = firstPage.slice(0, 4).reduce<Line | null>((best, l) => (!best || l.size > best.size ? l : best), null);
  const headings = lines.filter((l) => isHeading(l));
  const firstHeading = headings[0];
  if (nameLine) {
    roles.name = lookOf(allChars(nameLine));
    used.add(nameLine);
    const header = firstPage.filter((l) => l.y < nameLine.y && (!firstHeading || l.y > firstHeading.y || l.page > 0));
    const labelLine = header.find((l) => !CONTACT.test(textOf(l)));
    if (labelLine && header.indexOf(labelLine) === 0) { roles.label = lookOf(allChars(labelLine)); used.add(labelLine); }
    const contact = header.filter((l) => l !== labelLine);
    const contactChars = contact.flatMap(allChars);
    if (contactChars.length > 0) {
      const links = contact.flatMap((l) => l.segments.flatMap((s) => partsOf(s).filter((p) => /@|linkedin|github|https?:|www\.|\.com\//i.test(p.text)).flatMap((p) => p.chars)));
      const linkSet = new Set(links);
      roles.contact = lookOf(contactChars.filter((c) => !linkSet.has(c)));
      if (links.length > 0) roles.link = lookOf(links);
      for (const l of contact) used.add(l);
    }
  }

  if (headings.length > 0) roles.heading = lookOf(headings.flatMap(allChars));
  for (const h of headings) used.add(h);

  // A role's two lines: company and place, then title and dates, each flush right.
  for (let i = 0; i + 1 < lines.length; i++) {
    const a = lines[i]!;
    const b = lines[i + 1]!;
    if (!flushPair(a, at.right) || !flushPair(b, at.right) || isHeading(a)) continue;
    roles.company = lookOf(a.segments[0]!.chars);
    roles.place = lookOf(a.segments.at(-1)!.chars);
    roles.position = lookOf(b.segments[0]!.chars);
    roles.dates = lookOf(b.segments.at(-1)!.chars);
    break;
  }
  for (const l of lines) if (flushPair(l, at.right)) used.add(l);

  const pairLines = [...at.pairLines];
  if (pairLines.length > 0) {
    roles.skillLabel = lookOf(pairLines.filter((l) => l.segments.length === 2).map((l) => l.segments[0]!).flatMap((s) => s.chars));
    roles.skillValues = lookOf(pairLines.map((l) => l.segments.at(-1)!).flatMap((s) => s.chars));
    for (const l of pairLines) used.add(l);
  }

  // "Technology Stack: PHP, …" — a label set apart from its list by colour or weight.
  for (const l of lines) {
    if (used.has(l) || l.segments.length !== 1) continue;
    const seg = l.segments[0]!;
    const m = /^([^:]{2,40}:)\s/.exec(seg.text);
    if (!m) continue;
    const label = lookOf(seg.chars.slice(0, m[1]!.length));
    const rest = lookOf(seg.chars.slice(m[1]!.length));
    if (label.color === rest.color && label.bold === rest.bold) continue;
    roles.stackLabel ??= label;
    roles.stackValues ??= rest;
    used.add(l);
  }

  const body = lines.filter((l) => !used.has(l));
  if (body.length > 0) roles.body = lookOf(body.flatMap(allChars));

  return {
    roles,
    headerRule: headerRuled(pages, lines, nameLine, firstHeading),
    headingRule: headings.length > 0 && headings.filter((h) => ruledUnder(pages[h.page]!, h)).length * 2 >= headings.length,
    justify: justified(body, at.right),
    labelColumnPt: at.valueX !== null && Number.isFinite(at.left) ? Math.round((at.valueX - at.left) * 10) / 10 : null,
  };
}

function isHeading(line: Line): boolean {
  if (line.segments.length !== 1) return false;
  const t = line.segments[0]!.text;
  return t.length <= HEADING_MAX_CHARS && /\p{Lu}/u.test(t) && !/\p{Ll}/u.test(t) && !/,.*,/.test(t) && !/[.:;]$/.test(t);
}

function flushPair(line: Line, right: number): boolean {
  return line.segments.length >= 2 && right - line.segments.at(-1)!.x1 <= FLUSH_RIGHT_PT && line.segments.at(-1)!.x0 > line.segments[0]!.x1;
}

function textOf(line: Line): string {
  return line.segments.map((s) => s.text).join(' ');
}

function allChars(line: Line): Char[] {
  return line.segments.flatMap((s) => s.chars);
}

/** A contact segment split on its separators ("email ∙ phone"), each part with its characters. */
function partsOf(seg: Segment): Array<{ text: string; chars: Char[] }> {
  const out: Array<{ text: string; chars: Char[] }> = [];
  let text = '';
  let chars: Char[] = [];
  for (const c of seg.chars) {
    if (/[∙·•|]/.test(c.ch)) {
      if (text.trim()) out.push({ text: text.trim(), chars });
      text = '';
      chars = [];
      continue;
    }
    text += c.ch;
    if (c.ch.trim()) chars.push(c);
  }
  if (text.trim()) out.push({ text: text.trim(), chars });
  return out;
}

/** The look most of these characters have: the colour and size they mostly carry, bold when most are. */
function lookOf(chars: Char[]): Look {
  const ink = chars.filter((c) => c.ch.trim().length > 0);
  if (ink.length === 0) return { bold: false, color: null, size: null };
  const colour = mode(ink.map((c) => c.color).filter((c): c is string => c !== null));
  return {
    // Half is enough: "Nazar" light and "Boyko" bold is a bold name.
    bold: ink.filter((c) => c.bold).length * 2 >= ink.length,
    color: colour ? colour.replace(/^#/, '').toLowerCase() : null,
    size: mode(ink.map((c) => c.size)),
  };
}

function mode<T>(values: T[]): T | null {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T | null = null;
  let n = 0;
  for (const [v, c] of counts) if (c > n) { best = v; n = c; }
  return best;
}

/** A rule between the header's last line and the first heading. */
function headerRuled(pages: PdfPage[], lines: Line[], nameLine: Line | null, firstHeading: Line | undefined): boolean {
  if (!nameLine || !firstHeading || firstHeading.page !== 0) return false;
  const above = lines.filter((l) => l.page === 0 && l.y > firstHeading.y && l.y < nameLine.y);
  const lowest = above.length > 0 ? Math.min(...above.map((l) => l.y)) : nameLine.y;
  return (pages[0]?.rules ?? []).some((r) => r.y < lowest && r.y > firstHeading.y + firstHeading.size);
}

/** A rule just under a heading's baseline — within a line's height below it. */
function ruledUnder(page: PdfPage, heading: Line): boolean {
  return page.rules.some((r) => r.y < heading.y && r.y > heading.y - heading.size * 1.2);
}

/**
 * Body text set flush on both sides: the lines of each paragraph but its last
 * end at the right edge. Measured on the owner's resume — every bullet and the
 * summary are justified, which a left-aligned re-set visibly changes.
 */
function justified(body: Line[], right: number): boolean {
  let flush = 0;
  let wrapped = 0;
  for (let i = 0; i + 1 < body.length; i++) {
    const line = body[i]!;
    const next = body[i + 1]!;
    // A wrapped line: the next one continues it — right under it, level with
    // or right of its start, and not a bullet of its own.
    if (line.segments.length !== 1 || next.segments.length !== 1 || next.page !== line.page) continue;
    if (line.y - next.y > line.size * 2) continue;
    if (next.segments[0]!.x0 < line.segments[0]!.x0 - 1 || BULLET_GLYPH.test(next.segments[0]!.text)) continue;
    wrapped++;
    if (right - line.segments[0]!.x1 <= JUSTIFY_PT) flush++;
  }
  return wrapped >= JUSTIFY_MIN_LINES && flush >= wrapped * JUSTIFY_SHARE;
}
