// Figures for the topic "Definite integrals and area" (src/pages/courses/a-level/definite-integrals.html).
// Every curve and every shaded region is drawn from the function that defines it, so a picture cannot disagree with
// its equation. test/alevel-definite-integrals.spec.ts reads GEOM, CURVES, POINTS and SHADES to check each curve,
// each marked point and the area of each shaded region against the maths written independently of this file.
// A key at the top names each curve, so no label sits on a curve. Labels are short: the text is 24px in a 640px picture.
import { plane } from '../figure-lib.mjs';

const W = 640;
const H = 460;
const LEFT = 64;
const RIGHT = 48;
const TOP = 56;
const BOTTOM = 52;

/** The picture's size and range, kept so the test can turn a pixel back into graph coordinates. */
export const GEOM = {};
/** The curves of each figure, in the order they are drawn: { cls, fn, from, to }. */
export const CURVES = {};
/** The marked points of each figure: { x, y }. */
export const POINTS = {};
/** The shaded regions of each figure: { upper, lower, from, to }. */
export const SHADES = {};

/** The key: a sample of each curve's style, then its equation. It sits just right of the y-axis, above the picture's top edge. */
function key(p, rows) {
  const x0 = p.X(0) + 24;
  rows.forEach(([cls, text], i) => {
    const y = 34 + 48 * i;
    p.raw(`<line class="${cls}" x1="${x0}" y1="${y - 8}" x2="${x0 + 56}" y2="${y - 8}"/>`);
    p.note(x0 + 70, y, text, { cls: 'alt' });
  });
}

/** A horizontal arrow with a head, drawn at height y from x1 to x2 (graph coordinates). */
function arrow(p, x1, x2, y) {
  const a = p.X(x1);
  const b = p.X(x2);
  const py = p.Y(y);
  const d = Math.sign(b - a);
  p.raw(`<line class="line" x1="${a}" y1="${py}" x2="${b - d * 10}" y2="${py}"/><polygon class="arrowhead" points="${b},${py} ${b - d * 18},${py - 9} ${b - d * 18},${py + 9}"/>`);
}

/** Build one figure. `draw` gets small helpers that also record what is drawn. */
function make(id, range, title, desc, draw) {
  const { xmin, xmax, ymin, ymax, xstep = 1, ystep = 1, xs = [] } = range;
  GEOM[id] = { width: W, height: H, left: LEFT, right: RIGHT, top: TOP, bottom: BOTTOM, xmin, xmax, ymin, ymax };
  CURVES[id] = [];
  POINTS[id] = [];
  SHADES[id] = [];
  const p = plane({ width: W, height: H, top: TOP, grid: false, xmin, xmax, ymin, ymax, xstep, ystep, tickLabels: false });
  const tools = {
    p,
    curve(fn, cls = 'curve', from = xmin, to = xmax) { CURVES[id].push({ cls, fn, from, to }); p.curve(fn, { cls, from, to }); },
    shade(upper, lower, from, to) { SHADES[id].push({ upper, lower, from, to }); p.shade(upper, lower, from, to, { cls: 'shade' }); },
    point(x, y, label = '', opts = {}) { POINTS[id].push({ x, y }); p.point(x, y, { label, ...opts }); },
  };
  draw(tools);
  // The scale numbers are left off (they crowd the origin letter); the x-values the text is about are written under the axis.
  for (const item of xs) { const [x, dy] = Array.isArray(item) ? item : [item, 54]; p.text(x, 0, String(x), { dy }); }
  return p.svg({ id, title, desc });
}

const zero = () => 0;
const sq = (x) => x * x;

// y = x^2 - 4 is used by three figures
const quad4 = (x) => x * x - 4;

export const FIGURES = {
  // ---- lesson 1: the area under a curve between two limits ----
  'definite-integrals-area-under': () => make('definite-integrals-area-under',
    { xs: [1, 3], xmin: -0.5, xmax: 4, ymin: -1, ymax: 10, ystep: 2 },
    'The area under the curve y = x squared from x = 1 to x = 3',
    'A graph of the curve y equals x squared, rising from the origin. The region under the curve, above the x-axis, between the vertical lines x = 1 and x = 3 is shaded and labelled area. The curve passes through the marked points (1, 1) and (3, 9). The lower limit is x = 1 and the upper limit is x = 3.',
    ({ p, curve, shade, point }) => {
      shade(sq, zero, 1, 3);
      curve(sq);
      point(1, 1, '(1, 1)', { anchor: 'end', dx: -12, dy: -14 });
      point(3, 9, '(3, 9)', { anchor: 'end', dx: -12, dy: -12 });
      p.text(2, 1, 'area');
      key(p, [['curve', 'y = x^2']]);
    }),

  // ---- lesson 2: why upper minus lower works (a thin strip), and why the constant cancels ----
  'definite-integrals-strip': () => make('definite-integrals-strip',
    { xmin: -0.5, xmax: 5, ymin: -1, ymax: 8, ystep: 2 },
    'The area A(x) and a thin strip of width h added on the right',
    'A graph of an increasing curve y equals f(x) above the x-axis. The region under the curve from x = a to x = x is shaded and labelled A(x). A thin strip of the same shade, of width h, sits just to its right, from x to x + h. Below the axis the three x-values a, x and x + h are marked.',
    ({ p, curve, shade }) => {
      const f = (x) => 0.25 * x * x + 1;
      shade(f, zero, 1, 3);
      shade(f, zero, 3, 3.6);
      curve(f);
      p.line(3, 0, 3, f(3), { cls: 'guide' });
      p.text(1, 0, 'a', { dy: 32 });
      p.text(3, 0, 'x', { dy: 32 });
      p.text(3.6, 0, 'x + h', { dy: 32 });
      p.text(2, 0.5, 'A(x)');
      p.text(3.75, 1.5, 'strip', { anchor: 'start' });
      key(p, [['curve', 'y = f(x)']]);
    }),

  'definite-integrals-constant': () => make('definite-integrals-constant',
    { xs: [1, 3], xmin: -1, xmax: 4, ymin: -2, ymax: 12, ystep: 2 },
    'Two antiderivatives of 2x rise by the same amount from x = 1 to x = 3',
    'Two graphs, one above the other. The solid curve is y equals x squared and the dashed curve is y equals x squared plus 2. Vertical dashed guides mark x = 1 and x = 3. On each curve there is a dot at x = 1 and a dot at x = 3. Between the two guides each curve climbs by the same amount.',
    ({ p, curve, point }) => {
      p.line(1, 0, 1, 3, { cls: 'guide' });
      p.line(3, 0, 3, 11, { cls: 'guide' });
      curve(sq);
      curve((x) => x * x + 2, 'curve-b');
      for (const x of [1, 3]) { point(x, x * x); point(x, x * x + 2); }
      key(p, [['curve', 'y = x^2'], ['curve-b', 'y = x^2 + 2']]);
    }),

  // ---- lesson 3: the area enclosed between a curve and the x-axis ----
  'definite-integrals-above-axis-roots': () => make('definite-integrals-above-axis-roots',
    { xs: [4], xmin: -1, xmax: 5, ymin: -1, ymax: 5 },
    'The area enclosed between y = 4x minus x squared and the x-axis',
    'A graph of the curve y equals 4x minus x squared, an upside-down parabola. It meets the x-axis at (0, 0) and (4, 0) and has its highest point at (2, 4). The region between the curve and the x-axis, from x = 0 to x = 4, is shaded and labelled area.',
    ({ p, curve, shade, point }) => {
      const f = (x) => 4 * x - x * x;
      shade(f, zero, 0, 4);
      curve(f, 'curve', 0, 4);
      point(0, 0);
      point(4, 0);
      point(2, 4, '(2, 4)', { anchor: 'middle', dx: 0, dy: -16 });
      p.text(2, 1.4, 'area');
      key(p, [['curve', 'y = 4x - x^2']]);
    }),

  // ---- lesson 4: a region below the axis ----
  'definite-integrals-below': () => make('definite-integrals-below',
    { xs: [2], xmin: -1, xmax: 3.5, ymin: -5, ymax: 3 },
    'The region between y = x squared minus 4 and the x-axis, from x = 0 to x = 2',
    'A graph of the curve y equals x squared minus 4, a parabola with its lowest point at (0, -4). It crosses the x-axis at (2, 0). The region between the curve and the x-axis from x = 0 to x = 2 lies below the x-axis. It is shaded and labelled below.',
    ({ p, curve, shade, point }) => {
      shade(zero, quad4, 0, 2);
      curve(quad4);
      point(0, -4);
      point(2, 0);
      p.text(0.8, -2, 'below');
      key(p, [['curve', 'y = x^2 - 4']]);
    }),

  // ---- lesson 5: a region that crosses the axis ----
  'definite-integrals-split': () => make('definite-integrals-split',
    { xs: [2, 3], xmin: -1, xmax: 4.3, ymin: -5, ymax: 6 },
    'The curve y = x squared minus 4 from x = 0 to x = 3, split at x = 2',
    'A graph of the curve y equals x squared minus 4. It crosses the x-axis at (2, 0). From x = 0 to x = 2 the curve is below the axis and the region between them is shaded and labelled below. From x = 2 to x = 3 the curve is above the axis and the region is shaded, and the label above is just to the right of it. The curve is drawn from x = 0 to x = 3. The curve passes through the marked points (0, -4) and (3, 5).',
    ({ p, curve, shade, point }) => {
      shade(zero, quad4, 0, 2);
      shade(quad4, zero, 2, 3);
      curve(quad4, 'curve', 0, 3);
      point(0, -4);
      point(2, 0);
      point(3, 5, '(3, 5)', { anchor: 'start', dx: 14, dy: 8 });
      p.text(0.7, -2, 'below');
      p.text(3.12, 2.2, 'above', { anchor: 'start' });
      key(p, [['curve', 'y = x^2 - 4']]);
    }),

  'definite-integrals-odd': () => make('definite-integrals-odd',
    { xs: [-2, [2, -34]], xmin: -3, xmax: 3, ymin: -5, ymax: 5, xstep: 2 },
    'The curve y = x cubed minus 4x from x = -2 to x = 2',
    'A graph of the curve y equals x cubed minus 4x, drawn from x = -2 to x = 2. It crosses the x-axis at (-2, 0), (0, 0) and (2, 0). Between x = -2 and x = 0 the curve is above the axis, and the region is shaded and labelled above. Between x = 0 and x = 2 the curve is below the axis, and the region is shaded and labelled below. The two regions have the same size and the same shape, turned half a turn about the origin.',
    ({ p, curve, shade, point }) => {
      const f = (x) => x ** 3 - 4 * x;
      shade(f, zero, -2, 0);
      shade(zero, f, 0, 2);
      curve(f, 'curve', -2, 2);
      point(-2, 0);
      point(0, 0);
      point(2, 0);
      p.text(-1.15, 0.5, 'above');
      p.text(1.15, -0.5, 'below');
      key(p, [['curve', 'y = x^3 - 4x']]);
    }),

  // ---- lesson 6: the region between a line and a curve ----
  'definite-integrals-line-curve': () => make('definite-integrals-line-curve',
    { xs: [-1, 2], xmin: -2, xmax: 3, ymin: -1, ymax: 6 },
    'The region between the line y = x + 2 and the curve y = x squared',
    'A graph of the curve y equals x squared (solid) and the straight line y equals x plus 2 (dashed). They cross at (-1, 1) and (2, 4). Between those two points the line is above the curve, and the region between them is shaded.',
    ({ p, curve, shade, point }) => {
      shade((x) => x + 2, sq, -1, 2);
      curve(sq);
      curve((x) => x + 2, 'curve-b');
      point(-1, 1);
      point(2, 4);
      key(p, [['curve', 'y = x^2'], ['curve-b', 'y = x + 2']]);
    }),

  'definite-integrals-line-curve-b': () => make('definite-integrals-line-curve-b',
    { xs: [2], xmin: -1, xmax: 3, ymin: -1, ymax: 6 },
    'The region between the line y = 2x and the curve y = x squared',
    'A graph of the curve y equals x squared (solid) and the straight line y equals 2x (dashed). They cross at (0, 0) and (2, 4). Between those two points the line is above the curve, and the region between them is shaded.',
    ({ p, curve, shade, point }) => {
      shade((x) => 2 * x, sq, 0, 2);
      curve(sq);
      curve((x) => 2 * x, 'curve-b');
      point(0, 0);
      point(2, 4);
      key(p, [['curve', 'y = x^2'], ['curve-b', 'y = 2x']]);
    }),

  // ---- flip it: from a to b, and from b to a ----
  'definite-integrals-flip-forward': () => make('definite-integrals-flip-forward',
    { xs: [1, 3], xmin: -0.5, xmax: 4, ymin: -5, ymax: 10, ystep: 2 },
    'Integrating y = x squared from x = 1 to x = 3, left to right',
    'A graph of the curve y equals x squared with the region under it from x = 1 to x = 3 shaded and labelled positive. Below the axis an arrow points to the right, from x = 1 to x = 3, labelled from 1 to 3.',
    ({ p, curve, shade }) => {
      shade(sq, zero, 1, 3);
      curve(sq);
      p.text(2.1, 0.7, 'positive');
      arrow(p, 1, 3, -4.3);
      p.text(2, -3.3, 'from 1 to 3');
      key(p, [['curve', 'y = x^2']]);
    }),

  'definite-integrals-flip-backward': () => make('definite-integrals-flip-backward',
    { xs: [1, 3], xmin: -0.5, xmax: 4, ymin: -5, ymax: 10, ystep: 2 },
    'Integrating y = x squared from x = 3 to x = 1, right to left',
    'A graph of the curve y equals x squared with the region under it from x = 1 to x = 3 shaded and labelled negative. Below the axis an arrow points to the left, from x = 3 to x = 1, labelled from 3 to 1.',
    ({ p, curve, shade }) => {
      shade(sq, zero, 1, 3);
      curve(sq);
      p.text(2.1, 0.7, 'negative');
      arrow(p, 3, 1, -4.3);
      p.text(2, -3.3, 'from 3 to 1');
      key(p, [['curve', 'y = x^2']]);
    }),

  // ---- question figures: they show the region and never give the area ----
  'definite-integrals-q-area-curve': () => make('definite-integrals-q-area-curve',
    { xs: [1, 2], xmin: -0.5, xmax: 3, ymin: -1, ymax: 8, ystep: 2 },
    'The shaded region under y = x squared plus 1 from x = 1 to x = 2',
    'A graph of the curve y equals x squared plus 1, rising from the point (0, 1). The region under the curve, above the x-axis, between the vertical lines x = 1 and x = 2 is shaded.',
    ({ p, curve, shade }) => {
      const f = (x) => x * x + 1;
      shade(f, zero, 1, 2);
      curve(f);
      key(p, [['curve', 'y = x^2 + 1']]);
    }),

  'definite-integrals-q-k': () => make('definite-integrals-q-k',
    { xmin: -1, xmax: 5, ymin: -2, ymax: 8 },
    'The triangle under y = 2x from x = 0 to x = k, with area 9',
    'A graph of the straight line y equals 2x through the origin. The triangular region under the line, above the x-axis, from x = 0 to a value x = k is shaded and labelled area 9. The value k is marked on the x-axis.',
    ({ p, curve, shade }) => {
      shade((x) => 2 * x, zero, 0, 3);
      curve((x) => 2 * x, 'curve', -1, 4);
      p.text(3, 0, 'k', { dy: 32 });
      p.text(2.3, 0.8, 'area 9');
      key(p, [['curve', 'y = 2x']]);
    }),

  'definite-integrals-q-below': () => make('definite-integrals-q-below',
    { xs: [3], xmin: -1, xmax: 4, ymin: -3, ymax: 4 },
    'The shaded region between y = x squared minus 3x and the x-axis, from x = 0 to x = 3',
    'A graph of the curve y equals x squared minus 3x. It passes through the points (0, 0) and (3, 0), and dips below the x-axis between them. The region between the curve and the x-axis from x = 0 to x = 3 is shaded.',
    ({ p, curve, shade, point }) => {
      const f = (x) => x * x - 3 * x;
      shade(zero, f, 0, 3);
      curve(f, 'curve', 0, 3);
      point(0, 0);
      point(3, 0);
      key(p, [['curve', 'y = x^2 - 3x']]);
    }),

  'definite-integrals-q-split': () => make('definite-integrals-q-split',
    { xs: [2], xmin: -1, xmax: 3, ymin: -2, ymax: 4 },
    'The shaded regions between y = x squared minus 1 and the x-axis, from x = 0 to x = 2',
    'A graph of the curve y equals x squared minus 1. It passes through the point (0, -1) and crosses the x-axis once between x = 0 and x = 2. The region between the curve and the x-axis from x = 0 to x = 2 is shaded, partly below the axis and partly above it.',
    ({ p, curve, shade, point }) => {
      const f = (x) => x * x - 1;
      shade(zero, f, 0, 1);
      shade(f, zero, 1, 2);
      curve(f);
      point(0, -1);
      key(p, [['curve', 'y = x^2 - 1']]);
    }),

  'definite-integrals-q-cubic': () => make('definite-integrals-q-cubic',
    { xs: [-1, 1], xmin: -2, xmax: 2, ymin: -2, ymax: 2 },
    'The shaded regions between y = x cubed minus x and the x-axis, from x = -1 to x = 1',
    'A graph of the curve y equals x cubed minus x. It passes through the point (0, 0). The regions between the curve and the x-axis from x = -1 to x = 1 are shaded: one above the axis on the left of the origin and one below the axis on the right.',
    ({ p, curve, shade, point }) => {
      const f = (x) => x ** 3 - x;
      shade(f, zero, -1, 0);
      shade(zero, f, 0, 1);
      curve(f, 'curve', -1, 1);
      point(0, 0);
      key(p, [['curve', 'y = x^3 - x']]);
    }),

  'definite-integrals-q-line-curve': () => make('definite-integrals-q-line-curve',
    { xmin: -2, xmax: 4, ymin: -1, ymax: 11, ystep: 2 },
    'The shaded region between the line y = 2x + 3 and the curve y = x squared',
    'A graph of the curve y equals x squared (solid) and the straight line y equals 2x plus 3 (dashed). They cross at two points, (-1, 1) and (3, 9). Between those points the line is above the curve, and the region between them is shaded.',
    ({ p, curve, shade, point }) => {
      shade((x) => 2 * x + 3, sq, -1, 3);
      curve(sq);
      curve((x) => 2 * x + 3, 'curve-b');
      point(-1, 1);
      point(3, 9);
      key(p, [['curve', 'y = x^2'], ['curve-b', 'y = 2x + 3']]);
    }),
};
