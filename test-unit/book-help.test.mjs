// Checks on the help pages: question-word glossary entries, the how-to-use page, the parents guide and the study routes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLOSSARY } from '../src/book/glossary.mjs';
import { ROUTES } from '../src/book/route.mjs';
import { TOPICS } from '../src/book/topics.mjs';
import { PAGES } from '../src/pages.config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const page = (name) => read(`src/pages/books/gcse/${name}.html`);
const ids = new Set(GLOSSARY.map((g) => g.id));

const COMMAND_WORDS = ['hence', 'deduce', 'justify', 'evaluate', 'sketch', 'prove', 'describe', 'estimate', 'explain-command'];
const EVERYDAY_WORDS = ['wage', 'salary', 'pence', 'profit', 'loss', 'discount', 'deposit', 'commission', 'raffle', 'tip', 'work-shift'];

test('every command word has a glossary entry with a plain definition and an example, and its card on the question words page', () => {
  const commands = page('command-words');
  for (const id of COMMAND_WORDS) {
    const g = GLOSSARY.find((x) => x.id === id);
    assert.ok(g, `${id} is missing from the glossary`);
    assert.ok(g.def.length > 20 && g.example, `${id} needs a definition and an example`);
    assert.match(commands, new RegExp(`\\{term:${id}[|}]`), `${id} has no card on command-words.html`);
  }
});

test('the everyday money, work and game words are in the glossary', () => {
  for (const id of EVERYDAY_WORDS) assert.ok(ids.has(id), `${id} is missing from the glossary`);
});

test('every {term:id} on the help pages is a real glossary term', () => {
  for (const name of ['command-words', 'parents', 'route', 'how-to-use', 'glossary']) {
    for (const m of page(name).matchAll(/\{term:([a-z0-9-]+)/g)) assert.ok(ids.has(m[1]), `${name}.html uses unknown term ${m[1]}`);
  }
});

test('the how-to-use page is registered, has no skipped heading levels and covers the main help topics', () => {
  assert.ok(PAGES.some((p) => p.slug === 'books/gcse/how-to-use' && p.book === 'how-to-use'), 'not in pages.config.mjs');
  assert.match(read('test/support/book-pages.ts'), /how-to-use\.html/);
  const html = page('how-to-use');
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  assert.equal(levels[0], 1);
  levels.forEach((l, i) => { if (i > 0) assert.ok(l <= levels[i - 1] + 1, `heading level jumps from h${levels[i - 1]} to h${l}`); });
  for (const word of ['Listen', 'Reading options', 'Hide the Listen buttons', 'No clock', 'Extra time', 'screen reader', 'sqrt', '5.60', '+-', '?q=', 'Print worksheet']) {
    assert.ok(html.toLowerCase().includes(word.toLowerCase()), `how-to-use.html should mention "${word}"`);
  }
  assert.match(read('src/pages/books/gcse/index.html'), /href="how-to-use\.html"/, 'the hub should link to it');
});

test('the parents guide opens with the "Tonight" box, keeps every privacy point, and has no rubber duck', () => {
  const html = page('parents');
  assert.ok(html.indexOf('Tonight: 20 minutes together') < html.indexOf('What this is'), 'Tonight box should come first');
  assert.ok(html.indexOf('Tonight: 20 minutes together') < html.indexOf('Is it safe?'));
  for (const phrase of ['No accounts, no chat, no adverts', 'What is kept, and where', 'Other websites', 'Listen', 'The search box', 'Links out', 'Clear my ticks on this device', 'share this device']) {
    assert.ok(html.includes(phrase), `parents.html lost "${phrase}"`);
  }
  for (const name of ['parents', 'how-to-use', 'index']) assert.doesNotMatch(page(name), /duck/i, `${name}.html still mentions the duck`);
});

test('every study route points at live topics, and the short "weak topics" route exists', () => {
  const live = new Set(TOPICS.filter((t) => t.status === 'live').map((t) => t.id));
  for (const r of ROUTES) for (const w of r.weeks.flat()) assert.ok(w.startsWith('@') || live.has(w), `${r.id}: ${w} is not a live topic`);
  const weak = ROUTES.find((r) => r.id === 'weak');
  assert.deepEqual(weak.weeks.flat(), ['algebra-basics', 'ratio', 'percentages']);
});
