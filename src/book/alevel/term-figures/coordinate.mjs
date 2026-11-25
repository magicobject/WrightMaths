// Pictures for coordinate glossary terms (hover pop-up and glossary page): { '<term-id>': '<svg ...>' }.
// Draw with plane() or numberLine() from ../figure-lib.mjs at a small size, for example plane({ width: 360, height: 250, ... }).svg({ cls: 'graph-svg term-svg', ... }).
// Keys must be ids of terms in ../glossary/coordinate.mjs. The title and desc describe the picture.
//
// Every picture here has the SAME scale on both axes (so a right angle looks like one and a gradient looks like its
// number). eq() builds such a plane. Lines and circles are drawn from their equations or from coordinates.
// Long labels go in a caption strip at the foot of the picture (cap()), so they never collide with the drawing.
import { plane } from '../figure-lib.mjs';

const W = 360;
const H = 330;
const o = (id, title, desc) => ({ id: `tf-${id}`, title, desc, cls: 'graph-svg term-svg' });
const f = (n) => (Math.round(n * 100) / 100).toString();
const DEG = '\u00b0';

/** Caption lines in the strip at the foot of the picture (pixel coordinates). */
function cap(p, ...lines) {
  lines.forEach((t, i) => p.note(W / 2, H - 12 - (lines.length - 1 - i) * 28, t, { anchor: 'middle' }));
  return p;
}

/** A plane with equal scales on both axes: x runs from xmin to xmax and y is centred on cy. */
function eq({ xmin, xmax, cy, left = 40, right = 36, top = 24, bottom = 72, ...rest }) {
  const half = (((xmax - xmin) * (H - top - bottom)) / (W - left - right)) / 2;
  return plane({ xmin, xmax, ymin: cy - half, ymax: cy + half, width: W, height: H, left, right, top, bottom, ...rest });
}
/** A bare plane for geometry with no axes or numbers (circles, chords). */
const bare = (opts) => eq({ axes: false, grid: false, ticks: false, ...opts });
/** Axes only: no grid, no numbers. */
const axesOnly = (opts) => eq({ grid: false, ticks: false, ...opts });

/** y = m x + c drawn only inside the picture. */
function lineIn(p, m, c, cls = 'line') {
  if (m === 0) return p.line(p.xmin, c, p.xmax, c, { cls });
  const a = (p.ymin - c) / m;
  const b = (p.ymax - c) / m;
  const from = Math.max(p.xmin, Math.min(a, b));
  const to = Math.min(p.xmax, Math.max(a, b));
  return p.line(from, m * from + c, to, m * to + c, { cls });
}

/** A small square marking a right angle at (vx, vy), between directions u and w (graph units, equal scales). */
function rightAngle(p, [vx, vy], [ux, uy], [wx, wy], s = 15) {
  const nu = Math.hypot(ux, uy);
  const nw = Math.hypot(wx, wy);
  const U = [(ux / nu) * s, (-uy / nu) * s];
  const W2 = [(wx / nw) * s, (-wy / nw) * s];
  const V = [p.X(vx), p.Y(vy)];
  const pts = [[V[0] + U[0], V[1] + U[1]], [V[0] + U[0] + W2[0], V[1] + U[1] + W2[1]], [V[0] + W2[0], V[1] + W2[1]]];
  return p.raw(`<polyline class="line" style="stroke-width:2.5" points="${pts.map(([a, b]) => `${f(a)},${f(b)}`).join(' ')}"/>`);
}

/** A short tick across a segment at (x, y); `dir` is the direction of the segment (marks equal lengths). */
function tick(p, x, y, [dx, dy]) {
  const n = Math.hypot(dx, dy);
  const nx = (-dy / n) * 9;
  const ny = (-dx / n) * 9; // pixel y is flipped
  return p.raw(`<line class="line" style="stroke-width:2.5" x1="${f(p.X(x) - nx)}" y1="${f(p.Y(y) + ny)}" x2="${f(p.X(x) + nx)}" y2="${f(p.Y(y) - ny)}"/>`);
}

// ---------- circle drawings (centre (0, 0), radius R) ----------
const R = 2.8;
const rad = (deg) => (deg * Math.PI) / 180;
const onCircle = (deg) => [R * Math.cos(rad(deg)), R * Math.sin(rad(deg))];
/** A circle with its centre dot C; `draw` adds the rest and `lines` is the caption. */
function circleFig(id, title, desc, lines, draw) {
  const p = bare({ xmin: -4.6, xmax: 4.6, cy: 0 });
  p.parametric((t) => R * Math.cos(t), (t) => R * Math.sin(t), 0, 2 * Math.PI);
  p.point(0, 0, { label: 'C', dx: -26, dy: 6 });
  draw(p);
  cap(p, ...lines);
  return p.svg(o(id, title, desc));
}
/** The tangent at the point at `deg` degrees: a segment `half` long each side, and its direction. */
function tangentAt(p, deg, half, cls = 'tangent') {
  const [x, y] = onCircle(deg);
  const d = [-Math.sin(rad(deg)), Math.cos(rad(deg))];
  p.line(x - half * d[0], y - half * d[1], x + half * d[0], y + half * d[1], { cls });
  return { x, y, d };
}

// ---------- parametric curves ----------
function parabolaFig(id, title, desc, ...lines) {
  const p = plane({ width: W, height: H, left: 20, right: 36, top: 24, bottom: 96, xmin: -4.5, xmax: 7.5, ymin: -2, ymax: 10, axes: true, grid: false, ticks: false });
  p.parametric((t) => 2 * t, (t) => t * t, -1.6, 3.1);
  const where = { '-1': [-12, 28, 'end'], 0: [-12, 34, 'end'], 1: [10, 46, 'start'], 2: [14, 30, 'start'], 3: [-14, 8, 'end'] };
  for (const t of [-1, 0, 1, 2, 3]) p.point(2 * t, t * t, { label: `t = ${t}`, dx: where[t][0], dy: where[t][1], anchor: where[t][2], cls: 'small' });
  cap(p, ...lines);
  return p.svg(o(id, title, desc));
}

export const FIGS = {
  gradient: (() => {
    const p = axesOnly({ xmin: -1, xmax: 5, cy: 1 });
    lineIn(p, 2, -1);
    p.line(1, 1, 2, 1, { cls: 'guide' }).line(2, 1, 2, 3, { cls: 'guide' });
    p.point(1, 1).point(2, 3);
    p.text(1.5, 1, 'run 1', { cls: 'small', dy: 30 });
    p.text(2.1, 2, 'rise 2', { cls: 'small', anchor: 'start', dx: 4 });
    cap(p, 'gradient = rise \u00f7 run', '= 2 \u00f7 1 = 2');
    return p.svg(o('gradient', 'Gradient: rise divided by run', 'A straight line rising to the right. From one point on it, a dashed step goes 1 across (run) and then 2 up (rise). The caption says the gradient is rise divided by run, which is 2 divided by 1, which is 2.'));
  })(),

  'angle-of-inclination': (() => {
    const p = axesOnly({ xmin: -1, xmax: 6, cy: 1.5 });
    lineIn(p, 0.75, 0);
    const r = 70;
    const a = Math.atan(0.75);
    p.raw(`<path class="line" style="stroke-width:3" d="M${f(p.X(0) + r)} ${f(p.Y(0))} A${r} ${r} 0 0 0 ${f(p.X(0) + r * Math.cos(a))} ${f(p.Y(0) - r * Math.sin(a))}"/>`);
    p.text(0, 0, '\u03b8', { anchor: 'start', dx: 82, dy: -10 });
    cap(p, 'gradient = tan \u03b8', 'here tan \u03b8 = 0.75');
    return p.svg(o('angle-of-inclination', 'Angle of inclination', 'A straight line rising to the right from the x-axis. The angle between the line and the x-axis is marked with an arc and labelled theta. The caption says the gradient equals tan theta, which is 0.75 for this line.'));
  })(),

  'y-intercept': (() => {
    const p = axesOnly({ xmin: -2, xmax: 5, cy: 2 });
    lineIn(p, 0.5, 2, 'curve');
    p.point(0, 2, { label: '(0, 2)', dx: 14, dy: -14 });
    cap(p, 'y = x/2 + 2', 'y-intercept: (0, 2)');
    return p.svg(o('y-intercept', 'The y-intercept', 'A straight line crossing the y-axis at the point (0, 2), which is marked with a dot. The line is y = x/2 + 2.'));
  })(),

  'x-intercept': (() => {
    const p = axesOnly({ xmin: -2, xmax: 6, cy: 1 });
    lineIn(p, 1, -3, 'curve');
    p.point(3, 0, { label: '(3, 0)', dx: 12, dy: -14 });
    cap(p, 'y = x - 3', 'x-intercept: (3, 0)');
    return p.svg(o('x-intercept', 'The x-intercept', 'A straight line crossing the x-axis at the point (3, 0), which is marked with a dot. The line is y = x - 3.'));
  })(),

  'equation-of-a-line': (() => {
    const p = axesOnly({ xmin: -2, xmax: 4, cy: 2.5 });
    lineIn(p, 2, 1, 'curve');
    p.point(0, 1, { label: 'c', dx: -22, dy: 22 });
    p.line(1, 3, 2, 3, { cls: 'guide' }).line(2, 3, 2, 5, { cls: 'guide' });
    p.text(1.5, 3, '1', { cls: 'small', dy: 28 });
    p.text(2.1, 4, '2', { cls: 'small', anchor: 'start', dx: 2 });
    cap(p, 'y = 2x + 1', 'gradient m = 2, c = 1');
    return p.svg(o('equation-of-a-line', 'y = mx + c', 'The line y = 2x + 1. It crosses the y-axis at 1, marked c. A dashed step shows that going 1 across takes the line 2 up, so the gradient m is 2.'));
  })(),

  'point-gradient-form': (() => {
    const p = axesOnly({ xmin: -1, xmax: 6, cy: 1 });
    lineIn(p, 2, -3, 'curve');
    p.point(2, 1, { label: '(x\u2081, y\u2081)', dx: 14, dy: 34 });
    cap(p, 'm = 2 through (2, 1)', 'y - 1 = 2(x - 2)');
    return p.svg(o('point-gradient-form', 'The point-gradient form', 'A straight line of gradient 2 through the point (2, 1), which is marked and labelled (x1, y1). The line has equation y - 1 = 2(x - 2).'));
  })(),

  'parallel-lines': (() => {
    const p = axesOnly({ xmin: -3, xmax: 5, cy: 1.5 });
    lineIn(p, 2, 1, 'curve');
    lineIn(p, 2, -2, 'curve-b');
    cap(p, 'solid: y = 2x + 1', 'dashed: y = 2x - 2');
    return p.svg(o('parallel-lines', 'Parallel lines', 'Two straight lines that rise at the same rate and never meet. One is solid, y = 2x + 1. The other is dashed, y = 2x - 2. Both have gradient 2.'));
  })(),

  perpendicular: (() => {
    const p = axesOnly({ xmin: -3, xmax: 5, cy: 2 });
    lineIn(p, 2, 0, 'curve');
    lineIn(p, -0.5, 2.5, 'curve-b');
    rightAngle(p, [1, 2], [1, 2], [-2, 1]);
    p.point(1, 2);
    cap(p, 'gradients 2 and -1/2', '2 \u00d7 (-1/2) = -1');
    return p.svg(o('perpendicular', 'Perpendicular lines', 'Two straight lines meeting at a right angle, marked with a small square. The solid line has gradient 2. The dashed line has gradient minus one half. Their gradients multiply to give minus 1.'));
  })(),

  'negative-reciprocal': (() => {
    const p = axesOnly({ xmin: -4, xmax: 5, cy: 1.5 });
    lineIn(p, 3, 0, 'curve');
    lineIn(p, -1 / 3, 10 / 3, 'curve-b');
    rightAngle(p, [1, 3], [1, 3], [-3, 1]);
    cap(p, 'gradients 3 and -1/3', 'turn over, change the sign');
    return p.svg(o('negative-reciprocal', 'Negative reciprocal', 'Two lines at a right angle. The solid one has gradient 3. The dashed one has gradient minus one third: the gradient 3 turned upside down and with its sign changed.'));
  })(),

  'line-segment': (() => {
    const p = bare({ xmin: -1, xmax: 7, cy: 2 });
    p.line(-0.8, -0.2, 6.8, 4.2, { cls: 'curve-b' });
    p.line(1, 1, 5, 3.3, { cls: 'curve' });
    p.point(1, 1, { label: 'A', dx: 14, dy: 30 }).point(5, 3.3, { label: 'B', dx: 14, dy: 28 });
    cap(p, 'solid: line segment AB', 'dashed: the line goes on');
    return p.svg(o('line-segment', 'Line segment', 'A straight line drawn as a dashed line that continues past both ends, with a solid part between two dots labelled A and B. The solid part is the line segment AB.'));
  })(),

  midpoint: (() => {
    const p = axesOnly({ xmin: -1, xmax: 7, cy: 2.5 });
    p.line(1, 1, 5, 4, { cls: 'curve' });
    p.point(1, 1, { label: 'A', dx: 12, dy: 30 });
    p.point(5, 4, { label: 'B', dx: 14, dy: 0 });
    p.point(3, 2.5, { label: 'M', dx: 14, dy: 32 });
    cap(p, 'A (1, 1)   B (5, 4)', 'M (3, 2.5) is halfway');
    return p.svg(o('midpoint', 'The midpoint of a line segment', 'A line segment from A at (1, 1) to B at (5, 4). The point M at (3, 2.5) is halfway along it. Its x-coordinate is halfway between 1 and 5, and its y-coordinate is halfway between 1 and 4.'));
  })(),

  distance: (() => {
    const p = axesOnly({ xmin: -1, xmax: 7, cy: 2.5 });
    p.line(1, 1, 5, 4, { cls: 'curve' });
    p.line(1, 1, 5, 1, { cls: 'guide' }).line(5, 1, 5, 4, { cls: 'guide' });
    rightAngle(p, [5, 1], [-1, 0], [0, 1]);
    p.point(1, 1, { label: 'A', dx: -24, dy: 8 }).point(5, 4, { label: 'B', dx: 12, dy: -10 });
    p.text(3, 1, '4', { dy: 30 });
    p.text(5, 2.5, '3', { anchor: 'start', dx: 14, dy: 8 });
    cap(p, 'AB = \u221a(4\u00b2 + 3\u00b2) = 5');
    return p.svg(o('distance', 'Distance between two points', 'A line from A at (1, 1) to B at (5, 4). Dashed lines make a right-angled triangle: 4 across and 3 up. By Pythagoras the distance AB is 5.'));
  })(),

  'perpendicular-bisector': (() => {
    const p = bare({ xmin: -1, xmax: 7, cy: 2 });
    p.line(1, 1, 5, 3, { cls: 'curve' });
    lineIn(p, -2, 8, 'curve-b');
    rightAngle(p, [3, 2], [2, 1], [-1, 2]);
    tick(p, 2, 1.5, [2, 1]);
    tick(p, 4, 2.5, [2, 1]);
    p.point(1, 1, { label: 'A', dx: -24, dy: 14 }).point(5, 3, { label: 'B', dx: 14, dy: 28 });
    p.point(3, 2, { label: 'M', dx: 16, dy: 34 });
    cap(p, 'dashed line: perpendicular', 'bisector of AB');
    return p.svg(o('perpendicular-bisector', 'Perpendicular bisector', 'A segment AB with its midpoint M. A dashed line through M crosses AB at a right angle, marked with a small square. Matching tick marks show that AM and MB are the same length.'));
  })(),

  'linear-model': (() => {
    const p = plane({ width: W, height: H, left: 44, right: 52, top: 24, bottom: 110, xmin: 0, xmax: 6, ymin: 0, ymax: 16, xstep: 2, ystep: 4, xlabel: 'km', ylabel: '\u00a3' });
    p.curve((x) => 3 + 2 * x, { from: 0, to: 6 });
    p.point(0, 3, { label: '3', dx: 14, dy: -14 });
    cap(p, 'fare = 3 + 2 \u00d7 distance', 'start fee 3, then 2 per km');
    return p.svg(o('linear-model', 'A linear model', 'A graph of a taxi fare in pounds against distance in kilometres. It is a straight line starting at 3 on the fare axis and rising by 2 for every kilometre. The fixed charge is the intercept and the rate is the gradient.'));
  })(),

  circle: circleFig('circle', 'A circle', 'A circle with its centre marked C. A line from the centre to the edge is labelled r for radius. Every point on the circle is the same distance r from the centre.', ['every point is r from C'], (p) => {
    const [x, y] = onCircle(35);
    p.line(0, 0, x, y, { cls: 'tangent' });
    p.text(x / 2, y / 2, 'r', { anchor: 'end', dx: -6, dy: -8 });
    for (const a of [100, 200, 310]) p.point(...onCircle(a));
  }),

  centre: circleFig('centre', 'The centre of a circle', 'A circle with a dot at its middle, labelled C for the centre. Dashed lines from the centre to the circle are all the same length.', ['C is the centre'], (p) => {
    for (const a of [20, 110, 200, 290]) p.line(0, 0, ...onCircle(a), { cls: 'guide' });
  }),

  radius: circleFig('radius', 'The radius of a circle', 'A circle with its centre C. A thick line from the centre to a point on the circle is the radius.', ['red line: a radius'], (p) => {
    const [x, y] = onCircle(30);
    p.line(0, 0, x, y, { cls: 'tangent' });
    p.point(x, y);
  }),

  diameter: circleFig('diameter', 'The diameter of a circle', 'A circle with a thick line passing through its centre C from one side of the circle to the other. The line is the diameter and is twice the radius.', ['red line: a diameter', 'its length is 2r'], (p) => {
    const [x, y] = onCircle(20);
    p.line(-x, -y, x, y, { cls: 'tangent' });
    p.point(x, y).point(-x, -y);
  }),

  chord: circleFig('chord', 'A chord of a circle', 'A circle with a thick straight line joining two points on the circle. The line does not pass through the centre C. It is a chord.', ['red line: a chord'], (p) => {
    const [x1, y1] = onCircle(160);
    const [x2, y2] = onCircle(20);
    p.line(x1, y1, x2, y2, { cls: 'tangent' });
    p.point(x1, y1).point(x2, y2);
  }),

  tangent: circleFig('tangent', 'A tangent to a circle', 'A circle with a straight line that touches it at exactly one point and does not cut through it. That line is the tangent. A dashed radius runs from the centre C to the point where the line touches.', ['red line: a tangent', 'it touches at one point'], (p) => {
    const { x, y } = tangentAt(p, 50, 2.3);
    p.line(0, 0, x, y, { cls: 'guide' });
    p.point(x, y);
  }),

  'point-of-contact': circleFig('point-of-contact', 'Point of contact', 'A circle and a tangent line. The one point where the line touches the circle is marked with a dot and labelled T.', ['T: the point of contact'], (p) => {
    const { x, y } = tangentAt(p, 50, 2.3);
    p.point(x, y, { label: 'T', dx: 16, dy: -8 });
  }),

  normal: circleFig('normal', 'The normal to a circle', 'A circle with a dashed tangent line touching it at one point. A solid red line, the normal, meets the tangent at that point at a right angle. The normal passes through the centre C of the circle.', ['red: normal   dashed: tangent', 'the normal goes through C'], (p) => {
    const { x, y } = tangentAt(p, 50, 2.2, 'curve-b');
    const a = rad(50);
    p.line(-3.4 * Math.cos(a), -3.4 * Math.sin(a), x + Math.cos(a), y + Math.sin(a), { cls: 'tangent' });
    rightAngle(p, [x, y], [-Math.cos(a), -Math.sin(a)], [-Math.sin(a), Math.cos(a)]);
    p.point(x, y);
  }),

  'angle-in-semicircle': circleFig('angle-in-semicircle', 'The angle in a semicircle', 'A circle with a dashed diameter AB through its centre C. A point P is on the circle. Lines from P to A and from P to B meet at P at a right angle, marked with a small square and labelled 90 degrees.', ['the angle at P is 90' + DEG], (p) => {
    const P = onCircle(65);
    p.line(-R, 0, R, 0, { cls: 'guide' });
    p.line(-R, 0, ...P, { cls: 'tangent' }).line(...P, R, 0, { cls: 'tangent' });
    rightAngle(p, P, [-R - P[0], -P[1]], [R - P[0], -P[1]]);
    p.point(-R, 0, { label: 'A', dx: -10, dy: 34, anchor: 'end' }).point(R, 0, { label: 'B', dx: 10, dy: 34 }).point(...P, { label: 'P', dx: 14, dy: -8 });
  }),

  'chord-bisector-property': circleFig('chord-bisector-property', 'A line from the centre, at right angles to a chord, bisects it', 'A circle with a chord AB. A dashed line from the centre C meets the chord at M at a right angle, marked with a small square. Matching tick marks show that AM and MB are equal.', ['AM = MB (tick marks)'], (p) => {
    const h = 1.6;
    const w = Math.sqrt(R * R - h * h);
    p.line(-w, h, w, h, { cls: 'tangent' });
    p.line(0, 0, 0, h, { cls: 'curve-b' });
    rightAngle(p, [0, h], [0, -1], [1, 0]);
    tick(p, -w / 2, h, [1, 0]);
    tick(p, w / 2, h, [1, 0]);
    p.point(-w, h, { label: 'A', dx: -10, dy: -10, anchor: 'end' }).point(w, h, { label: 'B', dx: 10, dy: -10 });
    p.point(0, h, { label: 'M', dx: -8, dy: -16, anchor: 'end' });
  }),

  'tangent-radius-property': circleFig('tangent-radius-property', 'A tangent is perpendicular to the radius', 'A circle with a tangent touching it at the point T. The radius from the centre C to T is dashed. The radius and the tangent meet at T at a right angle, marked with a small square.', ['dashed: radius   red: tangent'], (p) => {
    const { x, y, d } = tangentAt(p, 30, 2);
    const a = rad(30);
    p.line(0, 0, x, y, { cls: 'curve-b' });
    rightAngle(p, [x, y], [-Math.cos(a), -Math.sin(a)], [d[0], d[1]]);
    p.point(x, y, { label: 'T', dx: 16, dy: -4 });
  }),

  'line-circle-intersection': (() => {
    const p = plane({ xmin: 0, xmax: 360, ymin: 0, ymax: 1, width: W, height: 230, left: 0, right: 0, top: 0, bottom: 0, axes: false, grid: false, ticks: false });
    const cx = [62, 180, 298];
    const cy = 100;
    const r = 42;
    const lines = [26, 42, 62];
    const names = ['2 points', '1 point', '0 points'];
    cx.forEach((x, i) => {
      p.raw(`<circle class="curve" cx="${x}" cy="${cy}" r="${r}" style="fill:none"/>`);
      p.raw(`<line class="line" x1="${x - 52}" y1="${cy - lines[i]}" x2="${x + 52}" y2="${cy - lines[i]}"/>`);
      p.raw(`<text class="svg-t small" x="${x}" y="${cy + 74}" text-anchor="middle">${names[i]}</text>`);
    });
    const half = Math.sqrt(r * r - 26 * 26);
    for (const [x, y] of [[62 - half, cy - 26], [62 + half, cy - 26], [180, cy - 42]]) p.raw(`<circle class="pt" cx="${f(x)}" cy="${f(y)}" r="6"/>`);
    p.raw(`<text class="svg-t small" x="180" y="${cy + 112}" text-anchor="middle">cuts, touches (tangent), misses</text>`);
    return p.svg(o('line-circle-intersection', 'A line and a circle', 'Three small drawings of a circle and a straight line. In the first the line cuts the circle at 2 points. In the second it touches the circle at 1 point, so it is a tangent. In the third it misses the circle: 0 points.'));
  })(),

  'circle-equation': (() => {
    const p = eq({ xmin: -2, xmax: 6, cy: 1, xstep: 2, ystep: 1, bottom: 100 });
    p.parametric((t) => 2 + 2 * Math.cos(t), (t) => 1 + 2 * Math.sin(t), 0, 2 * Math.PI);
    p.line(2, 1, 4, 1, { cls: 'tangent' });
    p.point(2, 1);
    cap(p, 'centre (2, 1), radius 2', '(x - 2)\u00b2 + (y - 1)\u00b2 = 4');
    return p.svg(o('circle-equation', 'The equation of a circle', 'A circle with centre (2, 1) and radius 2, drawn on axes. The centre is marked and a radius to the right is drawn. Its equation is (x - 2)^2 + (y - 1)^2 = 4.'));
  })(),

  'circle-general-form': (() => {
    const p = eq({ xmin: -3, xmax: 7, cy: 1, xstep: 2, ystep: 1, bottom: 100 });
    p.parametric((t) => 2 + 3 * Math.cos(t), (t) => 1 + 3 * Math.sin(t), 0, 2 * Math.PI);
    p.line(2, 1, 2 + 3 * Math.cos(0.9), 1 + 3 * Math.sin(0.9), { cls: 'tangent' });
    p.point(2, 1);
    cap(p, 'centre (2, 1), radius 3', 'x\u00b2 + y\u00b2 - 4x - 2y - 4 = 0');
    return p.svg(o('circle-general-form', 'A circle from its general form', 'A circle with centre (2, 1) and radius 3. Its equation in general form is x^2 + y^2 - 4x - 2y - 4 = 0, which completing the square turns into (x - 2)^2 + (y - 1)^2 = 9.'));
  })(),

  parameter: parabolaFig(
    'parameter',
    'A parameter',
    'A curve drawn from x = 2t and y = t squared. Five points on it are marked and labelled with the value of the parameter t that gives them: t = -1, 0, 1, 2 and 3. As t grows, the point moves along the curve.',
    'x = 2t, y = t\u00b2',
    'each t gives one point',
  ),

  'parametric-equations': (() => {
    const p = axesOnly({ xmin: -4.6, xmax: 4.6, cy: 0 });
    p.parametric((t) => 3 * Math.cos(t), (t) => 3 * Math.sin(t), 0, 2 * Math.PI);
    const mark = [[0, 't = 0', 14, 30, 'start'], [Math.PI / 2, 't = \u03c0/2', 14, -6, 'start'], [Math.PI, 't = \u03c0', -14, 30, 'end'], [(3 * Math.PI) / 2, 't = 3\u03c0/2', 14, 22, 'start']];
    for (const [t, text, dx, dy, anchor] of mark) p.point(3 * Math.cos(t), 3 * Math.sin(t), { label: text, dx, dy, anchor, cls: 'small' });
    cap(p, 'x = 3 cos t, y = 3 sin t');
    return p.svg(o('parametric-equations', 'Parametric equations of a circle', 'A circle of radius 3 centred on the origin, drawn from x = 3 cos t and y = 3 sin t. Four points are labelled with the parameter value that gives them: t = 0 on the right, pi over 2 at the top, pi on the left, and 3 pi over 2 at the bottom.'));
  })(),

  'cartesian-equation': parabolaFig(
    'cartesian-equation',
    'The Cartesian equation of a parametric curve',
    'The curve given parametrically by x = 2t and y = t squared. After the parameter is eliminated, the same curve has the Cartesian equation y = x squared over 4, which is given in the caption.',
    'x = 2t, y = t\u00b2 becomes',
    'y = x\u00b2/4',
  ),
};
