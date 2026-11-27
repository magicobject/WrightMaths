import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Exponential modelling page that a general test cannot make:
//  - every typed answer is RECOMPUTED here, to the rounding the question states,
//  - every wrong-answer value is recomputed from the slip its message names,
//  - EVERY equation on the page that ends in a number is evaluated by a small calculator below and compared with the
//    number shown, to the places shown (so no figure in the working can be a typing slip),
//  - the numbers in the tables are recomputed, including the large-t table that backs the "large t" claims,
//  - every figure's curves and marked points are compared with the equation they claim to show, and its labels are
//    checked in a browser: inside the picture, at least 12px on a phone, clear of each other and of every line, and
//    each point's label nearer to its own point than to any other.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'exp-modelling.html'), 'utf8');
const BODY = SOURCE.replace(/<!--[\s\S]*?-->/g, '');
const GLOSSARY = readFileSync(join(ROOT, 'src', 'book', 'alevel', 'glossary', 'exponentials.mjs'), 'utf8');

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', hellip: '...', rsquo: "'", ldquo: '"', rdquo: '"', harr: '<->' };
const decode = (t: string) => t.replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);

// ---- the maths, written independently of the figure code ----
const ln = Math.log;
const log = Math.log10;
const E = Math.E;
const sf3 = (x: number) => Number(x.toPrecision(3)); // true rounding to 3 significant figures
const exact = (x: number) => x;
const whole = (x: number) => Math.round(x);

type Slip = [string, number];
type Case = { find: string; key: number; round: (x: number) => number; wrongs: Slip[] };
const C = (find: string, key: number, round: (x: number) => number, wrongs: Slip[] = []): Case => ({ find, key, round, wrongs });

const CASES: Case[] = [
  // warm-up and recap
  C('passes through {m:(1, 3)} and {m:(3, 11)}', (11 - 3) / (3 - 1), exact, [['3.5', (11 + 3) / (3 + 1)], ['0.25', (3 - 1) / (11 - 3)], ['8', 11 - 3]]),
  C('Solve {m:2^x=20}', ln(20) / ln(2), sf3, [['10', 20 / 2], ['1.5', sf3(ln(20) / 2)]]),
  C('{m:log_10 200-log_10 2}', log(200 / 2), exact, [['100', 200 / 2], ['2.3', sf3(log(200 - 2))]]),
  C('gradient 3 and passes through {m:(0, -2)}', 3 * 4 - 2, exact, [['14', 3 * 4 + 2], ['12', 3 * 4]]),
  C('Use your calculator to find {m:1.05^10}', 1.05 ** 10, sf3, [['10.5', 1.05 * 10], ['1.62', Math.floor(1.05 ** 10 * 100) / 100], ['0.5', 0.05 * 10]]),
  // 1 growth and decay
  C('{m:N=250*1.2^t}', 250 * 1.2 ** 3, exact, [['900', 250 * 1.2 * 3], ['1.73', sf3(1.2 ** 3)]]),
  C('Write down the growth factor b', 1 - 12 / 100, exact, [['0.12', 12 / 100], ['1.12', 1 + 12 / 100]]),
  C('When {m:t=2}, {m:P=90}. Find A', 90 / 1.5 ** 2, exact, [['60', 90 / 1.5], ['135', 90 * 1.5], ['202.5', 90 * 1.5 ** 2]]),
  C('{m:N=500*0.8^t}', 500 * 0.8 ** 40, sf3, [['0.000133', sf3(0.8 ** 40)], ['0', 0]]),
  // 2 the model with e
  C('{m:P=40 e^(0.25t)}', 40 * Math.exp(0.25 * 6), sf3, [['60', 40 * 1.5], ['4.48', sf3(Math.exp(1.5))]]),
  C('{m:y=A*2^t}. Written as', ln(2), sf3, [['2', 2], ['7.39', sf3(E ** 2)], ['0.301', sf3(log(2))]]),
  C('{m:P=12 e^(k t)}. When {m:t=3}, {m:P=60}', ln(60 / 12) / 3, sf3, [['1.61', sf3(ln(5))], ['1.36', sf3(ln(60) / 3)]]),
  C('{m:P=150 e^(-0.2t)}. Find the time', ln(150 / 50) / 0.2, sf3, [['-19.6', sf3(ln(50) / -0.2)], ['-5.49', -ln(3) / 0.2]]),
  C('{m:P=12+40 e^(-0.1t)}', 12, exact, [['52', 12 + 40], ['40', 40], ['0', 0]]),
  // 3 y = a x^n
  C('{m:y=5 x^4}. The graph of', 4, exact, [['5', 5], ['0.699', sf3(log(5))]]),
  C('{m:y=200 x^(0.5)}', log(200), sf3, [['200', 200], ['5.3', sf3(ln(200))], ['0.5', 0.5]]),
  C('gradient 3 and intercept 0.5', 10 ** 0.5, sf3, [['0.5', 0.5], ['1.65', sf3(E ** 0.5)]]),
  C('through {m:(0, 1.5)} and {m:(2, 4.5)}', (4.5 - 1.5) / (2 - 0), exact, [['3', 4.5 - 1.5], ['0.667', sf3((2 - 0) / (4.5 - 1.5))]]),
  C('{m:ln y=2 ln x+1.2}', E ** 1.2, sf3, [['1.2', 1.2], ['2.4', 2 * 1.2]]),
  // 4 y = k b^x
  C('{m:y=7*1.5^x}', log(1.5), sf3, [['1.5', 1.5], ['0.405', sf3(ln(1.5))], ['0.845', sf3(log(7))]]),
  C('{m:ln y=0.4x+1.3}', E ** 1.3, sf3, [['1.3', 1.3], ['20', sf3(10 ** 1.3)]]),
  C('through {m:(0, 1.2)} and {m:(4, 2.8)}', 10 ** ((2.8 - 1.2) / 4), sf3, [['0.4', 0.4], ['1.6', 2.8 - 1.2]]),
  C('passes through {m:(2, 20)} and {m:(4, 80)}. Find b', Math.sqrt(80 / 20), exact, [['4', 80 / 20], ['30', (80 - 20) / (4 - 2)]]),
  C('passes through {m:(2, 20)} and {m:(4, 80)}. Find k', 20 / 2 ** 2, exact, [['10', 20 / 2], ['40', 20 * 2]]),
  // 5 the gradient of e^(kx)
  C('{m:y=e^(5x)} at the point where {m:x=0}', 5 * Math.exp(0), exact, [['1', Math.exp(0)], ['148', sf3(E ** 5)]]),
  C('{m:y=e^(2x)} at the point where {m:x=1}', 2 * E ** 2, sf3, [['7.39', sf3(E ** 2)], ['5.44', sf3(2 * E)]]),
  C('{m:y=30 e^(0.1x)}', 30 * 0.1 * Math.exp(0.5), sf3, [['49.5', sf3(30 * Math.exp(0.5))], ['1.65', sf3(Math.exp(0.5))], ['3', 30 * 0.1]]),
  C('{m:y=6 e^(-0.5x)}', 6 * -0.5 * Math.exp(-1), sf3, [['1.1', sf3(3 / E)], ['-0.184', sf3(-0.5 / E)]]),
  C('The gradient of the curve at that point is 6. Find k', 6 / 2, exact, [['6', 6], ['12', 6 * 2]]),
  // 6 assumptions and refining
  C('The habitat holds at most 5000', ln(5000 / 300) / 0.1, sf3, [['85.2', sf3(ln(5000) / 0.1)], ['2.81', sf3(ln(5000 / 300))]]),
  C('{m:T=15+65 e^(-0.2t)}', 15 + 65 * Math.exp(-1), sf3, [['80', 15 + 65], ['23.9', sf3(65 * Math.exp(-1))]]),
  C('Find the time t when {m:T=25}', ln(60 / 5 /* e^(-0.1t) = 5/60, so t = 10 ln 12 */) * 10, sf3, [['2.48', sf3(ln(12))], ['8.75', sf3(10 * ln(60 / 25))]]),
  // flip it
  C('{m:ln y=0.5x+1.4}. Find y', Math.exp(0.5 * 4 + 1.4), sf3, [['3.4', 0.5 * 4 + 1.4], ['7.39', sf3(E ** (0.5 * 4))]]),
  C('{m:log y=3 log x+2}', 10 ** (3 * log(10) + 2), exact, [['5', 3 * 1 + 2], ['1000', 10 ** 3]]),
  C('gradient 0.25 and intercept 2.3', E ** 2.3, sf3, [['2.3', 2.3], ['200', sf3(10 ** 2.3)]]),
  // mixed review
  C('{m:N=2000*0.95^t}', 2000 * 0.95 ** 10, whole, [['19000', 2000 * 0.95 * 10], ['1198', Math.ceil(2000 * 0.95 ** 10)]]),
  C('{m:P=8 e^(k t)}', ln(24 / 8) / 2, sf3, [['1.1', sf3(ln(3))], ['1.59', sf3(ln(24) / 2)]]),
  C('{m:y=9*0.5^x}', log(0.5), sf3, [['0.301', 0.301], ['-0.693', sf3(ln(0.5))], ['0.5', 0.5]]),
  C('through {m:(1, 5)} and {m:(3, 9)}', E ** (5 - ((9 - 5) / (3 - 1)) * 1), sf3, [['3', 3], ['148', sf3(E ** 5)]]),
  C('{m:y=4 e^(0.25x)} at', 4 * 0.25 * Math.exp(0.25 * 4), sf3, [['1', 4 * 0.25], ['10.9', sf3(4 * E)]]),
  // exam style
  C('When {m:t=0}, {m:P=200}', ln(500 / 200) / 5, sf3, [['0.916', sf3(ln(2.5))], ['1.24', sf3(ln(500) / 5)]]),
  C('through {m:(0, 0.6)} and {m:(2, 2.4)}', 10 ** 0.6, sf3, [['0.6', 0.6], ['1.82', sf3(E ** 0.6)]]),
  C('passes through {m:(2, 36)} and {m:(5, 972)}', 36 / (972 / 36) ** (2 / 3), exact, [['12', 36 / 3], ['1.33', sf3(36 / 27)]]),
  C('{m:T=18+62 e^(-k t)}', ln(62 / (40 - 18)) / 10, sf3, [['0.0693', sf3(ln(2) / 10)], ['-0.104', -ln(62 / 22) / 10]]),
  C('has gradient 60 at the point P', ln(60 / 15) / 3, sf3, [['1.39', sf3(ln(4))], ['0.828', sf3(ln(12) / 3)]]),
];

type Q = { raw: string; text: string; answers: string[]; wrongs: string[]; mode: string; block: string; type: string; hints: string };
function questions(): Q[] {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const raw = /<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongs = [...(/<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '').matchAll(/data-if="([^"]*)"/g)].flatMap((m) => decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean));
    const mode = /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? '';
    const hints = /<ol class="ladder">([\s\S]*?)<\/ol>/.exec(block)?.[1] ?? '';
    return { raw, text: decode(raw), answers, wrongs, mode, block, type: /data-type="([^"]*)"/.exec(attrs)?.[1] ?? '', hints };
  });
}
// a typed answer: a number, a fraction like 3/4, or a power of ten like 10^5
const num = (t: string) => {
  const p = /^(\d+)\^(\d+)$/.exec(t);
  if (p) return Number(p[1]) ** Number(p[2]);
  return t.includes('/') ? t.split('/').map(Number).reduce((a, b) => a / b) : Number(t);
};
const same = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));

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

test('every typed numeric answer is recomputed to its stated rounding, and every slip value is recomputed from its message', () => {
  const qs = questions();
  const problems: string[] = [];
  for (const c of CASES) {
    const hits = qs.filter((q) => q.raw.includes(c.find));
    if (hits.length !== 1) { problems.push(`"${c.find}" matches ${hits.length} questions`); continue; }
    const q = hits[0];
    const want = c.round(c.key);
    if (q.answers.length === 0) problems.push(`"${c.find}": no answer`);
    for (const a of q.answers) if (!same(num(a), want)) problems.push(`"${c.find}": the page accepts ${a}, recomputed ${want}`);
    // every wrong-answer entry on the question is one of the listed slips, so no value is left untied
    const listed = c.wrongs.map(([text]) => num(text));
    for (const w of q.wrongs) if (!listed.some((v) => same(v, num(w)))) problems.push(`"${c.find}": wrong-answer value ${w} is not tied to a slip in this test`);
    for (const [text, slip] of c.wrongs) {
      if (!q.wrongs.some((w) => same(num(w), num(text)))) problems.push(`"${c.find}": no wrong-answer entry for ${text}`);
      if (!same(num(text), slip) && !same(num(text), sf3(slip))) problems.push(`"${c.find}": ${text} is not what its slip gives (${slip})`);
      if (same(num(text), want)) problems.push(`"${c.find}": the slip value ${text} is the right answer`);
    }
  }
  expect(CASES.length).toBeGreaterThan(40);
  expect(problems).toEqual([]);
});

test('every typed numeric question on the page has a recomputed case, and none is typed in the exact mode', () => {
  const qs = questions();
  const typed = qs.filter((q) => q.type !== 'mc');
  expect(typed.filter((q) => q.mode !== 'value').map((q) => q.text.slice(0, 80))).toEqual([]);
  const uncovered = typed.filter((q) => !CASES.some((c) => q.raw.includes(c.find))).map((q) => q.text.slice(0, 80));
  expect(uncovered).toEqual([]);
  // a power of ten may be typed as 10^5: the page lists it with the plain number, and both mean 100000
  const hundredThousand = qs.find((q) => q.raw.includes('{m:log y=3 log x+2}'));
  expect(hundredThousand?.answers).toEqual(['100000', '10^5']);
});

test('a hint never states the answer', () => {
  const problems: string[] = [];
  for (const c of CASES) {
    const q = questions().find((x) => x.raw.includes(c.find));
    if (!q) continue;
    const key = c.round(c.key);
    const text = decode(q.hints.replace(/\{m:([^}]*)\}/g, ' $1 ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
    const small = Number.isInteger(key) && Math.abs(key) <= 12;
    if (small) {
      // a small whole number turns up by chance in a hint: only "= 4", "is 4" or "equals 4" is giving it away
      if (new RegExp(`(?:=|\\bis|\\bequals)\\s*${key}(?![\\d.])`).test(text)) problems.push(`"${c.find}": a hint says ${key}`);
    } else {
      for (const m of text.matchAll(/-?\d+(?:\.\d+)?/g)) if (same(Number(m[0]), key)) problems.push(`"${c.find}": a hint contains ${m[0]}`);
    }
  }
  expect(problems).toEqual([]);
});

test('no accepted answer is an ambiguous form, and every accepted answer list holds one value', () => {
  for (const q of questions()) {
    for (const a of q.answers) expect(a, q.text.slice(0, 60)).not.toMatch(/(?:ln|log)\s*\d+\s*\//); // ln4/3 could mean ln(4/3) or (ln 4)/3
    if (q.type === 'mc') continue;
    const values = q.answers.map(num);
    expect(new Set(values.map((v) => v.toPrecision(12))).size, q.text.slice(0, 60)).toBe(1);
  }
});

// ---- a small calculator for the maths written on the page ----
// It reads {m:...} and {md:...} bodies, splits each at its equals signs, evaluates every side that has only numbers
// and the functions frac, ln, log, e, sqrt, and compares each number written with the value computed.
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
    const w = word();
    return ['frac', 'ln', 'log', 'log_10', 'e', 'sqrt'].includes(w);
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
    if (w === 'e') { i += 1; return E; }
    if (w === 'frac') { i += 4; if (!eat('(')) throw new Skip('frac'); const a = expr(); if (!eat(',')) throw new Skip('frac'); const b = expr(); if (!eat(')')) throw new Skip('frac'); return a / b; }
    if (w === 'sqrt') { i += 4; if (!eat('(')) throw new Skip('sqrt'); const a = expr(); if (!eat(')')) throw new Skip('sqrt'); return Math.sqrt(a); }
    if (w === 'ln' || w === 'log' || w === 'log_10') { i += w.length; const a = power(); return w === 'ln' ? Math.log(a) : Math.log10(a); }
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
  const seen: string[] = [];
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
        else seen.push(side);
      } else if (Math.abs(ref - v) > 3e-4 * Math.max(1, Math.abs(ref))) problems.push(`{m:${body}}: "${side}" is ${v}, but the first side is ${ref}`);
    });
  }
  expect(compared).toBeGreaterThan(150);
  expect(problems).toEqual([]);
});

test('the calculator itself reads the shorthand the page uses', () => {
  expect(evaluate('40 e^(0.25*6)')).toBeCloseTo(40 * E ** 1.5, 9);
  expect(evaluate('frac(ln 20, ln 2)')).toBeCloseTo(log2(20), 9);
  expect(evaluate('2 ln 2')).toBeCloseTo(2 * Math.LN2, 9);
  expect(evaluate('log_10 200-log_10 2')).toBeCloseTo(2, 9);
  expect(evaluate('-0.1*20')).toBe(-2);
  expect(evaluate('10^(0.7)')).toBeCloseTo(5.0118723, 6);
  expect(() => evaluate('A e^(k t)')).toThrow();
});
function log2(x: number) { return Math.log2(x); }

// ---- tables ----
function table(name: string) {
  const t = new RegExp(`<table class="data" data-table="${name}">([\\s\\S]*?)</table>`).exec(BODY)?.[1] ?? '';
  return [...t.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1].replace(/\{m:([^}]*)\}/g, '$1').trim()));
}
const plain = (x: number) => String(Number(x.toPrecision(3)));

test('the large-t table that backs the claims about large t is recomputed to 3 significant figures', () => {
  const rows = table('large-t');
  expect(rows[0].slice(1)).toEqual(['10', '20', '30']);
  const grow = rows[1].slice(1);
  const decay = rows[2].slice(1);
  expect(grow).toEqual([10, 20, 30].map((t) => plain(100 * 1.5 ** t)));
  expect(decay).toEqual([10, 20, 30].map((t) => plain(100 * 0.6 ** t)));
  // the claims the table backs: growth passes any number, decay is positive and shrinking
  expect(grow.map(Number)).toEqual([...grow.map(Number)].sort((a, b) => a - b));
  expect(Math.min(...decay.map(Number))).toBeGreaterThan(0);
  expect(Number(decay[2])).toBeLessThan(Number(decay[0]));
});

test('the table of chord gradients is recomputed, and the values get close to 2', () => {
  const rows = table('chords');
  const hs = rows[0].slice(1).map(Number);
  const shown = rows[1].slice(1);
  expect(shown).toEqual(hs.map((h) => ((Math.exp(2 * h) - 1) / h).toFixed(4)));
  expect(Math.abs(Number(shown[2]) - 2)).toBeLessThan(Math.abs(Number(shown[0]) - 2));
});

test('the data tables in the lessons are recomputed', () => {
  // the bacteria table, the power-law table and the "which graph is straight" table
  const rowsOf = (t: string) => [...t.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1].replace(/\{m:([^}]*)\}/g, '$1').trim()));
  const tables = [...BODY.matchAll(/<table class="data"[^>]*>([\s\S]*?)<\/table>/g)].map((t) => rowsOf(t[1]));
  const bacteria = tables.find((t) => t[1][0] === 'N')!;
  expect(bacteria).toBeTruthy();
  expect(bacteria[1].slice(1).map(Number)).toEqual(bacteria[0].slice(1).map((t) => 100 * 1.5 ** Number(t)));
  const power = tables.find((t) => t.length === 4 && t[1][0] === 'y' && t[2][0] === 'log x' && t[3][0] === 'log y')!;
  expect(power).toBeTruthy();
  const xs = power[0].slice(1).map(Number);
  expect(power[1].slice(1).map(Number)).toEqual(xs.map((x) => 3 * x * x));
  expect(power[2].slice(1).map(Number)).toEqual(xs.map((x) => Number(log(x).toFixed(3)))); // log 1 is written as 0
  expect(power[3].slice(1).map(Number)).toEqual(xs.map((x) => Number(log(3 * x * x).toFixed(3))));
  const data = tables.find((t) => t.length === 4 && t[1][0] === 'y' && t[2][0] === 'log y' && t[3][0] === 'log x')!;
  expect(data).toBeTruthy();
  const xs2 = data[0].slice(1).map(Number);
  const ys2 = data[1].slice(1).map(Number);
  expect(ys2).toEqual(xs2.map((x) => 6 * 3 ** (x - 1)));
  expect(data[2].slice(1)).toEqual(ys2.map((y) => log(y).toFixed(4)));
  expect(data[3].slice(1)).toEqual(xs2.map((x) => log(x).toFixed(4)));
});

test('the "which graph is straight" example: log y against x has one gradient, log y against log x has different ones', () => {
  const xs = [1, 2, 3, 4];
  const ys = xs.map((x) => 6 * 3 ** (x - 1));
  const semi = [1, 2, 3].map((k) => (log(ys[k]) - log(ys[k - 1])) / (xs[k] - xs[k - 1]));
  expect(semi[0]).toBeCloseTo(semi[1], 12);
  expect(semi[1]).toBeCloseTo(semi[2], 12);
  expect(semi[0]).toBeCloseTo(log(3), 12);
  const loglog = [1, 2, 3].map((k) => (log(ys[k]) - log(ys[k - 1])) / (log(xs[k]) - log(xs[k - 1])));
  expect(Math.abs(loglog[0] - loglog[1])).toBeGreaterThan(0.5);
  expect(loglog[0].toFixed(3)).toBe('1.585');
  // the page works from the 4-decimal table, which gives 2.709 (the unrounded values give 2.710)
  expect((0.4771 / 0.1761).toFixed(3)).toBe('2.709');
  expect(loglog[1].toFixed(3)).toBe('2.710');
  expect(BODY).toContain('frac(0.4771, 0.1761)=2.709');
});

test('every "Now you finish it" blank holds the recomputed value', () => {
  const blanks = [...SOURCE.matchAll(/<span class="blank" data-answers="([^"]*)">/g)].map((m) => m[1].split(';'));
  const want: [number, (x: number) => number][] = [
    [1 + 20 / 100, exact], // the growth factor for a rise of 20%
    [400 * 1.2 ** 3, exact], // 691.2
    [12, exact], // A
    [48 / 12, exact], // e^(3k)
    [ln(4) / 3, sf3], // k
    [3, exact], // gradient of log y against log x for y = 2x^3
    [log(2), sf3], // intercept
    [log(2), sf3], // gradient of log y against x for y = 5*2^x
    [log(5), sf3], // intercept
    [4, exact], // the gradient of e^(4x) is 4 e^(4x)
    [4 * E, sf3], // 4 e at x = 0.25
    [-0.1 * 20, exact], // the power
    [20 + 60 * Math.exp(-2), sf3], // T at t = 20
  ];
  expect(blanks.length).toBe(want.length);
  blanks.forEach((answers, i) => {
    const [value, round] = want[i];
    for (const a of answers) expect(same(Number(a), round(value)), `blank ${i}: ${a} should be ${round(value)}`).toBe(true);
  });
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
  const bad = [...SOURCE.matchAll(/\{md?:([^}]*)\}/g)].map((m) => m[1]).filter((t) => /(\.\.\.|…|&hellip;|!=)/.test(t));
  expect(bad).toEqual([]);
});

// ---- the statements the page makes in words ----
test('each Key idea states the conditions its claim needs', () => {
  const keys = [...BODY.matchAll(/<div class="key">\s*<p><b>Key idea:<\/b>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
  expect(keys.length).toBeGreaterThanOrEqual(8);
  for (const k of keys) {
    // a claim about unlimited growth or about decay towards 0 needs the sign of the starting value
    if (/larger than any number/.test(k)) expect(k, 'growth without limit').toMatch(/A>0/);
    if (/gets closer and closer to 0|decays towards 0/.test(k)) expect(k, 'decay to 0').toMatch(/A>0|take A>0|\{m:b\}|0<b<1|k<0/);
    // "from above" needs the term to be positive
    if (/from above/.test(k)) expect(k, 'from above').toMatch(/A and k positive/);
  }
  const growth = keys.find((k) => /larger than any number you choose, once t is large enough/.test(k))!;
  expect(growth).toMatch(/b>1/);
  const withE = keys.find((k) => /y grows and becomes larger than any number/.test(k))!;
  expect(withE).toMatch(/k>0/);
  expect(withE).toMatch(/k<0/);
  // the gradient rule holds for any constant k, and the intercept of a log graph is log a, not a
  expect(keys.some((k) => /for any constant k, the gradient of/.test(k))).toBe(true);
  expect(keys.some((k) => /not a\. Use the same base/.test(k))).toBe(true);
});

test('the words that need a number to back them have one: large t, limiting value and "closer to 2"', () => {
  // large t: the growth and decay claims sit beside the table (checked above); the limiting-value claim is backed by two values
  expect(BODY).toContain('20+80 e^(-5)=20.539');
  expect(BODY).toContain('20+80 e^(-10)=20.004');
  expect(20 + 80 * Math.exp(-5)).toBeGreaterThan(20);
  expect(20 + 80 * Math.exp(-10)).toBeGreaterThan(20);
  expect(20 + 80 * Math.exp(-10)).toBeLessThan(20 + 80 * Math.exp(-5));
  // "about 26%" and "about 35%": the factor for each unit of t is e^k
  expect(sf3(1 - Math.exp(-0.3))).toBe(0.259);
  expect(Math.round((Math.exp(0.3) - 1) * 100)).toBe(35);
  expect(Math.round((Math.exp(0.4) - 1) * 100)).toBe(49);
});

test('the glossary entries added for this topic have the right numbers', () => {
  expect(20 + 80 * Math.exp(-10)).toBeCloseTo(20.0036, 4);
  expect(GLOSSARY).toContain('20+80e^(-10)=20.0036');
  expect(GLOSSARY).toContain('ln 2=0.693');
  expect(ln(2)).toBeCloseTo(0.693, 3);
  expect(GLOSSARY).toContain('e^(0.3)=1.35');
  expect(Math.exp(0.3)).toBeCloseTo(1.35, 2);
  expect(GLOSSARY).toContain('{m:P=20+80e^(-0.5t)}, the initial value is not 80');
  expect(20 + 80).toBe(100);
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
  await page.goto('/courses/a-level/exp-modelling.html');
  const ids = await page.evaluate(() => [...document.querySelectorAll('main h2, main h3')].map((h) => h.id));
  for (const h of headings) expect(ids, `heading "${h.text}"`).toContain(h.id);
  const broken = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href') ?? '').filter((h) => h.length > 1 && !document.getElementById(h.slice(1))));
  expect(broken).toEqual([]);
  // heading levels do not skip
  const levels = await page.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3')].map((h) => Number(h.tagName[1])));
  levels.forEach((l, k) => { if (k > 0) expect(l - levels[k - 1], `heading ${k}`).toBeLessThanOrEqual(1); });
});

// ---- figures ----
// GEOM, CURVES and POINTS are filled as each figure is drawn, so draw them all before reading them.
async function figureModule() {
  const mod = await import('../src/book/alevel/figures/exp-modelling.mjs');
  for (const id of Object.keys(mod.FIGURES)) mod.FIGURES[id]();
  return mod;
}
const K_FIT = ln(3) / 4;
const EXPECTED: Record<string, ((x: number) => number)[]> = {
  'exp-modelling-growth-decay': [(t) => 100 * 1.5 ** t, (t) => 100 * 0.6 ** t],
  'exp-modelling-car': [(t) => 12000 * 0.85 ** t],
  'exp-modelling-e': [(t) => 50 * Math.exp(0.3 * t), (t) => 50 * Math.exp(-0.3 * t)],
  'exp-modelling-fit': [(t) => 30 * Math.exp(K_FIT * t)],
  'exp-modelling-reach': [(t) => 30 * Math.exp(K_FIT * t)],
  'exp-modelling-limit': [(t) => 20 + 80 * Math.exp(-0.5 * t)],
  'exp-modelling-power': [(x) => 3 * x * x],
  'exp-modelling-power-line': [(X) => log(3 * (10 ** X) ** 2)], // log y = log(3 x^2), written with X = log x
  'exp-modelling-q-loglog': [(X) => 1.5 * X + 1.5], // ln y = 1.5 ln x + 1.5: X = ln x on the horizontal axis
  'exp-modelling-semilog': [(x) => log(2 * 3 ** x)],
  'exp-modelling-semilog-read': [(t) => 0.3 * t + 2], // ln y = 0.3t + 2
  'exp-modelling-q-semilog': [(x) => log(10 ** 1.2 * (10 ** 0.4) ** x)], // log y = 0.4x + 1.2
  'exp-modelling-tangent': [(x) => Math.exp(0.5 * x)],
  'exp-modelling-q-gradient': [(x) => 2 * Math.exp(3 * x)],
  'exp-modelling-cooling': [(t) => 20 + 60 * Math.exp(-0.1 * t), (t) => 80 * Math.exp(-0.1 * t)],
  'exp-modelling-flip': [(t) => 0.5 * t + 1.4], // ln y = 0.5t + 1.4
};
const SOME_CLASSES = ['curve', 'curve-b', 'curve-c'];
const minusText = (s: string) => s.replace(/−/g, '-').replace(/​/g, '');
const labelsOf = (svg: string) => [...svg.matchAll(/<text [^>]*>([\s\S]*?)<\/text>/g)].map((m) => minusText(m[1].replace(/<[^>]+>/g, '')));

test('each figure curve is drawn from its equation, and each marked point lies on its curve and carries its own coordinates', async () => {
  const { FIGURES, GEOM, CURVES, POINTS } = await figureModule();
  const ids = Object.keys(FIGURES);
  expect(ids.length).toBeGreaterThanOrEqual(12);
  expect(ids.length).toBeLessThanOrEqual(20);
  expect(Object.keys(EXPECTED).sort()).toEqual([...ids].sort());
  for (const id of ids) {
    const svg: string = FIGURES[id]();
    const g = GEOM[id];
    const toX = (px: number) => g.xmin + ((px - g.left) / (g.width - g.left - g.right)) * (g.xmax - g.xmin);
    const toY = (py: number) => g.ymax - ((py - g.top) / (g.height - g.top - g.bottom)) * (g.ymax - g.ymin);
    expect(svg, id).toContain(`viewBox="0 0 ${g.width} ${g.height}"`);
    // every curve, tangent line or guide drawn is accounted for: curves are listed, tangents and guides are checked below
    const paths = [...svg.matchAll(/<path class="(curve(?:-b|-c)?)" d="([^"]+)"/g)];
    expect(paths.length, id).toBe(EXPECTED[id].length);
    expect(CURVES[id].length, id).toBe(EXPECTED[id].length);
    paths.forEach((p, k) => {
      expect(SOME_CLASSES).toContain(p[1]);
      expect(p[1], `${id} curve ${k}`).toBe(CURVES[id][k].cls);
      const pts = [...p[2].matchAll(/[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
      expect(pts.length, `${id} curve ${k} has points`).toBeGreaterThan(50);
      const tolerance = 0.012 * (g.ymax - g.ymin);
      for (const [px, py] of pts) {
        const x = toX(px);
        expect(x, `${id} curve ${k} starts at ${CURVES[id][k].from ?? g.xmin}`).toBeGreaterThanOrEqual((CURVES[id][k].from ?? g.xmin) - 0.02);
        expect(Math.abs(toY(py) - EXPECTED[id][k](x)), `${id} curve ${k} at x=${x.toFixed(2)}`).toBeLessThan(tolerance);
      }
    });
    // the marked points
    const circles = [...svg.matchAll(/<circle class="pt(?:-open)?" cx="(-?[\d.]+)" cy="(-?[\d.]+)"/g)].map((m) => [toX(Number(m[1])), toY(Number(m[2]))]);
    expect(circles.length, id).toBe(POINTS[id].length);
    POINTS[id].forEach((pt: { x: number; y: number; on: number | null }, k: number) => {
      expect(Math.abs(circles[k][0] - pt.x), `${id} point ${k} x`).toBeLessThan(0.02);
      expect(Math.abs(circles[k][1] - pt.y), `${id} point ${k} y`).toBeLessThan(0.02 * (g.ymax - g.ymin));
      if (pt.on !== null) expect(Math.abs(EXPECTED[id][pt.on](pt.x) - pt.y), `${id} point ${k} lies on its curve`).toBeLessThan(1e-9);
    });
  }
});

test('a point label shows its own coordinates, rounded the way the label rounds them, and the description states every one', async () => {
  const { FIGURES, POINTS } = await figureModule();
  let labels = 0;
  for (const id of Object.keys(FIGURES)) {
    const svg: string = FIGURES[id]();
    const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg)?.[1] ?? '';
    const seen: string[] = [];
    for (const t of labelsOf(svg)) {
      const m = /^\((-?[\d.]+), (-?[\d.]+)\)$/.exec(t);
      if (!m) continue;
      labels += 1;
      seen.push(t);
      const dp = (s: string) => (s.split('.')[1] ?? '').length;
      const hit = POINTS[id].some((pt: { x: number; y: number }) => Number(m[1]) === Number(pt.x.toFixed(dp(m[1]))) && Number(m[2]) === Number(pt.y.toFixed(dp(m[2]))));
      expect(hit, `${id}: label ${t} is the true rounding of a marked point`).toBe(true);
      // the description says the point in words, with "minus" for a negative number
      const spoken = `(${m[1].replace('-', 'minus ')}, ${m[2].replace('-', 'minus ')})`;
      expect(desc, `${id}: description names ${t}`).toContain(spoken);
    }
    // every marked point has a label that is a coordinate pair
    expect(seen.length, `${id}: one label for each marked point`).toBe(POINTS[id].length);
  }
  expect(labels).toBeGreaterThan(20);
});

test('the labels that name a value are right', async () => {
  const { FIGURES, POINTS } = await figureModule();
  // the reach picture: the curve P = 30e^(kt) meets P = 500 at t = ln(500/30)/k = 10.2
  const reach = POINTS['exp-modelling-reach'][0];
  expect(reach.x).toBeCloseTo(ln(500 / 30) / K_FIT, 12);
  expect(30 * Math.exp(K_FIT * reach.x)).toBeCloseTo(500, 9);
  expect(sf3(reach.x)).toBe(10.2);
  expect(labelsOf(FIGURES['exp-modelling-reach']())).toContain('t = 10.2');
  // the car: V = 12000 x 0.85^4 = 6264.075, labelled 6264
  expect(Math.round(POINTS['exp-modelling-car'][1].y)).toBe(6264);
  // the cooling picture: model 2 at t = 10 is 42.07, and the measurement 42 is drawn as a separate point
  expect(POINTS['exp-modelling-cooling'][1]).toMatchObject({ x: 10, y: 42, on: null });
  expect(Math.abs(20 + 60 * Math.exp(-1) - 42)).toBeLessThan(0.1);
  // the tangent picture: the gradient 0.5 e = 1.36 and the height e = 2.72 at x = 2
  expect(sf3(0.5 * E)).toBe(1.36);
  expect(sf3(E)).toBe(2.72);
  expect(labelsOf(FIGURES['exp-modelling-tangent']())).toContain('gradient 1.36');
  // the limiting value and the line in the cooling picture
  expect(labelsOf(FIGURES['exp-modelling-limit']())).toContain('P gets close to 20');
  // the straight-line pictures: the intercepts and the second points
  expect(POINTS['exp-modelling-power-line'].map((p: { x: number; y: number }) => [p.x, Number(p.y.toFixed(3))])).toEqual([[0, 0.477], [1, 2.477]]);
  expect(POINTS['exp-modelling-semilog'].map((p: { x: number; y: number }) => [p.x, Number(p.y.toFixed(3))])).toEqual([[0, 0.301], [2, 1.255]]);
  expect(POINTS['exp-modelling-flip'].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[0, 1.4], [4, 3.4]]);
  expect(POINTS['exp-modelling-semilog-read'].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[0, 2], [5, 3.5]]);
  expect(POINTS['exp-modelling-power'].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[1, 3], [2, 12], [4, 48]]);
  // the question figures: the page asks for n and a, for b, and for k; the pictures were drawn from n = 1.5, b = 10^0.4 and k = 3
  expect(POINTS['exp-modelling-q-loglog'].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[0, 1.5], [2, 4.5]]);
  expect(POINTS['exp-modelling-q-semilog'].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[0, 1.2], [4, 2.8]]);
  expect(POINTS['exp-modelling-q-gradient'].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[0, 2]]);
});

test('a question figure describes the picture and never gives the answer away', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/exp-modelling.mjs');
  const ids = Object.keys(FIGURES).filter((id) => id.startsWith('exp-modelling-q-'));
  expect(ids.length).toBe(3);
  for (const id of ids) {
    const svg = FIGURES[id]();
    const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg)?.[1] ?? '';
    const title = /<title[^>]*>([\s\S]*?)<\/title>/.exec(svg)?.[1] ?? '';
    for (const words of [desc, title, labelsOf(svg).join(' ')]) {
      expect(words, id).not.toMatch(/answer|solution|gradient|slope|\bn (?:is|equals)|\bk (?:is|equals)|\bb (?:is|equals)|asymptote/i);
    }
    // the numbers asked for (n = 1.5 and a = 4.48, b = 2.51, k = 3) are not written as the answers
    expect(labelsOf(svg).join(' '), id).not.toMatch(/4\.48|2\.51|15\.8|k = 3|n = 1\.5/);
  }
  // each question figure sits straight after its question text in the page
  const qs = SOURCE.split(/(?=<div class="q")/).filter((b) => /\{fig:exp-modelling-q-/.test(b.split('<ol class="ladder">')[0]));
  expect(qs.length).toBe(3);
  for (const q of qs) expect(/<\/p>\s*<figure class="qfig-lg">\{fig:exp-modelling-q-/.test(q), 'figure straight after qtext').toBe(true);
});

test('a description that says dotted has a dotted (curve-c) element in the picture', async () => {
  const { FIGURES } = await figureModule();
  for (const id of Object.keys(FIGURES)) {
    const svg: string = FIGURES[id]();
    const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg)?.[1] ?? '';
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
    const labels = labelsOf(svg).filter((t) => /^\(.*\)$/.test(t));
    out[id] = {
      title: /<title[^>]*>([\s\S]*?)<\/title>/.exec(svg)?.[1] ?? '',
      points: POINTS[id].map((pt: { x: number; y: number }, k: number) => ({
        label: labels[k],
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
    await page.goto('/courses/a-level/exp-modelling.html');
    const problems = await page.evaluate(({ geo, width }) => {
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
        const texts = [...svg.querySelectorAll('text')].filter((t) => (t.textContent ?? '').replace(/​/g, '').trim());
        const boxes = texts.map((t) => ({ t, name: (t.textContent ?? '').replace(/​/g, '').replace(/−/g, '-').trim(), b: t.getBBox() }));
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
    }, { geo, width });
    expect(problems).toEqual([]);
  });
}

test('a defined word is linked with its plain name, with no bracketed extra in the link text', async ({ page }) => {
  await page.goto('/courses/a-level/exp-modelling.html');
  const texts = await page.locator('main a.term:not(.words-strip a)').allTextContents();
  expect(texts.length).toBeGreaterThan(8);
  expect(texts.filter((t) => t.includes('('))).toEqual([]);
});

test('the topic is live, in the page lists, and its words all exist', async ({ page }) => {
  const topics = readFileSync(join(ROOT, 'src', 'book', 'alevel', 'topics.mjs'), 'utf8');
  const row = topics.split('\n').find((l) => l.includes("t('exp-modelling'"))!;
  expect(row).toContain("status: 'live'");
  const words = [...(/words: \[([^\]]*)\]/.exec(row)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  expect(words.length).toBeGreaterThanOrEqual(10);
  await page.goto('/courses/a-level/exp-modelling.html');
  const strip = await page.locator('.words-strip a').count();
  expect(strip).toBeGreaterThanOrEqual(words.length - 2);
});
