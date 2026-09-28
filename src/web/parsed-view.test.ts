import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsedView } from './parsed-view';

// TASKS R12: the parts a plain parser finds, and the ones it does not.
const RESUME = `Jane Example
Senior Backend Engineer
jane@example.com · +48 600 100 200 · github.com/jane · Warsaw, Poland

SUMMARY
Backend engineer who ships billing systems.

EXPERIENCE
Senior Backend Engineer — Acme
Jan 2021 – Present
- Built the billing service in Node.js.
- Cut p95 latency by 40%.
Backend Developer — Beta Corp
- Wrote REST APIs in PHP.

SKILLS
Node.js, TypeScript, PostgreSQL
`;

test('the name, the contacts, the sections and the roles a parser reads', () => {
  const view = parsedView(RESUME);
  assert.equal(view.name, 'Jane Example');
  assert.equal(view.headline, 'Senior Backend Engineer');
  assert.deepEqual(view.contacts.map((c) => [c.label, c.value !== null]), [
    ['Email', true],
    ['Phone', true],
    ['Link', true],
    ['Location', true],
  ]);
  assert.deepEqual(view.sections, ['Summary', 'Skills (1 group)', 'Experience (2 roles)']);
  assert.equal(view.roles[0]!.dates, 'Jan 2021 – Present');
  assert.equal(view.roles[0]!.bullets, 2);
  // The role with no dates is the one a filter drops: the page badges it.
  assert.equal(view.roles[1]!.dates, null);
});

test('a text that opens on a section says what is missing', () => {
  const view = parsedView('EXPERIENCE\nBackend Developer — Beta Corp\n- Wrote REST APIs in PHP.');
  assert.ok(view.contacts.every((c) => c.value === null));
  assert.deepEqual(view.sections, ['Experience (1 role)']);
});

test('the separators a flattened table row leaves are not part of a name', () => {
  // How the .docx reader renders a two-cell role line and an education row (gotcha 18).
  const view = parsedView('Jane Example\n\nEXPERIENCE\nSenior Backend Engineer Acme | | Jan 2021 – Present\n- Built the billing service.\n\nEDUCATION\nBSc Computer Science Warsaw University of Technology | | 2014 – 2018');
  assert.equal(view.roles[0]?.title, 'Senior Backend Engineer Acme');
  assert.equal(view.roles[0]?.dates, 'Jan 2021 – Present');
  assert.equal(view.education[0]?.title, 'BSc Computer Science Warsaw University of Technology');
});
