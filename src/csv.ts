/*
 * CSV for a spreadsheet (RFC 4180, CRLF, a BOM so Excel reads Cyrillic
 * names). Pure — tested in csv.test.ts; the screening export and the
 * applications board export both write through it.
 */

/*
 * Excel and LibreOffice run a cell that opens with = + - @ (or a tab or CR)
 * as a formula, quoted or not; an apostrophe makes it text and stays out of
 * sight. File names, resumes, job titles and the user's own notes all reach
 * these tables. A plain signed number is left alone.
 */
const FORMULA_LEADER = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[-+]?\d+(?:[.,]\d+)?$/;
const BOM = '﻿';

export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  if (FORMULA_LEADER.test(s) && !PLAIN_NUMBER.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** A header and its rows as one file. */
export function csvTable(head: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return `${BOM}${[head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
