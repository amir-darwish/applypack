import { test } from 'node:test';
import assert from 'node:assert/strict';
import { delistPlan, DELISTED_CODE } from './delisted';
import { forgetListing, listedInFull, wasListedInFull } from './listing';

const row = (id: number, externalId: string, liveness: string | null = null, livenessCode: string | null = null) => ({ id, externalId, liveness, livenessCode });

test('a row the whole listing no longer carries is delisted, once', () => {
  const plan = delistPlan([row(1, 'a'), row(2, 'b'), row(3, 'c', 'expired', DELISTED_CODE)], new Set(['a']));
  assert.deepEqual(plan, { delisted: [2], relisted: [] });
});

test('a row back on the board is relisted — only if the listing is what took it down', () => {
  const plan = delistPlan(
    [row(1, 'a', 'expired', DELISTED_CODE), row(2, 'b', 'expired', 'http_gone'), row(3, 'c', 'active', 'api_ok')],
    new Set(['a', 'b', 'c']),
  );
  assert.deepEqual(plan, { delisted: [], relisted: [1] });
});

test('"in full" is said per read and heard once; a failed read leaves nothing behind', () => {
  listedInFull(7);
  assert.equal(wasListedInFull(7), true);
  assert.equal(wasListedInFull(7), false);
  listedInFull(8);
  forgetListing(8);
  assert.equal(wasListedInFull(8), false);
});
