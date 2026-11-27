// A question graded 7 or more is Higher content. The Foundation print book cuts Higher content by its markers (the chip, or
// data-tier="H"), so a high-grade question with no marker would be printed in the Foundation book. This lint stops that.
// Grade 6 is allowed: "Practice papers for grades 4 to 6" (foundation.html) is a Foundation chapter and carries Grade 6 questions.
// stretch.html is the Higher book's own paper, so it needs no marker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(import.meta.dirname, '..', 'src', 'pages', 'courses', 'gcse');

test('every question graded 7 or more outside stretch.html is marked Higher (chip, data-tier="H" or a Higher section)', () => {
  const bad = [];
  for (const name of readdirSync(DIR).filter((n) => n.endsWith('.html') && n !== 'stretch.html')) {
    const raw = readFileSync(join(DIR, name), 'utf8');
    let higherSection = false;
    for (const token of raw.split(/(?=<h2[ >]|<div class="q"[ >])/)) {
      if (token.startsWith('<h2')) { higherSection = /^<h2[^>]*>[\s\S]*?<\/h2>/.exec(token)?.[0].includes('chip-higher') ?? false; continue; }
      if (!token.startsWith('<div class="q"')) continue;
      const qtext = /<p class="qtext">([\s\S]*?)<\/p>/.exec(token)?.[1] ?? '';
      const grade = Number(/qtag-grade">Grade (\d)/.exec(qtext)?.[1] ?? 0);
      if (grade < 7) continue;
      if (higherSection || token.split('>')[0].includes('data-tier="H"') || qtext.includes('chip-higher')) continue;
      bad.push(`${name}: ${qtext.replace(/<[^>]+>/g, '').slice(0, 60)}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('a Foundation section never points the reader at a Higher section that is cut from the Foundation book', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const dir = new URL('../src/pages/courses/gcse/', import.meta.url);
  const higher = (s) => /chip chip-higher/.test(s.slice(0, s.indexOf('</h2>')));
  const bad = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.html') && n !== 'stretch.html')) {
    const parts = readFileSync(new URL(f, dir), 'utf8').split(/(?=<h2)/);
    parts.forEach((part, i) => {
      // the next lesson section: practice sets (Check your knowledge) in between do not count
      const next = parts.slice(i + 1).find((p) => !/^<h2[^>]*>\s*Check your knowledge/.test(p));
      if (higher(part) || !next || !higher(next)) return;
      const foundationText = part.replace(/<span data-tier="H">[\s\S]*?<\/span>/g, '');
      if (/\b(?:next|following) sections?\b|\bsection below\b/i.test(foundationText)) bad.push(f);
    });
  }
  assert.deepEqual(bad, []);
});
