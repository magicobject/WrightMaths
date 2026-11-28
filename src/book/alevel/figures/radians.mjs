// Figures for the Radians, arcs and sectors topic page (src/pages/courses/a-level/radians.html).
//
// Every curve is drawn FROM the function listed for it in CURVES, every shaded region from the points listed in REGIONS, and
// every marked point and segment from the numbers listed in ITEMS, so a picture cannot disagree with its equation. Each
// picture is a sketch: no grid and no scale numbers. What matters is marked on the picture itself. The words that explain a
// picture sit in a key above it, so no label sits on a curve. Circle and sector pictures use the same scale on both axes,
// so a circle is round and an angle looks the size it is. Angles are in radians.
//
// test/alevel-radians.spec.ts reads GEOM, CURVES, ITEMS and REGIONS to check each curve, each shaded area, each marked
// point and each segment against the page's own numbers, and checks that every label is nearest its own item.
import { plane, label } from '../figure-lib.mjs';

const PI = String.fromCharCode(0x3c0); // kept out of the source so the file stays plain ASCII
const THETA = String.fromCharCode(0x3b8);

/** The size and range of each picture, kept so a test can turn a pixel back into graph coordinates. */
export const GEOM = {};
/** The curves of each picture in the order they are drawn: { name, cls, fn, from, to, arc? }. An arc of a circle also records { r, a0, a1 }. */
export const CURVES = {};
/** What is marked on each picture: { name, kind: 'point', x, y, text } or { name, kind: 'hline', y, text } or { name, kind: 'seg', x1, y1, x2, y2, text }. */
export const ITEMS = {};
/** The shaded regions of each picture: { name, pts: [[x, y], ...] } in graph coordinates. */
export const REGIONS = {};

const W = 600; // a narrow picture, so the labels are drawn large when it is scaled down to a phone
const LEFT = 64;
const RIGHT = 48;
const BOTTOM = 52;
const ROW = 46; // the height of one row of the key above the graph
const SAMPLES = 6000; // how finely the placement (and the test) walk along each curve
const CHAR = 14; // the width allowed for one character of a label (the test allows 13, so there is a margin)
const f2 = (n) => (Math.round(n * 100) / 100).toString();

/** What each picture still has to place: its marked points, its guide-line labels, its segment labels, and the boxes already taken. */
const PENDING = {};

/** A plane with no grid and no scale numbers, and a key above it of `rows` lines. `height` is fixed, or worked out from `equal`. */
function sketch(id, { xmin, xmax, ymin, ymax, rows = 2, height, equal = false, ylabel = 'y' }) {
  const top = 64 + ROW * (rows - 1) + 46;
  const plotW = W - LEFT - RIGHT;
  const h = height ? height : equal ? Math.round(top + BOTTOM + (plotW * (ymax - ymin)) / (xmax - xmin)) : 520;
  GEOM[id] = { width: W, height: h, left: LEFT, right: RIGHT, top, bottom: BOTTOM, xmin, xmax, ymin, ymax };
  CURVES[id] = [];
  ITEMS[id] = [];
  REGIONS[id] = [];
  PENDING[id] = { points: [], levels: [], segs: [], tags: [], taken: [] };
  return plane({ grid: false, ticks: false, tickLabels: false, width: W, height: h, top, xmin, xmax, ymin, ymax, ylabel });
}

/** A key row: a sample of how a curve is drawn (or a swatch of the shading), then what it is. */
function keyRow(p, id, row, cls, text) {
  const y = 40 + ROW * row;
  if (cls === 'shade') p.raw(`<rect class="shade" x="${LEFT}" y="${y - 24}" width="56" height="24"/>`);
  else p.raw(`<line class="${cls}" x1="${LEFT}" y1="${y - 8}" x2="${LEFT + 56}" y2="${y - 8}"/>`);
  p.note(LEFT + 72, y, text, { cls: 'alt' });
  PENDING[id].taken.push({ x0: LEFT + 72, x1: LEFT + 72 + text.length * CHAR, y0: y - 26, y1: y + 8 });
}

/** Draw curves from their functions, and remember them for the test. */
function draw(p, id, curves) {
  for (const c of curves) {
    const g = GEOM[id];
    const from = c.from ?? g.xmin;
    const to = c.to ?? g.xmax;
    CURVES[id].push({ name: c.name, cls: c.cls ?? 'curve', fn: c.fn, from, to, ...(c.arc ? { arc: c.arc } : {}) });
    p.curve(c.fn, { cls: c.cls ?? 'curve', from, to, samples: c.arc ? 600 : 360 });
  }
}

const upperArc = (r) => (x) => Math.sqrt(Math.max(0, r * r - x * x));
const lowerArc = (r) => (x) => -Math.sqrt(Math.max(0, r * r - x * x));
/** The arc of the circle of radius r about the origin from angle a0 to angle a1 (0 <= a0 < a1 <= pi), as a function of x. */
const arcOf = (name, r, a0, a1, cls = 'curve') => ({ name, cls, fn: upperArc(r), from: r * Math.cos(a1), to: r * Math.cos(a0), arc: { r, a0, a1 } });
/** Points along that arc, from angle a0 to angle a1. */
const arcPoints = (r, a0, a1, n = 60) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [r * Math.cos(a), r * Math.sin(a)]; });

/** A shaded region, drawn before the curves so the outline stays on top. */
function region(p, id, { name, pts }) {
  REGIONS[id].push({ name, pts });
  p.raw(`<polygon class="shade" points="${pts.map(([x, y]) => `${f2(p.X(x))},${f2(p.Y(y))}`).join(' ')}"/>`);
}

/** A marked point. Its label is placed by finish(), at the nearest spot that is clear of every curve and every other label. */
function mark(p, id, { name, x, y, text }) {
  ITEMS[id].push({ name, kind: 'point', x, y, text });
  PENDING[id].points.push({ name, x, y, text });
}

/**
 * The angle at O: a small arc round O, and the angle's own label inside the wedge, on the bisector of the two radii.
 * The arc has radius r / 5 and the label's target is 0.6 r along the bisector; the test checks both against the page.
 */
function angleMark(p, id, { r, theta, text }) {
  draw(p, id, [arcOf('angle', r / 5, 0, theta, 'curve-b')]);
  const x = 0.6 * r * Math.cos(theta / 2);
  const y = 0.6 * r * Math.sin(theta / 2);
  ITEMS[id].push({ name: 'ang', kind: 'tag', x, y, text });
  PENDING[id].tags.push({ name: 'ang', x, y, text });
}

/** A dashed line across the picture at height y (the right-hand side of an equation). Its equation is written beside it, near `at`. */
function level(p, id, { name, y, text, at }) {
  ITEMS[id].push({ name, kind: 'hline', y, text });
  p.hline(y);
  PENDING[id].levels.push({ name, y, text, at });
}

/** A straight segment, drawn as a solid line, with a tag (a short label such as "r = 5") placed beside it. An empty text means no label. */
function seg(p, id, { name, x1, y1, x2, y2, text = '' }) {
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
 * Place every label. A label is a box (14px a character, 34px tall) that must: stay inside the picture; keep clear of
 * every curve, segment, key line and other label; stay off every marker; and sit nearer its own item than any other.
 * Candidates are tried from the closest to the item outwards, so each label lands as near its item as the picture allows.
 */
function place(p, id) {
  const g = GEOM[id];
  const { points, levels, segs, tags, taken } = PENDING[id];
  const px = (x) => p.X(x);
  const py = (y) => p.Y(y);
  // the drawn curves and segments as pixel points, as the test samples them
  const dots = [];
  for (const c of CURVES[id]) {
    if (c.arc) {
      for (let i = 0; i <= SAMPLES; i += 1) {
        const a = c.arc.a0 + ((c.arc.a1 - c.arc.a0) * i) / SAMPLES;
        dots.push([px(c.arc.r * Math.cos(a)), py(c.arc.r * Math.sin(a))]);
      }
      continue;
    }
    for (let i = 0; i <= SAMPLES; i += 1) {
      const x = g.xmin + ((g.xmax - g.xmin) * i) / SAMPLES;
      if (x < c.from || x > c.to) continue;
      const y = c.fn(x);
      if (!Number.isFinite(y) || y < g.ymin || y > g.ymax) continue;
      dots.push([px(x), py(y)]);
    }
  }
  for (const s of segs) {
    for (let i = 0; i <= 200; i += 1) dots.push([px(s.x1 + ((s.x2 - s.x1) * i) / 200), py(s.y1 + ((s.y2 - s.y1) * i) / 200)]);
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
    ...tags.map((t) => ({ name: t.name, at: (qx, qy) => Math.hypot(qx - px(t.x), qy - py(t.y)), point: false })),
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
    for (const [anchor, dxs] of [['start', [16, 22, 30, 40, 52, 66, 84, 104, 126, 150, 176, 204]], ['end', [-16, -22, -30, -40, -52, -66, -84, -104, -126, -150, -176, -204]], ['middle', [0, -20, 20, -40, 40]]]) {
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
  for (const t of tags) put(items.find((i) => i.name === t.name), t.text, around(px(t.x), py(t.y)), false, '');
  for (const s of segs) if (s.text) put(items.find((i) => i.name === s.name), s.text, around((px(s.x1) + px(s.x2)) / 2, (py(s.y1) + py(s.y2)) / 2), false, ' alt');
  for (const c of circles) p.raw(`<circle class="pt" data-name="${c.name}" cx="${f2(c.cx)}" cy="${f2(c.cy)}" r="7"/>`);
  for (const t of out) p.raw(t);
}

/** Labels get a halo in the page colour, so a label that crosses an axis or a guide stays readable. */
const finish = (p, meta) => {
  place(p, meta.id);
  return p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');
};

// ---- the functions each picture is drawn from (the test holds its own copy of these) ----
const tanF = Math.tan;
const t3 = (v) => (Math.round(v * 1000) / 1000).toString();
const R = (r, a) => [r * Math.cos(a), r * Math.sin(a)];

/** A sector of the circle of radius r and angle theta (at most a quarter turn): the two radii, the arc and the points O, A, B. */
function sectorOutline(p, id, { r, theta, angleText, radiusText, shade = false }) {
  const [bx, by] = R(r, theta);
  if (shade) region(p, id, { name: 'sector', pts: [[0, 0], ...arcPoints(r, 0, theta)] });
  draw(p, id, [arcOf('arc', r, 0, theta)]);
  seg(p, id, { name: 'oa', x1: 0, y1: 0, x2: r, y2: 0, text: radiusText });
  seg(p, id, { name: 'ob', x1: 0, y1: 0, x2: bx, y2: by, text: radiusText });
  angleMark(p, id, { r, theta, text: angleText });
  mark(p, id, { name: 'o', x: 0, y: 0, text: 'O' });
  mark(p, id, { name: 'a', x: r, y: 0, text: 'A' });
  mark(p, id, { name: 'b', x: bx, y: by, text: 'B' });
}

const sinF = Math.sin;
const cosF = Math.cos;

export const FIGURES = {
  // ---- 1. one radian: the arc AB is as long as the radius ----
  'radians-one-radian': () => {
    const id = 'radians-one-radian';
    const p = sketch(id, { xmin: -1.5, xmax: 1.5, ymin: -1.5, ymax: 1.5, rows: 1, equal: true });
    keyRow(p, id, 0, 'curve', 'The arc AB is as long as the radius');
    draw(p, id, [{ name: 'top', cls: 'curve-c', fn: upperArc(1), from: -1, to: 1, arc: { r: 1, a0: 0, a1: Math.PI } }, { name: 'bottom', cls: 'curve-c', fn: lowerArc(1), from: -1, to: 1, arc: { r: 1, a0: Math.PI, a1: 2 * Math.PI } }, arcOf('arc', 1, 0, 1)]);
    const [bx, by] = R(1, 1);
    seg(p, id, { name: 'oa', x1: 0, y1: 0, x2: 1, y2: 0, text: 'r' });
    seg(p, id, { name: 'ob', x1: 0, y1: 0, x2: bx, y2: by, text: 'r' });
    angleMark(p, id, { r: 1, theta: 1, text: '1 rad' });
    mark(p, id, { name: 'o', x: 0, y: 0, text: 'O' });
    mark(p, id, { name: 'a', x: 1, y: 0, text: 'A' });
    mark(p, id, { name: 'b', x: bx, y: by, text: 'B' });
    return finish(p, {
      id,
      title: 'A circle with two radii that make an angle of one radian, and the arc between them, which is as long as a radius',
      desc: `A circle with centre O at the origin, drawn as a dotted line. Two solid radii run from O. One goes along the positive x-axis to the marked point A (1, 0). The other goes to the marked point B (${t3(bx)}, ${t3(by)}). Each radius is labelled r. The angle between the radii, at O, is 1 radian, about 57.3 degrees. A small dashed arc at O marks the angle, labelled 1 rad. The solid arc AB, between A and B, is exactly as long as a radius.`,
    });
  },

  // ---- 2. the unit circle with radian angles ----
  'radians-unit-circle': () => {
    const id = 'radians-unit-circle';
    const p = sketch(id, { xmin: -1.5, xmax: 1.5, ymin: -1.5, ymax: 1.5, rows: 2, equal: true });
    keyRow(p, id, 0, 'curve', 'The unit circle');
    keyRow(p, id, 1, 'curve', 'Each point shows its angle in radians');
    draw(p, id, [{ name: 'top', fn: upperArc(1), from: -1, to: 1, arc: { r: 1, a0: 0, a1: Math.PI } }, { name: 'bottom', fn: lowerArc(1), from: -1, to: 1, arc: { r: 1, a0: Math.PI, a1: 2 * Math.PI } }]);
    const at = (name, a, text) => { const [x, y] = R(1, a); mark(p, id, { name, x, y, text }); };
    at('p6', Math.PI / 6, `${PI}/6`);
    at('p4', Math.PI / 4, `${PI}/4`);
    at('p3', Math.PI / 3, `${PI}/3`);
    at('p2', Math.PI / 2, `${PI}/2`);
    at('p1', Math.PI, `${PI}`);
    at('p32', (3 * Math.PI) / 2, `3${PI}/2`);
    return finish(p, {
      id,
      title: 'The unit circle with six angles marked in radians, from pi over 6 to 3 pi over 2',
      desc: `The unit circle, a circle of radius 1 with its centre at the origin. Six points are marked on it, and each is labelled with the angle that the radius to it makes with the positive x-axis, measured anticlockwise. In the top right quarter: ${PI}/6 at (${t3(R(1, Math.PI / 6)[0])}, ${t3(R(1, Math.PI / 6)[1])}), ${PI}/4 at (${t3(R(1, Math.PI / 4)[0])}, ${t3(R(1, Math.PI / 4)[1])}) and ${PI}/3 at (${t3(R(1, Math.PI / 3)[0])}, ${t3(R(1, Math.PI / 3)[1])}). Then ${PI}/2 at the top of the circle (0, 1), ${PI} at the left of the circle (-1, 0), and 3${PI}/2 at the bottom of the circle (0, -1).`,
    });
  },

  // ---- 3. arc length: r = 5, angle 1.2, arc 6 ----
  'radians-arc': () => {
    const id = 'radians-arc';
    const p = sketch(id, { xmin: -1, xmax: 6, ymin: -1, ymax: 6, rows: 1, equal: true });
    keyRow(p, id, 0, 'curve', 'The arc AB has length 6');
    sectorOutline(p, id, { r: 5, theta: 1.2, angleText: '1.2 rad', radiusText: 'r = 5' });
    const [bx, by] = R(5, 1.2);
    return finish(p, {
      id,
      title: 'A sector with radius 5 and angle 1.2 radians, whose arc AB has length 6',
      desc: `A sector of a circle with centre O at the origin. Two solid radii each have length 5, labelled r = 5. One goes along the positive x-axis to the marked point A (5, 0). The other goes to the marked point B (${t3(bx)}, ${t3(by)}). The angle at O between them is 1.2 radians. A small dashed arc at O marks it, and the label 1.2 rad sits inside the sector. The curved arc AB has length 6, which is 5 multiplied by 1.2.`,
    });
  },

  // ---- 4. sector area: r = 6, angle 1.5, area 27 ----
  'radians-sector': () => {
    const id = 'radians-sector';
    const p = sketch(id, { xmin: -1, xmax: 7, ymin: -1, ymax: 7, rows: 1, equal: true });
    keyRow(p, id, 0, 'shade', 'The shaded sector has area 27');
    sectorOutline(p, id, { r: 6, theta: 1.5, angleText: '1.5 rad', radiusText: 'r = 6', shade: true });
    const [bx, by] = R(6, 1.5);
    return finish(p, {
      id,
      title: 'A shaded sector with radius 6 and angle 1.5 radians, whose area is 27',
      desc: `A shaded sector of a circle with centre O at the origin. Two solid radii each have length 6, labelled r = 6. One goes along the positive x-axis to the marked point A (6, 0). The other goes to the marked point B (${t3(bx)}, ${t3(by)}). The angle at O between them is 1.5 radians. A small dashed arc at O marks it, and the label 1.5 rad sits inside the sector. The sector between the radii and the arc AB is shaded, and its area is 27, which is a half of 6 squared, multiplied by 1.5.`,
    });
  },

  // ---- 5. a segment: r = 10, angle pi/2 ----
  'radians-segment': () => {
    const id = 'radians-segment';
    const p = sketch(id, { xmin: -2, xmax: 12, ymin: -2, ymax: 12, rows: 1, equal: true });
    keyRow(p, id, 0, 'shade', 'Shaded: the segment');
    region(p, id, { name: 'segment', pts: arcPoints(10, 0, Math.PI / 2) });
    draw(p, id, [arcOf('arc', 10, 0, Math.PI / 2)]);
    seg(p, id, { name: 'oa', x1: 0, y1: 0, x2: 10, y2: 0, text: 'r = 10' });
    seg(p, id, { name: 'ob', x1: 0, y1: 0, x2: 0, y2: 10, text: 'r = 10' });
    seg(p, id, { name: 'ab', x1: 10, y1: 0, x2: 0, y2: 10, text: 'chord' });
    angleMark(p, id, { r: 10, theta: Math.PI / 2, text: `${PI}/2` });
    mark(p, id, { name: 'o', x: 0, y: 0, text: 'O' });
    mark(p, id, { name: 'a', x: 10, y: 0, text: 'A' });
    mark(p, id, { name: 'b', x: 0, y: 10, text: 'B' });
    return finish(p, {
      id,
      title: 'A sector with radius 10 and angle pi over 2, with its chord AB, and the segment between the chord and the arc shaded',
      desc: `A sector of a circle with centre O at the origin, with two solid radii of length 10, labelled r = 10. One goes along the positive x-axis to the marked point A (10, 0). The other goes up the y-axis to the marked point B (0, 10). The angle at O is ${PI}/2, a quarter turn, marked by a small dashed arc and labelled ${PI}/2 inside the sector. A solid straight line, labelled chord, joins A to B. The curved arc AB bulges out beyond the chord. The shaded segment is the region between the chord and the arc. The triangle OAB is not shaded.`,
    });
  },

  // ---- 6. sin x = 1/2 in radians ----
  'radians-sin-graph': () => {
    const id = 'radians-sin-graph';
    const p = sketch(id, { xmin: -1.2, xmax: 7.6, ymin: -1.5, ymax: 2.7, rows: 2, height: 560 });
    keyRow(p, id, 0, 'curve', 'y = sin x');
    keyRow(p, id, 1, 'guide', 'y = 1/2');
    draw(p, id, [{ name: 'f', fn: sinF, from: 0, to: 2 * Math.PI }]);
    level(p, id, { name: 'k', y: 0.5, text: 'y = 1/2', at: 7 });
    mark(p, id, { name: 's1', x: Math.PI / 6, y: 0.5, text: `${PI}/6` });
    mark(p, id, { name: 's2', x: (5 * Math.PI) / 6, y: 0.5, text: `5${PI}/6` });
    mark(p, id, { name: 'z1', x: Math.PI, y: 0, text: `${PI}` });
    mark(p, id, { name: 'z2', x: 2 * Math.PI, y: 0, text: `2${PI}` });
    return finish(p, {
      id,
      title: 'The graph of y = sin x from 0 to 2 pi, cut by the line y = 1/2 at two points',
      desc: `The sine wave from 0 to 2${PI}. It rises to 1 at ${PI}/2, falls through 0 at ${PI} to -1 at 3${PI}/2, and returns to 0 at 2${PI}. The marked points (${t3(Math.PI)}, 0) and (${t3(2 * Math.PI)}, 0) are labelled ${PI} and 2${PI}. A dashed horizontal line, labelled y = 1/2, cuts the wave at two marked points: (${t3(Math.PI / 6)}, 0.5), labelled ${PI}/6, on the way up, and (${t3((5 * Math.PI) / 6)}, 0.5), labelled 5${PI}/6, on the way down.`,
    });
  },

  // ---- 7. tan x = 1 in radians: two solutions a period (pi) apart ----
  'radians-tan-graph': () => {
    const id = 'radians-tan-graph';
    const p = sketch(id, { xmin: -1.2, xmax: 7.6, ymin: -6, ymax: 7, rows: 2, height: 600 });
    keyRow(p, id, 0, 'curve', 'y = tan x');
    keyRow(p, id, 1, 'guide', 'y = 1');
    draw(p, id, [{ name: 'f', fn: tanF, from: 0, to: 2 * Math.PI }]);
    level(p, id, { name: 'k', y: 1, text: 'y = 1', at: 7 });
    mark(p, id, { name: 's1', x: Math.PI / 4, y: 1, text: `${PI}/4` });
    mark(p, id, { name: 's2', x: (5 * Math.PI) / 4, y: 1, text: `5${PI}/4` });
    return finish(p, {
      id,
      title: 'The graph of y = tan x from 0 to 2 pi, cut by the line y = 1 at two points a period apart',
      desc: `The tangent graph from 0 to 2${PI}, in three pieces separated by vertical asymptotes at ${PI}/2 and 3${PI}/2. It climbs from 0 at 0 towards the asymptote at ${PI}/2, climbs from far below through 0 at ${PI} to the asymptote at 3${PI}/2, then climbs from far below to 0 at 2${PI}. A dashed horizontal line, labelled y = 1, cuts the graph at two marked points: (${t3(Math.PI / 4)}, 1), labelled ${PI}/4, and (${t3((5 * Math.PI) / 4)}, 1), labelled 5${PI}/4. They are ${PI} apart, which is the period of tangent.`,
    });
  },

  // ---- 8. the small-angle approximation: sin x and x agree near 0 and part company later ----
  'radians-small-angle': () => {
    const id = 'radians-small-angle';
    const p = sketch(id, { xmin: -0.3, xmax: 2, ymin: -0.3, ymax: 1.9, rows: 2, height: 560 });
    keyRow(p, id, 0, 'curve', 'y = sin x');
    keyRow(p, id, 1, 'curve-b', 'y = x');
    draw(p, id, [{ name: 'f', fn: sinF, from: 0, to: 1.8 }, { name: 'g', cls: 'curve-b', fn: (x) => x, from: 0, to: 1.8 }]);
    mark(p, id, { name: 'u', x: 1, y: 1, text: '(1, 1)' });
    mark(p, id, { name: 'v', x: 1, y: sinF(1), text: `(1, ${t3(sinF(1))})` });
    return finish(p, {
      id,
      title: 'The graphs of y = sin x and y = x from 0 to 1.8, which agree near 0 and separate as x grows',
      desc: `Two curves from x = 0 to x = 1.8. The solid curve is y = sin x. The dashed straight line is y = x. Close to 0 they lie on top of each other. At x = 1 they are well apart: the marked point (1, 1) is on the line, and the marked point (1, ${t3(sinF(1))}) is on the sine curve, below it.`,
    });
  },

  // ---- question figures: the picture shows the facts, never the answer ----
  'radians-q-sector': () => {
    const id = 'radians-q-sector';
    const p = sketch(id, { xmin: -1, xmax: 9, ymin: -1, ymax: 9, rows: 1, equal: true });
    keyRow(p, id, 0, 'curve', 'A sector of a circle');
    const [bx, by] = R(8, 0.9);
    draw(p, id, [arcOf('arc', 8, 0, 0.9)]);
    seg(p, id, { name: 'oa', x1: 0, y1: 0, x2: 8, y2: 0, text: '8 cm' });
    seg(p, id, { name: 'ob', x1: 0, y1: 0, x2: bx, y2: by, text: '8 cm' });
    angleMark(p, id, { r: 8, theta: 0.9, text: '0.9 rad' });
    mark(p, id, { name: 'o', x: 0, y: 0, text: 'O' });
    return finish(p, {
      id,
      title: 'A sector with radius 8 centimetres and angle 0.9 radians',
      desc: `A sector of a circle with centre O at the origin. Its two straight edges are radii, each labelled 8 cm. One lies along the positive x-axis. The other is higher up, so that the angle between them at the marked point O (0, 0) is 0.9 radians. A small dashed arc at O marks it, and the label 0.9 rad sits inside the sector. The curved edge of the sector is an arc of the circle.`,
    });
  },

  'radians-q-sin-line': () => {
    const id = 'radians-q-sin-line';
    const p = sketch(id, { xmin: -1.2, xmax: 7.6, ymin: -1.5, ymax: 2.7, rows: 1, height: 500 });
    draw(p, id, [{ name: 'f', fn: sinF, from: 0, to: 2 * Math.PI }]);
    level(p, id, { name: 'k', y: 0.8, text: 'y = 0.8', at: 7 });
    return finish(p, {
      id,
      title: 'The graph of y = sin x from 0 to 2 pi, with a dashed horizontal line at height 0.8',
      desc: `The sine wave from 0 to 2${PI}. A dashed horizontal line, labelled y = 0.8, is close to the top of the wave. It meets the wave at two points, one each side of the highest point.`,
    });
  },

  'radians-q-tangent': () => {
    const id = 'radians-q-tangent';
    const p = sketch(id, { xmin: -2, xmax: 14, ymin: -2, ymax: 14, rows: 1, equal: true });
    keyRow(p, id, 0, 'shade', 'The shaded region R');
    const a = Math.PI / 6;
    const [bx, by] = R(12, a);
    const ty = 12 * tanF(a);
    region(p, id, { name: 'region', pts: [...arcPoints(12, 0, a), [12, ty]] });
    draw(p, id, [arcOf('arc', 12, 0, a)]);
    seg(p, id, { name: 'oa', x1: 0, y1: 0, x2: 12, y2: 0, text: '12 cm' });
    seg(p, id, { name: 'at', x1: 12, y1: 0, x2: 12, y2: ty });
    seg(p, id, { name: 'ot', x1: 0, y1: 0, x2: 12, y2: ty });
    angleMark(p, id, { r: 12, theta: Math.PI / 6, text: `${PI}/6` });
    mark(p, id, { name: 'o', x: 0, y: 0, text: 'O' });
    mark(p, id, { name: 'a', x: 12, y: 0, text: 'A' });
    mark(p, id, { name: 'b', x: bx, y: by, text: 'B' });
    mark(p, id, { name: 't', x: 12, y: ty, text: 'T' });
    return finish(p, {
      id,
      title: 'A sector OAB of radius 12 centimetres and angle pi over 6, with the tangent at A meeting OB extended at T',
      desc: `A sector OAB of a circle with centre O at the origin. The radius OA, labelled 12 cm, lies along the positive x-axis to the marked point A (12, 0). The angle at O, between OA and OB, is ${PI}/6. A small dashed arc at O marks it, and the label ${PI}/6 sits inside the sector. The point B (${t3(bx)}, ${t3(by)}) is on the arc. A straight line from O through B carries on to the marked point T. A vertical line from A up to T is the tangent to the circle at A. It makes a right angle with OA. The region R, bounded by the arc AB, the straight line BT and the tangent TA, is shaded.`,
    });
  },
};
