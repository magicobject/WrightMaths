// Figures for the Trigonometric identities and equations topic page (src/pages/courses/a-level/trig-identities.html).
//
// Every curve is drawn FROM the function listed for it in CURVES, and every marked point and segment is drawn from the
// numbers listed in ITEMS, so a picture cannot disagree with its equation. Each picture is a sketch: no grid and no scale
// numbers. What matters is marked on the picture itself, with its coordinates. The equation of each curve sits in a key
// above the graph, so no label sits on a curve. A horizontal line that stands for the right-hand side of an equation is a
// dashed guide with its equation written beside it. Angles are in degrees: radians belong to a later topic.
//
// test/alevel-trig-identities.spec.ts reads GEOM, CURVES and ITEMS to check each curve, each marked point, each segment and
// each guide line against the page's own numbers, and checks that every label is nearest its own item.
import { plane, label } from '../figure-lib.mjs';

const DEG = String.fromCharCode(0xb0); // kept out of the source so the file stays plain ASCII
const THETA = String.fromCharCode(0x3b8);

/** The size and range of each picture, kept so a test can turn a pixel back into graph coordinates. */
export const GEOM = {};
/** The curves of each picture in the order they are drawn: { name, cls, fn, from, to }. */
export const CURVES = {};
/** What is marked on each picture: { name, kind: 'point', x, y } or { name, kind: 'hline', y } or { name, kind: 'seg', x1, y1, x2, y2, text }. */
export const ITEMS = {};

const W = 600; // a narrow picture, so the labels are drawn large when it is scaled down to a phone
const LEFT = 64;
const RIGHT = 48;
const BOTTOM = 52;
const ROW = 46; // the height of one row of the key above the graph
const SAMPLES = 6000; // how finely the placement (and the test) walk along each curve

/** A plane with no grid and no scale numbers, and a key above it of `rows` lines. */
function sketch(id, { xmin, xmax, ymin, ymax, rows = 2, height = 520, ylabel = 'y' }) {
  const top = 64 + ROW * (rows - 1) + 46;
  GEOM[id] = { width: W, height, left: LEFT, right: RIGHT, top, bottom: BOTTOM, xmin, xmax, ymin, ymax };
  CURVES[id] = [];
  ITEMS[id] = [];
  PENDING[id] = { points: [], levels: [], segs: [], taken: [] };
  return plane({ grid: false, ticks: false, tickLabels: false, width: W, height, top, xmin, xmax, ymin, ymax, ylabel });
}

/** What each picture still has to place: its marked points, its guide-line labels, its segment labels, and the boxes already taken. */
const PENDING = {};
const CHAR = 14; // the width allowed for one character of a label (the test allows 13, so there is a margin)
const f2 = (n) => (Math.round(n * 100) / 100).toString();

/** A key row: a sample of how a curve is drawn, then what it is. */
function keyRow(p, id, row, cls, text) {
  const y = 40 + ROW * row;
  p.raw(`<line class="${cls}" x1="${LEFT}" y1="${y - 8}" x2="${LEFT + 56}" y2="${y - 8}"/>`);
  p.note(LEFT + 72, y, text, { cls: 'alt' });
  PENDING[id].taken.push({ x0: LEFT + 72, x1: LEFT + 72 + text.length * CHAR, y0: y - 26, y1: y + 8 });
}

/** Draw curves from their functions, and remember them for the test. */
function draw(p, id, curves) {
  for (const c of curves) {
    const g = GEOM[id];
    const from = c.from ?? g.xmin;
    const to = c.to ?? g.xmax;
    CURVES[id].push({ name: c.name, cls: c.cls ?? 'curve', fn: c.fn, from, to });
    p.curve(c.fn, { cls: c.cls ?? 'curve', from, to });
  }
}

/** A marked point. Its label is placed by finish(), at the nearest spot that is clear of every curve and every other label. */
function mark(p, id, { name, x, y, text }) {
  ITEMS[id].push({ name, kind: 'point', x, y });
  PENDING[id].points.push({ name, x, y, text });
}

/** A dashed line across the picture at height y (the right-hand side of an equation). Its equation is written beside it, near `at`. */
function level(p, id, { name, y, text, at }) {
  ITEMS[id].push({ name, kind: 'hline', y });
  p.hline(y);
  PENDING[id].levels.push({ name, y, text, at });
}

/** A straight segment, drawn as a solid line, with a tag (a short label such as "sin x") placed beside it. */
function seg(p, id, { name, x1, y1, x2, y2, text }) {
  ITEMS[id].push({ name, kind: 'seg', x1, y1, x2, y2, text });
  p.line(x1, y1, x2, y2, { cls: 'line', clip: false });
  PENDING[id].segs.push({ name, x1, y1, x2, y2, text });
}

/** The distance from the pixel (qx, qy) to the segment from (ax, ay) to (bx, by). */
function distToSeg(qx, qy, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((qx - ax) * dx + (qy - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(qx - (ax + t * dx), qy - (ay + t * dy));
}

/**
 * Place every label. A label is a box (13px a character, 34px tall) that must: stay inside the picture; keep clear of
 * every curve, segment, key line and other label; stay off every marker; and sit nearer its own item than any other.
 * Candidates are tried from the closest to the item outwards, so each label lands as near its item as the picture allows.
 */
function place(p, id) {
  const g = GEOM[id];
  const { points, levels, segs, taken } = PENDING[id];
  const px = (x) => p.X(x);
  const py = (y) => p.Y(y);
  // the drawn curves and segments as pixel points, as the test samples them
  const dots = [];
  for (const c of CURVES[id]) {
    for (let i = 0; i <= SAMPLES; i += 1) {
      const x = g.xmin + ((g.xmax - g.xmin) * i) / SAMPLES;
      if (x < c.from || x > c.to) continue;
      const y = c.fn(x);
      if (!Number.isFinite(y) || y < g.ymin || y > g.ymax) continue;
      dots.push([px(x), py(y)]);
    }
  }
  for (const s of segs) {
    for (let i = 0; i <= 100; i += 1) dots.push([px(s.x1 + ((s.x2 - s.x1) * i) / 100), py(s.y1 + ((s.y2 - s.y1) * i) / 100)]);
  }
  // the axes and the guide lines are thin boxes that no label may touch
  taken.push({ x0: px(g.xmin), x1: px(g.xmax) + 12, y0: py(0) - 3, y1: py(0) + 3 });
  taken.push({ x0: px(0) - 3, x1: px(0) + 3, y0: py(g.ymax) - 12, y1: py(g.ymin) });
  for (const l of levels) taken.push({ owner: l.name, x0: px(g.xmin), x1: px(g.xmax), y0: py(l.y) - 3, y1: py(l.y) + 3 });
  // the two axis letters
  taken.push({ x0: px(g.xmax) + 8, x1: px(g.xmax) + 40, y0: py(0) - 20, y1: py(0) + 20 });
  taken.push({ x0: px(0) - 16, x1: px(0) + 16, y0: py(g.ymax) - 50, y1: py(g.ymax) - 6 });
  const circles = points.map((q) => ({ name: q.name, cx: px(q.x), cy: py(q.y) }));
  const items = [
    ...circles.map((c) => ({ name: c.name, at: (qx, qy) => Math.hypot(qx - c.cx, qy - c.cy), point: true })),
    ...levels.map((l) => ({ name: l.name, at: (qx, qy) => Math.abs(qy - py(l.y)), point: false })),
    ...segs.map((s) => ({ name: s.name, at: (qx, qy) => distToSeg(qx, qy, px(s.x1), py(s.y1), px(s.x2), py(s.y2)), point: false })),
  ];
  const placed = [];
  const boxOf = (text, x, y, anchor) => {
    const width = text.length * CHAR;
    const x0 = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
    return { x0, x1: x0 + width, y0: y - 26, y1: y + 8, cx: x0 + width / 2, cy: y - 8 };
  };
  const why = {};
  const no = (reason) => { why[reason] = (why[reason] ?? 0) + 1; return false; };
  const clear = (b, own, isPoint) => {
    if (b.x0 < 4 || b.x1 > W - 4 || b.y0 < 4 || b.y1 > GEOM[id].height - 4) return no('edge');
    for (const [qx, qy] of dots) if (qx > b.x0 - 5 && qx < b.x1 + 5 && qy > b.y0 - 5 && qy < b.y1 + 5) return no('curve');
    for (const t of [...taken, ...placed]) {
      const margin = t.owner === own.name ? 0 : 10; // a label may sit close beside its own guide line
      if (Math.max(t.x0 - b.x1, b.x0 - t.x1) < margin && Math.max(t.y0 - b.y1, b.y0 - t.y1) < margin) return no('taken');
    }
    for (const c of circles) {
      if (c.cx > b.x0 - 14 && c.cx < b.x1 + 14 && c.cy > b.y0 - 14 && c.cy < b.y1 + 14) return no('marker'); // a label never covers a marker
    }
    const mine = own.at(b.cx, b.cy);
    for (const other of items) if (other !== own && (!isPoint || other.point) && other.at(b.cx, b.cy) < mine + 2) return no('near');
    return true;
  };
  const out = [];
  /** Candidate spots round the pixel (ax, ay), nearest first. */
  const around = (ax, ay) => {
    const cands = [];
    const dys = [-16, -22, -30, -40, -52, -66, -82, -98, -114, -130, -148, -168, 4, 10, 16, 22, 28, 34, 40, 46, 54, 64, 76, 90, 106, 124];
    for (const [anchor, dxs] of [['start', [16, 22, 30, 40, 52, 66, 84, 104, 126, 150, 176, 204]], ['end', [-16, -22, -30, -40, -52, -66, -84, -104, -126, -150, -176, -204]], ['middle', [0]]]) {
      for (const dx of dxs) for (const dy of dys) cands.push({ anchor, x: ax + dx, y: ay + dy, cost: Math.abs(dx) + Math.abs(dy - 10) * 0.8 });
    }
    return cands.sort((a, b) => a.cost - b.cost);
  };
  const put = (own, text, cands, isPoint, cls) => {
    let best = null;
    for (const c of cands) {
      const b = boxOf(text, c.x, c.y, c.anchor);
      if (clear(b, own, isPoint)) { best = { ...c, b }; break; }
    }
    if (!best) throw new Error(`${id}: no place for the label of "${own.name}" ${JSON.stringify(why)}`);
    placed.push(best.b);
    out.push(`<text class="svg-t${cls}" data-for="${own.name}" x="${f2(best.x)}" y="${f2(best.y)}" text-anchor="${best.anchor}">${label(text)}</text>`);
  };
  for (const q of points) put(items.find((i) => i.name === q.name), q.text, around(px(q.x), py(q.y)), true, '');
  for (const l of levels) {
    const cands = [];
    for (const [anchor, dy] of [['start', -14], ['end', -14], ['start', 36], ['end', 36]]) {
      for (let x = LEFT; x < W - 40; x += 14) cands.push({ anchor, x, y: py(l.y) + dy, cost: Math.abs(x - px(l.at)) + (dy > 0 ? 6 : 0) });
    }
    cands.sort((a, b) => a.cost - b.cost);
    put(items.find((i) => i.name === l.name), l.text, cands, false, ' alt');
  }
  for (const s of segs) put(items.find((i) => i.name === s.name), s.text, around((px(s.x1) + px(s.x2)) / 2, (py(s.y1) + py(s.y2)) / 2), false, ' alt');
  for (const c of circles) p.raw(`<circle class="pt" data-name="${c.name}" cx="${f2(c.cx)}" cy="${f2(c.cy)}" r="7"/>`);
  for (const t of out) p.raw(t);
}

/** Labels get a halo in the page colour, so a label that crosses an axis or a guide stays readable. */
const finish = (p, meta) => {
  place(p, meta.id);
  return p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');
};

// ---- the functions each picture is drawn from (the test holds its own copy of these) ----
const rad = (d) => (d * Math.PI) / 180;
const sinD = (x) => Math.sin(rad(x));
const cosD = (x) => Math.cos(rad(x));
const tanD = (x) => Math.tan(rad(x));
const sin2 = (x) => Math.sin(rad(2 * x));
const cosShift = (x) => Math.cos(rad(x + 20));
const cosShiftQ = (x) => Math.cos(rad(x - 50));
const upper = (x) => Math.sqrt(Math.max(0, 1 - x * x));
const lower = (x) => -Math.sqrt(Math.max(0, 1 - x * x));

const A50 = 50; // the angle of the first circle picture
const P50 = [Math.cos(rad(A50)), Math.sin(rad(A50))];
const P_OBTUSE = [-0.8, 0.6]; // the point of the second circle picture: sin = 0.6, cos = -0.8, an obtuse angle
const t3 = (v) => (Math.round(v * 1000) / 1000).toString();

/** The unit circle, with the point P, its foot F on the x-axis, and the right-angled triangle O, F, P. */
function circle(id, [cx, cy], { keyText, tags }) {
  const p = sketch(id, { xmin: -1.5, xmax: 1.5, ymin: -1.5, ymax: 1.5, rows: 1, height: 650 });
  keyRow(p, id, 0, 'line', keyText);
  draw(p, id, [{ name: 'top', fn: upper, from: -1, to: 1 }, { name: 'bottom', fn: lower, from: -1, to: 1 }]);
  seg(p, id, { name: 'op', x1: 0, y1: 0, x2: cx, y2: cy, text: tags.radius });
  seg(p, id, { name: 'pf', x1: cx, y1: 0, x2: cx, y2: cy, text: tags.height });
  seg(p, id, { name: 'of', x1: 0, y1: 0, x2: cx, y2: 0, text: tags.base });
  mark(p, id, { name: 'p', x: cx, y: cy, text: `(${t3(cx)}, ${t3(cy)})` });
  mark(p, id, { name: 'f', x: cx, y: 0, text: `(${t3(cx)}, 0)` });
  return p;
}

export const FIGURES = {
  // ---- 1. the unit circle at 50 degrees: the point P is (cos, sin), and the triangle gives sin^2 + cos^2 = 1 ----
  'trig-identities-unit-circle': () => {
    const id = 'trig-identities-unit-circle';
    const p = circle(id, P50, { keyText: `OP makes an angle ${THETA} = ${A50}${DEG}`, tags: { radius: '1', height: `sin ${THETA}`, base: `cos ${THETA}` } });
    return finish(p, {
      id,
      title: `The point P on the unit circle at ${THETA} = 50 degrees, with the right-angled triangle whose sides are cos ${THETA}, sin ${THETA} and 1`,
      desc: `The unit circle, a circle of radius 1 with its centre at the origin. The line from the origin to the point P makes an angle of 50${DEG} with the positive x-axis. P is the marked point (${t3(P50[0])}, ${t3(P50[1])}). A solid line drops from P straight down to the marked point (${t3(P50[0])}, 0) on the x-axis. This makes a right-angled triangle. Its hypotenuse is the radius, of length 1. Its side along the x-axis has length cos ${THETA}, and its upright side has length sin ${THETA}.`,
    });
  },

  // ---- 2. the unit circle at an obtuse angle: P is (-0.8, 0.6) ----
  'trig-identities-circle-obtuse': () => {
    const id = 'trig-identities-circle-obtuse';
    const p = circle(id, P_OBTUSE, { keyText: `${THETA} is between 90${DEG} and 180${DEG}`, tags: { radius: '1', height: 'sin ' + THETA, base: 'cos ' + THETA } });
    return finish(p, {
      id,
      title: `The point P on the unit circle for an obtuse angle ${THETA}, with sin ${THETA} = 0.6 and cos ${THETA} = -0.8`,
      desc: `The unit circle. The point P is in the top left quarter, because the angle ${THETA} is between 90${DEG} and 180${DEG}. P is the marked point (-0.8, 0.6). A solid line drops from P to the marked point (-0.8, 0) on the x-axis, which is to the left of the origin. The upright side has length sin ${THETA} = 0.6. The side along the x-axis points to the left, so its signed length cos ${THETA} is negative, and the radius from the origin to P has length 1.`,
    });
  },

  // ---- 3. every solution in a wide interval: sin x = 0.5 for -360 <= x <= 360 ----
  'trig-identities-sin-wide': () => {
    const id = 'trig-identities-sin-wide';
    const p = sketch(id, { xmin: -430, xmax: 430, ymin: -1.5, ymax: 2.7, rows: 2, height: 560 });
    keyRow(p, id, 0, 'curve', 'y = sin x');
    keyRow(p, id, 1, 'guide', 'y = 0.5');
    draw(p, id, [{ name: 'f', fn: sinD, from: -360, to: 360 }]);
    level(p, id, { name: 'k', y: 0.5, text: 'y = 0.5', at: 380 });
    mark(p, id, { name: 's1', x: -330, y: 0.5, text: `-330${DEG}` });
    mark(p, id, { name: 's2', x: -210, y: 0.5, text: `-210${DEG}` });
    mark(p, id, { name: 's3', x: 30, y: 0.5, text: `30${DEG}` });
    mark(p, id, { name: 's4', x: 150, y: 0.5, text: `150${DEG}` });
    return finish(p, {
      id,
      title: 'The graph of y = sin x from -360 degrees to 360 degrees, cut by the line y = 0.5 at four points',
      desc: `The sine wave from -360${DEG} to 360${DEG}, with its highest points at -270${DEG} and 90${DEG} and its lowest points at -90${DEG} and 270${DEG}. A dashed horizontal line, labelled y = 0.5, cuts the wave at four marked points: (-330${DEG}, 0.5), (-210${DEG}, 0.5), (30${DEG}, 0.5) and (150${DEG}, 0.5). The two on the right are the solutions between 0${DEG} and 360${DEG}. The two on the left are 360${DEG} below them.`,
    });
  },

  // ---- 4. a multiple of the angle: sin 2x = 0.5 for 0 <= x <= 360 ----
  'trig-identities-sin-2x': () => {
    const id = 'trig-identities-sin-2x';
    const p = sketch(id, { xmin: -130, xmax: 400, ymin: -1.5, ymax: 2.7, rows: 2, height: 560 });
    keyRow(p, id, 0, 'curve', 'y = sin 2x');
    keyRow(p, id, 1, 'guide', 'y = 0.5');
    draw(p, id, [{ name: 'f', fn: sin2, from: 0, to: 360 }]);
    level(p, id, { name: 'k', y: 0.5, text: 'y = 0.5', at: 380 });
    mark(p, id, { name: 's1', x: 15, y: 0.5, text: `15${DEG}` });
    mark(p, id, { name: 's2', x: 75, y: 0.5, text: `75${DEG}` });
    mark(p, id, { name: 's3', x: 195, y: 0.5, text: `195${DEG}` });
    mark(p, id, { name: 's4', x: 255, y: 0.5, text: `255${DEG}` });
    return finish(p, {
      id,
      title: 'The graph of y = sin 2x from 0 degrees to 360 degrees, cut by the line y = 0.5 at four points',
      desc: `The wave y = sin 2x from 0${DEG} to 360${DEG}. It makes two full cycles, each 180${DEG} long. A dashed horizontal line, labelled y = 0.5, cuts the wave twice in each cycle, at four marked points: (15${DEG}, 0.5), (75${DEG}, 0.5), (195${DEG}, 0.5) and (255${DEG}, 0.5).`,
    });
  },

  // ---- 5. a shifted angle: cos(x + 20) = 0.5 for 0 <= x <= 360 ----
  'trig-identities-cos-shift': () => {
    const id = 'trig-identities-cos-shift';
    const p = sketch(id, { xmin: -130, xmax: 400, ymin: -1.5, ymax: 2.7, rows: 2, height: 560 });
    keyRow(p, id, 0, 'curve', `y = cos(x + 20${DEG})`);
    keyRow(p, id, 1, 'guide', 'y = 0.5');
    draw(p, id, [{ name: 'f', fn: cosShift, from: 0, to: 360 }]);
    level(p, id, { name: 'k', y: 0.5, text: 'y = 0.5', at: 380 });
    mark(p, id, { name: 's1', x: 40, y: 0.5, text: `40${DEG}` });
    mark(p, id, { name: 's2', x: 280, y: 0.5, text: `280${DEG}` });
    return finish(p, {
      id,
      title: 'The graph of y = cos(x + 20 degrees) from 0 degrees to 360 degrees, cut by the line y = 0.5 at two points',
      desc: `The cosine wave moved 20${DEG} to the left, drawn from 0${DEG} to 360${DEG}. It starts a little below its highest point, because the highest point is at -20${DEG}. A dashed horizontal line, labelled y = 0.5, cuts the wave at two marked points: (40${DEG}, 0.5) on the way down and (280${DEG}, 0.5) on the way up.`,
    });
  },

  // ---- 6. sin x = cos x: the two waves cross ----
  'trig-identities-sin-cos': () => {
    const id = 'trig-identities-sin-cos';
    const p = sketch(id, { xmin: -40, xmax: 400, ymin: -1.5, ymax: 1.6, rows: 2, height: 560 });
    keyRow(p, id, 0, 'curve', 'y = sin x');
    keyRow(p, id, 1, 'curve-b', 'y = cos x');
    draw(p, id, [{ name: 'f', fn: sinD, from: 0, to: 360 }, { name: 'g', cls: 'curve-b', fn: cosD, from: 0, to: 360 }]);
    mark(p, id, { name: 'c1', x: 45, y: Math.SQRT1_2, text: `(45${DEG}, 0.707)` });
    mark(p, id, { name: 'c2', x: 225, y: -Math.SQRT1_2, text: `(225${DEG}, -0.707)` });
    return finish(p, {
      id,
      title: 'The graphs of y = sin x and y = cos x from 0 degrees to 360 degrees, which cross at two points',
      desc: `Two waves from 0${DEG} to 360${DEG}. The solid wave is y = sin x. The dashed wave is y = cos x. They cross twice, at the marked points (45${DEG}, 0.707) and (225${DEG}, -0.707). At each crossing the sine and the cosine have the same value, so sin x = cos x.`,
    });
  },

  // ---- 7. a quadratic in sin x: two guide lines, y = 0.5 and y = -1 ----
  'trig-identities-quad-sin': () => {
    const id = 'trig-identities-quad-sin';
    const p = sketch(id, { xmin: -130, xmax: 400, ymin: -2.2, ymax: 2.6, rows: 2, height: 600 });
    keyRow(p, id, 0, 'curve', 'y = sin x');
    keyRow(p, id, 1, 'guide', 'y = 0.5 and y = -1');
    draw(p, id, [{ name: 'f', fn: sinD, from: 0, to: 360 }]);
    level(p, id, { name: 'k1', y: 0.5, text: 'y = 0.5', at: 380 });
    level(p, id, { name: 'k2', y: -1, text: 'y = -1', at: 380 });
    mark(p, id, { name: 's1', x: 30, y: 0.5, text: `30${DEG}` });
    mark(p, id, { name: 's2', x: 150, y: 0.5, text: `150${DEG}` });
    mark(p, id, { name: 's3', x: 270, y: -1, text: `270${DEG}` });
    return finish(p, {
      id,
      title: 'The graph of y = sin x from 0 degrees to 360 degrees, with the lines y = 0.5 and y = -1 meeting it at three points in all',
      desc: `The sine wave from 0${DEG} to 360${DEG}. A dashed horizontal line labelled y = 0.5 cuts the wave at the marked points (30${DEG}, 0.5) and (150${DEG}, 0.5). A second dashed line labelled y = -1 touches the wave at its lowest point, the marked point (270${DEG}, -1), and does not cross it.`,
    });
  },

  // ---- 8. flip it: two angles with the same tangent, 180 degrees apart ----
  'trig-identities-flip-tan': () => {
    const id = 'trig-identities-flip-tan';
    const p = sketch(id, { xmin: -40, xmax: 400, ymin: -6, ymax: 7, rows: 2, height: 600 });
    keyRow(p, id, 0, 'curve', 'y = tan x');
    keyRow(p, id, 1, 'guide', 'y = 2.747');
    draw(p, id, [{ name: 'f', fn: tanD, from: 0, to: 360 }]);
    level(p, id, { name: 'k', y: 2.747, text: 'y = 2.747', at: 380 });
    mark(p, id, { name: 's1', x: 70, y: tanD(70), text: `70${DEG}` });
    mark(p, id, { name: 's2', x: 250, y: tanD(250), text: `250${DEG}` });
    return finish(p, {
      id,
      title: 'The graph of y = tan x from 0 degrees to 360 degrees, cut by the line y = 2.747 at two points 180 degrees apart',
      desc: `The tangent graph from 0${DEG} to 360${DEG}, in two pieces that each climb steeply towards a vertical asymptote at 90${DEG} and at 270${DEG}. A dashed horizontal line, labelled y = 2.747, cuts the graph at two marked points: (70${DEG}, 2.747) and (250${DEG}, 2.747). They are 180${DEG} apart, which is the period of tangent.`,
    });
  },

  // ---- question figures: the picture shows the facts, never the answer ----
  'trig-identities-q-sin-line': () => {
    const id = 'trig-identities-q-sin-line';
    const p = sketch(id, { xmin: -130, xmax: 400, ymin: -1.5, ymax: 2.7, rows: 1, height: 500 });
    draw(p, id, [{ name: 'f', fn: sinD, from: 0, to: 360 }]);
    level(p, id, { name: 'k', y: 0.9, text: 'y = 0.9', at: 380 });
    return finish(p, {
      id,
      title: 'The graph of y = sin x from 0 degrees to 360 degrees, with a dashed horizontal line at height 0.9',
      desc: `The sine wave from 0${DEG} to 360${DEG}. A dashed horizontal line, labelled y = 0.9, is close to the top of the wave. It meets the wave at two points, one each side of the highest point.`,
    });
  },

  'trig-identities-q-cos-shift': () => {
    const id = 'trig-identities-q-cos-shift';
    const p = sketch(id, { xmin: -130, xmax: 400, ymin: -1.5, ymax: 2.7, rows: 1, height: 500 });
    draw(p, id, [{ name: 'f', fn: cosShiftQ, from: 0, to: 360 }]);
    level(p, id, { name: 'k', y: 0.6, text: 'y = 0.6', at: 380 });
    return finish(p, {
      id,
      title: 'The graph of y = cos(x - 50 degrees) from 0 degrees to 360 degrees, with a dashed horizontal line at height 0.6',
      desc: `A cosine wave moved 50${DEG} to the right, drawn from 0${DEG} to 360${DEG}. It starts below its highest point, because the highest point is at 50${DEG}. A dashed horizontal line, labelled y = 0.6, meets the wave at two points.`,
    });
  },
};
