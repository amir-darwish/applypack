import { test } from 'node:test';
import assert from 'node:assert/strict';
import { basicAuthHeader, HEARTBEAT_EVERY_MS, HEARTBEAT_STALE_MS, heartbeatFresh } from './heartbeat';

test('a heartbeat is fresh for three missed beats, then stale', () => {
  const now = 10_000_000;
  assert.equal(HEARTBEAT_STALE_MS, 3 * HEARTBEAT_EVERY_MS);
  assert.equal(heartbeatFresh(now - HEARTBEAT_EVERY_MS, now), true);
  assert.equal(heartbeatFresh(now - HEARTBEAT_STALE_MS, now), true);
  assert.equal(heartbeatFresh(now - HEARTBEAT_STALE_MS - 1, now), false);
});

test('/health is asked with the dashboard lock when there is one, and without it when not', () => {
  assert.deepEqual(basicAuthHeader('ada:s3cret:colon'), { authorization: `Basic ${Buffer.from('ada:s3cret:colon').toString('base64')}` });
  assert.deepEqual(basicAuthHeader(undefined), {});
  assert.deepEqual(basicAuthHeader(''), {});
});
