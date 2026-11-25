// Figures for the topic page differentiation-basics (Year 1, Differentiation).
// Every graph is drawn from the function that defines it (plane() in ../figure-lib.mjs), so a picture cannot
// disagree with its equation. Ids must start with "differentiation-basics-".
import { plane, label } from '../figure-lib.mjs';

const P = 'differentiation-basics-';
const FP = "f\u2032(x)"; // f prime of x
const slope = (fn, a, h = 1e-6) => (fn(a + h) - fn(a - h)) / (2 * h);
const sq = (x) => x * x;
const HALO = 'paint-order:stroke;stroke:var(--paper,#fff);stroke-width:7px;stroke-linejoin:round';
const noYNumbers = () => '';

// A label at graph coordinates (x, y), nudged by (dx, dy) pixels, with a paper-coloured halo so it stays
// readable where it crosses a gridline or an axis.
function say(p, x, y, text, { anchor = 'start', cls = '', dx = 0, dy = 8 } = {}) {
  p.raw(`<text class="svg-t ${cls}" style="${HALO}" x="${(p.X(x) + dx).toFixed(1)}" y="${(p.Y(y) + dy).toFixed(1)}" text-anchor="${anchor}">${label(text)}</text>`);
}

// ---------------------------------------------------------------- lesson figures

// 1. The tangent at A on y = x^2 and its gradient triangle (across 1, up 2).
function tangentTriangle() {
  const p = plane({ xmin: -1, xmax: 3.5, ymin: -1, ymax: 10, xstep: 1, ystep: 2, height: 520 });
  p.curve(sq, { to: 3.15 });
  p.line(0.05, 2 * 0.05 - 1, 2.6, 2 * 2.6 - 1, { cls: 'tangent' });
  p.line(1, 1, 2, 1, { cls: 'guide' });
  p.line(2, 1, 2, 3, { cls: 'guide' });
  p.point(1, 1, { label: '' });
  say(p, 0.95, 1, 'A (1, 1)', { anchor: 'end', dy: -18 });
  say(p, 1.5, 1, 'across 1', { anchor: 'middle', dy: 31 });
  say(p, 2, 2, 'up 2', { dx: 14 });
  say(p, 0.25, 9.3, 'y = x^2', { cls: 'alt' });
  say(p, 0.25, 7.9, 'gradient at A', { cls: 'alt' });
  say(p, 0.25, 6.8, '= 2 \u00f7 1 = 2', { cls: 'alt' });
  return p.svg({
    id: `${P}tangent-triangle`,
    title: 'The tangent at A on the curve y = x squared, with its gradient triangle',
    desc: 'The curve y = x squared rises to the right. A straight tangent touches it at A (1, 1). A dashed triangle under the tangent goes across 1 and up 2, so the tangent has gradient 2 and the curve has gradient 2 at A.',
  });
}

// 2. Chords from A to points further and further along y = x^2, and the tangent.
function chordsApproach() {
  const p = plane({ xmin: -0.5, xmax: 4.5, ymin: -1, ymax: 10, xstep: 1, ystep: 2, height: 520 });
  p.curve(sq, { to: 3.15 });
  p.line(1, 1, 3, 9, { cls: 'line' });
  p.line(1, 1, 2, 4, { cls: 'curve-b' });
  p.line(1, 1, 1.5, 2.25, { cls: 'curve-c' });
  p.line(0.1, 2 * 0.1 - 1, 1.9, 2 * 1.9 - 1, { cls: 'tangent' });
  p.point(1, 1, { label: '' });
  p.point(3, 9, { label: '' });
  p.point(2, 4, { label: '' });
  p.point(1.5, 2.25, { label: '' });
  say(p, 1.05, 1, 'A', { dx: 8, dy: 28 });
  say(p, 2.95, 9, 'P', { anchor: 'end', dy: 4 });
  say(p, 2.1, 4, 'Q', { dx: 8, dy: 36 });
  say(p, 1.5, 2.25, 'R', { dx: 10, dy: 42 });
  // key: line style and the gradient of each line
  const rows = [['AP', 4, 'line'], ['AQ', 3, 'curve-b'], ['AR', 2.5, 'curve-c'], ['tangent', 2, 'tangent']];
  rows.forEach(([name, g, cls], i) => {
    const y = 9.4 - i * 1.0;
    p.line(-0.35, y, 0.15, y, { cls });
    say(p, 0.3, y, `${name}: gradient ${g}`);
  });
  return p.svg({
    id: `${P}chords-approach`,
    title: 'Chords from A getting closer to the tangent at A',
    desc: 'The curve y = x squared with a point A at (1, 1). Three chords run from A to P (3, 9), Q (2, 4) and R (1.5, 2.25), in three line styles. Their gradients are 4, 3 and 2.5. The shorter the chord, the closer it is to the tangent at A, which has gradient 2. A key at the top left gives each line style and its gradient.',
  });
}

// 3. The chord from A(x, f(x)) to B(x + h, f(x + h)), with its run h and its rise.
function chordAlgebra() {
  const f = (x) => 0.25 * x * x + 0.5;
  const p = plane({ xmin: 0, xmax: 7.2, ymin: -1, ymax: 8.5, xstep: 1, ystep: 1, height: 520, ticks: false, xlabel: 'x' });
  p.curve(f, { to: 5.4 });
  p.line(2, f(2), 4.5, f(4.5), { cls: 'line' });
  p.line(2, f(2), 4.5, f(2), { cls: 'guide' });
  p.line(4.5, f(2), 4.5, f(4.5), { cls: 'guide' });
  p.point(2, f(2), { label: '' });
  p.point(4.5, f(4.5), { label: '' });
  say(p, 1.9, f(2), 'A (x, f(x))', { anchor: 'end', dy: -16 });
  say(p, 4.4, f(4.5), 'B (x + h, f(x + h))', { anchor: 'end', dy: -18 });
  say(p, 3.25, f(2), 'run = h', { anchor: 'middle', dy: 38 });
  say(p, 4.5, (f(2) + f(4.5)) / 2, 'rise = f(x + h) \u2212 f(x)', { dx: 14 });
  say(p, 5.4, 7.9, 'y = f(x)', { anchor: 'end', dx: -14, cls: 'alt', dy: -4 });
  return p.svg({
    id: `${P}chord-algebra`,
    title: 'A chord from the point x to the point x + h',
    desc: 'A rising curve y = f(x). A is the point with x-coordinate x. B is a second point further right, with x-coordinate x plus h. A chord joins A to B. A dashed right-angled triangle under the chord shows the run, h, and the rise, f of x plus h minus f of x. The gradient of the chord is the rise divided by the run.',
  });
}

// 4. The limit idea: the chord gradient 2 + h, with a hole at h = 0.
function limitOpenPoint() {
  const p = plane({ xmin: -1.2, xmax: 3, ymin: 0, ymax: 5.5, xstep: 1, ystep: 1, height: 480, xlabel: 'h', ylabel: 'gradient of the chord' });
  p.curve((h) => 2 + h, { cls: 'curve' });
  p.hline(2, { cls: 'guide' });
  p.point(1, 3, { label: '' });
  p.point(0.5, 2.5, { label: '' });
  p.point(0, 2, { open: true, label: '' });
  say(p, 1.05, 3, '(1, 3)', { dx: 4, dy: 38 });
  say(p, 0.55, 2.5, '(0.5, 2.5)', { dx: 4, dy: 38 });
  say(p, 0.2, 1.3, 'h = 0 is not allowed', { dy: 6 });
  say(p, 0.2, 0.6, 'the gradient gets close to 2', { cls: 'alt', dy: 6 });
  return p.svg({
    id: `${P}limit-open-point`,
    title: 'The chord gradient 2 + h gets close to 2 as h gets close to 0',
    desc: 'A graph of the chord gradient, 2 plus h, against h. It is a straight line rising to the right. At h equals 0 there is an open circle at a height of 2, because h cannot be 0: the two points of the chord would be the same point. The points at h equals 1 and h equals 0.5 are marked. As h gets close to 0 the gradient gets close to 2.',
  });
}

// 5. The power rule as two moves.
function powerRuleSteps() {
  const p = plane({ axes: false, grid: false, ticks: false, tickLabels: false, height: 400 });
  const box = (x, y, w, h) => `<rect class="box" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
  const arrow = (x1, y, x2) => `<line class="axis" x1="${x1}" y1="${y}" x2="${x2 - 12}" y2="${y}"/><polygon class="arrowhead" points="${x2},${y} ${x2 - 16},${y - 9} ${x2 - 16},${y + 9}"/>`;
  p.raw(box(70, 50, 190, 74) + arrow(280, 87, 440) + box(460, 50, 230, 74));
  p.note(165, 98, 'x^n', { anchor: 'middle', cls: 'big' });
  p.note(575, 98, 'n x^(n-1)', { anchor: 'middle', cls: 'big' });
  p.note(360, 62, 'differentiate', { anchor: 'middle', cls: 'alt' });
  p.raw(box(70, 170, 190, 74) + arrow(280, 207, 440) + box(460, 170, 230, 74));
  p.note(165, 218, 'x^5', { anchor: 'middle', cls: 'big' });
  p.note(575, 218, '5 x^4', { anchor: 'middle', cls: 'big' });
  p.note(360, 182, 'differentiate', { anchor: 'middle', cls: 'alt' });
  p.note(70, 300, '1. The power, 5, comes down to the front.');
  p.note(70, 340, '2. The new power is one less: 5 \u2212 1 = 4.');
  return p.svg({
    id: `${P}power-rule-steps`,
    title: 'The power rule in two moves',
    desc: 'Two rows. The top row shows x to the n becoming n times x to the n minus 1. The bottom row shows the example x to the 5 becoming 5 times x to the 4. Below them are the two moves: bring the power down to the front, then take 1 off the power.',
  });
}

// 6. y = sqrt(x) with two tangents: the curve flattens, and the gradients 1/2 and 1/4 say so.
function sqrtTangents() {
  const p = plane({ xmin: -1, xmax: 9.5, ymin: -1, ymax: 4, xstep: 1, ystep: 1, height: 480 });
  p.curve(Math.sqrt, { from: 0, to: 9.3 });
  p.tangent(Math.sqrt, 1, { span: 1.6, cls: 'tangent' });
  p.tangent(Math.sqrt, 4, { span: 2.4, cls: 'tangent' });
  p.point(1, 1, { label: '' });
  p.point(4, 2, { label: '' });
  say(p, 1.2, 1, '(1, 1): gradient 1/2', { dy: 42 });
  say(p, 4.2, 2, '(4, 2): gradient 1/4', { dy: 42 });
  say(p, 6.2, 3.55, 'y = \u221ax', { cls: 'alt' });
  return p.svg({
    id: `${P}sqrt-tangents`,
    title: 'Tangents to y equals the square root of x',
    desc: 'The curve y equals the square root of x, rising ever more gently. A tangent touches it at (1, 1) with gradient one half. A second tangent touches it at (4, 2) with gradient one quarter, so the curve is flatter there.',
  });
}

// 7. y = 1/x with two tangents: always falling, so the gradient is negative.
function reciprocalTangents() {
  const f = (x) => 1 / x;
  const p = plane({ xmin: -0.5, xmax: 5, ymin: -0.5, ymax: 4, xstep: 1, ystep: 1, height: 480 });
  p.curve(f, { from: 0.25, to: 5 });
  p.line(0.45, 2 - 0.45, 2.1, 2 - 2.1, { cls: 'tangent' });
  p.line(1.2, 0.5 - 0.25 * (1.2 - 2), 4.6, 0.5 - 0.25 * (4.6 - 2), { cls: 'tangent' });
  p.point(1, 1, { label: '' });
  p.point(2, 0.5, { label: '' });
  say(p, 1.15, 1, '(1, 1): gradient \u22121', { dy: -16 });
  say(p, 2.1, 0.5, '(2, 1/2): gradient \u22121/4', { dy: -22 });
  say(p, 2.9, 3.4, 'y = 1/x', { cls: 'alt' });
  return p.svg({
    id: `${P}reciprocal-tangents`,
    title: 'Tangents to y equals 1 over x',
    desc: 'The curve y equals 1 over x for positive x, falling from left to right and flattening out. A tangent at (1, 1) slopes down with gradient minus 1. A tangent at (2, one half) slopes down more gently, with gradient minus one quarter. Both gradients are negative because the curve is falling.',
  });
}

// 8. Rewrite, split, then differentiate term by term.
function splitThenDifferentiate() {
  const p = plane({ axes: false, grid: false, ticks: false, tickLabels: false, height: 440 });
  const box = (y) => `<rect class="box" x="40" y="${y}" width="320" height="70" rx="10"/>`;
  const down = (y1, y2) => `<line class="axis" x1="200" y1="${y1}" x2="200" y2="${y2 - 10}"/><polygon class="arrowhead" points="200,${y2} 191,${y2 - 16} 209,${y2 - 16}"/>`;
  p.raw(box(30) + down(100, 150) + box(150) + down(220, 270) + box(270));
  p.note(200, 76, '(x + 2)^2 / x', { anchor: 'middle' });
  p.note(200, 196, 'x + 4 + 4x^(-1)', { anchor: 'middle' });
  p.note(200, 316, '1 \u2212 4x^(-2)', { anchor: 'middle' });
  p.note(385, 118, 'Step 1: expand the top,', { cls: 'alt' });
  p.note(385, 150, 'then divide each', { cls: 'alt' });
  p.note(385, 182, 'term by x.', { cls: 'alt' });
  p.note(385, 252, 'Step 2: differentiate', { cls: 'alt' });
  p.note(385, 284, 'each term.', { cls: 'alt' });
  p.note(40, 400, 'Never differentiate the top and bottom separately.', { cls: 'small' });
  return p.svg({
    id: `${P}split-then-differentiate`,
    title: 'Expand and split first, then differentiate term by term',
    desc: 'Three boxes stacked from top to bottom joined by arrows. The first box holds (x plus 2) squared over x. The second holds x plus 4 plus 4 x to the power minus 1. The third holds 1 minus 4 x to the power minus 2. Step 1 is to expand the top, then divide each term by x. Step 2 is to differentiate each term. A note says never to differentiate the top and the bottom separately.',
  });
}

// 9 and 10. The second derivative: the gradient rises (positive) or falls (negative).
function secondDerivative(positive) {
  const f = positive ? (x) => x * x : (x) => 4 - x * x;
  const p = plane({ xmin: -2.5, xmax: 2.5, ymin: -1, ymax: 6.5, xstep: 1, ystep: 1, height: 480, ytickFormat: noYNumbers });
  p.curve(f, { from: -2.4, to: 2.4 });
  for (const x of [-1, 0, 1]) {
    const g = slope(f, x);
    p.line(x - 0.6, f(x) - g * 0.6, x + 0.6, f(x) + g * 0.6, { cls: 'tangent' });
    p.point(x, f(x), { label: '' });
  }
  const g = (x) => `gradient ${Math.round(slope(f, x)) < 0 ? '\u2212' : ''}${Math.abs(Math.round(slope(f, x)))}`;
  if (positive) {
    say(p, -1.15, 0.6, g(-1), { anchor: 'end' });
    say(p, 0, 0.95, g(0), { anchor: 'middle' });
    say(p, 1.15, 0.6, g(1));
    say(p, 0, 5.6, 'the gradient goes up: \u22122, 0, 2', { anchor: 'middle', cls: 'alt' });
  } else {
    say(p, -1.2, 4.55, g(-1), { anchor: 'end' });
    say(p, 0, 4.85, g(0), { anchor: 'middle' });
    say(p, 1.2, 4.55, g(1));
    say(p, 0, 5.8, 'the gradient goes down: 2, 0, \u22122', { anchor: 'middle', cls: 'alt' });
  }
  return p.svg({
    id: `${P}second-derivative-${positive ? 'positive' : 'negative'}`,
    title: positive ? 'A curve whose gradient increases: positive second derivative' : 'A curve whose gradient decreases: negative second derivative',
    desc: positive
      ? 'The curve y equals x squared with three tangents at x equals minus 1, 0 and 1. Their gradients are minus 2, 0 and 2. Moving to the right the gradient goes up each time, so the second derivative is positive and the curve bends upwards.'
      : 'The curve y equals 4 minus x squared with three tangents at x equals minus 1, 0 and 1. Their gradients are 2, 0 and minus 2. Moving to the right the gradient goes down each time, so the second derivative is negative and the curve bends downwards.',
  });
}

// 11. The sign of the gradient along a cubic.
const cubic = (x) => (x * x * x) / 3 - x;
function gradientSigns() {
  const p = plane({ xmin: -3, xmax: 3, ymin: -3, ymax: 3, xstep: 1, ystep: 1, height: 480, ytickFormat: noYNumbers });
  p.curve(cubic, { from: -2.4, to: 2.4 });
  for (const x of [-2, 0, 2]) {
    const g = slope(cubic, x);
    const s = 0.5;
    p.line(x - s, cubic(x) - g * s, x + s, cubic(x) + g * s, { cls: 'tangent' });
    p.point(x, cubic(x), { label: '' });
  }
  p.line(-1.6, -1.65, -1.95, -0.85, { cls: 'guide' });
  p.line(0, 1.15, 0, 0.1, { cls: 'guide' });
  p.line(1.9, 1.95, 2, 0.8, { cls: 'guide' });
  say(p, -1.6, -1.9, 'gradient positive', { cls: 'alt' });
  say(p, 0, 1.45, 'gradient negative', { cls: 'alt', anchor: 'middle' });
  say(p, 2.0, 2.2, 'gradient positive', { cls: 'alt', anchor: 'end' });
  return p.svg({
    id: `${P}gradient-signs`,
    title: 'The sign of the gradient along a curve',
    desc: 'A cubic curve that rises, then falls, then rises again. Short tangents are drawn at three places. The first and third slope up and are labelled gradient positive. The middle one slopes down and is labelled gradient negative. Dashed lines join each label to its tangent.',
  });
}

// 12. f and its derivative together.
function fAndDerivative() {
  const d = (x) => x * x - 1;
  const p = plane({ xmin: -2.6, xmax: 2.6, ymin: -2.5, ymax: 5.5, xstep: 1, ystep: 1, height: 500, ytickFormat: noYNumbers });
  p.vline(-1);
  p.vline(1);
  p.curve(cubic, { from: -2.5, to: 2.5 });
  p.curve(d, { from: -2.5, to: 2.5, cls: 'curve-b' });
  p.point(-1, 0, { open: true, label: '' });
  p.point(1, 0, { open: true, label: '' });
  say(p, -1.95, -1.05, 'y = f(x)', { cls: 'alt' });
  say(p, 2.5, 5.2, `y = ${FP}`, { anchor: 'end', dx: -12 });
  say(p, -1, -1.8, `${FP} = 0`, { anchor: 'middle' });
  say(p, 1, -1.8, `${FP} = 0`, { anchor: 'middle' });
  return p.svg({
    id: `${P}f-and-derivative`,
    title: 'A curve y = f(x) and the graph of its derivative together',
    desc: 'A solid cubic curve y equals f of x, which rises, falls, then rises. A dashed curve, y equals f dash of x, is a U-shaped parabola. The parabola crosses the x-axis at x equals minus 1 and x equals 1, where the solid curve is flat. Between those two values the dashed curve is below the axis, where the solid curve is falling.',
  });
}

// 13. A distance-time graph, the tangent at t = 3 and its gradient triangle: the rate of change.
function rateOfChange() {
  const s = (t) => t * t + 2 * t;
  const p = plane({ xmin: -0.5, xmax: 5.5, ymin: -3, ymax: 35, xstep: 1, ystep: 5, height: 520, right: 110, xlabel: 't (s)', ylabel: 's (metres)' });
  p.curve(s, { from: 0, to: 5 });
  p.line(1.6, 8 * 1.6 - 9, 4.3, 8 * 4.3 - 9, { cls: 'tangent' });
  p.line(3, 15, 4, 15, { cls: 'guide' });
  p.line(4, 15, 4, 23, { cls: 'guide' });
  p.point(3, 15, { label: '' });
  say(p, 2.9, 15, 'tangent at t = 3', { anchor: 'end', dy: -14 });
  say(p, 3.5, 15, 'across 1 s', { anchor: 'middle', dy: 36 });
  say(p, 4, 19, 'up 8 m', { dx: 14 });
  say(p, 0.2, 32, 'rate of change at t = 3', { cls: 'alt' });
  say(p, 0.2, 28.6, '= 8 m \u00f7 1 s = 8 m/s', { cls: 'alt' });
  return p.svg({
    id: `${P}rate-of-change`,
    title: 'The rate of change is the gradient of the tangent',
    desc: 'A graph of distance s in metres against time t in seconds. The curve rises ever more steeply. A tangent touches it at t equals 3, where s is 15. A dashed triangle under the tangent goes across 1 second and up 8 metres, so the rate of change at that moment is 8 metres per second.',
  });
}

// 14. Gradient at a point: substitute into the derivative.
function gradientAtPoint() {
  const f = (x) => x * x * x - 4 * x * x + 5;
  const p = plane({ xmin: -1, xmax: 4.2, ymin: -6, ymax: 10, xstep: 1, ystep: 2, height: 500 });
  p.curve(f, { from: -0.9, to: 4.1 });
  p.line(0.1, -5 * 0.1 + 7, 2.2, -5 * 2.2 + 7, { cls: 'tangent' });
  p.point(1, 2, { label: '' });
  say(p, 1.1, 2, '(1, 2)', { dx: 6, dy: -16 });
  say(p, 0.5, 9.2, 'gradient at x = 1 is \u22125', { cls: 'alt' });
  say(p, 0.5, 7.9, 'y = x^3 \u2212 4x^2 + 5', { cls: 'alt' });
  return p.svg({
    id: `${P}gradient-at-point`,
    title: 'The gradient of y = x cubed minus 4x squared plus 5 at the point (1, 2)',
    desc: 'The curve y equals x cubed minus 4 x squared plus 5, rising to a peak at (0, 5), falling through the point (1, 2) to a low point to the right, then rising again. A tangent touches it at (1, 2) and slopes steeply down, with gradient minus 5.',
  });
}

// 15. Flip: three curves with the same derivative, 2x, differing only in height.
function sameGradient() {
  const p = plane({ xmin: -2.5, xmax: 5, ymin: -4, ymax: 11, xstep: 1, ystep: 2, height: 540, ytickFormat: noYNumbers });
  p.curve((x) => x * x + 3, { cls: 'curve-c', from: -2.5, to: 2.7 });
  p.curve((x) => x * x, { from: -2.5, to: 3.1 });
  p.curve((x) => x * x - 3, { cls: 'curve-b', from: -2.5, to: 3.5 });
  p.vline(1);
  for (const c of [3, 0, -3]) {
    p.line(0.5, 1 + c - 1, 1.5, 1 + c + 1, { cls: 'tangent' });
    p.point(1, 1 + c, { label: '' });
  }
  [['y = x^2 + 3', 'curve-c', -1.5], ['y = x^2', 'curve', -2.4], ['y = x^2 \u2212 3', 'curve-b', -3.3]].forEach(([name, cls, y]) => {
    p.line(2.1, y, 2.7, y, { cls });
    say(p, 2.85, y, name, { cls: 'alt' });
  });
  say(p, -1.8, 10.3, 'the three tangents at x = 1');
  say(p, -1.8, 9.3, 'are parallel: gradient 2');
  return p.svg({
    id: `${P}same-gradient`,
    title: 'Three curves with the same derivative',
    desc: 'Three U-shaped curves, y equals x squared plus 3, y equals x squared and y equals x squared minus 3, drawn in three line styles. They are the same shape at three different heights. On a vertical line at x equals 1 each has a short tangent, and the three tangents are parallel, all with gradient 2. A key at the lower right names each curve.',
  });
}

// ---------------------------------------------------------------- question figures (the descriptions never give the answer)

// Q: read the gradient of a curve from two points on its tangent.
function qReadTangent() {
  const f = (x) => 0.75 * x * x;
  const p = plane({ xmin: -1, xmax: 4.2, ymin: -1, ymax: 9, xstep: 1, ystep: 2, height: 520 });
  p.curve(f, { from: -0.9, to: 3.3 });
  p.line(0.75, 3 * 0.75 - 3, 3.25, 3 * 3.25 - 3, { cls: 'tangent' });
  p.point(2, 3, { label: '' });
  p.point(1, 0, { label: '' });
  p.point(3, 6, { label: '' });
  say(p, 1.95, 3, 'P (2, 3)', { anchor: 'end', dx: -4, dy: -18 });
  say(p, 1.1, 0, '(1, 0)', { dy: 66 });
  say(p, 3.1, 6, '(3, 6)', { dy: 34 });
  return p.svg({
    id: `${P}q-read-tangent`,
    title: 'A curve with the tangent drawn at P',
    desc: 'A curve through the origin that rises to the right and gets steeper. A straight tangent touches it at the point P (2, 3). The tangent passes through the two marked points (1, 0) and (3, 6).',
  });
}

// Q: which of two tangents is steeper.
function qTwoTangents() {
  const p = plane({ xmin: -1, xmax: 3.2, ymin: -1, ymax: 9, xstep: 1, ystep: 2, height: 500 });
  p.curve(sq, { from: -1, to: 3 });
  for (const x of [1, 2]) {
    p.line(x - 0.85, sq(x) - 2 * x * 0.85, x + 0.85, sq(x) + 2 * x * 0.85, { cls: 'tangent' });
    p.point(x, sq(x), { label: '' });
  }
  say(p, 0.9, 1, 'A', { anchor: 'end', dy: -16 });
  say(p, 1.9, 4, 'B', { anchor: 'end', dy: -16 });
  return p.svg({
    id: `${P}q-two-tangents`,
    title: 'Two tangents drawn to the same curve',
    desc: 'A U-shaped curve with two points marked, A on the left and B further right and higher up. A straight tangent is drawn at each point. The two tangents slope up to the right at different angles.',
  });
}

// Q: the curve y = x^3 - 12x (two copies, so every figure id on the page stays unique).
function qCubic(suffix) {
  const f = (x) => x * x * x - 12 * x;
  const p = plane({ xmin: -4.5, xmax: 4.5, ymin: -20, ymax: 20, xstep: 1, ystep: 10, height: 520 });
  p.curve(f, { from: -4.5, to: 4.5 });
  say(p, 0.6, 17, 'y = f(x)', { cls: 'alt' });
  return p.svg({
    id: `${P}q-cubic-${suffix}`,
    title: 'The graph of a cubic function f',
    desc: 'A smooth curve through the origin. Coming from the lower left it rises to a hill, falls through the origin to a valley, then rises again to the upper right. The x-axis is marked in whole numbers from minus 4 to 4.',
  });
}

// Q: a distance-time graph with the tangent at P and two points on it.
function qRateRead() {
  const s = (t) => 0.25 * t * t + t;
  const p = plane({ xmin: -0.5, xmax: 7.5, ymin: -2, ymax: 21, xstep: 1, ystep: 4, height: 520, right: 110, xlabel: 't (s)', ylabel: 's (metres)' });
  p.curve(s, { from: 0, to: 7 });
  p.line(1.4, 3 * 1.4 - 4, 6.4, 3 * 6.4 - 4, { cls: 'tangent' });
  p.point(4, 8, { label: '' });
  p.point(2, 2, { label: '' });
  p.point(6, 14, { label: '' });
  say(p, 3.9, 8, 'P (4, 8)', { anchor: 'end', dy: -16 });
  say(p, 1.9, 2, '(2, 2)', { anchor: 'end', dy: -12 });
  say(p, 6.1, 14, '(6, 14)', { dy: 34 });
  return p.svg({
    id: `${P}q-rate-read`,
    title: 'A distance-time graph with a tangent at P',
    desc: 'A graph of the distance s in metres against the time t in seconds. The curve starts at the origin and rises, getting steeper. A straight tangent touches it at the point P (4, 8). The tangent passes through the marked points (2, 2) and (6, 14).',
  });
}

// Q (flip): the graph of a derivative, a straight line.
function qGradientGraph() {
  const p = plane({ xmin: -2, xmax: 4, ymin: -6, ymax: 6, xstep: 1, ystep: 2, height: 480 });
  p.curve((x) => 2 * x - 2, { from: -2, to: 4 });
  say(p, 2.3, 4.9, "y = f\u2032(x)", { cls: 'alt', anchor: 'end', dx: 0 });
  return p.svg({
    id: `${P}q-gradient-graph`,
    title: 'The graph of the derivative of a function f',
    desc: 'The graph of y equals f dash of x. It is a straight line sloping up to the right, crossing the y-axis at minus 2. The axes are marked in whole numbers.',
  });
}

export const FIGURES = {
  [`${P}q-read-tangent`]: qReadTangent,
  [`${P}q-two-tangents`]: qTwoTangents,
  [`${P}q-cubic-a`]: () => qCubic('a'),
  [`${P}q-cubic-b`]: () => qCubic('b'),
  [`${P}q-rate-read`]: qRateRead,
  [`${P}q-gradient-graph`]: qGradientGraph,
  [`${P}tangent-triangle`]: tangentTriangle,
  [`${P}chords-approach`]: chordsApproach,
  [`${P}chord-algebra`]: chordAlgebra,
  [`${P}limit-open-point`]: limitOpenPoint,
  [`${P}power-rule-steps`]: powerRuleSteps,
  [`${P}sqrt-tangents`]: sqrtTangents,
  [`${P}reciprocal-tangents`]: reciprocalTangents,
  [`${P}split-then-differentiate`]: splitThenDifferentiate,
  [`${P}second-derivative-positive`]: () => secondDerivative(true),
  [`${P}second-derivative-negative`]: () => secondDerivative(false),
  [`${P}gradient-signs`]: gradientSigns,
  [`${P}f-and-derivative`]: fAndDerivative,
  [`${P}rate-of-change`]: rateOfChange,
  [`${P}gradient-at-point`]: gradientAtPoint,
  [`${P}same-gradient`]: sameGradient,
};
