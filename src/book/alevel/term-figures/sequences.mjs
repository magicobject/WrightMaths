// Pictures for sequences-and-series glossary terms (hover pop-up and glossary page): { '<term-id>': '<svg ...>' }.
// Draw with plane() or numberLine() from ../figure-lib.mjs at a small size, for example plane({ width: 360, height: 250, ... }).svg({ cls: 'graph-svg term-svg', ... }).
// Keys must be ids of terms in ../glossary/sequences.mjs. The title and desc describe the picture.
//
// Graphs of sequences are dot plots drawn from their formulas. Tables, boxes and bars are drawn in pixel coordinates by the small
// helpers below. Long labels go in a caption strip at the foot of the picture (cap()), so they never collide with the drawing.
import { plane, numberLine, label } from '../figure-lib.mjs';

const W = 360;
const H = 300;
const o = (id, title, desc) => ({ id: `tf-${id}`, title, desc, cls: 'graph-svg term-svg' });
const f = (n) => (Math.round(n * 100) / 100).toString();

/** Caption lines in the strip at the foot of a picture of height `h` (pixel coordinates). */
function cap(p, h, ...lines) {
  lines.forEach((t, i) => p.note(W / 2, h - 12 - (lines.length - 1 - i) * 28, t, { anchor: 'middle' }));
  return p;
}

/** An empty plane measured in pixels, for tables, boxes and bars. */
const pixels = (h) => plane({ xmin: 0, xmax: W, ymin: 0, ymax: h, width: W, height: h, left: 0, right: 0, top: 0, bottom: 0, axes: false, grid: false, ticks: false });
const text = (x, y, t, { cls = '', anchor = 'middle' } = {}) => `<text class="svg-t ${cls}" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}">${label(t)}</text>`;
const cell = (x, y, w, h, fill = '') => `<rect class="box" x="${f(x)}" y="${f(y)}" width="${w}" height="${h}"${fill ? ` style="fill:${fill}"` : ''}/>`;

/** A dot plot of u_n = fn(n) for n = 1 to n, on axes labelled n and u_n. */
function dots(id, title, desc, { fn, n, ymin = 0, ymax, ystep, limit, hideX = false, lines, extra }) {
  const p = plane({ width: W, height: H, left: 50, right: 40, top: 38, bottom: 106, xmin: 0, xmax: n + 1, ymin, ymax, xstep: 1, ystep, xlabel: 'n', ylabel: 'u_n', xtickFormat: hideX ? () => '' : null });
  if (limit !== undefined) p.hline(limit, { cls: 'guide' });
  for (let k = 1; k <= n; k += 1) p.point(k, fn(k));
  if (extra) extra(p);
  cap(p, H, ...lines);
  return p.svg(o(id, title, desc));
}

const arithmetic = (id, title, desc, lines) => dots(id, title, desc, {
  fn: (k) => 4 * k - 1, n: 5, ymax: 20, ystep: 5, lines,
  extra: (p) => { p.line(1, 3, 2, 3, { cls: 'guide' }).line(2, 3, 2, 7, { cls: 'guide' }); p.text(2.1, 5, '+4', { anchor: 'start', cls: 'small', dx: 2 }); },
});

const geometric = (id, title, desc, lines) => dots(id, title, desc, {
  fn: (k) => 2 ** (k - 1), n: 5, ymax: 18, ystep: 4, lines,
});

/** The boxes-and-arrows picture for a rule that turns one term into the next: 3, 7, 15, 31. */
function chain(id, title, desc, lines) {
  const h = 230;
  const p = pixels(h);
  const values = [3, 7, 15, 31];
  let s = '';
  values.forEach((v, i) => {
    const x = 16 + i * 92;
    s += cell(x, 70, 52, 52) + text(x + 26, 104, String(v), { cls: 'big' }) + text(x + 26, 56, `u_${i + 1}`, { cls: 'small' });
    if (i < 3) {
      const ax = x + 52;
      s += `<line class="line" x1="${ax + 4}" y1="96" x2="${ax + 32}" y2="96"/><polygon class="arrowhead" points="${ax + 40},96 ${ax + 29},89 ${ax + 29},103"/>`;
      s += text(ax + 21, 84, '\u00d72', { cls: 'small' }) + text(ax + 21, 124, '+1', { cls: 'small' });
    }
  });
  p.raw(s);
  cap(p, h, ...lines);
  return p.svg(o(id, title, desc));
}

/** Bars for the terms of a geometric series: 3, 6, 12, 24, 48. */
function bars(id, title, desc, lines) {
  const h = 300;
  const p = pixels(h);
  const terms = [3, 6, 12, 24, 48];
  let s = '';
  terms.forEach((v, i) => {
    const x = 22 + i * 64;
    const bh = v * 3.4;
    s += `<rect class="box" style="fill:var(--tint,#e4eefb)" x="${x}" y="${f(210 - bh)}" width="48" height="${f(bh)}"/>`;
    s += text(x + 24, 210 - bh - 8, String(v), { cls: 'small' });
  });
  s += `<line class="axis" x1="10" y1="210" x2="350" y2="210"/>`;
  p.raw(s);
  cap(p, h, ...lines);
  return p.svg(o(id, title, desc));
}

export const FIGS = {
  sequence: dots('sequence', 'A sequence', 'A graph of the sequence 3, 7, 11, 15, 19. The horizontal axis is the position n and the vertical axis is the term u sub n. Five dots rise in equal steps.', {
    fn: (k) => 4 * k - 1, n: 5, ymax: 20, ystep: 5, lines: ['3, 7, 11, 15, 19, ...', 'u_n is the term in position n'],
  }),

  'sequence-term': dots('sequence-term', 'A term of a sequence', 'A graph of the sequence 3, 7, 11, 15, 19 with the third dot labelled u sub 3 equals 11. Each dot is one term, at its position on the horizontal axis.', {
    fn: (k) => 4 * k - 1, n: 5, ymax: 20, ystep: 5, lines: ['the 3rd term is u_3 = 11'],
    extra: (p) => p.text(3, 11, 'u_3', { dy: -16 }),
  }),

  'sequence-notation': dots('sequence-notation', 'Sequence notation u sub n', 'A graph of the sequence 3, 7, 11, 15, 19. Two neighbouring dots are labelled u sub n and u sub n plus 1, to show that u sub n plus 1 is the next term.', {
    fn: (k) => 4 * k - 1, n: 5, ymax: 24, ystep: 5, lines: ['u_(n+1) is the NEXT term'],
    extra: (p) => { p.text(2, 7, 'u_n', { dy: -16, dx: -6 }); p.text(3, 11, 'u_(n+1)', { dy: -16, dx: -6 }); },
  }),

  'increasing-sequence': dots('increasing-sequence', 'An increasing sequence', 'A graph of the sequence 2, 4, 6, 8, 10, 12. The dots climb steadily from left to right.', {
    fn: (k) => 2 * k, n: 6, ymax: 14, ystep: 4, lines: ['each term is bigger', 'u_(n+1) > u_n'],
  }),

  'decreasing-sequence': dots('decreasing-sequence', 'A decreasing sequence', 'A graph of the sequence 20, 17, 14, 11, 8, 5. The dots fall steadily from left to right.', {
    fn: (k) => 23 - 3 * k, n: 6, ymax: 22, ystep: 5, lines: ['each term is smaller', 'u_(n+1) < u_n'],
  }),

  'periodic-sequence': dots('periodic-sequence', 'A periodic sequence', 'A graph of the sequence 1, 3, 2 repeated three times. The same pattern of three dots appears again and again, so the period is 3.', {
    fn: (k) => [1, 3, 2][(k - 1) % 3], n: 9, ymax: 4, ystep: 1, lines: ['1, 3, 2 repeats', 'period 3'],
  }),

  'oscillating-sequence': dots('oscillating-sequence', 'An oscillating sequence', 'A graph of a sequence that starts at 5 and then alternates below and above zero, with each swing smaller than the last. The dots jump up and down.', {
    fn: (k) => 5 * (-0.7) ** (k - 1), n: 7, ymin: -5, ymax: 6, ystep: 5, hideX: true, lines: ['terms go up and down', 'this one settles on 0'],
  }),

  'limit-of-a-sequence': dots('limit-of-a-sequence', 'The limit of a sequence', 'A graph of the sequence u sub n equals 3 plus 4 over n. The dots fall and get closer to a dashed horizontal line at 3, labelled limit 3, without crossing it.', {
    fn: (k) => 3 + 4 / k, n: 8, ymax: 8, ystep: 2, limit: 3, lines: ['u_n = 3 + 4/n', 'the terms get closer to 3'],
    extra: (p) => p.text(8.9, 3, 'limit 3', { anchor: 'end', cls: 'small', dy: 30 }),
  }),

  convergent: dots('convergent', 'A convergent sequence', 'A graph of the sequence u sub n equals 3 plus 4 over n. The dots get closer and closer to a dashed horizontal line at 3, so the sequence settles on 3.', {
    fn: (k) => 3 + 4 / k, n: 8, ymax: 8, ystep: 2, limit: 3, lines: ['the terms settle on 3'],
    extra: (p) => p.text(8.9, 3, 'limit 3', { anchor: 'end', cls: 'small', dy: 30 }),
  }),

  divergent: dots('divergent', 'A divergent sequence', 'A graph of the sequence 1, 2, 4, 8, 16, 32. The dots climb faster and faster and do not settle on any value.', {
    fn: (k) => 2 ** (k - 1), n: 6, ymax: 36, ystep: 8, lines: ['the terms grow without limit', 'they do not settle'],
  }),

  'arithmetic-sequence': arithmetic('arithmetic-sequence', 'An arithmetic sequence', 'A graph of the sequence 3, 7, 11, 15, 19. The dots lie on a straight line. A dashed step shows that each term is 4 more than the one before.', ['add 4 each time', 'u_n = 3 + 4(n - 1)']),

  'common-difference': arithmetic('common-difference', 'The common difference', 'A graph of the sequence 3, 7, 11, 15, 19. A dashed step from the first dot to the second goes 1 across and 4 up. The common difference d is 4.', ['d = 7 - 3 = 4', 'the same step every time']),

  'geometric-sequence': geometric('geometric-sequence', 'A geometric sequence', 'A graph of the sequence 1, 2, 4, 8, 16. The dots curve upwards. Each term is 2 times the one before.', ['multiply by 2 each time', 'u_n = 1 \u00d7 2^(n - 1)']),

  'common-ratio': geometric('common-ratio', 'The common ratio', 'A graph of the sequence 1, 2, 4, 8, 16. Each term is the same multiple of the one before. The common ratio r is 2, found by dividing a term by the one before.', ['r = 2 \u00f7 1 = 2', 'the same multiplier every time']),

  'recurrence-relation': chain('recurrence-relation', 'A recurrence relation', 'Four boxes in a row holding 3, 7, 15 and 31, labelled u sub 1 to u sub 4. An arrow between each pair is labelled times 2, then plus 1. The same rule gives every next term.', ['u_(n+1) = 2u_n + 1', 'u_1 = 3']),

  'term-to-term-rule': chain('term-to-term-rule', 'A term-to-term rule', 'Four boxes in a row holding 3, 7, 15 and 31. An arrow between each pair is labelled times 2, then plus 1. The rule turns each term into the next.', ['start at 3: double, then add 1']),

  'nth-term': (() => {
    const h = 250;
    const p = pixels(h);
    let s = text(34, 82, 'n', { cls: 'small' }) + text(34, 130, 'u_n', { cls: 'small' });
    for (let i = 0; i < 5; i += 1) {
      const x = 66 + i * 58;
      s += cell(x, 56, 52, 40, '#f4efe0') + text(x + 26, 84, String(i + 1)) + cell(x, 104, 52, 40) + text(x + 26, 132, String(2 * (i + 1) + 1));
    }
    p.raw(s);
    cap(p, h, 'u_n = 2n + 1', 'put n = 4: u_4 = 9');
    return p.svg(o('nth-term', 'The nth term formula', 'A table with two rows. The top row is the position n from 1 to 5. The bottom row is the term u sub n from the rule 2n plus 1: 3, 5, 7, 9, 11.'));
  })(),

  'arithmetic-series': (() => {
    const h = 300;
    const p = pixels(h);
    let s = '';
    for (let i = 0; i < 6; i += 1) {
      const x = 42 + i * 56;
      s += text(x, 50, String(i + 1)) + text(x, 90, String(6 - i)) + text(x, 150, '7');
    }
    s += `<line class="axis" x1="14" y1="108" x2="346" y2="108"/>`;
    p.raw(s);
    cap(p, h, 'forwards and backwards:', '6 sevens = 42, so 1 + ... + 6 = 21');
    return p.svg(o('arithmetic-series', 'Adding an arithmetic series', 'The numbers 1 to 6 are written in a row, with the same numbers in reverse order beneath them. Every column adds to 7. There are 6 columns, so twice the sum is 42 and the sum is 21.'));
  })(),

  'geometric-series': bars('geometric-series', 'A geometric series', 'A bar chart of the terms 3, 6, 12, 24 and 48. Each bar is twice as tall as the one before. Their total is 93.', ['3 + 6 + 12 + 24 + 48 = 93', 'a = 3, r = 2, n = 5']),

  'sum-to-infinity': (() => {
    const h = 250;
    const p = pixels(h);
    const widths = [160, 80, 40, 20, 10, 5, 2.5, 1.25];
    let x = 20;
    let s = '';
    widths.forEach((w, i) => {
      s += `<rect class="box" style="fill:${i % 2 ? 'var(--tint,#e4eefb)' : '#f4efe0'}" x="${f(x)}" y="86" width="${w}" height="46"/>`;
      if (i < 3) s += text(x + w / 2, 72, ['1', '1/2', '1/4'][i], { cls: 'small' });
      x += w;
    });
    s += text(x + 8, 116, '\u2026', { anchor: 'start' });
    s += `<line class="axis" x1="20" y1="148" x2="340" y2="148"/><line class="tick" x1="20" y1="140" x2="20" y2="156"/><line class="tick" x1="340" y1="140" x2="340" y2="156"/>`;
    s += text(20, 182, '0', { cls: 'small' }) + text(340, 182, '2', { cls: 'small' });
    p.raw(s);
    cap(p, h, '1 + 1/2 + 1/4 + ... gets to 2', 'a = 1, r = 1/2: 1 \u00f7 (1 - 1/2) = 2');
    return p.svg(o('sum-to-infinity', 'A sum to infinity', 'A strip of length 2 cut into pieces of length 1, one half, one quarter, one eighth and so on. Each piece is half the one before. The pieces fill the strip and never go past 2, so the sum to infinity is 2.'));
  })(),

  'sigma-notation': (() => {
    const h = 290;
    const p = pixels(h);
    let s = `<text x="120" y="150" text-anchor="middle" style="font:700 96px 'Source Sans 3',system-ui,sans-serif;fill:var(--ink)">\u03a3</text>`;
    s += text(120, 66, '4') + text(150, 66, 'stop here', { cls: 'small', anchor: 'start' });
    s += text(120, 190, 'r = 1') + text(160, 190, 'start here', { cls: 'small', anchor: 'start' });
    s += text(190, 128, '2r', { cls: 'big', anchor: 'start' }) + text(190, 154, 'what to add', { cls: 'small', anchor: 'start' });
    p.raw(s);
    cap(p, h, '= 2 + 4 + 6 + 8 = 20');
    return p.svg(o('sigma-notation', 'Sigma notation', 'A large capital sigma. Below it is r equals 1, where to start. Above it is 4, where to stop. To its right is 2r, what to add. The caption gives the sum: 2 plus 4 plus 6 plus 8, which is 20.'));
  })(),

  'pascals-triangle': (() => {
    const h = 300;
    const p = pixels(h);
    const rows = [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1], [1, 5, 10, 10, 5, 1]];
    let s = '';
    rows.forEach((row, r) => {
      row.forEach((v, i) => {
        const x = 180 + (i - (row.length - 1) / 2) * 52;
        const hot = r === 5 && i === 2;
        if (hot) s += `<circle class="pt-open" cx="${x}" cy="${40 + r * 38 - 8}" r="22"/>`;
        s += text(x, 40 + r * 38, String(v));
      });
      s += text(14, 40 + r * 38, String(r), { cls: 'small', anchor: 'start' });
    });
    s += text(14, 14, 'row', { cls: 'small', anchor: 'start' });
    p.raw(s);
    cap(p, h, '10 = 4 + 6: add the two above');
    return p.svg(o('pascals-triangle', 'Pascal\u2019s triangle', 'Pascal\u2019s triangle with rows 0 to 5: 1; 1 1; 1 2 1; 1 3 3 1; 1 4 6 4 1; 1 5 10 10 5 1. The row numbers are on the left. In row 5 the number 10 is circled: it is 4 plus 6 from the row above.'));
  })(),

  'binomial-validity': (() => {
    const s = numberLine({ min: -2, max: 2, step: 1, width: W, height: 130, marks: [{ at: -1, open: true }, { at: 1, open: true }], ranges: [{ from: -1, to: 1 }], id: 'tf-binomial-validity', title: 'Range of validity', desc: 'A number line from -2 to 2 with the stretch between -1 and 1 shaded. Both ends are open circles: -1 and 1 are not included. The expansion is valid for x between -1 and 1.' });
    return s.replace('class="graph-svg"', 'class="graph-svg term-svg"').replace('</svg>', `${text(180, 36, 'valid for -1 < x < 1')}</svg>`);
  })(),
};
