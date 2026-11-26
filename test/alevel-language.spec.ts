import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// The A-level writing rules ban filler and false ease. This reads the source of every A-level page and fails
// on any of these words in the running text (maths, tags and comments are left out).
const DIR = join(__dirname, '..', 'src', 'pages', 'books', 'a-level');
const BANNED = /\b(?:just|simply|clearly|obviously|easy|easily)\b(?!-read)/gi; // "easy-read" is the name of a reading option

test('no A-level page uses just, simply, clearly, obviously, easy or easily', () => {
  const hits: string[] = [];
  for (const file of readdirSync(DIR).filter((f) => f.endsWith('.html'))) {
    const text = readFileSync(join(DIR, file), 'utf8')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/\{m:[^}]*\}|\{md:[^}]*\}|\{fig:[^}]*\}/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    for (const line of text.split('\n')) for (const m of line.matchAll(BANNED)) hits.push(`${file}: "${m[0]}" in: ${line.trim().slice(0, 100)}`);
  }
  expect(hits).toEqual([]);
});
