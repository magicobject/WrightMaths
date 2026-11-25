// Pictures for trigonometry glossary terms (hover pop-up and glossary page): { '<term-id>': '<svg ...>' }.
// Graphs are drawn from their functions with plane(); circles and triangles are drawn on a pixel canvas (see canvas()).
// Keys must be ids of terms in ../glossary/trigonometry.mjs. The title and desc describe the picture.
import { plane, label } from '../figure-lib.mjs';

const PI = Math.PI;
const RAD = PI / 180;
const TH = '\u03b8'; // theta
const DEG = '\u00b0';
const TERM = 'graph-svg term-svg';

/** Axis label for a multiple of pi/2 (0, pi/2, pi, 3pi/2, ...). */
function piLabel(x) {
  const k = Math.round(x / (PI / 2));
  if (k === 0) return '0';
  const sign = k < 0 ? '\u2212' : '';
  const a = Math.abs(k);
  if (a % 2 === 0) return `${sign}${a / 2 === 1 ? '' : a / 2}\u03c0`;
  return `${sign}${a === 1 ? '' : a}\u03c0/2`;
}

/** A graph in degrees (x axis marked every 90 degrees). */
function degPlane({ xmin = -40, xmax = 400, ymin = -1.5, ymax = 1.5, ystep = 1 } = {}) {
  return plane({
    width: 440, height: 300, left: 52, right: 44, top: 40, bottom: 52, xmin, xmax, ymin, ymax, xstep: 90, ystep,
    xtickFormat: (v) => `${v}${DEG}`,
  });
}

/** A graph in radians (x axis marked every pi/2). */
function radPlane({ xmin = -0.5, xmax: xhi = 2 * PI + 0.5, ymin = -1.5, ymax = 1.5, ystep = 1 } = {}) {
  return plane({
    width: 440, height: 300, left: 52, right: 44, top: 40, bottom: 52, xmin, xmax: xhi, ymin, ymax, xstep: PI / 2, ystep, xtickFormat: piLabel,
  });
}

/** A blank drawing area in pixels (origin bottom-left, y up). Use p.line, p.text, p.parametric, p.raw ... in pixel units. */
function canvas(w, h) {
  return plane({ width: w, height: h, left: 0, right: 0, top: 0, bottom: 0, xmin: 0, xmax: w, ymin: 0, ymax: h, grid: false, axes: false, ticks: false });
}

const polygon = (p, pts, cls) => p.raw(`<polygon class="${cls}" points="${pts.map(([x, y]) => `${p.X(x).toFixed(1)},${p.Y(y).toFixed(1)}`).join(' ')}"/>`);
const arcPoints = (cx, cy, r, a0, a1, n = 60) => Array.from({ length: n + 1 }, (_, i) => { const t = a0 + ((a1 - a0) * i) / n; return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; });
const arc = (p, cx, cy, r, a0, a1, cls = 'line') => p.parametric((t) => cx + r * Math.cos(t), (t) => cy + r * Math.sin(t), a0, a1, { cls, samples: 80 });
const rightAngle = (p, x, y, s = 14) => p.raw(`<polyline class="line" fill="none" points="${p.X(x + s)},${p.Y(y)} ${p.X(x + s)},${p.Y(y + s)} ${p.X(x)},${p.Y(y + s)}"/>`);

/** Text with a white outline, for a label that has to sit on top of a line. (x, y) are in the plane's own coordinates. */
function halo(p, x, y, text, { cls = '', anchor = 'middle', dx = 0, dy = 0 } = {}) {
  return p.raw(`<text class="svg-t ${cls}" x="${(p.X(x) + dx).toFixed(1)}" y="${(p.Y(y) + dy).toFixed(1)}" text-anchor="${anchor}" style="paint-order:stroke;stroke:#fff;stroke-width:7px;stroke-linejoin:round">${label(text)}</text>`);
}

// ---------- graphs of sin, cos, tan in degrees ----------

const sinDeg = (x) => Math.sin(x * RAD);
const cosDeg = (x) => Math.cos(x * RAD);
const tanDeg = (x) => Math.tan(x * RAD);

function sineGraph() {
  const p = degPlane();
  p.curve(sinDeg, { from: 0, to: 360 });
  p.point(90, 1, { label: '(90\u00b0, 1)', dx: 10, dy: -12 });
  p.point(270, -1, { label: '(270\u00b0, \u22121)', dx: -10, dy: 28, anchor: 'end' });
  p.text(330, 0.75, 'y = sin x', { cls: 'alt' });
  return p.svg({ id: 'tf-sine', title: 'Graph of y = sin x', desc: 'A wave from 0 to 360 degrees. It starts at 0, rises to 1 at 90 degrees, falls through 0 at 180, reaches minus 1 at 270 and returns to 0 at 360.', cls: TERM });
}

function cosineGraph() {
  const p = degPlane();
  p.curve(cosDeg, { from: 0, to: 360 });
  p.point(0, 1, { label: '(0\u00b0, 1)', dx: 14, dy: -14 });
  p.point(180, -1, { label: '(180\u00b0, \u22121)', dx: 0, dy: 34 });
  p.text(180, 0.75, 'y = cos x', { cls: 'alt' });
  return p.svg({ id: 'tf-cosine', title: 'Graph of y = cos x', desc: 'A wave from 0 to 360 degrees. It starts at 1, falls through 0 at 90 degrees, reaches minus 1 at 180, rises through 0 at 270 and returns to 1 at 360.', cls: TERM });
}

function tangentGraph() {
  const p = degPlane({ ymin: -4, ymax: 4, ystep: 2 });
  p.vline(90).vline(270);
  p.curve(tanDeg, { from: 0, to: 400 });
  p.text(90, 3.3, 'x = 90\u00b0', { anchor: 'start', dx: 8, cls: 'small' });
  p.text(270, 3.3, 'x = 270\u00b0', { anchor: 'start', dx: 8, cls: 'small' });
  p.text(290, 1.6, 'y = tan x', { cls: 'alt', anchor: 'start' });
  return p.svg({ id: 'tf-tangent-function', title: 'Graph of y = tan x', desc: 'A curve that rises from 0 at 0 degrees towards a vertical asymptote at 90 degrees, then repeats: it comes up from minus infinity, crosses 0 at 180 degrees, and climbs to the asymptote at 270 degrees. The pattern repeats every 180 degrees.', cls: TERM });
}

function periodGraph() {
  const p = degPlane({ ymin: -2, ymax: 2 });
  p.curve(sinDeg, { from: 0, to: 360 });
  p.line(0, 1.5, 360, 1.5).line(0, 1.35, 0, 1.65).line(360, 1.35, 360, 1.65);
  p.text(180, 1.7, 'one period = 360\u00b0', { cls: 'alt' });
  p.vline(0).vline(360);
  return p.svg({ id: 'tf-period', title: 'One period of y = sin x', desc: 'The graph of y = sin x from 0 to 360 degrees, with a bar above it from 0 to 360 degrees labelled one period equals 360 degrees. The graph repeats after that.', cls: TERM });
}

function amplitudeGraph() {
  const f = (x) => 2 * sinDeg(x) + 1;
  const p = degPlane({ ymin: -2, ymax: 4, ystep: 2 });
  p.hline(1);
  p.curve(f, { from: 0, to: 360 });
  p.line(90, 1, 90, 3);
  p.point(90, 3, {});
  p.text(90, 3.45, 'amplitude 2', { cls: 'alt', anchor: 'start', dx: 16 });
  p.text(300, 1.35, 'middle line y = 1', { cls: 'small' });
  return p.svg({ id: 'tf-amplitude', title: 'Amplitude of y = 2 sin x + 1', desc: 'The graph of y = 2 sin x + 1 oscillates about the middle line y = 1, between minus 1 and 3. A vertical bar from the middle line up to the highest point at 90 degrees is labelled amplitude 2.', cls: TERM });
}

function principalValueGraph() {
  const p = degPlane({ ymin: -1.5, ymax: 1.5 });
  p.curve(sinDeg, { from: 0, to: 360 });
  p.hline(0.5, { cls: 'curve-b' });
  p.drop(30, 0.5).drop(150, 0.5);
  p.point(30, 0.5, {}).point(150, 0.5, {});
  p.text(330, 0.5, 'y = 0.5', { cls: 'small', dy: -10 });
  p.text(250, 1.2, 'x = 30\u00b0 or 150\u00b0', { cls: 'alt' });
  return p.svg({ id: 'tf-principal-value', title: 'Two solutions of sin x = 0.5', desc: 'The graph of y = sin x from 0 to 360 degrees crossed by the dashed line y = 0.5. They meet at x = 30 degrees, which is the value a calculator gives, and at x = 150 degrees, the second solution.', cls: TERM });
}

function rFormGraph() {
  const f = (x) => 3 * sinDeg(x) + 4 * cosDeg(x);
  const alpha = Math.atan2(4, 3) / RAD; // 53.13 degrees
  const p = degPlane({ ymin: -7, ymax: 7, ystep: 5 });
  p.hline(5).hline(-5);
  p.curve(f, { from: 0, to: 360 });
  p.point(90 - alpha, 5, { label: '(36.9\u00b0, 5)', dx: 14, dy: -12 });
  p.text(398, 5, 'R = 5', { cls: 'small alt', anchor: 'end', dy: -10 });
  p.text(270, -6.3, '3 sin x + 4 cos x', { cls: 'alt small' });
  return p.svg({ id: 'tf-r-form', title: 'The graph of 3 sin x + 4 cos x', desc: 'A single sine wave from 0 to 360 degrees that oscillates between minus 5 and 5. Its highest point is at x = 36.9 degrees, so the wave is a sine curve of amplitude R = 5 moved to the left by 53.1 degrees.', cls: TERM });
}

// ---------- circles ----------

function unitCircleFigure({ id, title, desc, legs = false }) {
  const p = plane({ width: 400, height: 368, left: 56, right: 56, top: 40, bottom: 40, xmin: -1.5, xmax: 1.5, ymin: -1.5, ymax: 1.5, xstep: 1, ystep: 1, grid: false, tickLabels: false });
  const t = 50 * RAD;
  const c = Math.cos(t);
  const s = Math.sin(t);
  p.parametric(Math.cos, Math.sin, 0, 2 * PI, { cls: 'line' });
  p.line(0, 0, c, s, { cls: 'curve' });
  p.drop(c, s);
  p.parametric((u) => 0.28 * Math.cos(u), (u) => 0.28 * Math.sin(u), 0, t, { cls: 'line' });
  p.point(c, s, { label: 'P', dx: 12, dy: -8 });
  halo(p, 0.4 * Math.cos(t / 2), 0.4 * Math.sin(t / 2), TH, { dy: 8 });
  halo(p, c / 2 - 0.07, s / 2 + 0.07, '1', { anchor: 'end', cls: 'small' });
  halo(p, c / 2, 0, 'cos ' + TH, { cls: 'small alt', dy: 30 });
  halo(p, c, s / 2, 'sin ' + TH, { cls: 'small alt', anchor: 'start', dx: 8, dy: 7 });
  p.note(8, 358, legs ? 'sin\u00b2\u03b8 + cos\u00b2\u03b8 = 1' : 'P = (cos \u03b8, sin \u03b8)', { cls: 'alt' });
  return p.svg({ id, title, desc, cls: TERM });
}

function castDiagram() {
  const p = plane({ width: 400, height: 368, left: 56, right: 56, top: 40, bottom: 40, xmin: -1.5, xmax: 1.5, ymin: -1.5, ymax: 1.5, xstep: 1, ystep: 1, grid: false, ticks: false });
  p.parametric(Math.cos, Math.sin, 0, 2 * PI, { cls: 'line' });
  p.text(0.5, 0.45, 'All', { cls: 'big alt' });
  p.text(-0.5, 0.45, 'Sin', { cls: 'big alt' });
  p.text(-0.5, -0.55, 'Tan', { cls: 'big alt' });
  p.text(0.5, -0.55, 'Cos', { cls: 'big alt' });
  p.text(1.25, 0.4, '1st', { cls: 'small' }).text(-1.25, 0.4, '2nd', { cls: 'small' }).text(-1.25, -0.5, '3rd', { cls: 'small' }).text(1.25, -0.5, '4th', { cls: 'small' });
  p.note(8, 358, 'Positive in each quadrant', { cls: 'small' });
  return p.svg({ id: 'tf-cast-diagram', title: 'CAST diagram', desc: 'A circle divided into four quadrants by the axes. The first quadrant is labelled All, the second Sin, the third Tan and the fourth Cos. The label is the function or functions that are positive there.', cls: TERM });
}

/** Circle with centre (cx, cy) and radius R on a pixel canvas, for radian, arc, sector, segment. */
function circleDrawing({ id, title, desc, a0 = 0, a1 = 1, shade = null, extra = () => {} }) {
  const cx = 150;
  const cy = 150;
  const R = 105;
  const p = canvas(400, 300);
  if (shade === 'sector') polygon(p, [[cx, cy], ...arcPoints(cx, cy, R, a0, a1)], 'shade');
  if (shade === 'segment') polygon(p, arcPoints(cx, cy, R, a0, a1), 'shade');
  arc(p, cx, cy, R, 0, 2 * PI, 'line');
  arc(p, cx, cy, R, a0, a1, 'curve');
  extra(p, { cx, cy, R, a0, a1 });
  return p.svg({ id, title, desc, cls: TERM });
}

const radii = (p, { cx, cy, R, a0, a1 }, cls = 'line') => {
  p.line(cx, cy, cx + R * Math.cos(a0), cy + R * Math.sin(a0), { cls });
  p.line(cx, cy, cx + R * Math.cos(a1), cy + R * Math.sin(a1), { cls });
};

const radianFigure = () => circleDrawing({
  id: 'tf-radian', a0: 0, a1: 1, title: 'One radian', desc: 'A circle with two radii that make an angle of one radian at the centre. The arc between them is drawn thick and is labelled arc = r: it is exactly as long as the radius r.',
  extra: (p, g) => {
    radii(p, g);
    p.point(g.cx, g.cy, {});
    p.text(g.cx + g.R / 2, g.cy, 'r', { dy: 30 });
    p.text(g.cx + 0.45 * g.R * Math.cos(1) - 20, g.cy + 0.55 * g.R * Math.sin(1) + 8, 'r');
    p.text(g.cx + 1.14 * g.R * Math.cos(0.5), g.cy + 1.14 * g.R * Math.sin(0.5), 'arc = r', { anchor: 'start', cls: 'alt' });
    p.text(g.cx + 36, g.cy + 20, '1 rad', { anchor: 'start', cls: 'small' });
    arc(p, g.cx, g.cy, 28, 0, 1, 'line');
  },
});

const arcFigure = () => circleDrawing({
  id: 'tf-arc', a0: 0.35, a1: 2.3, title: 'An arc of a circle', desc: 'A circle with part of its circumference drawn thick and labelled arc. The two end points are marked. The rest of the circle is a thinner line.',
  extra: (p, g) => {
    for (const a of [g.a0, g.a1]) p.point(g.cx + g.R * Math.cos(a), g.cy + g.R * Math.sin(a), {});
    p.text(g.cx + 1.2 * g.R * Math.cos(1.3), g.cy + 1.12 * g.R * Math.sin(1.3), 'arc', { cls: 'alt', dy: -4 });
  },
});

const arcLengthFigure = () => circleDrawing({
  id: 'tf-arc-length', a0: 0, a1: 1.2, title: 'Arc length s = r times theta', desc: 'A circle of radius r with an angle theta at the centre, in radians. The arc between the two radii is drawn thick and labelled s, the arc length. The note says s = r theta.',
  extra: (p, g) => {
    radii(p, g);
    p.text(g.cx + g.R / 2, g.cy, 'r', { dy: 30 });
    p.text(g.cx + 1.16 * g.R * Math.cos(0.6), g.cy + 1.16 * g.R * Math.sin(0.6), 's', { anchor: 'start', cls: 'alt', dy: -4 });
    p.text(g.cx + 38, g.cy + 16, TH, { anchor: 'start' });
    arc(p, g.cx, g.cy, 30, 0, 1.2, 'line');
    p.note(190, 286, 's = r\u03b8', { cls: 'alt big' });
  },
});

const sectorFigure = () => circleDrawing({
  id: 'tf-sector', a0: 0.2, a1: 1.9, shade: 'sector', title: 'A sector', desc: 'A circle with a slice shaded: the region bounded by two radii and the arc between them. The shaded region is labelled sector.',
  extra: (p, g) => {
    radii(p, g);
    p.text(g.cx + 0.55 * g.R * Math.cos(1.05), g.cy + 0.55 * g.R * Math.sin(1.05), 'sector', { cls: 'alt' });
    p.text(g.cx + 1.2 * g.R * Math.cos(1.05), g.cy + 1.1 * g.R * Math.sin(1.05), 'arc', { anchor: 'start', dx: -6 });
  },
});

const areaOfSectorFigure = () => circleDrawing({
  id: 'tf-area-of-sector', a0: 0.2, a1: 1.7, shade: 'sector', title: 'Area of a sector', desc: 'A circle of radius r with a sector shaded. The angle at the centre is theta in radians. The note says the area of the sector is a half r squared theta.',
  extra: (p, g) => {
    radii(p, g);
    p.text(g.cx + g.R / 2, g.cy, 'r', { dy: 30 });
    p.text(g.cx + 40, g.cy + 26, TH, { anchor: 'start' });
    arc(p, g.cx, g.cy, 30, 0.2, 1.7, 'line');
    p.note(190, 286, 'A = \u00bd r\u00b2\u03b8', { cls: 'alt big' });
  },
});

const segmentFigure = () => circleDrawing({
  id: 'tf-circle-segment', a0: 0.6, a1: 2.5, shade: 'segment', title: 'A segment of a circle', desc: 'A circle with a chord drawn between two points on it. The region between the chord and the arc is shaded and labelled segment. Dashed lines join the ends of the chord to the centre.',
  extra: (p, g) => {
    radii(p, g, 'guide');
    const x0 = g.cx + g.R * Math.cos(g.a0);
    const y0 = g.cy + g.R * Math.sin(g.a0);
    const x1 = g.cx + g.R * Math.cos(g.a1);
    const y1 = g.cy + g.R * Math.sin(g.a1);
    p.line(x0, y0, x1, y1);
    p.text(g.cx, 222, 'segment', { cls: 'alt' });
    p.text(g.cx, 175, 'chord', { cls: 'small' });
  },
});

// ---------- small angles ----------

function smallAngleGraph() {
  const p = plane({ width: 440, height: 300, left: 52, right: 44, top: 40, bottom: 52, xmin: -1.6, xmax: 1.6, ymin: -1.4, ymax: 1.4, xstep: 1, ystep: 1 });
  p.curve(Math.sin);
  p.curve((x) => x, { cls: 'curve-b' });
  p.note(220, 292, 'solid: y = sin x    dashed: y = x', { cls: 'small', anchor: 'middle' });
  return p.svg({ id: 'tf-small-angle-approximation', title: 'sin x and x for small x', desc: 'The curve y = sin x and the dashed line y = x, drawn for x between minus 1.6 and 1.6 radians. They almost coincide near 0 and move apart further out.', cls: TERM });
}

// ---------- reciprocal functions (radians) ----------

function secantGraph() {
  const p = radPlane({ ymin: -4, ymax: 4, ystep: 2 });
  p.vline(PI / 2).vline((3 * PI) / 2);
  p.curve(Math.cos, { cls: 'curve-b' });
  p.curve((x) => 1 / Math.cos(x));
  p.text(PI, 2.6, 'y = sec x', { cls: 'alt' });
  p.note(220, 292, 'dashed: y = cos x', { cls: 'small', anchor: 'middle' });
  return p.svg({ id: 'tf-secant-function', title: 'Graph of y = sec x', desc: 'The curve y = sec x from 0 to 2 pi, with the dashed curve y = cos x for comparison. Sec x is at least 1 or at most minus 1, with vertical asymptotes at pi over 2 and 3 pi over 2. It touches 1 at 0 and 2 pi and touches minus 1 at pi.', cls: TERM });
}

function cosecantGraph() {
  const p = radPlane({ ymin: -4, ymax: 4, ystep: 2 });
  p.vline(PI).vline(2 * PI);
  p.curve(Math.sin, { cls: 'curve-b' });
  p.curve((x) => 1 / Math.sin(x));
  p.text(4.7, 2.6, 'y = cosec x', { cls: 'alt' });
  p.note(220, 292, 'dashed: y = sin x', { cls: 'small', anchor: 'middle' });
  return p.svg({ id: 'tf-cosecant-function', title: 'Graph of y = cosec x', desc: 'The curve y = cosec x from 0 to 2 pi, with the dashed curve y = sin x for comparison. Cosec x is at least 1 or at most minus 1. It has vertical asymptotes at 0, pi and 2 pi. It touches 1 at pi over 2 and minus 1 at 3 pi over 2.', cls: TERM });
}

function cotangentGraph() {
  const p = radPlane({ ymin: -4, ymax: 4, ystep: 2 });
  p.vline(PI).vline(2 * PI);
  p.curve((x) => 1 / Math.tan(x));
  p.text(4.9, 2.6, 'y = cot x', { cls: 'alt' });
  return p.svg({ id: 'tf-cotangent-function', title: 'Graph of y = cot x', desc: 'The curve y = cot x from 0 to 2 pi. In each interval between the vertical asymptotes at 0, pi and 2 pi it falls from high on the left to low on the right, crossing 0 at pi over 2 and 3 pi over 2.', cls: TERM });
}

// ---------- inverse trigonometric functions ----------

const piY = (v) => (Math.abs(v - PI / 2) < 1e-6 ? '\u03c0/2' : Math.abs(v + PI / 2) < 1e-6 ? '\u2212\u03c0/2' : Math.abs(v - PI) < 1e-6 ? '\u03c0' : String(Math.round(v * 100) / 100));

function inversePlane({ ymin, ymax }) {
  return plane({ width: 440, height: 300, left: 60, right: 44, top: 40, bottom: 52, xmin: -2.4, xmax: 2.4, ymin, ymax, xstep: 1, ystep: PI / 2, ytickFormat: piY });
}

function arcsinGraph() {
  const p = inversePlane({ ymin: -2.2, ymax: 2.2 });
  p.hline(PI / 2).hline(-PI / 2);
  p.curve(Math.asin, { from: -1, to: 1 });
  p.point(1, PI / 2, { label: '(1, \u03c0/2)', dx: 12, dy: -14, cls: 'small' });
  p.point(-1, -PI / 2, { label: '(\u22121, \u2212\u03c0/2)', dx: -12, dy: 30, anchor: 'end', cls: 'small' });
  p.text(-1.4, 0.8, 'y = arcsin x', { cls: 'alt' });
  return p.svg({ id: 'tf-arcsin', title: 'Graph of y = arcsin x', desc: 'An S-shaped curve that starts at the point (minus 1, minus pi over 2), passes through the origin and ends at (1, pi over 2). It exists only for x between minus 1 and 1, and its values lie between minus pi over 2 and pi over 2.', cls: TERM });
}

function arccosGraph() {
  const p = inversePlane({ ymin: -0.7, ymax: 3.9 });
  p.hline(PI);
  p.curve(Math.acos, { from: -1, to: 1 });
  p.point(-1, PI, { label: '(\u22121, \u03c0)', dx: -12, dy: -12, anchor: 'end', cls: 'small' });
  p.point(1, 0, { label: '(1, 0)', dx: 12, dy: -14, cls: 'small' });
  p.text(1.4, 2.4, 'y = arccos x', { cls: 'alt' });
  return p.svg({ id: 'tf-arccos', title: 'Graph of y = arccos x', desc: 'A falling curve that starts at the point (minus 1, pi), passes through (0, pi over 2) and ends at (1, 0). It exists only for x between minus 1 and 1, and its values lie between 0 and pi.', cls: TERM });
}

function arctanGraph() {
  const p = plane({ width: 440, height: 300, left: 60, right: 44, top: 40, bottom: 52, xmin: -7, xmax: 7, ymin: -2.2, ymax: 2.2, xstep: 3, ystep: PI / 2, ytickFormat: piY });
  p.hline(PI / 2).hline(-PI / 2);
  p.curve(Math.atan);
  p.text(-3.6, 0.9, 'y = arctan x', { cls: 'alt' });
  return p.svg({ id: 'tf-arctan', title: 'Graph of y = arctan x', desc: 'An S-shaped curve through the origin. It rises for all values of x and gets closer and closer to the horizontal lines y = pi over 2 and y = minus pi over 2 without reaching them.', cls: TERM });
}

function inverseTrigGraph() {
  const p = plane({ width: 400, height: 420, left: 56, right: 40, top: 40, bottom: 76, xmin: -2.2, xmax: 2.2, ymin: -2.2, ymax: 2.2, xstep: PI / 2, ystep: PI / 2, xtickFormat: piY, ytickFormat: piY });
  p.straight(1, 0, { cls: 'guide' });
  p.curve(Math.sin, { from: -PI / 2, to: PI / 2 });
  p.curve(Math.asin, { from: -1, to: 1, cls: 'curve-b' });
  p.note(200, 394, 'solid: y = sin x (part of it)', { cls: 'small', anchor: 'middle' });
  p.note(200, 416, 'dashed: y = sin\u207b\u00b9 x  (arcsin)', { cls: 'small', anchor: 'middle' });
  return p.svg({ id: 'tf-inverse-trigonometric-functions', title: 'sin x and its inverse', desc: 'The part of y = sin x between x = minus pi over 2 and pi over 2, drawn solid, and the curve y = arcsin x, drawn dashed. They are mirror images of each other in the dotted line y = x.', cls: TERM });
}

// ---------- triangles ----------

/** A triangle with corners A, B, C and sides a, b, c. `mark` says which angle to mark; `note` is written under it. */
function labelledTriangle(id, title, desc, { mark = 'none', note = '' } = {}) {
  const A = [50, 95];
  const B = [380, 120];
  const C = [250, 240];
  const p = canvas(440, 300);
  polygon(p, [A, B, C], 'shade');
  p.line(...A, ...B).line(...B, ...C).line(...C, ...A);
  const G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
  const outward = (P, d) => { const dx = P[0] - G[0]; const dy = P[1] - G[1]; const n = Math.hypot(dx, dy); return [P[0] + (dx / n) * d, P[1] + (dy / n) * d]; };
  const corner = (P, t, d) => { const [x, y] = outward(P, d); p.text(x, y - 8, t, { cls: 'alt' }); };
  corner(A, 'A', 28); corner(B, 'B', 28); corner(C, 'C', 26);
  const side = (P, Q, t) => { const [x, y] = outward([(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], 20); p.text(x, y - 8, t); };
  side(B, C, 'a'); side(C, A, 'b'); side(A, B, 'c');
  const angleMark = (V, P, Q, r) => arc(p, V[0], V[1], r, Math.atan2(P[1] - V[1], P[0] - V[0]), Math.atan2(Q[1] - V[1], Q[0] - V[0]));
  if (mark === 'angleA') angleMark(A, B, C, 44);
  if (mark === 'angleC') angleMark(C, A, B, 36);
  if (note) p.note(220, 288, note, { cls: 'alt', anchor: 'middle' });
  return p.svg({ id, title, desc, cls: TERM });
}

const sineRuleFigure = () => labelledTriangle('tf-sine-rule', 'Sine rule', 'A triangle with corners A, B and C. The side opposite A is labelled a, the side opposite B is b and the side opposite C is c. The note shows a over sin A equals b over sin B equals c over sin C.', { note: 'a / sin A = b / sin B = c / sin C' });
const cosineRuleFigure = () => labelledTriangle('tf-cosine-rule', 'Cosine rule', 'A triangle with corners A, B and C and opposite sides a, b and c. The angle at A is marked. The note shows a squared equals b squared plus c squared minus 2bc cos A.', { mark: 'angleA', note: 'a^2 = b^2 + c^2 \u2212 2bc cos A' });
const areaTriangleFigure = () => labelledTriangle('tf-area-of-triangle-sine', 'Area of a triangle', 'A shaded triangle with corners A, B and C. The angle at C, between sides a and b, is marked. The note shows area equals a half times a times b times sin C.', { mark: 'angleC', note: 'Area = \u00bd ab sin C' });

function ambiguousFigure() {
  // A at the left, AC = 10 at 30 degrees to the base line, BC = 7: the circle of radius 7 about C meets the base line twice.
  const b = 10;
  const a = 7;
  const A = 30 * RAD;
  const disc = Math.sqrt(a * a - (b * Math.sin(A)) ** 2);
  const c1 = b * Math.cos(A) + disc;
  const c2 = b * Math.cos(A) - disc;
  const k = 26;
  const P = (x, y) => [24 + x * k, 110 + y * k];
  const A0 = P(0, 0);
  const C = P(b * Math.cos(A), b * Math.sin(A));
  const B1 = P(c1, 0);
  const B2 = P(c2, 0);
  const p = canvas(440, 300);
  arc(p, ...C, a * k, -2.6, -0.55, 'guide');
  p.line(...A0, ...P(15, 0));
  p.line(...A0, ...C);
  p.line(...C, ...B1);
  p.line(...C, ...B2, { cls: 'curve-b' });
  for (const pt of [A0, B1, B2, C]) p.point(...pt, {});
  p.text(A0[0] - 6, A0[1], 'A', { anchor: 'end', dy: 30, cls: 'alt' });
  p.text(C[0], C[1] + 12, 'C', { cls: 'alt' });
  p.text(B1[0], B1[1], 'B', { dy: 32, cls: 'alt' });
  p.text(B2[0], B2[1], 'B\u2032', { dy: 32, cls: 'alt' });
  p.text((A0[0] + C[0]) / 2 - 14, (A0[1] + C[1]) / 2 + 8, '10', { anchor: 'end' });
  p.text((C[0] + B1[0]) / 2 + 10, (C[1] + B1[1]) / 2 - 24, '7', { anchor: 'start' });
  p.text((C[0] + B2[0]) / 2 + 10, (C[1] + B2[1]) / 2 - 24, '7', { anchor: 'start' });
  arc(p, A0[0], A0[1], 40, 0, A);
  p.text(A0[0] + 48, A0[1] + 8, '30\u00b0', { anchor: 'start', cls: 'small' });
  p.note(220, 288, 'Two triangles: ABC and AB\u2032C', { cls: 'alt small', anchor: 'middle' });
  return p.svg({ id: 'tf-ambiguous-case', title: 'The ambiguous case', desc: 'A base line from A, a side AC of length 10 at 30 degrees to it, and a dashed arc of radius 7 centred at C. The arc meets the base line at two points B and B-dash, so there are two triangles with the same given sides and angle: ABC and AB-dash C. Both have side BC of length 7.', cls: TERM });
}

function exactValueFigure() {
  const p = canvas(440, 270);
  const s = 120;
  const base = 60;
  // 30-60-90: right angle at R1, short leg 1 (vertical), long leg root 3 (horizontal), longest side 2.
  const R1 = [32, base];
  const L1 = [R1[0] + Math.sqrt(3) * s, base];
  const T1 = [R1[0], base + s];
  polygon(p, [R1, L1, T1], 'shade');
  p.line(...R1, ...L1).line(...L1, ...T1).line(...T1, ...R1);
  rightAngle(p, ...R1);
  p.text(R1[0] - 6, base + s / 2, '1', { anchor: 'end', dy: 8 });
  p.text(R1[0] + (Math.sqrt(3) * s) / 2, base, '\u221a3', { dy: 30 });
  p.text(R1[0] + (Math.sqrt(3) * s) / 2 + 14, base + s / 2 + 6, '2', { anchor: 'start' });
  p.text(L1[0] - 58, base + 6, '30\u00b0', { anchor: 'start', cls: 'small' });
  p.text(T1[0] + 8, T1[1] - 56, '60\u00b0', { anchor: 'start', cls: 'small' });
  // 45-45-90.
  const R2 = [300, base];
  const L2 = [R2[0] + s, base];
  const T2 = [R2[0], base + s];
  polygon(p, [R2, L2, T2], 'shade');
  p.line(...R2, ...L2).line(...L2, ...T2).line(...T2, ...R2);
  rightAngle(p, ...R2);
  p.text(R2[0] - 6, base + s / 2, '1', { anchor: 'end', dy: 8 });
  p.text(R2[0] + s / 2, base, '1', { dy: 30 });
  p.text(R2[0] + s / 2 + 14, base + s / 2 + 8, '\u221a2', { anchor: 'start' });
  p.text(L2[0] - 56, base + 6, '45\u00b0', { anchor: 'start', cls: 'small' });
  p.text(T2[0] + 8, T2[1] - 62, '45\u00b0', { anchor: 'start', cls: 'small' });
  p.note(220, 28, 'exact values come from these triangles', { cls: 'small alt', anchor: 'middle' });
  return p.svg({ id: 'tf-exact-value', title: 'Triangles for exact values', desc: 'Two right-angled triangles. The first has angles 30, 60 and 90 degrees and sides 1, root 3 and 2, with 2 the longest side. The second has angles 45, 45 and 90 degrees and sides 1, 1 and root 2.', cls: TERM });
}

export const FIGS = {
  sine: sineGraph(),
  cosine: cosineGraph(),
  'tangent-function': tangentGraph(),
  'sine-rule': sineRuleFigure(),
  'cosine-rule': cosineRuleFigure(),
  'ambiguous-case': ambiguousFigure(),
  'area-of-triangle-sine': areaTriangleFigure(),
  'unit-circle': unitCircleFigure({ id: 'tf-unit-circle', title: 'The unit circle', desc: 'A circle of radius 1 centred at the origin. A radius makes an angle theta with the positive x-axis and meets the circle at the point P. The horizontal distance to P is cos theta and the vertical distance is sin theta, so P = (cos theta, sin theta).' }),
  'pythagorean-identity': unitCircleFigure({ id: 'tf-pythagorean-identity', legs: true, title: 'Why sin squared plus cos squared is 1', desc: 'A right-angled triangle inside the unit circle. Its horizontal side is cos theta, its vertical side is sin theta and its longest side is the radius, which is 1. Pythagoras gives sin squared theta plus cos squared theta equals 1.' }),
  'cast-diagram': castDiagram(),
  period: periodGraph(),
  amplitude: amplitudeGraph(),
  'exact-value': exactValueFigure(),
  'principal-value': principalValueGraph(),
  radian: radianFigure(),
  arc: arcFigure(),
  'arc-length': arcLengthFigure(),
  sector: sectorFigure(),
  'area-of-sector': areaOfSectorFigure(),
  'circle-segment': segmentFigure(),
  'small-angle-approximation': smallAngleGraph(),
  'secant-function': secantGraph(),
  'cosecant-function': cosecantGraph(),
  'cotangent-function': cotangentGraph(),
  'inverse-trigonometric-functions': inverseTrigGraph(),
  arcsin: arcsinGraph(),
  arccos: arccosGraph(),
  arctan: arctanGraph(),
  'r-form': rFormGraph(),
};
