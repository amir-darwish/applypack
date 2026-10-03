import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  RANGES,
  RANGE_KEYS,
  countByDay,
  dailySeries,
  dayNumber,
  isRangeKey,
  niceTicks,
  rangePoints,
  rangeTotals,
  trend,
  trendText,
} from './stats-series';

const NOW = new Date('2026-09-30T15:00:00Z');
const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe('days', () => {
  it('a day ends at midnight UTC, whatever the hour', () => {
    assert.equal(dayNumber(new Date('2026-09-30T00:00:00Z')), dayNumber(new Date('2026-09-30T23:59:59Z')));
    assert.equal(dayNumber(new Date('2026-10-01T00:00:00Z')) - dayNumber(new Date('2026-09-30T23:59:59Z')), 1);
  });

  it('counts moments per day and skips the missing ones', () => {
    const counts = countByDay([day('2026-09-30'), day('2026-09-30'), null, day('2026-09-28'), undefined]);
    assert.equal(counts.get(dayNumber(day('2026-09-30'))), 2);
    assert.equal(counts.get(dayNumber(day('2026-09-28'))), 1);
    assert.equal(counts.size, 2);
  });

  it('a day nothing happened on is a zero, not a gap', () => {
    const counts = countByDay([day('2026-09-30'), day('2026-09-28'), day('2026-09-28')]);
    assert.deepEqual(dailySeries(counts, 4, NOW), [0, 2, 0, 1]);
  });

  it('a moment outside the window is left out', () => {
    assert.deepEqual(dailySeries(countByDay([day('2026-09-01')]), 3, NOW), [0, 0, 0]);
  });
});

describe('ranges', () => {
  it('every range divides into whole points, thirty at most', () => {
    for (const key of RANGE_KEYS) {
      const { days, step } = RANGES[key];
      assert.equal(days % step, 0, key);
      assert.ok(days / step <= 30, key);
    }
  });

  it('knows its own keys and nothing else', () => {
    assert.ok(isRangeKey('30d'));
    assert.ok(!isRangeKey('31d'));
    assert.ok(!isRangeKey(undefined));
    assert.ok(!isRangeKey('toString'));
  });

  it('a week is seven daily points, the last one today', () => {
    const counts = countByDay([day('2026-09-30'), day('2026-09-24')]);
    const points = rangePoints(counts, '7d', NOW);
    assert.equal(points.length, 7);
    assert.deepEqual(points.map((p) => p.value), [1, 0, 0, 0, 0, 0, 1]);
    assert.equal(points[6]!.from.toISOString(), '2026-09-30T00:00:00.000Z');
    assert.equal(points[6]!.to.toISOString(), '2026-09-30T00:00:00.000Z');
  });

  it('ninety days read in steps of three, the last step ending today', () => {
    const counts = countByDay([day('2026-09-30'), day('2026-09-29'), day('2026-09-28'), day('2026-09-27')]);
    const points = rangePoints(counts, '90d', NOW);
    assert.equal(points.length, 30);
    assert.equal(points[29]!.value, 3);
    assert.equal(points[28]!.value, 1);
    assert.equal(points[29]!.from.toISOString(), '2026-09-28T00:00:00.000Z');
    assert.equal(points[29]!.to.toISOString(), '2026-09-30T00:00:00.000Z');
    assert.equal(points.reduce((sum, p) => sum + p.value, 0), 4);
  });

  it('sums a range and the equal range before it', () => {
    const counts = countByDay([day('2026-09-30'), day('2026-09-24'), day('2026-09-23'), day('2026-09-17'), day('2026-09-16')]);
    assert.deepEqual(rangeTotals(counts, '7d', NOW), { current: 2, previous: 2 });
  });
});

describe('trend', () => {
  it('gives a rate only when the period before is large enough to carry one', () => {
    assert.deepEqual(trend(19, 12), { delta: 7, percent: 58, direction: 'up' });
    assert.deepEqual(trend(4, 1), { delta: 3, percent: null, direction: 'up' });
    assert.deepEqual(trend(5, 0), { delta: 5, percent: null, direction: 'up' });
    assert.deepEqual(trend(10, 20), { delta: -10, percent: -50, direction: 'down' });
    assert.deepEqual(trend(3, 3), { delta: 0, percent: null, direction: 'flat' });
  });

  it('reads as a rate, a count, or nothing moved', () => {
    assert.equal(trendText(trend(19, 12)), '+58%');
    assert.equal(trendText(trend(4, 1)), '+3');
    assert.equal(trendText(trend(10, 20)), '−50%');
    assert.equal(trendText(trend(1, 4)), '−3');
    assert.equal(trendText(trend(12, 12)), '0');
    assert.equal(trendText(trend(2400, 1)), '+2,399');
  });
});

describe('axis ticks', () => {
  it('climbs from zero to a round ceiling in whole numbers', () => {
    assert.deepEqual(niceTicks(17), [0, 5, 10, 15, 20]);
    assert.deepEqual(niceTicks(60), [0, 20, 40, 60]);
    assert.deepEqual(niceTicks(124), [0, 50, 100, 150]);
    assert.deepEqual(niceTicks(8), [0, 2, 4, 6, 8]);
    assert.deepEqual(niceTicks(1000), [0, 250, 500, 750, 1000]);
  });

  it('an empty or tiny series still gets an axis', () => {
    assert.deepEqual(niceTicks(0), [0, 1, 2, 3, 4]);
    assert.deepEqual(niceTicks(3), [0, 1, 2, 3, 4]);
  });

  it('never stops under the value it has to hold', () => {
    for (let max = 0; max <= 500; max++) {
      const ticks = niceTicks(max);
      assert.ok(ticks[ticks.length - 1]! >= max, String(max));
      assert.ok(ticks.length <= 6, String(max));
      assert.ok(ticks.every(Number.isInteger), String(max));
    }
  });
});
