import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Functions page that a general test cannot make:
//   - every typed key is RECOMPUTED here from the question's own numbers (a value by evaluating, a solution by scanning for a sign
//     change, a domain by finding where the formula breaks, a range by scanning the outputs, an inverse by composing it with the
//     function, a composite by putting one function inside the other);
//   - every wrong-answer value is recomputed from the slip its message names, and the message is checked for that slip;
//   - every multiple-choice key is decided from a function, never from the option's wording;
//   - every blank in a "Now you finish it" box is recomputed;
//   - students' usual typings go through the real answer checker (public/js/book-answer.mjs);
//   - every mapping diagram and every curve is read back from the SVG and compared with the function the page says it is;
//   - every marked point is on its curve, every guide line is drawn where it is named, every label says its own point's coordinates
//     and sits nearest its own item, no label sits on a curve, labels keep 4px apart, and no SVG text leaves the picture;
//   - the general-rule sentences on the page are pinned with the maths behind them.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'functions.html'), 'utf8');

const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const typedList = (xs: number[]) => [...xs].sort((a, b) => a - b).map((v) => String(v + 0)).join(' or ');

/** The real solutions of f(x) = 0 on [lo, hi], by scanning for a sign change (a pole is not a solution). */
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

// ---------- reading the page's questions ----------
const ENTITIES: Record<string, string> = {
  lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', ldquo: '"', rdquo: '"', rsquo: "'", nbsp: ' ', times: '*', sup2: '\u00b2', sup3: '\u00b3', sup1: '\u00b9', hellip: '...', middot: '.',
  le: '\u2264', ge: '\u2265', ne: '\u2260', radic: '\u221a', pi: '\u03c0', plusmn: '+-', pound: '\u00a3',
};
const decode = (t: string) => t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n] ?? m);
const plain = (h: string) => decode(h.replace(/<[^>]+>/g, '').replace(/\{term:[^|}]*\|([^}]*)\}/g, '$1').replace(/\{term:([^}]*)\}/g, '$1').replace(/\{m:/g, '').replace(/\}/g, '')).replace(/\s+/g, ' ').trim();

/** A typed answer as a function of one variable: an expression such as (x+3)/4, 2t-5, 3+sqrt(x-2), ln(x-4) or 36pi. */
function algv(t: string, v = 'x'): (x: number) => number {
  let s = decode(t).replace(/\s+/g, '').replace(/\u2212/g, '-').replace(/^[a-z]{1,2}(?:\(x\))?=/, '');
  s = s.replace(/sqrt|\u221a/g, '@S').replace(/ln/g, '@L').replace(/pi|\u03c0/g, '@P').replace(new RegExp(v, 'g'), 'x');
  s = s.replace(/@S/g, 'Math.sqrt').replace(/@L/g, 'Math.log').replace(/@P/g, 'Math.PI');
  // a power is written as Math.pow so that a minus sign in front of it is read as -(base^n), as in algebra
  s = s.replace(/(\([^()]*\)|[\d.]+|x)\^(\d+)/g, 'Math.pow($1,$2)').replace(/(\d|\))(?=[xM(])/g, '$1*').replace(/x(?=[xM(\d])/g, 'x*');
  return new Function('x', `return (${s});`) as (x: number) => number;
}
const SAMPLES = [-3.7, -1.3, 0.7, 1.9, 4.3, 6.1];
const numbersIn = (t: string) => t.replace(/\band\b|\bor\b|[(),]/g, ' ').trim().split(/\s+/).filter(Boolean).map((p) => { const m = /^(-?[\d.]+)\/([\d.]+)$/.exec(p); return m ? Number(m[1]) / Number(m[2]) : Number(p); });
/** Whether two typed numbers, lists ("-1 or 2") or pairs ("2,5") have the same value. */
function sameValue(x: string, y: string, tol = 1e-9): boolean {
  const lists = [x, y].map((t) => /\bor\b/.test(t));
  if (lists[0] !== lists[1]) return false;
  const a = numbersIn(x);
  const b = numbersIn(y);
  if (lists[0]) { a.sort((p, q) => p - q); b.sort((p, q) => p - q); }
  return a.length === b.length && a.every((v, i) => close(v, b[i], tol));
}

type Wrong = { values: string[]; text: string; claimed: boolean };
type Question = { plain: string; mode: string; answers: string[]; wrongs: Wrong[]; block: string; type: string };
function questions(): Question[] {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongList = /<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '';
    const wrongs = [...wrongList.matchAll(/<li data-if="([^"]*)">([\s\S]*?)<\/li>/g)].map((m) => ({ values: decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean), text: m[2], claimed: false }));
    return { plain: plain(/<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? ''), mode: /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? 'value', answers, wrongs, block, type: /data-type="([^"]*)"/.exec(attrs)?.[1] ?? 'typed' };
  });
}

// ---------- the one rule every point question uses, written here from the maths ----------
type Pt = [number, number];
const pt = ([x, y]: Pt) => `${x + 0},${y + 0}`;
/** Where the point (p, q) of y = f(x) goes on y = a f(b x + c) + d: the new x makes the inside of the bracket equal p. */
const img = ([p, q]: Pt, { a = 1, b = 1, c = 0, d = 0 }: { a?: number; b?: number; c?: number; d?: number } = {}): Pt => [(p - c) / b, a * q + d];
/** Where the point (a, b) of a function's graph goes on the graph of its inverse: a reflection in y = x swaps the coordinates. */
const mirror = ([p, q]: Pt): Pt => [q, p];

// ---------- domains and ranges, recomputed by scanning ----------
const GRID = Array.from({ length: 6001 }, (_, i) => Math.round((-30 + i * 0.01) * 100) / 100);
const norm = (t: string) => decode(t).replace(/\s+/g, '').replace(/\u2212/g, '-').replace(/\u2264/g, '<=').replace(/\u2265/g, '>=').replace(/\u2260/g, '!=');
/** A typed domain or range ("x>=5", "x!=2", "x<=1 or x>=5", "1<=g(x)<=7", "f(x)>3") as a yes/no function of the number. */
function setPred(typed: string): (v: number) => boolean {
  const segs = decode(typed).split(/\bor\b/).map(norm).map((seg) => {
    const toks = seg.split(/(<=|>=|!=|<|>)/);
    const val = (tok: string, v: number) => (/^-?[\d.]+$/.test(tok) ? Number(tok) : v);
    const cmp = (op: string, a: number, b: number) => (op === '<=' ? a <= b : op === '>=' ? a >= b : op === '<' ? a < b : op === '>' ? a > b : a !== b);
    if (toks.length === 3) return (v: number) => cmp(toks[1], val(toks[0], v), val(toks[2], v));
    if (toks.length === 5) return (v: number) => cmp(toks[1], val(toks[0], v), val(toks[2], v)) && cmp(toks[3], val(toks[2], v), val(toks[4], v));
    throw new Error(`cannot read the set "${typed}"`);
  });
  return (v) => segs.some((s) => s(v));
}
const samePred = (a: (v: number) => boolean, b: (v: number) => boolean) => GRID.every((v) => a(v) === b(v));
/** The set of x for which a formula gives a real number (a pole or a root of a negative number is not in it). */
const definedSet = (F: (x: number) => number) => (x: number) => Number.isFinite(F(x));
/**
 * The set of outputs of F over the sample inputs xs, as a yes/no function of y (y a multiple of 0.01): F reaches y exactly, or F
 * passes through y between two neighbouring inputs (two neighbours more than 2 apart are a jump over an asymptote, not a crossing).
 */
function rangeSet(F: (x: number) => number, xs: number[]) {
  const ys = xs.map(F);
  const member = new Set<number>();
  ys.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    const k = Math.round(v * 100);
    if (Math.abs(v * 100 - k) < 1e-9) member.add(k);
    const w = ys[i - 1];
    if (i > 0 && Number.isFinite(w) && Math.abs(v - w) < 2) for (let j = Math.ceil(Math.min(v, w) * 100 - 1e-9); j <= Math.floor(Math.max(v, w) * 100 + 1e-9); j += 1) member.add(j);
  });
  return (y: number) => member.has(Math.round(y * 100));
}
const xsFrom = (lo: number, hi: number, step = 0.01) => Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => Math.round((lo + i * step) * 1e6) / 1e6);
/** A domain written as the page writes it, found by scanning: x>=a, x>a, x!=a or x<=a or x>=b. */
function domainString(defined: (x: number) => boolean): string {
  // the point where "defined" flips between a and b, and whether that point itself is in the domain
  const edge = (a: number, b: number) => { let lo = a; let hi = b; for (let k = 0; k < 60; k += 1) { const m = (lo + hi) / 2; if (defined(m) === defined(a)) lo = m; else hi = m; } const e = Math.round(hi * 1e6) / 1e6; return `${defined(e) ? '=' : ''}${e}`; };
  const runs: [number, number][] = [];
  let start: number | null = null;
  GRID.forEach((x, i) => {
    if (defined(x) && start === null) start = x;
    if (start !== null && (!defined(x) || i === GRID.length - 1)) { runs.push([start, defined(x) ? x : GRID[i - 1]]); start = null; }
  });
  const top = GRID[GRID.length - 1];
  if (runs.length === 1 && runs[0][1] === top && runs[0][0] > GRID[0]) return `x>${edge(runs[0][0] - 0.01, runs[0][0])}`;
  if (runs.length === 2 && runs[0][0] === GRID[0] && runs[1][1] === top) {
    if (Math.round((runs[1][0] - runs[0][1]) * 100) === 2) return `x!=${Math.round(((runs[0][1] + runs[1][0]) / 2) * 100) / 100}`;
    return `x<${edge(runs[0][1], runs[0][1] + 0.01)} or x>${edge(runs[1][0] - 0.01, runs[1][0])}`;
  }
  throw new Error('a shape of domain this test does not write');
}
/** A range written as the page writes it: name>=a, name>a or a<=name<=b. `ends` says whether the ends of the sample window are really in the domain. */
function rangeString(name: string, F: (x: number) => number, xs: number[], ends: 'closed' | 'open'): string {
  const ys = xs.map(F);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const attained = (v: number) => ys.some((y, i) => close(y, v, 1e-12) && (ends === 'closed' || (i > 0 && i < ys.length - 1)));
  const round = (v: number) => Math.round(v * 1e3) / 1e3;
  if (hi > 1e3) return `${name}>${attained(lo) ? '=' : ''}${round(lo)}`;
  return `${round(lo)}<${attained(lo) ? '=' : ''}${name}<${attained(hi) ? '=' : ''}${round(hi)}`;
}

// ---------- the checks ----------
type Slip = { value: string; says: RegExp; fn?: (x: number) => number };
type Check = { find: string; ref: string; truth: (typed: string) => boolean; same: (a: string, b: string) => boolean; slips?: Slip[]; fnSame?: (typed: string, fn: (x: number) => number) => boolean };
const val = (find: string, ref: string, slips: Slip[] = []): Check => ({ find, ref, slips, truth: (t) => sameValue(t, ref), same: (a, b) => sameValue(a, b) });
const alg = (find: string, ref: string, fn: (x: number) => number, slips: Slip[] = [], v = 'x', samples = SAMPLES): Check => ({
  find, ref, slips,
  truth: (t) => samples.every((s) => close(algv(t, v)(s), fn(s), 1e-7)),
  same: (a, b) => samples.every((s) => close(algv(a, v)(s), algv(b, v)(s), 1e-7)),
  fnSame: (t, g) => samples.every((s) => close(algv(t, v)(s), g(s), 1e-7)),
});
const set = (find: string, truthSet: (v: number) => boolean, ref: string, slips: Slip[] = []): Check => ({
  find, ref, slips,
  truth: (t) => samePred(setPred(t), truthSet),
  same: (a, b) => samePred(setPred(a), setPred(b)),
});
/** A typed inverse is right when it undoes f both ways: f(inv(y)) = y on the outputs, and inv(f(x)) = x on the inputs. */
const inverse = (find: string, ref: string, f: (x: number) => number, ins: number[], outs: number[], slips: Slip[] = []): Check => ({
  find, ref, slips,
  truth: (t) => outs.every((y) => close(f(algv(t)(y)), y, 1e-7)) && ins.every((x) => close(algv(t)(f(x)), x, 1e-7)),
  same: (a, b) => outs.every((y) => close(algv(a)(y), algv(b)(y), 1e-7)),
  fnSame: (t, g) => outs.every((y) => close(algv(t)(y), g(y), 1e-7)),
});
/** A typed function f is right when f(g(x)) is the composite h(x) the question names. */
const composes = (find: string, ref: string, g: (x: number) => number, h: (x: number) => number, slips: Slip[] = []): Check => ({
  find, ref, slips,
  truth: (t) => SAMPLES.every((s) => close(algv(t)(g(s)), h(s), 1e-7)),
  same: (a, b) => SAMPLES.every((s) => close(algv(a)(s), algv(b)(s), 1e-7)),
  fnSame: (t, k) => SAMPLES.every((s) => close(algv(t)(s), k(s), 1e-7)),
});

const POS = [0.7, 1.9, 4.3, 6.1, 9.4];
// the functions the questions name, written here from the questions' own numbers
const sqF = (x: number) => x * x;
const fWarm = (x: number) => x * x + 1;
const fSub5 = (x: number) => Math.sqrt(x - 5);
const fFrac = (x: number) => 3 / (2 * x - 4);
const fInvSqrt = (x: number) => 1 / Math.sqrt(x - 4);
const fPlus3 = (x: number) => x * x + 3;
const gLine = (x: number) => 2 * x - 1;
const hQuad = (x: number) => x * x - 6 * x + 11;
const f43 = (x: number) => 4 * x - 3;
const fRoot3 = (x: number) => (x - 3) ** 2 + 2;
const fExp4 = (y: number) => Math.exp(y) + 4;
const fQ4 = (x: number) => x * x - 4 * x;
const fQuad14 = (x: number) => x * x - 6 * x + 14;
const frac13 = (x: number) => (x + 1) / (x - 3);
const gBowl = (x: number) => (x - 1) ** 2 - 2;
const sinD = (x: number) => Math.sin((x * Math.PI) / 180);
const asc = (n: number, lo: number, step: number) => Array.from({ length: n }, (_, i) => lo + i * step);

const CHECKS: Check[] = [
  // ----- warm-up and recap -----
  val('Work out f(-3)', String(fWarm(-3)), [{ value: String(-(3 ** 2) + 1), says: /\(-3\)\^2 as -9/ }, { value: String(-3 + 1), says: /did not square/ }]),
  val('matching point on the graph of y=f(x-1)+3', pt(img([2, 5], { c: -1, d: 3 })), [{ value: pt([2 - 1, 5 + 3]), says: /moved the point to the left/ }, { value: pt([3, 5 - 3]), says: /subtracted 3/ }]),
  alg('Make x the subject of y=2x+7', '(y-7)/2', (y) => (y - 7) / 2, [{ value: '(y+7)/2', fn: (y) => (y + 7) / 2, says: /added 7/ }, { value: 'y/2-7', fn: (y) => y / 2 - 7, says: /divided y by 2 but not the 7/ }], 'y'),
  val('lowest value of (x-2)^2+3', String(Math.min(...xsFrom(-10, 10).map((x) => (x - 2) ** 2 + 3))), [{ value: String(xsFrom(-10, 10).reduce((best, x) => ((x - 2) ** 2 + 3 < (best - 2) ** 2 + 3 ? x : best), 0)), says: /value of x where the lowest value happens/ }]),
  val('Solve x^2-5x+6=0', typedList(solve((x) => x * x - 5 * x + 6)), [{ value: typedList(solve((x) => x * x - 5 * x + 6).map((r) => -r)), says: /opposite sign to the number in its bracket/ }]),
  alg('Expand (2x+1)^2', '4x^2+4x+1', (x) => (2 * x + 1) ** 2, [{ value: '4x^2+1', fn: (x) => (2 * x) ** 2 + 1, says: /left out the middle term/ }]),
  // ----- 1. mappings and functions -----
  val('f(x)=4-x^2. Find f(-3)', String(4 - (-3) ** 2), [{ value: String(4 + 3 ** 2), says: /changed the sign of the square/ }, { value: String(4 - -6), says: /\(-3\)\^2 as -6/ }]),
  alg('Write h(t-3) in simplified form', '2t-5', (t) => 2 * (t - 3) + 1, [{ value: '2t-2', fn: (t) => 2 * t - 3 + 1, says: /multiplied only the t by 2/ }, { value: 't-2', fn: (t) => t - 3 + 1, says: /left out the 2/ }], 't'),
  val('How many different outputs', String(new Set([-3, -2, -1, 1, 2, 3].map(sqF)).size), [{ value: String([-3, -2, -1, 1, 2, 3].length), says: /counted the inputs/ }]),
  val('Find the other input that gives the output 0', String(solve((x) => x * x - 6 * x).filter((x) => x !== 0)[0]), [{ value: String(-6), says: /\(x\+6\)/ }]),
  // ----- 2. domain and range -----
  set('largest possible domain of f(x)=sqrt(x-5)', definedSet(fSub5), domainString(definedSet(fSub5)), [{ value: 'x>5', says: /root of 0 is 0, which is allowed/ }, { value: 'x<=5', says: /wrong direction/ }]),
  set('largest possible domain of f(x)=frac(3, 2x-4)', definedSet(fFrac), domainString(definedSet(fFrac)), [{ value: 'x!=-2', says: /changed the sign/ }]),
  set('f(x)=x^2+3 for all real x. Find the range', rangeSet(fPlus3, xsFrom(-40, 40)), rangeString('f(x)', fPlus3, xsFrom(-40, 40), 'open'), [{ value: 'f(x)>=0', says: /outputs start at 3, not at 0/ }, { value: 'f(x)>3', says: /3 is reached/ }]),
  set('g(x)=2x-1 for 1 <= x <= 4', rangeSet(gLine, xsFrom(1, 4)), rangeString('g(x)', gLine, xsFrom(1, 4), 'closed'), [{ value: '1<=g(x)<=4', says: /end values of the domain, the inputs/ }]),
  val('smallest value of h(x)', String(Math.min(...xsFrom(-10, 10).map(hQuad))), [{ value: String(hQuad(0)), says: /that is h\(0\)/i }, { value: String(xsFrom(-10, 10).reduce((best, x) => (hQuad(x) < hQuad(best) ? x : best), 0)), says: /input where the smallest value happens/ }]),
  // ----- 3. composite functions -----
  val('Find fg(3)', String((2 * 3 ** 2) + 1), [{ value: String((2 * 3 + 1) ** 2), says: /applied f first/ }, { value: String(3 ** 2), says: /stopped after g/ }]),
  alg('Write gf(x) in the form', '4x^2+4x+1', (x) => (2 * x + 1) ** 2, [{ value: '2x^2+1', fn: (x) => 2 * x * x + 1, says: /that is fg\(x\)/i }, { value: '4x^2+1', fn: (x) => (2 * x) ** 2 + 1, says: /squared each term/ }]),
  val('Solve fg(x)=6', typedList(solve((x) => x * x - 3 - 6)), [{ value: '3', says: /only the positive root/ }, { value: '9', says: /value of x\^2/ }]),
  alg('Write ff(x) in simplified form', '9x-8', (x) => 3 * (3 * x - 2) - 2, [{ value: '9x-2', fn: (x) => 3 * (3 * x) - 2, says: /multiplied only the 3x by 3/ }, { value: '6x-4', fn: (x) => 2 * (3 * x - 2), says: /2f\(x\)/ }]),
  set('largest possible domain of fg(x). Type it like x>=2', definedSet((x) => Math.sqrt(2 * x - 6)), domainString(definedSet((x) => Math.sqrt(2 * x - 6))), [{ value: 'x>=0', says: /domain of f on its own/ }, { value: 'x>=6', says: /forgot to divide by 2/ }]),
  // ----- 4. inverse functions -----
  inverse('Find f^(-1)(x). Type only the expression after f^(-1)(x)=, like (x+9)/2', '(x+3)/4', f43, asc(6, -3.7, 1.7), asc(6, -3.7, 1.7), [{ value: '(x-3)/4', fn: (x) => (x - 3) / 4, says: /subtracted 3 again/ }, { value: '4x+3', fn: (x) => 4 * x + 3, says: /changed only the sign of the 3/ }, { value: '1/(4x-3)', fn: (x) => 1 / (4 * x - 3), says: /the reciprocal/ }]),
  set('Find the domain of f^(-1). Type it like x>2 or x>=2', rangeSet(fWarm, xsFrom(0, 40)), rangeString('x', fWarm, xsFrom(0, 40), 'closed'), [{ value: 'x>=0', says: /domain of f\./ }, { value: 'x>1', says: /output 1 is reached/ }]),
  inverse('(x-3)^2+2 for x >= 3. Find f^(-1)(x)', '3+sqrt(x-2)', fRoot3, [3, 3.5, 4.2, 6, 9], [2, 2.5, 3.7, 6, 11], [{ value: '3-sqrt(x-2)', fn: (x) => 3 - Math.sqrt(x - 2), says: /negative root/ }, { value: 'sqrt(x-2)-3', fn: (x) => Math.sqrt(x - 2) - 3, says: /wrong side/ }]),
  val('Find f^(-1)(9)', String(solve((x) => 2 * x + 1 - 9)[0]), [{ value: String(2 * 9 + 1), says: /worked out f\(9\)/ }]),
  inverse('f(x)=e^x+4 for all real x', 'ln(x-4)', fExp4, [-2, -0.5, 0.3, 1.2, 2.5], [4.2, 4.8, 6, 9, 20], [{ value: 'ln(x+4)', fn: (x) => Math.log(x + 4), says: /added 4 inside the logarithm/ }, { value: 'ln(x)-4', fn: (x) => Math.log(x) - 4, says: /before you subtracted 4/ }]),
  // ----- 5. the graph of an inverse -----
  val('(2, 9) is on the graph of y=f(x)', pt(mirror([2, 9])), [{ value: pt([2, 9]), says: /original point/ }, { value: pt([-2, -9]), says: /changes both signs/ }]),
  val('Write down f^(-1)(10)', String(solve((x) => x ** 3 + x - 10)[0]), [{ value: String(2 ** 3 + 2), says: /that is f\(2\)/i }]),
  val('crosses the x-axis at (5, 0)', pt(mirror([5, 0])), [{ value: pt([5, 0]), says: /original point/ }, { value: pt([0, -5]), says: /sign does not change/ }]),
  val('x-coordinate of the point where the graph of f meets', String(solve((x) => 3 * x - 4 - x)[0]), [{ value: String(-4 / 2), says: /wrong way/ }, { value: String(4), says: /stopped after 2x=4/ }]),
  val('starts at (0, 1). Find the point where the graph of f^(-1) starts', pt(mirror([0, 1])), [{ value: pt([0, 1]), says: /starting point of f/ }]),
  // ----- 6. functions in modelling -----
  val('Find the fare for 7.2 km', String(Math.round((3 + 1.5 * 7.2) * 100) / 100), [{ value: String(Math.round(1.5 * 7.2 * 100) / 100), says: /left out the standing charge/ }]),
  val('a fare is \u00a321', String(solve((d) => 3 + 1.5 * d - 21)[0]), [{ value: String(21 / 1.5), says: /did not subtract the 3 first/ }, { value: String(21 - 3), says: /subtracted 3 and stopped/ }]),
  val('What value does V get close to for very large t', String(Math.round(3000 + 17000 * Math.exp(-0.3 * 60))), [{ value: String(3000 + 17000), says: /value at t=0/ }, { value: String(0), says: /limiting value of the model without the 3000/ }]),
  alg('as a multiple of pi', '36pi', () => 36 * Math.PI, [{ value: '12pi', fn: () => 2 * Math.PI * 6, says: /circumference/ }]),
  val('largest sensible value of t', String(solve((t) => 2 * t - 12)[0]), [{ value: String(12 * 2), says: /multiplied 12 by 2/ }]),
  // ----- flip it -----
  val('Find f^(-1)(12)', String(solve((x) => x * x - 4 * x - 12).filter((x) => x >= 2)[0]), [{ value: String(solve((x) => x * x - 4 * x - 12).filter((x) => x < 2)[0]), says: /not in the domain/ }, { value: '6 or -2', says: /one value/ }]),
  composes('Find f(x). Type it like x^5', 'x^3', (x) => 2 * x + 1, (x) => (2 * x + 1) ** 3, [{ value: '(2x+1)^3', fn: (x) => (2 * x + 1) ** 3, says: /that is h itself/i }, { value: '2x+1', fn: (x) => 2 * x + 1, says: /that is g/i }]),
  val('crosses the x-axis. Type it like (2, 0)', pt(mirror([0, (0) ** 3 + 4])), [{ value: pt([0, 4]), says: /where f crosses the y-axis/ }, { value: pt(mirror([1, 1 ** 3 + 4])), says: /swapped point for \(1, 5\)/ }]),
  // ----- mixed review -----
  set('f(x)=x^2-6x+2 for all real x. Find the range', rangeSet((x) => x * x - 6 * x + 2, xsFrom(-40, 40)), rangeString('f(x)', (x) => x * x - 6 * x + 2, xsFrom(-40, 40), 'open'), [{ value: 'f(x)>=2', says: /that is f\(0\)/i }, { value: 'f(x)>=7', says: /lost a minus sign/ }]),
  set('largest possible domain of fg(x). Type it like x!=5', definedSet((x) => 1 / (x + 2)), domainString(definedSet((x) => 1 / (x + 2))), [{ value: 'x!=0', says: /condition for f alone/ }]),
  val('Find f^(-1)(2)', String(solve((x) => frac13(x) - 2)[0]), [{ value: String(-5), says: /moved the -6 across without changing its sign/ }, { value: String(5), says: /moved the \+1 across without changing its sign/ }]),
  val('Solve gf(x)=10', typedList(solve((x) => (2 * x - 1) ** 2 + 1 - 10)), [{ value: '2', says: /only the positive root/ }, { value: String(5), says: /solved 2x-1=9/ }]),
  set('h(x)=2+e^(-x) for all real x', rangeSet((x) => 2 + Math.exp(-x), xsFrom(-10, 10)), rangeString('h(x)', (x) => 2 + Math.exp(-x), xsFrom(-10, 10), 'open'), [{ value: 'h(x)>=2', says: /output 2 is never reached/ }, { value: 'h(x)>3', says: /outputs go lower/ }]),
  // ----- exam style -----
  set('x^2-6x+14 for x >= 3. Find the range of f', rangeSet(fQuad14, xsFrom(3, 40)), rangeString('f(x)', fQuad14, xsFrom(3, 40), 'closed'), [{ value: 'f(x)>=14', says: /that is f\(0\)/i }, { value: 'f(x)>=-5', says: /lost the sign/ }]),
  inverse('x^2-6x+14 for x >= 3. Find f^(-1)(x). Type only the expression after f^(-1)(x)=. Type a square root like sqrt(x+1)', '3+sqrt(x-5)', fQuad14, [3, 3.5, 4.2, 6, 9], [5, 5.5, 7.2, 14, 30], [{ value: '3-sqrt(x-5)', fn: (x) => 3 - Math.sqrt(x - 5), says: /negative root/ }, { value: '3+sqrt(x+5)', fn: (x) => 3 + Math.sqrt(x + 5), says: /added 5 inside the root/ }]),
  val('Solve fg(x)=5. Give your answer', String(Number(solve((x) => Math.exp(2 * x + 1) - 5)[0].toPrecision(3))), [{ value: String(Math.round(((Math.log(5) + 1) / 2) * 10) / 10), says: /added 1/ }, { value: String(Number((Math.log(5) / 2).toPrecision(3))), says: /left out the 1/ }]),
  set('3*sin x-1 for 0deg <= x <= 90deg', rangeSet((x) => 3 * sinD(x) - 1, xsFrom(0, 90)), rangeString('g(x)', (x) => 3 * sinD(x) - 1, xsFrom(0, 90), 'closed'), [{ value: '-4<=g(x)<=2', says: /lowest value of sin x over a whole turn/ }, { value: '0<=g(x)<=3', says: /range of 3\*sin x/ }]),
  val('Solve fg(x)=gf(x)', String(solve((x) => (x - 2) ** 2 - (x * x - 2))[0]), [{ value: String(-1.5), says: /sign error/ }, { value: '2/3', says: /divided -4 by -6/ }]),
  set('Find the largest possible domain of f. Type it like 2<=x<=8', definedSet((x) => Math.sqrt((x - 1) * (x - 5))), domainString(definedSet((x) => Math.sqrt((x - 1) * (x - 5)))), [{ value: '1<=x<=5', says: /negative or 0, between the roots/ }, { value: 'x>=5', says: /only one of the two regions/ }]),
];

test('every typed key is recomputed, and every wrong-answer value is tied to the slip its message names', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const qs = questions();
  const problems: string[] = [];
  const checked = new Set<Question>();
  for (const c of CHECKS) {
    const found = qs.filter((q) => q.plain.includes(c.find));
    if (found.length !== 1) { problems.push(`"${c.find}" matches ${found.length} questions`); continue; }
    const q = found[0];
    checked.add(q);
    if (!matches(c.ref, q.answers, q.mode)) problems.push(`${c.find}: the key does not accept the recomputed answer "${c.ref}" (keys: ${q.answers.join(' | ')})`);
    for (const k of q.answers) if (!c.truth(k)) problems.push(`${c.find}: key "${k}" is not the recomputed answer "${c.ref}"`);
    if (!c.truth(c.ref)) problems.push(`${c.find}: the recomputed answer "${c.ref}" fails its own check`);
    for (const s of c.slips ?? []) {
      const li = q.wrongs.find((w) => matches(s.value, w.values, q.mode));
      if (!li) { problems.push(`${c.find}: no wrong-answer entry accepts the slip value "${s.value}" (entries: ${q.wrongs.map((w) => w.values.join(' | ')).join(' / ')})`); continue; }
      li.claimed = true;
      if (!s.says.test(plain(li.text))) problems.push(`${c.find}: the message for "${s.value}" does not name the slip ${s.says}: ${plain(li.text).slice(0, 90)}`);
      if (matches(s.value, q.answers, q.mode)) problems.push(`${c.find}: the slip value "${s.value}" is also a right answer`);
      if (c.truth(s.value)) problems.push(`${c.find}: the slip value "${s.value}" is really right`);
      if (s.fn && c.fnSame && !c.fnSame(s.value, s.fn)) problems.push(`${c.find}: "${s.value}" is not what the slip computes`);
      for (const v of li.values) if (!c.same(v, s.value)) problems.push(`${c.find}: "${v}" is listed with the slip but is not the slip value "${s.value}"`);
    }
    for (const w of q.wrongs) if (!w.claimed) problems.push(`${c.find}: wrong-answer entry "${w.values.join(' | ')}" has no recomputed slip`);
  }
  for (const q of qs) if (q.answers.length > 0 && !checked.has(q)) problems.push(`no recomputed key for: ${q.plain.slice(0, 70)}`);
  expect(CHECKS.length).toBe(49);
  expect(qs.length).toBe(60);
  expect(qs.filter((q) => q.type === 'mc').length).toBe(11);
  expect(problems).toEqual([]);
});

test('students\' usual typings go through the real answer checker', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const qs = questions();
  const q = (find: string) => { const f = qs.filter((x) => x.plain.includes(find)); expect(f.length, find).toBe(1); return f[0]; };
  const accept = (find: string, typings: string[]) => { const x = q(find); for (const t of typings) expect(matches(t, x.answers, x.mode), `"${t}" for ${find}`).toBe(true); };
  const reject = (find: string, typings: string[]) => { const x = q(find); for (const t of typings) expect(matches(t, x.answers, x.mode), `"${t}" for ${find}`).toBe(false); };
  accept('Make x the subject of y=2x+7', ['x=(y-7)/2', '(y-7)/2', 'x = (y - 7)/2', 'y/2-7/2', 'x=y/2-3.5', '0.5(y-7)']);
  reject('Make x the subject of y=2x+7', ['(y+7)/2', 'y-7/2', 'y/2-7']);
  accept('largest possible domain of f(x)=sqrt(x-5)', ['x>=5', 'x >= 5', 'x\u22655', '5<=x']);
  reject('largest possible domain of f(x)=sqrt(x-5)', ['x>5', 'x<=5', 'x=5', '5']);
  accept('largest possible domain of f(x)=frac(3, 2x-4)', ['x!=2', 'x \u2260 2', 'x\u22602', 'x != 2']);
  reject('largest possible domain of f(x)=frac(3, 2x-4)', ['x=2', '2', 'x!=-2']);
  accept('f(x)=x^2+3 for all real x. Find the range', ['f(x)>=3', 'f(x) >= 3', 'f(x)\u22653', 'y>=3', '3<=f(x)', 'y \u2265 3']);
  reject('f(x)=x^2+3 for all real x. Find the range', ['f(x)>3', 'f(x)>=0', 'x>=3']);
  accept('g(x)=2x-1 for 1 <= x <= 4', ['1<=g(x)<=7', '1 \u2264 g(x) \u2264 7', '7>=g(x)>=1', '1<=y<=7']);
  accept('Write gf(x) in the form', ['4x^2+4x+1', '4x\u00b2+4x+1', '1+4x+4x^2', '4x^2 + 4x + 1']);
  reject('Write gf(x) in the form', ['(2x+1)^2', '2x^2+1']);
  accept('Write ff(x) in simplified form', ['9x-8', '-8+9x', '9x - 8']);
  reject('Write ff(x) in simplified form', ['3(3x-2)-2', '9x-2']);
  accept('Solve fg(x)=6', ['-3 or 3', '3 or -3', '3, -3', 'x=3 or x=-3', '-3,3', '-3 and 3']);
  reject('Solve fg(x)=6', ['3', '-3', '9']);
  accept('Type only the expression after f^(-1)(x)=, like (x+9)/2', ['(x+3)/4', 'x/4+3/4', '0.25(x+3)', '0.25x+0.75', '(3+x)/4', 'y=(x+3)/4']);
  reject('Type only the expression after f^(-1)(x)=, like (x+9)/2', ['(x-3)/4', '4x+3', 'x+3/4']);
  accept('(x-3)^2+2 for x >= 3. Find f^(-1)(x)', ['3+sqrt(x-2)', 'sqrt(x-2)+3', '3+\u221a(x-2)', '3 + sqrt(x - 2)']);
  reject('(x-3)^2+2 for x >= 3. Find f^(-1)(x)', ['3-sqrt(x-2)', 'sqrt(x-2)-3', '3+sqrt(x+2)']);
  accept('f(x)=e^x+4 for all real x', ['ln(x-4)', 'ln(x\u22124)', 'ln (x-4)', 'ln(x - 4)']);
  reject('f(x)=e^x+4 for all real x', ['ln(x+4)', 'ln(x)-4']);
  accept('(2, 9) is on the graph of y=f(x)', ['(9,2)', '9,2', '(9, 2)', '9 2', 'x=9, y=2']);
  accept('crosses the x-axis at (5, 0)', ['(0,5)', '(0, 5)', '0,5']);
  accept('Find the fare for 7.2 km', ['13.8', '13.80', '\u00a313.80']);
  accept('as a multiple of pi', ['36pi', '36\u03c0', '36*pi']);
  reject('as a multiple of pi', ['12pi', '36', '113']);
  accept('Find f^(-1)(12)', ['6', '6.0']);
  reject('Find f^(-1)(12)', ['-2', '6 or -2']);
  accept('Find f(x). Type it like x^5', ['x^3', 'x\u00b3', 'f(x)=x^3']);
  accept('Find the largest possible domain of f. Type it like 2<=x<=8', ['x<=1 or x>=5', 'x\u22641 or x\u22655', 'x<=1 or x>=5.', 'x>=5 or x<=1', 'x <= 1 or x >= 5']);
  reject('Find the largest possible domain of f. Type it like 2<=x<=8', ['1<=x<=5', 'x>=5', 'x<=1 and x>=5']);
  accept('h(x)=2+e^(-x) for all real x', ['h(x)>2', 'y>2', 'h(x) > 2']);
  reject('h(x)=2+e^(-x) for all real x', ['h(x)>=2', 'h(x)>3']);
  accept('3*sin x-1 for 0deg <= x <= 90deg', ['-1<=g(x)<=2', '-1 \u2264 g(x) \u2264 2', '2>=g(x)>=-1', '-1<=y<=2']);
  accept('Solve fg(x)=gf(x)', ['1.5', '3/2', '1.50']);
  accept('Solve fg(x)=5. Give your answer', ['0.305', '.305']);
  reject('Solve fg(x)=5. Give your answer', ['0.3', '0.3047', '1.3']);
});

// ---------- multiple-choice keys, decided from the function ----------
const options = (find: string) => {
  const found = questions().filter((x) => x.plain.includes(find));
  expect(found.length, find).toBe(1);
  return [...found[0].block.matchAll(/<li( data-correct| data-why="([^"]*)")?>([\s\S]*?)<\/li>/g)].filter((m) => m[1]).map((m) => ({ correct: m[1] === ' data-correct', why: decode(m[2] ?? ''), text: plain(m[3]) }));
};
const correctText = (find: string) => options(find).find((o) => o.correct)?.text;

test('multiple-choice keys: each correct option is the one the maths gives, and each reason quotes right numbers', () => {
  // which statement describes a function: tested on a many-to-one function (squaring) and a one-to-one function (2x + 1)
  type Rule = (x: number) => number[];
  const sqRule: Rule = (x) => [x * x];
  const linRule: Rule = (x) => [2 * x + 1];
  const outputsOf = (rule: Rule, ins: number[]) => ins.flatMap((x) => rule(x).map((y) => [x, y] as Pt));
  const eachInputOne = (rule: Rule, ins: number[]) => ins.every((x) => rule(x).length === 1);
  const eachOutputOne = (rule: Rule, ins: number[]) => { const p = outputsOf(rule, ins); return p.every(([, y]) => p.filter(([, z]) => z === y).length === 1); };
  const eachInputTwo = (rule: Rule, ins: number[]) => ins.every((x) => rule(x).length >= 2);
  const ins = [-2, -1, 1, 2];
  expect([sqRule, linRule].map((r) => eachInputOne(r, ins))).toEqual([true, true]);
  expect([sqRule, linRule].map((r) => eachOutputOne(r, ins))).toEqual([false, true]); // the second statement is not true of every function
  expect([sqRule, linRule].map((r) => eachInputTwo(r, ins))).toEqual([false, false]);
  expect(correctText('Which statement describes a function')).toBe('Each input has exactly one output');
  expect(options('Which statement describes a function')[1].why).toContain('2 and -2');
  // f(x) = x^2: f(2) = f(-2) = 4, so many-to-one; and each input has one output, so a function
  expect([2, -2].map((x) => x * x)).toEqual([4, 4]);
  expect(correctText('Which statement is true?')).toBe('f is many-to-one, because f(2) = f(-2)');
  expect(options('Which statement is true?')[1].why).toContain('f(2) and f(-2) are both 4');
  // the largest domain of 1/sqrt(x - 4) is x > 4 (at 4 the bottom is 0, below 4 there is no root)
  const inv = (x: number) => 1 / Math.sqrt(x - 4);
  expect(Number.isFinite(inv(4))).toBe(false);
  expect(Number.isFinite(inv(3.99))).toBe(false);
  expect(Number.isFinite(inv(4.01))).toBe(true);
  const dom = definedSet(inv);
  const opt = options('What is its largest possible domain');
  expect(samePred(setPred(opt.find((o) => o.correct)!.text), dom)).toBe(true);
  for (const o of opt.filter((x) => !x.correct)) expect(samePred(setPred(o.text), dom), o.text).toBe(false);
  // fg is f(g(x)): g first. Tested with f(x) = 2x + 1 and g(x) = x^2
  const f = (x: number) => 2 * x + 1;
  const g = (x: number) => x * x;
  expect(f(g(3))).toBe(19);
  expect(g(f(3))).toBe(49);
  expect(f(3) * g(3)).toBe(63); // the product f(x)g(x) is neither composite
  expect(correctText('apply g first, then apply f')).toBe('fg(x)');
  expect(options('apply g first, then apply f')[1].text).toBe('gf(x)');
  // which function has an inverse: one-to-one on every real input (scanned)
  const oneToOne = (h: (x: number) => number) => { const xs = xsFrom(-6, 6, 0.01); const ys = xs.map(h); return new Set(ys.map((y) => Math.round(y * 1e6))).size === ys.length; };
  expect(oneToOne((x) => x ** 3)).toBe(true);
  expect(oneToOne((x) => x * x - 4 * x)).toBe(false);
  expect(oneToOne((x) => x * x)).toBe(false);
  expect(correctText('Which one has an inverse function')).toBe('f(x) = x\u00b3');
  expect(options('Which one has an inverse function')[1].text).toBe('f(x) = x\u00b2 - 4x');
  expect(fQ4(0)).toBe(fQ4(4));
  expect(options('Which one has an inverse function')[1].why).toContain('f(0) = 0 and f(4) = 16 - 16 = 0');
  // the reflection in y = x swaps the coordinates: the swapped point of f(x) = 2x - 1 is on (x + 1)/2, and the other two reflections are on other graphs
  const fl = (x: number) => 2 * x - 1;
  const finv = (x: number) => (x + 1) / 2;
  for (const x of [-2, 0, 1, 3.5]) {
    const [a, b] = [x, fl(x)];
    expect(close(finv(b), a)).toBe(true); // (b, a) is on y = f^-1(x)
    expect(close(-fl(a), -b)).toBe(true); // the x-axis reflection (a, -b) is on y = -f(x), not on y = f^-1(x)
    if (a !== 0 || b !== 0) expect(close(finv(a), -b) && close(finv(-a), b)).toBe(false);
  }
  expect(correctText('reflected in which line')).toBe('The line y = x');
  expect(options('reflected in which line')[1].text).toBe('The x-axis');
  // V = 20000 e^(-0.3 t) for t >= 0: starts at 20000, falls, never reaches 0
  const V = (t: number) => 20000 * Math.exp(-0.3 * t);
  const ts = xsFrom(0, 60, 0.05);
  const vs = ts.map(V);
  expect(V(0)).toBe(20000);
  expect(vs.every((v, i) => i === 0 || v < vs[i - 1])).toBe(true);
  expect(Math.min(...vs)).toBeGreaterThan(0);
  expect(Math.max(...vs)).toBe(20000);
  expect(correctText('What does the model give for the range of V')).toBe('V is greater than 0 and at most 20000');
  expect(options('What does the model give for the range of V')[1].why).toContain('starts at 20000 when t = 0');
  // the range of g(x) = (x - 1)^2 - 2 on -1 <= x <= 3 is -2 <= g(x) <= 2, and the top is reached
  const gr = rangeSet(gBowl, xsFrom(-1, 3));
  expect(gBowl(-1)).toBe(2);
  expect(gBowl(3)).toBe(2);
  expect(gBowl(1)).toBe(-2);
  const rop = options('What is the range of g');
  expect(samePred(setPred(rop.find((o) => o.correct)!.text), gr)).toBe(true);
  for (const o of rop.filter((x) => !x.correct)) expect(samePred(setPred(o.text), gr), o.text).toBe(false);
  // Dan: sqrt(3 - 3) = 0, a real number, so x = 3 is in the domain
  expect(Number.isFinite(Math.sqrt(3 - 3))).toBe(true);
  expect(Number.isFinite(Math.sqrt(2.99 - 3))).toBe(false);
  expect(samePred(setPred(correctText('Dan says')!.replace(/^.*domain is /, '')), definedSet((x) => Math.sqrt(x - 3)))).toBe(true);
  // Meera: gf(x) = g(f(x)); tested with f(x) = x + 1 and g(x) = 2x, where the order shows
  expect(((x) => 2 * (x + 1))(1)).toBe(4);
  expect(((x) => 2 * x + 1)(1)).toBe(3);
  expect(correctText('Meera says')).toContain('g(f(x))');
  // Sam: the inverse of 2x + 3 is (x - 3)/2; 1/(2x + 3) and 2x - 3 do not undo f
  const f23 = (x: number) => 2 * x + 3;
  const undoes = (h: (x: number) => number) => [-2, 0, 1.5, 4].every((x) => close(h(f23(x)), x));
  expect(undoes((x) => (x - 3) / 2)).toBe(true);
  expect(undoes((x) => 1 / (2 * x + 3))).toBe(false);
  expect(undoes((x) => 2 * x - 3)).toBe(false);
  const sam = options('Sam says');
  expect(sam.find((o) => o.correct)!.text).toContain('(x - 3)/2');
  expect(sam[2].text).toContain('2x - 3');
});

test('the blanks in every "Now you finish it" are recomputed', () => {
  const h = (x: number) => x * x - 6 * x;
  const fLin = (x: number) => 2 * x + 7;
  const expected = [
    h(2), h(4), // -8, -8
    -(-6), solve((x) => 2 * x - 6)[0], // 2x >= 6, x >= 3
    ((x: number) => 2 * x * x)(1), ((x: number) => 2 * x * x)(1), ((x: number) => x + 5)(2), ((x: number) => x + 5)(1), ((x: number) => x + 5)(1), ((x: number) => 2 * x * x)(6), // 2, 2, 7, 6, 6, 72
    fLin(0), fLin(1) - fLin(0), // 7 and 2: y - 7 over 2
    ...mirror([3, 7]), // 7, 3
    15 - 3, (15 - 3) / 1.5, // 12, 8
  ].map(String);
  const blanks = [...SOURCE.matchAll(/class="blank" data-answers="([^"]*)"/g)].map((m) => m[1]);
  expect(blanks).toEqual(expected);
  expect(((x: number) => (x - 7) / 2)(fLin(5))).toBe(5);
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
  expect(checked).toBeGreaterThan(10);
  expect(problems).toEqual([]);
});

test('the numbers worked in the modelling lesson are right', () => {
  const V = (t: number) => 15000 * Math.exp(-0.2 * t);
  expect(V(5)).toBeCloseTo(5518.19, 2);
  expect(Math.round(V(5))).toBe(5518);
  expect(solve((t) => V(t) - 3000)[0]).toBeCloseTo(8.0472, 3);
  expect(Number(solve((t) => V(t) - 3000)[0].toPrecision(3))).toBe(8.05);
  expect(V(0)).toBe(15000);
  // the refined model: same start, limiting value 2000, range 2000 < V <= 15000
  const R = (t: number) => 2000 + 13000 * Math.exp(-0.2 * t);
  expect(R(0)).toBe(15000);
  expect(R(25)).toBeGreaterThan(2000);
  expect(R(25)).toBeLessThan(2100);
  expect(Math.max(...xsFrom(0, 25, 0.05).map(R))).toBe(15000);
  // the ripple: A(r(t)) = pi (2t)^2 = 4 pi t^2; at t = 3 it is 36 pi, about 113; the radius reaches 10 at t = 5
  const area = (t: number) => Math.PI * (2 * t) ** 2;
  expect(area(3)).toBeCloseTo(36 * Math.PI, 9);
  expect(area(3)).toBeCloseTo(113.1, 1);
  expect(solve((t) => 2 * t - 10)[0]).toBe(5);
  // the fare model: F(0) = 3 so the range starts at 3; F(d) = 12 at d = 6
  expect(3 + 1.5 * 0).toBe(3);
  expect(solve((d) => 3 + 1.5 * d - 12)[0]).toBe(6);
  // the first example: 3 x^2 - 2 at -2 and at 2t; g(x) = x^2 - 4x at 0 and 4
  expect(3 * (-2) ** 2 - 2).toBe(10);
  expect(3 * (2 * 1.7) ** 2 - 2).toBeCloseTo(12 * 1.7 ** 2 - 2, 9);
  expect(fQ4(0)).toBe(0);
  expect(fQ4(4)).toBe(0);
});

test('the lesson examples on composites, inverses and domains are right', () => {
  // fg(2) = 25 and gf(2) = 11 for f(x) = x^2, g(x) = 3x - 1; the expressions; ff for 2x + 3
  const f = (x: number) => x * x;
  const g = (x: number) => 3 * x - 1;
  expect([f(g(2)), g(f(2))]).toEqual([25, 11]);
  for (const x of SAMPLES) { expect(close(f(g(x)), 9 * x * x - 6 * x + 1)).toBe(true); expect(close(g(f(x)), 3 * x * x - 1)).toBe(true); }
  const f23 = (x: number) => 2 * x + 3;
  for (const x of SAMPLES) expect(close(f23(f23(x)), 4 * x + 9)).toBe(true);
  expect(solve((x) => f(g(x)) - 16)).toEqual([-1, 1.666667]);
  expect([-1, 5 / 3].map((x) => f(g(x)))).toEqual([16, 16]);
  // f(x) = sqrt(x), g(x) = x - 4: fg has domain x >= 4 and gf has domain x >= 0
  const fr = Math.sqrt;
  const g4 = (x: number) => x - 4;
  expect(domainString(definedSet((x) => fr(g4(x))))).toBe('x>=4');
  expect(domainString(definedSet((x) => g4(fr(x))))).toBe('x>=0');
  // sqrt(x + 3) / (x - 1): x >= -3 and x != 1
  const both = definedSet((x) => Math.sqrt(x + 3) / (x - 1));
  expect(GRID.filter((x) => !both(x)).filter((x) => x >= -3)).toEqual([1]);
  expect(GRID.filter((x) => !both(x) && x !== 1).every((x) => x < -3)).toBe(true);
  // 1/(x - 2): domain x != 2, range f(x) != 0, and every other output k is reached by x = 2 + 1/k
  const r = (x: number) => 1 / (x - 2);
  expect(domainString(definedSet(r))).toBe('x!=2');
  expect(solve((x) => r(x) - 0).length).toBe(0);
  for (const k of [-4, -0.5, 0.25, 3]) expect(close(r(2 + 1 / k), k)).toBe(true);
  // sqrt(x - 1): range f(x) >= 0, reached for every k >= 0 by x = 1 + k^2
  for (const k of [0, 0.5, 2, 3.3]) expect(close(Math.sqrt(1 + k * k - 1), k)).toBe(true);
  // x^2 - 4x + 5 on 0 <= x <= 3: range 1 <= f(x) <= 5, f(0) = 5, f(3) = 2, the lowest point (2, 1) is inside the domain
  const q = (x: number) => x * x - 4 * x + 5;
  expect(rangeString('f(x)', q, xsFrom(0, 3), 'closed')).toBe('1<=f(x)<=5');
  expect([q(0), q(3), q(2)]).toEqual([5, 2, 1]);
  for (const x of SAMPLES) expect(close(q(x), (x - 2) ** 2 + 1)).toBe(true);
  // 3 - 2 e^x: range f(x) < 3
  const ex = (x: number) => 3 - 2 * Math.exp(x);
  expect(samePred(setPred('f(x)<3'), rangeSet(ex, xsFrom(-10, 4, 0.002)))).toBe(true);
  // the inverse of 3x - 5, of (x + 1)/(x - 2) (domain x != 1), of x^2 - 4x for x >= 2, of e^(2x) - 3 (domain x > -3)
  const inv1 = inverse('', '(x+5)/3', (x) => 3 * x - 5, SAMPLES, SAMPLES);
  expect(inv1.truth('(x+5)/3')).toBe(true);
  const fq = (x: number) => (x + 1) / (x - 2);
  const invq = (x: number) => (2 * x + 1) / (x - 1);
  for (const x of [-3, -1, 0, 1, 3, 4.5]) expect(close(invq(fq(x)), x)).toBe(true);
  expect(domainString(definedSet(invq))).toBe('x!=1');
  expect(solve((x) => fq(x) - 1).length).toBe(0); // the output 1 is never reached
  const f4 = (x: number) => x * x - 4 * x;
  const inv4 = (x: number) => 2 + Math.sqrt(x + 4);
  for (const x of [2, 2.5, 4, 7]) expect(close(inv4(f4(x)), x)).toBe(true);
  for (const y of [-4, -3, 0, 5, 12]) expect(close(f4(inv4(y)), y)).toBe(true);
  expect(Math.min(...xsFrom(2, 30).map(f4))).toBe(-4);
  expect(domainString(definedSet(inv4))).toBe('x>=-4');
  const fe = (x: number) => Math.exp(2 * x) - 3;
  const inve = (x: number) => 0.5 * Math.log(x + 3);
  for (const x of [-2, -0.3, 0, 1.4]) expect(close(inve(fe(x)), x)).toBe(true);
  for (const y of [-2.9, 0, 4, 40]) expect(close(fe(inve(y)), y)).toBe(true);
  expect(domainString(definedSet(inve))).toBe('x>-3');
  expect(solve((x) => Math.exp(2 * x), -5, 5).length).toBe(0); // the output -3 is never reached
  // 2x + 7 undone by (x - 7)/2
  expect(close(((x: number) => (x - 7) / 2)(2 * 5 + 7), 5)).toBe(true);
  // x^2 for all real x has no inverse: 2 and -2 share the output 4
  expect([2, -2].map(sqF)).toEqual([4, 4]);
  // the circle of ideas in lesson 5: f(x) = 2x - 1 meets its inverse at (1, 1); 5 - x is self-inverse
  const fl = (x: number) => 2 * x - 1;
  const finv = (x: number) => (x + 1) / 2;
  expect(solve((x) => fl(x) - finv(x))).toEqual([1]);
  expect(fl(1)).toBe(1);
  for (const x of SAMPLES) expect(close(5 - (5 - x), x)).toBe(true);
  expect([[1, 4], [4, 1]].every(([a, b]) => a + b === 5)).toBe(true);
  // the inverse of x^2 (x >= 0) is sqrt(x): (2, 4) and (4, 2); e^x and ln x: (0, 1) and (1, 0)
  expect([sqF(2), Math.sqrt(4)]).toEqual([4, 2]);
  expect([Math.exp(0), Math.log(1)]).toEqual([1, 0]);
  // the model: V(5), F(d) for the taxi
  expect(solve((d) => 3 + 1.5 * d - 15)[0]).toBe(8);
  // flip it: f(x) = x^2 - 4x for x >= 2, f^-1(5) = 5 (and -1 is not in the domain); h = sqrt(2x + 5) = f(g(x)) with f = sqrt
  expect(solve((x) => f4(x) - 5)).toEqual([-1, 5]);
  expect(f4(5)).toBe(5);
  const gIn = (x: number) => 2 * x + 5;
  const hComp = (x: number) => (2 * x + 5) ** 0.5;
  for (const x of POS) expect(close(Math.sqrt(gIn(x)), hComp(x))).toBe(true); // f(g(x)) = h(x) with f = sqrt
});

test('the general rules on the page are pinned with the maths behind them', () => {
  const text = plain(SOURCE);
  // a strictly increasing function meets its inverse only on y = x (checked for increasing functions, by scanning)
  const increasing: [string, (x: number) => number][] = [['2x-1', (x) => 2 * x - 1], ['3x-4', (x) => 3 * x - 4], ['x^3+x', (x) => x ** 3 + x], ['2x^3+5', (x) => 2 * x ** 3 + 5]];
  for (const [name, h] of increasing) {
    expect(xsFrom(-5, 5, 0.01).every((x, i, xs) => i === 0 || h(x) > h(xs[i - 1])), name).toBe(true);
    const hinv = (y: number) => { let lo = -60; let hi = 60; for (let k = 0; k < 200; k += 1) { const m = (lo + hi) / 2; if (h(m) < y) lo = m; else hi = m; } return (lo + hi) / 2; };
    const near = (xs: number[]) => [...new Set(xs.map((v) => Math.round(v * 100) + 0))]; // a root of x^3 shows as a cluster of values near 0
    const meets = near(solve((x) => h(x) - hinv(x), -20, 20));
    const onLine = near(solve((x) => h(x) - x, -20, 20));
    expect(meets, name).toEqual(onLine);
  }
  // a decreasing function can meet its inverse off the line: f(x) = -x^3 meets f^-1 at (1, -1) and (-1, 1), and f(x) = x only at 0
  const dec = (x: number) => -(x ** 3);
  const decInv = (x: number) => -Math.cbrt(x);
  expect([dec(1), decInv(1)]).toEqual([-1, -1]); // (1, -1) is on both graphs and is not on y = x
  expect([dec(-1), decInv(-1)]).toEqual([1, 1]);
  expect(solve((x) => dec(x) - x, -5, 5)).toEqual([0]);
  expect(text).toContain('If f is strictly increasing (as x gets bigger, f(x) gets bigger), the graphs of f and f^(-1) meet only on the line y=x');
  expect(text).toContain('Only a one-to-one function has an inverse.');
  expect(text).toContain('The domain of f^(-1) is the range of f. The range of f^(-1) is the domain of f.');
  expect(text).toContain('the output of g must be in the domain of f');
  expect(text).toContain('Under a square root, the expression must be at least 0');
  expect(text).toContain('Inside ln, the expression must be greater than 0');
  expect(text).toContain('A mapping where one input has two or more outputs is not a function.');
  expect(text).toContain('A many-to-one function can be given an inverse by restricting its domain to a part where it is one-to-one, such as x >= 0 for x^2.');
  expect(text).toContain('In this topic, a formula can break in three ways.');
  expect(text).toContain('The symbol sqrt(x) means the positive square root only, and sqrt(0)=0.');
  expect(text).toContain('sends each input to one or more outputs');
  expect(text).toContain('In general fg(x) and gf(x) are different functions.');
  expect(text).toContain('The graph of f must be one-to-one for the reflection to be the graph of a function.');
  // the domain of the inverse is the range of f: x^2 + 1 for x >= 0 has range f(x) >= 1, and its inverse sqrt(x - 1) has domain x >= 1
  expect(samePred(setPred('x>=1'), rangeSet((x) => x * x + 1, xsFrom(0, 40)))).toBe(true);
  expect(samePred(setPred('x>=1'), definedSet((x) => Math.sqrt(x - 1)))).toBe(true);
  // the root of 0 is allowed, so sqrt(x - 3) has domain x >= 3
  expect(domainString(definedSet((x) => Math.sqrt(x - 3)))).toBe('x>=3');
  // and a bracket squared: (2x + 1)^2 is not 4x^2 + 1
  expect(close((2 * 1 + 1) ** 2, 4 * 1 + 1)).toBe(false);
  // one-to-one and many-to-one: x^3 is one-to-one on the scan, x^2 is not
  const ys = (h: (x: number) => number) => new Set(xsFrom(-5, 5, 0.01).map((x) => Math.round(h(x) * 1e6))).size;
  expect(ys((x) => x ** 3)).toBe(xsFrom(-5, 5, 0.01).length);
  expect(ys((x) => x * x)).toBeLessThan(xsFrom(-5, 5, 0.01).length);
  // the formula-sheet note and the "where this goes next" paragraph
  expect(text).toContain('Formula sheet. Nothing in this topic is on the formula sheet');
  expect(text).toMatch(/Where this goes next Everything on this page prepares for Further Pure and for university/);
});

// ---------- the pictures ----------
type Geom = { width: number; height: number; left: number; right: number; top: number; bottom: number; xmin: number; xmax: number; ymin: number; ymax: number };
type Fx = (x: number) => number;
type Stated = {
  curves: { cls: string; f: Fx; from?: number; to?: number }[];
  points: Record<string, Pt>;
  on: Record<string, number[]>;
  vlines?: Record<string, number>;
  hlines?: Record<string, number>;
  branches?: { curve: number; centre: Pt; sign: 1 | -1 };
  equal?: boolean; // both axes have the same scale
  yname?: string; // the letter of the vertical axis, where it is not y
  starts?: Record<number, Pt>; // curve k begins exactly at this point
};
const identity: Fx = (x) => x;
const STATED: Record<string, Stated> = {
  'functions-domain-sqrt': { curves: [{ cls: 'curve', f: (x) => Math.sqrt(x - 1), from: 1, to: 8 }], points: { start: [1, 0], p: [5, 2] }, on: { start: [0], p: [0] }, starts: { 0: [1, 0] } },
  'functions-domain-recip': { curves: [{ cls: 'curve', f: (x) => 1 / (x - 2) }], points: { a: [3, 1], b: [1, -1] }, on: { a: [0], b: [0] }, vlines: { va: 2 }, branches: { curve: 0, centre: [2, 0], sign: 1 } },
  'functions-range-quad': { curves: [{ cls: 'curve', f: (x) => x * x - 4 * x + 5, from: 0, to: 3 }], points: { left: [0, 5], low: [2, 1], right: [3, 2] }, on: { left: [0], low: [0], right: [0] }, starts: { 0: [0, 5] } },
  'functions-not-one-one': { curves: [{ cls: 'curve', f: (x) => x * x }], points: { left: [-2, 4], right: [2, 4] }, on: { left: [0], right: [0] }, hlines: { line: 4 } },
  'functions-inverse-line': { curves: [{ cls: 'curve', f: (x) => 2 * x - 1 }, { cls: 'curve-b', f: (x) => (x + 1) / 2 }, { cls: 'curve-c', f: identity }], points: { onf: [0, -1], oninv: [-1, 0], meet: [1, 1] }, on: { onf: [0], oninv: [1], meet: [0, 1, 2] }, equal: true },
  'functions-inverse-sq': { curves: [{ cls: 'curve', f: (x) => x * x, from: 0, to: 5.5 }, { cls: 'curve-b', f: Math.sqrt, from: 0, to: 5.5 }, { cls: 'curve-c', f: identity }], points: { onf: [2, 4], oninv: [4, 2] }, on: { onf: [0], oninv: [1] }, equal: true },
  'functions-inverse-exp': { curves: [{ cls: 'curve', f: Math.exp }, { cls: 'curve-b', f: Math.log, from: 0.0001, to: 4 }, { cls: 'curve-c', f: identity }], points: { onf: [0, 1], oninv: [1, 0] }, on: { onf: [0], oninv: [1] }, equal: true },
  'functions-model-refine': { curves: [{ cls: 'curve', f: (t) => 15000 * Math.exp(-0.2 * t), from: 0, to: 22 }, { cls: 'curve-b', f: (t) => 2000 + 13000 * Math.exp(-0.2 * t), from: 0, to: 22 }], points: { start: [0, 15000] }, on: { start: [0, 1] }, hlines: { floor: 2000 }, yname: 'V', starts: { 0: [0, 15000], 1: [0, 15000] } },
  'functions-q-inverse': { curves: [{ cls: 'curve', f: (x) => x ** 3 + 4 }], points: { a: [0, 4], b: [1, 5] }, on: { a: [0], b: [0] } },
  'functions-q-range': { curves: [{ cls: 'curve', f: (x) => (x - 1) ** 2 - 2, from: -1, to: 3 }], points: { left: [-1, 2], low: [1, -2], right: [3, 2] }, on: { left: [0], low: [0], right: [0] }, starts: { 0: [-1, 2] } },
};

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
    pieces: m[2].split('M').filter(Boolean).map((piece) => piece.split('L').map((p) => { const [a, b] = p.trim().split(' ').map(Number); return [toX(a), toY(b)] as [number, number]; })),
  }));
  const guides = [...svg.matchAll(/<line class="guide" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].map((m) => ({ x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] }));
  const circles = [...svg.matchAll(/<circle class="pt" data-name="([^"]*)" cx="([\d.-]+)" cy="([\d.-]+)" r="7"\/>/g)].map((m) => ({ name: m[1], px: +m[2], py: +m[3], x: toX(+m[2]), y: toY(+m[3]) }));
  const labels = [...svg.matchAll(/<text[^>]*data-for="([^"]*)" x="([\d.-]+)" y="([\d.-]+)" text-anchor="(\w+)">([\s\S]*?)<\/text>/g)].map((m) => ({ for: m[1], x: +m[2], y: +m[3], anchor: m[4], text: m[5].replace(/<[^>]+>/g, '').replace(/\u200b/g, '').replace(/\u2212/g, '-') }));
  return { horizontal, vertical, px, py, toX, toY, paths, guides, circles, labels };
}

test('every curve is read back from its drawn path and is the function the page says it is', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/functions.mjs');
  const graphIds = Object.keys(STATED);
  expect(graphIds.every((id) => id in FIGURES)).toBe(true);
  const problems: string[] = [];
  let points = 0;
  for (const id of graphIds) {
    const svg = (FIGURES as Record<string, () => string>)[id]();
    const g = (GEOM as Record<string, Geom>)[id];
    const st = STATED[id];
    const m = measure(svg, g);
    expect(m.horizontal.x1, id).toBeCloseTo(g.left, 0);
    expect(m.horizontal.x2, id).toBeCloseTo(g.width - g.right, 0);
    expect(m.vertical.y1, id).toBeCloseTo(g.height - g.bottom, 0);
    expect(m.vertical.y2, id).toBeCloseTo(g.top, 0);
    expect(m.vertical.x1, id).toBeCloseTo(m.px(0), 0);
    expect(m.horizontal.y1, id).toBeCloseTo(m.py(0), 0);
    if (st.equal) {
      // a reflection in y = x needs the same scale on both axes: pixels per unit across and up must agree
      const across = (m.horizontal.x2 - m.horizontal.x1) / (g.xmax - g.xmin);
      const up = (m.vertical.y1 - m.vertical.y2) / (g.ymax - g.ymin);
      if (Math.abs(across - up) / across > 0.005) problems.push(`${id}: the axes are at different scales (${across.toFixed(3)} and ${up.toFixed(3)} px per unit)`);
    }
    expect(m.paths.map((p) => p.cls), `${id}: the curves, in order`).toEqual(st.curves.map((c) => c.cls));
    m.paths.forEach((p, i) => {
      const tol = 0.012 * (g.ymax - g.ymin);
      const c = st.curves[i];
      let n = 0;
      for (const piece of p.pieces) for (const [x, y] of piece) {
        n += 1;
        if (Math.abs(y - c.f(x)) > tol) problems.push(`${id}: curve ${i} is at (${x.toFixed(2)}, ${y.toFixed(2)}) but the function gives ${c.f(x).toFixed(2)}`);
        if (c.from !== undefined && x < c.from - 0.5) problems.push(`${id}: curve ${i} starts before x = ${c.from}`);
        if (c.to !== undefined && x > c.to + 0.5) problems.push(`${id}: curve ${i} runs past x = ${c.to}`);
      }
      if (n < 100) problems.push(`${id}: curve ${i} has only ${n} points`);
    });
    for (const [k, [sx, sy]] of Object.entries(st.starts ?? {})) {
      const first = m.paths[Number(k)].pieces.flat().sort((a, b) => a[0] - b[0])[0];
      if (Math.abs(first[0] - sx) > 0.004 * (g.xmax - g.xmin) || Math.abs(first[1] - sy) > 0.004 * (g.ymax - g.ymin)) problems.push(`${id}: curve ${k} begins at (${first[0].toFixed(2)}, ${first[1].toFixed(2)}), not (${sx}, ${sy})`);
    }
    expect(m.circles.map((c) => c.name).sort(), `${id}: marked points`).toEqual(Object.keys(st.points).sort());
    for (const c of m.circles) {
      points += 1;
      const [wx, wy] = st.points[c.name];
      if (Math.abs(c.px - m.px(wx)) > 0.6 || Math.abs(c.py - m.py(wy)) > 0.6) problems.push(`${id}/${c.name}: drawn at (${c.x.toFixed(2)}, ${c.y.toFixed(2)}) not at (${wx}, ${wy})`);
      for (const k of st.on[c.name]) if (Math.abs(st.curves[k].f(wx) - wy) > 1e-9) problems.push(`${id}/${c.name}: (${wx}, ${wy}) is not on curve ${k}`);
    }
    const vs = m.guides.filter((l) => l.x1 === l.x2);
    const hs = m.guides.filter((l) => l.y1 === l.y2);
    expect(vs.length, `${id}: vertical guide lines`).toBe(Object.keys(st.vlines ?? {}).length);
    expect(hs.length, `${id}: horizontal guide lines`).toBe(Object.keys(st.hlines ?? {}).length);
    for (const x of Object.values(st.vlines ?? {})) {
      const l = vs.find((v) => Math.abs(v.x1 - m.px(x)) < 0.6);
      if (!l) problems.push(`${id}: no vertical guide line at x = ${x}`); else if (Math.abs(l.y1 - m.py(g.ymin)) > 0.6 || Math.abs(l.y2 - m.py(g.ymax)) > 0.6) problems.push(`${id}: the guide at x = ${x} does not cross the picture`);
    }
    for (const y of Object.values(st.hlines ?? {})) {
      const l = hs.find((v) => Math.abs(v.y1 - m.py(y)) < 0.6);
      if (!l) problems.push(`${id}: no horizontal guide line at y = ${y}`); else if (Math.abs(l.x1 - m.px(g.xmin)) > 0.6 || Math.abs(l.x2 - m.px(g.xmax)) > 0.6) problems.push(`${id}: the guide at y = ${y} does not cross the picture`);
    }
    if (st.branches) {
      const { curve, centre, sign } = st.branches;
      const pieces = m.paths[curve].pieces;
      expect(pieces.length, `${id}: two branches`).toBe(2);
      const corner = (pc: [number, number][]) => ({ right: pc.every(([x]) => x > centre[0]), left: pc.every(([x]) => x < centre[0]), above: pc.every(([, y]) => y > centre[1]), below: pc.every(([, y]) => y < centre[1]) });
      const cs = pieces.map(corner);
      const want = sign === 1 ? [{ right: true, above: true }, { left: true, below: true }] : [{ left: true, above: true }, { right: true, below: true }];
      for (const w of want) if (!cs.some((c) => Object.entries(w).every(([k, v]) => c[k as keyof typeof c] === v))) problems.push(`${id}: no branch with ${JSON.stringify(w)}`);
    }
  }
  expect(points).toBeGreaterThan(20);
  expect(problems).toEqual([]);
});

test('the drawn inverse is the reflection of the drawn function in the line y = x', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/functions.mjs');
  for (const id of ['functions-inverse-line', 'functions-inverse-sq', 'functions-inverse-exp']) {
    const svg = (FIGURES as Record<string, () => string>)[id]();
    const g = (GEOM as Record<string, Geom>)[id];
    const m = measure(svg, g);
    // each drawn point (x, y) of the solid curve has its mirror image (y, x) within 1.2% of the picture of the dashed curve
    const dashed = m.paths[1].pieces.flat();
    const tol = 0.012 * (g.ymax - g.ymin);
    let checked = 0;
    for (const [x, y] of m.paths[0].pieces.flat()) {
      if (x < g.xmin || x > g.xmax || y < g.ymin || y > g.ymax) continue;
      if (y < g.xmin || y > g.xmax || x < g.ymin || x > g.ymax) continue;
      const near = dashed.some(([qx, qy]) => Math.hypot(qx - y, qy - x) < tol * 2.5);
      checked += 1;
      expect(near, `${id}: the mirror image of (${x.toFixed(2)}, ${y.toFixed(2)}) is not on the dashed curve`).toBe(true);
    }
    expect(checked, id).toBeGreaterThan(30);
  }
});

test('every label says the coordinates of its own point, and is nearest its own item and 4px clear of every other label', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/functions.mjs');
  const problems: string[] = [];
  let labelled = 0;
  for (const id of Object.keys(STATED)) {
    const svg = (FIGURES as Record<string, () => string>)[id]();
    const g = (GEOM as Record<string, Geom>)[id];
    const st = STATED[id];
    const m = measure(svg, g);
    const items: { name: string; at: (px: number, py: number) => number }[] = [
      ...m.circles.map((c) => ({ name: c.name, at: (qx: number, qy: number) => Math.hypot(qx - c.px, qy - c.py) })),
      ...Object.keys(st.vlines ?? {}).map((name) => ({ name, at: (qx: number) => Math.abs(qx - m.px(st.vlines![name])) })),
      ...Object.keys(st.hlines ?? {}).map((name) => ({ name, at: (_qx: number, qy: number) => Math.abs(qy - m.py(st.hlines![name])) })),
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
      const rivals = st.points[l.for] ? items.filter((it) => it !== own && st.points[it.name]) : items.filter((it) => it !== own);
      for (const other of rivals) if (other.at(cx, cy) < mine) problems.push(`${id}: label "${l.text}" is ${Math.round(other.at(cx, cy))}px from "${other.name}" but ${Math.round(mine)}px from its own "${own.name}"`);
      if (st.points[l.for]) {
        const [x, y] = st.points[l.for];
        if (l.text !== `(${x}, ${y})`) problems.push(`${id}: the label "${l.text}" is not the coordinates (${x}, ${y}) of "${l.for}"`);
      } else {
        const v = st.vlines?.[l.for];
        const h = st.hlines?.[l.for];
        const want = v !== undefined ? `x = ${v}` : `${st.yname ?? 'y'} = ${h}`;
        if (l.text !== want) problems.push(`${id}: the guide-line label "${l.text}" is not "${want}"`);
      }
      const box = { name: l.text, x0: cx - width / 2, x1: cx + width / 2, y0: l.y - 26, y1: l.y + 8 };
      boxes.push(box);
      for (const [k, c] of st.curves.entries()) {
        for (let i = 0; i <= 1500; i += 1) {
          const x = g.xmin + ((g.xmax - g.xmin) * i) / 1500;
          if ((c.from !== undefined && x < c.from) || (c.to !== undefined && x > c.to)) continue;
          const y = c.f(x);
          if (!Number.isFinite(y) || y < g.ymin || y > g.ymax) continue;
          const qx = m.px(x);
          const qy = m.py(y);
          if (qx > box.x0 - 4 && qx < box.x1 + 4 && qy > box.y0 - 4 && qy < box.y1 + 4) { problems.push(`${id}: label "${l.text}" sits on curve ${k} near x=${x.toFixed(2)}`); break; }
        }
      }
      for (const c of m.circles) if (c.name !== l.for && c.px > box.x0 - 11 && c.px < box.x1 + 11 && c.py > box.y0 - 11 && c.py < box.y1 + 11) problems.push(`${id}: label "${l.text}" covers the marked point "${c.name}"`);
    }
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const gapX = Math.max(a.x0 - b.x1, b.x0 - a.x1);
        const gapY = Math.max(a.y0 - b.y1, b.y0 - a.y1);
        if (gapX < 4 && gapY < 4) problems.push(`${id}: labels "${a.name}" and "${b.name}" are closer than 4px`);
      }
    }
    for (const name of [...Object.keys(st.points), ...Object.keys(st.vlines ?? {}), ...Object.keys(st.hlines ?? {})]) if (!m.labels.some((l) => l.for === name)) problems.push(`${id}: "${name}" has no label`);
  }
  expect(labelled).toBeGreaterThan(20);
  expect(problems).toEqual([]);
});

test('every mapping diagram is read back from its arrows and is the rule the page says it is', async () => {
  const { FIGURES, MAPS } = await import('../src/book/alevel/figures/functions.mjs');
  const stated: Record<string, { inputs: number[]; outputs: number[]; rule: (x: number) => number[] }> = {
    'functions-map-many-one': { inputs: [-2, -1, 1, 2], outputs: [1, 4], rule: (x) => [x * x] },
    'functions-map-one-many': { inputs: [1, 4, 9], outputs: [-3, -2, -1, 1, 2, 3], rule: (x) => [Math.sqrt(x), -Math.sqrt(x)] },
  };
  for (const [id, st] of Object.entries(stated)) {
    const svg = (FIGURES as Record<string, () => string>)[id]();
    const map = (MAPS as Record<string, { left: number[]; right: number[] }>)[id];
    const texts = [...svg.matchAll(/<text[^>]*data-side="(L|R)" data-value="([^"]*)" x="([\d.-]+)" y="([\d.-]+)"/g)].map((m) => ({ side: m[1], value: Number(m[2]), x: +m[3], y: +m[4] }));
    const arrows = [...svg.matchAll(/<line class="curve" data-from="([^"]*)" data-to="([^"]*)" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"/g)].map((m) => ({ from: Number(m[1]), to: Number(m[2]), x1: +m[3], y1: +m[4], x2: +m[5], y2: +m[6] }));
    expect(texts.filter((t) => t.side === 'L').map((t) => t.value).sort((a, b) => a - b), `${id}: inputs`).toEqual([...st.inputs].sort((a, b) => a - b));
    expect(texts.filter((t) => t.side === 'R').map((t) => t.value).sort((a, b) => a - b), `${id}: outputs`).toEqual([...st.outputs].sort((a, b) => a - b));
    expect(map.left.length + map.right.length, id).toBe(texts.length);
    // the arrows are exactly the rule's pairs
    const want = st.inputs.flatMap((x) => st.rule(x).map((y) => `${x}>${y}`)).sort();
    expect(arrows.map((a) => `${a.from}>${a.to}`).sort(), `${id}: arrows`).toEqual(want);
    // each arrow leaves the row of its input and arrives at the row of its output
    for (const a of arrows) {
      const from = texts.find((t) => t.side === 'L' && t.value === a.from)!;
      const to = texts.find((t) => t.side === 'R' && t.value === a.to)!;
      expect(Math.abs(a.y1 - (from.y - 8)), `${id}: arrow ${a.from} leaves its row`).toBeLessThan(1);
      expect(Math.abs(a.y2 - (to.y - 8)), `${id}: arrow ${a.from} arrives at its row`).toBeLessThan(1);
      expect(a.x1).toBeGreaterThan(from.x);
      expect(a.x2).toBeLessThan(to.x);
    }
    // rows of one column are at least 40px apart, so the numbers do not touch
    for (const side of ['L', 'R']) { const ys = texts.filter((t) => t.side === side).map((t) => t.y).sort((a, b) => a - b); for (let i = 1; i < ys.length; i += 1) expect(ys[i] - ys[i - 1], `${id}: ${side} rows`).toBeGreaterThanOrEqual(40); }
  }
  // the first is a many-to-one function (one arrow leaves each input, and two arrive at each output); the second is not a function (two leave each input)
  const count = (id: string) => { const svg = (FIGURES as Record<string, () => string>)[id](); return [...svg.matchAll(/data-from="([^"]*)" data-to="([^"]*)"/g)].map((m) => [Number(m[1]), Number(m[2])]); };
  const a = count('functions-map-many-one');
  expect([-2, -1, 1, 2].map((x) => a.filter(([f]) => f === x).length)).toEqual([1, 1, 1, 1]);
  expect([1, 4].map((y) => a.filter(([, t]) => t === y).length)).toEqual([2, 2]);
  const b = count('functions-map-one-many');
  expect([1, 4, 9].map((x) => b.filter(([f]) => f === x).length)).toEqual([2, 2, 2]);
  expect([-3, -2, -1, 1, 2, 3].map((y) => b.filter(([, t]) => t === y).length)).toEqual([1, 1, 1, 1, 1, 1]);
});

test('the function-machine chain shows 2 going into g, then 5 going into f, and g comes first', async () => {
  const { FIGURES, CHAIN } = await import('../src/book/alevel/figures/functions.mjs');
  const svg = (FIGURES as Record<string, () => string>)['functions-chain']();
  const text = (re: RegExp) => [...svg.matchAll(re)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\u200b/g, '').replace(/\u2212/g, '-'));
  const values = Object.fromEntries([...svg.matchAll(/data-role="value" data-at="(\w+)" x="([\d.-]+)"[^>]*>([^<]*)</g)].map((m) => [m[1], { x: +m[2], v: Number(m[3]) }]));
  const boxes = [...svg.matchAll(/data-role="box" data-name="(\w)" x="([\d.-]+)"[^>]*>([\s\S]*?)<\/text>/g)].map((m) => ({ name: m[1], x: +m[2], rule: m[3].replace(/<[^>]+>/g, '').replace(/\u200b/g, '').replace(/\u2212/g, '-') }));
  const g = (x: number) => 3 * x - 1;
  const f = (x: number) => x * x;
  expect(values.input.v).toBe(2);
  expect(values.mid.v).toBe(g(2));
  expect(values.out.v).toBe(f(g(2)));
  expect(f(g(2))).not.toBe(g(f(2))); // the order matters
  expect(boxes.map((b) => b.name)).toEqual(['g', 'f']);
  expect(boxes[0].x).toBeLessThan(boxes[1].x); // g is met first
  expect(values.input.x).toBeLessThan(boxes[0].x);
  expect(boxes[0].x).toBeLessThan(values.mid.x);
  expect(values.mid.x).toBeLessThan(boxes[1].x);
  expect(boxes[1].x).toBeLessThan(values.out.x);
  // the rules written in the boxes are the rules the numbers follow
  expect(boxes[0].rule).toBe('g: 3x - 1');
  expect(boxes[1].rule).toBe('f: x2');
  expect(algv(boxes[0].rule.replace('g: ', ''))(2)).toBe(values.mid.v);
  expect(algv(boxes[1].rule.replace('f: ', '').replace('x2', 'x^2'))(values.mid.v)).toBe(values.out.v);
  expect(text(/data-role="caption"[^>]*>([^<]*)</g)).toEqual(['input', 'g(2)', 'fg(2)']);
  expect((CHAIN as Record<string, { input: number; mid: number; out: number }>)['functions-chain']).toMatchObject({ input: 2, mid: 5, out: 25 });
  const desc = /<desc id="[^"]*">([^<]*)<\/desc>/.exec(svg)![1];
  for (const needle of ['input 2', 'g of x is 3x minus 1', 'comes out as 5', 'f of x is x squared', 'comes out as 25', 'The first box the input meets is g']) expect(desc, needle).toContain(needle);
});

test('every figure states every marked coordinate and guide line in its text alternative, and a question figure does not give the answer', async () => {
  const { FIGURES, ITEMS } = await import('../src/book/alevel/figures/functions.mjs');
  type Item = { kind: string; x: number; y: number };
  const problems: string[] = [];
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const title = /<title id="[^"]*">([^<]*)<\/title>/.exec(svg)?.[1] ?? '';
    const desc = /<desc id="[^"]*">([^<]*)<\/desc>/.exec(svg)?.[1] ?? '';
    for (const it of ((ITEMS as Record<string, Item[]>)[id] ?? [])) {
      if (it.kind === 'point' && !desc.includes(`(${it.x}, ${it.y})`)) problems.push(`${id}: the description does not name (${it.x}, ${it.y})`);
      if (it.kind === 'vline' && !desc.includes(`x = ${it.x}`)) problems.push(`${id}: the description does not name x = ${it.x}`);
      if (it.kind === 'hline' && !desc.includes(`${STATED[id]?.yname ?? 'y'} = ${it.y}`)) problems.push(`${id}: the description does not name ${STATED[id]?.yname ?? 'y'} = ${it.y}`);
    }
    if (desc.length < 80) problems.push(`${id}: the description is too short`);
    if (title.length < 20) problems.push(`${id}: the title is too short`);
    if (id.includes('-q-')) {
      expect(`${title} ${desc}`, id).not.toMatch(/equation|range|inverse|domain|\(4, 0\)|-2 (?:to|<=)|\bk\b/i);
      expect(SOURCE, id).toContain(`{fig:${id}}`);
    }
  }
  expect(problems).toEqual([]);
  expect(Object.keys(FIGURES).filter((k) => k.includes('-q-')).sort()).toEqual(['functions-q-inverse', 'functions-q-range']);
});

test('a format hint ("Type it like ...") never gives the key away', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const problems: string[] = [];
  let hints = 0;
  for (const q of questions()) {
    const m = /Type [^.]* like (.*?)\.?$/.exec(q.plain);
    if (!m || q.answers.length === 0) continue;
    hints += 1;
    if (matches(m[1], q.answers, q.mode)) problems.push(`"${m[1]}" is the key of: ${q.plain.slice(0, 60)}`);
  }
  expect(hints).toBeGreaterThan(25);
  expect(problems).toEqual([]);
});

test('at 320px every figure label is at least 12px tall', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/functions.html');
  const small = await page.evaluate(() => [...document.querySelectorAll('main svg.graph-svg text')].map((t) => ({ s: t.textContent, h: t.getBoundingClientRect().height })).filter((t) => t.h > 0 && t.h < 12).map((t) => `${t.s} ${t.h.toFixed(1)}`));
  expect(small).toEqual([]);
});

test('at 320px every figure label is 4px clear of every other label', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/functions.html');
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
  const { FIGURES } = await import('../src/book/alevel/figures/functions.mjs');
  const used = [...SOURCE.matchAll(/\{fig:([a-z0-9-]+)\}/g)].map((m) => m[1]);
  expect(new Set(used).size).toBe(used.length);
  expect([...used].sort()).toEqual(Object.keys(FIGURES).sort());
  expect(used.length).toBe(13);
});

test('no figure text leaves its picture', async ({ page }) => {
  await page.goto('/courses/a-level/functions.html');
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

// ---------- the page as a whole ----------
test('the page keeps to its scope: no arcsin, modulus, radians, differentiation or sequences', () => {
  const text = plain(SOURCE.replace(/<!--[\s\S]*?-->/g, ' ').replace('Angles are in degrees, and radians are not needed.', ' ').replace(/<p class="where-use">[\s\S]*?<\/p>/, ' ').replace(/<h2>Where this goes next<\/h2>\s*<p>[\s\S]*?<\/p>/, ' '));
  expect(text).not.toMatch(/arcsin|sin\u207b|sin\^\(-1\)|modulus|radian|derivative|dy\/dx|differentiat|sequence/i);
  expect(SOURCE).not.toMatch(/data-calc="(?!scientific)/);
  expect(SOURCE.match(/data-calc=/g)?.length).toBe(1);
});

test('the page has six numbered lessons in order, each with a Key idea, worked examples and a faded example', () => {
  const lessons = SOURCE.split('<section').filter((sec) => /<h2>\d+\./.test(sec));
  expect(lessons.map((s) => /<h2>([^<]*)<\/h2>/.exec(s)![1])).toEqual(['1. Mappings and functions', '2. Domain and range', '3. Composite functions', '4. Inverse functions', '5. The graph of an inverse function', '6. Functions in modelling']);
  for (const sec of lessons) {
    const name = /<h2>([^<]*)<\/h2>/.exec(sec)?.[1];
    expect(sec, `${name}: a Key idea box`).toContain('class="key"');
    expect(sec, `${name}: a faded example`).toContain('class="worked faded"');
    expect((sec.match(/class="worked"/g) ?? []).length, `${name}: worked examples`).toBeGreaterThanOrEqual(3);
  }
  // every lesson has a Check-your-knowledge set after it, and there is one for flip-it and one for the mixed review
  expect((SOURCE.match(/<h2>Check your knowledge:/g) ?? []).length).toBe(8);
});

test('the skip link goes to the first lesson heading (heading ids are cut at 40 characters)', () => {
  const first = /<h2>(1\.[^<]*)<\/h2>/.exec(SOURCE)![1];
  const id = `s-${plain(first).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`;
  expect(SOURCE).toContain(`href="#${id}"`);
});

test('the warm-up recaps the direct prerequisite with a link, the first Key box names it, and the page ends with where it goes next', async () => {
  const { TOPICS } = await import('../src/book/alevel/topics.mjs');
  const t = (TOPICS as { id: string; needs: string[]; status: string; words: string[]; year: number }[]).find((x) => x.id === 'functions')!;
  expect(t.status).toBe('live');
  expect(t.year).toBe(2);
  expect(t.needs).toEqual(['graph-transformations']);
  const warm = /<h2>Warm-up[\s\S]*?<\/section>/.exec(SOURCE)![0];
  for (const need of t.needs) expect(warm).toContain(`href="${need}.html`);
  const key = /<div class="key">([\s\S]*?)<\/div>/.exec(SOURCE)![1];
  expect(key).toContain('href="graph-transformations.html"');
  expect(key).toContain('builds on');
  expect(SOURCE).toContain('<h2>Where this goes next</h2>');
  expect(SOURCE.indexOf('<h2>Where this goes next</h2>')).toBeGreaterThan(SOURCE.indexOf('<h2>I can'));
});

test('the page has at least 55 questions, one ladder and one solution on each, and an exam section with mixed-area questions', () => {
  const qs = questions();
  expect(qs.length).toBeGreaterThanOrEqual(55);
  for (const q of qs) {
    expect(q.block.split('<div class="solution">')[0], q.plain.slice(0, 40)).toContain('class="ladder"');
    expect(q.block, q.plain.slice(0, 40)).toContain('class="solution"');
  }
  const exam = /<section class="exam-section">([\s\S]*?)<\/section>/.exec(SOURCE)![1];
  const examQs = exam.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"'));
  expect(examQs.length).toBeGreaterThanOrEqual(5);
  const text = plain(exam);
  // questions that also use another area: completing the square, logarithms and e, trigonometry, expanding, an inequality
  for (const area of [/x\^2-6x\+14/, /e\^x/, /sin x/, /fg\(x\)=gf\(x\)/, /\(x-1\)\(x-5\)/]) expect(text).toMatch(area);
  expect((exam.match(/<ul class="markscheme">/g) ?? []).length).toBe(examQs.length);
  expect((SOURCE.match(/class="flip-section"/g) ?? []).length).toBe(1);
  expect((SOURCE.match(/class="ckw"/g) ?? []).length).toBe(9); // the warm-up and eight check sets
});

test('every word in the "Words you need" strip and every {term:} on the page is in the glossary, and the new terms are Year 2', async () => {
  const { GLOSSARY } = await import('../src/book/alevel/glossary.mjs');
  const { TOPICS } = await import('../src/book/alevel/topics.mjs');
  const ids = new Map<string, { level: string; strand: string }>((GLOSSARY as { id: string; level: string; strand: string }[]).map((g) => [g.id, g]));
  const t = (TOPICS as { id: string; words: string[] }[]).find((x) => x.id === 'functions')!;
  for (const w of t.words) expect(ids.has(w), w).toBe(true);
  for (const m of SOURCE.matchAll(/\{term:([a-z0-9-]+)(?:\|[^}]*)?\}/g)) expect(ids.has(m[1]), m[1]).toBe(true);
  for (const id of ['largest-domain', 'restricted-domain', 'horizontal-line-test', 'mapping-diagram']) { expect(ids.get(id)?.level, id).toBe('Y2'); expect(ids.get(id)?.strand, id).toBe('al-algebra'); expect(t.words, id).toContain(id); }
  expect(t.words.length).toBeGreaterThan(8);
});

// ---------- review additions ----------
test('a hint that could give the decision away shows both forms, and an expression prompt says to leave the prefix out', async () => {
  const strict = (t: string) => norm(t).replace(/>=/g, '>').replace(/<=/g, '<');
  let boundaryQuestions = 0;
  for (const q of questions()) {
    if (q.answers.length === 0) continue;
    const hint = /Type [^.]* like (.*?)\.?$/.exec(q.plain)?.[1];
    const key = norm(q.answers[0]);
    // a slip that differs from the key only in > against >= (or < against <=) must not be hinted by the key's own sign
    if (/[<>]/.test(key) && q.wrongs.some((w) => w.values.some((v) => strict(v) === strict(key) && norm(v) !== key))) {
      boundaryQuestions += 1;
      expect(hint, q.plain.slice(0, 60)).toBeTruthy();
      expect(norm(hint!), `${q.plain.slice(0, 60)}: shows >= or <=`).toMatch(/>=|<=/);
      expect(norm(hint!).replace(/>=|<=/g, ''), `${q.plain.slice(0, 60)}: shows > or <`).toMatch(/[<>]/);
    }
    // a square root key is hinted only by the way to type a root
    if (/sqrt/.test(q.answers[0])) expect(hint, q.plain.slice(0, 60)).toBe('sqrt(x+1)');
  }
  expect(boundaryQuestions).toBeGreaterThanOrEqual(4);
  const expr = questions().filter((q) => /Find f\^\(-1\)\(x\)\.|Write h\(t-3\)|Write gf\(x\) in the form|Write ff\(x\) in simplified/.test(q.plain));
  expect(expr.length).toBe(7);
  for (const q of expr) expect(q.plain, q.plain.slice(0, 60)).toContain('Type only the expression');
});

test('every axis letter drawn is the one the figure names, and no blank repeats its own number in the step it finishes', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/functions.mjs');
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    if (!(id in STATED)) continue;
    const svg = make();
    const alts = [...svg.matchAll(/<text[^>]*class="svg-t alt"([^>]*)>([^<]*)<\/text>/g)].map((m) => ({ attrs: m[1], text: m[2] })).filter((t) => !/data-for/.test(t.attrs));
    const xs = alts.filter((t) => /text-anchor="start"/.test(t.attrs)).map((t) => ({ x: Number(/ x="([\d.-]+)"/.exec(t.attrs)![1]), t: t.text })).sort((a, b) => a.x - b.x);
    const ys = alts.filter((t) => /text-anchor="middle"/.test(t.attrs));
    expect(xs[xs.length - 1].t, `${id}: horizontal axis letter`).toBe(id === 'functions-model-refine' ? 't' : 'x');
    expect(ys.map((t) => t.text), `${id}: vertical axis letter`).toEqual([STATED[id].yname ?? 'y']);
  }
  const problems: string[] = [];
  const faded = SOURCE.split('<div class="worked faded">').slice(1).map((b) => b.split('</details>')[0]);
  expect(faded.length).toBe(6);
  for (const box of faded) {
    for (const li of box.matchAll(/<li>([\s\S]*?)<\/li>/g)) {
      const parts = li[1].split(/<span class="blank" data-answers="([^"]*)">___<\/span>/);
      for (let i = 1; i < parts.length; i += 2) {
        const before = plain(parts.slice(0, i).filter((_, k) => k % 2 === 0).join(' '));
        const nums = [...before.matchAll(/(?<![\d.])\d+(?:\.\d+)?(?![\d.])/g)].map((m) => Number(m[0]));
        if (nums.includes(Math.abs(Number(parts[i])))) problems.push(`the blank "${parts[i]}" repeats a number already in: ${before.slice(0, 90)}`);
      }
    }
  }
  expect(problems).toEqual([]);
});
