// Pictures for exponentials and logarithms glossary terms (hover pop-up and glossary page): { '<term-id>': '<svg ...>' }.
// Every graph is drawn from its function with plane(). Keys must be ids of terms in ../glossary/exponentials.mjs.
import { plane } from '../figure-lib.mjs';

const TERM = 'graph-svg term-svg';
const TIMES = '\u00d7';

/** A standard pop-up sized graph. */
const graph = (opts, lines = 1) => plane({ width: 440, height: 306 + 26 * (lines - 1), left: 56, right: 44, top: 40, bottom: 58 + 26 * (lines - 1), ...opts });
/** One or more small lines of writing under the graph (use with graph(opts, lines)). */
const notes = (p, ...lines) => lines.forEach((t, i) => p.note(220, 294 + 26 * i, t, { cls: 'small', anchor: 'middle' }));
const note = (p, text) => notes(p, text);

function exponentialFunctionGraph() {
  const p = graph({ xmin: -3.5, xmax: 3.5, ymin: -1.2, ymax: 9, xstep: 1, ystep: 4 }, 2);
  p.curve((x) => 2 ** x);
  p.curve((x) => 0.5 ** x, { cls: 'curve-b' });
  p.point(0, 1, {});
  notes(p, 'solid: y = 2^x    dashed: y = (1/2)^x', 'both curves pass through (0, 1)');
  return p.svg({ id: 'tf-exponential-function', title: 'Graphs of y = 2 to the x and y = a half to the x', desc: 'Two curves above the x-axis. The solid curve y equals 2 to the power x rises faster and faster to the right and gets close to the x-axis on the left. The dashed curve y equals one half to the power x is its mirror image, falling to the right. Both pass through the point (0, 1).', cls: TERM });
}

function exponentialGrowthGraph() {
  const f = (t) => 100 * 2 ** t;
  const p = graph({ xmin: -0.5, xmax: 3.6, ymin: -100, ymax: 950, xstep: 1, ystep: 400, xlabel: 't', ylabel: 'N' }, 2);
  p.curve(f, { from: 0, to: 3.2 });
  for (const t of [0, 1, 2, 3]) p.point(t, f(t), { label: String(f(t)), dx: -12, dy: 4, anchor: 'end' });
  notes(p, 'N = 100 ' + TIMES + ' 2^t', 'each hour the number doubles');
  return p.svg({ id: 'tf-exponential-growth', title: 'Exponential growth: 100 doubling every hour', desc: 'A curve that rises more and more steeply. It passes through the points (0, 100), (1, 200), (2, 400) and (3, 800): each step to the right multiplies the height by 2.', cls: TERM });
}

function exponentialDecayGraph() {
  const f = (t) => 15000 * 0.8 ** t;
  const p = graph({ xmin: -0.7, xmax: 6.6, ymin: -2000, ymax: 17500, xstep: 2, ystep: 5000, xlabel: 't', ylabel: 'V' }, 2);
  p.curve(f, { from: 0, to: 6.2 });
  p.point(0, f(0), { label: '15000', dx: 14, dy: -14 });
  p.point(2, f(2), { label: '9600', dx: 12, dy: -10 });
  p.point(4, f(4), { label: '6144', dx: 12, dy: -10 });
  notes(p, 'V = 15000 ' + TIMES + ' 0.8^t', 'each year the value is multiplied by 0.8');
  return p.svg({ id: 'tf-exponential-decay', title: 'Exponential decay: 15000 losing 20% each year', desc: 'A curve that falls steeply at first and then more and more slowly towards the x-axis. It passes through (0, 15000), (2, 9600) and (4, 6144): each year the value is multiplied by 0.8.', cls: TERM });
}

function growthFactorGraph() {
  const f = (x) => 1.5 ** x;
  const p = graph({ xmin: -0.5, xmax: 3.8, ymin: -0.5, ymax: 4.2, xstep: 1, ystep: 1 });
  p.curve(f, { from: 0, to: 3.5 });
  for (const x of [0, 1, 2, 3]) p.point(x, f(x), {});
  for (const x of [0, 1, 2]) p.text(x + 0.5, f(x + 0.5) + 0.8, TIMES + '1.5', { cls: 'alt small' });
  note(p, 'each step multiplies the height by 1.5');
  return p.svg({ id: 'tf-growth-factor', title: 'Growth factor 1.5', desc: 'The curve y equals 1.5 to the power x, with points at x equals 0, 1, 2 and 3. Between each pair of neighbouring points the label times 1.5 shows that each step to the right multiplies the height by 1.5.', cls: TERM });
}

function halfLifeGraph() {
  const f = (t) => 8 * 0.5 ** (t / 2);
  const p = graph({ xmin: -0.7, xmax: 7.6, ymin: -1, ymax: 9.5, xstep: 2, ystep: 4 });
  p.curve(f, { from: 0, to: 7.2 });
  for (const t of [0, 2, 4, 6]) { p.line(t, 0, t, f(t), { cls: 'guide' }); p.point(t, f(t), { label: `${f(t)} g`, dx: 12, dy: -10 }); }
  note(p, 'every 2 days the mass halves');
  return p.svg({ id: 'tf-half-life', title: 'Half-life of 2 days', desc: 'A decay curve starting at 8 grams. It passes through (2, 4), (4, 2) and (6, 1): each 2 days the mass falls to half of what it was, wherever you start.', cls: TERM });
}

function eulerNumberGraph() {
  const p = graph({ xmin: -3, xmax: 2.4, ymin: -1, ymax: 9, xstep: 1, ystep: 4 });
  p.curve(Math.exp);
  p.tangent(Math.exp, 0, { span: 1.6 });
  p.point(0, 1, {});
  note(p, 'at (0, 1) the gradient of y = e^x is 1');
  return p.svg({ id: 'tf-euler-number', title: 'The curve y = e to the x', desc: 'The curve y equals e to the power x, rising from near zero on the left. A straight tangent is drawn at the point (0, 1). Its gradient is exactly 1, the same as the height of the curve there.', cls: TERM });
}

function naturalExponentialGraph() {
  const p = graph({ xmin: -2.5, xmax: 2.5, ymin: -1, ymax: 9, xstep: 1, ystep: 4 }, 2);
  p.curve((x) => 3 ** x, { cls: 'curve-c' });
  p.curve((x) => 2 ** x, { cls: 'curve-b' });
  p.curve(Math.exp);
  p.point(0, 1, {});
  notes(p, 'solid: y = e^x', 'dashed: y = 2^x    dotted: y = 3^x');
  return p.svg({ id: 'tf-natural-exponential', title: 'The curve y = e to the x between 2 to the x and 3 to the x', desc: 'Three exponential curves that all pass through (0, 1): y equals 2 to the x dashed, y equals e to the x solid and y equals 3 to the x dotted. For x greater than 0 the e curve lies between the other two.', cls: TERM });
}

function logarithmFigure() {
  const p = plane({ width: 400, height: 250, left: 0, right: 0, top: 0, bottom: 0, xmin: 0, xmax: 400, ymin: 0, ymax: 250, grid: false, axes: false, ticks: false });
  p.text(200, 195, 'log_2 8 = 3', { cls: 'alt big' });
  p.text(200, 135, 'says the same as', { cls: 'small' });
  p.text(200, 85, '2^3 = 8', { cls: 'alt big' });
  p.text(200, 35, 'base 2, power 3, result 8', { cls: 'small' });
  return p.svg({ id: 'tf-logarithm', title: 'A logarithm is a power', desc: 'Two lines of writing joined by the words says the same as: log to the base 2 of 8 equals 3, and 2 to the power 3 equals 8. The base is 2, the power is 3 and the result is 8.', cls: TERM });
}

function naturalLogGraph(id, title, desc) {
  const p = plane({ width: 400, height: 430, left: 40, right: 40, top: 40, bottom: 70, xmin: -3, xmax: 5, ymin: -3, ymax: 5, xstep: 2, ystep: 2, tickLabels: false });
  p.straight(1, 0, { cls: 'guide' });
  p.curve(Math.exp);
  p.curve(Math.log, { from: 0.03, cls: 'curve-b' });
  p.point(0, 1, { label: '(0, 1)', dx: -10, dy: -8, anchor: 'end' });
  p.point(1, 0, { label: '(1, 0)', dx: 12, dy: 30 });
  p.note(200, 400, 'solid: y = e^x   dotted: y = x', { cls: 'small', anchor: 'middle' });
  p.note(200, 424, 'dashed: y = ln x', { cls: 'small', anchor: 'middle' });
  return p.svg({ id, title, desc, cls: TERM });
}

function logGraph() {
  const p = graph({ xmin: -1.5, xmax: 9.5, ymin: -3.3, ymax: 4, xstep: 2, ystep: 1 });
  p.curve((x) => Math.log2(x), { from: 0.1 });
  for (const [x, y] of [[1, 0], [2, 1], [4, 2], [8, 3]]) p.point(x, y, x === 1 ? {} : { label: `(${x}, ${y})`, dx: 10, dy: 24 });
  p.text(1.2, -2.5, 'the y-axis is an asymptote', { cls: 'small', anchor: 'start' });
  note(p, 'y = log_2 x passes through (1, 0)');
  return p.svg({ id: 'tf-log-graph', title: 'Graph of y = log to the base 2 of x', desc: 'A curve that rises slowly to the right, passing through (1, 0), (2, 1), (4, 2) and (8, 3). It exists only to the right of the y-axis. As x gets close to 0 the curve drops down without ever touching the y-axis, which is an asymptote.', cls: TERM });
}

function exponentialEquationGraph() {
  const x0 = Math.log2(10);
  const p = graph({ xmin: -1.2, xmax: 5.2, ymin: -2, ymax: 18, xstep: 1, ystep: 5 });
  p.curve((x) => 2 ** x);
  p.hline(10, { cls: 'curve-b' });
  p.drop(x0, 10);
  p.point(x0, 10, {});
  p.text(x0, 0, 'x = 3.32', { cls: 'small alt', dy: 56 });
  p.text(0.4, 7, 'y = 2^x', { cls: 'alt', anchor: 'start' });
  p.text(5.1, 10, 'y = 10', { cls: 'small', anchor: 'end', dy: -10 });
  return p.svg({ id: 'tf-exponential-equation', title: 'Solving 2 to the x equals 10', desc: 'The curve y equals 2 to the power x and the dashed line y equals 10. They cross at the point where x is about 3.32, marked with a dashed drop line to the x-axis. That value of x is the solution of 2 to the x equals 10.', cls: TERM });
}

function straightLineLogGraph({ id, title, desc, xlabel, f, g, gradX, gradLabel, interceptLabel, xmin, xmax, ymin, ymax }) {
  const p = graph({ xmin, xmax, ymin, ymax, xstep: 1, ystep: 1, xlabel, ylabel: 'log y', right: 72 });
  p.curve(f);
  p.point(0, g.c, {});
  const x1 = gradX;
  const x2 = gradX + g.run;
  p.line(x1, f(x1), x2, f(x1), { cls: 'guide' }).line(x2, f(x1), x2, f(x2), { cls: 'guide' });
  p.text(x2, (f(x1) + f(x2)) / 2, gradLabel, { cls: 'alt small', anchor: 'start', dx: 12, dy: 6 });
  note(p, interceptLabel);
  return p.svg({ id, title, desc, cls: TERM });
}

const logLogGraph = () => straightLineLogGraph({
  id: 'tf-log-log-graph', xlabel: 'log x', f: (x) => 2 * x + Math.log10(3), g: { c: Math.log10(3), run: 0.5 }, gradX: 0.4, gradLabel: 'gradient = n', interceptLabel: 'line meets the vertical axis at log a',
  xmin: -0.8, xmax: 2.4, ymin: -1, ymax: 4,
  title: 'A log-log graph is a straight line', desc: 'A straight line sloping upwards on axes labelled log x and log y. It crosses the vertical axis at a height marked intercept equals log a. A small dashed right-angled triangle on the line shows its gradient, labelled gradient equals n.',
});

const semiLogGraph = () => straightLineLogGraph({
  id: 'tf-semi-log-graph', xlabel: 'x', f: (x) => x * Math.log10(3) + Math.log10(2), g: { c: Math.log10(2), run: 2 }, gradX: 1, gradLabel: 'gradient = log b', interceptLabel: 'line meets the vertical axis at log k',
  xmin: -1, xmax: 8.2, ymin: -0.6, ymax: 4.2,
  title: 'A semi-log graph is a straight line', desc: 'A straight line sloping gently upwards on axes labelled x and log y. It crosses the vertical axis at a height marked intercept equals log k. A small dashed right-angled triangle on the line shows its gradient, labelled gradient equals log b.',
});

function exponentialModelGraph() {
  const f = (t) => 500 * 1.04 ** t;
  const p = graph({ xmin: -1, xmax: 11, ymin: -120, ymax: 900, xstep: 5, ystep: 300, xlabel: 't', ylabel: 'S' });
  p.curve(f, { from: 0, to: 10.5 });
  p.point(0, 500, { label: 'A = 500', dx: 14, dy: 34 });
  p.text(6.5, 440, 'S = 500 ' + TIMES + ' 1.04^t', { cls: 'alt' });
  note(p, 'A is the value when t = 0');
  return p.svg({ id: 'tf-exponential-model', title: 'An exponential model: 500 growing at 4% a year', desc: 'A gently rising curve S equals 500 times 1.04 to the power t, drawn for t from 0 to 10. It starts at the point (0, 500), marked A equals 500, the starting value.', cls: TERM });
}

function continuousGrowthGraph() {
  const f = (t) => Math.exp(0.5 * t);
  const p = graph({ xmin: -0.6, xmax: 4.6, ymin: -0.8, ymax: 9, xstep: 1, ystep: 4, xlabel: 't', ylabel: 'P' }, 2);
  p.curve(f, { from: 0, to: 4.2 });
  p.tangent(f, 1, { span: 1.1 }).tangent(f, 3, { span: 1.1 });
  p.point(1, f(1), {});
  p.point(3, f(3), {});
  notes(p, 'small P: gentle gradient;  bigger P: steeper', 'the gradient is proportional to P');
  return p.svg({ id: 'tf-continuous-growth-model', title: 'Rate of growth proportional to size', desc: 'The curve P equals e to the power 0.5t. Tangent lines are drawn at two points. At the left point, where P is small, the tangent is gentle. At the right point, where P is bigger, the tangent is steeper: the gradient is proportional to P.', cls: TERM });
}

export const FIGS = {
  'exponential-function': exponentialFunctionGraph(),
  'exponential-growth': exponentialGrowthGraph(),
  'exponential-decay': exponentialDecayGraph(),
  'growth-factor': growthFactorGraph(),
  'half-life': halfLifeGraph(),
  'euler-number': eulerNumberGraph(),
  'natural-exponential': naturalExponentialGraph(),
  logarithm: logarithmFigure(),
  'natural-logarithm': naturalLogGraph('tf-natural-logarithm', 'ln x as the mirror image of e to the x', 'The curve y equals e to the x, solid, and the curve y equals ln x, dashed, drawn with equal scales on both axes. They are mirror images of each other in the dotted line y equals x. The first passes through (0, 1) and the second through (1, 0).'),
  'log-graph': logGraph(),
  'exponential-equation': exponentialEquationGraph(),
  'log-log-graph': logLogGraph(),
  'semi-log-graph': semiLogGraph(),
  'exponential-model': exponentialModelGraph(),
  'continuous-growth-model': continuousGrowthGraph(),
};
