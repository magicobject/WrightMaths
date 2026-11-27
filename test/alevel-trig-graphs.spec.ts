import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Trigonometric graphs and exact values page that a general test cannot make:
//  - every typed key is RECOMPUTED here, with its own trigonometry, a numeric root finder and a period scanner
//    (nothing is taken from the page or from the figure code), to the rounding the question states;
//  - every wrong-answer value is recomputed from the slip its message names, and the message is checked for that slip;
//  - every exact-value key is evaluated as a number, and the typical ways a student types it are checked with matches();
//  - every curve in every figure is read back from the SVG path and compared with the function, every marked point
//    sits on its curve, every solution a figure marks is a real solution, and none is missing;
//  - every figure's text alternative states every value the figure shows, and a question figure never gives the answer;
//  - every label is nearer its own item than any other, no text leaves its picture, and labels stay at least 12px tall at 320px;
//  - a deliberately broken key is caught by the same checks.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'trig-graphs.html'), 'utf8');
const BUILT = join(ROOT, 'public', 'courses', 'a-level', 'trig-graphs.html');

// the answer checker is an ES module: load it once per worker, and never change it here
let matches: (input: string, answers: string[], mode?: string) => boolean;
test.beforeAll(async () => { ({ matches } = await import('../public/js/book-answer.mjs')); });

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', deg: '\u00b0', plusmn: '\u00b1', frac12: '\u00bd', hellip: '...', radic: '\u221a' };
const decode = (t: string) => t.replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n] ?? m);

// ---- trigonometry in degrees, written independently of the figure code ----
const RAD = Math.PI / 180;
const sin = (d: number) => Math.sin(d * RAD);
const cos = (d: number) => Math.cos(d * RAD);
const tan = (d: number) => Math.tan(d * RAD);
const asinD = (x: number) => Math.asin(x) / RAD;
const dp = (n: number) => (x: number) => Number(x.toFixed(n));
const dp1 = dp(1);
const dp2 = dp(2);
const dp3 = dp(3);
const sf3 = (x: number) => Number(x.toPrecision(3));
const id = (x: number) => x;
const int = (x: number) => Math.round(x);

type Fn = (x: number) => number;
/** Every x in [lo, hi] where f(x) = k, by scanning for sign changes (never across an asymptote). */
function roots(f: Fn, k: number, lo: number, hi: number): number[] {
  const out: number[] = [];
  const step = 0.01;
  const g = (x: number) => f(x) - k;
  let a = lo;
  let ga = g(a);
  if (Math.abs(ga) < 1e-9) out.push(a);
  for (let x = lo + step; x <= hi + 1e-9; x += step) {
    const gx = g(x);
    if (Math.abs(gx) < 1e-9 && x > lo + 1e-9) { out.push(x); a = x; ga = gx; continue; }
    if (ga * gx < 0 && Math.abs(ga) < 50 && Math.abs(gx) < 50) {
      let l = a;
      let r = x;
      for (let i = 0; i < 60; i += 1) { const m = (l + r) / 2; if (g(l) * g(m) <= 0) r = m; else l = m; }
      out.push((l + r) / 2);
    }
    a = x;
    ga = gx;
  }
  return out.filter((v, i) => i === 0 || Math.abs(v - out[i - 1]) > 1e-6);
}
/** The smallest p > 0 with f(x + p) = f(x) at many x (an asymptote is skipped). */
function period(f: Fn): number {
  const xs = [3.7, 11.3, 23.1, 37.9, 51.3, 77.7, 101.1, 143.3];
  for (let p = 0.5; p <= 1500; p += 0.5) {
    if (xs.every((x) => { const a = f(x); const b = f(x + p); return Math.abs(a) < 50 && Math.abs(a - b) < 1e-9; })) return p;
  }
  return NaN;
}
const maxOf = (f: Fn) => Math.max(...Array.from({ length: 3601 }, (_, i) => f(i * 0.1)));
const argMin = (f: Fn, lo: number, hi: number) => { let best = lo; for (let x = lo; x <= hi; x += 0.5) if (f(x) < f(best) - 1e-12) best = x; return best; };

// ---- exact numbers: a tiny evaluator for the forms a key may be written in ----
function evalForm(text: string): number {
  let s = decode(text).replace(/\u00bd/g, '0.5').replace(/\u2212/g, '-').replace(/\s+/g, '');
  s = s.replace(/\u221a(\d+)/g, 'sqrt($1)').replace(/sqrt(\d+)/g, 'sqrt($1)').replace(/\u221a\(/g, 'sqrt(');
  s = s.replace(/(\d)sqrt/g, '$1*sqrt').replace(/\)(\d|sqrt|\()/g, ')*$1');
  if (!/^[-+*/().\dsqrt]+$/.test(s)) throw new Error(`cannot evaluate ${text}`);
  return Function('sqrt', `return (${s});`)(Math.sqrt) as number;
}
/** The {m:...} shorthand for the few forms the exact-value table uses, as a number. */
function evalMarkup(text: string): number {
  let s = text.replace(/\s+/g, '');
  for (let i = 0; i < 6; i += 1) s = s.replace(/frac\(([^(),]*(?:\([^()]*\))?[^(),]*),([^(),]*(?:\([^()]*\))?[^(),]*)\)/g, '(($1)/($2))');
  return Function('sqrt', `return (${s});`)(Math.sqrt) as number;
}

// ---- the questions on the page ----
type Q = { raw: string; text: string; answers: string[]; wrongs: Record<string, string>; fig: string | null; block: string; mode: string };
function questions(source: string): Q[] {
  return source.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const raw = /<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongs: Record<string, string> = {};
    for (const m of (/<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '').matchAll(/<li data-if="([^"]*)">([\s\S]*?)<\/li>/g)) {
      for (const v of decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean)) wrongs[v] = decode(m[2].replace(/<[^>]+>/g, ' ').replace(/\{m:[^}]*\}/g, ' '));
    }
    const fig = /\{fig:([a-z0-9-]+)\}/.exec(block.split('<ol class="ladder">')[0])?.[1] ?? null;
    return { raw, text: decode(raw), answers, wrongs, fig, block, mode: /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? '' };
  });
}
/** The numbers in a key such as "53.1 or 126.9" or "-1/2" (a fraction is evaluated). */
const numbers = (key: string) => key.split(/\s+or\s+/).map((part) => { try { return evalForm(part); } catch { return NaN; } });
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

type Slip = [number | number[], string]; // a wrong value (or values, typed "a or b") and a phrase the message must contain
type Case = { find: string; answer: number | number[]; round: (x: number) => number; slips?: Slip[] };
const C = (find: string, answer: number | number[], round: (x: number) => number, slips: Slip[] = []): Case => ({ find, answer, round, slips });
const sol = (f: Fn, k: number, lo: number, hi: number) => roots(f, k, lo, hi);

const CASES: Case[] = [
  // warm-up
  C('hypotenuse of 10 and an angle of', 10 * sin(30), int, [[dp2(10 * cos(30)), 'cosine']]),
  C('hypotenuse of 2 and one short side of 1', Math.sqrt(2 ** 2 - 1 ** 2), sf3, [[3, 'square root']]),
  C('find {m:cos(120deg)}. Type', cos(120), dp1, [[0.5, 'minus']]),
  // 1 angles of any size
  C('Its x-coordinate is 0.5', -Math.sqrt(1 - 0.5 ** 2), dp3, [[0.866, 'below'], [0.5, 'x-coordinate']]),
  C('Find {m:cos(-60deg)}', cos(-60), dp1, [[-0.5, 'quadrant 4']]),
  C('Find {m:cos(480deg)}', cos(480), dp1, [[0.5, 'quadrant 2']]),
  C('Find {m:sin(225deg)} to 3', sin(225), dp3, [[0.707, 'quadrant 3']]),
  // 2 exact values (numeric ones)
  C('{m:sin(60deg) cos(30deg)}. Type it like', sin(60) * cos(30), dp2, [[1.5, 'bottoms']]),
  C('hypotenuse of 12 cm and an angle of', 12 * sin(60), sf3, [[sf3(12 * cos(60)), 'next to the angle']]),
  // 3 sine and cosine
  C('does {m:sin x=0} have', sol(sin, 0, 0, 360).length, id, [[2, 'both ends']]),
  C('does {m:y=cos x} take its lowest value', argMin(cos, 0, 360), id, [[270, 'sine']]),
  C('Find {m:sin(-30deg)}', sin(-30), dp1, [[0.5, 'negative angle']]),
  C('find {m:sin(160deg)}', sin(160), sf3, [[-sf3(sin(160)), 'quadrant 2'], [sf3(cos(20)), 'question is about sine']]),
  C('find {m:cos(325deg)}', cos(325), sf3, [[-sf3(cos(325)), 'quadrant 4']]),
  C('Find {m:sin(450deg)}', sin(450), int, [[0, 'highest point']]),
  // 4 tangent
  C('What is the period of {m:y=tan x}', period(tan), int, [[360, 'sine and cosine']]),
  C('has an asymptote', sol(cos, 0, 0, 360), int, [[90, 'next asymptote']]),
  C('Find {m:tan(135deg)}', tan(135), dp1, [[1, 'quadrant 2']]),
  C('Find {m:tan(225deg)}', tan(225), dp1, [[-1, 'quadrant 3']]),
  // 5 finding every angle
  C('Solve {m:sin x=0.8} for', sol(sin, 0.8, 0, 360), dp1, [[53.1, 'second']]),
  C('Solve {m:cos x=0.3} for', sol(cos, 0.3, 0, 360), dp1, [[[72.5, 180 - 72.5], 'sine']]),
  C('Solve {m:tan x=2} for', sol(tan, 2, 0, 360), dp1, [[[63.4, 180 - 63.4], 'gives an angle with tangent']]),
  C('Solve {m:sin x=-0.6} for', sol(sin, -0.6, 0, 360), dp1, [[-36.9, 'outside the range'], [[36.9, 180 - 36.9], 'quadrants 3 and 4']]),
  C('Solve {m:cos x=-0.4} for {m:-180', sol(cos, -0.4, -180, 180), dp1, [[113.6, 'by symmetry'], [[113.6, 246.4], 'outside the range']]),
  C('does {m:tan x=1} have', sol(tan, 1, 0, 720).length, id, [[2, 'two full turns']]),
  C('Solve {m:cos x=frac(sqrt(3),2)}', sol(cos, Math.sqrt(3) / 2, 0, 360), int, [[[30, 150], 'sine']]),
  // 6 period and amplitude
  C('amplitude of {m:y=-3 cos x}', maxOf((x) => -3 * cos(x)), int, [[-3, 'distance']]),
  C('period of {m:y=sin(4x)}', period((x) => sin(4 * x)), int, [[1440, 'multiplied']]),
  C('period of {m:y=tan(3x)}', period((x) => tan(3 * x)), int, [[540, 'multiplied'], [120, '360']]),
  C('period of {m:y=cos(frac(x,2))}', period((x) => cos(x / 2)), int, [[180, 'stretched']]),
  C('does {m:sin(3x)=0} have', sol((x) => sin(3 * x), 0, 0, 360).length, id, [[6, 'both ends'], [3, 'number of cycles']]),
  // flip it
  C('One solution of {m:cos x=0.5} is', sol(cos, 0.5, 0, 360).find((v) => Math.abs(v - 60) > 1)!, int, [[120, 'sine']]),
  C('Write down the exact value of {m:sin(210deg)}', sin(210), dp1, [[0.5, 'sign']]),
  C('Solve {m:sin x=-frac(sqrt(3),2)}', sol(sin, -Math.sqrt(3) / 2, 0, 360), int, [[[60, 120], 'quadrants 3 and 4']]),
  C('Solve {m:tan x=-sqrt(3)} for', sol(tan, -Math.sqrt(3), 0, 180), int, [[60, 'quadrant 2']]),
  // mixed review
  C('Find {m:cos(240deg)}', cos(240), dp1, [[0.5, 'sign'], [dp3(sin(240)), 'question asks for the cosine']]),
  C('Solve {m:sin x=0.35}', sol(sin, 0.35, 0, 360), dp1, [[20.5, 'second']]),
  C('Solve {m:tan x=0.5}', sol(tan, 0.5, 0, 360), dp1, [[[26.6, 180 - 26.6], 'gives an angle with tangent']]),
  C('greatest value of {m:y=4 sin(3x)}', maxOf((x) => 4 * sin(3 * x)), int, [[12, 'multiplied'], [3, 'period']]),
  // exam style
  C('Solve {m:sin x=-0.7} for', sol(sin, -0.7, 0, 360), dp1, [[-44.4, 'outside the range']]),
  C('has period {m:90deg}. Find b', [1, 2, 3, 4, 5, 6, 8].find((b) => Math.abs(period((x) => 3 * sin(b * x)) - 90) < 1e-9)!, id, [[270, 'subtracted']]),
  C('How many solutions does {m:3 sin(4x)=1.5}', sol((x) => 3 * sin(4 * x), 1.5, 0, 360).length, id, [[2, 'several cycles'], [4, 'cycles']]),
  C('Solve {m:tan x=-2} for', sol(tan, -2, -180, 180), dp1, [[-63.4, '180'], [[63.4, -116.6], 'value is negative']]),
  C('Solve {m:cos x=-0.2} for {m:0deg<=x<=720deg}', sol(cos, -0.2, 0, 720), dp1, [[[101.5, 258.5], 'two more']]),
];

/** The exact-value questions: the key forms are evaluated as numbers and compared with the recomputed value. */
type Exact = { find: string; value: number; wrongs?: { v: number; says: string }[]; accept: string[]; reject: string[] };
const EXACT: Exact[] = [
  { find: 'Write {m:sqrt(12)} in the form', value: 2 * Math.sqrt(3), accept: ['2sqrt(3)', '2sqrt3', '2*sqrt(3)', '2\u221a3'], reject: ['4sqrt(3)', '3sqrt(2)', '6', 'sqrt(12)'] },
  { find: 'Rationalise the denominator', value: 1 / Math.sqrt(3), accept: ['(1/3)sqrt(3)', 'sqrt(3)/3', 'sqrt3/3', '\u221a3/3'], reject: ['1/3sqrt(3)', 'sqrt(3)', '1/3', 'sqrt(3)/2', '1/sqrt(3)'] },
  { find: 'exact value of {m:sin(60deg)}. Type', value: sin(60), accept: ['(1/2)sqrt(3)', '0.5sqrt(3)', '\u00bdsqrt(3)', 'root 3 over 2', 'sqrt(3)/2', 'sqrt3/2', '\u221a3/2', '(\u221a3)/2', 'sqrt(3) / 2', '(sqrt(3))/2'], reject: ['1/2sqrt(3)', '1/2', '0.5', 'sqrt(2)/2', 'sqrt(3)/3', '-sqrt(3)/2'] },
  { find: 'exact value of {m:cos(150deg)}. Type', value: cos(150), accept: ['-(1/2)sqrt(3)', '-0.5sqrt(3)', '-\u00bdsqrt(3)', 'minus root 3 over 2', '-sqrt(3)/2', '-sqrt3/2', '-\u221a3/2', '\u2212\u221a3/2', '-(sqrt(3)/2)', '-(sqrt3)/2'], reject: ['-1/2sqrt(3)', 'sqrt(3)/2', '-1/2', '-sqrt(2)/2', '-sqrt(3)/3'] },
  { find: 'exact value of {m:tan(300deg)}', value: tan(300), accept: ['-sqrt(3)', '-sqrt3', '-\u221a3', '\u2212\u221a3'], reject: ['sqrt(3)', '-sqrt(3)/3', '-1/sqrt(3)', '-1'] },
  { find: 'exact value of {m:sin(315deg)}', value: sin(315), accept: ['-(1/2)sqrt(2)', '-0.5sqrt(2)', '-sqrt(2)/2', '-sqrt2/2', '-\u221a2/2', '-1/sqrt(2)', '-1/\u221a2', '-(sqrt(2)/2)', '-(1/sqrt(2))', '-(sqrt2)/2'], reject: ['-1/2sqrt(2)', 'sqrt(2)/2', '1/sqrt(2)', '-sqrt(3)/2', '-1/2'] },
  { find: 'exact value of {m:tan(150deg)}', value: tan(150), accept: ['-(1/3)sqrt(3)', '-sqrt(3)/3', '-sqrt3/3', '-\u221a3/3', '-1/sqrt(3)', '-1/sqrt3', '-1/\u221a3', '-(sqrt(3)/3)', '-(1/sqrt(3))', '-(sqrt3)/3'], reject: ['-1/3sqrt(3)', 'sqrt(3)/3', '1/sqrt(3)', '-sqrt(3)', '-1/3'] },
];

/** Every problem found in the keys of `source`, as text. An empty list means every key is right. */
function keyProblems(source: string): string[] {
  const qs = questions(source);
  const problems: string[] = [];
  for (const c of CASES) {
    const hits = qs.filter((q) => q.raw.includes(c.find));
    if (hits.length !== 1) { problems.push(`"${c.find}" matches ${hits.length} questions`); continue; }
    const q = hits[0];
    const want = (Array.isArray(c.answer) ? c.answer : [c.answer]).map(c.round);
    const got = numbers(q.answers[0]);
    if (got.length !== want.length || got.some((g, i) => !near(g, want[i]))) problems.push(`"${c.find}": the page says ${q.answers[0]}, recomputed ${want.join(' or ')}`);
    for (const [value, says] of c.slips ?? []) {
      const list = Array.isArray(value) ? value : [value];
      const keyText = list.join(' or ');
      // a wrong-answer entry holds the slip value, typed to the rounding the page uses
      const entry = Object.keys(q.wrongs).find((w) => { const n = numbers(w); return n.length === list.length && n.every((x, i) => Math.abs(x - list[i]) < 0.051); });
      if (!entry) { problems.push(`"${c.find}": no wrong-answer entry for the slip value ${keyText}`); continue; }
      if (numbers(entry).length === want.length && numbers(entry).every((x, i) => near(x, want[i]))) problems.push(`"${c.find}": the slip value ${keyText} is the right answer`);
      if (!q.wrongs[entry].toLowerCase().includes(says.toLowerCase())) problems.push(`"${c.find}": the message for ${entry} does not mention "${says}": ${q.wrongs[entry].trim().slice(0, 80)}`);
    }
  }
  for (const e of EXACT) {
    const hits = qs.filter((q) => q.raw.includes(e.find));
    if (hits.length !== 1) { problems.push(`exact "${e.find}" matches ${hits.length} questions`); continue; }
    const q = hits[0];
    for (const form of q.answers.filter((x) => !/root|over/.test(x))) if (Math.abs(evalForm(form) - e.value) > 1e-9) problems.push(`"${e.find}": the form ${form} is ${evalForm(form)}, recomputed ${e.value}`);
    for (const form of Object.keys(q.wrongs)) {
      let shown: number | null = null;
      try { shown = evalForm(form); } catch { shown = null; }
      if (shown !== null && Math.abs(shown - e.value) < 1e-9) problems.push(`"${e.find}": the wrong answer ${form} is a right answer`);
    }
    for (const input of e.accept) if (!matches(input, q.answers, q.mode)) problems.push(`"${e.find}": a student typing ${input} is marked wrong`);
    for (const input of e.reject) if (matches(input, q.answers, q.mode)) problems.push(`"${e.find}": a student typing ${input} is marked right`);
  }
  return problems;
}

test('every typed answer is recomputed to the rounding the question states, and every slip is tied to its message', () => {
  expect(CASES.length).toBeGreaterThan(40);
  expect(keyProblems(SOURCE)).toEqual([]);
});

test('every typed question that needs a calculation has a recomputed case, and no wrong answer is the right answer', () => {
  const qs = questions(SOURCE).filter((q) => q.mode === 'value' && q.answers.length);
  const uncovered = qs.filter((q) => /decimal place|significant figures|Solve|How many|period|amplitude|greatest/.test(q.text) && !CASES.some((c) => q.raw.includes(c.find))).map((q) => q.text.slice(0, 70));
  expect(uncovered).toEqual([]);
  for (const q of questions(SOURCE)) {
    for (const w of Object.keys(q.wrongs)) {
      if (matches(w, q.answers, q.mode)) throw new Error(`${q.text.slice(0, 60)}: wrong-answer value ${w} is accepted as right`);
    }
  }
});

test('a deliberately broken key, slip value or accepted form is caught by the same checks', () => {
  expect(keyProblems(SOURCE.replace('data-answers="53.1 or 126.9"', 'data-answers="53.1 or 126.8"')).length).toBeGreaterThan(0);
  expect(keyProblems(SOURCE.replace('data-answers="-0.866" data-mode="value"', 'data-answers="0.866" data-mode="value"')).length).toBeGreaterThan(0);
  expect(keyProblems(SOURCE.replace('<li data-if="-36.9">', '<li data-if="-37.9">')).length).toBeGreaterThan(0);
  expect(keyProblems(SOURCE.replace('data-answers="sqrt(3)/2;', 'data-answers="sqrt(3)/3;')).length).toBeGreaterThan(0);
  expect(keyProblems(SOURCE.replace('That is the calculator value, but it is outside the range.', 'That is a different value.')).length).toBeGreaterThan(0);
  expect(keyProblems(SOURCE)).toEqual([]);
});

test('a "Type it like" hint never matches the key', () => {
  let checked = 0;
  for (const q of questions(SOURCE)) {
    const hint = /Type (?:it|them|your answers?) like (.+?)\.(?=\s|$)/.exec(q.text)?.[1];
    if (!hint || !q.answers.length) continue;
    checked += 1;
    if (matches(hint, q.answers, q.mode)) throw new Error(`the hint "${hint}" matches the key for: ${q.text.slice(0, 70)}`);
  }
  expect(checked).toBeGreaterThan(20);
});

test('typical equivalent ways of typing a list of angles are accepted, and a partial list is not', () => {
  const key = ['53.1 or 126.9'];
  for (const ok of ['53.1 or 126.9', '126.9 or 53.1', '53.1, 126.9', '53.1 and 126.9', '53.1 126.9', 'x = 53.1 or x = 126.9', '53.1\u00b0 or 126.9\u00b0']) expect(matches(ok, key, 'value'), ok).toBe(true);
  for (const bad of ['53.1', '126.9', '53.1 or 126.8', '53.1 or 53.1 or 126.9']) expect(matches(bad, key, 'value'), bad).toBe(false);
  const neg = questions(SOURCE).find((q) => q.raw.includes('Solve {m:cos x=-0.4} for {m:-180'))!.answers;
  for (const ok of ['-113.6 or 113.6', '113.6 or -113.6', '-113.6, 113.6', '-113.6 and 113.6', '\u00b1113.6', '+-113.6', '+/-113.6']) expect(matches(ok, neg, 'value'), ok).toBe(true);
  for (const bad of ['113.6', '-113.6', '113.6 or 246.4']) expect(matches(bad, neg, 'value'), bad).toBe(false);
  const four = ['101.5 or 258.5 or 461.5 or 618.5'];
  expect(matches('618.5, 461.5, 258.5, 101.5', four, 'value')).toBe(true);
  expect(matches('101.5 or 258.5', four, 'value')).toBe(false);
});

test('every number in a plain {m:...} calculation on the page is right', () => {
  const body = SOURCE.replace(/<!--[\s\S]*?-->/g, '');
  const bad: string[] = [];
  let n = 0;
  const num = '-?\\d+(?:\\.\\d+)?';
  const ops: Record<string, (a: number, b: number) => number> = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b };
  for (const m of body.matchAll(new RegExp(`\\{m:(${num})([+\\-*])\\(?(${num})\\)?=(${num})\\}`, 'g'))) {
    n += 1;
    if (Math.abs(ops[m[2]](Number(m[1]), Number(m[3])) - Number(m[4])) > 1e-9) bad.push(m[0]);
  }
  for (const m of body.matchAll(new RegExp(`\\{m:(${num})=(${num})([+\\-*])\\(?(${num})\\)?\\}`, 'g'))) {
    n += 1;
    if (Math.abs(ops[m[3]](Number(m[2]), Number(m[4])) - Number(m[1])) > 1e-9) bad.push(m[0]);
  }
  expect(n).toBeGreaterThan(40);
  expect(bad).toEqual([]);
});

test('the worked examples state trigonometric values that recompute', () => {
  const checks: [string, number, (x: number) => number][] = [
    ['{m:tan(150deg)=frac(0.5, -0.866)=-0.577}', tan(150), dp3],
    ['{m:sin(200deg)=-0.342}', sin(200), dp3],
    ['{m:cos(200deg)=-0.940}', cos(200), dp3],
    ['{m:tan(200deg)=0.364}', tan(200), dp3],
    ['{m:sin(405deg)=sin(45deg)=0.707}', sin(405), dp3],
    ['{m:cos(240deg)=-0.5}', cos(240), dp1],
    ['{m:12 sin(60deg)=12*0.8660=10.39}', 12 * sin(60), dp2],
    ['which is about 10.4 cm', 6 * Math.sqrt(3), dp1],
    ['{m:sin^(-1)(0.5)=30deg}', asinD(0.5), int],
    ['{m:cos^(-1)(-0.4)=113.6deg}', Math.acos(-0.4) / RAD, dp1],
    ['{m:sin^(-1)(0.3)=17.5deg}', asinD(0.3), dp1],
    ['{m:sin^(-1)(0.8)=53.1deg}', asinD(0.8), dp1],
    ['{m:cos^(-1)(0.3)=72.5deg}', Math.acos(0.3) / RAD, dp1],
    ['{m:tan^(-1)(2)=63.4deg}', Math.atan(2) / RAD, dp1],
    ['{m:sin^(-1)(0.6)=36.9deg}', asinD(0.6), dp1],
    ['{m:sin^(-1)(0.7)=44.4deg}', asinD(0.7), dp1],
    ['{m:tan^(-1)(-2)=-63.4deg}', Math.atan(-2) / RAD, dp1],
    ['{m:cos^(-1)(-0.2)=101.5deg}', Math.acos(-0.2) / RAD, dp1],
    ['{m:sin^(-1)(0.35)=20.5deg}', asinD(0.35), dp1],
    ['{m:tan^(-1)(0.5)=26.6deg}', Math.atan(0.5) / RAD, dp1],
    ['{m:cos(60deg)=0.5}', cos(60), dp1],
  ];
  const problems: string[] = [];
  for (const [text, value, round] of checks) {
    if (!SOURCE.includes(text)) { problems.push(`the page no longer contains ${text}`); continue; }
    const shown = [...text.replace(/\^\(-1\)/g, '').matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
    const want = round(value);
    if (!shown.some((x) => near(x, want))) problems.push(`${text} should show ${want}`);
  }
  expect(problems).toEqual([]);
});

test('the exact-value table agrees with sine, cosine and tangent', () => {
  const table = /<table class="data">([\s\S]*?)<\/table>/.exec(SOURCE)?.[1] ?? '';
  const angles = [...(/<thead>([\s\S]*?)<\/thead>/.exec(table)?.[1] ?? '').matchAll(/\{m:(\d+)deg\}/g)].map((m) => Number(m[1]));
  expect(angles).toEqual([0, 30, 45, 60, 90]);
  const rows = [...table.matchAll(/<tr><th scope="row">\{m:(sin|cos|tan) theta\}<\/th>([\s\S]*?)<\/tr>/g)];
  expect(rows.length).toBe(3);
  let cells = 0;
  for (const [, name, rest] of rows) {
    const f = { sin, cos, tan }[name as 'sin'];
    const tds = [...rest.matchAll(/<td>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    expect(tds.length).toBe(5);
    tds.forEach((td, i) => {
      if (/does not exist/.test(td)) { expect(name).toBe('tan'); expect(angles[i]).toBe(90); return; }
      const shown = evalMarkup(/\{m:([^}]*)\}/.exec(td)?.[1] ?? td);
      expect(shown, `${name} ${angles[i]}`).toBeCloseTo(f(angles[i]), 9);
      cells += 1;
    });
  }
  expect(cells).toBe(14);
  // the pattern line: sqrt(0)/2 ... sqrt(4)/2 are the sines at 0, 30, 45, 60, 90
  [0, 1, 2, 3, 4].forEach((n, i) => expect(Math.sqrt(n) / 2).toBeCloseTo(sin(angles[i]), 9));
});

test('the skip link points at the id the build gives the first lesson heading', () => {
  const heading = /<h2>(1\.[^<]*)<\/h2>/.exec(SOURCE)?.[1] ?? '';
  const slug = `s-${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`;
  expect(SOURCE).toContain(`<a href="#${slug}">Skip to the lesson</a>`);
  expect(readFileSync(BUILT, 'utf8')).toContain(`id="${slug}"`);
});

test('the page stays inside its topic: no identities, no algebraic solving, no radians', () => {
  const text = SOURCE.replace(/<!--[\s\S]*?-->/g, '');
  expect(text).not.toMatch(/sin\^2|cos\^2|tan\^2/);
  expect(text.replace(/Trigonometric identities and equations/g, '')).not.toMatch(/identit/i);
  expect(text.replace(/Radians, arcs and sectors/g, '').replace('Radians are not used on this page; they come in', '').replace('Using a calculator set to radians.', '')).not.toMatch(/radian/i);
  expect(text).not.toMatch(/\{md?:[^}]*sec|cosec|\bcot\b/);
});

// ---- the figures ----
type Pt = { id: string; x: number; y: number; text: string; on: string | null };
type Geo = { id: string; svg: string; meta: { points: Pt[]; curves: { key: string; cls: string }[]; facts: string[]; line?: { y: number }; asymptotes?: number[]; angles?: { point: string; angle: number }[]; quadrants?: { at: number[]; text: string }[]; yvalues?: { x: number; y: number; text: string }[]; triangle?: { corners: Record<string, number[]>; sides: { from: string; to: string; value: number; text: string }[]; angles: { at: string; value: number }[] } }; meta2?: never };

async function allFigures() {
  const mod = await import('../src/book/alevel/figures/trig-graphs.mjs');
  const ids: string[] = Object.keys(mod.FIGURES);
  return { ids, geo: (figure: string) => mod.GEOMETRY(figure) as unknown as Geo & { meta: Geo['meta'] } };
}

// the independent function table: nothing here is imported from the figure code
const FNS: Record<string, Fn> = {
  sin, cos, tan,
  'two-sin': (x) => 2 * sin(x),
  'sin-2x': (x) => sin(2 * x),
  circle: () => 1,
};

type Plane = { xmin: number; xmax: number; ymin: number; ymax: number; left: number; right: number; top: number; bottom: number };
const planeOf = (svg: string): Plane | null => {
  const p = /data-plane="([^"]+)"/.exec(svg)?.[1];
  const b = /data-box="([^"]+)"/.exec(svg)?.[1];
  if (!p || !b) return null;
  const [xmin, xmax, ymin, ymax] = p.split(',').map(Number);
  const [left, right, top, bottom] = b.split(',').map(Number);
  return { xmin, xmax, ymin, ymax, left, right, top, bottom };
};
const toGraph = (pl: Plane, px: number, py: number): [number, number] => [pl.xmin + ((px - pl.left) / (pl.right - pl.left)) * (pl.xmax - pl.xmin), pl.ymin + ((pl.bottom - py) / (pl.bottom - pl.top)) * (pl.ymax - pl.ymin)];
const toPixel = (pl: Plane, x: number, y: number): [number, number] => [pl.left + ((x - pl.xmin) / (pl.xmax - pl.xmin)) * (pl.right - pl.left), pl.bottom - ((y - pl.ymin) / (pl.ymax - pl.ymin)) * (pl.bottom - pl.top)];
const viewBoxOf = (svg: string) => (/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg) ?? []).slice(1).map(Number);
const plain = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\u200b/g, '').trim();
type Txt = { x: number; y: number; anchor: string; text: string; attrs: string };
const textsOf = (svg: string): Txt[] => [...svg.matchAll(/<text([^>]*?) x="([\d.-]+)" y="([\d.-]+)" text-anchor="(\w+)">([\s\S]*?)<\/text>/g)].map((m) => ({ attrs: m[1], x: Number(m[2]), y: Number(m[3]), anchor: m[4], text: plain(m[5]) })).filter((t) => t.text);
const centreOf = (t: Txt): [number, number] => { const half = (t.text.length * 14) / 2; return [t.x + (t.anchor === 'start' ? half : t.anchor === 'end' ? -half : 0), t.y - 8]; };
const pointsOf = (svg: string) => [...svg.matchAll(/<circle class="pt(?:-open)?" data-pt="([^"]+)" data-at="([^"]+)"(?: data-on="([^"]+)")? cx="([\d.-]+)" cy="([\d.-]+)"/g)].map((m) => ({ id: m[1], at: m[2].split(',').map(Number), on: m[3] ?? null, px: [Number(m[4]), Number(m[5])] }));

test('every curve is drawn from its function: the path is read back and compared, and tangent breaks at its asymptotes', async () => {
  const { ids, geo } = await allFigures();
  expect(ids.length).toBe(20);
  const problems: string[] = [];
  let compared = 0;
  for (const figure of ids) {
    const { svg } = geo(figure);
    const pl = planeOf(svg);
    if (!pl) continue;
    const paths = [...svg.matchAll(/<path class="([^"]+)" data-fn="([^"]+)" d="([^"]*)"\/>/g)];
    for (const [, , key, d] of paths) {
      const f = FNS[key];
      if (!f) { problems.push(`${figure}: unknown curve ${key}`); continue; }
      const pts = [...d.matchAll(/([ML])([\d.-]+) ([\d.-]+)/g)].map((m) => ({ move: m[1] === 'M', g: toGraph(pl, Number(m[2]), Number(m[3])) }));
      if (pts.length < 100) problems.push(`${figure}: the ${key} curve has only ${pts.length} points`);
      let prev: [number, number] | null = null;
      for (const p of pts) {
        compared += 1;
        const [x, y] = p.g;
        if (key === 'circle') { if (Math.abs(Math.hypot(x, y) - 1) > 0.012) problems.push(`${figure}: a circle point (${x.toFixed(3)}, ${y.toFixed(3)}) is not on the unit circle`); } else if (Math.abs(f(x) - y) > 0.03) problems.push(`${figure}: ${key} at x = ${x.toFixed(1)} is drawn at ${y.toFixed(3)}, not ${f(x).toFixed(3)}`);
        if (key === 'tan' && prev && !p.move) {
          // a joined segment must not cross an asymptote (x = 90 + 180 n)
          if (Math.floor((prev[0] - 90) / 180) !== Math.floor((x - 90) / 180)) problems.push(`${figure}: the tangent curve is joined across an asymptote near x = ${x.toFixed(1)}`);
        }
        prev = p.g;
      }
      if (key !== 'circle' && key !== 'tan') {
        // the curve runs the whole width asked for, and is one unbroken line
        const first = pts[0].g[0];
        const last = pts[pts.length - 1].g[0];
        const lo = /exact-sin/.test(figure) ? 0 : pl.xmin;
        const hi = /exact-sin/.test(figure) ? 90 : pl.xmax;
        if (Math.abs(first - lo) > 0.6 || Math.abs(last - hi) > 0.6) problems.push(`${figure}: the ${key} curve runs from ${first.toFixed(1)} to ${last.toFixed(1)}, not ${lo} to ${hi}`);
        if (pts.filter((p) => p.move).length !== 1) problems.push(`${figure}: the ${key} curve is broken into pieces`);
      }
      if (key === 'tan') {
        const pieces = pts.filter((p) => p.move).length;
        const asym = [-90, 90, 270, 450].filter((a) => a > pl.xmin && a < pl.xmax).length;
        if (pieces !== asym + 1) problems.push(`${figure}: the tangent curve has ${pieces} pieces, expected ${asym + 1}`);
      }
    }
  }
  expect(compared).toBeGreaterThan(5000);
  expect(problems).toEqual([]);
});

test('the tangent figure marks its asymptotes where the cosine is zero', async () => {
  const { geo } = await allFigures();
  const g = geo('trig-graphs-tan');
  const pl = planeOf(g.svg)!;
  const marked = [...g.svg.matchAll(/<line class="guide" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].filter((m) => m[1] === m[3] && Math.abs(Number(m[4]) - Number(m[2])) > 0.9 * (pl.bottom - pl.top)).map((m) => toGraph(pl, Number(m[1]), 0)[0]);
  const truth = roots(cos, 0, pl.xmin, pl.xmax);
  expect(truth.map((x) => Math.round(x))).toEqual([90, 270]);
  expect(marked.map((x) => Math.round(x)).sort((a, b) => a - b)).toEqual(truth.map((x) => Math.round(x)));
  expect(g.meta.asymptotes).toEqual([90, 270]);
});

test('every marked point is on its curve, at the pixel its coordinates give, and has a label nearer to it than to any other point', async () => {
  const { ids, geo } = await allFigures();
  const problems: string[] = [];
  let checked = 0;
  let labels = 0;
  for (const figure of ids) {
    const { svg, meta } = geo(figure);
    const pl = planeOf(svg);
    if (!pl) continue;
    const pts = pointsOf(svg);
    expect(pts.length, `${figure}: the points in the picture match the facts`).toBe(meta.points.length);
    for (const p of pts) {
      checked += 1;
      const [px, py] = toPixel(pl, p.at[0], p.at[1]);
      if (Math.hypot(px - p.px[0], py - p.px[1]) > 0.1) problems.push(`${figure}: point ${p.id} is drawn at the wrong pixel`);
      if (p.on && p.on !== 'circle' && Math.abs(FNS[p.on](p.at[0]) - p.at[1]) > 1e-6) problems.push(`${figure}: point ${p.id} (${p.at}) is not on ${p.on}`);
      if (p.on === 'circle' && Math.abs(Math.hypot(...(p.at as [number, number])) - 1) > 1e-6) problems.push(`${figure}: point ${p.id} is not on the unit circle`);
    }
    // each label is nearer its own point than any other point
    for (const t of textsOf(svg)) {
      const own = /data-for="([^"]+)"/.exec(t.attrs)?.[1];
      if (!own) continue;
      labels += 1;
      const [cx, cy] = centreOf(t);
      const dist = (p: { px: number[] }) => Math.hypot(cx - p.px[0], cy - p.px[1]);
      const nearest = pts.reduce((best, p) => (dist(p) < dist(best) ? p : best));
      if (nearest.id !== own) problems.push(`${figure}: the label "${t.text}" belongs to ${own} but is nearest ${nearest.id}`);
    }
  }
  expect(checked).toBeGreaterThan(30);
  expect(labels).toBeGreaterThan(20);
  expect(problems).toEqual([]);
});

test('every figure that marks solutions marks all of them, and each is a real solution', async () => {
  const { ids, geo } = await allFigures();
  const problems: string[] = [];
  let figures = 0;
  for (const figure of ids) {
    const { svg, meta } = geo(figure);
    if (!meta.line) continue;
    figures += 1;
    const pl = planeOf(svg)!;
    const keys = meta.curves.map((c) => c.key);
    const key = keys.find((k) => k !== 'two-sin') as string;
    const f = FNS[key];
    const k = meta.line.y;
    // the dashed horizontal line is really at height k, across the whole width
    const lineAtK = [...svg.matchAll(/<line class="guide" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].some((m) => m[2] === m[4] && Math.abs(toGraph(pl, 0, Number(m[2]))[1] - k) < 0.02 && Math.abs(Number(m[3]) - Number(m[1]) - (pl.right - pl.left)) < 1);
    if (!lineAtK) problems.push(`${figure}: no dashed line across the picture at y = ${k}`);
    if (/-q-/.test(figure)) continue; // a question figure does not mark its solutions
    const marked = pointsOf(svg).filter((p) => p.on === key).map((p) => p.at[0]).sort((a, b) => a - b);
    const truth = roots(f, k, pl.xmin, pl.xmax).map((x) => Math.round(x * 1e6) / 1e6);
    if (marked.length !== truth.length || marked.some((x, i) => Math.abs(x - truth[i]) > 1e-4)) problems.push(`${figure}: marks ${marked.join(', ')} but the solutions of ${key} = ${k} are ${truth.map((x) => x.toFixed(2)).join(', ')}`);
    for (const p of pointsOf(svg)) if (Math.abs(p.at[1] - k) > 1e-9) problems.push(`${figure}: point ${p.id} is not at the height of the line`);
  }
  expect(figures).toBe(6);
  expect(problems).toEqual([]);
});

test('the exact-value figure writes the right exact value at each height', async () => {
  const { geo } = await allFigures();
  const g = geo('trig-graphs-exact-sin');
  const pl = planeOf(g.svg)!;
  const values = textsOf(g.svg).filter((t) => /data-yvalue/.test(t.attrs));
  expect(values.length).toBe(4);
  const lines = [...g.svg.matchAll(/<line class="guide" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].filter((m) => m[2] === m[4]).map((m) => toGraph(pl, 0, Number(m[2]))[1]);
  for (const t of values) {
    const angle = Number(/data-yvalue="(\d+)"/.exec(t.attrs)?.[1]);
    const shown = evalForm(t.text.replace('/', '/'));
    expect(shown, `the label at ${angle} degrees`).toBeCloseTo(sin(angle), 9);
    // the label is on the line at that height (the text baseline is 8 below its middle)
    expect(toGraph(pl, 0, t.y - 8)[1], `label height at ${angle}`).toBeCloseTo(sin(angle), 1);
    expect(lines.some((h) => Math.abs(h - sin(angle)) < 0.01), `a dashed line at the height of sin ${angle}`).toBe(true);
  }
  // every sine point is at the height of the label and on the curve
  for (const p of pointsOf(g.svg)) expect(p.at[1]).toBeCloseTo(sin(p.at[0]), 9);
});

test('the sine-odd figure writes the heights it states at the points it marks', async () => {
  const { geo } = await allFigures();
  const g = geo('trig-graphs-sine-odd');
  const pl = planeOf(g.svg)!;
  const values = textsOf(g.svg).filter((t) => /data-yvalue/.test(t.attrs));
  expect(values.map((t) => Number(t.text.replace('\u2212', '-'))).sort()).toEqual([-0.5, 0.5]);
  for (const t of values) {
    const h = toGraph(pl, 0, t.y - 8)[1];
    expect(sin(h > 0 ? 30 : -30)).toBeCloseTo(Number(t.text.replace('\u2212', '-')), 9);
    expect(Math.sign(h)).toBe(Math.sign(Number(t.text.replace('\u2212', '-'))));
  }
  // each point's angle is written at the foot of its own dashed line, on the x-axis
  for (const [pt, angle] of [['p30', 30], ['m30', -30]] as const) {
    const label = textsOf(g.svg).find((t) => new RegExp(`data-foot="${pt}"`).test(t.attrs))!;
    // the label is centred under (or over) its own point, and on the side of the x-axis the curve is not on
    expect(label.x, `${pt} label x`).toBeCloseTo(pointsOf(g.svg).find((q) => q.id === pt)!.px[0], 0);
    expect(Number(label.text.replace('\u00b0', '').replace('\u2212', '-'))).toBe(angle);
    expect(toGraph(pl, label.x, 0)[0]).toBeCloseTo(angle, 0);
  }
});

test('the x-axis numbers sit at the right x positions', async () => {
  const { ids, geo } = await allFigures();
  let checked = 0;
  for (const figure of ids) {
    const { svg } = geo(figure);
    const pl = planeOf(svg);
    if (!pl) continue;
    for (const t of textsOf(svg).filter((x) => /data-xlabel/.test(x.attrs))) {
      checked += 1;
      const value = Number(/data-xlabel="([^"]+)"/.exec(t.attrs)?.[1]);
      expect(t.text.replace('\u2212', '-')).toBe(`${value}\u00b0`);
      expect(toGraph(pl, t.x, 0)[0]).toBeCloseTo(value, 0);
    }
  }
  expect(checked).toBeGreaterThan(50);
});

test('the unit circle figures put P at the stated angle, and the quadrant figure labels each quarter correctly', async () => {
  const { geo } = await allFigures();
  for (const [figure, angle] of [['trig-graphs-unit-circle', 150], ['trig-graphs-q-circle', 300]] as const) {
    const { svg, meta } = geo(figure);
    const pl = planeOf(svg)!;
    // one pixel scale on both axes
    expect((pl.right - pl.left) / (pl.xmax - pl.xmin)).toBeCloseTo((pl.bottom - pl.top) / (pl.ymax - pl.ymin), 6);
    const P = pointsOf(svg).find((p) => p.id === 'P')!;
    expect(P.at[0], `${figure} x`).toBeCloseTo(cos(angle), 9);
    expect(P.at[1], `${figure} y`).toBeCloseTo(sin(angle), 9);
    expect(meta.angles).toEqual([{ point: 'P', angle }]);
    // the angle label states the angle
    expect(textsOf(svg).some((t) => t.text === `${angle}\u00b0`), `${figure}: angle label`).toBe(true);
    // the radius line runs from the origin to P
    const radius = [...svg.matchAll(/<line class="line" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)][0];
    expect(toGraph(pl, Number(radius[1]), Number(radius[2])).map((v) => Math.abs(v) < 0.01)).toEqual([true, true]);
    expect(toGraph(pl, Number(radius[3]), Number(radius[4]))[0]).toBeCloseTo(cos(angle), 2);
  }
  // the numbers written on the figures
  const unit = geo('trig-graphs-unit-circle');
  const note = textsOf(unit.svg).find((t) => /coordinates/.test(t.attrs))!.text.replace('\u2212', '-');
  expect(note).toBe(`P = (${dp3(cos(150))}, ${dp1(sin(150))})`);
  expect(textsOf(geo('trig-graphs-q-circle').svg).find((t) => /x-coordinate/.test(t.attrs))!.text).toBe(`P has x = ${dp1(cos(300))}`);
  // the CAST labels
  const q = geo('trig-graphs-quadrants');
  const labels = [...q.svg.matchAll(/data-quadrant="(\w+)" data-at="([\d.-]+),([\d.-]+)"/g)];
  expect(labels.length).toBe(4);
  for (const [, name, xs, ys] of labels) {
    const angle = Math.atan2(Number(ys), Number(xs)) / RAD;
    const positive = [sin(angle) > 0 && 'Sin', cos(angle) > 0 && 'Cos', tan(angle) > 0 && 'Tan'].filter(Boolean);
    const expected = positive.length === 3 ? 'All' : positive[0];
    expect(positive.length === 3 || positive.length === 1, `${name}: exactly one or all three`).toBe(true);
    expect(name).toBe(expected);
  }
  expect(q.meta.quadrants!.map((x) => x.text)).toEqual(['All', 'Sin', 'Tan', 'Cos']);
});

test('the two triangles are drawn to scale, with the stated sides and angles, and labels beside their own edge', async () => {
  const { geo } = await allFigures();
  const problems: string[] = [];
  const dist = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const toSeg = (p: number[], a: number[], b: number[]) => {
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };
  for (const [figure, angles] of [['trig-graphs-tri-30-60', { B: 30, C: 60 }], ['trig-graphs-tri-45', { B: 45, C: 45 }]] as const) {
    const { svg, meta } = geo(figure);
    const tri = meta.triangle!;
    // the stated sides really are 1, 1 and root 2 (or 1, root 3 and 2): the hypotenuse is the longest, by Pythagoras
    const v = Object.fromEntries(tri.sides.map((s) => [`${s.from}${s.to}`, s.value]));
    expect(v.AB ** 2 + v.AC ** 2, `${figure}: Pythagoras`).toBeCloseTo(v.BC ** 2, 9);
    // the corners as drawn: read the three edges back from the picture
    const edges = [...svg.matchAll(/<line class="line" data-edge="(\w\w)" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].map((m) => ({ id: m[1], a: [Number(m[2]), Number(m[3])], b: [Number(m[4]), Number(m[5])] }));
    expect(edges.length, figure).toBe(3);
    const corner: Record<string, number[]> = {};
    for (const e of edges) { corner[e.id[0]] = e.a; corner[e.id[1]] = e.b; }
    const scales = edges.map((e) => dist(e.a, e.b) / v[e.id]);
    if (scales.some((s) => Math.abs(s / scales[0] - 1) > 0.005)) problems.push(`${figure}: the stated sides are not drawn in proportion`);
    const angleAt = (at: string, p: string, q: string) => { const a = [corner[p][0] - corner[at][0], corner[p][1] - corner[at][1]]; const b = [corner[q][0] - corner[at][0], corner[q][1] - corner[at][1]]; return Math.acos((a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))) / RAD; };
    if (Math.abs(angleAt('A', 'B', 'C') - 90) > 0.06) problems.push(`${figure}: the corner A is not a right angle`);
    for (const [at, value] of Object.entries(angles)) {
      const other = at === 'B' ? 'C' : 'B';
      if (Math.abs(angleAt(at, 'A', other) - value) > 0.06) problems.push(`${figure}: the angle at ${at} is drawn as ${angleAt(at, 'A', other).toFixed(2)}, not ${value}`);
      const stated = tri.angles.find((a) => a.at === at)!.value;
      if (stated !== value) problems.push(`${figure}: the stated angle at ${at} is ${stated}`);
    }
    // each side label is nearer its own edge than the others; each angle label is inside and nearest its own corner
    const texts = textsOf(svg);
    for (const s of tri.sides) {
      const t = texts.find((x) => new RegExp(`data-side="${s.from}${s.to}"`).test(x.attrs))!;
      expect(t.text, `${figure} ${s.from}${s.to}`).toBe(s.text);
      const c = centreOf(t);
      const nearest = edges.reduce((best, e) => (toSeg(c, e.a, e.b) < toSeg(c, best.a, best.b) ? e : best));
      if (nearest.id !== `${s.from}${s.to}` && nearest.id !== `${s.to}${s.from}`) problems.push(`${figure}: the label "${t.text}" belongs to ${s.from}${s.to} but is nearest ${nearest.id}`);
    }
    for (const a of tri.angles) {
      const t = texts.find((x) => new RegExp(`data-vertex="${a.at}"`).test(x.attrs))!;
      expect(t.text).toBe(`${a.value}\u00b0`);
      const c = centreOf(t);
      const nearest = Object.keys(corner).reduce((best, n) => (dist(c, corner[n]) < dist(c, corner[best]) ? n : best));
      if (nearest !== a.at) problems.push(`${figure}: the angle label ${t.text} for ${a.at} is nearest corner ${nearest}`);
      const sign = (p: number[], q: number[], r: number[]) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
      const d1 = sign(c, corner.A, corner.B);
      const d2 = sign(c, corner.B, corner.C);
      const d3 = sign(c, corner.C, corner.A);
      if (!((d1 < 0 && d2 < 0 && d3 < 0) || (d1 > 0 && d2 > 0 && d3 > 0))) problems.push(`${figure}: the angle label ${t.text} is outside the triangle`);
    }
  }
  expect(problems).toEqual([]);
});

test('every figure text alternative states every value the figure shows, and a question figure is described by its question and never gives the answer', async () => {
  const { ids, geo } = await allFigures();
  const qs = questions(SOURCE);
  const problems: string[] = [];
  let checked = 0;
  for (const figure of ids) {
    const { svg, meta } = geo(figure);
    const desc = decode(/<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg)?.[1] ?? '');
    expect(desc.length, `${figure}: has a description`).toBeGreaterThan(60);
    for (const fact of meta.facts) {
      checked += 1;
      const word: Record<string, string> = { '\u221a3': 'root 3', '\u221a2': 'root 2' };
      const needle = word[fact] ?? fact;
      if (!new RegExp(`(?<![\\d.])${needle.replace('.', '\\.')}(?![\\d])`).test(desc)) problems.push(`${figure}: the picture shows ${fact} but its description does not say so`);
    }
    // every number written on the picture (not on an axis) is in the description
    for (const t of textsOf(svg)) {
      if (/data-xlabel/.test(t.attrs) || /class="svg-t small"/.test(t.attrs)) continue;
      for (const n of t.text.replace(/\u2212/g, '-').matchAll(/(?<![\w.])-?\d+(?:\.\d+)?/g)) {
        const v = n[0].replace('-', '');
        if (!new RegExp(`(?<![\\d.])${v.replace('.', '\\.')}(?![\\d])`).test(desc)) problems.push(`${figure}: the text "${t.text}" shows ${v} but the description does not`);
      }
    }
    const user = qs.filter((q) => q.fig === figure);
    if (user.length) {
      expect(user.length, `${figure}: used by one question`).toBe(1);
      const q = user[0];
      for (const fact of meta.facts) if (!new RegExp(`(?<![\\d.])${fact.replace('.', '\\.')}(?![\\d])`).test(q.text)) problems.push(`${figure}: the question does not state ${fact}`);
      // the answers (any number in the key) are neither written on the picture nor in the description
      for (const a of q.answers.flatMap((x) => x.split(/\s+or\s+/))) {
        const re = new RegExp(`(?<![\\d.])${a.replace(/^-/, '').replace('.', '\\.')}(?![\\d])`);
        if (re.test(desc) || textsOf(svg).some((t) => re.test(t.text))) problems.push(`${figure}: the answer ${a} appears in the picture or its description`);
      }
      expect(desc, figure).not.toMatch(/answer|solution|is found to be/i);
    }
  }
  expect(checked).toBeGreaterThan(40);
  expect(qs.filter((q) => q.fig).map((q) => q.fig).sort()).toEqual(['trig-graphs-q-circle', 'trig-graphs-q-solve']);
  expect(problems).toEqual([]);
});

test('no text leaves its picture, and every figure on the page is used once', async () => {
  const { ids, geo } = await allFigures();
  const problems: string[] = [];
  for (const figure of ids) {
    const { svg } = geo(figure);
    const [w, h] = viewBoxOf(svg);
    for (const t of textsOf(svg)) {
      const width = t.text.length * 14.5; // a generous width for 27px bold text
      const left = t.anchor === 'start' ? t.x : t.anchor === 'end' ? t.x - width : t.x - width / 2;
      const right = left + width;
      if (left < -1 || right > w + 1 || t.y - 27 < -2 || t.y + 6 > h + 1) problems.push(`${figure}: "${t.text}" may leave the picture (x ${Math.round(left)} to ${Math.round(right)} of ${w}, y ${t.y} of ${h})`);
    }
    // no label, however wide it is made, ends past the picture's own width at the narrowest scale: a picture is 520 wide or less
    expect(w, figure).toBeLessThanOrEqual(520);
  }
  expect(problems).toEqual([]);
  const used = [...SOURCE.matchAll(/\{fig:([a-z0-9-]+)\}/g)].map((m) => m[1]);
  expect([...used].sort()).toEqual([...ids].sort());
});

test('labels in the figures stay at least 12px tall at 320px, and the page keeps every figure inside its column', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/trig-graphs.html');
  const small = await page.evaluate(() => {
    const out: string[] = [];
    for (const svg of document.querySelectorAll('main svg.graph-svg')) {
      const vb = (svg as SVGSVGElement).viewBox.baseVal;
      const scale = svg.getBoundingClientRect().width / vb.width;
      const title = svg.querySelector('title')?.textContent ?? '';
      if (svg.getBoundingClientRect().right > innerWidth + 1) out.push(`${title}: wider than the screen`);
      for (const t of svg.querySelectorAll('text')) {
        if (!(t.textContent ?? '').trim()) continue;
        const size = parseFloat(getComputedStyle(t).fontSize) * scale;
        if (size < 12) out.push(`${title}: "${t.textContent}" is ${size.toFixed(1)}px tall`);
      }
    }
    return out;
  });
  expect(small).toEqual([]);
  const count = await page.locator('main svg.graph-svg').count();
  expect(count).toBe(20);
});

test('a defined word is linked with its plain name, with no bracketed extra in the link text', async ({ page }) => {
  await page.goto('/courses/a-level/trig-graphs.html');
  const texts = await page.locator('main a.term:not(.words-strip a)').allTextContents();
  expect(texts.length).toBeGreaterThan(8);
  expect(texts.filter((t) => t.includes('('))).toEqual([]);
});

test('no label sits on a curve or a line: nothing drawn crosses the box of any text, padded by 1px', async ({ page }) => {
  await page.goto('/courses/a-level/trig-graphs.html');
  const hits = await page.evaluate(() => {
    const out: string[] = [];
    for (const svg of document.querySelectorAll('main svg.graph-svg')) {
      const title = svg.querySelector('title')?.textContent ?? '';
      // everything drawn that a label must stay clear of: sample the curves, take the ends of the straight lines
      const segs: [number, number, number, number, string][] = [];
      for (const el of svg.querySelectorAll('path.curve, path.curve-b, path.curve-c, path.guide')) {
        const path = el as SVGPathElement;
        const len = path.getTotalLength();
        let prev = path.getPointAtLength(0);
        for (let l = 2; l <= len + 2; l += 2) {
          const p = path.getPointAtLength(Math.min(l, len));
          // a jump of more than 40 units is a break in the path (the tangent), not a stroke
          if (Math.hypot(p.x - prev.x, p.y - prev.y) < 40) segs.push([prev.x, prev.y, p.x, p.y, el.getAttribute('class') ?? '']);
          prev = p;
        }
      }
      for (const el of svg.querySelectorAll('line.guide, line.line, line.axis')) {
        segs.push([+el.getAttribute('x1')!, +el.getAttribute('y1')!, +el.getAttribute('x2')!, +el.getAttribute('y2')!, el.getAttribute('class') ?? '']);
      }
      for (const t of svg.querySelectorAll('text')) {
        const label = (t.textContent ?? '').trim();
        if (!label) continue;
        const b = (t as SVGTextElement).getBBox();
        const [l, r, tp, bt] = [b.x - 1, b.x + b.width + 1, b.y - 1, b.y + b.height + 1];
        for (const [x1, y1, x2, y2, cls] of segs) {
          // Liang-Barsky: does the segment meet the box?
          let t0 = 0; let t1 = 1;
          const dx = x2 - x1; const dy = y2 - y1;
          let ok = true;
          for (const [p, q] of [[-dx, x1 - l], [dx, r - x1], [-dy, y1 - tp], [dy, bt - y1]]) {
            if (Math.abs(p) < 1e-9) { if (q < 0) { ok = false; break; } } else { const k = q / p; if (p < 0) { if (k > t1) { ok = false; break; } t0 = Math.max(t0, k); } else { if (k < t0) { ok = false; break; } t1 = Math.min(t1, k); } }
          }
          if (ok) { out.push(`${title}: "${label}" is crossed by a ${cls}`); break; }
        }
      }
    }
    return out;
  });
  expect(hits).toEqual([]);
});
