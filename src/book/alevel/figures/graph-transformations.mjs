// Figures for the Transformations of graphs topic page (src/pages/courses/a-level/graph-transformations.html).
//
// Every curve is drawn FROM the function listed for it in CURVES, so a picture cannot disagree with its equation.
// Each picture is a sketch: no grid and no scale numbers, because a stretched cubic or a reciprocal graph is steep and
// the two axes do not share a scale. What matters is marked on the picture itself, with its coordinates. The equation
// of each curve sits in a key above the graph, so no label sits on a curve. An asymptote that is not an axis is drawn
// as a dashed guide line with its equation written beside it.
//
// test/alevel-graph-transformations.spec.ts reads GEOM, CURVES and ITEMS to check each curve, each marked point and
// each asymptote against the page's own numbers, and checks that every label is nearest its own item.
import { plane, label } from '../figure-lib.mjs';

const DEG = String.fromCharCode(0xb0); // kept out of the source so the file stays plain ASCII

/** The size and range of each picture, kept so a test can turn a pixel back into graph coordinates. */
export const GEOM = {};
/** The curves of each picture in the order they are drawn: { name, cls, fn, from, to }. */
export const CURVES = {};
/** What is marked on each picture: { name, kind: 'point', x, y } or { name, kind: 'vline', x } or { name, kind: 'hline', y }. */
export const ITEMS = {};

const W = 600; // a narrow picture, so the labels are drawn large when it is scaled down to a phone
const LEFT = 64;
const RIGHT = 48;
const BOTTOM = 52;
const ROW = 46; // the height of one row of the key above the graph

/** A plane with no grid and no scale numbers, and a key above it of `rows` lines. */
function sketch(id, { xmin, xmax, ymin, ymax, rows = 2, height = 520, ylabel = 'y' }) {
  const top = 64 + ROW * (rows - 1) + 46;
  GEOM[id] = { width: W, height, left: LEFT, right: RIGHT, top, bottom: BOTTOM, xmin, xmax, ymin, ymax };
  CURVES[id] = [];
  ITEMS[id] = [];
  PENDING[id] = { points: [], lines: [], taken: [] };
  return plane({ grid: false, ticks: false, tickLabels: false, width: W, height, top, xmin, xmax, ymin, ymax, ylabel });
}

/** What each picture still has to place: its marked points, its asymptote labels, and the boxes that are already taken. */
const PENDING = {};
const CHAR = 13; // the width the tests allow for one character of a label
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

/** An asymptote: a dashed guide line across the picture. Its equation is written beside it, near `at` (graph units). */
function asymptote(p, id, { name, x, y, text, at }) {
  ITEMS[id].push(x !== undefined ? { name, kind: 'vline', x } : { name, kind: 'hline', y });
  if (x !== undefined) p.vline(x); else p.hline(y);
  PENDING[id].lines.push({ name, x, y, text, at });
}

/**
 * Place every label. A label is a box (13px a character, 34px tall) that must: stay inside the picture; keep clear of
 * every curve, key line and other label; stay off every marker; and sit nearer its own item than any other.
 * Candidates are tried from the closest to the item outwards, so each label lands as near its item as the picture allows.
 */
function place(p, id) {
  const g = GEOM[id];
  const { points, lines, taken } = PENDING[id];
  const px = (x) => p.X(x);
  const py = (y) => p.Y(y);
  // the drawn curves as pixel points, as the test samples them
  const dots = [];
  for (const c of CURVES[id]) {
    for (let i = 0; i <= 1500; i += 1) {
      const x = g.xmin + ((g.xmax - g.xmin) * i) / 1500;
      if (x < c.from || x > c.to) continue;
      const y = c.fn(x);
      if (!Number.isFinite(y) || y < g.ymin || y > g.ymax) continue;
      dots.push([px(x), py(y)]);
    }
  }
  // the axes and the asymptote lines are thin boxes that no label may touch
  taken.push({ x0: px(g.xmin), x1: px(g.xmax) + 12, y0: py(0) - 3, y1: py(0) + 3 });
  taken.push({ x0: px(0) - 3, x1: px(0) + 3, y0: py(g.ymax) - 12, y1: py(g.ymin) });
  for (const l of lines) taken.push(l.x !== undefined ? { owner: l.name, x0: px(l.x) - 3, x1: px(l.x) + 3, y0: py(g.ymax), y1: py(g.ymin) } : { owner: l.name, x0: px(g.xmin), x1: px(g.xmax), y0: py(l.y) - 3, y1: py(l.y) + 3 });
  // the two axis letters
  taken.push({ x0: px(g.xmax) + 8, x1: px(g.xmax) + 40, y0: py(0) - 20, y1: py(0) + 20 });
  taken.push({ x0: px(0) - 16, x1: px(0) + 16, y0: py(g.ymax) - 50, y1: py(g.ymax) - 6 });
  const circles = points.map((q) => ({ name: q.name, cx: px(q.x), cy: py(q.y) }));
  const items = [
    ...circles.map((c) => ({ name: c.name, at: (qx, qy) => Math.hypot(qx - c.cx, qy - c.cy), point: true })),
    ...lines.map((l) => ({ name: l.name, at: l.x !== undefined ? (qx) => Math.abs(qx - px(l.x)) : (qx, qy) => Math.abs(qy - py(l.y)), point: false })),
  ];
  const placed = [];
  const boxOf = (text, x, y, anchor) => {
    const width = text.length * CHAR;
    const x0 = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
    return { x0, x1: x0 + width, y0: y - 26, y1: y + 8, cx: x0 + width / 2, cy: y - 8 };
  };
  const why = {};
  const clear = (b, own, isPoint) => {
    if (b.x0 < 4 || b.x1 > W - 4 || b.y0 < 4 || b.y1 > GEOM[id].height - 4) { why.edge = (why.edge ?? 0) + 1; return false; }
    for (const [qx, qy] of dots) if (qx > b.x0 - 5 && qx < b.x1 + 5 && qy > b.y0 - 5 && qy < b.y1 + 5) { why.curve = (why.curve ?? 0) + 1; return false; }
    for (const t of [...taken, ...placed]) {
      const margin = t.owner === own.name ? 0 : 6; // a label may sit close beside its own asymptote
      if (Math.max(t.x0 - b.x1, b.x0 - t.x1) < margin && Math.max(t.y0 - b.y1, b.y0 - t.y1) < margin) { why.taken = (why.taken ?? 0) + 1; return false; }
    }
    for (const c of circles) {
      if (c.cx > b.x0 - 14 && c.cx < b.x1 + 14 && c.cy > b.y0 - 14 && c.cy < b.y1 + 14) { why.marker = (why.marker ?? 0) + 1; return false; } // a label never covers a marker
    }
    const mine = own.at(b.cx, b.cy);
    for (const other of items) if (other !== own && (!isPoint || other.point) && other.at(b.cx, b.cy) < mine + 2) { why.near = (why.near ?? 0) + 1; return false; }
    return true;
  };
  const out = [];
  for (const q of points) {
    const own = items.find((i) => i.name === q.name);
    const text = label(q.text);
    const cands = [];
    const dys = [-16, -22, -30, -40, -52, -66, -82, 4, 10, 16, 22, 28, 34, 40, 46, 54, 64, 76, 90, 106, 124];
    for (const [anchor, dxs] of [['start', [16, 22, 30, 40, 52, 66, 84, 104]], ['end', [-16, -22, -30, -40, -52, -66, -84, -104]], ['middle', [0]]]) {
      for (const dx of dxs) for (const dy of dys) {
        cands.push({ anchor, x: px(q.x) + dx, y: py(q.y) + dy, cost: Math.abs(dx) + Math.abs(dy - 10) * 0.8 });
      }
    }
    cands.sort((a, b) => a.cost - b.cost);
    let best = null;
    for (const c of cands) {
      const b = boxOf(q.text, c.x, c.y, c.anchor);
      if (clear(b, own, true)) { best = { ...c, b }; break; }
    }
    if (!best) throw new Error(`${id}: no place for the label of "${q.name}" ${JSON.stringify(why)}`);
    placed.push(best.b);
    out.push(`<text class="svg-t" data-for="${q.name}" x="${f2(best.x)}" y="${f2(best.y)}" text-anchor="${best.anchor}">${text}</text>`);
  }
  for (const l of lines) {
    const own = items.find((i) => i.name === l.name);
    const text = label(l.text);
    const cands = [];
    if (l.x !== undefined) {
      for (const [anchor, dx] of [['start', 14], ['end', -14]]) for (let y = 40; y < GEOM[id].height - 30; y += 12) cands.push({ anchor, x: px(l.x) + dx, y, cost: Math.abs(y - py(l.at[1])) });
    } else {
      for (const [anchor, dy] of [['start', -14], ['end', -14], ['start', 36], ['end', 36]]) for (let x = LEFT; x < W - 40; x += 14) cands.push({ anchor, x, y: py(l.y) + dy, cost: Math.abs(x - px(l.at[0])) + (dy > 0 ? 6 : 0) });
    }
    cands.sort((a, b) => a.cost - b.cost);
    let best = null;
    for (const c of cands) {
      const b = boxOf(l.text, c.x, c.y, c.anchor);
      if (clear(b, own, false)) { best = { ...c, b }; break; }
    }
    if (!best) throw new Error(`${id}: no place for the label of "${l.name}"`);
    placed.push(best.b);
    out.push(`<text class="svg-t alt" data-for="${l.name}" x="${f2(best.x)}" y="${f2(best.y)}" text-anchor="${best.anchor}">${text}</text>`);
  }
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
const cub = (x) => (x + 1) * (x - 1) * (x - 3); // f(x), used for every cubic picture
const sq = (x) => x ** 2;
const sqUp = (x) => x ** 2 + 3;
const cubLeft = (x) => cub(x + 1);
const cubTall = (x) => 2 * cub(x);
const cubNarrow = (x) => cub(2 * x);
const cubFlipX = (x) => -cub(x);
const cubFlipY = (x) => cub(-x);
const hyper6 = (x) => 6 / x;
const hyper6Moved = (x) => 6 / (x - 3) + 1;
const hyperNeg3 = (x) => -3 / x;
const hyperNeg3Moved = (x) => -3 / (x + 1) + 1;
const quadCombo = (x) => 2 * (x - 1) ** 2 + 3;
const sinD = (x) => Math.sin(rad(x));
const sinTwice = (x) => 2 * Math.sin(rad(x));
const sinRight = (x) => Math.sin(rad(x - 60));
const sinDouble = (x) => Math.sin(rad(2 * x));
const exp2 = (x) => 2 ** x;
const exp2Down = (x) => 2 ** x - 2;
const exp2Mirror = (x) => 2 ** -x;
const recipFind = (x) => 3 / (x + 1) + 2;
const qParab = (x) => (x - 2) ** 2 - 3;
const qRecip = (x) => 8 / (x - 2) - 1;
const qTrig = (x) => 2 * Math.sin(rad(x)) + 3;

const SINE = { from: 0, to: 360 }; // a trigonometric picture shows one turn of the curve

export const FIGURES = {
  // ---- 1. the graph used for every cubic example: y = f(x) = (x + 1)(x - 1)(x - 3) ----
  'graph-transformations-base': () => {
    const id = 'graph-transformations-base';
    const p = sketch(id, { xmin: -2, xmax: 4, ymin: -9, ymax: 9, rows: 1 });
    keyRow(p, id, 0, 'curve', 'y = f(x) = (x + 1)(x - 1)(x - 3)');
    draw(p, id, [{ name: 'f', fn: cub }]);
    mark(p, id, { name: 'r1', x: -1, y: 0, text: '(-1, 0)' });
    mark(p, id, { name: 'r2', x: 1, y: 0, text: '(1, 0)' });
    mark(p, id, { name: 'r3', x: 3, y: 0, text: '(3, 0)' });
    mark(p, id, { name: 'yint', x: 0, y: 3, text: '(0, 3)' });
    return finish(p, {
      id,
      title: 'The graph of y = f(x), where f(x) = (x + 1)(x - 1)(x - 3), crosses the x-axis at -1, 1 and 3 and the y-axis at 3',
      desc: 'A cubic curve that comes up from the bottom left and crosses the x-axis at the marked point (-1, 0). It reaches a high point close to the left of the y-axis, passing the marked point (0, 3) on the y-axis, then falls and crosses the x-axis at the marked point (1, 0). It reaches a low point below the axis, then crosses the axis a third time at the marked point (3, 0) and keeps rising to the top right.',
    });
  },

  // ---- 1. up: y = x^2 and y = x^2 + 3 ----
  'graph-transformations-up': () => {
    const id = 'graph-transformations-up';
    const p = sketch(id, { xmin: -3.2, xmax: 3.2, ymin: -2, ymax: 13, rows: 2 });
    keyRow(p, id, 0, 'curve', 'y = f(x) = x^2');
    keyRow(p, id, 1, 'curve-b', 'y = f(x) + 3 = x^2 + 3');
    draw(p, id, [{ name: 'f', fn: sq }, { name: 'moved', cls: 'curve-b', fn: sqUp }]);
    mark(p, id, { name: 'v0', x: 0, y: 0, text: '(0, 0)' });
    mark(p, id, { name: 'v1', x: 0, y: 3, text: '(0, 3)' });
    return finish(p, {
      id,
      title: 'The graph of y = x squared and the graph of y = x squared + 3, which is the first moved up 3',
      desc: 'Two U-shaped curves with the y-axis as their line of symmetry. The solid curve, y equals x squared, has its lowest point at the marked point (0, 0). The dashed curve, y equals x squared plus 3, is the same shape moved up, with its lowest point at the marked point (0, 3). Every point of the dashed curve is 3 above the point of the solid curve with the same x-coordinate.',
    });
  },

  // ---- 1. left: y = f(x) and y = f(x + 1) ----
  'graph-transformations-left': () => {
    const id = 'graph-transformations-left';
    const p = sketch(id, { xmin: -3, xmax: 4, ymin: -9, ymax: 9, rows: 2 });
    keyRow(p, id, 0, 'curve', 'y = f(x)');
    keyRow(p, id, 1, 'curve-b', 'y = f(x + 1)');
    draw(p, id, [{ name: 'f', fn: cub }, { name: 'moved', cls: 'curve-b', fn: cubLeft }]);
    mark(p, id, { name: 'r1', x: -2, y: 0, text: '(-2, 0)' });
    mark(p, id, { name: 'r2', x: 0, y: 0, text: '(0, 0)' });
    mark(p, id, { name: 'r3', x: 2, y: 0, text: '(2, 0)' });
    return finish(p, {
      id,
      title: 'The graph of y = f(x + 1) is the graph of y = f(x) moved 1 to the left, and crosses the x-axis at -2, 0 and 2',
      desc: 'Two cubic curves with the same shape. The solid curve is y equals f of x, which crosses the x-axis at -1, 1 and 3. The dashed curve is y equals f of x plus 1. It is the solid curve moved 1 to the left, so it crosses the x-axis at the marked points (-2, 0), (0, 0) and (2, 0). Each crossing point of the dashed curve is 1 to the left of a crossing point of the solid curve.',
    });
  },

  // ---- 2. a vertical stretch: y = 2 f(x) ----
  'graph-transformations-vstretch': () => {
    const id = 'graph-transformations-vstretch';
    const p = sketch(id, { xmin: -2, xmax: 4, ymin: -14, ymax: 14, rows: 2 });
    keyRow(p, id, 0, 'curve', 'y = f(x)');
    keyRow(p, id, 1, 'curve-b', 'y = 2f(x)');
    draw(p, id, [{ name: 'f', fn: cub }, { name: 'moved', cls: 'curve-b', fn: cubTall }]);
    mark(p, id, { name: 'yint', x: 0, y: 6, text: '(0, 6)' });
    return finish(p, {
      id,
      title: 'The graph of y = 2f(x) is the graph of y = f(x) stretched away from the x-axis, and meets the y-axis at 6',
      desc: 'Two cubic curves that cross the x-axis at the same three points, -1, 1 and 3. The solid curve is y equals f of x, which meets the y-axis at 3. The dashed curve is y equals 2 times f of x. It is taller: every height is doubled, so it meets the y-axis at the marked point (0, 6). The crossing points on the x-axis do not move.',
    });
  },

  // ---- 2. a horizontal stretch: y = f(2x) ----
  'graph-transformations-hstretch': () => {
    const id = 'graph-transformations-hstretch';
    const p = sketch(id, { xmin: -1.3, xmax: 2.3, ymin: -9, ymax: 9, rows: 2 });
    keyRow(p, id, 0, 'curve', 'y = f(x)');
    keyRow(p, id, 1, 'curve-b', 'y = f(2x)');
    draw(p, id, [{ name: 'f', fn: cub }, { name: 'moved', cls: 'curve-b', fn: cubNarrow }]);
    mark(p, id, { name: 'r1', x: -0.5, y: 0, text: '(-0.5, 0)' });
    mark(p, id, { name: 'r2', x: 0.5, y: 0, text: '(0.5, 0)' });
    mark(p, id, { name: 'r3', x: 1.5, y: 0, text: '(1.5, 0)' });
    return finish(p, {
      id,
      title: 'The graph of y = f(2x) is the graph of y = f(x) squashed towards the y-axis, and crosses the x-axis at -0.5, 0.5 and 1.5',
      desc: 'Two cubic curves that meet the y-axis at the same point, 3. The solid curve is y equals f of x, which crosses the x-axis at -1, 1 and 3. The dashed curve is y equals f of 2x. It is squashed towards the y-axis: every crossing point is half as far from the y-axis, so it crosses the x-axis at the marked points (-0.5, 0), (0.5, 0) and (1.5, 0). The point where it meets the y-axis does not move.',
    });
  },

  // ---- 3. a reflection in the x-axis: y = -f(x) ----
  'graph-transformations-xreflect': () => {
    const id = 'graph-transformations-xreflect';
    const p = sketch(id, { xmin: -2, xmax: 4, ymin: -9, ymax: 9, rows: 2 });
    keyRow(p, id, 0, 'curve', 'y = f(x)');
    keyRow(p, id, 1, 'curve-b', 'y = -f(x)');
    draw(p, id, [{ name: 'f', fn: cub }, { name: 'moved', cls: 'curve-b', fn: cubFlipX }]);
    mark(p, id, { name: 'yint', x: 0, y: -3, text: '(0, -3)' });
    return finish(p, {
      id,
      title: 'The graph of y = -f(x) is the graph of y = f(x) reflected in the x-axis, and meets the y-axis at -3',
      desc: 'Two cubic curves that are mirror images of each other in the x-axis. They cross the x-axis at the same three points, -1, 1 and 3. The solid curve is y equals f of x, which meets the y-axis at 3. The dashed curve is y equals minus f of x. It comes down from the top left and goes on down to the bottom right, and it meets the y-axis at the marked point (0, -3).',
    });
  },

  // ---- 3. a reflection in the y-axis: y = f(-x) ----
  'graph-transformations-yreflect': () => {
    const id = 'graph-transformations-yreflect';
    const p = sketch(id, { xmin: -4, xmax: 2, ymin: -9, ymax: 9, rows: 2 });
    keyRow(p, id, 0, 'curve', 'y = f(x)');
    keyRow(p, id, 1, 'curve-b', 'y = f(-x)');
    draw(p, id, [{ name: 'f', fn: cub }, { name: 'moved', cls: 'curve-b', fn: cubFlipY }]);
    mark(p, id, { name: 'r1', x: -3, y: 0, text: '(-3, 0)' });
    mark(p, id, { name: 'r2', x: -1, y: 0, text: '(-1, 0)' });
    mark(p, id, { name: 'r3', x: 1, y: 0, text: '(1, 0)' });
    return finish(p, {
      id,
      title: 'The graph of y = f(-x) is the graph of y = f(x) reflected in the y-axis, and crosses the x-axis at -3, -1 and 1',
      desc: 'Two cubic curves that are mirror images of each other in the y-axis. They meet the y-axis at the same point, 3. The solid curve is y equals f of x, which crosses the x-axis at -1, 1 and 3. The dashed curve is y equals f of minus x. It crosses the x-axis at the marked points (-3, 0), (-1, 0) and (1, 0), and it comes down from the top left and goes on down to the bottom right.',
    });
  },

  // ---- 4. the reciprocal graph moved: y = 6/x becomes y = 6/(x - 3) + 1 ----
  'graph-transformations-recip-shift': () => {
    const id = 'graph-transformations-recip-shift';
    const p = sketch(id, { xmin: -5, xmax: 6, ymin: -4, ymax: 4.5, rows: 2, height: 720 });
    keyRow(p, id, 0, 'curve', 'y = 6/x');
    keyRow(p, id, 1, 'curve-b', 'y = 6/(x - 3) + 1');
    draw(p, id, [{ name: 'base', fn: hyper6 }, { name: 'moved', cls: 'curve-b', fn: hyper6Moved }]);
    asymptote(p, id, { name: 'va', x: 3, text: 'x = 3', at: [3, -4.2] });
    asymptote(p, id, { name: 'ha', y: 1, text: 'y = 1', at: [-4.9, 1] });
    mark(p, id, { name: 'xint', x: -3, y: 0, text: '(-3, 0)' });
    mark(p, id, { name: 'yint', x: 0, y: -1, text: '(0, -1)' });
    return finish(p, {
      id,
      title: 'The graph of y = 6/(x - 3) + 1 is the graph of y = 6/x moved 3 to the right and 1 up, with asymptotes x = 3 and y = 1',
      desc: 'Two reciprocal curves, each in two branches. The solid curve, y equals 6 over x, has one branch in the top right and one in the bottom left, and the two axes are its asymptotes. The dashed curve, y equals 6 over (x minus 3), plus 1, has the same shape moved 3 to the right and 1 up. Its asymptotes are two dashed lines, labelled x = 3 and y = 1. It has one branch in the top right and one in the bottom left of the point where those lines cross. The bottom left branch passes through the marked points (-3, 0) on the x-axis and (0, -1) on the y-axis.',
    });
  },

  // ---- 4. a negative number on top: y = -3/(x + 1) + 1 ----
  'graph-transformations-recip-neg': () => {
    const id = 'graph-transformations-recip-neg';
    const p = sketch(id, { xmin: -4.5, xmax: 5.5, ymin: -5, ymax: 7, rows: 2, height: 560 });
    keyRow(p, id, 0, 'curve', 'y = -3/x');
    keyRow(p, id, 1, 'curve-b', 'y = -3/(x + 1) + 1');
    draw(p, id, [{ name: 'base', fn: hyperNeg3 }, { name: 'moved', cls: 'curve-b', fn: hyperNeg3Moved }]);
    asymptote(p, id, { name: 'va', x: -1, text: 'x = -1', at: [-1, -4.2] });
    asymptote(p, id, { name: 'ha', y: 1, text: 'y = 1', at: [5.4, 1] });
    mark(p, id, { name: 'yint', x: 0, y: -2, text: '(0, -2)' });
    mark(p, id, { name: 'xint', x: 2, y: 0, text: '(2, 0)' });
    return finish(p, {
      id,
      title: 'The graph of y = -3/(x + 1) + 1 is the graph of y = -3/x moved 1 to the left and 1 up, with asymptotes x = -1 and y = 1',
      desc: 'Two reciprocal curves, each in two branches. The solid curve, y equals minus 3 over x, has one branch in the top left and one in the bottom right, and the two axes are its asymptotes. The dashed curve, y equals minus 3 over (x plus 1), plus 1, has the same shape moved 1 to the left and 1 up. Its asymptotes are two dashed lines, labelled x = -1 and y = 1. It has one branch in the top left and one in the bottom right of the point where those lines cross. The bottom right branch passes through the marked points (0, -2) on the y-axis and (2, 0) on the x-axis.',
    });
  },

  // ---- 5. combining: y = x^2 becomes y = 2(x - 1)^2 + 3 ----
  'graph-transformations-combo-quad': () => {
    const id = 'graph-transformations-combo-quad';
    const p = sketch(id, { xmin: -2.5, xmax: 3.5, ymin: -2, ymax: 14, rows: 2 });
    keyRow(p, id, 0, 'curve', 'y = f(x) = x^2');
    keyRow(p, id, 1, 'curve-b', 'y = 2f(x - 1) + 3');
    draw(p, id, [{ name: 'f', fn: sq }, { name: 'moved', cls: 'curve-b', fn: quadCombo }]);
    mark(p, id, { name: 'v0', x: 0, y: 0, text: '(0, 0)' });
    mark(p, id, { name: 'vertex', x: 1, y: 3, text: '(1, 3)' });
    mark(p, id, { name: 'yint', x: 0, y: 5, text: '(0, 5)' });
    return finish(p, {
      id,
      title: 'The graph of y = 2(x - 1) squared + 3 is the graph of y = x squared moved right, stretched and moved up, with its lowest point at (1, 3)',
      desc: `Two U-shaped curves. The solid curve is y equals x squared, with its lowest point at the marked point (0, 0). The dashed curve is y equals 2 times (x minus 1) squared, plus 3. It is narrower and higher, and its lowest point is the marked point (1, 3). It meets the y-axis at the marked point (0, 5). The line x = 1 is its line of symmetry.`,
    });
  },

  // ---- 6. a vertical stretch of the sine curve: y = 2 sin x ----
  'graph-transformations-sin-amp': () => {
    const id = 'graph-transformations-sin-amp';
    const p = sketch(id, { xmin: -40, xmax: 400, ymin: -3.2, ymax: 3.2, rows: 2 });
    keyRow(p, id, 0, 'curve', 'y = sin x');
    keyRow(p, id, 1, 'curve-b', 'y = 2 sin x');
    draw(p, id, [{ name: 'f', fn: sinD, ...SINE }, { name: 'moved', cls: 'curve-b', fn: sinTwice, ...SINE }]);
    mark(p, id, { name: 'max', x: 90, y: 2, text: `(90${DEG}, 2)` });
    mark(p, id, { name: 'min', x: 270, y: -2, text: `(270${DEG}, -2)` });
    return finish(p, {
      id,
      title: 'The graph of y = 2 sin x is the graph of y = sin x stretched away from the x-axis, with highest value 2 and lowest value -2',
      desc: `Two wave curves from 0${DEG} to 360${DEG}. The solid curve, y equals sin x, rises to 1 and falls to -1. The dashed curve, y equals 2 sin x, has the same shape and crosses the x-axis at the same points, but it is twice as tall. Its highest point is the marked point (90${DEG}, 2) and its lowest point is the marked point (270${DEG}, -2).`,
    });
  },

  // ---- 6. a horizontal translation of the sine curve: y = sin(x - 60) ----
  'graph-transformations-sin-shift': () => {
    const id = 'graph-transformations-sin-shift';
    const p = sketch(id, { xmin: -40, xmax: 400, ymin: -1.8, ymax: 1.8, rows: 2 });
    keyRow(p, id, 0, 'curve', 'y = sin x');
    keyRow(p, id, 1, 'curve-b', `y = sin(x - 60${DEG})`);
    draw(p, id, [{ name: 'f', fn: sinD, ...SINE }, { name: 'moved', cls: 'curve-b', fn: sinRight, ...SINE }]);
    mark(p, id, { name: 'zero', x: 60, y: 0, text: `(60${DEG}, 0)` });
    mark(p, id, { name: 'max', x: 150, y: 1, text: `(150${DEG}, 1)` });
    return finish(p, {
      id,
      title: 'The graph of y = sin(x - 60 degrees) is the graph of y = sin x moved 60 degrees to the right',
      desc: `Two wave curves from 0${DEG} to 360${DEG}. The solid curve is y equals sin x, which has its highest point at 90${DEG}. The dashed curve is y equals sin of (x minus 60${DEG}). It is the solid curve moved 60${DEG} to the right. It crosses the x-axis going upwards at the marked point (60${DEG}, 0) and has its highest point at the marked point (150${DEG}, 1).`,
    });
  },

  // ---- 6. a horizontal stretch of the sine curve: y = sin 2x ----
  'graph-transformations-sin-period': () => {
    const id = 'graph-transformations-sin-period';
    const p = sketch(id, { xmin: -40, xmax: 400, ymin: -1.8, ymax: 1.8, rows: 2 });
    keyRow(p, id, 0, 'curve', 'y = sin x');
    keyRow(p, id, 1, 'curve-b', 'y = sin 2x');
    draw(p, id, [{ name: 'f', fn: sinD, ...SINE }, { name: 'moved', cls: 'curve-b', fn: sinDouble, ...SINE }]);
    mark(p, id, { name: 'max', x: 45, y: 1, text: `(45${DEG}, 1)` });
    mark(p, id, { name: 'min', x: 135, y: -1, text: `(135${DEG}, -1)` });
    return finish(p, {
      id,
      title: 'The graph of y = sin 2x is the graph of y = sin x squashed towards the y-axis, so it repeats every 180 degrees',
      desc: `Two wave curves from 0${DEG} to 360${DEG}. The solid curve, y equals sin x, has one wave. The dashed curve, y equals sin 2x, has the same height but is squashed towards the y-axis, so it has two waves in the same space. Its first highest point is the marked point (45${DEG}, 1) and its first lowest point is the marked point (135${DEG}, -1).`,
    });
  },

  // ---- 6. an exponential graph moved down: y = 2^x - 2 ----
  'graph-transformations-exp-shift': () => {
    const id = 'graph-transformations-exp-shift';
    const p = sketch(id, { xmin: -3.2, xmax: 3.4, ymin: -3, ymax: 6.5, rows: 2, height: 640 });
    keyRow(p, id, 0, 'curve', 'y = 2^x');
    keyRow(p, id, 1, 'curve-b', 'y = 2^x - 2');
    draw(p, id, [{ name: 'f', fn: exp2 }, { name: 'moved', cls: 'curve-b', fn: exp2Down }]);
    asymptote(p, id, { name: 'ha', y: -2, text: 'y = -2', at: [-3.1, -2] });
    mark(p, id, { name: 'yint0', x: 0, y: 1, text: '(0, 1)' });
    mark(p, id, { name: 'yint1', x: 0, y: -1, text: '(0, -1)' });
    mark(p, id, { name: 'xint', x: 1, y: 0, text: '(1, 0)' });
    return finish(p, {
      id,
      title: 'The graph of y = 2 to the power x - 2 is the graph of y = 2 to the power x moved down 2, with asymptote y = -2',
      desc: 'Two exponential curves that rise from left to right. The solid curve, y equals 2 to the power x, passes through the marked point (0, 1) and has the x-axis as its asymptote. The dashed curve, y equals 2 to the power x minus 2, is the same shape moved down 2. It passes through the marked points (0, -1) on the y-axis and (1, 0) on the x-axis. Its asymptote is a dashed line, labelled y = -2.',
    });
  },

  // ---- 6. an exponential graph reflected in the y-axis: y = 2^(-x) ----
  'graph-transformations-exp-mirror': () => {
    const id = 'graph-transformations-exp-mirror';
    const p = sketch(id, { xmin: -3.4, xmax: 3.4, ymin: -1.5, ymax: 9, rows: 2, height: 520 });
    keyRow(p, id, 0, 'curve', 'y = 2^x');
    keyRow(p, id, 1, 'curve-b', 'y = 2^(-x)');
    draw(p, id, [{ name: 'f', fn: exp2 }, { name: 'moved', cls: 'curve-b', fn: exp2Mirror }]);
    mark(p, id, { name: 'right', x: 2, y: 4, text: '(2, 4)' });
    mark(p, id, { name: 'left', x: -2, y: 4, text: '(-2, 4)' });
    mark(p, id, { name: 'yint', x: 0, y: 1, text: '(0, 1)' });
    return finish(p, {
      id,
      title: 'The graph of y = 2 to the power minus x is the graph of y = 2 to the power x reflected in the y-axis',
      desc: 'Two exponential curves that are mirror images of each other in the y-axis. The solid curve, y equals 2 to the power x, rises from left to right and passes through the marked point (2, 4). The dashed curve, y equals 2 to the power minus x, falls from left to right and passes through the marked point (-2, 4). Both curves pass through the marked point (0, 1) on the y-axis, and both have the x-axis as their asymptote.',
    });
  },

  // ---- 7. flip it, backwards: from the asymptotes and a point to the equation ----
  'graph-transformations-flip-recip': () => {
    const id = 'graph-transformations-flip-recip';
    const p = sketch(id, { xmin: -4.5, xmax: 4.5, ymin: -3, ymax: 9, rows: 1, height: 520 });
    keyRow(p, id, 0, 'curve', 'y = a/(x + b) + c');
    draw(p, id, [{ name: 'curve', fn: recipFind }]);
    asymptote(p, id, { name: 'va', x: -1, text: 'x = -1', at: [-1, -2.2] });
    asymptote(p, id, { name: 'ha', y: 2, text: 'y = 2', at: [4.4, 2] });
    mark(p, id, { name: 'p', x: 0, y: 5, text: '(0, 5)' });
    return finish(p, {
      id,
      title: 'A reciprocal curve with asymptotes x = -1 and y = 2 that passes through (0, 5)',
      desc: 'A reciprocal curve in two branches. Its asymptotes are two dashed lines, labelled x = -1 and y = 2. One branch is in the top right of the point where the asymptotes cross and passes through the marked point (0, 5) on the y-axis. The other branch is in the bottom left. Its equation has the form y equals a over (x plus b), plus c.',
    });
  },

  // ---- question figures: the picture shows the facts, never the answer ----
  'graph-transformations-q-parab': () => {
    const id = 'graph-transformations-q-parab';
    const p = sketch(id, { xmin: -2, xmax: 6, ymin: -5, ymax: 8, rows: 1, height: 500 });
    draw(p, id, [{ name: 'curve', fn: qParab }]);
    mark(p, id, { name: 'vertex', x: 2, y: -3, text: '(2, -3)' });
    mark(p, id, { name: 'yint', x: 0, y: 1, text: '(0, 1)' });
    return finish(p, {
      id,
      title: 'A U-shaped curve with two marked points',
      desc: 'A U-shaped curve with a vertical line of symmetry. Its lowest point is the marked point (2, -3), which is below the x-axis. The curve rises on both sides, crosses the x-axis twice, and passes through the marked point (0, 1) on the y-axis. It has the same shape as the graph of y equals x squared.',
    });
  },

  'graph-transformations-q-recip': () => {
    const id = 'graph-transformations-q-recip';
    const p = sketch(id, { xmin: -3.5, xmax: 8.5, ymin: -7, ymax: 7, rows: 1, height: 540 });
    draw(p, id, [{ name: 'curve', fn: qRecip }]);
    asymptote(p, id, { name: 'va', x: 2, text: 'x = 2', at: [2, 5.6] });
    asymptote(p, id, { name: 'ha', y: -1, text: 'y = -1', at: [8.4, -1] });
    mark(p, id, { name: 'p', x: 0, y: -5, text: '(0, -5)' });
    return finish(p, {
      id,
      title: 'A reciprocal curve with two dashed asymptotes and one marked point',
      desc: 'A reciprocal curve in two branches. Its asymptotes are two dashed lines, labelled x = 2 and y = -1. One branch is in the top right of the point where the asymptotes cross. The other branch is in the bottom left and passes through the marked point (0, -5) on the y-axis.',
    });
  },

  'graph-transformations-q-trig': () => {
    const id = 'graph-transformations-q-trig';
    const p = sketch(id, { xmin: -40, xmax: 400, ymin: -1, ymax: 7, rows: 1, height: 480 });
    draw(p, id, [{ name: 'curve', fn: qTrig, ...SINE }]);
    mark(p, id, { name: 'max', x: 90, y: 5, text: `(90${DEG}, 5)` });
    mark(p, id, { name: 'min', x: 270, y: 1, text: `(270${DEG}, 1)` });
    return finish(p, {
      id,
      title: 'A wave curve with its highest and lowest points marked',
      desc: `A wave curve from 0${DEG} to 360${DEG}, always above the x-axis. It starts at the middle of its wave, rises to its highest point, the marked point (90${DEG}, 5), falls back through its middle and reaches its lowest point, the marked point (270${DEG}, 1). It has the shape of a sine wave.`,
    });
  },
};

