// Pictures for vector glossary terms (hover pop-up and glossary page): { '<term-id>': '<svg ...>' }.
// Draw with plane() or numberLine() from ../figure-lib.mjs at a small size, for example plane({ width: 360, height: 250, ... }).svg({ cls: 'graph-svg term-svg', ... }).
// Keys must be ids of terms in ../glossary/vectors.mjs. The title and desc describe the picture.
//
// Vectors are drawn as arrows (arrow() below) on planes with the same scale on both axes. The three-dimensional pictures use a
// simple oblique projection (see axes3d). Long labels go in a caption strip at the foot of the picture (cap()).
import { plane } from '../figure-lib.mjs';

const W = 360;
const H = 330;
const o = (id, title, desc) => ({ id: `tf-${id}`, title, desc, cls: 'graph-svg term-svg' });
const f = (n) => (Math.round(n * 100) / 100).toString();
const COLOUR = { ink: 'var(--ink)', strand: 'var(--strand,var(--navy))', red: 'var(--c-oops)' };

function cap(p, ...lines) {
  lines.forEach((t, i) => p.note(W / 2, H - 12 - (lines.length - 1 - i) * 28, t, { anchor: 'middle' }));
  return p;
}

/** A plane with the same scale on both axes: x runs from xmin to xmax and y is centred on cy. */
function eq({ xmin, xmax, cy, left = 40, right = 36, top = 24, bottom = 72, ...rest }) {
  const half = (((xmax - xmin) * (H - top - bottom)) / (W - left - right)) / 2;
  return plane({ xmin, xmax, ymin: cy - half, ymax: cy + half, width: W, height: H, left, right, top, bottom, ...rest });
}
const bare = (opts) => eq({ axes: false, grid: false, ticks: false, ...opts });

/** An arrow in pixel coordinates, from (x1, y1) to (x2, y2). */
function arrowPx(x1, y1, x2, y2, { colour = 'strand', width = 5, dash = '' } = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const head = 17;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const c = COLOUR[colour];
  return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(bx + ux * 2)}" y2="${f(by + uy * 2)}" style="stroke:${c};stroke-width:${width};stroke-linecap:round;${dash ? `stroke-dasharray:${dash};` : ''}"/>`
    + `<polygon points="${f(x2)},${f(y2)} ${f(bx - uy * 9)},${f(by + ux * 9)} ${f(bx + uy * 9)},${f(by - ux * 9)}" style="fill:${c}"/>`;
}
/** An arrow between two points in graph coordinates. */
const arrow = (p, x1, y1, x2, y2, opts) => p.raw(arrowPx(p.X(x1), p.Y(y1), p.X(x2), p.Y(y2), opts));

/** Short guide steps for the across and up parts of a vector from (x, y). */
function legs(p, x, y, dx, dy) {
  return p.line(x, y, x + dx, y, { cls: 'guide' }).line(x + dx, y, x + dx, y + dy, { cls: 'guide' });
}

/** A column of numbers in brackets at pixel (x, y), for pictures that need a column vector. */
function column(p, x, y, values) {
  const n = values.length;
  const rows = values.map((v, i) => `<text class="svg-t" x="${f(x)}" y="${f(y + 8 + i * 30)}" text-anchor="middle">${v}</text>`).join('');
  const top = y - 18;
  const bottom = y + (n - 1) * 30 + 22;
  const lx = x - 24;
  const rx = x + 24;
  const br = (xx, dir) => `<path class="line" style="stroke-width:3" d="M${f(xx + dir * 8)} ${f(top)} Q${f(xx)} ${f(top)} ${f(xx)} ${f(top + 12)} L${f(xx)} ${f(bottom - 12)} Q${f(xx)} ${f(bottom)} ${f(xx + dir * 8)} ${f(bottom)}"/>`;
  return p.raw(rows + br(lx, 1) + br(rx, -1));
}

// ---------- three dimensions: oblique projection ----------
// Pixel steps for one unit along x (towards the viewer), y (right) and z (up).
const EX = [-30, 22];
const EY = [52, 0];
const EZ = [0, -40];
const at3 = (O, x, y, z) => [O[0] + x * EX[0] + y * EY[0] + z * EZ[0], O[1] + x * EX[1] + y * EY[1] + z * EZ[1]];
const seg = (a, b, cls = 'line', extra = '') => `<line class="${cls}" ${extra} x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`;
const t3 = (pt, s, dx = 0, dy = 0, cls = '') => `<text class="svg-t ${cls}" x="${f(pt[0] + dx)}" y="${f(pt[1] + dy)}" text-anchor="middle">${s}</text>`;

function axes3d(O, lens = [2.4, 3.0, 3.6]) {
  let s = '';
  const ends = [at3(O, lens[0], 0, 0), at3(O, 0, lens[1], 0), at3(O, 0, 0, lens[2])];
  ends.forEach((e) => { s += arrowPx(O[0], O[1], e[0], e[1], { colour: 'ink', width: 3 }); });
  s += t3(ends[0], 'x', -14, 10) + t3(ends[1], 'y', 18, 8) + t3(ends[2], 'z', 0, -12);
  return { s, ends };
}

function box3(id, title, desc, lines, draw) {
  const p = bare({ xmin: 0, xmax: 1, cy: 0 });
  p.raw(draw());
  cap(p, ...lines);
  return p.svg(o(id, title, desc));
}

// ---------- shared pictures ----------
/** Two vectors added: a from the origin, then b from the head of a, and the sum. */
function addFig(id, title, desc, lines, sumLabel, at = [2.5, 2, 'end', -14, -6]) {
  const p = bare({ xmin: -1, xmax: 6.4, cy: 2.2 });
  arrow(p, 0, 0, 3, 1, { colour: 'strand' });
  arrow(p, 3, 1, 5, 4, { colour: 'ink' });
  arrow(p, 0, 0, 5, 4, { colour: 'red' });
  p.point(0, 0).point(3, 1).point(5, 4);
  p.text(1.5, 0.5, 'a', { cls: 'big', dy: 30, dx: 4 });
  p.text(4, 2.5, 'b', { cls: 'big', anchor: 'start', dx: 14, dy: 8 });
  p.text(at[0], at[1], sumLabel, { cls: 'big', anchor: at[2], dx: at[3], dy: at[4] });
  cap(p, ...lines);
  return p.svg(o(id, title, desc));
}

/** Parallel arrows for a, 3a and -2a. */
function multiplesFig(id, title, desc, lines, rows) {
  const p = bare({ xmin: -4.6, xmax: 4.6, cy: 0 });
  rows.forEach(([x1, y1, x2, y2, name, colour]) => {
    arrow(p, x1, y1, x2, y2, { colour });
    p.text((x1 + x2) / 2, (y1 + y2) / 2, name, { cls: 'big', dy: 34 });
  });
  cap(p, ...lines);
  return p.svg(o(id, title, desc));
}

export const FIGS = {
  vector: (() => {
    const p = bare({ xmin: -1, xmax: 6, cy: 1.5 });
    arrow(p, 0.5, 0, 4.5, 3, { colour: 'strand' });
    p.text(2.5, 1.5, 'a', { cls: 'big', dx: -18, dy: -8 });
    cap(p, 'length: the size', 'arrow: the direction');
    return p.svg(o('vector', 'A vector', 'An arrow pointing up and to the right, labelled a. The length of the arrow shows the size of the vector and the way it points shows its direction.'));
  })(),

  scalar: (() => {
    const p = bare({ xmin: -1, xmax: 6, cy: 1.5 });
    p.text(2.5, 2.4, '5', { cls: 'big' });
    p.text(2.5, 0.6, 'size only', { cls: 'small' });
    cap(p, 'a scalar is just a number', 'no arrow, no direction');
    return p.svg(o('scalar', 'A scalar', 'The number 5 with the words size only. A scalar is an ordinary number with no direction, so there is no arrow.'));
  })(),

  'vector-notation': (() => {
    const p = bare({ xmin: -1, xmax: 6, cy: 1.5 });
    arrow(p, 0.5, 0.3, 4.5, 2.7, { colour: 'strand' });
    p.point(0.5, 0.3, { label: 'A', dx: -20, dy: 24 }).point(4.5, 2.7, { label: 'B', dx: 14, dy: -8 });
    cap(p, 'AB goes from A to B', 'BA goes back from B to A');
    return p.svg(o('vector-notation', 'Vector notation AB', 'An arrow from the point A to the point B. The vector AB goes from A to B. The vector BA would go the opposite way, from B to A.'));
  })(),

  'column-vector': (() => {
    const p = bare({ xmin: -1, xmax: 6, cy: 1.8 });
    arrow(p, 1, 0.3, 4, 2.3, { colour: 'strand' });
    legs(p, 1, 0.3, 3, 2);
    p.text(2.5, 0.3, '3 across', { cls: 'small', dy: 28 });
    p.text(4.1, 1.3, '2 up', { cls: 'small', anchor: 'start', dx: 6 });
    column(p, 36, 56, ['3', '2']);
    cap(p, 'the column is the move:', '3 across, 2 up');
    return p.svg(o('column-vector', 'A column vector', 'An arrow that goes 3 across and 2 up, with dashed steps showing the two parts. At the top left the same vector is written as a column with 3 over 2 inside brackets.'));
  })(),

  component: (() => {
    const p = bare({ xmin: -1, xmax: 6, cy: 1.8 });
    arrow(p, 1, 0.3, 4, 2.3, { colour: 'strand' });
    legs(p, 1, 0.3, 3, 2);
    p.text(2.5, 0.3, 'x-component 3', { cls: 'small', dy: 28 });
    p.text(4.1, 1.3, 'y-comp. 2', { cls: 'small', anchor: 'start', dx: 8, dy: 8 });
    cap(p, 'a vector splits into', 'an across part and an up part');
    return p.svg(o('component', 'The components of a vector', 'An arrow that goes up and to the right, with a dashed step across of 3 labelled x-component and a dashed step up of 2 labelled y-component.'));
  })(),

  'i-j-notation': (() => {
    const p = eq({ xmin: -1, xmax: 5, cy: 1.5, grid: false, ticks: false });
    arrow(p, 0, 0, 1, 0, { colour: 'red', width: 6 });
    arrow(p, 0, 0, 0, 1, { colour: 'red', width: 6 });
    arrow(p, 0, 0, 3, 2, { colour: 'strand' });
    legs(p, 0, 0, 3, 2);
    p.text(0.5, 0, 'i', { cls: 'big', dy: 36 });
    p.text(0, 0.5, 'j', { cls: 'big', anchor: 'end', dx: -12, dy: 8 });
    cap(p, 'i is 1 across, j is 1 up', 'the long arrow is 3i + 2j');
    return p.svg(o('i-j-notation', 'The vectors i and j', 'Axes with grid lines. Two short arrows from the origin, i one unit along the x-axis and j one unit up the y-axis. A longer arrow goes 3 across and 2 up, which is 3i plus 2j.'));
  })(),

  'unit-vector': (() => {
    const p = eq({ xmin: -1, xmax: 5.4, cy: 2.2, grid: false, ticks: false });
    p.hline(0, { cls: 'axis' });
    arrow(p, 0, 0, 3, 4, { colour: 'ink' });
    arrow(p, 0, 0, 0.6, 0.8, { colour: 'red', width: 6 });
    p.text(1.6, 2.2, 'a', { cls: 'big', anchor: 'start', dx: 14, dy: 4 });
    p.text(0.3, 0.4, '\u00e2', { cls: 'big', anchor: 'end', dx: -12, dy: -8 });
    cap(p, 'a = 3i + 4j has length 5', 'its unit vector \u00e2 has length 1');
    return p.svg(o('unit-vector', 'A unit vector', 'A long arrow labelled a pointing up and to the right, with a very short arrow labelled a-hat along the same line. The short arrow has length 1: it is the unit vector in the direction of a.'));
  })(),

  magnitude: (() => {
    const p = bare({ xmin: -1, xmax: 5.4, cy: 1.6 });
    arrow(p, 0.3, 0, 3.3, 4, { colour: 'strand' });
    legs(p, 0.3, 0, 3, 4);
    p.text(1.8, 0, '3', { dy: 30 });
    p.text(3.4, 2, '4', { anchor: 'start', dx: 10, dy: 8 });
    p.text(1.7, 2.4, '5', { anchor: 'end', dx: -10, cls: 'big' });
    cap(p, '|a| = \u221a(3\u00b2 + 4\u00b2) = 5', 'the magnitude is the length');
    return p.svg(o('magnitude', 'The magnitude of a vector', 'An arrow that goes 3 across and 4 up. With the dashed steps it forms a right-angled triangle, so by Pythagoras the length of the arrow, its magnitude, is 5.'));
  })(),

  'direction-of-a-vector': (() => {
    const p = eq({ xmin: -1, xmax: 5.4, cy: 2.2, grid: false, ticks: false });
    arrow(p, 0, 0, 3, 4, { colour: 'strand' });
    const r = 62;
    const a = Math.atan2(4, 3);
    p.raw(`<path class="line" style="stroke-width:3" d="M${f(p.X(0) + r)} ${f(p.Y(0))} A${r} ${r} 0 0 0 ${f(p.X(0) + r * Math.cos(a))} ${f(p.Y(0) - r * Math.sin(a))}"/>`);
    p.text(0, 0, '\u03b8', { anchor: 'start', dx: 76, dy: -16 });
    cap(p, '\u03b8 is measured from the', 'x-axis, anticlockwise');
    return p.svg(o('direction-of-a-vector', 'The direction of a vector', 'An arrow from the origin going up and to the right. An arc between the positive x-axis and the arrow is labelled theta. The direction is the angle theta, measured anticlockwise from the x-axis.'));
  })(),

  'vector-addition': addFig('vector-addition', 'Adding vectors', 'Two arrows joined head to tail: a goes first, then b starts where a ends. A third arrow from the start of a to the end of b is the sum a plus b.', ['tail of b at head of a', 'the sum goes start to end'], 'a + b'),

  resultant: addFig('resultant', 'The resultant', 'Two arrows a and b joined head to tail. A third arrow from the start of a to the end of b is the resultant, a single vector with the same effect as a and b together.', ['the resultant does the work', 'of a and b together'], 'resultant', [-0.8, 3.6, 'start', 0, 0]),

  'vector-subtraction': (() => {
    const p = bare({ xmin: -1, xmax: 6.4, cy: 1.8 });
    arrow(p, 0, 0, 5, 1, { colour: 'strand' });
    arrow(p, 0, 0, 1, 3, { colour: 'ink' });
    arrow(p, 1, 3, 5, 1, { colour: 'red' });
    p.text(3, 0.5, 'a', { cls: 'big', dy: 30 });
    p.text(0.5, 1.5, 'b', { cls: 'big', anchor: 'end', dx: -12 });
    p.text(3, 2.1, 'a - b', { cls: 'big', anchor: 'start', dx: 8, dy: -6 });
    cap(p, 'a - b goes from', 'the head of b to the head of a');
    return p.svg(o('vector-subtraction', 'Subtracting vectors', 'Two arrows a and b from the same point. A third arrow runs from the head of b to the head of a. It is the vector a minus b.'));
  })(),

  'negative-vector': (() => {
    const p = bare({ xmin: -4.6, xmax: 4.6, cy: 0 });
    arrow(p, 0, 0, 3, 1.5, { colour: 'strand' });
    arrow(p, 0, 0, -3, -1.5, { colour: 'red' });
    p.point(0, 0);
    p.text(1.8, 0.9, 'a', { cls: 'big', dy: -14, dx: -10 });
    p.text(-1.8, -0.9, '-a', { cls: 'big', dy: 36, dx: 10 });
    cap(p, 'same length, opposite way');
    return p.svg(o('negative-vector', 'The negative of a vector', 'Two arrows from the same point. The arrow a points up and to the right. The arrow minus a has the same length but points down and to the left.'));
  })(),

  'scalar-multiple': multiplesFig('scalar-multiple', 'A scalar multiple', 'Three parallel arrows: a, then 2a which is twice as long and points the same way, then minus a which has the same length as a and points the opposite way.', ['2a is twice as long', '-a points the other way'], [
    [-3.6, 1.8, -1.6, 2.8, 'a', 'strand'], [-3.6, -0.2, 0.4, 1.8, '2a', 'ink'], [1.6, -1.6, -0.4, -2.6, '-a', 'red'],
  ]),

  'parallel-vectors': multiplesFig('parallel-vectors', 'Parallel vectors', 'Three arrows that all lie in the same or the opposite direction: a, 3a which is three times as long, and minus 2a which points the opposite way. Each is a scalar multiple of a.', ['each one is a multiple of a'], [
    [-4, 2.4, -3, 2.9, 'a', 'strand'], [-4, 0.6, -1, 2.1, '3a', 'ink'], [2.4, -1.4, 0.4, -2.4, '-2a', 'red'],
  ]),

  'zero-vector': (() => {
    const p = bare({ xmin: -1, xmax: 6, cy: 1.5 });
    arrow(p, 0.5, 0.2, 4.5, 2.6, { colour: 'strand' });
    arrow(p, 4.3, 2.9, 0.3, 0.5, { colour: 'red', dash: '10 7' });
    p.point(0.5, 0.2, { label: 'A', dx: -22, dy: 24 }).point(4.5, 2.6, { label: 'B', dx: 14, dy: 0 });
    cap(p, 'AB then BA ends at A:', 'the total is the zero vector');
    return p.svg(o('zero-vector', 'The zero vector', 'An arrow from A to B and a dashed arrow back from B to A. Together they take you back to the start, so their sum is the zero vector.'));
  })(),

  'position-vector': (() => {
    const p = eq({ xmin: -1, xmax: 6, cy: 1.8, xstep: 1, ystep: 1, grid: false, ticks: false });
    arrow(p, 0, 0, 3, 2, { colour: 'strand' });
    p.point(0, 0, { label: 'O', dx: -24, dy: 26 }).point(3, 2, { label: 'A (3, 2)', dx: 12, dy: -10 });
    p.text(1.5, 1, 'a', { cls: 'big', dx: -6, dy: 36 });
    cap(p, 'a goes from the origin O', 'to the point A');
    return p.svg(o('position-vector', 'A position vector', 'Axes with an arrow from the origin O to the point A at (3, 2). The arrow is the position vector of A, labelled a.'));
  })(),

  displacement: (() => {
    const p = bare({ xmin: -1, xmax: 6.4, cy: 3 });
    p.parametric((t) => 1 + 3 * t + 1.4 * Math.sin(Math.PI * t), (t) => 2 + 4 * t - 1.4 * Math.sin(Math.PI * t) * 0.8, 0, 1, { cls: 'curve-c' });
    arrow(p, 1, 2, 4, 6, { colour: 'strand' });
    p.point(1, 2, { label: 'A', dx: -22, dy: 24 }).point(4, 6, { label: 'B', dx: 14, dy: 0 });
    cap(p, 'solid arrow: displacement', 'dotted: the path walked');
    return p.svg(o('displacement', 'Displacement', 'A straight arrow from A to B, the displacement. A longer dotted curve also joins A to B: the path actually walked. The displacement is shorter than the path.'));
  })(),

  collinear: (() => {
    const p = bare({ xmin: -1, xmax: 9, cy: 2.4 });
    p.line(-0.6, 0.2, 8.6, 4.8, { cls: 'curve-b' });
    arrow(p, 1, 1, 3, 2, { colour: 'strand' });
    arrow(p, 3, 2, 7, 4, { colour: 'ink' });
    p.point(1, 1, { label: 'A', dx: -4, dy: 30, anchor: 'middle' }).point(3, 2, { label: 'B', dx: 0, dy: 32, anchor: 'middle' }).point(7, 4, { label: 'C', dx: 0, dy: 32, anchor: 'middle' });
    cap(p, 'BC = 2 \u00d7 AB, and they share B', 'so A, B, C are on one line');
    return p.svg(o('collinear', 'Collinear points', 'Three points A, B and C on one dashed straight line. An arrow from A to B and a longer arrow from B to C point the same way. BC is twice AB and the arrows share the point B, so the points are collinear.'));
  })(),

  'dividing-in-a-ratio': (() => {
    const p = bare({ xmin: -1, xmax: 9, cy: 5 });
    p.line(1, 2, 7, 8, { cls: 'curve' });
    p.point(1, 2, { label: 'A', dx: 14, dy: 28 }).point(7, 8, { label: 'B', dx: 14, dy: 4 }).point(3, 4, { label: 'P', dx: 16, dy: 28 });
    p.text(2, 3, '1', { cls: 'big', anchor: 'end', dx: -14, dy: -4 });
    p.text(5, 6, '2', { cls: 'big', anchor: 'end', dx: -14, dy: -4 });
    cap(p, 'AP : PB = 1 : 2', 'P is 1/3 of the way from A to B');
    return p.svg(o('dividing-in-a-ratio', 'A point dividing a line in a ratio', 'A line from A to B with a point P on it. The part AP is labelled 1 and the part PB is labelled 2, so P divides AB in the ratio 1 to 2, one third of the way from A to B.'));
  })(),

  'vector-proof': (() => {
    const p = bare({ xmin: -1, xmax: 8, cy: 2.6 });
    p.line(0, 0, 6, 1, { cls: 'curve' }).line(0, 0, 2, 5, { cls: 'curve' }).line(6, 1, 2, 5, { cls: 'curve' });
    p.line(3, 0.5, 1, 2.5, { cls: 'curve-b' });
    p.point(0, 0, { label: 'O', dx: -24, dy: 26 }).point(6, 1, { label: 'A', dx: 14, dy: 20 }).point(2, 5, { label: 'B', dx: 14, dy: 0 });
    p.point(3, 0.5, { label: 'M', dx: 12, dy: 30 }).point(1, 2.5, { label: 'N', dx: -14, dy: 8, anchor: 'end' });
    cap(p, 'MN is parallel to AB', 'and half its length');
    return p.svg(o('vector-proof', 'A vector proof', 'A triangle OAB. M is the midpoint of OA and N is the midpoint of OB. A dashed line joins M and N. Vectors show that MN is parallel to AB and half its length.'));
  })(),

  'ijk-notation': (() => {
    const O = [140, 196];
    const { s } = axes3d(O);
    const u = [at3(O, 1, 0, 0), at3(O, 0, 1, 0), at3(O, 0, 0, 1)];
    let r = s;
    u.forEach((e) => { r += arrowPx(O[0], O[1], e[0], e[1], { colour: 'red', width: 6 }); });
    r += t3(u[0], 'i', -12, 18, 'big') + t3(u[1], 'j', 0, 30, 'big') + t3(u[2], 'k', -16, 6, 'big');
    return box3('ijk-notation', 'The vectors i, j and k', 'Three axes x, y and z at right angles, drawn in perspective. A short red arrow along each axis is a unit vector: i along x, j along y and k along z.', ['i, j, k are the unit vectors', 'along the x, y, z axes'], () => r);
  })(),

  'three-d-axes': (() => {
    const O = [140, 196];
    const { s } = axes3d(O, [2.6, 3.4, 4.3]);
    const A = at3(O, 2, 0, 0);
    const B = at3(O, 2, 3, 0);
    const P = at3(O, 2, 3, 4);
    let r = s + seg(O, A, 'guide') + seg(A, B, 'guide') + seg(B, P, 'guide') + seg(O, P, 'curve');
    r += `<circle class="pt" cx="${f(P[0])}" cy="${f(P[1])}" r="7"/>` + t3(P, '(2, 3, 4)', 6, -16, 'small');
    return box3('three-d-axes', 'Three-dimensional axes', 'Three axes x, y and z at right angles, drawn in perspective. A point is reached by going 2 along x, 3 along y and 4 up z, shown with dashed lines. It is labelled (2, 3, 4).', ['a point has three coordinates:', '(x, y, z)'], () => r);
  })(),

  'distance-in-3d': (() => {
    const O = [120, 196];
    const v = (x, y, z) => at3(O, x, y, z);
    const sx = 2;
    const sy = 3;
    const sz = 3;
    let r = '';
    // hidden edges (those at the back corner O) are dashed
    [[v(0, 0, 0), v(sx, 0, 0)], [v(0, 0, 0), v(0, sy, 0)], [v(0, 0, 0), v(0, 0, sz)]].forEach(([a, b]) => { r += seg(a, b, 'guide'); });
    const edges = [
      [v(sx, 0, 0), v(sx, sy, 0)], [v(sx, 0, 0), v(sx, 0, sz)], [v(sx, sy, 0), v(sx, sy, sz)], [v(sx, 0, sz), v(sx, sy, sz)],
      [v(0, sy, 0), v(sx, sy, 0)], [v(0, sy, 0), v(0, sy, sz)], [v(0, sy, sz), v(sx, sy, sz)],
      [v(0, 0, sz), v(sx, 0, sz)], [v(0, 0, sz), v(0, sy, sz)],
    ];
    edges.forEach(([a, b]) => { r += seg(a, b, 'line'); });
    r += seg(v(sx, 0, 0), v(0, sy, sz), 'tangent');
    r += t3(v(sx, sy / 2, 0), 'b', 0, 28, 'big') + t3(v(sx, 0, sz / 2), 'c', -16, 8, 'big') + t3(v(sx / 2, sy, 0), 'a', 16, 20, 'big') + t3(v(sx / 2, sy / 2, sz / 2), 'd', 18, 16, 'big');
    return box3('distance-in-3d', 'Distance in three dimensions', 'A box with edges a, b and c. A red line, labelled d, runs from one corner to the opposite corner through the inside of the box. Its length is the square root of a squared plus b squared plus c squared.', ['d = \u221a(a\u00b2 + b\u00b2 + c\u00b2)'], () => r);
  })(),
};
