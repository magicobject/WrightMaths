// Figures for the Straight lines topic page (src/pages/books/a-level/straight-lines.html).
// Every line is drawn from its equation or from its points. Both axes use the SAME scale (see eq() below),
// so a right angle looks like one and a gradient looks like its number. Axes have no scale numbers: the points
// that matter are labelled with their coordinates on the picture itself, and the equation sits in a band above.
import { plane } from '../figure-lib.mjs';

const W = 640;
const H = 600;
const LEFT = 64;
const RIGHT = 48;
const BOTTOM = 52;

/**
 * A plane with no grid and no scale numbers and the SAME scale on both axes.
 * x runs from xmin to xmax, and y is centred on ymid. `top` leaves a band above the graph for the equation.
 */
function eq({ xmin, xmax, ymid, top = 96, height = H, ...rest }) {
  const w = W - LEFT - RIGHT;
  const h = height - top - BOTTOM;
  const yr = ((xmax - xmin) * h) / w;
  return plane({ grid: false, ticks: false, tickLabels: false, width: W, height, top, xmin, xmax, ymin: ymid - yr / 2, ymax: ymid + yr / 2, ...rest });
}

/** The equation (left) and a note (right) in the band above the graph. */
function band(p, left, right = '') {
  p.note(LEFT, 50, left, { cls: 'alt' });
  if (right) p.note(W - RIGHT, 50, right, { anchor: 'end' });
}

/** Labels get a halo in the page colour, so a label that crosses an axis or a guide line stays readable. */
const finish = (p, meta) => p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');

/** A small square marking a right angle at (x, y), between the directions d1 and d2 (in graph coordinates). */
function rightAngle(p, x, y, d1, d2, size = 20) {
  const unit = ([dx, dy]) => {
    const px = dx * (p.X(1) - p.X(0));
    const py = -dy * (p.X(1) - p.X(0));
    const n = Math.hypot(px, py);
    return [px / n, py / n];
  };
  const [a, b] = [unit(d1), unit(d2)];
  const o = [p.X(x), p.Y(y)];
  const pts = [[o[0] + a[0] * size, o[1] + a[1] * size], [o[0] + (a[0] + b[0]) * size, o[1] + (a[1] + b[1]) * size], [o[0] + b[0] * size, o[1] + b[1] * size]];
  p.raw(`<polyline points="${pts.map(([u, v]) => `${u.toFixed(1)},${v.toFixed(1)}`).join(' ')}" fill="none" style="stroke:var(--ink);stroke-width:3"/>`);
}

/** The across-and-up triangle under a stretch of line from (x1, y1) to (x2, y2). */
function steps(p, [x1, y1], [x2, y2], across, up) {
  p.line(x1, y1, x2, y1, { cls: 'guide' });
  p.line(x2, y1, x2, y2, { cls: 'guide' });
  const short = across.length <= 2; // a bare number is centred; a phrase starts at x1 so it stays clear of the line
  p.text(short ? (x1 + x2) / 2 : x1, y1, across, { cls: 'alt', anchor: short ? 'middle' : 'start', dx: short ? 0 : 8, dy: y2 >= y1 ? 36 : -14 });
  p.text(x2, (y1 + y2) / 2, up, { cls: 'alt', anchor: 'start', dx: 14, dy: 8 });
}

export const FIGURES = {
  // ---- the gradient ----
  'straight-lines-gradient': () => {
    const p = eq({ xmin: -2, xmax: 6, ymid: 2 });
    band(p, 'A (1, 1) and B (3, 5)', 'gradient = 4 / 2 = 2');
    p.straight(2, -1, { cls: 'curve' });
    steps(p, [1, 1], [3, 5], 'across 2', 'up 4');
    p.point(1, 1, { label: 'A (1, 1)', dx: -14, dy: 8, anchor: 'end' });
    p.point(3, 5, { label: 'B (3, 5)', dx: -14, dy: -4, anchor: 'end' });
    return finish(p, {
      id: 'straight-lines-gradient',
      title: 'A line through A (1, 1) and B (3, 5)',
      desc: 'A straight line that rises to the right through the points A (1, 1) and B (3, 5). Dashed guides show a step of 2 across from A and then 4 up to B. The gradient is 4 divided by 2, which is 2.',
    });
  },

  'straight-lines-mc': () => {
    const p = eq({ xmin: -4, xmax: 6, ymid: 0.5 });
    band(p, 'y = -2x + 3', 'm = -2 and c = 3');
    p.straight(-2, 3, { cls: 'curve' });
    steps(p, [2, -1], [3, -3], 'across 1', 'down 2');
    p.point(0, 3, { label: '(0, 3)', dx: 16, dy: -10 });
    return finish(p, {
      id: 'straight-lines-mc',
      title: 'The line y = -2x + 3',
      desc: 'A straight line that falls to the right. It crosses the y-axis at the point (0, 3), so c is 3. Dashed guides show a step of 1 across and then 2 down, so the gradient m is negative 2.',
    });
  },

  'straight-lines-axis-parallel': () => {
    const p = eq({ xmin: -5, xmax: 5, ymid: 1 });
    band(p, 'solid: y = 3', 'dashed: x = -2');
    p.line(-5, 3, 5, 3, { cls: 'curve' });
    p.line(-2, p.ymin, -2, p.ymax, { cls: 'curve-b' });
    p.text(3.4, 3, 'gradient 0', { cls: 'alt', dy: -18 });
    p.text(-2, -2.2, 'no gradient', { cls: 'alt', anchor: 'start', dx: 14 });
    return finish(p, {
      id: 'straight-lines-axis-parallel',
      title: 'The lines y = 3 and x = -2',
      desc: 'A solid horizontal line at height 3, which is the line y = 3 and has gradient 0. A dashed vertical line through x = negative 2, which is the line x = -2 and has no gradient.',
    });
  },

  // ---- point-gradient form ----
  'straight-lines-point-gradient': () => {
    const p = eq({ xmin: -3, xmax: 7, ymid: 1 });
    band(p, 'y - 4 = -3(x - 1)', 'gradient -3');
    p.straight(-3, 7, { cls: 'curve' });
    steps(p, [1, 4], [3, -2], 'across 2', 'down 6');
    p.point(1, 4, { label: 'P (1, 4)', dx: -14, dy: 34, anchor: 'end' });
    p.point(3, -2, { label: 'Q (3, -2)', dx: 14, dy: 34 });
    return finish(p, {
      id: 'straight-lines-point-gradient',
      title: 'The line with gradient -3 through P (1, 4)',
      desc: 'A straight line that falls to the right through P (1, 4) and Q (3, -2). Dashed guides show a step of 2 across and 6 down from P to Q, so the gradient is negative 6 divided by 2, which is negative 3. The line has equation y minus 4 equals negative 3 times (x minus 1).',
    });
  },

  'straight-lines-two-points': () => {
    const p = eq({ xmin: -3, xmax: 7, ymid: 6 });
    band(p, 'y = 2x + 3', 'through A (1, 5) and B (3, 9)');
    p.straight(2, 3, { cls: 'curve' });
    steps(p, [1, 5], [3, 9], 'across 2', 'up 4');
    p.point(1, 5, { label: 'A (1, 5)', dx: -14, dy: 8, anchor: 'end' });
    p.point(3, 9, { label: 'B (3, 9)', dx: -14, dy: -4, anchor: 'end' });
    p.point(0, 3, { label: '(0, 3)', dx: 16, dy: 34 });
    return finish(p, {
      id: 'straight-lines-two-points',
      title: 'The line through A (1, 5) and B (3, 9)',
      desc: 'A straight line that rises to the right through A (1, 5) and B (3, 9). It crosses the y-axis at (0, 3). Dashed guides show a step of 2 across and 4 up from A to B, so the gradient is 2 and the equation is y = 2x + 3.',
    });
  },

  // ---- general form ----
  'straight-lines-general': () => {
    const p = eq({ xmin: -3, xmax: 7, ymid: 1.5 });
    band(p, '3x + 4y - 12 = 0', 'gradient -3/4');
    p.straight(-0.75, 3, { cls: 'curve' });
    p.point(4, 0, { label: '(4, 0)', dx: 14, dy: -14 });
    p.point(0, 3, { label: '(0, 3)', dx: 16, dy: -10 });
    return finish(p, {
      id: 'straight-lines-general',
      title: 'The line 3x + 4y - 12 = 0',
      desc: 'A straight line that falls to the right. It crosses the x-axis at (4, 0) and the y-axis at (0, 3). Its gradient is negative three quarters.',
    });
  },

  // ---- parallel and perpendicular ----
  'straight-lines-parallel': () => {
    const p = eq({ xmin: -4, xmax: 6, ymid: 0 });
    band(p, 'solid: y = 2x + 1', 'dashed: y = 2x - 3');
    p.straight(2, 1, { cls: 'curve' });
    p.straight(2, -3, { cls: 'curve-b' });
    steps(p, [0, 1], [1, 3], '1', '2');
    steps(p, [2, 1], [3, 3], '1', '2');
    return finish(p, {
      id: 'straight-lines-parallel',
      title: 'The parallel lines y = 2x + 1 and y = 2x - 3',
      desc: 'Two straight lines that rise to the right at the same steepness and never meet. The solid line is y = 2x + 1 and the dashed line is y = 2x - 3. On each, a dashed guide shows a step of 1 across and 2 up, so both have gradient 2.',
    });
  },

  'straight-lines-perp': () => {
    const p = eq({ xmin: -3, xmax: 7, ymid: 3 });
    band(p, 'solid: y = 2x - 1', 'dashed: y = -x/2 + 4');
    p.straight(2, -1, { cls: 'curve' });
    p.straight(-0.5, 4, { cls: 'curve-b' });
    rightAngle(p, 2, 3, [1, 2], [2, -1]);
    p.text(1.6, 0.6, 'gradient 2', { cls: 'alt', anchor: 'start' });
    p.text(-2.6, 6.2, 'gradient -1/2', { cls: 'alt', anchor: 'start' });
    return finish(p, {
      id: 'straight-lines-perp',
      title: 'The perpendicular lines y = 2x - 1 and y = -x/2 + 4',
      desc: 'Two straight lines that cross at the point (2, 3) at a right angle, marked with a small square. The solid line rises with gradient 2. The dashed line falls with gradient negative one half. Multiplying the two gradients gives negative 1.',
    });
  },

  // ---- distance and midpoint ----
  'straight-lines-distance': () => {
    const p = eq({ xmin: -5, xmax: 9, ymid: 6 });
    band(p, 'A (-1, 2) and B (5, 10)', 'distance = 10');
    p.line(-1, 2, 5, 10, { cls: 'curve', clip: false });
    p.line(-1, 2, 5, 2, { cls: 'guide' });
    p.line(5, 2, 5, 10, { cls: 'guide' });
    rightAngle(p, 5, 2, [-1, 0], [0, 1]);
    p.text(2, 2, 'across 6', { cls: 'alt', dy: 36 });
    p.text(5, 6, 'up 8', { cls: 'alt', anchor: 'start', dx: 14, dy: 8 });
    p.text(2.6, 6, 'AB', { cls: 'alt', anchor: 'start' });
    p.point(-1, 2, { label: 'A (-1, 2)', dx: -14, dy: 8, anchor: 'end' });
    p.point(5, 10, { label: 'B (5, 10)', dx: -14, dy: -4, anchor: 'end' });
    return finish(p, {
      id: 'straight-lines-distance',
      title: 'The distance from A (-1, 2) to B (5, 10)',
      desc: 'A right-angled triangle. The longest side is the line segment AB from A (-1, 2) to B (5, 10). The other two sides are dashed: 6 across and then 8 up, meeting at a right angle marked with a small square. Pythagoras gives the length of AB.',
    });
  },

  'straight-lines-midpoint': () => {
    const p = eq({ xmin: -5, xmax: 9, ymid: 6 });
    band(p, 'M is the midpoint of AB', 'M = (2, 6)');
    p.line(-1, 2, 5, 10, { cls: 'curve', clip: false });
    p.line(2, 2, 2, 6, { cls: 'guide' });
    p.line(-1, 6, 2, 6, { cls: 'guide' });
    p.text(2, 2, 'x = 2', { cls: 'alt', dy: 36 });
    p.text(-1, 6, 'y = 6', { cls: 'alt', anchor: 'end', dx: -12, dy: 8 });
    p.point(-1, 2, { label: 'A (-1, 2)', dx: -14, dy: 8, anchor: 'end' });
    p.point(5, 10, { label: 'B (5, 10)', dx: -14, dy: -4, anchor: 'end' });
    p.point(2, 6, { label: 'M (2, 6)', dx: 16, dy: 30 });
    return finish(p, {
      id: 'straight-lines-midpoint',
      title: 'The midpoint of A (-1, 2) and B (5, 10)',
      desc: 'A line segment from A (-1, 2) to B (5, 10) with its midpoint M (2, 6) marked. Dashed guides drop from M to x = 2 and across to y = 6. The x-coordinate 2 is halfway between negative 1 and 5, and the y-coordinate 6 is halfway between 2 and 10.',
    });
  },

  'straight-lines-bisector': () => {
    const p = eq({ xmin: -2, xmax: 8, ymid: 1 });
    band(p, 'solid: AB   dashed: 2x - 3y - 3 = 0', 'M (3, 1)');
    p.line(1, 4, 5, -2, { cls: 'curve', clip: false });
    p.straight(2 / 3, -1, { cls: 'curve-b' });
    rightAngle(p, 3, 1, [2, -3], [3, 2]);
    // matching tick marks: AM and MB are equal
    const tick = (x, y) => p.raw(`<line x1="${p.X(x) - 11}" y1="${p.Y(y) - 7}" x2="${p.X(x) + 11}" y2="${p.Y(y) + 7}" style="stroke:var(--ink);stroke-width:3"/>`);
    tick(2, 2.5);
    tick(4, -0.5);
    p.point(1, 4, { label: 'A (1, 4)', dx: 14, dy: -12 });
    p.point(5, -2, { label: 'B (5, -2)', dx: 14, dy: 8 });
    p.point(3, 1, { label: 'M', dx: -18, dy: -10, anchor: 'end' });
    p.text(6.2, 3.1, 'bisector', { cls: 'alt', anchor: 'middle', dx: 4, dy: -30 });
    return finish(p, {
      id: 'straight-lines-bisector',
      title: 'The perpendicular bisector of the line segment from A (1, 4) to B (5, -2)',
      desc: 'A solid line segment AB from A (1, 4) to B (5, -2). Its midpoint M (3, 1) is marked, and matching tick marks show that AM and MB are equal. A dashed line through M crosses AB at a right angle, marked with a small square. This dashed line is the perpendicular bisector of AB.',
    });
  },

  // ---- modelling ----
  'straight-lines-model': () => {
    const p = plane({ grid: false, ticks: false, tickLabels: false, top: 96, height: 520, xmin: -0.4, xmax: 4.5, ymin: -20, ymax: 190, right: 160, xlabel: 't (hours)', ylabel: 'C (pounds)' });
    band(p, 'C = 40 + 30t', 'gradient: 30 pounds for each hour');
    p.line(0, 40, 4, 160, { cls: 'curve', clip: false });
    p.line(1, 70, 2, 70, { cls: 'guide' });
    p.line(2, 70, 2, 100, { cls: 'guide' });
    p.text(1.5, 70, 'across 1 hour', { cls: 'alt', dy: 36 });
    p.text(2, 85, 'up 30 pounds', { cls: 'alt', anchor: 'start', dx: 14, dy: 8 });
    p.point(0, 40, { label: '(0, 40): the call-out fee', dx: 16, dy: 40 });
    return finish(p, {
      id: 'straight-lines-model',
      title: 'A plumber charges a call-out fee plus an hourly rate',
      desc: 'A straight line on a graph of cost C in pounds against time t in hours. It starts at the point (0, 40) on the vertical axis, which is the call-out fee. A dashed guide shows that each extra hour adds 30 pounds, so the gradient is 30 pounds per hour.',
    });
  },

  // ---- flip it ----
  'straight-lines-draw': () => {
    const p = eq({ xmin: -3, xmax: 7, ymid: -0.5 });
    band(p, 'y = 2x - 3', 'find the intercepts, then join them');
    p.straight(2, -3, { cls: 'curve' });
    p.point(0, -3, { label: '(0, -3)', dx: 16, dy: -10 });
    p.point(1.5, 0, { label: '(3/2, 0)', dx: 16, dy: -14 });
    return finish(p, {
      id: 'straight-lines-draw',
      title: 'Drawing the line y = 2x - 3 from its intercepts',
      desc: 'A straight line that rises to the right. It crosses the y-axis at (0, -3) and the x-axis at (3/2, 0). Marking these two points and joining them draws the line.',
    });
  },

  'straight-lines-from-graph': () => {
    const p = eq({ xmin: -3, xmax: 7, ymid: -0.5 });
    p.straight(0.5, -2, { cls: 'curve' });
    p.point(0, -2, { label: '(0, -2)', dx: 16, dy: 34 });
    p.point(4, 0, { label: '(4, 0)', dx: 14, dy: -14 });
    return finish(p, {
      id: 'straight-lines-from-graph',
      title: 'A line through (0, -2) and (4, 0)',
      desc: 'A straight line that rises to the right. It crosses the y-axis at the point (0, -2) and the x-axis at the point (4, 0).',
    });
  },

  // ---- question figures ----
  'straight-lines-q-line': () => {
    const p = eq({ xmin: -5, xmax: 7, ymid: 0.5, top: 50 });
    p.straight(0.5, 0, { cls: 'curve' });
    p.point(-2, -1, { label: '(-2, -1)', dx: 14, dy: 34 });
    p.point(4, 2, { label: '(4, 2)', dx: -14, dy: -14, anchor: 'end' });
    return finish(p, {
      id: 'straight-lines-q-line',
      title: 'A straight line through two marked points',
      desc: 'A straight line that rises to the right. Two points on it are marked: (-2, -1) on the left and (4, 2) on the right.',
    });
  },

  'straight-lines-q-from-graph': () => {
    const p = eq({ xmin: -3, xmax: 9, ymid: 4, top: 50 });
    p.line(-0.5, 11.5, 3.5, -0.5, { cls: 'curve' });
    p.point(1, 7, { label: '(1, 7)', dx: 14, dy: -12 });
    p.point(3, 1, { label: '(3, 1)', dx: 14, dy: -12 });
    return finish(p, {
      id: 'straight-lines-q-from-graph',
      title: 'A straight line through two marked points',
      desc: 'A straight line that falls steeply to the right. Two points on it are marked: (1, 7) near the top and (3, 1) lower down.',
    });
  },

  'straight-lines-q-triangle': () => {
    const p = eq({ xmin: -4, xmax: 8, ymid: 4, top: 50 });
    p.raw(`<polygon class="shade" points="${p.X(0)},${p.Y(1)} ${p.X(4)},${p.Y(3)} ${p.X(2)},${p.Y(7)}" style="stroke:var(--ink);stroke-width:4"/>`);
    p.point(0, 1, { label: 'A (0, 1)', dx: -14, dy: 8, anchor: 'end' });
    p.point(4, 3, { label: 'B (4, 3)', dx: 14, dy: 10 });
    p.point(2, 7, { label: 'C (2, 7)', dx: 14, dy: -8 });
    return finish(p, {
      id: 'straight-lines-q-triangle',
      title: 'Triangle ABC with A (0, 1), B (4, 3) and C (2, 7)',
      desc: 'A shaded triangle with its corners labelled A (0, 1) at the lower left, B (4, 3) at the lower right and C (2, 7) at the top.',
    });
  },

  'straight-lines-q-parallelogram': () => {
    const p = eq({ xmin: -3, xmax: 11, ymid: 4, top: 50 });
    p.line(1, 1, 5, 2, { cls: 'curve', clip: false });
    p.line(5, 2, 7, 6, { cls: 'curve', clip: false });
    p.point(1, 1, { label: 'A (1, 1)', dx: -14, dy: 8, anchor: 'end' });
    p.point(5, 2, { label: 'B (5, 2)', dx: 14, dy: 14 });
    p.point(7, 6, { label: 'C (7, 6)', dx: 14, dy: -8 });
    return finish(p, {
      id: 'straight-lines-q-parallelogram',
      title: 'Three corners of a parallelogram',
      desc: 'Three points joined by two line segments: A (1, 1) at the lower left, B (5, 2) to its right, and C (7, 6) above and to the right of B. The fourth corner, D, is not marked.',
    });
  },
};
