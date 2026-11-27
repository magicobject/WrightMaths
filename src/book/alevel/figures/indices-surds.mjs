// Figures for the Indices and surds topic page (src/pages/courses/a-level/indices-surds.html).
// Every graph is drawn from the function that defines it. Axes have no scale numbers: the points that matter
// are labelled with their coordinates on the picture itself, and the equation sits in a band above the graph.
import { plane, numberLine } from '../figure-lib.mjs';

const R = String.fromCharCode(0x221a); // the root sign, kept out of the source so the file stays plain ASCII
const TIMES = String.fromCharCode(0xd7);
const MINUS = String.fromCharCode(0x2212);
const DIV = String.fromCharCode(0xf7);

/** A plane with no grid and no scale numbers. It leaves a band above the graph for the equation. */
const sketch = (opts) => plane({ grid: false, ticks: false, tickLabels: false, top: 96, height: 500, ...opts });

/** A picture drawn in pixels only (no axes). */
const canvas = (height) => plane({ grid: false, axes: false, ticks: false, tickLabels: false, top: 40, height });

/** The equation (left) and a note (right) in the band above the graph. */
function band(p, left, right = '') {
  p.note(64, 50, left, { cls: 'alt' });
  if (right) p.note(672, 50, right, { anchor: 'end' });
}

/** Labels get a halo in the page colour, so a label that crosses an axis or a guide line stays readable. */
const finish = (p, meta) => p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');

/** A box with a fill and a dark outline, in pixels. */
const rect = (p, x, y, w, h, extra = '') => p.raw(`<rect class="shade" x="${x}" y="${y}" width="${w}" height="${h}" style="stroke:var(--ink);stroke-width:3${extra}"/>`);

export const FIGURES = {
  // ---- laws of indices: the ladder of powers of 2 ----
  'indices-surds-ladder': () => {
    const p = canvas(400);
    const items = [['2^3', '8'], ['2^2', '4'], ['2^1', '2'], ['2^0', '1'], ['2^(-1)', '1/2'], ['2^(-2)', '1/4']];
    const w = 96;
    const gap = 20;
    const x0 = 22;
    const y0 = 90;
    items.forEach(([power, value], i) => {
      const x = x0 + i * (w + gap);
      rect(p, x, y0, w, 140, i === 3 || i === 4 ? ';fill:#fff4c9' : '');
      p.note(x + w / 2, y0 + 56, power, { anchor: 'middle' });
      p.note(x + w / 2, y0 + 112, value, { anchor: 'middle', cls: 'alt' });
    });
    p.note(360, 60, 'Powers of 2, one step at a time', { anchor: 'middle' });
    p.raw('<line class="line" x1="60" y1="290" x2="650" y2="290"/>');
    p.raw('<polygon class="arrowhead" points="668,290 650,281 650,299"/>');
    p.note(360, 340, `Each step to the right: ${DIV} 2`, { anchor: 'middle', cls: 'alt' });
    p.note(360, 380, 'So 2^0 = 1 and 2^(-1) = 1/2', { anchor: 'middle' });
    return finish(p, {
      id: 'indices-surds-ladder',
      title: 'Powers of 2 from 2 cubed down to 2 to the minus 2',
      desc: 'Six boxes in a row show 2 cubed = 8, 2 squared = 4, 2 to the power 1 = 2, 2 to the power 0 = 1, 2 to the power minus 1 = 1/2 and 2 to the power minus 2 = 1/4. An arrow underneath says each step to the right divides by 2. The boxes for 2 to the power 0 and minus 1 are highlighted.',
    });
  },

  // ---- fractional indices: the graph of y = x^(1/2) ----
  'indices-surds-root-graph': () => {
    const p = sketch({ xmin: -1, xmax: 11, ymin: -1, ymax: 4 });
    band(p, 'y = x^(1/2)', `same as y = ${R}x`);
    p.curve((x) => Math.sqrt(x));
    p.drop(4, 2);
    p.point(1, 1, { label: '(1, 1)', dx: 8, dy: 36 });
    p.point(4, 2, { label: '(4, 2)', dx: 8, dy: 36 });
    p.point(9, 3, { label: '(9, 3)', dx: 8, dy: 36 });
    return finish(p, {
      id: 'indices-surds-root-graph',
      title: 'The graph of y = x to the power one half',
      desc: 'A curve that starts at the origin and rises more and more slowly to the right. It passes through the points (1, 1), (4, 2) and (9, 3). At x = 4 the height is 2, because the square root of 4 is 2.',
    });
  },

  // ---- surds: the diagonal of a unit square ----
  'indices-surds-diagonal': () => {
    const p = canvas(360);
    const x0 = 70;
    const y0 = 70;
    const s = 220;
    rect(p, x0, y0, s, s);
    p.raw(`<line class="curve" x1="${x0}" y1="${y0 + s}" x2="${x0 + s}" y2="${y0}"/>`);
    p.raw(`<polyline points="${x0 + 28},${y0 + s} ${x0 + 28},${y0 + s - 28} ${x0},${y0 + s - 28}" fill="none" style="stroke:var(--ink);stroke-width:3"/>`);
    p.note(x0 + s / 2, y0 + s + 40, '1', { anchor: 'middle' });
    p.note(x0 - 18, y0 + s / 2 + 8, '1', { anchor: 'end' });
    p.note(x0 + 150, y0 + 80, `${R}2`, { anchor: 'end', cls: 'alt' });
    p.note(340, 120, '1^2 + 1^2 = 2');
    p.note(340, 170, `so the diagonal is ${R}2`);
    p.note(340, 240, `${R}2 = 1.41421356...`, { cls: 'alt' });
    p.note(340, 280, 'The digits never stop');
    p.note(340, 320, 'and never repeat.');
    return finish(p, {
      id: 'indices-surds-diagonal',
      title: 'The diagonal of a square of side 1',
      desc: 'A square with every side 1 and a diagonal drawn from the bottom left corner to the top right corner. By Pythagoras the diagonal squared is 1 plus 1, which is 2, so the diagonal is the square root of 2, about 1.41421356 and a decimal that never stops or repeats.',
    });
  },

  // ---- simplifying a surd: root 12 is 2 root 3 ----
  'indices-surds-squares': () => {
    const p = canvas(430);
    const x0 = 80;
    const y0 = 90;
    const s = 130;
    for (let i = 0; i < 2; i += 1) {
      for (let j = 0; j < 2; j += 1) {
        rect(p, x0 + i * s, y0 + j * s, s, s);
        p.note(x0 + i * s + s / 2, y0 + j * s + s / 2 + 8, '3', { anchor: 'middle', cls: 'alt' });
      }
    }
    p.raw(`<rect x="${x0}" y="${y0}" width="${2 * s}" height="${2 * s}" fill="none" style="stroke:var(--ink);stroke-width:7"/>`);
    p.note(x0 + s, y0 - 18, `2${R}3`, { anchor: 'middle' });
    p.note(x0 - 16, y0 + s + 8, `2${R}3`, { anchor: 'end' });
    p.note(x0 + s / 2, y0 + 2 * s + 38, `${R}3`, { anchor: 'middle' });
    p.note(x0 + 1.5 * s, y0 + 2 * s + 38, `${R}3`, { anchor: 'middle' });
    p.note(390, 130, '4 squares of area 3');
    p.note(390, 180, `Big square: 4 ${TIMES} 3 = 12`);
    p.note(390, 230, 'So its side is');
    p.note(390, 280, `${R}12 = 2${R}3`, { cls: 'alt' });
    return finish(p, {
      id: 'indices-surds-squares',
      title: 'Why the square root of 12 is 2 root 3',
      desc: 'A big square made of four small squares, each of area 3, so each small square has side root 3. The big square has side 2 root 3 and area 4 times 3 = 12, so its side is also the square root of 12.',
    });
  },

  // ---- like surds and rationalising: the same number with two names ----
  'indices-surds-nl': () => numberLine({
    min: 0, max: 1.5, step: 0.25, height: 160,
    marks: [{ at: 1 / Math.sqrt(3), label: `1/${R}3 = ${R}3/3` }],
    id: 'indices-surds-nl',
    title: 'One point on the number line with two names',
    desc: 'A number line from 0 to 1.5. One point at about 0.577 is labelled 1 over root 3 and also root 3 over 3, because they are the same number. Rationalising the denominator changes the name, not the value.',
  }),

  // ---- the conjugate: a difference of two squares ----
  'indices-surds-conjugate': () => {
    const p = canvas(400);
    const u = 62; // pixels per unit
    const a = 3;
    const b = Math.SQRT2;
    const x0 = 50;
    const y0 = 80;
    const A = a * u;
    const B = b * u;
    // the L shape: a square of side 3 with a corner of side root 2 cut out
    const pts = [[x0, y0], [x0 + A - B, y0], [x0 + A - B, y0 + B], [x0 + A, y0 + B], [x0 + A, y0 + A], [x0, y0 + A]];
    p.raw(`<polygon class="shade" points="${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" style="stroke:var(--ink);stroke-width:3"/>`);
    p.raw(`<rect x="${(x0 + A - B).toFixed(1)}" y="${y0}" width="${B.toFixed(1)}" height="${B.toFixed(1)}" fill="none" style="stroke:var(--ink);stroke-width:3;stroke-dasharray:10 6"/>`);
    p.raw(`<line class="guide" x1="${x0}" y1="${(y0 + B).toFixed(1)}" x2="${x0 + A - B}" y2="${(y0 + B).toFixed(1)}"/>`);
    p.note(x0 + A - B / 2, y0 + B / 2 + 8, '2', { anchor: 'middle' });
    p.note(x0 + A / 2, y0 + A + 38, '3', { anchor: 'middle' });
    p.note(x0 - 14, y0 + A / 2 + 8, '3', { anchor: 'end' });
    p.note(x0 + A - B / 2, y0 - 16, `${R}2`, { anchor: 'middle' });
    p.note(x0 + A / 2 - 20, y0 + A - 60, '9 ' + MINUS + ' 2 = 7', { anchor: 'middle', cls: 'alt' });
    // the same area as a rectangle
    const rx = 300;
    const ry = y0 + (A - (A - B)) / 2;
    const rw = A + B;
    const rh = A - B;
    rect(p, rx, ry, rw, rh);
    p.note(rx + rw / 2, ry + rh / 2 + 8, 'area 7', { anchor: 'middle', cls: 'alt' });
    p.note(rx + rw / 2, ry - 16, `3 + ${R}2`, { anchor: 'middle' });
    p.note(rx + rw + 14, ry + rh / 2 + 8, `3 ${MINUS} ${R}2`, { anchor: 'start' });
    p.note(rx + rw / 2, ry + rh + 50, `(3 + ${R}2)(3 ${MINUS} ${R}2) = 7`, { anchor: 'middle' });
    return finish(p, {
      id: 'indices-surds-conjugate',
      title: 'A difference of two squares as a rectangle',
      desc: 'On the left, a square of side 3 with a dashed corner square of side root 2 removed. The L-shaped part left over has area 9 minus 2 = 7. On the right, the same area is a rectangle of width 3 plus root 2 and height 3 minus root 2, so the product of the two conjugates is 7.',
    });
  },

  // ---- solving x^(3/2) = 8 ----
  'indices-surds-power-eq': () => {
    const p = sketch({ xmin: -1, xmax: 7, ymin: -2, ymax: 16 });
    band(p, 'y = x^(3/2)', 'solve x^(3/2) = 8');
    p.curve((x) => Math.pow(x, 1.5));
    p.hline(8);
    p.text(-0.7, 8, 'y = 8', { anchor: 'start', dy: -12 });
    p.drop(4, 8);
    p.point(4, 8, { label: '(4, 8)', dx: 14, dy: 40 });
    return finish(p, {
      id: 'indices-surds-power-eq',
      title: 'The graph of y = x to the power three halves meets y = 8',
      desc: 'A curve that starts at the origin and rises faster and faster. A dashed horizontal line at y = 8 meets the curve at the point (4, 8), so the value of x with x to the power three halves equal to 8 is 4.',
    });
  },

  // ---- a quadratic in the square root of x ----
  'indices-surds-disguise': () => {
    const p = sketch({ xmin: -2, xmax: 30, ymin: -5, ymax: 12 });
    band(p, 'y = x - 7x^(1/2) + 10');
    p.curve((x) => x - 7 * Math.sqrt(x) + 10);
    p.point(4, 0, { label: '(4, 0)', dx: -4, dy: -18, anchor: 'middle' });
    p.point(25, 0, { label: '(25, 0)', dx: -4, dy: -18, anchor: 'middle' });
    return finish(p, {
      id: 'indices-surds-disguise',
      title: 'The graph of y = x minus 7 times root x plus 10',
      desc: 'A curve that starts at (0, 10), dips below the x-axis between x = 4 and x = 25, and climbs again. It crosses the x-axis at (4, 0) and (25, 0), the two solutions of x minus 7 x to the power one half plus 10 = 0.',
    });
  },

  // ---- flip: from solutions back to an equation ----
  'indices-surds-flip': () => {
    const p = sketch({ xmin: -3, xmax: 5, ymin: -4, ymax: 6 });
    band(p, 'y = x^2 - 2x - 1');
    p.curve((x) => x * x - 2 * x - 1);
    p.point(1 - Math.SQRT2, 0, { label: `(1 ${MINUS} ${R}2, 0)`, dx: -26, dy: -16, anchor: 'end' });
    p.point(1 + Math.SQRT2, 0, { label: `(1 + ${R}2, 0)`, dx: 26, dy: -16 });
    return finish(p, {
      id: 'indices-surds-flip',
      title: 'The graph of y = x squared minus 2x minus 1',
      desc: 'An upward-opening parabola that crosses the x-axis at the two points 1 minus root 2 (about -0.41) and 1 plus root 2 (about 2.41). Its solutions are surds.',
    });
  },

  // ---- question figures (they must not give the answer) ----
  'indices-surds-rect': () => {
    const p = canvas(300);
    rect(p, 200, 70, 400, 150);
    p.note(400, 52, `(3 + ${R}5) cm`, { anchor: 'middle' });
    p.note(184, 154, `(3 ${MINUS} ${R}5) cm`, { anchor: 'end' });
    p.note(400, 258, 'Not drawn to scale', { anchor: 'middle', cls: 'small' });
    return finish(p, {
      id: 'indices-surds-rect',
      title: 'A rectangle with surd side lengths',
      desc: 'A rectangle. The top edge is labelled 3 plus root 5 centimetres and the left edge is labelled 3 minus root 5 centimetres. It is not drawn to scale.',
    });
  },

  'indices-surds-q-triangle': () => {
    const p = canvas(330);
    const x0 = 200;
    const y0 = 250;
    p.raw(`<polygon class="shade" points="${x0},${y0} ${x0 + 440},${y0} ${x0},${y0 - 150}" style="stroke:var(--ink);stroke-width:3"/>`);
    p.raw(`<polyline points="${x0 + 28},${y0} ${x0 + 28},${y0 - 28} ${x0},${y0 - 28}" fill="none" style="stroke:var(--ink);stroke-width:3"/>`);
    p.note(x0 + 220, y0 + 44, `(${R}3 + 1) cm`, { anchor: 'middle' });
    p.note(x0 - 14, y0 - 66, `(${R}3 ${MINUS} 1) cm`, { anchor: 'end' });
    p.note(x0 + 240, y0 - 90, '? cm', { anchor: 'start' });
    p.note(400, 316, 'Not drawn to scale', { anchor: 'middle', cls: 'small' });
    return finish(p, {
      id: 'indices-surds-q-triangle',
      title: 'A right-angled triangle with surd side lengths',
      desc: 'A right-angled triangle with the right angle at the bottom left. The bottom side is labelled root 3 plus 1 centimetres and the upright side is labelled root 3 minus 1 centimetres. The sloping side is labelled with a question mark. It is not drawn to scale.',
    });
  },
};
