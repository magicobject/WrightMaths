import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Trigonometry in triangles page that a general test cannot make:
//  - every typed answer that needs rounding is RECOMPUTED here, to the rounding the question states,
//  - the wrong-answer values that come from a named slip are recomputed too,
//  - every figure is measured: the drawn lengths, angles, areas and bearings are compared with what the question states.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'trig-triangles.html'), 'utf8');

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', deg: '°' };
const decode = (t: string) => t.replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);

// ---- trigonometry in degrees, written independently of the figure code ----
const RAD = Math.PI / 180;
const sin = (d: number) => Math.sin(d * RAD);
const cos = (d: number) => Math.cos(d * RAD);
const asin = (x: number) => Math.asin(x) / RAD;
const acos = (x: number) => Math.acos(x) / RAD;
const sineSide = (side: number, angle: number, target: number) => (side * sin(target)) / sin(angle); // side / sin(angle) = x / sin(target)
const sineAngle = (oppTarget: number, knownAngle: number, knownSide: number) => asin((oppTarget * sin(knownAngle)) / knownSide);
const cosSide = (b: number, c: number, A: number) => Math.sqrt(b * b + c * c - 2 * b * c * cos(A));
const cosAngle = (opp: number, s1: number, s2: number) => acos((s1 * s1 + s2 * s2 - opp * opp) / (2 * s1 * s2));
const area = (a: number, b: number, C: number) => 0.5 * a * b * sin(C);
const sf3 = (x: number) => Number(x.toPrecision(3));
const dp1 = (x: number) => Math.round(x * 10) / 10;
const int = (x: number) => Math.round(x);

type Case = { find: string; answer: number | number[]; round: (x: number) => number; wrongs?: (number | [number, (x: number) => number])[] };
const R = (find: string, value: number | number[], round: (x: number) => number, wrongs: (number | [number, (x: number) => number])[] = []): Case => ({ find, answer: value, round, wrongs });

// The angle at B in the ambiguous case A = 30, a = 7, b = 10, and the two values of c.
const B1 = asin((10 * sin(30)) / 7);
const PQR100 = 220 - 120; // the angle PQR in the walk: bearing of P from Q, minus the bearing of R from Q
const PR_WALK = cosSide(8, 10, PQR100);
const PR_SHIP = cosSide(20, 14, 95);
const angleAtA = asin(5 / 7); // the angle A with area 25, sides 7 and 10

const CASES: Case[] = [
  // warm-up
  R('hypotenuse of 10 cm and an angle of', 10 * sin(35), sf3, [10 * cos(35), 5.7]),
  R('angle A is {m:47deg}', 180 - 47 - 68, int, [47 + 68]),
  R('{m:sin x=0.6}', asin(0.6), dp1, [acos(0.6)]),
  R('two short sides of 5 cm and 12 cm', Math.hypot(5, 12), int, [17, 169]),
  R('Round 7.0449', 7.0449, sf3, [7.05, 7]),
  R('base of 9 cm and a perpendicular height of 4 cm', 0.5 * 9 * 4, int, [36]),
  R('find {m:cos(120deg)}', cos(120), (x) => Math.round(x * 10) / 10, [0.5]),
  // 1 the sine rule
  R('{m:A=35deg}, {m:B=80deg} and {m:a=6} cm', sineSide(6, 35, 80), sf3, [sineSide(6, 80, 35)]),
  R('{m:a=14} cm, {m:A=62deg} and {m:b=11} cm. Find angle B', sineAngle(11, 62, 14), dp1, [180 - sineAngle(11, 62, 14)]),
  R('{m:A=52deg}, {m:B=61deg} and {m:a=7.5} cm', sineSide(7.5, 52, 180 - 52 - 61), sf3, [sineSide(7.5, 67, 52)]),
  R('{m:a=9} cm, {m:c=12.5} cm and {m:C=75deg}', sineAngle(9, 75, 12.5), dp1, [[(9 * sin(75)) / 12.5, sf3]]),
  // 2 the cosine rule
  R('{m:b=8} cm, {m:c=11} cm and {m:A=40deg}', cosSide(8, 11, 40), sf3, [64 + 121 - 176 * cos(40)]),
  R('{m:a=5}, {m:b=7} and {m:c=9}. Find angle C', cosAngle(9, 5, 7), dp1, [180 - cosAngle(9, 5, 7)]),
  R('{m:b=6}, {m:c=10} and {m:A=120deg}', cosSide(6, 10, 120), int, [[Math.sqrt(36 + 100 - 120 * cos(60)), sf3]]),
  R('sides {m:a=6}, {m:b=7} and {m:c=10}', cosAngle(6, 7, 10), dp1, [[113 / 140, sf3]]),
  // 3 choosing
  R('{m:A=44deg}, {m:C=71deg} and {m:b=10} cm', sineSide(10, 65, 71), sf3, [sineSide(10, 44, 71)]),
  R('{m:a=6}, {m:c=8} and {m:B=58deg}', cosSide(6, 8, 58), sf3, [36 + 64 - 96 * cos(58)]),
  // 4 area
  R('9 cm and 14 cm. The angle between them is {m:52deg}', area(9, 14, 52), sf3, [126 * sin(52)]),
  R('sides {m:a=5}, {m:b=6} and {m:c=7} cm', area(6, 7, cosAngle(5, 6, 7)), sf3, [105]),
  R('8 cm and 11 cm and an area of 35', asin(35 / 44), dp1, [180 - asin(35 / 44)]),
  R('area 30 cm&sup2;, {m:a=12} cm and {m:C=40deg}', 60 / (12 * sin(40)), sf3, [30 / (12 * sin(40))]),
  // 5 the ambiguous case
  R('{m:A=30deg}, {m:a=7} and {m:b=10}. Find the two possible values of angle B', [B1, 180 - B1], dp1),
  R('{m:A=55deg}, {m:a=10} and {m:b=7}', asin((7 * sin(55)) / 10), dp1, [180 - asin((7 * sin(55)) / 10)]),
  R('There are two possible values of side <em>c</em>', [(7 * sin(180 - 30 - B1)) / sin(30), (7 * sin(B1 - 30)) / sin(30)], sf3),
  R('{m:A=30deg}, {m:a=5} and {m:b=10}', asin((10 * sin(30)) / 5), int, [0]),
  // 6 bearings
  R('bearing of B from A is 072', 72 + 180, int, [108]),
  R('bearing of B from A is 245', 245 - 180, int, [425]),
  R('8 km from P to Q on a bearing of 040', PR_WALK, sf3, [cosSide(8, 10, 80)]),
  R('In the walk above', 40 + asin((10 * sin(PQR100)) / PR_WALK), int, [asin((10 * sin(PQR100)) / PR_WALK)]),
  // flip it
  R('{m:a=9.5} cm, {m:A=38deg} and {m:B=71deg}', sineSide(9.5, 38, 71), sf3, [sineSide(9.5, 71, 38)]),
  R('sides {m:a=5}, {m:b=8} and {m:c=10}', cosAngle(10, 5, 8), dp1, [180 - cosAngle(10, 5, 8)]),
  R('sides of 8 cm and 10 cm and an area of 28', 180 - asin(28 / 40), dp1, [asin(28 / 40)]),
  R('{m:sin B=0.62}', [asin(0.62), 180 - asin(0.62)], dp1),
  // mixed review
  R('{m:a=9} cm, {m:A=48deg} and {m:B=67deg}', sineSide(9, 48, 67), sf3, [sineSide(9, 67, 48)]),
  R('sides 6, 8 and 12', cosAngle(12, 6, 8), dp1, [180 - cosAngle(12, 6, 8)]),
  R('{m:A=70deg}, {m:b=9} cm and {m:c=14} cm', area(9, 14, 70), sf3, [126 * sin(70)]),
  R('bearing of A from B is 320', 320 - 180, int, [500]),
  R('sides 7, 8 and 9', cosAngle(7, 8, 9), dp1, [[2 / 3, sf3]]),
  R('{m:b=5}, {m:c=12} and {m:A=90deg}', cosSide(5, 12, 90), int, [169]),
  R('{m:A=110deg}, {m:a=15} and {m:b=12}', sineAngle(12, 110, 15), dp1, [180 - sineAngle(12, 110, 15)]),
  // exam style
  R('{m:b=12} cm, {m:c=15} cm and {m:A=64deg}', cosSide(12, 15, 64), sf3, [144 + 225 - 360 * cos(64)]),
  R('{m:a=14} cm, {m:b=11} cm and {m:A=62deg}', sineAngle(11, 62, 14), dp1, [180 - sineAngle(11, 62, 14)]),
  R('{m:A=35deg}, {m:a=8} cm and {m:b=11} cm', [asin((11 * sin(35)) / 8), 180 - asin((11 * sin(35)) / 8)], dp1),
  R('{m:AB=7} cm, {m:AC=10} cm and area 25', cosSide(7, 10, angleAtA), sf3, [49 + 100 - 140 * cos(angleAtA)]),
  R('A ship leaves port P and sails 20 km', PR_SHIP, sf3, [cosSide(20, 14, 85)]),
  R('Using the same journey', 75 + asin((14 * sin(95)) / PR_SHIP), int, [asin((14 * sin(95)) / PR_SHIP)]),
  R('{m:a=8.5} cm, {m:b=11.2} cm and {m:C=41deg}', area(8.5, 11.2, 41), sf3, [0.5 * 8.5 * 11.2]),
];

function questions() {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const raw = /<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongs = [...(/<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '').matchAll(/data-if="([^"]*)"/g)].flatMap((m) => decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean));
    const fig = /\{fig:([a-z0-9-]+)\}/.exec(block.split('<ol class="ladder">')[0])?.[1] ?? null;
    return { raw, text: decode(raw), answers, wrongs, fig, block, mode: /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? '' };
  });
}
const numbers = (key: string) => key.split(/\s+or\s+/).map(Number);

test('every typed answer that needs rounding is recomputed to the rounding the question states', () => {
  const qs = questions();
  const problems: string[] = [];
  for (const c of CASES) {
    const hits = qs.filter((q) => q.raw.includes(c.find));
    if (hits.length !== 1) { problems.push(`"${c.find}" matches ${hits.length} questions`); continue; }
    const want = (Array.isArray(c.answer) ? c.answer : [c.answer]).map(c.round);
    const got = numbers(hits[0].answers[0]);
    if (got.length !== want.length || got.some((g, i) => Math.abs(g - want[i]) > 1e-9)) problems.push(`"${c.find}": the page says ${hits[0].answers[0]}, recomputed ${want.join(' or ')}`);
    for (const w of c.wrongs ?? []) {
      const wr = Array.isArray(w) ? w[1](w[0]) : c.round(w);
      if (!hits[0].wrongs.some((v) => numbers(v).some((x) => Math.abs(x - wr) < 1e-9))) problems.push(`"${c.find}": no wrong-answer entry for the slip value ${wr}`);
      if (want.some((x) => Math.abs(x - wr) < 1e-9)) problems.push(`"${c.find}": the slip value ${wr} is the right answer`);
    }
  }
  expect(CASES.length).toBeGreaterThan(40);
  expect(problems).toEqual([]);
});

test('every typed question that states a rounding has a recomputed case, and no wrong answer is the right answer', () => {
  const qs = questions().filter((q) => q.mode === 'value');
  const uncovered = qs.filter((q) => /significant figures|decimal place|nearest degree/.test(q.text) && !CASES.some((c) => q.raw.includes(c.find))).map((q) => q.text.slice(0, 70));
  expect(uncovered).toEqual([]);
  for (const q of qs) {
    if (q.answers[0]?.includes(' or ')) continue; // a partial answer to a two-answer question is a deliberate wrong answer
    const right = new Set(q.answers.flatMap(numbers).filter((n) => !Number.isNaN(n)));
    for (const w of q.wrongs) {
      const wn = numbers(w);
      if (wn.length === 1 && right.has(wn[0])) throw new Error(`${q.text.slice(0, 60)}: wrong-answer value ${w} is a right answer`);
    }
  }
});

test('the worked examples state values that recompute', () => {
  const checks: [string, number, (x: number) => number][] = [
    ['{m:a=8.51}', sineSide(12, 65, 40), sf3],
    ['{m:B=sin^(-1)(0.7048)=44.8deg}', sineAngle(9, 70, 12), dp1],
    ['sin(38deg))=11.3}', sineSide(7, 38, 82), sf3],
    ['{m:a=sqrt(52.42)=7.24}', cosSide(7, 9, 52), sf3],
    ['{m:C=cos^(-1)(-0.1111)=96.4deg}', cosAngle(12, 7, 9), dp1],
    ['{m:a=14}', cosSide(6, 10, 120), int],
    ['is 27.1 cm&sup2;', area(11, 8, 38), (x) => Number(x.toPrecision(3))],
    ['is 22.1 cm&sup2;', area(9, 6, 125), (x) => Number(x.toPrecision(3))],
    ['{m:C=sin^(-1)(0.6857)=43.3deg}', asin(24 / 35), dp1],
    ['{m:"Area"=frac(1, 2)*8*9*sin(80.4deg)=36 sin(80.4deg)=35.5}', area(8, 9, cosAngle(11, 8, 9)), (x) => Number(x.toPrecision(3))],
    ['{m:B=sin^(-1)(0.7143)=45.6deg}', B1, dp1],
    ['{m:30+134.4=164.4}', 30 + (180 - dp1(B1)), dp1],
    ['{m:c=frac(7 sin(104.4deg), sin(30deg))=13.6}', (7 * sin(180 - 30 - B1)) / sin(30), sf3],
    ['{m:c=frac(7 sin(15.6deg), sin(30deg))=3.76}', (7 * sin(B1 - 30)) / sin(30), sf3],
    ['{m:sin B=frac(9 sin(40deg), 5)=1.157}', (9 * sin(40)) / 5, (x) => Math.round(x * 1000) / 1000],
    ['{m:sin B=frac(7 sin(55deg), 10)=0.5734}', (7 * sin(55)) / 10, (x) => Math.round(x * 10000) / 10000],
    ['{m:PR=sqrt(298.88)=17.3}', cosSide(12, 9, 110), sf3],
    ['{m:QPR=29.3deg}', asin((9 * sin(110)) / cosSide(12, 9, 110)), dp1],
    ['{m:AC=sqrt(153.94)=12.4}', cosSide(6, 9, 110), sf3],
    ['{m:D=cos^(-1)(-0.3655)=111.4deg}', cosAngle(cosSide(6, 9, 110), 8, 7), dp1],
    ['{m:C=sin^(-1)(0.7407)=47.8deg}', asin(40 / 54), dp1],
    ['{m:b=frac(9.5 sin(71deg), sin(38deg))=14.6}', sineSide(9.5, 38, 71), sf3],
    ['so {m:C=97.9deg}', cosAngle(10, 5, 8), dp1],
  ];
  const problems: string[] = [];
  for (const [text, value, round] of checks) {
    if (!SOURCE.includes(text)) { problems.push(`the page no longer contains ${text}`); continue; }
    const shown = [...text.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
    const want = round(value);
    if (!shown.some((n) => Math.abs(n - want) < 1e-9)) problems.push(`${text} should show ${want}`);
  }
  expect(problems).toEqual([]);
});

// ---- the figures ----
type Fact = { from: string; to: string; value: number };
type Ang = { at: string; from: string; to: string; value: number };
type Geo = { svg: string; corners: Record<string, [number, number]>; lengths?: Fact[]; angles?: Ang[]; areas?: { corners: string[]; value: number }[]; unknown?: { kind: string; from: string; to: string; at?: string } | null; bearings?: { from: string; to: string; value: number; km: number }[]; kind: string };
const dist = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const drawnAngle = (k: Record<string, number[]>, at: string, from: string, to: string) => {
  const a = [k[from][0] - k[at][0], k[from][1] - k[at][1]];
  const b = [k[to][0] - k[at][0], k[to][1] - k[at][1]];
  return acos((a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b)));
};
const drawnArea = (k: Record<string, number[]>, names: string[]) => {
  const [p, q, r] = names.map((n) => k[n]);
  return Math.abs((q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1])) / 2;
};
const textOf = (svg: string) => [...svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/​/g, '').trim());

async function allGeometry() {
  const mod = await import('../src/book/alevel/figures/trig-triangles.mjs');
  return { ids: Object.keys(mod.FIGURES), geo: (id: string) => mod.GEOMETRY(id) as Geo };
}

test('every figure is drawn to the measurements it states: lengths, angles and areas', async () => {
  const { ids, geo } = await allGeometry();
  expect(ids.length).toBeGreaterThanOrEqual(25);
  const problems: string[] = [];
  let measured = 0;
  for (const id of ids) {
    const g = geo(id);
    if (g.kind !== 'shape') continue;
    const lengths = g.lengths ?? [];
    const scales = lengths.map((l) => dist(g.corners[l.from], g.corners[l.to]) / l.value);
    for (const s of scales) { measured += 1; if (Math.abs(s / scales[0] - 1) > 0.005) problems.push(`${id}: the stated lengths are not drawn in proportion`); }
    for (const a of g.angles ?? []) {
      measured += 1;
      if (Math.abs(drawnAngle(g.corners, a.at, a.from, a.to) - a.value) > 0.06) problems.push(`${id}: the angle at ${a.at} is drawn as ${drawnAngle(g.corners, a.at, a.from, a.to).toFixed(2)}, not ${a.value}`);
    }
    for (const ar of g.areas ?? []) {
      measured += 1;
      const s = scales[0] ?? 1;
      if (Math.abs(drawnArea(g.corners, ar.corners) / (s * s) / ar.value - 1) > 0.005) problems.push(`${id}: the drawn area is not ${ar.value}`);
    }
    // every stated measurement is written on the picture
    const labels = textOf(g.svg).join(' | ');
    for (const l of lengths) if (!labels.includes(`${l.value} cm`)) problems.push(`${id}: the label "${l.value} cm" is missing`);
    for (const a of g.angles ?? []) if (!labels.includes(`${a.value}°`)) problems.push(`${id}: the label "${a.value}°" is missing`);
  }
  expect(measured).toBeGreaterThan(60);
  expect(problems).toEqual([]);
});

test('each side label sits nearer its own edge than any other drawn edge, dashed and unlabelled ones included', async () => {
  const { ids, geo } = await allGeometry();
  const problems: string[] = [];
  let checked = 0;
  const H = 400; // the drawing height: corners have y up, the text has y down
  const toSegment = (p: number[], a: number[], b: number[]) => {
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };
  for (const id of ids) {
    const g = geo(id) as Geo & { edges?: number[][][]; sideLabels?: { text: string; from: string; to: string }[] };
    if (g.kind !== 'shape' || !g.sideLabels?.length) continue;
    const name = (pt: number[]) => Object.keys(g.corners).find((k) => Math.hypot(g.corners[k][0] - pt[0], g.corners[k][1] - pt[1]) < 0.5) ?? '?';
    // every edge drawn in the figure, with its corner names
    const edges = g.edges!.map(([a, b]) => ({ id: [name(a), name(b)].sort().join('-'), a, b }));
    expect(edges.every((e) => !e.id.includes('?')), `${id}: an edge does not join two corners`).toBe(true);
    // the "N cm" labels in the picture, in the order they were drawn
    const texts = [...g.svg.matchAll(/<text[^>]* x="([\d.-]+)" y="([\d.-]+)" text-anchor="(\w+)">([^<]+)<\/text>/g)];
    // the tagged labels, found in the picture in the order they were drawn
    let from = 0;
    const found = g.sideLabels.map((l) => {
      const at = texts.findIndex((t, k) => k >= from && t[4] === l.text);
      from = at + 1;
      return texts[at];
    });
    expect(found.every(Boolean), `${id}: a tagged label is not in the picture`).toBe(true);
    found.forEach((m, i) => {
      checked += 1;
      const half = m[4].length * 6.5 + 4;
      const x = Number(m[1]) + (m[3] === 'start' ? half : m[3] === 'end' ? -half : 0);
      const at = [x, H - (Number(m[2]) - 8)]; // the text's baseline was moved down 8 to centre it
      const nearest = edges.reduce((best, e) => (toSegment(at, e.a, e.b) < toSegment(at, best.a, best.b) ? e : best));
      const own = [g.sideLabels![i].from, g.sideLabels![i].to].sort().join('-');
      if (nearest.id !== own) problems.push(`${id}: the label "${m[4]}" belongs to ${own} but is nearest ${nearest.id}`);
    });
  }
  expect(checked).toBeGreaterThan(30);
  expect(problems).toEqual([]);
});


test('every bearing diagram is drawn from its bearings and distances', async () => {
  const { ids, geo } = await allGeometry();
  const problems: string[] = [];
  let legs = 0;
  for (const id of ids) {
    const g = geo(id);
    if (g.kind !== 'bearing') continue;
    const scales: number[] = [];
    for (const b of g.bearings ?? []) {
      legs += 1;
      const dx = g.corners[b.to][0] - g.corners[b.from][0];
      const dy = g.corners[b.to][1] - g.corners[b.from][1];
      const bearing = (Math.atan2(dx, dy) / RAD + 360) % 360;
      if (Math.abs(bearing - b.value) > 0.05) problems.push(`${id}: ${b.from} to ${b.to} is drawn on ${bearing.toFixed(1)}, not ${b.value}`);
      scales.push(Math.hypot(dx, dy) / b.km);
      if (!textOf(g.svg).includes(`${String(b.value).padStart(3, '0')}°`)) problems.push(`${id}: the bearing ${b.value} is not written on the picture`);
      if (!textOf(g.svg).includes(`${b.km} km`) && id !== 'trig-triangles-back-bearing') problems.push(`${id}: the distance ${b.km} km is not written on the picture`);
    }
    if (scales.some((s) => Math.abs(s / scales[0] - 1) > 0.005)) problems.push(`${id}: the legs are not drawn in proportion`);
  }
  // the back bearing really is 180 degrees round
  const back = geo('trig-triangles-back-bearing');
  const d = [back.corners.A[0] - back.corners.B[0], back.corners.A[1] - back.corners.B[1]];
  expect((Math.atan2(d[0], d[1]) / RAD + 360) % 360).toBeCloseTo(252, 1);
  expect(legs).toBeGreaterThanOrEqual(7);
  expect(problems).toEqual([]);
});

test('a question figure is drawn to the question and its picture never gives the answer', async () => {
  const { ids, geo } = await allGeometry();
  const qs = questions();
  const problems: string[] = [];
  let checked = 0;
  for (const id of ids) {
    const user = qs.find((q) => q.fig === id);
    if (!user) continue;
    const g = geo(id);
    const key = user.answers[0];
    const stated = [...(g.lengths ?? []).map((l) => l.value), ...(g.angles ?? []).map((a) => a.value), ...(g.bearings ?? []).flatMap((b) => [b.km, b.value])];
    for (const v of stated) {
      const inText = new RegExp(`(?<![\\d.])${v}(?![\\d])`).test(user.text) || new RegExp(`(?<![\\d.])${String(v).padStart(3, '0')}(?![\\d])`).test(user.text);
      if (!inText) problems.push(`${id}: the question does not state ${v}`);
    }
    if (g.unknown && g.kind === 'shape') {
      checked += 1;
      const scale = dist(g.corners[g.lengths![0].from], g.corners[g.lengths![0].to]) / g.lengths![0].value;
      const drawn = g.unknown.kind === 'length' ? dist(g.corners[g.unknown.from], g.corners[g.unknown.to]) / scale : drawnAngle(g.corners, g.unknown.at!, g.unknown.from, g.unknown.to);
      const want = Number(key);
      const tolerance = g.unknown.kind === 'length' ? want * 0.006 : 0.06;
      if (Math.abs(drawn - want) > tolerance) problems.push(`${id}: the unknown is drawn as ${drawn.toFixed(2)} but the answer is ${want}`);
      if (textOf(g.svg).some((t) => t.includes(key))) problems.push(`${id}: the answer ${key} is written on the picture`);
    }
    const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(g.svg)?.[1] ?? '';
    expect(desc, id).not.toMatch(/answer|solution|is found to be/i);
  }
  expect(checked).toBeGreaterThanOrEqual(5);
  expect(problems).toEqual([]);
});

test('the ambiguous figure shows two triangles that both fit, and the flip figure two with the same area', async () => {
  const { geo } = await allGeometry();
  const amb = geo('trig-triangles-ambiguous');
  const k = amb.corners;
  const s = dist(k.A, k.C) / 10;
  expect(dist(k.C, k.B_1) / s).toBeCloseTo(7, 1);
  expect(dist(k.C, k.B_2) / s).toBeCloseTo(7, 1);
  expect(drawnAngle(k, 'A', 'B_1', 'C')).toBeCloseTo(30, 1);
  expect(drawnAngle(k, 'A', 'B_2', 'C')).toBeCloseTo(30, 1);
  expect(drawnAngle(k, 'B_1', 'A', 'C') + drawnAngle(k, 'B_2', 'A', 'C')).toBeCloseTo(180, 0); // B_1 = 45.6 and B_2 = 134.4
  const flip = geo('trig-triangles-flip-area');
  const f = flip.corners;
  const fs = dist(f.A, f.C) / 12;
  expect(drawnArea(f, ['A', 'B_1', 'C']) / (fs * fs)).toBeCloseTo(40, 1);
  expect(drawnArea(f, ['A', 'B_2', 'C']) / (fs * fs)).toBeCloseTo(40, 1);
});

test('a defined word is linked with its plain name, with no bracketed extra in the link text', async ({ page }) => {
  await page.goto('/courses/a-level/trig-triangles.html');
  const texts = await page.locator('main a.term:not(.words-strip a)').allTextContents();
  expect(texts.length).toBeGreaterThan(8);
  expect(texts.filter((t) => t.includes('('))).toEqual([]);
});
