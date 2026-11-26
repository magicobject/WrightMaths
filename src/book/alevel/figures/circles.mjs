// Figures for the Circles topic page (src/pages/books/a-level/circles.html).
// Every circle is drawn from its centre and radius, and every line from its equation or its points.
// Both axes use the SAME scale (see eq() below), so a circle looks round and a right angle looks like one.
// Axes have no scale numbers: the points that matter are labelled on the picture itself.
import { plane } from '../figure-lib.mjs';

const W = 640;
const H = 640;
const LEFT = 64;
const RIGHT = 48;
const BOTTOM = 52;
const DEG = '°';

/**
 * A plane with no grid and no scale numbers and the SAME scale on both axes.
 * x runs from xmin to xmax, and y is centred on ymid. `top` leaves a band above the graph for the equation.
 */
function eq({ xmin, xmax, ymid, top = 130, height = H, ...rest }) {
  const w = W - LEFT - RIGHT;
  const h = height - top - BOTTOM;
  const yr = ((xmax - xmin) * h) / w;
  return plane({ grid: false, ticks: false, tickLabels: false, width: W, height, top, xmin, xmax, ymin: ymid - yr / 2, ymax: ymid + yr / 2, ...rest });
}

/** The equation on the first line and a note on the second, above the graph (the y-axis label sits below both). */
function band(p, left, right = '') {
  p.note(LEFT, 34, left, { cls: 'alt' });
  if (right) p.note(LEFT, 76, right);
}

/**
 * Labels get a halo in the page colour, so a label that crosses an axis or a guide line stays readable.
 * A label with a superscript gets none: the halo of the small raised digit would cut into the letter before it.
 */
const HALO = 'paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round';
const finish = (p, meta) => p.svg(meta).replace(/<text class="svg-t([^>]*)>([\s\S]*?)<\/text>/g, (whole, attrs, body) => (body.includes('<tspan') ? whole : `<text style="${HALO}" class="svg-t${attrs}>${body}</text>`));

/** The circle with centre (a, b) and radius r. */
function circle(p, a, b, r, cls = 'curve') {
  return p.parametric((t) => a + r * Math.cos(t), (t) => b + r * Math.sin(t), 0, 2 * Math.PI, { cls });
}

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

/** A short tick across the segment at (x, y), whose direction is d: equal ticks mark equal lengths. */
function tick(p, x, y, [dx, dy]) {
  const n = Math.hypot(dx, dy);
  const nx = (-dy / n) * 10;
  const ny = (dx / n) * 10;
  p.raw(`<line x1="${(p.X(x) - nx).toFixed(1)}" y1="${(p.Y(y) + ny).toFixed(1)}" x2="${(p.X(x) + nx).toFixed(1)}" y2="${(p.Y(y) - ny).toFixed(1)}" style="stroke:var(--ink);stroke-width:3"/>`);
}

export const FIGURES = {
  // ---- 1. the equation of a circle ----
  'circles-standard': () => {
    const p = eq({ xmin: -5, xmax: 9, ymid: 1 });
    band(p, '(x - 2)^2 + (y - 1)^2 = r^2', 'centre (2, 1)');
    circle(p, 2, 1, 5);
    p.line(2, 1, 5, 5, { cls: 'curve-b', clip: false });
    p.line(2, 1, 2, 5, { cls: 'guide' });
    p.line(2, 5, 5, 5, { cls: 'guide' });
    rightAngle(p, 2, 5, [0, -1], [1, 0]);
    p.text(0.9, 3, 'y - 1', { cls: 'alt', anchor: 'middle', dy: 8 });
    p.text(3.1, 5, 'x - 2', { cls: 'alt', dy: 34 });
    p.text(3.9, 2.8, 'r', { cls: 'alt', anchor: 'start', dx: 6 });
    p.point(2, 1, { label: 'C (2, 1)', dx: 16, dy: 10 });
    p.point(5, 5, { label: 'P (x, y)', dx: 14, dy: -10 });
    return finish(p, {
      id: 'circles-standard',
      title: 'A circle with centre C (2, 1) and a point P (x, y) on it',
      desc: 'A circle with centre C at (2, 1). A dashed radius r runs from C to a point P with coordinates x and y on the circle. Dashed guides make a right-angled triangle: the horizontal side has length x minus 2 and the vertical side has length y minus 1. Pythagoras on this triangle gives the equation of the circle.',
    });
  },

  'circles-signs': () => {
    const p = eq({ xmin: -9, xmax: 5, ymid: 2 });
    band(p, '(x + 3)^2 + (y - 2)^2 = 16', 'centre (-3, 2), radius 4');
    circle(p, -3, 2, 4);
    p.line(-3, 2, 1, 2, { cls: 'curve-b', clip: false });
    p.text(-1, 2, 'r = 4', { cls: 'alt', dy: 36 });
    p.point(-3, 2, { label: 'C (-3, 2)', dx: -14, dy: -14, anchor: 'end' });
    return finish(p, {
      id: 'circles-signs',
      title: 'The circle (x + 3)^2 + (y - 2)^2 = 16',
      desc: 'A circle with centre C at (-3, 2). A dashed radius runs from the centre to the right, labelled r equals 4. The circle lies to the left of the y-axis, because its centre has a negative x-coordinate.',
    });
  },

  // ---- 2. the general form ----
  'circles-general': () => {
    const p = eq({ xmin: -5, xmax: 11, ymid: -2 });
    band(p, 'x^2 + y^2 - 6x + 4y - 12 = 0');
    circle(p, 3, -2, 5);
    p.line(3, -2, 8, -2, { cls: 'curve-b', clip: false });
    p.text(5.5, -2, 'r = 5', { cls: 'alt', dy: 36 });
    p.point(3, -2, { label: 'C (3, -2)', dx: 14, dy: -16 });
    return finish(p, {
      id: 'circles-general',
      title: 'The circle x^2 + y^2 - 6x + 4y - 12 = 0',
      desc: 'A circle with centre C at (3, -2) and radius 5, found by completing the square. A dashed radius runs from the centre to the right and is labelled r equals 5.',
    });
  },

  // ---- 3. the three circle properties ----
  'circles-semicircle': () => {
    const p = eq({ xmin: -6, xmax: 8, ymid: 2 });
    band(p, 'AB is a diameter', `angle APB = 90${DEG}`);
    circle(p, 1, 2, 5);
    p.line(-4, 2, 6, 2, { cls: 'curve-b', clip: false });
    p.line(-4, 2, 4, 6, { cls: 'line', clip: false });
    p.line(4, 6, 6, 2, { cls: 'line', clip: false });
    rightAngle(p, 4, 6, [-8, -4], [2, -4]);
    p.point(-4, 2, { label: 'A', dx: -14, dy: 8, anchor: 'end' });
    p.point(6, 2, { label: 'B', dx: 14, dy: 8 });
    p.point(4, 6, { label: 'P', dx: 12, dy: -12 });
    p.point(1, 2, { label: 'C', dx: -6, dy: 34, anchor: 'end' });
    return finish(p, {
      id: 'circles-semicircle',
      title: 'The angle in a semicircle',
      desc: 'A circle with a dashed diameter AB through its centre C. A point P is on the circle above the diameter. Solid lines join P to A and P to B. They meet at P at a right angle, marked with a small square.',
    });
  },

  'circles-chord': () => {
    const p = eq({ xmin: -5, xmax: 9, ymid: 1 });
    band(p, 'CM meets the chord AB at 90' + DEG, 'AM = MB');
    circle(p, 2, 1, 5);
    p.line(5, 5, 6, -2, { cls: 'line', clip: false });
    p.line(2, 1, 5.5, 1.5, { cls: 'curve-b', clip: false });
    rightAngle(p, 5.5, 1.5, [-3.5, -0.5], [-0.5, 3.5]);
    tick(p, 5.25, 3.25, [1, -7]);
    tick(p, 5.75, -0.25, [1, -7]);
    p.point(5, 5, { label: 'A', dx: 12, dy: -10 });
    p.point(6, -2, { label: 'B', dx: 12, dy: 20 });
    p.point(5.5, 1.5, { label: 'M', dx: 16, dy: -10 });
    p.point(2, 1, { label: 'C', dx: -14, dy: 34, anchor: 'end' });
    return finish(p, {
      id: 'circles-chord',
      title: 'A line from the centre to the midpoint of a chord',
      desc: 'A circle with centre C and a chord AB. A dashed line from C meets the chord at its midpoint M at a right angle, marked with a small square. Matching tick marks on AM and MB show that they are equal in length.',
    });
  },

  'circles-tangent-radius': () => {
    const p = eq({ xmin: -6, xmax: 10, ymid: 3 });
    band(p, `the tangent meets the radius at 90${DEG}`);
    circle(p, 1, 2, 5);
    p.line(4, 6, 1, 2, { cls: 'curve-b', clip: false });
    p.line(4 - 4.4, 6 + 3.3, 4 + 4.4, 6 - 3.3, { cls: 'tangent', clip: true });
    rightAngle(p, 4, 6, [-3, -4], [4, -3]);
    p.point(4, 6, { label: 'P', dx: 14, dy: -12 });
    p.point(1, 2, { label: 'C', dx: -14, dy: 34, anchor: 'end' });
    p.text(7.2, 3.6, 'tangent', { cls: 'alt', anchor: 'start', dx: 6 });
    return finish(p, {
      id: 'circles-tangent-radius',
      title: 'A tangent and the radius to the point of contact',
      desc: 'A circle with centre C. A straight line touches the circle at one point P and is the tangent. A dashed radius runs from C to P. The tangent and the radius meet at P at a right angle, marked with a small square.',
    });
  },

  // ---- 4. tangent and normal ----
  'circles-tangent-normal': () => {
    const p = eq({ xmin: -6, xmax: 10, ymid: 3 });
    band(p, 'tangent: 4x + 3y - 35 = 0', 'normal: 3x - 4y + 5 = 0');

    circle(p, 1, 2, 5);
    p.line(5 - 4.2 * 0.75, 5 + 4.2, 5 + 4.2 * 0.75, 5 - 4.2, { cls: 'tangent', clip: true });
    p.line(5 - 4 * 1.9, 5 - 3 * 1.9, 5 + 4 * 0.4, 5 + 3 * 0.4, { cls: 'curve-b', clip: true });
    rightAngle(p, 5, 5, [-4, -3], [3, -4]);
    p.point(5, 5, { label: 'P (5, 5)', dx: -16, dy: -14, anchor: 'end' });
    p.point(1, 2, { label: 'C (1, 2)', dx: 8, dy: 34 });
    p.text(7.3, 2.6, 'tangent', { cls: 'alt', anchor: 'start' });
    p.text(6.6, 6.2, 'normal', { cls: 'alt', anchor: 'start', dx: 12, dy: -4 });
    return finish(p, {
      id: 'circles-tangent-normal',
      title: 'The tangent and the normal to a circle at P (5, 5)',
      desc: 'A circle with centre C at (1, 2) and a point P at (5, 5) on it. A solid line touching the circle at P is the tangent. A dashed line through P and C is the normal. The two lines meet at P at a right angle, marked with a small square.',
    });
  },

  // ---- 5. a line and a circle ----
  'circles-line-cases': () => {
    const p = eq({ xmin: -7, xmax: 11, ymid: 0 });
    band(p, 'x^2 + y^2 = 25', 'lines with gradient -3/4');
    circle(p, 0, 0, 5);
    p.straight(-0.75, 2.5, { cls: 'curve-c' });
    p.straight(-0.75, 6.25, { cls: 'curve-b' });
    p.straight(-0.75, 8.75, { cls: 'line' });
    p.point(3, 4, {});
    p.text(10.8, -0.75 * 10.8 + 2.5, 'cuts twice', { cls: 'alt', anchor: 'end', dy: 36 });
    p.text(10.8, -0.75 * 10.8 + 6.25, 'touches', { cls: 'alt', anchor: 'end', dy: 36 });
    p.text(9.2, -0.75 * 9.2 + 8.75, 'misses', { cls: 'alt', anchor: 'end', dy: 36 });
    return finish(p, {
      id: 'circles-line-cases',
      title: 'Three lines and a circle: cuts, touches and misses',
      desc: 'A circle with its centre at the origin and radius 5, and three parallel lines that fall to the right. The lowest line, dotted, cuts the circle at two points. The middle line, dashed, touches the circle at one point at the top right of the circle, and is a tangent. The highest line, solid, does not meet the circle at all.',
    });
  },

  // ---- flip it: from a tangent gradient back to the points of contact ----
  'circles-flip-contact': () => {
    const p = eq({ xmin: -8, xmax: 8, ymid: 0 });
    band(p, 'x^2 + y^2 = 25', 'tangents with gradient -3/4');
    circle(p, 0, 0, 5);
    p.straight(-0.75, 6.25, { cls: 'tangent' });
    p.straight(-0.75, -6.25, { cls: 'tangent' });
    p.line(-5.5, -22 / 3, 5.5, 22 / 3, { cls: 'curve-b', clip: true });
    rightAngle(p, 3, 4, [-3, -4], [4, -3]);
    rightAngle(p, -3, -4, [3, 4], [-4, 3]);
    p.point(3, 4, { label: '(3, 4)', dx: 14, dy: -12 });
    p.point(-3, -4, { label: '(-3, -4)', dx: -14, dy: 30, anchor: 'end' });
    p.point(0, 0, { label: 'O', dx: 14, dy: 30 });
    return finish(p, {
      id: 'circles-flip-contact',
      title: 'Two tangents with the same gradient',
      desc: 'A circle with its centre O at the origin and radius 5. Two parallel tangents fall to the right with gradient negative three quarters. One touches the circle at (3, 4) at the upper right and the other at (-3, -4) at the lower left. A dashed line through O and both points of contact meets each tangent at a right angle, marked with small squares.',
    });
  },

  // ---- 6. the circle through three points ----
  'circles-circumcircle': () => {
    const p = eq({ xmin: -5, xmax: 9, ymid: 1, axes: false });
    band(p, 'perpendicular bisectors', 'meet at the centre');
    circle(p, 2, 1, 5);
    p.line(-2, 4, 5, 5, { cls: 'line', clip: false });
    p.line(5, 5, 6, -2, { cls: 'line', clip: false });
    p.line(6, -2, -2, 4, { cls: 'line', clip: false });
    p.straight(-7, 15, { cls: 'curve-b' });
    p.straight(1 / 7, 5 / 7, { cls: 'curve-b' });
    rightAngle(p, 1.5, 4.5, [7, 1], [1, -7], 16);
    rightAngle(p, 5.5, 1.5, [1, -7], [7, 1], 16);
    p.point(-2, 4, { label: 'A', dx: -14, dy: -8, anchor: 'end' });
    p.point(5, 5, { label: 'B', dx: 12, dy: -12 });
    p.point(6, -2, { label: 'C', dx: 12, dy: 24 });
    p.point(2, 1, { label: 'centre', dx: -14, dy: 34, anchor: 'end' });
    return finish(p, {
      id: 'circles-circumcircle',
      title: 'The circle through the three corners of a triangle',
      desc: 'A triangle ABC with all three corners on a circle. Two dashed lines are the perpendicular bisectors of sides AB and BC, each meeting its side at a right angle. The two dashed lines cross at the centre of the circle.',
    });
  },

  // ---- 7. two circles ----
  'circles-two-cross': () => {
    const p = eq({ xmin: -6, xmax: 11, ymid: 0, axes: false });
    band(p, 'radii 5 and 3', 'centres 6 apart');
    circle(p, 0, 0, 5);
    circle(p, 6, 0, 3, 'curve-b');
    p.line(0, 0, 6, 0, { cls: 'guide' });
    const x = 13 / 3;
    const y = Math.sqrt(56) / 3;
    p.point(x, y, {});
    p.point(x, -y, {});
    p.point(0, 0, { label: 'C1', dx: -12, dy: 34, anchor: 'end' });
    p.point(6, 0, { label: 'C2', dx: 12, dy: 34 });
    p.text(3, 0, 'd = 6', { cls: 'alt', dy: -16 });
    return finish(p, {
      id: 'circles-two-cross',
      title: 'Two circles that cross at two points',
      desc: 'A solid circle with centre C1 and radius 5, and a dashed circle with centre C2 and radius 3. The centres are 6 apart on a dashed line labelled d equals 6. The circles overlap and cross at two marked points, one above and one below the line of centres.',
    });
  },

  'circles-two-touch': () => {
    const p = eq({ xmin: -5, xmax: 14, ymid: 0, axes: false });
    band(p, 'radii 3 and 5', 'centres 8 apart');
    circle(p, 0, 0, 3);
    circle(p, 8, 0, 5, 'curve-b');
    p.line(0, 0, 8, 0, { cls: 'guide' });
    p.point(3, 0, { label: 'touch', dx: 0, dy: -18, anchor: 'middle' });
    p.point(0, 0, { label: 'C1', dx: -12, dy: 34, anchor: 'end' });
    p.point(8, 0, { label: 'C2', dx: 12, dy: 34 });
    p.text(1.5, 0, '3', { cls: 'alt', dy: 36 });
    p.text(5.5, 0, '5', { cls: 'alt', dy: 36 });
    return finish(p, {
      id: 'circles-two-touch',
      title: 'Two circles that touch once, from outside',
      desc: 'A solid circle with centre C1 and radius 3, and a dashed circle with centre C2 and radius 5. The centres are 8 apart on a dashed line. The circles touch at exactly one point on that line, marked and labelled touch. The distance 8 is the radius 3 plus the radius 5.',
    });
  },

  // ---- question figures ----
  'circles-q-circle': () => {
    const p = eq({ xmin: -8, xmax: 8, ymid: 2, top: 50 });
    circle(p, -1, 2, 5);
    p.point(-1, 2, { label: 'C (-1, 2)', dx: -14, dy: -14, anchor: 'end' });
    p.point(2, 6, { label: 'P (2, 6)', dx: 14, dy: -10 });
    return finish(p, {
      id: 'circles-q-circle',
      title: 'A circle with its centre and one point on it',
      desc: 'A circle with its centre C marked at (-1, 2). A point P at (2, 6) is marked on the circle, at the upper right.',
    });
  },

  'circles-q-tangent': () => {
    const p = eq({ xmin: -8, xmax: 8, ymid: 0, top: 50 });
    circle(p, 0, 0, 5);
    p.point(0, 0, { label: 'O', dx: -12, dy: 34, anchor: 'end' });
    p.point(3, 4, { label: 'P (3, 4)', dx: 14, dy: -10 });
    return finish(p, {
      id: 'circles-q-tangent',
      title: 'A circle with its centre at the origin and a point P on it',
      desc: 'A circle with its centre O at the origin. A point P at (3, 4) is marked on the circle, at the upper right. No tangent is drawn.',
    });
  },

  'circles-q-triangle': () => {
    const p = eq({ xmin: -3, xmax: 11, ymid: 3, top: 50 });
    p.line(0, 0, 8, 0, { cls: 'curve', clip: false });
    p.line(0, 0, 0, 6, { cls: 'curve', clip: false });
    p.line(8, 0, 0, 6, { cls: 'curve', clip: false });
    rightAngle(p, 0, 0, [1, 0], [0, 1]);
    p.point(0, 0, { label: 'A (0, 0)', dx: -14, dy: 34, anchor: 'end' });
    p.point(8, 0, { label: 'B (8, 0)', dx: 14, dy: 34 });
    p.point(0, 6, { label: 'C (0, 6)', dx: 16, dy: -10 });
    return finish(p, {
      id: 'circles-q-triangle',
      title: 'Triangle ABC with a right angle at A',
      desc: 'A triangle with corners A (0, 0) at the origin, B (8, 0) on the x-axis and C (0, 6) on the y-axis. The angle at A is a right angle, marked with a small square.',
    });
  },
};
