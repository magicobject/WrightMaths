import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Proof by contradiction page that a general test cannot make. The page is full of claims about numbers
// ("30031 is 59 times 509", "no integers solve 14m + 21n = 1", "these slips are wrong"), so each one is recomputed here
// by brute force, never retyped from the page:
//   - every typed key is RECOMPUTED from the maths, and every wrong-answer value is recomputed from the slip its message names;
//   - every multiple-choice key is checked, and every fact its reasons rely on is checked by computation;
//   - every blank in a "Now you finish it" box is recomputed;
//   - every general rule the lessons state is checked against a brute-force search, with its conditions;
//   - each figure is read back from its SVG: the square really is square with a diagonal of length root 2, the number-line points
//     are where the page says, every label is nearest its own item, and the text alternatives state every coordinate.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'proof-contradiction.html'), 'utf8');
const SQRT = String.fromCharCode(0x221a);

// ---------- number theory, written here and not taken from the page or the figure code ----------
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const spf = (n: number) => { for (let d = 2; d * d <= n; d += 1) if (n % d === 0) return d; return n; };
const isPrime = (n: number) => n > 1 && spf(n) === n;
const primes = (count: number) => { const out: number[] = []; for (let n = 2; out.length < count; n += 1) if (isPrime(n)) out.push(n); return out; };
const isSquare = (n: number) => Number.isInteger(Math.sqrt(n));
const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const euclid = (count: number) => primes(count).reduce((a, p) => a * p, 1) + 1;

// ---------- reading the page's questions ----------
const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', ldquo: '"', rdquo: '"', rsquo: "'", lsquo: "'", nbsp: ' ', times: '*', sup2: '^2', hellip: '...', middot: '.', le: '<=', ge: '>=', radic: 'sqrt', rArr: '=>', hArr: '<=>', there4: 'therefore' };
const decode = (t: string) => t.replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n] ?? m);
// a "<" inside {m:...} is maths (a<=5), not a tag: protect it before the tags are removed
const plain = (h: string) => decode(h.replace(/\{term:([^}|]+)\|?([^}]*)\}/g, (_, id, t) => t || id.replace(/-/g, ' ')).replace(/\{m:([^}]*)\}/g, (_, t: string) => t.replace(/</g, '&lt;')).replace(/<[^>]+>/g, '').replace(/\{m:/g, '').replace(/\}/g, '')).replace(/\s+/g, ' ').trim();

const numberOf = (s: string) => { const m = /^(-?[\d.]+)\/([\d.]+)$/.exec(s.trim()); return m ? Number(m[1]) / Number(m[2]) : Number(s); };
const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

type Wrong = { values: string[]; text: string; claimed: boolean };
type Question = { plain: string; mode: string; type: string; answers: string[]; wrongs: Wrong[]; hints: string[]; block: string; marks: number | null; markscheme: string[] };
function questions(): Question[] {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongList = /<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '';
    const wrongs = [...wrongList.matchAll(/<li data-if="([^"]*)">([\s\S]*?)<\/li>/g)].map((m) => ({ values: decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean), text: m[2], claimed: false }));
    const hints = [...(/<ol class="ladder">([\s\S]*?)<\/ol>/.exec(block)?.[1] ?? '').matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => plain(m[1]));
    const marks = /data-marks="(\d+)"/.exec(attrs)?.[1];
    const markscheme = [...(/<ul class="markscheme">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '').matchAll(/<li><b>([A-Z]+\d*)<\/b>/g)].map((m) => m[1]);
    return { plain: plain(/<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? ''), mode: /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? 'value', type: /data-type="([^"]*)"/.exec(attrs)?.[1] ?? 'typed', answers, wrongs, hints, block, marks: marks ? Number(marks) : null, markscheme };
  });
}

// ---------- polynomial answers: read a typed form such as 2k(k+1) as a function of k ----------
const poly = (expr: string) => {
  const js = expr.replace(/\s+/g, '').replace(/\^/g, '**').replace(/(\d|\))(?=[a-z(])/g, '$1*').replace(/([a-z])(?=\()/g, '$1*');
  return (k: number) => Function('k', `"use strict"; return (${js});`)(k) as number;
};
const SAMPLE_K = range(-6, 6);
const samePoly = (expr: string, f: (k: number) => number) => SAMPLE_K.every((k) => close(poly(expr)(k), f(k)));

// ---------- the typed keys, each recomputed ----------
type Slip = { value: string; says: RegExp; check: () => boolean };
type Check = { find: string; answer: string; alg?: (k: number) => number; slips?: Slip[]; also?: () => boolean };

const n20 = range(1, 20);
const evenOrThree = (n: number) => n % 2 === 0 || n % 3 === 0;
const nonSquareRoots = range(2, 30).filter((n) => !isSquare(n));
// numbers of the form a + b * sqrt(n): rational exactly when b is 0 or n is a square number
const irrational = (a: number, b: number, n: number) => b !== 0 && !isSquare(n) && (void a, true);
const FIVE = [
  { text: 'sqrt(2)+1', a: 1, b: 1, n: 2 },
  { text: 'sqrt(9)', a: 0, b: 1, n: 9 },
  { text: '2*sqrt(3)', a: 0, b: 2, n: 3 },
  { text: '(sqrt(2))^2', a: 2, b: 0, n: 1 }, // (root 2) squared is 2
  { text: 'sqrt(2)*sqrt(8)', a: 0, b: 1, n: 16 }, // root 2 times root 8 is root 16
];
const irrationalCount = FIVE.filter((x) => irrational(x.a, x.b, x.n)).length;
const squaresMod = (m: number) => new Set(range(0, 60).map((n) => (n * n) % m));
// the integers m, n with 6m + 9n = c, searched over a wide box
const makeable6_9 = (c: number) => range(-40, 40).some((m) => range(-40, 40).some((n) => 6 * m + 9 * n === c));
const gridGcd = range(-20, 20).flatMap((m) => range(-20, 20).map((n) => 14 * m + 21 * n)).filter((v) => v !== 0).reduce((g, v) => gcd(g, v), 0);
const frac375 = (() => { const g = gcd(375, 1000); return [375 / g, 1000 / g]; })();
const N360 = 2 ** 3 * 3 ** 2 * 5 + 1;

const CHECKS: Check[] = [
  { find: 'Expand (2k+1)^2.', answer: '4k^2+4k+1', alg: (k) => (2 * k + 1) ** 2, slips: [
    { value: '4k^2+1', says: /left out the middle term/, check: () => samePoly('4k^2+1', (k) => (2 * k) ** 2 + 1 ** 2) && !samePoly('4k^2+1', (k) => (2 * k + 1) ** 2) },
    { value: '2k^2+4k+1', says: /\(2k\)\^2 is 4k\^2, not 2k\^2/, check: () => samePoly('2k^2+4k+1', (k) => 2 * k * k + 2 * (2 * k) + 1) && !samePoly('2k^2+4k+1', (k) => (2 * k + 1) ** 2) },
  ] },
  { find: 'Find the smallest prime number that divides 91.', answer: String(spf(91)), slips: [
    { value: '13', says: /does divide 91, but it is not the smallest/, check: () => 91 % 13 === 0 && 13 !== spf(91) },
    { value: '1', says: /1 is not a prime number/, check: () => !isPrime(1) },
  ] },
  { find: '(2a+1)+(2b+1)=2(a+b+k). Find k.', answer: String(((2 * 3 + 1) + (2 * 8 + 1)) / 2 - (3 + 8)), slips: [
    { value: '0', says: /1 and 1. They add to 2/, check: () => 2 * (3 + 8 + 0) !== (2 * 3 + 1) + (2 * 8 + 1) },
    { value: '2', says: /2\(a\+b\+2\) is 2a\+2b\+4/, check: () => 2 * (3 + 8 + 2) === 2 * 3 + 2 * 8 + 4 && 2 * (3 + 8 + 2) !== (2 * 3 + 1) + (2 * 8 + 1) },
  ] },
  { find: 'A whole number has the form 3k+2', answer: String([...new Set(range(0, 30).map((k) => ((3 * k + 2) ** 2) % 3))][0]), also: () => new Set(range(-30, 30).map((k) => (((3 * k + 2) ** 2) % 3 + 3) % 3)).size === 1, slips: [
    { value: '4', says: /plain number at the end, but 4 is bigger than 3/, check: () => 2 ** 2 === 4 && 4 > 3 },
    { value: '2', says: /remainder of 3k\+2 itself is 2/, check: () => (3 * 5 + 2) % 3 === 2 },
  ] },
  { find: 'is false for some whole numbers n from 1 to 20. How many?', answer: String(n20.filter((n) => !evenOrThree(n)).length), slips: [
    { value: '13', says: /counts the numbers that make the statement true/, check: () => n20.filter(evenOrThree).length === 13 },
    { value: '10', says: /counts the odd numbers/, check: () => n20.filter((n) => n % 2 === 1).length === 10 },
  ] },
  { find: 'you assume the greatest even integer is 1000.', answer: String(1000 + 2), slips: [
    { value: '1001', says: /1001 is odd/, check: () => 1001 % 2 === 1 },
    { value: '2000', says: /doubles 1000/, check: () => 2000 === 2 * 1000 },
  ] },
  { find: 'Write the square as 2m+1, and give m in terms of k.', answer: '2k^2+2k', alg: (k) => ((2 * k + 1) ** 2 - 1) / 2, slips: [
    { value: '4k^2+4k', says: /That is 2m, the whole of the part before the \+1/, check: () => samePoly('4k^2+4k', (k) => (2 * k + 1) ** 2 - 1) && !samePoly('4k^2+4k', (k) => ((2 * k + 1) ** 2 - 1) / 2) },
    { value: '2k^2+k', says: /2\(2k\^2\+k\)\+1=4k\^2\+2k\+1, which is not \(2k\+1\)\^2/, check: () => samePoly('2*(2k^2+k)+1', (k) => 4 * k * k + 2 * k + 1) && !samePoly('2*(2k^2+k)+1', (k) => (2 * k + 1) ** 2) },
  ] },
  { find: 'how many different remainders can you get?', answer: String(new Set(range(0, 60).map((n) => (n * n) % 3)).size), slips: [
    { value: '3', says: /3 remainders for n/, check: () => new Set(range(0, 60).map((n) => n % 3)).size === 3 },
  ] },
  { find: 'have n^2 a multiple of 4 but n not a multiple of 4?', answer: String(range(1, 50).filter((n) => (n * n) % 4 === 0 && n % 4 !== 0).length), slips: [
    { value: '25', says: /counts every even n/, check: () => range(1, 50).filter((n) => n % 2 === 0).length === 25 },
    { value: '12', says: /last such integer is 50/, check: () => range(1, 48).filter((n) => (n * n) % 4 === 0 && n % 4 !== 0).length === 12 && (50 * 50) % 4 === 0 && 50 % 4 !== 0 },
  ] },
  { find: 'Work out 2b^2-a^2, with a=99 and b=70.', answer: String(2 * 70 * 70 - 99 * 99), slips: [
    { value: '1', says: /worked out a\^2-2b\^2/, check: () => 99 * 99 - 2 * 70 * 70 === 1 },
    { value: '0', says: /a\^2 would equal 2b\^2/, check: () => 99 * 99 !== 2 * 70 * 70 },
  ] },
  { find: 'Work out 577^2-2*408^2.', answer: String(577 ** 2 - 2 * 408 ** 2), slips: [
    { value: '0', says: /fraction would equal sqrt\(2\)/, check: () => 577 ** 2 !== 2 * 408 ** 2 },
    { value: '-1', says: /subtracted the other way round/, check: () => 2 * 408 ** 2 - 577 ** 2 === -1 },
  ] },
  { find: 'Write frac(84, 126) in lowest terms. What is the bottom number?', answer: String(126 / gcd(84, 126)), slips: [
    { value: '63', says: /42, 63\)|frac\(42, 63\)/, check: () => gcd(42, 63) !== 1 && 126 / 2 === 63 },
    { value: '21', says: /frac\(14, 21\)|14, 21/, check: () => gcd(14, 21) !== 1 && 126 / 6 === 21 && 84 / 6 === 14 },
  ] },
  { find: 'gives a^2=kb^2. Find k.', answer: String(Math.round(Math.sqrt(5) ** 2)), slips: [
    { value: '25', says: /Squaring sqrt\(5\) gives 5, not 25/, check: () => close(Math.sqrt(5) ** 2, 5) && 5 ** 2 === 25 },
    { value: '1', says: /greater than 1/, check: () => Math.sqrt(5) > 1 },
  ] },
  { find: 'Assume 3+sqrt(2)=frac(p, q). Then', answer: String(Math.round(3 + Math.SQRT2 - Math.SQRT2)), slips: [
    { value: '-3', says: /p\+3q, so you added 3/, check: () => 7 - 3 * 2 !== 7 + 3 * 2 },
  ] },
  { find: 'How many of them are irrational?', answer: String(irrationalCount), slips: [
    { value: '3', says: /sqrt\(2\)\*sqrt\(8\)=sqrt\(16\)=4, which is rational/, check: () => irrationalCount + 1 === 3 && isSquare(16) },
    { value: '4', says: /sqrt\(9\)=3 and \(sqrt\(2\)\)\^2=2/, check: () => irrationalCount + 2 === 4 && isSquare(9) && close(Math.SQRT2 ** 2, 2) },
  ] },
  { find: '[Extra] For a positive integer n that is not a square number', answer: String(nonSquareRoots.length), slips: [
    { value: '29', says: /every number from 2 to 30/, check: () => range(2, 30).length === 29 },
  ] },
  { find: 'for the first five primes 2, 3, 5, 7 and 11 is N=P+1. Find N.', answer: String(euclid(5)), also: () => primes(5).join(',') === '2,3,5,7,11', slips: [
    { value: '2310', says: /That is P, the product of the primes/, check: () => euclid(5) - 1 === 2310 },
  ] },
  { find: 'for the first six primes is 30031. Find its smallest prime factor.', answer: String(spf(euclid(6))), also: () => euclid(6) === 30031, slips: [
    { value: '30031', says: /30031 is not prime/, check: () => !isPrime(30031) },
    { value: '509', says: /not the smallest/, check: () => 30031 / spf(30031) === 509 && isPrime(509) },
  ] },
  { find: 'Find the remainder when 30031 is divided by 13.', answer: String(30031 % 13), slips: [
    { value: '0', says: /13 divides 30030, not 30031/, check: () => 30030 % 13 === 0 && 30031 % 13 !== 0 },
  ] },
  { find: 'A student builds N=P+2 from the primes 2, 3 and 5 instead.', answer: String(spf(2 * 3 * 5 + 2)), also: () => 2 ** 5 === 2 * 3 * 5 + 2, slips: [
    { value: '32', says: /32 is N itself/, check: () => 2 * 3 * 5 + 2 === 32 },
  ] },
  { find: 'Find the largest integer c that divides 14m+21n for all integers m and n.', answer: String(gridGcd), slips: [
    { value: '14', says: /14 divides 14m, but not 21n/, check: () => (14 * 0 + 21 * 1) % 14 !== 0 },
    { value: '21', says: /21 divides 21n, but not 14m/, check: () => (14 * 1 + 21 * 0) % 21 !== 0 },
  ] },
  { find: 'What is the largest possible value of a+b?', answer: String(Math.max(...range(-10, 5).flatMap((a) => range(-10, 5).map((b) => a + b)))), slips: [
    { value: '5', says: /largest value of one of the two numbers/, check: () => Math.max(...range(-10, 5)) === 5 },
  ] },
  { find: 'How many different remainders can the square of an integer leave when divided by 4?', answer: String(squaresMod(4).size), slips: [
    { value: '4', says: /four remainders when divided by 4/, check: () => new Set(range(0, 60).map((n) => n % 4)).size === 4 },
  ] },
  { find: 'have n^2 a multiple of 9 but n not a multiple of 9?', answer: String(range(1, 30).filter((n) => (n * n) % 9 === 0 && n % 9 !== 0).length), slips: [
    { value: '10', says: /counts all the multiples of 3/, check: () => range(1, 30).filter((n) => n % 3 === 0).length === 10 },
  ] },
  { find: 'Work out their sum.', answer: String(Math.round(Math.SQRT2 + (5 - Math.SQRT2))), also: () => close(Math.SQRT2 + (5 - Math.SQRT2), 5), slips: [
    { value: '0', says: /second number here is 5-sqrt\(2\), which has a 5 as well/, check: () => close(Math.SQRT2 + -Math.SQRT2, 0) && !close(Math.SQRT2 + (5 - Math.SQRT2), 0) },
  ] },
  { find: 'for the first seven primes 2, 3, 5, 7, 11, 13 and 17 is 510511.', answer: String(spf(euclid(7))), also: () => euclid(7) === 510511, slips: [
    { value: '510511', says: /510511 is not prime/, check: () => !isPrime(510511) },
    { value: '1', says: /1 is not a prime number/, check: () => !isPrime(1) },
  ] },
  { find: 'Write 0.375 as a fraction in lowest terms', answer: String(frac375[0] + frac375[1]), also: () => close(frac375[0] / frac375[1], 0.375), slips: [
    { value: '1375', says: /375, 1000\) is not in lowest terms/, check: () => 375 + 1000 === 1375 && gcd(375, 1000) === 125 },
    { value: '22', says: /frac\(6, 16\) still has the common factor 2/, check: () => 6 / 16 === 0.375 && gcd(6, 16) === 2 && 6 + 16 === 22 },
  ] },
  { find: 'What is the largest integer c less than 20 for which 6m+9n=c has an integer solution?', answer: String(Math.max(...range(-30, 19).filter(makeable6_9))), slips: [
    { value: '19', says: /always a multiple of 3, and 19 is not/, check: () => !makeable6_9(19) && 19 % 3 !== 0 },
  ] },
  { find: 'Find the smallest prime factor of N.', answer: String(spf(N360)), also: () => N360 === 361, slips: [
    { value: '361', says: /361 is N itself/, check: () => !isPrime(361) },
    { value: '7', says: /remainder is 4/, check: () => 7 * 51 === 357 && 361 % 7 === 4 },
  ] },
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
    if (c.also && !c.also()) problems.push(`${c.find}: a fact the question states is not true`);
    if (!matches(c.answer, q.answers, q.mode)) problems.push(`${c.find}: the key does not accept the recomputed answer "${c.answer}" (keys: ${q.answers.join(' | ')})`);
    for (const k of q.answers) {
      if (c.alg) { if (!samePoly(k, c.alg)) problems.push(`${c.find}: key "${k}" is not the recomputed expression`); } else if (!close(numberOf(k), numberOf(c.answer))) problems.push(`${c.find}: key "${k}" is not the recomputed answer "${c.answer}"`);
    }
    for (const s of c.slips ?? []) {
      const li = q.wrongs.find((w) => w.values.includes(s.value));
      if (!li) { problems.push(`${c.find}: no wrong-answer entry lists the slip value "${s.value}" (entries: ${q.wrongs.map((w) => w.values.join(' | ')).join(' / ')})`); continue; }
      li.claimed = true;
      if (!matches(s.value, li.values, q.mode)) problems.push(`${c.find}: the engine does not match the slip "${s.value}" to its own entry`);
      if (!s.says.test(plain(li.text))) problems.push(`${c.find}: the message for "${s.value}" does not name the slip ${s.says}: ${plain(li.text).slice(0, 120)}`);
      if (!s.check()) problems.push(`${c.find}: the slip "${s.value}" is not what its message says`);
      if (matches(s.value, q.answers, q.mode)) problems.push(`${c.find}: the slip value "${s.value}" is also a right answer`);
      if (c.alg) { if (samePoly(s.value, c.alg)) problems.push(`${c.find}: the slip "${s.value}" equals the key`); } else if (close(numberOf(s.value), numberOf(c.answer))) problems.push(`${c.find}: the slip "${s.value}" equals the key`);
    }
    for (const w of q.wrongs) if (!w.claimed) problems.push(`${c.find}: wrong-answer entry "${w.values.join(' | ')}" has no recomputed slip`);
  }
  const typed = qs.filter((q) => q.answers.length > 0 && q.type !== 'mc');
  for (const q of typed) if (!checked.has(q)) problems.push(`no recomputed key for: ${q.plain.slice(0, 70)}`);
  expect(CHECKS.length).toBe(typed.length);
  expect(qs.length).toBeGreaterThanOrEqual(60);
  expect(problems).toEqual([]);
});

test('no hint gives the answer, and a "Type it like" example is never the key', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const problems: string[] = [];
  for (const q of questions()) {
    if (q.answers.length === 0) continue;
    // a hint that names a key number as a whole word gives the answer away (small whole numbers are too common in the working to test)
    const keyNumbers = new Set(q.answers.map(numberOf).filter((v) => !Number.isNaN(v) && (!Number.isInteger(v) || Math.abs(v) >= 10)).map(String));
    for (const h of q.hints) {
      for (const n of keyNumbers) if (new RegExp(`(^|[^\\d.])${n.replace('.', '\\.').replace('-', '-?')}($|[^\\d.])`).test(h)) problems.push(`a hint of "${q.plain.slice(0, 50)}" names the key value ${n}: ${h}`);
    }
    const m = /(?:Type|type) (?:it|them|your answers?|only) like (.*?)\.?$/.exec(q.plain);
    if (m && matches(m[1], q.answers, q.mode)) problems.push(`"${m[1]}" is the key of: ${q.plain.slice(0, 60)}`);
  }
  expect(problems).toEqual([]);
});

test('the ways a student types an answer are accepted, and the wrong ones are not', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const q = (find: string) => questions().find((x) => x.plain.includes(find))!;
  const expand = q('Expand (2k+1)^2.');
  for (const t of ['4k^2+4k+1', '1+4k+4k^2', '4*k^2+4*k+1', '4k^2 + 4k + 1', '4k\u00b2+4k+1', 'k=4k^2+4k+1'.replace('k=', '')]) expect(matches(t, expand.answers, expand.mode), t).toBe(true);
  for (const t of ['4k^2+1', '2k^2+4k+1', '(2k+1)^2', '4k^2+4k', '']) expect(matches(t, expand.answers, expand.mode), t).toBe(false);
  const half = q('Write the square as 2m+1');
  for (const t of ['2k^2+2k', '2k(k+1)', '2*k*(k+1)', 'k(2k+2)', '2k+2k^2', 'm=2k^2+2k']) expect(matches(t, half.answers, half.mode), t).toBe(true);
  for (const t of ['2k^2+k', '4k^2+4k', 'k^2+k']) expect(matches(t, half.answers, half.mode), t).toBe(false);
  const minus = q('Work out 2b^2-a^2');
  for (const t of ['-1', '\u22121', ' -1 ', '-1.0', '-1.00']) expect(matches(t, minus.answers, minus.mode), t).toBe(true);
  for (const t of ['1', '+1', 'minus 1', '']) expect(matches(t, minus.answers, minus.mode), t).toBe(false);
  const count = q('false for some whole numbers n from 1 to 20');
  for (const t of ['7', '7.', ' 7 ', '7.0']) expect(matches(t, count.answers, count.mode), t).toBe(true);
  for (const t of ['13', '6', '70']) expect(matches(t, count.answers, count.mode), t).toBe(false);
});

// ---------- multiple-choice keys, decided from the maths ----------
const options = (q: Question) => [...q.block.matchAll(/<li( data-correct| data-why="([^"]*)")?>([\s\S]*?)<\/li>/g)].filter((m) => m[1]).map((m) => ({ correct: m[1] === ' data-correct', why: decode(m[2] ?? ''), text: plain(m[3]) }));
const MC: { find: string; correct: string }[] = [
  { find: 'What is its converse?', correct: 'If n^2 is even, then n is an even integer' },
  { find: 'is a counterexample to the claim "n^2>n for every positive integer n"', correct: 'n = 1' },
  { find: 'checks a statement for 100 different integers', correct: 'It is evidence, but not a proof, because the 101st integer could fail' },
  { find: 'What is the first step of a proof by contradiction?', correct: 'Assume the statement is false' },
  { find: 'Which statement is the negation of "every prime number is odd"?', correct: 'At least one prime number is not odd' },
  { find: 'prove "there is no greatest even integer" by contradiction', correct: 'There is a greatest even integer' },
  { find: 'Which of these is a contradiction?', correct: 'n is even and n is odd' },
  { find: 'what do you assume at the start?', correct: 'n^2 is even and n is odd' },
  { find: '"n^2 is a multiple of 4, so n is a multiple of 4." Which value of n', correct: 'n = 2, because 2^2 = 4 is a multiple of 4 and 2 is not' },
  { find: 'If n^2 is a multiple of 5, which conclusion is correct for an integer n?', correct: 'n is a multiple of 5' },
  { find: 'What do you assume at the start of the proof that sqrt(2) is irrational?', correct: 'sqrt2 = a/b for integers a and b with no common factor' },
  { find: 'Which gives the contradiction?', correct: 'Line 6 contradicts line 1, because a and b cannot both be even in lowest terms' },
  { find: 'My calculator shows', correct: 'Ten digits are a finite check. A repeating pattern could start after the digits you can see' },
  { find: 'Which fact is used in the proof that sqrt(3) is irrational?', correct: 'If n^2 is a multiple of 3 then n is a multiple of 3' },
  { find: 'Which statement about rational and irrational numbers is true?', correct: 'The sum of a rational number and an irrational number is irrational' },
  { find: 'Why does the proof for sqrt(2) not show that sqrt(4) is irrational?', correct: 'sqrt4 = 2 = 2/1 is rational, and the steps do not give a contradiction' },
  { find: 'Which list of the first primes gives a counterexample?', correct: 'The first six primes: 2, 3, 5, 7, 11, 13' },
  { find: "In Euclid's proof, which statement is the contradiction?", correct: 'A prime q would divide 1, but no prime divides 1' },
  { find: '14m+21n=1. Which assumption do you make?', correct: 'There are integers m and n with 14m + 21n = 1' },
  { find: 'Which statement is the negation of "a>5 or b>5"?', correct: 'a <= 5 and b <= 5' },
  { find: 'Which number is a smaller positive rational number, whatever r is?', correct: 'r/2' },
  { find: 'Which statement is the converse of "if n^2 is even, then n is even"?', correct: 'If n is even, then n^2 is even' },
  { find: 'Which of these statements can be disproved with one counterexample?', correct: 'The sum of two irrational numbers is irrational' },
  { find: 'Dev says:', correct: 'He stopped too soon. He has not shown that b is even too, so there is no contradiction with lowest terms yet' },
  { find: 'Ana says:', correct: 'The number 30031 is not prime: it is 59 times 509. What is true is that it has a prime factor not on the list' },
  { find: 'Lee says:', correct: 'The negation of "every ... is odd" is "at least one ... is not odd", not "every ... is even"' },
  { find: 'Zoe says:', correct: '1.41421356 is a rounded value, not sqrt2 itself. Its square is not 2, whether sqrt2 is rational or not' },
  { find: 'Tom says:', correct: 'Examples do not prove a statement about all irrational numbers. sqrt2 + (-sqrt2) = 0 is a counterexample' },
  { find: 'Ben says:', correct: 'n-1 need not be positive. When n = 1, n-1 = 0. There is a smallest positive integer, 1' },
  { find: 'Which order of steps is correct for a proof by contradiction?', correct: 'Assume the negation, reason with valid steps, reach a contradiction, conclude that the statement is true' },
  { find: 'Which of these numbers is rational?', correct: 'sqrt2 * sqrt8' },
  { find: 'Which fact gives the contradiction?', correct: 'sqrt3 is irrational, and here sqrt3 = p/2q' },
];

test('multiple-choice keys: each correct option is the one listed, every multiple-choice question is listed, and each has 3 options', () => {
  const qs = questions().filter((q) => q.type === 'mc');
  const problems: string[] = [];
  const seen = new Set<Question>();
  for (const m of MC) {
    const found = qs.filter((q) => q.plain.includes(m.find));
    if (found.length !== 1) { problems.push(`"${m.find}" matches ${found.length} questions`); continue; }
    seen.add(found[0]);
    const opts = options(found[0]);
    if (opts.length !== 3) problems.push(`${m.find}: ${opts.length} options`);
    const right = opts.filter((o) => o.correct);
    if (right.length !== 1 || right[0].text !== m.correct) problems.push(`${m.find}: the correct option is "${right.map((r) => r.text).join('|')}", expected "${m.correct}"`);
  }
  for (const q of qs) if (!seen.has(q)) problems.push(`multiple-choice question with no check: ${q.plain.slice(0, 70)}`);
  expect(problems).toEqual([]);
  expect(qs.length).toBe(MC.length);
});

test('the facts that the multiple-choice reasons rely on are true', () => {
  const ps = primes(25);
  // "every prime is odd" is false because of 2; "every prime is even" and "no prime is odd" are false because of 3
  expect(ps.every((p) => p % 2 === 1)).toBe(false);
  expect(ps.every((p) => p % 2 === 0)).toBe(false);
  expect(ps.filter((p) => p % 2 === 1).length).toBeGreaterThan(0); // "no prime number is odd" is false
  expect(2 ** 2 > 2 && 1 ** 2 > 1 === false && 0 ** 2 > 0 === false).toBe(true); // n = 2 fits "n^2 > n", n = 1 breaks it, 0 is not positive
  // squares: 2^2 = 4 is a multiple of 4 and 2 is not; 3^2 = 9 is not a multiple of 4; 4 is a multiple of 4
  expect([2 * 2 % 4 === 0, 2 % 4 !== 0, 3 * 3 % 4 !== 0, 4 % 4 === 0].every(Boolean)).toBe(true);
  // 5: n = 5 gives 25, n = 10 gives 100
  expect([25 % 5 === 0, 100 % 5 === 0, 5 % 25 !== 0, 10 % 2 === 0].every(Boolean)).toBe(true);
  // the negation of "a > 5 or b > 5" is "a <= 5 and b <= 5", exactly; "or" and "a < 5 and b < 5" are not
  const grid = range(0, 20).map((v) => v / 2);
  for (const a of grid) for (const b of grid) {
    const original = a > 5 || b > 5;
    expect(!original, `${a},${b}`).toBe(a <= 5 && b <= 5);
  }
  expect((4 <= 5 || 6 <= 5) && (4 > 5 || 6 > 5)).toBe(true); // a = 4, b = 6: satisfies "or" and the original
  expect((5 < 5 && 5 < 5) === false && !(5 > 5 || 5 > 5)).toBe(true); // a = b = 5 makes the original false, but "a < 5 and b < 5" fails
  // r/2 is smaller than r for every positive r tried; r^2 is not smaller for r = 3; 2r is bigger
  for (const r of [0.1, 0.5, 1, 3, 100]) { expect(r / 2).toBeLessThan(r); expect(2 * r).toBeGreaterThan(r); }
  expect(3 ** 2).toBeGreaterThan(3);
  // 1.41^2 and 1.42^2 either side of 2; 1.41421356 squared is a little below 2
  expect(1.41 ** 2).toBeCloseTo(1.9881, 12);
  expect(1.42 ** 2).toBeCloseTo(2.0164, 12);
  expect(1.41421356 ** 2).toBeLessThan(2);
  expect(1.41421356 ** 2).toBeGreaterThan(1.9999999);
  expect(String(1.41421356 ** 2).startsWith('1.99999999')).toBe(true);
  // Euclid's numbers: for the first 4 and 5 primes N is prime, for 6 it is not, and 30031 = 59 x 509
  expect(isPrime(euclid(4)) && isPrime(euclid(5))).toBe(true);
  expect(euclid(4)).toBe(211);
  expect(isPrime(euclid(6))).toBe(false);
  expect(59 * 509).toBe(30031);
  expect(isPrime(59) && isPrime(509)).toBe(true);
  // sqrt(7) and 3 + sqrt(5) are irrational (7 and 5 are not squares), sqrt(2) x sqrt(8) = 4
  expect(isSquare(7) || isSquare(5)).toBe(false);
  expect(Math.SQRT2 * Math.sqrt(8)).toBeCloseTo(4, 12);
  // sqrt(4) is 2, positive
  expect(Math.sqrt(4)).toBe(2);
  // n - 1 for n = 1 is 0, not positive
  expect(1 - 1 > 0).toBe(false);
  // the sums that the "flip" and "spot" questions use
  expect(Math.SQRT2 + -Math.SQRT2).toBe(0);
  expect(Math.SQRT2 + (2 - Math.SQRT2)).toBeCloseTo(2, 12);
  expect(0 * Math.SQRT2).toBe(0);
  // the converse of "if n^2 is even then n is even" is "if n is even then n^2 is even": both hold for every integer tried
  for (const n of range(-60, 60)) { expect((n * n) % 2 === 0 ? n % 2 === 0 : true).toBe(true); expect(n % 2 === 0 ? (n * n) % 2 === 0 : true).toBe(true); }
});

// ---------- "Now you finish it": each blank recomputed ----------
test('the blanks in every "Now you finish it" are recomputed', () => {
  const blanks = [...SOURCE.matchAll(/<div class="worked faded">([\s\S]*?)<\/div>\s*(?=<\/div>|<h3>|<section)/g)];
  const html = blanks.map((m) => m[1]);
  expect(html.length).toBe(6);
  const answer = (h: string, n: number) => [...h.matchAll(/<span class="blank" data-answers="([^"]*)">/g)].map((m) => m[1])[n];
  // 1. no greatest even integer: E + 2 is even and bigger
  expect(answer(html[0], 0)).toBe('2');
  expect(range(-20, 20).every((e) => (e * 2 + 2) % 2 === 0 && e * 2 + 2 > e * 2)).toBe(true);
  expect(range(-20, 20).some((e) => (e * 2 + 1) % 2 === 0)).toBe(false);
  // 2. squares not multiples of 5 leave 1 or 4, and a multiple of 5 leaves 0
  expect(answer(html[1], 0)).toBe('4');
  expect(answer(html[1], 1)).toBe('0');
  expect([...new Set(range(-100, 100).filter((n) => ((n % 5) + 5) % 5 !== 0).map((n) => ((n * n) % 5)))].sort()).toEqual([1, 4]);
  expect(range(-100, 100).filter((n) => (n * n) % 5 === 0).every((n) => n % 5 === 0)).toBe(true);
  // 3. sqrt(2): a^2 = 2 b^2, (2k)^2 = 4 k^2, b^2 = 2 k^2
  expect([0, 1, 2].map((i) => answer(html[2], i))).toEqual(['2', '4', '2']);
  for (const k of range(-9, 9)) { expect((2 * k) ** 2).toBe(4 * k * k); expect((4 * k * k) / 2).toBe(2 * k * k); }
  // 4. 4 sqrt(3) = p/q gives sqrt(3) = p/(4q)
  expect(answer(html[3], 0)).toBe('4');
  for (const [p, q] of [[3, 5], [7, 2], [11, 9]]) expect(p / q / 4).toBeCloseTo(p / (4 * q), 12);
  // 5. Euclid, first four primes: P = 210, N = 211, remainder 1 for each
  expect([0, 1, 2].map((i) => answer(html[4], i))).toEqual([String(primes(4).reduce((a, p) => a * p, 1)), String(euclid(4)), '1']);
  expect(primes(4).every((p) => euclid(4) % p === 1)).toBe(true);
  // 6. x^2 = 4y + 2 with x = 2k gives 4k^2 = 4y + 2, so 2k^2 = 2y + 1
  expect(answer(html[5], 0)).toBe('1');
  for (const k of range(-9, 9)) { const y = (4 * k * k - 2) / 4; expect(2 * k * k).toBeCloseTo(2 * y + 1, 12); }
});

// ---------- the general rules the lessons state, with their conditions ----------
test('the page states the conditions on each general rule, and each rule is true', () => {
  const text = plain(SOURCE);
  // negation rules: checked over every way a property can hold on a three-element set
  expect(text).toContain('The negation of "every ..." is "at least one ... is not". It is never "none".');
  expect(text).toContain('The negation of "there is no ..." is "there is at least one ...".');
  expect(text).toContain('The negation of "A or B" is "not A and not B". The negation of "A and B" is "not A or not B".');
  expect(text).toContain('The negation of x>3 is x<=3. The negation of "n is even" is "n is odd", when n is an integer.');
  for (let bits = 0; bits < 8; bits += 1) {
    const holds = [0, 1, 2].map((i) => ((bits >> i) & 1) === 1);
    const every = holds.every(Boolean);
    expect(!every).toBe(holds.some((h) => !h)); // not every = at least one is not
    const none = holds.every((h) => !h);
    if (bits !== 0 && bits !== 7) { expect(every).toBe(false); expect(none).toBe(false); } // "none" is not the negation of "every": both can be false
    expect(!holds.some(Boolean)).toBe(none); // there is no ... = none; its negation is some
  }
  for (const A of [true, false]) for (const B of [true, false]) { expect(!(A || B)).toBe(!A && !B); expect(!(A && B)).toBe(!A || !B); }
  for (const n of range(-50, 50)) expect(!(n % 2 === 0)).toBe(Math.abs(n % 2) === 1);
  for (const x of [2, 3, 3.5, 4]) expect(!(x > 3)).toBe(x <= 3);
  // the squares rule: for an integer n, n^2 even gives n even, n^2 a multiple of 3 gives n a multiple of 3, and the same for 5
  expect(text).toContain('for an integer n, if n^2 is even then n is even. If n^2 is a multiple of 3, then n is a multiple of 3.');
  expect(range(-300, 300).every((n) => [2, 3, 5, 7].every((p) => (n * n) % p !== 0 || n % p === 0))).toBe(true);
  // and it fails for 4, 8 and 9 (counterexamples 2, 4, 3)
  expect(text).toContain('The numbers 4, 8 and 9 fail: the squares of 2, 4 and 3 are multiples of 4, 8 and 9.');
  for (const [m, n] of [[4, 2], [8, 4], [9, 3]]) { expect((n * n) % m).toBe(0); expect(n % m).not.toBe(0); }
  // a prime that divides a product divides one of the factors (so the rule is about primes), and 4 does not
  expect(text).toContain('A prime that divides a product of two integers divides one of them.');
  expect(primes(15).every((p) => range(1, 40).every((a) => range(1, 40).every((b) => (a * b) % p !== 0 || a % p === 0 || b % p === 0)))).toBe(true);
  expect((2 * 2) % 4 === 0 && 2 % 4 !== 0).toBe(true);
  // lowest terms always exist
  expect(text).toContain('Any fraction can be cancelled until the top and bottom have no common factor.');
  expect(range(1, 60).every((a) => range(1, 60).every((b) => { const g = gcd(a, b); return gcd(a / g, b / g) === 1 && Math.abs(a / g / (b / g) - a / b) < 1e-12; }))).toBe(true);
  // rational and irrational: with exact fractions
  expect(text).toContain('For a rational number r and an irrational number x: r+x is irrational. If r is not 0, r*x is irrational.');
  const fr = (n: number, d: number) => ({ n, d });
  const add = (x: { n: number; d: number }, y: { n: number; d: number }) => fr(x.n * y.d + y.n * x.d, x.d * y.d);
  const sub = (x: { n: number; d: number }, y: { n: number; d: number }) => fr(x.n * y.d - y.n * x.d, x.d * y.d);
  const div = (x: { n: number; d: number }, y: { n: number; d: number }) => fr(x.n * y.d, x.d * y.n);
  // if r + x = q is rational then x = q - r is a fraction of integers; if r * x = q then x = q / r is a fraction of integers when r is not 0
  for (const [rn, rd, qn, qd] of [[3, 1, 5, 2], [-7, 3, 2, 9], [1, 2, 1, 2]]) {
    const x = sub(fr(qn, qd), fr(rn, rd));
    expect(Number.isInteger(x.n) && Number.isInteger(x.d) && x.d !== 0).toBe(true);
    expect(add(fr(rn, rd), x).n / add(fr(rn, rd), x).d).toBeCloseTo(qn / qd, 12);
    if (rn !== 0) { const y = div(fr(qn, qd), fr(rn, rd)); expect(Number.isInteger(y.n) && Number.isInteger(y.d) && y.d !== 0).toBe(true); }
  }
  expect(0 * Math.SQRT2).toBe(0); // the condition "r is not 0"
  expect(text).toContain('Two irrational numbers can add to a rational number: sqrt(2)+(-sqrt(2))=0. They can multiply to a rational number too: sqrt(2)*sqrt(2)=2.');
  expect(Math.SQRT2 + -Math.SQRT2).toBe(0);
  expect(Math.SQRT2 * Math.SQRT2).toBeCloseTo(2, 12);
  // the rule for the root of a number: n a positive integer, irrational exactly when n is not a square
  expect(text).toContain('For a positive integer n, sqrt(n) is irrational if n is not a square number. If n is a square number, sqrt(n) is a whole number.');
  expect(nonSquareRoots.length).toBe(25);
  expect([4, 9, 16, 25].every((n) => isSquare(n))).toBe(true);
  // Euclid: Fact 1 (a prime factor exists), Fact 2 (a divisor of two numbers divides their difference), Fact 3 (no prime divides 1)
  expect(text).toContain('Fact 1: every integer greater than 1 has at least one prime factor.');
  expect(range(2, 3000).every((n) => isPrime(spf(n)) && n % spf(n) === 0)).toBe(true);
  expect(range(2, 3000).every((n) => isPrime(range(2, n).find((x) => n % x === 0) ?? n))).toBe(true); // the smallest factor greater than 1 is prime
  expect(text).toContain('Fact 2: if a number divides two integers, it divides their difference.');
  expect(range(1, 12).every((d) => range(-8, 8).every((s) => range(-8, 8).every((t) => (d * s - d * t) % d === 0)))).toBe(true);
  expect(text).toContain('Fact 3: no prime number divides 1.');
  expect(primes(30).some((p) => 1 % p === 0)).toBe(false);
  // N = P + 1 is one more than a multiple of every prime on the list, for lists of 1 to 10 primes, and has a prime factor off the list
  expect(text).toContain('P is a multiple of every prime on the list, so P+1 is one more than a multiple of each.');
  for (let count = 1; count <= 10; count += 1) {
    const list = primes(count);
    const N = euclid(count);
    expect(list.every((p) => N % p === 1)).toBe(true);
    expect(list.includes(spf(N))).toBe(false);
  }
  // squares of integers leave remainder 0 or 1 when divided by 4 (so x^2 = 4y + 2 has no integer solution), and by 3
  expect([...squaresMod(4)].sort()).toEqual([0, 1]);
  expect([...squaresMod(3)].sort()).toEqual([0, 1]);
  expect(range(-200, 200).some((x) => (x * x - 2) % 4 === 0)).toBe(false);
  // the 41 expression: prime for n from 0 to 39, then 41^2 at 40
  expect(range(0, 39).every((n) => isPrime(n * n + n + 41))).toBe(true);
  expect(40 * 40 + 40 + 41).toBe(41 * 41);
  expect(text).toContain('The expression n^2+n+41 is prime for 40 values of n in a row (n from 0 to 39), then fails at n=40.');
});

test('every impossibility the page proves has no solution in a wide search', () => {
  const box = range(-60, 60);
  // 14m + 21n = 1, 12m + 18n = 5, 6m + 9n = 19: no integers; every value is a multiple of the common factor
  expect(box.some((m) => box.some((n) => 14 * m + 21 * n === 1))).toBe(false);
  expect(box.some((m) => box.some((n) => 12 * m + 18 * n === 5))).toBe(false);
  expect(box.every((m) => box.every((n) => (14 * m + 21 * n) % 7 === 0 && (12 * m + 18 * n) % 6 === 0))).toBe(true);
  // x^2 - y^2 = 2: no integers, and x - y, x + y always have the same parity
  const wide = range(-80, 80);
  expect(wide.some((x) => wide.some((y) => x * x - y * y === 2))).toBe(false);
  expect(wide.every((x) => wide.every((y) => Math.abs((x - y) % 2) === Math.abs((x + y) % 2) && (((x - y) * (x + y)) % 2 !== 0 || ((x - y) * (x + y)) % 4 === 0)))).toBe(true);
  // x^2 = 4y + 2: no integers
  expect(wide.some((x) => wide.some((y) => x * x === 4 * y + 2))).toBe(false);
  // there is no integer solution to a^2 = 2 b^2 with b positive, and the fractions in the lesson are one apart
  expect(range(1, 400).every((b) => !isSquare(2 * b * b))).toBe(true);
  for (const [a, b] of [[7, 5], [17, 12], [99, 70], [577, 408]]) expect(Math.abs(a * a - 2 * b * b)).toBe(1);
  expect([7 * 7, 2 * 5 * 5, 17 * 17, 2 * 12 * 12, 99 * 99, 2 * 70 * 70]).toEqual([49, 50, 289, 288, 9801, 9800]);
  // a + b > 10 gives a > 5 or b > 5
  const half = range(0, 40).map((v) => v / 2);
  expect(half.every((a) => half.every((b) => a + b <= 10 || a > 5 || b > 5))).toBe(true);
  // odd a, b, c: no rational root p/q (checked for every p, q up to 40 with no common factor)
  const odd = [-7, -5, -3, -1, 1, 3, 5, 7];
  let rootless = true;
  let allOdd = true;
  for (const a of odd) for (const b of odd) for (const c of odd) for (let q = 1; q <= 40; q += 1) for (let p = -40; p <= 40; p += 1) {
    if (gcd(p, q) !== 1) continue;
    const total = a * p * p + b * p * q + c * q * q;
    if (total === 0) rootless = false;
    if (Math.abs(total % 2) !== 1) allOdd = false; // the parity argument: the total is odd whenever p and q are not both even
  }
  expect(rootless).toBe(true);
  expect(allOdd).toBe(true);
  // the three parity cases are the only ones when p and q are not both even
  const cases = new Set<string>();
  for (let q = 1; q <= 40; q += 1) for (let p = -40; p <= 40; p += 1) if (gcd(p, q) === 1) cases.add(`${Math.abs(p % 2)}${q % 2}`);
  expect([...cases].sort()).toEqual(['01', '10', '11']);
  // 1 / (sqrt(2) + 1) = sqrt(2) - 1
  expect(1 / (Math.SQRT2 + 1)).toBeCloseTo(Math.SQRT2 - 1, 12);
  expect((Math.SQRT2 + 1) * (Math.SQRT2 - 1)).toBeCloseTo(1, 12);
  // the proofs about primes and the numbers the exam questions use
  expect(N360).toBe(19 * 19);
  expect(2 ** 3 * 3 ** 2 * 5).toBe(360);
  expect(euclid(7)).toBe(19 * 97 * 277);
  expect(19 * 26869).toBe(510511);
  // 0 is a multiple of 7 but 1 is not
  expect(1 % 7).not.toBe(0);
});

test('every calculation {m:a=b=c} written with numbers only is right', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const m of SOURCE.matchAll(/\{m:([-+*()\d.=^ ]+)\}/g)) {
    const parts = m[1].split('=').map((p) => p.trim());
    if (parts.length < 2 || parts.some((p) => p === '' || !/\d/.test(p))) continue;
    const values = parts.map((p) => Function(`"use strict"; return (${p.replaceAll('^', '**')});`)() as number);
    checked += 1;
    if (values.some((v) => Math.abs(v - values[0]) > 1e-9)) problems.push(`${m[0]} is not right: ${values.join(' vs ')}`);
  }
  expect(checked).toBeGreaterThan(40);
  expect(problems).toEqual([]);
});

const IDENTITIES: { text: string; left: (k: number) => number; right: (k: number) => number }[] = [
  { text: '(2k+1)(2k+1)=4k^2+2k+2k+1=4k^2+4k+1', left: (k) => (2 * k + 1) * (2 * k + 1), right: (k) => 4 * k * k + 2 * k + 2 * k + 1 },
  { text: '(2a+1)+(2b+1)=2a+2b+2=2(a+b+1)', left: (k) => (2 * k + 1) + (2 * (k + 5) + 1), right: (k) => 2 * (k + (k + 5) + 1) },
  { text: '9k^2+12k+4=3(3k^2+4k+1)+1', left: (k) => 9 * k * k + 12 * k + 4, right: (k) => 3 * (3 * k * k + 4 * k + 1) + 1 },
  { text: '(2k+1)^2=4k^2+4k+1=2(2k^2+2k)+1', left: (k) => (2 * k + 1) ** 2, right: (k) => 2 * (2 * k * k + 2 * k) + 1 },
  { text: '(3k+1)^2=9k^2+6k+1=3(3k^2+2k)+1', left: (k) => (3 * k + 1) ** 2, right: (k) => 3 * (3 * k * k + 2 * k) + 1 },
  { text: '(3k+2)^2=9k^2+12k+4=3(3k^2+4k+1)+1', left: (k) => (3 * k + 2) ** 2, right: (k) => 3 * (3 * k * k + 4 * k + 1) + 1 },
  { text: '4k^2+4k=2(2k^2+2k)', left: (k) => 4 * k * k + 4 * k, right: (k) => 2 * (2 * k * k + 2 * k) },
  { text: '(2k+1)^2=4k^2+4k+1=4(k^2+k)+1', left: (k) => (2 * k + 1) ** 2, right: (k) => 4 * (k * k + k) + 1 },
  { text: '14m+21n=7(2m+3n)', left: (k) => 14 * k + 21 * (k + 3), right: (k) => 7 * (2 * k + 3 * (k + 3)) },
];

test('every identity written on the page holds for 13 values', () => {
  for (const id of IDENTITIES) {
    expect(SOURCE, id.text).toContain(`{m:${id.text}`);
    for (const k of range(-6, 6)) expect(id.left(k), `${id.text} at ${k}`).toBeCloseTo(id.right(k), 9);
  }
  // the long form of the proof for 4, and the proof of the primes lines
  for (const k of range(-9, 9)) { expect((2 * k) ** 2).toBe(4 * k * k); expect(2 * 70 ** 2).toBe(9800); }
  for (const k of range(-9, 9)) { const y = k; expect((4 * y + 2) / 2).toBe(2 * y + 1); }
  // for 6m + 9n, 3(2m+3n)
  for (const m of range(-5, 5)) for (const n of range(-5, 5)) expect(6 * m + 9 * n).toBe(3 * (2 * m + 3 * n));
  for (const m of range(-5, 5)) for (const n of range(-5, 5)) expect(12 * m + 18 * n).toBe(6 * (2 * m + 3 * n));
});

test('each exam-style mark scheme awards exactly the marks the question is worth, and two or more questions mix in other areas', () => {
  const qs = questions();
  const exam = SOURCE.slice(SOURCE.indexOf('<section class="exam-section">'), SOURCE.indexOf('<section class="section-alt">'));
  const marked = qs.filter((q) => q.marks !== null);
  expect(marked.length).toBe(5);
  for (const q of marked) {
    if (q.type === 'show') expect(q.markscheme.length, q.plain.slice(0, 60)).toBe(q.marks);
    else expect(q.markscheme.length, q.plain.slice(0, 60)).toBe(q.marks);
    expect(q.plain, 'the marks appear in the question text').toContain(`[${q.marks} mark`);
  }
  // mixed-area questions: surds (rationalising), quadratics (roots of a quadratic), indices, and a difference of two squares
  expect(exam).toContain('frac(1, sqrt(2)+1)');
  expect(exam).toContain('The quadratic equation {m:ax^2+bx+c=0}');
  expect(exam).toContain('2^3*3^2*5');
  expect(exam).toContain('{m:x^2-y^2=2}');
  expect(marked.reduce((t, q) => t + (q.marks ?? 0), 0)).toBe(3 + 4 + 5 + 2 + 4);
});

// ---------- the figures, read back from their SVG ----------
type Pt = [number, number];
type SegT = { a: Pt; b: Pt; text: string | null };
const STATED: Record<string, { segs: Record<string, SegT>; points: Record<string, { at: Pt; text: string }> }> = {
  'proof-contradiction-unit-square': {
    segs: {
      bottom: { a: [0, 0], b: [1, 0], text: '1' },
      right: { a: [1, 0], b: [1, 1], text: null },
      top: { a: [1, 1], b: [0, 1], text: null },
      left: { a: [0, 1], b: [0, 0], text: '1' },
      diagonal: { a: [0, 0], b: [1, 1], text: `${SQRT}2` },
    },
    points: {},
  },
  'proof-contradiction-between': {
    segs: { line: { a: [1.4, 0], b: [1.43, 0], text: null } },
    points: { a: { at: [1.41, 0], text: '1.41' }, r: { at: [Math.SQRT2, 0], text: `${SQRT}2` }, b: { at: [1.42, 0], text: '1.42' } },
  },
};

type Geom = { width: number; height: number; left: number; right: number; top: number; bottom: number; xmin: number; xmax: number; ymin: number; ymax: number };
const lineRe = (cls: string) => new RegExp(`<line class="${cls}" x1="([\\d.-]+)" y1="([\\d.-]+)" x2="([\\d.-]+)" y2="([\\d.-]+)"/>`, 'g');
const linesOf = (svg: string, cls: string) => [...svg.matchAll(lineRe(cls))].map((m) => ({ x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] }));
const labelsOf = (svg: string) => [...svg.matchAll(/<text[^>]*data-for="([^"]*)" x="([\d.-]+)" y="([\d.-]+)" text-anchor="(\w+)">([\s\S]*?)<\/text>/g)].map((m) => ({ for: m[1], x: +m[2], y: +m[3], anchor: m[4], text: m[5].replace(/<[^>]+>/g, '').replace(/\u200b/g, '') }));
const circlesOf = (svg: string) => [...svg.matchAll(/<circle class="pt" data-name="([^"]*)" cx="([\d.-]+)" cy="([\d.-]+)" r="7"\/>/g)].map((m) => ({ name: m[1], px: +m[2], py: +m[3] }));
const distToSeg = (qx: number, qy: number, [ax, ay]: Pt, [bx, by]: Pt) => {
  const t = Math.max(0, Math.min(1, ((qx - ax) * (bx - ax) + (qy - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
  return Math.hypot(qx - (ax + t * (bx - ax)), qy - (ay + t * (by - ay)));
};

/** The pixel position of a graph point, read from the drawing itself: the unit square gives its own scale; the number line gives its end points. */
function scaleOf(id: string, svg: string, g: Geom) {
  if (id === 'proof-contradiction-unit-square') {
    const sides = linesOf(svg, 'line');
    expect(sides.length).toBe(4);
    const bottom = sides.find((l) => l.y1 === l.y2 && l.y1 > g.top + 100)!;
    const unit = Math.abs(bottom.x2 - bottom.x1);
    const ox = Math.min(bottom.x1, bottom.x2);
    const oy = bottom.y1;
    return { px: (x: number) => ox + x * unit, py: (y: number) => oy - y * unit, unit };
  }
  const axis = linesOf(svg, 'axis')[0];
  const unit = (axis.x2 - axis.x1) / (g.xmax - g.xmin);
  return { px: (x: number) => axis.x1 + (x - g.xmin) * unit, py: () => axis.y1, unit };
}

test('the unit-square picture is a true square of side 1 with a diagonal of length root 2, and the number-line points are where the page says', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/proof-contradiction.mjs');
  const sq = (FIGURES as Record<string, () => string>)['proof-contradiction-unit-square']();
  const g = (GEOM as Record<string, Geom>)['proof-contradiction-unit-square'];
  const sides = linesOf(sq, 'line');
  const diag = linesOf(sq, 'curve');
  expect(sides.length).toBe(4);
  expect(diag.length).toBe(1);
  const len = (l: { x1: number; y1: number; x2: number; y2: number }) => Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
  const side = len(sides[0]);
  for (const s of sides) expect(Math.abs(len(s) - side), 'all four sides have the same length').toBeLessThan(0.05);
  // right angles: each side is horizontal or vertical
  for (const s of sides) expect(Math.abs(s.x1 - s.x2) < 0.05 || Math.abs(s.y1 - s.y2) < 0.05).toBe(true);
  // the sides join up into a closed square
  const corners = new Set(sides.flatMap((s) => [`${Math.round(s.x1)},${Math.round(s.y1)}`, `${Math.round(s.x2)},${Math.round(s.y2)}`]));
  expect(corners.size).toBe(4);
  // the diagonal joins opposite corners and is root 2 times as long as a side
  expect(len(diag[0]) / side).toBeCloseTo(Math.SQRT2, 2);
  const ends = [`${Math.round(diag[0].x1)},${Math.round(diag[0].y1)}`, `${Math.round(diag[0].x2)},${Math.round(diag[0].y2)}`];
  for (const e of ends) expect(corners.has(e)).toBe(true);
  expect(Math.abs(Math.abs(diag[0].x2 - diag[0].x1) - side)).toBeLessThan(0.05);
  expect(Math.abs(Math.abs(diag[0].y2 - diag[0].y1) - side)).toBeLessThan(0.05);
  // Pythagoras: 1^2 + 1^2 = (root 2)^2
  expect(1 ** 2 + 1 ** 2).toBeCloseTo(Math.SQRT2 ** 2, 12);
  // the square sits where the geometry says: the pixel scale agrees with the layout
  const w = g.width - g.left - g.right;
  const unitFromLayout = w / (g.xmax - g.xmin);
  expect(side).toBeCloseTo(unitFromLayout, 1);
  expect((g.height - g.top - g.bottom) / (g.ymax - g.ymin)).toBeCloseTo(unitFromLayout, 1);

  const nl = (FIGURES as Record<string, () => string>)['proof-contradiction-between']();
  const gn = (GEOM as Record<string, Geom>)['proof-contradiction-between'];
  const { px } = scaleOf('proof-contradiction-between', nl, gn);
  const dots = circlesOf(nl);
  expect(dots.map((d) => d.name).sort()).toEqual(['a', 'b', 'r']);
  for (const [name, p] of Object.entries(STATED['proof-contradiction-between'].points)) {
    const d = dots.find((x) => x.name === name)!;
    expect(d.px, name).toBeCloseTo(px(p.at[0]), 1);
  }
  // 1.41 < root 2 < 1.42, with the squares either side of 2, and the picture keeps that order
  const [a, r, b] = ['a', 'r', 'b'].map((n) => dots.find((d) => d.name === n)!.px);
  expect(a).toBeLessThan(r);
  expect(r).toBeLessThan(b);
  expect(1.41 * 1.41).toBeLessThan(2);
  expect(1.42 * 1.42).toBeGreaterThan(2);
  // the axis runs from 1.40 to 1.43
  expect(gn.xmin).toBe(1.4);
  expect(gn.xmax).toBe(1.43);
});

test('every label says its own item, is nearest it, sits clear of every line and marker, and is 4px clear of every other label', async () => {
  const { FIGURES, GEOM } = await import('../src/book/alevel/figures/proof-contradiction.mjs');
  const problems: string[] = [];
  let labelled = 0;
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const svg = make();
    const g = (GEOM as Record<string, Geom>)[id];
    const st = STATED[id];
    const { px, py } = scaleOf(id, svg, g);
    const items: { name: string; point: boolean; at: (x: number, y: number) => number }[] = [
      ...Object.entries(st.points).map(([name, p]) => ({ name, point: true, at: (qx: number, qy: number) => Math.hypot(qx - px(p.at[0]), qy - py(p.at[1])) })),
      ...Object.entries(st.segs).map(([name, s]) => ({ name, point: false, at: (qx: number, qy: number) => distToSeg(qx, qy, [px(s.a[0]), py(s.a[1])], [px(s.b[0]), py(s.b[1])]) })),
    ];
    const labels = labelsOf(svg);
    const boxes: { text: string; x0: number; x1: number; y0: number; y1: number }[] = [];
    for (const l of labels) {
      labelled += 1;
      const width = l.text.length * 13;
      const cx = l.x + (l.anchor === 'start' ? width / 2 : l.anchor === 'end' ? -width / 2 : 0);
      const cy = l.y - 8;
      const own = items.find((it) => it.name === l.for);
      if (!own) { problems.push(`${id}: label "${l.text}" names no item "${l.for}"`); continue; }
      const mine = own.at(cx, cy);
      const rivals = own.point ? items.filter((it) => it !== own && it.point) : items.filter((it) => it !== own);
      for (const other of rivals) if (other.at(cx, cy) < mine) problems.push(`${id}: label "${l.text}" is ${Math.round(other.at(cx, cy))}px from "${other.name}" but ${Math.round(mine)}px from its own "${own.name}"`);
      const want = st.points[l.for]?.text ?? st.segs[l.for]?.text;
      if (l.text !== want) problems.push(`${id}: the label "${l.text}" is not "${want}" for "${l.for}"`);
      const box = { text: l.text, x0: cx - width / 2, x1: cx + width / 2, y0: l.y - 26, y1: l.y + 8 };
      boxes.push(box);
      // never on a drawn line
      for (const s of Object.values(st.segs)) {
        for (let i = 0; i <= 100; i += 1) {
          const qx = px(s.a[0] + ((s.b[0] - s.a[0]) * i) / 100);
          const qy = py(s.a[1] + ((s.b[1] - s.a[1]) * i) / 100);
          if (qx > box.x0 - 3 && qx < box.x1 + 3 && qy > box.y0 - 3 && qy < box.y1 + 3) { problems.push(`${id}: label "${l.text}" sits on a line`); break; }
        }
      }
      // never on another marked point
      for (const [name, p] of Object.entries(st.points)) if (name !== l.for && px(p.at[0]) > box.x0 - 11 && px(p.at[0]) < box.x1 + 11 && py(p.at[1]) > box.y0 - 11 && py(p.at[1]) < box.y1 + 11) problems.push(`${id}: label "${l.text}" covers the marked point "${name}"`);
      // inside the picture
      if (box.x0 < 0 || box.x1 > g.width || box.y0 < 0 || box.y1 > g.height) problems.push(`${id}: label "${l.text}" leaves the picture`);
    }
    for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i];
      const b = boxes[j];
      if (Math.max(a.x0 - b.x1, b.x0 - a.x1) < 4 && Math.max(a.y0 - b.y1, b.y0 - a.y1) < 4) problems.push(`${id}: labels "${a.text}" and "${b.text}" are closer than 4px`);
    }
    // every item that has a label text has a label
    for (const [name, s] of Object.entries(st.segs)) if (s.text && !labels.some((l) => l.for === name)) problems.push(`${id}: "${name}" has no label`);
    for (const name of Object.keys(st.points)) if (!labels.some((l) => l.for === name)) problems.push(`${id}: "${name}" has no label`);
    expect(labels.length, id).toBe(Object.values(st.segs).filter((s) => s.text).length + Object.keys(st.points).length);
  }
  expect(labelled).toBe(6);
  expect(problems).toEqual([]);
});

test('every figure states every coordinate in its text alternative, names what it shows, and gives no answer to a question', async () => {
  const { FIGURES, ITEMS, SQRT2_SHOWN } = await import('../src/book/alevel/figures/proof-contradiction.mjs');
  type Item = { kind: string; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number; text: string | null };
  const sq = (FIGURES as Record<string, () => string>)['proof-contradiction-unit-square']();
  const nl = (FIGURES as Record<string, () => string>)['proof-contradiction-between']();
  const descOf = (svg: string) => /<desc id="[^"]*">([^<]*)<\/desc>/.exec(svg)?.[1] ?? '';
  for (const c of ['(0, 0)', '(1, 0)', '(1, 1)', '(0, 1)']) expect(descOf(sq)).toContain(c);
  expect(descOf(sq)).toContain(`labelled ${SQRT}2`);
  // the corners the description names are the ends of the segments drawn
  const ends = new Set((ITEMS as Record<string, Item[]>)['proof-contradiction-unit-square'].flatMap((it) => [`(${it.x1}, ${it.y1})`, `(${it.x2}, ${it.y2})`]));
  expect([...ends].sort()).toEqual(['(0, 0)', '(0, 1)', '(1, 0)', '(1, 1)']);
  for (const c of ['1.40', '1.43', '1.41', '1.42', SQRT2_SHOWN, '1.9881', '2.0164']) expect(descOf(nl), c).toContain(c);
  expect(SQRT2_SHOWN).toBe(String(Math.SQRT2).slice(0, 7));
  expect(1.41 ** 2).toBeCloseTo(1.9881, 12);
  expect(1.42 ** 2).toBeCloseTo(2.0164, 12);
  // the page uses each figure once, in a lesson (there is no question figure, so none can give an answer away)
  const used = [...SOURCE.matchAll(/\{fig:([a-z0-9-]+)\}/g)].map((m) => m[1]);
  expect([...used].sort()).toEqual(Object.keys(FIGURES).sort());
  expect(new Set(used).size).toBe(used.length);
  expect(SOURCE).not.toContain('qfig');
  // every drawn label belongs to the picture's own file: ids start with the file's name
  for (const id of Object.keys(FIGURES)) expect(id.startsWith('proof-contradiction-')).toBe(true);
  // the lessons without a picture say why in a comment
  expect((SOURCE.match(/<!-- No figure:/g) ?? []).length).toBeGreaterThanOrEqual(2);
});

test('at 320px every figure label is at least 12px tall and 4px clear of every other label', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/courses/a-level/proof-contradiction.html');
  const small = await page.evaluate(() => [...document.querySelectorAll('main svg.graph-svg text')].map((t) => ({ s: t.textContent, h: t.getBoundingClientRect().height })).filter((t) => t.h > 0 && t.h < 12).map((t) => t.s + ' ' + t.h.toFixed(1)));
  expect(small).toEqual([]);
  const close4 = await page.evaluate(() => {
    const out: string[] = [];
    for (const svg of document.querySelectorAll('main svg.graph-svg')) {
      const texts = [...svg.querySelectorAll('text')].map((t) => ({ b: t.getBoundingClientRect(), s: (t.textContent ?? '').trim() })).filter((x) => x.s);
      for (let i = 0; i < texts.length; i += 1) {
        for (let j = i + 1; j < texts.length; j += 1) {
          const a = texts[i].b;
          const b = texts[j].b;
          if (Math.max(a.left - b.right, b.left - a.right) < 4 && Math.max(a.top - b.bottom, b.top - a.bottom) < 4) out.push(`${svg.querySelector('title')?.textContent}: "${texts[i].s}" and "${texts[j].s}"`);
        }
      }
    }
    return out;
  });
  expect(close4).toEqual([]);
});

test('no figure text leaves its picture', async ({ page }) => {
  await page.goto('/courses/a-level/proof-contradiction.html');
  const outside = await page.evaluate(() => {
    const out: string[] = [];
    const figs = document.querySelectorAll('main svg.graph-svg');
    for (const svg of figs) {
      const vb = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
      for (const t of svg.querySelectorAll('text')) {
        const b = (t as SVGGraphicsElement).getBBox();
        if (b.x < vb[0] - 0.5 || b.y < vb[1] - 0.5 || b.x + b.width > vb[2] + 0.5 || b.y + b.height > vb[3] + 0.5) out.push(`${svg.querySelector('title')?.textContent}: "${t.textContent}"`);
      }
    }
    return { out, count: figs.length };
  });
  expect(outside.count).toBe(2);
  expect(outside.out).toEqual([]);
});

// ---------- the page's shape and wording ----------
test('the page has the structure the plan asks for', async () => {
  const { GLOSSARY } = await import('../src/book/alevel/glossary.mjs');
  const { TOPICS } = await import('../src/book/alevel/topics.mjs');
  expect(SOURCE.startsWith('<main class="book strand-al-proof" data-calc="scientific" data-book-page="topic" data-topic="proof-contradiction">')).toBe(true);
  const lessons = SOURCE.split('<section').filter((sec) => /<h2>\d+\./.test(sec));
  expect(lessons.length).toBe(6);
  for (const sec of lessons) {
    const name = /<h2>([^<]*)<\/h2>/.exec(sec)?.[1];
    expect(sec, `${name}: a Key idea box`).toContain('class="key"');
    expect(sec, `${name}: a worked example`).toContain('class="worked"');
    expect(sec, `${name}: a faded example`).toContain('class="worked faded"');
  }
  // the skip link goes to the first lesson heading (heading ids are cut at 40 characters)
  const first = /<h2>(1\.[^<]*)<\/h2>/.exec(SOURCE)![1];
  expect(SOURCE).toContain(`href="#s-${plain(first).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}"`);
  // builds on: the first Key box links the prerequisite, and the warm-up has a question that links it
  const key = /<div class="key">([\s\S]*?)<\/div>/.exec(SOURCE)![1];
  expect(key).toContain('href="proof-methods.html"');
  const topic = (TOPICS as { id: string; needs: string[]; status: string; year: number; words: string[] }[]).find((t) => t.id === 'proof-contradiction')!;
  expect(topic.needs).toEqual(['proof-methods']);
  expect(topic.status).toBe('live');
  expect(topic.year).toBe(2);
  const warm = /<h2>Warm-up[\s\S]*?<\/section>/.exec(SOURCE)![0];
  expect(warm).toContain('href="proof-methods.html"');
  expect((warm.match(/<div class="q"/g) ?? []).length).toBe(7);
  expect(warm).toContain('class="recap"');
  // exactly one flip section with two flip grids, a spot-the-mistake section, exam style, why it works, common traps, I can, where this goes next
  expect((SOURCE.match(/class="flip-section"/g) ?? []).length).toBe(1);
  for (const h of ['Spot the mistake', 'Exam style', 'Why it works', 'Common traps', 'Where this goes next', 'Proofs you must know']) expect(SOURCE, h).toContain(`<h2>${h}</h2>`);
  expect(SOURCE).toContain('<h2>I can&hellip;</h2>');
  expect(SOURCE).toContain('data-checklist="proof-contradiction"');
  expect(SOURCE).toContain('class="where-use"');
  expect(SOURCE).toContain('[Extra]');
  // sets: at least 6 Check-your-knowledge sets, and the numbers of questions
  expect((SOURCE.match(/<section class="ckw">/g) ?? []).length).toBeGreaterThanOrEqual(8);
  const qs = questions();
  expect(qs.length).toBeGreaterThanOrEqual(60);
  expect(qs.filter((q) => q.type === 'mc').length).toBeGreaterThanOrEqual(25);
  for (const q of qs) { expect(q.block, q.plain.slice(0, 50)).toContain('<div class="solution">'); expect(q.block, q.plain.slice(0, 50)).toContain('<ol class="ladder">'); }
  // the words strip: every word is in the glossary
  const ids = new Set((GLOSSARY as { id: string }[]).map((g) => g.id));
  for (const w of topic.words) expect(ids.has(w), w).toBe(true);
  const levels = new Map((GLOSSARY as { id: string; level: string }[]).map((g) => [g.id, g.level]));
  expect(levels.get('contradiction')).toBe('Y2');
  expect(levels.get('prime-factor')).toBe('Y2');
  // the scope: no mechanics or statistics, no formula that is not about proof
  expect(plain(SOURCE)).not.toMatch(/\bradians?\b|\bintegrat|\bdifferentiat|\bderivative\b/i);
});

test('multiple-choice options are plain text: no maths markup, no spoken fractions or roots', () => {
  for (const ul of SOURCE.matchAll(/<ul class="options">([\s\S]*?)<\/ul>/g)) {
    expect(ul[1]).not.toMatch(/\{m:|\{md:/);
    expect(plain(ul[1])).not.toMatch(/\bover\b|\broot \d|\bsquare root of \d/i);
  }
});

test('the page never says just, simply, clearly, obviously, easy, and every "always" and "never" in its own words is a true claim', () => {
  const text = plain(SOURCE.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<ul class="options">[\s\S]*?<\/ul>/g, ' '));
  expect(text).not.toMatch(/\b(?:just|simply|clearly|obviously|easy|easily)\b/i);
  const allSquaresMod3 = squaresMod(3);
  const ok: [RegExp, () => boolean][] = [
    // a converse: "if n is a multiple of 6 then n is even" is true and its converse fails at 4
    [/A converse is not always true/, () => 6 % 2 === 0 && 4 % 2 === 0 && 4 % 6 !== 0],
    // examples never prove a statement about all integers: n^2+n+41 is prime 40 times, then fails
    [/Checking examples never proves a statement about all integers/, () => range(0, 39).every((n) => isPrime(n * n + n + 41)) && !isPrime(40 * 40 + 40 + 41)],
    [/either true or false, never both/, () => true],
    [/It is never "none"/, () => true],
    [/Always one of a statement and its negation is true and the other is false/, () => true],
    [/They are never both true and never both false/, () => true],
    [/the remainder 2 never happens/, () => !squaresMod(4).has(2)],
    [/So the sum of two irrational numbers is always irrational/, () => Math.SQRT2 + -Math.SQRT2 === 0], // Tom's claim, which his question shows to be false
    [/A remainder of 2 never happens for a square/, () => !allSquaresMod3.has(2)],
    [/never 0\./, () => range(-100, 100).filter((n) => n % 5 !== 0).every((n) => (n * n) % 5 !== 0)],
    [/digits never end and never repeat/, () => true], // the proof of section 3 is what shows this for the square root of 2
    [/You can always reach it by cancelling/, () => range(1, 60).every((a) => range(1, 60).every((b) => gcd(a / gcd(a, b), b / gcd(a, b)) === 1))],
    [/a\^2=2b\^2 never happens for whole numbers/, () => range(1, 400).every((b) => !isSquare(2 * b * b))],
    [/The proof shows that never happens/, () => range(1, 400).every((b) => !isSquare(2 * b * b))],
    [/never equal/, () => 577 ** 2 !== 2 * 408 ** 2],
    [/the sum of two irrational numbers is not always irrational/i, () => Math.SQRT2 + (5 - Math.SQRT2) === 5 || Math.abs(Math.SQRT2 + (5 - Math.SQRT2) - 5) < 1e-12],
    [/The third is always true/, () => true],
    [/so 7 always divides it/, () => range(-30, 30).every((m) => range(-30, 30).every((n) => (14 * m + 21 * n) % 7 === 0))],
    [/The left side is always a multiple of (?:the common factor you can take out|3)/, () => range(-30, 30).every((m) => range(-30, 30).every((n) => (6 * m + 9 * n) % 3 === 0))],
    [/is true or false, never both/, () => true],
    [/Lowest terms always exist/, () => true],
    [/Euclid's number N=P\+1 is always prime/, () => !isPrime(euclid(6))], // the student's claim, which the question shows to be false
    [/says that N=P\+1 is always prime|N=P\+1 is always prime/, () => !isPrime(euclid(6))],
  ];
  const claims = [...text.matchAll(/[^.]*\b(?:always|never)\b[^.]*\./gi)].map((m) => m[0].trim());
  expect(claims.length).toBeGreaterThan(12);
  const problems = claims.filter((c) => !ok.some(([re, check]) => re.test(c) && check()));
  expect(problems).toEqual([]);
});

test('the lessons name the limits of each rule', () => {
  const text = plain(SOURCE);
  expect(text).toContain('Every integer is 3k, 3k+1 or 3k+2');
  expect(text).toContain('Euclid, a Greek mathematician, gave a proof more than two thousand years ago.');
  expect(text).toContain('N does not have to be prime. The proof only needs N to have a prime factor.');
  expect(text).toContain('The proof uses three facts.');
  // the lowest-terms step needs a and b to be positive integers (sqrt(2) is positive)
  expect(text).toContain('sqrt(2)=frac(a, b), where a and b are positive integers with no common factor');
  // the wording of the converse: swap the two parts
  expect(text).toContain('The converse swaps the "if" part and the "then" part.');
  for (const n of range(-40, 40)) expect(Math.abs(n % 3)).toBeLessThan(3);
});

test('a defined word is linked with its plain name, with no bracketed extra in the link text', async ({ page }) => {
  await page.goto('/courses/a-level/proof-contradiction.html');
  const texts = await page.locator('main a.term:not(.words-strip a)').allTextContents();
  expect(texts.length).toBeGreaterThan(10);
  expect(texts.filter((t) => t.includes('('))).toEqual([]);
});
