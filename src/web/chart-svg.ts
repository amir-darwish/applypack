/*
 * The geometry of the dashboard's charts (pure): values in, SVG path data
 * out. No chart library — the Overview draws one series, and the server
 * renders it, so the chart is in the page before any script runs.
 *
 * The plot is drawn in a fixed box and stretched to its container
 * (`preserveAspectRatio="none"`, strokes kept at their width by
 * `vector-effect`), so the words around it — ticks, dates, the tooltip — are
 * HTML and never stretch with it.
 */

/** The box every plot is drawn in; only its proportions matter. */
export const PLOT_WIDTH = 1000;
export const PLOT_HEIGHT = 240;
/** Room above the highest tick, so a peak's stroke is not cut at the top edge. */
const PLOT_TOP = 8;

export interface PlotPoint {
  x: number;
  y: number;
}

/** Where each value sits in the plot box: spread edge to edge, zero on the floor, `top` at the ceiling. */
export function plotPoints(values: readonly number[], top: number): PlotPoint[] {
  const last = Math.max(1, values.length - 1);
  const scale = top > 0 ? (PLOT_HEIGHT - PLOT_TOP) / top : 0;
  return values.map((v, i) => ({
    x: round((i / last) * PLOT_WIDTH),
    y: round(PLOT_HEIGHT - Math.max(0, v) * scale),
  }));
}

/** A value's height in the plot as a share of it from the top, for an HTML label beside the plot. */
export function tickOffset(value: number, top: number): number {
  const y = PLOT_HEIGHT - (top > 0 ? (value / top) * (PLOT_HEIGHT - PLOT_TOP) : 0);
  return round((y / PLOT_HEIGHT) * 100);
}

/**
 * The line through the points, smoothed without overshoot (monotone cubic,
 * Fritsch–Carlson): a curve never dips under zero between two days that both
 * sit on it, and never rises above a peak it did not reach.
 */
export function linePath(points: readonly PlotPoint[]): string {
  if (points.length === 0) return '';
  const first = points[0]!;
  if (points.length === 1) return `M${first.x},${first.y}`;
  const slopes = tangents(points);
  let d = `M${first.x},${first.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const third = (b.x - a.x) / 3;
    d += `C${round(a.x + third)},${round(a.y + third * slopes[i]!)} ${round(b.x - third)},${round(b.y - third * slopes[i + 1]!)} ${b.x},${b.y}`;
  }
  return d;
}

/** The same line closed down to the floor — what the fill under it paints. */
export function areaPath(points: readonly PlotPoint[]): string {
  if (points.length < 2) return '';
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${linePath(points)}L${last.x},${PLOT_HEIGHT}L${first.x},${PLOT_HEIGHT}Z`;
}

/** The slope at each point: zero at a peak or a trough, the harmonic mean of its neighbours' otherwise. */
function tangents(points: readonly PlotPoint[]): number[] {
  const n = points.length;
  const secant: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1]!.x - points[i]!.x;
    secant.push(dx === 0 ? 0 : (points[i + 1]!.y - points[i]!.y) / dx);
  }
  const out: number[] = [secant[0]!];
  for (let i = 1; i < n - 1; i++) {
    const before = secant[i - 1]!;
    const after = secant[i]!;
    out.push(before * after <= 0 ? 0 : (2 * before * after) / (before + after));
  }
  out.push(secant[n - 2]!);
  return out;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * A sparkline's bars as shares of the tallest one, 0–100. A day with nothing
 * keeps a stub (`floor`), so fourteen empty days still read as a row of days.
 */
export function barHeights(values: readonly number[], floor = 8): number[] {
  const top = Math.max(...values, 0);
  return values.map((v) => (top > 0 && v > 0 ? Math.max(floor, Math.round((v / top) * 100)) : floor));
}
