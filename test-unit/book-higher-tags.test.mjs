// A question graded 7 or more is Higher content. The Foundation print book cuts Higher content by its markers (the chip, or
// data-tier="H"), so a high-grade question with no marker would be printed in the Foundation book. This lint stops that.
// Grade 6 is allowed: "Practice papers for grades 4 to 6" (foundation.html) is a Foundation chapter and carries Grade 6 questions.
// stretch.html is the Higher book's own paper, so it needs no marker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(import.meta.dirname, '..', 'src', 'pages', 'books', 'gcse');

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
