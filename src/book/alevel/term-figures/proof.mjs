// Pictures for proof glossary terms (hover pop-up and glossary page): { '<term-id>': '<svg ...>' }.
// Draw with plane() or numberLine() from ../figure-lib.mjs at a small size, for example plane({ width: 360, height: 250, ... }).svg({ cls: 'graph-svg term-svg', ... }).
// Keys must be ids of terms in ../glossary/proof.mjs. The title and desc describe the picture.
import { plane, numberLine } from '../figure-lib.mjs';

const line = (id, title, desc, o) => numberLine({ width: 460, height: 140, id: `tf-${id}`, title, desc, ...o }).replace('class="graph-svg"', 'class="graph-svg term-svg"');

export const FIGS = {
  counterexample: plane({ width: 460, height: 320, left: 44, right: 40, top: 40, bottom: 34, tickLabels: false, xmin: -0.5, xmax: 2.5, ymin: -0.5, ymax: 3, xstep: 0.5, ystep: 0.5 })
    .curve((x) => x * x).curve((x) => x, { cls: 'curve-b' })
    .point(0.5, 0.25, { label: 'x = 0.5', dx: 6, dy: 54 })
    .text(0.2, 2.5, 'y = x^2', { cls: 'alt', anchor: 'start' }).text(2.1, 1.6, 'y = x', { cls: 'alt', anchor: 'start' })
    .svg({ id: 'tf-counterexample', title: 'A counterexample on a graph', desc: 'The curve y equals x squared (solid) and the line y equals x (dashed). Claim: x squared is at least x for every positive x. The curve is above the line for x greater than 1, but at x equals 0.5 it is below, so x equals 0.5 is a counterexample.', cls: 'graph-svg term-svg' }),
  'consecutive-integers': line(
    'consecutive-integers', 'Consecutive integers', 'A number line with three marked points, labelled n, n plus 1 and n plus 2, one step apart. Each is 1 more than the one before.',
    { min: 0, max: 6, marks: [{ at: 2, label: 'n' }, { at: 3, label: 'n+1' }, { at: 4, label: 'n+2' }] },
  ),
  'even-number': line(
    'even-number', 'Even numbers on a number line', 'A number line from 0 to 9 with the even numbers 0, 2, 4, 6 and 8 marked with filled circles. They are 2 apart.',
    { min: 0, max: 9, marks: [0, 2, 4, 6, 8].map((at) => ({ at, label: String(at) })) },
  ),
  'odd-number': line(
    'odd-number', 'Odd numbers on a number line', 'A number line from 0 to 9 with the odd numbers 1, 3, 5, 7 and 9 marked with filled circles. They are 2 apart.',
    { min: 0, max: 9, marks: [1, 3, 5, 7, 9].map((at) => ({ at, label: String(at) })) },
  ),
  'irrational-number': line(
    'irrational-number', 'An irrational number on the number line', 'A number line from 0 to 3. A point is marked between 1 and 2 at the square root of 2, about 1.414. It is a real point on the line, but it cannot be written as one integer divided by another.',
    { min: 0, max: 3, marks: [{ at: Math.SQRT2, label: '\u221a2 \u2248 1.414' }] },
  ),
};
