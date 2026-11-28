import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Trigonometric identities and equations page that a general test cannot make:
//   - every typed key is RECOMPUTED here from the question's own numbers, by scanning the interval for every root
//     (so a missing solution is caught), and rounded the way the question says;
//   - every wrong-answer value is recomputed from the slip its message names, and the message is checked for that slip;
//   - every multiple-choice key is decided from the maths, never from the option's wording;
//   - every blank in a "Now you finish it" box is recomputed;
//   - the rules the lessons state (the pairs of solutions, the longer interval for kx, the shifted interval) are checked
//     against a brute-force search over many equations and intervals;
//   - every drawn curve is read back from the SVG path and compared with the function the page says it is;
//   - every marked point is on its curve, every segment and guide line is where it is named, every label is nearest its
//     own item, no label sits on a curve, labels keep 4px apart, and no SVG text leaves the picture.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'trig-identities.html'), 'utf8');
const DEG = String.fromCharCode(0xb0);
const THETA = String.fromCharCode(0x3b8);

const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const typedList = (xs: number[]) => [...xs].sort((a, b) => a - b).map((v) => String(v + 0)).join(' or ');

// ---------- trigonometry in degrees, written here and not taken from the figure code ----------
const RAD = Math.PI / 180;
const S = (d: number) => Math.sin(d * RAD);
const C = (d: number) => Math.cos(d * RAD);
const T = (d: number) => Math.tan(d * RAD);
const asinD = (x: number) => Math.asin(x) / RAD;
const acosD = (x: number) => Math.acos(x) / RAD;
const atanD = (x: number) => Math.atan(x) / RAD;
const r1 = (v: number) => Math.round(v * 10) / 10 + 0;
const t3 = (v: number) => Math.round(v * 1000) / 1000 + 0;
const clean = (v: number) => Math.round(v * 1e9) / 1e9 + 0;

type Fn = (x: number) => number;
/** Every x in [lo, hi] where f(x) = 0, by scanning (a pole of a tangent is not a solution). */
function sols(f: Fn, lo: number, hi: number): number[] {
  const out: number[] = [];
  const step = 0.005;
  let px = lo;
  let py = f(lo);
  if (Math.abs(py) < 1e-9) out.push(lo);
  const n = Math.round((hi - lo) / step);
  for (let i = 1; i <= n; i += 1) {
    const x = lo + i * step;
    const y = f(x);
    if (Math.abs(y) < 1e-9) out.push(x);
    else if (Number.isFinite(y) && Number.isFinite(py) && Math.sign(y) !== Math.sign(py) && Math.abs(py) > 1e-9) {
      let a = px;
      let b = x;
      for (let k = 0; k < 60; k += 1) { const m = (a + b) / 2; if (Math.sign(f(m)) === Math.sign(f(a))) a = m; else b = m; }
      const r = (a + b) / 2;
      if (Math.abs(f(r)) < 1e-6) out.push(r);
    }
    px = x;
    py = y;
  }
  // a touching root (a repeated factor) makes f tiny over a short stretch: one root per stretch, where |f| is least
  const clusters: number[][] = [];
  for (const v of out.sort((a, b) => a - b)) {
    const last = clusters[clusters.length - 1];
    if (last && v - last[last.length - 1] < 0.2) last.push(v); else clusters.push([v]);
  }
  return clusters.map((c) => c.reduce((best, v) => (Math.abs(f(v)) < Math.abs(f(best)) ? v : best)));
}
/** The solutions rounded to 1 decimal place, refusing a value too close to a rounding boundary to be safe. */
function sols1(f: Fn, lo: number, hi: number): number[] {
  return sols(f, lo, hi).map((v) => {
    const frac = Math.abs(v * 10 - Math.floor(v * 10) - 0.5);
    if (frac < 0.01) throw new Error(`the solution ${v} is too close to a rounding boundary`);
    return r1(v);
  });
}
/** Exact solutions (whole numbers or halves): rounded to 6 places, and required to be exact. */
function solsExact(f: Fn, lo: number, hi: number): number[] {
  return sols(f, lo, hi).map((v) => { const r = Math.round(v * 1e4) / 1e4; if (Math.abs(r - v) > 1e-3) throw new Error(`${v} is not an exact angle`); return r + 0; });
}

// ---------- reading the page's questions ----------
const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', ldquo: '"', rdquo: '"', rsquo: "'", nbsp: ' ', times: '*', sup2: '^2', hellip: '...', middot: '.', deg: DEG, le: '<=', ge: '>=' };
const decode = (t: string) => t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n] ?? m);
// a "<" inside {m:...} is maths (a<=x), not a tag: protect it before the tags are removed
const plain = (h: string) => decode(h.replace(/\{m:([^}]*)\}/g, (_, t: string) => t.replace(/</g, '&lt;')).replace(/<[^>]+>/g, '').replace(/\{m:/g, '').replace(/\}/g, '')).replace(/\s+/g, ' ').trim();

const numbersIn = (t: string) => t.replace(/\band\b|\bor\b|[(),]/g, ' ').trim().split(/\s+/).filter(Boolean).map((p) => { const m = /^(-?[\d.]+)\/([\d.]+)$/.exec(p); return m ? Number(m[1]) / Number(m[2]) : Number(p); });
/** Whether two typed answers have the same value: a list ("30 or 150") or a number ("-12/13"), to the tolerance given. */
function sameValue(x: string, y: string, tol = 1e-9): boolean {
  const a = numbersIn(x).sort((p, q) => p - q);
  const b = numbersIn(y).sort((p, q) => p - q);
  return a.length === b.length && a.every((v, i) => close(v, b[i], tol));
}

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

type Slip = { value: string; says: RegExp };
type Check = { find: string; answer: string; slips?: Slip[] };

const list1 = (f: Fn, lo: number, hi: number) => typedList(sols1(f, lo, hi));
const listX = (f: Fn, lo: number, hi: number) => typedList(solsExact(f, lo, hi));
const pairs = (...v: number[]) => typedList(v.map(r1));

// the unknown angle of each equation of the page, in degrees: the key is the list of its roots in the interval
const CHECKS: Check[] = [
  // ----- warm-up and recap -----
  { find: 'Solve 2y^2-y-1=0', answer: typedList(sols((y) => 2 * y * y - y - 1, -10, 10).map(clean)), slips: [{ value: '-1 or 1', says: /solved 2y\+1=0 as y=-1/ }] },
  { find: 'Solve sin x=0.5 for 0deg<=x<=360deg', answer: listX((x) => S(x) - 0.5, 0, 360), slips: [{ value: '30', says: /one solution/ }] },
  { find: 'Work out 0.6^2+0.8^2', answer: String(clean(0.6 ** 2 + 0.8 ** 2)), slips: [{ value: String(clean((0.6 + 0.8) ** 2)), says: /added first and squared after/ }] },
  { find: 'The side opposite theta is 3', answer: String(3 / 4), slips: [{ value: String(4 / 3), says: /adjacent over opposite/ }] },
  { find: 'Solve t^2=3t', answer: typedList(sols((t) => t * t - 3 * t, -10, 10).map(clean)), slips: [{ value: '3', says: /divided both sides by t.*loses the solution t=0/ }] },
  // ----- 1. the two identities -----
  { find: 'sin theta=0.6 and cos theta=0.8. Find tan theta', answer: String(clean(0.6 / 0.8)), slips: [{ value: String(0.8 / 0.6), says: /divided the cosine by the sine/ }, { value: String(clean(0.6 * 0.8)), says: /multiplied the sine and the cosine/ }] },
  { find: 'work out sin^2(20deg)+cos^2(20deg)', answer: String(clean(S(20) ** 2 + C(20) ** 2)), slips: [{ value: String(t3(S(20) + C(20))), says: /added sin\(20deg\) and cos\(20deg\) without squaring/ }] },
  { find: 'sin(135deg)=0.707 and cos(135deg)=-0.707', answer: String(clean(t3(S(135)) / t3(C(135)))), slips: [{ value: '1', says: /size but not the sign/ }] },
  // ----- 2. finding the other values -----
  { find: 'acute and sin theta=0.8', answer: String(clean(Math.sqrt(1 - 0.8 ** 2))), slips: [{ value: String(clean(1 - 0.8 ** 2)), says: /That is cos\^2 theta/ }, { value: String(clean(1 - 0.8)), says: /1-0.8.*squares/ }] },
  { find: 'obtuse and cos theta=-0.28', answer: String(clean(Math.sqrt(1 - 0.28 ** 2))), slips: [{ value: String(-clean(Math.sqrt(1 - 0.28 ** 2))), says: /sign is not.*sine is positive/ }, { value: String(clean(1 - 0.28 ** 2)), says: /That is sin\^2 theta/ }] },
  { find: 'sin theta=-frac(5,13)', answer: '-12/13', slips: [{ value: String(12 / 13), says: /size is right but the sign is not.*cosine is negative/ }, { value: String(-144 / 169), says: /cos\^2 theta with a minus sign/ }] },
  { find: 'obtuse and sin theta=frac(4,5)', answer: '-4/3', slips: [{ value: String(4 / 3), says: /sign is not.*tangent is negative/ }, { value: String(-3 / 4), says: /divided the cosine by the sine/ }] },
  // ----- 3. every solution in an interval -----
  { find: 'Solve sin x=0.9', answer: list1((x) => S(x) - 0.9, 0, 360), slips: [{ value: '64.2', says: /one solution.*second/ }, { value: pairs(asinD(0.9), 360 - asinD(0.9)), says: /360-64.2.*rule for cosine/ }] },
  { find: 'Solve cos x=-0.7', answer: list1((x) => C(x) + 0.7, 0, 360), slips: [{ value: pairs(acosD(-0.7), 180 - acosD(-0.7)), says: /180-134.4.*rule for sine/ }] },
  { find: 'Solve tan x=-3', answer: list1((x) => T(x) + 3, 0, 360), slips: [{ value: pairs(atanD(-3), atanD(-3) + 180), says: /-71.6 is outside the interval/ }] },
  { find: 'Solve cos x=0.5 for 0deg<=x<=720deg', answer: listX((x) => C(x) - 0.5, 0, 720), slips: [{ value: '60 or 300', says: /first turn.*add 360/ }] },
  { find: 'solutions does tan x=5 have', answer: String(sols((x) => T(x) - 5, 0, 540).length), slips: [{ value: '2', says: /two in the first 360.*540/ }] },
  // ----- 4. a multiple of the angle -----
  { find: 'Solve sin 3x=0.5', answer: listX((x) => S(3 * x) - 0.5, 0, 180), slips: [{ value: '10 or 50', says: /first 360.*540/ }] },
  { find: 'Solve cos 2x=0.4', answer: list1((x) => C(2 * x) - 0.4, 0, 360), slips: [{ value: pairs(acosD(0.4), 360 - acosD(0.4)), says: /values of 2x.*divide each by 2/ }, { value: pairs(acosD(0.4) / 2, (360 - acosD(0.4)) / 2), says: /first 360.*of 2x.*720/ }] },
  { find: 'Solve tan 2x=3', answer: list1((x) => T(2 * x) - 3, 0, 180), slips: [{ value: pairs(atanD(3), atanD(3) + 180), says: /values of 2x.*divide each by 2/ }] },
  { find: 'solutions does sin 4x=0.3 have', answer: String(sols((x) => S(4 * x) - 0.3, 0, 360).length), slips: [{ value: '2', says: /number for sin x=0.3/ }, { value: '4', says: /number of cycles/ }] },
  { find: 'Solve sin(frac(x,2))=0.4', answer: list1((x) => S(x / 2) - 0.4, 0, 720), slips: [{ value: pairs(asinD(0.4), 180 - asinD(0.4)), says: /values of frac\(x,2\).*Multiply each by 2/ }] },
  // ----- 5. a shifted angle -----
  { find: 'Solve sin(x+30deg)=0.5', answer: listX((x) => S(x + 30) - 0.5, 0, 360), slips: [{ value: '120', says: /left out the two end points/ }] },
  { find: 'Solve cos(x-50deg)=0.6', answer: list1((x) => C(x - 50) - 0.6, 0, 360), slips: [{ value: typedList([r1(-acosD(0.6) + 50), r1(acosD(0.6) + 50), r1(360 - acosD(0.6) + 50)]), says: /-3.1 is outside the interval/ }, { value: pairs(acosD(0.6), 360 - acosD(0.6)), says: /values of the bracket x-50deg.*Add 50/ }] },
  { find: 'Solve tan(x+20deg)=2', answer: list1((x) => T(x + 20) - 2, 0, 360), slips: [{ value: pairs(atanD(2), atanD(2) + 180), says: /values of the bracket x\+20deg.*Subtract 20/ }] },
  { find: 'Solve cos(2x+30deg)=0.5', answer: listX((x) => C(2 * x + 30) - 0.5, 0, 180), slips: [{ value: '30 or 270', says: /values of 2x.*divide each by 2/ }] },
  // ----- 6. sine and cosine in one equation -----
  { find: 'Solve 4 sin x=3 cos x', answer: list1((x) => 4 * S(x) - 3 * C(x), 0, 360), slips: [{ value: pairs(atanD(4 / 3), atanD(4 / 3) + 180), says: /turned the fraction upside down.*tan x=frac\(3,4\)/ }, { value: '36.9', says: /one solution.*180/ }] },
  { find: 'Solve 2 sin x cos x=sin x', answer: listX((x) => 2 * S(x) * C(x) - S(x), 0, 360), slips: [{ value: '60 or 300', says: /divided both sides by sin x.*loses the solutions where sin x=0/ }] },
  { find: 'Solve 5 sin x=-2 cos x', answer: list1((x) => 5 * S(x) + 2 * C(x), 0, 360), slips: [{ value: pairs(atanD(-0.4), atanD(-0.4) + 180), says: /-21.8 is outside the interval/ }] },
  { find: 'solutions does tan x=2 sin x have', answer: String(sols((x) => T(x) - 2 * S(x), 0, 360).length), slips: [{ value: '2', says: /cancelled sin x.*loses the three solutions/ }] },
  // ----- 7. quadratics in sin, cos and tan -----
  { find: 'Solve 2 sin^2 x-3 sin x+1=0', answer: listX((x) => 2 * S(x) ** 2 - 3 * S(x) + 1, 0, 360), slips: [{ value: '30 or 150', says: /only.*sin x=1.*x=90/ }, { value: '0.5 or 1', says: /values of sin x.*asks for the angles/ }] },
  { find: 'Solve tan^2 x-2 tan x-3=0', answer: list1((x) => T(x) ** 2 - 2 * T(x) - 3, 0, 360), slips: [{ value: pairs(atanD(3), atanD(3) + 180), says: /only tan x=3.*tan x=-1/ }] },
  { find: 'Solve 4 cos^2 x=1', answer: listX((x) => 4 * C(x) ** 2 - 1, 0, 360), slips: [{ value: '60 or 300', says: /only the positive square root.*cos x=-frac\(1,2\)/ }] },
  { find: 'Solve 2 sin^2 x+3 cos x=3', answer: listX((x) => 2 * S(x) ** 2 + 3 * C(x) - 3, 0, 360), slips: [{ value: '60 or 300', says: /cos x=frac\(1,2\) only.*cos x=1/ }] },
  { find: 'Solve 2 sin^2 x+5 sin x-3=0', answer: listX((x) => 2 * S(x) ** 2 + 5 * S(x) - 3, 0, 360), slips: [{ value: '0.5 or -3', says: /values of sin x.*sin x=-3 is not possible/ }] },
  // ----- flip it -----
  { find: 'solutions of cos x=k for 0deg<=x<=360deg are x=60deg', answer: String(clean(C(60))), slips: [{ value: String(t3(S(60))), says: /That is sin\(60deg\)/ }] },
  { find: 'solutions of tan x=k for 0deg<=x<=360deg are x=135deg', answer: String(clean(T(135))), slips: [{ value: '1', says: /size but not the sign.*quadrant 2/ }] },
  { find: 'x=20deg is a solution of sin 3x=k', answer: String(t3(S(60))), slips: [{ value: String(t3(S(20))), says: /That is sin\(20deg\).*3\*20/ }] },
  { find: 'obtuse and sin theta=0.6. Find theta', answer: String(r1(180 - asinD(0.6))), slips: [{ value: String(r1(asinD(0.6))), says: /calculator value, which is acute/ }] },
  // ----- mixed review -----
  { find: 'sin theta=-0.6 and cos theta=0.8', answer: String(clean(-0.6 / 0.8)), slips: [{ value: '0.75', says: /size but not the sign/ }] },
  { find: 'Solve 2 sin x=3 cos x', answer: list1((x) => 2 * S(x) - 3 * C(x), 0, 360), slips: [{ value: pairs(atanD(2 / 3), atanD(2 / 3) + 180), says: /turned the fraction upside down.*tan x=frac\(3,2\)/ }] },
  { find: 'Solve 2 sin^2 x=sin x', answer: listX((x) => 2 * S(x) ** 2 - S(x), 0, 360), slips: [{ value: '30 or 150', says: /divided both sides by sin x.*loses the solutions where sin x=0/ }] },
  { find: 'Solve cos 3x=-0.5', answer: listX((x) => C(3 * x) + 0.5, 0, 120), slips: [{ value: '120 or 240', says: /values of 3x.*divide each by 3/ }] },
  // ----- exam style -----
  { find: 'Find the exact value of cos theta', answer: '-12/13', slips: [{ value: String(12 / 13), says: /size but not the sign.*cosine is negative/ }] },
  { find: 'Using your answer to part (a)', answer: '-5/12', slips: [{ value: String(-12 / 5), says: /upside down.*sine goes on the top/ }] },
  { find: 'Solve 6 cos^2 x+sin x-5=0', answer: list1((x) => 6 * C(x) ** 2 + S(x) - 5, 0, 360), slips: [{ value: '30 or 150', says: /only.*sin x=-frac\(1,3\)/ }] },
  { find: 'Solve cos(2x-40deg)=0.5', answer: listX((x) => C(2 * x - 40) - 0.5, 0, 180), slips: [{ value: '-10 or 50 or 170', says: /-10 is outside the interval/ }] },
  { find: 'Solve tan x=3 sin x', answer: list1((x) => T(x) - 3 * S(x), 0, 360), slips: [{ value: pairs(acosD(1 / 3), 360 - acosD(1 / 3)), says: /cancelled sin x.*loses the solutions/ }] },
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
    if (!matches(c.answer, q.answers, q.mode)) problems.push(`${c.find}: the key does not accept the recomputed answer "${c.answer}" (keys: ${q.answers.join(' | ')})`);
    for (const k of q.answers) if (!sameValue(k, c.answer)) problems.push(`${c.find}: key "${k}" is not the recomputed answer "${c.answer}"`);
    for (const s of c.slips ?? []) {
      const li = q.wrongs.find((w) => matches(s.value, w.values, q.mode));
      if (!li) { problems.push(`${c.find}: no wrong-answer entry accepts the slip value "${s.value}" (entries: ${q.wrongs.map((w) => w.values.join(' | ')).join(' / ')})`); continue; }
      li.claimed = true;
      if (!s.says.test(plain(li.text))) problems.push(`${c.find}: the message for "${s.value}" does not name the slip ${s.says}: ${plain(li.text).slice(0, 110)}`);
      if (matches(s.value, q.answers, q.mode)) problems.push(`${c.find}: the slip value "${s.value}" is also a right answer`);
      for (const v of li.values) if (!sameValue(v, s.value, 0.01)) problems.push(`${c.find}: "${v}" is listed with the slip but is not the slip value "${s.value}"`);
    }
    for (const w of q.wrongs) if (!w.claimed) problems.push(`${c.find}: wrong-answer entry "${w.values.join(' | ')}" has no recomputed slip`);
  }
  const typed = qs.filter((q) => q.answers.length > 0);
  for (const q of typed) if (!checked.has(q)) problems.push(`no recomputed key for: ${q.plain.slice(0, 70)}`);
  expect(CHECKS.length).toBe(typed.length);
  expect(qs.length).toBeGreaterThanOrEqual(55);
  expect(problems).toEqual([]);
});

test('no hint gives the answer, and a "Type it like" example is never the key', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const problems: string[] = [];
  for (const q of questions()) {
    if (q.answers.length === 0) continue;
    // a hint that names a key number as a whole word gives the answer away (small whole numbers are too common in the working to test)
    const keyNumbers = new Set(q.answers.flatMap((a) => numbersIn(a)).filter((v) => !Number.isInteger(v) || Math.abs(v) >= 10).map((v) => String(v)));
    for (const h of q.hints) {
      for (const n of keyNumbers) if (new RegExp(`(^|[^\\d.])${n.replace('.', '\\.').replace('-', '-?')}($|[^\\d.])`).test(h)) problems.push(`a hint of "${q.plain.slice(0, 50)}" names the key value ${n}: ${h}`);
    }
    const m = /(?:Type|type) (?:it|them|your answers?|only) like (.*?)\.?$/.exec(q.plain);
    if (m && matches(m[1], q.answers, q.mode)) problems.push(`"${m[1]}" is the key of: ${q.plain.slice(0, 60)}`);
  }
  expect(problems).toEqual([]);
});

// ---------- multiple-choice keys, decided from the maths ----------
const options = (find: string) => {
  const q = questions().find((x) => x.plain.includes(find));
  expect(q, find).toBeTruthy();
  return [...(q as Question).block.matchAll(/<li( data-correct| data-why="([^"]*)")?>([\s\S]*?)<\/li>/g)].filter((m) => m[1]).map((m) => ({ correct: m[1] === ' data-correct', why: decode(m[2] ?? ''), text: plain(m[3]) }));
};
const correctText = (find: string) => options(find).find((o) => o.correct)?.text;
const ANGLES = [-200, -75, -10, 20, 33, 47, 60, 123, 200, 301, 410];

test('multiple-choice keys: each correct option is the one the maths gives, and each reason quotes right numbers', () => {
  // which statement is an identity: true for every angle tried
  const statements: Record<string, Fn> = {
    'sin x = 0.5': (x) => S(x) - 0.5,
    'sin^2x + cos^2x = 1': (x) => S(x) ** 2 + C(x) ** 2 - 1,
    'sin x = cos x': (x) => S(x) - C(x),
  };
  const identities = Object.entries(statements).filter(([, f]) => ANGLES.every((a) => Math.abs(f(a)) < 1e-9)).map(([k]) => k);
  expect(identities).toEqual(['sin^2x + cos^2x = 1']);
  expect(correctText('Which of these is an identity')).toBe(identities[0]);
  // tan 90: sin 90 = 1, cos 90 = 0
  expect(S(90)).toBeCloseTo(1, 12);
  expect(Math.abs(C(90))).toBeLessThan(1e-12);
  expect(correctText('Why does tan(90deg) have no value')).toBe('cos 90\u00b0 = 0, so sin 90\u00b0 / cos 90\u00b0 would mean dividing by 0');
  // sin theta = 0.6: cos^2 = 0.64, two values
  const cosValues = [...new Set([Math.sqrt(1 - 0.36), -Math.sqrt(1 - 0.36)].map((v) => String(clean(v))))];
  expect(cosValues).toEqual(['0.8', '-0.8']);
  expect(correctText('How many values can cos theta have')).toBe('Two values, 0.8 and -0.8');
  // sin^-1(-0.5) = -30: the solutions in 0..360 are 210 and 330
  expect(asinD(-0.5)).toBeCloseTo(-30, 9);
  expect(solsExact((x) => S(x) + 0.5, 0, 360)).toEqual([210, 330]);
  expect(correctText('A calculator gives sin^(-1)(-0.5)=-30deg')).toBe(`210${DEG} and 330${DEG}`);
  // the interval for 2x and for x + 40 (the ends are multiplied, or added to)
  expect([0, 360].map((v) => 2 * v)).toEqual([0, 720]);
  expect(correctText('which interval do you use for 2x')).toBe(`0${DEG} <= 2x <= 720${DEG}`);
  expect([0, 360].map((v) => v + 40)).toEqual([40, 400]);
  expect(correctText('which interval do you use for x+40deg')).toBe(`40${DEG} <= x + 40${DEG} <= 400${DEG}`);
  // Ravi: the angles lost by dividing 3 sin x cos x = sin x by sin x are exactly those with sin x = 0 (and the cos x = 0 angles are not solutions)
  const eq = (x: number) => 3 * S(x) * C(x) - S(x);
  const all = solsExact(eq, 0, 360);
  const after = solsExact((x) => 3 * C(x) - 1, 0, 360);
  expect(all.filter((x) => !after.includes(x))).toEqual([0, 180, 360]);
  expect([90, 270].map((x) => Math.abs(eq(x)) > 0.5)).toEqual([true, true]);
  expect(correctText('Ravi solves')).toBe('The solutions where sin x = 0');
  expect(options('Ravi solves')[1].why).toContain('At 90 and 270 degrees the left side is 0 but sin x is 1 or -1');
  // the substitution: sin^2 x = 1 - cos^2 x is true, the other two are false
  expect(ANGLES.every((a) => close(S(a) ** 2, 1 - C(a) ** 2, 1e-9))).toBe(true);
  expect(ANGLES.every((a) => close(S(a) ** 2, 1 - C(a), 1e-9))).toBe(false);
  expect(ANGLES.every((a) => close(S(a) ** 2, C(a) ** 2 - 1, 1e-9))).toBe(false);
  expect(Math.abs(S(90) ** 2 - (C(90) ** 2 - 1))).toBeGreaterThan(1.9);
  expect(correctText('Which substitution turns')).toBe('sin^2x = 1 - cos^2x');
  // Ana: sin x + cos x = 1 is false (at 30 degrees it is 1.366); the identity itself is true
  expect(S(30) + C(30)).toBeCloseTo(1.366, 3);
  expect(correctText('Ana says')).toBe('The square root of a sum is not the sum of the square roots');
  // Ben: the solutions of sin x cos x = cos x are 90 and 270; dividing by cos x gives only 90
  expect(solsExact((x) => S(x) * C(x) - C(x), 0, 360)).toEqual([90, 270]);
  expect(solsExact((x) => S(x) - 1, 0, 360)).toEqual([90]);
  expect(correctText('Ben says')).toContain('270');
  expect(Math.abs(S(180) * C(180) - C(180))).toBeGreaterThan(0.5); // 180 is not a solution
  expect(Math.abs(S(0) * C(0) - C(0))).toBeGreaterThan(0.5); // 0 is not a solution
  // Cam: the solutions of sin 2x = 0.5 are 15, 75, 195, 255, so 195 and 255 are missing
  expect(solsExact((x) => S(2 * x) - 0.5, 0, 360)).toEqual([15, 75, 195, 255]);
  expect(correctText('Cam says')).toContain('195');
  expect(correctText('Cam says')).toContain('255');
  expect(S(300)).toBeCloseTo(-0.866, 3); // x = 150 is not a solution
  // Dee: cos^2 x = 0.25 has the four solutions 60, 120, 240, 300; the negative root gives 120 and 240
  expect(solsExact((x) => C(x) ** 2 - 0.25, 0, 360)).toEqual([60, 120, 240, 300]);
  expect(solsExact((x) => C(x) + 0.5, 0, 360)).toEqual([120, 240]);
  expect(correctText('Dee says')).toContain('120');
  expect(correctText('Dee says')).toContain('240');
  // tan x cos x = sin x is true wherever cos x is not 0; tan x sin x = cos x and sin x / tan x = 1 are not
  const angles = ANGLES.filter((a) => Math.abs(C(a)) > 1e-9);
  expect(angles.every((a) => close(T(a) * C(a), S(a)))).toBe(true);
  expect(angles.every((a) => close(T(a) * S(a), C(a)))).toBe(false);
  expect(angles.every((a) => close(S(a) / T(a), 1))).toBe(false);
  expect(T(60) * S(60)).toBeCloseTo(1.5, 9);
  expect(S(60) / T(60)).toBeCloseTo(0.5, 9);
  expect(correctText('Which statement is true for every angle')).toBe('tan x cos x = sin x');
});

test('the blanks in every "Now you finish it" are recomputed', () => {
  const alpha = r1(asinD(0.4));
  const lows = sols1((x) => S(x) - 0.4, -360, 0);
  const expected = [
    // 1. cos^2(30) = 3/4 and 1/4 + 3/4 = 1
    '0.75;3/4', '1',
    // 2. sin^2 = 1 - 0.36 and sin = -0.8 in quadrant 4
    String(clean(1 - 0.6 ** 2)), String(-clean(Math.sqrt(1 - 0.6 ** 2))),
    // 3. sin x = 0.4 for -360 <= x <= 0
    String(r1(180 - alpha)), String(r1(alpha - 360)), String(r1(180 - alpha - 360)),
    // 4. cos 2x = 0.5 for 0 <= x <= 180: the interval for 2x ends at 360, and x = 30 or 150
    String(2 * 180), ...solsExact((x) => C(2 * x) - 0.5, 0, 180).map(String),
    // 5. sin(x + 40) = 0.5 for 0 <= x <= 360: the bracket ends at 400, 30 + 360 = 390, and x = 110 or 350
    String(360 + 40), String(30 + 360), String(solsExact((x) => S(x + 40) - 0.5, 0, 360)[1]),
    // 6. sin x = 3 cos x: tan x = 3, then 71.6 + 180
    '3', String(r1(atanD(3) + 180)),
    // 7. 2 cos^2 x + cos x - 1 = 0: 300 and 180
    ...[solsExact((x) => 2 * C(x) ** 2 + C(x) - 1, 0, 360)[2], solsExact((x) => 2 * C(x) ** 2 + C(x) - 1, 0, 360)[1]].map(String),
  ];
  expect(lows).toEqual([-336.4, -203.6]);
  expect(S(30) ** 2 + C(30) ** 2).toBeCloseTo(1, 12);
  expect(C(30) ** 2).toBeCloseTo(0.75, 12);
  expect(solsExact((x) => S(x + 40) - 0.5, 0, 360)).toEqual([110, 350]);
  const blanks = [...SOURCE.matchAll(/class="blank" data-answers="([^"]*)"/g)].map((m) => m[1]);
  expect(blanks).toEqual(expected);
});

// ---------- the rules the lessons state, checked against a brute-force search ----------
type Kind = 'sin' | 'cos' | 'tan';
const FN: Record<Kind, Fn> = { sin: S, cos: C, tan: T };
const CALC: Record<Kind, (k: number) => number> = { sin: asinD, cos: acosD, tan: atanD };
/** The lesson's rule: the calculator value, its partner, then every multiple of 360 (180 for tan), kept if inside [lo, hi]. */
function byRule(kind: Kind, k: number, lo: number, hi: number): number[] {
  if ((kind === 'sin' || kind === 'cos') && Math.abs(k) > 1) return [];
  const alpha = CALC[kind](k);
  const bases = kind === 'sin' ? [alpha, 180 - alpha] : kind === 'cos' ? [alpha, -alpha] : [alpha];
  const period = kind === 'tan' ? 180 : 360;
  const out: number[] = [];
  for (const b of bases) for (let n = -20; n <= 20; n += 1) { const v = b + n * period; if (v >= lo - 1e-9 && v <= hi + 1e-9) out.push(v); }
  return [...new Set(out.map((v) => Math.round(v * 1e6) / 1e6))].sort((a, b) => a - b);
}

test('lesson 3: the calculator value, its partner and the periods give every solution, and no extra one', () => {
  const intervals: [number, number][] = [[0, 360], [-360, 360], [-180, 180], [0, 720], [-360, 0], [0, 540], [90, 450]];
  for (const kind of ['sin', 'cos', 'tan'] as Kind[]) {
    for (const k of [0.5, -0.5, 0.3, -0.7, 0.9, 1, -1, 0, 2, 5, -3, 1.5]) {
      for (const [lo, hi] of intervals) {
        const brute = sols((x) => FN[kind](x) - k, lo, hi).map((v) => Math.round(v * 1e3) / 1e3);
        const rule = byRule(kind, k, lo, hi).map((v) => Math.round(v * 1e3) / 1e3);
        expect(rule, `${kind} x = ${k} on [${lo}, ${hi}]`).toEqual(brute);
      }
    }
  }
  // k outside the range of sine and cosine: no solutions
  expect(sols((x) => S(x) - 1.5, 0, 360)).toEqual([]);
  expect(sols((x) => C(x) - 2, 0, 360)).toEqual([]);
  // the three symmetry facts the lesson uses
  for (const a of [10, 33, 71, 120, 250]) {
    expect(S(180 - a)).toBeCloseTo(S(a), 12);
    expect(C(-a)).toBeCloseTo(C(a), 12);
    expect(C(360 - a)).toBeCloseTo(C(a), 12);
    expect(T(a + 180)).toBeCloseTo(T(a), 9);
  }
  // the principal-value ranges the lesson states
  for (const k of [-1, -0.5, 0, 0.5, 1]) { expect(asinD(k)).toBeGreaterThanOrEqual(-90); expect(asinD(k)).toBeLessThanOrEqual(90); expect(acosD(k)).toBeGreaterThanOrEqual(0); expect(acosD(k)).toBeLessThanOrEqual(180); }
  expect(Math.abs(atanD(1e9))).toBeLessThan(90);
});

test('lessons 4 and 5: solving for kx, or for x + c, in the stretched or shifted interval gives every solution', () => {
  for (const kind of ['sin', 'cos', 'tan'] as Kind[]) {
    for (const k of [0.5, -0.5, 0.3, 0.8, 2, -3]) {
      for (const mult of [2, 3, 4, 0.5]) {
        for (const shift of [0, 20, -30, 40, -50]) {
          for (const [lo, hi] of [[0, 360], [0, 180], [0, 720], [-180, 180]] as [number, number][]) {
            const brute = sols((x) => FN[kind](mult * x + shift) - k, lo, hi).map((v) => Math.round(v * 1e3) / 1e3);
            // the rule: the interval for mult*x + shift is [mult*lo + shift, mult*hi + shift] (mult > 0); solve there, then undo the steps
            const inner = byRule(kind, k, mult * lo + shift, mult * hi + shift).map((v) => Math.round(((v - shift) / mult) * 1e3) / 1e3);
            expect(inner, `${kind}(${mult}x + ${shift}) = ${k} on [${lo}, ${hi}]`).toEqual(brute);
          }
        }
      }
    }
  }
  // the page's own figures: sin 2x = 0.5 has four solutions, cos(x + 20) = 0.5 has two
  expect(solsExact((x) => S(2 * x) - 0.5, 0, 360)).toEqual([15, 75, 195, 255]);
  expect(solsExact((x) => C(x + 20) - 0.5, 0, 360)).toEqual([40, 280]);
});

test('lesson 6: sin x = cos x, and a sin x = b cos x, give tan x = b / a, and dividing by sin x or cos x elsewhere loses solutions', () => {
  expect(solsExact((x) => S(x) - C(x), 0, 360)).toEqual([45, 225]);
  expect(solsExact((x) => T(x) - 1, 0, 360)).toEqual([45, 225]);
  for (const [a, b] of [[3, 2], [1, 3], [4, 3], [2, -5], [-1, 4], [5, -2]]) {
    const direct = sols((x) => a * S(x) - b * C(x), 0, 360).map((v) => Math.round(v * 1e3) / 1e3);
    const viaTan = byRule('tan', b / a, 0, 360).map((v) => Math.round(v * 1e3) / 1e3);
    expect(viaTan, `${a} sin x = ${b} cos x`).toEqual(direct);
    // cos x is never 0 at a solution of a sin x = b cos x (a not 0)
    for (const v of direct) expect(Math.abs(C(v))).toBeGreaterThan(1e-3);
  }
  // cos x and sin x are never both 0
  for (let x = 0; x <= 360; x += 0.5) expect(S(x) ** 2 + C(x) ** 2).toBeCloseTo(1, 12);
  // 2 sin x cos x = cos x: dividing by cos x loses 90 and 270
  expect(solsExact((x) => 2 * S(x) * C(x) - C(x), 0, 360)).toEqual([30, 90, 150, 270]);
  expect(solsExact((x) => 2 * S(x) - 1, 0, 360)).toEqual([30, 150]);
  // tan x = 2 sin x: the five solutions, and 90 and 270 are not among them
  expect(solsExact((x) => T(x) - 2 * S(x), 0, 360)).toEqual([0, 60, 180, 300, 360]);
  // 2 sin x cos x = sin x: dividing by sin x loses 0, 180 and 360
  expect(solsExact((x) => 2 * S(x) * C(x) - S(x), 0, 360)).toEqual([0, 60, 180, 300, 360]);
  expect(solsExact((x) => 2 * C(x) - 1, 0, 360)).toEqual([60, 300]);
});

test('lesson 7: each worked quadratic has exactly the solutions the page states', () => {
  expect(solsExact((x) => 2 * S(x) ** 2 + S(x) - 1, 0, 360)).toEqual([30, 150, 270]);
  expect(solsExact((x) => S(x) ** 2 - S(x) - 2, 0, 360)).toEqual([270]);
  expect(solsExact((x) => 2 * C(x) ** 2 + S(x) - 1, 0, 360)).toEqual([90, 210, 330]);
  // 2cos^2 x + sin x - 1 = 0 becomes 2 sin^2 x - sin x - 1 = 0 with cos^2 = 1 - sin^2: the same function
  for (const a of ANGLES) expect(2 * C(a) ** 2 + S(a) - 1).toBeCloseTo(-(2 * S(a) ** 2 - S(a) - 1), 12);
  expect(sols1((x) => 6 * C(x) ** 2 - C(x) - 1, 0, 360)).toEqual([60, 109.5, 250.5, 300]);
  expect(solsExact((x) => 2 * C(x) ** 2 + C(x) - 1, 0, 360)).toEqual([60, 180, 300]);
  // the factorisations on the page expand to the equations on the page (checked at several values of the unknown)
  for (const s of [-2.5, -1, 0, 0.3, 1.7, 3]) {
    expect((2 * s - 1) * (s + 1)).toBeCloseTo(2 * s * s + s - 1, 12);
    expect((s - 2) * (s + 1)).toBeCloseTo(s * s - s - 2, 12);
    expect((2 * s + 1) * (s - 1)).toBeCloseTo(2 * s * s - s - 1, 12);
    expect((3 * s + 1) * (2 * s - 1)).toBeCloseTo(6 * s * s - s - 1, 12);
    expect((2 * s - 1) * (s + 3)).toBeCloseTo(2 * s * s + 5 * s - 3, 12);
    expect((2 * s - 1) * (s - 1)).toBeCloseTo(2 * s * s - 3 * s + 1, 12);
    expect((s - 3) * (s + 1)).toBeCloseTo(s * s - 2 * s - 3, 12);
    expect((2 * s + 1) * (s - 1)).toBeCloseTo(2 * s * s - s - 1, 12);
  }
  // 6 cos^2 x + sin x - 5 = 0 becomes 6 sin^2 x - sin x - 1 = 0 (times -1)
  for (const a of ANGLES) expect(6 * C(a) ** 2 + S(a) - 5).toBeCloseTo(-(6 * S(a) ** 2 - S(a) - 1), 12);
  // 2 sin^2 x + 3 cos x - 3 = 0 becomes 2 cos^2 x - 3 cos x + 1 = 0 (times -1)
  for (const a of ANGLES) expect(2 * S(a) ** 2 + 3 * C(a) - 3).toBeCloseTo(-(2 * C(a) ** 2 - 3 * C(a) + 1), 12);
  // the glossary example and the exact fractions used in lesson 2
  expect(Math.sqrt(1 - 9 / 25)).toBeCloseTo(4 / 5, 12);
  expect(Math.sqrt(1 - 25 / 169)).toBeCloseTo(12 / 13, 12);
  expect(1 - 0.0784).toBeCloseTo(0.9216, 12);
  expect(Math.sqrt(0.9216)).toBeCloseTo(0.96, 12);
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
  expect(checked).toBeGreaterThan(40);
  expect(problems).toEqual([]);
});

test('every calculator value, exact value and rounded value the page quotes is right', () => {
  // [how it is written on the page, the true value, the value the page quotes, the decimal places it is quoted to]
  const quotes: [string, number, number, number][] = [
    ['sin(50deg)', S(50), 0.766, 3], ['cos(50deg)', C(50), 0.643, 3], ['tan(50deg)', T(50), 1.192, 3], ['sin(20deg)', S(20), 0.342, 3], ['cos(20deg)', C(20), 0.94, 3],
    ['sin(135deg)', S(135), 0.707, 3], ['cos(135deg)', C(135), -0.707, 3], ['sin^(-1)(0.9)', asinD(0.9), 64.2, 1], ['cos^(-1)(-0.7)', acosD(-0.7), 134.4, 1],
    ['tan^(-1)(-3)', atanD(-3), -71.6, 1], ['tan^(-1)(5)', atanD(5), 78.7, 1], ['cos^(-1)(0.4)', acosD(0.4), 66.4, 1], ['tan^(-1)(3)', atanD(3), 71.6, 1],
    ['sin^(-1)(0.4)', asinD(0.4), 23.6, 1], ['cos^(-1)(0.6)', acosD(0.6), 53.1, 1], ['tan^(-1)(2)', atanD(2), 63.4, 1], ['tan^(-1)(0.75)', atanD(0.75), 36.9, 1],
    ['tan^(-1)(-0.4)', atanD(-0.4), -21.8, 1], ['tan^(-1)(1.5)', atanD(1.5), 56.3, 1], ['tan^(-1)(2/3)', atanD(2 / 3), 33.7, 1], ['cos^(-1)(-1/3)', acosD(-1 / 3), 109.5, 1],
    ['sin^(-1)(-1/3)', asinD(-1 / 3), -19.5, 1], ['cos^(-1)(1/3)', acosD(1 / 3), 70.5, 1], ['sin^(-1)(0.6)', asinD(0.6), 36.9, 1], ['sin^(-1)(-0.6)', asinD(-0.6), -36.9, 1],
    ['cos^(-1)(0.3)', acosD(0.3), 72.5, 1], ['sin^(-1)(0.5)', asinD(0.5), 30, 1],
  ];
  for (const [name] of quotes) expect(SOURCE.includes(name.replace('(-1/3)', '(-frac(1,3))').replace('(1/3)', '(frac(1,3))').replace('(2/3)', '(frac(2,3))')) || SOURCE.includes(name), name).toBe(true);
  for (const [name, v, quoted, places] of quotes) expect(Math.abs(v - quoted), name).toBeLessThanOrEqual(0.5 * 10 ** -places + 1e-9);
  // the unit circle figures: P at 50 degrees, and the obtuse angle with sin = 0.6
  expect(180 - asinD(0.6)).toBeCloseTo(143.13, 2);
  expect(C(180 - asinD(0.6))).toBeCloseTo(-0.8, 12);
  expect(r1(180 - asinD(0.6))).toBe(143.1);
  expect(t3(T(70))).toBe(2.747);
  expect(t3(C(50))).toBe(0.643);
});

// ---------- the pictures ----------
type Geom = { width: number; height: number; left: number; right: number; top: number; bottom: number; xmin: number; xmax: number; ymin: number; ymax: number };
type Fx = (x: number) => number;
type Pt = [number, number];
/** What each picture is meant to show, written here from the page's own numbers (not read from the figure code). */
type Stated = {
  curves: { cls: string; f: Fx; from: number; to: number }[];
  points: Record<string, Pt>;
  on: Record<string, number[]>;
  hlines?: Record<string, number>;
  segs?: Record<string, { a: Pt; b: Pt; text: string }>;
  unit?: string; // the unit written after the x-coordinate of a point
  short?: boolean; // the label of a point is just its x-coordinate (the guide line gives the height)
  circle?: boolean;
  tan?: boolean;
};
const half = (s: number): Fx => (x) => s * Math.sqrt(Math.max(0, 1 - x * x));
const P50: Pt = [C(50), S(50)];
const TH = THETA;
const STATED: Record<string, Stated> = {
  'trig-identities-unit-circle': {
    curves: [{ cls: 'curve', f: half(1), from: -1, to: 1 }, { cls: 'curve', f: half(-1), from: -1, to: 1 }],
    points: { p: P50, f: [P50[0], 0] }, on: { p: [0], f: [] }, circle: true,
    segs: { op: { a: [0, 0], b: P50, text: '1' }, pf: { a: [P50[0], 0], b: P50, text: `sin ${TH}` }, of: { a: [0, 0], b: [P50[0], 0], text: `cos ${TH}` } },
  },
  'trig-identities-circle-obtuse': {
    curves: [{ cls: 'curve', f: half(1), from: -1, to: 1 }, { cls: 'curve', f: half(-1), from: -1, to: 1 }],
    points: { p: [-0.8, 0.6], f: [-0.8, 0] }, on: { p: [0], f: [] }, circle: true,
    segs: { op: { a: [0, 0], b: [-0.8, 0.6], text: '1' }, pf: { a: [-0.8, 0], b: [-0.8, 0.6], text: `sin ${TH}` }, of: { a: [0, 0], b: [-0.8, 0], text: `cos ${TH}` } },
  },
  'trig-identities-sin-wide': { curves: [{ cls: 'curve', f: S, from: -360, to: 360 }], points: { s1: [-330, 0.5], s2: [-210, 0.5], s3: [30, 0.5], s4: [150, 0.5] }, on: { s1: [0], s2: [0], s3: [0], s4: [0] }, hlines: { k: 0.5 }, unit: DEG, short: true },
  'trig-identities-sin-2x': { curves: [{ cls: 'curve', f: (x) => S(2 * x), from: 0, to: 360 }], points: { s1: [15, 0.5], s2: [75, 0.5], s3: [195, 0.5], s4: [255, 0.5] }, on: { s1: [0], s2: [0], s3: [0], s4: [0] }, hlines: { k: 0.5 }, unit: DEG, short: true },
  'trig-identities-cos-shift': { curves: [{ cls: 'curve', f: (x) => C(x + 20), from: 0, to: 360 }], points: { s1: [40, 0.5], s2: [280, 0.5] }, on: { s1: [0], s2: [0] }, hlines: { k: 0.5 }, unit: DEG, short: true },
  'trig-identities-sin-cos': { curves: [{ cls: 'curve', f: S, from: 0, to: 360 }, { cls: 'curve-b', f: C, from: 0, to: 360 }], points: { c1: [45, S(45)], c2: [225, S(225)] }, on: { c1: [0, 1], c2: [0, 1] }, unit: DEG },
  'trig-identities-quad-sin': { curves: [{ cls: 'curve', f: S, from: 0, to: 360 }], points: { s1: [30, 0.5], s2: [150, 0.5], s3: [270, -1] }, on: { s1: [0], s2: [0], s3: [0] }, hlines: { k1: 0.5, k2: -1 }, unit: DEG, short: true },
  'trig-identities-flip-tan': { curves: [{ cls: 'curve', f: T, from: 0, to: 360 }], points: { s1: [70, T(70)], s2: [250, T(250)] }, on: { s1: [0], s2: [0] }, hlines: { k: 2.747 }, unit: DEG, short: true, tan: true },
  'trig-identities-q-sin-line': { curves: [{ cls: 'curve', f: S, from: 0, to: 360 }], points: {}, on: {}, hlines: { k: 0.9 }, unit: DEG },
  'trig-identities-q-cos-shift': { curves: [{ cls: 'curve', f: (x) => C(x - 50), from: 0, to: 360 }], points: {}, on: {}, hlines: { k: 0.6 }, unit: DEG },
};
const sig = (v: number) => Math.sign(v);

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
  // a line inside the plot (the key rows above the plot use the same classes and are left out)
  const inPlot = (l: { y1: number; y2: number }) => l.y1 >= g.top - 1 && l.y2 >= g.top - 1;
  const asLine = (m: RegExpMatchArray) => ({ x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] });
  const guides = [...svg.matchAll(/<line class="guide" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].map(asLine).filter(inPlot);
  const segLines = [...svg.matchAll(/<line class="line" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].map(asLine).filter(inPlot);
  const circles = [...svg.matchAll(/<circle class="pt" data-name="([^"]*)" cx="([\d.-]+)" cy="([\d.-]+)" r="7"\/>/g)].map((m) => ({ name: m[1], px: +m[2], py: +m[3], x: toX(+m[2]), y: toY(+m[3]) }));
  const labels = [...svg.matchAll(/<text[^>]*data-for="([^"]*)" x="([\d.-]+)" y="([\d.-]+)" text-anchor="(\w+)">([\s\S]*?)<\/text>/g)].map((m) => ({ for: m[1], x: +m[2], y: +m[3], anchor: m[4], text: m[5].replace(/<[^>]+>/g, '').replace(/\u200b/g, '').replace(/\u2212/g, '-') }));
  return { horizontal, vertical, px, py, toX, toY, paths, guides, segLines, circles, labels };
}
const expectedLabel = (st: Stated, name: string): string => {
  const [x] = st.points[name];
  return st.short ? `${x}${st.unit ?? ''}` : `(${t3(x)}${st.unit ?? ''}, ${t3(st.points[name][1])})`;
};
const descPoint = (st: Stated, name: string): string => `(${t3(st.points[name][0])}${st.unit ?? ''}, ${t3(st.points[name][1])})`;

test('every curve is read back from its drawn path and is the function the page says it is', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/trig-identities.mjs');
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
    // a circle picture has the same scale on both axes, so the circle is round
    if (st.circle) expect((m.horizontal.x2 - m.horizontal.x1) / (g.xmax - g.xmin), id).toBeCloseTo((m.vertical.y1 - m.vertical.y2) / (g.ymax - g.ymin), 1);
    expect(m.paths.map((p) => p.cls), `${id}: the curves, in order`).toEqual(st.curves.map((c) => c.cls));
    m.paths.forEach((p, i) => {
      const tol = 0.012 * (g.ymax - g.ymin);
      const c = st.curves[i];
      let n = 0;
      for (const piece of p.pieces) for (const [x, y] of piece) {
        n += 1;
        if (Math.abs(y - c.f(x)) > tol) problems.push(`${id}: curve ${i} is at (${x.toFixed(2)}, ${y.toFixed(2)}) but the function gives ${c.f(x).toFixed(2)}`);
        if (x < c.from - 0.5) problems.push(`${id}: curve ${i} starts before x = ${c.from}`);
        if (x > c.to + 0.5) problems.push(`${id}: curve ${i} runs past x = ${c.to}`);
      }
      if (n < 100) problems.push(`${id}: curve ${i} has only ${n} points`);
      // the curve fills its whole interval (the first and last points are at the ends)
      const xs = p.pieces.flat().map(([x]) => x);
      if (Math.min(...xs) > c.from + 3 || Math.max(...xs) < c.to - 3) problems.push(`${id}: curve ${i} does not reach both ends of [${c.from}, ${c.to}]`);
    });
    // marked points: where the table says, and on the curves the table says
    expect(m.circles.map((c) => c.name).sort(), `${id}: marked points`).toEqual(Object.keys(st.points).sort());
    for (const c of m.circles) {
      points += 1;
      const [wx, wy] = st.points[c.name];
      if (Math.abs(c.px - m.px(wx)) > 0.6 || Math.abs(c.py - m.py(wy)) > 0.6) problems.push(`${id}/${c.name}: drawn at (${c.x.toFixed(2)}, ${c.y.toFixed(2)}) not at (${wx}, ${wy})`);
      for (const k of st.on[c.name]) if (Math.abs(st.curves[k].f(wx) - wy) > 1e-9) problems.push(`${id}/${c.name}: (${wx}, ${wy}) is not on curve ${k}`);
    }
    // a guide line is a dashed line across the whole picture, at the value its label names; it is an equation's right-hand side
    const hs = m.guides.filter((l) => l.y1 === l.y2);
    expect(m.guides.length, `${id}: guide lines`).toBe(Object.keys(st.hlines ?? {}).length);
    expect(hs.length, `${id}: horizontal guide lines`).toBe(Object.keys(st.hlines ?? {}).length);
    for (const y of Object.values(st.hlines ?? {})) {
      const l = hs.find((v) => Math.abs(v.y1 - m.py(y)) < 0.6);
      if (!l) problems.push(`${id}: no horizontal guide line at y = ${y}`); else if (Math.abs(l.x1 - m.px(g.xmin)) > 0.6 || Math.abs(l.x2 - m.px(g.xmax)) > 0.6) problems.push(`${id}: the guide at y = ${y} does not cross the picture`);
    }
    // every point on a guide line really is a solution of (curve = guide height): the point is where the curve meets the line
    for (const [name, k] of Object.entries(st.hlines ?? {})) {
      const onLine = Object.entries(st.points).filter(([, p]) => Math.abs(p[1] - k) < 5e-4).map(([n]) => n);
      const meets = sols((x) => (st.curves[0].f(x) - k), st.curves[0].from, st.curves[0].to);
      const expectX = meets.map((v) => Math.round(v * 1e3) / 1e3);
      const markedX = onLine.map((n) => st.points[n][0]).sort((a, b) => a - b);
      if (st.tan) { if (JSON.stringify(markedX.map((v) => Math.round(v))) !== JSON.stringify(expectX.map((v) => Math.round(v)))) problems.push(`${id}: the marked points on ${name} are ${markedX}, but the curve meets the line at ${expectX}`); }
      else if (onLine.length > 0 && JSON.stringify(markedX) !== JSON.stringify(expectX.filter((v) => markedX.some((w) => Math.abs(w - v) < 1e-2)))) problems.push(`${id}: the marked points on ${name} are ${markedX}`);
      // none is missing: the curve meets the line exactly at the marked points (for a guide that has marked points)
      if (onLine.length > 0 && expectX.length !== onLine.length) problems.push(`${id}: the curve meets y = ${k} ${expectX.length} times (${expectX}) but ${onLine.length} points are marked`);
      void name;
    }
    // segments: a solid line from a to b
    expect(m.segLines.length, `${id}: segments`).toBe(Object.keys(st.segs ?? {}).length);
    for (const s of Object.values(st.segs ?? {})) {
      const l = m.segLines.find((v) => (Math.abs(v.x1 - m.px(s.a[0])) < 0.6 && Math.abs(v.y1 - m.py(s.a[1])) < 0.6 && Math.abs(v.x2 - m.px(s.b[0])) < 0.6 && Math.abs(v.y2 - m.py(s.b[1])) < 0.6));
      if (!l) problems.push(`${id}: no segment from (${s.a}) to (${s.b})`);
    }
    // the unit circle figures: P is on the circle, P is (cos, sin) of its angle, the foot is straight below, and the triangle is right-angled
    if (st.circle) {
      const [cx, cy] = st.points.p;
      if (Math.abs(cx * cx + cy * cy - 1) > 1e-9) problems.push(`${id}: P is not on the unit circle`);
      const ang = Math.atan2(cy, cx) / RAD;
      expect(C(ang), id).toBeCloseTo(cx, 9);
      expect(S(ang), id).toBeCloseTo(cy, 9);
      expect(st.points.f, id).toEqual([cx, 0]);
      expect(Math.abs(cx) ** 2 + Math.abs(cy) ** 2, id).toBeCloseTo(1, 12);
    }
    // the dashed curve of sin-cos crosses the solid one at the marked points, and nowhere else in the interval
    if (id.endsWith('sin-cos')) {
      const meets = sols((x) => S(x) - C(x), 0, 360);
      expect(meets.map((v) => Math.round(v)), id).toEqual([45, 225]);
    }
    // the tan graph has its asymptotes at 90 and 270: the drawn curve is in separate pieces
    if (st.tan) expect(m.paths[0].pieces.length, `${id}: pieces of the tangent`).toBeGreaterThanOrEqual(3);
    // the quad-sin figure: the line y = -1 touches the wave at its lowest point only
    if (id.endsWith('quad-sin')) {
      expect(sols((x) => S(x) + 1, 0, 360).map((v) => Math.round(v)), id).toEqual([270]);
      expect(sols((x) => S(x) - 0.5, 0, 360).map((v) => Math.round(v)), id).toEqual([30, 150]);
    }
    void sig;
  }
  expect(points).toBeGreaterThan(18);
  expect(problems).toEqual([]);
});

test('every label says its own point, and is nearest its own item and 4px clear of every other label', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/trig-identities.mjs');
  const problems: string[] = [];
  let labelled = 0;
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const g = (GEOM as Record<string, Geom>)[id];
    const st = STATED[id];
    const m = measure(svg, g);
    const items: { name: string; point: boolean; at: (px: number, py: number) => number }[] = [
      ...m.circles.map((c) => ({ name: c.name, point: true, at: (qx: number, qy: number) => Math.hypot(qx - c.px, qy - c.py) })),
      ...Object.keys(st.hlines ?? {}).map((name) => ({ name, point: false, at: (_qx: number, qy: number) => Math.abs(qy - m.py(st.hlines![name])) })),
      ...Object.entries(st.segs ?? {}).map(([name, s]) => ({
        name, point: false,
        at: (qx: number, qy: number) => {
          const [ax, ay, bx, by] = [m.px(s.a[0]), m.py(s.a[1]), m.px(s.b[0]), m.py(s.b[1])];
          const t = Math.max(0, Math.min(1, ((qx - ax) * (bx - ax) + (qy - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
          return Math.hypot(qx - (ax + t * (bx - ax)), qy - (ay + t * (by - ay)));
        },
      })),
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
      // a point's label must not look like it belongs to another marked point; any other label must not look like it belongs to anything else
      const rivals = own.point ? items.filter((it) => it !== own && it.point) : items.filter((it) => it !== own);
      for (const other of rivals) if (other.at(cx, cy) < mine) problems.push(`${id}: label "${l.text}" is ${Math.round(other.at(cx, cy))}px from "${other.name}" but ${Math.round(mine)}px from its own "${own.name}"`);
      // what the label says
      if (st.points[l.for]) {
        if (l.text !== expectedLabel(st, l.for)) problems.push(`${id}: the label "${l.text}" is not "${expectedLabel(st, l.for)}" for "${l.for}"`);
      } else if (st.hlines?.[l.for] !== undefined) {
        if (l.text !== `y = ${st.hlines[l.for]}`) problems.push(`${id}: the guide label "${l.text}" is not "y = ${st.hlines[l.for]}"`);
      } else if (st.segs?.[l.for]) {
        if (l.text !== st.segs[l.for].text) problems.push(`${id}: the segment label "${l.text}" is not "${st.segs[l.for].text}"`);
      }
      // a label never sits on a curve or a segment: their drawn points stay out of the label's box
      const box = { name: l.text, x0: cx - width / 2, x1: cx + width / 2, y0: l.y - 26, y1: l.y + 8 };
      boxes.push(box);
      for (const [k, c] of st.curves.entries()) {
        for (let i = 0; i <= 6000; i += 1) {
          const x = g.xmin + ((g.xmax - g.xmin) * i) / 6000;
          if (x < c.from || x > c.to) continue;
          const y = c.f(x);
          if (!Number.isFinite(y) || y < g.ymin || y > g.ymax) continue;
          const qx = m.px(x);
          const qy = m.py(y);
          if (qx > box.x0 - 4 && qx < box.x1 + 4 && qy > box.y0 - 4 && qy < box.y1 + 4) { problems.push(`${id}: label "${l.text}" sits on curve ${k} near x=${x.toFixed(2)}`); break; }
        }
      }
      for (const s of Object.values(st.segs ?? {})) {
        for (let i = 0; i <= 100; i += 1) {
          const qx = m.px(s.a[0] + ((s.b[0] - s.a[0]) * i) / 100);
          const qy = m.py(s.a[1] + ((s.b[1] - s.a[1]) * i) / 100);
          if (qx > box.x0 - 3 && qx < box.x1 + 3 && qy > box.y0 - 3 && qy < box.y1 + 3) { problems.push(`${id}: label "${l.text}" sits on a segment`); break; }
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
    // every marked point, guide line and segment has a label
    for (const name of [...Object.keys(st.points), ...Object.keys(st.hlines ?? {}), ...Object.keys(st.segs ?? {})]) if (!m.labels.some((l) => l.for === name)) problems.push(`${id}: "${name}" has no label`);
  }
  expect(labelled).toBeGreaterThan(30);
  expect(problems).toEqual([]);
});

test('every figure states every marked coordinate and guide line in its text alternative, and a question figure does not give the answer', async () => {
  const { FIGURES, ITEMS } = await import('../src/book/alevel/figures/trig-identities.mjs');
  type Item = { kind: string; x: number; y: number; text?: string };
  const problems: string[] = [];
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const title = /<title id="[^"]*">([^<]*)<\/title>/.exec(svg)?.[1] ?? '';
    const desc = /<desc id="[^"]*">([^<]*)<\/desc>/.exec(svg)?.[1] ?? '';
    const st = STATED[id];
    for (const it of (ITEMS as Record<string, Item[]>)[id]) {
      if (it.kind === 'point' && !desc.includes(descPoint(st, Object.keys(st.points).find((n) => Math.abs(st.points[n][0] - it.x) < 1e-9 && Math.abs(st.points[n][1] - it.y) < 1e-9)!))) problems.push(`${id}: the description does not name the point (${it.x}, ${it.y})`);
      if (it.kind === 'hline' && !desc.includes(`y = ${it.y}`)) problems.push(`${id}: the description does not name y = ${it.y}`);
    }
    if (desc.length < 80) problems.push(`${id}: the description is too short`);
    if (id.includes('-q-')) {
      expect(`${title} ${desc}`, id).not.toMatch(/64|115|103|356|answer|solution/i);
      expect(SOURCE, id).toContain(`{fig:${id}}`);
      expect(Object.keys(st.points), `${id}: a question figure marks no point`).toEqual([]);
    }
  }
  expect(problems).toEqual([]);
  expect(Object.keys(FIGURES).filter((k) => k.includes('-q-')).sort()).toEqual(['trig-identities-q-cos-shift', 'trig-identities-q-sin-line']);
});

test('at 320px every figure label is at least 12px tall', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/trig-identities.html');
  const small = await page.evaluate(() => [...document.querySelectorAll('main svg.graph-svg text')].map((t) => ({ s: t.textContent, h: t.getBoundingClientRect().height })).filter((t) => t.h > 0 && t.h < 12).map((t) => t.s + ' ' + t.h.toFixed(1)));
  expect(small).toEqual([]);
});

test('at 320px every figure label is 4px clear of every other label', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/trig-identities.html');
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
  const { FIGURES } = await import('../src/book/alevel/figures/trig-identities.mjs');
  const used = [...SOURCE.matchAll(/\{fig:([a-z0-9-]+)\}/g)].map((m) => m[1]);
  expect(new Set(used).size).toBe(used.length);
  expect([...used].sort()).toEqual(Object.keys(FIGURES).sort());
});

test('no figure text leaves its picture', async ({ page }) => {
  await page.goto('/courses/a-level/trig-identities.html');
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

// ---------- the page's shape and wording ----------
test('the page keeps to its scope: no radians, no formal proofs, no reciprocal or inverse functions, no double-angle formulae', () => {
  const text = plain(SOURCE.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<p class="where-use">[\s\S]*?<\/p>/, ' ')).replace('Radians are not used on this page.', '').replace('Setting the calculator to radians.', '');
  expect(text).not.toMatch(/radian|\bsec\b|cosec|\bcot\b|double.angle|addition formula|compound angle|prove that|show that|differentiat|derivative/i);
});

test('every numbered lesson section has a Key idea box and a faded "Now you finish it" example, and the page asks for the calculator', () => {
  const lessons = SOURCE.split('<section').filter((sec) => /<h2>\d+\./.test(sec));
  expect(lessons.length).toBe(7);
  for (const sec of lessons) {
    const name = /<h2>([^<]*)<\/h2>/.exec(sec)?.[1];
    expect(sec, `${name}: a Key idea box`).toContain('class="key"');
    expect(sec, `${name}: a faded example`).toContain('class="worked faded"');
  }
  expect(SOURCE.startsWith('<main class="book strand-al-trigonometry" data-book-page="topic" data-topic="trig-identities" data-calc="scientific">')).toBe(true);
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

test('the page states the conditions on each general rule exactly', () => {
  const text = plain(SOURCE);
  expect(text).toContain('It is true for every angle where cos theta is not 0.');
  expect(text).toContain('For sine and cosine, k must be between -1 and 1 (including both). If it is not, there are no solutions.');
  expect(text).toContain('In each, n is any whole number: positive, negative or zero.');
  expect(text).toContain('where k is a positive number, for a<=x<=b');
  expect(text).toContain('to solve an equation in x+c, where c is any number, for a<=x<=b');
  expect(text).toContain('For an equation of the form a sin x=b cos x, where a is not 0, divide both sides by cos x to get tan x=frac(b, a).');
  expect(text).toContain('where s stands for sin x, cos x or tan x, and a is not 0');
  expect(text).toContain('Tangent can be any number.');
  expect(text).toContain('Never divide both sides by sin x or cos x'.replace('Never', 'Otherwise, never'));
  // the identities are never written as an equation to be solved
  expect(text).toContain('You solve an equation. You do not solve an identity');
});
