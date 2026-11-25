// Pictures for integration glossary terms (hover pop-up and glossary page): { '<term-id>': '<svg ...>' }.
// Every graph is drawn from its function with plane() (../figure-lib.mjs); nothing is placed by hand.
// Keys are ids of terms in ../glossary/integration.mjs. Figure ids start 'tf-' plus the term id.
import { plane } from '../figure-lib.mjs';

const CLS = 'graph-svg term-svg';
const small = (opts) => plane({ width: 520, height: 360, ...opts });

const square = (x) => x * x;

// The curves y = x^2 + c for c = -2, 0, 2: the family of solutions of dy/dx = 2x.
function familyFigure({ id, title, desc, highlight }) {
  const p = small({ xmin: -3, xmax: 3, ymin: -3, ymax: 9, xstep: 1, ystep: 2 });
  for (const c of [-2, 0, 2]) p.curve((x) => x * x + c, { cls: highlight === c ? 'curve' : 'curve-c' });
  if (highlight === undefined) {
    p.text(0.2, 2.7, 'c=2', { cls: 'alt small', anchor: 'start' });
    p.text(0.2, 0.7, 'c=0', { cls: 'alt small', anchor: 'start' });
    p.text(0.2, -1.3, 'c=-2', { cls: 'alt small', anchor: 'start' });
  } else {
    p.point(1, 3, { label: '(1, 3)', dx: -6, dy: -18, anchor: 'end' });
    p.text(1.95, 6.3, 'y = x^2 + 2', { cls: 'alt', anchor: 'end' });
  }
  return p.svg({ id, title, desc, cls: CLS });
}

export const FIGS = {
  'definite-integral': (() => {
    const f = (x) => (x * x) / 2 + 1;
    const p = small({ xmin: -1, xmax: 5, ymin: -1, ymax: 9, xstep: 1, ystep: 2 });
    p.shade(f, () => 0, 1, 3);
    p.curve(f);
    p.vline(1);
    p.vline(3);
    p.text(1, -0.2, 'a = 1', { cls: 'alt', dx: -6, dy: 52 });
    p.text(3, -0.2, 'b = 3', { cls: 'alt', dx: 6, dy: 52 });
    p.text(2, 0.7, 'value 19/3', { cls: 'alt' });
    return p.svg({ id: 'tf-definite-integral', title: 'A definite integral between two limits', desc: 'The curve y equals half of x squared, plus 1. The region under the curve and above the x-axis, from the lower limit x equals 1 to the upper limit x equals 3, is shaded. The value of the definite integral is 19 over 3.', cls: CLS });
  })(),

  'area-under-curve': (() => {
    const p = small({ xmin: -1, xmax: 4, ymin: -2, ymax: 10, xstep: 1, ystep: 2 });
    p.shade(square, () => 0, 0, 3);
    p.curve(square);
    p.text(2, 2.2, 'area = 9', { cls: 'alt' });
    p.text(0.2, 8, 'y = x^2', { cls: 'alt', anchor: 'start' });
    return p.svg({ id: 'tf-area-under-curve', title: 'The area under a curve', desc: 'The curve y equals x squared. The region between the curve and the x-axis from x equals 0 to x equals 3 is shaded. Its area is 9 square units.', cls: CLS });
  })(),

  'area-below-the-axis': (() => {
    const f = (x) => x * x - 4;
    const p = small({ xmin: -1, xmax: 4, ymin: -5, ymax: 6, xstep: 1, ystep: 1 });
    p.shade(() => 0, f, 0, 2);
    // The class shade-hatch points at #hatch, but each figure's pattern has its own id, so fill the stripes by hand.
    const stripes = Array.from({ length: 31 }, (_, k) => 2 + k / 30).map((x) => [x, f(x)]).concat([[3, 0], [2, 0]]);
    p.raw(`<polygon fill="url(#tf-area-below-the-axis-hatch)" stroke="none" points="${stripes.map(([x, y]) => `${p.X(x).toFixed(1)},${p.Y(y).toFixed(1)}`).join(' ')}"/>`);
    p.curve(f);
    p.text(1, -1.4, 'negative', { cls: 'alt' });
    p.line(3.05, 1.5, 2.7, 1.5, { cls: 'guide' });
    p.text(3.1, 1.2, 'positive', { cls: 'alt', anchor: 'start' });
    return p.svg({ id: 'tf-area-below-the-axis', title: 'Area below the axis counts as negative', desc: 'The curve y equals x squared minus 4 crosses the x-axis at x equals 2. From x equals 0 to 2 the region between the curve and the axis lies below the axis, and its integral is negative. From x equals 2 to 3 the region lies above the axis, shaded with stripes, and its integral is positive.', cls: CLS, hatch: true });
  })(),

  'area-between-curves': (() => {
    const line = (x) => x + 2;
    const p = small({ xmin: -2, xmax: 3, ymin: -1, ymax: 6, xstep: 1, ystep: 1 });
    p.shade(line, square, -1, 2);
    p.curve(square);
    p.curve(line, { cls: 'curve-b' });
    p.point(-1, 1, { label: '(-1, 1)', dx: -12, dy: -14, anchor: 'end' });
    p.point(2, 4, { label: '(2, 4)', dx: 12, dy: 6 });
    p.text(0.2, 1.2, 'area = 9/2', { cls: 'alt' });
    return p.svg({ id: 'tf-area-between-curves', title: 'The area between two curves', desc: 'The parabola y equals x squared (solid) and the line y equals x plus 2 (dashed) meet at (minus 1, 1) and (2, 4). The region between them is shaded. The line is the upper curve there, and the area is 9 over 2.', cls: CLS });
  })(),

  'limit-of-a-sum': (() => {
    const n = 6;
    const width = 3 / n;
    const p = small({ xmin: -1, xmax: 4, ymin: -2, ymax: 10, xstep: 1, ystep: 2 });
    // Strips with their tops at the left edge: on a rising curve they all lie under it.
    for (let i = 0; i < n; i += 1) {
      const x0 = i * width;
      const x1 = x0 + width;
      const top = square(x0);
      p.raw(`<rect class="shade" x="${p.X(x0).toFixed(2)}" y="${p.Y(top).toFixed(2)}" width="${(p.X(x1) - p.X(x0)).toFixed(2)}" height="${(p.Y(0) - p.Y(top)).toFixed(2)}"/>`);
      p.line(x0, 0, x0, top, { cls: 'guide' });
    }
    p.curve(square);
    p.text(0.2, 8, 'y = x^2', { cls: 'alt', anchor: 'start' });
    p.text(1.1, 6, '6 strips', { cls: 'alt' });
    return p.svg({ id: 'tf-limit-of-a-sum', title: 'Area as the sum of thin strips', desc: 'The curve y equals x squared from x equals 0 to 3, with the area under it filled by 6 thin rectangular strips of width 0.5. The height of each strip is the height of the curve at the strip\'s left edge, so each strip lies under the curve. Thinner strips would fit the curve more closely.', cls: CLS });
  })(),

  'family-of-solution-curves': familyFigure({
    id: 'tf-family-of-solution-curves',
    title: 'A family of solution curves',
    desc: 'Three copies of the parabola y equals x squared plus c, for c equal to 2, 0 and negative 2, each shifted up or down from the others. They are the general solution of dy by dx equals 2x.',
  }),

  'particular-solution': familyFigure({
    id: 'tf-particular-solution',
    title: 'One solution picked out of the family',
    desc: 'The same three parabolas y equals x squared plus c. The point (1, 3) is marked. Only the solid curve, y equals x squared plus 2, passes through it, so that curve is the particular solution. The other two are dotted.',
    highlight: 2,
  }),
};
