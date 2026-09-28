import { test } from 'node:test';
import assert from 'node:assert/strict';
import { annotateElsewhere, applyFacts, canonicalTerm, UNSURE_NOTE } from './facts';
import type { MatchKeyword } from './prompts';

const kw = (over: Partial<MatchKeyword>): MatchKeyword => ({
  term: 'Azure',
  priority: 1,
  requirement: 'must',
  primary: false,
  status: 'ask_user',
  aliases: [],
  where: null,
  note: null,
  elsewhere: null,
  ...over,
});

test('canonicalTerm lowercases and trims', () => {
  assert.equal(canonicalTerm('  Node.js '), 'node.js');
});

test('a confirmed fact flips ask_user and cannot_claim to add with the user note', () => {
  const { keywords, changed } = applyFacts(
    [kw({}), kw({ term: 'Terraform', status: 'cannot_claim' })],
    [
      { term: 'azure', status: 'confirmed', note: 'AKS at Contoso, 2023' },
      { term: 'terraform', status: 'confirmed', note: null },
    ],
  );
  assert.equal(changed, 2);
  assert.equal(keywords[0]?.status, 'add');
  assert.equal(keywords[0]?.note, 'user-confirmed: AKS at Contoso, 2023');
  assert.equal(keywords[1]?.status, 'add');
  assert.equal(keywords[1]?.note, 'user-confirmed');
});

test('a denied fact flips ask_user to cannot_claim but never downgrades text evidence', () => {
  const { keywords, changed } = applyFacts(
    [kw({}), kw({ term: 'PHP', status: 'present' }), kw({ term: 'Go', status: 'add' })],
    [
      { term: 'azure', status: 'denied', note: null },
      { term: 'php', status: 'denied', note: null },
      { term: 'go', status: 'denied', note: null },
    ],
  );
  assert.equal(changed, 1);
  assert.equal(keywords[0]?.status, 'cannot_claim');
  assert.equal(keywords[1]?.status, 'present');
  assert.equal(keywords[2]?.status, 'add');
});

test('"not sure" stops the question and claims nothing, once', () => {
  const unsure = [{ term: 'azure', status: 'unknown', note: null }];
  const { keywords, changed } = applyFacts([kw({}), kw({ term: 'GCP', status: 'cannot_claim' }), kw({ term: 'AWS', status: 'present' })], [
    ...unsure,
    { term: 'gcp', status: 'unknown', note: null },
    { term: 'aws', status: 'unknown', note: null },
  ]);
  assert.equal(changed, 2);
  assert.deepEqual(
    keywords.map((k) => [k.term, k.status, k.note]),
    [
      ['Azure', 'cannot_claim', UNSURE_NOTE],
      ['GCP', 'cannot_claim', UNSURE_NOTE],
      // Written in the text: no answer outranks that.
      ['AWS', 'present', null],
    ],
  );
  // Applied again (a re-score, the next comparison of the same row): nothing moves.
  assert.equal(applyFacts(keywords, unsure).changed, 0);
});

test('facts match through aliases and no facts means no work', () => {
  const { keywords } = applyFacts(
    [kw({ term: 'Kubernetes', aliases: ['k8s'] })],
    [{ term: 'k8s', status: 'confirmed', note: null }],
  );
  assert.equal(keywords[0]?.status, 'add');
  const input = [kw({})];
  assert.equal(applyFacts(input, []).keywords, input);
});

test('annotateElsewhere marks only unclaimable keywords, via term or alias', () => {
  const out = annotateElsewhere(
    [
      kw({ term: 'Golang', status: 'cannot_claim', aliases: ['go'] }),
      kw({ term: 'Docker', status: 'present' }),
      kw({ term: 'Rust', status: 'ask_user' }),
    ],
    [
      { skill: 'go', resumeName: 'Backend CV' },
      { skill: 'docker', resumeName: 'Backend CV' },
    ],
  );
  assert.equal(out[0]?.elsewhere, 'Backend CV');
  assert.equal(out[1]?.elsewhere, null);
  assert.equal(out[2]?.elsewhere, null);
});
