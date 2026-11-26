import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Binomial expansion page that a general test cannot make. Every coefficient, every typed key and every
// estimate is recomputed here with BigInt arithmetic (no floating point), then compared with what the page says.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'books', 'a-level', 'binomial-positive.html'), 'utf8');

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-' };
const decode = (t: string) => t.replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);

// ---- exact arithmetic ----
const factorial = (n: number): bigint => (n <= 1 ? 1n : BigInt(n) * factorial(n - 1));
const nCr = (n: number, r: number): bigint => factorial(n) / (factorial(r) * factorial(n - r));
const pow = (b: number, e: number): bigint => BigInt(b) ** BigInt(e);

/** The coefficients of (a + b x)^n in ascending powers of x, as exact integers. */
const expand = (a: number, b: number, n: number): bigint[] => Array.from({ length: n + 1 }, (_, r) => nCr(n, r) * pow(a, n - r) * pow(b, r));

/** Read a typed polynomial answer such as "1-8x+24x^2" into coefficients by power of x. */
function parsePolynomial(text: string): Map<number, bigint> | null {
  const out = new Map<number, bigint>();
  for (const part of text.replace(/\s+/g, '').split(/(?=[+-])/).filter(Boolean)) {
    const m = /^([+-]?)(\d*)(x?)(?:\^(\d+))?$/.exec(part);
    if (!m || (m[2] === '' && m[3] === '')) return null;
    const value = (m[1] === '-' ? -1n : 1n) * (m[2] === '' ? 1n : BigInt(m[2]));
    const power = m[3] === '' ? 0 : m[4] ? Number(m[4]) : 1;
    out.set(power, (out.get(power) ?? 0n) + value);
  }
  return out;
}
const asMap = (coeffs: bigint[]) => new Map(coeffs.map((c, power) => [power, c] as [number, bigint]).filter(([, c]) => c !== 0n));
const clean = (m: Map<number, bigint>) => new Map([...m].filter(([, c]) => c !== 0n));
const key = (m: Map<number, bigint>) => [...clean(m)].map(([power, c]) => `${power}:${c}`).sort().join(',');

/** The sum of the first `count` terms of (1 + num/den)^n, rounded half up to `dp` decimal places, as text. */
function estimate(n: number, num: bigint, den: bigint, count: number, dp: number): string {
  let top = 0n;
  for (let r = 0; r < count; r += 1) top += nCr(n, r) * num ** BigInt(r) * den ** BigInt(count - 1 - r);
  const bottom = den ** BigInt(count - 1); // every term r is nCr * num^r / den^r, brought to the denominator den^(count-1)
  const scale = 10n ** BigInt(dp);
  const negative = top < 0n;
  const scaled = ((negative ? -top : top) * scale * 2n + bottom) / (bottom * 2n); // round half up
  const digits = (negative ? -scaled : scaled).toString().padStart(dp + 1, '0');
  return `${digits.slice(0, digits.length - dp)}.${digits.slice(digits.length - dp)}`;
}

function questions() {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongs = [...(/<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '').matchAll(/data-if="([^"]*)"/g)].flatMap((m) => decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean));
    const qtext = /<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? '';
    return { block, attrs, answers, wrongs, qtext, marks: Number(/data-marks="(\d+)"/.exec(attrs)?.[1] ?? 0) };
  });
}
const QUESTIONS = questions();
function find(fragment: string) {
  const hits = QUESTIONS.filter((q) => q.qtext.includes(fragment));
  expect(hits.length, `exactly one question contains: ${fragment}`).toBe(1);
  return hits[0];
}
const stripMaths = (t: string) => t.replace(/<[^>]+>/g, '').replace(/\{m:[^}]*\}/g, '');

// ---- typed expansions: (fragment, a, b, n, how many terms the question asks for; 0 means all of them) ----
const EXPANSIONS: [string, number, number, number, number][] = [
  ['Expand {m:(x+1)^4}', 1, 1, 4, 0],
  ['Expand {m:(x+3)^3}', 3, 1, 3, 0],
  ['Expand {m:(x-2)^4}', -2, 1, 4, 0],
  ['first three terms of {m:(1+4x)^5}', 1, 4, 5, 3],
  ['first three terms of {m:(2+x)^5}', 2, 1, 5, 3],
  ['Expand {m:(1-2x)^4}', 1, -2, 4, 0],
  ['Expand {m:(3-x)^3}', 3, -1, 3, 0],
  ['Expand {m:(2+x)^3}', 2, 1, 3, 0],
  ['first three terms, in ascending powers of x, of the expansion of {m:(2+3x)^5}', 2, 3, 5, 3],
];
test('every typed expansion is the exact expansion, with every coefficient and sign right', () => {
  for (const [fragment, a, b, n, terms] of EXPANSIONS) {
    const q = find(fragment);
    const all = expand(a, b, n);
    const expected = asMap(terms === 0 ? all : all.slice(0, terms));
    const typed = parsePolynomial(q.answers[0]);
    expect(typed, `${fragment}: key "${q.answers[0]}" can be read`).not.toBeNull();
    expect(clean(typed!), fragment).toEqual(expected);
  }
});

// ---- one coefficient or term: (fragment, a, b, n, power of x) -> the key is that coefficient ----
const COEFFICIENTS: [string, number, number, number, number][] = [
  ['coefficient of {m:x^2} in the expansion of {m:(1+3x)^7}', 1, 3, 7, 2],
  ['coefficient of {m:x^3} in the expansion of {m:(2+x)^6}', 2, 1, 6, 3],
  ['coefficient of {m:x^4} in the expansion of {m:(1-x)^9}', 1, -1, 9, 4],
  ['coefficient of {m:x^2} in the expansion of {m:(3-2x)^5}', 3, -2, 5, 2],
  ['coefficient of {m:x^2} in the expansion of {m:(1-3x)^6}', 1, -3, 6, 2],
  ['coefficient of {m:x^3} in the expansion of {m:(3-2x)^6}', 3, -2, 6, 3],
];
test('every typed coefficient is the exact coefficient of that power of x', () => {
  for (const [fragment, a, b, n, power] of COEFFICIENTS) {
    const q = find(fragment);
    expect(BigInt(q.answers[0]), fragment).toBe(expand(a, b, n)[power]);
  }
});

const TERMS: [string, number, number, number, number][] = [
  ['fourth term of the expansion of {m:(1+2x)^6}', 1, 2, 6, 3],
  ['fifth term of the expansion of {m:(2+x)^6}', 2, 1, 6, 4],
  ['last term of the expansion of {m:(2+3x)^6}', 2, 3, 6, 6],
];
test('every typed single term has the exact coefficient and the power of x that its position gives', () => {
  for (const [fragment, a, b, n, r] of TERMS) {
    const typed = parsePolynomial(find(fragment).answers[0]);
    expect(clean(typed!), fragment).toEqual(new Map([[r, expand(a, b, n)[r]]]));
  }
});

// ---- factorials and nCr as numbers ----
test('the typed values of factorials and nCr questions are exact', () => {
  expect(BigInt(find('Work out {m:5!}.').answers[0])).toBe(factorial(5));
  expect(BigInt(find('Work out {m:frac(9!, 7!)}').answers[0])).toBe(factorial(9) / factorial(7));
  expect(BigInt(find('Use the symmetry').answers[0])).toBe(nCr(15, 14));
  const eight = QUESTIONS.find((q) => q.qtext.includes('alttext="8C3"') && q.qtext.startsWith('Work out'));
  expect(BigInt(eight!.answers[0])).toBe(nCr(8, 3));
  const nine = QUESTIONS.find((q) => q.qtext.includes('alttext="9C2"') && q.qtext.startsWith('Work out'));
  expect(BigInt(nine!.answers[0])).toBe(nCr(9, 2));
  // "nC2 = 28" and "the coefficient of x^2 in (1 + x)^n is 45": find the n by search and compare.
  const n28 = Array.from({ length: 60 }, (_, n) => n).filter((n) => n >= 2 && nCr(n, 2) === 28n);
  expect(n28).toEqual([8]);
  expect(find('{m:28}. Find n').answers).toEqual(['8']);
  const n45 = Array.from({ length: 60 }, (_, n) => n).filter((n) => n >= 2 && nCr(n, 2) === 45n);
  expect(n45).toEqual([10]);
  expect(find('is 45, where n is a positive whole number').answers).toEqual(['10']);
  const n21 = Array.from({ length: 60 }, (_, n) => n).filter((n) => n >= 2 && nCr(n, 2) === 21n);
  expect(n21).toEqual([7]);
  expect(SOURCE).toContain('{m:n=7}');
});

test('the middle numbers of the typed row, the Pascal sums and every nCr = value on the page are exact', () => {
  // Every "nCr = number" written with the raw nCr symbol, for example [8C3] = 56 or [7C3] = {m:35}.
  let checked = 0;
  const problems: string[] = [];
  for (const m of SOURCE.matchAll(/alttext="(\d+)C(\d+)">(?:(?!<\/math>)[\s\S])*<\/math>\s*=\s*(?:\{m:)?(\d+)\b(?!\*|\^|!)/g)) {
    checked += 1;
    if (nCr(Number(m[1]), Number(m[2])) !== BigInt(m[3])) problems.push(`${m[1]}C${m[2]} is written as ${m[3]}`);
  }
  expect(checked).toBeGreaterThan(8);
  expect(problems).toEqual([]);
  // The rows quoted in the text.
  for (const n of [3, 4, 5, 6, 7, 8, 9]) {
    const row = Array.from({ length: n + 1 }, (_, r) => nCr(n, r)).join(', ');
    if (n >= 5) expect(SOURCE, `row ${n}`).toContain(row);
  }
  expect(SOURCE).toContain('1, 9, 36, 84, 126, 126, 84, 36, 9, 1');
});

// ---- unknowns: put the key back into the question and check the coefficient it was given ----
test('every unknown that a typed key gives really does produce the stated coefficient', () => {
  // (1+kx)^4, x^2 coefficient 54, k = 3
  expect(expand(1, Number(find('is 54, and k is positive').answers[0]), 4)[2]).toBe(54n);
  // (3+ax)^4, x coefficient -216
  expect(expand(3, Number(find('(3+ax)^4}').answers[0]), 4)[1]).toBe(-216n);
  // (1+kx)^3, x^2 coefficient 12, k positive
  expect(expand(1, Number(find('is 12, and k is positive').answers[0]), 3)[2]).toBe(12n);
  // (2+x)^n, x coefficient 192: n is the only whole number that works
  const n = Number(find('{m:(2+x)^n} is 192').answers[0]);
  expect(expand(2, 1, n)[1]).toBe(192n);
  expect(Array.from({ length: 40 }, (_, i) => i + 1).filter((m) => expand(2, 1, m)[1] === 192n)).toEqual([n]);
  // (1+kx)^5, x^2 coefficient 90: k = 3 or -3 and nothing else
  expect([-3, 3].map((k) => expand(1, k, 5)[2])).toEqual([90n, 90n]);
  // the worked examples: 135 with k = 3 or -3; 400 with a = 5; n = 6 gives 60; 189/25 for both coefficients; 160 with k = 4
  expect([-3, 3].map((k) => expand(1, k, 6)[2])).toEqual([135n, 135n]);
  expect(expand(2, 5, 5)[1]).toBe(400n);
  expect(expand(1, 2, 6)[2]).toBe(60n);
  expect(Array.from({ length: 40 }, (_, m) => m).filter((m) => m >= 2 && expand(1, 2, m)[2] === 60n)).toEqual([6]);
  const [x2, x3] = [expand(1, 1, 7)[2] * 3n * 3n, expand(1, 1, 7)[3] * 3n * 3n * 3n]; // 21 * 3^2 and 35 * 3^3, each over 5^2 and 5^3
  expect(x2 * 5n).toBe(x3); // 189/25 = 945/125
  expect(expand(1, 4, 5)[2]).toBe(160n);
});

test('the flip-it keys give back the expansion on the page', () => {
  expect(expand(1, 2, 5).map(String).join(', ')).toBe('1, 10, 40, 80, 80, 32');
  expect(expand(1, 2, 6).slice(0, 3).map(String).join(', ')).toBe('1, 12, 60');
  expect(expand(2, -1, 5).map(String).join(', ')).toBe('32, -80, 80, -40, 10, -1');
  expect(expand(1, -4, 3).map(String).join(', ')).toBe('1, -12, 48, -64');
  expect(expand(1, 4, 5).map(String).join(', ')).toBe('1, 20, 160, 640, 1280, 1024');
  expect(expand(3, -2, 4).map(String).join(', ')).toBe('81, -216, 216, -96, 16');
  expect(expand(1, 3, 5).slice(0, 3).map(String).join(', ')).toBe('1, 15, 90');
  expect(expand(3, -1, 4).slice(0, 3).map(String).join(', ')).toBe('81, -108, 54');
  expect(find('where a is positive. Find a').answers).toEqual(['3']);
  expect(find('comes from {m:(3+bx)^4}').answers).toEqual(['-2']);
  expect(find('comes from {m:(1+bx)^5}. Find b').answers).toEqual(['4']);
});

// ---- estimates: the typed answer must equal the exact sum of the stated terms, correctly rounded ----
const ESTIMATES: [string, number, bigint, bigint, number, number][] = [
  // fragment, n, numerator and denominator of the small number, terms used, decimal places
  ['to estimate {m:1.01^6}', 6, 1n, 100n, 3, 4],
  ['to estimate {m:0.99^8}', 8, -1n, 100n, 3, 4],
  ['to estimate {m:1.1^5}', 5, 1n, 10n, 4, 2],
  ['to estimate {m:1.04^5}', 5, 4n, 100n, 3, 3],
];
test('every typed estimate is the exact sum of the stated terms, rounded as the question asks', () => {
  for (const [fragment, n, num, den, count, dp] of ESTIMATES) {
    const q = find(fragment);
    expect(Number(q.answers[0]).toFixed(dp), fragment).toBe(estimate(n, num, den, count, dp));
  }
  // x = 0.01 in the expansions with a coefficient of x: (1 + 3x)^5 to x^2 and (1 + 2x)^8 to x^2
  expect(Number(find('to estimate {m:1.03^5}').answers[0]).toFixed(3)).toBe(estimate(5, 3n, 100n, 3, 3));
  expect(Number(find('to estimate {m:1.02^8}. Give your estimate').answers[0]).toFixed(4)).toBe(estimate(8, 2n, 100n, 3, 4));
});

test('the numbers worked out in the estimating section are exact', () => {
  expect(estimate(8, 2n, 100n, 4, 6)).toBe('1.171648');
  expect(estimate(8, 2n, 100n, 3, 4)).toBe('1.1712');
  expect(estimate(6, -2n, 100n, 3, 3)).toBe('0.886');
  expect(estimate(6, 2n, 100n, 4, 5)).toBe('1.12616');
  expect(estimate(10, 1n, 100n, 3, 4)).toBe('1.1045');
  // 2.01^5 = (2 + 0.01)^5: the first three terms are 32 + 0.8 + 0.008, which is 328080 ten-thousandths
  let top = 0n;
  for (let r = 0; r < 3; r += 1) top += nCr(5, r) * 2n ** BigInt(5 - r) * 100n ** BigInt(2 - r);
  expect(top).toBe(328080n);
  // the true values quoted next to the estimates
  const truth = (num: number, den: number, n: number) => Number((BigInt(den + num) ** BigInt(n) * 10n ** 8n) / BigInt(den) ** BigInt(n)) / 1e8;
  expect(truth(2, 100, 8)).toBeCloseTo(1.17165938, 7);
  expect(truth(-2, 100, 6)).toBeCloseTo(0.88584238, 7);
  expect(truth(2, 100, 6)).toBeCloseTo(1.12616242, 7);
  expect(truth(1, 100, 10)).toBeCloseTo(1.10462213, 7);
  expect(truth(1, 100, 6)).toBeCloseTo(1.06152015, 7);
  expect(truth(-1, 100, 8)).toBeCloseTo(0.92274469, 7);
  expect(truth(10, 100, 5)).toBeCloseTo(1.61051, 7);
  expect(truth(3, 100, 5)).toBeCloseTo(1.15927407, 7);
  expect(truth(4, 100, 5)).toBeCloseTo(1.21665290, 7);
  expect(201n ** 5n).toBe(328080401001n); // 2.01^5 = 32.8080401001, which the page quotes as 32.80804
  // the probabilities in the in-context note
  const p = [0, 1, 2, 3].map((r) => Number(nCr(3, r)) * 0.7 ** (3 - r) * 0.3 ** r);
  expect(p.map((v) => v.toFixed(3))).toEqual(['0.343', '0.441', '0.189', '0.027']);
  expect(p.reduce((a, b) => a + b)).toBeCloseTo(1, 12);
});

// ---- the wrong-answer values must be mistakes, never the right answer ----
test('no wrong-answer value is also an accepted answer', () => {
  const problems: string[] = [];
  const norm = (t: string) => t.replace(/\s+/g, '');
  for (const q of QUESTIONS) {
    for (const w of q.wrongs) {
      if (q.answers.some((a) => norm(a) === norm(w))) problems.push(`${stripMaths(q.qtext).slice(0, 50)}: "${w}" is the right answer`);
      const wp = parsePolynomial(w);
      for (const a of q.answers) {
        const ap = parsePolynomial(a);
        if (wp && ap && /x/.test(a) && key(wp) === key(ap)) problems.push(`${stripMaths(q.qtext).slice(0, 50)}: "${w}" is the same polynomial as the key`);
      }
    }
  }
  expect(problems).toEqual([]);
});

test('every wrong-answer polynomial is a real slip: it differs from the key', () => {
  let checked = 0;
  for (const q of QUESTIONS) {
    if (!q.answers.some((a) => /x/.test(a))) continue;
    const key = parsePolynomial(q.answers[0]);
    if (!key) continue;
    for (const w of q.wrongs) {
      const wp = parsePolynomial(w);
      if (!wp) continue;
      checked += 1;
      expect(clean(wp), `${w} versus ${q.answers[0]}`).not.toEqual(clean(key));
    }
  }
  expect(checked).toBeGreaterThan(8);
});

test('every simple sum written as {m:a-b=c} on the page is right', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const m of SOURCE.matchAll(/\{m:(-?\d+(?:\.\d+)?)([-+*])(-?\d+(?:\.\d+)?)=(-?\d+(?:\.\d+)?)\}/g)) {
    const [a, op, b, c] = [Number(m[1]), m[2], Number(m[3]), Number(m[4])];
    const got = op === '+' ? a + b : op === '-' ? a - b : a * b;
    checked += 1;
    if (Math.abs(got - c) > 1e-9) problems.push(`${m[0]} should end in ${got}`);
  }
  expect(checked).toBeGreaterThan(30);
  expect(problems).toEqual([]);
});

test('every multi-step chain such as {m:a*b*c=d*e=f} ends in the right number', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const m of SOURCE.matchAll(/\{m:((?:[-+*()\d.]|\^)+(?:=(?:[-+*()\d.]|\^)+)+)\}/g)) {
    if (SOURCE.slice(Math.max(0, m.index - 12), m.index).includes('</math>')) continue; // an nCr in front of the chain is a coefficient of its left side
    const sides = m[1].split('=');
    if (!sides.every((s) => /^[-+*()\d.^]+$/.test(s) && !/\(\)|\^\^/.test(s))) continue;
    let values: number[];
    try {
      // The text is digits, + - * ( ) and ^ only, so it is safe to turn ^ into ** and evaluate.
      values = sides.map((s) => Function(`"use strict"; return (${s.replace(/\^/g, '**')});`)() as number);
    } catch { continue; }
    checked += 1;
    if (values.some((v) => Math.abs(v - values[0]) > 1e-9 * Math.max(1, Math.abs(values[0])))) problems.push(`${m[1]} -> ${values.join(' ; ')}`);
  }
  expect(checked).toBeGreaterThan(60);
  expect(problems).toEqual([]);
});

test('every exam question has a mark scheme whose marks add up to the marks asked for', () => {
  const exam = QUESTIONS.filter((q) => q.marks > 0);
  expect(exam.length).toBe(5);
  for (const q of exam) {
    const scheme = /<ul class="markscheme">([\s\S]*?)<\/ul>/.exec(q.block)?.[1] ?? '';
    const awarded = [...scheme.matchAll(/<b>([A-Z])(\d)<\/b>/g)].reduce((sum, m) => sum + Number(m[2]), 0);
    expect(awarded, stripMaths(q.qtext).slice(0, 60)).toBe(q.marks);
    expect(q.qtext).toContain(`[${q.marks} marks]`);
  }
});

// ---- the pictures ----
test("Pascal's triangle figure is built by adding, matches nCr, and shows the sum the caption names", async () => {
  const { FIGURES, pascalRows, PICKED } = await import('../src/book/alevel/figures/binomial-positive.mjs');
  const rows: number[][] = pascalRows(6);
  expect(rows).toHaveLength(7);
  rows.forEach((row, n) => row.forEach((v, r) => expect(BigInt(v), `row ${n} position ${r}`).toBe(nCr(n, r))));
  expect(rows[5].join(',')).toBe('1,5,10,10,5,1');
  expect(rows[6].join(',')).toBe('1,6,15,20,15,6,1');
  expect(rows[6][PICKED.position]).toBe(rows[5][PICKED.position - 1] + rows[5][PICKED.position]);
  const svg: string = FIGURES['binomial-positive-pascal']();
  const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg)?.[1] ?? '';
  for (const [n, row] of rows.entries()) expect(desc, `row ${n} in desc`).toContain(`Row ${n} is ${row.join(' ')}`);
  expect(svg).toContain('10 + 10 = 20');
  const caption = /\{fig:binomial-positive-pascal\}<figcaption>([\s\S]*?)<\/figcaption>/.exec(SOURCE)?.[1] ?? '';
  expect(caption).toMatch(/20 in row 6/);
  expect(caption).toMatch(/two 10s above it in row 5/);
});

test('the term figure states the same arithmetic as the worked example it sits in', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/binomial-positive.mjs');
  const svg: string = FIGURES['binomial-positive-term']();
  const term = nCr(5, 2) * pow(2, 3) * pow(3, 2); // 10 * 8 * 9
  expect(term).toBe(720n);
  expect(svg).toContain('5C2 = 10');
  expect(svg).toContain('2<tspan');
  expect(svg).toContain(`= ${term}x`);
  expect(/<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg)?.[1]).toContain('720');
  expect(SOURCE).toContain('10*8*9x^2=720x^2');
});

// ---- the page, as a student sees it ----
test('a defined word is linked with its plain name, with no bracketed extra in the link text', async ({ page }) => {
  await page.goto('/books/a-level/binomial-positive.html');
  const texts = await page.locator('main a.term:not(.words-strip a)').allTextContents();
  expect(texts.length).toBeGreaterThan(8);
  expect(texts.filter((t) => t.includes('('))).toEqual([]);
});

test('the page has the sections the book promises, and each nCr symbol reads as "n C r" to a screen reader', async ({ page }) => {
  await page.goto('/books/a-level/binomial-positive.html');
  await expect(page.locator('section.flip-section')).toHaveCount(1);
  await expect(page.locator('.q')).not.toHaveCount(0);
  const alts = await page.locator('main math[alttext$="C2"], main math[alttext$="C3"]').evaluateAll((els) => els.map((e) => e.getAttribute('alttext')));
  expect(alts.length).toBeGreaterThan(5);
  for (const t of alts) expect(t).toMatch(/^[\dn]+C[\dnr]+$/);
});
