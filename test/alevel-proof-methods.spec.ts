import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Proof page that a general test cannot make. A proof page is full of claims ("this counterexample
// works", "these are the only primes in the range", "this identity holds"), so each one is recomputed here:
// the counterexample questions, the exhaustion questions, the identities, every sum written as numbers, the marks in
// each mark scheme, and the figure.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'books', 'a-level', 'proof-methods.html'), 'utf8');

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-' };
const decode = (t: string) => t.replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);

const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d += 1) if (n % d === 0) return false;
  return true;
};

type Question = { block: string; qtext: string; answers: string[]; wrongs: string[]; marks: number | null; markscheme: string[] };
function questions(): Question[] {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongs = [...(/<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '').matchAll(/data-if="([^"]*)"/g)].flatMap((m) => decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean));
    const marks = /data-marks="(\d+)"/.exec(attrs)?.[1];
    const markscheme = [...(/<ul class="markscheme">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '').matchAll(/<li><b>([A-Z]+\d*)<\/b>/g)].map((m) => m[1]);
    return { block, qtext: /<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? '', answers, wrongs, marks: marks ? Number(marks) : null, markscheme };
  });
}

// ---- counterexample questions: "Find the smallest positive integer (n) that disproves it / shows Mia is wrong" ----
// Each claim is true for the early values and false at the answer. The page's typed answer must be that smallest value.
const CLAIMS: { find: string; holds: (n: number) => boolean }[] = [
  { find: '{m:n^2+n+41}', holds: (n) => isPrime(n * n + n + 41) },
  { find: '{m:6n+1}', holds: (n) => isPrime(6 * n + 1) },
  { find: '{m:n^2+n+17}', holds: (n) => isPrime(n * n + n + 17) },
  { find: '{m:2^n-1}', holds: (n) => n < 2 || isPrime(2 ** n - 1) },
  { find: '{m:n^2>n}', holds: (n) => n * n > n },
  { find: '{m:n^2+n+1}', holds: (n) => isPrime(n * n + n + 1) },
];

test('each counterexample question has the smallest positive integer that breaks its claim as its answer', () => {
  const asked = questions().filter((q) => /smallest positive integer (?:n )?that (?:disproves it|shows Mia is wrong)/.test(q.qtext));
  expect(asked.length).toBe(CLAIMS.length);
  for (const claim of CLAIMS) {
    const matches = asked.filter((q) => q.qtext.includes(claim.find));
    expect(matches.length, claim.find).toBe(1);
    let smallest = 1;
    while (claim.holds(smallest)) smallest += 1;
    expect(matches[0].answers.map(Number), claim.find).toEqual([smallest]);
    // A wrong-answer message names a value that does NOT break the claim (it is a tempting but failed hunt).
    for (const w of matches[0].wrongs) {
      const n = Number(w);
      if (!Number.isNaN(n) && n >= 1 && n < smallest) expect(claim.holds(n), `${claim.find}: ${n} should not break the claim`).toBe(true);
    }
  }
});

test('the counterexamples quoted in the lesson and in the multiple-choice reasons really break their claims', () => {
  const squares = (n: number) => n * n + n + 41;
  expect(isPrime(squares(39))).toBe(true);
  expect(squares(40)).toBe(1681);
  expect(1681).toBe(41 * 41);
  expect(isPrime(6 * 3 + 1) && isPrime(6 * 2 + 1) && isPrime(6 + 1)).toBe(true);
  expect(6 * 4 + 1).toBe(25);
  expect(2 ** 4 - 1).toBe(15);
  expect(16 * 16 + 16 + 17).toBe(289);
  expect(17 * 17).toBe(289);
  // a^2 > b^2 does not give a > b: a = -3, b = 2
  expect((-3) ** 2 > 2 ** 2 && !(-3 > 2)).toBe(true);
  // 1 + 2 + 3 + 4 = 10, which is not a multiple of 4; three consecutive integers always add to a multiple of 3
  expect(1 + 2 + 3 + 4).toBe(10);
  expect(10 % 4).not.toBe(0);
  for (let n = -30; n <= 30; n += 1) expect((n + (n + 1) + (n + 2)) % 3 === 0).toBe(true);
  // converse of "multiple of 6 gives a multiple of 3" fails at 9
  expect(9 % 3 === 0 && 9 % 6 !== 0).toBe(true);
  // x^2 > 9 does not give x > 3: x = -4
  expect((-4) ** 2 > 9 && !(-4 > 3)).toBe(true);
  // x^2 = 25 does not give x = 5: x = -5
  expect((-5) ** 2).toBe(25);
  // 91 is not prime
  expect(7 * 13).toBe(91);
  expect(isPrime(91)).toBe(false);
});

// ---- exhaustion questions ----
test('the exhaustion lists and counts on the page are right', () => {
  const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(isPrime);
  expect(range(91, 99)).toEqual([97]); // "97 is the only prime between 90 and 100"
  expect(range(61, 69)).toHaveLength(2);
  expect(range(51, 59)).toEqual([53, 59]);
  expect(range(31, 49)).toHaveLength(5);
  expect(range(21, 29)).toEqual([23, 29]);
  const lastDigits = new Set(Array.from({ length: 10 }, (_, d) => (d * d) % 10));
  expect([...lastDigits].sort()).toEqual(['0', '1', '4', '5', '6', '9'].map(Number).sort());
  // squares leave remainder 0 or 1 when divided by 3, and 0 or 1 when divided by 4
  for (let n = -60; n <= 60; n += 1) {
    expect([0, 1]).toContain(((n * n) % 3 + 3) % 3);
    expect([0, 1]).toContain(((n * n) % 4 + 4) % 4);
    expect((n ** 3 - n) % 3 === 0).toBe(true); // === 0 also accepts the -0 that JavaScript gives for a negative multiple
    expect(((n * n - n) % 2 + 2) % 2).toBe(0);
  }
  const questionsWithAnswers = questions();
  const answerOf = (text: string) => questionsWithAnswers.find((q) => q.qtext.includes(text))?.answers;
  expect(answerOf('primes are there between 30 and 50')).toEqual(['5']);
  expect(answerOf('primes are there between 60 and 70')).toEqual(['2']);
  expect(answerOf('different last digits can a square number have')).toEqual([String(lastDigits.size)]);
  expect(answerOf('smallest prime number greater than 20')).toEqual(['23']);
  expect(answerOf('primes are there between 90 and 100')).toEqual(['1']);
});

// ---- identities and always-positive claims ----
// Every identity written on the page as {m:left=right} is listed here, with both sides as functions, and must hold.
const IDENTITIES: { text: string; left: (n: number) => number; right: (n: number) => number }[] = [
  { text: '(n+1)(n+1)=n^2+n+n+1', left: (n) => (n + 1) * (n + 1), right: (n) => n * n + n + n + 1 },
  { text: 'n^2-n=n(n-1)', left: (n) => n * n - n, right: (n) => n * (n - 1) },
  { text: '(n+1)^2-n^2=n^2+2n+1-n^2', left: (n) => (n + 1) ** 2 - n * n, right: (n) => n * n + 2 * n + 1 - n * n },
  { text: 'n+(n+1)+(n+2)=3n+3', left: (n) => n + (n + 1) + (n + 2), right: (n) => 3 * n + 3 },
  { text: '(2n+1)^2=4n^2+4n+1', left: (n) => (2 * n + 1) ** 2, right: (n) => 4 * n * n + 4 * n + 1 },
  { text: '(2n+1)^2-1=4n(n+1)', left: (n) => (2 * n + 1) ** 2 - 1, right: (n) => 4 * n * (n + 1) },
  { text: '(2a+1)+(2b+1)=2(a+b+1)', left: (n) => (2 * n + 1) + (2 * (n + 3) + 1), right: (n) => 2 * (n + (n + 3) + 1) },
  { text: '(n+3)^2-(n-3)^2=12n', left: (n) => (n + 3) ** 2 - (n - 3) ** 2, right: (n) => 12 * n },
  { text: '(2n+1)+(2n+3)=4n+4', left: (n) => (2 * n + 1) + (2 * n + 3), right: (n) => 4 * n + 4 },
  { text: '(3k+1)^2=9k^2+6k+1', left: (k) => (3 * k + 1) ** 2, right: (k) => 9 * k * k + 6 * k + 1 },
  { text: '(3k+2)^2=9k^2+12k+4', left: (k) => (3 * k + 2) ** 2, right: (k) => 9 * k * k + 12 * k + 4 },
  { text: 'x^2-6x+10=(x-3)^2+1', left: (x) => x * x - 6 * x + 10, right: (x) => (x - 3) ** 2 + 1 },
  { text: '-x^2+4x-5=-(x-2)^2-1', left: (x) => -x * x + 4 * x - 5, right: (x) => -((x - 2) ** 2) - 1 },
  { text: 'x^2-4x+7=(x-2)^2+3', left: (x) => x * x - 4 * x + 7, right: (x) => (x - 2) ** 2 + 3 },
  { text: 'x^2+4x+3=(x+2)^2-1', left: (x) => x * x + 4 * x + 3, right: (x) => (x + 2) ** 2 - 1 },
  { text: '(2n+3)^2-(2n-3)^2=24n', left: (n) => (2 * n + 3) ** 2 - (2 * n - 3) ** 2, right: (n) => 24 * n },
  { text: 'n^3-n=n(n-1)(n+1)', left: (n) => n ** 3 - n, right: (n) => n * (n - 1) * (n + 1) },
  { text: '(2k+1)^2=4k^2+4k+1', left: (k) => (2 * k + 1) ** 2, right: (k) => 4 * k * k + 4 * k + 1 },
  { text: '3x^2-12x+14=3(x-2)^2+2', left: (x) => 3 * x * x - 12 * x + 14, right: (x) => 3 * (x - 2) ** 2 + 2 },
  { text: 'x^2-8x+20=(x-4)^2+4', left: (x) => x * x - 8 * x + 20, right: (x) => (x - 4) ** 2 + 4 },
  { text: 'x^2-10x+30=(x-5)^2+5', left: (x) => x * x - 10 * x + 30, right: (x) => (x - 5) ** 2 + 5 },
  { text: 'x^2+6x+10=(x+3)^2+1', left: (x) => x * x + 6 * x + 10, right: (x) => (x + 3) ** 2 + 1 },
  { text: 'n+(n+1)+(n+2)+(n+3)=4n+6', left: (n) => 4 * n + 6, right: (n) => n + (n + 1) + (n + 2) + (n + 3) },
  { text: '(2n+1)+(2n+3)+(2n+5)+(2n+7)=8n+16', left: (n) => (2 * n + 1) + (2 * n + 3) + (2 * n + 5) + (2 * n + 7), right: (n) => 8 * n + 16 },
  { text: '2n+(2n+2)+(2n+4)=6n+6', left: (n) => 2 * n + (2 * n + 2) + (2 * n + 4), right: (n) => 6 * n + 6 },
  { text: 'n^2+(n+1)^2=n^2+n^2+2n+1', left: (n) => n * n + (n + 1) ** 2, right: (n) => n * n + n * n + 2 * n + 1 },
  { text: '(2n+1)^2=4n^2+4n+1=4n(n+1)+1', left: (n) => (2 * n + 1) ** 2, right: (n) => 4 * n * (n + 1) + 1 },
  { text: '2x^2-12x+19=2(x-3)^2+1', left: (x) => 2 * x * x - 12 * x + 19, right: (x) => 2 * (x - 3) ** 2 + 1 },
  { text: '(5k+1)^2=25k^2+10k+1', left: (k) => (5 * k + 1) ** 2, right: (k) => 25 * k * k + 10 * k + 1 },
  { text: '(5k+2)^2=25k^2+20k+4', left: (k) => (5 * k + 2) ** 2, right: (k) => 25 * k * k + 20 * k + 4 },
  { text: '(5k+3)^2=25k^2+30k+9', left: (k) => (5 * k + 3) ** 2, right: (k) => 25 * k * k + 30 * k + 9 },
  { text: '(5k+4)^2=25k^2+40k+16', left: (k) => (5 * k + 4) ** 2, right: (k) => 25 * k * k + 40 * k + 16 },
  { text: '(x-3)^2=x^2-6x+9', left: (x) => (x - 3) ** 2, right: (x) => x * x - 6 * x + 9 },
  { text: '(x-2)^2=x^2-4x+4', left: (x) => (x - 2) ** 2, right: (x) => x * x - 4 * x + 4 },
  { text: '(x-5)^2=x^2-10x+25', left: (x) => (x - 5) ** 2, right: (x) => x * x - 10 * x + 25 },
  { text: '(x+3)^2=x^2+6x+9', left: (x) => (x + 3) ** 2, right: (x) => x * x + 6 * x + 9 },
  { text: '(n+3)^2=n^2+6n+9', left: (n) => (n + 3) ** 2, right: (n) => n * n + 6 * n + 9 },
  { text: '(n-3)^2=n^2-6n+9', left: (n) => (n - 3) ** 2, right: (n) => n * n - 6 * n + 9 },
  { text: '(x+2)^2+3=x^2+4x+7', left: (x) => (x + 2) ** 2 + 3, right: (x) => x * x + 4 * x + 7 },
  { text: '(3k+1)^2=9k^2+6k+1=3(3k^2+2k)+1', left: (k) => (3 * k + 1) ** 2, right: (k) => 3 * (3 * k * k + 2 * k) + 1 },
  { text: '(3k+2)^2=9k^2+12k+4=3(3k^2+4k+1)+1', left: (k) => (3 * k + 2) ** 2, right: (k) => 3 * (3 * k * k + 4 * k + 1) + 1 },
  { text: '(5k+3)^2=25k^2+30k+9=5(5k^2+6k+1)+4', left: (k) => (5 * k + 3) ** 2, right: (k) => 5 * (5 * k * k + 6 * k + 1) + 4 },
  { text: '(5k+4)^2=25k^2+40k+16=5(5k^2+8k+3)+1', left: (k) => (5 * k + 4) ** 2, right: (k) => 5 * (5 * k * k + 8 * k + 3) + 1 },
  { text: '(5k+1)^2=25k^2+10k+1=5(5k^2+2k)+1', left: (k) => (5 * k + 1) ** 2, right: (k) => 5 * (5 * k * k + 2 * k) + 1 },
  { text: '(5k+2)^2=25k^2+20k+4=5(5k^2+4k)+4', left: (k) => (5 * k + 2) ** 2, right: (k) => 5 * (5 * k * k + 4 * k) + 4 },
];

test('every identity written on the page holds for 61 values', () => {
  for (const id of IDENTITIES) {
    expect(SOURCE, id.text).toContain(`{m:${id.text}`);
    for (let n = -30; n <= 30; n += 1) expect(id.left(n), `${id.text} at ${n}`).toBeCloseTo(id.right(n), 9);
  }
});

test('every line of working written with numbers only is right', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const m of SOURCE.matchAll(/\{m:([-+*()\d.=^ ]+)\}/g)) {
    const parts = m[1].split('=').map((p) => p.trim());
    if (parts.length < 2 || parts.some((p) => p === '' || !/\d/.test(p))) continue;
    const values = parts.map((p) => Function(`"use strict"; return (${p.replaceAll('^', '**')});`)() as number);
    checked += 1;
    if (values.some((v) => Math.abs(v - values[0]) > 1e-9)) problems.push(`${m[0]} is not right: ${values.join(' vs ')}`);
  }
  expect(checked).toBeGreaterThan(25);
  expect(problems).toEqual([]);
});

test('each exam-style mark scheme awards exactly the marks the question is worth', () => {
  const marked = questions().filter((q) => q.marks !== null);
  expect(marked.length).toBeGreaterThanOrEqual(5);
  for (const q of marked) {
    expect(q.markscheme.length, q.qtext.slice(0, 60)).toBe(q.marks);
    expect(q.qtext, 'the marks appear in the question text').toContain(`[${q.marks} mark`);
  }
});

test('the always-positive figure and the page agree', async () => {
  const { FIGURES, ALWAYS_POSITIVE } = await import('../src/book/alevel/figures/proof-methods.mjs');
  const { a, b, c, p, q } = ALWAYS_POSITIVE;
  for (let x = -20; x <= 20; x += 1) expect(a * x * x + b * x + c).toBe(a * (x + p) ** 2 + q);
  const svg: string = FIGURES['proof-methods-always-positive']();
  expect(svg).toContain(`lowest point (${-p}, ${q})`);
  expect(SOURCE).toContain('{fig:proof-methods-always-positive}');
  const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg)?.[1] ?? '';
  expect(desc).toContain(`(${-p}, ${q})`);
});

test('a defined word is linked with its plain name, with no bracketed extra in the link text', async ({ page }) => {
  await page.goto('/books/a-level/proof-methods.html');
  // The "Words you need" strip lists each glossary entry under its full name, so it is left out.
  const texts = await page.locator('main a.term:not(.words-strip a)').allTextContents();
  expect(texts.length).toBeGreaterThan(15);
  expect(texts.filter((t) => t.includes('('))).toEqual([]);
});
