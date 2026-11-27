// Figures for the Trigonometric graphs and exact values topic page (src/pages/courses/a-level/trig-graphs.html).
//
// Every curve is drawn FROM the function that defines it (FN below), so a picture cannot disagree with its equation.
// Each curve path carries data-fn (the function's key) and each marked point carries data-pt and data-at (its graph
// coordinates) and data-on (the curve it sits on), so test/alevel-trig-graphs.spec.ts can read the picture back and
// compare it with the maths. Every graph root carries data-plane and data-box (the scale used), and GEOMETRY(id)
// returns the facts a picture states. Angles are in degrees: radians belong to a later topic.
// Every picture is 480 or 520 wide, so the labels stay readable when it shrinks to a phone screen.
import { plane, label } from '../figure-lib.mjs';

const DEG = String.fromCharCode(0xb0); // kept out of the source so the file stays plain ASCII
const MINUS = String.fromCharCode(0x2212);
const ROOT = String.fromCharCode(0x221a);

const f = (n) => (Math.round(n * 100) / 100).toString();
const rad = (d) => (d * Math.PI) / 180;

/** The functions the pictures draw, by key. The spec has its own independent copy. */
export const FN = {
  sin: (x) => Math.sin(rad(x)),
  cos: (x) => Math.cos(rad(x)),
  tan: (x) => Math.tan(rad(x)),
  'two-sin': (x) => 2 * Math.sin(rad(x)),
  'sin-2x': (x) => Math.sin(rad(2 * x)),
};

const WIDTH = 520;

/** Labels get a halo in the page colour, so a label that crosses a grid line stays readable. */
const halo = (svg) => svg.replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');

/** A path for y = fn(x), broken wherever the curve leaves the picture or jumps (the tan asymptotes). */
function pathFor(p, fn, from, to) {
  let d = '';
  let pen = false;
  let prev = null;
  const span = p.ymax - p.ymin;
  const samples = 720;
  for (let i = 0; i <= samples; i += 1) {
    const x = from + ((to - from) * i) / samples;
    const y = fn(x);
    const ok = Number.isFinite(y) && y >= p.ymin - span * 0.02 && y <= p.ymax + span * 0.02 && !(prev !== null && Math.abs(y - prev) > span * 0.6);
    if (ok) { d += `${pen ? 'L' : 'M'}${f(p.X(x))} ${f(p.Y(y))} `; pen = true; } else { pen = false; }
    prev = Number.isFinite(y) ? y : null;
  }
  return d.trim();
}

/** What a picture states, for the spec. */
function newMeta() { return { points: [], curves: [], facts: [] }; }

function curve(p, meta, key, { cls = 'curve', from = p.xmin, to = p.xmax } = {}) {
  p.raw(`<path class="${cls}" data-fn="${key}" d="${pathFor(p, FN[key], from, to)}"/>`);
  meta.curves.push({ key, cls });
}

/** A marked point on a curve (or free, when `on` is omitted), with its label set (dx, dy) pixels away. */
function mark(p, meta, id, x, y, { on = null, text = '', dx = 12, dy = -12, anchor = 'start', open = false, ty = y, foot = false } = {}) {
  p.raw(`<circle class="${open ? 'pt-open' : 'pt'}" data-pt="${id}" data-at="${x},${y}"${on ? ` data-on="${on}"` : ''} cx="${f(p.X(x))}" cy="${f(p.Y(y))}" r="7"/>`);
  // the label is set (dx, dy) pixels from the height `ty` above the point's own x (the point's height by default)
  // a foot label (the angle under its dashed line) is tied to its point by its x position, not by being nearest; the spec checks that
  if (text) p.raw(`<text class="svg-t" ${foot ? 'data-foot' : 'data-for'}="${id}" x="${f(p.X(x) + dx)}" y="${f(p.Y(ty) + dy)}" text-anchor="${anchor}">${label(text)}</text>`);
  meta.points.push({ id, x, y, text, on });
}

const guideV = (p, x, y1, y2) => p.line(x, y1, x, y2, { cls: 'guide', clip: false });
const guideH = (p, y, x1, x2) => p.line(x1, y, x2, y, { cls: 'guide', clip: false });
const degTick = (x) => `${String(x).replace('-', MINUS)}${DEG}`;

/** A graph plane in degrees with the same layout for every picture. The x-axis numbers are drawn by xrow(). */
function gplane({ x, y, height = 330, left = 64, width = WIDTH, tickLabels = true, ytick = (v) => String(v).replace('-', MINUS) }) {
  return plane({ xmin: x[0], xmax: x[1], xstep: x[2], ymin: y[0], ymax: y[1], ystep: y[2], width, height, left, right: 48, top: 44, bottom: 52, tickLabels, xtickFormat: () => '', ytickFormat: ytick });
}

/** The x-axis numbers sit in a row under the picture, so no curve or label can run through them. */
function xrow(p, values) {
  for (const v of values) p.raw(`<text class="svg-t small" data-xlabel="${v}" x="${f(p.X(v))}" y="${f(p.Y(p.ymin) + 34)}" text-anchor="middle">${label(degTick(v))}</text>`);
}

function finish(p, meta, { id, title, desc }) {
  const scale = `${p.xmin},${p.xmax},${p.ymin},${p.ymax}`;
  const box = `${f(p.X(p.xmin))},${f(p.X(p.xmax))},${f(p.Y(p.ymax))},${f(p.Y(p.ymin))}`;
  const svg = halo(p.svg({ id, title, desc })).replace('<svg class="graph-svg"', `<svg class="graph-svg" data-plane="${scale}" data-box="${box}"`);
  return { svg, meta };
}

// ---- the unit circle ----
/** A unit circle plane: one pixel scale on both axes, no tick numbers (the circle itself has radius 1). */
function circlePlane() {
  const left = 64;
  const right = 48;
  const top = 44;
  const bottom = 52;
  const width = 480;
  const range = 3.2;
  const unit = (width - left - right) / range;
  const height = Math.round(unit * range + top + bottom);
  return plane({ xmin: -1.6, xmax: 1.6, ymin: -1.6, ymax: 1.6, xstep: 1, ystep: 1, width, height, left, right, top, bottom, ticks: false, grid: false });
}

function unitCircleBase(p, meta) {
  let d = '';
  for (let i = 0; i <= 360; i += 1) d += `${i ? 'L' : 'M'}${f(p.X(Math.cos(rad(i))))} ${f(p.Y(Math.sin(rad(i))))} `;
  p.raw(`<path class="curve" data-fn="circle" d="${d.trim()}"/>`);
  meta.curves.push({ key: 'circle', cls: 'curve' });
}

/** The dotted arc from 0 to `angle` degrees (anticlockwise) at radius r. */
function angleArc(p, angle, r) {
  let d = '';
  for (let i = 0; i <= 60; i += 1) {
    const a = rad((angle * i) / 60);
    d += `${i ? 'L' : 'M'}${f(p.X(r * Math.cos(a)))} ${f(p.Y(r * Math.sin(a)))} `;
  }
  p.raw(`<path class="guide" d="${d.trim()}"/>`);
}

const note = (p, px, py, text, id, anchor = 'start') => p.raw(`<text class="svg-t alt" data-note="${id}" x="${f(px)}" y="${f(py)}" text-anchor="${anchor}">${label(text)}</text>`);

function buildUnitCircle(id) {
  const p = circlePlane();
  const meta = newMeta();
  unitCircleBase(p, meta);
  const a = 150;
  const x = Math.cos(rad(a));
  const y = Math.sin(rad(a));
  p.line(0, 0, x, y, { cls: 'line', clip: false });
  guideV(p, x, 0, y);
  angleArc(p, a, 0.3);
  p.text(0.36, 0.17, `${a}${DEG}`, { anchor: 'start' });
  mark(p, meta, 'P', x, y, { on: 'circle', text: 'P', dx: -14, dy: -12, anchor: 'end' });
  note(p, 20, 58, `P = (${MINUS}0.866, 0.5)`, 'coordinates');
  note(p, 20, 102, 'radius 1', 'radius');
  meta.facts = ['150', '0.866', '0.5'];
  meta.angles = [{ point: 'P', angle: a }];
  return finish(p, meta, { id, title: 'The unit circle and the point at 150 degrees', desc: 'A circle of radius 1 centred at the origin. A line from the origin to the point P makes an angle of 150 degrees, measured anticlockwise from the positive x-axis, shown by a dotted arc. P is in the top left of the circle, at (-0.866, 0.5). A dashed line drops from P to the x-axis.' });
}

function buildQuadrants(id) {
  const p = circlePlane();
  const meta = newMeta();
  unitCircleBase(p, meta);
  for (const [x, y, t] of [[0.55, 0.5, 'All'], [-0.55, 0.5, 'Sin'], [-0.55, -0.5, 'Tan'], [0.55, -0.5, 'Cos']]) {
    p.raw(`<text class="svg-t alt" data-quadrant="${t}" data-at="${x},${y}" x="${f(p.X(x))}" y="${f(p.Y(y) + 8)}" text-anchor="middle">${t}</text>`);
  }
  meta.quadrants = [{ at: [0.55, 0.5], text: 'All' }, { at: [-0.55, 0.5], text: 'Sin' }, { at: [-0.55, -0.5], text: 'Tan' }, { at: [0.55, -0.5], text: 'Cos' }];
  return finish(p, meta, { id, title: 'Which of sin, cos and tan are positive in each quarter', desc: 'The unit circle split into four quarters by the axes. The top right quarter, 0 to 90 degrees, is marked All: sin, cos and tan are all positive. The top left quarter, 90 to 180 degrees, is marked Sin: only sin is positive. The bottom left quarter, 180 to 270 degrees, is marked Tan: only tan is positive. The bottom right quarter, 270 to 360 degrees, is marked Cos: only cos is positive.' });
}

function buildQCircle(id) {
  const p = circlePlane();
  const meta = newMeta();
  unitCircleBase(p, meta);
  const a = 300;
  const x = Math.cos(rad(a));
  const y = Math.sin(rad(a));
  p.line(0, 0, x, y, { cls: 'line', clip: false });
  guideV(p, x, 0, y);
  angleArc(p, a, 0.3);
  p.text(-0.2, -0.55, `${a}${DEG}`, { anchor: 'end', dx: -4 });
  mark(p, meta, 'P', x, y, { on: 'circle', text: 'P', dx: 14, dy: 28 });
  note(p, 20, 66, 'P has x = 0.5', 'x-coordinate');
  meta.facts = ['300', '0.5'];
  meta.angles = [{ point: 'P', angle: a }];
  return finish(p, meta, { id, title: 'The unit circle and the point at 300 degrees', desc: 'A circle of radius 1 centred at the origin. A line from the origin to the point P makes an angle of 300 degrees, measured anticlockwise from the positive x-axis, shown by a dotted arc that passes through the top and the left of the circle. P is in the bottom right of the circle, below the x-axis, and its x-coordinate is 0.5. A dashed line joins P to the x-axis.' });
}

// ---- right-angled triangles for the exact values ----
/** A right-angled triangle drawn to scale: the right angle at A, the other corners B and C. */
function buildTriangle(id, { A, B, C, sides, angles, title, desc }) {
  const pad = 0.35;
  const xs = [A, B, C].map((v) => v[0]);
  const ys = [A, B, C].map((v) => v[1]);
  const xmin = Math.min(...xs) - pad;
  const xmax = Math.max(...xs) + pad;
  const ymin = Math.min(...ys) - pad;
  const ymax = Math.max(...ys) + pad;
  const width = 480;
  const unit = (width - 60) / (xmax - xmin);
  const height = Math.round(unit * (ymax - ymin) + 48);
  const p = plane({ xmin, xmax, ymin, ymax, width, height, left: 30, right: 30, top: 24, bottom: 24, grid: false, axes: false, ticks: false });
  const meta = newMeta();
  const corners = { A, B, C };
  // each edge carries its name (data-edge), so the spec can measure the drawn triangle
  for (const [from, to] of [['A', 'B'], ['B', 'C'], ['A', 'C']]) p.raw(`<line class="line" data-edge="${from}${to}" x1="${f(p.X(corners[from][0]))}" y1="${f(p.Y(corners[from][1]))}" x2="${f(p.X(corners[to][0]))}" y2="${f(p.Y(corners[to][1]))}"/>`);
  const centre = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
  // a side label sits 30 pixels outside its own edge
  for (const s of sides) {
    const [P, Q] = [corners[s.from], corners[s.to]];
    const mid = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
    let n = [-(Q[1] - P[1]), Q[0] - P[0]];
    const len = Math.hypot(...n);
    n = [n[0] / len, -n[1] / len]; // picture y runs down
    const out = [mid[0] - centre[0], -(mid[1] - centre[1])];
    if (n[0] * out[0] + n[1] * out[1] < 0) n = [-n[0], -n[1]];
    const half = s.text.length * 7;
    const px = p.X(mid[0]) + n[0] * (28 + half * Math.abs(n[0]));
    const py = p.Y(mid[1]) + n[1] * 28 + 8 + (n[1] > 0 ? 6 : 0);
    p.raw(`<text class="svg-t" data-side="${s.from}${s.to}" x="${f(px)}" y="${f(py)}" text-anchor="middle">${label(s.text)}</text>`);
  }
  // the right-angle mark at A
  const k = 0.16;
  const dirB = [Math.sign(B[0] - A[0]), Math.sign(B[1] - A[1])];
  const dirC = [Math.sign(C[0] - A[0]), Math.sign(C[1] - A[1])];
  p.raw(`<path class="guide" d="M${f(p.X(A[0] + k * dirB[0]))} ${f(p.Y(A[1] + k * dirB[1]))} L${f(p.X(A[0] + k * (dirB[0] + dirC[0])))} ${f(p.Y(A[1] + k * (dirB[1] + dirC[1])))} L${f(p.X(A[0] + k * dirC[0]))} ${f(p.Y(A[1] + k * dirC[1]))}"/>`);
  // an angle label sits inside the triangle, on the line that halves the angle
  for (const a of angles) {
    const V = corners[a.at];
    const others = Object.keys(corners).filter((n) => n !== a.at).map((n) => corners[n]);
    const u = others.map((O) => { const d = [O[0] - V[0], O[1] - V[1]]; const l = Math.hypot(...d); return [d[0] / l, d[1] / l]; });
    let bis = [u[0][0] + u[1][0], u[0][1] + u[1][1]];
    const bl = Math.hypot(...bis);
    bis = [bis[0] / bl, bis[1] / bl];
    const at = [V[0] + bis[0] * a.reach, V[1] + bis[1] * a.reach];
    p.raw(`<text class="svg-t alt" data-angle="${a.value}" data-vertex="${a.at}" x="${f(p.X(at[0]))}" y="${f(p.Y(at[1]) + 8)}" text-anchor="middle">${a.value}${DEG}</text>`);
  }
  meta.triangle = { corners, sides: sides.map((s) => ({ from: s.from, to: s.to, value: s.value, text: s.text })), angles: angles.map((a) => ({ at: a.at, value: a.value })) };
  meta.facts = [...sides.map((s) => s.text), ...angles.map((a) => String(a.value))];
  return finish(p, meta, { id, title, desc });
}

const SQ3 = Math.sqrt(3);

// ---- graph figures ----
function buildExactSin(id) {
  // the x-axis runs a little past 90 degrees, so the label 90 and the axis letter x do not meet
  const p = plane({ xmin: 0, xmax: 100, ymin: 0, ymax: 1.1, xstep: 15, ystep: 1, width: WIDTH, height: 440, left: 96, right: 48, top: 44, bottom: 52, xtickFormat: () => '', ytickFormat: () => '' });
  const meta = newMeta();
  curve(p, meta, 'sin', { from: 0, to: 90 });
  const pts = [[30, 0.5, '1/2'], [45, Math.SQRT1_2, `${ROOT}2/2`], [60, SQ3 / 2, `${ROOT}3/2`], [90, 1, '1']];
  for (const [x, y, t] of pts) {
    guideV(p, x, 0, y);
    guideH(p, y, 0, x);
    p.raw(`<text class="svg-t" data-yvalue="${x}" x="${f(p.X(0) - 12)}" y="${f(p.Y(y) + 8)}" text-anchor="end">${label(t)}</text>`);
    mark(p, meta, `s${x}`, x, y, { on: 'sin' });
  }
  xrow(p, [15, 30, 45, 60, 75, 90]);
  meta.yvalues = pts.map(([x, y, t]) => ({ x, y, text: t }));
  meta.facts = ['30', '45', '60', '90'];
  return finish(p, meta, { id, title: 'The sine graph from 0 to 90 degrees, with exact values', desc: 'The graph of y = sin x for x from 0 to 90 degrees, rising from 0 to 1. Four points are marked, each with a dashed line across to the y-axis, where its exact value is written. At 30 degrees the value is 1/2. At 45 degrees it is root 2 over 2. At 60 degrees it is root 3 over 2. At 90 degrees it is 1.' });
}

function buildSine(id) {
  const p = gplane({ x: [0, 360, 90], y: [-1.5, 1.5, 1] });
  const meta = newMeta();
  curve(p, meta, 'sin');
  mark(p, meta, 'top', 90, 1, { on: 'sin', text: `(90${DEG}, 1)`, dx: 14, dy: -14 });
  mark(p, meta, 'bottom', 270, -1, { on: 'sin', text: `(270${DEG}, ${MINUS}1)`, dx: 0, dy: 36, anchor: 'middle' });
  xrow(p, [90, 180, 270, 360]);
  meta.facts = ['90', '270', '1'];
  return finish(p, meta, { id, title: 'The graph of y = sin x', desc: 'The graph of y = sin x for x from 0 to 360 degrees. It starts at the origin, rises to a highest point at (90, 1), crosses the x-axis at 180, falls to a lowest point at (270, -1) and returns to the x-axis at 360. It is a smooth wave that stays between -1 and 1.' });
}

function buildCosine(id) {
  const p = gplane({ x: [0, 360, 90], y: [-1.5, 1.5, 1] });
  const meta = newMeta();
  curve(p, meta, 'cos');
  mark(p, meta, 'start', 0, 1, { on: 'cos', text: `(0${DEG}, 1)`, dx: 16, dy: -12 });
  mark(p, meta, 'bottom', 180, -1, { on: 'cos', text: `(180${DEG}, ${MINUS}1)`, dx: 0, dy: 36, anchor: 'middle' });
  mark(p, meta, 'end', 360, 1, { on: 'cos', text: `(360${DEG}, 1)`, dx: -16, dy: -12, anchor: 'end' });
  xrow(p, [90, 180, 270, 360]);
  meta.facts = ['0', '1', '180', '360'];
  return finish(p, meta, { id, title: 'The graph of y = cos x', desc: 'The graph of y = cos x for x from 0 to 360 degrees. It starts at its highest point (0, 1), crosses the x-axis at 90, falls to its lowest point (180, -1), crosses the x-axis again at 270 and returns to its highest point (360, 1). It is a smooth wave that stays between -1 and 1.' });
}

function buildSineMirror(id) {
  const p = gplane({ x: [0, 360, 90], y: [-1.5, 1.5, 1] });
  const meta = newMeta();
  curve(p, meta, 'sin');
  p.line(90, -1.5, 90, 1.5, { cls: 'guide', clip: false });
  note(p, p.X(90) + 12, p.Y(-1.15), 'mirror line', 'mirror');
  // each angle is written under the x-axis, at the foot of its own dashed line
  mark(p, meta, 'p30', 30, 0.5, { on: 'sin', text: `30${DEG}`, dx: 0, dy: 34, anchor: 'middle', ty: 0 });
  mark(p, meta, 'p150', 150, 0.5, { on: 'sin', text: `150${DEG}`, dx: 0, dy: 34, anchor: 'middle', ty: 0 });
  guideH(p, 0.5, 30, 150);
  guideV(p, 30, 0, 0.5);
  guideV(p, 150, 0, 0.5);
  xrow(p, [90, 180, 270, 360]);
  meta.facts = ['30', '150', '90', '0.5'];
  return finish(p, meta, { id, title: 'The sine graph is symmetrical about x = 90', desc: 'The graph of y = sin x for x from 0 to 360 degrees, with a dashed vertical mirror line at x = 90. Two points at height 0.5 are marked, one at 30 degrees and one at 150 degrees, joined by a dashed horizontal line. Dashed lines drop from each point to the x-axis, where its angle is written under the axis. They are the same distance from the mirror line, one on each side, so sin 30 = sin 150.' });
}

function buildSineOdd(id) {
  // no tick numbers and no O: the heights and angles of the two points are written beside them instead
  const p = gplane({ x: [-180, 180, 90], y: [-1.2, 1.2, 1], height: 400, tickLabels: false });
  const meta = newMeta();
  curve(p, meta, 'sin');
  // each point is joined by dashed lines to the y-axis, where its height is written, and to the x-axis, where its angle is written
  mark(p, meta, 'p30', 30, 0.5, { on: 'sin', text: `30${DEG}`, dx: 0, dy: 34, anchor: 'middle', ty: 0, foot: true });
  mark(p, meta, 'm30', -30, -0.5, { on: 'sin', text: `${MINUS}30${DEG}`, dx: 0, dy: -14, anchor: 'middle', ty: 0, foot: true });
  guideH(p, 0.5, 0, 30);
  guideH(p, -0.5, -30, 0);
  guideV(p, 30, 0, 0.5);
  guideV(p, -30, 0, -0.5);
  p.raw(`<text class="svg-t" data-yvalue="p30" x="${f(p.X(0) - 12)}" y="${f(p.Y(0.5) + 8)}" text-anchor="end">0.5</text>`);
  p.raw(`<text class="svg-t" data-yvalue="m30" x="${f(p.X(0) + 12)}" y="${f(p.Y(-0.5) + 8)}" text-anchor="start">${MINUS}0.5</text>`);
  meta.yvalues = [{ x: 30, y: 0.5, text: '0.5' }, { x: -30, y: -0.5, text: `${MINUS}0.5` }];
  xrow(p, [-180, -90, 90, 180]);
  meta.facts = ['30', '0.5'];
  return finish(p, meta, { id, title: 'The sine graph turned half a turn about the origin', desc: 'The graph of y = sin x for x from -180 to 180 degrees. Two points are marked: (30, 0.5) above the x-axis on the right, and (-30, -0.5) below the x-axis on the left. Dashed lines join each point to the y-axis, where its height 0.5 or -0.5 is written, and to the x-axis, where its angle 30 or -30 is written. Each point is the other turned half a turn about the origin, so sin(-30) = -sin 30.' });
}

function buildCosEven(id) {
  // the label 1 is left off: the curve peaks at height 1, right beside where it would sit
  const p = gplane({ x: [-180, 180, 90], y: [-1.5, 1.5, 1], ytick: (v) => (v === 1 ? '' : String(v).replace('-', MINUS)) });
  const meta = newMeta();
  curve(p, meta, 'cos');
  mark(p, meta, 'p60', 60, 0.5, { on: 'cos', text: `(60${DEG}, 0.5)`, dx: 14, dy: -14 });
  mark(p, meta, 'm60', -60, 0.5, { on: 'cos', text: `(${MINUS}60${DEG}, 0.5)`, dx: -14, dy: -14, anchor: 'end' });
  guideH(p, 0.5, -60, 60);
  xrow(p, [-180, -90, 90, 180]);
  meta.facts = ['60', '0.5'];
  return finish(p, meta, { id, title: 'The cosine graph is symmetrical about the y-axis', desc: 'The graph of y = cos x for x from -180 to 180 degrees. Two points at height 0.5 are marked, at (60, 0.5) and (-60, 0.5), joined by a dashed horizontal line. They are mirror images in the y-axis, so cos(-60) = cos 60.' });
}

function buildTan(id) {
  const p = gplane({ x: [0, 360, 90], y: [-3, 3, 1], height: 480 });
  const meta = newMeta();
  for (const x of [90, 270]) {
    guideV(p, x, -3, 3);
    p.raw(`<text class="svg-t alt" data-note="asymptote-${x}" x="${f(p.X(x) + 10)}" y="${f(p.Y(2.2))}" text-anchor="start">${label(`x = ${x}`)}</text>`);
  }
  curve(p, meta, 'tan');
  // each point is joined by dashed lines to the y-axis, where its height is the tick number, and to the x-axis, where its angle is written
  mark(p, meta, 'p45', 45, 1, { on: 'tan', text: `45${DEG}`, dx: 0, dy: 34, anchor: 'middle', ty: 0 });
  mark(p, meta, 'p135', 135, -1, { on: 'tan', text: `135${DEG}`, dx: 0, dy: -14, anchor: 'middle', ty: 0 });
  guideV(p, 45, 0, 1);
  guideV(p, 135, 0, -1);
  guideH(p, 1, 0, 45);
  guideH(p, -1, 0, 135);
  xrow(p, [90, 180, 270, 360]);
  meta.asymptotes = [90, 270];
  meta.facts = ['45', '135', '90', '270', '1'];
  return finish(p, meta, { id, title: 'The graph of y = tan x', desc: 'The graph of y = tan x for x from 0 to 360 degrees. It has vertical dashed asymptote lines at x = 90 and x = 270, which the curve never touches. The curve starts at the origin and rises towards the first line, then comes up again from the bottom of the picture, crossing the x-axis at 180, and rises towards the second line. A third piece comes up from the bottom after 270 and crosses the x-axis at 360. Two points are marked: (45, 1) and (135, -1). Dashed lines join each to the y-axis and to the x-axis, where the angles 45 and 135 are written. The pattern repeats every 180 degrees.' });
}

/** A graph with a horizontal line y = k and the points where it cuts the curve. `xs`: [{ x, side }], the label goes on that side. */
function buildSolve(id, { key, k, klabel, label: lineAt, xs, title, desc, yrange = [-1.5, 1.5], height = 330 }) {
  const p = gplane({ x: [0, 360, 90], y: [yrange[0], yrange[1], 1], height });
  const meta = newMeta();
  curve(p, meta, key);
  guideH(p, k, 0, 360);
  p.raw(`<text class="svg-t alt" data-note="line" x="${f(p.X(lineAt.x))}" y="${f(p.Y(k) + (lineAt.below ? 32 : -12))}" text-anchor="${lineAt.anchor}">${label(klabel)}</text>`);
  // each solution is written at the foot of its dashed line, on the side of the x-axis the curve is not on
  xs.forEach(({ x }, i) => {
    guideV(p, x, 0, k);
    mark(p, meta, `x${i}`, x, k, { on: key, text: `${x}${DEG}`, dx: 0, dy: k > 0 ? 34 : -14, anchor: 'middle', ty: 0 });
  });
  xrow(p, [90, 180, 270, 360]);
  meta.line = { y: k };
  meta.facts = [...xs.map((v) => String(v.x)), String(Math.abs(k))];
  return finish(p, meta, { id, title, desc });
}

function buildQSolve(id) {
  // narrower than the others: a question figure and a figure inside a worked example are shown in a narrower box
  const p = gplane({ x: [0, 360, 90], y: [-1.5, 1.5, 1], width: 420, height: 290 });
  const meta = newMeta();
  curve(p, meta, 'sin');
  guideH(p, 0.8, 0, 360);
  p.raw(`<text class="svg-t alt" data-note="line" x="${f(p.X(360) - 6)}" y="${f(p.Y(0.8) - 12)}" text-anchor="end">${label('y = 0.8')}</text>`);
  xrow(p, [90, 180, 270, 360]);
  meta.line = { y: 0.8 };
  meta.facts = ['0.8'];
  return finish(p, meta, { id, title: 'The sine graph cut by the line y = 0.8', desc: 'The graph of y = sin x for x from 0 to 360 degrees, with a dashed horizontal line across it at y = 0.8. The line cuts the wave twice, once on the way up and once on the way down.' });
}

function buildAmplitude(id) {
  const p = gplane({ x: [0, 360, 90], y: [-2.5, 2.5, 1], height: 440 });
  const meta = newMeta();
  curve(p, meta, 'sin', { cls: 'curve-b' });
  curve(p, meta, 'two-sin');
  for (const y of [1, 2]) guideH(p, y, 0, 90);
  mark(p, meta, 'peak2', 90, 2, { on: 'two-sin' });
  mark(p, meta, 'peak1', 90, 1, { on: 'sin' });
  note(p, p.X(260), p.Y(2.1), 'solid: y = 2 sin x', 'solid', 'middle');
  p.raw(`<text class="svg-t" data-note="dashed" x="${f(p.X(260))}" y="${f(p.Y(1.45))}" text-anchor="middle">${label('dashed: y = sin x')}</text>`);
  xrow(p, [90, 180, 270, 360]);
  meta.facts = ['90', '2', '1'];
  return finish(p, meta, { id, title: 'The graphs of y = sin x and y = 2 sin x', desc: 'Two waves for x from 0 to 360 degrees. The dashed wave is y = sin x, with highest point (90, 1). The solid wave is y = 2 sin x, with highest point (90, 2). Dashed lines run from both highest points across to the y-axis. They cross the x-axis at the same places, 0, 180 and 360. The solid wave is twice as tall, between -2 and 2.' });
}

function buildPeriod(id) {
  const p = gplane({ x: [0, 360, 90], y: [-2.2, 2.2, 1], height: 400 });
  const meta = newMeta();
  curve(p, meta, 'sin', { cls: 'curve-b' });
  curve(p, meta, 'sin-2x');
  mark(p, meta, 'peak', 45, 1, { on: 'sin-2x', text: `(45${DEG}, 1)`, dx: 12, dy: -14 });
  mark(p, meta, 'end', 180, 0, { on: 'sin-2x' });
  note(p, p.X(260), p.Y(-1.45), 'dashed: y = sin x', 'dashed', 'middle');
  note(p, p.X(260), p.Y(-1.95), 'solid: y = sin 2x', 'solid', 'middle');
  xrow(p, [90, 180, 270, 360]);
  meta.facts = ['45', '1', '180'];
  return finish(p, meta, { id, title: 'The graphs of y = sin x and y = sin 2x', desc: 'Two waves for x from 0 to 360 degrees. The dashed wave is y = sin x, one cycle long. The solid wave is y = sin 2x. It is squashed from the sides, so it completes one cycle by 180 degrees and a second cycle by 360. Its first highest point is at (45, 1), and a marked point shows where its first cycle ends, on the x-axis at 180.' });
}

function buildCount(id) {
  const p = gplane({ x: [0, 360, 90], y: [-1.5, 1.5, 1], width: 420, height: 290 });
  const meta = newMeta();
  curve(p, meta, 'sin-2x');
  guideH(p, 0.5, 0, 360);
  p.raw(`<text class="svg-t alt" data-note="line" x="${f(p.X(360) - 6)}" y="${f(p.Y(0.5) - 12)}" text-anchor="end">${label('y = 0.5')}</text>`);
  [15, 75, 195, 255].forEach((x, i) => mark(p, meta, `c${i}`, x, 0.5, { on: 'sin-2x' }));
  xrow(p, [90, 180, 270, 360]);
  meta.line = { y: 0.5 };
  meta.facts = ['0.5'];
  return finish(p, meta, { id, title: 'The graph of y = sin 2x cut by the line y = 0.5', desc: 'The graph of y = sin 2x for x from 0 to 360 degrees, a wave with two cycles. A dashed horizontal line at y = 0.5 cuts it at four marked points: two in the first cycle and two in the second.' });
}

const BUILDERS = {
  'trig-graphs-unit-circle': () => buildUnitCircle('trig-graphs-unit-circle'),
  'trig-graphs-quadrants': () => buildQuadrants('trig-graphs-quadrants'),
  'trig-graphs-q-circle': () => buildQCircle('trig-graphs-q-circle'),
  'trig-graphs-tri-30-60': () => buildTriangle('trig-graphs-tri-30-60', {
    // half an equilateral triangle: the right angle at A, 30 degrees at B, 60 degrees at C. Sides 1, root 3 and 2.
    A: [0, 0], B: [SQ3, 0], C: [0, 1],
    sides: [{ from: 'A', to: 'C', value: 1, text: '1' }, { from: 'A', to: 'B', value: SQ3, text: `${ROOT}3` }, { from: 'B', to: 'C', value: 2, text: '2' }],
    angles: [{ at: 'B', value: 30, reach: 0.72 }, { at: 'C', value: 60, reach: 0.42 }],
    title: 'The 30, 60, 90 triangle',
    desc: 'A right-angled triangle with the right angle at the bottom left. The short side going up is 1. The side along the bottom is root 3. The longest side, the hypotenuse, is 2. The angle at the bottom right is 30 degrees and the angle at the top is 60 degrees. It is half of an equilateral triangle of side 2.',
  }),
  'trig-graphs-tri-45': () => buildTriangle('trig-graphs-tri-45', {
    A: [0, 0], B: [1.4, 0], C: [0, 1.4],
    sides: [{ from: 'A', to: 'B', value: 1, text: '1' }, { from: 'A', to: 'C', value: 1, text: '1' }, { from: 'B', to: 'C', value: Math.SQRT2, text: `${ROOT}2` }],
    angles: [{ at: 'B', value: 45, reach: 0.62 }, { at: 'C', value: 45, reach: 0.62 }],
    title: 'The 45, 45, 90 triangle',
    desc: 'A right-angled triangle with the right angle at the bottom left. The two short sides are both 1. The hypotenuse is root 2. The other two angles are both 45 degrees. It is half of a square of side 1.',
  }),
  'trig-graphs-exact-sin': () => buildExactSin('trig-graphs-exact-sin'),
  'trig-graphs-sine': () => buildSine('trig-graphs-sine'),
  'trig-graphs-cosine': () => buildCosine('trig-graphs-cosine'),
  'trig-graphs-sine-mirror': () => buildSineMirror('trig-graphs-sine-mirror'),
  'trig-graphs-sine-odd': () => buildSineOdd('trig-graphs-sine-odd'),
  'trig-graphs-cos-even': () => buildCosEven('trig-graphs-cos-even'),
  'trig-graphs-tan': () => buildTan('trig-graphs-tan'),
  'trig-graphs-solve-sin': () => buildSolve('trig-graphs-solve-sin', {
    key: 'sin', k: 0.5, klabel: 'y = 0.5', label: { x: 354, anchor: 'end', below: false }, xs: [{ x: 30 }, { x: 150 }],
    title: 'Solving sin x = 0.5 from the graph',
    desc: 'The graph of y = sin x for x from 0 to 360 degrees, with a dashed horizontal line at y = 0.5. The line cuts the wave at two marked points, at x = 30 degrees on the way up and x = 150 degrees on the way down. Dashed lines drop from each point to the x-axis.',
  }),
  'trig-graphs-solve-cos': () => buildSolve('trig-graphs-solve-cos', {
    key: 'cos', k: -0.5, klabel: `y = ${MINUS}0.5`, label: { x: 354, anchor: 'end', below: true }, xs: [{ x: 120 }, { x: 240 }],
    title: 'Solving cos x = -0.5 from the graph',
    desc: 'The graph of y = cos x for x from 0 to 360 degrees, with a dashed horizontal line at y = -0.5. The line cuts the wave at two marked points, at x = 120 degrees and x = 240 degrees. Dashed lines rise from each point to the x-axis.',
  }),
  'trig-graphs-solve-tan': () => buildSolve('trig-graphs-solve-tan', {
    key: 'tan', k: -1, klabel: `y = ${MINUS}1`, label: { x: 14, anchor: 'start', below: false }, xs: [{ x: 135 }, { x: 315 }], yrange: [-3, 3], height: 480,
    title: 'Solving tan x = -1 from the graph',
    desc: 'The graph of y = tan x for x from 0 to 360 degrees, with a dashed horizontal line at y = -1. The line cuts the curve at two marked points, at x = 135 degrees and x = 315 degrees. Dashed lines rise from each point to the x-axis.',
  }),
  'trig-graphs-q-solve': () => buildQSolve('trig-graphs-q-solve'),
  'trig-graphs-amplitude': () => buildAmplitude('trig-graphs-amplitude'),
  'trig-graphs-period': () => buildPeriod('trig-graphs-period'),
  'trig-graphs-count': () => buildCount('trig-graphs-count'),
  'trig-graphs-flip': () => buildSolve('trig-graphs-flip', {
    key: 'sin', k: -0.5, klabel: `y = ${MINUS}0.5`, label: { x: 10, anchor: 'start', below: true }, xs: [{ x: 210 }, { x: 330 }],
    title: 'Which angles have a sine of -0.5',
    desc: 'The graph of y = sin x for x from 0 to 360 degrees, with a dashed horizontal line at y = -0.5. The line cuts the wave at two marked points, at x = 210 degrees and x = 330 degrees. Dashed lines rise from each point to the x-axis.',
  }),
};

export const FIGURES = Object.fromEntries(Object.keys(BUILDERS).map((id) => [id, () => BUILDERS[id]().svg]));

/** What was drawn, for the spec: the svg and the facts it states (points, curves, triangles, lines). */
export const GEOMETRY = (id) => ({ id, ...BUILDERS[id]() });
