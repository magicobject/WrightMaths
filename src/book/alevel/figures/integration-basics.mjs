// Figures for the topic "Integration as reverse differentiation" (src/pages/courses/a-level/integration-basics.html).
// Every graph is drawn from its function with plane() (../figure-lib.mjs). The picture-only diagrams (arrows and
// boxes) are drawn on a blank plane() with the small helpers below. One idea per figure; labels are on the picture.
import { plane, label } from '../figure-lib.mjs';

const r = (n) => Math.round(n * 100) / 100;

// ---------- helpers for the arrow-and-box diagrams (pixel coordinates) ----------

const text = (x, y, t, { anchor = 'middle', cls = '' } = {}) => `<text class="svg-t ${cls}" x="${r(x)}" y="${r(y)}" text-anchor="${anchor}">${label(t)}</text>`;
/** A rounded box with its text in the middle (centre x, centre y). `mark` makes the box stand out (the answer, or the unknown). */
const box = (cx, cy, w, h, t, { mark = false } = {}) => `<rect class="box" x="${r(cx - w / 2)}" y="${r(cy - h / 2)}" width="${w}" height="${h}" rx="10"${mark ? ' style="fill:var(--tint);stroke:var(--strand);stroke-width:4"' : ''}/>${text(cx, cy + 8, t)}`;
const HEAD = 11;
/** An arrow from (x1, y1) to (x2, y2). `integrate` arrows are drawn in the topic colour, `differentiate` arrows in dark ink. */
function arrow(x1, y1, x2, y2, { integrate = false } = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const bx = x2 - ux * HEAD * 1.4;
  const by = y2 - uy * HEAD * 1.4;
  const px = -uy * HEAD * 0.75;
  const py = ux * HEAD * 0.75;
  const fill = integrate ? ' style="fill:var(--strand)"' : '';
  return `<line class="${integrate ? 'curve' : 'line'}" x1="${r(x1)}" y1="${r(y1)}" x2="${r(bx)}" y2="${r(by)}"/><polygon class="arrowhead"${fill} points="${r(x2)},${r(y2)} ${r(bx + px)},${r(by + py)} ${r(bx - px)},${r(by - py)}"/>`;
}
/** A blank drawing area for diagrams. */
const canvas = (width, height) => plane({ width, height, left: 0, right: 0, top: 0, bottom: 0, axes: false, grid: false, ticks: false, tickLabels: false });

// ---------- the graphs ----------

const square = (x) => x * x;

/** Two graphs stacked, sharing one x-axis, so a point on one lines up with the same x on the other. */
function stacked(top, bottom, extra, { id, title, desc }) {
  const gap = top.height + 6;
  const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<title.*?<\/title>/, '').replace(/<desc.*?<\/desc>/, '').replace(/<defs>.*?<\/defs>/, '').replace(/<\/svg>$/, '');
  const body = `<g>${inner(top.svg({ id: `${id}-a`, title: '', desc: '' }))}</g><g transform="translate(0 ${gap})">${inner(bottom.svg({ id: `${id}-b`, title: '', desc: '' }))}</g>`;
  // The joining line is drawn under the two graphs, so their labels stay readable where it passes.
  const withLine = body.replace('<g>', `${extra(gap)}<g>`);
  const esc = (t) => String(t).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  return `<svg class="graph-svg" viewBox="0 0 ${top.width} ${gap + bottom.height}" role="img" aria-labelledby="${id}-t ${id}-d" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>${withLine}</svg>`;
}

const graphWithHeight = (opts) => ({ ...plane(opts), height: opts.height ?? 440, width: opts.width ?? 720 });

const DRAWN = {
  // A curve, and the graph of its derivative below it: the height of the lower graph is the gradient of the upper one.
  'integration-basics-curve-and-gradient': () => {
    const opts = { xmin: -0.5, xmax: 3.5, xstep: 1, height: 330 };
    const top = graphWithHeight({ ...opts, ymin: -1, ymax: 10, ystep: 2 });
    const bottom = graphWithHeight({ ...opts, ymin: -1, ymax: 8, ystep: 2 });
    top.curve(square);
    top.tangent(square, 2, { span: 0.9 });
    top.point(2, 4, {});
    top.text(0.2, 9.3, 'the curve y = x^2', { cls: 'alt', anchor: 'start' });
    top.text(0.2, 7.7, 'gradient at x = 2 is 4', { anchor: 'start' });
    bottom.curve((x) => 2 * x);
    bottom.point(2, 4, {});
    bottom.text(0.2, 7.3, 'its derivative y = 2x', { cls: 'alt', anchor: 'start' });
    bottom.text(0.2, 5.7, 'height at x = 2 is 4', { anchor: 'start' });
    return stacked(top, bottom, (gap) => `<line class="guide" x1="${r(top.X(2))}" y1="${r(top.Y(4))}" x2="${r(top.X(2))}" y2="${r(gap + bottom.Y(4))}"/>`, {
      id: 'integration-basics-curve-and-gradient',
      title: 'A curve and its derivative, one above the other',
      desc: 'Two graphs share the same x-axis. The upper graph is the curve y equals x squared with a tangent drawn at x equals 2, where the gradient is 4. The lower graph is the straight line y equals 2x, which is the derivative. At x equals 2 the lower graph is 4 high, and a dashed line joins the two points: the height of the lower graph is the gradient of the upper one.',
    });
  },

  // Differentiating and integrating as two arrows between the same two functions.
  'integration-basics-two-way': () => {
    const c = canvas(720, 330);
    c.raw(text(150, 56, 'a function', { cls: 'alt' }) + text(570, 56, 'its derivative', { cls: 'alt' }));
    c.raw(box(150, 130, 190, 74, 'x^3') + box(570, 130, 190, 74, '3x^2'));
    c.raw(arrow(255, 108, 465, 108) + text(360, 88, 'differentiate'));
    c.raw(arrow(465, 154, 255, 154, { integrate: true }) + text(360, 190, 'integrate', { cls: 'alt' }));
    c.raw(text(360, 262, 'Integrating asks: what did I differentiate', { cls: 'small' }) + text(360, 296, 'to get 3x^2?', { cls: 'small' }));
    return c.svg({
      id: 'integration-basics-two-way',
      title: 'Differentiating and integrating are opposite steps',
      desc: 'Two boxes. The left box holds x cubed. The right box holds 3x squared. An arrow labelled differentiate points from the left box to the right box. An arrow labelled integrate points back from the right box to the left box.',
    });
  },

  // The curves y = x^2 + c: the same shape, moved up or down, with the same gradient at x = 1.
  'integration-basics-family': () => {
    const p = plane({ xmin: -2.5, xmax: 5, ymin: -5, ymax: 12, xstep: 1, ystep: 2, height: 540 });
    const cs = [-2, 0, 2];
    for (const c of cs) p.curve((x) => x * x + c, { to: 3 });
    p.vline(1);
    for (const c of cs) p.tangent((x) => x * x + c, 1, { span: 0.7 });
    for (const c of cs) p.point(1, 1 + c, {});
    p.text(3, 7, 'y = x^2 - 2', { cls: 'alt', anchor: 'start', dx: 12 });
    p.text(3, 9, 'y = x^2', { cls: 'alt', anchor: 'start', dx: 12 });
    p.text(3, 11, 'y = x^2 + 2', { cls: 'alt', anchor: 'start', dx: 12 });
    p.text(0.3, -3.2, 'gradient 2 at x = 1', { anchor: 'start' });
    p.text(0.3, -4.2, 'on every curve', { anchor: 'start' });
    return p.svg({
      id: 'integration-basics-family',
      title: 'Curves with the same gradient at x equals 1',
      desc: 'Three copies of the curve y equals x squared plus c, for c equal to minus 2, 0 and 2. Each is the same shape, moved up or down. A dashed vertical line at x equals 1 crosses all three. At each crossing a short tangent is drawn, and the three tangents are parallel, so the gradient is the same, 2.',
    });
  },

  // The rule: add 1 to the power, divide by the new power, add c. General form on the left, an example on the right.
  'integration-basics-rule': () => {
    const c = canvas(720, 450);
    const L = 175;
    const R = 545;
    c.raw(text(L, 30, 'any n except -1', { cls: 'alt' }) + text(R, 30, 'for example n = 5', { cls: 'alt' }));
    const rows = [92, 232, 372];
    c.raw(box(L, rows[0], 300, 70, 'x^n') + box(R, rows[0], 300, 70, 'x^5'));
    c.raw(box(L, rows[1], 300, 70, 'x^(n+1)') + box(R, rows[1], 300, 70, 'x^6'));
    c.raw(box(L, rows[2], 300, 70, 'x^(n+1) / (n+1) + c', { mark: true }) + box(R, rows[2], 300, 70, 'x^6 / 6 + c', { mark: true }));
    for (const x of [L, R]) {
      c.raw(arrow(x, rows[0] + 36, x, rows[1] - 38, { integrate: true }) + arrow(x, rows[1] + 36, x, rows[2] - 38, { integrate: true }));
    }
    c.raw(text(360, (rows[0] + rows[1]) / 2 + 8, 'add 1 to the power', { cls: 'small' }));
    c.raw(text(360, (rows[1] + rows[2]) / 2 - 4, 'divide by', { cls: 'small' }) + text(360, (rows[1] + rows[2]) / 2 + 22, 'the new power', { cls: 'small' }));
    c.raw(text(360, rows[2] + 74, 'then add c', { cls: 'small' }));
    return c.svg({
      id: 'integration-basics-rule',
      title: 'The rule for integrating a power of x',
      desc: 'Two columns of three boxes with arrows pointing down. The left column is the general rule: x to the n, then x to the n plus 1, then x to the n plus 1 over n plus 1, plus c. The right column is the same steps for n equal to 5: x to the 5, then x to the 6, then x to the 6 over 6, plus c. Between the columns the steps are named: add 1 to the power, divide by the new power, then add c.',
    });
  },

  // An integrand with several terms: split it, integrate each term, join the results.
  'integration-basics-split': () => {
    const c = canvas(720, 540);
    const cols = [130, 360, 590];
    const tops = ['6x^2', '4x', '-5'];
    const ints = ['2x^3', '2x^2', '-5x'];
    c.raw(box(360, 40, 260, 64, '6x^2 + 4x - 5'));
    c.raw(text(505, 48, 'split into terms', { anchor: 'start' }));
    cols.forEach((x, i) => {
      c.raw(arrow(360 + (x - 360) * 0.4, 74, x, 150));
      c.raw(box(x, 184, 170, 62, tops[i]));
      c.raw(arrow(x, 218, x, 290, { integrate: true }));
      c.raw(box(x, 326, 170, 62, ints[i]));
      c.raw(arrow(x, 360, 360 + (x - 360) * 0.4, 440));
    });
    c.raw(text(245, 262, 'integrate', { cls: 'alt' }));
    c.raw(box(360, 480, 380, 64, '2x^3 + 2x^2 - 5x + c', { mark: true }));
    c.raw(text(570, 472, 'join,', { anchor: 'start' }) + text(570, 502, 'add c', { anchor: 'start' }));
    return c.svg({
      id: 'integration-basics-split',
      title: 'Integrate a sum one term at a time',
      desc: 'The expression 6x squared plus 4x minus 5 is split into three boxes: 6x squared, 4x and minus 5. An arrow down from each shows integrating it, giving 2x cubed, 2x squared and minus 5x. The three results are joined into one box: 2x cubed plus 2x squared minus 5x plus c.',
    });
  },

  // Tidy first: three steps, with what each one does.
  'integration-basics-tidy': () => {
    const c = canvas(720, 450);
    const rows = [64, 214, 364];
    const heads = ['1  Rewrite as terms', '2  Integrate each term', '3  Add c, then check'];
    heads.forEach((h, i) => c.raw(box(190, rows[i], 340, 76, h)));
    c.raw(arrow(190, rows[0] + 40, 190, rows[1] - 42, { integrate: true }) + arrow(190, rows[1] + 40, 190, rows[2] - 42, { integrate: true }));
    const notes = [['expand brackets,', 'divide, use powers'], ['add 1 to each power,', 'divide by the new power'], ['one c for the answer,', 'then check the answer']];
    notes.forEach((n, i) => c.raw(text(380, rows[i] - 6, n[0], { anchor: 'start', cls: 'small' }) + text(380, rows[i] + 24, n[1], { anchor: 'start', cls: 'small' })));
    return c.svg({
      id: 'integration-basics-tidy',
      title: 'Three steps for integrating an expression that is not yet a sum of powers',
      desc: 'Three boxes joined by downward arrows. Step 1: rewrite as terms, by expanding brackets, dividing, or using powers. Step 2: integrate each term, by adding 1 to each power and dividing by the new power. Step 3: add c for the whole answer, then check by differentiating.',
    });
  },

  // Check by differentiating: integrate, then differentiate the answer to get back to the start.
  'integration-basics-check': () => {
    const c = canvas(720, 340);
    c.raw(box(150, 150, 200, 74, '6x^2') + box(570, 150, 220, 74, '2x^3 + c', { mark: true }));
    c.raw(text(150, 70, 'what you integrate', { cls: 'alt' }) + text(570, 70, 'your answer', { cls: 'alt' }));
    c.raw(arrow(265, 128, 455, 128, { integrate: true }) + text(360, 106, 'integrate', { cls: 'alt' }));
    c.raw(arrow(455, 174, 265, 174) + text(360, 214, 'differentiate'));
    c.raw(text(360, 270, 'You get 6x^2 back. The c becomes 0.', { cls: 'small' }));
    c.raw(text(360, 304, 'So the answer is right.', { cls: 'small' }));
    return c.svg({
      id: 'integration-basics-check',
      title: 'Check an integral by differentiating it',
      desc: 'Two boxes. The left box holds 6x squared, what you integrate. The right box holds 2x cubed plus c, your answer. An arrow labelled integrate goes from the left to the right. An arrow labelled differentiate goes back from the right to the left. The note says you get 6x squared back and the c becomes 0, so the answer is right.',
    });
  },

  // The family y = x^2 + c, with the one curve that passes through (1, 5) picked out.
  'integration-basics-through-point': () => {
    const p = plane({ xmin: -3, xmax: 4.5, ymin: -5, ymax: 10, xstep: 1, ystep: 2, height: 540 });
    for (const c of [-2, 0, 2]) p.curve((x) => x * x + c, { cls: 'curve-c', to: 3.4 });
    p.curve((x) => x * x + 4, { to: 3.4 });
    p.point(1, 5, { label: '(1, 5)', dx: -16, dy: -12, anchor: 'end' });
    p.text(0.3, -3.2, 'solid: through (1, 5)', { anchor: 'start' });
    p.text(0.3, -4.2, 'dotted: not through (1, 5)', { anchor: 'start' });
    return p.svg({
      id: 'integration-basics-through-point',
      title: 'One curve of the family passes through a given point',
      desc: 'Several curves of the same shape, y equals x squared plus c, moved up and down. Three of them are dotted. One is solid and passes through the marked point (1, 5). The dotted curves miss that point, so the point picks out exactly one curve of the family.',
    });
  },

  // Integrating (ax + b)^n: treat the bracket as x, then divide by a as well.
  'integration-basics-linear-inside': () => {
    const c = canvas(720, 450);
    const x = 190;
    const rows = [64, 214, 364];
    c.raw(box(x, rows[0], 300, 70, '(2x + 1)^3') + box(x, rows[1], 300, 70, '(2x + 1)^4 / 4') + box(x, rows[2], 300, 70, '(2x + 1)^4 / 8 + c', { mark: true }));
    c.raw(arrow(x, rows[0] + 38, x, rows[1] - 40, { integrate: true }) + arrow(x, rows[1] + 38, x, rows[2] - 40, { integrate: true }));
    c.raw(text(360, rows[0] + 72, 'treat the bracket like x:', { anchor: 'start', cls: 'small' }) + text(360, rows[0] + 102, 'add 1 to the power,', { anchor: 'start', cls: 'small' }) + text(360, rows[0] + 132, 'divide by 4', { anchor: 'start', cls: 'small' }));
    c.raw(text(360, rows[1] + 72, 'divide by 2 as well,', { anchor: 'start', cls: 'small' }) + text(360, rows[1] + 102, 'the number in front of x', { anchor: 'start', cls: 'small' }));
    return c.svg({
      id: 'integration-basics-linear-inside',
      title: 'Integrating a power of a bracket that holds a linear expression',
      desc: 'Three boxes joined by downward arrows. The first box is 2x plus 1, all cubed. Step one treats the bracket like x: add 1 to the power and divide by 4, which gives the second box, 2x plus 1 to the 4, over 4. Step two divides by 2 as well, the number in front of x, which gives the third box, 2x plus 1 to the 4, over 8, plus c.',
    });
  },

  // Flip it, forwards: differentiate, then integrate. The c shows what the first step lost.
  'integration-basics-flip-forward': () => {
    const c = canvas(720, 400);
    const x = 190;
    const rows = [50, 190, 330];
    c.raw(box(x, rows[0], 300, 66, 'x^3 + 4x') + box(x, rows[1], 300, 66, '3x^2 + 4') + box(x, rows[2], 300, 66, 'x^3 + 4x + c', { mark: true }));
    c.raw(arrow(x, rows[0] + 36, x, rows[1] - 38) + arrow(x, rows[1] + 36, x, rows[2] - 38, { integrate: true }));
    c.raw(text(360, (rows[0] + rows[1]) / 2 + 8, 'differentiate', { anchor: 'start' }));
    c.raw(text(360, (rows[1] + rows[2]) / 2 + 8, 'integrate', { anchor: 'start', cls: 'alt' }));
    c.raw(text(360, rows[2] - 6, 'the start, plus an unknown c', { anchor: 'start', cls: 'small' }));
    c.raw(text(360, rows[2] + 24, 'It lost any added number', { anchor: 'start', cls: 'small' }));
    return c.svg({
      id: 'integration-basics-flip-forward',
      title: 'Differentiate, then integrate',
      desc: 'Three boxes joined by downward arrows. Start with x cubed plus 4x. An arrow labelled differentiate leads to 3x squared plus 4. An arrow labelled integrate leads to x cubed plus 4x plus c. The note says this is the start plus an unknown c, because the first step lost any number added on.',
    });
  },

  // Flip it, backwards: integrate, then differentiate. You land exactly where you started.
  'integration-basics-flip-backward': () => {
    const c = canvas(720, 400);
    const x = 190;
    const rows = [50, 190, 330];
    c.raw(box(x, rows[0], 300, 66, '6x^2') + box(x, rows[1], 300, 66, '2x^3 + c') + box(x, rows[2], 300, 66, '6x^2', { mark: true }));
    c.raw(arrow(x, rows[0] + 36, x, rows[1] - 38, { integrate: true }) + arrow(x, rows[1] + 36, x, rows[2] - 38));
    c.raw(text(360, (rows[0] + rows[1]) / 2 + 8, 'integrate', { anchor: 'start', cls: 'alt' }));
    c.raw(text(360, (rows[1] + rows[2]) / 2 + 8, 'differentiate', { anchor: 'start' }));
    c.raw(text(360, rows[2] - 6, 'exactly the start', { anchor: 'start', cls: 'small' }));
    c.raw(text(360, rows[2] + 24, 'The c becomes 0', { anchor: 'start', cls: 'small' }));
    return c.svg({
      id: 'integration-basics-flip-backward',
      title: 'Integrate, then differentiate',
      desc: 'Three boxes joined by downward arrows. Start with 6x squared. An arrow labelled integrate leads to 2x cubed plus c. An arrow labelled differentiate leads back to 6x squared. The note says you land exactly where you started, because the c becomes 0.',
    });
  },

  // ---------- question figures (the desc never gives the answer) ----------

  // C1: the graph of a derivative that is a horizontal line.
  'integration-basics-q-flat-gradient': () => {
    const p = plane({ xmin: -3, xmax: 3, ymin: -1, ymax: 5, xstep: 1, ystep: 1, height: 400, ylabel: 'dy/dx' });
    p.curve(() => 3);
    return p.svg({
      id: 'integration-basics-q-flat-gradient',
      title: 'The graph of a derivative',
      desc: 'A graph with a horizontal line drawn at height 3 for every value of x. The vertical axis is labelled dy by dx.',
    });
  },

  // C2: two curves with the same dy/dx; the upper one is unknown and crosses the y-axis at 5.
  'integration-basics-q-two-curves': () => {
    const p = plane({ xmin: -2.5, xmax: 2.5, ymin: -1, ymax: 12, xstep: 1, ystep: 2, height: 460 });
    p.curve(square);
    p.curve((x) => square(x) + 5, { cls: 'curve-b' });
    p.text(1.6, 1.6, 'y = x^2', { cls: 'alt', anchor: 'start', dx: 6 });
    p.point(0, 5, { label: '(0, 5)', dx: -14, dy: -26, anchor: 'end' });
    p.text(-1.9, 10.2, 'y = ?', { cls: 'alt', anchor: 'start' });
    return p.svg({
      id: 'integration-basics-q-two-curves',
      title: 'Two curves with the same derivative',
      desc: 'Two U-shaped curves of the same shape. The lower curve is solid and labelled y equals x squared. The upper curve is dashed, labelled y equals question mark, and crosses the y-axis at the marked point (0, 5).',
    });
  },

  // C7: the graph of dy/dx, a straight line that crosses both axes.
  'integration-basics-q-gradient-line': () => {
    const p = plane({ xmin: -1, xmax: 5, ymin: -6, ymax: 6, xstep: 1, ystep: 2, height: 440, ylabel: 'dy/dx' });
    p.straight(2, -4);
    p.point(0, -4, { label: '(0, -4)', dx: 14, dy: 6 });
    p.point(2, 0, { label: '(2, 0)', dx: 14, dy: -14 });
    return p.svg({
      id: 'integration-basics-q-gradient-line',
      title: 'The graph of dy by dx for a curve',
      desc: 'A straight line sloping upwards. It crosses the y-axis at the marked point (0, minus 4) and the x-axis at the marked point (2, 0). The vertical axis is labelled dy by dx.',
    });
  },
};

// Every label gets a white outline, so a label that sits over a grid line or a curve stays readable.
const HALO = 'paint-order:stroke;stroke:var(--white,#fff);stroke-width:6px;stroke-linejoin:round';
export const FIGURES = Object.fromEntries(Object.entries(DRAWN).map(([id, draw]) => [id, () => draw().replaceAll('<text class="svg-t', `<text style="${HALO}" class="svg-t`)]));
