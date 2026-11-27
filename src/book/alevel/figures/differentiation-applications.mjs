// Figures for the Tangents, normals and stationary points page (src/pages/courses/a-level/differentiation-applications.html).
// Every curve and line is drawn from the function or equation listed in CURVES and LINES, so a picture cannot disagree
// with its equation. test/alevel-differentiation-applications.spec.ts reads GEOM, CURVES, LINES and POINTS to check each
// path, each straight line and each marked point, and measures every label in a browser.
// The pictures are 600 wide: at 320px the page shows a figure about 273px wide, so 27px text comes out at 12.3px.
// Where a right angle matters (tangent and normal) the two axes use the same scale, so the right angle looks like one.
import { plane } from '../figure-lib.mjs';

const W = 600;
const LEFT = 64;
const BOTTOM = 52;
const P = 'differentiation-applications-';

/** The size and range of each picture, so the test can turn a pixel back into graph coordinates. */
export const GEOM = {};
/** The curves of each figure, in the order they are drawn: { cls, fn, from, to }. */
export const CURVES = {};
/** The straight lines of each figure: { cls, m, c, x1, x2 } for y = m x + c, or { cls, x, y1, y2 } for a vertical line. */
export const LINES = {};
/** The marked points of each figure: { x, y, on } where `on` is the index of the curve the point lies on, or null. */
export const POINTS = {};

/** A plane with no grid and no scale numbers. `equal` makes one unit the same length on both axes. */
function frame(id, { xmin, xmax, ymin, ymax, height = 540, equal = false, top = 70, right = 48, width = W, xlabel = 'x', ylabel = 'y', axes = true }) {
  const h = equal ? Math.round(((width - LEFT - right) * (ymax - ymin)) / (xmax - xmin)) + top + BOTTOM : height;
  GEOM[id] = { width, height: h, left: LEFT, right, top, bottom: BOTTOM, xmin, xmax, ymin, ymax };
  CURVES[id] = [];
  LINES[id] = [];
  POINTS[id] = [];
  return plane({ axes, grid: false, ticks: false, tickLabels: false, width, height: h, top, right, xmin, xmax, ymin, ymax, xlabel, ylabel });
}

const curve = (p, id, fn, { cls = 'curve', from, to } = {}) => { CURVES[id].push({ cls, fn, from, to }); p.curve(fn, { cls, from, to }); };
const line = (p, id, m, c, x1, x2, cls = 'tangent') => { LINES[id].push({ cls, m, c, x1, x2 }); p.line(x1, m * x1 + c, x2, m * x2 + c, { cls }); };
const vline = (p, id, x, y1, y2, cls = 'tangent') => { LINES[id].push({ cls, x, y1, y2 }); p.line(x, y1, x, y2, { cls }); };
const mark = (p, id, x, y, { on = null, label = '', dx = 12, dy = -12, anchor = 'start' } = {}) => { POINTS[id].push({ x, y, on, label }); p.point(x, y, { label, dx, dy, anchor }); };
const say = (p, x, y, text, { anchor = 'middle', dx = 0, dy = 0, cls = '' } = {}) => p.text(x, y, text, { anchor, dx, dy, cls });

/** Short scale marks and numbers on an axis, in text as big as the labels (the library's own numbers are too small on a phone). */
function scale(p, id, { xs = [], ys = [], unlabelled = [] }) {
  const g = GEOM[id];
  const X = (x) => g.left + ((x - g.xmin) / (g.xmax - g.xmin)) * (g.width - g.left - g.right);
  const Y = (y) => g.top + (g.height - g.top - g.bottom) * (1 - (y - g.ymin) / (g.ymax - g.ymin));
  const y0 = Y(Math.min(Math.max(0, g.ymin), g.ymax));
  const x0 = X(Math.min(Math.max(0, g.xmin), g.xmax));
  for (const x of xs) {
    p.raw(`<line class="tick" x1="${X(x).toFixed(1)}" y1="${(y0 - 6).toFixed(1)}" x2="${X(x).toFixed(1)}" y2="${(y0 + 6).toFixed(1)}"/>`);
    if (!unlabelled.includes(x)) p.note(X(x), y0 + 46, String(x), { anchor: 'middle' });
  }
  for (const y of ys) {
    p.raw(`<line class="tick" x1="${(x0 - 6).toFixed(1)}" y1="${Y(y).toFixed(1)}" x2="${(x0 + 6).toFixed(1)}" y2="${Y(y).toFixed(1)}"/>`);
    p.note(x0 - 14, Y(y) + 9, String(y), { anchor: 'end' });
  }
}

/** A small square in the corner where two perpendicular lines cross at (x, y). `u` and `v` are unit vectors in graph directions. */
function rightAngle(p, id, x, y, u, v, size = 15) {
  const g = GEOM[id];
  const sx = (g.width - g.left - g.right) / (g.xmax - g.xmin);
  const sy = (g.height - g.top - g.bottom) / (g.ymax - g.ymin);
  const px = g.left + (x - g.xmin) * sx;
  const py = g.top + (g.height - g.top - g.bottom) - (y - g.ymin) * sy;
  const dir = ([a, b]) => { const n = Math.hypot(a * sx, b * sy); return [(a * sx * size) / n, (-b * sy * size) / n]; };
  const [ux, uy] = dir(u);
  const [vx, vy] = dir(v);
  p.raw(`<polyline class="line" style="stroke-width:2.5" points="${(px + ux).toFixed(1)},${(py + uy).toFixed(1)} ${(px + ux + vx).toFixed(1)},${(py + uy + vy).toFixed(1)} ${(px + vx).toFixed(1)},${(py + vy).toFixed(1)}"/>`);
}

// Labels get a halo in the page colour, so a label that crosses a line stays readable.
const HALO = 'paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round';
const finish = (p, meta) => p.svg(meta).replace(/<text class="svg-t([^>]*)>([\s\S]*?)<\/text>/g, (whole, attrs, body) => (body.includes('<tspan') ? whole : `<text style="${HALO}" class="svg-t${attrs}>${body}</text>`));

const box = (x, y, w, h) => `<rect class="box" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`;

// The curves used on the page.
const C1 = (x) => x * x - 4 * x + 5; // lessons 1 and 2: tangent and normal at x = 3, and the vertex at x = 2
const F3 = (x) => x * x * x - 6 * x * x + 9 * x; // lessons 3 and 5: maximum (1, 4), minimum (3, 0)
const G3 = (x) => x * x * x - 12 * x; // lessons 3 and 4: stationary points (-2, 16) and (2, -16)

export const FIGURES = {
  // ---- 1. the tangent at A on y = x^2 - 4x + 5, with its gradient triangle ----
  [`${P}tangent-line`]: () => {
    const id = `${P}tangent-line`;
    const p = frame(id, { xmin: -1, xmax: 6.4, ymin: -5, ymax: 9, height: 560 });
    curve(p, id, C1);
    line(p, id, 2, -4, 0.5, 5.5);
    line(p, id, 0, 2, 3, 4, 'guide');
    vline(p, id, 4, 2, 4, 'guide');
    mark(p, id, 3, 2, { on: 0, label: 'A (3, 2)', dx: -18, dy: -16, anchor: 'end' });
    say(p, 3.1, 2, 'across 1', { anchor: 'start', dy: 36 });
    say(p, 4, 3, 'up 2', { dx: 14, anchor: 'start', dy: 8 });
    say(p, 2.2, -3.2, 'tangent', { anchor: 'start' });
    say(p, 4.3, 8.4, 'y = x^2 - 4x + 5', { anchor: 'end' });
    return finish(p, {
      id,
      title: 'The tangent to y = x^2 - 4x + 5 at A (3, 2)',
      desc: 'A U-shaped curve, y equals x squared minus 4x plus 5, with its lowest point at (2, 1). A straight tangent touches it at the marked point A (3, 2). A dashed triangle under the tangent goes across 1, from (3, 2) to (4, 2), and up 2, from (4, 2) to (4, 4), so the tangent rises 2 for each 1 across.',
    });
  },

  // ---- 1. the three steps ----
  [`${P}tangent-method`]: () => {
    const id = `${P}tangent-method`;
    GEOM[id] = { width: W, height: 520, left: LEFT, right: 48, top: 44, bottom: BOTTOM, xmin: 0, xmax: 1, ymin: 0, ymax: 1 };
    CURVES[id] = [];
    LINES[id] = [];
    POINTS[id] = [];
    const p = plane({ axes: false, grid: false, ticks: false, tickLabels: false, width: W, height: 520 });
    const arrow = (y) => `<line class="axis" x1="300" y1="${y}" x2="300" y2="${y + 18}"/><polygon class="arrowhead" points="300,${y + 28} 291,${y + 12} 309,${y + 12}"/>`;
    p.raw(box(40, 20, 520, 108) + arrow(130) + box(40, 168, 520, 108) + arrow(278) + box(40, 316, 520, 176));
    p.note(60, 56, '1  Differentiate', { cls: 'alt' });
    p.note(60, 104, 'dy/dx = 2x - 4');
    p.note(60, 204, '2  Put in x = 3 for the gradient', { cls: 'alt' });
    p.note(60, 252, 'm = 2(3) - 4 = 2');
    p.note(60, 352, '3  Find y at x = 3, then use', { cls: 'alt' });
    p.note(60, 412, 'y - y_1 = m(x - x_1)');
    p.note(60, 466, 'y - 2 = 2(x - 3)');
    return finish(p, {
      id,
      title: 'Three steps to the equation of a tangent',
      desc: 'Three boxes, one above the next, joined by arrows, for the curve y equals x squared minus 4x plus 5 at x equals 3. Box 1: differentiate, dy by dx equals 2x minus 4. Box 2: put in x equals 3 to get the gradient, m equals 2 times 3 minus 4, which is 2. Box 3: find y at x equals 3, then use y minus y1 equals m times x minus x1, which gives y minus 2 equals 2 times x minus 3.',
    });
  },

  // ---- question (lesson 1): the curve and the point P, nothing else ----
  [`${P}q-tangent`]: () => {
    const id = `${P}q-tangent`;
    const p = frame(id, { xmin: -2, xmax: 4.6, ymin: -1, ymax: 12, height: 520, width: 470 });
    curve(p, id, (x) => x * x - 2 * x + 3);
    mark(p, id, 3, 6, { on: 0, label: 'P (3, 6)', dx: -18, dy: -14, anchor: 'end' });
    return finish(p, {
      id,
      title: 'A curve with the point P marked on it',
      desc: 'A U-shaped curve with its lowest point near the vertical axis. The point P (3, 6) is marked on the right-hand side of the curve.',
    });
  },

  // ---- 2. the tangent and the normal at A, with a right angle between them ----
  [`${P}tangent-normal`]: () => {
    const id = `${P}tangent-normal`;
    const p = frame(id, { xmin: -1.3, xmax: 6.5, ymin: -1.2, ymax: 6.5, equal: true });
    curve(p, id, C1);
    line(p, id, 2, -4, 1.4, 4.7);
    line(p, id, -0.5, 3.5, -0.4, 5.0, 'line');
    rightAngle(p, id, 3, 2, [1, 2], [2, -1]);
    mark(p, id, 3, 2, { on: 0, label: 'A (3, 2)', dx: 28, dy: -4, anchor: 'start' });
    say(p, 2.25, -0.85, 'tangent', { anchor: 'start' });
    say(p, 5.15, 0.7, 'normal', { anchor: 'start' });
    say(p, 0.6, 6.0, 'y = x^2 - 4x + 5', { anchor: 'start' });
    return finish(p, {
      id,
      title: 'The tangent and the normal to y = x^2 - 4x + 5 at A (3, 2)',
      desc: 'The curve y equals x squared minus 4x plus 5, drawn with the same scale on both axes. At the marked point A (3, 2) a straight tangent rises to the right with gradient 2. A second straight line, the normal, crosses it at A and falls to the right with gradient minus one half. A small square at A shows that the two lines are at right angles.',
    });
  },

  // ---- 2. a horizontal tangent has a vertical normal ----
  [`${P}normal-vertical`]: () => {
    const id = `${P}normal-vertical`;
    const p = frame(id, { xmin: -0.8, xmax: 5.2, ymin: -1.3, ymax: 4, equal: true });
    curve(p, id, C1);
    line(p, id, 0, 1, 0.3, 3.7);
    vline(p, id, 2, -0.5, 3.2, 'line');
    rightAngle(p, id, 2, 1, [-1, 0], [0, -1]);
    mark(p, id, 2, 1, { on: 0, label: '(2, 1)', dx: 16, dy: 36, anchor: 'start' });
    say(p, 1.75, 0.4, 'tangent', { anchor: 'end' });
    say(p, 2.2, -0.85, 'normal', { anchor: 'start' });
    return finish(p, {
      id,
      title: 'A horizontal tangent and its vertical normal at the lowest point (2, 1)',
      desc: 'The curve y equals x squared minus 4x plus 5, drawn with the same scale on both axes. Its lowest point, (2, 1), is marked. A horizontal tangent touches the curve there, and a vertical normal crosses it. A small square shows that the two lines are at right angles.',
    });
  },

  // ---- question (lesson 2): a normal through P and Q ----
  [`${P}q-normal`]: () => {
    const id = `${P}q-normal`;
    const p = frame(id, { xmin: -1.5, xmax: 7.5, ymin: -1, ymax: 6.5, equal: true, width: 470 });
    curve(p, id, (x) => x * x);
    line(p, id, -0.25, 4.5, -0.5, 7.2, 'line');
    mark(p, id, 2, 4, { on: 0, label: 'P (2, 4)', dx: 22, dy: -26, anchor: 'start' });
    mark(p, id, 6, 3, { label: 'Q (6, 3)', dx: 0, dy: 52, anchor: 'middle' });
    return finish(p, {
      id,
      title: 'A curve with a straight line through the points P and Q',
      desc: 'A U-shaped curve, drawn with the same scale on both axes. A straight line crosses the curve at the marked point P (2, 4) and runs on, falling gently, through the marked point Q (6, 3).',
    });
  },

  // ---- 3. the cubic: solid where it rises, dashed where it falls ----
  [`${P}increasing-decreasing`]: () => {
    const id = `${P}increasing-decreasing`;
    const p = frame(id, { xmin: -1.2, xmax: 5, ymin: -4, ymax: 9.5, height: 560 });
    curve(p, id, F3, { to: 1 });
    curve(p, id, F3, { cls: 'curve-b', from: 1, to: 3 });
    curve(p, id, F3, { from: 3 });
    mark(p, id, 1, 4, { on: 0, label: '(1, 4)', dx: 0, dy: -22, anchor: 'middle' });
    mark(p, id, 3, 0, { on: 2, label: '(3, 0)', dx: 0, dy: 42, anchor: 'middle' });
    const K = (y, cls, text) => { p.raw(`<line class="${cls}" x1="206" y1="${y - 8}" x2="262" y2="${y - 8}"/>`); p.note(278, y, text, { cls: 'alt' }); };
    K(90, 'curve', 'increasing');
    K(136, 'curve-b', 'decreasing');
    return finish(p, {
      id,
      title: 'The curve y = x^3 - 6x^2 + 9x, rising, then falling, then rising',
      desc: 'A cubic curve that rises to a marked peak at (1, 4), falls to a marked valley at (3, 0) and then rises again. The two rising parts are drawn solid and the falling part between the peak and the valley is drawn dashed. A key at the top says solid means increasing and dashed means decreasing.',
    });
  },

  // ---- 3. the sign of the gradient, in three parts ----
  [`${P}sign-chart`]: () => {
    const id = `${P}sign-chart`;
    GEOM[id] = { width: W, height: 330, left: LEFT, right: 48, top: 44, bottom: BOTTOM, xmin: 0, xmax: 1, ymin: 0, ymax: 1 };
    CURVES[id] = [];
    LINES[id] = [];
    POINTS[id] = [];
    const p = plane({ axes: false, grid: false, ticks: false, tickLabels: false, width: W, height: 330 });
    p.raw('<line class="axis" x1="30" y1="150" x2="560" y2="150"/><polygon class="arrowhead" points="574,150 558,142 558,158"/>');
    p.raw('<circle class="pt" cx="200" cy="150" r="9"/><circle class="pt" cx="400" cy="150" r="9"/>');
    p.note(200, 200, '1', { anchor: 'middle' });
    p.note(400, 200, '3', { anchor: 'middle' });
    p.note(110, 90, 'dy/dx > 0', { anchor: 'middle' });
    p.note(300, 90, 'dy/dx < 0', { anchor: 'middle' });
    p.note(490, 90, 'dy/dx > 0', { anchor: 'middle' });
    p.note(110, 270, 'increasing', { anchor: 'middle', cls: 'alt' });
    p.note(300, 270, 'decreasing', { anchor: 'middle', cls: 'alt' });
    p.note(490, 270, 'increasing', { anchor: 'middle', cls: 'alt' });
    p.note(574, 188, 'x', { anchor: 'middle' });
    return finish(p, {
      id,
      title: 'The sign of dy/dx for the cubic, on a number line',
      desc: 'A horizontal number line with two marked points, 1 and 3. To the left of 1, dy by dx is greater than 0, so the curve is increasing. Between 1 and 3, dy by dx is less than 0, so the curve is decreasing. To the right of 3, dy by dx is greater than 0, so the curve is increasing.',
    });
  },

  // ---- question (lesson 3): where does the graph go down? ----
  [`${P}q-decreasing`]: () => {
    const id = `${P}q-decreasing`;
    const p = frame(id, { xmin: -4.5, xmax: 4.5, ymin: -22, ymax: 22, height: 680, width: 470 });
    curve(p, id, G3);
    scale(p, id, { xs: [-4, -3, -2, -1, 1, 2, 3, 4], unlabelled: [-4, -3, 3, 4] });
    say(p, 3.9, -19, 'y = f(x)', { anchor: 'middle', cls: 'alt' });
    return finish(p, {
      id,
      title: 'The graph of a cubic function f',
      desc: 'A smooth curve through the origin. Coming from the lower left it rises to a peak, falls through the origin to a valley, then rises again to the upper right. The horizontal axis has a scale mark at each whole number from minus 4 to 4; minus 2, minus 1, 1 and 2 are numbered. The vertical axis has no scale.',
    });
  },

  // ---- 4. horizontal tangents at the two stationary points of y = x^3 - 12x ----
  [`${P}stationary-cubic`]: () => {
    const id = `${P}stationary-cubic`;
    const p = frame(id, { xmin: -5.2, xmax: 5.2, ymin: -22, ymax: 22, height: 580 });
    curve(p, id, G3);
    line(p, id, 0, 16, -3.2, -0.8);
    line(p, id, 0, -16, 0.8, 3.2);
    mark(p, id, -2, 16, { on: 0, label: '(-2, 16)', dx: 0, dy: -22, anchor: 'middle' });
    mark(p, id, 2, -16, { on: 0, label: '(2, -16)', dx: 0, dy: 44, anchor: 'middle' });
    say(p, -3.5, 14.2, 'm = 0', { anchor: 'end' });
    say(p, 3.5, -17.8, 'm = 0', { anchor: 'start' });
    say(p, 3.6, 19.5, 'y = x^3 - 12x', { anchor: 'end' });
    return finish(p, {
      id,
      title: 'The curve y = x^3 - 12x with a horizontal tangent at each stationary point',
      desc: 'A smooth cubic curve through the origin. It has a peak at the marked point (minus 2, 16) and a valley at the marked point (2, minus 16). A horizontal tangent touches the curve at each of these points and is labelled m equals 0, where m is the gradient. The gradient of the curve is 0 at both.',
    });
  },

  // ---- 5. the same cubic as lesson 3, now with the nature of each stationary point ----
  [`${P}nature-cubic`]: () => {
    const id = `${P}nature-cubic`;
    const p = frame(id, { xmin: -1.2, xmax: 5, ymin: -4, ymax: 9.5, height: 560 });
    curve(p, id, F3);
    mark(p, id, 1, 4, { on: 0, label: '(1, 4)', dx: 0, dy: -22, anchor: 'middle' });
    mark(p, id, 3, 0, { on: 0, label: '(3, 0)', dx: 0, dy: 42, anchor: 'middle' });
    say(p, 1.3, 6.2, 'maximum point', { anchor: 'start' });
    say(p, 3, -2.9, 'minimum point', { anchor: 'middle' });
    return finish(p, {
      id,
      title: 'The curve y = x^3 - 6x^2 + 9x with its maximum point and its minimum point',
      desc: 'A cubic curve that rises to a peak at the marked point (1, 4), labelled maximum point, falls to a valley at the marked point (3, 0), labelled minimum point, and then rises again.',
    });
  },

  // ---- 5. y = x^4 and y = x^3: the same second derivative at 0, different shapes ----
  [`${P}second-derivative-zero`]: () => {
    const id = `${P}second-derivative-zero`;
    const p = frame(id, { xmin: -1.4, xmax: 1.4, ymin: -2, ymax: 3, height: 520 });
    curve(p, id, (x) => x ** 4);
    curve(p, id, (x) => x ** 3, { cls: 'curve-b' });
    mark(p, id, 0, 0, { label: '(0, 0)', dx: 18, dy: 36, anchor: 'start' });
    say(p, -0.62, 2.55, 'y = x^4', { anchor: 'middle' });
    say(p, -0.55, -1.7, 'y = x^3', { anchor: 'middle' });
    return finish(p, {
      id,
      title: 'The curves y = x^4 and y = x^3 both have a stationary point at the origin',
      desc: 'Two curves that both pass through the marked point (0, 0). The solid curve, y equals x to the 4, is a U shape with its lowest point at (0, 0). The dashed curve, y equals x cubed, rises from the lower left through (0, 0) to the upper right, with a horizontal tangent at the origin.',
    });
  },

  // ---- 5. the sign of the gradient either side of a minimum ----
  [`${P}gradient-test-min`]: () => {
    const id = `${P}gradient-test-min`;
    const p = frame(id, { xmin: -1.6, xmax: 5.8, ymin: -0.6, ymax: 6.5, height: 520, axes: false });
    curve(p, id, C1);
    line(p, id, -2, 4, 0.3, 1.7);
    line(p, id, 0, 1, 1.3, 2.7);
    line(p, id, 2, -4, 2.3, 3.7);
    mark(p, id, 1, 2, { on: 0 });
    mark(p, id, 2, 1, { on: 0 });
    mark(p, id, 3, 2, { on: 0 });
    say(p, 0, 4.1, 'm = -2', { anchor: 'end' });
    say(p, 2, -0.2, 'm = 0', { anchor: 'middle' });
    say(p, 4, 4.1, 'm = 2', { anchor: 'start' });
    return finish(p, {
      id,
      title: 'Three tangents to a curve on either side of its lowest point',
      desc: 'The curve y equals x squared minus 4x plus 5 with three marked points and a tangent at each; m is the gradient of the tangent. At (1, 2) the tangent slopes down to the right and is labelled m equals minus 2. At the lowest point (2, 1) the tangent is horizontal and is labelled m equals 0. At (3, 2) the tangent slopes up to the right and is labelled m equals 2.',
    });
  },

  // ---- 6. the area of a rectangle of perimeter 40 cm, against its width ----
  [`${P}optimise-rectangle`]: () => {
    const id = `${P}optimise-rectangle`;
    const p = frame(id, { xmin: -3, xmax: 23, ymin: -14, ymax: 122, height: 540, ylabel: 'A (cm^2)' });
    curve(p, id, (x) => x * (20 - x), { from: 0, to: 20 });
    line(p, id, 0, 100, 0, 10, 'guide');
    vline(p, id, 10, 0, 100, 'guide');
    mark(p, id, 10, 100, { on: 0, label: '(10, 100)', dx: 0, dy: -24, anchor: 'middle' });
    say(p, 10, 0, 'width 10', { dy: 38 });
    return finish(p, {
      id,
      title: 'The area A = x(20 - x) of a rectangle with perimeter 40 cm, against its width x',
      desc: 'An upside-down U-shaped curve that starts at the origin, rises to a marked peak at (10, 100) and falls back to the horizontal axis at x equals 20. Dashed lines run from the peak down to x equals 10 and across to the vertical axis at A equals 100. The greatest area is at the peak.',
    });
  },

  // ---- question (lesson 6 and the exam): the net of an open box ----
  [`${P}q-box-net`]: () => {
    const id = `${P}q-box-net`;
    GEOM[id] = { width: 470, height: 440, left: LEFT, right: 48, top: 44, bottom: BOTTOM, xmin: 0, xmax: 1, ymin: 0, ymax: 1 };
    CURVES[id] = [];
    LINES[id] = [];
    POINTS[id] = [];
    const p = plane({ axes: false, grid: false, ticks: false, tickLabels: false, width: 470, height: 440 });
    const x0 = 85;
    const y0 = 70;
    const s = 300;
    const c = 66;
    p.raw(`<rect class="box" x="${x0}" y="${y0}" width="${s}" height="${s}"/>`);
    for (const [cx, cy] of [[x0, y0], [x0 + s - c, y0], [x0, y0 + s - c], [x0 + s - c, y0 + s - c]]) p.raw(`<rect class="shade" x="${cx}" y="${cy}" width="${c}" height="${c}" style="stroke:var(--ink);stroke-width:2"/>`);
    p.raw(`<rect class="guide" fill="none" x="${x0 + c}" y="${y0 + c}" width="${s - 2 * c}" height="${s - 2 * c}"/>`);
    for (const [cx, cy] of [[x0, y0], [x0 + s - c, y0], [x0, y0 + s - c], [x0 + s - c, y0 + s - c]]) p.note(cx + c / 2, cy + c / 2 + 9, 'x', { anchor: 'middle' });
    p.note(x0 + s / 2, y0 + s / 2 + 9, 'base', { anchor: 'middle', cls: 'alt' });
    p.note(x0 + s / 2, y0 - 18, '12 cm', { anchor: 'middle' });
    return finish(p, {
      id,
      title: 'A square sheet with a small square cut from each corner',
      desc: 'A square sheet of card, 12 centimetres along each side. A small square of side x is shaded at each of the four corners, and a dashed square in the middle marks the base of the box. The shaded squares are cut away and the four flaps are folded up.',
    });
  },

  // ---- flip: the curve y = x^2 + bx + c with its minimum at (3, -2) ----
  [`${P}flip-minimum`]: () => {
    const id = `${P}flip-minimum`;
    const p = frame(id, { xmin: -1.2, xmax: 6.8, ymin: -4.5, ymax: 9.5, height: 540 });
    curve(p, id, (x) => x * x - 6 * x + 7);
    line(p, id, 0, -2, 2, 4);
    mark(p, id, 3, -2, { on: 0, label: '(3, -2)', dx: 0, dy: 44, anchor: 'middle' });
    mark(p, id, 0, 7, { on: 0, label: '(0, 7)', dx: -16, dy: 8, anchor: 'end' });
    say(p, 3.1, 5.9, 'y = x^2 - 6x + 7', { anchor: 'middle' });
    return finish(p, {
      id,
      title: 'The curve y = x^2 - 6x + 7 with its minimum point at (3, -2)',
      desc: 'A U-shaped curve with its lowest point at the marked point (3, minus 2), where a horizontal tangent touches it. The curve crosses the vertical axis at the marked point (0, 7).',
    });
  },
};
