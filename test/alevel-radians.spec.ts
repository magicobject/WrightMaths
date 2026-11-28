import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Radians, arcs and sectors page that a general test cannot make:
//   - every typed key is RECOMPUTED here from the question's own numbers (by formula, or by scanning for every root),
//     and rounded the way the question says, so a missing solution or a wrong rounding is caught;
//   - every wrong-answer value is recomputed from the slip its message names, and the message is checked for that slip;
//   - every multiple-choice key is decided from the maths, never from the option's wording;
//   - every blank in a "Now you finish it" box is recomputed;
//   - the rules the lessons state (s = r theta, A = 1/2 r^2 theta, the segment and the chord, the pairs of solutions,
//     the small-angle approximations) are checked against a brute-force walk round a circle and a scan for roots;
//   - every drawn curve is read back from the SVG path, every shaded area is measured from its drawn polygon, every marked
//     point is where the page says, and every label is nearest its own item and clear of every curve and every other label;
//   - the ways a student types an answer (5pi/6, 5π/6, (5pi)/6, a list, a unit) are accepted, and a wrong one is not.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'radians.html'), 'utf8');
const PI = Math.PI;
const DEG = String.fromCharCode(0xb0);
const PIC = String.fromCharCode(0x3c0);
const THETA = String.fromCharCode(0x3b8);

const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const t3 = (v: number) => Math.round(v * 1000) / 1000 + 0;
const clean = (v: number) => Math.round(v * 1e9) / 1e9 + 0;
const RAD = PI / 180;
const S = (d: number) => Math.sin(d * RAD);

/** Round to n significant figures, refusing a value too close to a rounding boundary to be safe. */
function sf(v: number, n = 3): number {
  const d = n - 1 - Math.floor(Math.log10(Math.abs(v)));
  const x = v * 10 ** d;
  if (Math.abs(x - Math.floor(x) - 0.5) < 0.02) throw new Error(`${v} is too close to a rounding boundary at ${n} significant figures`);
  return Math.round(x) / 10 ** d + 0;
}
/** Round to n decimal places, with the same guard. */
function dp(v: number, n: number): number {
  const x = v * 10 ** n;
  if (Math.abs(x - Math.floor(x) - 0.5) < 0.02) throw new Error(`${v} is too close to a rounding boundary at ${n} decimal places`);
  return Math.round(x) / 10 ** n + 0;
}

// ---------- reading the page's questions ----------
const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', ldquo: '"', rdquo: '"', rsquo: "'", nbsp: ' ', times: '*', divide: '/', sup2: '^2', hellip: '...', middot: '.', deg: DEG, le: '<=', ge: '>=', pi: PIC, radic: '\u221a', theta: THETA, frac12: '\u00bd' };
const decode = (t: string) => t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n] ?? m);
// a "<" inside {m:...} is maths (a<=x), not a tag: protect it before the tags are removed
const plain = (h: string) => decode(h.replace(/\{m:([^}]*)\}/g, (_, t: string) => t.replace(/</g, '&lt;')).replace(/<[^>]+>/g, '').replace(/\{m:/g, '').replace(/\}/g, '')).replace(/\s+/g, ' ').trim();

/** The number a typed form stands for: 5pi/6, (5pi)/6, (5/6)pi, 4sqrt(3), sqrt(3)/2, -1/2, 0.927 (a list gives several, in order). */
function one(s: string): number {
  let e = s.replace(/\s+/g, '').replace(/(radians|radian|rad)$/, '').replace(/^[a-z]=/, '');
  e = e.replace(/\u221a(\d+)/g, 'sqrt($1)').replace(/\u03c0/g, 'pi').replace(/sqrt(\d+)/g, 'sqrt($1)');
  e = e.replace(/(\d|\))(pi|sqrt)/g, '$1*$2').replace(/\)\(/g, ')*(').replace(/(\d)\(/g, '$1*(');
  e = e.replace(/sqrt/g, 'Math.sqrt').replace(/pi/g, 'Math.PI');
  if (!/^[\d.+\-*/()]*$/.test(e.replace(/Math\.(sqrt|PI)/g, ''))) throw new Error(`cannot read "${s}" as a number (${e})`);
  return new Function(`return (${e});`)() as number;
}
function val(raw: string): number[] {
  return decode(raw).toLowerCase().split(/\s*(?:,|\bor\b|\band\b)\s*/).filter(Boolean).map(one).sort((a, b) => a - b);
}
const sameList = (a: number[], b: number[], tol = 1e-9) => a.length === b.length && a.every((v, i) => close(v, b[i], tol));

type Wrong = { values: string[]; text: string; claimed: boolean };
type Question = { plain: string; mode: string; answers: string[]; wrongs: Wrong[]; hints: string[]; block: string; solution: string };
function questions(): Question[] {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongList = /<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '';
    const wrongs = [...wrongList.matchAll(/<li data-if="([^"]*)">([\s\S]*?)<\/li>/g)].map((m) => ({ values: decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean), text: m[2], claimed: false }));
    const hints = [...(/<ol class="ladder">([\s\S]*?)<\/ol>/.exec(block)?.[1] ?? '').matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => plain(m[1]));
    return { plain: plain(/<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? ''), mode: /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? 'value', answers, wrongs, hints, block, solution: plain(/<div class="solution">([\s\S]*?)<\/div>/.exec(block)?.[1] ?? '') };
  });
}

// ---------- scanning for every root (written here, not taken from the page) ----------
type Fn = (x: number) => number;
function sols(f: Fn, lo: number, hi: number): number[] {
  const out: number[] = [];
  const n = 200000;
  const step = (hi - lo) / n;
  let px = lo;
  let py = f(lo);
  if (Math.abs(py) < 1e-12) out.push(lo);
  for (let i = 1; i <= n; i += 1) {
    const x = lo + i * step;
    const y = f(x);
    if (Math.abs(y) < 1e-12) out.push(x);
    else if (Number.isFinite(y) && Number.isFinite(py) && Math.sign(y) !== Math.sign(py) && Math.abs(py) > 1e-12) {
      let a = px;
      let b = x;
      for (let k = 0; k < 60; k += 1) { const m = (a + b) / 2; if (Math.sign(f(m)) === Math.sign(f(a))) a = m; else b = m; }
      const r = (a + b) / 2;
      if (Math.abs(f(r)) < 1e-6) out.push(r);
    }
    px = x;
    py = y;
  }
  const clusters: number[][] = [];
  for (const v of out.sort((a, b) => a - b)) {
    const last = clusters[clusters.length - 1];
    if (last && v - last[last.length - 1] < 1e-3) last.push(v); else clusters.push([v]);
  }
  return clusters.map((c) => c.reduce((best, v) => (Math.abs(f(v)) < Math.abs(f(best)) ? v : best)));
}

// ---------- the key of every typed question ----------
type Slip = { typed: string; calc: number | number[]; says: RegExp };
type Check = { find: string; answer: number | number[]; slips?: Slip[] };
const list = (x: number | number[]) => (Array.isArray(x) ? [...x] : [x]).sort((a, b) => a - b);
const sqrt3 = Math.sqrt(3);
const acute = Math.asin(0.8);
// the radii of the sector in the exam question (a): perimeter 20 and area 16 give r(10 - r) = 16
const radii = sols((r) => 0.5 * r * (20 - 2 * r) - 16, 0.001, 9.999);
// 2 sin^2 x - 3 sin x + 1 = 0 on 0 to 2pi
const quad = sols((x) => 2 * Math.sin(x) ** 2 - 3 * Math.sin(x) + 1, 0, 2 * PI);
const angleAOB = Math.atan2(4, 3);
const tanT = 12 * Math.tan(PI / 6);
const triangleOAT = 0.5 * 12 * tanT;
const regionR = triangleOAT - 0.5 * 144 * (PI / 6);

const CHECKS: Check[] = [
  // ----- warm-up and recap -----
  { find: 'exact value of sin(60deg)', answer: S(60), slips: [{ typed: '1/2', calc: S(30), says: /That is sin\(30deg\)/ }] },
  { find: 'Solve sin x=0.5 for 0deg', answer: sols((x) => S(x) - 0.5, 0, 360).map((v) => Math.round(v)), slips: [{ typed: '30', calc: 30, says: /one solution/ }] },
  { find: 'Find its circumference in terms of pi', answer: 2 * PI * 5, slips: [{ typed: '25pi', calc: PI * 25, says: /That is the area/ }] },
  { find: 'Find its area in terms of pi', answer: PI * 3 ** 2, slips: [{ typed: '6pi', calc: 2 * PI * 3, says: /used 2\*pi\*r, the circumference/ }, { typed: '3pi', calc: PI * 3, says: /did not square the radius/ }] },
  { find: 'What fraction of a full turn', answer: 60 / 360, slips: [{ typed: '6', calc: 360 / 60, says: /upside down/ }] },
  // ----- 1. measuring an angle with the circle -----
  { find: 'Write 120\u00b0 in radians', answer: 120 * (PI / 180), slips: [{ typed: '3pi/2', calc: (180 / 120) * PI, says: /used frac\(180, 120\)/ }, { typed: '120pi', calc: 120 * PI, says: /did not divide by 180/ }] },
  { find: 'Write frac(5*pi, 6) radians in degrees', answer: ((5 * PI) / 6) * (180 / PI), slips: [{ typed: '2.62', calc: (5 * PI) / 6, says: /still in radians/ }] },
  { find: 'Write 2 radians in degrees', answer: dp(2 * (180 / PI), 1), slips: [{ typed: '0.0349', calc: 2 * (PI / 180), says: /multiplied by frac\(pi, 180\)/ }] },
  // ----- 2. exact values in radians -----
  { find: 'exact value of tan(frac(pi, 3))', answer: Math.tan(PI / 3), slips: [{ typed: '1/sqrt(3)', calc: Math.tan(PI / 6), says: /tan\(frac\(pi, 6\)\)/ }] },
  { find: 'exact value of cos(frac(2*pi, 3))', answer: Math.cos((2 * PI) / 3), slips: [{ typed: '1/2', calc: 0.5, says: /size but not the sign/ }] },
  { find: 'exact value of sin(frac(5*pi, 3))', answer: Math.sin((5 * PI) / 3), slips: [{ typed: 'sqrt(3)/2', calc: sqrt3 / 2, says: /size but not the sign/ }, { typed: '-1/2', calc: -Math.sin(PI / 6), says: /sin\(frac\(pi, 6\)\) with a minus sign/ }] },
  { find: 'Find cos 2, where the angle', answer: sf(Math.cos(2)), slips: [{ typed: '0.999', calc: Math.cos(2 * RAD), says: /You used degrees/ }] },
  // ----- 3. arc length -----
  { find: 'Find the length of the arc of this sector', answer: 8 * 0.9, slips: [{ typed: '3.6', calc: (8 * 0.9) / 2, says: /You halved the answer/ }, { typed: '8.9', calc: 8 + 0.9, says: /added the radius and the angle/ }] },
  { find: 'radius 6 cm and angle frac(2*pi, 3)', answer: 6 * ((2 * PI) / 3), slips: [{ typed: '2pi/3', calc: (2 * PI) / 3, says: /That is the angle/ }] },
  { find: 'An arc of length 15 cm', answer: 15 / 6, slips: [{ typed: '0.4', calc: 6 / 15, says: /divided the radius by the arc length/ }, { typed: '143.2', calc: (15 / 6) * (180 / PI), says: /angle in degrees/ }] },
  { find: 'radius 10 cm and angle 1.2 radians. Find its perimeter', answer: 2 * 10 + 10 * 1.2, slips: [{ typed: '12', calc: 10 * 1.2, says: /arc only/ }, { typed: '22', calc: 10 + 10 * 1.2, says: /added one radius/ }] },
  { find: 'radius 5 cm and angle 80\u00b0', answer: sf(5 * (80 * RAD)), slips: [{ typed: '400', calc: 5 * 80, says: /used 80 as the angle/ }, { typed: '1.4', calc: 80 * RAD, says: /angle in radians/ }] },
  // ----- 4. area of a sector -----
  { find: 'radius 8 cm and angle 0.5 radians. Find its area', answer: 0.5 * 8 ** 2 * 0.5, slips: [{ typed: '32', calc: 8 ** 2 * 0.5, says: /left out the half/ }, { typed: '2', calc: 0.5 * 8 * 0.5, says: /did not square the radius/ }] },
  { find: 'radius 6 cm and angle frac(pi, 3). Find its exact area', answer: 0.5 * 6 ** 2 * (PI / 3), slips: [{ typed: '12pi', calc: 6 ** 2 * (PI / 3), says: /left out the half/ }] },
  { find: 'radius 5 cm has area 20', answer: (2 * 20) / 5 ** 2, slips: [{ typed: '0.8', calc: 20 / 5 ** 2, says: /forgot to multiply by 2/ }, { typed: '8', calc: (2 * 20) / 5, says: /divided by r instead of r\^2/ }] },
  { find: 'angle 1.5 radians has area 48', answer: Math.sqrt((2 * 48) / 1.5), slips: [{ typed: '64', calc: (2 * 48) / 1.5, says: /That is r\^2/ }, { typed: '5.66', calc: Math.sqrt(48 / 1.5), says: /left out the 2/ }] },
  { find: 'radius 9 cm and angle 40\u00b0', answer: sf(0.5 * 9 ** 2 * (40 * RAD)), slips: [{ typed: '1620', calc: 0.5 * 9 ** 2 * 40, says: /used 40 as the angle/ }, { typed: '56.5', calc: 9 ** 2 * (40 * RAD), says: /left out the half/ }] },
  // ----- 5. segments and chords -----
  { find: 'radius 6 cm and angle frac(pi, 2). Find the area of the segment', answer: sf(0.5 * 36 * (PI / 2 - 1)), slips: [{ typed: '28.3', calc: 0.5 * 36 * (PI / 2), says: /area of the sector/ }, { typed: '18', calc: 0.5 * 36 * 1, says: /area of the triangle/ }] },
  { find: 'length of the chord AB', answer: sf(2 * 8 * Math.sin(PI / 4)), slips: [{ typed: '16', calc: 2 * 8 * Math.sin(PI / 2), says: /sin theta instead of sin\(frac\(theta, 2\)\)/ }] },
  { find: 'perimeter of the segment cut off', answer: sf(8 * (PI / 2) + 2 * 8 * Math.sin(PI / 4)), slips: [{ typed: '12.6', calc: 8 * (PI / 2), says: /arc only/ }, { typed: '28.6', calc: 8 * (PI / 2) + 16, says: /added the two radii/ }] },
  { find: 'radius 5 cm and angle 1 radian', answer: sf(0.5 * 25 * (1 - Math.sin(1))), slips: [{ typed: '12.3', calc: 0.5 * 25 * (1 - Math.sin(1 * RAD)), says: /degree mode/ }] },
  // ----- 6. graphs and equations in radians -----
  { find: 'period of y=sin x', answer: 2 * PI, slips: [{ typed: 'pi', calc: PI, says: /period of tan x/ }, { typed: '360', calc: 360, says: /period in degrees/ }] },
  { find: 'next asymptote', answer: sols((x) => Math.cos(x), 2, 5)[0], slips: [{ typed: 'pi', calc: PI, says: /At pi the tangent is 0/ }, { typed: '2pi', calc: 2 * PI, says: /period of sine/ }] },
  { find: 'Solve cos x=frac(1, 2)', answer: sols((x) => Math.cos(x) - 0.5, 0, 2 * PI), slips: [{ typed: 'pi/3', calc: PI / 3, says: /one solution/ }, { typed: 'pi/3 or 2pi/3', calc: [PI / 3, PI - PI / 3], says: /pair for sine/ }] },
  { find: 'Solve sin x=0.8', answer: sols((x) => Math.sin(x) - 0.8, 0, 2 * PI).map((v) => sf(v)), slips: [{ typed: '0.927', calc: acute, says: /one solution/ }, { typed: '0.927 or 5.36', calc: [acute, 2 * PI - acute], says: /pair for cosine/ }, { typed: '53.1 or 126.9', calc: [acute / RAD, 180 - acute / RAD], says: /degree mode/ }] },
  { find: 'Solve tan x=-1', answer: sols((x) => Math.sin(x) + Math.cos(x), 0.1, 2 * PI - 0.1), slips: [{ typed: '-pi/4 or 3pi/4', calc: [-PI / 4, (3 * PI) / 4], says: /not in the interval/ }] },
  { find: 'Solve sin(2x)=frac(1, 2)', answer: sols((x) => Math.sin(2 * x) - 0.5, 0, PI), slips: [{ typed: 'pi/6 or 5pi/6', calc: [PI / 6, (5 * PI) / 6], says: /values of 2x/ }] },
  // ----- 7. small angles -----
  { find: 'estimate cos 0.05', answer: dp(1 - 0.05 ** 2 / 2, 5), slips: [{ typed: '0.9975', calc: 1 - 0.05 ** 2, says: /did not halve/ }, { typed: '0.975', calc: 1 - 0.05 / 2, says: /halved theta/ }] },
  { find: 'estimate sin(6deg)', answer: sf(6 * RAD), slips: [{ typed: '6', calc: 6, says: /used 6 as the angle/ }] },
  { find: 'frac(sin(5*theta), theta)', answer: 5, slips: [{ typed: '1', calc: 1, says: /frac\(sin theta, theta\)/ }] },
  { find: 'frac(tan(2*theta), sin(3*theta))', answer: 2 / 3, slips: [{ typed: '3/2', calc: 3 / 2, says: /upside down/ }] },
  // ----- flip it -----
  { find: 'exactly as long as the radius', answer: dp(1 * (180 / PI), 1), slips: [{ typed: '1', calc: 1, says: /angle in radians/ }] },
  { find: 'An arc of length 4*pi cm', answer: ((4 * PI) / 6) * (180 / PI), slips: [{ typed: '2.09', calc: (4 * PI) / 6, says: /angle in radians/ }] },
  { find: 'Write 1.5 radians in degrees', answer: dp(1.5 * (180 / PI), 1), slips: [{ typed: '0.0262', calc: 1.5 * (PI / 180), says: /multiplied by frac\(pi, 180\)/ }] },
  { find: 'Write 112.5\u00b0 in radians', answer: 112.5 * (PI / 180), slips: [{ typed: '112.5pi', calc: 112.5 * PI, says: /did not divide by 180/ }] },
  // ----- mixed review -----
  { find: 'Write frac(3*pi, 10) radians in degrees', answer: ((3 * PI) / 10) * (180 / PI), slips: [{ typed: '0.942', calc: (3 * PI) / 10, says: /still in radians/ }] },
  { find: 'Solve tan x=sqrt(3)', answer: sols((x) => Math.sin(x) - sqrt3 * Math.cos(x), 0.01, 2 * PI - 0.01), slips: [{ typed: 'pi/3', calc: PI / 3, says: /one solution/ }, { typed: 'pi/3 or 2pi/3', calc: [PI / 3, PI - PI / 3], says: /pair for sine/ }] },
  { find: 'perimeter 18 cm', answer: (18 - 2 * 5) / 5, slips: [{ typed: '3.6', calc: 18 / 5, says: /whole perimeter/ }, { typed: '2.6', calc: (18 - 5) / 5, says: /took away one radius/ }] },
  { find: 'an arc of length 6 cm', answer: 0.5 * 4 * 6, slips: [{ typed: '24', calc: 4 * 6, says: /left out the half/ }] },
  // ----- exam style -----
  { find: 'exact length of the arc AB', answer: 12 * (PI / 6), slips: [{ typed: 'pi/6', calc: PI / 6, says: /That is the angle/ }] },
  { find: 'exact length of AT', answer: tanT, slips: [{ typed: '6', calc: 12 * Math.sin(PI / 6), says: /used sine/ }, { typed: '12sqrt(3)', calc: 12 * Math.tan(PI / 3), says: /used tan\(60deg\)/ }] },
  { find: 'area of the shaded region R', answer: sf(regionR), slips: [{ typed: '37.7', calc: 0.5 * 144 * (PI / 6), says: /area of the sector OAB only/ }, { typed: '41.6', calc: triangleOAT, says: /area of the whole triangle OAT/ }] },
  { find: 'perimeter is 20 cm and its area is 16', answer: radii.map((r) => Math.round(r * 1e6) / 1e6), slips: [{ typed: '8', calc: 8, says: /one of the two roots/ }] },
  { find: 'One of the two values of r', answer: (20 - 2 * 8) / 8, slips: [{ typed: '8', calc: (20 - 2 * 2) / 2, says: /angle for r=2/ }] },
  { find: 'frac(1-cos(2*theta), theta*tan theta)', answer: Math.round(((1 - Math.cos(2e-3)) / (1e-3 * Math.tan(1e-3))) * 1e3) / 1e3, slips: [{ typed: '0.5', calc: 0.5, says: /used theta instead of 2\*theta/ }, { typed: '4', calc: 4, says: /left out the half/ }] },
  { find: 'Solve 2 sin^2 x-3 sin x+1=0', answer: quad.map((v) => sf(v)), slips: [{ typed: '0.524 or 2.62', calc: [PI / 6, (5 * PI) / 6], says: /sin x=frac\(1, 2\) only/ }, { typed: '30 or 90 or 150', calc: [30, 90, 150], says: /degree mode/ }] },
  { find: 'Find the angle AOB', answer: sf(angleAOB), slips: [{ typed: '53.1', calc: angleAOB / RAD, says: /angle in degrees/ }, { typed: '0.644', calc: Math.atan2(3, 4), says: /used frac\(3, 4\)/ }] },
  { find: 'area of the sector OAB', answer: sf(0.5 * 25 * angleAOB), slips: [{ typed: '23.2', calc: 25 * angleAOB, says: /left out the half/ }] },
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
    const want = list(c.answer);
    if (want.some((v) => !Number.isFinite(v))) problems.push(`${c.find}: the recomputed answer is not a number`);
    if (q.answers.length === 0) problems.push(`${c.find}: no key`);
    for (const k of q.answers) if (!sameList(val(k), want)) problems.push(`${c.find}: key "${k}" is ${val(k)} but the recomputed answer is ${want}`);
    for (const s of c.slips ?? []) {
      const li = q.wrongs.find((w) => matches(s.typed, w.values, q.mode));
      if (!li) { problems.push(`${c.find}: no wrong-answer entry accepts the slip "${s.typed}" (entries: ${q.wrongs.map((w) => w.values.slice(0, 2).join(' | ')).join(' / ')})`); continue; }
      li.claimed = true;
      if (!s.says.test(plain(li.text))) problems.push(`${c.find}: the message for "${s.typed}" does not name the slip ${s.says}: ${plain(li.text).slice(0, 110)}`);
      if (matches(s.typed, q.answers, q.mode)) problems.push(`${c.find}: the slip "${s.typed}" is also a right answer`);
      if (sameList(val(s.typed), want, 1e-3)) problems.push(`${c.find}: the slip "${s.typed}" has the same value as the key`);
      // the slip's own maths gives the typed value (to the rounding it is typed with)
      const calc = list(s.calc);
      if (!sameList(val(s.typed), calc, 0.006)) problems.push(`${c.find}: the slip "${s.typed}" is not what its working gives, ${calc}`);
      for (const v of li.values) if (!sameList(val(v), calc, 0.006)) problems.push(`${c.find}: "${v}" is listed with the slip but is not ${calc}`);
    }
    // the right value typed as a decimal, on a question that asks for an exact answer: its values are the key's value, rounded
    for (const w of q.wrongs) {
      if (w.claimed || !/That is the decimal value/.test(plain(w.text))) continue;
      w.claimed = true;
      if (q.mode !== 'exact' || !q.answers.some((a) => /pi|sqrt|radic/.test(a))) problems.push(`${c.find}: a decimal slip on a question that does not ask for an exact answer`);
      for (const v of w.values) if (!sameList(val(v), want, 0.006)) problems.push(`${c.find}: the decimal "${v}" is not the value ${want}`);
    }
    for (const w of q.wrongs) if (!w.claimed) problems.push(`${c.find}: wrong-answer entry "${w.values.slice(0, 2).join(' | ')}" has no recomputed slip`);
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
    const keyNumbers = new Set(q.answers.flatMap((a) => val(a)).filter((v) => !Number.isInteger(v) || Math.abs(v) >= 10).map((v) => String(v)));
    for (const h of q.hints) {
      for (const n of keyNumbers) if (new RegExp(`(^|[^\\d.])${n.replace('.', '\\.').replace('-', '-?')}($|[^\\d.])`).test(h)) problems.push(`a hint of "${q.plain.slice(0, 50)}" names the key value ${n}: ${h}`);
      for (const a of q.answers) if (/[a-z]/.test(a) && h.replace(/\s+/g, '').includes(a.replace(/\s+/g, ''))) problems.push(`a hint of "${q.plain.slice(0, 50)}" contains the key ${a}`);
    }
    const m = /(?:Type|type) (?:it|them|your answers?|only) (?:like|as a fraction like) (.*?)\.?$/.exec(q.plain);
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

/** The area of a polygon given by its corners, by the shoelace formula. */
function shoelace(pts: [number, number][]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i += 1) { const [x1, y1] = pts[i]; const [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
  return Math.abs(a) / 2;
}
const walk = (r: number, a0: number, a1: number, n = 20000): [number, number][] => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [r * Math.cos(a), r * Math.sin(a)] as [number, number]; });
const pathLength = (pts: [number, number][]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

test('multiple-choice keys: each correct option is the one the maths gives, and each reason quotes right numbers', () => {
  // which angle is the largest: 0.5 radians, 50 degrees, 1 radian, all in degrees
  const inDeg = { '0.5 radians': 0.5 / RAD, '50\u00b0': 50, '1 radian': 1 / RAD };
  const largest = Object.entries(inDeg).sort((a, b) => b[1] - a[1])[0][0];
  expect(largest).toBe('1 radian');
  expect(correctText('Which of these angles is the largest')).toBe(largest);
  expect(dp(0.5 / RAD, 1)).toBe(28.6);
  expect(dp(50 * RAD, 2)).toBe(0.87);
  expect(dp(1 / RAD, 1)).toBe(57.3);
  const largestWhy = options('Which of these angles is the largest').map((o) => o.why).join(' ');
  expect(largestWhy).toContain('0.5 radians is about 28.6 degrees');
  expect(largestWhy).toContain('50 degrees is about 0.87 radians');
  // half a turn is pi radius-lengths: half of the circumference 2 pi r, divided by r
  for (const r of [1, 2.5, 7]) expect((0.5 * 2 * PI * r) / r).toBeCloseTo(PI, 12);
  expect(correctText('Why is half a turn equal to')).toBe('Half the circumference is \u03c0r, which is \u03c0 radius-lengths');
  expect(1 / RAD).not.toBeCloseTo(PI, 1); // a radian is not pi degrees
  expect(options('Why is half a turn equal to')[1].why).toContain('A radian is about 57.3 degrees, not 3.14 degrees');
  // the one that is not 1/2: sin(pi/6), cos(2pi/3), sin(5pi/6)
  const trio: Record<string, number> = { 'sin(\u03c0/6)': Math.sin(PI / 6), 'cos(2\u03c0/3)': Math.cos((2 * PI) / 3), 'sin(5\u03c0/6)': Math.sin((5 * PI) / 6) };
  const notHalf = Object.entries(trio).filter(([, v]) => !close(v, 0.5, 1e-9)).map(([k]) => k);
  expect(notHalf).toEqual(['cos(2\u03c0/3)']);
  expect(correctText('Which one of these is not equal to')).toBe(notHalf[0]);
  expect(PI - (5 * PI) / 6).toBeCloseTo(PI / 6, 12); // the acute angle of 5pi/6
  // the segment: sector minus triangle, measured on a real polygon (r = 7, angle 1)
  const arc = walk(7, 0, 1);
  const segment = shoelace(arc);
  const sector = shoelace([[0, 0], ...arc]);
  const triangle = 0.5 * 49 * Math.sin(1);
  expect(segment).toBeCloseTo(sector - triangle, 6);
  expect(segment).not.toBeCloseTo(sector + triangle, 1);
  expect(segment).not.toBeCloseTo(sector * Math.sin(1), 1);
  expect(correctText('Which statement gives the area of the segment')).toBe('Area of the sector minus area of the triangle OAB');
  // sin theta ~ theta needs radians: 30 degrees is 0.5236 radians
  expect(dp(30 * RAD, 2)).toBe(0.52);
  expect(Math.sin(30 * RAD)).toBeCloseTo(0.5, 12);
  expect(Math.sin(30 * RAD)).toBeLessThan(1);
  expect(correctText('Why can you not estimate')).toBe('The angle must be in radians. 30\u00b0 is about 0.52 radians, so the estimate would be about 0.52');
  // Ana: 6 x 60 = 360, but 60 degrees is pi/3 and the arc is 2 pi; the whole circumference is 12 pi = 37.7
  expect(6 * 60).toBe(360);
  expect(6 * (60 * RAD)).toBeCloseTo(2 * PI, 12);
  expect(dp(12 * PI, 1)).toBe(37.7);
  expect(360).toBeGreaterThan(12 * PI);
  expect(correctText('Ana says')).toBe('The angle must be in radians. 60\u00b0 is \u03c0/3, so the arc is 2\u03c0');
  // Ben: 1/2 x 4 x 0.5 = 1, but the formula squares the radius: 1/2 x 16 x 0.5 = 4
  expect(0.5 * 4 * 0.5).toBe(1);
  expect(0.5 * 4 ** 2 * 0.5).toBe(4);
  expect(correctText('Ben says')).toBe('He did not square the radius. The area is 4');
  // Cam: sin x = 1/2 on 0..2pi has the solutions pi/6 and 5pi/6, and 11pi/6 is not one of them
  expect(sols((x) => Math.sin(x) - 0.5, 0, 2 * PI).map((v) => clean(v / PI * 6))).toEqual([1, 5]);
  expect(Math.sin((11 * PI) / 6)).toBeCloseTo(-0.5, 12);
  expect(correctText('Cam says')).toBe('For sine the second solution is \u03c0 - \u03c0/6 = 5\u03c0/6, not 2\u03c0 - \u03c0/6');
  // Dee: cos 0.2 is 0.9801; 1 - 0.04 = 0.96 is not close, and 1 - 0.04/2 = 0.98 is
  expect(dp(Math.cos(0.2), 4)).toBe(0.9801);
  expect(1 - 0.2 ** 2).toBeCloseTo(0.96, 12);
  expect(1 - 0.2 ** 2 / 2).toBeCloseTo(0.98, 12);
  expect(correctText('Dee says')).toBe('The approximation has \u03b8^2 divided by 2, so the estimate is 0.98');
  // Eli: the triangle is 1/2 r^2 sin theta; at theta = pi/2 sin = 1 and cos = 0
  expect(Math.sin(PI / 2)).toBe(1);
  expect(Math.abs(Math.cos(PI / 2))).toBeLessThan(1e-12);
  expect(shoelace([[0, 0], [1, 0], [0, 1]])).toBeCloseTo(0.5 * 1 * Math.sin(PI / 2), 12);
  expect(correctText('Eli says')).toBe('The area of the triangle is \u00bdr^2 sin \u03b8, not \u00bdr^2 cos \u03b8');
  // which angle is 5pi/4: 225 degrees, and 135 degrees is 3pi/4, 250 degrees is 25pi/18
  expect((5 * PI) / 4 / RAD).toBeCloseTo(225, 9);
  expect(135 * RAD).toBeCloseTo((3 * PI) / 4, 12);
  expect(250 * RAD).toBeCloseTo((25 * PI) / 18, 12);
  expect(correctText('Which angle is equal to')).toBe('225\u00b0');
});

test('the blanks in every "Now you finish it" are recomputed', () => {
  const blanks = [...SOURCE.matchAll(/class="blank" data-answers="([^"]*)"/g)].map((m) => m[1]);
  const expected: (number[] | string[])[] = [
    [210 / 180], [210 * RAD], // 210 degrees: 7/6, then 7pi/6
    [PI - (5 * PI) / 6], [Math.cos((5 * PI) / 6)], // cos(5pi/6): the acute angle pi/6, then -sqrt(3)/2
    [12 * 0.75], [2 * 12 + 12 * 0.75], // arc 9 and perimeter 33
    [0.5 * 100], [0.5 * 100 * 0.6], // sector area 50 then 30
    [0.5 * 16 * (PI / 3)], [0.5 * 16 * Math.sin(PI / 3)], [sf(0.5 * 16 * (PI / 3) - 0.5 * 16 * Math.sin(PI / 3), 3)], // segment: sector, triangle, difference
    [Math.asin(sqrt3 / 2)], [PI - Math.asin(sqrt3 / 2)], // sin x = sqrt(3)/2: pi/3 and 2pi/3
    ['theta'], [4 / 2], // sin 4 theta ~ 4 theta (the keys are read with theta = 0.37), then 4/2
  ];
  expect(blanks.length).toBe(expected.length);
  blanks.forEach((b, i) => {
    const keys = decode(b).split(';').map((x) => x.trim());
    const want = expected[i];
    if (typeof want[0] === 'string') {
      // 4 theta, written 4theta, 4*theta, theta*4 or with the symbol: every key is 4 x theta, at a value of theta
      const t = 0.37;
      expect(keys.length, `blank ${i}`).toBe(6);
      for (const k of keys) expect(close(one(k.replace(/theta|\u03b8/g, `(${t})`)), 4 * t), `blank ${i} "${k}"`).toBe(true);
      expect(keys.some((k) => /\u03b8/.test(k)) && keys.some((k) => /theta/.test(k))).toBe(true);
    }
    else for (const k of keys) expect(sameList(val(k), want as number[]), `blank ${i} "${k}" is ${val(k)}, expected ${want}`).toBe(true);
  });
  // the same facts, checked directly
  expect(Math.cos((5 * PI) / 6)).toBeCloseTo(-sqrt3 / 2, 12);
  expect(Math.tan(PI / 3)).toBeCloseTo(sqrt3, 12);
  expect(dp(8 * PI / 3 - 4 * sqrt3, 2)).toBe(1.45);
});

// ---------- the rules the lessons state, checked against a walk round a circle and a scan for roots ----------
test('lesson 1: the conversions, the table of common angles and the size of a radian', () => {
  const table: [number, number][] = [[0, 0], [30, PI / 6], [45, PI / 4], [60, PI / 3], [90, PI / 2], [180, PI], [270, (3 * PI) / 2], [360, 2 * PI]];
  for (const [d, r] of table) { expect(d * (PI / 180), `${d} to radians`).toBeCloseTo(r, 12); expect(r * (180 / PI), `${r} to degrees`).toBeCloseTo(d, 9); }
  expect(150 * (PI / 180)).toBeCloseTo((5 * PI) / 6, 12);
  expect(((3 * PI) / 4) * (180 / PI)).toBeCloseTo(135, 9);
  expect(dp(2 * (180 / PI), 1)).toBe(114.6);
  expect(dp(1 * (180 / PI), 1)).toBe(57.3);
  expect(dp(2 * PI, 2)).toBe(6.28);
  expect(dp(PI / 3, 3)).toBe(1.047);
  // one radian cuts off an arc as long as the radius, and 2 pi of them fill the circle
  for (const r of [1, 3, 8.5]) {
    const arc = walk(r, 0, 1);
    expect(pathLength(arc)).toBeCloseTo(r, 6);
    expect(pathLength(walk(r, 0, 2 * PI))).toBeCloseTo(2 * PI * r, 5);
    expect((2 * PI * r) / r).toBeCloseTo(2 * PI, 12);
  }
  expect(150 / 180).toBeCloseTo(5 / 6, 12);
  expect(210 / 180).toBeCloseTo(7 / 6, 12);
  expect((75 * PI) / 180).toBeCloseTo((5 * PI) / 12, 12);
  expect((72 * PI) / 180).toBeCloseTo((2 * PI) / 5, 12);
  expect((112.5 * PI) / 180).toBeCloseTo((5 * PI) / 8, 12);
});

test('lesson 2: the table of exact values, the acute-angle rule and the quadrant signs', () => {
  const rows: [number, number, number, number][] = [[PI / 6, 0.5, sqrt3 / 2, sqrt3 / 3], [PI / 4, Math.SQRT2 / 2, Math.SQRT2 / 2, 1], [PI / 3, sqrt3 / 2, 0.5, sqrt3]];
  for (const [a, s, c, t] of rows) { expect(Math.sin(a)).toBeCloseTo(s, 12); expect(Math.cos(a)).toBeCloseTo(c, 12); expect(Math.tan(a)).toBeCloseTo(t, 12); }
  expect(Math.abs(Math.cos(PI / 2))).toBeLessThan(1e-12);
  expect(Math.sin(PI)).toBeCloseTo(0, 12);
  expect(Math.cos(PI)).toBeCloseTo(-1, 12);
  expect(Math.sin((3 * PI) / 2)).toBeCloseTo(-1, 12);
  // for any angle in quadrants 2, 3 and 4: the acute angle, and the size of sin, cos, tan are those of the acute angle; the signs are CAST
  for (let i = 1; i < 400; i += 1) {
    const th = (2 * PI * i) / 400;
    if (Math.abs(th - PI / 2) < 1e-6 || Math.abs(th - PI) < 1e-6 || Math.abs(th - (3 * PI) / 2) < 1e-6) continue;
    const q = th < PI / 2 ? 1 : th < PI ? 2 : th < (3 * PI) / 2 ? 3 : 4;
    const alpha = [th, PI - th, th - PI, 2 * PI - th][q - 1];
    expect(alpha > 0 && alpha < PI / 2, `alpha at ${th}`).toBe(true);
    expect(Math.abs(Math.sin(th))).toBeCloseTo(Math.sin(alpha), 9);
    expect(Math.abs(Math.cos(th))).toBeCloseTo(Math.cos(alpha), 9);
    expect(Math.abs(Math.tan(th))).toBeCloseTo(Math.tan(alpha), 7);
    const positive = { sin: q === 1 || q === 2, tan: q === 1 || q === 3, cos: q === 1 || q === 4 };
    expect(Math.sin(th) > 0).toBe(positive.sin);
    expect(Math.tan(th) > 0).toBe(positive.tan);
    expect(Math.cos(th) > 0).toBe(positive.cos);
  }
  // the three worked examples
  expect(Math.sin((2 * PI) / 3)).toBeCloseTo(sqrt3 / 2, 12);
  expect(Math.cos((7 * PI) / 6)).toBeCloseTo(-sqrt3 / 2, 12);
  expect(Math.tan((7 * PI) / 4)).toBeCloseTo(-1, 12);
  // the mode: sin 30 is -0.988 in radians and 0.5 in degrees; sin 0.8 = 0.717, tan 1.2 = 2.57
  expect(dp(Math.sin(30), 3)).toBe(-0.988);
  expect(Math.sin(30 * RAD)).toBeCloseTo(0.5, 12);
  expect(dp(Math.sin(0.8), 3)).toBe(0.717);
  expect(dp(Math.tan(1.2), 2)).toBe(2.57);
  expect(Math.round(1.2 / RAD)).toBe(69);
  expect(dp(Math.tan(69 * RAD), 1)).toBe(2.6);
});

test('lessons 3 and 4: the arc length and the sector area, measured on a real arc and a real sector', () => {
  for (const r of [1, 2.5, 8]) {
    for (const th of [0.3, 1, 1.5, 2, 3, 4.5, 6, 2 * PI]) {
      expect(pathLength(walk(r, 0, th)), `arc ${r} ${th}`).toBeCloseTo(r * th, 4);
      expect(shoelace([[0, 0], ...walk(r, 0, th)]), `sector ${r} ${th}`).toBeCloseTo(0.5 * r * r * th, 3);
      expect(0.5 * r * (r * th)).toBeCloseTo(0.5 * r * r * th, 12); // A = 1/2 r s
    }
  }
  expect(0.5 * 1 * 1 * 2 * PI).toBeCloseTo(PI, 12); // the whole circle
  expect(2 * 10 + 10 * 0.8).toBe(28);
  expect(dp(1.75 / RAD, 1)).toBe(100.3);
  expect(9 * (PI / 3)).toBeCloseTo(3 * PI, 12);
  expect(dp(3 * PI, 2)).toBe(9.42);
  expect(12 * ((75 * PI) / 180)).toBeCloseTo(5 * PI, 12);
  expect(dp(5 * PI, 1)).toBe(15.7);
  expect(0.5 * 36 * 1.5).toBe(27);
  expect(0.5 * 9 * (PI / 6)).toBeCloseTo((3 * PI) / 4, 12);
  expect(dp((3 * PI) / 4, 2)).toBe(2.36);
  expect(36 / (0.5 * 64)).toBe(1.125);
  expect(24 / (0.5 * 0.75)).toBe(64);
  expect(0.5 * 100 * ((72 * PI) / 180)).toBeCloseTo(20 * PI, 12);
  expect(dp(20 * PI, 1)).toBe(62.8);
  // the fraction a degree angle makes: theta/360 of the circle, and in radians theta/(2 pi)
  expect((60 / 360) * 2 * PI * 6).toBeCloseTo(6 * (60 * RAD), 12);
  expect(4 * PI / 6).toBeCloseTo((2 * PI) / 3, 12);
  expect(dp(12 * PI, 1)).toBe(37.7);
});

test('lesson 5: the segment, the chord and the perimeter of a segment, measured on real polygons', () => {
  for (const r of [1, 4, 10]) {
    for (const th of [0.2, 0.9, PI / 3, PI / 2, 2, 3]) {
      const arc = walk(r, 0, th);
      expect(shoelace(arc), `segment ${r} ${th}`).toBeCloseTo(0.5 * r * r * (th - Math.sin(th)), 3);
      const chord = Math.hypot(arc[0][0] - arc[arc.length - 1][0], arc[0][1] - arc[arc.length - 1][1]);
      expect(chord, `chord ${r} ${th}`).toBeCloseTo(2 * r * Math.sin(th / 2), 9);
      expect(pathLength(arc) + chord).toBeCloseTo(r * th + 2 * r * Math.sin(th / 2), 4);
      expect(0.5 * r * r * Math.sin(th)).toBeCloseTo(shoelace([[0, 0], arc[0], arc[arc.length - 1]]), 9);
    }
  }
  // the chord formula holds for any angle up to a full turn (here a reflex angle), and the area formula is stated for angles up to pi
  const reflex = walk(5, 0, 4);
  expect(Math.hypot(reflex[0][0] - reflex[reflex.length - 1][0], reflex[0][1] - reflex[reflex.length - 1][1])).toBeCloseTo(2 * 5 * Math.sin(2), 9);
  // the worked examples
  expect(0.5 * 100 * (PI / 2)).toBeCloseTo(25 * PI, 12);
  expect(dp(25 * PI, 2)).toBe(78.54);
  expect(dp(25 * PI - 50, 1)).toBe(28.5);
  expect(dp(12 * Math.sin(PI / 3), 1)).toBe(10.4);
  expect(12 * Math.sin(PI / 3)).toBeCloseTo(6 * sqrt3, 12);
  expect(dp(18 * ((2 * PI) / 3 - Math.sin((2 * PI) / 3)), 1)).toBe(22.1);
  expect(dp((2 * PI) / 3, 4)).toBe(2.0944);
  expect(dp(Math.sin((2 * PI) / 3), 4)).toBe(0.866);
  expect(dp(9 * (PI / 3) + 2 * 9 * Math.sin(PI / 6), 1)).toBe(18.4);
  expect(dp(3 * PI, 3)).toBe(9.425);
  expect(dp((8 * PI) / 3, 3)).toBe(8.378);
  expect(dp(4 * sqrt3, 3)).toBe(6.928);
  expect(dp((8 * PI) / 3 - 4 * sqrt3, 2)).toBe(1.45);
  expect(dp(9 * PI, 2)).toBe(28.27);
  expect(dp(8 * Math.SQRT2, 2)).toBe(11.31);
  expect(dp(4 * PI, 2)).toBe(12.57);
  expect(dp(Math.sin(1), 4)).toBe(0.8415);
  expect(dp(Math.sin(1 * RAD), 4)).toBe(0.0175);
  expect(dp(12.5 * (1 - 0.8415), 2)).toBe(1.98);
  // a segment has no radii on its boundary: its boundary is the arc and the chord
  expect(shoelace(walk(8, 0, PI / 2))).toBeCloseTo(0.5 * 64 * (PI / 2 - 1), 3);
});

test('lesson 6: the period, the asymptotes, and the pairs of solutions in an interval, found by scanning', () => {
  expect(Math.sin(0.3 + 2 * PI)).toBeCloseTo(Math.sin(0.3), 12);
  expect(Math.cos(0.3 + 2 * PI)).toBeCloseTo(Math.cos(0.3), 12);
  expect(Math.tan(0.3 + PI)).toBeCloseTo(Math.tan(0.3), 12);
  expect(Math.sin(0.3 + PI)).not.toBeCloseTo(Math.sin(0.3), 2);
  expect(Math.cos(0.3 + PI)).not.toBeCloseTo(Math.cos(0.3), 2);
  for (let n = -3; n <= 3; n += 1) expect(Math.abs(Math.cos(PI / 2 + n * PI)), `asymptote ${n}`).toBeLessThan(1e-12);
  expect(sols((x) => Math.cos(x), 0, 2 * PI).map((v) => clean(v / PI * 2))).toEqual([1, 3]); // only pi/2 and 3pi/2 in 0..2pi
  expect(Math.sin(PI)).toBeCloseTo(0, 12);
  // sin x = k, cos x = k, tan x = k in an interval: the scan gives exactly the pair the rule gives, with the multiples of the period
  type Kind = 'sin' | 'cos' | 'tan';
  const f: Record<Kind, Fn> = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
  const inv: Record<Kind, Fn> = { sin: Math.asin, cos: Math.acos, tan: Math.atan };
  const byRule = (kind: Kind, k: number, lo: number, hi: number): number[] => {
    const a = inv[kind](k);
    const base = kind === 'sin' ? [a, PI - a] : kind === 'cos' ? [a, -a] : [a];
    const period = kind === 'tan' ? PI : 2 * PI;
    const out: number[] = [];
    for (const b of base) for (let n = -6; n <= 6; n += 1) { const x = b + n * period; if (x >= lo - 1e-12 && x <= hi + 1e-12) out.push(x); }
    return [...new Set(out.map((v) => Math.round(v * 1e8) / 1e8))].sort((p, q) => p - q);
  };
  const intervals: [number, number][] = [[0, 2 * PI], [-PI, PI], [0, 4 * PI], [-2 * PI, 2 * PI]];
  for (const [lo, hi] of intervals) {
    for (const k of [-0.9, -0.5, 0.3, 0.5, 0.8, 1]) for (const kind of ['sin', 'cos'] as Kind[]) {
      const scan = sols((x) => f[kind](x) - k, lo, hi).map((v) => Math.round(v * 1e8) / 1e8);
      const rule = byRule(kind, k, lo, hi);
      // a touching root (k = 1) is found once by the scan
      expect(scan.map((v) => Math.round(v * 1e5) + 0), `${kind} x = ${k} on ${lo}..${hi}`).toEqual(rule.map((v) => Math.round(v * 1e5) + 0));
    }
    for (const k of [-3, -1, 0.5, 1, 1.7320508075688772]) {
      const scan = sols((x) => Math.sin(x) - k * Math.cos(x), lo + 1e-7, hi - 1e-7).filter((x) => Math.abs(Math.cos(x)) > 1e-6).map((v) => Math.round(v * 1e5) + 0);
      expect(scan, `tan x = ${k} on ${lo}..${hi}`).toEqual(byRule('tan', k, lo + 1e-7, hi - 1e-7).map((v) => Math.round(v * 1e5) + 0));
    }
  }
  // no solutions when k is outside -1 to 1, for sine and cosine; tangent takes every value
  expect(sols((x) => Math.sin(x) - 1.2, 0, 2 * PI)).toEqual([]);
  expect(sols((x) => Math.cos(x) + 1.2, 0, 2 * PI)).toEqual([]);
  expect(sols((x) => Math.sin(x) - 1, 0, 2 * PI).length).toBe(1);
  expect(sols((x) => Math.sin(x) - Math.cos(x) * 100, 0.01, PI / 2 - 0.0001).length).toBe(1); // tan x = 100 has a solution
  // the exact pairs in the worked examples
  expect(sols((x) => Math.sin(x) - 0.5, 0, 2 * PI).map((v) => clean((v / PI) * 6))).toEqual([1, 5]);
  expect(sols((x) => Math.cos(x) + sqrt3 / 2, 0, 2 * PI).map((v) => clean((v / PI) * 6))).toEqual([5, 7]);
  expect(sols((x) => Math.sin(x) - Math.cos(x), 0.01, 2 * PI - 0.01).map((v) => clean((v / PI) * 4))).toEqual([1, 5]);
  expect(sols((x) => Math.cos(x) - 0.5, -PI, PI).map((v) => clean((v / PI) * 3))).toEqual([-1, 1]);
  expect(sols((x) => Math.sin(2 * x) - 0.5, 0, PI).map((v) => clean((v / PI) * 12))).toEqual([1, 5]);
  expect(sols((x) => Math.sin(x) - sqrt3 / 2, 0, 2 * PI).map((v) => clean((v / PI) * 3))).toEqual([1, 2]);
  expect(sols((x) => Math.sin(x) - 0.3, 0, 2 * PI).map((v) => dp(v, 3))).toEqual([0.305, 2.837]);
  expect(sols((x) => Math.sin(x) - 0.3, 0, 2 * PI).map((v) => sf(v))).toEqual([0.305, 2.84]);
  expect(dp(Math.asin(0.3), 4)).toBe(0.3047);
  expect(dp(PI - 0.3047, 4)).toBe(2.8369);
  // the interval for 2x is twice as long: 2x runs from 0 to 2pi when x runs from 0 to pi
  expect([0, PI].map((v) => 2 * v)).toEqual([0, 2 * PI]);
  expect(Math.tan(PI / 4 + PI)).toBeCloseTo(1, 12);
  expect(Math.tan(PI + 0.4)).toBeCloseTo(Math.sin(PI + 0.4) / Math.cos(PI + 0.4), 12);
  expect(Math.sin(0.4 + PI) / Math.cos(0.4 + PI)).toBeCloseTo(-Math.sin(0.4) / -Math.cos(0.4), 12);
});

test('sin x = 1 or -1 and cos x = 1 or -1 have one solution in a turn, not two', () => {
  for (const [fn, k] of [[Math.sin, 1], [Math.sin, -1], [Math.cos, 1], [Math.cos, -1]] as [Fn, number][]) {
    // the angles where the wave touches the line: points within 1e-9 of it, grouped when they are within 0.01 of each other
    const hits: number[] = [];
    for (let i = 0; i <= 200000; i += 1) { const x = ((2 * PI - 0.01) * i) / 200000; if (Math.abs(fn(x) - k) < 1e-9) hits.push(x); }
    const groups = hits.filter((x, i) => i === 0 || x - hits[i - 1] > 0.01).length;
    expect(groups, `${k}`).toBe(1);
  }
  expect(PI - Math.asin(1)).toBeCloseTo(Math.asin(1), 12); // alpha and pi - alpha are the same angle
  expect(Math.acos(1)).toBe(-Math.acos(1) + 0);
  expect(Math.abs(Math.acos(-1) - -Math.acos(-1))).toBeCloseTo(2 * PI, 12); // alpha and -alpha differ by a whole turn
  expect(sols((x) => Math.sin(x) - 0.5, 0, 2 * PI - 1e-6).length).toBe(2); // any other value in range gives two
});

test('lesson 7: the small-angle approximations, the table, the errors and the ratios', () => {
  const small = [0.001, 0.01, 0.05, 0.1, 0.2];
  for (const th of small) {
    expect(Math.abs(Math.sin(th) - th)).toBeLessThanOrEqual(th ** 3 / 6 + 1e-15);
    expect(Math.abs(Math.tan(th) - th)).toBeLessThanOrEqual(th ** 3 / 2);
    expect(Math.abs(Math.cos(th) - (1 - th ** 2 / 2))).toBeLessThanOrEqual(th ** 4 / 24 + 1e-15);
  }
  // sin theta < theta < tan theta for an acute angle: the squeeze in "Why it works"
  for (let i = 1; i < 100; i += 1) { const th = (PI / 2) * (i / 100); expect(Math.sin(th)).toBeLessThan(th); expect(th).toBeLessThan(Math.tan(th)); expect(1).toBeLessThan(th / Math.sin(th)); expect(th / Math.sin(th)).toBeLessThan(1 / Math.cos(th)); }
  expect(0.5 * Math.sin(1)).toBeLessThan(0.5 * 1); // triangle < sector < triangle on the unit circle, at angle 1
  expect(1 / Math.cos(1e-4)).toBeCloseTo(1, 7);
  // the table, to 4 decimal places
  const rows: [number, number, number, number, number][] = [[0.1, 0.0998, 0.1003, 0.995, 0.995], [0.5, 0.4794, 0.5463, 0.8776, 0.875], [1, 0.8415, 1.5574, 0.5403, 0.5]];
  for (const [th, s, t, c, a] of rows) {
    expect(dp(Math.sin(th), 4), `sin ${th}`).toBe(s);
    expect(dp(Math.tan(th), 4), `tan ${th}`).toBe(t);
    expect(dp(Math.cos(th), 4), `cos ${th}`).toBe(c);
    expect(dp(1 - th ** 2 / 2, 4), `1 - ${th}^2/2`).toBe(a);
    for (const cell of [s.toFixed(4), t.toFixed(4), c.toFixed(4), a.toFixed(4)]) expect(SOURCE, `${th}: ${cell}`).toContain(`<td>${cell}</td>`);
  }
  expect(SOURCE).toContain('<td>0.9950</td><td>0.9950</td>');
  expect(SOURCE).toContain('<td>0.8776</td><td>0.8750</td>');
  expect(SOURCE).toContain('<td>0.5403</td><td>0.5000</td>');
  // the worked examples
  expect(dp(Math.sin(0.2), 4)).toBe(0.1987);
  expect(dp(0.2 - 0.1987, 4)).toBe(0.0013);
  expect((0.2 - Math.sin(0.2)) / Math.sin(0.2)).toBeLessThan(0.01);
  expect(dp(4 * RAD, 4)).toBe(0.0698);
  expect(dp(Math.sin(4 * RAD), 4)).toBe(0.0698);
  expect(1 - 0.3 ** 2 / 2).toBeCloseTo(0.955, 12);
  expect(dp(Math.cos(0.3), 4)).toBe(0.9553);
  // the ratios tend to the numbers the page says
  const tiny = [1e-3, 1e-4];
  for (const th of tiny) {
    expect(Math.tan(5 * th) / (2 * th)).toBeCloseTo(2.5, 4);
    expect(Math.sin(4 * th) / (2 * th)).toBeCloseTo(2, 4);
    expect(Math.sin(5 * th) / th).toBeCloseTo(5, 4);
    expect(Math.tan(2 * th) / Math.sin(3 * th)).toBeCloseTo(2 / 3, 4);
    expect((1 - Math.cos(2 * th)) / (th * Math.tan(th))).toBeCloseTo(2, 4);
  }
  expect(dp(Math.sin(0.04) / 0.02, 4)).toBe(1.9995);
  // the exam question's slips: using theta in place of 2 theta gives 1/2, forgetting the half gives 4
  expect(((0.0001 ** 2) / 2) / (0.0001 * 0.0001)).toBeCloseTo(0.5, 12);
  expect(((2 * 0.0001) ** 2) / (0.0001 * 0.0001)).toBeCloseTo(4, 12);
  // sin 6 degrees and sin 3 degrees: the estimate and the true value
  expect(sf(6 * RAD)).toBe(0.105);
  expect(sf(Math.sin(6 * RAD))).toBe(0.105);
});

// ---------- every calculation written as {m:a=b=c} ----------
function fracs(s: string): string {
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
function evalPiece(raw: string, degAsRadians: boolean): number | null {
  let s = raw.trim();
  if (!s || /[<>]/.test(s)) return null;
  s = fracs(s);
  if (!s) return null;
  s = s.replace(/([\d.]+)\s*deg\b/g, degAsRadians ? '($1*Math.PI/180)' : '$1');
  s = s.replace(/\b(sin|cos|tan)\^\(-1\)\(/g, (_m, f: string) => `Math.a${f}(`);
  s = s.replace(/\b(sin|cos|tan)\s+([\d.]+)/g, 'Math.$1($2)').replace(/\b(sin|cos|tan|sqrt)\(/g, 'Math.$1(').replace(/\bpi\b/g, 'Math.PI').replace(/\^/g, '**');
  s = s.replace(/\)\s*(?=[\d(M])/g, ')*').replace(/(\d)\s*(?=\(|Math)/g, '$1*').replace(/(PI)\s*(?=\d)/g, '$1*');
  if (!/^[\d\s.+\-*/(),]*$/.test(s.replace(/Math\.(sin|cos|tan|asin|acos|atan|sqrt|PI)/g, ''))) return null;
  try { return new Function(`return (${s});`)() as number; } catch { return null; }
}
test('every calculation {m:a=b=c} on the page is right', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const m of SOURCE.matchAll(/\{m:([^}]*)\}/g)) {
    if (!/=/.test(m[1])) continue;
    const pieces = m[1].split(/~=|=/).map((p) => p.trim()).filter((p) => p !== '');
    if (/^[a-zA-Z]+$/.test(pieces[0])) pieces.shift(); // "theta=frac(s, r)": the name of the unknown is not a number
    if (pieces.length < 2) continue;
    // an angle in degrees is read as an angle (in radians) when the chain is about the angle, and as a plain number when it is a length of arc or a size in degrees
    const tries = [true, false].map((flag) => pieces.map((p) => evalPiece(p, flag)));
    const usable = tries.filter((vals) => vals.every((v) => v !== null && Number.isFinite(v))) as number[][];
    if (usable.length === 0) continue;
    checked += 1;
    // a chain ends with a rounded number: it may be out by half a unit of its last decimal place (an estimate, written ~=, by a little more)
    const last = /^-?\d+(?:\.(\d+))?(?:deg)?$/.exec(pieces[pieces.length - 1]);
    const half = last ? 0.5 * 10 ** -(last[1]?.length ?? 0) : 0.006;
    const tolerance = /~=/.test(m[1]) ? Math.max(half, 0.03) : half;
    const ok = usable.some((nums) => Math.max(...nums) - Math.min(...nums) <= tolerance + 1e-9);
    if (!ok) problems.push(`{m:${m[1]}} gives ${usable.map((n) => n.join(' and ')).join(' / ')}`);
  }
  expect(checked).toBeGreaterThan(80);
  expect(problems).toEqual([]);
});

test('every calculator value, exact value and rounded value the page quotes is right', () => {
  // [how it is written on the page, the true value, the value the page quotes, the decimal places it is quoted to]
  const quotes: [string, number, number, number][] = [
    ['sin 0.8=0.717', Math.sin(0.8), 0.717, 3], ['tan 1.2=2.57', Math.tan(1.2), 2.57, 2], ['-0.988', Math.sin(30), -0.988, 3], ['cos 2=-0.416', Math.cos(2), -0.416, 3],
    ['sin 1=0.8415', Math.sin(1), 0.8415, 4], ['sin 0.2=0.1987', Math.sin(0.2), 0.1987, 4], ['cos 0.3=0.9553', Math.cos(0.3), 0.9553, 4], ['cos 0.2=0.9801', Math.cos(0.2), 0.9801, 4],
    ['sin^(-1)(0.8)=0.927', Math.asin(0.8), 0.927, 3], ['sin^(-1)(0.3)=0.3047', Math.asin(0.3), 0.3047, 4], ['pi-0.9273=2.21', PI - 0.9273, 2.21, 2], ['pi-0.3047=2.8369', PI - 0.3047, 2.8369, 4],
    ['tan^(-1)(frac(4, 3))=0.927', Math.atan(4 / 3), 0.927, 3], ['180-30=150', 150, 150, 0],
    ['2*frac(180, pi)=frac(360, pi)', 2 * (180 / PI), 360 / PI, 9], ['frac(360, pi)=114.6', 360 / PI, 114.6, 1], ['1.75*frac(180, pi)=100.3deg', 1.75 * (180 / PI), 100.3, 1],
    ['0.5*frac(180, pi)=28.6deg', 0.5 * (180 / PI), 28.6, 1], ['1.5*frac(180, pi)=85.9', 1.5 * (180 / PI), 85.9, 1],
    ['frac(8*pi, 3)=8.378', (8 * PI) / 3, 8.378, 3], ['4*sqrt(3)=6.928', 4 * sqrt3, 6.928, 3],
    ['9*pi=28.3', 9 * PI, 28.3, 1], ['6*sqrt(3)=10.4', 6 * sqrt3, 10.4, 1], ['3*pi=9.425', 3 * PI, 9.425, 3], ['24*sqrt(3)=41.57', 24 * sqrt3, 41.57, 2], ['12*pi=37.70', 12 * PI, 37.7, 2],
  ];
  const missing: string[] = [];
  const maths = [...SOURCE.matchAll(/\{m:([^}]*)\}/g)].map((m) => m[1]);
  for (const [name, v, quoted, places] of quotes) {
    // the whole quoted equation, as the page writes it, is inside one {m:...}
    if (!maths.some((m) => m.includes(name))) missing.push(name);
    expect(Math.abs(v - quoted), name).toBeLessThanOrEqual(0.5 * 10 ** -places + 1e-9);
  }
  expect(missing, 'quotes that are not inside one {m:...} on the page').toEqual([]);
  expect(plain(SOURCE)).toContain('In degrees, 1*frac(180, pi) is about 57.3\u00b0.');
  expect(plain(SOURCE)).toContain('1 radian is about 57.3deg.');
  expect(plain(SOURCE)).toContain('The decimal 1.047 is its rounded value.');
  expect(dp(6 * RAD, 4)).toBe(0.1047);
  expect(dp(2 * (180 / PI), 1)).toBe(114.6);
});

// ---------- the pictures ----------
type Geom = { width: number; height: number; left: number; right: number; top: number; bottom: number; xmin: number; xmax: number; ymin: number; ymax: number };
type Fx = (x: number) => number;
type Pt = [number, number];
const upper = (r: number): Fx => (x) => Math.sqrt(Math.max(0, r * r - x * x));
const lower = (r: number): Fx => (x) => -Math.sqrt(Math.max(0, r * r - x * x));
const pol = (r: number, a: number): Pt => [r * Math.cos(a), r * Math.sin(a)];
/** What each picture is meant to show, written here from the page's own numbers (not read from the figure code). */
type Tag = { at: Pt; text: string; r: number; theta: number };
type Stated = {
  curves: { cls: string; f: Fx; from: number; to: number }[];
  points: Record<string, Pt>;
  labels: Record<string, string>;
  on: Record<string, number[]>;
  segs?: Record<string, { a: Pt; b: Pt; text: string }>;
  tags?: Record<string, Tag>;
  hlines?: Record<string, { y: number; text: string }>;
  regions?: { area: number; label: string }[];
  silent?: string[]; // a point whose coordinates are not given in the description (they would give away the answer)
  equal?: boolean; // the same scale on both axes
  tan?: boolean;
};
const a12 = 1.2;
/** The small arc at O (a fifth of the radius), and the angle's own label on the bisector at 0.6 of the radius. */
const wedge = (r: number, th: number, text: string) => ({
  curve: { cls: 'curve-b', f: upper(r / 5), from: (r / 5) * Math.cos(th), to: r / 5 },
  tags: { ang: { at: [0.6 * r * Math.cos(th / 2), 0.6 * r * Math.sin(th / 2)] as Pt, text, r, theta: th } },
});
const W1 = wedge(1, 1, '1 rad');
const W2 = wedge(5, a12, '1.2 rad');
const W3 = wedge(6, 1.5, '1.5 rad');
const W4 = wedge(10, PI / 2, `${PIC}/2`);
const W5 = wedge(8, 0.9, '0.9 rad');
const W6 = wedge(12, PI / 6, `${PIC}/6`);
const STATED: Record<string, Stated> = {
  'radians-one-radian': {
    curves: [{ cls: 'curve-c', f: upper(1), from: -1, to: 1 }, { cls: 'curve-c', f: lower(1), from: -1, to: 1 }, { cls: 'curve', f: upper(1), from: Math.cos(1), to: 1 }, W1.curve],
    tags: W1.tags, points: { o: [0, 0], a: [1, 0], b: pol(1, 1) }, labels: { o: 'O', a: 'A', b: 'B' }, on: { o: [], a: [0, 2], b: [0, 2] }, equal: true,
    segs: { oa: { a: [0, 0], b: [1, 0], text: 'r' }, ob: { a: [0, 0], b: pol(1, 1), text: 'r' } },
  },
  'radians-unit-circle': {
    curves: [{ cls: 'curve', f: upper(1), from: -1, to: 1 }, { cls: 'curve', f: lower(1), from: -1, to: 1 }],
    points: { p6: pol(1, PI / 6), p4: pol(1, PI / 4), p3: pol(1, PI / 3), p2: pol(1, PI / 2), p1: pol(1, PI), p32: pol(1, (3 * PI) / 2) },
    labels: { p6: `${PIC}/6`, p4: `${PIC}/4`, p3: `${PIC}/3`, p2: `${PIC}/2`, p1: PIC, p32: `3${PIC}/2` },
    on: { p6: [0], p4: [0], p3: [0], p2: [0], p1: [0], p32: [1] }, equal: true,
  },
  'radians-arc': {
    curves: [{ cls: 'curve', f: upper(5), from: 5 * Math.cos(a12), to: 5 }, W2.curve],
    tags: W2.tags, points: { o: [0, 0], a: [5, 0], b: pol(5, a12) }, labels: { o: 'O', a: 'A', b: 'B' }, on: { o: [], a: [0], b: [0] }, equal: true,
    segs: { oa: { a: [0, 0], b: [5, 0], text: 'r = 5' }, ob: { a: [0, 0], b: pol(5, a12), text: 'r = 5' } },
  },
  'radians-sector': {
    curves: [{ cls: 'curve', f: upper(6), from: 6 * Math.cos(1.5), to: 6 }, W3.curve],
    tags: W3.tags, points: { o: [0, 0], a: [6, 0], b: pol(6, 1.5) }, labels: { o: 'O', a: 'A', b: 'B' }, on: { o: [], a: [0], b: [0] }, equal: true,
    segs: { oa: { a: [0, 0], b: [6, 0], text: 'r = 6' }, ob: { a: [0, 0], b: pol(6, 1.5), text: 'r = 6' } },
    regions: [{ area: 0.5 * 36 * 1.5, label: 'the sector' }],
  },
  'radians-segment': {
    curves: [{ cls: 'curve', f: upper(10), from: 0, to: 10 }, W4.curve],
    tags: W4.tags, points: { o: [0, 0], a: [10, 0], b: [0, 10] }, labels: { o: 'O', a: 'A', b: 'B' }, on: { o: [], a: [0], b: [0] }, equal: true,
    segs: { oa: { a: [0, 0], b: [10, 0], text: 'r = 10' }, ob: { a: [0, 0], b: [0, 10], text: 'r = 10' }, ab: { a: [10, 0], b: [0, 10], text: 'chord' } },
    regions: [{ area: 0.5 * 100 * (PI / 2 - 1), label: 'the segment' }],
  },
  'radians-sin-graph': {
    curves: [{ cls: 'curve', f: Math.sin, from: 0, to: 2 * PI }],
    points: { s1: [PI / 6, 0.5], s2: [(5 * PI) / 6, 0.5], z1: [PI, 0], z2: [2 * PI, 0] }, labels: { s1: `${PIC}/6`, s2: `5${PIC}/6`, z1: PIC, z2: `2${PIC}` },
    on: { s1: [0], s2: [0], z1: [0], z2: [0] }, hlines: { k: { y: 0.5, text: 'y = 1/2' } },
  },
  'radians-tan-graph': {
    curves: [{ cls: 'curve', f: Math.tan, from: 0, to: 2 * PI }],
    points: { s1: [PI / 4, 1], s2: [(5 * PI) / 4, 1] }, labels: { s1: `${PIC}/4`, s2: `5${PIC}/4` }, on: { s1: [0], s2: [0] }, hlines: { k: { y: 1, text: 'y = 1' } }, tan: true,
  },
  'radians-small-angle': {
    curves: [{ cls: 'curve', f: Math.sin, from: 0, to: 1.8 }, { cls: 'curve-b', f: (x) => x, from: 0, to: 1.8 }],
    points: { u: [1, 1], v: [1, Math.sin(1)] }, labels: { u: '(1, 1)', v: `(1, ${t3(Math.sin(1))})` }, on: { u: [1], v: [0] },
  },
  'radians-q-sector': {
    curves: [{ cls: 'curve', f: upper(8), from: 8 * Math.cos(0.9), to: 8 }, W5.curve],
    tags: W5.tags, points: { o: [0, 0] }, labels: { o: 'O' }, on: { o: [] }, equal: true,
    segs: { oa: { a: [0, 0], b: [8, 0], text: '8 cm' }, ob: { a: [0, 0], b: pol(8, 0.9), text: '8 cm' } },
  },
  'radians-q-sin-line': {
    curves: [{ cls: 'curve', f: Math.sin, from: 0, to: 2 * PI }],
    points: {}, labels: {}, on: {}, hlines: { k: { y: 0.8, text: 'y = 0.8' } },
  },
  'radians-q-tangent': {
    curves: [{ cls: 'curve', f: upper(12), from: 12 * Math.cos(PI / 6), to: 12 }, W6.curve],
    tags: W6.tags, points: { o: [0, 0], a: [12, 0], b: pol(12, PI / 6), t: [12, tanT] }, labels: { o: 'O', a: 'A', b: 'B', t: 'T' }, on: { o: [], a: [0], b: [0], t: [] }, equal: true, silent: ['t'],
    segs: { oa: { a: [0, 0], b: [12, 0], text: '12 cm' }, at: { a: [12, 0], b: [12, tanT], text: '' }, ot: { a: [0, 0], b: [12, tanT], text: '' } },
    regions: [{ area: regionR, label: 'the region R' }],
  },
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
  const inPlot = (l: { y1: number; y2: number }) => l.y1 >= g.top - 1 && l.y2 >= g.top - 1;
  const asLine = (m: RegExpMatchArray) => ({ x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] });
  const guides = [...svg.matchAll(/<line class="guide" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].map(asLine).filter(inPlot);
  const segLines = [...svg.matchAll(/<line class="line" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].map(asLine).filter(inPlot);
  const circles = [...svg.matchAll(/<circle class="pt" data-name="([^"]*)" cx="([\d.-]+)" cy="([\d.-]+)" r="7"\/>/g)].map((m) => ({ name: m[1], px: +m[2], py: +m[3], x: toX(+m[2]), y: toY(+m[3]) }));
  const labels = [...svg.matchAll(/<text[^>]*data-for="([^"]*)" x="([\d.-]+)" y="([\d.-]+)" text-anchor="(\w+)">([\s\S]*?)<\/text>/g)].map((m) => ({ for: m[1], x: +m[2], y: +m[3], anchor: m[4], text: m[5].replace(/<[^>]+>/g, '').replace(/\u200b/g, '').replace(/\u2212/g, '-') }));
  const regions = [...svg.matchAll(/<polygon class="shade" points="([^"]*)"\/>/g)].map((m) => m[1].trim().split(/\s+/).map((p) => { const [a, b] = p.split(',').map(Number); return [toX(a), toY(b)] as Pt; }));
  return { horizontal, vertical, px, py, toX, toY, paths, guides, segLines, circles, labels, regions };
}

test('every curve is read back from its drawn path and is the function the page says it is', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/radians.mjs');
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
    // a circle picture has the same scale on both axes, so the circle is round and an angle looks its size
    if (st.equal) expect((m.horizontal.x2 - m.horizontal.x1) / (g.xmax - g.xmin), id).toBeCloseTo((m.vertical.y1 - m.vertical.y2) / (g.ymax - g.ymin), 1);
    expect(m.paths.map((p) => p.cls), `${id}: the curves, in order`).toEqual(st.curves.map((c) => c.cls));
    m.paths.forEach((p, i) => {
      const tol = 0.012 * (g.ymax - g.ymin);
      const c = st.curves[i];
      let n = 0;
      for (const piece of p.pieces) for (const [x, y] of piece) {
        n += 1;
        if (Math.abs(y - c.f(x)) > tol) problems.push(`${id}: curve ${i} is at (${x.toFixed(2)}, ${y.toFixed(2)}) but the function gives ${c.f(x).toFixed(2)}`);
        if (x < c.from - 0.01) problems.push(`${id}: curve ${i} starts before x = ${c.from}`);
        if (x > c.to + 0.01) problems.push(`${id}: curve ${i} runs past x = ${c.to}`);
      }
      if (n < 100) problems.push(`${id}: curve ${i} has only ${n} points`);
      const xs = p.pieces.flat().map(([x]) => x);
      if (Math.min(...xs) > c.from + 0.02 * (g.xmax - g.xmin) || Math.max(...xs) < c.to - 0.02 * (g.xmax - g.xmin)) problems.push(`${id}: curve ${i} does not reach both ends of [${c.from}, ${c.to}]`);
    });
    // marked points: where the table says, and on the curves the table says
    expect(m.circles.map((c) => c.name).sort(), `${id}: marked points`).toEqual(Object.keys(st.points).sort());
    for (const c of m.circles) {
      points += 1;
      const [wx, wy] = st.points[c.name];
      if (Math.abs(c.px - m.px(wx)) > 0.6 || Math.abs(c.py - m.py(wy)) > 0.6) problems.push(`${id}/${c.name}: drawn at (${c.x.toFixed(2)}, ${c.y.toFixed(2)}) not at (${wx}, ${wy})`);
      for (const k of st.on[c.name]) if (Math.abs(st.curves[k].f(wx) - wy) > 1e-9) problems.push(`${id}/${c.name}: (${wx}, ${wy}) is not on curve ${k}`);
    }
    // a guide line is a dashed line across the whole picture, at the value its label names
    const hs = m.guides.filter((l) => l.y1 === l.y2);
    expect(m.guides.length, `${id}: guide lines`).toBe(Object.keys(st.hlines ?? {}).length);
    expect(hs.length, `${id}: horizontal guide lines`).toBe(Object.keys(st.hlines ?? {}).length);
    for (const { y } of Object.values(st.hlines ?? {})) {
      const l = hs.find((v) => Math.abs(v.y1 - m.py(y)) < 0.6);
      if (!l) problems.push(`${id}: no horizontal guide line at y = ${y}`); else if (Math.abs(l.x1 - m.px(g.xmin)) > 0.6 || Math.abs(l.x2 - m.px(g.xmax)) > 0.6) problems.push(`${id}: the guide at y = ${y} does not cross the picture`);
    }
    // the marked points on a guide line are exactly where the curve meets it (none missing, none extra)
    for (const [name, { y: k }] of Object.entries(st.hlines ?? {})) {
      const onLine = Object.entries(st.points).filter(([, p]) => Math.abs(p[1] - k) < 5e-4).map(([n]) => n);
      if (onLine.length === 0) continue;
      const meets = sols((x) => st.curves[0].f(x) - k, st.curves[0].from + 1e-9, st.curves[0].to).map((v) => Math.round(v * 1e4) / 1e4);
      const markedX = onLine.map((n) => Math.round(st.points[n][0] * 1e4) / 1e4).sort((a, b) => a - b);
      if (JSON.stringify(markedX) !== JSON.stringify(meets)) problems.push(`${id}: the marked points on ${name} are ${markedX}, but the curve meets the line at ${meets}`);
    }
    // segments: a solid line from a to b
    expect(m.segLines.length, `${id}: segments`).toBe(Object.keys(st.segs ?? {}).length);
    for (const s of Object.values(st.segs ?? {})) {
      const l = m.segLines.find((v) => Math.abs(v.x1 - m.px(s.a[0])) < 0.6 && Math.abs(v.y1 - m.py(s.a[1])) < 0.6 && Math.abs(v.x2 - m.px(s.b[0])) < 0.6 && Math.abs(v.y2 - m.py(s.b[1])) < 0.6);
      if (!l) problems.push(`${id}: no segment from (${s.a}) to (${s.b})`);
    }
    // a shaded region: its drawn polygon has the area the page says (measured in graph units)
    expect(m.regions.length, `${id}: shaded regions`).toBe((st.regions ?? []).length);
    (st.regions ?? []).forEach((r, i) => {
      const area = shoelace(m.regions[i]);
      if (Math.abs(area - r.area) > 0.01 * r.area) problems.push(`${id}: ${r.label} is drawn with area ${area.toFixed(3)} but should be ${r.area.toFixed(3)}`);
    });
    // the small arc at O is a fifth of the radius, and its label is on the bisector
    for (const t of Object.values(st.tags ?? {})) {
      expect(Math.atan2(t.at[1], t.at[0]), id).toBeCloseTo(t.theta / 2, 9);
      expect(Math.hypot(t.at[0], t.at[1]), id).toBeCloseTo(0.6 * t.r, 9);
    }
    // a tangent graph has its asymptotes where cos x = 0: the drawn curve is in separate pieces
    if (st.tan) expect(m.paths[0].pieces.length, `${id}: pieces of the tangent`).toBe(3);
    // the sector pictures: both radii have the length the labels say, and the angle at O is the angle the label says
    if (id === 'radians-arc' || id === 'radians-sector' || id === 'radians-q-sector') {
      const [a, b] = [st.points.a ?? [Number(st.segs!.oa.b[0]), 0], st.points.b ?? st.segs!.ob.b];
      const r = Math.hypot(a[0], a[1]);
      expect(Math.hypot(b[0], b[1]), id).toBeCloseTo(r, 9);
      expect(Math.atan2(b[1], b[0]), id).toBeCloseTo({ 'radians-arc': 1.2, 'radians-sector': 1.5, 'radians-q-sector': 0.9 }[id]!, 9);
    }
    // the tangent picture: the tangent at A is at right angles to OA, and B and T are on the line from O at the angle pi/6
    if (id === 'radians-q-tangent') {
      expect(st.segs!.at.b[0] - st.segs!.at.a[0]).toBe(0);
      expect(Math.atan2(tanT, 12)).toBeCloseTo(PI / 6, 12);
      expect(Math.atan2(st.points.b[1], st.points.b[0])).toBeCloseTo(PI / 6, 12);
    }
  }
  expect(points).toBeGreaterThan(30);
  expect(problems).toEqual([]);
});

test('every label says its own point, and is nearest its own item and 4px clear of every other label', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/radians.mjs');
  const problems: string[] = [];
  let labelled = 0;
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const g = (GEOM as Record<string, Geom>)[id];
    const st = STATED[id];
    const m = measure(svg, g);
    const items: { name: string; point: boolean; at: (px: number, py: number) => number }[] = [
      ...m.circles.map((c) => ({ name: c.name, point: true, at: (qx: number, qy: number) => Math.hypot(qx - c.px, qy - c.py) })),
      ...Object.entries(st.hlines ?? {}).map(([name, h]) => ({ name, point: false, at: (_qx: number, qy: number) => Math.abs(qy - m.py(h.y)) })),
      ...Object.entries(st.tags ?? {}).map(([name, t]) => ({ name, point: false, at: (qx: number, qy: number) => Math.hypot(qx - m.px(t.at[0]), qy - m.py(t.at[1])) })),
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
      if (st.points[l.for]) { if (l.text !== st.labels[l.for]) problems.push(`${id}: the label "${l.text}" is not "${st.labels[l.for]}" for "${l.for}"`); }
      else if (st.hlines?.[l.for]) { if (l.text !== st.hlines[l.for].text) problems.push(`${id}: the guide label "${l.text}" is not "${st.hlines[l.for].text}"`); }
      else if (st.tags?.[l.for]) {
        const t = st.tags[l.for];
        if (l.text !== t.text) problems.push(`${id}: the angle label "${l.text}" is not "${t.text}"`);
        // the label's centre is inside the sector: between the two radii (angle strictly between 0 and theta) and nearer O than the arc
        const gx = m.toX(cx);
        const gy = m.toY(cy);
        const ang = Math.atan2(gy, gx);
        if (!(ang > 0.02 && ang < t.theta - 0.02)) problems.push(`${id}: the angle label "${l.text}" is at angle ${ang.toFixed(3)}, not between the radii (0 and ${t.theta.toFixed(3)})`);
        if (Math.hypot(gx, gy) >= t.r) problems.push(`${id}: the angle label "${l.text}" is outside the circle`);
      }
      else if (st.segs?.[l.for]) { if (l.text !== st.segs[l.for].text) problems.push(`${id}: the segment label "${l.text}" is not "${st.segs[l.for].text}"`); }
      // a label never sits on a curve or a segment: their drawn points stay out of the label's box
      const box = { name: l.text, x0: cx - width / 2, x1: cx + width / 2, y0: l.y - 26, y1: l.y + 8 };
      boxes.push(box);
      for (const [k, c] of st.curves.entries()) {
        for (let i = 0; i <= 6000; i += 1) {
          const x = c.from + ((c.to - c.from) * i) / 6000;
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
    if (st.points.o) expect(m.labels.find((l) => l.for === 'o')?.text, `${id}: the centre is labelled O`).toBe('O');
    // every marked point, guide line and labelled segment has a label (and an unlabelled segment has none)
    for (const name of [...Object.keys(st.points), ...Object.keys(st.tags ?? {}), ...Object.keys(st.hlines ?? {}), ...Object.entries(st.segs ?? {}).filter(([, s]) => s.text !== '').map(([n]) => n)]) if (!m.labels.some((l) => l.for === name)) problems.push(`${id}: "${name}" has no label`);
    for (const [name, s] of Object.entries(st.segs ?? {})) if (s.text === '' && m.labels.some((l) => l.for === name)) problems.push(`${id}: the unlabelled segment "${name}" has a label`);
  }
  expect(labelled).toBeGreaterThan(40);
  expect(problems).toEqual([]);
});

test('every figure states every marked coordinate, label and guide line in its text alternative, and a question figure does not give the answer', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/radians.mjs');
  const problems: string[] = [];
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const title = decode(/<title id="[^"]*">([^<]*)<\/title>/.exec(svg)?.[1] ?? '');
    const desc = decode(/<desc id="[^"]*">([^<]*)<\/desc>/.exec(svg)?.[1] ?? '');
    const st = STATED[id];
    for (const [name, [x, y]] of Object.entries(st.points)) {
      if (x === 0 && y === 0) { if (!/origin|\(0, 0\)/.test(desc)) problems.push(`${id}: the description does not place the origin point "${name}"`); continue; }
      const coords = `(${t3(x)}, ${t3(y)})`;
      if (st.silent?.includes(name)) { if (desc.includes(coords)) problems.push(`${id}: the description gives away the point "${name}" ${coords}`); }
      else if (!desc.includes(coords)) problems.push(`${id}: the description does not name the point ${coords}`);
    }
    for (const t of Object.values(st.tags ?? {})) if (!desc.includes(t.text)) problems.push(`${id}: the description does not mention the angle label "${t.text}"`);
    if (st.points.o && !/small dashed arc/.test(desc)) problems.push(`${id}: the description does not mention the small arc at O`);
    for (const [name, text] of Object.entries(st.labels)) if (!desc.includes(text)) problems.push(`${id}: the description does not mention the label "${text}" of "${name}"`);
    for (const h of Object.values(st.hlines ?? {})) if (!desc.includes(h.text)) problems.push(`${id}: the description does not name ${h.text}`);
    for (const s of Object.values(st.segs ?? {})) if (s.text !== '' && !desc.includes(s.text)) problems.push(`${id}: the description does not mention the segment label "${s.text}"`);
    if (desc.length < 80) problems.push(`${id}: the description is too short`);
    if (id.includes('-q-')) {
      // the answers to the questions with figures: 7.2 (and its slips 3.6, 8.9), 0.927 and 2.21, 2pi, 4 root 3 (6.93), 3.87
      expect(`${title} ${desc}`, id).not.toMatch(/7\.2|3\.6|8\.9|0\.927|2\.21|5\.36|6\.28|6\.93|4\s*root|3\.87|37\.7|41\.5|41\.6|answer|solution/i);
      expect(SOURCE, id).toContain(`{fig:${id}}`);
    }
  }
  expect(problems).toEqual([]);
  expect(Object.keys(FIGURES).filter((k) => k.includes('-q-')).sort()).toEqual(['radians-q-sector', 'radians-q-sin-line', 'radians-q-tangent']);
  // each question figure follows its question text straight away, and no lesson figure sits inside a question
  for (const q of questions()) {
    const fig = /\{fig:([a-z0-9-]+)\}/.exec(q.block.split('<div class="solution">')[0])?.[1];
    if (fig) { expect(fig).toContain('-q-'); expect(q.block).toMatch(/<\/p>\s*<figure class="qfig-lg">\{fig:/); }
  }
});

test('at 320px every figure label is at least 12px tall', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/radians.html');
  const small = await page.evaluate(() => [...document.querySelectorAll('main svg.graph-svg text')].map((t) => ({ s: t.textContent, h: t.getBoundingClientRect().height })).filter((t) => t.h > 0 && t.h < 12).map((t) => t.s + ' ' + t.h.toFixed(1)));
  expect(small).toEqual([]);
});

test('at 320px every figure label is 4px clear of every other label', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/radians.html');
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

test('every figure with a marked point O has a small arc and an angle label inside the sector', async () => {
  const { ITEMS, FIGURES } = await import('../src/book/alevel/figures/radians.mjs');
  for (const make of Object.values(FIGURES) as (() => string)[]) make();
  for (const [id, st] of Object.entries(STATED)) {
    if (!st.points.o) continue;
    const tags = (ITEMS as Record<string, { kind: string; name: string }[]>)[id].filter((i) => i.kind === 'tag');
    expect(tags.map((t) => t.name), id).toEqual(['ang']);
    expect(st.curves.some((c) => c.cls === 'curve-b'), id).toBe(true);
  }
});

test('every figure on the page exists, is used once, and every figure file entry is used', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/radians.mjs');
  const used = [...SOURCE.matchAll(/\{fig:([a-z0-9-]+)\}/g)].map((m) => m[1]);
  expect(new Set(used).size).toBe(used.length);
  expect([...used].sort()).toEqual(Object.keys(FIGURES).sort());
});

test('no figure text leaves its picture', async ({ page }) => {
  await page.goto('/courses/a-level/radians.html');
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

test('the tangent figure description says three pieces, and three pieces are drawn', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/radians.mjs');
  const svg = (FIGURES as Record<string, () => string>)['radians-tan-graph']();
  const desc = decode(/<desc id="[^"]*">([^<]*)<\/desc>/.exec(svg)?.[1] ?? '');
  const pieces = (/<path class="curve" d="([^"]*)"/.exec(svg)?.[1] ?? '').split('M').filter(Boolean).length;
  expect(pieces).toBe(3);
  expect(desc).toContain(`in three pieces separated by vertical asymptotes at ${PIC}/2 and 3${PIC}/2`);
  expect(desc).toContain(`climbs from far below through 0 at ${PIC}`);
  expect([PI / 2, (3 * PI) / 2].map((x) => Math.abs(Math.cos(x)) < 1e-12)).toEqual([true, true]);
  expect([0, PI, 2 * PI].map((x) => Math.abs(Math.tan(x)) < 1e-12)).toEqual([true, true, true]);
});

// ---------- the page's shape, scope and wording ----------
test('every numbered lesson section has a Key idea box and a faded "Now you finish it" example, and the page asks for the calculator', () => {
  const lessons = SOURCE.split('<section').filter((sec) => /<h2>\d+\./.test(sec));
  expect(lessons.length).toBe(7);
  for (const sec of lessons) {
    const name = /<h2>([^<]*)<\/h2>/.exec(sec)?.[1];
    expect(sec, `${name}: a Key idea box`).toContain('class="key"');
    expect(sec, `${name}: a worked example`).toContain('class="worked"');
    expect(sec, `${name}: a faded example`).toContain('class="worked faded"');
  }
  expect(SOURCE.startsWith('<main class="book strand-al-trigonometry" data-book-page="topic" data-topic="radians" data-calc="scientific">')).toBe(true);
  expect(SOURCE.match(/data-calc=/g)?.length).toBe(1);
  expect(SOURCE).toContain('<span class="eyebrow">Trigonometry &middot; Year 2</span>');
});

test('the skip link goes to the first lesson heading (heading ids are cut at 40 characters)', () => {
  const first = /<h2>(1\.[^<]*)<\/h2>/.exec(SOURCE)![1];
  const id = `s-${plain(first).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`;
  expect(SOURCE).toContain(`href="#${id}"`);
});

test('the page builds on Trigonometric graphs and exact values, links it in the first Key box and the warm-up, and the title and words match the topic graph', async () => {
  const { TOPICS } = await import('../src/book/alevel/topics.mjs');
  const { GLOSSARY } = await import('../src/book/alevel/glossary.mjs');
  const topic = (TOPICS as { id: string; title: string; needs: string[]; status: string; year: number; words: string[] }[]).find((t) => t.id === 'radians')!;
  expect(topic.status).toBe('live');
  expect(topic.year).toBe(2);
  expect(topic.needs).toEqual(['trig-graphs']);
  expect(topic.title).toBe('Radians, arcs and sectors');
  expect(SOURCE).toContain('<h1>Radians, arcs and sectors</h1>');
  const firstKey = /<div class="key">([\s\S]*?)<\/div>/.exec(SOURCE)![1];
  expect(firstKey).toContain('href="trig-graphs.html"');
  const warm = /<h2>Warm-up[\s\S]*?<\/section>/.exec(SOURCE)![0];
  expect((warm.match(/href="trig-graphs\.html/g) ?? []).length).toBeGreaterThanOrEqual(2);
  // the Year 1 pages say "radians come in Radians, arcs and sectors": the title they name is this page's title
  for (const f of ['trig-graphs']) expect(readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', `${f}.html`), 'utf8'), f).toContain(topic.title);
  // every word in the strip is a real glossary term, and the three new terms are written in full
  const ids = new Set((GLOSSARY as { id: string }[]).map((g) => g.id));
  for (const w of topic.words) expect(ids.has(w), w).toBe(true);
  for (const w of ['central-angle', 'radian-mode', 'in-terms-of-pi']) {
    const g = (GLOSSARY as { id: string; level: string; watch?: string; example: unknown }[]).find((x) => x.id === w)!;
    expect(g.level, w).toBe('Y2');
    expect(g.watch, w).toBeTruthy();
    expect(topic.words, w).toContain(w);
  }
  // every {term:id} on the page exists
  for (const m of SOURCE.matchAll(/\{term:([a-z0-9-]+)/g)) expect(ids.has(m[1]), m[1]).toBe(true);
});

test('multiple-choice options are plain text: no maths markup and no spoken fractions', () => {
  for (const ul of SOURCE.matchAll(/<ul class="options">([\s\S]*?)<\/ul>/g)) {
    expect(ul[1]).not.toMatch(/\{m:|\{md:/);
    expect(plain(ul[1])).not.toMatch(/\bover\b|\broot \d/i);
  }
});

test('the formulae are marked Learn or Given, and the page says what the markers mean', () => {
  const text = plain(SOURCE);
  expect(text).toContain('A formula marked [Learn] is not on the exam formula sheet, so you must remember it. A formula marked [Given] is on the sheet, so you must know how to use it.');
  expect((SOURCE.match(/<b>\[Learn\]<\/b>/g) ?? []).length).toBe(3); // two key ideas and the reminder
  expect((SOURCE.match(/<b>\[Given\]<\/b>/g) ?? []).length).toBe(2); // one key idea and the reminder
  expect(SOURCE).toMatch(/<b>Key idea:<\/b> arc length\. <b>\[Learn\]<\/b>/);
  expect(SOURCE).toMatch(/<b>Key idea:<\/b> area of a sector\. <b>\[Learn\]<\/b>/);
  expect(SOURCE).toMatch(/<b>Key idea:<\/b> the small-angle approximations\. <b>\[Given\]<\/b>/);
  expect(text).toContain('The segment formula is not on the formula sheet, so build it from the sector and the triangle each time.');
});

test('the page states the conditions on each general rule exactly', () => {
  const text = plain(SOURCE);
  expect(text).toContain('s=r theta, where s is the arc length, r is the radius and theta is the angle at the centre in radians. The radius r is positive, and theta is between 0 and 2*pi.');
  expect(text).toContain('A=frac(1, 2) r^2 theta, where A is the area, r is the radius and theta is the angle at the centre in radians. The radius r is positive, and theta is between 0 and 2*pi.');
  expect(text).toContain('Here theta is in radians and between 0 and pi, so that the segment is the smaller part of the circle.');
  expect(text).toContain('for theta between 0 and 2*pi.');
  expect(text).toContain('For sine and cosine, k must be between -1 and 1 (including both). If it is not, there are no solutions.');
  expect(text).toContain('where n is any whole number: positive, negative or zero.');
  expect(text).toContain('For a small angle theta, in radians:');
  expect(text).toContain('The smaller theta is, the better the approximation. They only work in radians.');
  expect(text).toContain('If the angle is in degrees, change it to radians first.');
  expect(text).toContain('At A-level, an angle written without a degree sign, such as theta=2, is in radians.');
  expect(text).toContain('If theta is above 2*pi or below 0, add or subtract 2*pi until it is between 0 and 2*pi.');
  expect(text).toContain('In quadrant 2 it is pi-theta. In quadrant 3 it is theta-pi. In quadrant 4 it is 2*pi-theta.');
  expect(text).toContain('Sine uses alpha and pi-alpha. Cosine uses alpha and 2*pi-alpha in an interval from 0 to 2*pi. Tangent uses alpha and alpha+pi.');
  expect(text).toContain('A segment has no radii on its boundary: its boundary is the arc and the chord.');
  expect(text).toContain('Both need theta in radians.');
  expect(text).toContain('When sin x=1 or sin x=-1, and when cos x=1 or cos x=-1, the two solutions in each turn are the same angle. There is one solution in each turn, not two.');
  expect(text).toContain('Keep the whole sum inside the brackets of sin.');
  expect(text).toContain('Type theta for theta.');
  expect(text).toContain('A small angle means one close to 0, such as 0.1 or 0.2. At 1 radian the approximations are poor.');
  expect(text).toContain('The segment is much smaller than the sector, because the chord stays close to the arc.');
  expect(text).toContain('a number that divides neatly');
  expect((text.match(/cancels because theta is not 0/g) ?? []).length).toBe(3);
});

test('the corrected rule sentences are pinned, and each is true', () => {
  const text = plain(SOURCE);
  // the second solution of cosine in 0..2pi is 2pi - alpha, which is the same as -alpha plus a full turn
  for (const a of [0.3, 1, 1.4]) expect(Math.cos(2 * PI - a)).toBeCloseTo(Math.cos(-a), 12);
  expect(text).toContain('For cos x=k it is -alpha, which is 2*pi-alpha in an interval from 0 to 2*pi.');
  // an angle written with no degree sign is read as radians: sin 30 is -0.988, not 0.5
  expect(text).toContain('In radian mode, sin 30 means the sine of 30 radians, which is -0.988.');
  // the calculator on this page: degrees only, and the page tells the student how to use it for radians
  expect(text).toContain('The calculator on this page works in degrees only.');
  expect(text).toContain('Type sin(x * 180 / \u03c0) for sin x.');
  // the half-turn and full-turn traps
  expect(text).toContain('A half turn is pi, and a full turn is 2*pi.');
  expect(text).toContain('Rounding pi to 3.14 early in a question.');
  // the chord comes from half the angle
  expect(text).toContain('The half-chord is opposite that angle, so it is r sin(frac(theta, 2)).');
  // the squeeze: the sector lies between the two triangles
  expect(text).toContain('As theta gets close to 0, cos theta gets close to 1, so frac(theta, sin theta) is squeezed close to 1.');
  // the future results the page names
  expect(text).toContain('In Differentiating standard functions you will show that the derivative of sin x is cos x. That is only true when x is in radians');
  expect(text).toContain('Maclaurin series');
  expect(text).toContain('Proofs you should be able to write.');
  expect(text).toContain('Where this goes next');
  // the Maclaurin terms it names: x - x^3/6 is the next term of sin x, and 1 - x^2/2 of cos x (checked at a small x)
  expect(Math.sin(0.1)).toBeCloseTo(0.1 - 0.1 ** 3 / 6, 6);
  expect(Math.cos(0.1)).toBeCloseTo(1 - 0.1 ** 2 / 2, 4);
  // cos(theta) = 1 - 2 sin^2(theta/2), the identity named in "Why it works"
  for (const th of [0.2, 1, 2.4]) expect(Math.cos(th)).toBeCloseTo(1 - 2 * Math.sin(th / 2) ** 2, 12);
  for (const th of [0.01, 0.1]) expect(1 - 2 * (th / 2) ** 2).toBeCloseTo(1 - th ** 2 / 2, 12);
});

test('the page keeps to its scope: no reciprocal or inverse functions, no differentiation or integration taught', () => {
  const text = plain(SOURCE.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<p class="where-use">[\s\S]*?<\/p>/, ' ').replace(/<li><b>Why \{m:cos[\s\S]*?<\/li>/, ' ').replace(/<h2>Where this goes next[\s\S]*?\{unlocks\}/, ' '));
  expect(text).not.toMatch(/\bsec\b|cosec|\bcot\b|double.angle|addition formula|compound angle|differentiat|derivative|integrat|Newton/i);
});

test('the on-page calculator works in degrees, and the way the page tells students to use it for radians gives the radian answer', async () => {
  const { calculate, SCIENTIFIC } = await import('../public/js/book-calc-engine.mjs');
  const calc = (t: string) => (calculate(t, { profile: SCIENTIFIC }) as { ok: boolean; value: number }).value;
  // degrees only: sin(30) is 0.5, not -0.988
  expect(calc('sin(30)')).toBeCloseTo(0.5, 12);
  expect(calc('sin(30)')).not.toBeCloseTo(Math.sin(30), 2);
  // the page's tip: sin(x * 180 / pi) gives the radian sine
  for (const x of [0.8, 1, 2]) {
    expect(calc(`sin(${x}\u00d7180\u00f7\u03c0)`)).toBeCloseTo(Math.sin(x), 9);
    expect(calc(`cos(${x}\u00d7180\u00f7\u03c0)`)).toBeCloseTo(Math.cos(x), 9);
  }
  expect(sf(calc('sin(0.8\u00d7180\u00f7\u03c0)'))).toBe(0.717);
  expect(sf(calc('cos(2\u00d7180\u00f7\u03c0)'))).toBe(-0.416);
  expect(sf(calc('sin(1\u00d7180\u00f7\u03c0)'))).toBe(0.841);
  // the inverse sine gives degrees: multiply by pi/180 for radians (the hint of the sin x = 0.8 question)
  expect(calc('asin(0.8)')).toBeCloseTo(Math.asin(0.8) / RAD, 9);
  expect(calc('asin(0.8)\u00d7\u03c0\u00f7180')).toBeCloseTo(Math.asin(0.8), 9);
});

test('a length, an area or an exact value is refused when it is typed with rad or radians; an angle is accepted', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const qs = questions();
  const blanks = [...SOURCE.matchAll(/class="blank" data-answers="([^"]*)"/g)].map((m) => decode(m[1]).split(';'));
  const lengths: [string, string[], string[]][] = [
    ['the arc, 4pi cm', qs.find((q) => q.plain.includes('Find the exact arc length'))!.answers, ['4pi', '4pi cm']],
    ['the area, 6pi cm', qs.find((q) => q.plain.includes('Find its exact area'))!.answers, ['6pi', '6pi cm^2']],
    ['the exam arc, 2pi cm', qs.find((q) => q.plain.includes('exact length of the arc AB'))!.answers, ['2pi']],
    ['the sector blank, 8pi/3', blanks[8], ['8pi/3']],
  ];
  expect(blanks[8].some((k) => /pi\/3|\u03c0\/3/.test(k))).toBe(true);
  for (const [name, keys, good] of lengths) {
    for (const g of good) expect(matches(g, keys, 'exact'), `${name}: "${g}" is right`).toBe(true);
    for (const base of good.filter((g) => !/cm/.test(g))) {
      const alt = base.replace('pi', '\u03c0');
      for (const bad of [`${base} radians`, `${base} rad`, `${alt} rad`, `${alt} radians`, `${base}radians`]) expect(matches(bad, keys, 'exact'), `${name}: "${bad}" is refused`).toBe(false);
    }
  }
  // an angle takes the units, and so does the period
  for (const q of ['Write 120\u00b0 in radians', 'Write 112.5\u00b0 in radians', 'period of y=sin x']) {
    const keys = qs.find((x) => x.plain.includes(q))!.answers;
    const first = keys[0];
    expect(matches(`${first} rad`, keys, 'exact'), q).toBe(true);
    expect(matches(`${first} radians`, keys, 'exact'), q).toBe(true);
  }
  expect(blanks[0].every((k) => !/rad/.test(k))).toBe(true); // 7/6 is a number, not an angle with a unit
  expect(blanks[1].some((k) => /radians$/.test(k))).toBe(true); // 210 degrees in radians: an angle
});

test('the ways a student types an answer are accepted, and a wrong one is not', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const qs = questions();
  const get = (find: string) => qs.find((q) => q.plain.includes(find))!;
  const ctx = (q: Question) => `${q.plain} ${q.solution}`;
  const yes = (q: Question, typed: string[]) => { for (const t of typed) expect(matches(t, q.answers, q.mode, ctx(q)), `"${t}" should be accepted for: ${q.plain.slice(0, 50)}`).toBe(true); };
  const no = (q: Question, typed: string[]) => { for (const t of typed) expect(matches(t, q.answers, q.mode, ctx(q)), `"${t}" should be refused for: ${q.plain.slice(0, 50)}`).toBe(false); };
  // an angle in terms of pi
  const five8 = get('Write 112.5\u00b0 in radians');
  yes(five8, ['5pi/8', '5\u03c0/8', '(5pi)/8', '(5/8)pi', '5pi/8 rad', '5pi/8 radians', '5 pi/8', '5PI/8', 'x=5pi/8']);
  no(five8, ['pi/8', '5pi/6', '112.5pi', '1.96', '5/8', '']);
  const piOver = get('Write 120\u00b0 in radians');
  yes(piOver, ['2pi/3', '2\u03c0/3', '(2pi)/3', '(2/3)pi', '2pi/3 rad']);
  no(piOver, ['pi/3', '3pi/2', '2.09']);
  const one = get('Find its circumference in terms of pi');
  yes(one, ['10pi', '10\u03c0', '10pi cm', '10 pi']);
  no(one, ['25pi', '10', '31.4', 'pi']);
  // a list of two answers in terms of pi, in either order, with the usual separators
  const pair = get('Solve cos x=frac(1, 2)');
  yes(pair, ['pi/3 or 5pi/3', '5pi/3 or pi/3', 'pi/3, 5pi/3', 'pi/3,5pi/3', 'pi/3 and 5pi/3', 'x=pi/3 or x=5pi/3', '\u03c0/3 or 5\u03c0/3', 'x = pi/3 or x = 5pi/3']);
  no(pair, ['pi/3', '5pi/3', 'pi/3 or 2pi/3', 'pi/3 or 5pi/3 or 0', '']);
  // a list of decimals
  const dec = get('Solve sin x=0.8');
  yes(dec, ['0.927 or 2.21', '2.21 or 0.927', '0.927, 2.21', '0.927,2.21', 'x=0.927 or x=2.21', '2.21 and 0.927', '0.927 2.21']);
  no(dec, ['0.927', '2.21', '0.93 or 2.21', '0.927 or 5.36']);
  // a surd
  const surd = get('exact value of sin(frac(5*pi, 3))');
  yes(surd, ['-sqrt(3)/2', '-sqrt3/2', '-\u221a3/2', '-(sqrt(3))/2', '-(sqrt3)/2', '-0.5sqrt(3)', '\u2212sqrt(3)/2']);
  no(surd, ['sqrt(3)/2', '-1/2', '-0.866', '-sqrt(3)']);
  const root = get('exact length of AT');
  yes(root, ['4sqrt(3)', '4sqrt3', '4\u221a3', '4*sqrt(3)', '4 sqrt(3) cm']);
  no(root, ['12/sqrt(3)', '6.93', '4', '12sqrt(3)']);
  // a number with a unit, and with a degree sign
  const arc = get('Find the length of the arc of this sector');
  yes(arc, ['7.2', '7.2 cm', '7.20']);
  no(arc, ['72', '0.72', '']);
  const deg = get('Write frac(5*pi, 6) radians in degrees');
  yes(deg, ['150', '150\u00b0', '150 degrees', '150deg']);
  no(deg, ['2.62', '5pi/6']);
  // fractions and decimals that mean the same
  const frac = get('frac(tan(2*theta), sin(3*theta))');
  yes(frac, ['2/3', '4/6']);
  no(frac, ['3/2', '0.67']);
});
