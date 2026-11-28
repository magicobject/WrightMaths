import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Transformations of graphs page that a general test cannot make:
//   - every typed key is RECOMPUTED here from the question's numbers (a point is moved by solving "the inside of the bracket
//     equals the old x" and putting the old y through the outside steps; a root list is moved the same way);
//   - every wrong-answer value is recomputed from the slip its message names, and the message is checked for that slip;
//   - every multiple-choice key is decided from a function, never from the option's wording;
//   - every blank in a "Now you finish it" box is recomputed;
//   - every drawn curve is read back from the SVG path and compared with the function the page says it is;
//   - every marked point is on its curve, every asymptote is drawn where it is named, every label says its own point's
//     coordinates and sits nearest its own item, no label sits on a curve, labels keep 4px apart, and no SVG text leaves the picture.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'graph-transformations.html'), 'utf8');
const DEG = String.fromCharCode(0xb0);

const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const typedList = (xs: number[]) => [...xs].sort((a, b) => a - b).map((v) => String(v + 0)).join(' or ');
const sig = (v: number) => Math.sign(v);

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
const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', ldquo: '"', rdquo: '"', rsquo: "'", nbsp: ' ', times: '*', sup2: '^2', hellip: '...', middot: '.' };
const decode = (t: string) => t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n] ?? m);
const plain = (h: string) => decode(h.replace(/<[^>]+>/g, '').replace(/\{m:/g, '').replace(/\}/g, '')).replace(/\s+/g, ' ').trim();

/** A typed answer as a function of x, for an equation such as -(x^2+3) or 6/(x-3)-1. */
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
  return a.length === b.length && a.every((v, i) => close(v, b[i], tol));
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

// ---------- the one rule every point question uses, written here from the maths ----------
type Pt = [number, number];
/**
 * Where the point (p, q) of y = f(x) goes on y = a f(b x + c) + d: the new x makes the inside of the bracket equal p, and
 * the new y is what the steps outside the bracket make of q.
 */
const img = ([p, q]: Pt, { a = 1, b = 1, c = 0, d = 0 }: { a?: number; b?: number; c?: number; d?: number } = {}): Pt => [(p - c) / b, a * q + d];
const pt = ([x, y]: Pt) => `${x + 0},${y + 0}`;
/** The x-coordinate of the lowest point of a function, by scanning (used to see which way a translation moves a graph). */
function lowestX(f: (x: number) => number): number {
  let best = -20;
  for (let x = -20; x <= 20; x += 0.01) if (f(x) < f(best) - 1e-12) best = x;
  return Math.round(best * 100) / 100;
}
const isPole = (f: (x: number) => number, x0: number) => Math.abs(f(x0 + 1e-9)) > 1e7 && Math.abs(f(x0 - 1e-9)) > 1e7;
const rad = (d: number) => (d * Math.PI) / 180;
const sinD = (x: number) => Math.sin(rad(x));

type Slip = { value: string; says: RegExp; fn?: (x: number) => number };
type Check = { find: string; answer: string; fn?: (x: number) => number; slips?: Slip[] };

// the graphs the equation questions name, written here from the question's own numbers
const parabF = (x: number) => (x - 2) ** 2 - 3; // the figure of "form y=(x-a)^2+b": lowest point (2, -3), through (0, 1)
const recipF = (x: number) => 6 / (x - 3) - 1; // the figure of "form y=frac(a, x+b)+c": asymptotes x = 3 and y = -1, through (0, -3)
const trigA = (5 - 1) / 2; // the figure of "y=a*sin x+c": highest value 5 and lowest value 1
const trigC = (5 + 1) / 2;

const CHECKS: Check[] = [
  // warm-up and recap
  { find: 'Work out f(-2)', answer: String(((x: number) => x * x - 3 * x)(-2)), slips: [{ value: String(-(2 ** 2) - 3 * -2), says: /\(-2\)\^2 as -4/ }, { value: String(2 ** 2 - 6), says: /-3\*\(-2\) as -6/ }] },
  { find: 'Solve frac(2, x-1)=-1', answer: String(solve((x) => 2 / (x - 1) + 1)[0]), slips: [{ value: String(-1 - 1), says: /left out the last step/ }, { value: String(2 + 1), says: /dropped the minus sign/ }] },
  { find: 'closer and closer to which number', answer: String(Math.round(1 / 1e9 + 3)), slips: [{ value: '0', says: /close to 0, but the 3 is added on/ }] },
  { find: 'What is the largest value of sin x', answer: String(Math.max(...Array.from({ length: 3600 }, (_, i) => sinD(i / 10)))), slips: [{ value: '90', says: /angle where the largest value happens/ }] },
  { find: 'y=(x+1)(x-3) meets the x-axis', answer: typedList(solve((x) => (x + 1) * (x - 3))), slips: [{ value: typedList([1, -3]), says: /copied the numbers/ }] },
  // 1. translating
  { find: 'lowest point of y=(x-4)^2+1', answer: pt(img([0, 0], { c: -4, d: 1 })), slips: [{ value: pt(img([0, 0], { c: 4, d: 1 })), says: /copied the sign/ }, { value: pt([1, 4]), says: /y-value first/ }] },
  { find: 'matching point on the graph of y=f(x-3)+5', answer: pt(img([6, -2], { c: -3, d: 5 })), slips: [{ value: pt([6 - 3, -2 + 5]), says: /moved the point left/ }, { value: pt([6 + 3, -2 - 5]), says: /down by 5/ }] },
  { find: 'moved 3 units to the right', answer: '(x-3)^2', fn: (x) => (x - 3) ** 2, slips: [{ value: '(x+3)^2', fn: (x) => (x + 3) ** 2, says: /moves the graph 3 to the left/ }, { value: 'x^2-3', fn: (x) => x * x - 3, says: /moves the graph 3 down/ }] },
  { find: 'crosses the x-axis at x=2 and x=7', answer: typedList([2, 7].map((r) => img([r, 0], { c: 3 })[0])), slips: [{ value: typedList([2, 7].map((r) => r + 3)), says: /moved the graph to the right/ }] },
  // 2. stretching
  { find: 'on the graph of y=2f(x). Type it', answer: pt(img([3, 5], { a: 2 })), slips: [{ value: pt(img([3, 5], { b: 0.5 })), says: /doubled the x-coordinate/ }, { value: pt([3, 5 / 2]), says: /halved the y-coordinate/ }] },
  { find: 'on the graph of y=f(2x). Type it', answer: pt(img([6, -4], { b: 2 })), slips: [{ value: pt(img([6, -4], { b: 0.5 })), says: /doubled the x-coordinate/ }, { value: pt([6, -4 * 2]), says: /doubled the y-coordinate/ }] },
  { find: 'y=f(3x) crosses the x-axis. Type them like 1 or 2 or 3', answer: typedList([-3, 3, 6].map((r) => img([r, 0], { b: 3 })[0])), slips: [{ value: typedList([-3, 3, 6].map((r) => r * 3)), says: /multiplied by 3/ }] },
  { find: 'Write f(2x) in simplified form', answer: '4x^2-5', fn: (x) => (2 * x) ** 2 - 5, slips: [{ value: '2x^2-5', fn: (x) => 2 * x * x - 5, says: /squared the x but not the 2/ }, { value: '2x^2-10', fn: (x) => 2 * (x * x - 5), says: /2f\(x\)/ }] },
  // 3. reflecting
  { find: 'on the graph of y=-f(x). Type it', answer: pt(img([5, -3], { a: -1 })), slips: [{ value: pt(img([5, -3], { b: -1 })), says: /changed the sign of the x-coordinate/ }, { value: pt([-5, 3]), says: /changed both signs/ }] },
  { find: 'on the graph of y=f(-x). Type it', answer: pt(img([-4, 7], { b: -1 })), slips: [{ value: pt(img([-4, 7], { a: -1 })), says: /changed the sign of the y-coordinate/ }, { value: pt([4, -7]), says: /changed both signs/ }] },
  { find: 'where y=f(-x) crosses the x-axis', answer: typedList([-2, 1, 5].map((r) => img([r, 0], { b: -1 })[0])), slips: [{ value: typedList([-2, 1, 5]), says: /original roots/ }] },
  { find: 'Write f(-x) in simplified form', answer: '-x^3-x', fn: (x) => (-x) ** 3 + -x, slips: [{ value: 'x^3+x', fn: (x) => x ** 3 + x, says: /did not change any signs/ }, { value: '-x^3+x', fn: (x) => -(x ** 3) + x, says: /second term/ }] },
  // 4. the reciprocal graph, moved
  { find: 'has a vertical asymptote x=k', answer: (() => { const f = (x: number) => 3 / (x + 5) + 1; expect(isPole(f, -5)).toBe(true); return String(-5); })(), slips: [{ value: '5', says: /copied the number/ }, { value: String(Math.round(((x: number) => 3 / (x + 5) + 1)(1e9))), says: /horizontal asymptote/ }] },
  { find: 'The asymptotes of y=frac(4, x-3)-2 cross', answer: (() => { const f = (x: number) => 4 / (x - 3) - 2; expect(isPole(f, 3)).toBe(true); return pt([3, Math.round(f(1e9))]); })(), slips: [{ value: pt([-3, 2]), says: /copied the signs/ }, { value: pt([-2, 3]), says: /y-value first/ }] },
  { find: 'y=frac(6, x+3)-1 meets the y-axis', answer: String(6 / 3 - 1), slips: [{ value: String(6 / 3), says: /left out the -1/ }, { value: String(6 / -3 - 1), says: /used -3 for the bracket/ }] },
  { find: 'y=frac(4, x-1)+2 meets the x-axis', answer: String(solve((x) => 4 / (x - 1) + 2)[0]), slips: [{ value: String(solve((x) => 4 / (x - 1) - 2)[0]), says: /dropped the minus sign/ }, { value: String(-2), says: /left out the last step/ }] },
  { find: 'y=frac(a, x-2)+1 passes through the point (0, 4)', answer: String((4 - 1) * (0 - 2)), slips: [{ value: String((4 - 1) * (0 + 2)), says: /is -2, not 2/ }, { value: String((4 - 1) / (0 - 2)), says: /divided 3 by -2/ }] },
  // 5. combining
  { find: 'y=4f(x+1)-5', answer: pt(img([2, 3], { a: 4, c: 1, d: -5 })), slips: [{ value: pt([2 + 1, 4 * 3 - 5]), says: /added 1 to the x-coordinate/ }, { value: pt([2 - 1, 4 * 3 + 5]), says: /added 5 at the end/ }] },
  { find: 'y=-f(x-3)+2', answer: pt(img([-1, 4], { a: -1, c: -3, d: 2 })), slips: [{ value: pt([-1 - 3, -4 + 2]), says: /subtracted 3 from the x-coordinate/ }, { value: pt([-1 + 3, 4 + 2]), says: /left out the minus sign/ }] },
  { find: 'y=f(2x+6) crosses the x-axis', answer: String(img([10, 0], { b: 2, c: 6 })[0]), slips: [{ value: String(10 - 6), says: /did not divide by 2/ }, { value: String(10 / 2 - 6), says: /halved 10 and then took away 6/ }] },
  { find: 'moved 3 units up and then reflected', answer: '-x^2-3', fn: (x) => -(x * x + 3), slips: [{ value: '-x^2+3', fn: (x) => -(x * x) + 3, says: /reflection first and then a move up/ }] },
  { find: 'lowest point of the new graph', answer: pt(img([0, 0], { a: 3, c: 2, d: -1 })), slips: [{ value: pt(img([0, 0], { c: -2, d: -1 })), says: /copied the sign/ }, { value: pt([-2, 3 * -1]), says: /multiplied the -1 by 3/ }] },
  // 6. trigonometric and exponential graphs
  { find: 'largest value of y=4*sin x+2', answer: String(4 * 1 + 2), slips: [{ value: String(4 * 1), says: /largest value of 4\*sin x/ }, { value: String(4 * (1 + 2)), says: /added 2 before you multiplied/ }] },
  { find: 'period of y=sin 3x', answer: String(360 / 3), slips: [{ value: String(360 * 3), says: /multiplied by 3/ }, { value: '360', says: /period of sin x/ }] },
  { find: 'its first highest point for x greater than 0', answer: String(img([90, 1], { c: -40 })[0]), slips: [{ value: String(90 - 40), says: /moved the point to the left/ }, { value: '90', says: /where the highest point of sin x is/ }] },
  { find: 'horizontal asymptote y=k', answer: String(0 - 5), slips: [{ value: '5', says: /Down means a smaller y-value/ }, { value: '0', says: /before the move/ }] },
  { find: 'y=2^x+3 meets the y-axis', answer: String(2 ** 0 + 3), slips: [{ value: String(0 + 3), says: /treated 2\^0 as 0/ }, { value: String(2 + 3), says: /2\^0 as 2/ }] },
  // flip it
  { find: 'form y=(x-a)^2+b', answer: '(x-2)^2-3', fn: parabF, slips: [{ value: '(x+2)^2-3', fn: (x) => (x + 2) ** 2 - 3, says: /copied the sign/ }, { value: '(x-2)^2+3', fn: (x) => (x - 2) ** 2 + 3, says: /below the x-axis/ }] },
  { find: 'in the form y=frac(a, x+b)+c', answer: '6/(x-3)-1', fn: recipF, slips: [{ value: '-6/(x-3)-1', fn: (x) => -6 / (x - 3) - 1, says: /does not fit/ }, { value: '6/(x+3)-1', fn: (x) => 6 / (x + 3) - 1, says: /bracket must be 0 when x=3/ }] },
  { find: 'y=a*sin x+c. Find a and c', answer: `${trigA},${trigC}`, slips: [{ value: `${trigC},${trigA}`, says: /gave c first/ }, { value: '5,1', says: /highest and lowest values/ }] },
  { find: 'f(x+k)', answer: String(4 - 1), slips: [{ value: String(-(4 - 1)), says: /3 to the right/ }, { value: String(4 + 1), says: /added the two numbers/ }] },
  // mixed review
  { find: 'y=f(-x)-4', answer: pt(img([-3, 2], { b: -1, d: -4 })), slips: [{ value: pt([-3, 2 - 4]), says: /reflects the graph in the y-axis/ }, { value: pt([3, 2 + 4]), says: /added 4/ }] },
  { find: 'y=frac(2, x+3)-4 meets the x-axis', answer: String(solve((x) => 2 / (x + 3) - 4)[0]), slips: [{ value: String(0.5 + 3), says: /added 3/ }, { value: '0.5', says: /last step/ }] },
  { find: 'y=f(3x) crosses the x-axis. Type them like 1 or 2.', answer: typedList([-3, 3].map((r) => img([r, 0], { b: 3 })[0])), slips: [{ value: typedList([-3, 3].map((r) => r * 3)), says: /multiplied by 3/ }, { value: typedList([-3, 3]), says: /original crossing points/ }] },
  { find: 'smallest value of y=3*sin x-2', answer: String(3 * -1 - 2), slips: [{ value: String(3 * -1), says: /smallest value of 3\*sin x/ }, { value: String(3 * (-1 - 2)), says: /subtracted 2 before you multiplied/ }] },
  { find: 'lowest point of the graph of y=2f(x)+5', answer: pt(img([3, -1], { a: 2, d: 5 })), slips: [{ value: pt([3, -1 + 5]), says: /did not multiply by 2/ }, { value: pt([6, 2 * -1 + 5]), says: /doubled the x-coordinate/ }] },
  // exam style
  { find: 'y=3f(frac(x, 2))', answer: pt(img([4, -1], { a: 3, b: 0.5 })), slips: [{ value: pt(img([4, -1], { a: 3, b: 2 })), says: /halved the x-coordinate/ }, { value: pt([8, -1]), says: /left out the 3/ }] },
  { find: 'y=frac(5, x-2)+1. Find the x-coordinate', answer: String(solve((x) => 5 / (x - 2) + 1)[0]), slips: [{ value: String(solve((x) => 5 / (x - 2) - 1)[0]), says: /dropped the minus sign/ }, { value: String(-5), says: /last step/ }] },
  { find: 'has the asymptotes x=-3 and y=2', answer: String((4 - 2) * (0 + 3)), slips: [{ value: String(4 * 3), says: /left out the \+2/ }, { value: String(4 - 2), says: /last step/ }] },
  { find: 'first highest point of the new graph', answer: pt(img([90, 1], { a: 2, c: -30 })), slips: [{ value: pt([90 - 30, 2]), says: /moved the point to the left/ }, { value: pt([120, 1]), says: /left out the stretch/ }] },
  { find: 'y=f(2x+1)-2', answer: pt(img([-3, 6], { b: 2, c: 1, d: -2 })), slips: [{ value: pt([(-3 + 1) / 2, 4]), says: /added 1 instead of taking it away/ }, { value: pt([-3 - 1, 4]), says: /last step/ }] },
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
      const ok = c.fn ? SAMPLES.every((v) => close(eqFn(k)(v), c.fn!(v), 1e-7)) : sameValue(k, c.answer);
      if (!ok) problems.push(`${c.find}: key "${k}" is not the recomputed answer "${c.answer}"`);
    }
    for (const s of c.slips ?? []) {
      const li = q.wrongs.find((w) => matches(s.value, w.values, q.mode));
      if (!li) { problems.push(`${c.find}: no wrong-answer entry accepts the slip value "${s.value}" (entries: ${q.wrongs.map((w) => w.values.join(' | ')).join(' / ')})`); continue; }
      li.claimed = true;
      if (!s.says.test(plain(li.text))) problems.push(`${c.find}: the message for "${s.value}" does not name the slip ${s.says}: ${plain(li.text).slice(0, 90)}`);
      if (matches(s.value, q.answers, q.mode)) problems.push(`${c.find}: the slip value "${s.value}" is also a right answer`);
      for (const v of li.values) {
        const same = s.fn ? SAMPLES.every((x) => close(eqFn(v)(x), s.fn!(x), 1e-7)) : sameValue(v, s.value);
        if (!same) problems.push(`${c.find}: "${v}" is listed with the slip but is not the slip value "${s.value}"`);
      }
      if (s.fn && c.fn && SAMPLES.every((x) => close(s.fn!(x), c.fn!(x), 1e-7))) problems.push(`${c.find}: the slip "${s.value}" is the same graph as the key`);
    }
    for (const w of q.wrongs) if (!w.claimed) problems.push(`${c.find}: wrong-answer entry "${w.values.join(' | ')}" has no recomputed slip`);
  }
  for (const q of qs) if (q.answers.length > 0 && !checked.has(q)) problems.push(`no recomputed key for: ${q.plain.slice(0, 70)}`);
  expect(CHECKS.length).toBe(46);
  expect(qs.length).toBeGreaterThanOrEqual(55);
  expect(problems).toEqual([]);
});

// ---------- multiple-choice keys, decided from the function ----------
const options = (find: string) => {
  const q = questions().find((x) => x.plain.includes(find));
  expect(q, find).toBeTruthy();
  return [...(q as Question).block.matchAll(/<li( data-correct| data-why="([^"]*)")?>([\s\S]*?)<\/li>/g)].filter((m) => m[1]).map((m) => ({ correct: m[1] === ' data-correct', why: decode(m[2] ?? ''), text: plain(m[3]) }));
};
const correctText = (find: string) => options(find).find((o) => o.correct)?.text;
const way = (dx: number, dy: number) => (dy ? `${Math.abs(dy)} units ${dy < 0 ? 'down' : 'up'}` : `${Math.abs(dx)} units to the ${dx < 0 ? 'left' : 'right'}`);

test('multiple-choice keys: each correct option is the one the function gives, and each reason quotes right numbers', () => {
  // f(x) - 4 and f(x + 5): decided from the lowest point of y = x^2 moved
  const g = (x: number) => x * x;
  expect(lowestX((x) => g(x) - 4)).toBe(0);
  expect(Math.min(...[-3, 0, 3].map((x) => g(x) - 4))).toBe(-4);
  expect(correctText('moved to give the graph of y=f(x)-4')).toBe(`The graph moves ${way(0, -4)}`);
  expect(lowestX((x) => g(x + 5))).toBe(-5);
  expect(correctText('moved to give the graph of y=f(x+5)')).toBe(`The graph moves ${way(lowestX((x) => g(x + 5)), 0)}`);
  // 3f(x) leaves every root where it is
  const cubic = (x: number) => (x + 1) * (x - 1) * (x - 3);
  expect(solve((x) => 3 * cubic(x))).toEqual(solve(cubic));
  expect(correctText('stretched to give the graph of y=3f(x)')).toBe('They stay where they are');
  // f(4x): every root of f is divided by 4
  expect(solve((x) => cubic(4 * x)).map((r) => r * 4)).toEqual(solve(cubic));
  expect(correctText('changed to the graph of y=f(4x)')).toBe('A stretch in the x-direction with scale factor one quarter');
  // the reflection of the graph in the y-axis: the point (-p, q) is on it whenever (p, q) is on y = f(x)
  const f = (x: number) => x ** 3 + 2 * x * x - x;
  const mirror = (h: (x: number) => number) => [-2, -0.5, 1, 3].every((p) => close(h(-p), f(p)));
  expect(mirror((x) => f(-x))).toBe(true);
  expect(mirror((x) => -f(x))).toBe(false);
  expect(mirror((x) => f(x - 1))).toBe(false);
  expect(correctText('reflection of y=f(x) in the y-axis')).toBe('y = f(-x)');
  // y = -4/(x+2) + 1: the asymptotes are x = -2 and y = 1; right of -2 the curve is below y = 1, left of -2 it is above
  const h = (x: number) => -4 / (x + 2) + 1;
  expect(isPole(h, -2)).toBe(true);
  expect(Math.round(h(1e9))).toBe(1);
  expect(h(-1.9)).toBeLessThan(1);
  expect(h(-2.1)).toBeGreaterThan(1);
  expect(correctText('graph of y=frac(-4, x+2)+1')).toBe('Branches in the top left and bottom right of the point (-2, 1)');
  // y = 2/(x-1) + 1 never has x = 1, and does have the point (-1, 0)
  const r = (x: number) => 2 / (x - 1) + 1;
  expect(isPole(r, 1)).toBe(true);
  expect(r(-1)).toBe(0);
  expect(correctText('true of the graph of y=frac(2, x-1)+1')).toBe('The graph has no point with x = 1');
  expect(options('true of the graph of y=frac(2, x-1)+1')[1].why).toContain('y = 2/(-2) + 1 = 0');
  // f(2x - 4): a stretch with scale factor s, then a move of t: the root 6 of f goes to 5
  const root = (s: number, t: number) => 6 * s + t;
  expect(solve((x) => 2 * x - 4 - 6)[0]).toBe(5);
  expect(root(0.5, 2)).toBe(5);
  expect(root(0.5, 4)).not.toBe(5);
  expect(root(2, 2)).not.toBe(5);
  expect(correctText('change from y=f(x) to y=f(2x-4)')).toBe('A stretch in the x-direction with scale factor one half, then a translation 2 to the right');
  // y = 3 sin x has largest value 3 and period 360; sin 3x has largest value 1; sin x + 3 has smallest value 2
  const top = (fn: (x: number) => number) => Math.max(...Array.from({ length: 3600 }, (_, i) => fn(i / 10)));
  expect(top((x) => 3 * sinD(x))).toBeCloseTo(3, 6);
  expect(top((x) => sinD(3 * x))).toBeCloseTo(1, 6);
  expect(correctText('stretched in the y-direction with scale factor 3')).toBe('y = 3 sin x');
  // Dan: f(x + 3) has its lowest point at x = -3, so the graph moves left
  expect(lowestX((x) => g(x + 3))).toBe(-3);
  expect(correctText('Dan says')).toContain('moves 3 to the left');
  // Meera: the root 4 of f becomes 2 under f(2x)
  expect(solve((x) => 2 * x - 4)[0]).toBe(2);
  expect(correctText('Meera says')).toContain('scale factor is one half');
  expect(correctText('Meera says')).toContain('x = 2');
  // Sam: the bottom of 3/(x+2) is 0 at x = -2
  expect(isPole((x) => 3 / (x + 2), -2)).toBe(true);
  expect(isPole((x) => 3 / (x + 2), 2)).toBe(false);
  expect(correctText('Sam says')).toContain('x = -2');
  expect(options('Sam says')[1].why).toContain('y = 3/(x + 2) - 2');
});

test('the blanks in every "Now you finish it" are recomputed', () => {
  const expected = [
    ...img([5, 2], { c: -3, d: 1 }), // 8, 3
    ...[4, -6].map((r) => img([r, 0], { b: 2 })[0]), // 2, -3
    ...[img([3, 4], { a: -1 })[1], img([3, 4], { b: -1 })[0]], // -4, -3
    ...[6 / 2 - 1, solve((x) => 6 / (x + 2) - 1)[0]], // 2, 4
    ...img([3, 5], { a: 3, c: 2, d: -1 }), // 1, 14
    ...[3 * 1 - 1, 3 * -1 - 1], // 2, -4
  ].map(String);
  const blanks = [...SOURCE.matchAll(/class="blank" data-answers="([^"]*)"/g)].map((m) => m[1]);
  expect(blanks).toEqual(expected);
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
  expect(checked).toBeGreaterThan(50);
  expect(problems).toEqual([]);
});

// ---------- the pictures ----------
type Geom = { width: number; height: number; left: number; right: number; top: number; bottom: number; xmin: number; xmax: number; ymin: number; ymax: number };
type Fx = (x: number) => number;
/** What each picture is meant to show, written here from the page's own numbers (not read from the figure code). */
type Stated = {
  curves: { cls: string; f: Fx; from?: number; to?: number }[];
  points: Record<string, Pt>;
  on: Record<string, number[]>;
  roots?: { x: number; w?: [number, number] }[]; // curve 0 crosses the x-axis here
  vlines?: Record<string, number>;
  hlines?: Record<string, number>;
  branches?: { curve: number; centre: Pt; sign: 1 | -1 }; // two branches round the centre: sign 1 = top right and bottom left
  unit?: string; // the unit written after the x-coordinate of a label
};
const cub: Fx = (x) => (x + 1) * (x - 1) * (x - 3);
const full = { from: 0, to: 360 };
const STATED: Record<string, Stated> = {
  'graph-transformations-base': { curves: [{ cls: 'curve', f: cub }], points: { r1: [-1, 0], r2: [1, 0], r3: [3, 0], yint: [0, 3] }, on: { r1: [0], r2: [0], r3: [0], yint: [0] }, roots: [{ x: -1 }, { x: 1 }, { x: 3 }] },
  'graph-transformations-up': { curves: [{ cls: 'curve', f: (x) => x * x }, { cls: 'curve-b', f: (x) => x * x + 3 }], points: { v0: [0, 0], v1: [0, 3] }, on: { v0: [0], v1: [1] } },
  'graph-transformations-left': { curves: [{ cls: 'curve', f: cub }, { cls: 'curve-b', f: (x) => cub(x + 1) }], points: { r1: [-2, 0], r2: [0, 0], r3: [2, 0] }, on: { r1: [1], r2: [1], r3: [1] } },
  'graph-transformations-vstretch': { curves: [{ cls: 'curve', f: cub }, { cls: 'curve-b', f: (x) => 2 * cub(x) }], points: { yint: [0, 6] }, on: { yint: [1] } },
  'graph-transformations-hstretch': { curves: [{ cls: 'curve', f: cub }, { cls: 'curve-b', f: (x) => cub(2 * x) }], points: { r1: [-0.5, 0], r2: [0.5, 0], r3: [1.5, 0] }, on: { r1: [1], r2: [1], r3: [1] } },
  'graph-transformations-xreflect': { curves: [{ cls: 'curve', f: cub }, { cls: 'curve-b', f: (x) => -cub(x) }], points: { yint: [0, -3] }, on: { yint: [1] } },
  'graph-transformations-yreflect': { curves: [{ cls: 'curve', f: cub }, { cls: 'curve-b', f: (x) => cub(-x) }], points: { r1: [-3, 0], r2: [-1, 0], r3: [1, 0] }, on: { r1: [1], r2: [1], r3: [1] } },
  'graph-transformations-recip-shift': { curves: [{ cls: 'curve', f: (x) => 4 / x }, { cls: 'curve-b', f: (x) => 4 / (x - 2) + 1 }], points: { xint: [-2, 0], yint: [0, -1] }, on: { xint: [1], yint: [1] }, vlines: { va: 2 }, hlines: { ha: 1 }, branches: { curve: 1, centre: [2, 1], sign: 1 } },
  'graph-transformations-recip-neg': { curves: [{ cls: 'curve', f: (x) => -3 / x }, { cls: 'curve-b', f: (x) => -3 / (x + 1) + 1 }], points: { yint: [0, -2], xint: [2, 0] }, on: { yint: [1], xint: [1] }, vlines: { va: -1 }, hlines: { ha: 1 }, branches: { curve: 1, centre: [-1, 1], sign: -1 } },
  'graph-transformations-combo-quad': { curves: [{ cls: 'curve', f: (x) => x * x }, { cls: 'curve-b', f: (x) => 2 * (x - 1) ** 2 + 3 }], points: { v0: [0, 0], vertex: [1, 3], yint: [0, 5] }, on: { v0: [0], vertex: [1], yint: [1] } },
  'graph-transformations-sin-amp': { curves: [{ cls: 'curve', f: sinD, ...full }, { cls: 'curve-b', f: (x) => 2 * sinD(x), ...full }], points: { max: [90, 2], min: [270, -2] }, on: { max: [1], min: [1] }, unit: DEG },
  'graph-transformations-sin-shift': { curves: [{ cls: 'curve', f: sinD, ...full }, { cls: 'curve-b', f: (x) => sinD(x - 60), ...full }], points: { zero: [60, 0], max: [150, 1] }, on: { zero: [1], max: [1] }, unit: DEG },
  'graph-transformations-sin-period': { curves: [{ cls: 'curve', f: sinD, ...full }, { cls: 'curve-b', f: (x) => sinD(2 * x), ...full }], points: { max: [45, 1], min: [135, -1] }, on: { max: [1], min: [1] }, unit: DEG },
  'graph-transformations-exp-shift': { curves: [{ cls: 'curve', f: (x) => 2 ** x }, { cls: 'curve-b', f: (x) => 2 ** x - 2 }], points: { yint0: [0, 1], yint1: [0, -1], xint: [1, 0] }, on: { yint0: [0], yint1: [1], xint: [1] }, hlines: { ha: -2 } },
  'graph-transformations-exp-mirror': { curves: [{ cls: 'curve', f: (x) => 2 ** x }, { cls: 'curve-b', f: (x) => 2 ** -x }], points: { right: [2, 4], left: [-2, 4], yint: [0, 1] }, on: { right: [0], left: [1], yint: [0, 1] } },
  'graph-transformations-flip-recip': { curves: [{ cls: 'curve', f: (x) => 3 / (x + 1) + 2 }], points: { p: [0, 5] }, on: { p: [0] }, vlines: { va: -1 }, hlines: { ha: 2 }, branches: { curve: 0, centre: [-1, 2], sign: 1 } },
  'graph-transformations-q-parab': { curves: [{ cls: 'curve', f: parabF }], points: { vertex: [2, -3], yint: [0, 1] }, on: { vertex: [0], yint: [0] } },
  'graph-transformations-q-recip': { curves: [{ cls: 'curve', f: recipF }], points: { p: [0, -3] }, on: { p: [0] }, vlines: { va: 3 }, hlines: { ha: -1 }, branches: { curve: 0, centre: [3, -1], sign: 1 } },
  'graph-transformations-q-trig': { curves: [{ cls: 'curve', f: (x) => trigA * sinD(x) + trigC, ...full }], points: { max: [90, 5], min: [270, 1] }, on: { max: [0], min: [0] }, unit: DEG },
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
    pieces: m[2].split('M').filter(Boolean).map((piece) => piece.split('L').map((p) => { const [a, b] = p.trim().split(' ').map(Number); return [toX(a), toY(b)] as [number, number]; })),
  }));
  const guides = [...svg.matchAll(/<line class="guide" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].map((m) => ({ x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] }));
  const circles = [...svg.matchAll(/<circle class="pt" data-name="([^"]*)" cx="([\d.-]+)" cy="([\d.-]+)" r="7"\/>/g)].map((m) => ({ name: m[1], px: +m[2], py: +m[3], x: toX(+m[2]), y: toY(+m[3]) }));
  const labels = [...svg.matchAll(/<text[^>]*data-for="([^"]*)" x="([\d.-]+)" y="([\d.-]+)" text-anchor="(\w+)">([\s\S]*?)<\/text>/g)].map((m) => ({ for: m[1], x: +m[2], y: +m[3], anchor: m[4], text: m[5].replace(/<[^>]+>/g, '').replace(/\u200b/g, '').replace(/\u2212/g, '-') }));
  return { horizontal, vertical, px, py, toX, toY, paths, guides, circles, labels };
}

test('every curve is read back from its drawn path and is the function the page says it is', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/graph-transformations.mjs');
  expect(Object.keys(FIGURES).sort()).toEqual(Object.keys(STATED).sort());
  const problems: string[] = [];
  let points = 0;
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const g = (GEOM as Record<string, Geom>)[id];
    const st = STATED[id];
    const m = measure(svg, g);
    // the axes reach the edges of the picture, and they cross at the origin
    expect(m.horizontal.x1, id).toBeCloseTo(g.left, 0);
    expect(m.horizontal.x2, id).toBeCloseTo(g.width - g.right, 0);
    expect(m.vertical.y1, id).toBeCloseTo(g.height - g.bottom, 0);
    expect(m.vertical.y2, id).toBeCloseTo(g.top, 0);
    expect(m.vertical.x1, id).toBeCloseTo(m.px(0), 0);
    expect(m.horizontal.y1, id).toBeCloseTo(m.py(0), 0);
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
    // marked points: where the table says, and on the curves the table says
    expect(m.circles.map((c) => c.name).sort(), `${id}: marked points`).toEqual(Object.keys(st.points).sort());
    for (const c of m.circles) {
      points += 1;
      const [wx, wy] = st.points[c.name];
      if (Math.abs(c.px - m.px(wx)) > 0.6 || Math.abs(c.py - m.py(wy)) > 0.6) problems.push(`${id}/${c.name}: drawn at (${c.x.toFixed(2)}, ${c.y.toFixed(2)}) not at (${wx}, ${wy})`);
      for (const k of st.on[c.name]) if (Math.abs(st.curves[k].f(wx) - wy) > 1e-9) problems.push(`${id}/${c.name}: (${wx}, ${wy}) is not on curve ${k}`);
    }
    // an asymptote is drawn as a dashed guide line across the whole picture, at the value its label names
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
    // roots: curve 0 crosses the x-axis there (the sign of y a little each side of the root)
    for (const r of st.roots ?? []) {
      const pts = m.paths[0].pieces.flat();
      const [w0, w1] = r.w ?? [0.25, 0.6];
      const left = pts.filter(([x]) => x >= r.x - w1 && x <= r.x - w0).map(([, y]) => sig(y));
      const right = pts.filter(([x]) => x >= r.x + w0 && x <= r.x + w1).map(([, y]) => sig(y));
      expect(left.length * right.length, `${id}: points either side of ${r.x}`).toBeGreaterThan(0);
      if (!(new Set(left).size === 1 && new Set(right).size === 1 && left[0] !== right[0])) problems.push(`${id}: the drawn curve does not cross at x=${r.x}`);
    }
    // two branches round the centre of the asymptotes, in the corners the sign of a says, and never over an asymptote
    if (st.branches) {
      const { curve, centre, sign } = st.branches;
      const pieces = m.paths[curve].pieces;
      expect(pieces.length, `${id}: two branches`).toBe(2);
      const corner = (pc: [number, number][]) => ({ right: pc.every(([x]) => x > centre[0]), left: pc.every(([x]) => x < centre[0]), above: pc.every(([, y]) => y > centre[1]), below: pc.every(([, y]) => y < centre[1]) });
      const cs = pieces.map(corner);
      const want = sign === 1 ? [{ right: true, above: true }, { left: true, below: true }] : [{ left: true, above: true }, { right: true, below: true }];
      for (const w of want) if (!cs.some((c) => Object.entries(w).every(([k, v]) => c[k as keyof typeof c] === v))) problems.push(`${id}: no branch with ${JSON.stringify(w)}`);
    }
    // the exponential graphs: the dashed curve gets close to its asymptote without crossing it
    if (id.endsWith('exp-shift')) {
      const ys = m.paths[1].pieces.flat().map(([, y]) => y);
      if (!(Math.min(...ys) > -2 && Math.min(...ys) < -1.85)) problems.push(`${id}: the dashed curve does not close in on y = -2 from above`);
    }
  }
  expect(points).toBeGreaterThan(40);
  expect(problems).toEqual([]);
});

test('every label says the coordinates of its own point, and is nearest its own item and 4px clear of every other label', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/graph-transformations.mjs');
  const problems: string[] = [];
  let labelled = 0;
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
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
      // a coordinates label must not look like it belongs to another marked point; an asymptote label must not look like it belongs to anything else
      const rivals = st.points[l.for] ? items.filter((it) => it !== own && st.points[it.name]) : items.filter((it) => it !== own);
      for (const other of rivals) if (other.at(cx, cy) < mine) problems.push(`${id}: label "${l.text}" is ${Math.round(other.at(cx, cy))}px from "${other.name}" but ${Math.round(mine)}px from its own "${own.name}"`);
      if (st.points[l.for]) {
        const [x, y] = st.points[l.for];
        if (l.text !== `(${x}${st.unit ?? ''}, ${y})`) problems.push(`${id}: the label "${l.text}" is not the coordinates (${x}${st.unit ?? ''}, ${y}) of "${l.for}"`);
      } else {
        const v = st.vlines?.[l.for];
        const h = st.hlines?.[l.for];
        const want = v !== undefined ? `x = ${v}` : `y = ${h}`;
        if (l.text !== want) problems.push(`${id}: the asymptote label "${l.text}" is not "${want}"`);
      }
      // a label never sits on a curve: the curve's drawn points stay out of the label's box
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
      // and never on another marked point
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
    // every marked point and every asymptote has a label
    for (const name of [...Object.keys(st.points), ...Object.keys(st.vlines ?? {}), ...Object.keys(st.hlines ?? {})]) if (!m.labels.some((l) => l.for === name)) problems.push(`${id}: "${name}" has no label`);
  }
  expect(labelled).toBeGreaterThan(40);
  expect(problems).toEqual([]);
});

test('every figure states every marked coordinate and asymptote in its text alternative, and a question figure does not give the answer', async () => {
  const { FIGURES, ITEMS } = await import('../src/book/alevel/figures/graph-transformations.mjs');
  type Item = { kind: string; x: number; y: number };
  const problems: string[] = [];
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const title = /<title id="[^"]*">([^<]*)<\/title>/.exec(svg)?.[1] ?? '';
    const desc = /<desc id="[^"]*">([^<]*)<\/desc>/.exec(svg)?.[1] ?? '';
    const st = STATED[id];
    for (const it of (ITEMS as Record<string, Item[]>)[id]) {
      if (it.kind === 'point' && !desc.includes(`(${it.x}${st.unit ?? ''}, ${it.y})`)) problems.push(`${id}: the description does not name (${it.x}${st.unit ?? ''}, ${it.y})`);
      if (it.kind === 'vline' && !desc.includes(`x = ${it.x}`)) problems.push(`${id}: the description does not name x = ${it.x}`);
      if (it.kind === 'hline' && !desc.includes(`y = ${it.y}`)) problems.push(`${id}: the description does not name y = ${it.y}`);
    }
    if (desc.length < 80) problems.push(`${id}: the description is too short`);
    if (id.includes('-q-')) {
      expect(`${title} ${desc}`, id).not.toMatch(/equation|\bk\b|\ba = |\bc = |2 sin|2 times|6 over|\(x [-+] \d\)|minus 3|equals \(/i);
      expect(SOURCE, id).toContain(`{fig:${id}}`);
    }
  }
  expect(problems).toEqual([]);
  expect(Object.keys(FIGURES).filter((k) => k.includes('-q-')).sort()).toEqual(['graph-transformations-q-parab', 'graph-transformations-q-recip', 'graph-transformations-q-trig']);
});

test('a format hint ("Type it like ...") never gives the key away', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const problems: string[] = [];
  let hints = 0;
  for (const q of questions()) {
    const m = /Type (?:it|them|your answer as a pair \(a, c\),) like (.*?)\.?$/.exec(q.plain);
    if (!m || q.answers.length === 0) continue;
    hints += 1;
    if (matches(m[1], q.answers, q.mode)) problems.push(`"${m[1]}" is the key of: ${q.plain.slice(0, 60)}`);
  }
  expect(hints).toBeGreaterThan(20);
  expect(problems).toEqual([]);
});

test('at 320px every figure label is at least 12px tall', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/graph-transformations.html');
  const small = await page.evaluate(() => [...document.querySelectorAll('main svg.graph-svg text')].map((t) => ({ s: t.textContent, h: t.getBoundingClientRect().height })).filter((t) => t.h > 0 && t.h < 12).map((t) => t.s + ' ' + t.h.toFixed(1)));
  expect(small).toEqual([]);
});

test('at 320px every figure label is 4px clear of every other label', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/graph-transformations.html');
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
  const { FIGURES } = await import('../src/book/alevel/figures/graph-transformations.mjs');
  const used = [...SOURCE.matchAll(/\{fig:([a-z0-9-]+)\}/g)].map((m) => m[1]);
  expect(new Set(used).size).toBe(used.length);
  expect([...used].sort()).toEqual(Object.keys(FIGURES).sort());
});

test('no figure text leaves its picture', async ({ page }) => {
  await page.goto('/courses/a-level/graph-transformations.html');
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

test('the page keeps to its scope: no differentiation, radians, modulus or inverse functions', () => {
  const text = plain(SOURCE.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<p class="where-use">[\s\S]*?<\/p>/, ' '));
  expect(text).not.toMatch(/derivative|dy\/dx|stationary|radian|modulus|inverse function|composite/i);
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

test('the skip link goes to the first lesson heading (heading ids are cut at 40 characters)', () => {
  const first = /<h2>(1\.[^<]*)<\/h2>/.exec(SOURCE)![1];
  const id = `s-${plain(first).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`;
  expect(SOURCE).toContain(`href="#${id}"`);
});
