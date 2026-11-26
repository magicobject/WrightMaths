// Figures for the Simultaneous equations topic page (src/pages/books/a-level/simultaneous.html).
// Every line and curve is drawn from its equation, so a picture cannot disagree with the working.
// Both axes use the SAME scale (see eq() below). Axes have no scale numbers: the points that matter are labelled.
// A key at the top names each line or curve with a short sample of how it is drawn, so no label sits on a line.
import { plane } from '../figure-lib.mjs';

const W = 640;
const LEFT = 64;
const RIGHT = 48;
const BOTTOM = 52;
const ROW = 38; // the height of one row of the key

/** A plane with no grid and no scale numbers and the SAME scale on both axes. `keys` is how many key rows sit above the graph. */
function eq({ xmin, xmax, ymid, keys = 2, height = 620, ...rest }) {
  const top = 36 + ROW * (keys - 1) + 62;
  const w = W - LEFT - RIGHT;
  const h = height - top - BOTTOM;
  const yr = ((xmax - xmin) * h) / w;
  return plane({ grid: false, ticks: false, tickLabels: false, width: W, height, top, xmin, xmax, ymin: ymid - yr / 2, ymax: ymid + yr / 2, ...rest });
}

/** The key: a sample of each style, then what it is. rows: [[class, text], ...] */
function key(p, rows) {
  rows.forEach(([cls, text], i) => {
    const y = 36 + ROW * i;
    p.raw(`<line class="${cls}" x1="${LEFT}" y1="${y - 8}" x2="${LEFT + 56}" y2="${y - 8}"/>`);
    p.note(LEFT + 72, y, text, { cls: 'alt' });
  });
}

/** Labels get a halo in the page colour, so a label that crosses an axis or a guide line stays readable. */
const HALO = 'paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round';
const finish = (p, meta) => p.svg(meta).replace(/<text class="svg-t([^>]*)>([\s\S]*?)<\/text>/g, (whole, attrs, body) => (body.includes('<tspan') ? whole : `<text style="${HALO}" class="svg-t${attrs}>${body}</text>`));

const circle = (p, a, b, r, cls = 'curve') => p.parametric((t) => a + r * Math.cos(t), (t) => b + r * Math.sin(t), 0, 2 * Math.PI, { cls });

export const FIGURES = {
  // ---- 1. two linear equations ----
  'simultaneous-cross': () => {
    const p = eq({ xmin: -3, xmax: 6.4, ymid: 3 });
    key(p, [['curve', 'y = 2x - 1'], ['curve-b', '3x + 2y = 12']]);
    p.straight(2, -1, { cls: 'curve' });
    p.straight(-1.5, 6, { cls: 'curve-b' });
    p.point(2, 3, { label: '(2, 3)', dx: 16, dy: -14 });
    return finish(p, {
      id: 'simultaneous-cross',
      title: 'The lines y = 2x - 1 and 3x + 2y = 12 cross at (2, 3)',
      desc: 'Two straight lines. The solid line y equals 2x minus 1 rises steeply to the right. The dashed line 3x plus 2y equals 12 falls to the right. They cross at one marked point, (2, 3). Every other point is on one line only.',
    });
  },

  'simultaneous-parallel': () => {
    const p = eq({ xmin: -4.5, xmax: 4.9, ymid: 3 });
    key(p, [['curve', 'y = 2x + 1'], ['curve-b', 'y = 2x + 4']]);
    p.straight(2, 1, { cls: 'curve' });
    p.straight(2, 4, { cls: 'curve-b' });
    p.text(1.4, 1.5, 'same gradient', { cls: 'alt', anchor: 'start' });
    return finish(p, {
      id: 'simultaneous-parallel',
      title: 'The parallel lines y = 2x + 1 and y = 2x + 4 never meet',
      desc: 'Two straight lines that both rise to the right with gradient 2. The solid line y equals 2x plus 1 is below and to the right of the dashed line y equals 2x plus 4. They stay the same distance apart and never cross.',
    });
  },

  // ---- 2. a line and a quadratic ----
  'simultaneous-line-parabola': () => {
    const p = eq({ xmin: -1, xmax: 6, ymid: 1.6 });
    key(p, [['curve', 'y = x^2 - 4x + 3'], ['curve-b', 'y = x - 1']]);
    p.curve((x) => x * x - 4 * x + 3, { cls: 'curve' });
    p.straight(1, -1, { cls: 'curve-b' });
    p.point(1, 0, { label: '(1, 0)', dx: 18, dy: 26 });
    p.point(4, 3, { label: '(4, 3)', dx: -16, dy: -16, anchor: 'end' });
    return finish(p, {
      id: 'simultaneous-line-parabola',
      title: 'The line y = x - 1 meets the curve y = x^2 - 4x + 3 at (1, 0) and (4, 3)',
      desc: 'A U-shaped curve, the solid parabola y equals x squared minus 4x plus 3, with its lowest point at (2, -1). A dashed straight line y equals x minus 1 rises to the right and cuts the parabola at two marked points, (1, 0) on the left arm and (4, 3) on the right arm.',
    });
  },

  'simultaneous-line-circle': () => {
    const p = eq({ xmin: -5.5, xmax: 5.5, ymid: 0 });
    key(p, [['curve', 'x^2 + y^2 = 13'], ['curve-b', 'x + y = 1']]);
    circle(p, 0, 0, Math.sqrt(13));
    p.straight(-1, 1, { cls: 'curve-b' });
    p.point(3, -2, { label: '(3, -2)', dx: 26, dy: -12 });
    p.point(-2, 3, { label: '(-2, 3)', dx: -30, dy: 22, anchor: 'end' });
    return finish(p, {
      id: 'simultaneous-line-circle',
      title: 'The line x + y = 1 meets the circle x^2 + y^2 = 13 at (3, -2) and (-2, 3)',
      desc: 'A solid circle with its centre at the origin and radius the square root of 13, about 3.6. A dashed straight line x plus y equals 1 falls to the right and cuts the circle at two marked points: (-2, 3) at the upper left and (3, -2) at the lower right.',
    });
  },

  // ---- 3. how many points ----
  'simultaneous-cases': () => {
    const p = eq({ xmin: -2, xmax: 6, ymid: 0, keys: 4, height: 700 });
    key(p, [['curve', 'curve y = x^2 - 2x'], ['curve-c', 'y = 2x - 1 cuts it twice'], ['curve-b', 'y = 2x - 4 touches it'], ['line', 'y = 2x - 7 misses it']]);
    p.curve((x) => x * x - 2 * x, { cls: 'curve' });
    p.straight(2, -1, { cls: 'curve-c' });
    p.straight(2, -4, { cls: 'curve-b' });
    p.straight(2, -7, { cls: 'line' });
    p.point(2, 0, { label: '(2, 0)', dx: 16, dy: 28 });
    return finish(p, {
      id: 'simultaneous-cases',
      title: 'A curve and three parallel lines: cuts twice, touches once, misses',
      desc: 'A solid U-shaped curve, y equals x squared minus 2x. Three parallel lines rise to the right with gradient 2. The highest, dotted, cuts the curve at two points. The middle one, dashed, touches the curve at one point, (2, 0), and is a tangent. The lowest, solid, stays below the curve and does not meet it.',
    });
  },

  // ---- 4. setting up from a problem ----
  'simultaneous-rectangle': () => {
    const p = eq({ xmin: -1.5, xmax: 9.5, ymid: 2.2, keys: 1, height: 370, axes: false });
    p.note(LEFT, 36, 'perimeter 20 cm', { cls: 'alt' });
    p.line(0, 0, 8, 0, { cls: 'curve', clip: false });
    p.line(8, 0, 8, 4.4, { cls: 'curve', clip: false });
    p.line(8, 4.4, 0, 4.4, { cls: 'curve', clip: false });
    p.line(0, 4.4, 0, 0, { cls: 'curve', clip: false });
    p.text(4, 0, 'x cm', { cls: 'alt', dy: 40 });
    p.text(8, 2.2, 'y cm', { cls: 'alt', anchor: 'start', dx: 16, dy: 8 });
    p.text(4, 2.2, 'area 21 cm^2', { cls: 'alt', dy: 8 });
    return finish(p, {
      id: 'simultaneous-rectangle',
      title: 'A rectangle with sides x cm and y cm, perimeter 20 cm and area 21 square centimetres',
      desc: 'A rectangle, not drawn to scale. The bottom side is labelled x centimetres and the right side is labelled y centimetres. The area, 21 square centimetres, is written inside it. Its perimeter is 20 centimetres.',
    });
  },

  // ---- flip it: from the crossing points back to the curve ----
  'simultaneous-flip': () => {
    const p = eq({ xmin: -1, xmax: 5, ymid: 2 });
    key(p, [['curve', 'y = x^2 + bx + c'], ['curve-b', 'y = x']]);
    p.curve((x) => x * x - 3 * x + 3, { cls: 'curve' });
    p.straight(1, 0, { cls: 'curve-b' });
    p.line(1, 0, 1, 1, { cls: 'guide' });
    p.line(3, 0, 3, 3, { cls: 'guide' });
    p.point(1, 1);
    p.point(3, 3);
    p.text(1, 0, 'x = 1', { cls: 'alt', dy: 36 });
    p.text(3, 0, 'x = 3', { cls: 'alt', dy: 36 });
    return finish(p, {
      id: 'simultaneous-flip',
      title: 'A curve and the line y = x that cross where x = 1 and x = 3',
      desc: 'A solid U-shaped curve, y equals x squared plus bx plus c, and a dashed straight line y equals x rising to the right. They cross at two marked points, one where x is 1 and one where x is 3. The numbers b and c are not known: they are found from the two crossing points.',
    });
  },

  // ---- question figure ----
  'simultaneous-q-meet': () => {
    const p = eq({ xmin: -6, xmax: 6, ymid: 0.8 });
    key(p, [['curve', 'y = x^2 - 4'], ['curve-b', 'y = x + 2']]);
    p.curve((x) => x * x - 4, { cls: 'curve' });
    p.straight(1, 2, { cls: 'curve-b' });
    p.point(-2, 0, { label: 'P', dx: -16, dy: 30, anchor: 'end' });
    p.point(3, 5, { label: 'Q', dx: -16, dy: -14, anchor: 'end' });
    return finish(p, {
      id: 'simultaneous-q-meet',
      title: 'A curve and a line that meet at the points P and Q',
      desc: 'A solid U-shaped curve and a dashed straight line that rises to the right. They cross at two marked points. P is on the left, where the line meets the left arm of the curve. Q is higher up on the right arm. No scale is shown.',
    });
  },
};
