// Pictures for differentiation glossary terms (hover pop-up and glossary page): { '<term-id>': '<svg ...>' }.
// Every graph is drawn from its function with plane() (../figure-lib.mjs); nothing is placed by hand.
// Keys are ids of terms in ../glossary/differentiation.mjs. Figure ids start 'tf-' plus the term id.
import { plane } from '../figure-lib.mjs';

const CLS = 'graph-svg term-svg';
const slope = (fn, a, h = 1e-5) => (fn(a + h) - fn(a - h)) / (2 * h);

// 360 x 250 with the default margins gives 248 x 154 pixels of graph; ranges in the ratio 1.61 : 1 give the same scale on both axes,
// so a normal really looks perpendicular to its tangent.
const small = (opts) => plane({ width: 520, height: 360, ...opts });

const parabola = (x) => (x * x) / 2;
const bowl = (x) => (x * x) / 2 - 2 * x; // lowest point at x = 2
const cubic = (x) => (x * x * x) / 3 - x; // maximum at x = -1, minimum at x = 1
const quarter = (x) => (x * x) / 4;

// "Increasing" and "decreasing" use the same bowl; the solid part and the tangents show which side is meant.
function bowlFigure({ id, title, desc, xs, note, side }) {
  const p = small({ xmin: -1, xmax: 5, ymin: -4, ymax: 4, xstep: 1, ystep: 1 });
  p.curve(bowl, { cls: 'curve-c' });
  p.curve(bowl, side === 'right' ? { from: 2, to: 5 } : { from: -1, to: 2 });
  for (const x of xs) {
    p.tangent(bowl, x, { span: 0.7 });
    p.point(x, bowl(x), { label: '' });
  }
  p.text(side === 'right' ? 4 : 1.4, -3.3, note, { cls: 'alt' });
  return p.svg({ id, title, desc, cls: CLS });
}

// A short tangent at each of three x-values with the sign of the gradient written beside it.
function gradientSigns({ id, title, desc, f, xmin, xmax, ymin, ymax, marks, note, noteAt }) {
  const p = small({ xmin, xmax, ymin, ymax, xstep: 1, ystep: 1 });
  p.curve(f);
  for (const [x, text, dy] of marks) {
    p.tangent(f, x, { span: 0.45 });
    p.point(x, f(x), { label: '' });
    p.text(x, f(x) + dy, text, { cls: 'alt' });
  }
  p.text(noteAt[0], noteAt[1], note, { cls: 'alt' });
  return p.svg({ id, title, desc, cls: CLS });
}

export const FIGS = {
  'gradient-of-curve': (() => {
    const p = small({ xmin: -1, xmax: 5, ymin: -1, ymax: 8, xstep: 1, ystep: 2 });
    p.curve(parabola);
    p.tangent(parabola, 3, { span: 1.6 });
    p.point(3, parabola(3), { label: 'gradient = 3', dx: -12, dy: -14, anchor: 'end' });
    p.text(0.5, 6.8, 'y = x^2/2', { cls: 'alt', anchor: 'start' });
    return p.svg({ id: 'tf-gradient-of-curve', title: 'The gradient of a curve at a point', desc: 'The curve y = x squared over 2. A straight tangent touches it at the point where x is 3. The tangent has gradient 3, and that is the gradient of the curve at that point.', cls: CLS });
  })(),

  'chord-of-curve': (() => {
    const p = small({ xmin: -1, xmax: 4, ymin: -1, ymax: 10, xstep: 1, ystep: 2 });
    const f = (x) => x * x;
    p.curve(f);
    p.line(0.4, f(1) + (0.4 - 1) * 4, 3.4, f(1) + (3.4 - 1) * 4, { cls: 'curve-b' });
    p.point(1, f(1), { label: '(1, 1)', dx: 12, dy: 22 });
    p.point(3, f(3), { label: '(3, 9)', dx: -12, dy: -12, anchor: 'end' });
    p.text(2.1, 2.4, 'chord, gradient 4', { cls: 'alt', anchor: 'start' });
    return p.svg({ id: 'tf-chord-of-curve', title: 'A chord of a curve', desc: 'The curve y = x squared. A straight line, the chord, joins the points (1, 1) and (3, 9) on the curve. Its gradient is 4.', cls: CLS });
  })(),

  'first-principles': (() => {
    const p = small({ xmin: -1, xmax: 5, ymin: -1, ymax: 8, xstep: 1, ystep: 2 });
    const a = 2;
    p.curve(parabola);
    // Two chords from P (x = 2) to a point Q; the second Q is closer to P, so its chord is closer to the tangent.
    for (const [b, cls] of [[4, 'curve-c'], [3, 'curve-b']]) {
      const m = (parabola(b) - parabola(a)) / (b - a);
      p.line(a - 1.2, parabola(a) - 1.2 * m, b + 0.15, parabola(b) + 0.15 * m, { cls });
      p.point(b, parabola(b), { label: '' });
    }
    p.tangent(parabola, a, { span: 2.2 });
    p.point(a, parabola(a), { label: 'P', dx: -14, dy: -14, anchor: 'end' });
    p.text(0.3, 7, 'Q moves towards P', { cls: 'alt', anchor: 'start' });
    return p.svg({ id: 'tf-first-principles', title: 'Chords turning into the tangent', desc: 'The curve y = x squared over 2 with a fixed point P where x is 2. Two chords from P to points further along the curve are drawn, a dotted one to x equals 4 and a dashed one to x equals 3. The solid tangent at P is what the chords become as the second point moves towards P.', cls: CLS });
  })(),

  'rate-of-change': (() => {
    const f = (t) => 6 * Math.sqrt(t);
    const p = small({ xmin: -1, xmax: 9, ymin: -2, ymax: 20, xstep: 1, ystep: 4, xlabel: 't', ylabel: 'V' });
    p.curve(f);
    p.tangent(f, 4, { span: 3 });
    p.point(4, f(4), { label: 'gradient 1.5', dx: 12, dy: 26 });
    p.text(1.5, 17, 'V against t', { cls: 'alt', anchor: 'start' });
    return p.svg({ id: 'tf-rate-of-change', title: 'A rate of change as a gradient', desc: 'A graph of volume V against time t that rises and bends over. At t equals 4 a tangent is drawn. Its gradient is 1.5, which is the rate of change of volume at that moment.', cls: CLS });
  })(),

  'tangent-to-curve': (() => {
    const p = small({ xmin: -2, xmax: 4.2, ymin: -1, ymax: 3, xstep: 1, ystep: 1 });
    p.curve(quarter);
    p.tangent(quarter, 2, { span: 2 });
    p.point(2, quarter(2), { label: '(2, 1)', dx: -12, dy: -14, anchor: 'end' });
    p.text(3.5, 1.0, 'tangent', { cls: 'alt' });
    return p.svg({ id: 'tf-tangent-to-curve', title: 'A tangent to a curve', desc: 'The curve y = x squared over 4. A straight line touches the curve at the point (2, 1) and has the same gradient as the curve there.', cls: CLS });
  })(),

  'normal-to-curve': (() => {
    const p = small({ xmin: -2, xmax: 4.2, ymin: -1, ymax: 3, xstep: 1, ystep: 1 });
    p.curve(quarter);
    p.tangent(quarter, 2, { span: 2 });
    const m = slope(quarter, 2); // tangent gradient 1, so the normal runs down at gradient -1
    p.line(2 - 2 * m, quarter(2) + 2, 2 + 2 * m, quarter(2) - 2, { cls: 'curve-b' });
    p.point(2, quarter(2), { label: '' });
    p.text(0.7, 1.1, 'normal', { cls: 'alt' });
    p.text(3.5, 1.0, 'tangent', { cls: 'alt' });
    return p.svg({ id: 'tf-normal-to-curve', title: 'A normal to a curve', desc: 'The curve y = x squared over 4 with its solid tangent at (2, 1), rising to the right. The normal is a dashed line through the same point at right angles to the tangent, falling to the right.', cls: CLS });
  })(),

  'increasing-function': bowlFigure({
    id: 'tf-increasing-function',
    title: 'An increasing function',
    desc: 'The curve y = x squared over 2 minus 2x, a bowl with its lowest point where x is 2. To the right of x equals 2 the curve is drawn solid and rises. Two tangents there slope upwards, so the gradient is positive.',
    xs: [3, 4.3], note: 'gradient > 0', side: 'right',
  }),
  'decreasing-function': bowlFigure({
    id: 'tf-decreasing-function',
    title: 'A decreasing function',
    desc: 'The curve y = x squared over 2 minus 2x, a bowl with its lowest point where x is 2. To the left of x equals 2 the curve is drawn solid and falls. Two tangents there slope downwards, so the gradient is negative.',
    xs: [0, 1.2], note: 'gradient < 0', side: 'left',
  }),

  'stationary-point': (() => {
    const p = small({ xmin: -3, xmax: 3, ymin: -2, ymax: 2, xstep: 1, ystep: 1 });
    p.curve(cubic);
    for (const x of [-1, 1]) {
      p.tangent(cubic, x, { span: 0.9 });
      p.point(x, cubic(x), { label: '' });
    }
    p.text(-1, 1.45, 'gradient 0', { cls: 'alt' });
    p.text(1, -1.45, 'gradient 0', { cls: 'alt' });
    return p.svg({ id: 'tf-stationary-point', title: 'Stationary points', desc: 'The curve y = x cubed over 3 minus x. At its two stationary points, x equals negative 1 (the top of a hill) and x equals 1 (the bottom of a dip), the tangent is horizontal and the gradient is 0.', cls: CLS });
  })(),

  'turning-point': (() => {
    const f = (x) => x * x - 4 * x;
    const p = small({ xmin: -1, xmax: 5, ymin: -5, ymax: 3, xstep: 1, ystep: 1 });
    p.curve(f);
    p.point(2, f(2), { label: 'turning point (2, -4)', dx: 0, dy: 30, anchor: 'middle' });
    p.text(1.0, -0.9, 'falling', { cls: 'alt' });
    p.text(3.1, -0.9, 'rising', { cls: 'alt' });
    return p.svg({ id: 'tf-turning-point', title: 'A turning point', desc: 'The curve y = x squared minus 4x. It falls on the left and rises on the right. At the point (2, -4) it turns from falling to rising.', cls: CLS });
  })(),

  'maximum-point': gradientSigns({
    id: 'tf-maximum-point',
    title: 'A maximum point',
    desc: 'A hill-shaped curve with its top at (2, 3). Short tangents show the gradient: positive on the left of the top, zero at the top, and negative on the right.',
    f: (x) => 3 - (x - 2) * (x - 2),
    xmin: -0.5, xmax: 4.5, ymin: -3, ymax: 5,
    marks: [[1, 'positive', 1.4], [2, 'zero', 0.8], [3, 'negative', 1.4]],
    note: '', noteAt: [2, -2.4],
  }),

  'minimum-point': gradientSigns({
    id: 'tf-minimum-point',
    title: 'A minimum point',
    desc: 'A bowl-shaped curve with its lowest point at (2, -3). Short tangents show the gradient: negative on the left of the lowest point, zero at the lowest point, and positive on the right.',
    f: (x) => (x - 2) * (x - 2) - 3,
    xmin: -0.5, xmax: 4.5, ymin: -5, ymax: 3,
    marks: [[1, 'negative', -1.2], [2, 'zero', -0.9], [3, 'positive', -1.2]],
    note: '', noteAt: [2, 2.3],
  }),

  'nature-of-stationary-point': (() => {
    const p = small({ xmin: -3, xmax: 3, ymin: -2, ymax: 2, xstep: 1, ystep: 1 });
    p.curve(cubic);
    p.point(-1, cubic(-1), { label: 'maximum', dx: -14, dy: -14, anchor: 'end' });
    p.point(1, cubic(1), { label: 'minimum', dx: 14, dy: 30, anchor: 'start' });
    p.text(-1, 1.6, "f'' < 0", { cls: 'alt' });
    p.text(1, -1.6, "f'' > 0", { cls: 'alt' });
    return p.svg({ id: 'tf-nature-of-stationary-point', title: 'The nature of two stationary points', desc: 'The curve y = x cubed over 3 minus x. Its stationary point at x equals negative 1 is a maximum, where the second derivative is negative. Its stationary point at x equals 1 is a minimum, where the second derivative is positive.', cls: CLS });
  })(),

  'optimisation': (() => {
    const f = (x) => x * (20 - x);
    const p = small({ xmin: -2, xmax: 22, ymin: -10, ymax: 120, xstep: 4, ystep: 20, ylabel: 'A' });
    p.curve(f, { from: 0, to: 20 });
    p.drop(10, 100);
    p.point(10, 100, { label: 'greatest area (10, 100)', dx: 0, dy: -16, anchor: 'middle' });
    return p.svg({ id: 'tf-optimisation', title: 'Optimisation: the greatest area', desc: 'The graph of A = x times (20 minus x) for x from 0 to 20, an arch. Its top is at x equals 10, where A is 100, the greatest possible area.', cls: CLS });
  })(),

  'global-extremum': (() => {
    const p = small({ xmin: -3, xmax: 7, ymin: -2, ymax: 7, xstep: 1, ystep: 1 });
    p.curve(cubic, { cls: 'curve-c' });
    p.curve(cubic, { from: -1.5, to: 3 });
    p.point(-1.5, cubic(-1.5), { label: '' });
    p.point(3, cubic(3), { label: 'global max (3, 6)', dx: 14, dy: 6, anchor: 'start' });
    p.point(1, cubic(1), { label: 'global min', dx: 12, dy: 30 });
    p.point(-1, cubic(-1), { label: '' });
    p.text(-0.7, 1.6, 'local max', { cls: 'alt', anchor: 'end' });
    return p.svg({ id: 'tf-global-extremum', title: 'Global maximum and minimum on an interval', desc: 'The curve y = x cubed over 3 minus x, drawn solid only for x from negative 1.5 to 3. The greatest value, 6, is at the right-hand end where x is 3. The least value is at the dip where x is 1. The small hill at x equals negative 1 is only a local maximum.', cls: CLS });
  })(),

  'concave': (() => {
    const f = (x) => 5 - (x * x) / 2;
    const p = small({ xmin: -4, xmax: 4, ymin: -1, ymax: 6, xstep: 1, ystep: 1 });
    p.curve(f);
    p.line(-2, f(-2), 2.5, f(2.5), { cls: 'curve-b' });
    p.point(-2, f(-2), { label: '' });
    p.point(2.5, f(2.5), { label: '' });
    p.text(0.15, 3.4, 'chord', { cls: 'alt', anchor: 'start' });
    return p.svg({ id: 'tf-concave', title: 'A concave curve', desc: 'The curve y = 5 minus x squared over 2, shaped like the top of a hill, bending downwards. A dashed chord joining two points on it lies below the curve.', cls: CLS });
  })(),

  'convex': (() => {
    const f = (x) => (x * x) / 2;
    const p = small({ xmin: -4, xmax: 4, ymin: -1, ymax: 6, xstep: 1, ystep: 1 });
    p.curve(f);
    p.line(-2, f(-2), 2.5, f(2.5), { cls: 'curve-b' });
    p.point(-2, f(-2), { label: '' });
    p.point(2.5, f(2.5), { label: '' });
    p.text(0.15, 3.4, 'chord', { cls: 'alt', anchor: 'start' });
    return p.svg({ id: 'tf-convex', title: 'A convex curve', desc: 'The curve y = x squared over 2, shaped like a bowl, bending upwards. A dashed chord joining two points on it lies above the curve.', cls: CLS });
  })(),

  'point-of-inflection': (() => {
    const f = (x) => x * x * x - 3 * x * x;
    const p = small({ xmin: -1, xmax: 3, ymin: -5, ymax: 3, xstep: 1, ystep: 1 });
    p.curve(f);
    p.tangent(f, 1, { span: 1 });
    p.point(1, f(1), { label: 'inflection', dx: 14, dy: -14 });
    p.text(0.25, 1.8, 'concave', { cls: 'alt', anchor: 'start' });
    p.text(2.4, 1.8, 'convex', { cls: 'alt' });
    return p.svg({ id: 'tf-point-of-inflection', title: 'A point of inflection', desc: 'The curve y = x cubed minus 3 x squared. At the point (1, -2) the curve changes from bending downwards (concave, on the left) to bending upwards (convex, on the right). The tangent there crosses the curve.', cls: CLS });
  })(),

  'implicit-differentiation': (() => {
    // Equal scale on both axes: 300 x 250 pixels of graph for 13 x 10.83 units.
    const p = plane({ width: 560, height: 460, left: 40, right: 40, top: 30, bottom: 40, xmin: -6.5, xmax: 6.5, ymin: -5.28, ymax: 5.28, xstep: 1, ystep: 1, tickLabels: false });
    p.parametric((t) => 5 * Math.cos(t), (t) => 5 * Math.sin(t), 0, 2 * Math.PI);
    p.line(1.4, 4 + 0.75 * 1.6, 5.2, 4 - 0.75 * 2.2, { cls: 'tangent' });
    p.point(3, 4, { label: '(3, 4)', dx: 12, dy: -12 });
    p.text(-0.3, 0.9, 'x^2 + y^2 = 25', { cls: 'alt', anchor: 'end' });
    p.text(-0.3, -2.5, 'gradient -3/4', { cls: 'alt', anchor: 'end' });
    return p.svg({ id: 'tf-implicit-differentiation', title: 'A tangent found by implicit differentiation', desc: 'The circle x squared plus y squared equals 25. At the point (3, 4) a tangent is drawn. Implicit differentiation gives its gradient as negative 3 over 4, so it falls to the right.', cls: CLS });
  })(),
};
