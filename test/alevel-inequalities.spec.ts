import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Inequalities page that a general test cannot make: the arithmetic written on pictures and captions,
// the wrong-answer values of every inequality question, what a question figure's description gives away,
// and the link text of defined words.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'books', 'a-level', 'inequalities.html'), 'utf8');

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-' };
const decode = (t: string) => t.replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);

// ---- a tiny reader for inequality answers such as "x<-1 or x>=4", "-3<x<=2", "k>11/4" ----
const num = (t: string) => (t.includes('/') ? t.split('/').map(Number).reduce((a, b) => a / b) : Number(t));
const CMP: Record<string, (a: number, b: number) => boolean> = { '<': (a, b) => a < b - 1e-12, '>': (a, b) => a > b + 1e-12, '<=': (a, b) => a <= b + 1e-12, '>=': (a, b) => a >= b - 1e-12 };
function parseInequality(text: string): ((v: number) => boolean) | null {
  const ors = text.split(/\s+or\s+/).map((o) => o.split(/\s+and\s+/).map((part) => part.trim().split(/(<=|>=|<|>)/).map((x) => x.trim())));
  const isVar = (t: string) => /^[a-z]$/.test(t);
  for (const ands of ors) for (const t of ands) {
    if (t.length < 3 || t.length % 2 === 0) return null;
    for (let i = 0; i < t.length; i += 2) if (!isVar(t[i]) && Number.isNaN(num(t[i]))) return null;
  }
  return (v) => ors.some((ands) => ands.every((t) => {
    for (let i = 1; i < t.length; i += 2) {
      const l = isVar(t[i - 1]) ? v : num(t[i - 1]);
      const r = isVar(t[i + 1]) ? v : num(t[i + 1]);
      if (!CMP[t[i]](l, r)) return false;
    }
    return true;
  }));
}
const GRID = Array.from({ length: 401 }, (_, i) => -25 + i * 0.125);
const same = (f: (v: number) => boolean, g: (v: number) => boolean) => GRID.every((v) => f(v) === g(v));

function questions() {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongs = [...(/<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '').matchAll(/data-if="([^"]*)"/g)].flatMap((m) => decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean));
    return { name: (/<p class="qtext">([\s\S]{0,60})/.exec(block)?.[1] ?? '').replace(/<[^>]+>/g, ''), answers, wrongs };
  });
}

test('every wrong-answer value of an inequality question is a real mistake: not every number, not none, and not the answer', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const q of questions()) {
    const right = q.answers.map(parseInequality);
    if (right.length === 0 || right.some((f) => f === null)) continue;
    for (const value of q.wrongs) {
      const f = parseInequality(value);
      if (!f) continue;
      checked += 1;
      const hits = GRID.filter(f).length;
      if (hits === GRID.length) problems.push(`${q.name}: "${value}" is true for every number`);
      if (hits === 0) problems.push(`${q.name}: "${value}" is true for no number`);
      if (right.some((r) => same(r as (v: number) => boolean, f))) problems.push(`${q.name}: "${value}" is the right answer`);
    }
  }
  expect(checked).toBeGreaterThan(40);
  expect(problems).toEqual([]);
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
  expect(checked).toBeGreaterThan(8);
  expect(problems).toEqual([]);
});

test('the no-roots figure and its caption state the right discriminant', async () => {
  const { FIGURES, NO_ROOTS } = await import('../src/book/alevel/figures/inequalities.mjs');
  const { a, b, c } = NO_ROOTS;
  const disc = b * b - 4 * a * c;
  const svg: string = FIGURES['inequalities-no-roots']();
  expect(svg).toContain(`discriminant = ${disc}`.replace('-', '−'));
  expect(svg).toContain(`negative ${-disc}`);
  // The worked example is x^2 + kx + 9 with k = -2, and its caption works the discriminant out.
  expect([a, b, c]).toEqual([1, -2, 9]);
  const caption = /\{fig:inequalities-no-roots\}<figcaption>([\s\S]*?)<\/figcaption>/.exec(SOURCE)?.[1] ?? '';
  expect(caption).toContain(`{m:${b * b}-${4 * c}=${disc}}`);
});

test('a question figure describes the picture and never gives the answer away', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/inequalities.mjs');
  const ids = Object.keys(FIGURES).filter((id) => id.startsWith('inequalities-q-'));
  expect(ids.length).toBeGreaterThanOrEqual(7);
  for (const id of ids) {
    const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(FIGURES[id]())?.[1] ?? '';
    expect(desc, id).not.toMatch(/inside|outside|is in\b|not in\b|solution|answer/i);
  }
});

test('the region figures describe their solid and dashed edges the way the page does', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/inequalities.mjs');
  const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(FIGURES['inequalities-region-two']())?.[1] ?? '';
  expect(desc).toMatch(/upper right edge is the solid line x \+ y = 4/);
  expect(desc).toMatch(/lower right edge is the dashed line y = x/);
  const caption = /\{fig:inequalities-region-two\}<figcaption>([\s\S]*?)<\/figcaption>/.exec(SOURCE)?.[1] ?? '';
  expect(caption).toMatch(/upper right side are solid/);
  expect(caption).toMatch(/lower right side is dashed/);
});

test('a defined word is linked with its plain name, with no bracketed extra in the link text', async ({ page }) => {
  await page.goto('/books/a-level/inequalities.html');
  // The "Words you need" strip lists each glossary entry under its full name, so it is left out.
  const texts = await page.locator('main a.term:not(.words-strip a)').allTextContents();
  expect(texts.length).toBeGreaterThan(20);
  expect(texts.filter((t) => t.includes('('))).toEqual([]);
});
