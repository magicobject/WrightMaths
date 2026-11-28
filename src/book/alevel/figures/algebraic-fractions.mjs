// Figures for the Algebraic fractions and partial fractions topic page (src/pages/courses/a-level/algebraic-fractions.html).
//
// Every curve is drawn FROM the function listed for it in CURVES, and every marked point and guide line is drawn from the
// numbers listed in ITEMS, so a picture cannot disagree with its equation. Each picture is a sketch: no grid and no scale
// numbers. What matters is marked on the picture itself. The equation of each curve sits in a key above the graph, so no
// label sits on a curve. A vertical dashed line is an asymptote, and the equation of each one is written beside it.
//
// A picture of this topic has three kinds of marking:
//   point   a filled dot with its coordinates beside it;
//   hole    an open circle: a point the curve would pass through if the fraction were defined there;
//   vline   a vertical dashed line, drawn at x = (a value that makes the bottom of the fraction 0), with its equation.
//
// test/alevel-algebraic-fractions.spec.ts reads GEOM, CURVES and ITEMS to check each curve, each marked point and each guide
// line against the page's own numbers, and checks that every label is nearest its own item.
import { plane, label } from '../figure-lib.mjs';

/** The size and range of each picture, kept so a test can turn a pixel back into graph coordinates. */
export const GEOM = {};
/** The curves of each picture in the order they are drawn: { name, cls, fn, from, to }. */
export const CURVES = {};
/** What is marked on each picture: { name, kind: 'point' | 'hole', x, y } or { name, kind: 'vline', x }. */
export const ITEMS = {};

const W = 600; // a narrow picture, so the labels are drawn large when it is scaled down to a phone
const LEFT = 64;
const RIGHT = 48;
const BOTTOM = 52;
const ROW = 46; // the height of one row of the key above the graph
const SAMPLES = 6000; // how finely the placement (and the test) walk along each curve
const CHAR = 14; // the width allowed for one character of a label (the test allows 13, so there is a margin)
const f2 = (n) => (Math.round(n * 100) / 100).toString();

/** What each picture still has to place: its marked points, its guide-line labels, and the boxes already taken. */
const PENDING = {};

/** A plane with no grid and no scale numbers, and a key above it of `rows` lines. */
function sketch(id, { xmin, xmax, ymin, ymax, rows = 2, height = 520 }) {
  const top = 64 + ROW * (rows - 1) + 46;
  GEOM[id] = { width: W, height, left: LEFT, right: RIGHT, top, bottom: BOTTOM, xmin, xmax, ymin, ymax };
  CURVES[id] = [];
  ITEMS[id] = [];
  PENDING[id] = { points: [], vlines: [], taken: [] };
  return plane({ grid: false, ticks: false, tickLabels: false, width: W, height, top, xmin, xmax, ymin, ymax });
}

/** A key row: a sample of how a curve is drawn, then what it is. */
function keyRow(p, id, row, cls, text) {
  const y = 40 + ROW * row;
  // an open circle is drawn as a circle, as it is on the graph; a curve or a line is drawn as a short stroke
  if (cls === 'open') p.raw(`<circle class="pt-open" cx="${LEFT + 28}" cy="${y - 8}" r="9"/>`);
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
    CURVES[id].push({ name: c.name, cls: c.cls ?? 'curve', fn: c.fn, from, to });
    p.curve(c.fn, { cls: c.cls ?? 'curve', from, to });
  }
}

/** A marked point (a filled dot) or a hole (an open circle). Its label is placed by finish(), at the nearest clear spot. */
function mark(p, id, { name, x, y, text, hole = false }) {
  ITEMS[id].push({ name, kind: hole ? 'hole' : 'point', x, y });
  PENDING[id].points.push({ name, x, y, text, hole });
}

/** A vertical dashed line (an asymptote) at x, with its equation written beside it, near height `at`. */
function vlevel(p, id, { name, x, text, at }) {
  ITEMS[id].push({ name, kind: 'vline', x });
  p.vline(x);
  PENDING[id].vlines.push({ name, x, text, at });
}

/**
 * Place every label. A label is a box (14px a character, 34px tall) that must: stay inside the picture; keep clear of
 * every curve, guide line, key line and other label; stay off every marker; and sit nearer its own item than any other.
 * Candidates are tried from the closest to the item outwards, so each label lands as near its item as the picture allows.
 */
function place(p, id) {
  const g = GEOM[id];
  const { points, vlines, taken } = PENDING[id];
  const px = (x) => p.X(x);
  const py = (y) => p.Y(y);
  // the drawn curves as pixel points, as the test samples them
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
  // the axes and the guide lines are thin boxes that no label may touch
  taken.push({ x0: px(g.xmin), x1: px(g.xmax) + 12, y0: py(0) - 3, y1: py(0) + 3 });
  taken.push({ x0: px(0) - 3, x1: px(0) + 3, y0: py(g.ymax) - 12, y1: py(g.ymin) });
  for (const v of vlines) taken.push({ owner: v.name, x0: px(v.x) - 3, x1: px(v.x) + 3, y0: py(g.ymax), y1: py(g.ymin) });
  // the two axis letters
  taken.push({ x0: px(g.xmax) + 8, x1: px(g.xmax) + 40, y0: py(0) - 20, y1: py(0) + 20 });
  taken.push({ x0: px(0) - 16, x1: px(0) + 16, y0: py(g.ymax) - 50, y1: py(g.ymax) - 6 });
  const circles = points.map((q) => ({ name: q.name, cx: px(q.x), cy: py(q.y), hole: q.hole }));
  const items = [
    ...circles.map((c) => ({ name: c.name, at: (qx, qy) => Math.hypot(qx - c.cx, qy - c.cy), point: true })),
    ...vlines.map((v) => ({ name: v.name, at: (qx) => Math.abs(qx - px(v.x)), point: false })),
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
  for (const v of vlines) {
    const cands = [];
    for (const [anchor, dx] of [['start', 10], ['end', -10]]) {
      for (let y = py(g.ymax) + 30; y < py(g.ymin) - 6; y += 12) cands.push({ anchor, x: px(v.x) + dx, y, cost: Math.abs(y - py(v.at)) + (anchor === 'end' ? 4 : 0) });
    }
    cands.sort((a, b) => a.cost - b.cost);
    put(items.find((i) => i.name === v.name), v.text, cands, false, ' alt');
  }
  for (const c of circles) p.raw(c.hole ? `<circle class="pt-open" data-name="${c.name}" cx="${f2(c.cx)}" cy="${f2(c.cy)}" r="9"/>` : `<circle class="pt" data-name="${c.name}" cx="${f2(c.cx)}" cy="${f2(c.cy)}" r="7"/>`);
  for (const t of out) p.raw(t);
}

/** Labels get a halo in the page colour, so a label that crosses an axis or a guide stays readable. */
const finish = (p, meta) => {
  place(p, meta.id);
  return p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');
};

// ---- the functions each picture is drawn from (the test holds its own copy of these) ----
const holeLine = (x) => (x * x - 4) / (x - 2); // the line y = x + 2, with no value at x = 2
const holeQ = (x) => (x * x - 1) / (x + 1); // the line y = x - 1, with no value at x = -1
const two = (x) => (5 * x + 1) / ((x - 1) * (x + 2));
const three = (x) => (12 * x - 6) / ((x + 4) * (x + 1) * (x - 2));
const repeated = (x) => (9 * x + 9) / ((x - 1) * (x + 2) ** 2);

export const FIGURES = {
  // ---- 1. a fraction that simplifies to a line, with a gap where the bottom is 0 ----
  'algebraic-fractions-hole': () => {
    const id = 'algebraic-fractions-hole';
    const p = sketch(id, { xmin: -5, xmax: 5, ymin: -4, ymax: 8, rows: 2, height: 560 });
    keyRow(p, id, 0, 'curve', 'y = (x^2 - 4)/(x - 2)');
    keyRow(p, id, 1, 'open', 'open circle: not on the graph');
    draw(p, id, [{ name: 'f', fn: holeLine }]);
    mark(p, id, { name: 'gap', x: 2, y: 4, text: '(2, 4)', hole: true });
    return finish(p, {
      id,
      title: 'The graph of y = (x squared minus 4) over (x minus 2): a straight line with one point missing',
      desc: 'A straight line that slopes up to the right, the line y = x + 2. It has an open circle at the point (2, 4). The open circle means the point is not on the graph: when x = 2 the bottom of the fraction is 0, so the fraction has no value there. At every other value of x the graph is the line y = x + 2.',
    });
  },

  // ---- 2. a question figure: an open circle on a line (the answer is what the circle means) ----
  'algebraic-fractions-q-hole': () => {
    const id = 'algebraic-fractions-q-hole';
    const p = sketch(id, { xmin: -5, xmax: 5, ymin: -6, ymax: 5, rows: 1, height: 500 });
    keyRow(p, id, 0, 'curve', 'y = (x^2 - 1)/(x + 1)');
    draw(p, id, [{ name: 'f', fn: holeQ }]);
    mark(p, id, { name: 'gap', x: -1, y: -2, text: '(-1, -2)', hole: true });
    return finish(p, {
      id,
      title: 'The graph of y = (x squared minus 1) over (x plus 1), with an open circle on it',
      desc: 'A straight line that slopes up to the right. It has one open circle on it, at the point (-1, -2).',
    });
  },

  // ---- 3. two distinct linear factors: two vertical asymptotes ----
  'algebraic-fractions-two': () => {
    const id = 'algebraic-fractions-two';
    const p = sketch(id, { xmin: -5, xmax: 4, ymin: -6, ymax: 6, rows: 2, height: 560 });
    keyRow(p, id, 0, 'curve', 'y = (5x + 1)/((x - 1)(x + 2))');
    keyRow(p, id, 1, 'guide', 'dashed lines: asymptotes');
    draw(p, id, [{ name: 'f', fn: two }]);
    vlevel(p, id, { name: 'a1', x: -2, text: 'x = -2', at: 5 });
    vlevel(p, id, { name: 'a2', x: 1, text: 'x = 1', at: 5 });
    return finish(p, {
      id,
      title: 'The graph of y = (5x + 1) over (x minus 1)(x + 2), with its two vertical asymptotes',
      desc: 'A curve in three separate pieces. Two dashed vertical lines, the asymptotes x = -2 and x = 1, divide the picture into three parts. Each piece of the curve runs up or down beside an asymptote and never touches it. The asymptotes are at the two values of x that make the bottom of the fraction 0.',
    });
  },

  // ---- 4. three distinct linear factors: three vertical asymptotes ----
  'algebraic-fractions-three': () => {
    const id = 'algebraic-fractions-three';
    const p = sketch(id, { xmin: -7, xmax: 6, ymin: -6, ymax: 6, rows: 2, height: 560 });
    keyRow(p, id, 0, 'curve', 'y = (12x - 6)/((x + 4)(x + 1)(x - 2))');
    keyRow(p, id, 1, 'guide', 'dashed lines: asymptotes');
    draw(p, id, [{ name: 'f', fn: three }]);
    vlevel(p, id, { name: 'a1', x: -4, text: 'x = -4', at: 0 });
    vlevel(p, id, { name: 'a2', x: -1, text: 'x = -1', at: 0 });
    vlevel(p, id, { name: 'a3', x: 2, text: 'x = 2', at: 0 });
    return finish(p, {
      id,
      title: 'The graph of y = (12x - 6) over (x + 4)(x + 1)(x minus 2), with its three vertical asymptotes',
      desc: 'A curve in four separate pieces. Three dashed vertical lines, the asymptotes x = -4, x = -1 and x = 2, divide the picture into four parts. The curve runs up or down beside each asymptote and never touches it. The asymptotes are at the three values of x that make the bottom of the fraction 0.',
    });
  },

  // ---- 5. a repeated factor: the curve goes the same way on both sides of x = -2 ----
  'algebraic-fractions-repeated': () => {
    const id = 'algebraic-fractions-repeated';
    const p = sketch(id, { xmin: -6, xmax: 4, ymin: -8, ymax: 8, rows: 2, height: 580 });
    keyRow(p, id, 0, 'curve', 'y = (9x + 9)/((x - 1)(x + 2)^2)');
    keyRow(p, id, 1, 'guide', 'dashed lines: asymptotes');
    draw(p, id, [{ name: 'f', fn: repeated }]);
    vlevel(p, id, { name: 'a1', x: -2, text: 'x = -2', at: -6 });
    vlevel(p, id, { name: 'a2', x: 1, text: 'x = 1', at: 6 });
    return finish(p, {
      id,
      title: 'The graph of y = (9x + 9) over (x minus 1)(x + 2) squared, with its two vertical asymptotes',
      desc: 'A curve in three separate pieces, beside the dashed vertical asymptotes x = -2 and x = 1. At x = -2, where the factor is squared, the curve goes up on both sides of the asymptote. At x = 1, where the factor is not squared, the curve goes down on the left of the asymptote and up on the right.',
    });
  },
};
