import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Definite integrals and area page that a general test cannot make:
//  - every typed answer is RECOMPUTED here by numerical integration (Simpson's rule, written below, not the page's method),
//  - every numeric wrong-answer value is recomputed from the slip its message names,
//  - every "int(a, b) polynomial dx = value" written in the working is recomputed,
//  - every figure's curves, marked points and shaded areas are compared with the maths, and no label touches a curve.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'definite-integrals.html'), 'utf8');

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', hellip: '...' };
const decode = (t: string) => t.replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);

type Fn = (x: number) => number;
/** The integral of fn from a to b by Simpson's rule with 20000 strips (exact for cubics, and tiny error for the smooth curves used here). */
function integral(fn: Fn, a: number, b: number): number {
  const n = 20000;
  const h = (b - a) / n;
  let s = fn(a) + fn(b);
  for (let i = 1; i < n; i += 1) s += fn(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

const sq: Fn = (x) => x * x;
const num = (t: string) => (t.includes('/') ? t.split('/').map(Number).reduce((a, b) => a / b) : Number(t));
const same = (a: number, b: number) => Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(b));

function questions() {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const head = block.split('<ol class="ladder">')[0];
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongs = [...(/<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block.split('<div class="solution">')[0])?.[1] ?? '').matchAll(/data-if="([^"]*)"/g)].flatMap((m) => decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean));
    return { head, answers, wrongs, mode: /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? '', type: /data-type="([^"]*)"/.exec(attrs)?.[1] ?? '', block };
  });
}

type Slip = [string, number];
type Case = { find: string; key: number; wrongs: Slip[] };
const C = (find: string, key: number, wrongs: Slip[] = []): Case => ({ find, key, wrongs });
const I = integral;
const abs = Math.abs;

const CASES: Case[] = [
  // warm-up and recap
  C('Work out the value of {m:2x^2+x}', 2 * 9 - 3, [['-21', 2 * -9 - 3], ['33', (2 * -3) ** 2 - 3]]),
  C('Work out {m:5-(-2)}', 7, [['3', 5 - 2], ['-7', -2 - 5]]),
  C('Find the positive x-value where it crosses', 2, [['4', 4]]),
  C('Give the root that is not zero', 3, [['0', 0], ['-3', -3]]),
  // 1 the definite integral
  C('How wide is that region', 7 - 2, [['9', 2 + 7], ['14', 2 * 7]]),
  C('Its area is 12 square units', 12, [['36', 12 * 3], ['4', 12 / 3]]),
  // 2 upper minus lower
  C('Work out {m:int(0, 3) x^2 dx}', I(sq, 0, 3), [['27', 3 ** 3]]),
  C('Work out {m:int(1, 4) 2x dx}', I((x) => 2 * x, 1, 4), [['16', 4 ** 2], ['17', 4 ** 2 + 1]]),
  C('Work out {m:int(1, 2) (6x^2+2) dx}', I((x) => 6 * x * x + 2, 1, 2), [['20', 2 * 8 + 2 * 2], ['24', 20 + 4]]),
  C('definite-integrals-q-area-curve', I((x) => x * x + 1, 1, 2), [['14/3', 8 / 3 + 2], ['6', 14 / 3 + 4 / 3]]),
  C('Work out {m:int(0, 2) (x^3+x) dx}', I((x) => x ** 3 + x, 0, 2), [['20', 2 ** 4 + 2 ** 2]]),
  // 3 area above the axis
  C('{m:y=1-x^2} and the x-axis', I((x) => 1 - x * x, -1, 1), [['2/3', I((x) => 1 - x * x, 0, 1)]]),
  C('under the curve {m:y=3x^2+2}', I((x) => 3 * x * x + 2, 1, 2), [['12', 8 + 4], ['15', 12 + 3]]),
  C('Find the area under {m:y=sqrt(x)}', I(Math.sqrt, 1, 4), [['16/3', (2 / 3) * 8], ['6', (2 / 3) * 8 + 2 / 3]]),
  C('definite-integrals-q-k', 3, [['4.5', 9 / 2], ['-3', -3]]),
  C('{m:y=12x-3x^2}', I((x) => 12 * x - 3 * x * x, 0, 4), [['128', 12 * 16 - 64]]),
  C('Find the area under {m:y=(x+1)^2}', I((x) => (x + 1) ** 2, 0, 2), [['14/3', I((x) => x * x + 1, 0, 2)]]),
  // 4 below the axis
  C('definite-integrals-q-below', abs(I((x) => x * x - 3 * x, 0, 3)), [['-9/2', I((x) => x * x - 3 * x, 0, 3)]]),
  C('Work out {m:int(0, 2) (3x^2-12) dx}', I((x) => 3 * x * x - 12, 0, 2), [['16', abs(I((x) => 3 * x * x - 12, 0, 2))]]),
  C('Find the area between the curve {m:y=3x^2-12}', abs(I((x) => 3 * x * x - 12, 0, 2)), [['-16', I((x) => 3 * x * x - 12, 0, 2)]]),
  C('Given that {m:int(1, 4) f(x) dx=7}', -7, [['7', 7]]),
  C('{m:y=x^2-9} and the x-axis', abs(I((x) => x * x - 9, -3, 3)), [['-36', I((x) => x * x - 9, -3, 3)]]),
  // 5 regions that cross the axis
  C('definite-integrals-q-split', abs(I((x) => x * x - 1, 0, 1)) + abs(I((x) => x * x - 1, 1, 2)), [['2/3', I((x) => x * x - 1, 0, 2)], ['4/3', abs(I((x) => x * x - 1, 1, 2))]]),
  C('Work out the integral {m:int(0, 3) (x^2-4) dx}', I((x) => x * x - 4, 0, 3), [['23/3', abs(I((x) => x * x - 4, 0, 2)) + abs(I((x) => x * x - 4, 2, 3))]]),
  C('{m:y=x^2-2x} crosses', abs(I((x) => x * x - 2 * x, -1, 0)) + abs(I((x) => x * x - 2 * x, 0, 2)) + abs(I((x) => x * x - 2 * x, 2, 3)), [['4/3', I((x) => x * x - 2 * x, -1, 3)], ['8/3', abs(I((x) => x * x - 2 * x, 0, 2)) + abs(I((x) => x * x - 2 * x, 2, 3))]]),
  C('definite-integrals-q-cubic', abs(I((x) => x ** 3 - x, -1, 0)) + abs(I((x) => x ** 3 - x, 0, 1)), [['0', I((x) => x ** 3 - x, -1, 1)]]),
  C('{m:y=x^2-4x+3} crosses', abs(I((x) => x * x - 4 * x + 3, 0, 1)) + abs(I((x) => x * x - 4 * x + 3, 1, 3)), [['0', I((x) => x * x - 4 * x + 3, 0, 3)], ['4/3', abs(I((x) => x * x - 4 * x + 3, 0, 1))]]),
  // 6 a line and a curve
  C('definite-integrals-q-line-curve', I((x) => 2 * x + 3 - x * x, -1, 3), [['-32/3', -I((x) => 2 * x + 3 - x * x, -1, 3)], ['20', I((x) => 2 * x + 3, -1, 3)]]),
  C('positive x-coordinate of the meeting point', 3, [['9', 9]]),
  C('The line {m:y=x+6} meets the curve {m:y=x^2} at {m:x=-2}', I((x) => x + 6 - x * x, -2, 3), [['-125/6', -I((x) => x + 6 - x * x, -2, 3)], ['27/2', I((x) => x + 6 - x * x, 0, 3)]]),
  C('Find the area enclosed between the line {m:y=9}', I((x) => 9 - x * x, -3, 3), [['54', I(() => 9, -3, 3)]]),
  C('The area under the line {m:y=x+2}', 15 / 2 - 3, [['21/2', 15 / 2 + 3]]),
  // flip it
  C('write down {m:int(3, 1) x^2 dx}', -I(sq, 1, 3), [['26/3', I(sq, 1, 3)]]),
  C('find {m:int(0, 6) f(x) dx}', 5 + -3, [['8', 5 + 3]]),
  C('Work out {m:int(5, 2) 3 dx}', -I(() => 3, 2, 5), [['9', I(() => 3, 2, 5)]]),
  // mixed review
  C('Work out {m:int(1, 2) (4x^3-6x) dx}', I((x) => 4 * x ** 3 - 6 * x, 1, 2), [['4', 16 - 12], ['2', 4 + -2]]),
  C('{m:y=frac(1, x^2)}', I((x) => 1 / (x * x), 1, 2), [['-1/2', -1 / 2]]),
  C('int(0, a) x dx=8', 4, [['16', 16], ['-4', -4]]),
  C('{m:y=x^2-4x} and the x-axis', abs(I((x) => x * x - 4 * x, 0, 4)), [['-32/3', I((x) => x * x - 4 * x, 0, 4)]]),
  C('int(1, k) 2x dx=8', 3, [['9', 9]]),
  C('The line {m:y=x} meets the curve', I((x) => x - x * x, 0, 1), [['1/2', I((x) => x, 0, 1)], ['-1/6', -I((x) => x - x * x, 0, 1)]]),
  // exam style
  C('Find the value of {m:int(1, 3) (6x^2+4x) dx}', I((x) => 6 * x * x + 4 * x, 1, 3), [['72', 54 + 18], ['76', 72 + 4]]),
  C('crosses the x-axis at {m:x=2} and {m:x=4}', abs(I((x) => x * x - 6 * x + 8, 2, 4)), [['-4/3', I((x) => x * x - 6 * x + 8, 2, 4)], ['16/3', abs(I((x) => x * x - 6 * x + 8, 0, 4))]]),
  C('{m:y=x^3-9x} and the x-axis', abs(I((x) => x ** 3 - 9 * x, -3, 0)) + abs(I((x) => x ** 3 - 9 * x, 0, 3)), [['0', I((x) => x ** 3 - 9 * x, -3, 3)], ['81/4', abs(I((x) => x ** 3 - 9 * x, 0, 3))]]),
  C('The line {m:y=3x+10}', I((x) => 3 * x + 10 - x * x, -2, 5), [['-343/6', -I((x) => 3 * x + 10 - x * x, -2, 5)], ['275/6', I((x) => 3 * x + 10 - x * x, 0, 5)]]),
  C('{m:int(0, k) (2x+3) dx=10}', 2, [['-5', -5]]),
];

test('every typed numeric answer is recomputed, and every slip value is recomputed from the slip its message names', () => {
  const qs = questions();
  const problems: string[] = [];
  for (const c of CASES) {
    const hits = qs.filter((q) => q.head.includes(c.find));
    if (hits.length !== 1) { problems.push(`"${c.find}" matches ${hits.length} questions`); continue; }
    const q = hits[0];
    if (q.answers.length === 0) problems.push(`"${c.find}": no answer`);
    for (const a of q.answers) if (!same(num(a), c.key)) problems.push(`"${c.find}": the page accepts ${a}, recomputed ${c.key}`);
    const listed = c.wrongs.map(([t]) => num(t));
    for (const w of q.wrongs) if (!listed.some((v) => same(v, num(w)))) problems.push(`"${c.find}": wrong-answer value ${w} is not tied to a slip in this test`);
    for (const [text, slip] of c.wrongs) {
      if (!q.wrongs.some((w) => same(num(w), num(text)))) problems.push(`"${c.find}": no wrong-answer entry for ${text}`);
      if (!same(num(text), slip)) problems.push(`"${c.find}": ${text} is not what its slip gives (${slip})`);
      if (same(num(text), c.key)) problems.push(`"${c.find}": the slip value ${text} is the right answer`);
    }
  }
  expect(CASES.length).toBeGreaterThan(45);
  expect(problems).toEqual([]);
});

test('every typed value question on the page has a recomputed case, and none of them has a decimal key that is not exact', () => {
  const uncovered = questions().filter((q) => q.mode === 'value').filter((q) => !CASES.some((c) => q.head.includes(c.find))).map((q) => q.head.slice(0, 90));
  expect(uncovered).toEqual([]);
  const decimals = questions().flatMap((q) => q.answers).filter((a) => /\./.test(a));
  expect(decimals).toEqual([]);
});

test('the page has the questions, sets and figures the book asks for', () => {
  const qs = questions();
  expect(qs.length).toBeGreaterThanOrEqual(55);
  expect(qs.length).toBeLessThanOrEqual(65);
  expect((SOURCE.match(/<h2>\d\. /g) ?? []).length).toBeGreaterThanOrEqual(4);
  expect((SOURCE.match(/<h2>\d\. /g) ?? []).length).toBeLessThanOrEqual(6);
  expect((SOURCE.match(/class="worked"/g) ?? []).length).toBe((SOURCE.match(/class="worked faded"/g) ?? []).length + 1); // the flip section has a worked example with no faded twin
  const figs = [...SOURCE.matchAll(/\{fig:([a-z0-9-]+)\}/g)].map((m) => m[1]);
  expect(figs.length).toBeGreaterThanOrEqual(12);
  expect(figs.length).toBeLessThanOrEqual(20);
  expect(new Set(figs).size).toBe(figs.length);
  // each question figure comes straight after its question text
  for (const q of qs.filter((x) => /\{fig:definite-integrals-q-/.test(x.block.split('<ol class="ladder">')[0]))) {
    expect(q.block, q.head.slice(0, 60)).toMatch(/<p class="qtext">[\s\S]*?<\/p>\s*<figure class="qfig-lg">\{fig:definite-integrals-q-[a-z-]+\}<\/figure>\s*<ol class="ladder">/);
  }
});

test('the skip link goes to the first lesson heading', () => {
  const heading = /<h2>(1\. [^<]*)<\/h2>/.exec(SOURCE)?.[1] ?? '';
  const slug = decode(heading).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  expect(`#s-${slug}`).toBe(/href="(#s-[^"]*)">Skip to the lesson/.exec(SOURCE)?.[1]);
});

// ---- every "int(a, b) polynomial dx = value" written in the working ----
function evalPoly(text: string): Fn | null {
  const t = text.replace(/\s+/g, '');
  if (/[^0-9x+\-*^().]/.test(t)) return null;
  const js = t.replace(/(\d|\))(x|\()/g, '$1*$2').replace(/\^/g, '**').replace(/(\d)\(/g, '$1*(');
  try { return new Function('x', `return ${js};`) as Fn; } catch { return null; }
}
test('every definite integral of a polynomial written with its value in the working is recomputed', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const m of SOURCE.matchAll(/\{m:int\((-?\d+), (-?\d+)\) ([^{}=]*?) dx=(-?)(frac\((\d+), (\d+)\)|\d+)\}/g)) {
    const fn = evalPoly(m[3]);
    if (!fn) continue;
    const shown = (m[4] ? -1 : 1) * (m[6] ? Number(m[6]) / Number(m[7]) : Number(m[5]));
    checked += 1;
    if (!same(shown, I(fn, Number(m[1]), Number(m[2])))) problems.push(`${m[0]} should be ${I(fn, Number(m[1]), Number(m[2]))}`);
  }
  expect(checked).toBeGreaterThan(8);
  expect(problems).toEqual([]);
});

test('every simple sum written as {m:a*b=c} or {m:a+b=c} on the page is right', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const m of SOURCE.matchAll(/\{m:(-?\d+(?:\.\d+)?)([-+*])(-?\d+(?:\.\d+)?)=(-?\d+(?:\.\d+)?)\}/g)) {
    const [a, op, b, c] = [Number(m[1]), m[2], Number(m[3]), Number(m[4])];
    const got = op === '+' ? a + b : op === '-' ? a - b : a * b;
    checked += 1;
    if (Math.abs(got - c) > 1e-9) problems.push(`${m[0]} should end in ${got}`);
  }
  expect(checked).toBeGreaterThan(4);
  expect(problems).toEqual([]);
});

// Evaluate a chain written only with numbers, frac(a, b), + - * ^ and brackets, and check every "=" in it holds.
function evalNumeric(src: string): number | null {
  let t = src.replace(/\s+/g, '');
  for (let guard = 0; guard < 50 && t.includes('frac('); guard += 1) {
    const at = t.indexOf('frac(');
    let depth = 0;
    let comma = -1;
    let end = -1;
    for (let i = at + 4; i < t.length; i += 1) {
      if (t[i] === '(') depth += 1;
      else if (t[i] === ')') { depth -= 1; if (depth === 0) { end = i; break; } } else if (t[i] === ',' && depth === 1) comma = i;
    }
    if (end < 0 || comma < 0) return null;
    t = `${t.slice(0, at)}((${t.slice(at + 5, comma)})/(${t.slice(comma + 1, end)}))${t.slice(end + 1)}`;
  }
  if (/[^0-9.+\-*/^()]/.test(t)) return null;
  try { return new Function(`return (${t.replace(/\^/g, '**')});`)() as number; } catch { return null; }
}
test('every chain of numbers joined by = in the working is true', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const m of SOURCE.matchAll(/\{md?:([^}]*)\}/g)) {
    const parts = m[1].split('=');
    if (parts.length < 2) continue;
    const values = parts.map(evalNumeric);
    if (values.some((v) => v === null)) continue;
    checked += 1;
    values.forEach((v, i) => { if (!same(v as number, values[0] as number)) problems.push(`${m[0]}: side ${i + 1} is ${v}, side 1 is ${values[0]}`); });
  }
  expect(checked).toBeGreaterThan(40);
  expect(problems).toEqual([]);
});

test('every "Now you finish it" blank holds the recomputed value', () => {
  const blanks = [...SOURCE.matchAll(/<span class="blank"(?: data-mode="exact")? data-answers="([^"]*)">/g)].map((m) => m[1].split(';'));
  const want: (number | string)[] = [
    2, 5, '3x+1', // section 1: the limits and the integrand
    'x^4+x^2', 16 + 4, I((x) => 4 * x ** 3 + 2 * x, 1, 2), // section 2
    6, I((x) => 6 * x - x * x, 0, 6), I((x) => 6 * x - x * x, 0, 6), // section 3: the root, F(6), the area
    I((x) => x * x - 4, 1, 2), abs(I((x) => x * x - 4, 1, 2)), // section 4
    abs(I((x) => x ** 3 - 4 * x, 0, 2)), abs(I((x) => x ** 3 - 4 * x, -2, 0)) + abs(I((x) => x ** 3 - 4 * x, 0, 2)), // section 5
    2, 4 - 8 / 3, I((x) => 2 * x - x * x, 0, 2), // section 6
  ];
  expect(blanks.length).toBe(want.length);
  blanks.forEach((answers, i) => {
    for (const a of answers) {
      if (typeof want[i] === 'string') expect(a, `blank ${i}`).toBe(want[i]);
      else expect(same(num(a), want[i] as number), `blank ${i}: ${a} should be ${want[i]}`).toBe(true);
    }
  });
});

test('no equation holds an ellipsis or a not-equals written with an exclamation mark', () => {
  const bad = [...SOURCE.matchAll(/\{md?:([^}]*)\}/g)].map((m) => m[1]).filter((t) => /(\.\.\.|…|&hellip;|!=)/.test(t));
  expect(bad).toEqual([]);
});

// ---- figures ----
async function figureModule() {
  const mod = await import('../src/book/alevel/figures/definite-integrals.mjs');
  for (const id of Object.keys(mod.FIGURES)) mod.FIGURES[id]();
  return mod;
}
const cube3 = (x: number) => x ** 3;
// The curves each figure must draw, in drawing order, and the area of each shaded region, written here from the maths.
const EXPECTED: Record<string, { curves: Fn[]; areas: number[] }> = {
  'definite-integrals-area-under': { curves: [sq], areas: [26 / 3] },
  'definite-integrals-strip': { curves: [(x) => 0.25 * x * x + 1], areas: [I((x) => 0.25 * x * x + 1, 1, 3), I((x) => 0.25 * x * x + 1, 3, 3.6)] },
  'definite-integrals-constant': { curves: [sq, (x) => x * x + 2], areas: [] },
  'definite-integrals-above-axis-roots': { curves: [(x) => 4 * x - x * x], areas: [32 / 3] },
  'definite-integrals-below': { curves: [(x) => x * x - 4], areas: [16 / 3] },
  'definite-integrals-split': { curves: [(x) => x * x - 4], areas: [16 / 3, 7 / 3] },
  'definite-integrals-odd': { curves: [(x) => cube3(x) - 4 * x], areas: [4, 4] },
  'definite-integrals-line-curve': { curves: [sq, (x) => x + 2], areas: [9 / 2] },
  'definite-integrals-line-curve-b': { curves: [sq, (x) => 2 * x], areas: [4 / 3] },
  'definite-integrals-flip-forward': { curves: [sq], areas: [26 / 3] },
  'definite-integrals-flip-backward': { curves: [sq], areas: [26 / 3] },
  'definite-integrals-q-area-curve': { curves: [(x) => x * x + 1], areas: [10 / 3] },
  'definite-integrals-q-k': { curves: [(x) => 2 * x], areas: [9] },
  'definite-integrals-q-below': { curves: [(x) => x * x - 3 * x], areas: [9 / 2] },
  'definite-integrals-q-split': { curves: [(x) => x * x - 1], areas: [2 / 3, 4 / 3] },
  'definite-integrals-q-cubic': { curves: [(x) => cube3(x) - x], areas: [1 / 4, 1 / 4] },
  'definite-integrals-q-line-curve': { curves: [sq, (x) => 2 * x + 3], areas: [32 / 3] },
};

test('each figure draws the curves it claims, each marked point lies on a curve or the x-axis, and each shaded region has the right area', async () => {
  const { FIGURES, GEOM, POINTS } = await figureModule();
  expect(Object.keys(FIGURES).sort()).toEqual(Object.keys(EXPECTED).sort());
  for (const id of Object.keys(FIGURES)) {
    const svg: string = FIGURES[id]();
    const g = GEOM[id];
    const toX = (px: number) => g.xmin + ((px - g.left) / (g.width - g.left - g.right)) * (g.xmax - g.xmin);
    const toY = (py: number) => g.ymax - ((py - g.top) / (g.height - g.top - g.bottom)) * (g.ymax - g.ymin);
    const paths = [...svg.matchAll(/<path class="(curve(?:-b|-c)?)" d="([^"]+)"/g)];
    expect(paths.length, id).toBe(EXPECTED[id].curves.length);
    paths.forEach((p, k) => {
      const pts = [...p[2].matchAll(/[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
      expect(pts.length, `${id} curve ${k}`).toBeGreaterThan(30);
      for (const [px, py] of pts) {
        const x = toX(px);
        expect(abs(toY(py) - EXPECTED[id].curves[k](x)), `${id} curve ${k} at x=${x.toFixed(2)}`).toBeLessThan(0.02 * (g.ymax - g.ymin));
      }
    });
    const circles = [...svg.matchAll(/<circle class="pt(?:-open)?" cx="(-?[\d.]+)" cy="(-?[\d.]+)"/g)].map((m) => [toX(Number(m[1])), toY(Number(m[2]))]);
    expect(circles.length, id).toBe(POINTS[id].length);
    circles.forEach(([x, y], k) => {
      expect(abs(x - POINTS[id][k].x), `${id} point ${k} x`).toBeLessThan(0.02);
      expect(abs(y - POINTS[id][k].y), `${id} point ${k} y`).toBeLessThan(0.05);
      const onCurve = EXPECTED[id].curves.some((fn) => abs(fn(POINTS[id][k].x) - POINTS[id][k].y) < 1e-9);
      expect(onCurve || POINTS[id][k].y === 0, `${id} point ${k} lies on a curve or the x-axis`).toBe(true);
    });
    // each shaded polygon: its area, from its drawn corners, is the area the maths gives
    const polys = [...svg.matchAll(/<polygon class="shade" points="([^"]+)"/g)].map((m) => m[1].trim().split(/\s+/).map((pair) => pair.split(',').map(Number)));
    expect(polys.length, `${id} shaded regions`).toBe(EXPECTED[id].areas.length);
    polys.forEach((poly, k) => {
      const pts = poly.map(([px, py]) => [toX(px), toY(py)]);
      let twice = 0;
      pts.forEach(([x1, y1], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; twice += x1 * y2 - x2 * y1; });
      expect(abs(twice) / 2, `${id} region ${k}`).toBeCloseTo(EXPECTED[id].areas[k], 1);
    });
  }
});

test('a point label shows its own coordinates, and every marked point is named in the description', async () => {
  const { FIGURES, POINTS } = await figureModule();
  const strip = (s: string) => [...s.matchAll(/<text [^>]*>([\s\S]*?)<\/text>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/​/g, '').replace(/−/g, '-'));
  for (const id of Object.keys(FIGURES)) {
    const svg: string = FIGURES[id]();
    const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg)?.[1] ?? '';
    for (const t of strip(svg)) {
      const m = /^\((-?[\d.]+), (-?[\d.]+)\)$/.exec(t);
      if (m) expect(POINTS[id].some((p: { x: number; y: number }) => abs(p.x - Number(m[1])) < 1e-9 && abs(p.y - Number(m[2])) < 1e-9), `${id}: label ${t}`).toBe(true);
    }
    // the figure with four unlabelled dots describes them by their x-values instead
    // the dots in the question figure with two curves are left unnamed on purpose: the question asks for the meeting points
    if (id === 'definite-integrals-q-line-curve') continue;
    // a question whose answer is a coordinate must not let the reader count ticks to it
    if (id === 'definite-integrals-q-k') expect(svg).not.toContain('class="tick"');
    for (const p of POINTS[id] as { x: number; y: number }[]) expect(desc, `${id}: (${p.x}, ${p.y})`).toContain(`(${p.x}, ${p.y})`);
  }
});

test('a question figure describes the picture and never gives the area or the answer away', async () => {
  const { FIGURES } = await figureModule();
  const ids = Object.keys(FIGURES).filter((id) => id.startsWith('definite-integrals-q-'));
  expect(ids.length).toBe(6);
  for (const id of ids) {
    const svg: string = FIGURES[id]();
    const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg)?.[1] ?? '';
    expect(desc, id).not.toMatch(/answer|solution|\d\/\d|\barea (?:is|equals)\b/i);
    const text = [...svg.matchAll(/<text [^>]*>([\s\S]*?)<\/text>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''));
    // the only number a question figure may print is the 9 the question itself states
    expect(text.join(' | '), id).not.toMatch(/\d\/\d|\bk = /);
  }
});

test('a description that says dotted has a dotted (curve-c) element in the picture', async () => {
  const { FIGURES } = await figureModule();
  for (const id of Object.keys(FIGURES)) {
    const svg: string = FIGURES[id]();
    if (/dotted/i.test(/<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg)?.[1] ?? '')) expect(svg, id).toMatch(/class="curve-c"/);
  }
});

test('every figure keeps its text inside its picture and clear of every other label, every curve and every dot, on a phone and a desktop', async ({ page }) => {
  for (const width of [320, 1100]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/courses/a-level/definite-integrals.html');
    const problems = await page.evaluate(() => {
      const out: string[] = [];
      for (const svg of document.querySelectorAll('main svg.graph-svg')) {
        const name = svg.querySelector('title')?.textContent ?? '';
        const box = svg.getBoundingClientRect();
        const texts = [...svg.querySelectorAll('text')].filter((t) => (t.textContent ?? '').trim());
        for (const t of texts) {
          const b = t.getBoundingClientRect();
          if (b.left < box.left - 1 || b.right > box.right + 1 || b.top < box.top - 1 || b.bottom > box.bottom + 1) out.push(`${name}: "${t.textContent}" is outside the picture (text ${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.right)},${Math.round(b.bottom)} picture ${Math.round(box.left)},${Math.round(box.top)},${Math.round(box.right)},${Math.round(box.bottom)})`);
        }
        // everything below is in the picture's own units (a 640-wide picture): 8 units is 4px on a 320px phone
        // The axis letters and scale numbers come from the figure library and are checked by the layout test; these are the page's own labels.
        const isLib = (t: Element) => t.classList.contains('small') || (t.classList.contains('alt') && ['x', 'y'].includes((t.textContent ?? '').trim()));
        const all = texts.map((t) => ({ s: (t.textContent ?? '').trim(), b: (t as SVGGraphicsElement).getBBox(), lib: isLib(t) }));
        const bbs = all.filter((x) => !x.lib);
        const GAP = 8;
        for (let i = 0; i < all.length; i += 1) {
          for (let j = i + 1; j < all.length; j += 1) {
            if (all[i].lib && all[j].lib) continue;
            const a = all[i].b;
            const c = all[j].b;
            if (Math.min(a.x + a.width, c.x + c.width) - Math.max(a.x, c.x) > -GAP && Math.min(a.y + a.height, c.y + c.height) - Math.max(a.y, c.y) > -GAP) out.push(`${name}: "${all[i].s}" is within ${GAP} units of "${all[j].s}"`);
          }
        }
        for (const path of svg.querySelectorAll('path.curve, path.curve-b, path.curve-c')) {
          const p = path as SVGPathElement;
          const len = p.getTotalLength();
          for (let d = 0; d <= len; d += 3) {
            const pt = p.getPointAtLength(d);
            for (const { s, b } of bbs) {
              const g = /^[−-]?\d+$|^(a|k|x|x \+ h)$/.test(s) ? 2 : GAP; // a number under the axis can sit close to a curve that crosses the axis there
              if (pt.x > b.x - g && pt.x < b.x + b.width + g && pt.y > b.y - g && pt.y < b.y + b.height + g) { out.push(`${name}: a curve passes within ${g} units of "${s}"`); d = len + 1; break; }
            }
          }
        }
        for (const c of svg.querySelectorAll('circle.pt, circle.pt-open')) {
          const cx = Number(c.getAttribute('cx'));
          const cy = Number(c.getAttribute('cy'));
          for (const { s, b } of bbs) if (cx > b.x - 8 && cx < b.x + b.width + 8 && cy > b.y - 8 && cy < b.y + b.height + 8) out.push(`${name}: a dot is within 8 units of "${s}"`);
        }
      }
      return [...new Set(out)];
    });
    expect(problems, `width ${width}`).toEqual([]);
  }
});

test('a defined word is linked with its plain name, with no bracketed extra in the link text', async ({ page }) => {
  await page.goto('/courses/a-level/definite-integrals.html');
  const texts = await page.locator('main a.term:not(.words-strip a)').allTextContents();
  expect(texts.length).toBeGreaterThan(3);
  expect(texts.filter((t) => t.includes('('))).toEqual([]);
});
