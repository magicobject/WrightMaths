import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';
import { ALEVEL_TOPICS } from './support/alevel-pages';

// An answer key row shows "[Figure: ...]" only for a question that has a figure of its own. (The key once took the
// next section's lesson figure for the last question of each check set.)
const ROOT = join(__dirname, '..');

for (const bookPage of ALEVEL_TOPICS) {
  const id = bookPage.path.split('/').pop()!.replace('.html', '');
  test(`${id}: the answer key marks a figure on exactly the questions that have one`, () => {
    const source = readFileSync(join(ROOT, 'src', 'pages', 'books', 'a-level', `${id}.html`), 'utf8');
    const withFigure: number[] = [];
    source.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).forEach((block, i) => {
      if (/\{fig:|<figure/.test(block.split('<div class="solution">')[0])) withFigure.push(i + 1);
    });
    const key = readFileSync(join(ROOT, 'public', 'books', 'a-level', 'key', `${id}.html`), 'utf8');
    const inKey = [...key.matchAll(/<tr id="q(\d+)">([\s\S]*?)<\/tr>/g)].filter((m) => m[2].includes('[Figure:')).map((m) => Number(m[1]));
    expect(inKey).toEqual(withFigure);
  });
}
