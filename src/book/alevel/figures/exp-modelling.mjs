// Figures for the Exponential modelling topic page (src/pages/courses/a-level/exp-modelling.html).
// Every curve is drawn from the function listed in CURVES, so a picture cannot disagree with its equation.
// test/alevel-exp-modelling.spec.ts reads GEOM, CURVES and POINTS to check each path and each marked point.
// Axes have no scale numbers: the points that matter are labelled on the picture. A key at the top names each
// curve with a short sample of how it is drawn. A model only makes sense from t = 0, so curves start there, and
// the label of a point on the vertical axis sits to the LEFT of the axis, where no curve runs.
import { plane } from '../figure-lib.mjs';

const W = 600; // at 320px wide the page shows a figure about 273px wide: 27px text then comes out at 12.3px
const LEFT = 64;
const BOTTOM = 52;
const ROW = 46; // the height of one row of the key (the text with a superscript is about 36 tall)
const TIMES = '\u00d7'; // the multiplication sign, kept out of the source so the file stays plain ASCII

/** The picture's size and range, kept so the test can turn a pixel back into graph coordinates. */
export const GEOM = {};
/** The curves of each figure, in the order they are drawn: { cls, fn, from }. */
export const CURVES = {};
/** The marked points of each figure: { x, y, on } where `on` is the index of the curve the point lies on, or null. */
export const POINTS = {};

/** A plane with no grid and no scale numbers and a free vertical scale. `keys` is the number of key rows above the graph. */
function sketch(id, { xmin, xmax, ymin, ymax, keys = 2, height = 600, width = W, right = 48, xlabel = 't', ylabel = 'y' }) {
  const top = 36 + ROW * (keys - 1) + 62;
  GEOM[id] = { width, height, left: LEFT, right, top, bottom: BOTTOM, xmin, xmax, ymin, ymax };
  return plane({ grid: false, ticks: false, tickLabels: false, width, height, top, right, xmin, xmax, ymin, ymax, xlabel, ylabel });
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
  for (const { cls, fn, from, to } of curves) p.curve(fn, { cls, from, to });
  for (const { x, y, label, dx, dy, anchor } of points) p.point(x, y, { label, dx, dy, anchor });
}

/** Labels get a halo in the page colour, so a label that crosses an axis or a guide line stays readable. */
const HALO = 'paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round';
const finish = (p, meta) => p.svg(meta).replace(/<text class="svg-t([^>]*)>([\s\S]*?)<\/text>/g, (whole, attrs, body) => (body.includes('<tspan') ? whole : `<text style="${HALO}" class="svg-t${attrs}>${body}</text>`));

const exp = (x) => Math.exp(x);
const ln = Math.log;
const K_FIT = ln(3) / 4; // the curve through (0, 30) and (4, 90)

// The label of a point on the vertical axis: to the left of the axis, level with the point.
const onAxis = (y, label, on = 0) => ({ x: 0, y, on, label, dx: -16, dy: 8, anchor: 'end' });

export const FIGURES = {
  // ---- 1. growth and decay: the initial value is where both curves start ----
  'exp-modelling-growth-decay': () => {
    const id = 'exp-modelling-growth-decay';
    const p = sketch(id, { xmin: -1.4, xmax: 4.4, ymin: -50, ymax: 560, ylabel: 'N' });
    key(p, [['curve', `N = 100${TIMES}1.5^t`], ['curve-b', `N = 100${TIMES}0.6^t`]]);
    draw(p, id, [
      { cls: 'curve', fn: (t) => 100 * 1.5 ** t, from: 0 },
      { cls: 'curve-b', fn: (t) => 100 * 0.6 ** t, from: 0, to: 3 },
    ], [onAxis(100, '(0, 100)')]);
    return finish(p, {
      id,
      title: 'Growth N = 100 x 1.5^t and decay N = 100 x 0.6^t both start at (0, 100)',
      desc: 'Two curves that both start at the marked point (0, 100) on the vertical axis and run to the right. The solid curve, N equals 100 times 1.5 to the power t, rises more and more steeply. The dashed curve, N equals 100 times 0.6 to the power t, falls quickly at first and then flattens out, getting closer to the horizontal axis without reaching it.',
    });
  },

  // ---- 1. worked example: a car loses 15% of its value each year ----
  'exp-modelling-car': () => {
    const id = 'exp-modelling-car';
    const p = sketch(id, { xmin: -1.8, xmax: 8.6, ymin: -900, ymax: 13800, keys: 1, height: 560, ylabel: 'V' });
    key(p, [['curve', `V = 12000${TIMES}0.85^t`]]);
    draw(p, id, [{ cls: 'curve', fn: (t) => 12000 * 0.85 ** t, from: 0 }], [
      onAxis(12000, '(0, 12000)'),
      { x: 4, y: 12000 * 0.85 ** 4, on: 0, label: '(4, 6264)', dx: 18, dy: -14 },
    ]);
    return finish(p, {
      id,
      title: 'The value V = 12000 x 0.85^t of a car falls from 12000 and passes (4, 6264)',
      desc: 'A solid curve that starts at the marked point (0, 12000) on the vertical axis and falls to the right, steeply at first and then more gently. It passes the marked point (4, 6264), which is the value after 4 years.',
    });
  },

  // ---- 2. the model with e: k above 0 and k below 0 ----
  'exp-modelling-e': () => {
    const id = 'exp-modelling-e';
    const p = sketch(id, { xmin: -1.5, xmax: 6.4, ymin: -25, ymax: 330, ylabel: 'P' });
    key(p, [['curve', `P = 50e^(0.3t)`], ['curve-b', `P = 50e^(-0.3t)`]]);
    draw(p, id, [
      { cls: 'curve', fn: (t) => 50 * exp(0.3 * t), from: 0 },
      { cls: 'curve-b', fn: (t) => 50 * exp(-0.3 * t), from: 0 },
    ], [onAxis(50, '(0, 50)')]);
    return finish(p, {
      id,
      title: 'P = 50e^(0.3t) rises and P = 50e^(-0.3t) falls, both from (0, 50)',
      desc: 'Two curves that both start at the marked point (0, 50) on the vertical axis. The solid curve, P equals 50 e to the power 0.3t, has a positive number in the power and rises more and more steeply. The dashed curve, P equals 50 e to the power minus 0.3t, has a negative number in the power and falls towards the horizontal axis without reaching it.',
    });
  },

  // ---- 2. worked example: find A and k from two readings ----
  'exp-modelling-fit': () => {
    const id = 'exp-modelling-fit';
    const p = sketch(id, { xmin: -1.8, xmax: 8.6, ymin: -20, ymax: 290, keys: 1, height: 560, ylabel: 'P' });
    key(p, [['curve', 'P = Ae^(kt)']]);
    draw(p, id, [{ cls: 'curve', fn: (t) => 30 * exp(K_FIT * t), from: 0 }], [
      onAxis(30, '(0, 30)'),
      { x: 4, y: 90, on: 0, label: '(4, 90)', dx: -18, dy: -14, anchor: 'end' },
    ]);
    return finish(p, {
      id,
      title: 'A curve P = Ae^(kt) through the points (0, 30) and (4, 90)',
      desc: 'A solid curve that rises from left to right, more and more steeply. It passes through two marked points: (0, 30) on the vertical axis and (4, 90). The numbers A and k in its equation are not written on the picture.',
    });
  },

  // ---- 2. worked example: when does P reach 500? ----
  'exp-modelling-reach': () => {
    const id = 'exp-modelling-reach';
    const t0 = ln(500 / 30) / K_FIT;
    const p = sketch(id, { xmin: -1.6, xmax: 12.6, ymin: -50, ymax: 640, keys: 2, height: 600, ylabel: 'P' });
    key(p, [['curve', 'P = 30e^(kt)'], ['guide', 'P = 500']]);
    p.line(0, 500, 12.6, 500, { cls: 'guide' });
    p.line(t0, 0, t0, 500, { cls: 'guide' });
    draw(p, id, [{ cls: 'curve', fn: (t) => 30 * exp(K_FIT * t), from: 0 }], [
      { x: t0, y: 500, on: 0, label: '(10.2, 500)', dx: -18, dy: -14, anchor: 'end' },
    ]);
    p.text(t0, 0, 't = 10.2', { cls: 'alt', dy: 38 });
    return finish(p, {
      id,
      title: 'The curve P = 30e^(kt) reaches the line P = 500 where t is about 10.2',
      desc: 'A solid curve that rises from the vertical axis. A dashed horizontal line at P equals 500 cuts it at the marked point (10.2, 500). A dashed vertical line drops from that point to the horizontal axis, where it is labelled t equals 10.2.',
    });
  },

  // ---- 2. a limiting value: P = 20 + 80e^(-0.5t) ----
  'exp-modelling-limit': () => {
    const id = 'exp-modelling-limit';
    const p = sketch(id, { xmin: -2.2, xmax: 10.6, ymin: -14, ymax: 112, keys: 2, height: 580, ylabel: 'P' });
    key(p, [['curve', 'P = 20 + 80e^(-0.5t)'], ['guide', 'P = 20']]);
    p.line(0, 20, 10.6, 20, { cls: 'guide' });
    draw(p, id, [{ cls: 'curve', fn: (t) => 20 + 80 * exp(-0.5 * t), from: 0 }], [onAxis(100, '(0, 100)')]);
    p.text(10.5, 20, 'P gets close to 20', { cls: 'alt', anchor: 'end', dy: 40 });
    return finish(p, {
      id,
      title: 'The curve P = 20 + 80e^(-0.5t) falls from (0, 100) towards the line P = 20',
      desc: 'A solid curve that starts at the marked point (0, 100) on the vertical axis and falls to the right, steeply at first and then more gently. It gets closer and closer to a dashed horizontal line at P equals 20, which it never reaches. The line is labelled as the level that P gets close to.',
    });
  },

  // ---- 3. a power law y = 3x^2: the curve ----
  'exp-modelling-power': () => {
    const id = 'exp-modelling-power';
    const p = sketch(id, { xmin: -0.8, xmax: 4.6, ymin: -4, ymax: 52, keys: 1, height: 560, ylabel: 'y', xlabel: 'x' });
    key(p, [['curve', 'y = 3x^2']]);
    draw(p, id, [{ cls: 'curve', fn: (x) => 3 * x * x, from: 0 }], [
      { x: 1, y: 3, on: 0, label: '(1, 3)', dx: -18, dy: -16, anchor: 'end' },
      { x: 2, y: 12, on: 0, label: '(2, 12)', dx: -18, dy: -14, anchor: 'end' },
      { x: 4, y: 48, on: 0, label: '(4, 48)', dx: -18, dy: -14, anchor: 'end' },
    ]);
    return finish(p, {
      id,
      title: 'The curve y = 3x^2 passes through (1, 3), (2, 12) and (4, 48)',
      desc: 'A solid curve that starts at the origin and rises more and more steeply to the right. It passes through three marked points: (1, 3), (2, 12) and (4, 48).',
    });
  },

  // ---- 3. the same power law after taking logs of both sides: a straight line ----
  'exp-modelling-power-line': () => {
    const id = 'exp-modelling-power-line';
    const a = Math.log10(3);
    const p = sketch(id, { xmin: -0.5, xmax: 1.5, ymin: -0.3, ymax: 3.1, keys: 1, height: 600, right: 112, xlabel: 'log x', ylabel: 'log y' });
    key(p, [['curve', 'log y = 2 log x + 0.477']]);
    // the gradient triangle: along 0.5, up 1, so the gradient is 2
    p.line(0.3, 2 * 0.3 + a, 0.8, 2 * 0.3 + a, { cls: 'guide' });
    p.line(0.8, 2 * 0.3 + a, 0.8, 2 * 0.8 + a, { cls: 'guide' });
    draw(p, id, [{ cls: 'curve', fn: (X) => 2 * X + a, from: 0 }], [
      onAxis(a, '(0, 0.477)'),
      { x: 1, y: 2 + a, on: 0, label: '(1, 2.477)', dx: -18, dy: -14, anchor: 'end' },
    ]);
    p.text(0.62, 2 * 0.3 + a, 'along 0.5', { cls: 'alt', dy: 36 });
    p.text(0.8, 2 * 0.55 + a, 'up 1', { cls: 'alt', anchor: 'start', dx: 14, dy: 8 });
    return finish(p, {
      id,
      title: 'The straight line log y = 2 log x + 0.477 meets the vertical axis at (0, 0.477)',
      desc: 'A solid straight line that rises from the marked point (0, 0.477) on the vertical axis, passing through the marked point (1, 2.477). A small dashed triangle under the line shows its steepness: along 0.5 and up 1, so the gradient is 2.',
    });
  },

  // ---- 3. question figure: a line of ln y against ln x ----
  'exp-modelling-q-loglog': () => {
    const id = 'exp-modelling-q-loglog';
    const p = sketch(id, { xmin: -1.6, xmax: 3.4, ymin: -0.4, ymax: 6.2, keys: 1, height: 520, width: 470, right: 100, xlabel: 'ln x', ylabel: 'ln y' });
    key(p, [['curve', 'ln y against ln x']]);
    // The line is ln y = 1.5 ln x + 1.5 (the page asks for n and a); it passes through the two marked points.
    draw(p, id, [{ cls: 'curve', fn: (X) => 1.5 * X + 1.5, from: 0 }], [
      onAxis(1.5, '(0, 1.5)'),
      { x: 2, y: 4.5, on: 0, label: '(2, 4.5)', dx: 18, dy: 38 },
    ]);
    return finish(p, {
      id,
      title: 'A straight line of ln y against ln x through (0, 1.5) and (2, 4.5)',
      desc: 'A solid straight line that rises from left to right. It passes through two marked points: (0, 1.5) on the vertical axis and (2, 4.5). The numbers n and a in the model are not given.',
    });
  },

  // ---- 4. y = 2 x 3^x after taking logs of y only: a straight line ----
  'exp-modelling-semilog': () => {
    const id = 'exp-modelling-semilog';
    const k = Math.log10(2);
    const b = Math.log10(3);
    const p = sketch(id, { xmin: -1.4, xmax: 4.6, ymin: -0.2, ymax: 2.6, keys: 1, height: 560, right: 48, xlabel: 'x', ylabel: 'log y' });
    key(p, [['curve', 'log y = 0.477x + 0.301']]);
    draw(p, id, [{ cls: 'curve', fn: (x) => b * x + k, from: 0 }], [
      onAxis(k, '(0, 0.301)'),
      { x: 2, y: 2 * b + k, on: 0, label: '(2, 1.255)', dx: 18, dy: 40 },
    ]);
    return finish(p, {
      id,
      title: 'The straight line log y = 0.477x + 0.301 meets the vertical axis at (0, 0.301)',
      desc: 'A solid straight line that rises from the marked point (0, 0.301) on the vertical axis and passes through the marked point (2, 1.255). The horizontal axis shows x itself and the vertical axis shows log y.',
    });
  },

  // ---- 4. worked example: read A and k from a graph of ln y against t ----
  'exp-modelling-semilog-read': () => {
    const id = 'exp-modelling-semilog-read';
    const p = sketch(id, { xmin: -1.8, xmax: 6.6, ymin: -0.4, ymax: 4.4, keys: 1, height: 560, xlabel: 't', ylabel: 'ln y' });
    key(p, [['curve', 'ln y against t']]);
    draw(p, id, [{ cls: 'curve', fn: (t) => 0.3 * t + 2, from: 0 }], [
      onAxis(2, '(0, 2)'),
      { x: 5, y: 3.5, on: 0, label: '(5, 3.5)', dx: 18, dy: 40 },
    ]);
    return finish(p, {
      id,
      title: 'A straight line of ln y against t through (0, 2) and (5, 3.5)',
      desc: 'A solid straight line that rises from left to right. It passes through two marked points: (0, 2) on the vertical axis and (5, 3.5). The horizontal axis shows t and the vertical axis shows ln y.',
    });
  },

  // ---- 4. question figure: a line of log y against x ----
  'exp-modelling-q-semilog': () => {
    const id = 'exp-modelling-q-semilog';
    const p = sketch(id, { xmin: -1.6, xmax: 5.4, ymin: -0.3, ymax: 3.6, keys: 1, height: 520, width: 470, right: 48, xlabel: 'x', ylabel: 'log y' });
    key(p, [['curve', 'log y against x']]);
    // The line is log y = 0.4x + 1.2 (the page asks for b and k); it passes through the two marked points.
    draw(p, id, [{ cls: 'curve', fn: (x) => 0.4 * x + 1.2, from: 0 }], [
      onAxis(1.2, '(0, 1.2)'),
      { x: 4, y: 2.8, on: 0, label: '(4, 2.8)', dx: 18, dy: 40 },
    ]);
    return finish(p, {
      id,
      title: 'A straight line of log y against x through (0, 1.2) and (4, 2.8)',
      desc: 'A solid straight line that rises from left to right. It passes through two marked points: (0, 1.2) on the vertical axis and (4, 2.8). The numbers b and k in the model are not given.',
    });
  },

  // ---- 5. the gradient of y = e^(0.5x) at x = 2 ----
  'exp-modelling-tangent': () => {
    const id = 'exp-modelling-tangent';
    const p = sketch(id, { xmin: -1.2, xmax: 5.2, ymin: -1.2, ymax: 13, keys: 2, height: 600, xlabel: 'x', ylabel: 'y' });
    key(p, [['curve', 'y = e^(0.5x)'], ['tangent', 'the tangent at x = 2']]);
    const m = 0.5 * exp(1);
    p.line(0.2, exp(1) + m * (0.2 - 2), 4.6, exp(1) + m * (4.6 - 2), { cls: 'tangent' });
    draw(p, id, [{ cls: 'curve', fn: (x) => exp(0.5 * x), from: 0 }], [
      { x: 2, y: exp(1), on: 0, label: '(2, 2.72)', dx: -18, dy: -16, anchor: 'end' },
    ]);
    p.text(3.6, exp(1) + m * 1.6, 'gradient 1.36', { cls: 'alt', anchor: 'start', dy: 50 });
    return finish(p, {
      id,
      title: 'The tangent to y = e^(0.5x) at (2, 2.72) has gradient 1.36',
      desc: 'A solid curve, y equals e to the power 0.5x, rising more and more steeply to the right. A straight tangent line touches it at the marked point (2, 2.72) and stays below the curve. The tangent is labelled with its gradient, 1.36, which is half of the height 2.72.',
    });
  },

  // ---- 5. question figure: a curve with a tangent of gradient 6 at (0, 2) ----
  'exp-modelling-q-gradient': () => {
    const id = 'exp-modelling-q-gradient';
    const p = sketch(id, { xmin: -1.4, xmax: 1.6, ymin: -1.2, ymax: 12, keys: 2, height: 520, width: 470, xlabel: 'x', ylabel: 'y' });
    key(p, [['curve', 'y = Ae^(kx)'], ['tangent', 'the tangent at (0, 2)']]);
    // The curve is y = 2e^(3x) (the page asks for k); its tangent at (0, 2) has gradient 6, which the question states.
    p.line(0, 2, 1.6, 2 + 6 * 1.6, { cls: 'tangent' });
    draw(p, id, [{ cls: 'curve', fn: (x) => 2 * exp(3 * x), from: 0 }], [onAxis(2, '(0, 2)')]);
    return finish(p, {
      id,
      title: 'A curve y = Ae^(kx) through (0, 2) with a tangent drawn there',
      desc: 'A solid curve that rises from the marked point (0, 2) on the vertical axis, more and more steeply to the right. A straight tangent line touches the curve at that point and stays below it. The numbers A and k in the equation are not given.',
    });
  },

  // ---- 6. cooling: the model that falls to 0 and the model that falls to room temperature ----
  'exp-modelling-cooling': () => {
    const id = 'exp-modelling-cooling';
    const p = sketch(id, { xmin: -4.2, xmax: 31, ymin: -6, ymax: 90, keys: 3, height: 620, ylabel: 'T' });
    key(p, [['curve', 'T = 20 + 60e^(-0.1t)'], ['curve-b', 'T = 80e^(-0.1t)'], ['guide', 'T = 20 (room)']]);
    p.line(0, 20, 31, 20, { cls: 'guide' });
    draw(p, id, [
      { cls: 'curve', fn: (t) => 20 + 60 * exp(-0.1 * t), from: 0 },
      { cls: 'curve-b', fn: (t) => 80 * exp(-0.1 * t), from: 0 },
    ], [
      onAxis(80, '(0, 80)'),
      { x: 10, y: 42, label: '(10, 42)', dx: 20, dy: -14 },
    ]);
    return finish(p, {
      id,
      title: 'Two models of a cooling drink, one falling towards 0 and one towards 20',
      desc: 'Two curves that both start at the marked point (0, 80) on the vertical axis and fall to the right. The dashed curve, T equals 80 e to the power minus 0.1t, keeps falling towards the horizontal axis. The solid curve, T equals 20 plus 60 e to the power minus 0.1t, levels off close to a dashed horizontal line at T equals 20. A marked point (10, 42) lies on the solid curve.',
    });
  },

  // ---- flip it: from a straight line of ln y against t back to the model ----
  'exp-modelling-flip': () => {
    const id = 'exp-modelling-flip';
    const p = sketch(id, { xmin: -1.8, xmax: 6.6, ymin: -0.3, ymax: 4.4, keys: 1, height: 560, xlabel: 't', ylabel: 'ln y' });
    key(p, [['curve', 'ln y = 0.5t + 1.4']]);
    draw(p, id, [{ cls: 'curve', fn: (t) => 0.5 * t + 1.4, from: 0 }], [
      onAxis(1.4, '(0, 1.4)'),
      { x: 4, y: 3.4, on: 0, label: '(4, 3.4)', dx: 18, dy: 40 },
    ]);
    return finish(p, {
      id,
      title: 'The straight line ln y = 0.5t + 1.4 passes through (0, 1.4) and (4, 3.4)',
      desc: 'A solid straight line that rises from the marked point (0, 1.4) on the vertical axis and passes through the marked point (4, 3.4). The horizontal axis shows t and the vertical axis shows ln y.',
    });
  },
};
