import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PASTE_CHARS, newLines, pageLines, pasteSummary, roleLines, titleWordsOf } from './paste';

const PAGE = `Acme
Careers

Open roles
Senior Backend Engineer   (Remote, EU)
Frontend Developer — Berlin
Senior Backend Engineer (Remote, EU)
Java Engineer
Sales Manager
We are a team of people who build things for other people and we want you to join us because it will be fun and rewarding in every way.
OK`;

test('a pasted page becomes its lines, once each, without the noise', () => {
  assert.deepEqual(pageLines(PAGE), [
    'Acme',
    'Careers',
    'Open roles',
    'Senior Backend Engineer (Remote, EU)',
    'Frontend Developer — Berlin',
    'Java Engineer',
    'Sales Manager',
  ]);
  assert.deepEqual(pageLines(''), []);
  assert.equal(pageLines('x\n'.repeat(10) + 'y'.repeat(MAX_PASTE_CHARS)).length, 0);
});

test('what is new is what the last paste did not have, whatever the case', () => {
  const before = ['Senior Backend Engineer (Remote, EU)', 'Sales Manager'];
  const now = ['senior backend engineer (remote, eu)', 'Staff Engineer', 'Sales Manager'];
  assert.deepEqual(newLines(before, now), ['Staff Engineer']);
});

test('a role line is one a search would take by its title words', () => {
  const lines = pageLines(PAGE);
  const backend = { include: ['backend', 'engineer'], exclude: ['java'] };
  assert.deepEqual(roleLines(lines, [backend]), ['Senior Backend Engineer (Remote, EU)']);
  assert.deepEqual(roleLines(lines, [backend, { include: ['frontend'], exclude: [] }]), [
    'Senior Backend Engineer (Remote, EU)',
    'Frontend Developer — Berlin',
  ]);
  assert.deepEqual(roleLines(lines, []), []);
});

test('a search lends its stack and role words, and its excludes', () => {
  assert.deepEqual(titleWordsOf([{ stackRequired: ['node'], roleTypes: ['backend'], stackExclude: ['java'] }]), [
    { include: ['node', 'backend'], exclude: ['java'] },
  ]);
});

test('the flash says what was read, what is new, and which lines look like roles', () => {
  assert.equal(
    pasteSummary({ name: 'Acme', lines: 42, since: null, added: 0, roles: ['Senior Backend Engineer', 'Staff Engineer'] }),
    "Read 42 lines from Acme's page. 2 look like roles your searches want: Senior Backend Engineer; Staff Engineer. Paste it again later and it says what is new.",
  );
  assert.equal(pasteSummary({ name: 'Acme', lines: 40, since: 'Sep 20', added: 0, roles: [] }), "Read 40 lines from Acme's page. Nothing new since Sep 20.");
  assert.equal(
    pasteSummary({ name: 'Acme', lines: 44, since: 'Sep 20', added: 5, roles: ['A', 'B', 'C', 'D'] }),
    "Read 44 lines from Acme's page. 5 new since Sep 20. 4 look like roles your searches want: A; B; C; ….",
  );
  assert.equal(
    pasteSummary({ name: 'Acme', lines: 1, since: 'Sep 20', added: 1, roles: ['Staff Engineer'] }),
    "Read 1 line from Acme's page. 1 new since Sep 20. One looks like a role your searches want: Staff Engineer.",
  );
});
