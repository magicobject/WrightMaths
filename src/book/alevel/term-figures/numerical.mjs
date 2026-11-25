// Pictures for numerical-methods glossary terms (hover pop-up and glossary page): { '<term-id>': '<svg ...>' }.
// Every graph is drawn from its function with plane(). Keys must be ids of terms in ../glossary/numerical.mjs.
import { plane } from '../figure-lib.mjs';

const TERM = 'graph-svg term-svg';

/** A standard pop-up sized graph. `lines` is how many small lines of writing go under it. */
const graph = (opts, lines = 1) => plane({ width: 440, height: 306 + 26 * (lines - 1), left: 56, right: 44, top: 40, bottom: 58 + 26 * (lines - 1), ...opts });
/** A square graph (equal scales on both axes) for iteration diagrams. */
const square = (opts, lines = 1) => plane({ width: 400, height: 400 + 26 * lines, left: 50, right: 40, top: 40, bottom: 50 + 26 * lines, tickLabels: false, ...opts });
const notes = (p, ...lines) => lines.forEach((t, i) => p.note(220, p.Y(p.ymin) + 46 + 26 * i, t, { cls: 'small', anchor: 'middle' }));

const f1 = (x) => x ** 3 - x - 1; // x^3 - x - 1, root 1.3247

function changeOfSignGraph() {
  const p = graph({ xmin: 0.3, xmax: 2.3, ymin: -3, ymax: 6, xstep: 1, ystep: 3, tickLabels: false });
  p.text(1, 0, '1', { cls: 'small', dy: 32 }).text(2, 0, '2', { cls: 'small', dy: 32 });
  p.curve(f1);
  p.point(1, f1(1), { label: 'f(1) < 0', dx: 12, dy: 34 });
  p.point(2, f1(2), { label: 'f(2) > 0', dx: -12, dy: -2, anchor: 'end' });
  p.point(1.3247, 0, { open: true, label: 'root', dx: 8, dy: -16 });
  return p.svg({ id: 'tf-change-of-sign', title: 'A change of sign', desc: 'The curve y equals x cubed minus x minus 1. At x equals 1 the curve is below the x-axis, marked f(1) less than 0. At x equals 2 it is above the axis, marked f(2) greater than 0. The curve is unbroken, so it must cross the axis between them, at the root marked with an open circle.', cls: TERM });
}

function discontinuityGraph() {
  const f = (x) => 1 / (x - 1);
  const p = graph({ xmin: -1.6, xmax: 2.6, ymin: -4, ymax: 4, xstep: 1, ystep: 2 }, 2);
  p.vline(1);
  p.curve(f);
  p.point(0, f(0), { label: 'f(0) = \u22121', dx: -12, dy: 30, anchor: 'end' });
  p.point(2, f(2), { label: 'f(2) = 1', dx: 12, dy: -10 });
  p.text(1, -3.4, 'asymptote x = 1', { cls: 'small', anchor: 'start', dx: 10 });
  notes(p, 'f changes sign between 0 and 2,', 'but there is no root: the graph is broken at x = 1');
  return p.svg({ id: 'tf-discontinuity', title: 'A sign change at a discontinuity', desc: 'The curve y equals 1 over (x minus 1), in two separate pieces either side of the vertical dashed asymptote x equals 1. The point (0, minus 1) is on the left piece and the point (2, 1) is on the right piece. The function changes sign between them, but the graph never crosses the x-axis.', cls: TERM });
}

function rootBoundsGraph() {
  const p = graph({ xmin: 1.31, xmax: 1.33, ymin: -0.08, ymax: 0.04, xstep: 0.01, ystep: 0.04, tickLabels: false }, 2);
  for (const x of [1.32, 1.33]) p.text(x, 0, String(x), { cls: 'small', dy: 32 });
  p.curve(f1);
  p.point(1.315, f1(1.315), { label: 'f(1.315) < 0', dx: 12, dy: 34, anchor: 'start', cls: 'small' });
  p.point(1.325, f1(1.325), { label: 'f(1.325) > 0', dx: -12, dy: -20, anchor: 'end', cls: 'small' });
  notes(p, 'the root lies between 1.315 and 1.325,', 'so it is 1.32 to 2 decimal places');
  return p.svg({ id: 'tf-root-bounds', title: 'Bounds for a root', desc: 'A close-up of the curve y equals x cubed minus x minus 1 between x equals 1.31 and x equals 1.33. At x equals 1.315 the curve is below the x-axis and at x equals 1.325 it is slightly above it, so the curve crosses the axis between those two values.', cls: TERM });
}

// ---------- iteration diagrams ----------

/** Draws the staircase or cobweb path for x(n+1) = g(x(n)) starting at x0, for `steps` steps. Returns the values. */
function drawPath(p, g, x0, steps) {
  let x = x0;
  const xs = [x0];
  p.line(x, 0, x, g(x), { cls: 'line' });
  for (let i = 0; i < steps; i += 1) {
    const y = g(x);
    p.line(x, y, y, y, { cls: 'line' });
    p.line(y, y, y, g(y), { cls: 'line' });
    x = y;
    xs.push(x);
  }
  return xs;
}

function iterationDiagram({ id, title, desc, g, max, x0, steps, gLabel, labelled = [0, 1, 2], fixed, fixedLabel }) {
  const p = square({ xmin: 0, xmax: max, ymin: 0, ymax: max, xstep: 1, ystep: 1 }, 1);
  p.curve(g);
  p.curve((x) => x, { cls: 'curve-b' });
  const xs = drawPath(p, g, x0, steps);
  labelled.forEach((i) => p.text(xs[i], 0, `x_${i}`, { cls: 'small', dy: 32 }));
  p.point(fixed, fixed, { label: fixedLabel, dx: 10, dy: 32, cls: 'small' });
  p.note(200, p.Y(0) + 62, gLabel, { cls: 'small', anchor: 'middle' });
  return p.svg({ id, title, desc, cls: TERM });
}

const staircaseDiagram = () => iterationDiagram({
  id: 'tf-staircase-diagram', g: (x) => Math.sqrt(x + 2), max: 2.6, x0: 0.3, steps: 3, fixed: 2, fixedLabel: 'fixed point',
  gLabel: 'solid: y = g(x)    dashed: y = x',
  title: 'A staircase diagram', desc: 'The curve y equals g(x), solid, and the dashed line y equals x. A path starts at x0 on the x-axis, goes up to the curve, across to the line, up to the curve again and so on. Each step is closer to the point where the curve meets the line, the fixed point, and the steps rise like a staircase on one side of it.',
});

const cobwebDiagram = () => iterationDiagram({
  id: 'tf-cobweb-diagram', g: Math.cos, max: 1.2, x0: 0.2, steps: 5, fixed: 0.7391, fixedLabel: 'fixed point',
  gLabel: 'solid: y = g(x)    dashed: y = x',
  title: 'A cobweb diagram', desc: 'The falling curve y equals cos x, solid, and the dashed line y equals x. A path starts at x0 on the x-axis, goes up to the curve, across to the line, down to the curve, across to the line and so on. The path spirals in towards the point where the curve meets the line, the fixed point, going alternately either side of it.',
});

const divergentDiagram = () => iterationDiagram({
  id: 'tf-divergent-iteration', g: (x) => (x * x) / 2, max: 4.5, x0: 2.2, steps: 2, labelled: [0], fixed: 2, fixedLabel: 'fixed point',
  gLabel: 'the steps move away from the fixed point',
  title: 'A divergent iteration', desc: 'The curve y equals x squared over 2, solid, and the dashed line y equals x. They meet at the fixed point (2, 2). A path starts at x0 equals 2.2, slightly to the right of it, and each step takes it further away, up the staircase, instead of closer.',
});

function fixedPointGraph() {
  const p = square({ xmin: 0, xmax: 1.2, ymin: 0, ymax: 1.2, xstep: 1, ystep: 1 }, 1);
  p.curve(Math.cos);
  p.curve((x) => x, { cls: 'curve-b' });
  const L = 0.7391;
  p.drop(L, L);
  p.point(L, L, { label: 'fixed point', dx: 12, dy: -14, cls: 'small' });
  p.text(L, 0, 'x = 0.739', { cls: 'small alt', dy: 34 });
  p.note(200, p.Y(0) + 62, 'solid: y = g(x)    dashed: y = x', { cls: 'small', anchor: 'middle' });
  return p.svg({ id: 'tf-fixed-point', title: 'A fixed point', desc: 'The curve y equals cos x, solid, and the dashed line y equals x. They cross at one point, about (0.739, 0.739), marked with a dot and a dashed drop line to the x-axis. At that point g(x) equals x.', cls: TERM });
}

function convergentSequenceGraph() {
  const xs = [0.2];
  for (let i = 0; i < 8; i += 1) xs.push(Math.cos(xs[i]));
  const L = 0.7391;
  const p = graph({ xmin: -0.7, xmax: 8.7, ymin: 0, ymax: 1.1, xstep: 2, ystep: 0.5, xlabel: 'n', ylabel: 'x_n' }, 1);
  p.hline(L);
  xs.forEach((x, n) => p.point(n, x, {}));
  p.text(8.5, L, 'limit 0.739', { cls: 'small alt', anchor: 'end', dy: -34 });
  p.note(220, 302, 'the values settle on one number', { cls: 'small', anchor: 'middle' });
  return p.svg({ id: 'tf-convergent-iteration', title: 'A convergent iteration', desc: 'Points showing the values x0, x1, x2 and so on of an iteration plotted against n. They jump above and below a dashed horizontal line at 0.739 and get closer to it each time, so the values settle on that limit.', cls: TERM });
}

function newtonRaphsonGraph() {
  const f = (x) => x * x - 2;
  const p = graph({ xmin: -0.2, xmax: 2.7, ymin: -2.5, ymax: 4.5, xstep: 1, ystep: 2, tickLabels: false });
  p.curve(f);
  const x0 = 2;
  const x1 = x0 - f(x0) / (2 * x0);
  const x2 = x1 - f(x1) / (2 * x1);
  p.line(x0, 0, x0, f(x0), { cls: 'guide' });
  p.line(x1, 0, x1, f(x1), { cls: 'guide' });
  p.tangent(f, x0, { span: 0.62 });
  p.tangent(f, x1, { span: 0.45 });
  p.point(x0, f(x0), {});
  p.point(x1, f(x1), {});
  p.point(Math.SQRT2, 0, { open: true, label: 'root', dx: -12, dy: -14, anchor: 'end' });
  p.text(x0, 0, 'x_0', { dy: 32, cls: 'alt' });
  p.text(x1, 0, 'x_1', { dy: 32, cls: 'alt' });
  void x2;
  return p.svg({ id: 'tf-newton-raphson', title: 'The Newton-Raphson method', desc: 'The curve y equals x squared minus 2. At the starting value x0 equals 2 a tangent is drawn to the curve. It meets the x-axis at x1 equals 1.5, which is closer to the root, marked with an open circle. A second tangent drawn at x1 meets the axis even closer to the root.', cls: TERM });
}

// ---------- the trapezium rule ----------

const g1 = (x) => 0.5 * x * x + 0.5;

/** Draws y = g1 (x squared over 2, plus a half) with n trapezium strips from 0 to 4. */
function trapeziaGraph({ hatch = false, lines = 1, n = 4 } = {}) {
  const xsStrips = Array.from({ length: n + 1 }, (_, i) => (4 * i) / n);
  const p = graph({ xmin: -0.5, xmax: 4.6, ymin: -1, ymax: 9, xstep: 1, ystep: 4 }, lines);
  p.xsStrips = xsStrips;
  for (let i = 0; i < n; i += 1) {
    const a = xsStrips[i];
    const b = xsStrips[i + 1];
    const chord = (x) => g1(a) + ((g1(b) - g1(a)) * (x - a)) / (b - a);
    p.shade(chord, () => 0, a, b, { samples: 2 });
    if (hatch) {
      const pts = [];
      for (let k = 0; k <= 12; k += 1) { const x = a + ((b - a) * k) / 12; pts.push([x, chord(x)]); }
      for (let k = 12; k >= 0; k -= 1) { const x = a + ((b - a) * k) / 12; pts.push([x, g1(x)]); }
      p.raw(`<polygon fill="url(#hatch)" stroke="none" points="${pts.map(([x, y]) => `${p.X(x).toFixed(1)},${p.Y(y).toFixed(1)}`).join(' ')}"/>`);
    }
    p.line(b, 0, b, g1(b), { cls: 'guide' });
    p.line(a, g1(a), b, g1(b), { cls: 'line' });
  }
  p.line(0, 0, 0, g1(0), { cls: 'guide' });
  p.curve(g1, { from: 0, to: 4 });
  return p;
}

function trapeziumRuleGraph() {
  const p = trapeziaGraph();
  p.note(220, 294, 'each strip is a trapezium', { cls: 'small', anchor: 'middle' });
  return p.svg({ id: 'tf-trapezium-rule', title: 'The trapezium rule', desc: 'The curve y equals half of x squared, plus a half from x equals 0 to x equals 4. The area under it is cut into four strips of equal width. The top of each strip is a straight line joining two points on the curve, so each strip is a trapezium. Their areas are added to estimate the area under the curve.', cls: TERM });
}

function stripWidthGraph() {
  const p = trapeziaGraph();
  p.line(1, 0.5, 2, 0.5).line(1, 0.3, 1, 0.7).line(2, 0.3, 2, 0.7);
  p.text(1.5, 0.5, 'h', { cls: 'alt', dy: -10 });
  p.note(220, 294, 'h = (b \u2212 a) / n', { cls: 'small alt', anchor: 'middle' });
  return p.svg({ id: 'tf-strip-width', title: 'Strip width h', desc: 'The curve y equals half of x squared, plus a half with four trapezium strips under it. A short bar under the second strip shows its width, labelled h. All four strips have the same width.', cls: TERM });
}

function ordinateGraph() {
  const p = trapeziaGraph();
  p.xsStrips.forEach((x, i) => p.text(x, g1(x), `y_${i}`, { cls: 'alt', dy: -14, dx: i === 0 ? 18 : 0 }));
  p.note(220, 294, 'the heights y_0 to y_4 are the ordinates', { cls: 'small', anchor: 'middle' });
  return p.svg({ id: 'tf-ordinate', title: 'Ordinates', desc: 'The curve y equals half of x squared, plus a half with four trapezium strips. The five vertical heights at x equals 0, 1, 2, 3 and 4 are labelled y0, y1, y2, y3 and y4. These heights are the ordinates used in the trapezium rule.', cls: TERM });
}

function overUnderGraph() {
  const p = trapeziaGraph({ hatch: true, lines: 2, n: 2 });
  p.note(220, 294, 'hatched: extra area the trapezia count', { cls: 'small', anchor: 'middle' });
  p.note(220, 320, 'the curve bends upwards: overestimate', { cls: 'small', anchor: 'middle' });
  return p.svg({ id: 'tf-over-and-under-estimate', hatch: true, title: 'The trapezium rule overestimates a curve that bends upwards', desc: 'The curve y equals half of x squared, plus a half with two trapezium strips. The straight tops of the trapezia lie above the curve, and the thin gaps between each top and the curve are hatched. The hatched area is counted by the trapezium rule even though it is not under the curve, so the estimate is too big.', cls: TERM });
}

export const FIGS = {
  'change-of-sign': changeOfSignGraph(),
  discontinuity: discontinuityGraph(),
  'root-bounds': rootBoundsGraph(),
  'staircase-diagram': staircaseDiagram(),
  'cobweb-diagram': cobwebDiagram(),
  'divergent-iteration': divergentDiagram(),
  'fixed-point': fixedPointGraph(),
  'convergent-iteration': convergentSequenceGraph(),
  'newton-raphson': newtonRaphsonGraph(),
  'trapezium-rule': trapeziumRuleGraph(),
  'strip-width': stripWidthGraph(),
  ordinate: ordinateGraph(),
  'over-and-under-estimate': overUnderGraph(),
};
