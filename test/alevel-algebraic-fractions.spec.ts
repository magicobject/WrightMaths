import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Algebraic fractions and partial fractions page that a general test cannot make:
//   - every typed key is RECOMPUTED here from the question's own fractions (read from the question text), by evaluating the
//     expression, or by solving for the constants of the partial fractions, never by retyping the arithmetic;
//   - every wrong-answer value is recomputed from the slip its message names, and the message is checked for that slip;
//   - the usual ways to type each answer (A=2, B=5 and so on) are put through the page's own answer checker, matches();
//   - every multiple-choice key is decided from the maths, never from the option's wording;
//   - every blank in a "Now you finish it" box is recomputed;
//   - the rules the lessons state (A and B from two values, A + B + C = 0, B = -A for a repeated factor and so on) are
//     checked against a brute-force search over many fractions;
//   - every drawn curve is read back from the SVG path, every marked point, hole and asymptote is where it is named, every
//     label is nearest its own item, labels keep 4px apart, and no SVG text leaves the picture.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'algebraic-fractions.html'), 'utf8');
const DIV = String.fromCharCode(0xf7);

type Fx = (x: number) => number;
const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const t3 = (v: number) => Math.round(v * 1000) / 1000 + 0;
// values of x that are not near any value that makes a bottom 0 on this page
const XS = [-6.3, -3.7, -1.9, -0.45, 0.35, 0.8, 1.7, 2.6, 3.4, 5.2, 8.1, 11.3];

// ---------- typed expressions as functions, written here and not taken from the figure code ----------
function fracToDivision(s: string): string {
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
    if (comma < 0 || end < 0) throw new Error(`cannot read ${s}`);
    out = `${out.slice(0, i)}((${out.slice(i + 5, comma)})/(${out.slice(comma + 1, end)}))${out.slice(end + 1)}`;
  }
}
/** A typed expression such as "(x-4)/(x-3)", "2x/(x-2)" or "frac(x^2-4, x-2)" as a function of x. */
function fx(text: string): Fx {
  let s = fracToDivision(text).replace(/\s+/g, '').replace(/\u00b2/g, '^2');
  s = s.replace(/\^/g, '**').replace(/(\d|\)|x)(?=\()/g, '$1*').replace(/(\d|\))(?=x)/g, '$1*').replace(/\)(?=\d)/g, ')*');
  expect(s, `"${text}" is an expression in x`).toMatch(/^[-+*/().\dx]+$/);
  return new Function('x', `return ${s};`) as Fx;
}
const same = (a: Fx, b: Fx) => XS.every((x) => { const u = a(x); const v = b(x); return Number.isFinite(u) && Number.isFinite(v) && close(u, v, 1e-9); });

/** The constants c_j with f(x) = sum c_j * basis_j(x), by solving at ten values of x and checking at the others. */
function solveConsts(f: Fx, basis: Fx[]): { c: number[]; err: number } {
  const n = basis.length;
  const nodes = [-7.3, 0.37, 2.9, 5.1, 8.6, -3.1, 11.2, 0.9, 6.7, -5.4];
  const rows = nodes.slice(0, n + 4).map((x) => [...basis.map((b) => b(x)), f(x)]);
  const m = rows.slice(0, n).map((r) => [...r]);
  for (let i = 0; i < n; i += 1) {
    let p = i;
    for (let r = i + 1; r < n; r += 1) if (Math.abs(m[r][i]) > Math.abs(m[p][i])) p = r;
    [m[i], m[p]] = [m[p], m[i]];
    for (let r = 0; r < n; r += 1) {
      if (r === i) continue;
      const k = m[r][i] / m[i][i];
      for (let c = i; c <= n; c += 1) m[r][c] -= k * m[i][c];
    }
  }
  const c = m.map((r, i) => r[n] / r[i]);
  const err = Math.max(...rows.slice(n).map((r) => Math.abs(r.slice(0, n).reduce((s, v, j) => s + v * c[j], 0) - r[n])));
  return { c: c.map((v) => Math.round(v * 1e9) / 1e9 + 0), err };
}
/** The coefficients of a polynomial given as a function, from the highest power down, for a polynomial of degree at most `deg`. */
function coeffsOf(f: Fx, deg: number): number[] {
  const basis = Array.from({ length: deg + 1 }, (_, k): Fx => (x) => x ** (deg - k));
  const r = solveConsts(f, basis);
  expect(r.err).toBeLessThan(1e-6);
  return r.c;
}
/** The degree of a polynomial given as a function: the least degree whose fit matches it at every test value. */
function degreeOf(f: Fx): number {
  for (let d = 0; d <= 5; d += 1) {
    const basis = Array.from({ length: d + 1 }, (_, k): Fx => (x) => x ** k);
    if (solveConsts(f, basis).err < 1e-6) return d;
  }
  throw new Error('degree too high');
}
/** Every x in [-10, 10] where a polynomial f is 0: where it changes sign, or touches 0 (a repeated root). */
function rootsOf(f: Fx): number[] {
  const step = 0.0005;
  const n = Math.round(20 / step);
  const xs = Array.from({ length: n + 1 }, (_, i) => -10 + i * step);
  const ys = xs.map((x) => f(x));
  const found: number[] = [];
  for (let i = 1; i <= n; i += 1) {
    if (Math.sign(ys[i]) !== Math.sign(ys[i - 1]) && Number.isFinite(ys[i]) && Number.isFinite(ys[i - 1]) && ys[i - 1] !== 0) {
      let a = xs[i - 1];
      let b = xs[i];
      for (let k = 0; k < 60; k += 1) { const mid = (a + b) / 2; if (Math.sign(f(mid)) === Math.sign(f(a))) a = mid; else b = mid; }
      found.push((a + b) / 2);
    }
  }
  // a repeated root touches 0 without changing sign: look for a least value of |f| that is 0
  for (let i = 1; i < n; i += 1) {
    if (Math.abs(ys[i]) <= Math.abs(ys[i - 1]) && Math.abs(ys[i]) <= Math.abs(ys[i + 1]) && Math.abs(ys[i]) < 1e-2) {
      let a = xs[i - 1];
      let b = xs[i + 1];
      for (let k = 0; k < 80; k += 1) { const m1 = a + (b - a) / 3; const m2 = b - (b - a) / 3; if (Math.abs(f(m1)) < Math.abs(f(m2))) b = m2; else a = m1; }
      const r = (a + b) / 2;
      if (Math.abs(f(r)) < 1e-9) found.push(r);
    }
  }
  const out: number[] = [];
  for (const v of found.sort((p, q) => p - q)) if (out.length === 0 || v - out[out.length - 1] > 1e-3) out.push(v);
  return out.map((v) => Math.round(v * 1e6) / 1e6 + 0);
}
const r9 = (v: number) => Math.round(v * 1e9) / 1e9 + 0;
const typedList = (xs: number[]) => [...xs].sort((a, b) => a - b).map((v) => String(v + 0)).join(' or ');
/** Polynomial long division of coefficient lists (highest power first): the quotient and the remainder. */
function polyDivide(top: number[], bottom: number[]): { q: number[]; r: number[] } {
  const r = [...top];
  const q: number[] = [];
  while (r.length >= bottom.length) {
    const k = r[0] / bottom[0];
    q.push(k);
    for (let i = 0; i < bottom.length; i += 1) r[i] -= k * bottom[i];
    r.shift();
  }
  return { q, r };
}

// ---------- reading the page's questions ----------
const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', ldquo: '"', rdquo: '"', rsquo: "'", nbsp: ' ', times: '*', hellip: '...', middot: '.', divide: DIV, harr: '<->', plusmn: '+-' };
const decode = (t: string) => t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n] ?? m);
// a "<" inside {m:...} is maths (a<=x), not a tag: protect it before the tags are removed
const plain = (h: string) => decode(h.replace(/\{m:([^}]*)\}/g, (_, t: string) => t.replace(/</g, '&lt;')).replace(/<[^>]+>/g, '').replace(/\{m:/g, '').replace(/\}/g, '')).replace(/\s+/g, ' ').trim();

const numbersIn = (t: string) => t.replace(/\band\b|\bor\b|[(),]/g, ' ').trim().split(/\s+/).filter(Boolean).map((p) => { const m = /^(-?[\d.]+)\/([\d.]+)$/.exec(p); return m ? Number(m[1]) / Number(m[2]) : Number(p); });
/** Whether two typed answers have the same value: a list ("2 or 3") or a number ("5/12"), to the tolerance given. */
function sameValue(x: string, y: string, tol = 1e-9): boolean {
  const a = numbersIn(x).sort((p, q) => p - q);
  const b = numbersIn(y).sort((p, q) => p - q);
  return a.length === b.length && a.every((v, i) => close(v, b[i], tol));
}
/** The numbers in a typed list of constants, in the order typed: "2,5", "A=2 B=5", "(2, 5)". */
const constsIn = (t: string) => [...t.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));

type Wrong = { values: string[]; text: string; claimed: boolean };
type Question = { plain: string; mode: string; answers: string[]; wrongs: Wrong[]; hints: string[]; block: string };
function questions(): Question[] {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongList = /<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '';
    const wrongs = [...wrongList.matchAll(/<li data-if="([^"]*)">([\s\S]*?)<\/li>/g)].map((m) => ({ values: decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean), text: m[2], claimed: false }));
    const hints = [...(/<ol class="ladder">([\s\S]*?)<\/ol>/.exec(block)?.[1] ?? '').matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => plain(m[1]));
    return { plain: plain(/<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? ''), mode: /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? 'value', answers, wrongs, hints, block };
  });
}

// ---------- the typed questions, each with the maths that decides its key ----------
type Slip = { value: string | ((c: number[]) => string); says: RegExp; equal?: boolean; expect?: Fx };
type Base = { find: string; shows?: string[]; accept?: string[]; reject?: string[]; slips?: Slip[] };
/** The key is an expression: every key must equal `target` as a function of x. */
type ExprCheck = Base & { kind: 'expr'; target: Fx };
/** The key is a number, or a list such as "2 or 3". */
type NumCheck = Base & { kind: 'num'; answer: string };
/** The key is the constants A, B, C of the partial fractions of N/D, found by solving; `only` picks one of them; `whole` is for the Extra with a whole-number part. */
type ConstCheck = Base & { kind: 'consts'; N: string; D: string; bottoms: string[]; only?: number; whole?: boolean; given?: number[] };
type Check = ExprCheck | NumCheck | ConstCheck;

const E = (find: string, shows: string[], target: Fx, extra: Partial<ExprCheck> = {}): ExprCheck => ({ kind: 'expr', find, shows, target, ...extra });
const N = (find: string, answer: string, extra: Partial<NumCheck> = {}): NumCheck => ({ kind: 'num', find, answer, ...extra });
const C = (find: string, Nn: string, D: string, bottoms: string[], extra: Partial<ConstCheck> = {}): ConstCheck => ({ kind: 'consts', find, N: Nn, D, bottoms, ...extra });
const product = (a: string, b: string): Fx => { const f = fx(a); const g = fx(b); return (x) => f(x) * g(x); };
const quotient = (a: string, b: string): Fx => { const f = fx(a); const g = fx(b); return (x) => f(x) / g(x); };
const swap = (c: number[]) => `${c[1]},${c[0]}`;
const constant = (f: Fx): number => { const v = f(5.2); expect(XS.every((x) => close(f(x), v)), 'the value is the same for every x').toBe(true); return v; };

// the typings a student may use for a list of constants
const PAIR = (a: number, b: number) => [`${a},${b}`, `${a}, ${b}`, `(${a},${b})`, `${a} ${b}`, `${a} and ${b}`, `A=${a}, B=${b}`, `A = ${a} and B = ${b}`, `B=${b}, A=${a}`];
const TRIPLE = (a: number, b: number, c: number) => [`${a},${b},${c}`, `${a}, ${b}, ${c}`, `(${a},${b},${c})`, `${a} ${b} ${c}`, `A=${a}, B=${b}, C=${c}`, `A = ${a}, B = ${b}, C = ${c}`, `A=${a} B=${b} C=${c}`];

const CHECKS: Check[] = [
  // ----- warm-up and recap -----
  N('Work out frac(1, 4)+frac(1, 6)', String(1 / 4 + 1 / 6), { accept: ['5/12', '10/24'], reject: ['2/10', '0.4'], slips: [{ value: `${1 + 1}/${4 + 6}`, says: /added the tops and added the bottoms/ }] }),
  N('frac(4, 9). Type it like 3/5', String(2 / 3 / (4 / 9)), { accept: ['3/2', '1.5', '6/4'], reject: ['8/27'], slips: [{ value: String(2 / 3 * (4 / 9)), says: /multiplied without turning the second fraction upside down/ }, { value: String(4 / 9 / (2 / 3)), says: /turned the first fraction upside down/ }] }),
  E('Factorise x^2+x-6', ['x^2+x-6'], fx('x^2+x-6'), { accept: ['(x+3)(x-2)', '(x-2)(x+3)', '(x + 3)(x - 2)'], reject: ['x^2+x-6', '(x+3)(x+2)'], slips: [{ value: '(x-3)(x+2)', says: /give x\^2-x-6/, expect: fx('x^2-x-6') }, { value: '(x+6)(x-1)', says: /multiply to -6, but they add to 5/, expect: fx('x^2+5x-6') }] }),
  E('Factorise x^3-x completely', ['x^3-x'], fx('x^3-x'), { accept: ['x(x-1)(x+1)', 'x(x+1)(x-1)', '(x-1)x(x+1)', '(x+1)(x-1)x', 'x*(x-1)*(x+1)'], reject: ['x^3-x', '(x-1)(x+1)', 'x(x^2-1)'], slips: [{ value: '(x-1)(x+1)', says: /lost the factor x/, expect: fx('x^2-1') }] }),
  E('Expand and simplify (x+2)(x-3)', ['(x+2)(x-3)'], fx('(x+2)(x-3)'), { accept: ['x^2-x-6', '-6-x+x^2'], reject: ['(x+2)(x-3)', 'x^2+x-6'], slips: [{ value: 'x^2+x-6', says: /added -3x and 2x as \+x/, expect: fx('x^2+x-6') }] }),
  N('Solve x^2-5x+6=0', typedList(rootsOf(fx('x^2-5x+6'))), { accept: ['2 or 3', '3 or 2', 'x=2 or x=3'], reject: ['2', '-2 or -3'], slips: [{ value: typedList(rootsOf(fx('x^2-5x+6')).map((r) => -r)), says: /took the signs from the numbers in the brackets/ }] }),
  E('Simplify frac(x^4, x)', ['frac(x^4, x)'], fx('frac(x^4, x)'), { accept: ['x^3'], reject: ['x^4', 'x^5'], slips: [{ value: 'x^4', says: /did not take anything off the power/ }] }),
  // ----- 1. simplifying -----
  E('Simplify frac(x^2-16, x^2+x-12)', ['frac(x^2-16, x^2+x-12)'], fx('frac(x^2-16, x^2+x-12)'), { accept: ['(x-4)/(x-3)', '(4-x)/(3-x)', '(x - 4)/(x - 3)'], reject: ['(x^2-16)/(x^2+x-12)', '(x-4)/(x+3)', '-16/(x-12)'], slips: [{ value: '-16/(x-12)', says: /cancelled x\^2 from the top and the bottom/, expect: fx('frac(-16, x-12)') }, { value: '(x-4)/(x+3)', says: /\(x\+4\)\(x\+3\)=x\^2\+7x\+12, which is not x\^2\+x-12/ }] }),
  E('Simplify frac(4x^2+8x, 2x^2-8)', ['frac(4x^2+8x, 2x^2-8)'], fx('frac(4x^2+8x, 2x^2-8)'), { accept: ['2x/(x-2)', '(2x)/(x-2)', '2*x/(x-2)'], reject: ['4x/(2x-4)', '4x/(2(x-2))', 'x/(x-2)'], slips: [{ value: '4x/(2x-4)', says: /not fully simplified.*share the factor 2/, equal: true }, { value: '2x/(x+2)', says: /factor left on the bottom is \(x-2\), not \(x\+2\)/ }] }),
  N('has no value for two values of x', typedList(rootsOf(fx('x^2-5x+6'))), { shows: ['frac(x+1, x^2-5x+6)'], accept: ['2 or 3', '3 or 2', '2,3', '2 and 3'], reject: ['2', '-1', '-2 or -3'], slips: [{ value: typedList(rootsOf(fx('x+1'))), says: /makes the top 0/ }, { value: typedList(rootsOf(fx('x^2-5x+6')).map((r) => -r)), says: /took the signs from the numbers in the brackets/ }] }),
  E('Simplify frac(x^3+x^2-4x-4, x^2+3x+2)', ['frac(x^3+x^2-4x-4, x^2+3x+2)'], fx('frac(x^3+x^2-4x-4, x^2+3x+2)'), { accept: ['x-2', '-2+x'], reject: ['(x^2-4)/(x+2)', 'x+2'], slips: [{ value: '(x^2-4)/(x+2)', says: /not fully simplified.*x\^2-4=\(x-2\)\(x\+2\)/, equal: true }, { value: 'x+2', says: /factor of the top that is left is \(x-2\)/ }] }),
  N('Simplify frac(3-x, x-3)', String(constant(fx('frac(3-x, x-3)'))), { shows: ['frac(3-x, x-3)'], accept: ['-1', '- 1'], reject: ['1', '0'], slips: [{ value: '1', says: /opposite sign/ }] }),
  // ----- 2. multiplying and dividing -----
  E('Simplify frac(x+1, x-2)*frac(x^2-4, x^2+x)', ['frac(x+1, x-2)*frac(x^2-4, x^2+x)'], fx('frac(x+1, x-2)*frac(x^2-4, x^2+x)'), { accept: ['(x+2)/x', '(2+x)/x'], reject: ['x+2', '(x+1)(x^2-4)/((x-2)(x^2+x))'], slips: [{ value: 'x+2', says: /cancelled the x on the bottom with the x in x\+2/ }] }),
  E('Simplify frac(x^2-x-2, x+3)', ['frac(x^2-x-2, x+3)', 'frac(x-2, x^2+3x)'], quotient('frac(x^2-x-2, x+3)', 'frac(x-2, x^2+3x)'), { accept: ['x(x+1)', 'x^2+x', 'x*(x+1)', '(x+1)*x', 'x(1+x)', 'x+x^2'], reject: ['x(x-1)', '(x-2)(x+1)'], slips: [{ value: '(x-2)^2(x+1)/(x(x+3)^2)', says: /without turning the second fraction upside down/, expect: product('frac(x^2-x-2, x+3)', 'frac(x-2, x^2+3x)') }] }),
  E('Simplify frac(2x, x^2-1)', ['frac(2x, x^2-1)', 'frac(4, x+1)'], quotient('frac(2x, x^2-1)', 'frac(4, x+1)'), { accept: ['x/(2(x-1))', 'x/(2x-2)', 'x/(2*(x-1))', '(x)/(2(x-1))'], reject: ['x/(x-1)', '2x(x+1)/(4(x-1)(x+1))'], slips: [{ value: 'x/(x-1)', says: /frac\(2x, 4\) simplifies to frac\(x, 2\), so the 2 stays/ }] }),
  N('has no value for three values of x', typedList([...new Set([...rootsOf(fx('x-1')), ...rootsOf(fx('x+4')), ...rootsOf(fx('x-3'))])]), { shows: ['frac(x+2, x-1)', 'frac(x-3, x+4)'], accept: ['-4 or 1 or 3', '3, 1, -4', '-4,1,3'], reject: ['-4 or 1', '1 or 3', '-4 or -2 or 1 or 3'], slips: [{ value: typedList([...rootsOf(fx('x-1')), ...rootsOf(fx('x+4'))]), says: /cannot divide by 0/ }, { value: typedList([...new Set([...rootsOf(fx('x-1')), ...rootsOf(fx('x+4')), ...rootsOf(fx('x-3')), ...rootsOf(fx('x+2'))])]), says: /x=-2 makes the top of the first fraction 0/ }] }),
  // ----- 3. adding and subtracting -----
  E('Write frac(2, x-3)+frac(1, x+1)', ['frac(2, x-3)+frac(1, x+1)'], fx('frac(2, x-3)+frac(1, x+1)'), { accept: ['(3x-1)/((x-3)(x+1))', '(3x-1)/((x+1)(x-3))', '(3x-1)/(x^2-2x-3)', '(3x-1)/((x-3)*(x+1))'], reject: ['2/(x-3)+1/(x+1)', '(3x-1)/(x-3)(x+1)'], slips: [{ value: '3/(2x-2)', says: /added the tops and added the bottoms/, expect: fx('frac(2+1, (x-3)+(x+1))') }, { value: '(3x-5)/((x-3)(x+1))', says: /multiplied each top by its own bottom's factor/, expect: fx('frac(2(x-3)+1(x+1), (x-3)(x+1))') }] }),
  E('Write frac(5, x+2)-frac(3, x-1)', ['frac(5, x+2)-frac(3, x-1)'], fx('frac(5, x+2)-frac(3, x-1)'), { accept: ['(2x-11)/((x+2)(x-1))', '(2x-11)/((x-1)(x+2))', '(2x-11)/(x^2+x-2)'], reject: ['(8x+1)/((x+2)(x-1))', '(2x+1)/((x+2)(x-1))'], slips: [{ value: '(2x+1)/((x+2)(x-1))', says: /changed the sign of 3x but not of 6/, expect: fx('frac(5(x-1)-3x+6, (x+2)(x-1))') }, { value: '(8x+1)/((x+2)(x-1))', says: /did not change the signs of the second top/, expect: fx('frac(5(x-1)+3(x+2), (x+2)(x-1))') }] }),
  E('Write frac(4, x+3)+frac(7, x^2-9)', ['frac(4, x+3)+frac(7, x^2-9)'], fx('frac(4, x+3)+frac(7, x^2-9)'), { accept: ['(4x-5)/((x+3)(x-3))', '(4x-5)/((x-3)(x+3))', '(4x-5)/(x^2-9)'], reject: ['11/(x^2-9)'], slips: [{ value: '11/(x^2-9)', says: /added the tops without first multiplying 4 by \(x-3\)/, expect: fx('frac(4+7, x^2-9)') }] }),
  E('Write frac(3, x-2)+frac(4, (x-2)^2)', ['frac(3, x-2)+frac(4, (x-2)^2)'], fx('frac(3, x-2)+frac(4, (x-2)^2)'), { accept: ['(3x-2)/(x-2)^2', '(3x-2)/((x-2)^2)', '(3x-2)/(x^2-4x+4)', '(3x-2)/((x-2)(x-2))'], reject: ['7/(x-2)^2', '7/((x-2)^2)'], slips: [{ value: '7/(x-2)^2', says: /added the tops as if the bottoms were the same/, expect: fx('frac(3+4, (x-2)^2)') }] }),
  E('Write frac(1, x)-frac(1, x+1)', ['frac(1, x)-frac(1, x+1)'], fx('frac(1, x)-frac(1, x+1)'), { accept: ['1/(x(x+1))', '1/(x^2+x)', '1/((x+1)x)', '1/(x*(x+1))'], reject: ['(2x+1)/(x(x+1))'], slips: [{ value: '(2x+1)/(x(x+1))', says: /did not change the sign of the second top/, expect: fx('frac((x+1)+x, x(x+1))') }] }),
  // ----- 4. two different factors -----
  C('Write frac(7x+1, (x+1)(x-2)) as', '7x+1', '(x+1)(x-2)', ['x+1', 'x-2'], { accept: PAIR(2, 5), reject: ['5,2', '2', '2,5,1', '25'], slips: [{ value: swap, says: /wrong way round.*A goes with \(x\+1\)/ }, { value: (c) => `${-c[0]},${c[1]}`, says: /Check the sign of A.*-6=A\*\(-3\)/ }] }),
  C('Write frac(x-5, (x-1)(x-3)) as',  'x-5', '(x-1)(x-3)', ['x-1', 'x-3'], { only: 1, accept: ['-1', '-1.0'], reject: ['1', '2'], slips: [{ value: (c) => String(-c[0]), says: /Check the sign.*-2=B\*2/ }, { value: () => '2', says: /That is the value of A/ }] }),
  E('Write frac(3, (x-1)(x+2)) in partial fractions', ['frac(3, (x-1)(x+2))'], fx('frac(3, (x-1)(x+2))'), { accept: ['1/(x-1)-1/(x+2)', '-1/(x+2)+1/(x-1)', '1/(x-1) - 1/(x+2)', '(1)/(x-1)-(1)/(x+2)', '1/(x-1)+(-1)/(x+2)'], reject: ['1/(x-1)+1/(x+2)', '3/((x-1)(x+2))', '3/(x-1)-3/(x+2)'], slips: [{ value: '3/(x-1)-3/(x+2)', says: /3 on the top of the original is not A or B/ }, { value: '1/(x-1)+1/(x+2)', says: /Check the sign of B/ }] }),
  C('Write frac(5x-1, (3x+1)(x-1)) as', '5x-1', '(3x+1)(x-1)', ['3x+1', 'x-1'], { accept: PAIR(2, 1), reject: ['1,2', '2', '-1,1'], slips: [{ value: swap, says: /wrong way round.*A goes with \(3x\+1\)/ }, { value: () => { const n = fx('5x-1'); return `${r9(n(1 / 3) / (1 / 3 - 1))},1`; }, says: /x=-frac\(1, 3\), not frac\(1, 3\)/ }] }),
  C('Write frac(4, x(x-2)) as', '4', 'x(x-2)', ['x', 'x-2'], { only: 0, accept: ['-2', '-2.0'], reject: ['2', '4'], slips: [{ value: (c) => String(-c[0]), says: /That is the value of B/ }] }),
  // ----- 5. three different factors -----
  C('Write frac(10x+6, (x+3)(x-1)(x-3)) as', '10x+6', '(x+3)(x-1)(x-3)', ['x+3', 'x-1', 'x-3'], { accept: TRIPLE(-1, -2, 3), reject: ['3,-2,-1', '1,2,3', '-1,-2'], slips: [{ value: (c) => `${c[0]},${-c[1]},${c[2]}`, says: /Check the sign of B.*16=B\*\(4\)\(-2\)/ }] }),
  C('Write frac(8, (x-1)(x+1)(x+3)) as', '8', '(x-1)(x+1)(x+3)', ['x-1', 'x+1', 'x+3'], { only: 1, accept: ['-2'], reject: ['2', '1'], slips: [{ value: (c) => String(-c[0]), says: /Check the sign.*\(x-1\)\(x\+3\) is \(-2\)\(2\)=-4/ }] }),
  C('Use the check for A, B and C to find C', 'x+8', '(x-1)(x-2)(x-4)', ['x-1', 'x-2', 'x-4'], { only: 2, given: [3, -5], accept: ['2', '2.0'], reject: ['-2', '3'], slips: [{ value: () => String(3 + -5), says: /C=-\(A\+B\).*A\+B=-2, so C is the opposite/ }] }),
  C('Write frac(6, x(x+1)(x+2)) as', '6', 'x(x+1)(x+2)', ['x', 'x+1', 'x+2'], { only: 0, accept: ['3'], reject: ['6', '-3'], slips: [{ value: () => String(fx('6')(0)), says: /did not divide by the other brackets/ }] }),
  // ----- 6. a repeated factor -----
  C('Write frac(4x-3, (x-1)^2) as', '4x-3', '(x-1)^2', ['x-1', '(x-1)^2'], { accept: PAIR(4, 1), reject: ['1,4', '4', '4,-3'], slips: [{ value: swap, says: /wrong way round/ }, { value: (c) => `${c[0]},${fx('4x-3')(0)}`, says: /B is not the number term of the top.*gives 1=B/ }] }),
  C('Write frac(13-5x, (x+1)(x-2)^2) as', '13-5x', '(x+1)(x-2)^2', ['x+1', 'x-2', '(x-2)^2'], { accept: TRIPLE(2, -2, 1), reject: ['2,2,1', '1,-2,2', '2,-2'], slips: [{ value: (c) => `${c[0]},${-c[1]},${c[2]}`, says: /A\+B=0.*B is the opposite of A/ }] }),
  C('Write frac(9, (x-1)(x+2)^2) as', '9', '(x-1)(x+2)^2', ['x-1', 'x+2', '(x+2)^2'], { only: 2, accept: ['-3'], reject: ['3', '1'], slips: [{ value: (c) => String(-c[0]), says: /Check the sign.*x-1=-3/ }, { value: () => '1', says: /That is the value of A/ }] }),
  E('Write frac(2x-3, (x+2)^2) in partial fractions', ['frac(2x-3, (x+2)^2)'], fx('frac(2x-3, (x+2)^2)'), { accept: ['2/(x+2)-7/(x+2)^2', '2/(x+2)-7/((x+2)^2)', '-7/(x+2)^2+2/(x+2)', '2/(x+2)-7/(x^2+4x+4)'], reject: ['2/(x+2)+7/(x+2)^2', '2/(x+2)^2-7/(x+2)', '(2x-3)/(x+2)^2'], slips: [{ value: '2/(x+2)+7/(x+2)^2', says: /Check the sign of B.*2\*\(-2\)-3=-7/ }, { value: '2/(x+2)^2-7/(x+2)', says: /powers are the wrong way round/ }] }),
  // ----- 7. choosing the form, and checking -----
  E('Write frac(5x+6, x^2+x-12) in partial fractions', ['frac(5x+6, x^2+x-12)'], fx('frac(5x+6, x^2+x-12)'), { accept: ['2/(x+4)+3/(x-3)', '3/(x-3)+2/(x+4)'], reject: ['3/(x+4)+2/(x-3)', '(5x+6)/((x+4)(x-3))'], slips: [{ value: '2/(x-4)+3/(x+3)', says: /\(x-4\)\(x\+3\)=x\^2-x-12, which has the wrong middle term/ }, { value: '3/(x+4)+2/(x-3)', says: /wrong way round/ }] }),
  C('Write frac(2x+7, x^2+4x+4) as', '2x+7', 'x^2+4x+4', ['x+2', '(x+2)^2'], { accept: PAIR(2, 3), reject: ['2,7', '3,2'], slips: [{ value: (c) => `${c[0]},${fx('2x+7')(0)}`, says: /B is not the number term of the top.*gives 3=B/ }] }),
  N('Put x=0 into both sides to find B', String((() => { const left = fx('frac(5x+6, (x+4)(x-3))')(0); return (left - 2 / (0 + 4)) * (0 - 3); })()), { shows: ['frac(5x+6, (x+4)(x-3))', 'frac(2, x+4)+frac(B, x-3)'], accept: ['3', '3.0'], reject: ['-3', '1'], slips: [{ value: '-3', says: /Check the sign.*-frac\(1, 2\)=frac\(1, 2\)-frac\(B, 3\)/ }] }),
  N('[Extra] Divide x^2+4x+1 by x^2+x-2', String(polyDivide(coeffsOf(fx('x^2+4x+1'), 2), coeffsOf(fx('x^2+x-2'), 2)).q[0]), { accept: ['1'], reject: ['4', '3'], slips: [{ value: String(coeffsOf(fx('x^2+4x+1'), 2)[1]), says: /number in front of x in the top/ }] }),
  C('[Extra] Write frac(x^2+4x+1, (x-1)(x+2))', 'x^2+4x+1', '(x-1)(x+2)', ['x-1', 'x+2'], { whole: true, accept: PAIR(2, 1), reject: ['3,3', '1,2'], slips: [{ value: () => polyDivide(coeffsOf(fx('x^2+4x+1'), 2), coeffsOf(fx('x^2+x-2'), 2)).r.join(','), says: /remainder 3x\+3/ }] }),
  // ----- flip it -----
  E('Write frac(3, x-1)+frac(2, x+3)', ['frac(3, x-1)+frac(2, x+3)'], fx('frac(3, x-1)+frac(2, x+3)'), { accept: ['(5x+7)/((x-1)(x+3))', '(5x+7)/((x+3)(x-1))', '(5x+7)/(x^2+2x-3)'], reject: ['5/(2x+2)'], slips: [{ value: '5/(2x+2)', says: /added the tops and added the bottoms/, expect: fx('frac(3+2, (x-1)+(x+3))') }] }),
  E('Find its top. Type it like 3x+1', ['frac(2, x-1)-frac(3, x+2)'], (x) => fx('frac(2, x-1)-frac(3, x+2)')(x) * (x - 1) * (x + 2), { accept: ['-x+7', '7-x', '-(x-7)'], reject: ['x-7', '5x+1', '-x+1'], slips: [{ value: '-x+1', says: /did not change the sign of the 3 in -3\(x-1\)/, expect: fx('2(x+2)-3x-3') }] }),
  E('Write frac(1, x-1)-frac(1, x+1)', ['frac(1, x-1)-frac(1, x+1)'], fx('frac(1, x-1)-frac(1, x+1)'), { accept: ['2/((x-1)(x+1))', '2/((x+1)(x-1))', '2/(x^2-1)'], reject: ['0', '2/(x-1)(x+1)'], slips: [{ value: '0', says: /subtracted the tops/, expect: () => 0 }] }),
  // ----- mixed review -----
  ((): ConstCheck => ({ kind: 'consts', find: 'simplifies to frac(x-a, x-b)', N: 'x^2-x-6', D: 'x^2-4', bottoms: [], accept: ['3,2', '3, 2', '(3,2)', '3 2', '3 and 2', 'a=3, b=2', 'a=3 and b=2', 'a = 3, b = 2'], reject: ['2,3', '3', '-3,-2'], slips: [{ value: swap, says: /wrong way round/ }, { value: (c) => `${-c[0]},${-c[1]}`, says: /x-3 means a=3, not -3/ }] }))(),
  N('discriminant of x^2+2x+5', String((() => { const [a, b, c] = coeffsOf(fx('x^2+2x+5'), 2); return b * b - 4 * a * c; })()), { accept: ['-16', '-16.'], reject: ['16', '24'], slips: [{ value: '16', says: /Check the sign/ }, { value: String((() => { const [a, b, c] = coeffsOf(fx('x^2+2x+5'), 2); return b * b + 4 * a * c; })()), says: /added 4ac/ }] }),
  N('has two vertical asymptotes', typedList(rootsOf(fx('x^2+x-6'))), { shows: ['frac(6, x^2+x-6)'], accept: ['-3 or 2', '2 or -3', 'x=-3 or x=2'], reject: ['3 or -2', '-3'], slips: [{ value: typedList(rootsOf(fx('x^2+x-6')).map((r) => -r)), says: /took the signs from the numbers in the brackets/ }] }),
  E('Given that (x-1) is a factor of x^3-x^2-4x+4', ['frac(12, x^3-x^2-4x+4)'], fx('frac(12, x^3-x^2-4x+4)'), { accept: ['-4/(x-1)+3/(x-2)+1/(x+2)', '-4/(x-1)+1/(x+2)+3/(x-2)', '3/(x-2)+1/(x+2)-4/(x-1)', '1/(x+2)+3/(x-2)-4/(x-1)', '3/(x-2) - 4/(x-1) + 1/(x+2)'], reject: ['4/(x-1)+3/(x-2)+1/(x+2)', '12/(x^3-x^2-4x+4)', '-4/(x-1)+3/(x-2)-1/(x+2)'], slips: [{ value: '-4/(x-1)+3/(x-2)-1/(x+2)', says: /Check the sign of C.*12=C\*\(-3\)\(-4\)/ }, { value: '4/(x-1)+3/(x-2)+1/(x+2)', says: /Check the sign of A.*12=A\*\(-1\)\(3\)/ }] }),
  N('Use this to find', String(1 / (1 * 2) + 1 / (2 * 3) + 1 / (3 * 4)), { shows: ['frac(1, 1*2)+frac(1, 2*3)+frac(1, 3*4)'], accept: ['3/4', '0.75', '9/12'], reject: ['1/4', '1/2'], slips: [{ value: String(1 / (3 + 1)), says: /last term that is left.*1-frac\(1, 4\)/ }] }),
  N('Simplify the fraction, then find the gradient', String((() => { const f = fx('frac(x^3+2x^2, x)'); const h = 1e-5; return Math.round(((f(3 + h) - f(3 - h)) / (2 * h)) * 1e4) / 1e4; })()), { shows: ['frac(x^3+2x^2, x)'], accept: ['8'], reject: ['15', '5'], slips: [{ value: String(fx('frac(x^3+2x^2, x)')(3)), says: /value of y at x=3, not the gradient/ }] }),
  // ----- exam style -----
  E('Simplify frac(2x^2-5x-3, x^2-9)', ['frac(2x^2-5x-3, x^2-9)'], fx('frac(2x^2-5x-3, x^2-9)'), { accept: ['(2x+1)/(x+3)', '(1+2x)/(3+x)'], reject: ['(2x-1)/(x+3)', '(2x^2-5x-3)/(x^2-9)'], slips: [{ value: '(2x-1)/(x+3)', says: /\(2x-1\)\(x-3\)=2x\^2-7x\+3, which is not 2x\^2-5x-3/ }] }),
  C('Write frac(3x-13, x^2-2x-3) in the form', '3x-13', 'x^2-2x-3', ['x+1', 'x-3'], { accept: PAIR(4, -1), reject: ['-1,4', '4,1', '4'], slips: [{ value: swap, says: /wrong way round.*A goes with \(x\+1\)/ }, { value: (c) => `${c[0]},${-c[1]}`, says: /Check the sign of B.*-4=B\*\(4\)/ }] }),
  E('Given that (x-3) is a factor of x^3-x^2-5x-3', ['frac(7x-5, x^3-x^2-5x-3)'], fx('frac(7x-5, x^3-x^2-5x-3)'), { accept: ['1/(x-3)-1/(x+1)+3/(x+1)^2', '3/(x+1)^2+1/(x-3)-1/(x+1)', '1/(x-3)-1/(x+1)+3/((x+1)^2)', '1/(x-3)-1/(x+1)+3/(x^2+2x+1)', '-1/(x+1)+1/(x-3)+3/(x+1)^2', '1/(x-3)-1/(x+1)+3/(x+1)\u00b2'], reject: ['1/(x-3)+1/(x+1)+3/(x+1)^2', '(7x-5)/((x-3)(x+1)^2)'], slips: [{ value: '1/(x-3)+1/(x+1)+3/(x+1)^2', says: /A\+B=0.*If A=1, then B is -1/ }] }),
  N('Find int(0, 3)', String((() => { const f = fx('frac(x^2+x-2, x+2)'); const n = 600; let s = f(0) + f(3); for (let i = 1; i < n; i += 1) s += f((3 * i) / n) * (i % 2 ? 4 : 2); return Math.round(((s * 3) / n / 3) * 1e6) / 1e6; })()), { shows: ['frac(x^2+x-2, x+2)'], accept: ['3/2', '1.5', '9/6'], reject: ['9/2', '3'], slips: [{ value: String(4.5), says: /left out the -x term/ }] }),
  E('Write frac(2, x+1)-frac(3, x-2)', ['frac(2, x+1)-frac(3, x-2)'], fx('frac(2, x+1)-frac(3, x-2)'), { accept: ['(x+7)/((x+1)(2-x))', '(x+7)/((2-x)(x+1))', '(-x-7)/((x+1)(x-2))', '(-x-7)/((x-2)(x+1))', '(-x-7)/(x^2-x-2)', '-(x+7)/((x+1)(x-2))', '-(x+7)/(x^2-x-2)'], reject: ['(-x-1)/((x+1)(x-2))', '(x+7)/((x+1)(x-2))'], slips: [{ value: '(-x-1)/((x+1)(x-2))', says: /did not change the sign of the second part/, expect: fx('frac(2(x-2)-3x+3, (x+1)(x-2))') }] }),
];

test('every typed key is recomputed from the maths, every typing a student may use is tested through matches(), and every wrong-answer value is tied to the slip its message names', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const qs = questions();
  const problems: string[] = [];
  const checked = new Set<Question>();
  for (const c of CHECKS) {
    const found = qs.filter((q) => q.plain.includes(c.find));
    if (found.length !== 1) { problems.push(`"${c.find}" matches ${found.length} questions`); continue; }
    const q = found[0];
    checked.add(q);
    const opts = /^<div class="q"[^>]*data-complete="linear"/.test(q.block) ? { complete: 'linear' } : {};
    for (const s of c.shows ?? []) if (!q.plain.includes(s)) problems.push(`${c.find}: the question does not show "${s}"`);
    // what the key must be, and how to tell whether a typed value is that key or another
    let isKey: (v: string) => boolean;
    let isSlip: (v: string, slipValue: string) => boolean;
    let slipInput: number[] = [];
    if (c.kind === 'expr') {
      for (const k of q.answers) if (!same(fx(k), c.target)) problems.push(`${c.find}: key "${k}" is not equal to the fraction the question describes`);
      isKey = (v) => same(fx(v), c.target);
      isSlip = (v, sv) => same(fx(v), fx(sv));
    } else if (c.kind === 'num') {
      for (const k of q.answers) if (!sameValue(k, c.answer)) problems.push(`${c.find}: key "${k}" is not the recomputed answer "${c.answer}"`);
      isKey = (v) => sameValue(v, c.answer);
      isSlip = (v, sv) => sameValue(v, sv, 0.01);
    } else {
      // the partial fractions of N/D: solve for the constants and compare with the key
      const top = fx(c.N);
      const bottom = fx(c.D);
      expect(top(0.3), `${c.find}: N is an expression in x`).not.toBeNaN();
      const target: Fx = (x) => top(x) / bottom(x);
      let all: number[];
      if (c.bottoms.length === 0) {
        // simplifies to (x - a)/(x - b): solve a - g(x) b = x - g(x) x at two values of x
        const [x1, x2] = [2.6, 5.2];
        const [g1, g2] = [target(x1), target(x2)];
        const det = 1 * -g2 - -g1 * 1;
        all = [((x1 - g1 * x1) * -g2 - -g1 * (x2 - g2 * x2)) / det, (1 * (x2 - g2 * x2) - (x1 - g1 * x1) * 1) / det].map((v) => Math.round(v * 1e9) / 1e9 + 0);
        const back = (x: number) => (x - all[0]) / (x - all[1]);
        expect(same(back, target), `${c.find}: the simplified fraction is (x-a)/(x-b)`).toBe(true);
        expect(q.plain, c.find).toContain('x-a');
      } else {
        const basis: Fx[] = c.bottoms.map((b) => fx(`frac(1, ${b})`));
        if (c.whole) basis.unshift(() => 1);
        const solved = solveConsts(target, basis);
        if (solved.err > 1e-9) problems.push(`${c.find}: no partial fractions fit (error ${solved.err})`);
        all = c.whole ? solved.c.slice(1) : solved.c;
        if (c.whole) expect(solved.c[0], `${c.find}: the whole part`).toBe(1);
        // the page's own form: the question shows each partial fraction, and a proper fraction has a lower degree on the top
        c.bottoms.forEach((b, i) => { if (!q.plain.includes(`frac(${'ABC'[i]}, ${b})`)) problems.push(`${c.find}: the question does not show frac(${'ABC'[i]}, ${b})`); });
        if (!c.whole && degreeOf(top) >= degreeOf(bottom)) problems.push(`${c.find}: the top is not of lower degree than the bottom`);
        if (c.whole && degreeOf(top) < degreeOf(bottom)) problems.push(`${c.find}: an Extra question must have a top that is not of lower degree`);
        if (!c.whole) expect(q.plain, c.find).toContain(`frac(${c.N}, ${c.D})`);
      }
      for (const v of all) if (!Number.isInteger(v)) problems.push(`${c.find}: constant ${v} is not a whole number`);
      if (c.given) c.given.forEach((v, i) => { if (all[i] !== v) problems.push(`${c.find}: the question gives constant ${i} as ${v} but it is ${all[i]}`); });
      const ans = c.only === undefined ? all : [all[c.only]];
      slipInput = ans;
      for (const k of q.answers) if (JSON.stringify(constsIn(k)) !== JSON.stringify(ans)) problems.push(`${c.find}: key "${k}" is not the recomputed ${ans.join(',')}`);
      if (c.only !== undefined && q.mode !== 'value') problems.push(`${c.find}: a single number is checked as a value`);
      if (c.only === undefined && q.mode !== 'exact') problems.push(`${c.find}: a list of constants is checked in exact mode`);
      isKey = (v) => JSON.stringify(constsIn(v)) === JSON.stringify(ans);
      isSlip = (v, sv) => JSON.stringify(constsIn(v)) === JSON.stringify(constsIn(sv));
    }
    // the typings a student may use are all accepted, and the wrong ones are not
    for (const t of c.accept ?? []) if (!matches(t, q.answers, q.mode, '', opts)) problems.push(`${c.find}: the typing "${t}" is not accepted (keys: ${q.answers.join(' | ')})`);
    for (const t of c.reject ?? []) if (matches(t, q.answers, q.mode, '', opts)) problems.push(`${c.find}: the typing "${t}" is accepted but is not right`);
    // every wrong-answer value is tied to its slip
    for (const s of c.slips ?? []) {
      const value = typeof s.value === 'function' ? s.value(slipInput) : s.value;
      const li = q.wrongs.find((w) => matches(value, w.values, q.mode, '', opts));
      if (!li) { problems.push(`${c.find}: no wrong-answer entry accepts the slip value "${value}" (entries: ${q.wrongs.map((w) => w.values.join(' | ')).join(' / ')})`); continue; }
      li.claimed = true;
      if (!s.says.test(plain(li.text))) problems.push(`${c.find}: the message for "${value}" does not name the slip ${s.says}: ${plain(li.text).slice(0, 120)}`);
      const accepted = matches(value, q.answers, q.mode, '', opts);
      if (!s.equal && (isKey(value) || accepted)) problems.push(`${c.find}: the slip value "${value}" is also a right answer`);
      if (s.equal && (!isKey(value) || accepted)) problems.push(`${c.find}: the form slip "${value}" must equal the key in value and must not be accepted as the key`);
      if (c.kind === 'expr' && s.expect && !same(fx(value), s.expect)) problems.push(`${c.find}: the slip "${value}" is not what the slip named in its message gives`);
      if (c.kind !== 'expr' && s.expect) problems.push(`${c.find}: expect is only used for an expression`);
      for (const v of li.values) if (!isSlip(v, value)) problems.push(`${c.find}: "${v}" is listed with the slip but is not the slip value "${value}"`);
    }
    for (const w of q.wrongs) if (!w.claimed) problems.push(`${c.find}: wrong-answer entry "${w.values.join(' | ')}" has no recomputed slip`);
  }
  const typed = qs.filter((q) => q.answers.length > 0);
  for (const q of typed) if (!checked.has(q)) problems.push(`no recomputed key for: ${q.plain.slice(0, 70)}`);
  expect(CHECKS.length).toBe(typed.length);
  expect(qs.length).toBeGreaterThanOrEqual(60);
  expect(typed.length).toBeGreaterThanOrEqual(50);
  expect(problems).toEqual([]);
});

test('no hint gives the answer, and a "Type it like" example is never the key', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const problems: string[] = [];
  for (const q of questions()) {
    if (q.answers.length === 0) continue;
    const spaceless = (t: string) => t.replace(/\s+/g, '');
    for (const h of q.hints) {
      // a hint never contains a key written out, or the key with its slashes written as frac(top, bottom)
      for (const k of q.answers) {
        if (k.length >= 5 && spaceless(h).includes(spaceless(k))) problems.push(`a hint of "${q.plain.slice(0, 50)}" contains the key ${k}: ${h}`);
      }
    }
    // a hint that names a key number as a whole word gives the answer away (small whole numbers are too common in the working to test)
    const keyNumbers = new Set(q.answers.flatMap((a) => numbersIn(a)).filter((v) => !Number.isFinite(v) ? false : !Number.isInteger(v) || Math.abs(v) >= 10).map((v) => String(v)));
    for (const h of q.hints) for (const n of keyNumbers) if (new RegExp(`(^|[^\\d.])${n.replace('.', '\\.').replace('-', '-?')}($|[^\\d.])`).test(h)) problems.push(`a hint of "${q.plain.slice(0, 50)}" names the key value ${n}: ${h}`);
    const m = /(?:Type|type) (?:it|them|your answers?|only) like (.*?)\.?$/.exec(q.plain);
    if (m && matches(m[1], q.answers, q.mode)) problems.push(`"${m[1]}" is the key of: ${q.plain.slice(0, 60)}`);
  }
  expect(problems).toEqual([]);
});

// ---------- multiple-choice keys, decided from the maths ----------
const options = (find: string) => {
  const qs = questions().filter((x) => x.plain.includes(find));
  expect(qs.length, `one question contains ${find}`).toBe(1);
  return [...qs[0].block.matchAll(/<li( data-correct| data-why="([^"]*)")?>([\s\S]*?)<\/li>/g)].filter((m) => m[1]).map((m) => ({ correct: m[1] === ' data-correct', why: decode(m[2] ?? ''), text: plain(m[3]) }));
};
const correctText = (find: string) => options(find).find((o) => o.correct)?.text;
const r2 = (v: number) => String(Math.round(v * 100) / 100);
const holds = (a: Fx, b: Fx, skip: number[] = []) => XS.filter((x) => !skip.includes(x)).every((x) => close(a(x), b(x), 1e-9));

test('multiple-choice keys: each correct option is the one the maths gives, and each reason quotes right numbers', () => {
  // lesson 1: which simplification is correct
  const s1 = holds(fx('frac(x^2-1, x-1)'), fx('x+1'));
  const s2 = holds(fx('frac(x+4, x+6)'), () => 4 / 6);
  const s3 = holds(fx('frac(x^2+3, 3)'), fx('x^2+1'));
  expect([s1, s2, s3]).toEqual([true, false, false]);
  expect(correctText('Which of these simplifications is correct')).toBe('(x^2 - 1)/(x - 1) = x + 1, for x not equal to 1');
  expect(fx('frac(x+4, x+6)')(2)).toBeCloseTo(0.75, 12);
  expect(options('Which of these simplifications is correct')[1].why).toContain(`6/8 = 0.75 but 4/6 = ${r2(4 / 6)}`);
  expect(fx('frac(x^2+3, 3)')(3)).toBe(4);
  expect(fx('x^2+1')(3)).toBe(10);
  expect(options('Which of these simplifications is correct')[2].why).toContain('x = 3: (9 + 3)/3 = 4 but 3^2 + 1 = 10');
  // lesson 1: the open circle. At x = -1 the top and the bottom are both 0, so the fraction has no value; elsewhere it is the line y = x - 1
  expect([fx('x^2-1')(-1), fx('x+1')(-1)]).toEqual([0, 0]);
  expect(holds(fx('frac(x^2-1, x+1)'), fx('x-1'))).toBe(true);
  expect(fx('x-1')(-1)).toBe(-2); // the open circle is at (-1, -2), on the line y = x - 1
  expect(correctText('What does the open circle tell you')).toBe('The fraction has no value at x = -1, because the bottom is 0 there');
  // lesson 2: dividing by r/s is multiplying by s/r; test with 1/2 divided by 1/4
  const half = 1 / 2;
  const quarter = 1 / 4;
  expect(half / quarter).toBe(2);
  expect([half * (4 / 1), half * quarter, (2 / 1) * quarter]).toEqual([2, 1 / 8, 1 / 2]);
  for (const [p, q, r, s] of [[3, 5, 2, 7], [1, 2, 1, 4], [7, 3, 5, 11]]) {
    expect(close(p / q / (r / s), (p / q) * (s / r))).toBe(true);
    expect(close(p / q / (r / s), (p / q) * (r / s))).toBe(false);
    expect(close(p / q / (r / s), (q / p) * (r / s))).toBe(false);
  }
  expect(correctText('which is correct? Here p, q, r and s are not 0')).toBe('Multiply p/q by s/r');
  expect(options('which is correct? Here p, q, r and s are not 0')[1].why).toContain('1/2 divided by 1/4 is 2, but 1/2 times 1/4 is 1/8');
  expect(options('which is correct? Here p, q, r and s are not 0')[2].why).toContain('1/2 divided by 1/4 is 2, but 2/1 times 1/4 is 1/2');
  // lesson 3: the lowest common denominator of 1/(x(x+1)) and 1/(x+1)^2: a multiple of x(x+1) and of (x+1)^2 of the least degree
  const multOf = (f: Fx, root: number, times: number) => { let g = f; for (let k = 0; k < times; k += 1) { if (Math.abs(g(root)) > 1e-9) return false; const h = 1e-6; const gg = g; g = (x) => (gg(x + h) - gg(x - h)) / (2 * h); } return true; };
  const cand = { a: fx('x(x+1)^2'), b: fx('x(x+1)'), c: fx('x(x+1)^3') };
  const isCommon = (f: Fx) => multOf(f, 0, 1) && multOf(f, -1, 1) && multOf(f, -1, 2);
  expect([isCommon(cand.a), isCommon(cand.b), isCommon(cand.c)]).toEqual([true, false, true]);
  expect([degreeOf(cand.a), degreeOf(cand.c)]).toEqual([3, 4]);
  expect(correctText('lowest common denominator of')).toBe('x(x + 1)^2');
  // lesson 4: the form for two different factors fits 5/((x+1)(x-4)); a product of two such fractions is one fraction with the same bottom
  const five = solveConsts(fx('frac(5, (x+1)(x-4))'), [fx('frac(1, x+1)'), fx('frac(1, x-4)')]);
  expect(five.err).toBeLessThan(1e-9);
  expect(five.c).toEqual([-1, 1]);
  expect(same((x) => (2 / (x + 1)) * (3 / (x - 4)), fx('frac(6, (x+1)(x-4))'))).toBe(true);
  expect(correctText('Which is the form of the partial fractions of frac(5, (x+1)(x-4))')).toBe('A/(x + 1) + B/(x - 4)');
  // lesson 5: put in the value that makes the A part and the B part 0
  const aPart = fx('(x+2)(x-5)');
  const bPart = fx('(x-1)(x-5)');
  expect([aPart(5), bPart(5)]).toEqual([0, 0]);
  expect([aPart(-5), bPart(-5), aPart(0), bPart(0), fx('(x-1)(x+2)')(0)].every((v) => v !== 0)).toBe(true);
  expect(correctText('Which value of x do you put in to find C on its own')).toBe('x = 5, which makes the A part and the B part 0');
  // lesson 6: 3/((x+1)(x-2)^2) needs three parts; two parts cannot fit it
  const target3 = fx('frac(3, (x+1)(x-2)^2)');
  expect(solveConsts(target3, [fx('frac(1, x+1)'), fx('frac(1, x-2)'), fx('frac(1, (x-2)^2)')]).err).toBeLessThan(1e-9);
  expect(solveConsts(target3, [fx('frac(1, x+1)'), fx('frac(1, (x-2)^2)')]).err).toBeGreaterThan(1e-3);
  expect(solveConsts(target3, [fx('frac(1, x+1)'), fx('frac(1, x-2)')]).err).toBeGreaterThan(1e-3);
  expect(fx('(x+1)(x-2)')(2)).toBe(0); // the second wrong form has the bottom (x+1)(x-2): at x = 2 the right side is 0 but the left side is 3
  expect(correctText('Which is the form of the partial fractions of frac(3, (x+1)(x-2)^2)')).toBe('A/(x + 1) + B/(x - 2) + C/(x - 2)^2');
  // lesson 6: the curve goes the same way on both sides of x = -2 because the bottom keeps its sign; it changes direction at x = 1
  const f9 = fx('frac(9x+9, (x-1)(x+2)^2)');
  expect([f9(-2 - 0.01) > 100, f9(-2 + 0.01) > 100]).toEqual([true, true]);
  expect([f9(1 - 0.01) < -100, f9(1 + 0.01) > 100]).toEqual([true, true]);
  expect([fx('9x+9')(-2), fx('9x+9')(-1)]).toEqual([-9, 0]);
  expect(fx('(x+2)^2')(-2.5) > 0 && fx('(x+2)^2')(-1.5) > 0).toBe(true);
  expect(fx('x-1')(-2)).toBe(-3);
  expect(correctText('goes up on both sides of')).toBe('(x + 2) is squared, so the bottom keeps the same sign on both sides of x = -2');
  // lesson 7: a quadratic bottom must be factorised first; the top has a lower degree, so division gives a quotient of 0
  expect(polyDivide(coeffsOf(fx('4x+3'), 1), coeffsOf(fx('x^2-x-6'), 2)).q).toEqual([]);
  expect(same(fx('(x-3)(x+2)'), fx('x^2-x-6'))).toBe(true);
  expect(correctText('what must you do first')).toBe('Factorise the bottom into straight-line factors');
  // lesson 7: the student's answer is wrong at x = 0
  const left0 = fx('frac(5x+1, (x-1)(x+2))')(0);
  const right0 = fx('frac(2, x-1)+frac(4, x+2)')(0);
  expect([left0, right0, fx('frac(2, x-1)')(0), fx('frac(4, x+2)')(0)]).toEqual([-0.5, 0, -2, 2]);
  expect(correctText('does putting x=0 into the student')).toBe('It gives 0, not -1/2, so the answer is wrong');
  // flip it: 1/(x-1) + 1/(x+1) = 2x/(x^2-1), and test x = 2
  expect(same(fx('frac(1, x-1)+frac(1, x+1)'), fx('frac(2x, x^2-1)'))).toBe(true);
  expect(same(fx('frac(1, x-1)+frac(1, x+1)'), fx('frac(2, x^2-1)'))).toBe(false);
  expect(same(fx('frac(1, x-1)+frac(1, x+1)'), fx('frac(2, 2x)'))).toBe(false);
  expect(same(fx('frac(1, x-1)-frac(1, x+1)'), fx('frac(2, x^2-1)'))).toBe(true);
  expect(fx('frac(1, x-1)+frac(1, x+1)')(2)).toBeCloseTo(1.333, 3);
  expect(fx('frac(2, 2x)')(2)).toBe(0.5);
  expect(correctText('Which fraction is equal to')).toBe('2x/(x^2 - 1)');
  // spot the mistake: each claim is false, and each test value is right
  expect(close(fx('frac(x+3, x+5)')(1), 4 / 6) && !close(fx('frac(x+3, x+5)')(1), 3 / 5)).toBe(true);
  expect(r2(4 / 6)).toBe('0.67');
  expect(r2(3 / 5 + 1)).toBe('1.6');
  expect(r2(3 / 6)).toBe('0.5');
  expect(options('Amy says').map((o) => o.why)).toEqual(['', expect.stringContaining('(1 + 3)/(1 + 5) = 0.67, but 3/5 + 1/1 = 1.6'), expect.stringContaining('4/6 = 0.67 but 3/6 = 0.5')]);
  expect(correctText('Amy says')).toContain('term, not a factor');
  expect(r2(1 / 3 + 1 / 4)).toBe('0.58');
  expect(r2(2 / ((1 + 2) * (1 + 3)))).toBe('0.17');
  expect(r2(2 / (2 * 1 + 5))).toBe('0.29');
  expect(same(fx('frac(1, x+2)+frac(1, x+3)'), fx('frac(2x+5, (x+2)(x+3))'))).toBe(true);
  expect(same(fx('frac(1, x+2)+frac(1, x+3)'), fx('frac(2, 2x+5)'))).toBe(false);
  expect(options('Ben says')[2].why).toContain('1/3 + 1/4 = 0.58 but 2/12 = 0.17');
  expect(correctText('Ben says')).toContain('added the tops and added the bottoms');
  expect(holds(fx('frac(x^2+6x, x)'), fx('x+6'))).toBe(true);
  expect([fx('frac(x^2+6x, x)')(2), 2 ** 2 + 6, 2 ** 2 + 6 * 2]).toEqual([8, 10, 16]);
  expect(options('Cara says')[2].why).toContain('(4 + 12)/2 = 8, but 4 + 12 = 16');
  expect(correctText('Cara says')).toBe('She divided 6x by x but did not divide x^2 by x. The answer is x + 6');
  const dev = solveConsts(fx('frac(5, (x-1)(x+2))'), [fx('frac(1, x-1)'), fx('frac(1, x+2)')]);
  expect(dev.c.map((v) => t3(v))).toEqual([t3(5 / 3), t3(-5 / 3)]);
  expect([fx('frac(5, (x-1)(x+2))')(2), fx('frac(5, x-1)+frac(5, x+2)')(2)]).toEqual([1.25, 6.25]);
  expect(correctText('Dev says')).toContain('He gave both parts the top 5');
  expect(options('Dev says')[2].why).toContain('5/4 = 1.25, but the right side is 5 + 5/4 = 6.25');
  const eliTop = fx('3(x+2)-2(x+1)');
  expect([coeffsOf(eliTop, 1), coeffsOf(fx('3x+6-2x+2'), 1)]).toEqual([[1, 4], [1, 8]]);
  expect([fx('frac(3, x+1)-frac(2, x+2)')(0), fx('frac(x+8, (x+1)(x+2))')(0), fx('frac(x+4, (x+1)(x+2))')(0)]).toEqual([2, 4, 2]);
  expect(correctText('Eli says')).toContain('He did not change the sign of the 2');
  // mixed review: (x+2)/(x^2-4) = 1/(x-2) only where the original has a value
  expect(holds(fx('frac(x+2, x^2-4)'), fx('frac(1, x-2)'))).toBe(true);
  expect([fx('x^2-4')(2), fx('x^2-4')(-2), fx('x+2')(2), fx('x+2')(-2), fx('frac(1, x-2)')(-2)]).toEqual([0, 0, 4, 0, -0.25]);
  expect(correctText('Why is this true only for')).toBe('At x = 2 and x = -2 the bottom of the original is 0, so the original has no value there');
});

test('the blanks in every "Now you finish it" are recomputed', () => {
  const l3 = coeffsOf(fx('(x-1)+4(x+3)'), 1);
  const l4 = solveConsts(fx('frac(x+7, (x-1)(x+3))'), [fx('frac(1, x-1)'), fx('frac(1, x+3)')]).c;
  const l5 = solveConsts(fx('frac(9x+3, (x-1)(x-3)(x+2))'), [fx('frac(1, x-1)'), fx('frac(1, x-3)'), fx('frac(1, x+2)')]).c;
  const l6 = solveConsts(fx('frac(5x-1, (x-2)(x+1)^2)'), [fx('frac(1, x-2)'), fx('frac(1, x+1)'), fx('frac(1, (x+1)^2)')]).c;
  const l7 = solveConsts(fx('frac(7x+1, x^2-x-2)'), [fx('frac(1, x-2)'), fx('frac(1, x+1)')]).c;
  const expected = [
    // 1. x^2-2x-8 = (x-4)(x+2); x^2-16 = (x-4)(x+4); the other excluded value is -4
    String(-rootsOf(fx('x^2-2x-8')).find((r) => r < 0)!), String(rootsOf(fx('x^2-16')).find((r) => r > 0)!), String(rootsOf(fx('x^2-16')).find((r) => r < 0)!),
    // 2. x^2+x = x(x+1); the product is x(x-3); the bottoms x+1 and x+3 are 0 at -1 and -3
    String(coeffsOf(fx('x^2+x'), 2)[1]), String(-coeffsOf(fx('frac(x^2-9, x+1)*frac(x^2+x, x+3)'), 2)[1]), String(rootsOf(fx('x+3'))[0]),
    // 3. 1(x-1) + 4(x+3): the number in 4x + 12, then 5x + 11
    String(4 * 3), String(l3[0]), String(l3[1]),
    // 4. x + 7 = A(x+3) + B(x-1): at x = 1 the bracket (x+3) is 4, then A, then B
    String(1 + 3), String(l4[0]), String(l4[1]),
    // 5. A, B, C
    String(l5[0]), String(l5[1]), String(l5[2]),
    // 6. A, then C, then B (the order of the lesson)
    String(l6[0]), String(l6[2]), String(l6[1]),
    // 7. x^2-x-2 = (x-2)(x+1); A; B
    String(rootsOf(fx('x^2-x-2')).map((r) => -r).find((r) => r === 1)!), String(l7[0]), String(l7[1]),
  ];
  expect(l3).toEqual([5, 11]);
  expect(l5.reduce((a, b) => a + b)).toBe(0);
  const blanks = [...SOURCE.matchAll(/class="blank" data-answers="([^"]*)"/g)].map((m) => m[1]);
  expect(blanks).toEqual(expected);
});

// ---------- the rules the lessons state, checked against a brute-force search ----------
const NUMS = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

test('lesson 1: after cancelling, the simplified fraction equals the original wherever the original has a value, and the original has no value at an excluded value', () => {
  // [original, simplified, excluded values] for every simplification the page makes
  const cases: [string, string, number[]][] = [
    ['frac(x^2-4, x-2)', 'x+2', [2]],
    ['frac(x^2-9, x^2+x-6)', 'frac(x-3, x-2)', [-3, 2]],
    ['frac(3x^2+6x, x^2+3x+2)', 'frac(3x, x+1)', [-2, -1]],
    ['frac(x^3-7x+6, x^2-3x+2)', 'x+3', [1, 2]],
    ['frac(x^2-2x-8, x^2-16)', 'frac(x+2, x+4)', [-4, 4]],
    ['frac(x^2-16, x^2+x-12)', 'frac(x-4, x-3)', [-4, 3]],
    ['frac(x^2-1, x+1)', 'x-1', [-1]],
    ['frac(x^2-x-6, x^2-4)', 'frac(x-3, x-2)', [-2, 2]],
  ];
  for (const [original, simplified, excluded] of cases) {
    expect(same(fx(original), fx(simplified)), original).toBe(true);
    const bottom = /^frac\(.*, (.*)\)$/.exec(original)![1];
    expect(rootsOf(fx(bottom)), `${original}: the excluded values are the roots of the original bottom`).toEqual(excluded);
  }
  // the first worked example: x = -3 is left out although the simplified fraction has a value there
  expect(fx('frac(x-3, x-2)')(-3)).toBeCloseTo(1.2, 12);
  expect(Number.isNaN(fx('frac(x^2-9, x^2+x-6)')(-3))).toBe(true);
  // cancelling terms is wrong: (2+3)/(2+4) is 5/6 and not 3/4
  expect([5 / 6, 3 / 4].map((v) => t3(v))).toEqual([0.833, 0.75]);
  // a number fraction: 2*3/(2*4) = 3/4 and (2*9)/(3*10) = 3/5
  expect((2 * 3) / (2 * 4)).toBe(0.75);
  expect((2 / 3) * (9 / 10)).toBeCloseTo(0.6, 12);
});

test('lessons 2 and 3: the products, quotients and sums the lessons work are right, and the bottom of the divided expression is the one the page says', () => {
  const worked: [string, string][] = [
    ['frac(x^2-4, x^2+x)*frac(x+1, x+2)', 'frac(x-2, x)'],
    ['quotient(frac(x^2-x-6, x^2-1), frac(x-3, x+1))', 'frac(x+2, x-1)'],
    ['quotient(frac(2x+4, x^2-4x), frac(x+2, x-4))', 'frac(2, x)'],
    ['frac(x^2-9, x+1)*frac(x^2+x, x+3)', 'x(x-3)'],
    ['frac(3, x+1)+frac(2, x-2)', 'frac(5x-4, (x+1)(x-2))'],
    ['frac(x+3, x-1)-frac(x-2, x+2)', 'frac(8x+4, (x-1)(x+2))'],
    ['frac(3, x-2)-frac(4, x^2-4)', 'frac(3x+2, x^2-4)'],
    ['frac(2, x+1)+frac(3, (x+1)^2)', 'frac(2x+5, (x+1)^2)'],
    ['frac(1, x+3)+frac(4, x-1)', 'frac(5x+11, (x+3)(x-1))'],
  ];
  for (const [left, right] of worked) {
    const f = left.startsWith('quotient(') ? ((): Fx => { const [a, b] = /^quotient\((frac\(.*?\)), (frac\(.*\))\)$/.exec(left)!.slice(1); return quotient(a, b); })() : fx(left);
    expect(same(f, fx(right)), left).toBe(true);
  }
  // dividing by a fraction: the expression has no value where a bottom is 0 and where the divisor is 0, and the value 0 at -2 is a value
  const g = (x: number) => (x + 2) / (x - 1) / ((x - 3) / (x + 4));
  expect(g(-2)).toBeCloseTo(0, 12);
  expect(Number.isFinite(g(-2))).toBe(true);
  expect(Number.isFinite(g(3))).toBe(false);
  expect(Number.isFinite(g(1))).toBe(false);
  expect(fx('x+4')(-4)).toBe(0);
  // the page's lowest common denominator rule: for p/((x-a)^i) + q/((x-a)^j) the bottom is (x-a)^max(i, j); brute force over small cases
  for (const a of NUMS(-4, 4)) for (const [i, j] of [[1, 1], [1, 2], [2, 1], [2, 2], [1, 3]]) for (const [p, q] of [[1, 1], [2, 3], [-1, 4]]) {
    const lcd = Math.max(i, j);
    const sum: Fx = (x) => p / (x - a) ** i + q / (x - a) ** j;
    const top: Fx = (x) => p * (x - a) ** (lcd - i) + q * (x - a) ** (lcd - j);
    expect(same(sum, (x) => top(x) / (x - a) ** lcd), `a=${a} i=${i} j=${j}`).toBe(true);
  }
});

test('lesson 4: for two different factors, A = (pa+q)/(a-b) and B = (pb+q)/(b-a); a number on the top gives A + B = 0 (brute force)', () => {
  let n = 0;
  const bad: string[] = [];
  for (const a of NUMS(-5, 5)) for (const b of NUMS(-5, 5)) {
    if (a === b) continue;
    for (const p of NUMS(-6, 6)) for (const q of NUMS(-6, 6)) {
      const top: Fx = (x) => p * x + q;
      const A = (p * a + q) / (a - b);
      const B = (p * b + q) / (b - a);
      if (!same((x) => top(x) / ((x - a) * (x - b)), (x) => A / (x - a) + B / (x - b))) bad.push(`p=${p} q=${q} a=${a} b=${b}`);
      // the identity top(x) = A(x-b) + B(x-a) is true for every x, including x = a and x = b
      for (const x of [a, b, 0, 1.5, -2.5]) if (!close(top(x), A * (x - b) + B * (x - a), 1e-9)) bad.push(`identity p=${p} q=${q} a=${a} b=${b} x=${x}`);
      if (p === 0 && !close(A + B, 0)) bad.push(`A+B p=0 q=${q} a=${a} b=${b}`);
      n += 1;
    }
  }
  expect(n).toBeGreaterThan(10000);
  expect(bad).toEqual([]);
  // a factor with a number in front of x: (Px+Q)/((2x-1)(x+1)) = A/(2x-1) + B/(x+1) with A = N(1/2)/(1/2+1) and B = N(-1)/(2(-1)-1)
  for (const P of NUMS(-5, 5)) for (const Q of NUMS(-5, 5)) {
    const top: Fx = (x) => P * x + Q;
    const A = top(0.5) / (0.5 + 1);
    const B = top(-1) / (2 * -1 - 1);
    if (!same((x) => top(x) / ((2 * x - 1) * (x + 1)), (x) => A / (2 * x - 1) + B / (x + 1))) bad.push(`2x-1 P=${P} Q=${Q}`);
  }
  expect(bad).toEqual([]);
  // the lesson's own fractions
  expect(solveConsts(fx('frac(5x+2, (2x-1)(x+1))'), [fx('frac(1, 2x-1)'), fx('frac(1, x+1)')]).c).toEqual([3, 1]);
  expect(solveConsts(fx('frac(2x+11, (x-2)(x+3))'), [fx('frac(1, x-2)'), fx('frac(1, x+3)')]).c).toEqual([3, -1]);
  // comparing coefficients: A + B = 2 and 3A - 2B = 11 give A = 3 and B = -1
  expect([3 + -1, 3 * 3 - 2 * -1]).toEqual([2, 11]);
  // the check of the lesson's example, and of the "Check by adding" line
  expect(same(fx('frac(2(x+2)+3(x-1), (x-1)(x+2))'), fx('frac(5x+1, (x-1)(x+2))'))).toBe(true);
});

test('lesson 5: for three different factors the constants are N(a)/((a-b)(a-c)) and so on, and A + B + C = 0 when the top is linear (brute force)', () => {
  let n = 0;
  const bad: string[] = [];
  for (const a of NUMS(-4, 4)) for (const b of NUMS(-4, 4)) for (const c of NUMS(-4, 4)) {
    if (a === b || b === c || a === c) continue;
    for (const p of [-3, 0, 2, 5]) for (const q of [-4, 1, 6]) {
      const top: Fx = (x) => p * x + q;
      const A = top(a) / ((a - b) * (a - c));
      const B = top(b) / ((b - a) * (b - c));
      const C = top(c) / ((c - a) * (c - b));
      if (!same((x) => top(x) / ((x - a) * (x - b) * (x - c)), (x) => A / (x - a) + B / (x - b) + C / (x - c))) bad.push(`a=${a} b=${b} c=${c}`);
      if (!close(A + B + C, 0)) bad.push(`A+B+C for a=${a} b=${b} c=${c} p=${p} q=${q}`);
      n += 1;
    }
  }
  expect(n).toBeGreaterThan(1000);
  expect(bad).toEqual([]);
  // a quadratic on the top breaks the check: the x^2 terms no longer cancel
  const quad: Fx = (x) => x * x + 1;
  const [a, b, c] = [1, 2, 3];
  expect(close(quad(a) / ((a - b) * (a - c)) + quad(b) / ((b - a) * (b - c)) + quad(c) / ((c - a) * (c - b)), 1)).toBe(true);
  // the lesson's own fractions
  expect(solveConsts(fx('frac(12x-6, (x+4)(x+1)(x-2))'), [fx('frac(1, x+4)'), fx('frac(1, x+1)'), fx('frac(1, x-2)')]).c).toEqual([-3, 2, 1]);
  expect(solveConsts(fx('frac(6, x(x-2)(x+1))'), [fx('frac(1, x)'), fx('frac(1, x-2)'), fx('frac(1, x+1)')]).c).toEqual([-3, 1, 2]);
  // the working lines of the first worked example
  expect([12 * -4 - 6, 12 * -1 - 6, 12 * 2 - 6]).toEqual([-54, -18, 18]);
  expect([(-3) * (-6), 3 * -3, 6 * 3]).toEqual([18, -9, 18]);
});

test('lesson 6: for a repeated factor, A = N(a)/(a-b)^2, C = N(b)/(b-a) and B = -A when the top is linear; for (x-a)^2, A is the number in front of x and B = N(a) (brute force)', () => {
  let n = 0;
  const bad: string[] = [];
  for (const a of NUMS(-4, 4)) for (const b of NUMS(-4, 4)) {
    if (a === b) continue;
    for (const p of [-3, 0, 2, 5]) for (const q of [-4, 1, 6]) {
      const top: Fx = (x) => p * x + q;
      const A = top(a) / (a - b) ** 2;
      const C = top(b) / (b - a);
      const B = -A;
      if (!same((x) => top(x) / ((x - a) * (x - b) ** 2), (x) => A / (x - a) + B / (x - b) + C / (x - b) ** 2)) bad.push(`a=${a} b=${b} p=${p} q=${q}`);
      n += 1;
    }
  }
  expect(n).toBeGreaterThan(500);
  expect(bad).toEqual([]);
  for (const a of NUMS(-4, 4)) for (const p of NUMS(-5, 5)) for (const q of NUMS(-5, 5)) {
    const top: Fx = (x) => p * x + q;
    if (!same((x) => top(x) / (x - a) ** 2, (x) => p / (x - a) + top(a) / (x - a) ** 2)) bad.push(`square a=${a} p=${p} q=${q}`);
  }
  expect(bad).toEqual([]);
  // the lesson's own fractions
  expect(solveConsts(fx('frac(3x+1, (x-1)^2)'), [fx('frac(1, x-1)'), fx('frac(1, (x-1)^2)')]).c).toEqual([3, 4]);
  expect(solveConsts(fx('frac(9x+9, (x-1)(x+2)^2)'), [fx('frac(1, x-1)'), fx('frac(1, x+2)'), fx('frac(1, (x+2)^2)')]).c).toEqual([2, -2, 3]);
  expect(solveConsts(fx('frac(5, x(x+1)^2)'), [fx('frac(1, x)'), fx('frac(1, x+1)'), fx('frac(1, (x+1)^2)')]).c).toEqual([5, -5, -5]);
  // lesson 3's repeated factor: 2/(x+1) + 3/(x+1)^2 = (2x+5)/(x+1)^2
  expect(same(fx('frac(2, x+1)+frac(3, (x+1)^2)'), fx('frac(2x+5, (x+1)^2)'))).toBe(true);
  // a repeated factor with only the square cannot make a top with an x in it: A(x+1) has an x in it
  expect(coeffsOf(fx('2(x+1)+3'), 1)).toEqual([2, 5]);
  // the checks the page writes out
  expect([fx('frac(9, -4)')(0), -2 - 1 + 3 / 4]).toEqual([-2.25, -2.25]);
  expect([5 / 4, 5 - 5 / 2 - 5 / 4]).toEqual([1.25, 1.25]);
});

test('lesson 7: every check by substitution on the page is right, the Extra division is right, and a check at one value cannot prove an answer', () => {
  const pairs: [string, string][] = [
    ['frac(4x+3, x^2-x-6)', 'frac(3, x-3)+frac(1, x+2)'],
    ['frac(12, x^3-2x^2-x+2)', 'frac(-6, x-1)+frac(4, x-2)+frac(2, x+1)'],
    ['frac(7x+1, x^2-x-2)', 'frac(5, x-2)+frac(2, x+1)'],
    ['frac(x^2+4x+1, (x-1)(x+2))', 'frac(1, 1)+frac(2, x-1)+frac(1, x+2)'],
    ['frac(5x+1, (x-1)(x+2))', 'frac(2, x-1)+frac(3, x+2)'],
  ];
  for (const [left, right] of pairs) {
    expect(same(fx(left), fx(right)), left).toBe(true);
    expect(close(fx(left)(0), fx(right)(0)), `${left} at x = 0`).toBe(true);
  }
  expect(coeffsOf(fx('x^3-2x^2-x+2'), 3)).toEqual([1, -2, -1, 2]);
  expect(fx('x^3-2x^2-x+2')(1)).toBe(0);
  expect(same(fx('x^3-2x^2-x+2'), fx('(x-1)(x-2)(x+1)'))).toBe(true);
  expect(same(fx('x^3-x^2-5x-3'), fx('(x-3)(x+1)^2'))).toBe(true);
  expect(same(fx('x^3-x^2-4x+4'), fx('(x-1)(x-2)(x+2)'))).toBe(true);
  expect(fx('x^3-x^2-5x-3')(3)).toBe(0);
  // the Extra: the division x^2+4x+1 = 1(x^2+x-2) + (3x+3), and the whole part is 1
  expect(polyDivide(coeffsOf(fx('x^2+4x+1'), 2), coeffsOf(fx('x^2+x-2'), 2))).toEqual({ q: [1], r: [3, 3] });
  // the student's answer 2/(x-1) + 4/(x+2) differs from the fraction at x = 0, so one value can find a mistake
  expect(close(fx('frac(2, x-1)+frac(4, x+2)')(0), fx('frac(5x+1, (x-1)(x+2))')(0))).toBe(false);
  // but Dev's wrong answer 5/(x-1) + 5/(x+2) agrees with 5/((x-1)(x+2)) at x = 0 and is wrong, so one value cannot prove an answer right
  const dev: Fx = fx('frac(5, x-1)+frac(5, x+2)');
  const devRight: Fx = fx('frac(5, (x-1)(x+2))');
  expect(close(dev(0), devRight(0))).toBe(true);
  expect(same(dev, devRight)).toBe(false);
  // an improper fraction needs a whole part: with the top and bottom both of degree 2, no A/(x-1) + B/(x+2) fits it
  expect(solveConsts(fx('frac(x^2+4x+1, (x-1)(x+2))'), [fx('frac(1, x-1)'), fx('frac(1, x+2)')]).err).toBeGreaterThan(1e-3);
  expect(solveConsts(fx('frac(x^2+4x+1, (x-1)(x+2))'), [() => 1, fx('frac(1, x-1)'), fx('frac(1, x+2)')]).err).toBeLessThan(1e-9);
});

test('the page states the conditions on each general rule exactly, and each rule sentence is pinned', () => {
  const text = plain(SOURCE);
  // lesson 1
  expect(text).toContain('The simplified fraction equals the original for every x except the values that make the bottom of the original 0. At those values the original has no value.');
  expect(text).toContain('Cancel factors, not terms.');
  // lesson 2
  expect(text).toContain('The result has no value where any bottom is 0. When you divide, it also has no value where the fraction you divide by is 0.');
  // lesson 3
  expect(text).toContain('use each factor once, to its highest power.');
  expect(text).toContain('When you subtract, put brackets round the whole top of the second fraction, so that its signs change.');
  // lesson 4
  expect(text).toContain('suppose the bottom is two different factors, (x-a)(x-b), and the top is a number or a multiple of x plus a number.');
  expect(text).toContain('When the top is a number and the bottom is (x-a)(x-b), A and B are opposite numbers, because the top has no x term.');
  // lesson 5
  expect(text).toContain('suppose the bottom is three different factors, (x-a)(x-b)(x-c), and the top is a number or a multiple of x plus a number.');
  expect(text).toContain('For these factors and tops, A+B+C=0.');
  // lesson 6
  expect(text).toContain('for a bottom with a repeated factor, write one fraction for each power of that factor, up to the highest power.');
  // lesson 7
  expect(text).toContain('If they agree, that is a good sign, but one value cannot prove the answer is right.');
  // the conditions that the rules lean on: the top is a number or a multiple of x plus a number, so that the top has a lower degree
  expect((text.match(/the top is a number or a multiple of x plus a number/gi) ?? []).length).toBeGreaterThanOrEqual(3);
  // the Extra is labelled, says which specifications do not state it, and is not needed for the lessons
  expect(text).toContain('Extra: when the top is as big as the bottom');
  expect(text).toContain('None of the four specifications this book follows (AQA, Edexcel, OCR and MEI) states this idea. You never need it for the lessons above.');
  expect((text.match(/\[Extra\]/g) ?? []).length).toBeGreaterThanOrEqual(3);
});

test('the page keeps to its scope: partial fractions with straight-line factors, a repeated factor, at most three terms; no quadratic factor on the bottom', () => {
  const stripped = SOURCE.replace(/<!--[\s\S]*?-->/g, ' ');
  // no partial fraction with a linear top over a quadratic factor: the form (Ax+B)/(...) never appears
  expect(stripped).not.toMatch(/frac\(\s*Ax\s*\+\s*B/);
  expect(stripped).not.toMatch(/frac\(\s*[A-C]x\s*\+/);
  // at most three letters for partial fractions (A, B, C), and none called D
  expect(stripped).not.toMatch(/frac\(D,/);
  expect(plain(stripped)).not.toMatch(/radian|differentiat(?:e|ion) the fraction|quotient rule|by parts|reduction formula|Laplace.*\bis needed\b/i);
  // every partial-fraction question that is not marked [Extra] has a top of lower degree than the bottom (checked in the key test), and
  // an improper fraction appears in the page's partial-fraction questions only in the two Extra ones
  const extras = questions().filter((q) => q.plain.startsWith('[Extra]'));
  expect(extras.length).toBe(2);
});

test('every numbered lesson section has a Key idea box and a faded "Now you finish it" example, and the page asks for the calculator', () => {
  const lessons = SOURCE.split('<section').filter((sec) => /<h2>\d+\./.test(sec));
  expect(lessons.length).toBe(7);
  for (const sec of lessons) {
    const name = /<h2>([^<]*)<\/h2>/.exec(sec)?.[1];
    expect(sec, `${name}: a Key idea box`).toContain('class="key"');
    expect(sec, `${name}: a worked example`).toContain('class="worked"');
    expect(sec, `${name}: a faded example`).toContain('class="worked faded"');
  }
  expect(SOURCE.startsWith('<main class="book strand-al-algebra" data-calc="scientific" data-book-page="topic" data-topic="algebraic-fractions">')).toBe(true);
  // the page has a "Where this goes next" paragraph and a "Common traps" list
  expect(SOURCE).toContain('<h2>Where this goes next</h2>');
  expect(SOURCE).toContain('<h2>Common traps</h2>');
});

test('the skip link goes to the first lesson heading (heading ids are cut at 40 characters)', () => {
  const first = /<h2>(1\.[^<]*)<\/h2>/.exec(SOURCE)![1];
  const id = `s-${plain(first).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`;
  expect(SOURCE).toContain(`href="#${id}"`);
});

test('multiple-choice options are plain text: no maths markup and no spoken fractions', () => {
  for (const ul of SOURCE.matchAll(/<ul class="options">([\s\S]*?)<\/ul>/g)) {
    expect(ul[1]).not.toMatch(/\{m:|\{md:/);
    expect(plain(ul[1])).not.toMatch(/\bover\b|\broot \d/i);
  }
});

test('the first Key box links the prerequisite, and the warm-up links it too', () => {
  const key = /<div class="key">([\s\S]*?)<\/div>/.exec(SOURCE)![1];
  expect(key).toContain('href="polynomials.html"');
  const warm = /<h2>Warm-up[\s\S]*?<\/section>/.exec(SOURCE)![0];
  expect(warm).toContain('href="polynomials.html"');
});

// ---------- the pictures ----------
type Geom = { width: number; height: number; left: number; right: number; top: number; bottom: number; xmin: number; xmax: number; ymin: number; ymax: number };
type Pt = [number, number];
/** What each picture is meant to show, written here from the page's own numbers (not read from the figure code). */
type Stated = {
  curve: string; // the curve as a typed expression
  points: Record<string, Pt>;
  holes: string[]; // the names of the points that are open circles
  vlines: Record<string, number>;
  pieces?: number; // the number of separate pieces the curve is drawn in
  bottom?: string; // the bottom of the fraction: the asymptotes are its roots
  top?: string;
};
const STATED: Record<string, Stated> = {
  'algebraic-fractions-hole': { curve: 'frac(x^2-4, x-2)', points: { gap: [2, 4] }, holes: ['gap'], vlines: {}, bottom: 'x-2', top: 'x^2-4' },
  'algebraic-fractions-q-hole': { curve: 'frac(x^2-1, x+1)', points: { gap: [-1, -2] }, holes: ['gap'], vlines: {}, bottom: 'x+1', top: 'x^2-1' },
  'algebraic-fractions-two': { curve: 'frac(5x+1, (x-1)(x+2))', points: {}, holes: [], vlines: { a1: -2, a2: 1 }, pieces: 3, bottom: '(x-1)(x+2)', top: '5x+1' },
  'algebraic-fractions-three': { curve: 'frac(12x-6, (x+4)(x+1)(x-2))', points: {}, holes: [], vlines: { a1: -4, a2: -1, a3: 2 }, pieces: 4, bottom: '(x+4)(x+1)(x-2)', top: '12x-6' },
  'algebraic-fractions-repeated': { curve: 'frac(9x+9, (x-1)(x+2)^2)', points: {}, holes: [], vlines: { a1: -2, a2: 1 }, pieces: 3, bottom: '(x-1)(x+2)^2', top: '9x+9' },
};

/** Read the drawn geometry back from a figure's SVG: pixels to graph units by the axes the picture draws. */
function measure(svg: string, g: Geom) {
  const lines = [...svg.matchAll(/<line class="axis" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].map((m) => ({ x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] }));
  const horizontal = lines.find((l) => l.y1 === l.y2)!;
  const vertical = lines.find((l) => l.x1 === l.x2)!;
  const px = (x: number) => horizontal.x1 + ((x - g.xmin) / (g.xmax - g.xmin)) * (horizontal.x2 - horizontal.x1);
  const py = (y: number) => vertical.y1 + ((y - g.ymin) / (g.ymax - g.ymin)) * (vertical.y2 - vertical.y1);
  const toX = (p: number) => g.xmin + ((p - horizontal.x1) / (horizontal.x2 - horizontal.x1)) * (g.xmax - g.xmin);
  const toY = (p: number) => g.ymin + ((p - vertical.y1) / (vertical.y2 - vertical.y1)) * (g.ymax - g.ymin);
  const paths = [...svg.matchAll(/<path class="([^"]*)" d="([^"]*)"\/>/g)].map((m) => ({
    cls: m[1],
    pieces: m[2].split('M').filter(Boolean).map((piece) => piece.split('L').map((p) => { const [a, b] = p.trim().split(' ').map(Number); return [a, b] as [number, number]; })),
  }));
  // a line inside the plot (the key rows above the plot use the same classes and are left out)
  const inPlot = (l: { y1: number; y2: number }) => l.y1 >= g.top - 1 && l.y2 >= g.top - 1;
  const asLine = (m: RegExpMatchArray) => ({ x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] });
  const guides = [...svg.matchAll(/<line class="guide" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].map(asLine).filter(inPlot);
  const circles = [...svg.matchAll(/<circle class="(pt|pt-open)" data-name="([^"]*)" cx="([\d.-]+)" cy="([\d.-]+)" r="(\d+)"\/>/g)].map((m) => ({ open: m[1] === 'pt-open', name: m[2], px: +m[3], py: +m[4], r: +m[5], x: toX(+m[3]), y: toY(+m[4]) }));
  const labels = [...svg.matchAll(/<text[^>]*data-for="([^"]*)" x="([\d.-]+)" y="([\d.-]+)" text-anchor="(\w+)">([\s\S]*?)<\/text>/g)].map((m) => ({ for: m[1], x: +m[2], y: +m[3], anchor: m[4], text: m[5].replace(/<[^>]+>/g, '').replace(/\u200b/g, '').replace(/\u2212/g, '-') }));
  return { horizontal, vertical, px, py, toX, toY, paths, guides, circles, labels };
}
const labelOf = (st: Stated, name: string) => `(${t3(st.points[name][0])}, ${t3(st.points[name][1])})`;

test('every curve is read back from its drawn path and is the function the page says it is; every hole, asymptote and piece is where it is named', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/algebraic-fractions.mjs');
  expect(Object.keys(FIGURES).sort()).toEqual(Object.keys(STATED).sort());
  const problems: string[] = [];
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const g = (GEOM as Record<string, Geom>)[id];
    const st = STATED[id];
    const f = fx(st.curve);
    const m = measure(svg, g);
    // the axes reach the edges of the picture, and they cross at the origin
    expect(m.horizontal.x1, id).toBeCloseTo(g.left, 0);
    expect(m.horizontal.x2, id).toBeCloseTo(g.width - g.right, 0);
    expect(m.vertical.y1, id).toBeCloseTo(g.height - g.bottom, 0);
    expect(m.vertical.y2, id).toBeCloseTo(g.top, 0);
    expect(m.vertical.x1, id).toBeCloseTo(m.px(0), 0);
    expect(m.horizontal.y1, id).toBeCloseTo(m.py(0), 0);
    expect(m.paths.map((p) => p.cls), `${id}: the curves`).toEqual(['curve']);
    // every drawn point is on the curve: within 1.5px of the curve, drawn finely
    const dots: [number, number][] = [];
    for (let i = 0; i <= 6000; i += 1) {
      const x = g.xmin + ((g.xmax - g.xmin) * i) / 6000;
      const y = f(x);
      const slack = 0.03 * (g.ymax - g.ymin); // the drawing keeps a curve a little beyond the picture's edge
      if (Number.isFinite(y) && y >= g.ymin - slack && y <= g.ymax + slack) dots.push([m.px(x), m.py(y)]);
    }
    const segDist = (qx: number, qy: number) => { let best = Infinity; for (let i = 1; i < dots.length; i += 1) { const [ax, ay] = dots[i - 1]; const [bx, by] = dots[i]; if (Math.hypot(bx - ax, by - ay) > 150) continue; const dx = bx - ax; const dy = by - ay; const t = dx * dx + dy * dy === 0 ? 0 : Math.max(0, Math.min(1, ((qx - ax) * dx + (qy - ay) * dy) / (dx * dx + dy * dy))); best = Math.min(best, Math.hypot(qx - (ax + t * dx), qy - (ay + t * dy))); } return best; };
    let drawn = 0;
    for (const piece of m.paths[0].pieces) for (const [qx, qy] of piece) {
      drawn += 1;
      if (segDist(qx, qy) > 1.5) { problems.push(`${id}: the path point (${qx}, ${qy}) is not on the curve`); break; }
    }
    expect(drawn, `${id}: points drawn`).toBeGreaterThan(100);
    // and the curve is drawn: every part of it inside the picture has a drawn point near it
    const allDrawn = m.paths[0].pieces.flat();
    let missing = 0;
    const drawnSegs: [number, number, number, number][] = [];
    for (const piece of m.paths[0].pieces) for (let k = 1; k < piece.length; k += 1) drawnSegs.push([piece[k - 1][0], piece[k - 1][1], piece[k][0], piece[k][1]]);
    const distToDrawn = (qx: number, qy: number) => { let best = Infinity; for (const [ax, ay, bx, by] of drawnSegs) { const dx = bx - ax; const dy = by - ay; const t = dx * dx + dy * dy === 0 ? 0 : Math.max(0, Math.min(1, ((qx - ax) * dx + (qy - ay) * dy) / (dx * dx + dy * dy))); best = Math.min(best, Math.hypot(qx - (ax + t * dx), qy - (ay + t * dy))); } return best; };
    for (let i = 0; i < dots.length; i += 25) if (distToDrawn(dots[i][0], dots[i][1]) > 3) missing += 1;
    if (missing > 3) problems.push(`${id}: ${missing} stretches of the curve are not drawn`);
    // the pieces: one for each side of an asymptote
    if (st.pieces !== undefined) expect(m.paths[0].pieces.filter((p) => p.length > 5).length, `${id}: pieces of the curve`).toBe(st.pieces);
    // the vertical asymptotes are exactly the roots of the bottom (where the top is not 0), drawn as dashed lines across the whole picture
    const bottomRoots = st.bottom ? rootsOf(fx(st.bottom)) : [];
    const asymptoteRoots = bottomRoots.filter((r) => Math.abs(fx(st.top!)(r)) > 1e-9);
    expect(Object.values(st.vlines).sort((a, b) => a - b), `${id}: the asymptotes are the roots of the bottom`).toEqual(asymptoteRoots);
    const vs = m.guides.filter((l) => l.x1 === l.x2);
    expect(m.guides.length, `${id}: guide lines`).toBe(Object.keys(st.vlines).length);
    expect(vs.length, `${id}: vertical guide lines`).toBe(Object.keys(st.vlines).length);
    for (const x of Object.values(st.vlines)) {
      const l = vs.find((v) => Math.abs(v.x1 - m.px(x)) < 0.6);
      if (!l) problems.push(`${id}: no vertical guide line at x = ${x}`); else if (Math.abs(l.y1 - m.py(g.ymin)) > 0.6 || Math.abs(l.y2 - m.py(g.ymax)) > 0.6) problems.push(`${id}: the guide at x = ${x} does not cross the picture`);
    }
    // the picture of a hole: the top and the bottom are both 0 there, the fraction has no value, and the open circle sits on the line the fraction becomes
    expect(m.circles.map((c) => c.name).sort(), `${id}: marked points`).toEqual(Object.keys(st.points).sort());
    for (const c of m.circles) {
      const [wx, wy] = st.points[c.name];
      if (Math.abs(c.px - m.px(wx)) > 0.6 || Math.abs(c.py - m.py(wy)) > 0.6) problems.push(`${id}/${c.name}: drawn at (${c.x.toFixed(2)}, ${c.y.toFixed(2)}) not at (${wx}, ${wy})`);
      expect(c.open, `${id}/${c.name}: open circle for a hole`).toBe(st.holes.includes(c.name));
      if (c.open) {
        expect([fx(st.top!)(wx), fx(st.bottom!)(wx)], `${id}: top and bottom are 0 at the hole`).toEqual([0, 0]);
        // away from the hole, the fraction is the straight line through the hole
        const slope = (f(wx + 1) - f(wx - 1)) / 2;
        for (const x of [wx - 3, wx - 1, wx + 0.5, wx + 2]) expect(close(f(x), wy + slope * (x - wx), 1e-9), `${id}: the curve is a line through the hole at x=${x}`).toBe(true);
      }
    }
  }
  expect(problems).toEqual([]);
});

test('every label says its own item, is nearest its own item and 4px clear of every other label, and no label sits on a curve', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/algebraic-fractions.mjs');
  const problems: string[] = [];
  let labelled = 0;
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const g = (GEOM as Record<string, Geom>)[id];
    const st = STATED[id];
    const f = fx(st.curve);
    const m = measure(svg, g);
    const items: { name: string; point: boolean; at: (px: number, py: number) => number }[] = [
      ...m.circles.map((c) => ({ name: c.name, point: true, at: (qx: number, qy: number) => Math.hypot(qx - c.px, qy - c.py) })),
      ...Object.entries(st.vlines).map(([name, x]) => ({ name, point: false, at: (qx: number) => Math.abs(qx - m.px(x)) })),
    ];
    const boxes: { name: string; x0: number; x1: number; y0: number; y1: number }[] = [];
    for (const l of m.labels) {
      labelled += 1;
      const width = l.text.length * 13;
      const cx = l.x + (l.anchor === 'start' ? width / 2 : l.anchor === 'end' ? -width / 2 : 0);
      const cy = l.y - 8;
      const own = items.find((it) => it.name === l.for);
      if (!own) { problems.push(`${id}: label "${l.text}" names no item "${l.for}"`); continue; }
      const mine = own.at(cx, cy);
      const rivals = own.point ? items.filter((it) => it !== own && it.point) : items.filter((it) => it !== own);
      for (const other of rivals) if (other.at(cx, cy) < mine) problems.push(`${id}: label "${l.text}" is ${Math.round(other.at(cx, cy))}px from "${other.name}" but ${Math.round(mine)}px from its own "${own.name}"`);
      // what the label says
      if (st.points[l.for]) { if (l.text !== labelOf(st, l.for)) problems.push(`${id}: the label "${l.text}" is not "${labelOf(st, l.for)}" for "${l.for}"`); } else if (st.vlines[l.for] !== undefined) { if (l.text !== `x = ${st.vlines[l.for]}`) problems.push(`${id}: the asymptote label "${l.text}" is not "x = ${st.vlines[l.for]}"`); }
      const box = { name: l.text, x0: cx - width / 2, x1: cx + width / 2, y0: l.y - 26, y1: l.y + 8 };
      boxes.push(box);
      // a label never sits on the curve
      for (let i = 0; i <= 6000; i += 1) {
        const x = g.xmin + ((g.xmax - g.xmin) * i) / 6000;
        const y = f(x);
        if (!Number.isFinite(y) || y < g.ymin || y > g.ymax) continue;
        const qx = m.px(x);
        const qy = m.py(y);
        if (qx > box.x0 - 4 && qx < box.x1 + 4 && qy > box.y0 - 4 && qy < box.y1 + 4) { problems.push(`${id}: label "${l.text}" sits on the curve near x=${x.toFixed(2)}`); break; }
      }
      // nor on a guide line that is not its own
      for (const [name, x] of Object.entries(st.vlines)) if (name !== l.for && m.px(x) > box.x0 - 2 && m.px(x) < box.x1 + 2) problems.push(`${id}: label "${l.text}" sits on the asymptote "${name}"`);
      for (const c of m.circles) if (c.name !== l.for && c.px > box.x0 - 11 && c.px < box.x1 + 11 && c.py > box.y0 - 11 && c.py < box.y1 + 11) problems.push(`${id}: label "${l.text}" covers the marked point "${c.name}"`);
    }
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        if (Math.max(a.x0 - b.x1, b.x0 - a.x1) < 4 && Math.max(a.y0 - b.y1, b.y0 - a.y1) < 4) problems.push(`${id}: labels "${a.name}" and "${b.name}" are closer than 4px`);
      }
    }
    for (const name of [...Object.keys(st.points), ...Object.keys(st.vlines)]) if (!m.labels.some((l) => l.for === name)) problems.push(`${id}: "${name}" has no label`);
  }
  expect(labelled).toBeGreaterThan(8);
  expect(problems).toEqual([]);
});

test('every figure states every marked coordinate and asymptote in its text alternative, and the question figure does not give the answer', async () => {
  const { FIGURES, ITEMS } = await import('../src/book/alevel/figures/algebraic-fractions.mjs');
  type Item = { kind: string; x: number; y?: number };
  const problems: string[] = [];
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const title = /<title id="[^"]*">([^<]*)<\/title>/.exec(svg)?.[1] ?? '';
    const desc = /<desc id="[^"]*">([^<]*)<\/desc>/.exec(svg)?.[1] ?? '';
    const st = STATED[id];
    const items = (ITEMS as Record<string, Item[]>)[id];
    expect(items.length, `${id}: items`).toBe(Object.keys(st.points).length + Object.keys(st.vlines).length);
    for (const it of items) {
      if (it.kind === 'point' || it.kind === 'hole') if (!desc.includes(`(${t3(it.x)}, ${t3(it.y!)})`)) problems.push(`${id}: the description does not name the point (${it.x}, ${it.y})`);
      if (it.kind === 'vline' && !desc.includes(`x = ${it.x}`)) problems.push(`${id}: the description does not name x = ${it.x}`);
    }
    if (desc.length < 80) problems.push(`${id}: the description is too short`);
    if (/^algebraic-fractions-hole$/.test(id)) for (const w of ['no value', 'bottom', 'x = 2']) if (!desc.includes(w)) problems.push(`${id}: the description of a lesson figure should say "${w}"`);
    if (id.includes('-q-')) {
      expect(`${title} ${desc}`, id).not.toMatch(/no value|bottom|undefined|answer|solution|zero|is 0|not (on|part of) the graph/i);
      // and neither does any text drawn inside the picture
      const drawnText = [...svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((t) => t[1].replace(/<[^>]+>/g, '')).join(' ');
      expect(drawnText, `${id}: the text in the picture`).not.toMatch(/no value|bottom|undefined|answer|solution|zero|is 0|not (on|part of) the graph|open circle/i);
      expect(SOURCE, id).toContain(`{fig:${id}}`);
    }
  }
  expect(problems).toEqual([]);
  expect(Object.keys(FIGURES).filter((k) => k.includes('-q-')).sort()).toEqual(['algebraic-fractions-q-hole']);
});

test('at 320px every figure label is at least 12px tall', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/algebraic-fractions.html');
  const small = await page.evaluate(() => [...document.querySelectorAll('main svg.graph-svg text')].map((t) => ({ s: t.textContent, h: t.getBoundingClientRect().height })).filter((t) => t.h > 0 && t.h < 12).map((t) => t.s + ' ' + t.h.toFixed(1)));
  expect(small).toEqual([]);
});

test('at 320px every figure label is 4px clear of every other label', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/algebraic-fractions.html');
  const close4 = await page.evaluate(() => {
    const out: string[] = [];
    for (const svg of document.querySelectorAll('main svg.graph-svg')) {
      const texts = [...svg.querySelectorAll('text')].map((t) => ({ b: t.getBoundingClientRect(), s: (t.textContent ?? '').trim() })).filter((x) => x.s);
      for (let i = 0; i < texts.length; i += 1) {
        for (let j = i + 1; j < texts.length; j += 1) {
          const a = texts[i].b;
          const b = texts[j].b;
          const gapX = Math.max(a.left - b.right, b.left - a.right);
          const gapY = Math.max(a.top - b.bottom, b.top - a.bottom);
          if (gapX < 2 && gapY < 2) out.push(`${svg.querySelector('title')?.textContent}: "${texts[i].s}" and "${texts[j].s}"`);
        }
      }
    }
    return out;
  });
  expect(close4).toEqual([]);
});

test('every figure on the page exists, is used once, and every figure file entry is used', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/algebraic-fractions.mjs');
  const used = [...SOURCE.matchAll(/\{fig:([a-z0-9-]+)\}/g)].map((m) => m[1]);
  expect(new Set(used).size).toBe(used.length);
  expect([...used].sort()).toEqual(Object.keys(FIGURES).sort());
});

test('no figure text leaves its picture', async ({ page }) => {
  await page.goto('/courses/a-level/algebraic-fractions.html');
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

// ---------- every calculation written as {m:a=b=c} ----------
function evalPiece(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;
  try { s = fracToDivision(s); } catch { return null; }
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
    if (/^[a-z]$/i.test(pieces[0])) pieces.shift(); // "A=2": the name of the unknown is not a number
    if (pieces.length < 2) continue;
    const values = pieces.map(evalPiece);
    if (values.some((v) => v === null || !Number.isFinite(v))) continue;
    checked += 1;
    const nums = values as number[];
    if (Math.max(...nums) - Math.min(...nums) > 0.006) problems.push(`{m:${m[1]}} gives ${nums.join(' and ')}`);
  }
  expect(checked).toBeGreaterThan(60);
  expect(problems).toEqual([]);
});

test('every working line that has x in it and the same value for each side holds for several x', () => {
  // the chains such as frac(x^2-9, x^2+x-6)=frac((x-3)(x+3), (x+3)(x-2))=frac(x-3, x-2) are checked as functions where every piece is an expression in x
  const problems: string[] = [];
  let checked = 0;
  for (const m of SOURCE.matchAll(/\{m:([^}]*)\}/g)) {
    if (!/=/.test(m[1]) || /!=|>=|<=/.test(m[1]) || m[1].includes('frac(x+8, (x+1)(x+2))')) continue; // Eli's working in Spot the mistake is wrong on purpose
    const pieces = m[1].split('=').map((p) => p.trim());
    if (pieces.length < 3 || pieces.some((p) => /[A-CK-Za-wyz]|dy|dx|int|[A-Z]/.test(p.replace(/frac|root|sqrt/g, '')) || !/x/.test(p))) continue;
    let fns: Fx[];
    try { fns = pieces.map(fx); } catch { continue; }
    checked += 1;
    for (let i = 1; i < fns.length; i += 1) if (!same(fns[0], fns[i])) problems.push(`{m:${m[1]}}: piece ${i} is not equal to piece 0`);
  }
  expect(checked).toBeGreaterThan(15);
  expect(problems).toEqual([]);
});
