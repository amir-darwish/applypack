import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadKeywordMatcher } from './keyword-matcher';
import { readKeywords } from './prompts';
import { STALE_MONTHS, termUsage, usageLine } from './usage';

// TASKS R8: how long and how lately the dated roles show each term.
const NOW = new Date('2026-09-28T00:00:00Z');
const RESUME = `Jane Example
Backend Engineer

EXPERIENCE
Senior Backend Engineer — Acme
Jan 2021 – Present
- Built the billing service in Node.js and PostgreSQL.

Backend Engineer — Globex
Mar 2017 – Dec 2020
- Ran the Kafka pipeline for 2M events a day.
- Wrote the reporting jobs in Node.js.

SKILLS
Node.js, PostgreSQL, Kafka, Docker`;

const keywords = readKeywords(
  ['Node.js', 'PostgreSQL', 'Kafka', 'Docker', 'Rust'].map((term) => ({ term, priority: 1, requirement: 'must', primary: false, status: term === 'Rust' ? 'cannot_claim' : 'present', aliases: [] })),
);

test('each term gets the years of the roles that name it, and how long ago the last one ended', async () => {
  const usage = termUsage(keywords, RESUME, await loadKeywordMatcher(), NOW);
  assert.deepEqual(usage.get('Node.js'), { years: 9.6, monthsSince: 0 }, 'both roles, merged — current');
  assert.deepEqual(usage.get('PostgreSQL'), { years: 5.8, monthsSince: 0 });
  assert.deepEqual(usage.get('Kafka'), { years: 3.8, monthsSince: 69 }, 'Globex only — ended Dec 2020');
  assert.equal(usage.has('Docker'), false, 'only on the skills line: no dated role names it');
  assert.equal(usage.has('Rust'), false, 'a term the resume cannot claim has no usage to show');
  assert.ok(69 >= STALE_MONTHS);
});

test('a resume without dated roles has nothing to say', async () => {
  assert.equal(termUsage(keywords, 'Skills: Node.js, Kafka', await loadKeywordMatcher(), NOW).size, 0);
});

test('the line reads as a person would say it', () => {
  assert.equal(usageLine({ years: 9.6, monthsSince: 0 }), '9.6 yrs at work · current');
  assert.equal(usageLine({ years: 1, monthsSince: 69 }), '1 yr at work · 6 yrs ago');
  assert.equal(usageLine({ years: 0.5, monthsSince: 7 }), '0.5 yrs at work · 7 mo ago');
  assert.equal(usageLine({ years: 2, monthsSince: 13 }), '2 yrs at work · 1 yr ago');
});
