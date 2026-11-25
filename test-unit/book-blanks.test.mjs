// "Now you finish it" gaps: the marking rules, and a guard that every keyed gap agrees with its own worked answer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markBlanks } from '../public/js/book-blanks.mjs?m=39';

test('markBlanks: right, wrong and empty gaps are told apart', () => {
  const r = markBlanks(['11', '12', ''], [['11'], ['10'], ['5']]);
  assert.deepEqual(r.states, ['right', 'wrong', 'empty']);
  assert.equal(r.allRight, false);
  assert.match(r.message, /still empty/);
});

test('markBlanks: equivalent number forms are right, and a full set says so', () => {
  const r = markBlanks(['0.5', '1/2', ' 9.50 '], [['1/2'], ['0.5'], ['9.5']]);
  assert.equal(r.allRight, true);
  assert.match(r.message, /All 3 right/);
});

test('markBlanks: all filled but some wrong counts the right ones and does not give the answer away', () => {
  const r = markBlanks(['9', '7'], [['9'], ['10']]);
  assert.equal(r.right, 1);
  assert.match(r.message, /1 of 2 right/);
  assert.doesNotMatch(r.message, /10/);
});

test('markBlanks: a word gap accepts the word in any case, and a single gap speaks in the singular', () => {
  assert.equal(markBlanks(['Mode'], [['mode']]).allRight, true);
  assert.equal(markBlanks(['Mode'], [['mode']]).message, 'Right! Well done.');
  assert.equal(markBlanks(['median'], [['mode']]).states[0], 'wrong');
});

test('markBlanks: alternatives separated in the key are each accepted', () => {
  assert.equal(markBlanks(['10'], [['9', '10']]).allRight, true);
});

// ---- content: every gap's key must appear in the box's own "Check my answer" text ----
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pages', 'books', 'gcse');
const decode = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&minus;/g, '-').replace(/&[a-z]+;/g, ' ').replace(/,/g, '');

test('every gap in a "Now you finish it" box is keyed, and its key appears in that box\'s worked answer', () => {
  let boxes = 0;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(join(dir, file), 'utf8');
    for (const box of html.match(/<div class="worked faded">[\s\S]*?<\/details>/g) ?? []) {
      const blanks = [...box.matchAll(/<span class="blank" data-answers="([^"]*)">___<\/span>/g)];
      if (blanks.length === 0) continue;
      boxes += 1;
      const plain = box.replace(/<span class="blank"[^>]*>___<\/span>/g, '___');
      assert.equal((box.match(/___/g) ?? []).length, blanks.length, `${file}: a ___ in a pilot box is not wrapped as a keyed gap`);
      assert.ok(plain.includes('___'), file);
      const worked = decode(/<details class="check-line">([\s\S]*)<\/details>/.exec(box)[1]).replace(/\s+/g, ' ').toLowerCase();
      for (const [, key] of blanks) {
        const ok = key.split(';').some((a) => worked.includes(a.trim().toLowerCase()));
        assert.ok(ok, `${file}: key "${key}" is not in its box's worked answer`);
      }
    }
  }
  assert.ok(boxes >= 8, `expected the pilot boxes, found ${boxes}`);
});
