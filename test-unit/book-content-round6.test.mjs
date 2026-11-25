// Round 6 content guards: plain-text wrong-answer messages, consistent rounding in
// the iteration page, and a text version for every question figure that carries data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pages', 'books', 'gcse');
const pages = readdirSync(dir).filter((f) => f.endsWith('.html'));
const read = (f) => readFileSync(join(dir, f), 'utf8');

test('data-why messages are plain text (they are shown with textContent, so tags would print)', () => {
  const bad = [];
  for (const f of pages) {
    for (const m of read(f).matchAll(/data-why="([^"]*)"/g)) if (m[1].includes('<')) bad.push(`${f}: ${m[1].slice(0, 60)}`);
  }
  assert.deepEqual(bad, []);
});

test('iteration: terms are rounded (not truncated) the same way everywhere', () => {
  const html = read('iteration.html');
  for (const truncated of ['1.2027', '1.2128', '2.7650', '2.7865']) assert.ok(!html.includes(truncated), `${truncated} is a truncation`);
  assert.equal(Math.cbrt(3 - 1.2599210498948732).toFixed(4), '1.2028');
  assert.equal([1, 2, 3, 4].reduce((x) => Math.cbrt(3 - x), 1).toFixed(4), '1.2129');
  assert.equal(Math.sqrt(Math.sqrt(7) + 5).toFixed(4), '2.7651');
});

test('rounded values quoted in compound-measures and bounds', () => {
  assert.ok(read('compound-measures.html').includes('0.278 m/s'));
  assert.ok(!read('bounds.html').includes('4.83&hellip;'));
  assert.equal((225 / 46.5).toFixed(2), '4.84');
});

test('question figures that carry data have a text version for screen-reader users', () => {
  const dataFigure = /bar chart|pictogram|number line to read|marker on the probability scale|three graphs|curve with five marked/i;
  const own = /^<div class="q"[^>]*>\s*<p class="qtext"[^>]*>(?:(?!<\/p>)[\s\S])*<\/p>\s*<figure[\s\S]*?<\/figure>(\s*<div class="sr-only"><p>Text version)?/;
  const missing = [];
  for (const f of pages) {
    const qs = read(f).split(/(?=<div class="q")/).filter((p) => p.startsWith('<div class="q"'));
    qs.forEach((q, i) => {
      const m = own.exec(q);
      const title = m && /<title[^>]*>([^<]*)/.exec(m[0])?.[1];
      if (title && dataFigure.test(title) && !m[1]) missing.push(`${f} question ${i + 1}: ${title}`);
    });
  }
  assert.deepEqual(missing, []);
});
