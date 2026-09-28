import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, csvTable } from './csv';

test('a cell is quoted when it holds a comma, a quote or a line break', () => {
  assert.equal(csvCell('plain'), 'plain');
  assert.equal(csvCell('a, b'), '"a, b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('two\nlines'), '"two\nlines"');
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(42), '42');
});

test('a cell a spreadsheet would run is text; a signed number stays a number', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell('@SUM(A1)'), "'@SUM(A1)");
  assert.equal(csvCell('-3'), '-3');
  assert.equal(csvCell('+1.5'), '+1.5');
  assert.equal(csvCell('-rm -rf'), "'-rm -rf");
});

test('a table starts with a BOM and ends every line with CRLF', () => {
  assert.equal(csvTable(['A', 'B'], [[1, 'x,y']]), '﻿A,B\r\n1,"x,y"\r\n');
});
