// Figures for the Graphs of polynomials and reciprocals topic page (src/pages/courses/a-level/graphs-polynomials.html).
//
// Every curve is drawn FROM the function listed for it in CURVES, so a picture cannot disagree with its equation.
// Each picture is a sketch: no grid and no scale numbers, because a cubic or a reciprocal graph is steep and the two
// axes do not share a scale. What matters is marked on the picture itself, with its coordinates. The equation (or a
// key naming each curve) sits in a band above the graph, so no label sits on a curve.
//
// test/alevel-graphs-polynomials.spec.ts reads GEOM, CURVES and ITEMS to check each curve, each marked point and each
// asymptote against the page's own numbers, and checks that every label is nearest its own item.
import { plane, label } from '../figure-lib.mjs';

/** The size and range of each picture, kept so a test can turn a pixel back into graph coordinates. */
export const GEOM = {};
/** The curves of each picture in the order they are drawn: { name, cls, fn }. */
export const CURVES = {};
/** What is marked on each picture: { name, kind: 'point', x, y } or { name, kind: 'vline', x } or { name, kind: 'hline', y }. */
export const ITEMS = {};

const W = 720;
const LEFT = 64;
const RIGHT = 48;
const BOTTOM = 52;
const ROW = 46; // the height of one row of the band above the graph

/** A plane with no grid and no scale numbers, and a band above it for `rows` lines of text. */
function sketch(id, { xmin, xmax, ymin, ymax, rows = 1, height = 520 }) {
  const top = 64 + ROW * rows;
  GEOM[id] = { width: W, height, left: LEFT, right: RIGHT, top, bottom: BOTTOM, xmin, xmax, ymin, ymax };
  CURVES[id] = [];
  ITEMS[id] = [];
  return plane({ grid: false, ticks: false, tickLabels: false, width: W, height, top, xmin, xmax, ymin, ymax });
}

/** One line of text in the band above the graph (row 0 is the top one). */
const band = (p, row, text) => p.note(LEFT, 40 + ROW * row, text, { cls: 'alt' });

/** A key row: a sample of how a curve is drawn, then what it is. */
function keyRow(p, row, cls, text) {
  const y = 40 + ROW * row;
  p.raw(`<line class="${cls}" x1="${LEFT}" y1="${y - 8}" x2="${LEFT + 56}" y2="${y - 8}"/>`);
  p.note(LEFT + 72, y, text, { cls: 'alt' });
}

/** Draw curves from their functions, and remember them for the test. */
function draw(p, id, curves) {
  for (const c of curves) {
    CURVES[id].push({ name: c.name, cls: c.cls ?? 'curve', fn: c.fn });
    p.curve(c.fn, { cls: c.cls ?? 'curve' });
  }
}

const f2 = (n) => (Math.round(n * 100) / 100).toString();

/** A marked point with its label. The label is a <text data-for="name"> so a test can find which item it belongs to. */
function mark(p, id, { name, x, y, text, dx = 14, dy = -14, anchor = 'start' }) {
  ITEMS[id].push({ name, kind: 'point', x, y });
  p.raw(`<circle class="pt" data-name="${name}" cx="${f2(p.X(x))}" cy="${f2(p.Y(y))}" r="7"/>`);
  if (text) p.raw(`<text class="svg-t" data-for="${name}" x="${f2(p.X(x) + dx)}" y="${f2(p.Y(y) + dy)}" text-anchor="${anchor}">${label(text)}</text>`);
}

/**
 * The equation of an asymptote, written beside it. `x` is a vertical asymptote, `y` a horizontal one. `at` is where the
 * text sits, in graph units. Every asymptote on this page IS an axis (x = 0 or y = 0), so no extra line is drawn: the
 * axis already shows it. (A dashed asymptote that is not an axis comes with Transformations of graphs.)
 */
function asymptote(p, id, { name, x, y, text, at, dx = 0, dy = 0, anchor = 'start' }) {
  ITEMS[id].push(x !== undefined ? { name, kind: 'vline', x } : { name, kind: 'hline', y });
  p.raw(`<text class="svg-t alt" data-for="${name}" x="${f2(p.X(at[0]) + dx)}" y="${f2(p.Y(at[1]) + dy)}" text-anchor="${anchor}">${label(text)}</text>`);
}

/** Labels get a halo in the page colour, so a label that crosses an axis or a guide stays readable. */
const finish = (p, meta) => p.svg(meta).replaceAll('<text class="svg-t', '<text style="paint-order:stroke;stroke:var(--paper);stroke-width:8px;stroke-linejoin:round" class="svg-t');

// ---- the functions each picture is drawn from (the test holds its own copy of these) ----
const cubic = (x) => x ** 3;
const negCubic = (x) => -(x ** 3);
const quartic = (x) => x ** 4;
const negQuartic = (x) => -(x ** 4);
const cubicThree = (x) => (x + 2) * (x - 1) * (x - 3);
const cubicTouch = (x) => (x + 3) * (x - 1) ** 2;
const cubicNeg = (x) => (2 - x) * (x + 1) ** 2;
const cubicTriple = (x) => (x - 1) ** 3;
const quarticFour = (x) => (x + 3) * (x + 1) * (x - 2) * (x - 4);
const quarticDouble = (x) => (x + 2) ** 2 * (x - 1) * (x - 3);
const quarticFlat = (x) => x ** 4 - 4 * x ** 2;
const quarticTwo = (x) => (x + 1) ** 2 * (x - 2) ** 2;
const recipPos = (x) => 6 / x;
const recipNeg = (x) => -6 / x;
const recipSq = (x) => 4 / x ** 2;
const line1 = (x) => x + 1;
const cubicMeet = (x) => x ** 3 - 4 * x;
const lineMeet = (x) => -3 * x;
const hyper8 = (x) => 8 / x;
const parab = (x) => x ** 2;
const flipBack = (x) => 2 * (x + 1) * (x - 2) ** 2;
const qCubic = (x) => -(x + 2) * (x - 3) ** 2;

export const FIGURES = {
  // ---- 1. the ends of a graph of odd degree: they point in opposite directions ----
  'graphs-polynomials-ends-odd': () => {
    const id = 'graphs-polynomials-ends-odd';
    const p = sketch(id, { xmin: -2.1, xmax: 2.1, ymin: -9.5, ymax: 9.5, rows: 2 });
    keyRow(p, 0, 'curve', 'y = x^3  (the x^3 term is positive)');
    keyRow(p, 1, 'curve-b', 'y = -x^3  (the x^3 term is negative)');
    draw(p, id, [{ name: 'positive', fn: cubic }, { name: 'negative', cls: 'curve-b', fn: negCubic }]);
    return finish(p, {
      id,
      title: 'The graphs of y = x cubed and y = minus x cubed: the two ends point in opposite directions',
      desc: 'Two curves through the origin. The solid curve, y equals x cubed, comes up from the bottom left and goes on up to the top right. The dashed curve, y equals minus x cubed, comes down from the top left and goes on down to the bottom right. In each curve the left end and the right end point in opposite directions.',
    });
  },

  // ---- 1. the ends of a graph of even degree: they point the same way ----
  'graphs-polynomials-ends-even': () => {
    const id = 'graphs-polynomials-ends-even';
    const p = sketch(id, { xmin: -2.1, xmax: 2.1, ymin: -19, ymax: 19, rows: 2 });
    keyRow(p, 0, 'curve', 'y = x^4  (the x^4 term is positive)');
    keyRow(p, 1, 'curve-b', 'y = -x^4  (the x^4 term is negative)');
    draw(p, id, [{ name: 'positive', fn: quartic }, { name: 'negative', cls: 'curve-b', fn: negQuartic }]);
    return finish(p, {
      id,
      title: 'The graphs of y = x to the power 4 and y = minus x to the power 4: both ends point the same way',
      desc: 'Two curves that both touch the x-axis at the origin. The solid curve, y equals x to the power 4, has both ends going up, like a flat-bottomed bowl. The dashed curve, y equals minus x to the power 4, is its mirror image in the x-axis and has both ends going down. In each curve the left end and the right end point the same way.',
    });
  },

  // ---- 2. a cubic with three roots: y = (x + 2)(x - 1)(x - 3) ----
  'graphs-polynomials-cubic-three': () => {
    const id = 'graphs-polynomials-cubic-three';
    const p = sketch(id, { xmin: -3, xmax: 4, ymin: -27, ymax: 21 });
    band(p, 0, 'y = (x + 2)(x - 1)(x - 3)');
    draw(p, id, [{ name: 'cubic', fn: cubicThree }]);
    mark(p, id, { name: 'r1', x: -2, y: 0, text: '(-2, 0)', dx: 14, dy: 40 });
    mark(p, id, { name: 'r2', x: 1, y: 0, text: '(1, 0)', dx: -14, dy: 40, anchor: 'end' });
    mark(p, id, { name: 'r3', x: 3, y: 0, text: '(3, 0)', dx: 14, dy: 40 });
    mark(p, id, { name: 'yint', x: 0, y: 6, text: '(0, 6)', dx: 16, dy: -16 });
    return finish(p, {
      id,
      title: 'The graph of y = (x + 2)(x - 1)(x - 3) crosses the x-axis at -2, 1 and 3 and the y-axis at 6',
      desc: 'A cubic curve that comes up from the bottom left, crosses the x-axis at the marked point (-2, 0), reaches a high point close to the left of the y-axis, falls through the marked point (0, 6) on the y-axis, crosses the x-axis again at (1, 0), reaches a low point below the axis, then crosses the axis a third time at (3, 0) and keeps rising. The curve crosses the axis at all three roots.',
    });
  },

  // ---- 2. a cubic with a repeated root: y = (x + 3)(x - 1)^2 ----
  'graphs-polynomials-cubic-touch': () => {
    const id = 'graphs-polynomials-cubic-touch';
    const p = sketch(id, { xmin: -4, xmax: 3, ymin: -28, ymax: 27 });
    band(p, 0, 'y = (x + 3)(x - 1)^2');
    draw(p, id, [{ name: 'cubic', fn: cubicTouch }]);
    mark(p, id, { name: 'cross', x: -3, y: 0, text: '(-3, 0)', dx: 14, dy: 40 });
    mark(p, id, { name: 'touch', x: 1, y: 0, text: '(1, 0)', dx: 0, dy: 44, anchor: 'middle' });
    mark(p, id, { name: 'yint', x: 0, y: 3, text: '(0, 3)', dx: -16, dy: 40, anchor: 'end' });
    return finish(p, {
      id,
      title: 'The graph of y = (x + 3)(x - 1) squared crosses the x-axis at -3 and touches it at 1',
      desc: 'A cubic curve that comes up from the bottom left and crosses the x-axis at the marked point (-3, 0). It rises to a high point, then falls through the marked point (0, 3) on the y-axis. The curve comes down to the x-axis at the marked point (1, 0), touches it without crossing, and turns back up. It keeps rising to the right.',
    });
  },

  // ---- 2. a cubic with a negative x^3 coefficient: y = (2 - x)(x + 1)^2 ----
  'graphs-polynomials-cubic-negative': () => {
    const id = 'graphs-polynomials-cubic-negative';
    const p = sketch(id, { xmin: -2, xmax: 3, ymin: -18, ymax: 8 });
    band(p, 0, 'y = (2 - x)(x + 1)^2');
    draw(p, id, [{ name: 'cubic', fn: cubicNeg }]);
    mark(p, id, { name: 'touch', x: -1, y: 0, text: '(-1, 0)', dx: 0, dy: 44, anchor: 'middle' });
    mark(p, id, { name: 'cross', x: 2, y: 0, text: '(2, 0)', dx: -14, dy: 40, anchor: 'end' });
    mark(p, id, { name: 'yint', x: 0, y: 2, text: '(0, 2)', dx: -16, dy: -16, anchor: 'end' });
    return finish(p, {
      id,
      title: 'The graph of y = (2 - x)(x + 1) squared touches the x-axis at -1, crosses it at 2, and falls away to the right',
      desc: 'A cubic curve that starts high on the left and comes down to the x-axis at the marked point (-1, 0). It touches the axis without crossing and turns back up. It rises through the marked point (0, 2) on the y-axis to a high point, then falls and crosses the x-axis at the marked point (2, 0). It keeps falling to the right, so the right end points down.',
    });
  },

  // ---- 2. a triple root: y = (x - 1)^3 crosses, but flattens as it does ----
  'graphs-polynomials-cubic-triple': () => {
    const id = 'graphs-polynomials-cubic-triple';
    const p = sketch(id, { xmin: -1, xmax: 3, ymin: -9, ymax: 9 });
    band(p, 0, 'y = (x - 1)^3');
    draw(p, id, [{ name: 'cubic', fn: cubicTriple }]);
    mark(p, id, { name: 'root', x: 1, y: 0, text: '(1, 0)', dx: 14, dy: 40 });
    mark(p, id, { name: 'yint', x: 0, y: -1, text: '(0, -1)', dx: 14, dy: 40 });
    return finish(p, {
      id,
      title: 'The graph of y = (x - 1) cubed crosses the x-axis at 1 and flattens out as it crosses',
      desc: 'A cubic curve that comes up from the bottom left, flattens out as it reaches the marked point (1, 0) on the x-axis, crosses the axis there, and keeps rising to the top right. It meets the y-axis at the marked point (0, -1). It crosses the axis, but with a flat spot at the crossing.',
    });
  },

  // ---- 3. a quartic with four roots: y = (x + 3)(x + 1)(x - 2)(x - 4) ----
  'graphs-polynomials-quartic-four': () => {
    const id = 'graphs-polynomials-quartic-four';
    const p = sketch(id, { xmin: -3.6, xmax: 4.6, ymin: -30, ymax: 72 });
    band(p, 0, 'y = (x + 3)(x + 1)(x - 2)(x - 4)');
    draw(p, id, [{ name: 'quartic', fn: quarticFour }]);
    mark(p, id, { name: 'r1', x: -3, y: 0, text: '(-3, 0)', dx: 14, dy: -16 });
    mark(p, id, { name: 'r2', x: -1, y: 0, text: '(-1, 0)', dx: 14, dy: 40 });
    mark(p, id, { name: 'r3', x: 2, y: 0, text: '(2, 0)', dx: 14, dy: -16 });
    mark(p, id, { name: 'r4', x: 4, y: 0, text: '(4, 0)', dx: 14, dy: 40 });
    mark(p, id, { name: 'yint', x: 0, y: 24, text: '(0, 24)', dx: -16, dy: -14, anchor: 'end' });
    return finish(p, {
      id,
      title: 'The graph of y = (x + 3)(x + 1)(x - 2)(x - 4) crosses the x-axis at four points and meets the y-axis at 24',
      desc: 'A quartic curve shaped like the letter W. It comes down from the top left, crosses the x-axis at the marked point (-3, 0), reaches a low point, then crosses the axis again at (-1, 0). It rises past the marked point (0, 24) on the y-axis to a high point, falls and crosses the axis at (2, 0), reaches a second low point, then crosses at (4, 0) and rises to the top right. Both ends point up.',
    });
  },

  // ---- 3. a quartic with a repeated root: y = (x + 2)^2 (x - 1)(x - 3) ----
  'graphs-polynomials-quartic-double': () => {
    const id = 'graphs-polynomials-quartic-double';
    const p = sketch(id, { xmin: -3.2, xmax: 3.6, ymin: -22, ymax: 54 });
    band(p, 0, 'y = (x + 2)^2 (x - 1)(x - 3)');
    draw(p, id, [{ name: 'quartic', fn: quarticDouble }]);
    mark(p, id, { name: 'touch', x: -2, y: 0, text: '(-2, 0)', dx: 0, dy: 44, anchor: 'middle' });
    mark(p, id, { name: 'r2', x: 1, y: 0, text: '(1, 0)', dx: 14, dy: -16 });
    mark(p, id, { name: 'r3', x: 3, y: 0, text: '(3, 0)', dx: 14, dy: 40 });
    mark(p, id, { name: 'yint', x: 0, y: 12, text: '(0, 12)', dx: 16, dy: -16 });
    return finish(p, {
      id,
      title: 'The graph of y = (x + 2) squared (x - 1)(x - 3) touches the x-axis at -2 and crosses it at 1 and 3',
      desc: 'A quartic curve with both ends pointing up. It comes down from the top left to the x-axis at the marked point (-2, 0), touches the axis without crossing and turns back up. It reaches a high point close to the y-axis, passing the marked point (0, 12), then falls and crosses the axis at (1, 0). It reaches a low point below the axis, crosses again at (3, 0) and rises to the top right.',
    });
  },

  // ---- 3. an expanded quartic: y = x^4 - 4x^2 = x^2 (x - 2)(x + 2) ----
  'graphs-polynomials-quartic-flat': () => {
    const id = 'graphs-polynomials-quartic-flat';
    const p = sketch(id, { xmin: -2.4, xmax: 2.4, ymin: -6, ymax: 12 });
    band(p, 0, 'y = x^4 - 4x^2 = x^2 (x - 2)(x + 2)');
    draw(p, id, [{ name: 'quartic', fn: quarticFlat }]);
    mark(p, id, { name: 'r1', x: -2, y: 0, text: '(-2, 0)', dx: 14, dy: -16 });
    mark(p, id, { name: 'origin', x: 0, y: 0, text: '(0, 0)', dx: 0, dy: -20, anchor: 'middle' });
    mark(p, id, { name: 'r3', x: 2, y: 0, text: '(2, 0)', dx: 14, dy: 40 });
    return finish(p, {
      id,
      title: 'The graph of y = x to the power 4 minus 4x squared crosses the x-axis at -2 and 2 and touches it at 0',
      desc: 'A quartic curve shaped like the letter W, with both ends pointing up. It crosses the x-axis at the marked point (-2, 0), dips below the axis, then rises to touch the axis at the origin, the marked point (0, 0), from below without crossing. It dips below the axis again and crosses at the marked point (2, 0), then rises to the top right.',
    });
  },

  // ---- 3. two repeated roots: y = (x + 1)^2 (x - 2)^2 ----
  'graphs-polynomials-quartic-two': () => {
    const id = 'graphs-polynomials-quartic-two';
    const p = sketch(id, { xmin: -2.2, xmax: 3.2, ymin: -3, ymax: 28 });
    band(p, 0, 'y = (x + 1)^2 (x - 2)^2');
    draw(p, id, [{ name: 'quartic', fn: quarticTwo }]);
    mark(p, id, { name: 't1', x: -1, y: 0, text: '(-1, 0)', dx: 0, dy: 44, anchor: 'middle' });
    mark(p, id, { name: 't2', x: 2, y: 0, text: '(2, 0)', dx: 0, dy: 44, anchor: 'middle' });
    mark(p, id, { name: 'yint', x: 0, y: 4, text: '(0, 4)', dx: -16, dy: -16, anchor: 'end' });
    return finish(p, {
      id,
      title: 'The graph of y = (x + 1) squared (x - 2) squared touches the x-axis at -1 and at 2',
      desc: 'A quartic curve shaped like the letter W, with both ends pointing up. It comes down from the top left to the marked point (-1, 0), touches the x-axis without crossing and turns back up. It rises past the marked point (0, 4) on the y-axis to a small hump, then falls to touch the axis again at the marked point (2, 0) and rises to the top right. It never goes below the axis.',
    });
  },

  // ---- 4. y = a/x with a positive: branches in the top right and bottom left ----
  'graphs-polynomials-recip-pos': () => {
    const id = 'graphs-polynomials-recip-pos';
    const p = sketch(id, { xmin: -7, xmax: 7, ymin: -7, ymax: 7, height: 560 });
    band(p, 0, 'y = 6/x');
    draw(p, id, [{ name: 'hyperbola', fn: recipPos }]);
    asymptote(p, id, { name: 'va', x: 0, text: 'x = 0', at: [0, -5.5], dx: 14 });
    asymptote(p, id, { name: 'ha', y: 0, text: 'y = 0', at: [-6.9, 0], dy: -16 });
    mark(p, id, { name: 'p1', x: 1, y: 6, text: '(1, 6)', dx: 16, dy: -8 });
    mark(p, id, { name: 'p2', x: 2, y: 3, text: '(2, 3)', dx: 16, dy: -14 });
    mark(p, id, { name: 'p6', x: 6, y: 1, text: '(6, 1)', dx: 0, dy: -22, anchor: 'middle' });
    mark(p, id, { name: 'pn', x: -2, y: -3, text: '(-2, -3)', dx: -16, dy: 34, anchor: 'end' });
    return finish(p, {
      id,
      title: 'The graph of y = 6 over x has one branch in the top right and one in the bottom left',
      desc: 'A curve in two separate pieces, called branches. One branch is in the top right: it falls from very high values near the y-axis, through the marked points (1, 6), (2, 3) and (6, 1), and flattens out close to the x-axis. The other branch is in the bottom left and is the first branch turned half a turn about the origin, passing through the marked point (-2, -3). The two axes are the asymptotes. They are labelled x = 0 and y = 0, and the curve gets closer and closer to them but never touches them.',
    });
  },

  // ---- 4. y = a/x with a negative: branches in the top left and bottom right ----
  'graphs-polynomials-recip-neg': () => {
    const id = 'graphs-polynomials-recip-neg';
    const p = sketch(id, { xmin: -7, xmax: 7, ymin: -7, ymax: 7, height: 560 });
    band(p, 0, 'y = -6/x');
    draw(p, id, [{ name: 'hyperbola', fn: recipNeg }]);
    asymptote(p, id, { name: 'va', x: 0, text: 'x = 0', at: [0, 5.5], dx: 14 });
    asymptote(p, id, { name: 'ha', y: 0, text: 'y = 0', at: [-6.9, 0], dy: 36 });
    mark(p, id, { name: 'p1', x: -2, y: 3, text: '(-2, 3)', dx: -16, dy: -14, anchor: 'end' });
    mark(p, id, { name: 'p2', x: 2, y: -3, text: '(2, -3)', dx: 14, dy: 40 });
    return finish(p, {
      id,
      title: 'The graph of y = minus 6 over x has one branch in the top left and one in the bottom right',
      desc: 'A curve in two separate branches. One branch is in the top left: it rises steeply close to the y-axis and flattens out close to the x-axis on the left, passing through the marked point (-2, 3). The other branch is in the bottom right and passes through the marked point (2, -3). Both axes are the asymptotes. They are labelled x = 0 and y = 0, and the curve gets closer and closer to them but never touches them.',
    });
  },

  // ---- 4. y = a/x^2: both branches on the same side of the x-axis ----
  'graphs-polynomials-recip-sq': () => {
    const id = 'graphs-polynomials-recip-sq';
    const p = sketch(id, { xmin: -5, xmax: 5, ymin: -3, ymax: 9, height: 540 });
    band(p, 0, 'y = 4/x^2');
    draw(p, id, [{ name: 'curve', fn: recipSq }]);
    asymptote(p, id, { name: 'va', x: 0, text: 'x = 0', at: [0, -2.2], dx: 14 });
    asymptote(p, id, { name: 'ha', y: 0, text: 'y = 0', at: [-4.9, 0], dy: 40 });
    mark(p, id, { name: 'p1', x: 1, y: 4, text: '(1, 4)', dx: 16, dy: -8 });
    mark(p, id, { name: 'p2', x: -1, y: 4, text: '(-1, 4)', dx: -16, dy: -8, anchor: 'end' });
    mark(p, id, { name: 'p3', x: 2, y: 1, text: '(2, 1)', dx: 14, dy: -18 });
    mark(p, id, { name: 'p4', x: -2, y: 1, text: '(-2, 1)', dx: -14, dy: -18, anchor: 'end' });
    return finish(p, {
      id,
      title: 'The graph of y = 4 over x squared has two branches that are both above the x-axis',
      desc: 'A curve in two separate branches that are mirror images of each other in the y-axis, both above the x-axis. The right branch falls from very high values close to the y-axis, through the marked points (1, 4) and (2, 1), and flattens out close to the x-axis. The left branch passes through the marked points (-1, 4) and (-2, 1). The two axes are the asymptotes. They are labelled x = 0 and y = 0, and the curve gets closer and closer to them but never touches them.',
    });
  },

  // ---- 5. where y = 6/x meets y = x + 1 ----
  'graphs-polynomials-meet-recip': () => {
    const id = 'graphs-polynomials-meet-recip';
    const p = sketch(id, { xmin: -6, xmax: 6, ymin: -7, ymax: 7, rows: 2, height: 600 });
    keyRow(p, 0, 'curve', 'y = 6/x');
    keyRow(p, 1, 'curve-b', 'y = x + 1');
    draw(p, id, [{ name: 'hyperbola', fn: recipPos }, { name: 'line', cls: 'curve-b', fn: line1 }]);
    mark(p, id, { name: 'a', x: 2, y: 3, text: '(2, 3)', dx: 56, dy: 8 });
    mark(p, id, { name: 'b', x: -3, y: -2, text: '(-3, -2)', dx: 56, dy: 8 });
    return finish(p, {
      id,
      title: 'The graph of y = 6 over x and the line y = x + 1 meet at two points',
      desc: 'A reciprocal curve with one branch in the top right and one in the bottom left, and a dashed straight line that rises from the bottom left to the top right. The line crosses the top right branch at the marked point (2, 3) and the bottom left branch at the marked point (-3, -2). The curve and the line meet at two points.',
    });
  },

  // ---- 5. where a cubic meets a line: three points ----
  'graphs-polynomials-meet-cubic': () => {
    const id = 'graphs-polynomials-meet-cubic';
    const p = sketch(id, { xmin: -2.6, xmax: 2.6, ymin: -8, ymax: 8, rows: 2, height: 560 });
    keyRow(p, 0, 'curve', 'y = x^3 - 4x');
    keyRow(p, 1, 'curve-b', 'y = -3x');
    draw(p, id, [{ name: 'cubic', fn: cubicMeet }, { name: 'line', cls: 'curve-b', fn: lineMeet }]);
    mark(p, id, { name: 'a', x: -1, y: 3, text: '(-1, 3)', dx: 14, dy: -14 });
    mark(p, id, { name: 'o', x: 0, y: 0, text: '(0, 0)', dx: 14, dy: -14 });
    mark(p, id, { name: 'b', x: 1, y: -3, text: '(1, -3)', dx: -14, dy: 40, anchor: 'end' });
    return finish(p, {
      id,
      title: 'The cubic y = x cubed - 4x and the line y = minus 3x meet at three points',
      desc: 'A cubic curve that rises to a high point on the left, falls through the origin to a low point on the right, then rises again. A dashed straight line falls steadily from the top left to the bottom right through the origin. The line meets the cubic at three points: the marked points (-1, 3), (0, 0) and (1, -3).',
    });
  },

  // ---- 5. a sketch shows how many times two graphs meet: y = 8/x and y = x^2 meet once ----
  'graphs-polynomials-meet-once': () => {
    const id = 'graphs-polynomials-meet-once';
    const p = sketch(id, { xmin: -4, xmax: 4, ymin: -9, ymax: 10, rows: 2, height: 560 });
    keyRow(p, 0, 'curve', 'y = 8/x');
    keyRow(p, 1, 'curve-b', 'y = x^2');
    draw(p, id, [{ name: 'hyperbola', fn: hyper8 }, { name: 'parabola', cls: 'curve-b', fn: parab }]);
    mark(p, id, { name: 'a', x: 2, y: 4, text: '(2, 4)', dx: 60, dy: 2 });
    return finish(p, {
      id,
      title: 'The graph of y = 8 over x and the graph of y = x squared meet at one point only',
      desc: 'A reciprocal curve with one branch in the top right and one in the bottom left, and a dashed U-shaped curve, y equals x squared, that is above the x-axis everywhere. The bottom left branch is below the x-axis, so it never meets the U-shaped curve. The top right branch meets it once, at the marked point (2, 4).',
    });
  },

  // ---- 6. flip it, backwards: from a graph to its equation ----
  'graphs-polynomials-flip-back': () => {
    const id = 'graphs-polynomials-flip-back';
    const p = sketch(id, { xmin: -1.8, xmax: 3.2, ymin: -26, ymax: 14 });
    band(p, 0, 'y = k(x + 1)(x - 2)^2');
    draw(p, id, [{ name: 'cubic', fn: flipBack }]);
    mark(p, id, { name: 'cross', x: -1, y: 0, text: '(-1, 0)', dx: 14, dy: 40 });
    mark(p, id, { name: 'touch', x: 2, y: 0, text: '(2, 0)', dx: 0, dy: 44, anchor: 'middle' });
    mark(p, id, { name: 'yint', x: 0, y: 8, text: '(0, 8)', dx: 16, dy: -16 });
    return finish(p, {
      id,
      title: 'A cubic that crosses the x-axis at -1, touches it at 2 and passes through (0, 8)',
      desc: 'A cubic curve that comes up from the bottom left and crosses the x-axis at the marked point (-1, 0). It reaches a high point on the y-axis at the marked point (0, 8), then falls to the x-axis at the marked point (2, 0), touches it without crossing, and turns back up. The curve passes through three marked points, and its equation has an unknown number k in front of the factors.',
    });
  },

  // ---- question figures: the picture shows the facts, never the answer ----
  'graphs-polynomials-q-cubic': () => {
    const id = 'graphs-polynomials-q-cubic';
    const p = sketch(id, { xmin: -3, xmax: 4.5, ymin: -24, ymax: 40, height: 520 });
    draw(p, id, [{ name: 'cubic', fn: qCubic }]);
    mark(p, id, { name: 'cross', x: -2, y: 0, text: '(-2, 0)', dx: 14, dy: -16 });
    mark(p, id, { name: 'touch', x: 3, y: 0, text: '(3, 0)', dx: 0, dy: -20, anchor: 'middle' });
    mark(p, id, { name: 'yint', x: 0, y: -18, text: '(0, -18)', dx: 16, dy: 36 });
    return finish(p, {
      id,
      title: 'A cubic curve with three marked points',
      desc: 'A cubic curve that comes down from the top left and crosses the x-axis at the left marked point. It dips below the axis, passes through the marked point on the y-axis, then rises to meet the x-axis at the right marked point. There it touches the axis without crossing and turns back down. The right end points down.',
    });
  },

  'graphs-polynomials-q-recip': () => {
    const id = 'graphs-polynomials-q-recip';
    const p = sketch(id, { xmin: -7, xmax: 7, ymin: -7, ymax: 7, height: 560 });
    draw(p, id, [{ name: 'hyperbola', fn: recipNeg }]);
    mark(p, id, { name: 'p', x: 3, y: -2, text: '(3, -2)', dx: 14, dy: 40 });
    return finish(p, {
      id,
      title: 'A reciprocal curve with one marked point',
      desc: 'A curve in two separate branches, each getting closer to the two axes without touching them. One point on the curve is marked.',
    });
  },
};
