import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../src/pages/courses/gcse/', import.meta.url);
const pages = readdirSync(dir).filter((f) => f.endsWith('.html'));

// Every "Now you finish it" box is a typed-gap box: each ___ must be a span.blank with its answers, or the student has nowhere to type.
test('every "Now you finish it" box has an answer box for every gap', () => {
  const bad = [];
  for (const page of pages) {
    const s = readFileSync(new URL(page, dir), 'utf8');
    for (const m of s.matchAll(/<div class="worked faded"[^>]*>([\s\S]*?)<\/details><\/div>/g)) {
      const body = m[1];
      const bare = body.replace(/<span class="blank"[^>]*>___<\/span>/g, '').includes('___');
      const spans = (body.match(/class="blank"/g) ?? []).length;
      const line = s.slice(0, m.index).split('\n').length;
      if (bare || spans === 0) bad.push(`${page}:${line}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('every question that uses sin, cos or tan has the scientific calculator when it has a calculator at all', () => {
  const bad = [];
  for (const page of pages) {
    const s = readFileSync(new URL(page, dir), 'utf8');
    for (const m of s.matchAll(/<div class="q"([^>]*)>([\s\S]*?)(?=<div class="q"|<\/section>)/g)) {
      const trig = /\b(sin|cos|tan)\b|(sin|cos|tan)<sup>/.test(m[2].replace(/<div class="solution">[\s\S]*?<\/div>/, ''));
      if (trig && /data-calc="yes"/.test(m[1])) bad.push(`${page}:${s.slice(0, m.index).split('\n').length}`);
    }
  }
  assert.deepEqual(bad, []);
});
