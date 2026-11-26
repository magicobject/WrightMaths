// Figures for the Proof topic page (src/pages/books/a-level/proof-methods.html).
// One picture only: the completed-square form (x - 3)^2 + 1 drawn as a curve that stays above the x-axis.
// The curve and the lowest point are both worked out from the same numbers, so the picture cannot disagree with the page.
import { plane } from '../figure-lib.mjs';

/** The expression the page proves is always positive: x^2 - 6x + 10 = (x - 3)^2 + 1. A test checks the page text against it. */
export const ALWAYS_POSITIVE = { a: 1, b: -6, c: 10, p: -3, q: 1 };

/** Labels get a halo in the page colour, so a label that crosses an axis or a line stays readable. */
const finish = (p, meta) => p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');

export const FIGURES = {
  'proof-methods-always-positive': () => {
    const { a, b, c } = ALWAYS_POSITIVE;
    const vx = -b / (2 * a);
    const vy = c - (b * b) / (4 * a);
    const p = plane({ grid: false, ticks: false, tickLabels: false, top: 96, height: 500, xmin: -1, xmax: 7, ymin: -2, ymax: 14 });
    p.note(64, 50, 'y = x^2 - 6x + 10 = (x - 3)^2 + 1', { cls: 'alt' });
    p.curve((x) => a * x * x + b * x + c);
    p.line(vx, vy + 0.4, vx, 6, { cls: 'guide' }); // a guide up the axis of symmetry to the label, which sits in the clear space inside the curve
    p.point(vx, vy);
    p.text(vx, 6.6, `lowest point (${vx}, ${vy})`, { cls: 'alt', anchor: 'middle' });
    return finish(p, {
      id: 'proof-methods-always-positive',
      title: 'The graph of y = x squared minus 6x plus 10',
      desc: `An upward-opening parabola whose lowest point is (${vx}, ${vy}). The whole curve is above the x-axis, so the expression is positive for every value of x.`,
    });
  },
};
