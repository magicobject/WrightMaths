// Figures for the Vectors in two dimensions topic page (src/pages/books/a-level/vectors-2d.html).
//
// Every arrow is drawn FROM the vector it stands for: arrow(p, { name, from, vec }) puts the tip at from + vec, so a
// picture cannot disagree with its components. Each arrow is a <g class="vec" data-name data-from data-vec>, which
// test/alevel-vectors-2d.spec.ts measures (tail and tip are read back from the drawn line and head).
// Every picture uses the SAME scale on both axes (vplane), so a direction looks like the direction it is.
// Vector letters are plain a, b, c: the page prints them bold; here a label is short and sits beside its own arrow.
import { plane, label } from '../figure-lib.mjs';

const DEG = String.fromCharCode(0xb0); // kept out of the source so the file stays plain ASCII
const MINUS = String.fromCharCode(0x2212);
const HALF = String.fromCharCode(0xbd);
const ROOT = String.fromCharCode(0x221a);
const THETA = String.fromCharCode(0x3b8);

const f = (n) => (Math.round(n * 100) / 100).toString();

/** A plane with step 1, the origin inside, and the same pixels per unit on both axes. */
function vplane(xmin, xmax, ymin, ymax, { width = 600 } = {}) {
  const left = 64;
  const right = 48;
  const top = 44;
  const bottom = 52;
  const unit = (width - left - right) / (xmax - xmin);
  const height = Math.round(unit * (ymax - ymin) + top + bottom);
  return plane({ xmin, xmax, ymin, ymax, width, height, left, right, top, bottom });
}

/** An arrow from `from` by the vector `vec` (graph units). `text` is its label, set `off` pixels to one side (side 1 or -1). */
function arrow(p, { name, from, vec, cls = 'curve', text = '', side = 1, off = 30, ldx = 0, ldy = 0, head = 24, t = 0.5 }) {
  const [x1, y1] = from;
  const sx = p.X(x1);
  const sy = p.Y(y1);
  const tx = p.X(x1 + vec[0]);
  const ty = p.Y(y1 + vec[1]);
  const len = Math.hypot(tx - sx, ty - sy);
  const ux = (tx - sx) / len;
  const uy = (ty - sy) / len;
  const bx = tx - head * ux;
  const by = ty - head * uy;
  const nx = -uy;
  const ny = ux;
  const hw = head * 0.4;
  const fill = { curve: 'var(--strand,var(--navy))', 'curve-c': 'var(--c-oops)' }[cls] ?? 'var(--ink)';
  let out = `<g class="vec" data-name="${name}" data-from="${x1},${y1}" data-vec="${vec[0]},${vec[1]}">`;
  out += `<line class="${cls}" x1="${f(sx)}" y1="${f(sy)}" x2="${f(bx)}" y2="${f(by)}"/>`;
  out += `<polygon points="${f(tx)},${f(ty)} ${f(bx + hw * nx)},${f(by + hw * ny)} ${f(bx - hw * nx)},${f(by - hw * ny)}" style="fill:${fill}"/>`;
  out += '</g>';
  p.raw(out);
  if (text) {
    const mx = sx + (tx - sx) * t + side * nx * off + ldx;
    const my = sy + (ty - sy) * t + side * ny * off + ldy + 8;
    const sideX = side * nx;
    const anchor = Math.abs(sideX) > 0.5 ? (sideX > 0 ? 'start' : 'end') : 'middle';
    p.raw(`<text class="svg-t" data-for="${name}" x="${f(mx)}" y="${f(my)}" text-anchor="${anchor}">${label(text)}</text>`);
  }
  return p;
}

/** A plain dashed segment (a guide, not a vector). */
const guide = (p, x1, y1, x2, y2) => p.line(x1, y1, x2, y2, { cls: 'guide', clip: false });

/** Labels get a halo in the page colour, so a label that crosses a grid line stays readable. */
const finish = (p, meta) => p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');

/** An arc about (cx, cy) of radius r (graph units) from angle a0 to a1 (degrees), drawn as a dotted guide. */
function arc(p, cx, cy, r, a0, a1) {
  let d = '';
  for (let i = 0; i <= 40; i += 1) {
    const a = ((a0 + ((a1 - a0) * i) / 40) * Math.PI) / 180;
    d += `${i ? 'L' : 'M'}${f(p.X(cx + r * Math.cos(a)))} ${f(p.Y(cy + r * Math.sin(a)))} `;
  }
  p.raw(`<path class="guide" d="${d.trim()}"/>`);
}

export const FIGURES = {
  // ---- lesson 1: vectors, column vectors, i and j ----
  'vectors-2d-equal': () => {
    const p = vplane(0, 9, -1, 4);
    arrow(p, { name: 'a1', from: [1, 1], vec: [3, 2], text: 'a', side: 1, off: 26 });
    arrow(p, { name: 'a2', from: [5, 0], vec: [3, 2], text: 'a', side: 1, off: 26 });
    return finish(p, { id: 'vectors-2d-equal', title: 'Two arrows for the same vector', desc: 'A grid with two arrows of the same length that point the same way, one higher and further left than the other. Both are labelled a. Each goes 3 across and 2 up.' });
  },
  'vectors-2d-components': () => {
    const p = vplane(0, 8, 0, 5);
    arrow(p, { name: 'a', from: [1, 4], vec: [4, -2], text: 'a', side: 1, off: 28 });
    guide(p, 1, 4, 5, 4);
    guide(p, 5, 4, 5, 2);
    p.text(3, 4, '4 across', { dy: -14 });
    p.text(5, 3, '2 down', { anchor: 'start', dx: 14, dy: 8 });
    return finish(p, { id: 'vectors-2d-components', title: 'An arrow split into across and down', desc: 'An arrow starts at the point (1, 4) and ends at (5, 2). A dashed line goes 4 across from its start, then a dashed line goes 2 down to its end. The arrow is labelled a.' });
  },
  'vectors-2d-ij': () => {
    const p = vplane(-1, 5, -3, 2, { width: 560 });
    arrow(p, { name: 'v', from: [0, 0], vec: [3, -2], text: `3i ${MINUS} 2j`, side: -1, off: 36, ldx: -10 });
    arrow(p, { name: 'i', from: [0, 0], vec: [1, 0], cls: 'curve-b', text: 'i', side: -1, off: 22 });
    arrow(p, { name: 'j', from: [0, 0], vec: [0, 1], cls: 'curve-b', text: 'j', side: -1, off: 22 });
    guide(p, 1, 0, 3, 0);
    guide(p, 3, 0, 3, -2);
    p.text(2.2, 0, '3i', { dy: -14 });
    p.text(3, -1, `${MINUS}2j`, { anchor: 'start', dx: 14, dy: 8 });
    return finish(p, { id: 'vectors-2d-ij', title: 'i and j as steps', desc: 'The unit vector i is an arrow 1 across and j is an arrow 1 up, both drawn from the origin. A longer arrow goes from the origin to the point (3, -2). Dashed lines show it as 3 steps of i, then 2 steps down, which is minus 2 of j.' });
  },

  // ---- lesson 2: adding, subtracting and multiplying ----
  'vectors-2d-triangle': () => {
    const p = vplane(0, 7, 0, 5);
    arrow(p, { name: 'a', from: [0, 0], vec: [3, 1], text: 'a', side: 1, off: 26 });
    arrow(p, { name: 'b', from: [3, 1], vec: [2, 3], text: 'b', side: 1, off: 28 });
    arrow(p, { name: 'sum', from: [0, 0], vec: [5, 4], cls: 'curve-b', text: 'a + b', side: -1, off: 36 });
    return finish(p, { id: 'vectors-2d-triangle', title: 'The triangle law', desc: 'The arrow a goes 3 across and 1 up from the origin. The arrow b starts where a ends and goes 2 across and 3 up. A dashed arrow from the origin to the end of b is labelled a + b: it goes 5 across and 4 up.' });
  },
  'vectors-2d-parallelogram': () => {
    const p = vplane(0, 7, 0, 5);
    arrow(p, { name: 'a', from: [0, 0], vec: [4, 1], text: 'a', side: -1, off: 26 });
    arrow(p, { name: 'b', from: [0, 0], vec: [1, 3], text: 'b', side: 1, off: 26 });
    arrow(p, { name: 'a-top', from: [1, 3], vec: [4, 1], cls: 'curve-c', text: 'a', side: 1, off: 26 });
    arrow(p, { name: 'b-right', from: [4, 1], vec: [1, 3], cls: 'curve-c', text: 'b', side: -1, off: 26 });
    arrow(p, { name: 'sum', from: [0, 0], vec: [5, 4], cls: 'curve-b', text: 'a + b', side: 1, off: 36, ldx: -10 });
    return finish(p, { id: 'vectors-2d-parallelogram', title: 'The parallelogram law', desc: 'Two arrows a and b start at the same point, the origin. Dotted copies of each are drawn on the opposite sides to complete a parallelogram. A dashed arrow from the origin along the diagonal to the far corner is labelled a + b.' });
  },
  'vectors-2d-scalar': () => {
    const p = vplane(-1, 7, -1, 6, { width: 560 });
    arrow(p, { name: 'a', from: [0, 4], vec: [2, 1], text: 'a', side: 1, off: 26 });
    arrow(p, { name: 'two-a', from: [0, 1], vec: [4, 2], text: '2a', side: 1, off: 28 });
    arrow(p, { name: 'neg-a', from: [6, 3], vec: [-2, -1], cls: 'curve-b', text: `${MINUS}a`, side: 1, off: 26 });
    return finish(p, { id: 'vectors-2d-scalar', title: 'Multiples of a vector', desc: 'Three parallel arrows. The arrow a goes 2 across and 1 up. The arrow 2a points the same way and is twice as long. The dashed arrow minus a is the same length as a and points the opposite way, down and to the left.' });
  },

  // ---- lesson 3: magnitude, unit vectors and direction ----
  'vectors-2d-magnitude': () => {
    const p = vplane(0, 7, 0, 4);
    arrow(p, { name: 'a', from: [0, 0], vec: [5, 2], text: `|a| = ${ROOT}29`, side: 1, off: 40, ldx: -30 });
    guide(p, 0, 0, 5, 0);
    guide(p, 5, 0, 5, 2);
    p.text(2.5, 0, '5', { dy: -14 });
    p.text(5, 1, '2', { anchor: 'start', dx: 14, dy: 8 });
    return finish(p, { id: 'vectors-2d-magnitude', title: 'The magnitude is the hypotenuse', desc: 'An arrow a goes from the origin to the point (5, 2). Dashed lines make a right-angled triangle with sides 5 across and 2 up. The arrow is its longest side, labelled with its length, root 29.' });
  },
  'vectors-2d-direction': () => {
    const p = vplane(-4, 1, -1, 5, { width: 520 });
    arrow(p, { name: 'a', from: [0, 0], vec: [-3, 4], text: 'a', side: 1, off: 26 });
    guide(p, 0, 0, -3, 0);
    guide(p, -3, 0, -3, 4);
    arc(p, 0, 0, 0.8, 0, (Math.atan2(4, -3) * 180) / Math.PI);
    p.text(0.45, 0.55, THETA, { anchor: 'start', dx: 4 });
    p.text(-1.5, 0, '3 left', { dy: -14 });
    p.text(-3, 2, '4 up', { anchor: 'start', dx: 14, dy: 8 });
    return finish(p, { id: 'vectors-2d-direction', title: 'The direction of a vector', desc: 'An arrow a goes from the origin up and to the left, to the point (-3, 4). A dotted arc runs anticlockwise from the positive x-axis to the arrow, marked with the angle theta. Dashed lines show the arrow as 3 to the left and 4 up.' });
  },

  // ---- lesson 4: position vectors and the vector between two points ----
  'vectors-2d-position': () => {
    const p = vplane(0, 7, 0, 5);
    arrow(p, { name: 'a', from: [0, 0], vec: [2, 4], text: 'a', side: 1, off: 26 });
    arrow(p, { name: 'b', from: [0, 0], vec: [6, 1], text: 'b', side: -1, off: 26 });
    arrow(p, { name: 'AB', from: [2, 4], vec: [4, -3], cls: 'curve-b', text: `b ${MINUS} a`, side: 1, off: 34 });
    p.point(2, 4, { label: 'A', dx: -16, dy: -12, anchor: 'end' });
    p.point(6, 1, { label: 'B', dx: 14, dy: -12 });
    return finish(p, { id: 'vectors-2d-position', title: 'The vector from A to B', desc: 'Two position vectors start at the origin: a to the point A at (2, 4) and b to the point B at (6, 1). A dashed arrow from A to B is labelled b minus a. The journey from the origin to B, by way of A, is a then b minus a.' });
  },
  'vectors-2d-ratio': () => {
    const p = vplane(0, 8, 0, 5);
    arrow(p, { name: 'AP', from: [1, 1], vec: [2, 1], text: '1 part', side: -1, off: 32 });
    arrow(p, { name: 'PB', from: [3, 2], vec: [4, 2], text: '2 parts', side: -1, off: 32 });
    p.point(1, 1, { label: 'A', dx: -14, dy: 28, anchor: 'end' });
    p.point(3, 2, { label: 'P', dx: 12, dy: 30 });
    p.point(7, 4, { label: 'B', dx: 14, dy: 28 });
    return finish(p, { id: 'vectors-2d-ratio', title: 'A point that divides a line in a ratio', desc: 'A line from A at (1, 1) to B at (7, 4). The point P at (3, 2) lies on it. The part from A to P is marked 1 part and the part from P to B is marked 2 parts, so P is one third of the way along.' });
  },

  // ---- lesson 5: geometric proof ----
  'vectors-2d-proof': () => {
    const p = vplane(0, 7, 0, 6, { width: 560 });
    arrow(p, { name: 'a', from: [0, 0], vec: [6, 2], text: 'a', side: 1, off: 26, t: 0.25 });
    arrow(p, { name: 'b', from: [0, 0], vec: [2, 5], text: 'b', side: -1, off: 26, t: 0.3 });
    arrow(p, { name: 'AB', from: [6, 2], vec: [-4, 3], cls: 'curve-b', text: `b ${MINUS} a`, side: 1, off: 34 });
    arrow(p, { name: 'MN', from: [3, 1], vec: [-2, 1.5], cls: 'curve-c', text: `${HALF}(b ${MINUS} a)`, side: 1, off: 36 });
    p.point(0, 0, { label: 'O', dx: -14, dy: 30, anchor: 'end' });
    p.point(6, 2, { label: 'A', dx: 14, dy: 12 });
    p.point(2, 5, { label: 'B', dx: -4, dy: -16, anchor: 'end' });
    p.point(3, 1, { label: 'M', dx: 6, dy: 32 });
    p.point(1, 2.5, { label: 'N', dx: -14, dy: 8, anchor: 'end' });
    return finish(p, { id: 'vectors-2d-proof', title: 'The midpoint theorem with vectors', desc: 'A triangle with corners O, A and B. The arrows a and b go from O to A and from O to B. A dashed arrow from A to B is labelled b minus a. M is the midpoint of OA and N is the midpoint of OB, and a dotted arrow from M to N is labelled half of b minus a. It is parallel to AB and half as long.' });
  },
  'vectors-2d-collinear': () => {
    const p = vplane(0, 8, 0, 5);
    arrow(p, { name: 'AB', from: [1, 1], vec: [2, 1], text: 'AB', side: -1, off: 30 });
    arrow(p, { name: 'BC', from: [3, 2], vec: [4, 2], text: 'BC', side: -1, off: 30 });
    p.point(1, 1, { label: 'A', dx: 12, dy: 30 });
    p.point(3, 2, { label: 'B', dx: 12, dy: 30 });
    p.point(7, 4, { label: 'C', dx: 14, dy: 30 });
    return finish(p, { id: 'vectors-2d-collinear', title: 'Three points on one line', desc: 'Three points A at (1, 1), B at (3, 2) and C at (7, 4) lie on one straight line. The arrow from A to B is labelled AB. The arrow from B to C is labelled BC and is twice as long, pointing the same way.' });
  },

  // ---- the flip: magnitude and direction back to components ----
  'vectors-2d-flip': () => {
    const m = 8;
    const dx = m * Math.cos((40 * Math.PI) / 180);
    const dy = m * Math.sin((40 * Math.PI) / 180);
    const p = vplane(0, 9, 0, 6, { width: 640 });
    arrow(p, { name: 'v', from: [0, 0], vec: [dx, dy], text: '8', side: -1, off: 24 });
    guide(p, 0, 0, dx, 0);
    guide(p, dx, 0, dx, dy);
    arc(p, 0, 0, 1.4, 0, 40);
    p.text(1.7, 0.35, `40${DEG}`, { anchor: 'start', dx: 8 });
    p.text(dx / 2, 0, `8 cos 40${DEG}`, { dy: -14, dx: 40 });
    p.text(dx, dy / 2, `8 sin 40${DEG}`, { anchor: 'start', dx: 14, dy: 8 });
    return finish(p, { id: 'vectors-2d-flip', title: 'From magnitude and direction to components', desc: 'An arrow of length 8 leaves the origin at 40 degrees above the x-axis. Dashed lines make a right-angled triangle. The side along the x-axis is labelled 8 cos 40 degrees, and the upright side is labelled 8 sin 40 degrees.' });
  },

  // ---- question figures (they must not give the answer away) ----
  'vectors-2d-q-read': () => {
    const p = vplane(0, 6, 0, 6, { width: 520 });
    arrow(p, { name: 'a', from: [1, 5], vec: [3, -4], text: 'a', side: 1, off: 26 });
    return finish(p, { id: 'vectors-2d-q-read', title: 'An arrow on a grid', desc: 'A grid from 0 to 6 in both directions. One arrow, labelled a, slopes down and to the right.' });
  },
  'vectors-2d-q-triangle': () => {
    const p = vplane(0, 5, 0, 5, { width: 480 });
    arrow(p, { name: 'AB', from: [0, 0], vec: [4, 1], text: 'AB', side: -1, off: 24 });
    arrow(p, { name: 'BC', from: [4, 1], vec: [-1, 3], text: 'BC', side: 1, off: 24 });
    guide(p, 0, 0, 3, 4);
    p.point(0, 0, { label: 'A', dx: 12, dy: -14 });
    p.point(4, 1, { label: 'B', dx: 12, dy: 8 });
    p.point(3, 4, { label: 'C', dx: -12, dy: -12, anchor: 'end' });
    return finish(p, { id: 'vectors-2d-q-triangle', title: 'A triangle of two journeys', desc: 'A triangle with corners A, B and C. The arrows AB and BC are drawn. A dashed line joins A to C.' });
  },
  'vectors-2d-q-pgram': () => {
    const p = vplane(0, 7, 0, 5, { width: 560 });
    arrow(p, { name: 'a', from: [0, 0], vec: [5, 1], text: 'a', side: -1, off: 26 });
    arrow(p, { name: 'c', from: [0, 0], vec: [1, 3], text: 'c', side: 1, off: 26 });
    guide(p, 1, 3, 6, 4);
    guide(p, 5, 1, 6, 4);
    p.point(0, 0, { label: 'O', dx: -12, dy: 28, anchor: 'end' });
    p.point(5, 1, { label: 'A', dx: 14, dy: 28 });
    p.point(6, 4, { label: 'B', dx: 14, dy: -12 });
    p.point(1, 3, { label: 'C', dx: -14, dy: -12, anchor: 'end' });
    return finish(p, { id: 'vectors-2d-q-pgram', title: 'A parallelogram OABC', desc: 'A parallelogram with corners O, A, B and C in order. The arrow a goes from O to A and the arrow c goes from O to C. The other two sides are dashed.' });
  },
};

