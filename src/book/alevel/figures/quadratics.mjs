// Figures for the Quadratics topic page (src/pages/courses/a-level/quadratics.html).
// Every graph is drawn from the function that defines it. Axes have no scale numbers: the points that matter
// are labelled with their coordinates on the picture itself, and the equation sits in a band above the graph.
import { plane } from '../figure-lib.mjs';

const SQRT = String.fromCharCode(0x221a); // the root sign, kept out of the source so the file stays plain ASCII
const R3 = `${SQRT}3`;

/** A plane with no grid and no scale numbers. It leaves a band above the graph for the equation. */
const sketch = (opts) => plane({ grid: false, ticks: false, tickLabels: false, top: 96, height: 500, ...opts });

/** The equation (left) and a note (right) in the band above the graph. */
function band(p, left, right = '') {
  p.note(64, 50, left, { cls: 'alt' });
  if (right) p.note(672, 50, right, { anchor: 'end' });
}

/** Labels get a halo in the page colour, so a label that crosses an axis or a guide line stays readable. */
const finish = (p, meta) => p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');

const parab = (a, b, c) => (x) => a * x * x + b * x + c;

/** A rectangle with labels, drawn in pixels (not to scale). */
function box(p, { x0, y0, w, h, top = '', left = '', centre = '' }) {
  p.raw(`<rect class="shade" x="${x0}" y="${y0}" width="${w}" height="${h}" style="stroke:var(--ink);stroke-width:4"/>`);
  if (top) p.note(x0 + w / 2, y0 - 16, top, { anchor: 'middle' });
  if (left) p.note(x0 - 16, y0 + h / 2 + 8, left, { anchor: 'end' });
  if (centre) p.note(x0 + w / 2, y0 + h / 2 + 8, centre, { anchor: 'middle' });
}

/** A pen against a wall: fence on three sides. `bottom` is the label under the pen, `inside` the label in it. */
function pen(p, { bottom, inside, footnote }) {
  p.raw('<line x1="80" y1="110" x2="640" y2="110" style="stroke:var(--ink);stroke-width:12"/>');
  p.note(360, 78, 'wall', { anchor: 'middle' });
  p.raw('<rect class="shade" x="150" y="110" width="420" height="220"/>');
  p.raw('<polyline points="150,110 150,330 570,330 570,110" fill="none" class="curve" style="stroke-width:7"/>');
  p.note(132, 228, 'x', { anchor: 'end' });
  p.note(588, 228, 'x', { anchor: 'start' });
  p.note(360, 376, bottom, { anchor: 'middle' });
  p.note(360, 232, inside, { anchor: 'middle' });
  p.note(360, 440, footnote, { cls: 'small', anchor: 'middle' });
}

export const FIGURES = {
  // ---- solving by factorising ----
  'quadratics-roots': () => {
    const p = sketch({ xmin: -4, xmax: 5, ymin: -8, ymax: 6 });
    band(p, 'y = x^2 - x - 6');
    p.curve(parab(1, -1, -6));
    p.point(-2, 0, { label: '(-2, 0)', dx: -30, dy: -14, anchor: 'end' });
    p.point(3, 0, { label: '(3, 0)', dx: 30, dy: -14 });
    return finish(p, {
      id: 'quadratics-roots',
      title: 'The graph of y = x squared minus x minus 6',
      desc: 'An upward-opening parabola that crosses the x-axis at the points (-2, 0) and (3, 0). These two x-values are the roots of x squared minus x minus 6 = 0.',
    });
  },

  'quadratics-roots-a': () => {
    const p = sketch({ xmin: -4, xmax: 4, ymin: -8, ymax: 6 });
    band(p, 'y = 2x^2 + x - 6');
    p.curve(parab(2, 1, -6));
    p.point(-2, 0, { label: '(-2, 0)', dx: -30, dy: -14, anchor: 'end' });
    p.point(1.5, 0, { label: '(3/2, 0)', dx: 30, dy: -14 });
    return finish(p, {
      id: 'quadratics-roots-a',
      title: 'The graph of y = 2x squared plus x minus 6',
      desc: 'An upward-opening parabola that crosses the x-axis at (-2, 0) and at (3/2, 0). One root is a fraction, which is why the factor 2x minus 3 appears.',
    });
  },

  // ---- completing the square ----
  'quadratics-tiles': () => {
    const p = sketch({ axes: false, top: 40, height: 440 });
    const s = 190; // the x by x square
    const t = 70; // the strip 3 wide
    const x0 = 80;
    const y0 = 78;
    const tile = (x, y, w, h, text) => {
      p.raw(`<rect class="shade" x="${x}" y="${y}" width="${w}" height="${h}" style="stroke:var(--ink);stroke-width:3"/>`);
      p.note(x + w / 2, y + h / 2 + 8, text, { anchor: 'middle' });
    };
    tile(x0, y0, s, s, 'x^2');
    tile(x0 + s, y0, t, s, '3x');
    tile(x0, y0 + s, s, t, '3x');
    p.raw(`<rect x="${x0 + s}" y="${y0 + s}" width="${t}" height="${t}" fill="none" style="stroke:var(--ink);stroke-width:4;stroke-dasharray:10 6"/>`);
    p.note(x0 + s + t / 2, y0 + s + t / 2 + 8, '9', { anchor: 'middle' });
    p.note(x0 + s / 2, y0 - 14, 'x', { anchor: 'middle' });
    p.note(x0 + s + t / 2, y0 - 14, '3', { anchor: 'middle' });
    p.note(x0 - 16, y0 + s / 2 + 8, 'x', { anchor: 'end' });
    p.note(x0 - 16, y0 + s + t / 2 + 8, '3', { anchor: 'end' });
    p.note(390, 150, 'x^2 + 6x is the solid part.', { cls: 'alt' });
    p.note(390, 196, 'The dashed corner, 9,', { cls: 'alt' });
    p.note(390, 226, 'completes the square.', { cls: 'alt' });
    p.note(390, 288, 'Side of the big square:', { cls: 'alt' });
    p.note(390, 318, 'x + 3', { cls: 'alt' });
    return finish(p, {
      id: 'quadratics-tiles',
      title: 'Completing the square with tiles',
      desc: 'A square of side x holds an x squared tile. A strip 3 wide on its right and another 3 deep below it each hold 3x. A dashed corner square of side 3 and area 9 fills the gap and makes a bigger square of side x plus 3.',
    });
  },

  'quadratics-shifted': () => {
    const p = sketch({ xmin: -8, xmax: 4, ymin: -6, ymax: 8 });
    band(p, 'solid: y = (x + 3)^2 - 4', 'dashed: y = x^2');
    p.curve((x) => x * x, { cls: 'curve-b' });
    p.curve((x) => (x + 3) * (x + 3) - 4);
    p.line(-3, -4, -3, 8, { cls: 'guide' });
    p.point(-3, -4, { label: 'vertex (-3, -4)', dy: 40, dx: 0, anchor: 'middle' });
    p.text(-3, 7.2, 'x = -3', { cls: 'alt', anchor: 'end', dx: -10 });
    return finish(p, {
      id: 'quadratics-shifted',
      title: 'The graph of y = (x + 3) squared minus 4 compared with y = x squared',
      desc: 'The dashed curve is y = x squared with its vertex at the origin. The solid curve has the same shape, moved 3 units left and 4 units down. Its vertex is the labelled point (-3, -4) and its axis of symmetry is the dashed line x = -3.',
    });
  },

  'quadratics-max': () => {
    const p = sketch({ xmin: -2, xmax: 6, ymin: -4, ymax: 7 });
    band(p, 'y = 1 + 4x - x^2');
    p.curve(parab(-1, 4, 1));
    p.line(2, -4, 2, 5, { cls: 'guide' });
    p.point(2, 5, { label: 'maximum point (2, 5)', dx: 0, dy: -16, anchor: 'middle' });
    p.point(0, 1, { label: '(0, 1)', dx: -14, dy: 8, anchor: 'end' });
    p.text(2, -3.4, 'x = 2', { cls: 'alt', anchor: 'start', dx: 12 });
    return finish(p, {
      id: 'quadratics-max',
      title: 'The graph of y = 1 + 4x minus x squared',
      desc: 'A downward-opening parabola with its highest point, the maximum point, at (2, 5). It crosses the y-axis at (0, 1). A dashed vertical line through the maximum point is the axis of symmetry, x = 2.',
    });
  },

  // ---- the quadratic formula ----
  'quadratics-formula': () => {
    const p = sketch({ xmin: -1, xmax: 9, ymin: -4, ymax: 6 });
    const r1 = 4 - Math.sqrt(3);
    const r2 = 4 + Math.sqrt(3);
    band(p, 'y = x^2 - 8x + 13', 'axis: x = -b/(2a) = 4');
    p.curve(parab(1, -8, 13));
    p.line(4, -3, 4, 6, { cls: 'guide' });
    p.line(r1, 0, 4, 0, { cls: 'tangent' });
    p.line(4, 0, r2, 0, { cls: 'tangent' });
    p.point(r1, 0, { label: `4 - ${R3}`, dx: -40, dy: -14, anchor: 'end' });
    p.point(r2, 0, { label: `4 + ${R3}`, dx: 40, dy: -14 });
    p.text((r1 + 4) / 2, -1.2, R3, { cls: 'alt' });
    p.text((r2 + 4) / 2, -1.2, R3, { cls: 'alt' });
    return finish(p, {
      id: 'quadratics-formula',
      title: 'The roots of x squared minus 8x plus 13 sit the same distance either side of the axis of symmetry',
      desc: 'An upward-opening parabola with its axis of symmetry at x = 4. The curve crosses the x-axis at 4 minus root 3 and at 4 plus root 3. Two thick lines on the x-axis, each marked with the square root of 3, show that each root is the same distance from the axis of symmetry.',
    });
  },

  // ---- the discriminant ----
  'quadratics-disc-two': () => {
    const p = sketch({ xmin: -1, xmax: 9, ymin: -5, ymax: 8 });
    band(p, 'y = x^2 - 8x + 13', 'b^2 - 4ac = 12');
    p.curve(parab(1, -8, 13));
    p.point(4 - Math.sqrt(3), 0, { label: 'root', dx: -14, dy: -14, anchor: 'end' });
    p.point(4 + Math.sqrt(3), 0, { label: 'root', dx: 14, dy: -14 });
    p.text(4, -4.4, 'positive: two real roots', { cls: 'alt' });
    return finish(p, {
      id: 'quadratics-disc-two',
      title: 'A positive discriminant: the curve crosses the x-axis twice',
      desc: 'The graph of y = x squared minus 8x plus 13, an upward-opening parabola that crosses the x-axis at two points, each marked root. Its discriminant is 12, which is positive.',
    });
  },

  'quadratics-disc-one': () => {
    const p = sketch({ xmin: -1, xmax: 9, ymin: -5, ymax: 8 });
    band(p, 'y = x^2 - 8x + 16', 'b^2 - 4ac = 0');
    p.curve(parab(1, -8, 16));
    p.point(4, 0, { label: 'one repeated root', dx: 0, dy: 44, anchor: 'middle' });
    p.text(4, -4.4, 'zero: the curve touches the x-axis', { cls: 'alt' });
    return finish(p, {
      id: 'quadratics-disc-one',
      title: 'A zero discriminant: the curve touches the x-axis once',
      desc: 'The graph of y = x squared minus 8x plus 16, an upward-opening parabola whose lowest point, the vertex, lies on the x-axis at (4, 0). It touches the axis and does not cross it. Its discriminant is 0.',
    });
  },

  'quadratics-disc-none': () => {
    const p = sketch({ xmin: -1, xmax: 9, ymin: -5, ymax: 8 });
    band(p, 'y = x^2 - 8x + 18', 'b^2 - 4ac = -8');
    p.curve(parab(1, -8, 18));
    p.text(4, -2.2, 'negative: no real roots', { cls: 'alt' });
    p.text(4, -3.8, 'the curve never meets the x-axis', { cls: '' });
    return finish(p, {
      id: 'quadratics-disc-none',
      title: 'A negative discriminant: the curve never meets the x-axis',
      desc: 'The graph of y = x squared minus 8x plus 18, an upward-opening parabola that lies entirely above the x-axis. Its lowest point is at (4, 2). Its discriminant is -8, which is negative.',
    });
  },

  // ---- sketching ----
  'quadratics-sketch': () => {
    const p = sketch({ xmin: -3, xmax: 5, ymin: -6, ymax: 6 });
    band(p, 'y = x^2 - 2x - 3');
    p.curve(parab(1, -2, -3));
    p.line(1, -4, 1, 1.2, { cls: 'guide' });
    p.point(-1, 0, { label: '(-1, 0)', dx: -30, dy: -14, anchor: 'end' });
    p.point(3, 0, { label: '(3, 0)', dx: 30, dy: -14 });
    p.point(0, -3, { label: '(0, -3)', dx: -14, dy: 8, anchor: 'end' });
    p.point(1, -4, { label: '(1, -4)', dx: 0, dy: 40, anchor: 'middle' });
    p.text(1, 2, 'x = 1', { cls: 'alt' });
    return finish(p, {
      id: 'quadratics-sketch',
      title: 'A sketch of y = x squared minus 2x minus 3',
      desc: 'An upward-opening parabola. It crosses the x-axis at (-1, 0) and (3, 0), crosses the y-axis at (0, -3), and has its vertex at (1, -4). The dashed line x = 1 is the axis of symmetry.',
    });
  },

  'quadratics-sketch-neg': () => {
    const p = sketch({ xmin: -4, xmax: 6, ymin: -4, ymax: 11 });
    band(p, 'y = -x^2 + 2x + 8');
    p.curve(parab(-1, 2, 8));
    p.line(1, -2.6, 1, 9, { cls: 'guide' });
    p.point(-2, 0, { label: '(-2, 0)', dx: -16, dy: -14, anchor: 'end' });
    p.point(4, 0, { label: '(4, 0)', dx: 16, dy: -14 });
    p.point(0, 8, { label: '(0, 8)', dx: -14, dy: 8, anchor: 'end' });
    p.point(1, 9, { label: '(1, 9)', dx: 0, dy: -16, anchor: 'middle' });
    p.text(1, -3.2, 'x = 1', { cls: 'alt', anchor: 'start', dx: 12 });
    return finish(p, {
      id: 'quadratics-sketch-neg',
      title: 'A sketch of y = minus x squared plus 2x plus 8',
      desc: 'A downward-opening parabola. It crosses the x-axis at (-2, 0) and (4, 0), crosses the y-axis at (0, 8), and has its highest point, the vertex, at (1, 9). The dashed line x = 1 is the axis of symmetry.',
    });
  },

  // ---- quadratics in disguise ----
  'quadratics-disguise-u': () => {
    const p = sketch({ xmin: -1, xmax: 6, ymin: -4, ymax: 6, xlabel: 'u' });
    band(p, 'y = u^2 - 5u + 4');
    p.curve(parab(1, -5, 4));
    p.point(1, 0, { label: 'u = 1', dx: -26, dy: -14, anchor: 'end' });
    p.point(4, 0, { label: 'u = 4', dx: 26, dy: -14 });
    return finish(p, {
      id: 'quadratics-disguise-u',
      title: 'The graph of y = u squared minus 5u plus 4',
      desc: 'An upward-opening parabola drawn against the letter u. It crosses the u-axis at u = 1 and at u = 4. These are the two values of u that solve u squared minus 5u plus 4 = 0.',
    });
  },

  'quadratics-disguise-x': () => {
    const p = sketch({ xmin: -3, xmax: 3, ymin: -4, ymax: 8 });
    band(p, 'y = x^4 - 5x^2 + 4');
    p.curve((x) => x ** 4 - 5 * x * x + 4);
    p.point(-2, 0, { label: '-2', dx: -26, dy: -14, anchor: 'end' });
    p.point(-1, 0, { label: '-1', dx: 10, dy: 38, anchor: 'start' });
    p.point(1, 0, { label: '1', dx: -10, dy: 38, anchor: 'end' });
    p.point(2, 0, { label: '2', dx: 26, dy: -14 });
    return finish(p, {
      id: 'quadratics-disguise-x',
      title: 'The graph of y = x to the power 4 minus 5x squared plus 4',
      desc: 'A W-shaped curve that crosses the x-axis at four points: x = -2, x = -1, x = 1 and x = 2. It is symmetrical about the y-axis. These four values solve x to the power 4 minus 5x squared plus 4 = 0.',
    });
  },

  'quadratics-sqrt': () => {
    const p = sketch({ xmin: -1, xmax: 19, ymin: -4, ymax: 8 });
    band(p, 'y = x - 5x^(1/2) + 4');
    p.curve((x) => x - 5 * Math.sqrt(x) + 4, { from: 0 });
    p.point(1, 0, { label: '(1, 0)', dx: 12, dy: -14 });
    p.point(16, 0, { label: '(16, 0)', dx: -12, dy: -14, anchor: 'end' });
    return finish(p, {
      id: 'quadratics-sqrt',
      title: 'The graph of y = x minus 5 times x to the power one half, plus 4',
      desc: 'A curve that starts on the y-axis at (0, 4), falls below the x-axis, then rises again. It crosses the x-axis at (1, 0) and at (16, 0). It exists only for x of 0 or more.',
    });
  },

  // ---- problem solving ----
  'quadratics-rect': () => {
    const p = sketch({ axes: false, top: 40, height: 460 });
    box(p, { x0: 140, y0: 100, w: 440, h: 240, top: 'x + 3', left: 'x', centre: 'area = 40' });
    p.note(360, 410, 'Not drawn to scale', { cls: 'small', anchor: 'middle' });
    return finish(p, {
      id: 'quadratics-rect',
      title: 'A rectangle with width x and length x plus 3',
      desc: 'A rectangle. The short side is labelled x and the long side is labelled x plus 3. Inside, the area is given as 40. The drawing is not to scale.',
    });
  },

  'quadratics-pen': () => {
    const p = sketch({ axes: false });
    pen(p, { bottom: '40 - 2x', inside: 'area = x(40 - 2x)', footnote: 'Not drawn to scale. The thick lines are the 40 m of fence.' });
    return finish(p, {
      id: 'quadratics-pen',
      title: 'A pen built against a wall with 40 metres of fence',
      desc: 'A rectangle below a thick wall line. Fence runs along the two short sides, each of length x, and along the bottom side, which has length 40 minus 2x. The fourth side is the wall. The drawing is not to scale.',
    });
  },

  // ---- flip it ----
  'quadratics-from-graph': () => {
    const p = sketch({ xmin: -2, xmax: 7, ymin: -6, ymax: 10 });
    band(p, 'y = a(x - 1)(x - 4)');
    p.curve(parab(2, -10, 8));
    p.point(1, 0, { label: '(1, 0)', dx: 14, dy: -14 });
    p.point(4, 0, { label: '(4, 0)', dx: 30, dy: -14 });
    p.point(0, 8, { label: '(0, 8)', dx: 14, dy: 8 });
    return finish(p, {
      id: 'quadratics-from-graph',
      title: 'A parabola through (1, 0), (4, 0) and (0, 8)',
      desc: 'An upward-opening parabola that crosses the x-axis at (1, 0) and (4, 0) and crosses the y-axis at (0, 8). Its equation is written as y = a(x - 1)(x - 4), where a is still to be found.',
    });
  },

  // ---- question figures (they must not give the answer away) ----
  'quadratics-q-roots15': () => {
    const p = sketch({ xmin: -1, xmax: 7, ymin: -6, ymax: 6 });
    band(p, 'y = x^2 + bx + c');
    p.curve(parab(1, -6, 5));
    p.point(1, 0, { label: '(1, 0)', dx: -30, dy: -14, anchor: 'end' });
    p.point(5, 0, { label: '(5, 0)', dx: 30, dy: -14 });
    return finish(p, {
      id: 'quadratics-q-roots15',
      title: 'A parabola through (1, 0) and (5, 0)',
      desc: 'An upward-opening parabola with equation y = x squared plus bx plus c. It crosses the x-axis at (1, 0) and (5, 0). Its lowest point is not marked.',
    });
  },

  'quadratics-q-graph': () => {
    const p = sketch({ xmin: -3, xmax: 5, ymin: -9, ymax: 6 });
    band(p, 'y = ax^2 + bx + c');
    p.curve(parab(2, -4, -6));
    p.point(-1, 0, { label: '(-1, 0)', dx: -30, dy: -14, anchor: 'end' });
    p.point(3, 0, { label: '(3, 0)', dx: 30, dy: -14 });
    p.point(0, -6, { label: '(0, -6)', dx: -14, dy: 8, anchor: 'end' });
    return finish(p, {
      id: 'quadratics-q-graph',
      title: 'A parabola through (-1, 0), (3, 0) and (0, -6)',
      desc: 'An upward-opening parabola with equation y = ax squared plus bx plus c. It crosses the x-axis at (-1, 0) and (3, 0), and crosses the y-axis at (0, -6).',
    });
  },

  'quadratics-q-vertex': () => {
    const p = sketch({ xmin: -2, xmax: 6, ymin: -5, ymax: 9 });
    band(p, 'y = a(x - 2)^2 - 3');
    p.curve(parab(2, -8, 5));
    p.point(2, -3, { label: 'vertex (2, -3)', dx: 0, dy: 40, anchor: 'middle' });
    p.point(0, 5, { label: '(0, 5)', dx: -14, dy: 8, anchor: 'end' });
    return finish(p, {
      id: 'quadratics-q-vertex',
      title: 'A parabola with vertex (2, -3) through (0, 5)',
      desc: 'An upward-opening parabola with its vertex at (2, -3). It crosses the y-axis at (0, 5). Its equation is written as y = a(x - 2) squared minus 3, where a is still to be found.',
    });
  },

  'quadratics-q-rect': () => {
    const p = sketch({ axes: false, top: 40, height: 420 });
    box(p, { x0: 140, y0: 100, w: 440, h: 200, top: 'x + 5', left: 'x', centre: 'area = 84' });
    p.note(360, 380, 'Not drawn to scale', { cls: 'small', anchor: 'middle' });
    return finish(p, {
      id: 'quadratics-q-rect',
      title: 'A rectangle with width x and length x plus 5',
      desc: 'A rectangle. The short side is labelled x and the long side is labelled x plus 5. Inside, the area is given as 84. The drawing is not to scale.',
    });
  },

  'quadratics-q-tri': () => {
    const p = sketch({ axes: false, top: 40, height: 460 });
    p.raw('<polygon class="shade" points="150,330 570,330 150,100" style="stroke:var(--ink);stroke-width:4"/>');
    p.raw('<polyline points="150,300 180,300 180,330" fill="none" style="stroke:var(--ink);stroke-width:3"/>');
    p.note(132, 222, 'x', { anchor: 'end' });
    p.note(360, 376, 'x + 7', { anchor: 'middle' });
    p.note(404, 190, '13', { anchor: 'start' });
    p.note(360, 424, 'Not drawn to scale', { cls: 'small', anchor: 'middle' });
    return finish(p, {
      id: 'quadratics-q-tri',
      title: 'A right-angled triangle with sides x, x plus 7 and 13',
      desc: 'A right-angled triangle. The two short sides are labelled x and x plus 7, and the longest side, opposite the right angle, is labelled 13. The drawing is not to scale.',
    });
  },

  'quadratics-q-pen': () => {
    const p = sketch({ axes: false });
    pen(p, { bottom: '?', inside: 'total fence 60 m', footnote: 'Not drawn to scale. The thick lines are the fence.' });
    return finish(p, {
      id: 'quadratics-q-pen',
      title: 'A pen built against a wall with 60 metres of fence',
      desc: 'A rectangle below a thick wall line. Fence runs along the two short sides, each of length x, and along the bottom side, whose length is marked with a question mark. The fourth side is the wall. The total length of fence is 60 metres. The drawing is not to scale.',
    });
  },
};
