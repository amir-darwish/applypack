import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PLOT_HEIGHT, PLOT_WIDTH, areaPath, barHeights, linePath, plotPoints, tickOffset } from './chart-svg';

/** Every y a path mentions, control points included. */
function ysOf(path: string): number[] {
  return [...path.matchAll(/-?\d+(?:\.\d+)?,(-?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
}

describe('plot points', () => {
  it('spread edge to edge, zero on the floor, the top value under the ceiling', () => {
    const points = plotPoints([0, 10, 20], 20);
    assert.deepEqual(points.map((p) => p.x), [0, PLOT_WIDTH / 2, PLOT_WIDTH]);
    assert.equal(points[0]!.y, PLOT_HEIGHT);
    assert.ok(points[2]!.y > 0 && points[2]!.y < 20);
    assert.ok(points[1]!.y > points[2]!.y && points[1]!.y < points[0]!.y);
  });

  it('an empty axis puts everything on the floor', () => {
    assert.deepEqual(plotPoints([0, 0], 0).map((p) => p.y), [PLOT_HEIGHT, PLOT_HEIGHT]);
  });

  it('a tick label sits where its grid line is', () => {
    assert.equal(tickOffset(0, 20), 100);
    const top = plotPoints([20], 20)[0]!.y;
    assert.equal(tickOffset(20, 20), Math.round((top / PLOT_HEIGHT) * 10000) / 100);
  });
});

describe('the line', () => {
  it('starts at the first point and ends at the last', () => {
    const points = plotPoints([1, 4, 2, 8], 8);
    const d = linePath(points);
    assert.ok(d.startsWith(`M${points[0]!.x},${points[0]!.y}`));
    assert.ok(d.endsWith(`${points[3]!.x},${points[3]!.y}`));
    assert.equal(d.split('C').length - 1, 3);
  });

  it('never dips under the floor or rises over the ceiling between two days', () => {
    // A spike between zeros is where an ordinary spline overshoots under the axis.
    const values = [0, 0, 17, 0, 0, 2, 3, 1, 0, 13, 4];
    const d = linePath(plotPoints(values, 20));
    for (const y of ysOf(d)) {
      assert.ok(y <= PLOT_HEIGHT, `${y} is under the floor`);
      assert.ok(y >= 0, `${y} is over the ceiling`);
    }
  });

  it('is flat between two equal neighbours', () => {
    const d = linePath(plotPoints([5, 5, 5], 10));
    assert.equal(new Set(ysOf(d)).size, 1);
  });

  it('draws nothing from nothing, and a point from one value', () => {
    assert.equal(linePath([]), '');
    assert.equal(linePath(plotPoints([3], 4)), `M0,${plotPoints([3], 4)[0]!.y}`);
    assert.equal(areaPath(plotPoints([3], 4)), '');
  });

  it('the area is the line closed down to the floor', () => {
    const points = plotPoints([1, 2, 3], 4);
    const area = areaPath(points);
    assert.ok(area.startsWith(linePath(points)));
    assert.ok(area.endsWith(`L${PLOT_WIDTH},${PLOT_HEIGHT}L0,${PLOT_HEIGHT}Z`));
  });
});

describe('sparkline bars', () => {
  it('are shares of the tallest, with a stub for an empty day', () => {
    assert.deepEqual(barHeights([0, 5, 10]), [8, 50, 100]);
    assert.deepEqual(barHeights([0, 0, 0]), [8, 8, 8]);
    assert.deepEqual(barHeights([1, 100]), [8, 100]);
  });
});
