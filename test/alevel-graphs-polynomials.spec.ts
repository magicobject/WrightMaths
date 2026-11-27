import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Graphs of polynomials and reciprocals page that a general test cannot make:
//   - every typed key is RECOMPUTED here from the question's numbers (a polynomial is held as its brackets, a root list is
//     found by scanning, an intersection is found by scanning the difference of the two graphs);
//   - every wrong-answer value is recomputed from the slip its message names, and the message is checked for that slip;
//   - every multiple-choice key is decided from the function, never from the option's wording;
//   - every worked example's roots, touching points and y-intercept are recomputed;
//   - every drawn curve is read back from the SVG path and compared with the function the page says it is;
//   - every marked point is on its curve, every label says its own point's coordinates and sits nearest its own item,
//     no label sits on a curve, and no SVG text leaves the picture.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'graphs-polynomials.html'), 'utf8');

// ---------- polynomials held as brackets: k * (p x + q)^m * ... ----------
type Bracket = [number, number, number]; // [p, q, m] is (p x + q)^m
const fn = (k: number, bs: Bracket[]) => (x: number) => k * bs.reduce((a, [p, q, m]) => a * (p * x + q) ** m, 1);
const yInt = (k: number, bs: Bracket[]) => fn(k, bs)(0);
const rootsOf = (bs: Bracket[]) => [...new Set(bs.map(([p, q]) => -q / p + 0))].sort((a, b) => a - b);
const mult = (bs: Bracket[], r: number) => bs.filter(([p, q]) => Math.abs(-q / p - r) < 1e-12).reduce((a, [, , m]) => a + m, 0);
const sig = (v: number) => Math.sign(v);
const lead = (k: number, bs: Bracket[]) => k * bs.reduce((a, [p, , m]) => a * p ** m, 1);
const sumMult = (bs: Bracket[]) => bs.reduce((a, [, , m]) => a + m, 0);

const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const dp = (x: number, n: number) => String(Number(x.toFixed(n)));
const typedList = (xs: number[]) => [...xs].sort((a, b) => a - b).map((v) => String(v + 0)).join(' or ');

/** The real solutions of fn(x) = 0 on [lo, hi], by scanning for a sign change (and for a grid point that is a double root). */
function solve(f: (x: number) => number, lo = -30, hi = 30): number[] {
  const out: number[] = [];
  const step = 0.001;
  let prev = f(lo);
  let prevX = lo;
  for (let i = 1; i <= Math.round((hi - lo) / step); i += 1) {
    const x = Math.round((lo + i * step) * 1e6) / 1e6;
    const y = f(x);
    if (Number.isFinite(y) && Math.abs(y) < 1e-9) out.push(x);
    else if (Number.isFinite(y) && Number.isFinite(prev) && Math.sign(y) !== Math.sign(prev) && Math.abs(prev) > 1e-9) {
      let a = prevX;
      let b = x;
      for (let k = 0; k < 60; k += 1) { const m = (a + b) / 2; if (Math.sign(f(m)) === Math.sign(f(a))) a = m; else b = m; }
      if (Math.abs(f((a + b) / 2)) < 1e-6) out.push(Math.round(((a + b) / 2) * 1e6) / 1e6);
    }
    prev = y;
    prevX = x;
  }
  return [...new Set(out)].sort((p, q) => p - q);
}
const pair = (x: number, y: number) => `${x},${y}`;

// ---------- reading the page's questions ----------
const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', ldquo: '"', rdquo: '"', rsquo: "'", nbsp: ' ', times: '*', sup2: '^2', hellip: '...', middot: '.' };
const decode = (t: string) => t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n] ?? m);
const plain = (h: string) => decode(h.replace(/<[^>]+>/g, '').replace(/\{m:/g, '').replace(/\}/g, '')).replace(/\s+/g, ' ').trim();

/** A typed answer as a function of x, for an equation such as -(x+2)(x-3)^2 or -6/x. */
function alg(t: string): (x: number) => number {
  // a power is written as Math.pow so that a minus sign in front of it is read as -(base^n), as in algebra
  const s = t.replace(/\s+/g, '').replace(/(\([^()]*\)|[\d.]+|x)\^(\d+)/g, 'Math.pow($1,$2)').replace(/(\d|\))(?=[xM(])/g, '$1*').replace(/x(?=[x(\d])/g, 'x*');
  return new Function('x', `return (${s});`) as (x: number) => number;
}
const SAMPLES = [-3.7, -1.3, 0.7, 1.9, 4.3, 6.1];
const numbersIn = (t: string) => t.replace(/\band\b|\bor\b|[(),]/g, ' ').trim().split(/\s+/).filter(Boolean).map((p) => { const m = /^(-?[\d.]+)\/([\d.]+)$/.exec(p); return m ? Number(m[1]) / Number(m[2]) : Number(p); });

/** Whether two typed answers have the same value: a list ("-1 or 2"), a pair ("2,5"), a number ("1/3") or an equation in x. */
function sameValue(x: string, y: string, tol = 1e-9): boolean {
  const lists = [x, y].map((t) => /\bor\b/.test(t));
  if (lists[0] !== lists[1]) return false;
  if (lists[0]) { const a = numbersIn(x).sort((p, q) => p - q); const b = numbersIn(y).sort((p, q) => p - q); return a.length === b.length && a.every((v, i) => close(v, b[i], tol)); }
  if (/x/.test(x) || /x/.test(y)) {
    try { const f = alg(x); const g = alg(y); return SAMPLES.every((v) => close(f(v), g(v), 1e-7)); } catch { return false; }
  }
  const a = numbersIn(x);
  const b = numbersIn(y);
  return a.length === b.length && a.every((v, i) => (tol > 1e-6 ? Math.abs(v - b[i]) <= tol : close(v, b[i], tol)));
}

type Wrong = { values: string[]; text: string; claimed: boolean };
type Question = { plain: string; mode: string; answers: string[]; wrongs: Wrong[]; block: string };
function questions(): Question[] {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongList = /<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '';
    const wrongs = [...wrongList.matchAll(/<li data-if="([^"]*)">([\s\S]*?)<\/li>/g)].map((m) => ({ values: decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean), text: m[2], claimed: false }));
    return { plain: plain(/<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? ''), mode: /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? 'value', answers, wrongs, block };
  });
}

// ---------- the facts each question is built from, written here from the question's own numbers ----------
const B = (p: number, q: number, m = 1): Bracket => [p, q, m];
const X = (q: number, m = 1): Bracket => B(1, q, m); // (x + q)^m
/** The factor (x - r) or (x + r) as a student writes it. */
const factor = (r: number) => (r >= 0 ? `(x-${r})` : `(x+${-r})`);

// polynomial 4x^... written as coefficient lists, highest power first
const horner = (c: number[]) => (x: number) => c.reduce((a, v) => a * x + v, 0);

// where two graphs meet: the x-values come from scanning the difference
const meetX = (f: (x: number) => number, g: (x: number) => number) => solve((x) => f(x) - g(x), -40, 40);

type Slip = { value: string; says: RegExp; fn?: (x: number) => number };
type Check = { find: string; answer: string; fn?: (x: number) => number; also?: string[]; slips?: Slip[] };

const cubicA = [X(4), X(-2), X(5)]; // (x+4)(x-2)(x+5)
const cubicB = [X(-1), X(2), X(4)]; // 3(x-1)(x+2)(x+4)
const cubicC = [X(-5), X(2, 2)]; // (x-5)(x+2)^2
const quarticD = [X(1), X(-2), X(3), X(5)]; // (x+1)(x-2)(x+3)(x+5)
const quarticE = [X(-2, 2), X(3, 2)]; // (x-2)^2(x+3)^2
const pw6 = horner([1, -1, -6, 0]); // x^3 - x^2 - 6x
const pw9 = horner([1, 0, -9, 0, 0]); // x^4 - 9x^2
const pw4 = horner([1, -3, -4, 0]); // x^3 - 3x^2 - 4x
const pwQ = horner([1, 0, -5, 0, 4]); // x^4 - 5x^2 + 4

// the question that asks for the equation of the cubic in the first picture of the flip set
const qCubicK = -18 / yInt(1, [X(2), X(-3, 2)]); // the marked point (0, -18) gives k
const qCubic = fn(qCubicK, [X(2), X(-3, 2)]);
const qRecipA = 3 * -2; // the marked point (3, -2) gives a
const quarticF = fn(1, [X(-1, 2), X(2), X(-3)]); // touches at 1, crosses at -2 and 3

const CHECKS: Check[] = [
  // warm-up and recap
  { find: 'Work out (-2)*3*(-4)', answer: String(-2 * 3 * -4), slips: [{ value: String(-(-2 * 3 * -4)), says: /negative times a negative is positive/ }] },
  { find: 'Solve (x-3)(x+5)=0', answer: typedList([3, -5]), slips: [{ value: typedList([-3, 5]), says: /copied the numbers/ }] },
  { find: 'Work out frac(8, (-2)^2)', answer: String(8 / (-2) ** 2), slips: [{ value: String(8 / -(2 ** 2)), says: /\(-2\)\^2=4/ }, { value: String(8 / -2), says: /did not square/ }] },
  { find: 'Factorise x^2-x-6', answer: (() => { const d = Math.sqrt(1 + 24); const r1 = (1 + d) / 2; const r2 = (1 - d) / 2; return `${factor(r1)}${factor(r2)}`; })(), fn: horner([1, -1, -6]), slips: [{ value: '(x+3)(x-2)', says: /x\^2\+x-6/, fn: horner([1, 1, -6]) }] },
  { find: 'Solve frac(5, x)=10', answer: String(5 / 10), slips: [{ value: String(10 / 5), says: /10\/5/ }] },
  // 1. the ends and the y-intercept
  { find: 'y=(x+4)(x-2)(x+5) meets the y-axis', answer: String(yInt(1, cubicA)), slips: [{ value: String(Math.abs(yInt(1, cubicA))), says: /instead of -2/ }, { value: String(4 + -2 + 5), says: /added/ }] },
  { find: 'y=3(x-1)(x+2)(x+4) meets the y-axis', answer: String(yInt(3, cubicB)), slips: [{ value: String(yInt(1, cubicB)), says: /left out the 3/ }] },
  { find: 'y=x^3-5x^2+2x-7 meets the y-axis', answer: String(horner([1, -5, 2, -7])(0)), slips: [{ value: String(-horner([1, -5, 2, -7])(0)), says: /constant term is -7/ }] },
  // 2. cubics
  { find: 'y=(x-4)(x+1)(x+5) meets the x-axis', answer: typedList(rootsOf([X(-4), X(1), X(5)])), slips: [{ value: typedList(rootsOf([X(-4), X(1), X(5)]).map((r) => -r)), says: /copied the numbers/ }] },
  { find: 'How many different points does y=(x-2)^2(x+1) have', answer: String(rootsOf([X(-2, 2), X(1)]).length), slips: [{ value: String(sumMult([X(-2, 2), X(1)])), says: /counted the squared bracket twice/ }] },
  { find: 'y=(x-5)(x+2)^2 meets the y-axis', answer: String(yInt(1, cubicC)), slips: [{ value: String(Math.abs(yInt(1, cubicC))), says: /5 instead of -5/ }, { value: String(-5 * 2), says: /did not square/ }] },
  { find: 'largest x-coordinate of a point where y=x^3-x^2-6x', answer: String(Math.max(...solve(pw6))), slips: [{ value: String(Math.min(...solve(pw6))), says: /smallest root/ }] },
  // 3. quartics
  { find: 'How many different points does y=(x+1)^2(x-3)^2', answer: String(rootsOf([X(1, 2), X(-3, 2)]).length), slips: [{ value: String(sumMult([X(1, 2), X(-3, 2)])), says: /twice/ }] },
  { find: 'y=(x+1)(x-2)(x+3)(x+5) meets the y-axis', answer: String(yInt(1, quarticD)), slips: [{ value: String(Math.abs(yInt(1, quarticD))), says: /2 instead of -2/ }, { value: String(1 - 2 + 3 + 5), says: /added/ }] },
  { find: 'y=x^4-9x^2 meets the x-axis', answer: typedList(solve(pw9)), slips: [{ value: typedList(solve(pw9).filter((r) => r !== 0)), says: /left out x=0/ }] },
  { find: 'y=(x-2)^2(x+3)^2 meets the y-axis', answer: String(yInt(1, quarticE)), slips: [{ value: String(-2 * 3), says: /did not square/ }] },
  // 4. reciprocal graphs
  { find: 'y=frac(12, x). Find y when x=4', answer: String(12 / 4), slips: [{ value: String(12 * 4), says: /multiplied 12 by 4/ }, { value: String(4 / 12), says: /4 divided by 12/ }] },
  { find: 'y=frac(-8, x). Find y when x=-2', answer: String(-8 / -2), slips: [{ value: String(-(-8 / -2)), says: /kept the minus sign/ }] },
  { find: 'y=frac(a, x) passes through the point (2, 5)', answer: String(2 * 5), slips: [{ value: String(5 / 2), says: /5 divided by 2/ }, { value: String(2 + 5), says: /added the two coordinates/ }] },
  { find: 'y=frac(18, x^2). Find y when x=-3', answer: String(18 / (-3) ** 2), slips: [{ value: String(18 / -(3 ** 2)), says: /-9/ }, { value: String(18 / -3), says: /did not square x/ }] },
  { find: 'y=frac(a, x^2) passes through the point (2, 3)', answer: String(3 * 2 ** 2), slips: [{ value: String(3 * 2), says: /multiplied 3 by 2/ }, { value: String(3 / 2 ** 2), says: /divided 3 by 4/ }] },
  { find: 'y=frac(7, x). As x gets bigger and bigger', answer: String(Math.round(7 / 1e9)), slips: [{ value: '7', says: /Dividing it by a huge number/ }] },
  // 5. where two graphs meet
  { find: 'y=frac(10, x) and y=x+3 meet', answer: (() => { const xs = meetX((x) => 10 / x, (x) => x + 3).filter((v) => v > 0); expect(xs).toHaveLength(1); return pair(xs[0], xs[0] + 3); })(), slips: [{ value: pair(5, 2), says: /y-value first/ }, { value: (() => { const x = meetX((v) => 10 / v, (v) => v + 3).find((v) => v < 0)!; return pair(x, x + 3); })(), says: /other point/ }] },
  { find: 'y=x^3-x^2 and y=2x meet', answer: typedList(meetX((x) => x ** 3 - x ** 2, (x) => 2 * x)), slips: [{ value: typedList(meetX((x) => x ** 3 - x ** 2, (x) => 2 * x).filter((v) => v !== 0)), says: /divided by x and lost the solution x=0/ }] },
  { find: 'y=frac(12, x) and y=7-x meet', answer: (() => { const x = Math.min(...meetX((v) => 12 / v, (v) => 7 - v)); return pair(x, 7 - x); })(), slips: [{ value: (() => { const x = Math.max(...meetX((v) => 12 / v, (v) => 7 - v)); return pair(x, 7 - x); })(), says: /larger x-coordinate/ }] },
  { find: 'Sketch y=x^3 and y=frac(1, x)', answer: String(meetX((x) => x ** 3, (x) => 1 / x).length), slips: [{ value: String(meetX((x) => x ** 3, (x) => 1 / x).filter((v) => v > 0).length), says: /x=-1 works too/ }] },
  // 6. proportion
  { find: 'y is proportional to x^2. When x=2, y=20', answer: String((20 / 2 ** 2) * 4 ** 2), slips: [{ value: String((20 / 2) * 4), says: /treated y as proportional to x\./ }] },
  { find: 'y is inversely proportional to x. When x=3, y=8', answer: String((8 * 3) / 8), slips: [{ value: String((8 / 3) * 8), says: /directly proportional/ }] },
  { find: 'y is proportional to sqrt(x). When x=4, y=12', answer: String((12 / Math.sqrt(4)) * Math.sqrt(25)), slips: [{ value: String((12 / 4) * 25), says: /treated y as proportional to x\./ }] },
  { find: 'y=k*sqrt(x) passes through the point (9, 15)', answer: String(15 / Math.sqrt(9)), slips: [{ value: String(15 * 9), says: /multiplied 15 by 9/ }, { value: String(15 / 9), says: /divided by 9/ }] },
  // flip it: equations are compared as functions of x
  { find: 'The graph shows a cubic', answer: `${qCubicK}(x+2)(x-3)^2`, fn: qCubic, slips: [{ value: '(x+2)(x-3)^2', says: /meets the y-axis at \(0, 18\)/, fn: fn(1, [X(2), X(-3, 2)]) }, { value: '-(x+2)^2(x-3)', says: /wrong factor/, fn: fn(-1, [X(2, 2), X(-3)]) }] },
  { find: 'The curve in the figure has the equation', answer: `${qRecipA}/x`, fn: (x) => qRecipA / x, slips: [{ value: `${-qRecipA}/x`, says: /a is negative/, fn: (x) => -qRecipA / x }, { value: `${qRecipA}x`, says: /straight line/, fn: (x) => qRecipA * x }] },
  { find: 'A quartic has x^4 coefficient 1', answer: '(x-1)^2(x+2)(x-3)', fn: quarticF, slips: [{ value: '(x-1)(x+2)(x-3)', says: /only three factors/, fn: fn(1, [X(-1), X(2), X(-3)]) }, { value: '(x+1)^2(x-2)(x+3)', says: /signs are the wrong way round/, fn: fn(1, [X(1, 2), X(-2), X(3)]) }] },
  // mixed review
  { find: 'y=-(x+3)(x-1)(x-2) meets the y-axis', answer: String(yInt(-1, [X(3), X(-1), X(-2)])), slips: [{ value: String(yInt(1, [X(3), X(-1), X(-2)])), says: /minus sign in front/ }] },
  { find: 'y=(2x-1)(x+3)(x-2) meets the x-axis', answer: typedList(rootsOf([B(2, -1), X(3), X(-2)])), slips: [{ value: typedList([-3, -0.5, 2]), says: /x=0\.5, not -0\.5/ }] },
  { find: 'passes through the point (-2, 5)', answer: String(5 * (-2) ** 2), slips: [{ value: String(5 * -2), says: /multiplied 5 by x/ }, { value: String(5 / (-2) ** 2), says: /divided 5 by 4/ }] },
  { find: 'y=frac(2, x) and y=x-1 meet', answer: (() => { const x = meetX((v) => 2 / v, (v) => v - 1).find((v) => v < 0)!; return pair(x, x - 1); })(), slips: [{ value: (() => { const x = meetX((v) => 2 / v, (v) => v - 1).find((v) => v > 0)!; return pair(x, x - 1); })(), says: /positive x/ }, { value: pair(-2, -1), says: /y-value first/ }] },
  // exam style
  { find: 'y=x^3-3x^2-4x. The curve meets the x-axis', answer: String(Math.max(...solve(pw4))), slips: [{ value: String(Math.min(...solve(pw4))), says: /smallest/ }, { value: String(solve(pw4)[1]), says: /middle root/ }] },
  { find: 'y=frac(3, x) and the line y=x+2', answer: (() => { const x = meetX((v) => 3 / v, (v) => v + 2).find((v) => v > 0)!; return pair(x, x + 2); })(), slips: [{ value: pair(3, 1), says: /y-value first/ }, { value: (() => { const x = meetX((v) => 3 / v, (v) => v + 2).find((v) => v < 0)!; return pair(x, x + 2); })(), says: /other point/ }] },
  { find: 'passes through the point (0, 6). Find the value of k', answer: String(6 / yInt(1, [X(2), X(-1, 2)])), slips: [{ value: String(6 / (2 * -1)), says: /A square is positive/ }, { value: String(6 * 2), says: /multiplied 6 by 2/ }] },
  { find: 'passes through the point (3, 4). Find the value of y when x=-6', answer: (() => { const a = 4 * 3 ** 2; return String(a / (-6) ** 2); })(), slips: [{ value: String(36 / -6), says: /did not square x/ }, { value: String(36 / -(6 ** 2)), says: /negative number squared is positive/ }] },
  { find: 'y=x^4-5x^2+4 meets the x-axis', answer: typedList(solve(pwQ)), slips: [{ value: typedList([1, 4]), says: /values of x\^2/ }, { value: typedList([-2, 2]), says: /x\^2=4 only/ }] },
];

test('every typed key is recomputed, and every wrong-answer value is tied to the slip its message names', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const qs = questions();
  const problems: string[] = [];
  const checked = new Set<Question>();
  const eqFn = (s: string) => alg(s.replace(/^y=/, ''));
  for (const c of CHECKS) {
    const found = qs.filter((q) => q.plain.includes(c.find));
    if (found.length !== 1) { problems.push(`"${c.find}" matches ${found.length} questions`); continue; }
    const q = found[0];
    checked.add(q);
    if (!matches(c.answer, q.answers, q.mode)) problems.push(`${c.find}: the key does not accept the recomputed answer "${c.answer}" (keys: ${q.answers.join(' | ')})`);
    for (const k of q.answers) {
      const ok = c.fn ? SAMPLES.every((v) => close(eqFn(k)(v), c.fn!(v), 1e-7)) : [c.answer, ...(c.also ?? [])].some((a) => sameValue(k, a));
      if (!ok) problems.push(`${c.find}: key "${k}" is not the recomputed answer "${c.answer}"`);
    }
    for (const s of c.slips ?? []) {
      const li = q.wrongs.find((w) => matches(s.value, w.values, q.mode));
      if (!li) { problems.push(`${c.find}: no wrong-answer entry accepts the slip value "${s.value}" (entries: ${q.wrongs.map((w) => w.values.join(' | ')).join(' / ')})`); continue; }
      li.claimed = true;
      if (!s.says.test(plain(li.text))) problems.push(`${c.find}: the message for "${s.value}" does not name the slip ${s.says}: ${li.text.slice(0, 90)}`);
      if (matches(s.value, q.answers, q.mode)) problems.push(`${c.find}: the slip value "${s.value}" is also a right answer`);
      for (const v of li.values) {
        const same = s.fn ? SAMPLES.every((x) => close(eqFn(v)(x), s.fn!(x), 1e-7)) : sameValue(v, s.value, 0.04);
        if (!same) problems.push(`${c.find}: "${v}" is listed with the slip but is not the slip value "${s.value}"`);
      }
      if (s.fn && c.fn && SAMPLES.every((x) => close(s.fn!(x), c.fn!(x), 1e-7))) problems.push(`${c.find}: the slip "${s.value}" is the same graph as the key`);
    }
    for (const w of q.wrongs) if (!w.claimed) problems.push(`${c.find}: wrong-answer entry "${w.values.join(' | ')}" has no recomputed slip`);
  }
  for (const q of qs) if (q.answers.length > 0 && !checked.has(q)) problems.push(`no recomputed key for: ${q.plain.slice(0, 70)}`);
  expect(CHECKS.length).toBeGreaterThan(35);
  expect(problems).toEqual([]);
});

// ---------- multiple-choice keys, decided from the function ----------
const options = (find: string) => {
  const q = questions().find((x) => x.plain.includes(find));
  expect(q, find).toBeTruthy();
  return [...(q as Question).block.matchAll(/<li( data-correct| data-why="([^"]*)")?>([\s\S]*?)<\/li>/g)].filter((m) => m[1]).map((m) => ({ correct: m[1] === ' data-correct', why: decode(m[2] ?? ''), text: plain(m[3]) }));
};
const correctText = (find: string) => options(find).find((o) => o.correct)?.text;
const BIG = 1e4;
/** What the two ends of a graph do, read from the function at x = -10000 and x = 10000. */
function ends(f: (x: number) => number): string {
  const l = sig(f(-BIG));
  const r = sig(f(BIG));
  if (l > 0 && r > 0) return 'Both ends go up';
  if (l < 0 && r < 0) return 'Both ends go down';
  return l < 0 ? 'The left end goes down and the right end goes up' : 'The left end goes up and the right end goes down';
}
/** Whether f changes sign at its root r: true for a crossing, false for a touch. */
const crosses = (f: (x: number) => number, r: number) => sig(f(r - 0.01)) !== sig(f(r + 0.01));

test('multiple-choice keys: each correct option is the one the function gives, and each reason quotes right numbers', () => {
  // ends
  expect(correctText('ends of the graph of y=x^3-6x+2')).toBe(ends(horner([1, 0, -6, 2])));
  expect(correctText('ends of the graph of y=4-x^4')).toBe(ends(horner([-1, 0, 0, 0, 4])));
  expect(correctText('ends of the graph of y=5x-x^3')).toBe(ends(horner([-1, 0, 5, 0])));
  expect(correctText('ends of the graph of y=-2(x+1)^2(x-4)^2')).toBe(ends(fn(-2, [X(1, 2), X(-4, 2)])));
  // y=(3-x)(x+1)(x+2): large and positive x
  const big = fn(1, [B(-1, 3), X(1), X(2)])(BIG);
  expect(big).toBeLessThan(0);
  expect(correctText('What happens to y when x is very large and positive')).toBe('y is very large and negative');
  // touching and crossing
  const f1 = fn(1, [X(1, 2), X(-3)]);
  expect(crosses(f1, -1)).toBe(false);
  expect(crosses(f1, 3)).toBe(true);
  expect(correctText('The curve y=(x+1)^2(x-3) is sketched')).toBe('It touches the x-axis at x = -1 and crosses it at x = 3');
  // which equation: crosses at -2, touches at 3, right end up
  const eq = options('A cubic crosses the x-axis at x = -2').map((o) => ({ ...o, f: alg(/= (.*)$/.exec(o.text)![1]) }));
  expect(eq.map((o) => crosses(o.f, -2) && !crosses(o.f, 3) && o.f(BIG) > 0)).toEqual(eq.map((o) => o.correct));
  expect(eq.filter((o) => o.correct)).toHaveLength(1);
  // y = (x - 1)^3
  const cube = fn(1, [X(-1, 3)]);
  expect(crosses(cube, 1)).toBe(true);
  expect(Math.abs(cube(1.01))).toBeLessThan(2e-6); // gradient 0: the value is tiny a little way from the root
  expect(correctText('What does the graph of y=(x-1)^3 do')).toBe('It crosses the x-axis, with gradient 0 there');
  // four brackets, each once: four crossings, both ends up
  const four = fn(1, [X(-1), X(-2), X(-3), X(-4)]);
  expect([1, 2, 3, 4].every((r) => crosses(four, r))).toBe(true);
  expect(ends(four)).toBe('Both ends go up');
  expect(correctText('describes the graph of y=(x-1)(x-2)(x-3)(x-4)')).toBe('It crosses the x-axis four times, and both ends go up');
  // asymptotes of y = 5/x
  expect(Math.abs(5 / 1e9)).toBeLessThan(1e-8);
  expect(Math.abs(5 / 1e-9)).toBeGreaterThan(1e9);
  expect(correctText('asymptotes of y=frac(5, x)')).toBe('x = 0 and y = 0');
  // y = -3/x^2 is negative everywhere except x = 0
  expect(SAMPLES.every((x) => -3 / x ** 2 < 0)).toBe(true);
  expect(correctText('graph of y=frac(-3, x^2)')).toBe('Both branches are below the x-axis');
  // how many meeting points: 4/x^2 = 1
  expect(meetX((x) => 4 / x ** 2, () => 1)).toHaveLength(2);
  expect(correctText('points of intersection do y=frac(4, x^2) and y=1 have')).toBe('Two');
  // the equation to solve
  expect(correctText('Which equation do you solve to find where')).toContain('5/x = x - 4');
  expect(Math.min(...SAMPLES.map((x) => Math.abs(5 / x)))).toBeGreaterThan(0); // 5/x is never 0
  // the points (1, 6), (2, 3), (3, 2): the product is always 6
  const pts: [number, number][] = [[1, 6], [2, 3], [3, 2]];
  expect(pts.every(([x, y]) => x * y === 6)).toBe(true);
  const fit = options('The points (1, 6), (2, 3) and (3, 2)');
  expect(fit.map((o) => o.text)).toEqual(['The curve y = 6/x', 'The curve y = 6/x^2', 'The line y = 7 - x']);
  expect(fit.map((o) => o.correct)).toEqual([true, false, false]);
  expect(fit[1].why).toContain(String(6 / 2 ** 2));
  expect(fit[2].why).toContain(`y = ${7 - 2}`);
  expect(6 / 1 ** 2).toBe(6); // the second option passes through (1, 6) but not (2, 3)
  expect(7 - 1).toBe(6);
  // spot the mistake
  const dan = fn(1, [X(-3, 2), X(1)]);
  expect(crosses(dan, 3)).toBe(false);
  expect(crosses(dan, -1)).toBe(true);
  expect(correctText('Dan says')).toContain('touches the axis at x = 3');
  expect(correctText('Dan says')).toContain('crosses only at x = -1');
  const prod = fn(1, [X(-2), X(3), X(4)])(0);
  expect(prod).toBe(-24);
  expect(-2 + 3 + 4).toBe(5); // what Meera added
  expect(correctText('Meera says')).toContain(`(-2)*3*4=${prod}`);
  expect(SAMPLES.every((x) => -3 / x ** 2 < 0)).toBe(true);
  expect(correctText('Sam says')).toContain('x squared is never negative');
  expect(correctText('Sam says')).toContain('both branches are below the x-axis');
});

test('the blanks in every "Now you finish it" are recomputed', () => {
  const g1 = [X(-4), X(1), X(3)]; // (x-4)(x+1)(x+3)
  const g2 = [X(1), X(-4, 2)]; // (x+1)(x-4)^2
  const g3 = [X(-1, 2), X(3), X(-4)]; // (x-1)^2(x+3)(x-4)
  const touch = (bs: Bracket[]) => bs.filter(([, , m]) => m % 2 === 0).map(([p, q]) => -q / p);
  const q5 = meetX((x) => 2 / x, (x) => x + 1).filter((v) => v > 0)[0];
  const expected = [
    ...[g1[0][1] * g1[1][1], yInt(1, g1)], // (-4)(1), then times 3
    ...[touch(g2)[0], yInt(1, g2)],
    ...[touch(g3)[0], yInt(1, g3)],
    ...[10 / 5, 10 / -2],
    ...[q5, q5 + 1],
    ...[54 / 3 ** 3, (54 / 3 ** 3) * 2 ** 3], // y proportional to x^3
  ].map(String);
  const blanks = [...SOURCE.matchAll(/class="blank" data-answers="([^"]*)"/g)].map((m) => m[1]);
  expect(blanks).toEqual(expected);
});

// ---------- every worked sketch: roots, crossing or touching, y-intercept, ends ----------
type Worked = { eq: string; k: number; bs: Bracket[] };
const WORKED: Worked[] = [
  { eq: '(x+2)(x-1)(x-3)', k: 1, bs: [X(2), X(-1), X(-3)] },
  { eq: '(x+3)(x-1)^2', k: 1, bs: [X(3), X(-1, 2)] },
  { eq: '(2-x)(x+1)^2', k: 1, bs: [B(-1, 2), X(1, 2)] },
  { eq: '(x-1)^3', k: 1, bs: [X(-1, 3)] },
  { eq: 'x(2x-1)(x+2)', k: 1, bs: [B(1, 0), B(2, -1), X(2)] },
  { eq: '(x+3)(x+1)(x-2)(x-4)', k: 1, bs: [X(3), X(1), X(-2), X(-4)] },
  { eq: '(x+2)^2(x-1)(x-3)', k: 1, bs: [X(2, 2), X(-1), X(-3)] },
  { eq: '(x+1)^2(x-2)^2', k: 1, bs: [X(1, 2), X(-2, 2)] },
];
test('every worked sketch states its roots, whether it crosses or touches, its y-intercept and its ends correctly', () => {
  const problems: string[] = [];
  for (const w of WORKED) {
    const start = SOURCE.indexOf(`Sketch {m:y=${w.eq}}`);
    if (start < 0) { problems.push(`no worked example for ${w.eq}`); continue; }
    const block = SOURCE.slice(start, SOURCE.indexOf('</div>', start));
    const f = fn(w.k, w.bs);
    if (!block.includes(`{m:(0, ${f(0)})}`)) problems.push(`${w.eq}: the y-intercept (0, ${f(0)}) is not stated`);
    for (const r of rootsOf(w.bs)) {
      const touches = !crosses(f, r);
      if (touches !== (mult(w.bs, r) % 2 === 0)) problems.push(`${w.eq}: the root ${r} multiplicity disagrees with the drawn behaviour`);
      if (!block.includes(`x=${r}`)) problems.push(`${w.eq}: the root x=${r} is not stated`);
    }
    // the ends stated in words match the leading coefficient and the degree
    const deg = sumMult(w.bs);
    const l = lead(w.k, w.bs);
    const stated = deg % 2 === 1 ? (l > 0 ? /bottom left and ends at the top right/ : /top left and ends at the bottom right/) : (l > 0 ? /Both ends go up/ : /Both ends go down/);
    if (!stated.test(block)) problems.push(`${w.eq}: the ends are not described as ${stated}`);
    if (ends(f) !== (deg % 2 === 1 ? (l > 0 ? 'The left end goes down and the right end goes up' : 'The left end goes up and the right end goes down') : (l > 0 ? 'Both ends go up' : 'Both ends go down'))) problems.push(`${w.eq}: the function's ends disagree with its leading term`);
  }
  expect(problems).toEqual([]);
  // x^3 - x^2 - 6x and x^4 - 4x^2
  expect(solve(pw6)).toEqual([-2, 0, 3]);
  expect(solve(horner([1, 0, -4, 0, 0]))).toEqual([-2, 0, 2]);
  expect(horner([1, -1, -6, 0])(0)).toBe(0);
});

// ---------- every calculation written as {m:a=b=c} ----------
function frac(s: string): string {
  let out = s;
  for (;;) {
    const i = out.indexOf('frac(');
    if (i < 0) return out;
    let depth = 0;
    let comma = -1;
    let end = -1;
    for (let k = i + 4; k < out.length; k += 1) {
      if (out[k] === '(') depth += 1;
      else if (out[k] === ')') { depth -= 1; if (depth === 0) { end = k; break; } } else if (out[k] === ',' && depth === 1) comma = k;
    }
    if (comma < 0 || end < 0) return '';
    out = `${out.slice(0, i)}((${out.slice(i + 5, comma)})/(${out.slice(comma + 1, end)}))${out.slice(end + 1)}`;
  }
}
function evalPiece(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;
  s = frac(s);
  s = s.replace(/\^/g, '**').replace(/\)\s*(?=[\d(])/g, ')*').replace(/(\d)\s*(?=\()/g, '$1*');
  if (!/^[\d\s.+\-*/()]*$/.test(s)) return null;
  try { return new Function(`return (${s});`)() as number; } catch { return null; }
}
test('every calculation {m:a=b=c} on the page is right', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const m of SOURCE.matchAll(/\{m:([^}]*)\}/g)) {
    if (!/=/.test(m[1])) continue;
    const pieces = m[1].split(/~=|=/).map((p) => p.trim());
    if (/^[a-z]$/.test(pieces[0])) pieces.shift(); // "y=frac(6, 2)=3": the name of the unknown is not a number
    if (pieces.length < 2) continue;
    const values = pieces.map(evalPiece);
    if (values.some((v) => v === null || !Number.isFinite(v))) continue;
    checked += 1;
    const nums = values as number[];
    if (Math.max(...nums) - Math.min(...nums) > 0.006) problems.push(`{m:${m[1]}} gives ${nums.join(' and ')}`);
  }
  expect(checked).toBeGreaterThan(80);
  expect(problems).toEqual([]);
});

// ---------- the pictures ----------
type Geom = { width: number; height: number; left: number; right: number; top: number; bottom: number; xmin: number; xmax: number; ymin: number; ymax: number };
type Fx = (x: number) => number;
/** What each picture is meant to show, written here from the page's own numbers (not read from the figure code). */
type Stated = { curves: { cls: string; f: Fx }[]; points: Record<string, [number, number]>; on: Record<string, number[]>; roots?: { x: number; cross: boolean; w?: [number, number] }[]; ends?: string; vlines?: Record<string, number>; hlines?: Record<string, number>; reciprocal?: number[] };
const poly = (k: number, bs: Bracket[]): Fx => fn(k, bs);
const STATED: Record<string, Stated> = {
  'graphs-polynomials-ends-odd': { curves: [{ cls: 'curve', f: (x) => x ** 3 }, { cls: 'curve-b', f: (x) => -(x ** 3) }], points: {}, on: {} },
  'graphs-polynomials-ends-even': { curves: [{ cls: 'curve', f: (x) => x ** 4 }, { cls: 'curve-b', f: (x) => -(x ** 4) }], points: {}, on: {} },
  'graphs-polynomials-cubic-three': { curves: [{ cls: 'curve', f: poly(1, [X(2), X(-1), X(-3)]) }], points: { r1: [-2, 0], r2: [1, 0], r3: [3, 0], yint: [0, 6] }, on: { r1: [0], r2: [0], r3: [0], yint: [0] }, roots: [{ x: -2, cross: true }, { x: 1, cross: true }, { x: 3, cross: true }], ends: 'The left end goes down and the right end goes up' },
  'graphs-polynomials-cubic-touch': { curves: [{ cls: 'curve', f: poly(1, [X(3), X(-1, 2)]) }], points: { cross: [-3, 0], touch: [1, 0], yint: [0, 3] }, on: { cross: [0], touch: [0], yint: [0] }, roots: [{ x: -3, cross: true }, { x: 1, cross: false }], ends: 'The left end goes down and the right end goes up' },
  'graphs-polynomials-cubic-negative': { curves: [{ cls: 'curve', f: poly(1, [B(-1, 2), X(1, 2)]) }], points: { touch: [-1, 0], cross: [2, 0], yint: [0, 2] }, on: { touch: [0], cross: [0], yint: [0] }, roots: [{ x: -1, cross: false }, { x: 2, cross: true }], ends: 'The left end goes up and the right end goes down' },
  'graphs-polynomials-cubic-triple': { curves: [{ cls: 'curve', f: poly(1, [X(-1, 3)]) }], points: { root: [1, 0], yint: [0, -1] }, on: { root: [0], yint: [0] }, roots: [{ x: 1, cross: true }], ends: 'The left end goes down and the right end goes up' },
  'graphs-polynomials-cubic-nonmonic': { curves: [{ cls: 'curve', f: poly(1, [B(1, 0), B(2, -1), X(2)]) }], points: { r1: [-2, 0], r2: [0, 0], r3: [0.5, 0] }, on: { r1: [0], r2: [0], r3: [0] }, roots: [{ x: -2, cross: true }, { x: 0, cross: true, w: [0.08, 0.2] }, { x: 0.5, cross: true, w: [0.08, 0.2] }], ends: 'The left end goes down and the right end goes up' },
  'graphs-polynomials-proportion-square': { curves: [{ cls: 'curve', f: (x) => 5 * x ** 2 }], points: { p1: [1, 5], n1: [-1, 5], p2: [2, 20] }, on: { p1: [0], n1: [0], p2: [0] } },
  'graphs-polynomials-proportion-root': { curves: [{ cls: 'curve', f: (x) => 3 * Math.sqrt(x) }], points: { p1: [1, 3], p4: [4, 6], p9: [9, 9] }, on: { p1: [0], p4: [0], p9: [0] } },
  'graphs-polynomials-quartic-four': { curves: [{ cls: 'curve', f: poly(1, [X(3), X(1), X(-2), X(-4)]) }], points: { r1: [-3, 0], r2: [-1, 0], r3: [2, 0], r4: [4, 0], yint: [0, 24] }, on: { r1: [0], r2: [0], r3: [0], r4: [0], yint: [0] }, roots: [{ x: -3, cross: true }, { x: -1, cross: true }, { x: 2, cross: true }, { x: 4, cross: true }], ends: 'Both ends go up' },
  'graphs-polynomials-quartic-double': { curves: [{ cls: 'curve', f: poly(1, [X(2, 2), X(-1), X(-3)]) }], points: { touch: [-2, 0], r2: [1, 0], r3: [3, 0], yint: [0, 12] }, on: { touch: [0], r2: [0], r3: [0], yint: [0] }, roots: [{ x: -2, cross: false }, { x: 1, cross: true }, { x: 3, cross: true }], ends: 'Both ends go up' },
  'graphs-polynomials-quartic-flat': { curves: [{ cls: 'curve', f: horner([1, 0, -4, 0, 0]) }], points: { r1: [-2, 0], origin: [0, 0], r3: [2, 0] }, on: { r1: [0], origin: [0], r3: [0] }, roots: [{ x: -2, cross: true }, { x: 0, cross: false }, { x: 2, cross: true }], ends: 'Both ends go up' },
  'graphs-polynomials-quartic-two': { curves: [{ cls: 'curve', f: poly(1, [X(1, 2), X(-2, 2)]) }], points: { t1: [-1, 0], t2: [2, 0], yint: [0, 4] }, on: { t1: [0], t2: [0], yint: [0] }, roots: [{ x: -1, cross: false }, { x: 2, cross: false }], ends: 'Both ends go up' },
  'graphs-polynomials-recip-pos': { curves: [{ cls: 'curve', f: (x) => 6 / x }], points: { p1: [1, 6], p2: [2, 3], p6: [6, 1], pn: [-2, -3] }, on: { p1: [0], p2: [0], p6: [0], pn: [0] }, vlines: { va: 0 }, hlines: { ha: 0 }, reciprocal: [6] },
  'graphs-polynomials-recip-neg': { curves: [{ cls: 'curve', f: (x) => -6 / x }], points: { p1: [-2, 3], p2: [2, -3] }, on: { p1: [0], p2: [0] }, vlines: { va: 0 }, hlines: { ha: 0 }, reciprocal: [-6] },
  'graphs-polynomials-recip-sq': { curves: [{ cls: 'curve', f: (x) => 4 / x ** 2 }], points: { p1: [1, 4], p2: [-1, 4], p3: [2, 1], p4: [-2, 1] }, on: { p1: [0], p2: [0], p3: [0], p4: [0] }, vlines: { va: 0 }, hlines: { ha: 0 } },
  'graphs-polynomials-meet-recip': { curves: [{ cls: 'curve', f: (x) => 6 / x }, { cls: 'curve-b', f: (x) => x + 1 }], points: { a: [2, 3], b: [-3, -2] }, on: { a: [0, 1], b: [0, 1] } },
  'graphs-polynomials-meet-cubic': { curves: [{ cls: 'curve', f: (x) => x ** 3 - 4 * x }, { cls: 'curve-b', f: (x) => -3 * x }], points: { a: [-1, 3], o: [0, 0], b: [1, -3] }, on: { a: [0, 1], o: [0, 1], b: [0, 1] } },
  'graphs-polynomials-meet-once': { curves: [{ cls: 'curve', f: (x) => 8 / x }, { cls: 'curve-b', f: (x) => x ** 2 }], points: { a: [2, 4] }, on: { a: [0, 1] } },
  'graphs-polynomials-flip-back': { curves: [{ cls: 'curve', f: poly(2, [X(1), X(-2, 2)]) }], points: { cross: [-1, 0], touch: [2, 0], yint: [0, 8] }, on: { cross: [0], touch: [0], yint: [0] }, roots: [{ x: -1, cross: true }, { x: 2, cross: false }], ends: 'The left end goes down and the right end goes up' },
  'graphs-polynomials-q-cubic': { curves: [{ cls: 'curve', f: qCubic }], points: { cross: [-2, 0], touch: [3, 0], yint: [0, -18] }, on: { cross: [0], touch: [0], yint: [0] }, roots: [{ x: -2, cross: true }, { x: 3, cross: false }], ends: 'The left end goes up and the right end goes down' },
  'graphs-polynomials-q-recip': { curves: [{ cls: 'curve', f: (x) => qRecipA / x }], points: { p: [3, -2] }, on: { p: [0] }, reciprocal: [qRecipA] },
};

/** Read the drawn geometry back from a figure's SVG: pixels to graph units by the axes the picture draws. */
function measure(svg: string, g: Geom) {
  const lines = [...svg.matchAll(/<line class="axis" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].map((m) => ({ x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] }));
  const horizontal = lines.find((l) => l.y1 === l.y2)!;
  const vertical = lines.find((l) => l.x1 === l.x2)!;
  // the left and right ends of the x-axis, and the bottom and top of the y-axis, are xmin, xmax, ymin and ymax
  const px = (x: number) => horizontal.x1 + ((x - g.xmin) / (g.xmax - g.xmin)) * (horizontal.x2 - horizontal.x1);
  const py = (y: number) => vertical.y1 + ((y - g.ymin) / (g.ymax - g.ymin)) * (vertical.y2 - vertical.y1);
  const toX = (p: number) => g.xmin + ((p - horizontal.x1) / (horizontal.x2 - horizontal.x1)) * (g.xmax - g.xmin);
  const toY = (p: number) => g.ymin + ((p - vertical.y1) / (vertical.y2 - vertical.y1)) * (g.ymax - g.ymin);
  const paths = [...svg.matchAll(/<path class="([^"]*)" d="([^"]*)"\/>/g)].map((m) => ({
    cls: m[1],
    pieces: m[2].split('M').filter(Boolean).map((piece) => piece.split('L').map((pt) => { const [a, b] = pt.trim().split(' ').map(Number); return [toX(a), toY(b)] as [number, number]; })),
  }));
  const circles = [...svg.matchAll(/<circle class="pt" data-name="([^"]*)" cx="([\d.-]+)" cy="([\d.-]+)" r="7"\/>/g)].map((m) => ({ name: m[1], px: +m[2], py: +m[3], x: toX(+m[2]), y: toY(+m[3]) }));
  const labels = [...svg.matchAll(/<text[^>]*data-for="([^"]*)" x="([\d.-]+)" y="([\d.-]+)" text-anchor="(\w+)">([\s\S]*?)<\/text>/g)].map((m) => ({ for: m[1], x: +m[2], y: +m[3], anchor: m[4], text: m[5].replace(/<[^>]+>/g, '').replace(/\u200b/g, '').replace(/\u2212/g, '-') }));
  return { horizontal, vertical, px, py, toX, toY, paths, circles, labels };
}

test('every curve is read back from its drawn path and is the function the page says it is', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/graphs-polynomials.mjs');
  expect(Object.keys(FIGURES).sort()).toEqual(Object.keys(STATED).sort());
  const problems: string[] = [];
  let points = 0;
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const g = (GEOM as Record<string, Geom>)[id];
    const st = STATED[id];
    const m = measure(svg, g);
    // the axes reach the edges of the picture: x runs from xmin to xmax and y from ymin to ymax, and the y-axis is at x = 0
    expect(m.horizontal.x1, id).toBeCloseTo(g.left, 0);
    expect(m.horizontal.x2, id).toBeCloseTo(g.width - g.right, 0);
    expect(m.vertical.y1, id).toBeCloseTo(g.height - g.bottom, 0); // the y-axis is drawn from ymin (the bottom) to ymax (the top)
    expect(m.vertical.y2, id).toBeCloseTo(g.top, 0);
    expect(m.vertical.x1, id).toBeCloseTo(m.px(0), 0);
    expect(m.horizontal.y1, id).toBeCloseTo(m.py(0), 0);
    expect(m.paths.map((p) => p.cls), `${id}: the curves, in order`).toEqual(st.curves.map((c) => c.cls));
    // each drawn point is on the function it is meant to be (a pixel is 1 / 40 of a unit or so, so allow 0.08 of the y range)
    m.paths.forEach((p, i) => {
      const tol = 0.012 * (g.ymax - g.ymin);
      let n = 0;
      for (const piece of p.pieces) for (const [x, y] of piece) { n += 1; if (Math.abs(y - st.curves[i].f(x)) > tol) problems.push(`${id}: curve ${i} is at (${x.toFixed(2)}, ${y.toFixed(2)}) but the function gives ${st.curves[i].f(x).toFixed(2)}`); }
      if (n < 100 && !st.reciprocal && !id.includes('recip-sq')) problems.push(`${id}: curve ${i} has only ${n} points`);
    });
    // marked points: where the table says, and on the curves the table says
    expect(m.circles.map((c) => c.name).sort(), `${id}: marked points`).toEqual(Object.keys(st.points).sort());
    for (const c of m.circles) {
      points += 1;
      const [wx, wy] = st.points[c.name];
      if (Math.abs(c.px - m.px(wx)) > 0.6 || Math.abs(c.py - m.py(wy)) > 0.6) problems.push(`${id}/${c.name}: drawn at (${c.x.toFixed(2)}, ${c.y.toFixed(2)}) not at (${wx}, ${wy})`);
      for (const k of st.on[c.name]) if (Math.abs(st.curves[k].f(wx) - wy) > 1e-9) problems.push(`${id}/${c.name}: (${wx}, ${wy}) is not on curve ${k}`);
    }
    // roots: cross or touch, read from the drawn path (the sign of y a little each side of the root)
    for (const r of st.roots ?? []) {
      const pts = m.paths[0].pieces.flat();
      const side = (lo: number, hi: number) => pts.filter(([x]) => x >= lo && x <= hi).map(([, y]) => sig(y));
      const [w0, w1] = r.w ?? [0.25, 0.6];
      const left = side(r.x - w1, r.x - w0);
      const right = side(r.x + w0, r.x + w1);
      expect(left.length * right.length, `${id}: points either side of ${r.x}`).toBeGreaterThan(0);
      const crossed = new Set(left).size === 1 && new Set(right).size === 1 && left[0] !== right[0];
      const touched = new Set([...left, ...right]).size === 1;
      if (r.cross && !crossed) problems.push(`${id}: the drawn curve does not cross at x=${r.x}`);
      if (!r.cross && !touched) problems.push(`${id}: the drawn curve does not touch at x=${r.x}`);
    }
    // the ends, from the first and last drawn points
    if (st.ends) {
      const pts = m.paths[0].pieces.flat();
      const l = sig(pts[0][1]);
      const r = sig(pts[pts.length - 1][1]);
      const drawn = l > 0 && r > 0 ? 'Both ends go up' : l < 0 && r < 0 ? 'Both ends go down' : l < 0 ? 'The left end goes down and the right end goes up' : 'The left end goes up and the right end goes down';
      if (drawn !== st.ends) problems.push(`${id}: the ends drawn are "${drawn}", expected "${st.ends}"`);
    }
    // reciprocal graphs: x * y is the constant a at every drawn point, no point is on an axis, and the curve has two branches
    if (st.reciprocal) {
      for (const [x, y] of m.paths[0].pieces.flat()) if (Math.abs(x * y - st.reciprocal[0]) > 0.04 * Math.max(1, Math.abs(st.reciprocal[0]))) problems.push(`${id}: x*y = ${(x * y).toFixed(2)} at x = ${x.toFixed(2)}`);
      expect(m.paths[0].pieces.length, `${id}: two branches`).toBeGreaterThanOrEqual(2);
      const signs = new Set(m.paths[0].pieces.map((pc) => sig(pc[0][0])));
      expect(signs.size, `${id}: one branch each side of the y-axis`).toBe(2);
    }
  }
  expect(points).toBeGreaterThan(40);
  expect(problems).toEqual([]);
});

test('where two graphs meet: every marked point is on both, and there are no other meeting points in the picture', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/graphs-polynomials.mjs');
  for (const id of ['graphs-polynomials-meet-recip', 'graphs-polynomials-meet-cubic', 'graphs-polynomials-meet-once']) {
    const st = STATED[id];
    (FIGURES as Record<string, () => string>)[id]();
    const g = (GEOM as Record<string, Geom>)[id];
    const xs = solve((x) => st.curves[0].f(x) - st.curves[1].f(x), g.xmin, g.xmax).filter((x) => st.curves[0].f(x) >= g.ymin && st.curves[0].f(x) <= g.ymax);
    expect(xs.map((x) => dp(x, 6)), id).toEqual(Object.values(st.points).map((p) => dp(p[0], 6)).sort((a, b) => Number(a) - Number(b)));
  }
});

test('every label says the coordinates of its own point, and is nearest its own item', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/graphs-polynomials.mjs');
  const problems: string[] = [];
  let labelled = 0;
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const g = (GEOM as Record<string, Geom>)[id];
    const st = STATED[id];
    const m = measure(svg, g);
    // the lines an asymptote label names: the axes
    const items: { name: string; at: (px: number, py: number) => number }[] = [
      ...m.circles.map((c) => ({ name: c.name, at: (qx: number, qy: number) => Math.hypot(qx - c.px, qy - c.py) })),
      ...Object.keys(st.vlines ?? {}).map((name) => ({ name, at: (qx: number) => Math.abs(qx - m.px(st.vlines![name])) })),
      ...Object.keys(st.hlines ?? {}).map((name) => ({ name, at: (_qx: number, qy: number) => Math.abs(qy - m.py(st.hlines![name])) })),
    ];
    for (const l of m.labels) {
      labelled += 1;
      const width = l.text.length * 13;
      const cx = l.x + (l.anchor === 'start' ? width / 2 : l.anchor === 'end' ? -width / 2 : 0);
      const cy = l.y - 8;
      const own = items.find((it) => it.name === l.for);
      if (!own) { problems.push(`${id}: label "${l.text}" names no item "${l.for}"`); continue; }
      const mine = own.at(cx, cy);
      // a coordinates label must not look like it belongs to another marked point; an asymptote label must not look like it belongs to anything else
      const rivals = st.points[l.for] ? items.filter((it) => it !== own && st.points[it.name]) : items.filter((it) => it !== own);
      for (const other of rivals) if (other.at(cx, cy) < mine) problems.push(`${id}: label "${l.text}" is ${Math.round(other.at(cx, cy))}px from "${other.name}" but ${Math.round(mine)}px from its own "${own.name}"`);
      if (st.points[l.for]) {
        const [x, y] = st.points[l.for];
        if (l.text !== `(${x}, ${y})`) problems.push(`${id}: the label "${l.text}" is not the coordinates (${x}, ${y}) of "${l.for}"`);
      } else if (!/^[xy] = 0$/.test(l.text)) problems.push(`${id}: the asymptote label "${l.text}" is not x = 0 or y = 0`);
      // a label never sits on a curve: the curve's drawn points stay out of the label's box
      const box = { x0: cx - width / 2 - 4, x1: cx + width / 2 + 4, y0: l.y - 26, y1: l.y + 8 };
      for (const [k, c] of st.curves.entries()) {
        for (let i = 0; i <= 1500; i += 1) {
          const x = g.xmin + ((g.xmax - g.xmin) * i) / 1500;
          const y = c.f(x);
          if (!Number.isFinite(y) || y < g.ymin || y > g.ymax) continue;
          const qx = m.px(x);
          const qy = m.py(y);
          if (qx > box.x0 && qx < box.x1 && qy > box.y0 && qy < box.y1) { problems.push(`${id}: label "${l.text}" sits on curve ${k} near x=${x.toFixed(2)}`); break; }
        }
      }
    }
    // every marked point and every asymptote has a label, except on the question pictures
    for (const name of [...Object.keys(st.points), ...Object.keys(st.vlines ?? {}), ...Object.keys(st.hlines ?? {})]) if (!m.labels.some((l) => l.for === name)) problems.push(`${id}: "${name}" has no label`);
  }
  expect(labelled).toBeGreaterThan(40);
  expect(problems).toEqual([]);
});

test('a question figure states every marked coordinate in its text alternative, and does not give the answer', async () => {
  const src = readFileSync(join(ROOT, 'src', 'book', 'alevel', 'figures', 'graphs-polynomials.mjs'), 'utf8');
  const descs = [...src.matchAll(/'(graphs-polynomials-q-[a-z]+)': \(\) => \{[\s\S]*?title: '((?:[^'\\]|\\.)*)',\s*desc: '((?:[^'\\]|\\.)*)'/g)];
  expect(descs.map((d) => d[1]).sort()).toEqual(['graphs-polynomials-q-cubic', 'graphs-polynomials-q-recip']);
  const { FIGURES, ITEMS } = await import('../src/book/alevel/figures/graphs-polynomials.mjs');
  for (const d of descs) {
    (FIGURES as Record<string, () => string>)[d[1]]();
    for (const it of (ITEMS as Record<string, { kind: string; x: number; y: number }[]>)[d[1]].filter((i) => i.kind === 'point')) expect(d[3], `${d[1]} names (${it.x}, ${it.y})`).toContain(`(${it.x}, ${it.y})`);
    expect(`${d[2]} ${d[3]}`, d[1]).not.toMatch(/equation|\bk\b|\ba = |minus 6|-6\/x|-\(x/i);
  }
  expect(SOURCE).toContain('{fig:graphs-polynomials-q-cubic}');
  expect(SOURCE).toContain('{fig:graphs-polynomials-q-recip}');
});

test('a format hint ("Type it like ...") never gives the key away', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const problems: string[] = [];
  let hints = 0;
  for (const q of questions()) {
    const m = /Type (?:it|them|your answers) like (.*?)\.?$/.exec(q.plain);
    if (!m || q.answers.length === 0) continue;
    hints += 1;
    if (matches(m[1], q.answers, q.mode)) problems.push(`"${m[1]}" is the key of: ${q.plain.slice(0, 60)}`);
  }
  expect(hints).toBeGreaterThan(10);
  expect(problems).toEqual([]);
});

test('at 320px every figure label is at least 12px tall', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/graphs-polynomials.html');
  const small = await page.evaluate(() => [...document.querySelectorAll('main svg.graph-svg text')].map((t) => ({ s: t.textContent, h: t.getBoundingClientRect().height })).filter((t) => t.h > 0 && t.h < 12).map((t) => t.s + ' ' + t.h.toFixed(1)));
  expect(small).toEqual([]);
});

test('every figure on the page exists, is used once, and every figure file entry is used', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/graphs-polynomials.mjs');
  const used = [...SOURCE.matchAll(/\{fig:([a-z0-9-]+)\}/g)].map((m) => m[1]);
  expect(new Set(used).size).toBe(used.length);
  expect([...used].sort()).toEqual(Object.keys(FIGURES).sort());
});

test('no figure text leaves its picture', async ({ page }) => {
  await page.goto('/courses/a-level/graphs-polynomials.html');
  const outside = await page.evaluate(() => {
    const out: string[] = [];
    for (const svg of document.querySelectorAll('main svg.graph-svg')) {
      const vb = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
      for (const t of svg.querySelectorAll('text')) {
        const b = (t as SVGGraphicsElement).getBBox();
        if (b.x < vb[0] - 0.5 || b.y < vb[1] - 0.5 || b.x + b.width > vb[2] + 0.5 || b.y + b.height > vb[3] + 0.5) out.push(`${svg.querySelector('title')?.textContent}: "${t.textContent}"`);
      }
    }
    return out;
  });
  expect(outside).toEqual([]);
});

test('the page keeps to its scope: no derivatives, no transformations of graphs', () => {
  const text = plain(SOURCE.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<p class="where-use">[\s\S]*?<\/p>/, ' '));
  expect(text).not.toMatch(/derivative|dy\/dx|stationary|translat|stretch|modulus|sin |cos |tan /i);
  // Differentiation is named once in the lessons, as the place the exact turning points come from
  expect((text.match(/Differentiation/g) ?? []).length).toBe(1);
  // a sketch needs no exact turning points: the page says so
  expect(text).toContain('A sketch does not need their exact position');
});

test('every numbered lesson section has a Key idea box and a faded "Now you finish it" example', () => {
  const lessons = SOURCE.split('<section').filter((sec) => /<h2>\d+\./.test(sec));
  expect(lessons.length).toBe(6);
  for (const sec of lessons) {
    const name = /<h2>([^<]*)<\/h2>/.exec(sec)?.[1];
    expect(sec, `${name}: a Key idea box`).toContain('class="key"');
    expect(sec, `${name}: a faded example`).toContain('class="worked faded"');
  }
});
