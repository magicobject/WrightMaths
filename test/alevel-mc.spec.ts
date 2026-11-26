import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';
import { ALEVEL_TOPICS } from './support/alevel-pages';

// A multiple-choice question must have exactly three options: one data-correct and two wrong ones that each say why.
// (A missing closing quote in a data-why once swallowed an option, so a page showed two choices and no error.)
// This reads the built page, because the page script replaces the list with buttons once it runs.
const PUBLIC = join(__dirname, '..', 'public');

for (const bookPage of ALEVEL_TOPICS) {
  test(`${bookPage.path}: every multiple-choice question has 3 options, one right, and a reason on each wrong one`, () => {
    const html = readFileSync(join(PUBLIC, bookPage.path), 'utf8');
    const problems: string[] = [];
    let count = 0;
    for (const block of html.split(/(?=<div class="q")/).filter((b) => /^<div class="q"[^>]*data-type="mc"/.test(b))) {
      count += 1;
      const name = /id="([^"]+)"/.exec(block)?.[1] ?? `mc question ${count}`;
      const list = /<ul class="options">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '';
      const items = [...list.matchAll(/<li([^>]*)>/g)].map((m) => m[1]);
      if (items.length !== 3) problems.push(`${name}: ${items.length} options`);
      if (items.filter((a) => /\bdata-correct\b/.test(a)).length !== 1) problems.push(`${name}: not exactly one data-correct`);
      for (const attrs of items) {
        const extra = [...attrs.replace(/="[^"]*"/g, '=""').matchAll(/\s([\w-]+)(?==|\s|$)/g)].map((m) => m[1]).filter((a) => a !== 'data-correct' && a !== 'data-why');
        if (extra.length) problems.push(`${name}: unexpected attribute ${extra.join(', ')}`);
        if (!/\bdata-correct\b/.test(attrs) && !/data-why="[^"<>]+"\s*$/.test(attrs)) problems.push(`${name}: a wrong option has no clean data-why`);
      }
    }
    expect(count).toBeGreaterThan(0);
    expect(problems).toEqual([]);
  });
}
