import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Tangents, normals and stationary points page that a general test cannot make:
//  - every typed answer is RECOMPUTED here from the maths, to the form the question asks for,
//  - every wrong-answer entry is recomputed from the slip its message names, and none is the right answer,
//  - every blank in a "Now you finish it" box holds the recomputed value,
//  - EVERY equation on the page that ends in a number is evaluated by a small calculator and compared with the number shown,
//  - every stationary point, its nature and the facts the lessons quote are recomputed from the curve,
//  - every figure's curves, straight lines and marked points are compared with the equation they claim to show, each
//    tangent is checked to be a tangent and each normal to be perpendicular, and every label is checked in a browser:
//    inside the picture, at least 12px on a phone, clear of each other and of every line, each point's label nearest its own point.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'differentiation-applications.html'), 'utf8');
const BODY = SOURCE.replace(/<!--[\s\S]*?-->/g, '');
const PAGE = '/courses/a-level/differentiation-applications.html';

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', hellip: '...', rsquo: "'", ldquo: '"', rdquo: '"', divide: '/', sup2: '^2', sup3: '^3', middot: '.' };
const decode = (t: string) => t.replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n] ?? m);

// ---- the maths, written independently of the figure code ----
const d1 = (f: (x: number) => number, x: number) => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5;
const d2 = (f: (x: number) => number, x: number) => (f(x + 1e-3) - 2 * f(x) + f(x - 1e-3)) / 1e-6;
const C1 = (x: number) => x * x - 4 * x + 5;
const F3 = (x: number) => x ** 3 - 6 * x * x + 9 * x;
const G3 = (x: number) => x ** 3 - 12 * x;

type Fn = (x: number) => number;
type Slip = [string, number | Fn | [number, number]];
type Case = { find: string; kind: 'num' | 'pair' | 'fn'; key: number | [number, number] | Fn; wrongs: Slip[] };
const N = (find: string, key: number, wrongs: [string, number][] = []): Case => ({ find, kind: 'num', key, wrongs });
const P = (find: string, key: [number, number], wrongs: [string, [number, number]][] = []): Case => ({ find, kind: 'pair', key, wrongs });
const F = (find: string, key: Fn, wrongs: [string, Fn][] = []): Case => ({ find, kind: 'fn', key, wrongs });
const line = (m: number, c: number): Fn => (x) => m * x + c;
const tangentLine = (f: Fn, a: number): Fn => (x) => f(a) + d1(f, a) * (x - a);

const CASES: Case[] = [
  // warm-up and recap
  F('Differentiate {m:y=x^3-5x^2+4x-1}', (x) => 3 * x * x - 10 * x + 4, [['3x^2-10x+3', (x) => 3 * x * x - 10 * x + 4 - 1], ['3x^2-10x', (x) => 3 * x * x - 10 * x], ['3x^2-5x+4', (x) => 3 * x * x - 5 * x + 4]]),
  F('A straight line has gradient 3 and passes through (2, 7)', line(3, 1), [['y=3x+7', line(3, 7)], ['y=3x-6', (x) => 3 * (x - 2)]]),
  N('A line has gradient {m:frac(4, 5)}', -1 / (4 / 5), [['5/4', 5 / 4], ['-4/5', -4 / 5]]),
  F('Write {m:frac(8, x^2)} as a number times a power of x', (x) => 8 / (x * x), [['8x^2', (x) => 8 * x * x], ['-8x^2', (x) => -8 * x * x]]),
  // 1 tangents
  F('passes through the point P (3, 6)', tangentLine((x) => x * x - 2 * x + 3, 3), [['y=4x+6', line(4, 6)], ['y=4x-12', (x) => 4 * (x - 3)]]),
  N('Find the gradient of the tangent to {m:y=x^3-5x} at the point where {m:x=2}', d1((x) => x ** 3 - 5 * x, 2), [['-2', 2 ** 3 - 5 * 2], ['12', 3 * 2 ** 2]]),
  F('Find the equation of the tangent to {m:y=x^2+3x-1}', tangentLine((x) => x * x + 3 * x - 1, 2), [['y=7x+9', line(7, 9)], ['y=7x-14', (x) => 7 * (x - 2)]]),
  N('has gradient 6 at the point P', (6 + 4) / 2, [['1', (6 - 4) / 2], ['10', C1(5)]]),
  F('Find the equation of the tangent to {m:y=frac(8, x^2)}', tangentLine((x) => 8 / (x * x), 2), [['y=2x-2', (x) => 2 + 2 * (x - 2)], ['y=-2x+4', (x) => -2 * (x - 2)]]),
  // 2 normals
  N('The tangent to a curve at a point has gradient 5', -1 / 5, [['1/5', 1 / 5], ['-5', -5], ['5', 5]]),
  N('Find the gradient of the normal to {m:y=x^2} at the point where {m:x=4}', -1 / d1((x) => x * x, 4), [['1/8', 1 / 8], ['-8', -8], ['-1/16', -1 / 16]]),
  N('passes through the point Q (6, 3)', 1 / (-(3 - 4) / (6 - 2)), [['-1/4', (3 - 4) / (6 - 2)], ['1/4', 1 / 4], ['-4', -4]]),
  F('Find the equation of the normal to {m:y=sqrt(x)}', (x) => 2 - 4 * (x - 4), [['y=4x-14', (x) => 2 + 4 * (x - 4)], ['y=-4x+16', (x) => -4 * (x - 4)]]),
  N('is a vertical line with equation {m:x=a}', 2, [['-16', G3(2)]]),
  // 3 increasing and decreasing
  N('The function f is increasing for {m:x > a}', 4, [['-4', -4], ['8', 8]]),
  N('Find the value of the gradient at {m:x=0}', (0 - 2) * (0 + 5), [['10', 10], ['3', -2 + 5]]),
  // 4 stationary points
  N('Find the x-coordinate of the stationary point of {m:y=x^2-6x+4}', 3, [['-3', -3], ['6', 6]]),
  P('Find the coordinates of the stationary point of {m:y=x^2-6x+4}', [3, 3 * 3 - 18 + 4], [['(3,0)', [3, 0]], ['(-3,31)', [-3, 9 + 18 + 4]]]),
  N('Find the y-coordinate of the other one', (4 ** 3) - 6 * 16, [['0', 0], ['32', 96 - 64]]),
  N('Find the x-coordinate of the stationary point.', 2, [['4', 4], ['-2', -2]]),
  N('Write down the equation of the tangent to the curve at this point', -16, [['2', 2]]),
  // 5 nature
  N('Find the value of {m:frac(d^2y, dx^2)} at {m:x=1}.', 12 * 1 - 18, [['6', 12 * 2 - 18], ['12', 12 * 1]]),
  N('Find the y-coordinate of the maximum point.', 2 - 9 + 12, [['4', 16 - 36 + 24], ['1', 1], ['-6', 12 - 18]]),
  N('Find the value of {m:frac(d^2y, dx^2)} at {m:x=2}.', 8 / 2 ** 3, [['-1', -8 / 2 ** 3], ['2', 8 / 2 ** 2]]),
  // 6 optimisation
  N('Two numbers add up to 12', 36, [['6', 6], ['12', 12]]),
  N('Find the least possible value of C', 4 + 16 / 4, [['4', 4], ['20', 4 + 16]]),
  N('A rectangle has perimeter 30 cm', 7.5 * 7.5, [['7.5', 7.5], ['225', 15 * 15], ['112.5', 7.5 * 15]]),
  N('A farmer has 80 m of fence for three sides', 20 * 40, [['20', 20], ['1600', 40 * 40], ['40', 40]]),
  // flip it
  N('has a stationary point where {m:x=4}. Find b', -8, [['8', 8], ['-4', -4]]),
  N('{m:y=2x^2+bx+1}', 4, [['-4', -4]]),
  N('Find k', 7 - 2 * 2, [['7', 7], ['11', 7 + 4]]),
  N('has a maximum point where {m:x=2}. Find a', -8 / 4, [['2', 2], ['-4', -8 / 2]]),
  // mixed review
  N('Find the gradient of the tangent to {m:y=2x^3-5x^2+4}', d1((x) => 2 * x ** 3 - 5 * x * x + 4, 1), [['1', 2 - 5 + 4], ['4', 4]]),
  F('Find the equation of the normal to {m:y=frac(4, x)}', (x) => 1 + 4 * (x - 4), [['y=-4x+17', (x) => 1 - 4 * (x - 4)], ['y=4x-16', (x) => 4 * (x - 4)]]),
  P('Find the coordinates of the maximum point of {m:y=x^3-3x^2-9x+1}', [-1, -1 - 3 + 9 + 1], [['(3,-26)', [3, 27 - 27 - 27 + 1]], ['(-1,-12)', [-1, 6 * -1 - 6]]]),
  N('A rectangle has perimeter 36 cm', 9 * 9, [['9', 9], ['324', 18 * 18]]),
  // exam style
  F('Find {m:frac(dy, dx)}. Type it like 5x^2-3x+1', (x) => 3 * x * x - 12 * x + 9, [['3x^2-12x+11', (x) => 3 * x * x - 12 * x + 11], ['3x^2-6x+9', (x) => 3 * x * x - 6 * x + 9]]),
  F('Find the equation of the tangent to C at the point where {m:x=2}', line(-3, 10), [['y=-3x+4', line(-3, 4)], ['y=-3x+6', (x) => -3 * (x - 2)]]),
  P('The curve C has a maximum point', [1, 1 - 6 + 9 + 2], [['(3,2)', [3, 27 - 54 + 27 + 2]], ['(1,-6)', [1, 6 * 1 - 12]]]),
  N('Find the x-coordinate of D', 7, [['2', 2], ['3.5', 3.5]]),
  N('Find the area of the triangle ABD', 0.5 * 5 * 2, [['10', 5 * 2]]),
  F('Expand and simplify', (x) => x * (12 - 2 * x) ** 2, [['144x-4x^3', (x) => x * (144 - 4 * x * x)]]),
  F('Find {m:frac(dV, dx)}', (x) => 12 * x * x - 96 * x + 144, [['12x^2-48x+144', (x) => 12 * x * x - 48 * x + 144]]),
  N('for which V is a maximum', 2, [['6', 6]]),
  N('Find the greatest possible volume', 2 * (12 - 4) ** 2, [['2', 2], ['0', 6 * 0]]),
  N('Find the smallest value of {m:f\'(x)}', 3, [['0', 0]]),
];

type Q = { raw: string; text: string; answers: string[]; wrongs: string[]; mode: string; block: string; type: string; hints: string; solution: string };
function questions(): Q[] {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const raw = /<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongs = [...(/<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '').matchAll(/data-if="([^"]*)"/g)].flatMap((m) => decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean));
    const mode = /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? '';
    const hints = /<ol class="ladder">([\s\S]*?)<\/ol>/.exec(block)?.[1] ?? '';
    const solution = /<div class="solution">([\s\S]*?)<\/div>/.exec(block)?.[1] ?? '';
    return { raw, text: decode(raw), answers, wrongs, mode, block, type: /data-type="([^"]*)"/.exec(attrs)?.[1] ?? '', hints, solution };
  });
}
// a typed answer: a number, a fraction like -3/4, a pair like (3,-5), or an expression in x
const num = (t: string) => (t.includes('/') ? t.split('/').map(Number).reduce((a, b) => a / b) : Number(t));
const pair = (t: string): [number, number] => { const m = /^\(?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)?$/.exec(t); if (!m) throw new Error(`not a pair: ${t}`); return [Number(m[1]), Number(m[2])]; };
const fnOf = (t: string): Fn => {
  const js = t.replace(/^y\s*=\s*/, '').replace(/\^/g, '**').replace(/(\d)([x(])/g, '$1*$2').replace(/(x|\))\(/g, '$1*(').replace(/\)(x|\d)/g, ')*$1');
  if (!/^[\dx+\-*().\s]+$/.test(js)) throw new Error(`cannot read ${t}`);
  return new Function('x', `return ${js};`) as Fn;
};
const same = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));
const POINTS_X = [-2.5, -1, -0.5, 0.5, 1, 2, 3, 4.5];
const sameFn = (f: Fn, g: Fn) => POINTS_X.every((x) => Math.abs(f(x) - g(x)) < 1e-7 * Math.max(1, Math.abs(f(x))));

test('the page has 55 to 65 questions, 4 to 6 numbered lessons and 12 to 20 figures, and every lesson has all three parts', () => {
  const qs = questions();
  expect(qs.length).toBeGreaterThanOrEqual(55);
  expect(qs.length).toBeLessThanOrEqual(65);
  const lessons = SOURCE.split(/(?=<h2>)/).filter((s) => /^<h2>\d\./.test(s));
  expect(lessons.length).toBeGreaterThanOrEqual(4);
  expect(lessons.length).toBeLessThanOrEqual(6);
  for (const l of lessons) {
    const name = /^<h2>([^<]*)/.exec(l)?.[1];
    expect(l, `${name}: Key idea`).toContain('<b>Key idea:</b>');
    expect(l, `${name}: worked example`).toContain('class="worked"');
    expect(l, `${name}: faded example`).toContain('class="worked faded"');
  }
  const figs = [...SOURCE.matchAll(/\{fig:([a-z0-9-]+)\}/g)].map((m) => m[1]);
  expect(figs.length).toBeGreaterThanOrEqual(12);
  expect(figs.length).toBeLessThanOrEqual(20);
  expect(new Set(figs).size, 'a figure id is used twice').toBe(figs.length);
});

test('every typed answer is recomputed, and every slip value is recomputed from its message', () => {
  const qs = questions();
  const problems: string[] = [];
  for (const c of CASES) {
    const hits = qs.filter((q) => q.raw.includes(c.find));
    if (hits.length !== 1) { problems.push(`"${c.find}" matches ${hits.length} questions`); continue; }
    const q = hits[0];
    if (q.answers.length === 0) problems.push(`"${c.find}": no answer`);
    const modeWanted = c.kind === 'fn' ? 'exact' : 'value';
    if (q.mode !== modeWanted) problems.push(`"${c.find}": mode ${q.mode}, wanted ${modeWanted}`);
    for (const a of q.answers) {
      if (c.kind === 'num') { if (!same(num(a), c.key as number)) problems.push(`"${c.find}": the page accepts ${a}, recomputed ${c.key}`); }
      else if (c.kind === 'pair') { const [x, y] = pair(a); const [kx, ky] = c.key as [number, number]; if (!same(x, kx) || !same(y, ky)) problems.push(`"${c.find}": the page accepts ${a}, recomputed (${kx}, ${ky})`); }
      else if (!sameFn(fnOf(a), c.key as Fn)) problems.push(`"${c.find}": the page accepts ${a}, which is not the recomputed expression`);
    }
    // each wrong-answer entry: a listed slip, never the right answer; each listed slip has an entry
    const value = (text: string, kind: Case['kind']) => (kind === 'num' ? num(text) : kind === 'pair' ? pair(text) : fnOf(text));
    const matches = (w: string, slip: Slip[1]) => {
      if (c.kind === 'num') return same(value(w, 'num') as number, slip as number);
      if (c.kind === 'pair') { const [a, b] = value(w, 'pair') as [number, number]; const [s, t] = slip as [number, number]; return same(a, s) && same(b, t); }
      return sameFn(value(w, 'fn') as Fn, slip as Fn);
    };
    const isKey = (w: string) => (c.kind === 'num' ? same(value(w, 'num') as number, c.key as number) : c.kind === 'pair' ? matches(w, c.key as [number, number]) : sameFn(value(w, 'fn') as Fn, c.key as Fn));
    for (const w of q.wrongs) {
      if (!c.wrongs.some(([, slip]) => matches(w, slip))) problems.push(`"${c.find}": wrong-answer value ${w} is not tied to a slip in this test`);
      if (isKey(w)) problems.push(`"${c.find}": the wrong-answer entry ${w} is the right answer`);
    }
    for (const [text, slip] of c.wrongs) {
      if (!q.wrongs.some((w) => matches(w, slip))) problems.push(`"${c.find}": no wrong-answer entry for the slip ${text}`);
      if (!matches(text, slip)) problems.push(`"${c.find}": ${text} is not what its slip gives`);
    }
  }
  expect(CASES.length).toBeGreaterThan(40);
  expect(problems).toEqual([]);
});

test('every typed question on the page has a recomputed case, and the multiple-choice questions are the rest', () => {
  const qs = questions();
  const typed = qs.filter((q) => q.type !== 'mc');
  const uncovered = typed.filter((q) => !CASES.some((c) => q.raw.includes(c.find))).map((q) => q.text.slice(0, 80));
  expect(uncovered).toEqual([]);
  expect(typed.length).toBe(CASES.length);
  expect(qs.filter((q) => q.type === 'mc').length).toBe(qs.length - CASES.length);
});

test('a hint never states the answer, and the solution does', () => {
  const problems: string[] = [];
  const flat = (t: string) => decode(t.replace(/\{m:([^}]*)\}/g, ' $1 ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  for (const c of CASES) {
    const q = questions().find((x) => x.raw.includes(c.find));
    if (!q) continue;
    const hints = flat(q.hints);
    const solution = flat(q.solution);
    if (c.kind === 'fn') {
      const compact = hints.replace(/[\s*]/g, '');
      for (const a of q.answers) if (a.length >= 5 && compact.includes(a.replace(/^y=/, '').replace(/\s/g, ''))) problems.push(`"${c.find}": a hint contains ${a}`);
    } else if (c.kind === 'num') {
      const key = c.key as number;
      if (Number.isInteger(key) && Math.abs(key) <= 12) {
        // a small whole number turns up by chance in a hint: only "= 4", "is 4" or "equals 4" is giving it away
        if (new RegExp(`(?:=|\\bis|\\bequals)\\s*${String(key).replace('-', '\\-')}(?![\\d.])`).test(hints)) problems.push(`"${c.find}": a hint says ${key}`);
      } else for (const m of hints.matchAll(/-?\d+(?:\.\d+)?/g)) if (same(Number(m[0]), key)) problems.push(`"${c.find}": a hint contains ${m[0]}`);
      // the solution says the answer (whole numbers and two-place decimals are written out in full)
      // (a key that is a fraction, such as -5/4, is written as a fraction in the solution)
      const shown = String(Math.abs(key));
      if ((Number.isInteger(key) || key === 56.25) && !solution.includes(shown)) problems.push(`"${c.find}": the solution does not contain ${shown}`);
    } else {
      const [x, y] = c.key as [number, number];
      for (const v of [x, y]) if (!solution.includes(String(Math.abs(v)))) problems.push(`"${c.find}": the solution does not contain ${v}`);
    }
  }
  expect(problems).toEqual([]);
});

test('accepted answers: no ambiguous written form, y= forms come in pairs, and every list holds one value', () => {
  const problems: string[] = [];
  for (const q of questions()) {
    if (q.type === 'mc') continue;
    for (const a of q.answers) {
      if (/\d\/\d+[a-z(]/.test(a)) problems.push(`${a}: a fraction followed by a letter is ambiguous (1/2x)`);
      if (/(?:ln|log)\s*\d+\s*\//.test(a)) problems.push(`${a}: ambiguous`);
    }
    // a question that accepts "y=..." accepts the same without it, and the other way round
    if (q.answers.some((a) => a.startsWith('y='))) {
      for (const a of q.answers) {
        const bare = a.replace(/^y=/, '');
        if (!q.answers.includes(bare) || !q.answers.includes(`y=${bare}`)) problems.push(`${q.text.slice(0, 50)}: ${a} has no partner`);
      }
    }
  }
  expect(problems).toEqual([]);
});

test('every "Now you finish it" blank holds the recomputed value', () => {
  const blanks = [...SOURCE.matchAll(/<span class="blank"([^>]*)>/g)].map((m) => decode(/data-answers="([^"]*)"/.exec(m[1])?.[1] ?? '').split(';'));
  type Want = number | RegExp | Fn;
  const f1 = (x: number) => x * x + 2 * x - 3;
  const want: Want[] = [
    (x) => 2 * x + 2, d1(f1, 1), f1(1), tangentLine(f1, 1), // lesson 1: tangent to x^2+2x-3 at x=1
    d1((x) => x * x - 2 * x + 3, 3), -1 / 4, 3 + 4 * 6, // lesson 2: gradient 4, normal gradient -1/4, x + 4y = 27
    (x) => 6 * x * x - 6 * x - 12, -1, 2, // lesson 3: f' and the roots
    (x) => 6 * x * x - 6, 2 - 6, -2 + 6, // lesson 4: y at x = 1 and x = -1 for 2x^3 - 6x
    (x) => 6 * x, 6 * 2, /^(?:a |local )?min(?:imum)?$/, 6 * -2, /^(?:a |local )?max(?:imum)?$/, // lesson 5
    (x) => 60 * x - 2 * x * x, (x) => 60 - 4 * x, 60 / 4, 15 * 30, // lesson 6
    0 - 2 * -1, 4 - 1 + 2, // flip it: b from 2(-1) + b = 0 is 2, c from 4 = 1 - 2 + c is 5
  ];
  expect(blanks.length).toBe(want.length);
  blanks.forEach((answers, i) => {
    const w = want[i];
    for (const a of answers) {
      if (w instanceof RegExp) expect(a, `blank ${i}`).toMatch(w);
      else if (typeof w === 'number') expect(same(num(a), w), `blank ${i}: ${a} should be ${w}`).toBe(true);
      else expect(sameFn(fnOf(a), w), `blank ${i}: ${a}`).toBe(true);
    }
  });
});

// ---- a small calculator for the maths written on the page ----
// It reads {m:...} and {md:...} bodies, splits each at its equals signs, evaluates every side that has only numbers
// and the functions frac and sqrt, and compares each number written with the value computed.
class Skip extends Error {}
function evaluate(src: string): number {
  const s = src.replace(/\s+/g, ' ').trim();
  let i = 0;
  const peek = () => s[i];
  const skipWs = () => { while (s[i] === ' ') i += 1; };
  const eat = (t: string) => { skipWs(); if (s.startsWith(t, i)) { i += t.length; return true; } return false; };
  const word = () => { skipWs(); const m = /^[A-Za-z]+(?:_\d+)?/.exec(s.slice(i)); return m ? m[0] : ''; };
  function expr(): number {
    let v = term();
    for (;;) {
      skipWs();
      if (peek() === '+') { i += 1; v += term(); } else if (peek() === '-') { i += 1; v -= term(); } else return v;
    }
  }
  function startsOperand(): boolean {
    skipWs();
    const c = peek();
    if (c === undefined) return false;
    if (/[\d(]/.test(c)) return true;
    return ['frac', 'sqrt'].includes(word());
  }
  function term(): number {
    let v = unary();
    for (;;) {
      skipWs();
      if (peek() === '*') { i += 1; v *= unary(); } else if (startsOperand()) v *= unary(); else return v;
    }
  }
  function unary(): number {
    skipWs();
    if (peek() === '-') { i += 1; return -unary(); }
    return power();
  }
  function power(): number {
    const base = atom();
    skipWs();
    if (peek() === '^') { i += 1; return base ** unary(); }
    return base;
  }
  function atom(): number {
    skipWs();
    const c = peek();
    if (c === '(') { i += 1; const v = expr(); if (!eat(')')) throw new Skip('bracket'); return v; }
    const n = /^\d+(?:\.\d+)?/.exec(s.slice(i));
    if (n) { i += n[0].length; return Number(n[0]); }
    const w = word();
    if (w === 'frac') { i += 4; if (!eat('(')) throw new Skip('frac'); const a = expr(); if (!eat(',')) throw new Skip('frac'); const b = expr(); if (!eat(')')) throw new Skip('frac'); return a / b; }
    if (w === 'sqrt') { i += 4; if (!eat('(')) throw new Skip('sqrt'); const a = expr(); if (!eat(')')) throw new Skip('sqrt'); return Math.sqrt(a); }
    throw new Skip(`unknown ${w || c}`);
  }
  const v = expr();
  skipWs();
  if (i !== s.length || !Number.isFinite(v)) throw new Skip('trailing');
  return v;
}
const tryEvaluate = (side: string): number | null => {
  try { return evaluate(side); } catch (e) { if (e instanceof Skip) return null; throw e; }
};
const LITERAL = /^-?\d+(?:\.\d+)?$/;

test('every equation on the page that ends in a number is recomputed, to the places shown', () => {
  const problems: string[] = [];
  let compared = 0;
  for (const m of decode(BODY).matchAll(/\{md?:([^}]*)\}/g)) {
    const body = m[1];
    if (/[<>]/.test(body)) continue; // an inequality, not an equation
    const sides = body.split('=').map((x) => x.trim());
    if (sides.length < 2) continue;
    const values = sides.map(tryEvaluate);
    const first = values.findIndex((v, k) => v !== null && !LITERAL.test(sides[k]));
    if (first < 0) continue;
    const ref = values[first] as number;
    sides.forEach((side, k) => {
      const v = values[k];
      if (v === null || k === first) return;
      compared += 1;
      if (LITERAL.test(side)) {
        const places = (side.split('.')[1] ?? '').length;
        const tol = places > 0 ? 0.5 * 10 ** -places + 1e-9 : Math.max(6e-4 * Math.abs(v), 1e-9);
        if (Math.abs(ref - v) > tol) problems.push(`{m:${body}}: "${side}" should be ${places > 0 ? ref.toFixed(places) : ref}`);
      } else if (Math.abs(ref - v) > 3e-4 * Math.max(1, Math.abs(ref))) problems.push(`{m:${body}}: "${side}" is ${v}, but the first side is ${ref}`);
    });
  }
  expect(compared).toBeGreaterThan(60);
  expect(problems).toEqual([]);
});

test('the calculator itself reads the shorthand the page uses', () => {
  expect(evaluate('2(3)-4')).toBe(2);
  expect(evaluate('frac(1, 2)*frac(1, 2)')).toBe(0.25);
  expect(evaluate('-16*frac(1, 8)')).toBe(-2);
  expect(evaluate('8*(-2)')).toBe(-16);
  expect(evaluate('2*(-frac(1, 2))')).toBe(-1);
  expect(() => evaluate('x^2-4')).toThrow();
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
  expect(checked).toBeGreaterThan(0);
  expect(problems).toEqual([]);
});

test('no equation holds an ellipsis or a not-equals written with an exclamation mark', () => {
  const ellipsis = new RegExp(`(\\.\\.\\.|${String.fromCharCode(0x2026)}|&hellip;|!=)`);
  const bad = [...SOURCE.matchAll(/\{md?:([^}]*)\}/g)].map((m) => m[1]).filter((t) => ellipsis.test(t));
  expect(bad).toEqual([]);
});

// ---- the facts the lessons quote, recomputed from the curves ----
test('every stationary point on the page, and its nature, is recomputed from its curve', () => {
  type SP = { f: Fn; points: [number, number, 'max' | 'min' | 'neither'][] };
  const curves: SP[] = [
    { f: C1, points: [[2, 1, 'min']] },
    { f: G3, points: [[2, -16, 'min'], [-2, 16, 'max']] },
    { f: (x) => 2 * x ** 3 - 6 * x, points: [[1, -4, 'min'], [-1, 4, 'max']] },
    { f: (x) => x ** 3 - 6 * x * x, points: [[0, 0, 'max'], [4, -32, 'min']] },
    { f: (x) => x + 4 / x, points: [[2, 4, 'min']] },
    { f: F3, points: [[1, 4, 'max'], [3, 0, 'min']] },
    { f: (x) => x ** 4 - 4 * x ** 3, points: [[0, 0, 'neither'], [3, -27, 'min']] },
    { f: (x) => x * x - 6 * x + 4, points: [[3, -5, 'min']] },
    { f: (x) => 2 * x ** 3 - 9 * x * x + 12 * x, points: [[1, 5, 'max'], [2, 4, 'min']] },
    { f: (x) => x ** 3 - 3 * x * x - 9 * x + 1, points: [[-1, 6, 'max'], [3, -26, 'min']] },
    { f: (x) => x ** 3 - 6 * x * x + 9 * x + 2, points: [[1, 6, 'max'], [3, 2, 'min']] },
    { f: (x) => x ** 3 - 3 * x * x, points: [[0, 0, 'max'], [2, -4, 'min']] },
    { f: (x) => x * x - 6 * x + 7, points: [[3, -2, 'min']] },
    { f: (x) => x ** 4, points: [[0, 0, 'min']] },
    { f: (x) => x ** 3, points: [[0, 0, 'neither']] },
    { f: (x) => x * (12 - 2 * x) ** 2, points: [[2, 128, 'max'], [6, 0, 'min']] },
    { f: (x) => x * (20 - x), points: [[10, 100, 'max']] },
  ];
  for (const { f, points } of curves) {
    for (const [x, y, nature] of points) {
      expect(Math.abs(d1(f, x)), `gradient at ${x}`).toBeLessThan(1e-3);
      expect(Math.abs(f(x) - y), `y at ${x}`).toBeLessThan(1e-9);
      // the gradient test: the sign of the gradient a little either side
      const left = d1(f, x - 0.1);
      const right = d1(f, x + 0.1);
      const byGradient = left < 0 && right > 0 ? 'min' : left > 0 && right < 0 ? 'max' : 'neither';
      expect(byGradient, `gradient test at ${x}`).toBe(nature);
      const second = d2(f, x);
      // where the second derivative is not 0 it gives the same answer as the gradient test
      if (Math.abs(second) > 1e-2) expect(second > 0 ? 'min' : 'max', `second derivative at ${x}`).toBe(nature);
    }
  }
  // the points are written on the page the way the lessons write them
  for (const s of ['(2, &minus;16)', '(&minus;2, 16)', '(1, &minus;4)', '(&minus;1, 4)', '(0, 0)', '(4, &minus;32)', '(2, 4)', '(1, 4)', '(3, 0)', '(3, &minus;27)', '(3, &minus;5)', '(&minus;1, 6)', '(1, 6)', '(3, 2)', '(2, &minus;4)']) expect(SOURCE, s).toContain(s);
  // where the second derivative is 0 the page says so: y = x^4 and y = x^3 at 0, and y = x^4 - 4x^3 at 0
  expect(d2((x) => x ** 4, 0)).toBeCloseTo(0, 4);
  expect(d2((x) => x ** 3, 0)).toBeCloseTo(0, 4);
  expect(d2((x) => x ** 4 - 4 * x ** 3, 0)).toBeCloseTo(0, 4);
  expect(d2((x) => x ** 4 - 4 * x ** 3, 3)).toBeCloseTo(36, 2);
});

test('the tangents, normals and gradients quoted in the lessons are recomputed', () => {
  // lesson 1: tangent to y = x^2 - 4x + 5 at x = 3 is y = 2x - 4, crossing the x-axis at 2; gradient 6 at x = 5, where y = 10
  expect(d1(C1, 3)).toBeCloseTo(2, 6);
  expect(C1(3)).toBe(2);
  expect(tangentLine(C1, 3)(2)).toBeCloseTo(0, 6);
  expect(d1(C1, 5)).toBeCloseTo(6, 6);
  expect(C1(5)).toBe(10);
  // lesson 1 faded: y = x^2 + 2x - 3 at x = 1
  expect(d1((x) => x * x + 2 * x - 3, 1)).toBeCloseTo(4, 6);
  // lesson 2: the normal at A has gradient -1/2 and the equation x + 2y = 7; the faded one is x + 4y = 27 at (3, 6)
  expect(3 + 2 * 2).toBe(7);
  expect(3 + 4 * 6).toBe(27);
  expect(d1((x) => x * x - 2 * x + 3, 3)).toBeCloseTo(4, 6);
  // lesson 2: the lowest point of the curve is (2, 1) and the gradient there is 0
  expect(d1(C1, 2)).toBeCloseTo(0, 6);
  // lesson 3: y = x^3 - 6x^2 + 9x rises for x < 1 and x > 3 and falls between; f' = 3(x - 1)(x - 3)
  for (const [x, sign] of [[0, 1], [0.5, 1], [2, -1], [4, 1], [-2, 1]] as [number, number][]) expect(Math.sign(d1(F3, x))).toBe(sign);
  // lesson 3 faded: f = 2x^3 - 3x^2 - 12x is decreasing between -1 and 2 only
  const f2 = (x: number) => 2 * x ** 3 - 3 * x * x - 12 * x;
  for (const [x, sign] of [[-2, 1], [-0.5, -1], [0, -1], [1.9, -1], [3, 1]] as [number, number][]) expect(Math.sign(d1(f2, x))).toBe(sign);
  expect(d1(f2, 0)).toBeCloseTo(-12, 4);
  // lesson 3: x^3 + 6x is negative at -1 and its derivative is never 0
  expect((-1) ** 3 + 6 * -1).toBe(-7);
  // lesson 5: dy/dx of x^4 and x^3 either side of 0, as the table shows; and for x^4 - 4x^3 at -1 and 1
  expect([-0.5, 0, 0.5].map((x) => 4 * x ** 3)).toEqual([-0.5, 0, 0.5]);
  expect([-0.5, 0, 0.5].map((x) => 3 * x ** 2)).toEqual([0.75, 0, 0.75]);
  expect([-1, 1].map((x) => 4 * x ** 3 - 12 * x ** 2)).toEqual([-16, -8]);
  // a maximum point is not the highest point of the curve: x^3 - 6x^2 + 9x goes above 4 for large x and below 0 for very negative x
  expect(F3(10)).toBeGreaterThan(4);
  expect(F3(-10)).toBeLessThan(0);
  // lesson 6: the box, the fence, the cost and the rectangles
  const V = (x: number) => x * (12 - 2 * x) ** 2;
  expect(V(2)).toBe(128);
  expect(V(2)).toBeGreaterThan(V(1.9));
  expect(V(2)).toBeGreaterThan(V(2.1));
  expect(Math.max(...[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 5.5].map(V))).toBe(128);
  expect(12 * 2 ** 2 - 96 * 2 + 144).toBe(0);
  expect(12 * 6 ** 2 - 96 * 6 + 144).toBe(0);
  expect(24 * 2 - 96).toBe(-48);
  expect(24 * 6 - 96).toBe(48);
  expect(32 / 4 ** 3).toBe(0.5);
  // the triangle: tangent at A meets the x-axis at 2, the normal at 7, A is (3, 2): base 5, height 2
  expect(2 * 2 - 4).toBe(0);
  expect(3 + 2 * 0).toBe(3);
  expect(7 - 2).toBe(5);
  // flip it: the minimum of x^2 + bx + c at (3, -2) gives b = -6 and c = 7; at (-1, 4) gives b = 2 and c = 5
  expect([-6, 7]).toEqual([-2 * 3, -2 - 9 + 18]);
  expect([2, 5]).toEqual([2, 4 - 1 + 2]);
  // the largest area for a given length of fence is half the length times a quarter of the length
  expect(15 * 30).toBe(450);
});

test('the table of gradients is recomputed', () => {
  const t = /<table class="data" data-table="gradient-test">([\s\S]*?)<\/table>/.exec(BODY)?.[1] ?? '';
  const rows = [...t.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1].replace(/\{m:([^}]*)\}/g, '$1').trim()));
  expect(rows[0].slice(1)).toEqual(['-0.5', '0', '0.5']);
  const xs = rows[0].slice(1).map(Number);
  expect(rows[1].slice(1).map(Number)).toEqual(xs.map((x) => 4 * x ** 3));
  expect(rows[2].slice(1).map(Number)).toEqual(xs.map((x) => 3 * x ** 2));
});

// ---- the statements the page makes in words ----
test('each Key idea states the conditions its claim needs', () => {
  const keys = [...BODY.matchAll(/<div class="key">([\s\S]*?)<\/div>/g)].map((m) => m[1]).filter((k) => k.includes('<b>Key idea:</b>'));
  expect(keys.length).toBeGreaterThanOrEqual(7);
  const find = (re: RegExp) => keys.find((k) => re.test(k)) ?? '';
  // tangent: the derivative must exist, and the equation is the point-gradient form
  const tangent = find(/is the straight line through that point with gradient/);
  expect(tangent).toMatch(/has a derivative at/);
  expect(tangent).toMatch(/y-f\(a\)=f'\(a\)\(x-a\)/);
  // normal: the tangent gradient must not be 0, and then the normal is vertical
  const normal = find(/The normal at the same point has gradient/);
  expect(normal).toMatch(/m is not 0/);
  expect(normal).toMatch(/vertical line/);
  expect(normal).toMatch(/division by 0/);
  // increasing and decreasing: positive (or negative) at EVERY point of an interval
  const inc = find(/y is increasing as x increases/);
  expect(inc).toMatch(/at every point/);
  expect(inc).toMatch(/decreasing/);
  // stationary points: every x-value, y from the curve, the tangent and the normal there
  const stat = find(/To find the stationary points/);
  expect(stat).toMatch(/every x-value/);
  expect(stat).toMatch(/only x-values/);
  expect(stat).toMatch(/horizontal line/);
  expect(stat).toMatch(/vertical line/);
  // the second derivative test: it must exist, both signs, and 0 decides nothing
  const second = find(/at a stationary point of \{m:y=f\(x\)\}, where/);
  expect(second).toMatch(/must exist/);
  expect(second).toMatch(/minimum/);
  expect(second).toMatch(/maximum/);
  expect(second).toMatch(/does not decide/);
  expect(second).toMatch(/could be a minimum, a maximum or neither/);
  // the gradient test: both changes of sign, and the same sign on both sides means neither
  const gradient = find(/go from left to right through a stationary point/);
  expect(gradient).toMatch(/negative to positive/);
  expect(gradient).toMatch(/positive to negative/);
  expect(gradient).toMatch(/same sign on both sides/);
  expect(gradient).toMatch(/neither a maximum nor a minimum/);
  // optimisation: the x-value must be allowed, and an end point must be compared
  const opt = find(/greatest or least value of a quantity Q/);
  expect(opt).toMatch(/must be allowed in the problem/);
  expect(opt).toMatch(/end point/);
  expect(opt).toMatch(/check the nature/);
  // the flip: two equations for two unknowns
  const flip = find(/stationary point at a known point/);
  expect(flip).toMatch(/Two equations are enough to find two unknown numbers/);
});

test('the page, the figures and this test are plain ASCII (other characters are written as entities or escapes)', () => {
  for (const file of [join('src', 'pages', 'courses', 'a-level', 'differentiation-applications.html'), join('src', 'book', 'alevel', 'figures', 'differentiation-applications.mjs'), join('test', 'alevel-differentiation-applications.spec.ts')]) {
    const text = readFileSync(join(ROOT, file), 'utf8');
    expect([...text].filter((ch) => ch.charCodeAt(0) > 126).length, file).toBe(0);
  }
});

test('the words the review warned about are not on the page, and the glossary terms are used for them', () => {
  const prose = decode(BODY.replace(/\{[^}]*\}/g, ' ').replace(/<[^>]+>/g, ' ')).toLowerCase();
  for (const word of ['flat spot', 'flat bit', 'flat part', 'the flat', 'hilltop', 'hump', 'dip']) expect(prose, word).not.toContain(word);
  expect(prose).not.toMatch(/\bflat\b/);
  // the page says what a stationary point is, with the glossary words, and that d2y/dx2 = 0 settles nothing, with both examples
  expect(BODY).toContain('{term:stationary-point|stationary point}');
  expect(BODY).toContain('{term:point-of-inflection|point of inflection}');
  expect(BODY).toContain('the test does not decide');
  expect(BODY).toContain('{m:y=x^4}');
  expect(BODY).toContain('{m:y=x^3}');
  // the two tests for the nature are both on the page, and the gradient test is used when the second derivative is 0
  expect(BODY).toContain('Test 1: the second derivative');
  expect(BODY).toContain('Test 2: the sign of the gradient either side');
  expect(BODY).toContain('When the second derivative is 0');
});

test('the topic is live, its words exist, and the pyramid and the glossary agree with the page', async ({ page }) => {
  const topics = readFileSync(join(ROOT, 'src', 'book', 'alevel', 'topics.mjs'), 'utf8');
  const row = topics.split('\n').find((l) => l.includes("t('differentiation-applications'"))!;
  expect(row).toContain("status: 'live'");
  const words = [...(/words: \[([^\]]*)\]/.exec(row)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  expect(words.length).toBeGreaterThanOrEqual(12);
  await page.goto(PAGE);
  expect(await page.locator('.words-strip a').count()).toBeGreaterThanOrEqual(words.length - 2);
  // a defined word is linked with its plain name, with no bracketed extra in the link text
  const texts = await page.locator('main a.term:not(.words-strip a)').allTextContents();
  expect(texts.length).toBeGreaterThan(8);
  expect(texts.filter((t) => t.includes('('))).toEqual([]);
});

// ---- headings: ids and the links that point at them ----
// The build gives each h2 and h3 an id "s-" plus its text in lower case, joined with hyphens and cut at 40 characters.
const slug = (inner: string) => `s-${inner.replace(/<[^>]+>/g, ' ').replace(/\{[^}]*\}/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`;

test('the heading ids the build makes match every in-page link, and the skip link goes to lesson 1', async ({ page }) => {
  const headings = [...SOURCE.matchAll(/<h([23])>([\s\S]*?)<\/h\1>/g)].map((m) => ({ level: Number(m[1]), id: slug(m[2]), text: m[2] }));
  const lesson1 = headings.find((h) => h.text.startsWith('1.'))!;
  expect(/<a href="#([^"]+)">Skip to the lesson<\/a>/.exec(SOURCE)?.[1]).toBe(lesson1.id);
  // a long heading is cut at 40 characters: the ids that are that long are checked in the browser below
  expect(headings.some((h) => h.id.length === 42)).toBe(true);
  await page.goto(PAGE);
  const ids = await page.evaluate(() => [...document.querySelectorAll('main h2, main h3')].map((h) => h.id));
  for (const h of headings) expect(ids, `heading "${h.text}"`).toContain(h.id);
  const broken = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href') ?? '').filter((h) => h.length > 1 && !document.getElementById(h.slice(1))));
  expect(broken).toEqual([]);
  // heading levels do not skip
  const levels = await page.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3')].map((h) => Number(h.tagName[1])));
  levels.forEach((l, k) => { if (k > 0) expect(l - levels[k - 1], `heading ${k}`).toBeLessThanOrEqual(1); });
});

// ---- figures ----
// GEOM, CURVES, LINES and POINTS are filled as each figure is drawn, so draw them all before reading them.
async function figureModule() {
  const mod = await import('../src/book/alevel/figures/differentiation-applications.mjs');
  for (const id of Object.keys(mod.FIGURES)) mod.FIGURES[id]();
  return mod;
}
const P0 = 'differentiation-applications-';
const sq = (x: number) => x * x;
const EXPECTED: Record<string, Fn[]> = {
  'tangent-line': [C1],
  'tangent-method': [],
  'q-tangent': [(x) => x * x - 2 * x + 3],
  'tangent-normal': [C1],
  'normal-vertical': [C1],
  'q-normal': [sq],
  'increasing-decreasing': [F3, F3, F3],
  'sign-chart': [],
  'q-decreasing': [G3],
  'stationary-cubic': [G3],
  'nature-cubic': [F3],
  'second-derivative-zero': [(x) => x ** 4, (x) => x ** 3],
  'gradient-test-min': [C1],
  'optimise-rectangle': [(x) => x * (20 - x)],
  'q-box-net': [],
  'flip-minimum': [(x) => x * x - 6 * x + 7],
};
// the straight lines of each figure, in the order they are drawn: y = m x + c, or the vertical line x = a
const EXPECTED_LINES: Record<string, ({ m: number; c: number } | { x: number })[]> = {
  'tangent-line': [{ m: 2, c: -4 }, { m: 0, c: 2 }, { x: 4 }],
  'tangent-normal': [{ m: 2, c: -4 }, { m: -0.5, c: 3.5 }],
  'normal-vertical': [{ m: 0, c: 1 }, { x: 2 }],
  'q-normal': [{ m: -0.25, c: 4.5 }],
  'stationary-cubic': [{ m: 0, c: 16 }, { m: 0, c: -16 }],
  'gradient-test-min': [{ m: -2, c: 4 }, { m: 0, c: 1 }, { m: 2, c: -4 }],
  'optimise-rectangle': [{ m: 0, c: 100 }, { x: 10 }],
  'flip-minimum': [{ m: 0, c: -2 }],
};
const RAW = new Set(['tangent-method', 'sign-chart', 'q-box-net']); // drawn from boxes and numbers, not from a graph
// the true minus sign and the zero-width space the figure library writes, spelled by code so this file stays ASCII
const MINUS = String.fromCharCode(0x2212);
const ZW = String.fromCharCode(0x200b);
const minusText = (s: string) => s.split(MINUS).join('-').split(ZW).join('');
const labelsOf = (svg: string) => [...svg.matchAll(/<text [^>]*>([\s\S]*?)<\/text>/g)].map((m) => minusText(decode(m[1].replace(/<[^>]+>/g, ''))));
const descOf = (svg: string) => /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg)?.[1] ?? '';

test('the figures are the ones the page uses, and each curve is drawn from its equation', async () => {
  const { FIGURES, GEOM, CURVES } = await figureModule();
  const ids = Object.keys(FIGURES);
  expect(ids.length).toBeGreaterThanOrEqual(12);
  expect(ids.length).toBeLessThanOrEqual(20);
  expect(ids.map((i) => i.replace(P0, '')).sort()).toEqual(Object.keys(EXPECTED).sort());
  const used = [...SOURCE.matchAll(/\{fig:([a-z0-9-]+)\}/g)].map((m) => m[1]);
  expect([...used].sort()).toEqual([...ids].sort());
  for (const id of ids) {
    const name = id.replace(P0, '');
    const svg: string = FIGURES[id]();
    const g = GEOM[id];
    const toX = (px: number) => g.xmin + ((px - g.left) / (g.width - g.left - g.right)) * (g.xmax - g.xmin);
    const toY = (py: number) => g.ymax - ((py - g.top) / (g.height - g.top - g.bottom)) * (g.ymax - g.ymin);
    expect(svg, id).toContain(`viewBox="0 0 ${g.width} ${g.height}"`);
    const paths = [...svg.matchAll(/<path class="(curve(?:-b|-c)?)" d="([^"]+)"/g)];
    expect(paths.length, id).toBe(EXPECTED[name].length);
    expect(CURVES[id].length, id).toBe(EXPECTED[name].length);
    paths.forEach((p, k) => {
      expect(p[1], `${id} curve ${k}`).toBe(CURVES[id][k].cls);
      const pts = [...p[2].matchAll(/[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
      expect(pts.length, `${id} curve ${k} has points`).toBeGreaterThan(20);
      const tolerance = 0.012 * (g.ymax - g.ymin);
      for (const [px, py] of pts) {
        const x = toX(px);
        expect(x, `${id} curve ${k} starts at ${CURVES[id][k].from ?? g.xmin}`).toBeGreaterThanOrEqual((CURVES[id][k].from ?? g.xmin) - 0.02);
        if (CURVES[id][k].to !== undefined) expect(x, `${id} curve ${k} ends at ${CURVES[id][k].to}`).toBeLessThanOrEqual(CURVES[id][k].to + 0.02);
        expect(Math.abs(toY(py) - EXPECTED[name][k](x)), `${id} curve ${k} at x=${x.toFixed(2)}`).toBeLessThan(tolerance);
      }
    });
  }
});

test('each straight line is drawn from its equation, each tangent touches its curve with the same gradient, and each normal is at right angles', async () => {
  const { FIGURES, GEOM, LINES, CURVES, POINTS } = await figureModule();
  for (const id of Object.keys(FIGURES)) {
    const name = id.replace(P0, '');
    const svg: string = FIGURES[id]();
    const g = GEOM[id];
    const toX = (px: number) => g.xmin + ((px - g.left) / (g.width - g.left - g.right)) * (g.xmax - g.xmin);
    const toY = (py: number) => g.ymax - ((py - g.top) / (g.height - g.top - g.bottom)) * (g.ymax - g.ymin);
    const drawn = [...svg.matchAll(/<line class="(tangent|line|guide)" x1="(-?[\d.]+)" y1="(-?[\d.]+)" x2="(-?[\d.]+)" y2="(-?[\d.]+)"/g)].map((m) => ({ cls: m[1], a: [toX(Number(m[2])), toY(Number(m[3]))], b: [toX(Number(m[4])), toY(Number(m[5]))] }));
    const want = EXPECTED_LINES[name] ?? [];
    expect(drawn.length, `${id}: lines`).toBe(want.length);
    expect(LINES[id].length, `${id}: registered lines`).toBe(want.length);
    drawn.forEach((l, k) => {
      const w = want[k];
      const tol = 0.012 * (g.ymax - g.ymin);
      for (const [x, y] of [l.a, l.b]) {
        if ('x' in w) expect(Math.abs(x - w.x), `${id} line ${k}`).toBeLessThan(0.02);
        else expect(Math.abs(y - (w.m * x + w.c)), `${id} line ${k} at x=${x.toFixed(2)}`).toBeLessThan(tol);
      }
      const reg = LINES[id][k];
      expect(l.cls, `${id} line ${k} class`).toBe(reg.cls);
    });
    // a tangent line touches the first curve at one point, with the curve's own gradient there
    drawn.forEach((l, k) => {
      if (l.cls !== 'tangent') return;
      const w = want[k] as { m: number; c: number };
      const f = EXPECTED[name][0];
      let best = { x: 0, gap: Infinity };
      for (let i = 0; i <= 4000; i += 1) {
        const x = Math.min(l.a[0], l.b[0]) + ((Math.abs(l.b[0] - l.a[0])) * i) / 4000;
        const gap = Math.abs(f(x) - (w.m * x + w.c));
        if (gap < best.gap) best = { x, gap };
      }
      expect(best.gap, `${id}: tangent ${k} meets the curve`).toBeLessThan(1e-3);
      expect(Math.abs(d1(f, best.x) - w.m), `${id}: tangent ${k} has the curve's gradient`).toBeLessThan(2e-2);
    });
  }
  // the normals: through the marked point, at right angles to the curve's tangent there
  const normal = (id: string, m: number, c: number, at: number) => {
    const f = EXPECTED[id.replace(P0, '')][0];
    expect(Math.abs(f(at) - (m * at + c)), `${id}: the normal passes through the point`).toBeLessThan(1e-9);
    expect(d1(f, at) * m, `${id}: normal times tangent gradients`).toBeCloseTo(-1, 6);
  };
  normal(`${P0}tangent-normal`, -0.5, 3.5, 3);
  normal(`${P0}q-normal`, -0.25, 4.5, 2);
  // the vertical normal at the lowest point has the x-coordinate of that point, where the gradient is 0
  expect(d1(C1, 2)).toBeCloseTo(0, 6);
  expect(POINTS[`${P0}normal-vertical`][0]).toMatchObject({ x: 2, y: 1 });
  expect(CURVES[`${P0}q-normal`][0].fn(2)).toBe(4);
  // Q (6, 3) is on the line through P
  expect(-0.25 * 6 + 4.5).toBe(3);
});

test('each marked point lies on its curve and carries its own coordinates, and the description states every one', async () => {
  const { FIGURES, GEOM, POINTS } = await figureModule();
  let labels = 0;
  for (const id of Object.keys(FIGURES)) {
    const name = id.replace(P0, '');
    if (RAW.has(name)) { expect(POINTS[id].length, id).toBe(0); continue; }
    const svg: string = FIGURES[id]();
    const g = GEOM[id];
    const toX = (px: number) => g.xmin + ((px - g.left) / (g.width - g.left - g.right)) * (g.xmax - g.xmin);
    const toY = (py: number) => g.ymax - ((py - g.top) / (g.height - g.top - g.bottom)) * (g.ymax - g.ymin);
    const circles = [...svg.matchAll(/<circle class="pt(?:-open)?" cx="(-?[\d.]+)" cy="(-?[\d.]+)"/g)].map((m) => [toX(Number(m[1])), toY(Number(m[2]))]);
    expect(circles.length, id).toBe(POINTS[id].length);
    const desc = descOf(svg);
    const shown = labelsOf(svg);
    POINTS[id].forEach((pt: { x: number; y: number; on: number | null; label: string }, k: number) => {
      expect(Math.abs(circles[k][0] - pt.x), `${id} point ${k} x`).toBeLessThan(0.02);
      expect(Math.abs(circles[k][1] - pt.y), `${id} point ${k} y`).toBeLessThan(0.02 * (g.ymax - g.ymin));
      if (pt.on !== null) expect(Math.abs(EXPECTED[name][pt.on](pt.x) - pt.y), `${id} point ${k} lies on its curve`).toBeLessThan(1e-9);
      // the description names every given point in words, with "minus" for a negative number
      const spoken = `(${String(pt.x).replace('-', 'minus ')}, ${String(pt.y).replace('-', 'minus ')})`;
      expect(desc, `${id}: description names ${spoken}`).toContain(spoken);
      if (pt.label === '') return;
      labels += 1;
      const m = /^(?:[A-Z] )?\((-?[\d.]+), (-?[\d.]+)\)$/.exec(pt.label);
      expect(m, `${id}: label ${pt.label} is a coordinate pair`).not.toBeNull();
      expect(shown, `${id}: label ${pt.label} is drawn`).toContain(pt.label);
      expect(Number(m![1]), `${id}: label ${pt.label} x`).toBe(pt.x);
      expect(Number(m![2]), `${id}: label ${pt.label} y`).toBe(pt.y);
    });
  }
  expect(labels).toBeGreaterThan(15);
});

test('the labels that name a value are right', async () => {
  const { FIGURES, POINTS } = await figureModule();
  // the cubic of lessons 3 and 5: maximum (1, 4), minimum (3, 0)
  expect(POINTS[`${P0}nature-cubic`].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[1, 4], [3, 0]]);
  expect(labelsOf(FIGURES[`${P0}nature-cubic`]())).toEqual(expect.arrayContaining(['maximum point', 'minimum point']));
  expect(POINTS[`${P0}increasing-decreasing`].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[1, 4], [3, 0]]);
  // y = x^3 - 12x: (-2, 16) and (2, -16)
  expect(POINTS[`${P0}stationary-cubic`].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[-2, 16], [2, -16]]);
  // the rectangle: A = x(20 - x) peaks at (10, 100)
  expect(POINTS[`${P0}optimise-rectangle`].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[10, 100]]);
  // the three tangents: gradients -2, 0 and 2 at x = 1, 2 and 3 on x^2 - 4x + 5, labelled m = ...
  const labels = labelsOf(FIGURES[`${P0}gradient-test-min`]());
  expect(labels).toEqual(expect.arrayContaining(['m = -2', 'm = 0', 'm = 2']));
  expect([1, 2, 3].map((x) => Math.round(d1(C1, x)))).toEqual([-2, 0, 2]);
  expect(POINTS[`${P0}gradient-test-min`].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[1, 2], [2, 1], [3, 2]]);
  // the question figures show only the points the question gives
  expect(POINTS[`${P0}q-tangent`].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[3, 6]]);
  expect(POINTS[`${P0}q-normal`].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[2, 4], [6, 3]]);
  expect(POINTS[`${P0}flip-minimum`].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[3, -2], [0, 7]]);
  // the sign chart marks 1 and 3 where the gradient of the cubic is 0, and says which parts are increasing
  const chart: string = FIGURES[`${P0}sign-chart`]();
  expect((chart.match(/<circle class="pt"/g) ?? []).length).toBe(2);
  expect(labelsOf(chart)).toEqual(expect.arrayContaining(['1', '3', 'dy/dx > 0', 'dy/dx < 0', 'increasing', 'decreasing']));
  expect(descOf(chart)).toContain('1 and 3');
  expect(d1(F3, 1)).toBeCloseTo(0, 6);
  expect(d1(F3, 3)).toBeCloseTo(0, 6);
  // the box net: a 12 cm sheet and a corner square of side x
  expect(labelsOf(FIGURES[`${P0}q-box-net`]())).toEqual(expect.arrayContaining(['12 cm', 'x', 'base']));
});

test('a question figure describes the picture and never gives the answer away', async () => {
  const { FIGURES } = await figureModule();
  const banned: Record<string, RegExp> = {
    'q-tangent': /answer|solution|gradient|slope|tangent|4x|y = 4/i,
    'q-normal': /answer|solution|gradient|slope|tangent|normal|perpendicular|right angle/i,
    'q-decreasing': /answer|solution|decreas|increas|minimum|maximum|turning|stationary|\(minus 2|\(2, minus/i,
    'q-box-net': /answer|solution|volume|maximum|128|x = 2|x equals 2/i,
  };
  const ids = Object.keys(FIGURES).filter((id) => id.startsWith(`${P0}q-`));
  expect(ids.map((i) => i.replace(P0, '')).sort()).toEqual(Object.keys(banned).sort());
  for (const id of ids) {
    const svg: string = FIGURES[id]();
    const title = /<title[^>]*>([\s\S]*?)<\/title>/.exec(svg)?.[1] ?? '';
    // the numbers the question gives are allowed in the description; the words that name the answer are not
    for (const words of [descOf(svg), title, labelsOf(svg).join(' ')]) expect(words, id).not.toMatch(banned[id.replace(P0, '')]);
  }
  // each question figure sits straight after its question text in the page
  const qs = SOURCE.split(/(?=<div class="q")/).filter((b) => /\{fig:differentiation-applications-q-/.test(b.split('<ol class="ladder">')[0]));
  expect(qs.length).toBe(4);
  for (const q of qs) expect(/<\/p>\s*<figure class="qfig-lg">\{fig:differentiation-applications-q-/.test(q), 'figure straight after qtext').toBe(true);
});

test('a description that says dotted or dashed has such an element in the picture', async () => {
  const { FIGURES } = await figureModule();
  for (const id of Object.keys(FIGURES)) {
    const svg: string = FIGURES[id]();
    const desc = descOf(svg);
    if (/dotted/i.test(desc)) expect(svg, id).toMatch(/class="curve-c"/);
    if (/dashed/i.test(desc)) expect(svg, id).toMatch(/class="(?:curve-b|guide)"/);
  }
});

// Each figure's labels, measured in the browser on a phone and on a desktop.
async function geometry() {
  const { FIGURES, GEOM, POINTS } = await figureModule();
  const out: Record<string, { title: string; points: { label: string; px: number; py: number }[] }> = {};
  for (const id of Object.keys(FIGURES)) {
    const svg: string = FIGURES[id]();
    const g = GEOM[id];
    out[id] = {
      title: /<title[^>]*>([\s\S]*?)<\/title>/.exec(svg)?.[1] ?? '',
      points: POINTS[id].filter((pt: { label: string }) => pt.label !== '').map((pt: { x: number; y: number; label: string }) => ({
        label: pt.label,
        px: g.left + ((pt.x - g.xmin) / (g.xmax - g.xmin)) * (g.width - g.left - g.right),
        py: g.top + (g.height - g.top - g.bottom) * (1 - (pt.y - g.ymin) / (g.ymax - g.ymin)),
      })),
    };
  }
  return out;
}

for (const width of [320, 1100]) {
  test(`figures at ${width}px: text inside the picture, labels at least 12px, clear of each other and of every line, each point's label nearest its own point`, async ({ page }) => {
    const geo = await geometry();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(PAGE);
    const problems = await page.evaluate(({ geo, width, minus, zw }) => {
      const out: string[] = [];
      const gap = (a: DOMRect, b: { x: number; y: number; width: number; height: number }) => {
        const dx = Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width), 0);
        const dy = Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height), 0);
        return Math.hypot(dx, dy);
      };
      const svgs = [...document.querySelectorAll('main svg.graph-svg')] as SVGSVGElement[];
      const byTitle = new Map(svgs.map((s) => [s.querySelector('title')?.textContent ?? '', s]));
      for (const [id, info] of Object.entries(geo) as [string, { title: string; points: { label: string; px: number; py: number }[] }][]) {
        const svg = byTitle.get(info.title);
        if (!svg) { out.push(`${id}: figure not on the page`); continue; }
        const vb = svg.viewBox.baseVal;
        const scale = svg.getBoundingClientRect().width / vb.width;
        const clean = (s: string | null) => (s ?? '').split(zw).join('').split(minus).join('-').trim();
        const texts = [...svg.querySelectorAll('text')].filter((t) => clean(t.textContent));
        const boxes = texts.map((t) => ({ t, name: clean(t.textContent), b: t.getBBox() }));
        // text inside the picture, and big enough to read
        for (const { t, name, b } of boxes) {
          if (b.x < 0 || b.y < 0 || b.x + b.width > vb.width || b.y + b.height > vb.height) out.push(`${id}: "${name}" is outside the picture`);
          const size = parseFloat(getComputedStyle(t).fontSize) * scale;
          if (width === 320 && size < 12) out.push(`${id}: "${name}" is ${size.toFixed(1)}px at 320px`);
        }
        // labels clear of each other
        for (let i = 0; i < boxes.length; i += 1) {
          for (let j = i + 1; j < boxes.length; j += 1) {
            const a = boxes[i].b;
            const b = boxes[j].b;
            const d = Math.hypot(Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width), 0), Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height), 0));
            if (d < 4) out.push(`${id}: "${boxes[i].name}" and "${boxes[j].name}" are ${d.toFixed(1)} apart`);
          }
        }
        // labels clear of every curve, tangent, guide and axis (sampled along each)
        const samples: { x: number; y: number; what: string }[] = [];
        for (const p of svg.querySelectorAll('path')) {
          const len = (p as SVGPathElement).getTotalLength();
          for (let d = 0; d <= len; d += 2) { const pt = (p as SVGPathElement).getPointAtLength(d); samples.push({ x: pt.x, y: pt.y, what: p.getAttribute('class') ?? 'path' }); }
        }
        for (const l of svg.querySelectorAll('line')) {
          const x1 = Number(l.getAttribute('x1')); const y1 = Number(l.getAttribute('y1')); const x2 = Number(l.getAttribute('x2')); const y2 = Number(l.getAttribute('y2'));
          const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2));
          for (let k = 0; k <= n; k += 1) samples.push({ x: x1 + ((x2 - x1) * k) / n, y: y1 + ((y2 - y1) * k) / n, what: l.getAttribute('class') ?? 'line' });
        }
        for (const pl of svg.querySelectorAll('polyline')) {
          const pts = (pl.getAttribute('points') ?? '').trim().split(/\s+/).map((s) => s.split(',').map(Number));
          for (const [x, y] of pts) samples.push({ x, y, what: 'right-angle mark' });
        }
        for (const { name, b } of boxes) {
          const near = samples.find((s) => s.x > b.x - 4 && s.x < b.x + b.width + 4 && s.y > b.y - 4 && s.y < b.y + b.height + 4);
          if (near) out.push(`${id}: "${name}" is within 4 of a ${near.what}`);
        }
        // each point label is nearer to its own point than to any other, and clear of every point
        const circles = info.points;
        circles.forEach((own, k) => {
          const box = boxes.find((x) => x.name === own.label);
          if (!box) { out.push(`${id}: no label ${own.label}`); return; }
          const dists = circles.map((c) => gap(box.b, { x: c.px - 7, y: c.py - 7, width: 14, height: 14 }));
          dists.forEach((d, j) => { if (j !== k && d <= dists[k]) out.push(`${id}: "${own.label}" is as near to another point as to its own`); if (d < 4) out.push(`${id}: "${own.label}" touches a point`); });
          if (dists[k] > 70) out.push(`${id}: "${own.label}" is ${dists[k].toFixed(0)} from its point`);
        });
      }
      return out;
    }, { geo, width, minus: MINUS, zw: ZW });
    expect(problems).toEqual([]);
  });
}
