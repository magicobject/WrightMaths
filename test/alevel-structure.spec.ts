import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';
import { ALEVEL_TOPICS } from './support/alevel-pages';

// Checks that hold across the whole A-level book rather than one page:
//  - the "builds on" note at the top of each topic page agrees with the topic graph,
//  - every numbered lesson has a Key idea, a worked example and a faded example,
//  - no two elements on a page share an id (a duplicated SVG id breaks the picture's title and description),
//  - the guide describes what the pages really have,
//  - every word in a Year 1 topic's "Words you need" strip is a Year 1 word.
const ROOT = join(__dirname, '..');
const PAGES = join(ROOT, 'src', 'pages', 'courses', 'a-level');
const BUILT = join(ROOT, 'public', 'courses', 'a-level');
const topicIds = ALEVEL_TOPICS.map((p) => /\/([a-z0-9-]+)\.html$/.exec(p.path)![1]);
const source = (id: string) => readFileSync(join(PAGES, `${id}.html`), 'utf8');

async function graph() {
  const { TOPICS } = await import('../src/book/alevel/topics.mjs');
  const byId = new Map<string, { id: string; year: number; needs: string[]; words: string[]; status: string }>(TOPICS.map((t: { id: string }) => [t.id, t as never]));
  const needsOf = (id: string, seen = new Set<string>()): Set<string> => {
    for (const n of byId.get(id)?.needs ?? []) if (!seen.has(n)) { seen.add(n); needsOf(n, seen); }
    return seen;
  };
  return { byId, needsOf };
}

test('the first Key box links only to prerequisites, and where it links any it names every direct prerequisite', async () => {
  const { byId, needsOf } = await graph();
  const problems: string[] = [];
  let withLinks = 0;
  for (const id of topicIds) {
    const key = /<div class="key">([\s\S]*?)<\/div>/.exec(source(id))?.[1] ?? '';
    const linked = [...key.matchAll(/href="([a-z0-9-]+)\.html(?:#[^"]*)?"/g)].map((m) => m[1]).filter((l) => byId.has(l));
    const all = needsOf(id);
    for (const l of linked) if (!all.has(l)) problems.push(`${id}: the first Key box links to ${l}, which is not one of its prerequisites`);
    if (linked.length > 0) {
      withLinks += 1;
      for (const n of byId.get(id)!.needs) if (!linked.includes(n)) problems.push(`${id}: needs ${n} in the topic graph, but the first Key box does not link to it`);
    }
  }
  expect(withLinks).toBeGreaterThan(5);
  expect(problems).toEqual([]);
});

test('every numbered lesson has a Key idea, a worked example and a "Now you finish it" example', () => {
  const problems: string[] = [];
  let lessons = 0;
  for (const id of topicIds) {
    for (const chunk of source(id).split(/(?=<section[ >])/)) {
      const h2 = /<h2>(\d+[a-z]?\.\s[\s\S]*?)<\/h2>/.exec(chunk)?.[1];
      if (!h2) continue;
      lessons += 1;
      const name = `${id}, "${h2.replace(/<[^>]+>/g, '').slice(0, 40)}"`;
      if (!/class="key"/.test(chunk)) problems.push(`${name}: no Key idea`);
      if (!/class="worked"/.test(chunk)) problems.push(`${name}: no worked example`);
      if (!/class="worked faded"/.test(chunk)) problems.push(`${name}: no faded example`);
    }
  }
  expect(lessons).toBeGreaterThan(80);
  expect(problems).toEqual([]);
});

test('a topic page numbers its lessons 1, 2, 3 ... in order, with no letters', () => {
  const problems: string[] = [];
  for (const id of topicIds) {
    const numbers = [...source(id).matchAll(/<h2>(\d+[a-z]?)\.\s/g)].map((m) => m[1]);
    const want = numbers.map((_, i) => String(i + 1));
    if (numbers.join(',') !== want.join(',')) problems.push(`${id}: lessons are numbered ${numbers.join(', ')}`);
  }
  expect(problems).toEqual([]);
});

test('no id is used twice on a built page', () => {
  expect(existsSync(BUILT), 'run the build first').toBe(true);
  const problems: string[] = [];
  const files = readdirSync(BUILT).filter((f) => f.endsWith('.html'));
  expect(files.length).toBeGreaterThan(20);
  for (const f of files) {
    const html = readFileSync(join(BUILT, f), 'utf8');
    const seen = new Map<string, number>();
    for (const m of html.matchAll(/\sid="([^"]+)"/g)) seen.set(m[1], (seen.get(m[1]) ?? 0) + 1);
    for (const [id, n] of seen) if (n > 1) problems.push(`${f}: id "${id}" is used ${n} times`);
  }
  expect(problems).toEqual([]);
});

test('the guide names the real "Give me a clue" button, the warm-up and the calculator', () => {
  const guide = readFileSync(join(PAGES, 'how-to-use.html'), 'utf8');
  const code = readFileSync(join(ROOT, 'public', 'js', 'book.mjs'), 'utf8');
  const label = /class: 'btn-stuck', text: '([^']+)'/.exec(code)?.[1];
  expect(label).toBe('Give me a clue');
  expect(guide).toContain(`"${label}" button`);
  expect(guide).not.toContain('Help, I');
  expect(guide).not.toContain('Last time');
  expect(guide).toContain('<b>Warm-up and recap.</b>');
  expect(guide).toMatch(/<h2>The calculator<\/h2>/);
  expect(guide).toMatch(/It works in degrees/);
  // the guide says every topic page has a calculator: so every topic page must switch it on
  if (/Every topic page has a scientific calculator/.test(guide)) {
    const missing = topicIds.filter((id) => !/<main[^>]*data-calc="scientific"/.test(source(id)));
    expect(missing, 'topic pages without the scientific calculator').toEqual([]);
  }
});

test('the warm-up of a topic links the page for each thing the topic builds on (checked for the topics changed in this review)', async () => {
  const { byId } = await graph();
  const problems: string[] = [];
  for (const id of ['exponentials-logs', 'simultaneous']) {
    const warm = /<h2>Warm-up[\s\S]*?<\/section>/.exec(source(id))?.[0] ?? '';
    for (const need of byId.get(id)!.needs) if (!warm.includes(`href="${need}.html`)) problems.push(`${id}: the warm-up does not link ${need}.html`);
  }
  expect(problems).toEqual([]);
});

test('every word in a Year 1 topic\'s "Words you need" strip is a Year 1 word', async () => {
  const { GLOSSARY } = await import('../src/book/alevel/glossary.mjs');
  const level = new Map<string, string>(GLOSSARY.map((g: { id: string; level: string }) => [g.id, g.level]));
  const { byId } = await graph();
  const problems: string[] = [];
  for (const id of topicIds) {
    const t = byId.get(id)!;
    if (t.year !== 1) continue;
    expect(t.words.length, `${id} has words`).toBeGreaterThan(3);
    for (const w of t.words) if (level.get(w) !== 'Y1') problems.push(`${id}: "${w}" is ${level.get(w)}`);
  }
  expect(problems).toEqual([]);
});

test('the Year 2 glossary entries are Year 2 and the Year 1 point of inflection is Year 1', async () => {
  const { GLOSSARY } = await import('../src/book/alevel/glossary.mjs');
  const level = (id: string) => GLOSSARY.find((g: { id: string }) => g.id === id)?.level;
  expect(level('point-of-inflection')).toBe('Y1');
  expect(level('area-between-curves')).toBe('Y2');
  expect(level('limit-of-a-sum')).toBe('Y2');
  const change = GLOSSARY.find((g: { id: string }) => g.id === 'change-of-base');
  expect(change.watch).toMatch(/do not need this formula/i);
});

test('wording fixes from the whole-course review hold', () => {
  const text = (id: string) => source(id);
  expect(text('definite-integrals')).toContain('Its limit as h tends to 0 is {m:f(x)}. A full proof needs f to be continuous, and more care with the limit.');
  expect(text('definite-integrals')).not.toContain('A full proof needs limits.');
  expect(text('differentiation-basics')).toContain('(see <a href="binomial-positive.html">Binomial expansion</a>)');
  const hub = readFileSync(join(PAGES, 'index.html'), 'utf8');
  expect(hub).not.toContain('marked "coming soon"');
  expect(hub).toContain('Work through them in the order of the pyramid');
  // a hint never names the answer to the question it helps with
  expect(text('proof-methods')).not.toMatch(/<li>Try \{m:n=(?:1|40)\}\.<\/li>/);
  expect(text('trig-graphs')).toContain('{m:frac(360deg, 3)=120deg}');
  expect(text('exp-modelling')).not.toContain('Find the gradient function of');
});

test('the rationalising exam question is 14 over 3 minus root 2, its key is 6 + 2 root 2, and every slip matches its message', () => {
  const q = /<div class="q"[^>]*data-answers="([^"]*)"[^>]*>\s*<p class="qtext">\[3 marks\] Write \{m:frac\(14, 3-sqrt\(2\)\)\}[\s\S]*?<ul class="wrong">([\s\S]*?)<\/ul>/.exec(source('indices-surds'));
  expect(q, 'the question is on the page').not.toBeNull();
  // read a typed form such as 2(3+sqrt(2)), (42+14sqrt2)/7 or 6+&radic;8 as a number
  const value = (e: string) => {
    const t = e.replace(/\s+/g, '').replace(/&radic;/g, 'sqrt').replace(/sqrt(?:\((\d+)\)|(\d+))/g, (_m, n, k) => `*${Math.sqrt(Number(n ?? k))}`)
      .replace(/\+\*/g, '+').replace(/-\*/g, '-').replace(/\(\*/g, '(').replace(/(\d|\))\(/g, '$1*(').replace(/\*\*/g, '*');
    try { return Function(`"use strict"; return (${t})`)() as number; } catch { throw new Error(`cannot read "${e}" (${t})`); }
  };
  const right = 14 / (3 - Math.SQRT2);
  expect(right).toBeCloseTo(6 + 2 * Math.SQRT2, 12);
  for (const a of q![1].split(';')) expect(value(a), a).toBeCloseTo(right, 9);
  const slips = [...q![2].matchAll(/<li data-if="([^"]*)">([\s\S]*?)<\/li>/g)].map((m) => ({ forms: m[1].replace(/&radic;/g, 'sqrt').split(';'), msg: m[2] }));
  expect(slips.length).toBe(6);
  const kinds: { name: RegExp; equal: boolean; want?: number }[] = [
    { name: /^That is the right number, but divide the top and the bottom by 7/, equal: true },
    { name: /conjugate has the opposite sign/, equal: false, want: 14 / (3 + Math.SQRT2) },
    { name: /but the question asks for the form[\s\S]*Expand the bracket/, equal: true },
    { name: /^That is the right number\. Divide 14 by 7 first/, equal: true },
    { name: /^You left out the 14/, equal: false, want: right / 2 },
    { name: /not fully simplified[\s\S]*sqrt\(8\)=2sqrt\(2\)/, equal: true },
  ];
  slips.forEach((slip, i) => {
    expect(slip.msg, `slip ${i}`).toMatch(kinds[i].name);
    for (const f of slip.forms) {
      const v = value(f);
      if (kinds[i].equal) expect(v, f).toBeCloseTo(right, 9);
      else {
        expect(Math.abs(v - right), `${f} must be wrong`).toBeGreaterThan(0.01);
        expect(v, f).toBeCloseTo(kinds[i].want!, 9);
      }
    }
  });
  // a slip that equals the key is only ever a form slip: it is never one of the accepted answers
  const accepted = new Set(q![1].split(';').map((a) => a.replace(/\s+/g, '')));
  for (const slip of slips) for (const f of slip.forms) expect(accepted.has(f.replace(/\s+/g, '')), `${f} is also accepted`).toBe(false);
});
