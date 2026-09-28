import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resumeTextKey, sameTextAs } from './duplicate';

// TASKS R16: the same resume, saved again or exported again, is the same text.
test('line ends, runs of blanks and empty lines do not make a different resume', () => {
  assert.equal(resumeTextKey('Jane  Example\r\n\r\nSenior Engineer \n'), 'Jane Example\nSenior Engineer');
  assert.equal(resumeTextKey('  \n\t '), '');
});

test('the first saved resume that reads the same, and none for a changed word or an empty text', () => {
  const saved = [
    { id: 1, text: 'Jane Example\nBackend Engineer\nNode.js, PostgreSQL' },
    { id: 2, text: 'Jane Example\nFrontend Engineer\nReact' },
  ];
  assert.equal(sameTextAs('Jane Example\r\nBackend Engineer\r\n\r\nNode.js,  PostgreSQL\r\n', saved)?.id, 1);
  assert.equal(sameTextAs('Jane Example\nBackend Engineer\nNode.js, MySQL', saved), null);
  assert.equal(sameTextAs('', [{ id: 3, text: '' }]), null);
});
