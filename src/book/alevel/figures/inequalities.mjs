// Figures for the Inequalities topic page (src/pages/courses/a-level/inequalities.html).
// Number lines come from numberLine(); every curve and line is drawn from its equation, and every shaded region
// is built from the same equation, so a picture cannot disagree with its inequality.
// Shading is HATCHED (diagonal lines on a light tint), so it shows without colour as well as with it. A boundary
// that is NOT included is dashed (curve-b); a boundary that IS included is solid (curve).
// Graphs have no scale numbers: the points that matter are labelled on the picture itself.
import { plane, numberLine, label } from '../figure-lib.mjs';

const LE = String.fromCharCode(0x2264); // the signs for "less than or equal to" and "greater than or equal to",
const GE = String.fromCharCode(0x2265); // kept out of the source so the file stays plain ASCII

// ---------- number lines ----------

/** A number line with an optional line of text under it (centred). Question figures leave `band` out so the picture gives nothing away. */
function nl({ band, ...opts }) {
  const height = band ? 176 : 150;
  const svg = numberLine({ height, ...opts });
  return band ? svg.replace('</svg>', `<text class="svg-t alt" x="360" y="${height - 12}" text-anchor="middle">${label(band)}</text></svg>`) : svg;
}

// ---------- graphs ----------

const W = 640;
const H = 600;
const LEFT = 64;
const RIGHT = 48;
const BOTTOM = 52;

/** A plane with no grid and no scale numbers and the SAME scale on both axes (used for lines). */
function eq({ xmin, xmax, ymid, top = 96, height = H, ...rest }) {
  const w = W - LEFT - RIGHT;
  const h = height - top - BOTTOM;
  const yr = ((xmax - xmin) * h) / w;
  return plane({ grid: false, ticks: false, tickLabels: false, width: W, height, top, xmin, xmax, ymin: ymid - yr / 2, ymax: ymid + yr / 2, ...rest });
}

/** A plane with no grid and no scale numbers, with a band above it for the inequality (used for curves). */
const sketch = (opts) => plane({ grid: false, ticks: false, tickLabels: false, top: 96, height: 500, ...opts });

/** The inequality (left) and a note (right) in the band above the graph. */
function band(p, width, left, right = '') {
  p.note(LEFT, 50, left, { cls: 'alt' });
  if (right) p.note(width - RIGHT, 50, right, { anchor: 'end' });
}

/** Labels get a halo in the page colour, so a label that crosses an axis or a line stays readable. */
const finish = (p, meta) => p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');

/** Cut a polygon (graph coordinates) down to the picture, edge by edge (Sutherland-Hodgman). */
function clip(poly, xmin, xmax, ymin, ymax) {
  const edges = [
    [(q) => q[0] >= xmin, (a, b) => [xmin, a[1] + ((b[1] - a[1]) * (xmin - a[0])) / (b[0] - a[0])]],
    [(q) => q[0] <= xmax, (a, b) => [xmax, a[1] + ((b[1] - a[1]) * (xmax - a[0])) / (b[0] - a[0])]],
    [(q) => q[1] >= ymin, (a, b) => [a[0] + ((b[0] - a[0]) * (ymin - a[1])) / (b[1] - a[1]), ymin]],
    [(q) => q[1] <= ymax, (a, b) => [a[0] + ((b[0] - a[0]) * (ymax - a[1])) / (b[1] - a[1]), ymax]],
  ];
  let out = poly;
  for (const [inside, cut] of edges) {
    const next = [];
    out.forEach((cur, i) => {
      const prev = out[(i + out.length - 1) % out.length];
      if (inside(cur)) { if (!inside(prev)) next.push(cut(prev, cur)); next.push(cur); } else if (inside(prev)) next.push(cut(prev, cur));
    });
    out = next;
    if (!out.length) break;
  }
  return out;
}

/** Shade a region: a light tint with diagonal hatching on top, so it still shows without colour. `id` names the hatch pattern. */
function region(p, id, pts) {
  p.defs(`<pattern id="${id}-rh" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="14" style="stroke:var(--strand,#2a4d7f);stroke-width:3;stroke-opacity:.7"/></pattern>`);
  const shape = clip(pts, p.xmin, p.xmax, p.ymin, p.ymax).map(([x, y]) => `${p.X(x).toFixed(1)},${p.Y(y).toFixed(1)}`).join(' ');
  p.raw(`<polygon points="${shape}" style="fill:var(--tint,#e4eefb);fill-opacity:.8;stroke:none"/>`);
  p.raw(`<polygon points="${shape}" fill="url(#${id}-rh)" style="stroke:none"/>`);
}

const sample = (from, to, n = 200) => Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);

/** The part of the picture above (or below) the graph of y = fn(x). */
const above = (p, fn) => [...sample(p.xmin, p.xmax).map((x) => [x, fn(x)]), [p.xmax, p.ymax + 50], [p.xmin, p.ymax + 50]];
const below = (p, fn) => [...sample(p.xmin, p.xmax).map((x) => [x, fn(x)]), [p.xmax, p.ymin - 50], [p.xmin, p.ymin - 50]];

const parab = (a, b, c) => (x) => a * x * x + b * x + c;

/** A quadratic y = (x - r1)(x - r2) with the stretch of the x-axis where it is below the axis (inside = true) or above it (outside). */
function quadGraph({ id, r1, r2, a = 1, xmin, xmax, ymin, ymax, text, sign, between, title, desc, lab = {} }) {
  const fn = (x) => a * (x - r1) * (x - r2);
  const p = sketch({ xmin, xmax, ymin, ymax });
  band(p, 720, text);
  if (between) region(p, id, [...sample(r1, r2).map((x) => [x, fn(x)]), [r2, 0], [r1, 0]]);
  else {
    region(p, `${id}-l`, [...sample(xmin, r1).map((x) => [x, fn(x)]), [r1, 0], [xmin, 0]]);
    region(p, `${id}-r`, [...sample(r2, xmax).map((x) => [x, fn(x)]), [xmax, 0], [r2, 0]]);
  }
  p.curve(fn);
  if (between) p.line(r1, 0, r2, 0, { cls: 'curve' });
  else { p.line(xmin, 0, r1, 0, { cls: 'curve' }); p.line(r2, 0, xmax, 0, { cls: 'curve' }); }
  p.point(r1, 0, { open: sign === '<' || sign === '>', label: `x = ${r1}`, dx: -16, dy: 40, anchor: 'end' });
  p.point(r2, 0, { open: sign === '<' || sign === '>', label: `x = ${r2}`, dx: 16, dy: 40, anchor: 'start' });
  for (const [x, y, t] of lab.texts ?? []) p.text(x, y, t, { cls: 'alt' });
  return finish(p, { id, title, desc });
}

/** The quadratic drawn by 'inequalities-no-roots': y = a x^2 + b x + c with k = -2 in x^2 + kx + 9. A test checks the page text against it. */
export const NO_ROOTS = { a: 1, b: -2, c: 9 };

export const FIGURES = {
  // ---- number lines ----
  'inequalities-nl-open': () => nl({
    min: -3, max: 7, band: 'x < 3', ranges: [{ from: -3, to: 3 }], marks: [{ at: 3, open: true, label: 'not included' }],
    id: 'inequalities-nl-open',
    title: 'The inequality x < 3 on a number line',
    desc: 'A number line from negative 3 to 7. An open circle at 3 shows that 3 is not included. A thick line runs from the circle to the left, because every number below 3 is a solution.',
  }),

  'inequalities-nl-and': () => nl({
    min: -3, max: 7, band: `-1 ${LE} x < 4`, ranges: [{ from: -1, to: 4 }],
    marks: [{ at: -1, label: 'included' }, { at: 4, open: true, label: 'not included' }],
    id: 'inequalities-nl-and',
    title: 'The numbers from -1 up to but not including 4',
    desc: 'A number line from negative 3 to 7. A filled circle at negative 1 shows it is included. An open circle at 4 shows it is not included. A thick line joins the two circles.',
  }),

  'inequalities-nl-or': () => nl({
    min: -6, max: 6, band: `x < -2  or  x ${GE} 3`, ranges: [{ from: -6, to: -2 }, { from: 3, to: 6 }],
    marks: [{ at: -2, open: true, label: 'not included' }, { at: 3, label: 'included' }],
    id: 'inequalities-nl-or',
    title: 'Two separate pieces of the number line',
    desc: 'A number line from negative 6 to 6. An open circle at negative 2 has a thick line going left. A filled circle at 3 has a thick line going right. The numbers between negative 2 and 3 are not shaded.',
  }),

  'inequalities-nl-closed': () => nl({
    min: -3, max: 7, band: `x ${LE} 3`, ranges: [{ from: -3, to: 3 }], marks: [{ at: 3, label: 'included' }],
    id: 'inequalities-nl-closed',
    title: 'The inequality x is less than or equal to 3 on a number line',
    desc: 'A number line from negative 3 to 7. A filled circle at 3 shows that 3 is included. A thick line runs from the circle to the left, because every number below 3 is a solution too.',
  }),

  'inequalities-nl-pair': () => nl({
    min: -2, max: 8, band: `2 < x ${LE} 5`, ranges: [{ from: 2, to: 5 }],
    marks: [{ at: 2, open: true, label: 'not included' }, { at: 5, label: 'included' }],
    id: 'inequalities-nl-pair',
    title: 'The numbers above 2 up to and including 5',
    desc: 'A number line from negative 2 to 8. An open circle at 2 shows it is not included. A filled circle at 5 shows it is included. A thick line joins the two circles.',
  }),

  // ---- quadratic inequalities ----
  'inequalities-quad-between': () => quadGraph({
    id: 'inequalities-quad-between', r1: -2, r2: 3, xmin: -4, xmax: 5, ymin: -8, ymax: 6, sign: '<', between: true,
    text: 'x^2 - x - 6 < 0', lab: { texts: [[0.5, -3.4, 'below the axis']] },
    title: 'Where the graph of y = x squared minus x minus 6 is below the x-axis',
    desc: 'An upward-opening parabola that crosses the x-axis at x = -2 and x = 3, shown by open circles. The region between the curve and the x-axis is hatched for x between -2 and 3, and the x-axis there is drawn thick. The curve is below the axis only between the two roots.',
  }),

  'inequalities-quad-outside': () => quadGraph({
    id: 'inequalities-quad-outside', r1: -1, r2: 5, xmin: -4, xmax: 8, ymin: -10, ymax: 9, sign: '>', between: false,
    text: 'x^2 - 4x - 5 > 0', lab: { texts: [[-2.7, 2.6, 'y > 0'], [6.7, 2.6, 'y > 0']] },
    title: 'Where the graph of y = x squared minus 4x minus 5 is above the x-axis',
    desc: 'An upward-opening parabola that crosses the x-axis at x = -1 and x = 5, shown by open circles. The regions between the curve and the x-axis are hatched to the left of -1 and to the right of 5, and the x-axis there is drawn thick. The curve is above the axis outside the two roots.',
  }),

  'inequalities-quad-closed': () => quadGraph({
    id: 'inequalities-quad-closed', r1: -4, r2: 2, xmin: -7, xmax: 5, ymin: -11, ymax: 9, sign: '>=', between: false,
    text: `x^2 + 2x - 8 ${GE} 0`, lab: { texts: [[-5.4, 2.6, `y ${GE} 0`], [3.7, 2.6, `y ${GE} 0`]] },
    title: 'Where the graph of y = x squared plus 2x minus 8 is on or above the x-axis',
    desc: 'An upward-opening parabola that crosses the x-axis at x = -4 and x = 2, shown by filled circles. The regions between the curve and the x-axis are hatched to the left of -4 and to the right of 2, and the x-axis there is drawn thick. The curve is on or above the axis outside the two roots, including the roots themselves.',
  }),

  'inequalities-quad-down': () => quadGraph({
    id: 'inequalities-quad-down', r1: -4, r2: 3, a: -1, xmin: -7, xmax: 6, ymin: -8, ymax: 15, sign: '>', between: true,
    text: '12 - x - x^2 > 0', lab: { texts: [[-0.5, 6, 'above the axis']] },
    title: 'Where the graph of y = 12 - x - x squared is above the x-axis',
    desc: 'A downward-opening parabola with its highest point at about (-0.5, 12.25). It crosses the x-axis at x = -4 and x = 3, shown by open circles. The region between the curve and the x-axis is hatched for x between -4 and 3, and the x-axis there is drawn thick. The curve is above the axis only between the two roots.',
  }),

  'inequalities-no-roots': () => {
    const { a, b, c } = NO_ROOTS;
    const disc = b * b - 4 * a * c; // the number printed on the picture is worked out here, so it cannot be wrong
    const vx = -b / (2 * a);
    const vy = c - (b * b) / (4 * a);
    const p = sketch({ xmin: -3, xmax: 5, ymin: -3, ymax: 15 });
    band(p, 720, `y = x^2 - 2x + ${c}`, `discriminant = ${disc}`);
    p.curve(parab(a, b, c));
    p.point(vx, vy, { label: `(${vx}, ${vy})`, dx: 0, dy: -24, anchor: 'middle' });
    p.text(1, 2.5, 'never meets the x-axis', { cls: 'alt', anchor: 'middle' });
    return finish(p, {
      id: 'inequalities-no-roots',
      title: 'The graph of y = x squared minus 2x plus 9',
      desc: `An upward-opening parabola with its lowest point at (${vx}, ${vy}). The whole curve is above the x-axis and never touches it, so the quadratic has no real roots. Its discriminant is negative ${-disc}.`,
    });
  },

  'inequalities-flip-quad': () => quadGraph({
    id: 'inequalities-flip-quad', r1: 1, r2: 4, xmin: -2, xmax: 7, ymin: -4, ymax: 8, sign: '<', between: true,
    text: '(x - 1)(x - 4) < 0', lab: { texts: [[2.5, -1.8, 'below the axis']] },
    title: 'The graph of y = (x - 1)(x - 4), below the x-axis between 1 and 4',
    desc: 'An upward-opening parabola that crosses the x-axis at x = 1 and x = 4, shown by open circles. The region between the curve and the x-axis is hatched for x between 1 and 4. The curve is below the axis only between the two roots.',
  }),

  // ---- the discriminant and a line ----
  'inequalities-line-parabola': () => {
    const p = sketch({ xmin: -3, xmax: 5, ymin: -7, ymax: 11 });
    band(p, 720, 'y = x^2 and y = 2x + k', 'x^2 - 2x - k = 0');
    p.curve((x) => x * x);
    p.straight(2, 3, { cls: 'curve-b' });
    p.straight(2, -1, { cls: 'curve' });
    p.straight(2, -5, { cls: 'curve-c' });
    p.point(1, 1, { label: 'touches', dx: -16, dy: -22, anchor: 'end' });
    p.text(-1.3, 8.2, 'crosses twice', { cls: 'alt', anchor: 'middle' });
    p.text(2.2, -3.2, 'misses', { cls: 'alt', anchor: 'middle' });
    p.note(64, 484, 'dashed: k = 3   solid: k = -1   dotted: k = -5', { cls: 'small' });
    return finish(p, {
      id: 'inequalities-line-parabola',
      title: 'The parabola y = x squared and three parallel lines y = 2x + k',
      desc: 'The parabola y = x squared and three parallel lines with gradient 2. The dashed line, with k = 3, crosses the parabola at two points. The solid line, with k = -1, touches the parabola at one point, (1, 1). The dotted line, with k = -5, is below the parabola and does not meet it.',
    });
  },

  // ---- regions ----
  'inequalities-region-dashed': () => {
    const p = eq({ xmin: -4, xmax: 6, ymid: 2.2 });
    band(p, W, 'y > 2x - 1', 'dashed: not included');
    region(p, 'inequalities-region-dashed', above(p, (x) => 2 * x - 1));
    p.straight(2, -1, { cls: 'curve-b' });
    p.point(1, 1, { open: true, label: '(1, 1) not in', dx: 16, dy: 36 });
    p.point(0, 0, { label: '(0, 0) is in', dx: -16, dy: -14, anchor: 'end' });
    return finish(p, {
      id: 'inequalities-region-dashed',
      title: 'The region y > 2x - 1',
      desc: 'A dashed line y = 2x - 1 rising to the right. The region above it is hatched. The point (0, 0) is above the line, so it is in the region. The point (1, 1) is on the dashed line, so it is not in the region and is drawn as an open circle.',
    });
  },

  'inequalities-region-solid': () => {
    const p = eq({ xmin: -5, xmax: 5, ymid: 1.3 });
    band(p, W, 'y ' + LE + ' 4 - x^2', 'solid: included');
    region(p, 'inequalities-region-solid', below(p, (x) => 4 - x * x));
    p.curve((x) => 4 - x * x);
    p.point(0, 4, { label: '(0, 4) is in', dx: 18, dy: -16 });
    p.text(0, -1, 'in the region', { cls: 'alt' });
    return finish(p, {
      id: 'inequalities-region-solid',
      title: 'The region y is less than or equal to 4 - x squared',
      desc: 'A solid downward-opening parabola with its highest point at (0, 4). The region on and below the curve is hatched. The point (0, 4) is on the solid curve, so it is in the region.',
    });
  },

  'inequalities-region-two': () => {
    const p = eq({ xmin: -4, xmax: 6, ymid: 2.2 });
    band(p, W, 'three inequalities at once');
    region(p, 'inequalities-region-two', [[0, 0], [2, 2], [0, 4]]);
    p.line(0, p.ymin, 0, p.ymax, { cls: 'curve' });
    p.straight(-1, 4, { cls: 'curve' });
    p.straight(1, 0, { cls: 'curve-b' });
    p.text(-0.3, 2.2, 'x ' + GE + ' 0', { cls: 'alt', anchor: 'end' });
    p.text(4.5, -0.9, 'x + y ' + LE + ' 4', { cls: 'alt', anchor: 'end' });
    p.text(4.6, 5.0, 'y > x', { cls: 'alt', anchor: 'middle', dx: -30 });
    return finish(p, {
      id: 'inequalities-region-two',
      title: 'The region where x is at least 0, x + y is at most 4 and y is more than x',
      desc: 'A triangle with corners at (0, 0), (0, 4) and (2, 2), hatched. Its left edge is the y-axis, drawn solid, for x at least 0. Its upper right edge is the solid line x + y = 4. Its lower right edge is the dashed line y = x, so points on that edge are not included.',
    });
  },

  'inequalities-flip-region': () => {
    const p = eq({ xmin: -3, xmax: 7, ymid: 1.2 });
    band(p, W, 'dashed line, hatched below');
    region(p, 'inequalities-flip-region', below(p, (x) => x / 2 + 1));
    p.straight(0.5, 1, { cls: 'curve-b' });
    p.point(0, 1, { label: '(0, 1)', dx: -16, dy: -14, anchor: 'end' });
    p.point(4, 3, { label: '(4, 3)', dx: 14, dy: -16, anchor: 'end' });
    p.point(2, -0.5, { label: 'test point (2, -0.5)', dx: 18, dy: 34 });
    return finish(p, {
      id: 'inequalities-flip-region',
      title: 'A dashed line through (0, 1) and (4, 3) with the region below it hatched',
      desc: 'A dashed line rising to the right through the points (0, 1) and (4, 3). The region below the line is hatched. A test point (2, -0.5) is marked inside the hatched region.',
    });
  },

  // ---- question figures (they show the picture, and never state the answer) ----
  'inequalities-q-nl-ray': () => nl({
    min: -4, max: 4, ranges: [{ from: -1, to: 4 }], marks: [{ at: -1 }],
    id: 'inequalities-q-nl-ray',
    title: 'A filled circle with a thick line going right',
    desc: 'A number line from negative 4 to 4. A filled circle at negative 1, with a thick line from the circle to the right.',
  }),

  'inequalities-q-nl-interval': () => nl({
    min: -5, max: 5, ranges: [{ from: -3, to: 2 }], marks: [{ at: -3, open: true }, { at: 2 }],
    id: 'inequalities-q-nl-interval',
    title: 'An open circle and a filled circle joined by a thick line',
    desc: 'A number line from negative 5 to 5. An open circle at negative 3 and a filled circle at 2, joined by a thick line.',
  }),

  'inequalities-q-nl-or': () => nl({
    min: -6, max: 6, ranges: [{ from: -6, to: -1 }, { from: 4, to: 6 }], marks: [{ at: -1, open: true }, { at: 4 }],
    id: 'inequalities-q-nl-or',
    title: 'Two thick pieces of the number line',
    desc: 'A number line from negative 6 to 6. An open circle at negative 1 with a thick line going left. A filled circle at 4 with a thick line going right. Nothing is shaded between them.',
  }),

  'inequalities-q-quad': () => {
    const p = sketch({ xmin: -3, xmax: 5, ymin: -6, ymax: 8 });
    band(p, 720, 'y = x^2 - 2x - 3');
    p.curve(parab(1, -2, -3));
    p.point(-1, 0, { label: '(-1, 0)', dx: -16, dy: -16, anchor: 'end' });
    p.point(3, 0, { label: '(3, 0)', dx: 16, dy: -16 });
    return finish(p, {
      id: 'inequalities-q-quad',
      title: 'The graph of y = x squared minus 2x minus 3',
      desc: 'An upward-opening parabola that crosses the x-axis at (-1, 0) and (3, 0). Its lowest point is between those two points, below the axis.',
    });
  },

  'inequalities-q-region-solid': () => {
    const p = eq({ xmin: -3, xmax: 7, ymid: 1.5 });
    region(p, 'inequalities-q-region-solid', below(p, (x) => 3 - x));
    p.straight(-1, 3, { cls: 'curve' });
    p.point(0, 3, { label: '(0, 3)', dx: 16, dy: -16 });
    p.point(3, 0, { label: '(3, 0)', dx: 16, dy: -16 });
    return finish(p, {
      id: 'inequalities-q-region-solid',
      title: 'A solid line through (0, 3) and (3, 0) with the region below it hatched',
      desc: 'A solid line falling to the right through the points (0, 3) and (3, 0). The region below the line is hatched.',
    });
  },

  'inequalities-q-region-dashed': () => {
    const p = eq({ xmin: -3, xmax: 7, ymid: 1.5 });
    region(p, 'inequalities-q-region-dashed', above(p, (x) => x - 2));
    p.straight(1, -2, { cls: 'curve-b' });
    p.point(0, -2, { label: '(0, -2)', dx: 16, dy: 34 });
    p.point(2, 0, { label: '(2, 0)', dx: -16, dy: -16, anchor: 'end' });
    return finish(p, {
      id: 'inequalities-q-region-dashed',
      title: 'A dashed line through (0, -2) and (2, 0) with the region above it hatched',
      desc: 'A dashed line rising to the right through the points (0, -2) and (2, 0). The region above the line is hatched.',
    });
  },

  'inequalities-q-points': () => {
    const p = eq({ xmin: -3, xmax: 7, ymid: 2.2 });
    region(p, 'inequalities-q-points', [[3, 2], [-3, -4], [-3, 8]]);
    p.straight(1, -1, { cls: 'curve-b' });
    p.straight(-1, 5, { cls: 'curve' });
    p.point(2, 1, { label: 'A', dx: 16, dy: 30 });
    p.point(1, 3, { label: 'B', dx: -16, dy: -14, anchor: 'end' });
    p.point(0, 5, { label: 'C', dx: -16, dy: -14, anchor: 'end' });
    p.point(3, 3, { label: 'D', dx: 16, dy: -14 });
    return finish(p, {
      id: 'inequalities-q-points',
      title: 'A hatched region with four marked points',
      desc: 'Two lines meet at (3, 2). One is dashed and rises to the right. The other is solid and falls to the right. The wedge between them, on the left of where they meet, is hatched. Four points are marked A to D.',
    });
  },
};
