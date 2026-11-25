// Pictures for algebra glossary terms (hover pop-up and glossary page): { '<term-id>': '<svg ...>' }.
// Draw with plane() or numberLine() from ../figure-lib.mjs at a small size, for example plane({ width: 360, height: 250, ... }).svg({ cls: 'graph-svg term-svg', ... }).
// Keys must be ids of terms in ../glossary/algebra.mjs. The title and desc describe the picture.
// Every graph is drawn from its function. Figure ids are 'tf-' plus the term id.
import { plane, numberLine } from '../figure-lib.mjs';

/** A pop-up sized plane. Tick labels are off by default: the key points are labelled on the picture instead. */
const pop = (o) => plane({ width: 460, height: 320, left: 44, right: 40, top: 40, bottom: 34, tickLabels: false, ...o });
const done = (p, id, title, desc) => p.svg({ id: `tf-${id}`, title, desc, cls: 'graph-svg term-svg' });
const line = (id, title, desc, o) => numberLine({ width: 460, height: 140, id: `tf-${id}`, title, desc, ...o }).replace('class="graph-svg"', 'class="graph-svg term-svg"');
/** A thick bar along an axis, in pixel coordinates, to show a domain or a range. */
const bar = (x1, y1, x2, y2) => `<line class="curve" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke-width:9;stroke-linecap:round"/>`;

const quad = (x) => x * x - 4 * x + 3;
const cubicF = (x) => (x - 2) * (x + 1) * (x + 3);

export const FIGS = {
  quadratic: done(
    pop({ xmin: -1, xmax: 5, ymin: -2, ymax: 5, xstep: 1, ystep: 1 }).curve(quad)
      .text(4.2, 4, 'y = x^2 - 4x + 3', { cls: 'alt', anchor: 'end', dy: -6 }),
    'quadratic', 'Graph of a quadratic', 'A U-shaped curve, y equals x squared minus 4x plus 3, labelled on the picture. It meets the x-axis at x equals 1 and x equals 3 and has its lowest point at (2, minus 1).',
  ),
  root: done(
    pop({ xmin: -1, xmax: 5, ymin: -2.5, ymax: 4.5, xstep: 1, ystep: 1 }).curve(quad)
      .point(1, 0, { label: 'x = 1', dx: -6, dy: 32, anchor: 'end' }).point(3, 0, { label: 'x = 3', dx: 6, dy: 32 })
      .text(2.1, 3.6, 'y = f(x)', { cls: 'alt', anchor: 'start' }),
    'root', 'Roots of a function', 'The curve y equals f of x crosses the x-axis at two points. Each is marked and labelled as a root: x equals 1 and x equals 3.',
  ),
  'completing-the-square': done(
    pop({ xmin: -6, xmax: 0, ymin: -5, ymax: 4, xstep: 1, ystep: 1 }).curve((x) => (x + 3) * (x + 3) - 4)
      .vline(-3).point(-3, -4, { label: 'vertex (-3, -4)', dx: 12, dy: 6 })
      .text(-3, 2.3, 'y = (x + 3)^2 - 4', { cls: 'alt' }),
    'completing-the-square', 'Completed square and the vertex', 'The curve y equals (x plus 3) squared minus 4. Its lowest point, the vertex, is marked at (minus 3, minus 4) and a dashed vertical line passes through it.',
  ),
  discriminant: done(
    pop({ xmin: -2.4, xmax: 2.4, ymin: -6, ymax: 4, xstep: 1, ystep: 1 })
      .curve((x) => 0.8 * x * x - 1).curve((x) => 0.8 * x * x, { cls: 'curve-b' }).curve((x) => 0.8 * x * x + 1, { cls: 'curve-c' })
      .text(-2.3, -1.8, 'b^2 - 4ac is:', { cls: 'small', anchor: 'start' }).text(-2.3, -3.0, 'solid: > 0', { cls: 'small', anchor: 'start' }).text(-2.3, -4.2, 'dashed: = 0', { cls: 'small', anchor: 'start' }).text(-2.3, -5.4, 'dotted: < 0', { cls: 'small', anchor: 'start' }),
    'discriminant', 'Three signs of the discriminant', 'Three U-shaped curves with the same shape, with a key on the picture. The solid one crosses the x-axis twice (discriminant positive, two roots). The dashed one just touches the x-axis (discriminant zero, one repeated root). The dotted one stays above the x-axis (discriminant negative, no real roots).',
  ),
  'repeated-root': done(
    pop({ xmin: -4.4, xmax: 3, ymin: -3, ymax: 6, xstep: 1, ystep: 1 }).curve((x) => (x - 1) * (x - 1) * (x + 2))
      .point(1, 0, { label: 'double root', dx: 4, dy: 34 }).point(-2, 0, { label: 'single root', dx: -10, dy: -16, anchor: 'end' }),
    'repeated-root', 'A repeated root', 'The curve y equals (x minus 1) squared times (x plus 2). At x equals minus 2, a single root, it crosses the x-axis. At x equals 1, a repeated root, it only touches the x-axis and turns.',
  ),
  parabola: done(
    pop({ xmin: -3, xmax: 3, ymin: -1.5, ymax: 4, xstep: 1, ystep: 1 }).curve((x) => x * x)
      .curve((x) => 3 - x * x * 0.8, { cls: 'curve-b' })
      .text(0, -1.0, 'opens up', { cls: 'small', dx: 52 }).text(0, 3.6, 'opens down', { cls: 'small', dx: 62 }),
    'parabola', 'Two parabolas', 'Two U-shaped curves, one opening upwards (solid) and one opening downwards (dashed). Both arms of each curve go on for ever.',
  ),
  vertex: done(
    pop({ xmin: -1, xmax: 5, ymin: -2.5, ymax: 4.5, xstep: 1, ystep: 1 }).curve((x) => (x - 2) * (x - 2) - 1)
      .point(2, -1, { label: 'vertex (2, -1)', dx: 12, dy: 28 }),
    'vertex', 'The vertex of a parabola', 'The curve y equals (x minus 2) squared minus 1. Its lowest point is marked and labelled as the vertex, at (2, minus 1).',
  ),
  'axis-of-symmetry': done(
    pop({ xmin: -1, xmax: 5, ymin: -2.5, ymax: 4.5, xstep: 1, ystep: 1 }).curve(quad).vline(2)
      .point(1, 0, {}).point(3, 0, {}).text(2.1, 3.9, 'axis: x = 2', { cls: 'alt', anchor: 'start' }),
    'axis-of-symmetry', 'The axis of symmetry', 'The curve y equals x squared minus 4x plus 3 with a dashed vertical line, x equals 2, through its lowest point. The line splits the curve into two mirror-image halves. The two roots, 1 and 3, are marked and are the same distance from the line.',
  ),
  'quadratic-in-disguise': done(
    pop({ xmin: -2.6, xmax: 2.6, ymin: -2, ymax: 4, xstep: 1, ystep: 1 }).curve((x) => x ** 4 - 5 * x * x + 4)
      .point(-2, 0, {}).point(-1, 0, {}).point(1, 0, {}).point(2, 0, {}),
    'quadratic-in-disguise', 'A quartic with four roots', 'The curve y equals x to the power 4 minus 5x squared plus 4. It meets the x-axis at four marked points: x equals minus 2, minus 1, 1 and 2. Treating x squared as a new letter turns it into a quadratic.',
  ),
  'simultaneous-equations': done(
    pop({ xmin: -3.2, xmax: 4.8, ymin: -6.5, ymax: 9, xstep: 1, ystep: 2 }).curve((x) => x * x - 2).straight(2, 1, { cls: 'curve-b' })
      .point(-1, -1).point(3, 7)
      .text(-1.3, 8, 'parabola', { cls: 'alt' }).text(3.8, 5.2, 'line', { cls: 'alt' }).text(-2.6, -5.4, 'meet at (-1, -1) and (3, 7)', { cls: 'small', anchor: 'start' }),
    'simultaneous-equations', 'Where two graphs meet', 'The parabola y equals x squared minus 2 (solid) and the straight line y equals 2x plus 1 (dashed) meet at two marked points, (minus 1, minus 1) and (3, 7). These two points are the solutions of the pair of equations.',
  ),
  inequality: done(
    pop({ xmin: -1, xmax: 5, ymin: -2.5, ymax: 4.5, xstep: 1, ystep: 1 }).shade(() => 0, quad, 1, 3)
      .curve(quad).text(2, 3.0, 'x^2 - 4x + 3 < 0', { cls: 'alt' }).text(2, 2.0, 'for 1 < x < 3', { cls: 'alt' }),
    'inequality', 'A quadratic inequality', 'The curve y equals x squared minus 4x plus 3. The part of the curve that lies below the x-axis, between x equals 1 and x equals 3, is shaded. This is where the quadratic is less than zero.',
  ),
  region: done(
    pop({ xmin: -3, xmax: 4, ymin: -4, ymax: 6, xstep: 1, ystep: 1 }).shade((x) => 6, (x) => 2 * x - 1, -3, 4)
      .straight(2, -1, { cls: 'curve-b' }).vline(0, { cls: 'axis' }).hline(0, { cls: 'axis' }).text(-1.4, 3.6, 'y > 2x - 1', { cls: 'alt' }).text(2.0, -2.8, 'y = 2x - 1', { cls: 'small', anchor: 'start' }),
    'region', 'The region y greater than 2x minus 1', 'The straight line y equals 2x minus 1, drawn dashed because points on it are not included. The area above the line is shaded: these are the points where y is greater than 2x minus 1.',
  ),
  interval: line(
    'interval', 'An interval on a number line', 'A number line with a filled circle at 1 and an open circle at 5. The stretch between them is shaded. The filled circle means 1 is included. The open circle means 5 is not included.',
    { min: -1, max: 7, ranges: [{ from: 1, to: 5 }], marks: [{ at: 1, label: '1' }, { at: 5, open: true, label: '5' }] },
  ),
  'interval-notation': line(
    'interval-notation', 'An interval written in brackets', 'A number line with a filled circle at 1 and an open circle at 5, and the stretch between them shaded. It is the interval [1, 5): a square bracket for the included end 1 and a round bracket for the end 5 left out.',
    { min: -1, max: 7, ranges: [{ from: 1, to: 5 }], marks: [{ at: 1, label: '[1' }, { at: 5, open: true, label: '5)' }] },
  ),
  union: line(
    'union', 'A union of two intervals', 'A number line with two shaded parts. One part runs from the left up to minus 2, with an open circle at minus 2. The other runs from 2 to the right, with an open circle at 2. Together they show x less than minus 2 or x greater than 2.',
    { min: -5, max: 5, ranges: [{ from: -5, to: -2 }, { from: 2, to: 5 }], marks: [{ at: -2, open: true, label: '-2' }, { at: 2, open: true, label: '2' }] },
  ),
  modulus: line(
    'modulus', 'The modulus as a distance', 'A number line showing 0 and the numbers minus 3 and 3. The stretch from 0 to 3 and the stretch from 0 to minus 3 are shaded. Both are 3 units long, so the modulus of 3 and of minus 3 is 3.',
    { min: -5, max: 5, ranges: [{ from: -3, to: 3 }], marks: [{ at: -3, label: '-3' }, { at: 0, label: '0' }, { at: 3, label: '3' }] },
  ),
  cubic: done(
    pop({ xmin: -4.2, xmax: 3.2, ymin: -8, ymax: 12, xstep: 1, ystep: 4 }).curve(cubicF)
      .point(-3, 0, {}).point(-1, 0, {}).point(2, 0, {}),
    'cubic', 'A cubic graph', 'The curve y equals (x minus 2)(x plus 1)(x plus 3). It rises from the bottom left, falls, rises again, and has three marked roots, at x equals minus 3, minus 1 and 2.',
  ),
  quartic: done(
    pop({ xmin: -3, xmax: 3, ymin: -3, ymax: 6, xstep: 1, ystep: 1 }).curve((x) => (x * x - 1) * (x * x - 4) * 0.5)
      .point(-2, 0, {}).point(-1, 0, {}).point(1, 0, {}).point(2, 0, {}),
    'quartic', 'A quartic graph', 'A W-shaped curve with four marked roots, at x equals minus 2, minus 1, 1 and 2. Both ends of the curve go upwards.',
  ),
  'factor-theorem': done(
    pop({ xmin: -4.2, xmax: 3.2, ymin: -8, ymax: 12, xstep: 1, ystep: 4 }).curve(cubicF)
      .point(2, 0, { label: 'f(2) = 0', dx: -10, dy: -16, anchor: 'end' }).text(-4.1, 9.5, 'y = f(x)', { cls: 'alt', anchor: 'start' }),
    'factor-theorem', 'The factor theorem', 'The cubic f of x equals x cubed plus 2x squared minus 5x minus 6. At x equals 2 the curve meets the x-axis, so f of 2 is 0 and (x minus 2) is a factor.',
  ),
  asymptote: done(
    pop({ xmin: -2, xmax: 6, ymin: -2, ymax: 8, xstep: 1, ystep: 1 }).curve((x) => 1 / (x - 2) + 3).vline(2).hline(3)
      .text(2.2, -1.2, 'x = 2', { cls: 'alt', anchor: 'start' }).text(5.9, 2.2, 'y = 3', { cls: 'alt', anchor: 'end' }),
    'asymptote', 'Asymptotes', 'The curve y equals 1 over (x minus 2), plus 3, in two separate branches. Two dashed lines, x equals 2 and y equals 3, are marked. The branches get closer and closer to these lines.',
  ),
  'reciprocal-graph': done(
    pop({ xmin: -4, xmax: 4, ymin: -4, ymax: 4, xstep: 1, ystep: 1 }).curve((x) => 1 / x).curve((x) => 1 / (x * x), { cls: 'curve-b' })
      .text(2.2, 2.6, 'y = 1/x', { cls: 'alt', anchor: 'start' }).text(-1.0, 3.3, 'y = 1/x^2', { cls: 'alt', anchor: 'end' }),
    'reciprocal-graph', 'Reciprocal graphs', 'The curve y equals 1 over x (solid) has one branch in the top right and one in the bottom left. The curve y equals 1 over x squared (dashed) has two branches that are both above the x-axis. Both curves get close to the two axes.',
  ),
  proportional: done(
    pop({ xmin: -1, xmax: 5, ymin: -1, ymax: 7, xstep: 1, ystep: 1 }).straight(1.5, 0)
      .point(0, 0, { label: 'origin', dx: 12, dy: 24 }).text(1.0, 5.2, 'y = kx', { cls: 'alt', anchor: 'start' }),
    'proportional', 'Direct proportion', 'A straight line through the origin, labelled y equals kx. A quantity that is proportional to another always gives a straight line through the origin.',
  ),
  'inversely-proportional': done(
    pop({ xmin: -0.5, xmax: 6, ymin: -0.5, ymax: 6, xstep: 1, ystep: 1 }).curve((x) => 4 / x)
      .text(3.6, 3.2, 'y = k/x', { cls: 'alt', anchor: 'start' }),
    'inversely-proportional', 'Inverse proportion', 'A curve, y equals k over x, that falls from the top left towards the x-axis. As x gets bigger, y gets smaller. It never touches the axes.',
  ),
  'translation-of-graph': done(
    pop({ xmin: -3, xmax: 9, ymin: -1.5, ymax: 7, xstep: 1, ystep: 1 }).curve((x) => x * x).curve((x) => (x - 3) * (x - 3) + 2, { cls: 'curve-b' })
      .point(0, 0, { label: 'f(x)', dx: 12, dy: 30 }).point(3, 2, { label: 'f(x - 3) + 2', dx: 16, dy: 34 }),
    'translation-of-graph', 'A translation', 'The curve y equals x squared (solid), with its lowest point at the origin. The dashed curve is the same shape moved 3 to the right and 2 up, with its lowest point at (3, 2). This is y equals f of (x minus 3), plus 2.',
  ),
  'stretch-of-graph': done(
    pop({ xmin: -3.2, xmax: 3.2, ymin: -9, ymax: 5, xstep: 1, ystep: 2 }).curve((x) => x * x - 4).curve((x) => (2 * x) * (2 * x) - 4, { cls: 'curve-b' })
      .text(0.2, -6.6, 'dashed: f(2x)', { cls: 'alt', anchor: 'start' }).text(0.2, -8.2, 'solid: f(x)', { cls: 'small', anchor: 'start' }),
    'stretch-of-graph', 'A horizontal stretch', 'The curve y equals x squared minus 4 (solid) crosses the x-axis at minus 2 and 2. The dashed curve, y equals f of 2x, has the same lowest point on the y-axis but is squashed towards it: it crosses the x-axis at minus 1 and 1.',
  ),
  'reflection-of-graph': done(
    pop({ xmin: -5, xmax: 5, ymin: -1, ymax: 7, xstep: 1, ystep: 1 }).curve((x) => (x - 2) * (x - 2) + 1).curve((x) => (-x - 2) * (-x - 2) + 1, { cls: 'curve-b' })
      .point(2, 1, { label: 'f(x)', dx: 14, dy: 30 }).point(-2, 1, { label: 'f(-x)', dx: -14, dy: 30, anchor: 'end' }),
    'reflection-of-graph', 'A reflection in the y-axis', 'The curve y equals f of x (solid), a U-shape with its lowest point at (2, 1). Its mirror image in the y-axis (dashed) is y equals f of minus x, with its lowest point at (minus 2, 1).',
  ),
  'many-to-one': done(
    pop({ xmin: -3, xmax: 3, ymin: -1, ymax: 5, xstep: 1, ystep: 1 }).curve((x) => x * x).hline(4)
      .point(-2, 4, { label: 'x = -2', dx: -12, dy: -14, anchor: 'end' }).point(2, 4, { label: 'x = 2', dx: 12, dy: -14 }).text(0.0, 2.6, 'y = x^2', { cls: 'alt' }),
    'many-to-one', 'A many-to-one function', 'The curve y equals x squared with a dashed horizontal line at y equals 4. The line meets the curve at two marked points, x equals minus 2 and x equals 2, so two inputs give the same output.',
  ),
  'one-to-one': done(
    pop({ xmin: -3, xmax: 3, ymin: -5, ymax: 5, xstep: 1, ystep: 1 }).curve((x) => 2 * x + 1).hline(3)
      .point(1, 3, { label: 'one input', dx: -12, dy: -16, anchor: 'end' }).text(-1.2, -3.6, 'y = 2x + 1', { cls: 'alt' }),
    'one-to-one', 'A one-to-one function', 'The straight line y equals 2x plus 1 with a dashed horizontal line at y equals 3. The horizontal line meets the line at exactly one point, so each output comes from only one input.',
  ),
  domain: (() => {
    const p = pop({ xmin: -1, xmax: 6, ymin: -1, ymax: 4, xstep: 1, ystep: 1 }).curve((x) => Math.sqrt(x - 1), { from: 1, to: 6 }).point(1, 0, { label: 'x = 1', dx: 12, dy: 26 });
    return done(
      p.raw(bar(p.X(1), p.Y(0), p.X(6), p.Y(0))).text(3.5, 3.4, 'f(x) = sqrt(x - 1)', { cls: 'alt' }).text(3.5, -0.75, 'domain: x \u2265 1', { cls: 'alt', dx: 20 }),
      'domain', 'The domain of a function', 'The curve y equals the square root of (x minus 1). It starts at the point (1, 0) and goes on to the right. The set of x-values the curve uses, x greater than or equal to 1, is marked with a thick line along the x-axis.',
    );
  })(),
  range: (() => {
    const p = pop({ xmin: -3, xmax: 3, ymin: -1.5, ymax: 5, xstep: 1, ystep: 1 }).curve((x) => x * x);
    return done(
      p.raw(bar(p.X(0), p.Y(0), p.X(0), p.Y(5))).text(-0.15, 3.9, 'range', { cls: 'alt', anchor: 'end' }).text(-0.15, 3.1, 'y \u2265 0', { cls: 'alt', anchor: 'end' }).text(0.3, -1.0, 'f(x) = x^2', { cls: 'small', anchor: 'start' }),
      'range', 'The range of a function', 'The curve y equals x squared. Every output is zero or more, so the range is f of x greater than or equal to 0. This is marked with a thick line up the y-axis. The curve never goes below the x-axis.',
    );
  })(),
  'inverse-function': done(
    pop({ xmin: -1, xmax: 5, ymin: -1, ymax: 5, xstep: 1, ystep: 1 }).curve((x) => x * x, { from: 0, to: 2.4 }).curve(Math.sqrt, { cls: 'curve-b', from: 0, to: 5 })
      .straight(1, 0, { cls: 'guide' }).text(3.9, 4.4, 'y = x', { cls: 'small', anchor: 'start', dx: 2 })
      .text(1.5, 3.9, 'f', { cls: 'alt' }).text(4.0, 1.4, 'f^(-1)', { cls: 'alt' }),
    'inverse-function', 'A function and its inverse', 'The curve y equals x squared for x of at least 0, labelled f, and the curve y equals the square root of x, labelled f inverse. A dashed line y equals x runs between them. Each curve is the mirror image of the other in that line.',
  ),
  'self-inverse': done(
    pop({ xmin: -4, xmax: 4, ymin: -4, ymax: 4, xstep: 1, ystep: 1 }).curve((x) => 1 / x).straight(1, 0, { cls: 'guide' })
      .text(2.5, 3.2, 'y = x', { cls: 'small', anchor: 'start' }).text(1.6, 0.9, 'y = 1/x', { cls: 'alt', anchor: 'start', dx: 24 }),
    'self-inverse', 'A self-inverse function', 'The curve y equals 1 over x with the dashed line y equals x. The curve is its own mirror image in the line, so reflecting it in y equals x gives the same curve.',
  ),
  'modulus-function': done(
    pop({ xmin: -3, xmax: 3, ymin: -2.4, ymax: 5, xstep: 1, ystep: 1 }).curve((x) => x * x - 1, { cls: 'curve-c' }).curve((x) => Math.abs(x * x - 1))
      .text(0, 3.4, 'y = |x^2 - 1|', { cls: 'alt' }).text(0, -2.0, 'dotted: y = x^2 - 1', { cls: 'small' }),
    'modulus-function', 'A modulus graph', 'The solid curve is y equals the modulus of (x squared minus 1). It is the dotted curve y equals x squared minus 1, with the part below the x-axis, between minus 1 and 1, reflected upwards. The solid curve never goes below the x-axis.',
  ),
};
