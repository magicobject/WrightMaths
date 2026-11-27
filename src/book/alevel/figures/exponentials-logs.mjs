// Figures for the Exponentials and logarithms topic page (src/pages/courses/a-level/exponentials-logs.html).
// Every curve is drawn from the function listed in CURVES, so a picture cannot disagree with its equation.
// test/alevel-exponentials-logs.spec.ts reads GEOM, CURVES and POINTS to check each path and each marked point.
// Axes have no scale numbers: the points that matter are labelled on the picture. A key at the top names each
// curve with a short sample of how it is drawn, so no label sits on a curve.
import { plane } from '../figure-lib.mjs';

const W = 640;
const LEFT = 64;
const RIGHT = 48;
const BOTTOM = 52;
const ROW = 38; // the height of one row of the key

const LN2 = Math.LN2;

/** The picture's size and range, kept so the test can turn a pixel back into graph coordinates. */
export const GEOM = {};
/** The curves of each figure, in the order they are drawn: { cls, fn }. */
export const CURVES = {};
/** The marked points of each figure: { x, y, on } where `on` is the index of the curve the point lies on, or null. */
export const POINTS = {};

/**
 * A plane with no grid and no scale numbers. With `ymid` both axes use the SAME scale (needed where a graph and its
 * mirror image in y = x are drawn). With `ymin` and `ymax` the vertical scale is free. `keys` is the number of key rows above the graph.
 */
function sketch(id, { xmin, xmax, ymid, ymin, ymax, keys = 2, height = 620, width = W }) {
  const top = 36 + ROW * (keys - 1) + 62;
  let lo = ymin;
  let hi = ymax;
  if (ymid !== undefined) {
    const w = width - LEFT - RIGHT;
    const h = height - top - BOTTOM;
    const half = (((xmax - xmin) * h) / w) / 2;
    lo = ymid - half;
    hi = ymid + half;
  }
  GEOM[id] = { width, height, left: LEFT, right: RIGHT, top, bottom: BOTTOM, xmin, xmax, ymin: lo, ymax: hi };
  return plane({ grid: false, ticks: false, tickLabels: false, width, height, top, xmin, xmax, ymin: lo, ymax: hi });
}

/** The key: a sample of each style, then what it is. rows: [[class, text], ...] */
function key(p, rows) {
  rows.forEach(([cls, text], i) => {
    const y = 36 + ROW * i;
    p.raw(`<line class="${cls}" x1="${LEFT}" y1="${y - 8}" x2="${LEFT + 56}" y2="${y - 8}"/>`);
    p.note(LEFT + 72, y, text, { cls: 'alt' });
  });
}

/** Draw the curves of a figure from CURVES, then its marked points from POINTS. */
function draw(p, id, curves, points = []) {
  CURVES[id] = curves;
  POINTS[id] = points.map(({ x, y, on = null }) => ({ x, y, on }));
  for (const { cls, fn } of curves) p.curve(fn, { cls });
  for (const { x, y, label, dx, dy, anchor } of points) p.point(x, y, { label, dx, dy, anchor });
}

/** Labels get a halo in the page colour, so a label that crosses an axis or a guide line stays readable. */
const HALO = 'paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round';
const finish = (p, meta) => p.svg(meta).replace(/<text class="svg-t([^>]*)>([\s\S]*?)<\/text>/g, (whole, attrs, body) => (body.includes('<tspan') ? whole : `<text style="${HALO}" class="svg-t${attrs}>${body}</text>`));

const two = (x) => 2 ** x;
const half = (x) => 0.5 ** x;
const three = (x) => 3 ** x;
const exp = (x) => Math.exp(x);
const log2 = (x) => Math.log2(x);

export const FIGURES = {
  // ---- 1. y = a^x: the shape for a > 1 and for 0 < a < 1 ----
  'exponentials-logs-powers': () => {
    const id = 'exponentials-logs-powers';
    const p = sketch(id, { xmin: -3, xmax: 3.4, ymid: 2.3 });
    key(p, [['curve', 'y = 2^x'], ['curve-b', 'y = (1/2)^x']]);
    draw(p, id, [{ cls: 'curve', fn: two }, { cls: 'curve-b', fn: half }], [{ x: 0, y: 1, on: 0, label: '(0, 1)', dx: 22, dy: 8 }]);
    p.text(-3, 0, 'x-axis is the asymptote', { cls: 'alt', anchor: 'start', dy: 36 });
    return finish(p, {
      id,
      title: 'The graphs of y = 2^x and y = (1/2)^x both pass through (0, 1)',
      desc: 'Two curves that are mirror images of each other in the y-axis. The solid curve, y equals 2 to the power x, rises from near the x-axis on the left to high values on the right. The dashed curve, y equals one half to the power x, falls from high values on the left to near the x-axis on the right. Both pass through the marked point (0, 1) and both stay above the x-axis, which they approach but never reach.',
    });
  },

  // ---- 1. the number e sits between 2 and 3 ----
  'exponentials-logs-e': () => {
    const id = 'exponentials-logs-e';
    const p = sketch(id, { xmin: -3, xmax: 1.7, ymid: 1.3, keys: 3, height: 640 });
    key(p, [['curve', 'y = e^x'], ['curve-b', 'y = 2^x'], ['curve-c', 'y = 3^x']]);
    draw(p, id, [{ cls: 'curve', fn: exp }, { cls: 'curve-b', fn: two }, { cls: 'curve-c', fn: three }], [{ x: 0, y: 1, label: '(0, 1)', dx: 22, dy: 34 }]);
    return finish(p, {
      id,
      title: 'The graph of y = e^x lies between y = 2^x and y = 3^x',
      desc: 'Three rising curves that all pass through (0, 1), which is marked. For x greater than 0 the dotted curve y equals 3 to the power x is the highest, the solid curve y equals e to the power x is in the middle and the dashed curve y equals 2 to the power x is the lowest. For x less than 0 the order is reversed. All three stay above the x-axis.',
    });
  },

  // ---- 1. y = e^(-x) + 2: a horizontal asymptote above the axis ----
  'exponentials-logs-shift': () => {
    const id = 'exponentials-logs-shift';
    const p = sketch(id, { xmin: -1.6, xmax: 4.2, ymin: -1, ymax: 6.2, keys: 1, height: 540 });
    key(p, [['curve', 'y = e^(-x) + 2']]);
    p.line(-1.6, 2, 4.2, 2, { cls: 'guide' });
    draw(p, id, [{ cls: 'curve', fn: (x) => Math.exp(-x) + 2 }], [{ x: 0, y: 3, on: 0, label: '(0, 3)', dx: 20, dy: -14 }]);
    p.text(4.1, 2, 'asymptote y = 2', { cls: 'alt', anchor: 'end', dy: 40 });
    return finish(p, {
      id,
      title: 'The graph of y = e^(-x) + 2 has the horizontal asymptote y = 2',
      desc: 'A solid curve that falls from high values on the left to the right, getting closer and closer to a horizontal dashed line at y equals 2, which it never reaches. The curve crosses the y-axis at the marked point (0, 3). The line is labelled as the asymptote y equals 2.',
    });
  },

  // ---- 2. the logarithm is the exponential reflected in y = x ----
  'exponentials-logs-inverse': () => {
    const id = 'exponentials-logs-inverse';
    const p = sketch(id, { xmin: -2.5, xmax: 4.5, ymid: 1.3, keys: 3, height: 640 });
    key(p, [['curve', 'y = e^x'], ['curve-b', 'y = ln x'], ['guide', 'y = x (the mirror)']]);
    p.line(-2.5, -2.5, 4.5, 4.5, { cls: 'guide' });
    draw(p, id, [{ cls: 'curve', fn: exp }, { cls: 'curve-b', fn: Math.log }], [
      { x: 0, y: 1, on: 0, label: '(0, 1)', dx: -18, dy: -10, anchor: 'end' },
      { x: 1, y: 0, on: 1, label: '(1, 0)', dx: 16, dy: 36 },
    ]);
    return finish(p, {
      id,
      title: 'The graphs of y = e^x and y = ln x are mirror images in the line y = x',
      desc: 'Three lines on axes with the same scale. The solid curve y equals e to the power x passes through (0, 1) and rises steeply. The dashed curve y equals the natural logarithm of x passes through (1, 0), rises slowly and has the y-axis as an asymptote. A dashed straight line, y equals x, lies between them. Each curve is the reflection of the other in that line, so the point (0, 1) on one matches the point (1, 0) on the other.',
    });
  },

  // ---- 4. a^x = b: where a graph meets a horizontal line ----
  'exponentials-logs-solve': () => {
    const id = 'exponentials-logs-solve';
    const x0 = Math.log(10) / Math.log(2);
    const p = sketch(id, { xmin: -1.2, xmax: 5, ymin: -2, ymax: 15, keys: 2, height: 600 });
    key(p, [['curve', 'y = 2^x'], ['guide', 'y = 10']]);
    p.line(-1.2, 10, 5, 10, { cls: 'guide' });
    p.line(x0, 0, x0, 10, { cls: 'guide' });
    draw(p, id, [{ cls: 'curve', fn: two }], [{ x: x0, y: 10, on: 0, label: '(3.32, 10)', dx: -16, dy: -16, anchor: 'end' }]);
    p.text(x0, 0, 'x = 3.32', { cls: 'alt', dy: 38 });
    return finish(p, {
      id,
      title: 'The graph of y = 2^x meets the line y = 10 where x is about 3.32',
      desc: 'A solid curve, y equals 2 to the power x, rising from near the x-axis on the left. A dashed horizontal line at y equals 10 cuts it at one marked point. A dashed vertical line drops from that point to the x-axis, where it is labelled x equals 3.32. The point is the only place where the curve is level with the line.',
    });
  },

  // ---- 6. an inequality: where the curve is above the line ----
  'exponentials-logs-region': () => {
    const id = 'exponentials-logs-region';
    const x0 = Math.log(10) / Math.log(2);
    const p = sketch(id, { xmin: -1.2, xmax: 5, ymin: -2, ymax: 15, keys: 3, height: 640 });
    key(p, [['curve', 'y = 2^x'], ['guide', 'y = 10'], ['curve-c', 'where 2^x > 10']]);
    p.line(-1.2, 10, 5, 10, { cls: 'guide' });
    p.line(x0, 0, x0, 10, { cls: 'guide' });
    draw(p, id, [{ cls: 'curve', fn: two }], [{ x: x0, y: 10, on: 0 }]);
    p.line(x0, 0, 5, 0, { cls: 'curve-c' });
    p.text(x0, 0, 'x = 3.32', { cls: 'alt', anchor: 'end', dx: -8, dy: 38 });
    p.text(5, 0, 'x > 3.32', { cls: 'alt', anchor: 'end', dy: -18 });
    return finish(p, {
      id,
      title: 'The curve y = 2^x is above the line y = 10 when x is greater than 3.32',
      desc: 'A solid curve, y equals 2 to the power x, and a dashed horizontal line at y equals 10. They meet at the marked point, where x is 3.32. A thick dotted bar along the x-axis, starting at x equals 3.32 and running to the right, shows the values of x for which the curve is above the line.',
    });
  },

  // ---- 5. y = e^(2x) - 4: asymptote, y-intercept and x-intercept ----
  'exponentials-logs-crossing': () => {
    const id = 'exponentials-logs-crossing';
    const p = sketch(id, { xmin: -2.2, xmax: 1.5, ymin: -5.4, ymax: 7, keys: 1, height: 600 });
    key(p, [['curve', 'y = e^(2x) - 4']]);
    p.line(-2.2, -4, 1.5, -4, { cls: 'guide' });
    draw(p, id, [{ cls: 'curve', fn: (x) => Math.exp(2 * x) - 4 }], [
      { x: 0, y: -3, on: 0, label: '(0, -3)', dx: -18, dy: -12, anchor: 'end' },
      { x: LN2, y: 0, on: 0, label: '(ln 2, 0)', dx: 16, dy: 40 },
    ]);
    p.text(-2.1, -4, 'asymptote y = -4', { cls: 'alt', anchor: 'start', dy: 40 });
    return finish(p, {
      id,
      title: 'The graph of y = e^(2x) - 4 crosses the axes at (0, -3) and (ln 2, 0)',
      desc: 'A solid curve that rises from left to right. On the left it gets closer and closer to a horizontal dashed line at y equals minus 4, labelled as the asymptote. It crosses the y-axis at the marked point (0, minus 3) and crosses the x-axis at the marked point (ln 2, 0), then climbs steeply.',
    });
  },

  // ---- flip it: swap the coordinates of a point on y = 2^x ----
  'exponentials-logs-flip': () => {
    const id = 'exponentials-logs-flip';
    const p = sketch(id, { xmin: -2, xmax: 9.5, ymid: 4, keys: 3, height: 640 });
    key(p, [['curve', 'y = 2^x'], ['curve-b', 'y = log_2 x'], ['guide', 'y = x (the mirror)']]);
    p.line(-2, -2, 9.5, 9.5, { cls: 'guide' });
    draw(p, id, [{ cls: 'curve', fn: two }, { cls: 'curve-b', fn: log2 }], [
      { x: 3, y: 8, on: 0, label: '(3, 8)', dx: -16, dy: -12, anchor: 'end' },
      { x: 8, y: 3, on: 1, label: '(8, 3)', dx: 8, dy: 40 },
    ]);
    return finish(p, {
      id,
      title: 'The point (3, 8) on y = 2^x becomes (8, 3) on y = log_2 x',
      desc: 'Axes with the same scale. The solid curve y equals 2 to the power x rises steeply and passes through the marked point (3, 8). The dashed curve y equals the logarithm to base 2 of x rises slowly and passes through the marked point (8, 3). A dashed line, y equals x, lies between them. Swapping the two coordinates of a point on one curve gives a point on the other.',
    });
  },

  // ---- question figures: the descriptions say what is drawn and never give the answer ----
  'exponentials-logs-q-base': () => {
    const id = 'exponentials-logs-q-base';
    const p = sketch(id, { xmin: -2.6, xmax: 3.4, ymin: -1.5, ymax: 11, keys: 1, height: 520, width: 470 });
    key(p, [['curve', 'y = a^x']]);
    // The curve y = a^x with a = 3 (the page asks for a); it passes through the two marked points.
    draw(p, id, [{ cls: 'curve', fn: three }], [
      { x: 0, y: 1, on: 0, label: '(0, 1)', dx: -18, dy: -12, anchor: 'end' },
      { x: 2, y: 9, on: 0, label: '(2, 9)', dx: -18, dy: -8, anchor: 'end' },
    ]);
    return finish(p, {
      id,
      title: 'A curve y = a^x through the points (0, 1) and (2, 9)',
      desc: 'A solid curve that rises from near the x-axis on the left and climbs steeply on the right. It passes through two marked points, (0, 1) on the y-axis and (2, 9). The number a in the equation is not given.',
    });
  },

  'exponentials-logs-q-shift': () => {
    const id = 'exponentials-logs-q-shift';
    const p = sketch(id, { xmin: -2.6, xmax: 1.6, ymin: -3.2, ymax: 7, keys: 1, height: 520, width: 470 });
    key(p, [['curve', 'y = e^(2x) + c']]);
    // The curve y = e^(2x) + c with c = -2 (the page asks for c); it crosses the y-axis at (0, -1).
    draw(p, id, [{ cls: 'curve', fn: (x) => Math.exp(2 * x) - 2 }], [{ x: 0, y: -1, on: 0, label: '(0, -1)', dx: 20, dy: 34 }]);
    return finish(p, {
      id,
      title: 'A curve y = e^(2x) + c that crosses the y-axis at (0, -1)',
      desc: 'A solid curve that rises from left to right. On the left it flattens out towards a level below the x-axis. It crosses the y-axis at the marked point (0, minus 1) and then climbs steeply, crossing the x-axis on the way. The number c in the equation is not given.',
    });
  },
};
