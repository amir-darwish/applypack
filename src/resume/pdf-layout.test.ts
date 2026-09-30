import { test } from 'node:test';
import assert from 'node:assert/strict';
import PDFDocument from 'pdfkit';
import { join } from 'node:path';
import type { PdfItem, PdfPage } from './pdf-geometry';
import { readPdfGeometry } from './pdf-geometry';
import { readLayout } from './pdf-layout';
import { structureFromText } from './structure-from-text';

/** A text item as pdf.js gives one: its width is the text's at half an em a character. */
function item(str: string, x: number, y: number, o: { size?: number; bold?: boolean; color?: string } = {}): PdfItem {
  const size = o.size ?? 10;
  return { str, x, y, width: str.length * size * 0.5, size, bold: o.bold ?? false, colors: [...str].map(() => o.color ?? '#000000') };
}

const PAGE_W = 600;

/** A small resume page in the owner's layout: centred header, a rule, a skills table, a role with a place flush right. */
function page(): PdfPage {
  const flushRight = (str: string, y: number, o: Parameters<typeof item>[3] = {}) => item(str, 560 - str.length * (o.size ?? 10) * 0.5, y, o);
  return {
    width: PAGE_W,
    height: 800,
    rules: [{ x0: 36, x1: 560, y: 712 }],
    items: [
      item('Alex Example', 240, 780, { size: 24, bold: true }),
      item('Senior Engineer', 260, 760, { color: '#404040' }),
      item('Austin, Texas', 150, 745),
      item('∙', 216, 745, { bold: true }),
      item('alex@example.com', 225, 745, { color: '#0070c0' }),
      item('SKILLS', 36, 690, { size: 12, bold: true }),
      item('Programming:', 70, 670, { bold: true }),
      item('PHP, Go, JavaScript', 150, 670),
      item('Data:', 105, 655, { bold: true }),
      item('MySQL, Redis, Kafka, Elasticsearch,', 150, 655),
      item('PostgreSQL', 150, 642),
      item('EXPERIENCE', 36, 610, { size: 12, bold: true }),
      item('Acme', 36, 590, { size: 11, bold: true }),
      flushRight('Remote', 590, { size: 11, color: '#0070c0' }),
      item('Senior Engineer', 36, 576, { color: '#404040' }),
      flushRight('Jan 2020 – Present', 576, { bold: true, color: '#404040' }),
      item('Technology Stack: PHP, Laravel', 36, 560, { color: '#404040' }),
    ].map((it) => {
      // "Technology Stack:" in the accent, the list after it in grey — one item, two colours.
      if (!it.str.startsWith('Technology Stack:')) return it;
      return { ...it, colors: [...it.str].map((_, i) => (i < 'Technology Stack:'.length ? '#0070c0' : '#404040')) };
    }),
  };
}

test('a skills table is paired by the page, a wrapped value joining its row', () => {
  const layout = readLayout([page()]);
  assert.deepEqual(layout.pairs, [
    { label: 'Programming:', values: 'PHP, Go, JavaScript' },
    { label: 'Data:', values: 'MySQL, Redis, Kafka, Elasticsearch, PostgreSQL' },
  ]);
  assert.equal(layout.looks.labelColumnPt, 114, 'from the left margin to the value column');
});

test('a line with a part flush right is two columns: company and place, title and dates', () => {
  const layout = readLayout([page()]);
  assert.deepEqual(layout.columns, [
    ['Acme', 'Remote'],
    ['Senior Engineer', 'Jan 2020 – Present'],
  ]);
});

test('each kind of line keeps the look the page gave it', () => {
  const { roles, headerRule, headingRule } = readLayout([page()]).looks;
  assert.deepEqual(roles.company, { bold: true, color: '000000', size: 11 });
  assert.deepEqual(roles.place, { bold: false, color: '0070c0', size: 11 });
  assert.deepEqual(roles.position, { bold: false, color: '404040', size: 10 });
  assert.deepEqual(roles.dates, { bold: true, color: '404040', size: 10 });
  assert.equal(roles.heading?.bold, true);
  assert.equal(roles.label?.color, '404040');
  assert.equal(roles.link?.color, '0070c0', 'the email is a link in the accent');
  assert.equal(roles.contact?.color, '000000', 'the rest of the contact line is ink');
  assert.equal(roles.skillLabel?.bold, true);
  assert.equal(roles.skillValues?.bold, false);
  assert.equal(roles.stackLabel?.color, '0070c0');
  assert.equal(roles.stackValues?.color, '404040');
  assert.equal(headerRule, true, 'the rule under the contact line');
  assert.equal(headingRule, false, 'no rule under the headings');
});

test('the text reader pairs the table and splits the company only on the page’s word', () => {
  const text = [
    'Alex Example',
    'Senior Engineer',
    'Austin, Texas ∙ alex@example.com',
    'SKILLS',
    'Programming:',
    'Data:',
    'PHP, Go, JavaScript, Rust',
    'MySQL, Redis, Kafka, Elasticsearch, PostgreSQL',
    'EXPERIENCE',
    'Acme Remote',
    'Senior Engineer Jan 2020 – Present',
    '• Built things.',
  ].join('\n');
  const layout = readLayout([page()]);
  const r = structureFromText(text, layout);
  assert.deepEqual(r.skills, [
    { name: 'Programming', keywords: ['PHP', 'Go', 'JavaScript', 'Rust'] },
    { name: 'Data', keywords: ['MySQL', 'Redis', 'Kafka', 'Elasticsearch', 'PostgreSQL'] },
  ], 'the values are the text’s own, the edit ("Rust") included');
  assert.equal(r.work[0]?.name, 'Acme');
  assert.equal(r.work[0]?.location, 'Remote');
  // Without the page, the labels stay unpaired and the company line whole, as before.
  const plain = structureFromText(text);
  assert.deepEqual(plain.skills.map((s) => s.name), ['Programming', 'Data', null, null]);
  assert.equal(plain.work[0]?.name, 'Acme Remote');
});

test('a table that no longer lines up with the text is left unpaired rather than guessed', () => {
  const text = 'Alex\nSKILLS\nProgramming:\nData:\nPHP, Go\nMySQL\nA third value line the page never had\n';
  const r = structureFromText(text, readLayout([page()]));
  assert.deepEqual(r.skills.map((s) => s.name), ['Programming', 'Data', null, null, null]);
});

test('body lines that end flush right read as justified; ragged ones do not', () => {
  const lines = (flush: boolean) =>
    Array.from({ length: 10 }, (_, i) => {
      const str = i % 2 === 0 ? '• A bullet that runs to the edge of the text' : 'and ends here.';
      const x = i % 2 === 0 ? 36 : 50;
      const it = item(str, x, 700 - i * 14, { size: 10 });
      return i % 2 === 0 && flush ? { ...it, width: 560 - x } : i % 2 === 0 ? { ...it, width: 400 } : it;
    });
  const pageOf = (flush: boolean): PdfPage => ({
    width: PAGE_W,
    height: 800,
    rules: [],
    items: [item('Alex Example', 240, 780, { size: 20, bold: true }), item('EXPERIENCE', 36, 730, { size: 12, bold: true }), ...lines(flush)],
  });
  // The widest line sets the right edge; a second paragraph makes a ragged page wider than its bullets.
  const ragged = pageOf(false);
  ragged.items.push({ ...item('A wide closing line that sets the edge.', 36, 600), width: 524 });
  assert.equal(readLayout([pageOf(true)]).looks.justify, true);
  assert.equal(readLayout([ragged]).looks.justify, false);
});

test('the geometry reader lays each character’s colour on its item and finds a drawn rule', async () => {
  const doc = new PDFDocument({ size: 'LETTER', margin: 36 });
  doc.registerFont('body', join(__dirname, 'fonts', 'LiberationSans-Regular.ttf'));
  doc.registerFont('bold', join(__dirname, 'fonts', 'LiberationSans-Bold.ttf'));
  doc.font('bold').fontSize(11).fillColor('#000000').text('Acme', 36, 100, { lineBreak: false });
  doc.font('body').fillColor('#0070c0').text('Austin, Texas', 400, 100, { lineBreak: false });
  doc.moveTo(36, 140).lineTo(576, 140).lineWidth(0.6).strokeColor('#000000').stroke();
  const chunks: Buffer[] = [];
  const bytes = await new Promise<Buffer>((resolve) => {
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.end();
  });
  const pages = await readPdfGeometry(bytes);
  assert.ok(pages && pages.length === 1);
  const byText = (s: string) => pages[0]!.items.find((i) => i.str.includes(s))!;
  assert.equal(byText('Acme').bold, true);
  assert.deepEqual([...new Set(byText('Acme').colors)], ['#000000']);
  assert.deepEqual([...new Set(byText('Austin').colors.filter(Boolean))], ['#0070c0']);
  assert.equal(byText('Austin').bold, false);
  assert.equal(pages[0]!.rules.length, 1, 'the one stroked line');
  assert.equal(await readPdfGeometry(Buffer.from('not a pdf')), null);
});
