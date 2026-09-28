import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNewer, parseVersion } from './versions';

test('a release tag reads with or without its v, and nothing else reads', () => {
  assert.deepEqual(parseVersion('v2.21.0'), [2, 21, 0]);
  assert.deepEqual(parseVersion(' 2.3.10 '), [2, 3, 10]);
  for (const bad of ['2.21', 'v2.21.0-rc.1', 'latest', '']) assert.equal(parseVersion(bad), null);
});

test('newer means a later release, compared number by number', () => {
  assert.equal(isNewer('2.21.0', 'v2.22.0'), true);
  assert.equal(isNewer('2.9.3', '2.10.0'), true, 'not a string comparison');
  assert.equal(isNewer('2.21.0', '2.21.0'), false);
  assert.equal(isNewer('2.21.1', '2.21.0'), false);
  assert.equal(isNewer('2.21.0', 'v3.0.0-beta'), false, 'a tag this cannot read is not announced');
});
