// A data-* attribute in a book page source must be one short plain value. A missing closing quote makes the value run on
// into the next tag (it once made a whole multiple-choice option vanish), so no value may contain < or > or a line break.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'src', 'pages', 'courses');

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

test('no data-* attribute value in a book page source contains < or > or a line break', () => {
  const bad = [];
  for (const file of pages(ROOT)) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/\sdata-[\w-]+="([^"]*)"/g)) {
      if (/[<>\r\n]/.test(m[1])) {
        const line = html.slice(0, m.index).split('\n').length;
        bad.push(`${file.slice(ROOT.length + 1)}:${line}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});
