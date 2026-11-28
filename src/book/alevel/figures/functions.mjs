// Figures for the Functions topic page (src/pages/courses/a-level/functions.html).
//
// Three kinds of picture:
//   - mapping diagrams (two columns of numbers joined by arrows), drawn FROM the function that sends each input to its outputs;
//   - one function-machine chain (an input, two boxes and the values between them), drawn from the two functions;
//   - graphs, drawn from the function listed for each curve, with the same automatic label placement as the Transformations page.
// A graph that shows a reflection in the line y = x is drawn with equal scales on both axes, so the mirror looks like a mirror.
//
// test/alevel-functions.spec.ts reads GEOM, CURVES, ITEMS, MAPS and CHAIN to check each arrow, curve, marked point and asymptote
// against the page's own numbers, and checks that every label is nearest its own item.
import { plane, label } from '../figure-lib.mjs';

/** The size and range of each graph, kept so a test can turn a pixel back into graph coordinates. */
export const GEOM = {};
/** The curves of each graph in the order they are drawn: { name, cls, fn, from, to }. */
export const CURVES = {};
/** What is marked on each graph: { name, kind: 'point', x, y } or { name, kind: 'vline', x } or { name, kind: 'hline', y }. */
export const ITEMS = {};
/** Each mapping diagram: the inputs, the outputs and the arrows drawn between them. */
export const MAPS = {};
/** The function-machine chain: the input, the two functions and the values written under the chain. */
export const CHAIN = {};

const W = 600; // a narrow picture, so the labels are drawn large when it is scaled down to a phone
const LEFT = 64;
const RIGHT = 48;
const BOTTOM = 52;
const ROW = 56; // the height of one row of the key above the graph

/** A plane with no grid and no scale numbers, and a key above it of `rows` lines. `equal` gives both axes the same scale. */
function sketch(id, { xmin, xmax, ymin, ymax, rows = 2, height = 520, ylabel = 'y', xlabel = 'x', equal = false }) {
  const top = 64 + ROW * (rows - 1) + 46;
  const h = equal ? Math.round(top + BOTTOM + ((W - LEFT - RIGHT) * (ymax - ymin)) / (xmax - xmin)) : height;
  GEOM[id] = { width: W, height: h, left: LEFT, right: RIGHT, top, bottom: BOTTOM, xmin, xmax, ymin, ymax };
  CURVES[id] = [];
  ITEMS[id] = [];
  PENDING[id] = { points: [], lines: [], taken: [] };
  return plane({ grid: false, ticks: false, tickLabels: false, width: W, height: h, top, xmin, xmax, ymin, ymax, xlabel, ylabel });
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

/** An asymptote or other guide line: a dashed line across the picture. Its equation is written beside it, near `at` (graph units). */
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
  // the axes and the guide lines are thin boxes that no label may touch
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
const HALO = '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t';
const finish = (p, meta) => {
  place(p, meta.id);
  return p.svg(meta).replaceAll('<text class="svg-t', HALO);
};

// ---- the functions each picture is drawn from (the test holds its own copy of these) ----
const sq = (x) => x ** 2;
const sqrtShift = (x) => Math.sqrt(x - 1);
const recipShift = (x) => 1 / (x - 2);
const quadRestricted = (x) => x ** 2 - 4 * x + 5;
const lineF = (x) => 2 * x - 1;
const lineInv = (x) => (x + 1) / 2;
const identity = (x) => x;
const sqrtF = (x) => Math.sqrt(x);
const expF = (x) => Math.exp(x);
const lnF = (x) => Math.log(x);
const cubeUp = (x) => x ** 3 + 4;
const gBowl = (x) => (x - 1) ** 2 - 2;
const carFirst = (t) => 15000 * Math.exp(-0.2 * t);
const carRefined = (t) => 2000 + 13000 * Math.exp(-0.2 * t);

// ---- mapping diagrams ----
const ROWGAP = 56;
/** Two columns of numbers joined by arrows. `arrows` is a list of [input, output]. */
function mapping(id, { left, right, arrows, title, desc, align = false }) {
  const n = Math.max(left.length, right.length);
  const top = 112;
  const height = top + (n - 1) * ROWGAP + 56;
  const mid = top + ((n - 1) * ROWGAP) / 2;
  const yRow = (list, v) => mid + (list.indexOf(v) - (list.length - 1) / 2) * ROWGAP;
  // with `align`, each input sits level with the middle of its own outputs, so the arrows fan out without crossing
  const yLeft = (v) => (align ? arrows.filter(([a]) => a === v).reduce((t, [, b], _i, all) => t + yRow(right, b) / all.length, 0) : yRow(left, v));
  const yOf = (list, v) => (list === left ? yLeft(v) : yRow(list, v));
  const LX = 150;
  const RX = 450;
  MAPS[id] = { left, right, arrows, width: W, height, leftX: LX, rightX: RX, yOf: { left: (v) => yOf(left, v), right: (v) => yOf(right, v) } };
  let s = '';
  s += `<ellipse class="axis" cx="${LX}" cy="${f2(mid)}" rx="72" ry="${f2(((n - 1) * ROWGAP) / 2 + 44)}" style="fill:none;stroke-width:2.5"/>`;
  s += `<ellipse class="axis" cx="${RX}" cy="${f2(mid)}" rx="72" ry="${f2(((n - 1) * ROWGAP) / 2 + 44)}" style="fill:none;stroke-width:2.5"/>`;
  s += `<text class="svg-t alt" data-role="head" x="${LX}" y="40" text-anchor="middle">Input</text>`;
  s += `<text class="svg-t alt" data-role="head" x="${RX}" y="40" text-anchor="middle">Output</text>`;
  for (const [a, b] of arrows) {
    const y1 = yOf(left, a);
    const y2 = yOf(right, b);
    const x1 = LX + 36;
    const x2 = RX - 44;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const hx = x2 + 8 * Math.cos(ang);
    const hy = y2 + 8 * Math.sin(ang);
    const tip = [hx, hy];
    const back = [x2 - 8 * Math.cos(ang), y2 - 8 * Math.sin(ang)];
    const a1 = [back[0] + 7 * Math.sin(ang), back[1] - 7 * Math.cos(ang)];
    const a2 = [back[0] - 7 * Math.sin(ang), back[1] + 7 * Math.cos(ang)];
    s += `<line class="curve" data-from="${a}" data-to="${b}" x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" style="stroke-width:3.5"/>`;
    s += `<polygon class="arrowhead" points="${f2(tip[0])},${f2(tip[1])} ${f2(a1[0])},${f2(a1[1])} ${f2(a2[0])},${f2(a2[1])}"/>`;
  }
  for (const v of left) s += `<text class="svg-t" data-side="L" data-value="${v}" x="${LX}" y="${f2(yOf(left, v) + 8)}" text-anchor="middle">${label(String(v))}</text>`;
  for (const v of right) s += `<text class="svg-t" data-side="R" data-value="${v}" x="${RX}" y="${f2(yOf(right, v) + 8)}" text-anchor="middle">${label(String(v))}</text>`;
  const esc = (t) => t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<svg class="graph-svg" viewBox="0 0 ${W} ${height}" role="img" aria-labelledby="${id}-t ${id}-d" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>${s.replaceAll('<text class="svg-t', HALO)}</svg>`;
}

// ---- the function machine chain: an input goes through g, then through f ----
const chainG = (x) => 3 * x - 1;
const chainF = (x) => x * x;
function chain(id, { input, title, desc }) {
  const mid = chainG(input);
  const out = chainF(mid);
  CHAIN[id] = { input, mid, out, first: { name: 'g', rule: '3x - 1' }, second: { name: 'f', rule: 'x^2' } };
  const esc = (t) => t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const y = 100;
  let s = '';
  const arrow = (x1, x2) => `<line class="axis" x1="${x1}" y1="${y}" x2="${x2 - 8}" y2="${y}"/><polygon class="arrowhead" points="${x2},${y} ${x2 - 12},${y - 7} ${x2 - 12},${y + 7}"/>`;
  const box = (x, name, rule) => `<rect x="${x}" y="${y - 40}" width="150" height="80" rx="10" style="fill:var(--paper);stroke:var(--ink);stroke-width:3"/><text class="svg-t alt" data-role="box" data-name="${name}" x="${x + 75}" y="${y + 8}" text-anchor="middle">${label(`${name}: ${rule}`)}</text>`;
  s += `<text class="svg-t" data-role="value" data-at="input" x="34" y="${y + 8}" text-anchor="middle">${label(String(input))}</text>`;
  s += arrow(60, 100);
  s += box(100, 'g', chainCode.g);
  s += arrow(250, 290);
  s += `<text class="svg-t" data-role="value" data-at="mid" x="318" y="${y + 8}" text-anchor="middle">${label(String(mid))}</text>`;
  s += arrow(346, 386);
  s += box(386, 'f', chainCode.f);
  s += arrow(536, 560);
  s += `<text class="svg-t" data-role="value" data-at="out" x="576" y="${y + 8}" text-anchor="start">${label(String(out))}</text>`;
  s += `<text class="svg-t alt" data-role="caption" x="34" y="${y + 80}" text-anchor="start">input</text>`;
  s += `<text class="svg-t alt" data-role="caption" x="318" y="${y + 80}" text-anchor="middle">g(${input})</text>`;
  s += `<text class="svg-t alt" data-role="caption" x="${W - 8}" y="${y + 80}" text-anchor="end">fg(${input})</text>`;
  return `<svg class="graph-svg" viewBox="0 0 ${W + 40} 220" role="img" aria-labelledby="${id}-t ${id}-d" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>${s.replaceAll('<text class="svg-t', HALO)}</svg>`;
}
const chainCode = { g: '3x - 1', f: 'x^2' };

export const FIGURES = {
  // ---- 1. a many-to-one function: x goes to x squared ----
  'functions-map-many-one': () => mapping('functions-map-many-one', {
    left: [-2, -1, 1, 2],
    right: [1, 4],
    arrows: [-2, -1, 1, 2].map((x) => [x, sq(x)]),
    title: 'A mapping diagram for squaring: the inputs -2, -1, 1 and 2 go to the outputs 4, 1, 1 and 4',
    desc: 'Two columns of numbers with arrows between them. The input column holds -2, -1, 1 and 2. The output column holds 1 and 4. Each input has exactly one arrow leaving it. The inputs -1 and 1 both go to 1, and the inputs -2 and 2 both go to 4, so two arrows arrive at each output.',
  }),

  // ---- 1. a mapping that is not a function: one input, two outputs ----
  'functions-map-one-many': () => mapping('functions-map-one-many', {
    left: [1, 4, 9],
    right: [1, -1, 2, -2, 3, -3],
    align: true,
    arrows: [1, 4, 9].flatMap((x) => [[x, Math.sqrt(x)], [x, -Math.sqrt(x)]]),
    title: 'A mapping diagram where each input has two outputs: 1 goes to 1 and -1, 4 goes to 2 and -2, 9 goes to 3 and -3',
    desc: 'Two columns of numbers with arrows between them. The input column holds 1, 4 and 9. The output column holds 1, -1, 2, -2, 3 and -3, in that order from the top. Each input has two arrows leaving it: the input 1 goes to 1 and to -1, the input 4 goes to 2 and to -2, and the input 9 goes to 3 and to -3. Every output has one arrow arriving.',
  }),

  // ---- 2. the largest domain of sqrt(x - 1) ----
  'functions-domain-sqrt': () => {
    const id = 'functions-domain-sqrt';
    const p = sketch(id, { xmin: -1.5, xmax: 8, ymin: -1.5, ymax: 3.5, rows: 1, height: 460 });
    keyRow(p, id, 0, 'curve', 'y = f(x) = \u221a(x - 1)');
    draw(p, id, [{ name: 'f', fn: sqrtShift, from: 1, to: 8 }]);
    mark(p, id, { name: 'start', x: 1, y: 0, text: '(1, 0)' });
    mark(p, id, { name: 'p', x: 5, y: 2, text: '(5, 2)' });
    return finish(p, {
      id,
      title: 'The graph of y = the square root of (x - 1) starts at the point (1, 0) and rises to the right',
      desc: 'A curve that starts at the marked point (1, 0) on the x-axis and rises to the right, getting less steep. It passes through the marked point (5, 2). There is no curve to the left of x = 1, so no point of the graph has an x-coordinate below 1, and no point is below the x-axis.',
    });
  },

  // ---- 2. the largest domain of 1/(x - 2) ----
  'functions-domain-recip': () => {
    const id = 'functions-domain-recip';
    const p = sketch(id, { xmin: -3, xmax: 7, ymin: -4, ymax: 4, rows: 1, height: 480 });
    keyRow(p, id, 0, 'curve', 'y = f(x) = 1/(x - 2)');
    draw(p, id, [{ name: 'f', fn: recipShift }]);
    asymptote(p, id, { name: 'va', x: 2, text: 'x = 2', at: [2, -3.4] });
    mark(p, id, { name: 'a', x: 3, y: 1, text: '(3, 1)' });
    mark(p, id, { name: 'b', x: 1, y: -1, text: '(1, -1)' });
    return finish(p, {
      id,
      title: 'The graph of y = 1/(x - 2) has two branches either side of the dashed line x = 2',
      desc: 'A reciprocal curve in two branches. A dashed vertical line, labelled x = 2, is an asymptote: the curve gets close to it but never meets it, so the graph has no point with x = 2. The right-hand branch is above the x-axis and passes through the marked point (3, 1). The left-hand branch is below the x-axis and passes through the marked point (1, -1). Both branches get close to the x-axis but never meet it.',
    });
  },

  // ---- 2. the range of a quadratic on a restricted domain ----
  'functions-range-quad': () => {
    const id = 'functions-range-quad';
    const p = sketch(id, { xmin: -1, xmax: 4.5, ymin: -1, ymax: 7, rows: 1, height: 480 });
    keyRow(p, id, 0, 'curve', 'y = f(x) = x^2 - 4x + 5, 0 \u2264 x \u2264 3');
    draw(p, id, [{ name: 'f', fn: quadRestricted, from: 0, to: 3 }]);
    mark(p, id, { name: 'left', x: 0, y: 5, text: '(0, 5)' });
    mark(p, id, { name: 'low', x: 2, y: 1, text: '(2, 1)' });
    mark(p, id, { name: 'right', x: 3, y: 2, text: '(3, 2)' });
    return finish(p, {
      id,
      title: 'The graph of y = x squared - 4x + 5 for x from 0 to 3, with its end points and its lowest point marked',
      desc: 'A U-shaped curve drawn only for x from 0 to 3. It starts at the marked point (0, 5) on the y-axis, falls to its lowest point, the marked point (2, 1), then rises to end at the marked point (3, 2). The curve is not drawn to the left of the y-axis or to the right of x = 3. The lowest point is not at either end.',
    });
  },

  // ---- 3. a composite function: do g first, then f ----
  'functions-chain': () => chain('functions-chain', {
    input: 2,
    title: 'Two function boxes in a row: 2 goes into g, which gives 5, and 5 goes into f, which gives 25',
    desc: 'A chain from left to right. The input 2 goes into the box g, where g of x is 3x minus 1, and comes out as 5. The 5 goes into the box f, where f of x is x squared, and comes out as 25. Under the chain are the words input, g(2) and fg(2). The first box the input meets is g.',
  }),

  // ---- 4. why a many-to-one function has no inverse ----
  'functions-not-one-one': () => {
    const id = 'functions-not-one-one';
    const p = sketch(id, { xmin: -3.5, xmax: 3.5, ymin: -1.5, ymax: 9, rows: 1, height: 500 });
    keyRow(p, id, 0, 'curve', 'y = f(x) = x^2');
    draw(p, id, [{ name: 'f', fn: sq }]);
    asymptote(p, id, { name: 'line', y: 4, text: 'y = 4', at: [-3.4, 4] });
    mark(p, id, { name: 'left', x: -2, y: 4, text: '(-2, 4)' });
    mark(p, id, { name: 'right', x: 2, y: 4, text: '(2, 4)' });
    return finish(p, {
      id,
      title: 'The graph of y = x squared with the horizontal line y = 4, which meets the curve at (-2, 4) and (2, 4)',
      desc: 'A U-shaped curve with the y-axis as its line of symmetry. A dashed horizontal line, labelled y = 4, crosses the curve twice, at the marked points (-2, 4) and (2, 4). The output 4 therefore comes from two different inputs. A horizontal line at height 4 meets the curve in more than one point.',
    });
  },

  // ---- 5. the inverse of a straight line: reflection in y = x ----
  'functions-inverse-line': () => {
    const id = 'functions-inverse-line';
    const p = sketch(id, { xmin: -3, xmax: 4, ymin: -3, ymax: 4, rows: 3, equal: true });
    keyRow(p, id, 0, 'curve', 'y = f(x) = 2x - 1');
    keyRow(p, id, 1, 'curve-b', 'y = f^(-1)(x) = (x + 1)/2');
    keyRow(p, id, 2, 'curve-c', 'y = x');
    draw(p, id, [{ name: 'f', fn: lineF }, { name: 'inv', cls: 'curve-b', fn: lineInv }, { name: 'mirror', cls: 'curve-c', fn: identity }]);
    mark(p, id, { name: 'onf', x: 0, y: -1, text: '(0, -1)' });
    mark(p, id, { name: 'oninv', x: -1, y: 0, text: '(-1, 0)' });
    mark(p, id, { name: 'meet', x: 1, y: 1, text: '(1, 1)' });
    return finish(p, {
      id,
      title: 'The graph of y = 2x - 1 and its inverse, which is its reflection in the line y = x',
      desc: 'Three straight lines on axes with the same scale. The solid line is y = 2x - 1 and passes through the marked point (0, -1). The dashed line is its inverse, y = (x + 1)/2, and passes through the marked point (-1, 0). The dotted line is y = x. The solid and dashed lines are mirror images in the dotted line, and all three lines cross at the marked point (1, 1).',
    });
  },

  // ---- 5. the inverse of x squared for x >= 0 ----
  'functions-inverse-sq': () => {
    const id = 'functions-inverse-sq';
    const p = sketch(id, { xmin: -1, xmax: 5.5, ymin: -1, ymax: 5.5, rows: 3, equal: true });
    keyRow(p, id, 0, 'curve', 'y = f(x) = x^2, x \u2265 0');
    keyRow(p, id, 1, 'curve-b', 'y = f^(-1)(x) = \u221ax');
    keyRow(p, id, 2, 'curve-c', 'y = x');
    draw(p, id, [{ name: 'f', fn: sq, from: 0, to: 5.5 }, { name: 'inv', cls: 'curve-b', fn: sqrtF, from: 0, to: 5.5 }, { name: 'mirror', cls: 'curve-c', fn: identity }]);
    mark(p, id, { name: 'onf', x: 2, y: 4, text: '(2, 4)' });
    mark(p, id, { name: 'oninv', x: 4, y: 2, text: '(4, 2)' });
    return finish(p, {
      id,
      title: 'The graph of y = x squared for x at least 0 and its inverse, the square root, mirror images in the line y = x',
      desc: 'Two curves in the first quarter of the axes, which have the same scale, and a dotted line y = x between them. The solid curve is y = x squared for x at least 0, which rises steeply from the origin and passes through the marked point (2, 4). The dashed curve is its inverse, y equals the square root of x, which rises and flattens and passes through the marked point (4, 2). The two curves are mirror images in the dotted line.',
    });
  },

  // ---- 5. the inverse of e^x is ln x ----
  'functions-inverse-exp': () => {
    const id = 'functions-inverse-exp';
    const p = sketch(id, { xmin: -3, xmax: 4, ymin: -3, ymax: 4, rows: 3, equal: true });
    keyRow(p, id, 0, 'curve', 'y = f(x) = e^x');
    keyRow(p, id, 1, 'curve-b', 'y = f^(-1)(x) = ln x');
    keyRow(p, id, 2, 'curve-c', 'y = x');
    draw(p, id, [{ name: 'f', fn: expF }, { name: 'inv', cls: 'curve-b', fn: lnF, from: 0.0001, to: 4 }, { name: 'mirror', cls: 'curve-c', fn: identity }]);
    mark(p, id, { name: 'onf', x: 0, y: 1, text: '(0, 1)' });
    mark(p, id, { name: 'oninv', x: 1, y: 0, text: '(1, 0)' });
    return finish(p, {
      id,
      title: 'The graph of y = e to the power x and its inverse y = ln x, mirror images in the line y = x',
      desc: 'Two curves on axes with the same scale, and a dotted line y = x between them. The solid curve, y = e to the power x, is above the x-axis, rises to the right and passes through the marked point (0, 1) on the y-axis. The dashed curve, y = ln x, is to the right of the y-axis, rises to the right and passes through the marked point (1, 0) on the x-axis. The curves are mirror images in the dotted line. The x-axis is the asymptote of the first curve, and the y-axis is the asymptote of the second.',
    });
  },

  // ---- 6. a model and its refinement: the value of a car ----
  'functions-model-refine': () => {
    const id = 'functions-model-refine';
    const p = sketch(id, { xmin: -3, xmax: 22, ymin: -3000, ymax: 17500, rows: 2, height: 760, ylabel: 'V', xlabel: 't' });
    keyRow(p, id, 0, 'curve', 'V = 15000e^(-0.2t)');
    keyRow(p, id, 1, 'curve-b', 'V = 2000 + 13000e^(-0.2t)');
    draw(p, id, [{ name: 'first', fn: carFirst, from: 0, to: 22 }, { name: 'refined', cls: 'curve-b', fn: carRefined, from: 0, to: 22 }]);
    asymptote(p, id, { name: 'floor', y: 2000, text: 'V = 2000', at: [21, 2000] });
    mark(p, id, { name: 'start', x: 0, y: 15000, text: '(0, 15000)' });
    return finish(p, {
      id,
      title: 'The value of a car for t from 0 to 22 years: a model that falls towards 0, and a refined model that falls towards 2000',
      desc: 'Two curves that start at the same marked point (0, 15000) on the vertical axis and fall from left to right. The solid curve falls closer and closer to the horizontal axis. The dashed curve falls more slowly at the end, closer and closer to a dashed horizontal line labelled V = 2000, and never goes below it. The horizontal axis shows the time t and the vertical axis shows the value V.',
    });
  },

  // ---- question figures: the picture shows the facts, never the answer ----
  'functions-q-inverse': () => {
    const id = 'functions-q-inverse';
    const p = sketch(id, { xmin: -2.5, xmax: 2.5, ymin: -8, ymax: 12, rows: 1, height: 480 });
    draw(p, id, [{ name: 'f', fn: cubeUp }]);
    mark(p, id, { name: 'a', x: 0, y: 4, text: '(0, 4)' });
    mark(p, id, { name: 'b', x: 1, y: 5, text: '(1, 5)' });
    return finish(p, {
      id,
      title: 'A curve that rises from the bottom left to the top right, with two marked points',
      desc: 'A smooth curve that rises all the way from the bottom left to the top right, and never turns back. It meets the y-axis at the marked point (0, 4) and passes through the marked point (1, 5). Any horizontal line meets the curve exactly once. It crosses the x-axis to the left of the origin, at an unmarked point.',
    });
  },

  'functions-q-range': () => {
    const id = 'functions-q-range';
    const p = sketch(id, { xmin: -2, xmax: 4.5, ymin: -3.5, ymax: 4, rows: 1, height: 460 });
    draw(p, id, [{ name: 'g', fn: gBowl, from: -1, to: 3 }]);
    mark(p, id, { name: 'left', x: -1, y: 2, text: '(-1, 2)' });
    mark(p, id, { name: 'low', x: 1, y: -2, text: '(1, -2)' });
    mark(p, id, { name: 'right', x: 3, y: 2, text: '(3, 2)' });
    return finish(p, {
      id,
      title: 'A U-shaped curve with a left end, a lowest point and a right end marked',
      desc: 'A U-shaped curve drawn only between its two ends. It starts at the marked point (-1, 2), falls to its lowest point, the marked point (1, -2), and rises to end at the marked point (3, 2). There is no curve beyond either end.',
    });
  },
};
