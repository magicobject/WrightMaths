// Figures for the Polynomials and the factor theorem topic page (src/pages/books/a-level/polynomials.html).
// Every curve is drawn from the polynomial that defines it, so a picture cannot disagree with the working.
// The two axes do not share a scale (a cubic is steep), so each picture is a sketch: the points that matter are
// labelled with their coordinates on the picture itself, and the equation sits in a band above the graph.
import { plane } from '../figure-lib.mjs';

/** A plane with no grid and no scale numbers. It leaves a band above the graph for the equation. */
const sketch = (opts) => plane({ grid: false, ticks: false, tickLabels: false, top: 96, height: 520, ...opts });

/** The equation (left) and a note (right) in the band above the graph. */
function band(p, left, right = '') {
  p.note(64, 50, left, { cls: 'alt' });
  if (right) p.note(672, 50, right, { anchor: 'end' });
}

/** Labels get a halo in the page colour, so a label that crosses an axis or a guide line stays readable. */
const finish = (p, meta) => p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');

export const FIGURES = {
  // ---- 3. the factor theorem: f(x) = x^3 + 2x^2 - 5x - 6 = (x - 2)(x + 1)(x + 3) ----
  'polynomials-cubic-roots': () => {
    const f = (x) => x ** 3 + 2 * x ** 2 - 5 * x - 6;
    const p = sketch({ xmin: -4.2, xmax: 3.4, ymin: -11, ymax: 9 });
    band(p, 'y = x^3 + 2x^2 - 5x - 6', 'not to scale');
    p.curve(f);
    p.point(-3, 0, { label: '(-3, 0)', dx: -16, dy: -16, anchor: 'end' });
    p.point(-1, 0, { label: '(-1, 0)', dx: 18, dy: -16 });
    p.point(2, 0, { label: '(2, 0)', dx: -16, dy: -16, anchor: 'end' });
    p.point(0, -6, { label: '(0, -6)', dx: -16, dy: 28, anchor: 'end' });
    return finish(p, {
      id: 'polynomials-cubic-roots',
      title: 'The graph of y = x cubed + 2x squared - 5x - 6 crosses the x-axis at -3, -1 and 2',
      desc: 'A cubic curve that rises from the lower left, crosses the x-axis at the marked point (-3, 0), reaches a high point, falls through (-1, 0) and (0, -6), reaches a low point below the axis, then rises through (2, 0) and keeps rising. The three x-intercepts are the roots, and each root gives a factor.',
    });
  },

  // ---- 4. a repeated root: f(x) = x^3 - 3x + 2 = (x - 1)^2 (x + 2) ----
  'polynomials-repeated': () => {
    const f = (x) => x ** 3 - 3 * x + 2;
    const p = sketch({ xmin: -3, xmax: 2.6, ymin: -5, ymax: 8 });
    band(p, 'y = x^3 - 3x + 2', 'not to scale');
    p.curve(f);
    p.point(-2, 0, { label: '(-2, 0)', dx: 18, dy: 32 });
    p.point(1, 0, { label: '(1, 0)', dx: 0, dy: 44, anchor: 'middle' });
    p.point(0, 2, { label: '(0, 2)', dx: 16, dy: -14 });
    return finish(p, {
      id: 'polynomials-repeated',
      title: 'The graph of y = x cubed - 3x + 2 crosses the x-axis at -2 and touches it at 1',
      desc: 'A cubic curve. It crosses the x-axis at the marked point (-2, 0), rises to a high point, falls to a low point that rests exactly on the x-axis at the marked point (1, 0), then rises again. The curve touches the axis at 1 without crossing it. It meets the y-axis at (0, 2).',
    });
  },

  // ---- flip it: the roots -1, 2 and 3 build y = (x + 1)(x - 2)(x - 3) ----
  'polynomials-flip': () => {
    const f = (x) => (x + 1) * (x - 2) * (x - 3);
    const p = sketch({ xmin: -2, xmax: 4, ymin: -5, ymax: 10 });
    band(p, 'y = (x + 1)(x - 2)(x - 3)', 'not to scale');
    p.curve(f);
    p.point(-1, 0, { label: '(-1, 0)', dx: -16, dy: -16, anchor: 'end' });
    p.point(2, 0, { label: '(2, 0)', dx: -14, dy: 34, anchor: 'end' });
    p.point(3, 0, { label: '(3, 0)', dx: 14, dy: 34 });
    p.point(0, 6, { label: '(0, 6)', dx: 16, dy: -16 });
    return finish(p, {
      id: 'polynomials-flip',
      title: 'The cubic with roots -1, 2 and 3 meets the y-axis at 6',
      desc: 'A cubic curve that rises through the marked point (-1, 0) on the x-axis, reaches a high point close to the right of the y-axis, passes through the marked point (0, 6) on the y-axis, falls through (2, 0), dips below the axis, and rises again through (3, 0). The three marked x-intercepts are the roots. The factors are built from them.',
    });
  },
};
