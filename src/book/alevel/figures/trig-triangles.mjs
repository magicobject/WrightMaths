// Figures for the Trigonometry in triangles page (src/pages/books/a-level/trig-triangles.html).
// Every triangle is DRAWN FROM ITS MEASUREMENTS: solve() finds all three sides and all three angles from the numbers the
// question gives, and the corners are placed from those, so the picture is to scale. A side or angle the question asks for
// is labelled x or theta, never with its value. Bearing diagrams are drawn from the distances and bearings in the question.
// GEOMETRY(id) returns the drawn corners and the measurements the figure states, so test/alevel-trig-triangles.spec.ts can
// measure the drawing and compare it with the question.
import { plane } from '../figure-lib.mjs';

const RAD = Math.PI / 180;
const sin = (d) => Math.sin(d * RAD);
const cos = (d) => Math.cos(d * RAD);
const asin = (x) => Math.asin(x) / RAD;
const acos = (x) => Math.acos(x) / RAD;
const DEG = '°';
const THETA = 'θ';
const W = 640;
const H = 400;
const SIDES = ['a', 'b', 'c'];
const ANGLES = ['A', 'B', 'C'];
const SIDE_ENDS = { a: ['B', 'C'], b: ['C', 'A'], c: ['A', 'B'] };

/** All six measurements of a triangle from three of them (SSS, SAS, ASA/AAS, or SSA with `obtuse` choosing the second answer). */
export function solve(given, { obtuse = false } = {}) {
  const t = { ...given };
  const sides = SIDES.filter((k) => t[k] != null);
  const angles = ANGLES.filter((k) => t[k] != null);
  const fromSides = () => {
    ANGLES.forEach((K, i) => {
      const [x, y, z] = [SIDES[i], SIDES[(i + 1) % 3], SIDES[(i + 2) % 3]];
      t[K] = acos((t[y] ** 2 + t[z] ** 2 - t[x] ** 2) / (2 * t[y] * t[z]));
    });
  };
  if (sides.length === 3) fromSides();
  else if (sides.length === 2 && angles.length === 1) {
    const i = ANGLES.indexOf(angles[0]);
    if (t[SIDES[i]] == null) {
      // two sides and the angle between them
      const [y, z] = [SIDES[(i + 1) % 3], SIDES[(i + 2) % 3]];
      t[SIDES[i]] = Math.sqrt(t[y] ** 2 + t[z] ** 2 - 2 * t[y] * t[z] * cos(t[angles[0]]));
      fromSides();
    } else {
      // two sides and an angle opposite one of them
      const j = SIDES.findIndex((k, idx) => idx !== i && t[k] != null);
      const k = 3 - i - j;
      const first = asin((t[SIDES[j]] * sin(t[ANGLES[i]])) / t[SIDES[i]]);
      t[ANGLES[j]] = obtuse ? 180 - first : first;
      t[ANGLES[k]] = 180 - t[ANGLES[i]] - t[ANGLES[j]];
      t[SIDES[k]] = (t[SIDES[i]] * sin(t[ANGLES[k]])) / sin(t[ANGLES[i]]);
    }
  } else if (sides.length === 1 && angles.length >= 2) {
    const third = ANGLES.find((K) => t[K] == null);
    if (third) t[third] = 180 - angles.reduce((s, K) => s + t[K], 0);
    const i = SIDES.findIndex((k) => t[k] != null);
    const k = t[SIDES[i]] / sin(t[ANGLES[i]]);
    SIDES.forEach((s, idx) => { t[s] = k * sin(t[ANGLES[idx]]); });
  } else {
    throw new Error('solve: not enough measurements');
  }
  return t;
}

const lower = (V) => V.toLowerCase();
const unit = ([x, y]) => { const n = Math.hypot(x, y); return [x / n, y / n]; };
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const num = (v) => String(Math.round(v * 1000) / 1000);
const halfWidth = (text) => String(text).replace(/[_^]/g, '').length * 6.5 + 4;

/** Corners of a triangle with the side `base` (two letters, left to right) along the bottom, the third corner above it. */
function place(t, base, mirror) {
  const [P, Q] = base;
  const R = ANGLES.find((V) => !base.includes(V));
  const pq = t[lower(R)];
  const pr = t[lower(Q)];
  const raw = { [P]: [0, 0], [Q]: [pq, 0], [R]: [pr * cos(t[P]), pr * sin(t[P])] };
  if (mirror) for (const V of Object.keys(raw)) raw[V] = [-raw[V][0], raw[V][1]];
  return raw;
}

/** Scale and centre corners into a box of the picture; returns the corners in picture units (y up). */
function fit(corners, box) {
  const pts = Object.values(corners);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = Math.min((box.right - box.left) / (x1 - x0 || 1), (box.top - box.bottom) / (y1 - y0 || 1));
  const ox = (box.left + box.right) / 2 - (s * (x0 + x1)) / 2;
  const oy = (box.bottom + box.top) / 2 - (s * (y0 + y1)) / 2;
  const out = {};
  for (const [V, [x, y]] of Object.entries(corners)) out[V] = [ox + s * x, oy + s * y];
  return out;
}

const BOX = { left: 120, right: W - 120, bottom: 90, top: H - 70 };

/** A canvas where one unit is one pixel and y points up. */
/** Records every edge drawn (solid or dashed, labelled or not) in p.edges, and which edge each side label belongs to in p.sideLabels. */
const canvas = () => {
  const p = plane({ width: W, height: H, left: 0, right: 0, top: 0, bottom: 0, xmin: 0, xmax: W, ymin: 0, ymax: H, grid: false, axes: false, ticks: false });
  const draw = p.line;
  p.edges = [];
  p.sideLabels = [];
  p.line = (x1, y1, x2, y2, o) => { if (o?.cls !== 'guide') p.edges.push([[x1, y1], [x2, y2]]); return draw(x1, y1, x2, y2, o); };
  return p;
};
/** Say that the label just drawn belongs to the edge from corner `from` to corner `to`. */
const tagSide = (p, text, from, to) => p.sideLabels.push({ text, from, to });

const HALO = 'paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round';
const finish = (p, meta) => p.svg(meta).replace(/<text class="svg-t([^>]*)>([\s\S]*?)<\/text>/g, (whole, attrs, body) => (body.includes('<tspan') ? whole : `<text style="${HALO}" class="svg-t${attrs}>${body}</text>`));

function drawArc(p, v, d1, d2, r) {
  // d1 and d2 are unit directions from v; draw the shorter arc between them
  const a1 = Math.atan2(d1[1], d1[0]);
  let da = Math.atan2(d2[1], d2[0]) - a1;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  const pts = [];
  for (let i = 0; i <= 24; i += 1) { const a = a1 + (da * i) / 24; pts.push(`${(v[0] + r * Math.cos(a)).toFixed(1)} ${(H - (v[1] + r * Math.sin(a))).toFixed(1)}`); }
  p.raw(`<path class="curve" style="stroke-width:3.5" d="M${pts.join(' L')}"/>`);
}

function drawRightAngle(p, v, d1, d2, size = 24) {
  const pts = [[v[0] + d1[0] * size, v[1] + d1[1] * size], [v[0] + (d1[0] + d2[0]) * size, v[1] + (d1[1] + d2[1]) * size], [v[0] + d2[0] * size, v[1] + d2[1] * size]];
  p.raw(`<polyline points="${pts.map(([x, y]) => `${x.toFixed(1)},${(H - y).toFixed(1)}`).join(' ')}" fill="none" style="stroke:var(--ink);stroke-width:3"/>`);
}

/** An angle mark at corner v between the directions to two other corners, with its label (or none) inside. */
function markAngle(p, v, toward1, toward2, degrees, text) {
  const d1 = unit(sub(toward1, v));
  const d2 = unit(sub(toward2, v));
  if (Math.abs(degrees - 90) < 0.01) drawRightAngle(p, v, d1, d2);
  else drawArc(p, v, d1, d2, 40);
  if (!text) return;
  const bis = unit([d1[0] + d2[0], d1[1] + d2[1]]);
  const w = halfWidth(text);
  const dist = Math.max(40 + 16 + w, (w * 0.7 + 18) / Math.max(Math.sin((degrees / 2) * RAD), 0.3));
  p.text(v[0] + bis[0] * dist, v[1] + bis[1] * dist, text, { dy: 8 });
}

/** A side label: beside the middle of the side P-Q, on the side away from `awayFrom`. */
function labelSide(p, P, Q, awayFrom, text, ends) {
  if (ends) tagSide(p, text, ...ends);
  const m = mid(P, Q);
  const n = unit(sub(m, awayFrom));
  const off = 18 + halfWidth(text) * Math.abs(n[0]) + 12 * Math.abs(n[1]);
  p.text(m[0] + n[0] * off, m[1] + n[1] * off, text, { dy: 8 });
}

/** A corner letter, outside the shape. */
function labelCorner(p, v, centre, letter, distance = 28) {
  const out = unit(sub(v, centre));
  p.text(v[0] + out[0] * distance, v[1] + out[1] * distance, letter, { cls: 'alt', dy: 8 });
}

const centroid = (pts) => [0, 1].map((k) => pts.reduce((s, q) => s + q[k], 0) / pts.length);

/** Where a measured figure puts its facts, for the spec to check: lengths between corners, angles at corners, areas. */
const facts = (lengths = [], angles = [], areas = []) => ({ lengths, angles, areas });

// ---- single-triangle figures ----
// `given`: the measurements the question states, and the ones the triangle is solved from. `unknown`: the one the question
// asks for (labelled x or theta, never with its value). `base`: the two corners on the bottom, left to right.
// `hidden`: measurements used to draw the triangle but not stated or labelled (the question asks for them).
const SPECS = {
  'trig-triangles-labels': { given: { a: 8, b: 7, c: 5 }, base: ['B', 'C'], schematic: true, title: 'A triangle with its corners and sides labelled', desc: 'Triangle ABC. The corners are labelled A at the top, B at the bottom left and C at the bottom right. The side opposite corner A is labelled a, the side opposite B is labelled b, and the side opposite C is labelled c. Small arcs mark the three angles.' },
  'trig-triangles-sine-side': { given: { A: 40, B: 65, b: 12 }, unknown: 'a', base: ['B', 'C'], title: 'Triangle ABC with two angles and one side', desc: 'Triangle ABC with angle A equal to 40 degrees, angle B equal to 65 degrees and side b equal to 12 centimetres. The side a, opposite A, is labelled x.' },
  'trig-triangles-sine-angle': { given: { a: 12, A: 70, b: 9 }, unknown: 'B', base: ['B', 'C'], title: 'Triangle ABC with two sides and one angle', desc: 'Triangle ABC with side a equal to 12 centimetres, angle A equal to 70 degrees and side b equal to 9 centimetres. The angle at B is labelled theta.' },
  'trig-triangles-choose': { given: { A: 38, B: 60, a: 7 }, unknown: 'c', base: ['A', 'B'], title: 'Triangle ABC with two angles and one side', desc: 'Triangle ABC with angle A equal to 38 degrees, angle B equal to 60 degrees and side a equal to 7 centimetres. The side c, opposite C, is labelled x.' },
  'trig-triangles-cos-side': { given: { b: 7, c: 9, A: 52 }, unknown: 'a', base: ['B', 'C'], title: 'Triangle ABC with two sides and the angle between them', desc: 'Triangle ABC with side b equal to 7 centimetres, side c equal to 9 centimetres and angle A, between them, equal to 52 degrees. The side a, opposite A, is labelled x.' },
  'trig-triangles-cos-angle': { given: { a: 7, b: 9, c: 12 }, unknown: 'C', base: ['A', 'B'], title: 'Triangle ABC with all three sides', desc: 'Triangle ABC with side a equal to 7 centimetres, side b equal to 9 centimetres and side c equal to 12 centimetres. The angle at C, opposite the longest side, is labelled theta.' },
  'trig-triangles-area': { given: { a: 11, b: 8, C: 38 }, base: ['B', 'A'], shade: true, mirror: true, title: 'A triangle with two sides and the angle between them', desc: 'Triangle ABC, shaded. Side a equals 11 centimetres and side b equals 8 centimetres. The angle C between them equals 38 degrees.' },
  'trig-triangles-area-obtuse': { given: { a: 9, b: 6, C: 125 }, base: ['B', 'A'], shade: true, title: 'A triangle with two sides and an obtuse angle between them', desc: 'Triangle ABC, shaded. Side a equals 9 centimetres and side b equals 6 centimetres. The angle C between them equals 125 degrees, which is more than a right angle.' },
  'trig-triangles-area-angle': { given: { a: 10, b: 7 }, hidden: { C: asin(24 / 35) }, unknown: 'C', area: 24, base: ['B', 'A'], shade: true, title: 'A triangle with two sides and its area', desc: 'Triangle ABC, shaded, with area 24 square centimetres. Side a equals 10 centimetres and side b equals 7 centimetres. The angle C between them is labelled theta.' },
  'trig-triangles-area-sss': { given: { a: 8, b: 9, c: 11 }, base: ['B', 'C'], shade: true, title: 'A triangle with three sides', desc: 'Triangle ABC, shaded. Side a equals 8 centimetres, side b equals 9 centimetres and side c equals 11 centimetres. No angle is given.' },
  'trig-triangles-q-sine-side': { given: { A: 35, B: 80, a: 6 }, unknown: 'b', base: ['A', 'B'], title: 'Triangle ABC with two angles and a side', desc: 'Triangle ABC with angle A equal to 35 degrees, angle B equal to 80 degrees and side a equal to 6 centimetres. The side b is labelled x.' },
  'trig-triangles-q-sine-angle': { given: { c: 12.5, C: 75, a: 9 }, unknown: 'A', base: ['A', 'B'], title: 'Triangle ABC with two sides and an angle', desc: 'Triangle ABC with side a equal to 9 centimetres, side c equal to 12.5 centimetres and angle C equal to 75 degrees. The angle at A is labelled theta.' },
  'trig-triangles-q-cos-side': { given: { b: 8, c: 11, A: 40 }, unknown: 'a', base: ['B', 'C'], mirror: true, title: 'Triangle ABC with two sides and the angle between them', desc: 'Triangle ABC with side b equal to 8 centimetres, side c equal to 11 centimetres and the angle A between them equal to 40 degrees. The side a is labelled x.' },
  'trig-triangles-q-cos-angle': { given: { a: 6, b: 7, c: 10 }, unknown: 'A', base: ['B', 'C'], title: 'Triangle ABC with all three sides', desc: 'Triangle ABC with side a equal to 6 centimetres, side b equal to 7 centimetres and side c equal to 10 centimetres. The angle at A is labelled theta.' },
  'trig-triangles-q-choose': { given: { A: 44, C: 71, b: 10 }, unknown: 'c', base: ['A', 'C'], title: 'Triangle ABC with two angles and the side between them', desc: 'Triangle ABC with angle A equal to 44 degrees, angle C equal to 71 degrees and side b, between the two angles, equal to 10 centimetres. The side c is labelled x.' },
  'trig-triangles-q-area': { given: { a: 5, b: 6, c: 7 }, base: ['B', 'C'], shade: true, title: 'A triangle with three sides', desc: 'Triangle ABC, shaded. Side a equals 5 centimetres, side b equals 6 centimetres and side c equals 7 centimetres. No angle is given.' },
  'trig-triangles-q-mc-area': { given: { c: 7, a: 10, B: 40 }, base: ['A', 'C'], shade: true, title: 'Triangle ABC with two sides and the angle between them', desc: 'Triangle ABC, shaded. Side c equals 7 centimetres, side a equals 10 centimetres and the angle B between them equals 40 degrees.' },
  'trig-triangles-e-cos-side': { given: { b: 12, c: 15, A: 64 }, unknown: 'a', base: ['B', 'C'], title: 'Triangle ABC with two sides and the angle between them', desc: 'Triangle ABC with side b equal to 12 centimetres, side c equal to 15 centimetres and the angle A between them equal to 64 degrees. The side a is labelled x.' },
  'trig-triangles-e-sine-angle': { given: { a: 14, A: 62, b: 11 }, unknown: 'B', base: ['B', 'C'], mirror: true, title: 'Triangle ABC with two sides and an angle', desc: 'Triangle ABC with side a equal to 14 centimetres, angle A equal to 62 degrees and side b equal to 11 centimetres. The angle at B is labelled theta.' },
  'trig-triangles-e-area': { given: { a: 8.5, b: 11.2, C: 41 }, base: ['B', 'A'], mirror: true, shade: true, title: 'A triangle with two sides and the angle between them', desc: 'Triangle ABC, shaded. Side a equals 8.5 centimetres, side b equals 11.2 centimetres and the angle C between them equals 41 degrees.' },
};

function buildSingle(id) {
  const spec = SPECS[id];
  const t = solve({ ...spec.given, ...spec.hidden });
  const corners = fit(place(t, spec.base, spec.mirror), BOX);
  const p = canvas();
  const c = centroid(Object.values(corners));
  if (spec.shade) p.raw(`<polygon class="shade" points="${ANGLES.map((K) => `${corners[K][0].toFixed(1)},${(H - corners[K][1]).toFixed(1)}`).join(' ')}"/>`);
  for (const [P, Q] of [['A', 'B'], ['B', 'C'], ['C', 'A']]) p.line(...corners[P], ...corners[Q], { cls: 'line', clip: false });
  for (const K of ANGLES) labelCorner(p, corners[K], c, K);
  const lengths = [];
  const angles = [];
  for (const k of SIDES) {
    const shown = spec.schematic ? k : spec.given[k] != null ? `${num(spec.given[k])} cm` : spec.unknown === k ? 'x' : null;
    if (!shown) continue;
    const [P, Q] = SIDE_ENDS[k];
    labelSide(p, corners[P], corners[Q], corners[ANGLES.find((K) => K !== P && K !== Q)], shown, [P, Q]);
    if (spec.given[k] != null && !spec.schematic) lengths.push({ from: P, to: Q, value: spec.given[k] });
  }
  for (const K of ANGLES) {
    const others = ANGLES.filter((o) => o !== K);
    const shown = spec.schematic ? '' : spec.given[K] != null ? `${num(spec.given[K])}${DEG}` : spec.unknown === K ? THETA : null;
    if (shown === null && !spec.schematic) continue;
    markAngle(p, corners[K], corners[others[0]], corners[others[1]], t[K], shown);
    if (spec.given[K] != null && !spec.schematic) angles.push({ at: K, from: others[0], to: others[1], value: spec.given[K] });
  }
  const areas = spec.area ? [{ corners: ANGLES, value: spec.area }] : [];
  if (spec.area) p.note(24, 44, `area = ${spec.area} cm^2`, { cls: 'alt' });
  let unknown = null;
  if (spec.unknown) {
    unknown = SIDES.includes(spec.unknown)
      ? { kind: 'length', from: SIDE_ENDS[spec.unknown][0], to: SIDE_ENDS[spec.unknown][1] }
      : { kind: 'angle', at: spec.unknown, from: ANGLES.filter((o) => o !== spec.unknown)[0], to: ANGLES.filter((o) => o !== spec.unknown)[1] };
  }
  return { svg: finish(p, { id, title: spec.title, desc: spec.desc }), corners, ...facts(lengths, angles, areas), unknown, kind: 'shape', edges: p.edges, sideLabels: p.sideLabels };
}

// ---- the ambiguous case: two triangles that share the corners A and C ----
// Angle A = 30 degrees, side b = AC = 10 cm and side a = BC = 7 cm. A circle of radius 7 round C meets the line from A in two places.
const AMBIGUOUS = { A: 30, a: 7, b: 10 };

function buildAmbiguous(id) {
  const far = solve(AMBIGUOUS); // B acute
  const near = solve(AMBIGUOUS, { obtuse: true }); // B obtuse
  const raw = { A: [0, 0], C: [AMBIGUOUS.b * cos(AMBIGUOUS.A), AMBIGUOUS.b * sin(AMBIGUOUS.A)], B_1: [far.c, 0], B_2: [near.c, 0] };
  const k = fit(raw, { left: 110, right: W - 110, bottom: 130, top: H - 90 });
  const p = canvas();
  p.line(...k.A, ...k.B_1, { cls: 'line', clip: false });
  p.line(...k.A, ...k.C, { cls: 'line', clip: false });
  p.line(...k.C, ...k.B_1, { cls: 'line', clip: false });
  p.line(...k.C, ...k.B_2, { cls: 'curve-b', clip: false });
  drawArc(p, k.A, [1, 0], unit(sub(k.C, k.A)), 40);
  p.text(k.A[0] + 104, k.A[1] + 20, `30${DEG}`, { dy: 8 });
  p.text(k.A[0] - 30, k.A[1] - 6, 'A', { cls: 'alt', anchor: 'end', dy: 8 });
  p.text(k.C[0], k.C[1] + 30, 'C', { cls: 'alt', dy: 8 });
  p.text(k.B_1[0] + 30, k.B_1[1] - 22, 'B_1', { cls: 'alt', anchor: 'start', dy: 8 });
  p.text(k.B_2[0] - 6, k.B_2[1] - 34, 'B_2', { cls: 'alt', anchor: 'middle', dy: 8 });
  const mAC = mid(k.A, k.C);
  p.text(mAC[0] - 54, mAC[1] + 30, '10 cm', { dy: 8 });
  tagSide(p, '10 cm', 'A', 'C');
  const m1 = mid(k.C, k.B_1);
  p.text(m1[0] + 52, m1[1] + 18, '7 cm', { dy: 8 });
  tagSide(p, '7 cm', 'C', 'B_1');
  const m2 = mid(k.C, k.B_2);
  p.text(m2[0] + 18, m2[1] - 6, '7 cm', { anchor: 'start', dy: 8 });
  tagSide(p, '7 cm', 'C', 'B_2');
  return {
    svg: finish(p, { id, title: 'Two different triangles that fit the same measurements', desc: 'Corner A at the left and corner C above and to the right of it. The side AC is 10 centimetres and the angle at A, between AC and the bottom line, is 30 degrees. Two lines each 7 centimetres long run from C down to the bottom line: a solid line to B sub 1, farther from A, and a dashed line to B sub 2, nearer to A. Triangle A B sub 1 C and triangle A B sub 2 C both fit the measurements.' }),
    corners: k,
    ...facts(
      [{ from: 'A', to: 'C', value: 10 }, { from: 'C', to: 'B_1', value: 7 }, { from: 'C', to: 'B_2', value: 7 }],
      [{ at: 'A', from: 'B_1', to: 'C', value: 30 }, { at: 'A', from: 'B_2', to: 'C', value: 30 }],
    ),
    unknown: null,
    kind: 'shape',
    edges: p.edges,
    sideLabels: p.sideLabels,
  };
}

// ---- the flip figure: the same two sides, two angles, the same area ----
const FLIP = { b: 12, c: 9, area: 40 };

function buildFlipArea(id) {
  const acute = asin((2 * FLIP.area) / (FLIP.b * FLIP.c));
  const obtuse = 180 - acute;
  const raw = { A: [0, 0], C: [FLIP.b, 0], B_1: [FLIP.c * cos(acute), FLIP.c * sin(acute)], B_2: [FLIP.c * cos(obtuse), FLIP.c * sin(obtuse)] };
  const k = fit(raw, { left: 130, right: W - 130, bottom: 100, top: H - 70 });
  const p = canvas();
  p.line(...k.B_2, ...k.C, { cls: 'curve-b', clip: false });
  for (const [P, Q] of [['A', 'C'], ['A', 'B_1'], ['A', 'B_2'], ['B_1', 'C']]) p.line(...k[P], ...k[Q], { cls: 'line', clip: false });
  drawArc(p, k.A, [1, 0], unit(sub(k.B_1, k.A)), 40);
  drawArc(p, k.A, [-1, 0], unit(sub(k.B_2, k.A)), 40);
  p.text(k.A[0] + 66, k.A[1] + 20, `${num(Math.round(acute * 10) / 10)}${DEG}`, { dy: 8, anchor: 'start' });
  p.text(k.A[0] - 62, k.A[1] + 22, `${num(Math.round(obtuse * 10) / 10)}${DEG}`, { dy: 8, anchor: 'end' });
  p.text(k.A[0], k.A[1] - 28, 'A', { cls: 'alt', dy: 8 });
  p.text(k.C[0] + 30, k.C[1] - 6, 'C', { cls: 'alt', anchor: 'start', dy: 8 });
  p.text(k.B_1[0] + 30, k.B_1[1] + 8, 'B_1', { cls: 'alt', anchor: 'start', dy: 8 });
  p.text(k.B_2[0] - 30, k.B_2[1] + 8, 'B_2', { cls: 'alt', anchor: 'end', dy: 8 });
  p.text((k.A[0] + k.C[0]) / 2, k.A[1] - 30, '12 cm', { dy: 8 });
  tagSide(p, '12 cm', 'A', 'C');
  // Beside AB_1, toward B_1, on the outer (left) side. Inside the triangle the label is wider than the gap
  // between AB_1 and B_1 C, so it would sit nearer B_1 C; out here AB_1 is clearly the nearest edge.
  const m1 = [k.A[0] + 0.85 * (k.B_1[0] - k.A[0]), k.A[1] + 0.85 * (k.B_1[1] - k.A[1])];
  p.text(m1[0] - 10, m1[1] - 10, '9 cm', { anchor: 'end', dy: 8 });
  tagSide(p, '9 cm', 'A', 'B_1');
  const m2 = mid(k.A, k.B_2);
  p.text(m2[0] - 16, m2[1] + 4, '9 cm', { anchor: 'end', dy: 8 });
  tagSide(p, '9 cm', 'A', 'B_2');
  return {
    svg: finish(p, { id, title: 'Two triangles with the same two sides and the same area', desc: 'Corner A with a base AC of 12 centimetres running to the right. Two sides of 9 centimetres leave A: one up and to the right, to B sub 1, making an angle of 47.8 degrees with the base, and one up and to the left, to B sub 2, making an angle of 132.2 degrees with the base. Triangles A B sub 1 C and A B sub 2 C have the same area.' }),
    corners: k,
    ...facts(
      [{ from: 'A', to: 'C', value: 12 }, { from: 'A', to: 'B_1', value: 9 }, { from: 'A', to: 'B_2', value: 9 }],
      [{ at: 'A', from: 'C', to: 'B_1', value: Math.round(acute * 10) / 10 }, { at: 'A', from: 'C', to: 'B_2', value: Math.round(obtuse * 10) / 10 }],
      [{ corners: ['A', 'B_1', 'C'], value: 40 }, { corners: ['A', 'B_2', 'C'], value: 40 }],
    ),
    unknown: null,
    kind: 'shape',
    edges: p.edges,
    sideLabels: p.sideLabels,
  };
}

// ---- a four-sided field split into two triangles by a diagonal ----
const FIELD = { ab: 6, bc: 9, b: 110, cd: 7, da: 8 };

function buildField(id) {
  const ac = Math.sqrt(FIELD.ab ** 2 + FIELD.bc ** 2 - 2 * FIELD.ab * FIELD.bc * cos(FIELD.b));
  const B = [0, 0];
  const C = [FIELD.bc, 0];
  const A = [FIELD.ab * cos(FIELD.b), FIELD.ab * sin(FIELD.b)];
  // D is FIELD.da from A and FIELD.cd from C, on the far side of AC from B
  const along = unit(sub(C, A));
  const x = (FIELD.da ** 2 - FIELD.cd ** 2 + ac ** 2) / (2 * ac);
  const h = Math.sqrt(FIELD.da ** 2 - x * x);
  const left = [-along[1], along[0]];
  const foot = [A[0] + along[0] * x, A[1] + along[1] * x];
  const cands = [[foot[0] + left[0] * h, foot[1] + left[1] * h], [foot[0] - left[0] * h, foot[1] - left[1] * h]];
  const D = cands.sort((q, r) => Math.hypot(...sub(r, B)) - Math.hypot(...sub(q, B)))[0];
  const k = fit({ A, B, C, D }, { left: 130, right: W - 130, bottom: 80, top: H - 70 });
  const p = canvas();
  const c = centroid([k.A, k.B, k.C, k.D]);
  p.line(...k.A, ...k.C, { cls: 'curve-b', clip: false });
  for (const [P, Q] of [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']]) p.line(...k[P], ...k[Q], { cls: 'line', clip: false });
  for (const K of ['A', 'B', 'C', 'D']) labelCorner(p, k[K], c, K);
  labelSide(p, k.A, k.B, c, '6 cm', ['A', 'B']);
  labelSide(p, k.B, k.C, c, '9 cm', ['B', 'C']);
  labelSide(p, k.C, k.D, c, '7 cm', ['C', 'D']);
  labelSide(p, k.D, k.A, c, '8 cm', ['D', 'A']);
  markAngle(p, k.B, k.A, k.C, FIELD.b, `110${DEG}`);
  return {
    svg: finish(p, { id, title: 'A four-sided field ABCD with the diagonal AC', desc: 'A four-sided shape ABCD. AB is 6 centimetres, BC is 9 centimetres, CD is 7 centimetres and DA is 8 centimetres. The angle at B, between AB and BC, is 110 degrees. A dashed line joins A to C and splits the shape into two triangles.' }),
    corners: k,
    ...facts(
      [{ from: 'A', to: 'B', value: 6 }, { from: 'B', to: 'C', value: 9 }, { from: 'C', to: 'D', value: 7 }, { from: 'D', to: 'A', value: 8 }],
      [{ at: 'B', from: 'A', to: 'C', value: 110 }],
    ),
    unknown: null,
    kind: 'shape',
    edges: p.edges,
    sideLabels: p.sideLabels,
  };
}

// ---- bearings: drawn from the legs (distance and bearing) ----
// `legs`: from -> to, `km` and `bearing` (degrees clockwise from north). `north`: points that get a north arrow.
// `arcs`: [{ at, bearing, text }] the bearings marked.
const BEARINGS = {
  'trig-triangles-back-bearing': {
    start: 'A', legs: [{ to: 'B', km: 8, bearing: 72 }], north: ['A', 'B'],
    arcs: [{ at: 'A', bearing: 72, text: `072${DEG}` }, { at: 'B', bearing: 252, text: `252${DEG}` }],
    legLabels: false,
    title: 'The bearing of B from A, and of A from B',
    desc: 'Point A at the lower left and point B up and to the right of it. A north arrow points straight up from each point. At A, an arc from north clockwise to the line AB is marked 072 degrees. At B, an arc from north clockwise, a long way round, to the line from B back to A is marked 252 degrees.',
  },
  'trig-triangles-bearing-legs': {
    start: 'P', legs: [{ to: 'Q', km: 12, bearing: 60 }, { to: 'R', km: 9, bearing: 130 }], north: ['P', 'Q'],
    arcs: [{ at: 'P', bearing: 60, text: `060${DEG}` }, { at: 'Q', bearing: 130, text: `130${DEG}` }],
    legLabels: true,
    title: 'A ship sails from P to Q and then to R',
    desc: 'A ship leaves P and sails 12 kilometres to Q, on a bearing of 060 degrees. It then sails 9 kilometres to R, on a bearing of 130 degrees. North arrows point up from P and from Q, and arcs mark the two bearings from north.',
  },
  'trig-triangles-q-bearing': {
    start: 'P', legs: [{ to: 'Q', km: 8, bearing: 40 }, { to: 'R', km: 10, bearing: 120 }], north: ['P', 'Q'],
    arcs: [{ at: 'P', bearing: 40, text: `040${DEG}` }, { at: 'Q', bearing: 120, text: `120${DEG}` }],
    legLabels: true,
    title: 'A walk from P to Q and then to R',
    desc: 'A walker leaves P and walks 8 kilometres to Q, on a bearing of 040 degrees. The walker then goes 10 kilometres to R, on a bearing of 120 degrees. North arrows point up from P and from Q, and arcs mark the two bearings from north.',
  },
  'trig-triangles-e-bearing': {
    start: 'P', legs: [{ to: 'Q', km: 20, bearing: 75 }, { to: 'R', km: 14, bearing: 160 }], north: ['P', 'Q'],
    arcs: [{ at: 'P', bearing: 75, text: `075${DEG}` }, { at: 'Q', bearing: 160, text: `160${DEG}` }],
    legLabels: true,
    title: 'A ship sails from P to Q and then to R',
    desc: 'A ship leaves port P and sails 20 kilometres to Q, on a bearing of 075 degrees. It then sails 14 kilometres to R, on a bearing of 160 degrees. North arrows point up from P and from Q, and arcs mark the two bearings from north.',
  },
};

function buildBearing(id) {
  const spec = BEARINGS[id];
  const km = { [spec.start]: [0, 0] };
  let at = spec.start;
  for (const leg of spec.legs) {
    km[leg.to] = [km[at][0] + leg.km * sin(leg.bearing), km[at][1] + leg.km * cos(leg.bearing)];
    at = leg.to;
  }
  const names = Object.keys(km);
  const arrow = 74;
  const xs = names.map((n) => km[n][0]);
  const ys = names.map((n) => km[n][1]);
  const x0 = Math.min(...xs) - 1.0;
  const x1 = Math.max(...xs) + 1.0;
  const y0 = Math.min(...ys) - 1.0;
  const y1 = Math.max(...ys);
  const s = Math.min((W - 200) / (x1 - x0), (H - 160 - arrow) / (y1 - y0));
  const ox = (W - s * (x1 - x0)) / 2 - s * x0;
  const oy = 70 - s * y0;
  const pos = Object.fromEntries(names.map((n) => [n, [ox + s * km[n][0], oy + s * km[n][1]]]));
  const p = canvas();
  let prev = spec.start;
  for (const leg of spec.legs) {
    p.line(...pos[prev], ...pos[leg.to], { cls: 'line', clip: false });
    if (spec.legLabels) {
      const m = mid(pos[prev], pos[leg.to]);
      const dir = unit(sub(pos[leg.to], pos[prev]));
      // the side of the leg that points away from the rest of the path, so two leg labels never meet
      // (the first leg goes below its line, clear of the bearing arc at its start)
      const awayFrom = prev === spec.start ? [0, -1] : unit(sub(m, centroid(names.map((n) => pos[n]))));
      const perp = [dir[1], -dir[0]];
      const normal = perp[0] * awayFrom[0] + perp[1] * awayFrom[1] >= 0 ? perp : [-perp[0], -perp[1]];
      const text = `${leg.km} km`;
      const off = 22 + halfWidth(text) * Math.abs(normal[0]) + 12 * Math.abs(normal[1]);
      p.text(m[0] + normal[0] * off, m[1] + normal[1] * off, text, { dy: 8 });
    }
    prev = leg.to;
  }
  for (const n of spec.north) {
    const v = pos[n];
    p.line(v[0], v[1], v[0], v[1] + arrow, { cls: 'guide', clip: false });
    p.raw(`<polygon class="arrowhead" points="${v[0].toFixed(1)},${(H - v[1] - arrow - 8).toFixed(1)} ${(v[0] - 7).toFixed(1)},${(H - v[1] - arrow + 8).toFixed(1)} ${(v[0] + 7).toFixed(1)},${(H - v[1] - arrow + 8).toFixed(1)}"/>`);
    const smallBearing = (spec.arcs.find((arc) => arc.at === n)?.bearing ?? 180) < 120;
    p.text(v[0] + (smallBearing ? -16 : 16), v[1] + arrow + 4, 'N', { anchor: smallBearing ? 'end' : 'start', dy: 8 });
  }
  for (const arc of spec.arcs) {
    const v = pos[arc.at];
    const r = 46;
    const along = [];
    for (let i = 0; i <= 36; i += 1) { const ph = (arc.bearing * i) / 36; along.push(`${(v[0] + r * sin(ph)).toFixed(1)} ${(H - (v[1] + r * cos(ph))).toFixed(1)}`); }
    p.raw(`<path class="curve" style="stroke-width:3.5" d="M${along.join(' L')}"/>`);
    const half = arc.bearing / 2;
    const rr = r + 14 + halfWidth(arc.text) * Math.abs(sin(half)) + 12 * Math.abs(cos(half));
    p.text(v[0] + rr * sin(half), v[1] + rr * cos(half), arc.text, { dy: 8 });
  }
  for (const n of names) p.raw(`<circle class="pt" cx="${pos[n][0].toFixed(1)}" cy="${(H - pos[n][1]).toFixed(1)}" r="7"/>`);
  const c = centroid(names.map((n) => pos[n]));
  for (const n of names) {
    const out = Math.hypot(...sub(pos[n], c)) < 1 ? [0, -1] : unit(sub(pos[n], c));
    p.text(pos[n][0] + out[0] * 26, pos[n][1] + out[1] * 26, n, { cls: 'alt', dy: 8 });
  }
  const bearings = [];
  let from = spec.start;
  for (const leg of spec.legs) { bearings.push({ from, to: leg.to, value: leg.bearing, km: leg.km }); from = leg.to; }
  return { svg: finish(p, { id, title: spec.title, desc: spec.desc }), corners: pos, bearings, kind: 'bearing' };
}

const BUILDERS = {};
for (const id of Object.keys(SPECS)) BUILDERS[id] = () => buildSingle(id);
BUILDERS['trig-triangles-ambiguous'] = () => buildAmbiguous('trig-triangles-ambiguous');
BUILDERS['trig-triangles-flip-area'] = () => buildFlipArea('trig-triangles-flip-area');
BUILDERS['trig-triangles-field'] = () => buildField('trig-triangles-field');
for (const id of Object.keys(BEARINGS)) BUILDERS[id] = () => buildBearing(id);

export const FIGURES = Object.fromEntries(Object.keys(BUILDERS).map((id) => [id, () => BUILDERS[id]().svg]));

/** What was drawn: the corners (in picture units, y up) and what the figure states, for the spec to measure. */
export const GEOMETRY = (id) => BUILDERS[id]();
