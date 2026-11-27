import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Polynomials page that a general test cannot make: the typed answer of each polynomial question is
// recomputed here from the question's own polynomial, and no wrong-answer value is also a right answer.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'courses', 'a-level', 'polynomials.html'), 'utf8');

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-' };
const decode = (t: string) => t.replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);

type Q = { qtext: string; answers: string[]; wrongs: string[]; mode: string };
const QUESTIONS: Q[] = SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
  const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
  return {
    qtext: /<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? '',
    answers: decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean),
    mode: /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? 'value',
    wrongs: [...(/<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '').matchAll(/data-if="([^"]*)"/g)].flatMap((m) => decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean)),
  };
});
const find = (fragment: string) => {
  const hits = QUESTIONS.filter((q) => q.qtext.includes(fragment));
  expect(hits.length, `one question contains ${fragment}`).toBe(1);
  return hits[0];
};

/** A typed polynomial such as "(x-2)(2x+3)(x+1)" or "x^3+5x^2+2x-8" as a function of x. */
function poly(text: string): (x: number) => number {
  const js = text.replace(/\s+/g, '').replace(/\^/g, '**').replace(/(\d|\))(?=[a-z(])/g, '$1*').replace(/([a-z])(?=\()/g, '$1*');
  expect(js, `"${text}" is a polynomial in x`).toMatch(/^[-+*()x\d.]+$/);
  return new Function('x', `return ${js};`) as (x: number) => number;
}
const XS = [-3.5, -2, -1, -0.5, 0.5, 1, 2.5, 3, 4, 7];
const closeTo = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

// ---- every question whose typed answer is a polynomial: the answer is the polynomial the question describes ----
// [text that finds the question, what the answer must equal as a function of x]
const EXPECTED: [string, (x: number) => number][] = [
  // warm-up and section 1: expanding
  ['Expand and simplify {m:(x+3)(x-5)}', (x) => (x + 3) * (x - 5)],
  ['Factorise {m:x^2+7x+12}', (x) => x * x + 7 * x + 12],
  ['Expand and simplify {m:3(x-4)+2x(x+1)}', (x) => 3 * (x - 4) + 2 * x * (x + 1)],
  ['Expand and simplify {m:(x+4)(x-1)(x+2)}', (x) => (x + 4) * (x - 1) * (x + 2)],
  ['Simplify {m:(4x^3+x^2-5)-(x^3-2x^2+3x)}', (x) => 4 * x ** 3 + x ** 2 - 5 - (x ** 3 - 2 * x ** 2 + 3 * x)],
  ['Expand and simplify {m:(3x-2)(x^2+x-1)}', (x) => (3 * x - 2) * (x * x + x - 1)],
  // section 2: the quotient times the bracket is the polynomial
  ['Divide {m:x^3+3x^2-4x-12} by {m:(x-2)}', (x) => (x ** 3 + 3 * x ** 2 - 4 * x - 12) / (x - 2)],
  ['Divide {m:x^3-x^2-10x-8} by {m:(x+2)}', (x) => (x ** 3 - x ** 2 - 10 * x - 8) / (x + 2)],
  ['Divide {m:2x^3+3x^2-11x-6} by {m:(x-2)}', (x) => (2 * x ** 3 + 3 * x ** 2 - 11 * x - 6) / (x - 2)],
  ['Divide {m:x^3+6x^2+5x-12} by {m:(x+3)}', (x) => (x ** 3 + 6 * x ** 2 + 5 * x - 12) / (x + 3)],
  // section 4: factorising (the product must equal the cubic)
  ['Factorise {m:x^3+2x^2-x-2} completely', (x) => x ** 3 + 2 * x ** 2 - x - 2],
  ['Factorise {m:x^3-7x+6} completely', (x) => x ** 3 - 7 * x + 6],
  ['Factorise {m:2x^3-3x^2-11x+6} completely', (x) => 2 * x ** 3 - 3 * x ** 2 - 11 * x + 6],
  ['Factorise {m:x^3-3x^2-4x+12} completely', (x) => x ** 3 - 3 * x ** 2 - 4 * x + 12],
  ['Now take {m:a=1}, so {m:f(x)=2x^3+x^2-7x-6}. Factorise', (x) => 2 * x ** 3 + x ** 2 - 7 * x - 6],
  // flip it: building from the roots
  ['roots 1, 2 and 3. Write it in expanded form', (x) => (x - 1) * (x - 2) * (x - 3)],
  ['roots {m:-1}, 1 and 4. Write it in expanded form', (x) => (x + 1) * (x - 1) * (x - 4)],
  ['roots 0, 2 and {m:-5}. Write it in expanded form', (x) => x * (x - 2) * (x + 5)],
  ['repeated root at {m:x=1} and a root at {m:x=-2}', (x) => (x - 1) ** 2 * (x + 2)],
  // mixed review and exam style
  ['Expand and simplify {m:(x+1)(x-4)(x+3)}', (x) => (x + 1) * (x - 4) * (x + 3)],
  ['Divide {m:2x^3+x^2-8x-4} by {m:(x+2)}', (x) => (2 * x ** 3 + x ** 2 - 8 * x - 4) / (x + 2)],
  ['Find the quotient when {m:x^3-2x^2+3} is divided by {m:(x+1)}', (x) => (x ** 3 - 2 * x * x + 3) / (x + 1)],
  ['crosses the x-axis at {m:x=-2}, {m:x=1} and {m:x=3}. It crosses the y-axis at {m:(0, -12)}', (x) => -2 * (x + 2) * (x - 1) * (x - 3)],
];

test('the typed answer of every polynomial question equals the polynomial the question describes', () => {
  const problems: string[] = [];
  for (const [fragment, expected] of EXPECTED) {
    const q = find(fragment);
    for (const answer of q.answers) {
      const f = poly(answer);
      for (const x of XS) if (Number.isFinite(expected(x)) && !closeTo(f(x), expected(x))) { problems.push(`${fragment}: key "${answer}" differs at x = ${x}`); break; }
    }
  }
  expect(EXPECTED.length).toBeGreaterThan(20);
  expect(problems).toEqual([]);
});

// ---- the integer solutions of each "solve" question, found by trying every whole number ----
const SOLVE: [string, (x: number) => number][] = [
  ['Find the whole numbers p from {m:-3} to 3', (x) => x ** 3 - 2 * x ** 2 - 5 * x + 6],
  ['Solve {m:x^3+x^2-14x-24=0}', (x) => x ** 3 + x * x - 14 * x - 24],
  ['Solve {m:x^3-5x^2+8x-4=0}', (x) => x ** 3 - 5 * x ** 2 + 8 * x - 4],
  ['Solve the quartic equation {m:x^4+x^3-7x^2-x+6=0}', (x) => x ** 4 + x ** 3 - 7 * x ** 2 - x + 6],
  ['Solve {m:x^3-4x^2-11x+30=0}', (x) => x ** 3 - 4 * x ** 2 - 11 * x + 30],
  ['Given that {m:(x-3)} is a factor of {m:f(x)}, solve', (x) => x ** 3 + 4 * x ** 2 - 11 * x - 30],
  ['Show that {m:(x+2)} is a factor of {m:f(x)}. Hence solve', (x) => x ** 3 - 5 * x ** 2 - 2 * x + 24],
];

test('every typed list of solutions is exactly the set of whole-number roots of its cubic', () => {
  for (const [fragment, f] of SOLVE) {
    const q = find(fragment);
    const typed = q.answers[0].split(/\s*or\s*/).map(Number).sort((a, b) => a - b);
    const roots = Array.from({ length: 61 }, (_, i) => i - 30).filter((r) => f(r) === 0);
    const inRange = fragment.startsWith('Find the whole numbers') ? roots.filter((r) => r >= -3 && r <= 3) : roots;
    expect(typed, fragment).toEqual(inRange);
  }
});

test('the quartic is covered: a worked example, a question with four solutions, and an "I can"', () => {
  expect(SOURCE).toContain('Worked example: a quartic');
  expect(SOURCE).toMatch(/\{m:x\^4\+x\^3-7x\^2-x\+6=\(x-1\)\(x-2\)\(x\+1\)\(x\+3\)\}/);
  const f = (x: number) => (x - 1) * (x - 2) * (x + 1) * (x + 3);
  expect(XS.every((x) => closeTo(f(x), x ** 4 + x ** 3 - 7 * x ** 2 - x + 6))).toBe(true);
  expect(find('Solve the quartic equation').answers[0].split(' or ')).toHaveLength(4);
  expect(SOURCE).toMatch(/<input type="checkbox"> factorise and solve a quartic/);
});

test('every "factorise completely" question asks for linear brackets only, and says so when a quadratic bracket is typed', () => {
  const complete = QUESTIONS.filter((q) => /Factorise \{m:[^}]*\} completely/.test(q.qtext));
  expect(complete).toHaveLength(5);
  const marked = [...SOURCE.matchAll(/<div class="q"[^>]*data-complete="linear"/g)];
  expect(marked).toHaveLength(5);
  for (const q of complete) expect(SOURCE).toContain(`data-answers="${q.answers[0]}" data-mode="exact" data-complete="linear"`);
});

// ---- an unknown coefficient k: f(p) = 0 is linear in k, so solve it directly ----
const UNKNOWN: [string, (x: number, k: number) => number, number][] = [
  ['{m:(x-1)} is a factor of {m:x^3+kx^2-x-3}', (x, k) => x ** 3 + k * x * x - x - 3, 1],
  ['{m:(x+2)} is a factor of {m:x^3-x^2+kx+6}', (x, k) => x ** 3 - x * x + k * x + 6, -2],
  ['{m:(x-3)} is a factor of {m:2x^3-5x^2+kx+6}', (x, k) => 2 * x ** 3 - 5 * x * x + k * x + 6, 3],
  ['{m:(2x-1)} is a factor of {m:2x^3+kx^2-5x+2}', (x, k) => 2 * x ** 3 + k * x * x - 5 * x + 2, 0.5],
  ['{m:(x+1)} is a factor of {m:x^3+kx^2+2x-4}', (x, k) => x ** 3 + k * x * x + 2 * x - 4, -1],
  ['{m:(x-2)} is a factor of {m:f(x)=2x^3+ax^2-7x-6}', (x, k) => 2 * x ** 3 + k * x * x - 7 * x - 6, 2],
];

test('the unknown coefficient in every factor question makes the bracket a factor', () => {
  for (const [fragment, f, p] of UNKNOWN) {
    const q = find(fragment);
    const k = Number(q.answers[0]);
    expect(f(p, k), `${fragment} with k = ${k}`).toBeCloseTo(0, 9);
    // and no other value works, because f(p) is linear in k with a non-zero slope
    expect(f(p, k + 1) - f(p, k), fragment).not.toBe(0);
  }
});

test('the two-unknown questions have a and b that make both given brackets factors', () => {
  const one = find('{m:(x-1)} and {m:(x+2)} are factors of {m:x^3+ax^2+bx-6}');
  const [a1, b1] = one.answers[0].replace(/[()]/g, '').split(',').map(Number);
  const f1 = (x: number) => x ** 3 + a1 * x * x + b1 * x - 6;
  expect([f1(1), f1(-2)]).toEqual([0, 0]);
  const two = find('{m:(x-2)} and {m:(x+3)} are both factors of {m:x^3+ax^2+bx+12}');
  const [a2, b2] = two.answers[0].replace(/[()]/g, '').split(',').map(Number);
  const f2 = (x: number) => x ** 3 + a2 * x * x + b2 * x + 12;
  expect([f2(2), f2(-3)]).toEqual([0, 0]);
});

// ---- remainders and other numbers ----
test('every remainder, value and discriminant on the page is right', () => {
  const f1 = (x: number) => x ** 3 + 2 * x * x - 3 * x + 4;
  expect(Number(find('Divide {m:x^3+2x^2-3x+4} by {m:(x-1)}. Find the remainder').answers[0])).toBe(f1(1));
  expect(Number(find('Find the remainder when {m:x^3+3x^2-2x+5} is divided by {m:(x-2)}').answers[0])).toBe(2 ** 3 + 3 * 4 - 4 + 5);
  expect(Number(find('Find the remainder when {m:2x^3-x+7} is divided by {m:(x+1)}').answers[0])).toBe(2 * -1 + 1 + 7);
  expect(Number(find('Work out {m:2x^3-x+4} when {m:x=-2}').answers[0])).toBe(2 * -8 + 2 + 4);
  expect(Number(find('Work out {m:f(-frac(1, 2))}').answers[0])).toBeCloseTo(2 * (-1 / 8) - 1 / 4 + 7 / 2 - 3, 12);
  const disc = (a: number, b: number) => a * a - 4 * b;
  expect(Number(find('Find the value of its discriminant').answers[0])).toBe(disc(2, 3));
  expect(find('How many different real solutions does {m:x^3-x^2-x-2=0} have').answers).toEqual(['1']);
  expect(disc(1, 1)).toBeLessThan(0); // x^2 + x + 1, the quadratic left after dividing by (x - 2)
  expect(Number(find('Find the coefficient of {m:x^2}').answers[0])).toBe(-3); // (x-1)^3 = x^3 - 3x^2 + 3x - 1
  expect(Number(find('passes through the point {m:(0, 12)}').answers[0])).toBe(12 / ((0 + 1) * (0 - 2) * (0 - 3)));
});

// ---- no wrong-answer message is attached to a value that is also a right answer ----
test('no wrong-answer value is accepted as a right answer', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const problems: string[] = [];
  let checked = 0;
  for (const q of QUESTIONS) {
    for (const wrong of q.wrongs) {
      checked += 1;
      if (matches(wrong, q.answers, q.mode)) problems.push(`${q.qtext.slice(0, 60)}: "${wrong}" is accepted as right`);
    }
    for (const right of q.answers) {
      if (q.answers.length && !matches(right, q.answers, q.mode)) problems.push(`${q.qtext.slice(0, 60)}: "${right}" is not accepted`);
    }
  }
  expect(checked).toBeGreaterThan(80);
  expect(problems).toEqual([]);
});

// ---- the figures draw the polynomials the text names ----
test('the figure captions and descriptions name the roots the curves have', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/polynomials.mjs');
  const desc = (id: string) => /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(FIGURES[id]())?.[1] ?? '';
  expect(desc('polynomials-cubic-roots')).toMatch(/\(-3, 0\)/);
  expect(desc('polynomials-repeated')).toMatch(/touches the axis at 1/);
  const f = (x: number) => x ** 3 + 2 * x * x - 5 * x - 6;
  expect([-3, -1, 2].map(f)).toEqual([0, 0, 0]);
  const g = (x: number) => x ** 3 - 3 * x + 2;
  expect([g(1), g(-2), g(0)]).toEqual([0, 0, 2]); // touches at 1, crosses at -2, meets the y-axis at (0, 2)
  expect(((x: number) => (x + 1) * (x - 2) * (x - 3))(0)).toBe(6);
  for (const id of Object.keys(FIGURES)) expect(FIGURES[id](), id).toContain('<desc');
});

test('in the browser, a partial factorisation is refused with a hint and the full one is accepted', async ({ page }) => {
  await page.goto('/courses/a-level/polynomials.html');
  const q = page.locator('.q[data-complete="linear"]').first();
  const input = q.locator('input.q-input');
  await input.fill('(x-1)(x^2+3x+2)');
  await q.locator('.btn-check').click();
  await expect(q.locator('.q-feedback')).toContainText('Factorise the quadratic as well.');
  await input.fill('(x+2)(x-1)(x+1)');
  await q.locator('.btn-check').click();
  await expect(q.locator('.q-feedback')).not.toContainText('Factorise the quadratic as well.');
  await expect(q).toHaveClass(/q-done|solved|correct/);
});

test('a defined word is linked with its plain name, with no bracketed extra in the link text', async ({ page }) => {
  await page.goto('/courses/a-level/polynomials.html');
  const texts = await page.locator('main a.term:not(.words-strip a)').allTextContents();
  expect(texts.length).toBeGreaterThan(10);
  expect(texts.filter((t) => t.includes('('))).toEqual([]);
});
