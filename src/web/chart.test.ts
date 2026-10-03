import { test } from 'node:test';
import assert from 'node:assert/strict';

interface Said {
  label: string;
  value: string;
  delta: string;
  direction: string;
}

// Served as a static ES module; node loads it the same way the browser does.
// @ts-expect-error — plain JS with no declaration file; the shape is asserted below.
const mod = import('./public/chart.mjs') as Promise<{
  nearestIndex: (x: number, width: number, count: number) => number;
  describePoint: (points: { l: string; v: number; y: number }[], i: number, unit: string, step: string) => Said;
  placeTip: (at: { x: number; y: number; width: number; tipWidth: number; tipHeight: number }) => { left: number; top: number };
  wireCharts: unknown;
}>;

const POINTS = [
  { l: 'Sep 28', v: 1, y: 90 },
  { l: 'Sep 29', v: 13, y: 10 },
  { l: 'Sep 30', v: 13, y: 10 },
  { l: 'Oct 1', v: 4, y: 70 },
];

test('the pointer picks the nearest point, the points spread edge to edge', async () => {
  const { nearestIndex } = await mod;
  assert.equal(nearestIndex(0, 300, 4), 0);
  assert.equal(nearestIndex(49, 300, 4), 0);
  assert.equal(nearestIndex(51, 300, 4), 1);
  assert.equal(nearestIndex(300, 300, 4), 3);
  assert.equal(nearestIndex(-20, 300, 4), 0);
  assert.equal(nearestIndex(900, 300, 4), 3);
});

test('a plot with one point, or no width yet, has one answer', async () => {
  const { nearestIndex } = await mod;
  assert.equal(nearestIndex(120, 300, 1), 0);
  assert.equal(nearestIndex(120, 0, 4), 0);
});

test('a point says its day, its count in words, and the move from the point before', async () => {
  const { describePoint } = await mod;
  assert.deepEqual(describePoint(POINTS, 1, 'job', 'day'), { label: 'Sep 29', value: '13 jobs', delta: '+12 vs previous day', direction: 'up' });
  assert.deepEqual(describePoint(POINTS, 3, 'job', '3 days'), { label: 'Oct 1', value: '4 jobs', delta: '−9 vs previous 3 days', direction: 'down' });
  assert.deepEqual(describePoint(POINTS, 2, 'job', 'day'), { label: 'Sep 30', value: '13 jobs', delta: 'same as the previous day', direction: 'flat' });
});

test('the first point has nothing before it, and one job is not "1 jobs"', async () => {
  const { describePoint } = await mod;
  assert.deepEqual(describePoint(POINTS, 0, 'job', 'day'), { label: 'Sep 28', value: '1 job', delta: '', direction: 'flat' });
});

test('the card sits above its dot, centred, and stays inside the plot', async () => {
  const { placeTip } = await mod;
  assert.deepEqual(placeTip({ x: 200, y: 150, width: 600, tipWidth: 100, tipHeight: 60 }), { left: 150, top: 78 });
  assert.equal(placeTip({ x: 10, y: 150, width: 600, tipWidth: 100, tipHeight: 60 }).left, 0);
  assert.equal(placeTip({ x: 595, y: 150, width: 600, tipWidth: 100, tipHeight: 60 }).left, 500);
});

test('at a peak the card moves beside the dot instead of over it', async () => {
  const { placeTip } = await mod;
  // No room above: to the right of the dot…
  assert.deepEqual(placeTip({ x: 200, y: 20, width: 600, tipWidth: 100, tipHeight: 60 }), { left: 212, top: 0 });
  // …or to its left when the right edge is near.
  assert.deepEqual(placeTip({ x: 560, y: 40, width: 600, tipWidth: 100, tipHeight: 60 }), { left: 448, top: 10 });
});
