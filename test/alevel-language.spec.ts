import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// The A-level writing rules ban filler and false ease. This reads the source of every A-level page, the picture
// descriptions in the figure files, and the data-why reasons on multiple-choice options, and fails on any of these
// words (maths, tags and comments are left out of the page text).
const BOOK = join(__dirname, '..', 'src');
const PAGES = join(BOOK, 'pages', 'books', 'a-level');
const FIGURES = join(BOOK, 'book', 'alevel', 'figures');
const BANNED = /\b(?:just|simply|clearly|obviously|easy(?!-read)|easily)\b/gi; // "easy-read" is the name of a reading option

const hitsIn = (where: string, text: string) => [...text.split('\n').entries()].flatMap(([, line]) => [...line.matchAll(BANNED)].map((m) => `${where}: "${m[0]}" in: ${line.trim().slice(0, 100)}`));

test('no A-level page uses just, simply, clearly, obviously, easy or easily', () => {
  const hits: string[] = [];
  for (const file of readdirSync(PAGES).filter((f) => f.endsWith('.html'))) {
    const text = readFileSync(join(PAGES, file), 'utf8')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/\{m:[^}]*\}|\{md:[^}]*\}|\{fig:[^}]*\}/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    hits.push(...hitsIn(file, text));
  }
  expect(hits).toEqual([]);
});

test('no multiple-choice reason (data-why) on an A-level page uses those words', () => {
  const hits: string[] = [];
  for (const file of readdirSync(PAGES).filter((f) => f.endsWith('.html'))) {
    for (const m of readFileSync(join(PAGES, file), 'utf8').matchAll(/data-why="([^"]*)"/g)) hits.push(...hitsIn(`${file} data-why`, m[1]));
  }
  expect(hits).toEqual([]);
});

test('no figure description (desc) in the A-level figure files uses those words', () => {
  const hits: string[] = [];
  for (const file of readdirSync(FIGURES).filter((f) => f.endsWith('.mjs'))) {
    for (const m of readFileSync(join(FIGURES, file), 'utf8').matchAll(/\bdesc:\s*(?:'((?:[^'\\]|\\.)*)'|`([^`]*)`)/g)) hits.push(...hitsIn(`${file} desc`, m[1] ?? m[2] ?? ''));
  }
  expect(hits).toEqual([]);
});
