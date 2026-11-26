// Figures for the Binomial expansion (positive whole-number powers) topic page (src/pages/books/a-level/binomial-positive.html).
// Both are drawn in pixels only. Pascal's triangle is built by adding, from row 0, so the numbers on the picture
// cannot disagree with the rule they illustrate.
import { plane } from '../figure-lib.mjs';

const TIMES = String.fromCharCode(0xd7);

/** A picture drawn in pixels only (no axes). */
const canvas = (height) => plane({ grid: false, axes: false, ticks: false, tickLabels: false, top: 40, height });

/** Labels get a halo in the page colour, so a label that crosses a box edge stays readable. */
const finish = (p, meta) => p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');

/** A box with a fill and a dark outline, in pixels. */
const box = (p, x, y, w, h, fill = '') => p.raw(`<rect class="shade" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"${fill ? ` style="fill:${fill};stroke:var(--ink);stroke-width:3"` : ' style="stroke:var(--ink);stroke-width:3"'}/>`);

/** Rows 0 to `rows` of Pascal's triangle: each number is the sum of the two above it. */
export function pascalRows(rows) {
  const out = [[1]];
  for (let n = 1; n <= rows; n += 1) {
    const prev = out[n - 1];
    out.push(Array.from({ length: n + 1 }, (_, r) => (r === 0 || r === n ? 1 : prev[r - 1] + prev[r])));
  }
  return out;
}

// The number picked out in the triangle figure: row 6, position 3, which is the sum of the two 10s in row 5.
export const PICKED = { row: 6, position: 3 };

export const FIGURES = {
  // ---- Pascal's triangle, rows 0 to 6, with one sum picked out ----
  'binomial-positive-pascal': () => {
    const rows = pascalRows(6);
    const p = canvas(470);
    const w = 76;
    const h = 46;
    const gap = 8;
    const mid = 400;
    const y0 = 28;
    const x = (n, r) => mid + (r - n / 2) * (w + gap) - w / 2;
    const y = (n) => y0 + n * (h + gap);
    rows.forEach((row, n) => {
      p.note(8, y(n) + 33, `row ${n}`, { cls: 'alt' });
      row.forEach((value, r) => {
        const picked = n === PICKED.row && r === PICKED.position;
        const parent = n === PICKED.row - 1 && (r === PICKED.position - 1 || r === PICKED.position);
        box(p, x(n, r), y(n), w, h, picked ? '#ffd966' : parent ? '#fff4c9' : '');
        p.note(x(n, r) + w / 2, y(n) + 33, String(value), { anchor: 'middle' });
      });
    });
    p.note(mid, y(PICKED.row) + h + 34, 'Each number is the sum of the two above it: 10 + 10 = 20', { anchor: 'middle', cls: 'alt' });
    return finish(p, {
      id: 'binomial-positive-pascal',
      title: "Pascal's triangle, rows 0 to 6",
      desc: "Pascal's triangle drawn as boxes in seven rows, row 0 at the top. Each row starts and ends with 1. Row 0 is 1. Row 1 is 1 1. Row 2 is 1 2 1. Row 3 is 1 3 3 1. Row 4 is 1 4 6 4 1. Row 5 is 1 5 10 10 5 1. Row 6 is 1 6 15 20 15 6 1. In row 6 the box 20 is highlighted, and so are the two boxes marked 10 in row 5 above it, to show that 10 + 10 = 20.",
    });
  },

  // ---- one term of (2 + 3x)^5: the three parts that multiply ----
  'binomial-positive-term': () => {
    const p = canvas(330);
    const y = 90;
    const w = 190;
    const h = 120;
    const parts = [
      ['choose', '5C2 = 10', 'ways to choose'],
      ['powers of 2', '2^3 = 8', 'the first part'],
      ['powers of 3x', '(3x)^2 = 9x^2', 'the second part'],
    ];
    parts.forEach(([, value, caption], i) => {
      const x = 28 + i * (w + 50);
      box(p, x, y, w, h, i === 0 ? '#fff4c9' : '');
      p.note(x + w / 2, y + 72, value, { anchor: 'middle' });
      p.note(x + w / 2, y + h + 38, caption, { anchor: 'middle', cls: 'alt' });
      if (i > 0) p.note(x - 25, y + 72, TIMES, { anchor: 'middle' });
    });
    p.note(360, 52, 'The term in x^2 of (2 + 3x)^5', { anchor: 'middle' });
    p.note(360, 296, `10 ${TIMES} 8 ${TIMES} 9x^2 = 720x^2`, { anchor: 'middle', cls: 'alt' });
    return finish(p, {
      id: 'binomial-positive-term',
      title: 'The three parts of one term of (2 + 3x) to the power 5',
      desc: 'Three boxes in a row, joined by multiplication signs. The first box is 5C2 = 10, the number of ways to choose. The second is 2 cubed = 8, the power of the first part. The third is (3x) squared = 9x squared, the power of the second part. Underneath: 10 times 8 times 9x squared = 720x squared, which is the term in x squared.',
    });
  },
};
