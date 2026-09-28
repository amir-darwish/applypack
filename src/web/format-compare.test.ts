import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareFormats, formatSides } from './format-compare';
import { loadLineDiff } from '../resume/line-diff';

// TASKS R14 (gotcha 18): the same resume as a .docx and a .pdf, read side by side.
const DOCX = `Jane Example
Backend Engineer
jane@example.com · +48 600 100 200 · Warsaw, Poland

EXPERIENCE
Senior Backend Engineer — Acme
Jan 2021 – Present
• Built the billing service in Node.js for 40 000 customers.

Backend Engineer — Globex
Mar 2018 – Dec 2020
• Moved the reporting jobs to PostgreSQL.

SKILLS
Languages | Node.js, TypeScript, PHP`;

// The PDF's text layer lost the second role's dates and split the skills row.
const PDF = DOCX.replace('Mar 2018 – Dec 2020\n', '').replace('Languages | Node.js, TypeScript, PHP', 'Languages\nNode.js, TypeScript, PHP');

test('the file that keeps a role\'s dates reads better, and the page says why', async () => {
  const { diffLines } = await loadLineDiff();
  const result = compareFormats({ label: 'DOCX', name: 'the DOCX', text: DOCX }, { label: 'PDF', name: 'the PDF', text: PDF }, diffLines);
  assert.equal(result.identical, false);
  assert.equal(result.better, 'a');
  assert.deepEqual(result.reasons, ['Roles read with their dates: DOCX 2, PDF 1.']);
  // The lost dates, and the skills row the PDF split in two.
  assert.deepEqual(result.onlyA, { lines: ['Mar 2018 – Dec 2020', 'Languages | Node.js, TypeScript, PHP'], total: 2 });
  assert.deepEqual(result.onlyB, { lines: ['Languages', 'Node.js, TypeScript, PHP'], total: 2 });
});

test('a role\'s dates outweigh a location the other file found', async () => {
  const { diffLines } = await loadLineDiff();
  const noPlace = DOCX.replace(' · Warsaw, Poland', '');
  const result = compareFormats({ label: 'DOCX', name: 'the DOCX', text: noPlace }, { label: 'PDF', name: 'the PDF', text: PDF }, diffLines);
  assert.equal(result.better, 'a');
  assert.deepEqual(result.reasons.slice(0, 1), ['Roles read with their dates: DOCX 2, PDF 1.']);
  assert.ok(result.reasons.includes('Link and location found: DOCX 0, PDF 1.'));
});

test('fewer parse warnings wins when the parts read the same', async () => {
  const { diffLines } = await loadLineDiff();
  const garbled = `${DOCX}\n\u0007\u0007`;
  const result = compareFormats({ label: 'PDF', name: 'the PDF', text: garbled }, { label: 'DOCX', name: 'the DOCX', text: DOCX }, diffLines);
  assert.equal(result.better, 'b');
  assert.ok(result.reasons.some((r) => r.startsWith('Parse warnings: PDF 1, DOCX 0')));
});

test('two files that read alike say so', async () => {
  const { diffLines } = await loadLineDiff();
  const result = compareFormats({ label: 'DOCX', name: 'the DOCX', text: DOCX }, { label: 'PDF', name: 'the PDF', text: `${DOCX.replace(/\n/g, '\r\n')}\n\n` }, diffLines);
  assert.equal(result.identical, true);
  assert.equal(result.better, 'same');
  assert.deepEqual(result.reasons, []);
});

test('the marks our own readers draw are not differences between the files', async () => {
  const { diffLines } = await loadLineDiff();
  // The .docx reader writes headings as "## " and bullets as "- "; the PDF reader keeps "•" and one "|".
  const docx = 'Jane Example\n## EXPERIENCE\nSenior Engineer Acme | | Jan 2021 – Present\n- Built the billing service.\n- Ran on-call.';
  const pdf = 'Jane Example\n\nExperience\nSenior Engineer Acme | Jan 2021 – Present\n• Built the billing service.\n\n• Ran on call.';
  const result = compareFormats({ label: 'DOCX', name: 'the DOCX', text: docx }, { label: 'PDF', name: 'the PDF', text: pdf }, diffLines);
  assert.equal(result.onlyA.total + result.onlyB.total, 0);
  assert.deepEqual(result.changed.lines, [{ a: 'Ran on-call.', b: 'Ran on call.' }]);
});

test('a section the other file puts elsewhere is in both, not only in one', async () => {
  const { diffLines } = await loadLineDiff();
  const [head, experience, skills] = DOCX.split(/\n\n(?=EXPERIENCE|SKILLS)/);
  const reordered = [head, skills, experience].join('\n\n');
  const result = compareFormats({ label: 'DOCX', name: 'the DOCX', text: DOCX }, { label: 'MD', name: 'the MD', text: reordered }, diffLines);
  assert.equal(result.onlyA.total + result.onlyB.total, 0);
  assert.deepEqual(result.moved.lines, ['SKILLS', 'Languages | Node.js, TypeScript, PHP']);
});

test('the sides are named by their kinds when they differ, by the version otherwise', () => {
  assert.deepEqual(formatSides('Jane_CV.docx', 3, 'Jane_CV.pdf'), [
    { label: 'DOCX', name: 'the DOCX' },
    { label: 'PDF', name: 'the PDF' },
  ]);
  const same = [{ label: 'v3', name: 'your v3' }, { label: 'New file', name: 'the new file' }];
  assert.deepEqual(formatSides('Jane_CV.pdf', 3, 'Jane CV (export).PDF'), same);
  assert.deepEqual(formatSides('pasted', 3, 'Jane.txt'), same);
});
