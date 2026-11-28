// Figures for the Proof by contradiction topic page (src/pages/courses/a-level/proof-contradiction.html).
//
// Two pictures, each drawn FROM the numbers listed here, so a picture cannot disagree with the page:
//   1. a square of side 1 with its diagonal, which has length sqrt(2) (Pythagoras: 1 + 1 = 2);
//   2. a number line from 1.40 to 1.43 with 1.41, sqrt(2) and 1.42 marked on it.
// The other lessons are chains of written steps (a proof about primes, parity or fractions), which have no natural
// picture, so they have no figure.
//
// Every label is placed by place(): at the nearest spot that is inside the picture, clear of every line, every marked
// point and every other label, and nearer its own item than any other item.
// test/alevel-proof-contradiction.spec.ts reads GEOM and ITEMS to check each line, point and label against the page's numbers.
import { plane, label } from '../figure-lib.mjs';

const ROOT2 = String.fromCharCode(0x221a) + '2'; // kept out of the source so the file stays plain ASCII

/** The size and range of each picture, kept so a test can turn a pixel back into graph coordinates. */
export const GEOM = {};
/** What is marked on each picture: { name, kind: 'point', x, y, text } or { name, kind: 'seg', x1, y1, x2, y2, text } (text null: no label). */
export const ITEMS = {};

/** The decimal that the number-line picture marks for the square root of 2, written as the page writes it. */
export const SQRT2_SHOWN = '1.41421';

const W = 600; // a narrow picture, so the labels are drawn large when it is scaled down to a phone
const LEFT = 64;
const RIGHT = 48;
const TOP = 44;
const BOTTOM = 52;
const CHAR = 14; // the width allowed for one character of a label (the test allows 13, so there is a margin)
const f2 = (n) => (Math.round(n * 100) / 100).toString();

/** What each picture still has to place: its marked points and its labelled segments. */
const PENDING = {};

function start(id, { xmin, xmax, ymin, ymax, height }) {
  GEOM[id] = { width: W, height, left: LEFT, right: RIGHT, top: TOP, bottom: BOTTOM, xmin, xmax, ymin, ymax };
  ITEMS[id] = [];
  PENDING[id] = { points: [], segs: [] };
  return plane({ grid: false, ticks: false, tickLabels: false, axes: false, width: W, height, top: TOP, xmin, xmax, ymin, ymax });
}

/** A straight segment. `text` (or null) is the label placed beside it. */
function seg(p, id, { name, x1, y1, x2, y2, text = null, cls = 'line', outside = null }) {
  ITEMS[id].push({ name, kind: 'seg', x1, y1, x2, y2, text });
  p.line(x1, y1, x2, y2, { cls, clip: false });
  PENDING[id].segs.push({ name, x1, y1, x2, y2, text, outside });
}

/** A marked point with its label. */
function mark(p, id, { name, x, y, text }) {
  ITEMS[id].push({ name, kind: 'point', x, y, text });
  PENDING[id].points.push({ name, x, y, text });
}

/** The distance from the pixel (qx, qy) to the segment from (ax, ay) to (bx, by). */
function distToSeg(qx, qy, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((qx - ax) * dx + (qy - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(qx - (ax + t * dx), qy - (ay + t * dy));
}

function place(p, id) {
  const g = GEOM[id];
  const { points, segs } = PENDING[id];
  const px = (x) => p.X(x);
  const py = (y) => p.Y(y);
  // every drawn line, as pixel points, that a label must keep clear of
  const dots = [];
  for (const s of segs) for (let i = 0; i <= 120; i += 1) dots.push([px(s.x1 + ((s.x2 - s.x1) * i) / 120), py(s.y1 + ((s.y2 - s.y1) * i) / 120)]);
  const circles = points.map((q) => ({ name: q.name, cx: px(q.x), cy: py(q.y) }));
  const items = [
    ...circles.map((c) => ({ name: c.name, at: (qx, qy) => Math.hypot(qx - c.cx, qy - c.cy), point: true })),
    ...segs.map((s) => ({ name: s.name, at: (qx, qy) => distToSeg(qx, qy, px(s.x1), py(s.y1), px(s.x2), py(s.y2)), point: false })),
  ];
  const placed = [];
  const out = [];
  const boxOf = (text, x, y, anchor) => {
    const width = text.length * CHAR;
    const x0 = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
    return { x0, x1: x0 + width, y0: y - 26, y1: y + 8, cx: x0 + width / 2, cy: y - 8 };
  };
  const clear = (b, own) => {
    if (b.x0 < 4 || b.x1 > W - 4 || b.y0 < 4 || b.y1 > g.height - 4) return false;
    for (const [qx, qy] of dots) if (qx > b.x0 - 6 && qx < b.x1 + 6 && qy > b.y0 - 6 && qy < b.y1 + 6) return false;
    for (const t of placed) if (Math.max(t.x0 - b.x1, b.x0 - t.x1) < 10 && Math.max(t.y0 - b.y1, b.y0 - t.y1) < 10) return false;
    for (const c of circles) if (c.cx > b.x0 - 14 && c.cx < b.x1 + 14 && c.cy > b.y0 - 14 && c.cy < b.y1 + 14) return false; // a label never covers a marker
    const mine = own.at(b.cx, b.cy);
    // a point's label must look nearest its own point; a segment's label must look nearest its own segment
    for (const other of items) if (other !== own && (!own.point || other.point) && other.at(b.cx, b.cy) < mine + 2) return false;
    return true;
  };
  /** Candidate spots round the pixel (ax, ay), nearest first. */
  const around = (ax, ay, outside = null) => {
    const cands = [];
    const dys = [-16, -22, -30, -40, -52, -66, -82, -98, -114, 4, 10, 16, 22, 28, 34, 40, 46, 54, 64, 76, 90];
    for (const [anchor, dxs] of [['start', [16, 22, 30, 40, 52, 66, 84, 104]], ['end', [-16, -22, -30, -40, -52, -66, -84, -104]], ['middle', [0]]]) {
      for (const dx of dxs) for (const dy of dys) cands.push({ anchor, x: ax + dx, y: ay + dy, cost: Math.abs(dx) + Math.abs(dy - 10) * 0.8 + (outside === 'left' && anchor !== 'end' ? 400 : 0) + (outside === 'below' && dy < 0 ? 400 : 0) });
    }
    return cands.sort((a, b) => a.cost - b.cost);
  };
  const put = (own, text, cands) => {
    for (const c of cands) {
      const b = boxOf(text, c.x, c.y, c.anchor);
      if (clear(b, own)) {
        placed.push(b);
        out.push(`<text class="svg-t" data-for="${own.name}" x="${f2(c.x)}" y="${f2(c.y)}" text-anchor="${c.anchor}">${label(text)}</text>`);
        return;
      }
    }
    throw new Error(`${id}: no place for the label of "${own.name}"`);
  };
  for (const q of points) put(items.find((i) => i.name === q.name), q.text, around(px(q.x), py(q.y)));
  for (const s of segs) if (s.text) put(items.find((i) => i.name === s.name), s.text, around((px(s.x1) + px(s.x2)) / 2, (py(s.y1) + py(s.y2)) / 2, s.outside));
  for (const c of circles) p.raw(`<circle class="pt" data-name="${c.name}" cx="${f2(c.cx)}" cy="${f2(c.cy)}" r="7"/>`);
  for (const t of out) p.raw(t);
}

/** Labels get a halo in the page colour, so a label that crosses a line stays readable. */
const finish = (p, meta) => {
  place(p, meta.id);
  return p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');
};

export const FIGURES = {
  // ---- 1. a square of side 1: its diagonal is the square root of 2 ----
  'proof-contradiction-unit-square': () => {
    const id = 'proof-contradiction-unit-square';
    // 1.6 units across and 1.6 units up, so one unit is the same length in both directions and the square is square
    const p = start(id, { xmin: -0.3, xmax: 1.3, ymin: -0.3, ymax: 1.3, height: 584 });
    seg(p, id, { name: 'bottom', x1: 0, y1: 0, x2: 1, y2: 0, text: '1', outside: 'below' });
    seg(p, id, { name: 'right', x1: 1, y1: 0, x2: 1, y2: 1 });
    seg(p, id, { name: 'top', x1: 1, y1: 1, x2: 0, y2: 1 });
    seg(p, id, { name: 'left', x1: 0, y1: 1, x2: 0, y2: 0, text: '1', outside: 'left' });
    seg(p, id, { name: 'diagonal', x1: 0, y1: 0, x2: 1, y2: 1, text: ROOT2, cls: 'curve' });
    return finish(p, {
      id,
      title: `A square of side 1, with a diagonal of length ${ROOT2}`,
      desc: `A square with its corners at (0, 0), (1, 0), (1, 1) and (0, 1). The bottom side and the left side are each labelled 1. A thick diagonal runs from the corner (0, 0) to the opposite corner (1, 1). It is labelled ${ROOT2}, because by Pythagoras the diagonal squared is 1 squared plus 1 squared, which is 2.`,
    });
  },

  // ---- 2. a number line: the square root of 2 sits between 1.41 and 1.42 ----
  'proof-contradiction-between': () => {
    const id = 'proof-contradiction-between';
    const p = start(id, { xmin: 1.4, xmax: 1.43, ymin: -1, ymax: 1, height: 250 });
    seg(p, id, { name: 'line', x1: 1.4, y1: 0, x2: 1.43, y2: 0, cls: 'axis' });
    mark(p, id, { name: 'a', x: 1.41, y: 0, text: '1.41' });
    mark(p, id, { name: 'r', x: Math.SQRT2, y: 0, text: ROOT2 });
    mark(p, id, { name: 'b', x: 1.42, y: 0, text: '1.42' });
    return finish(p, {
      id,
      title: `A number line from 1.40 to 1.43 with 1.41, ${ROOT2} and 1.42 marked`,
      desc: `A number line running from 1.40 on the left to 1.43 on the right. Three points are marked. The point 1.41 is on the left and the point 1.42 is on the right. Between them, a little left of the middle, is the point ${ROOT2}, which is about ${SQRT2_SHOWN}. The square of 1.41 is 1.9881, which is below 2. The square of 1.42 is 2.0164, which is above 2.`,
    });
  },
};
