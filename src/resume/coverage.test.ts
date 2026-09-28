import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverage } from './coverage';
import { readKeywords, type MatchKeyword } from './prompts';
import type { KeywordMatcher } from './keyword-matcher';

async function matcher(): Promise<KeywordMatcher> {
  // @ts-expect-error — plain JS with no declaration file.
  return (await import('../web/public/target.mjs')) as KeywordMatcher;
}

const kw = (term: string, status: MatchKeyword['status'], over: Record<string, unknown> = {}): MatchKeyword =>
  readKeywords([{ term, priority: 1, requirement: 'must', primary: false, status, aliases: [], ...over }])[0]!;

const RESUME = 'Backend engineer. Go, PostgreSQL and Docker in production; Vue on the side.';

test('a term several postings want and the text lacks is listed, most postings first', async () => {
  const m = await matcher();
  const tables = [
    [kw('Kubernetes', 'cannot_claim'), kw('Go', 'present'), kw('Terraform', 'cannot_claim', { requirement: 'preferred' })],
    [kw('kubernetes', 'cannot_claim'), kw('Terraform', 'cannot_claim')],
    [kw('Kubernetes', 'cannot_claim', { requirement: 'nice' }), kw('GraphQL', 'cannot_claim')],
  ];
  const out = coverage(tables, RESUME, [], m);
  assert.equal(out.postings, 3);
  // GraphQL is one posting's; Go is written.
  assert.deepEqual(out.terms, [
    { term: 'Kubernetes', missing: 3, must: 2, kind: 'gap' },
    { term: 'Terraform', missing: 2, must: 1, kind: 'gap' },
  ]);
});

test('the text as it is now settles presence, and a confirmed fact settles a question', async () => {
  const m = await matcher();
  // Every comparison predates the edit that wrote Docker in; Redis was answered on /resumes since.
  const tables = [
    [kw('Docker', 'cannot_claim'), kw('Redis', 'ask_user')],
    [kw('Docker', 'add'), kw('Redis', 'ask_user')],
  ];
  const out = coverage(tables, RESUME, [{ term: 'redis', status: 'confirmed', note: null }], m);
  assert.deepEqual(out.terms, [{ term: 'Redis', missing: 2, must: 2, kind: 'unwritten' }]);
});

test('the most actionable reading wins, and the postings describing themselves are not asks', async () => {
  const m = await matcher();
  const tables = [
    [kw('Kafka', 'cannot_claim'), kw('fintech', 'cannot_claim', { requirement: 'context' })],
    [kw('Kafka', 'add'), kw('fintech', 'cannot_claim', { requirement: 'context' })],
    [kw('Kafka', 'ask_user')],
  ];
  assert.deepEqual(coverage(tables, RESUME, [], m).terms, [{ term: 'Kafka', missing: 3, must: 3, kind: 'unwritten' }]);
});

test('an "any of" group the resume meets is not missing its other members', async () => {
  const m = await matcher();
  const tables = [
    [kw('React', 'cannot_claim', { group: 'frontend framework' }), kw('Vue', 'present', { group: 'Frontend framework' })],
    [kw('React', 'cannot_claim', { group: 'frontend framework' }), kw('Vue', 'present', { group: 'frontend framework' })],
    [kw('React', 'cannot_claim'), kw('Angular', 'cannot_claim')],
    [kw('React', 'cannot_claim')],
  ];
  assert.deepEqual(coverage(tables, RESUME, [], m).terms, [{ term: 'React', missing: 2, must: 2, kind: 'gap' }]);
});

test('an ignored row and a user re-level are read as the user left them', async () => {
  const m = await matcher();
  const tables = [
    [kw('Jira', 'cannot_claim', { override: { excluded: true } }), kw('AWS', 'cannot_claim', { override: { requirement: 'nice' } })],
    [kw('Jira', 'cannot_claim', { override: { excluded: true } }), kw('AWS', 'cannot_claim')],
  ];
  assert.deepEqual(coverage(tables, RESUME, [], m).terms, [{ term: 'AWS', missing: 2, must: 1, kind: 'gap' }]);
});
