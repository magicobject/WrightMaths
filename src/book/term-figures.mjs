// Small pictures that explain a glossary term. They appear in the hover / tap pop-up
// and on the glossary page. One picture per term id; all are inline SVG (no requests).
// Angles use degrees measured anticlockwise from the right (like a maths diagram).

const rad = (d) => (d * Math.PI) / 180;
const pt = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy - r * Math.sin(rad(deg))];
const f = (n) => n.toFixed(1);

const line = (x1, y1, x2, y2, cls = 'ln') => `<line class="${cls}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`;
const ray = (cx, cy, len, deg) => { const [x, y] = pt(cx, cy, len, deg); return line(cx, cy, x, y); };
// Arc from angle a0 to a1 (anticlockwise, degrees), radius r, about (cx, cy).
const arc = (cx, cy, r, a0, a1) => {
  const [x0, y0] = pt(cx, cy, r, a0); const [x1, y1] = pt(cx, cy, r, a1);
  const large = ((a1 - a0 + 360) % 360) > 180 ? 1 : 0;
  return `<path class="arc" d="M${f(x0)} ${f(y0)} A${r} ${r} 0 ${large} 0 ${f(x1)} ${f(y1)}"/>`;
};
const text = (x, y, t, anchor = 'middle', size = 13) => `<text class="svg-t" style="font-size:${size}px" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}">${t}</text>`;
const svg = (title, body, w = 160, h = 100) => `<svg viewBox="0 0 ${w} ${h}" class="geo-svg term-svg" role="img" aria-label="${title}">${body}</svg>`;
const rightMark = (x, y, s = 12) => `<polyline class="arrow" points="${x + s},${y} ${x + s},${y - s} ${x},${y - s}"/>`;
const poly = (points, cls = 'tri') => `<polygon class="${cls}" points="${points.map((p) => `${f(p[0])},${f(p[1])}`).join(' ')}"/>`;

const parallelPair = (extra) => svg('Two parallel lines crossed by a third line',
  `${line(10, 30, 150, 30)}${line(10, 72, 150, 72)}<polyline class="arrow" points="22,24 28,30 22,36"/><polyline class="arrow" points="22,66 28,72 22,78"/>`
  + `${line(52, 96, 112, 6)}${extra}`);

// Reflection: the point (1, 2) in x = 3 goes to (5, 2); in y = x it goes to (2, 1). Grid unit = 24 px, origin (24, 142).
const gx = (x) => 24 + x * 24;
const gy = (y) => 142 - y * 24;
const dot = (x, y, fill) => `<circle cx="${gx(x)}" cy="${gy(y)}" r="5" fill="${fill}" stroke="#0f2440" stroke-width="2"/>`;
const reflectionFigure = svg('A grid showing the point (1, 2) reflected in the line x = 3 to (5, 2), and in the line y = x to (2, 1)',
  `${[0, 1, 2, 3, 4, 5, 6, 7].map((x) => line(gx(x), gy(0), gx(x), gy(5), 'grid')).join('')}${[0, 1, 2, 3, 4, 5].map((y) => line(gx(0), gy(y), gx(7), gy(y), 'grid')).join('')}`
  + `${line(gx(0), gy(0), gx(7), gy(0))}${line(gx(0), gy(0), gx(0), gy(5))}`
  + `${[0, 1, 2, 3, 4, 5, 6, 7].map((x) => text(gx(x), gy(0) + 13, String(x), 'middle', 10)).join('')}${[1, 2, 3, 4, 5].map((y) => text(gx(0) - 6, gy(y) + 4, String(y), 'end', 10)).join('')}`
  + `<line x1="${gx(3)}" y1="${gy(0)}" x2="${gx(3)}" y2="${gy(5)}" stroke="#a14400" stroke-width="3" stroke-dasharray="7 4"/>${text(gx(3), gy(5) - 4, 'x = 3', 'middle', 11)}`
  + `<line x1="${gx(0)}" y1="${gy(0)}" x2="${gx(5)}" y2="${gy(5)}" stroke="#0a6a6a" stroke-width="3" stroke-dasharray="7 4"/>${text(gx(5) + 4, gy(5) + 4, 'y = x', 'start', 11)}`
  + `<line x1="${gx(1)}" y1="${gy(2)}" x2="${gx(5)}" y2="${gy(2)}" stroke="#0f2440" stroke-width="1.5" stroke-dasharray="2 3"/><line x1="${gx(1)}" y1="${gy(2)}" x2="${gx(2)}" y2="${gy(1)}" stroke="#0f2440" stroke-width="1.5" stroke-dasharray="2 3"/>`
  + `${dot(1, 2, '#e5679a')}${dot(5, 2, '#4a8fdc')}${dot(2, 1, '#4a8fdc')}`
  + `${text(gx(1) - 4, gy(2) - 9, '(1, 2)', 'middle', 11)}${text(gx(5), gy(2) - 9, '(5, 2)', 'middle', 11)}${text(gx(2) + 8, gy(1) + 17, '(2, 1)', 'middle', 11)}`,
  200, 164);

export const TERM_FIGURES = {
  'acute-angle': svg('An acute angle, less than 90 degrees', `${ray(30, 80, 110, 0)}${ray(30, 80, 100, 32)}${arc(30, 80, 32, 0, 32)}${text(100, 30, 'less than 90&deg;')}`),
  'right-angle': svg('A right angle, exactly 90 degrees', `${ray(40, 80, 100, 0)}${ray(40, 80, 70, 90)}${rightMark(40, 80)}${text(110, 40, '90&deg;')}`),
  'obtuse-angle': svg('An obtuse angle, between 90 and 180 degrees', `${ray(85, 80, 65, 0)}${ray(85, 80, 70, 140)}${arc(85, 80, 26, 0, 140)}${text(100, 30, 'between 90&deg; and 180&deg;', 'middle', 11)}`),
  'reflex-angle': svg('A reflex angle, more than 180 degrees', `${ray(80, 50, 65, 0)}${ray(80, 50, 60, 135)}${arc(80, 50, 24, 135, 360)}${text(80, 96, 'more than 180&deg;')}`),
  'angle': svg('An angle is the turn between two lines', `${ray(35, 75, 110, 0)}${ray(35, 75, 90, 50)}${arc(35, 75, 28, 0, 50)}${text(110, 30, 'angle')}`),
  'interior-angle': svg('An interior angle is inside the shape at a corner', `${poly([[30, 80], [130, 80], [100, 20]])}${arc(30, 80, 24, 0, 31)}${arc(130, 80, 24, 148, 180)}${text(88, 64, 'inside', 'middle', 12)}`),
  'exterior-angle': svg('An exterior angle is outside the shape, between a side and the extended next side', `${poly([[25, 80], [105, 80], [70, 20]])}${line(105, 80, 150, 80)}${arc(105, 80, 22, 0, 120)}${text(135, 62, 'outside', 'middle', 12)}`),
  'vertically-opposite': svg('Vertically opposite angles are equal',
    `${line(20, 20, 140, 80)}${line(20, 80, 140, 20)}${arc(80, 50, 18, 333, 27)}${arc(80, 50, 18, 153, 207)}${text(118, 54, 'a', 'middle', 13)}${text(42, 54, 'a', 'middle', 13)}`),
  'alternate-angles': parallelPair(`<text class="svg-t" style="font-size:13px" x="72" y="44">a</text><text class="svg-t" style="font-size:13px" x="86" y="64">a</text>`),
  'corresponding-angles': parallelPair(`<text class="svg-t" style="font-size:13px" x="106" y="24">a</text><text class="svg-t" style="font-size:13px" x="86" y="64">a</text>`),
  'co-interior-angles': parallelPair(`<text class="svg-t" style="font-size:13px" x="72" y="44">a</text><text class="svg-t" style="font-size:13px" x="56" y="64">b</text><text class="svg-t" style="font-size:10px" x="96" y="94">a + b = 180&deg;</text>`),
  'parallel': svg('Parallel lines never meet', `${line(15, 32, 145, 32)}${line(15, 68, 145, 68)}<polyline class="arrow" points="75,26 83,32 75,38"/><polyline class="arrow" points="75,62 83,68 75,74"/>${text(80, 92, 'same distance apart', 'middle', 11)}`),
  'hypotenuse': svg('The hypotenuse is the longest side, opposite the right angle', `${poly([[25, 80], [115, 80], [25, 25]])}${rightMark(25, 80)}${line(115, 80, 25, 25, 'ln hyp')}${text(95, 46, 'hypotenuse', 'start', 12)}`),
  'radius': svg('The radius goes from the centre to the edge', `<circle cx="80" cy="50" r="40" fill="#e4eefb" stroke="#0f2440" stroke-width="3"/><circle cx="80" cy="50" r="3" fill="#0f2440"/>${line(80, 50, 120, 50)}${text(100, 44, 'radius', 'middle', 12)}`),
  'diameter': svg('The diameter goes across the circle through the centre', `<circle cx="80" cy="50" r="40" fill="#e4eefb" stroke="#0f2440" stroke-width="3"/><circle cx="80" cy="50" r="3" fill="#0f2440"/>${line(40, 50, 120, 50)}${text(80, 44, 'diameter', 'middle', 12)}`),
  'chord': svg('A chord joins two points on a circle', `<circle cx="80" cy="50" r="40" fill="#e4eefb" stroke="#0f2440" stroke-width="3"/>${line(48, 78, 120, 38)}${text(98, 76, 'chord', 'middle', 12)}`),
  'tangent': svg('A tangent touches the circle at one point', `<circle cx="70" cy="50" r="34" fill="#e4eefb" stroke="#0f2440" stroke-width="3"/>${line(104, 6, 104, 94)}<circle cx="104" cy="50" r="3.5" fill="#ad1f5c"/>${text(132, 52, 'tangent', 'middle', 12)}`),
  'fraction': svg('A fraction shows parts of a whole', `<circle cx="55" cy="50" r="40" fill="#fff" stroke="#0f2440" stroke-width="3"/>${[0, 1, 2].map((i) => `<path d="M55 50 L${f(pt(55, 50, 40, 90 - i * 45)[0])} ${f(pt(55, 50, 40, 90 - i * 45)[1])} A40 40 0 0 0 ${f(pt(55, 50, 40, 45 - i * 45)[0])} ${f(pt(55, 50, 40, 45 - i * 45)[1])} Z" fill="#fbe3ee" stroke="#0f2440" stroke-width="2"/>`).join('')}${[3, 4, 5, 6, 7].map((i) => line(55, 50, ...pt(55, 50, 40, 90 - i * 45))).join('')}${text(125, 46, '3 of 8', 'middle', 15)}${text(125, 64, 'equal parts', 'middle', 11)}`),
  'numerator': svg('The numerator is the top number: how many parts you have', `${text(60, 40, '3', 'middle', 34)}${line(40, 50, 80, 50)}${text(60, 82, '8', 'middle', 34)}<text class="svg-t" style="font-size:12px" x="95" y="38">top: parts you have</text>`),
  'denominator': svg('The denominator is the bottom number: how many equal parts make the whole', `${text(60, 40, '3', 'middle', 34)}${line(40, 50, 80, 50)}${text(60, 82, '8', 'middle', 34)}<text class="svg-t" style="font-size:12px" x="95" y="80">bottom: parts in the whole</text>`),
  'reflection': reflectionFigure,
  'number-line': svg('A number line with negative and positive numbers', `${line(10, 50, 150, 50)}${[-3, -2, -1, 0, 1, 2, 3].map((v, i) => `${line(25 + i * 18.4, 44, 25 + i * 18.4, 56)}${text(25 + i * 18.4, 74, String(v).replace('-', '−'), 'middle', 11)}`).join('')}${text(80, 24, 'smaller &larr; &rarr; bigger', 'middle', 11)}`),
  'negative-number': svg('Negative numbers are to the left of zero', `${line(10, 50, 150, 50)}${[-3, -2, -1, 0, 1, 2, 3].map((v, i) => `${line(25 + i * 18.4, 44, 25 + i * 18.4, 56)}${text(25 + i * 18.4, 74, String(v).replace('-', '−'), 'middle', 11)}`).join('')}<circle cx="43.4" cy="50" r="5" fill="#ad1f5c"/>${text(43.4, 30, '&minus;2', 'middle', 12)}`),
  'square-number': svg('A square number is the area of a square: 3 times 3 is 9', `${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${35 + c * 26}" y="${12 + r * 26}" width="26" height="26" fill="#e4eefb" stroke="#0f2440" stroke-width="2"/>`).join('')).join('')}${text(125, 52, '3&sup2; = 9', 'middle', 15)}`),
  'polygon': svg('A polygon is a closed shape with straight sides', `${poly([[80, 10], [130, 44], [110, 92], [50, 92], [30, 44]], 'tri')}${text(80, 58, '5 sides', 'middle', 13)}`),
  'regular-polygon': svg('A regular polygon has equal sides and equal angles', `${poly([[80, 8], [124, 30], [124, 70], [80, 92], [36, 70], [36, 30]], 'tri')}${text(80, 54, 'all equal', 'middle', 12)}`),
  'isosceles-triangle': svg('An isosceles triangle has two equal sides', `${poly([[80, 12], [125, 85], [35, 85]])}<line class="ln" x1="52" y1="48" x2="58" y2="54"/><line class="ln" x1="108" y1="48" x2="102" y2="54"/>`),
  'perimeter': svg('The perimeter is the distance all the way round', `<rect x="30" y="20" width="100" height="60" fill="#e1f3e6" stroke="#ad1f5c" stroke-width="5"/>${text(80, 56, 'round the edge', 'middle', 12)}`),
  'area': svg('Area is the space inside a shape', `<rect x="30" y="20" width="100" height="60" fill="#fbeadb" stroke="#0f2440" stroke-width="3"/>${text(80, 56, 'space inside', 'middle', 12)}`),
  'diagonal': svg('A diagonal joins two opposite corners', `<rect x="30" y="20" width="100" height="60" fill="#e1f3e6" stroke="#0f2440" stroke-width="3"/>${line(30, 80, 130, 20, 'ln hyp')}${text(98, 76, 'diagonal', 'middle', 12)}`),
  'cube-number': svg('A cube number is the volume of a cube: 2 times 2 times 2 is 8', `${poly([[40, 40], [90, 40], [90, 90], [40, 90]], 'sq')}${poly([[40, 40], [60, 20], [110, 20], [90, 40]], 'sq')}${poly([[90, 40], [110, 20], [110, 70], [90, 90]], 'sq')}${text(135, 60, '2&sup3; = 8', 'middle', 13)}`),
  'place-value': svg('Place value: each column is worth ten times the one on its right', `${['Th', 'H', 'T', 'U'].map((c, i) => `<rect x="${12 + i * 36}" y="26" width="34" height="40" fill="${i === 2 ? '#fbe3ee' : '#e4eefb'}" stroke="#0f2440" stroke-width="2.5"/>${text(29 + i * 36, 18, c, 'middle', 11)}${text(29 + i * 36, 54, ['4', '0', '8', '2'][i], 'middle', 22)}`).join('')}${text(80, 90, 'the 8 is worth 80', 'middle', 12)}`),
  'decimal': svg('A decimal: digits after the point are tenths, hundredths, thousandths', `${['3', '.', '2', '5', '4'].map((ch, i) => (ch === '.' ? text(12 + i * 28 + 6, 62, '.', 'middle', 30) : `<rect x="${12 + i * 28 - (i > 1 ? 8 : 0)}" y="28" width="26" height="38" fill="#e4eefb" stroke="#0f2440" stroke-width="2.5"/>${text(25 + i * 28 - (i > 1 ? 8 : 0), 56, ch, 'middle', 22)}`)).join('')}${text(80, 90, 'tenths, hundredths, thousandths', 'middle', 10)}`),
};

/** Small pictures for terms that appear on a page: [id, svg] pairs for ids that have one. */
export function figuresFor(ids, figures = TERM_FIGURES) {
  return [...new Set(ids)].filter((id) => figures[id]).map((id) => [id, figures[id]]);
}
