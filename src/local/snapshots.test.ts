import { test } from 'node:test';
import assert from 'node:assert/strict';
import { snapshotDay, snapshotPlan, snapshotSkips, snapshotsToKeep } from './snapshots';

test('one snapshot a day, the newest kept, and folders that are not ours left alone', () => {
  assert.deepEqual(snapshotPlan([], '2026-09-28', 3), { take: true, drop: [] });
  assert.deepEqual(snapshotPlan(['2026-09-28'], '2026-09-28', 3), { take: false, drop: [] });
  assert.deepEqual(snapshotPlan(['2026-09-25', '2026-09-26', '2026-09-27', 'notes'], '2026-09-28', 3), {
    take: true,
    drop: ['2026-09-25'],
  });
  // Lowering the count prunes on the next start even without a new snapshot.
  assert.deepEqual(snapshotPlan(['2026-09-26', '2026-09-27', '2026-09-28'], '2026-09-28', 1), {
    take: false,
    drop: ['2026-09-27', '2026-09-26'],
  });
  assert.deepEqual(snapshotPlan(['2026-09-27'], '2026-09-28', 0), { take: false, drop: [] });
});

test('the count is 0 to 30, else three', () => {
  assert.equal(snapshotsToKeep(undefined), 3);
  assert.equal(snapshotsToKeep(''), 3);
  assert.equal(snapshotsToKeep('0'), 0);
  assert.equal(snapshotsToKeep(' 7 '), 7);
  for (const bad of ['-1', '2.5', 'many', '31']) assert.equal(snapshotsToKeep(bad), 3, bad);
});

test('a day is the machine calendar day, and the server marker files stay out of a copy', () => {
  assert.equal(snapshotDay(new Date(2026, 8, 5, 23, 59)), '2026-09-05');
  assert.equal(snapshotSkips('postmaster.pid'), true);
  assert.equal(snapshotSkips('PG_VERSION'), false);
});
