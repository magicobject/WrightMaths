// "Now you finish it" gaps: the marking rules, and a guard that every keyed gap agrees with its own worked answer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markBlanks, distinctGroups } from '../public/js/book-blanks.mjs?m=39';

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

test('a pair of gaps that share two different values must use each once, in either order', () => {
  const keys = [['5', '9'], ['5', '9'], ['14']];
  const groups = distinctGroups(keys, [0, 0, 0]);
  assert.deepEqual(groups, [[0, 1]]);
  assert.equal(markBlanks(['9', '5', '14'], keys, 'value', groups).allRight, true);
  const dup = markBlanks(['5', '5', '14'], keys, 'value', groups);
  assert.equal(dup.allRight, false);
  assert.deepEqual(dup.states, ['right', 'wrong', 'right']);
  assert.match(dup.message, /two different numbers/);
});

test('distinctGroups ignores gaps in different steps, single values, equal alternatives and words', () => {
  assert.deepEqual(distinctGroups([['2', '3'], ['2', '3']], [0, 1]), []);
  assert.deepEqual(distinctGroups([['10', '10.0'], ['10', '10.0']], [0, 0]), []);
  assert.deepEqual(distinctGroups([['x+1', '1+x'], ['x+1', '1+x']], [0, 0]), []);
  assert.deepEqual(distinctGroups([['6'], ['6']], [0, 0]), []);
});

test('brackets already printed beside a gap may be typed, unless the key itself uses brackets', () => {
  assert.equal(markBlanks(['(x+1)'], [['x+1']]).allRight, true);
  assert.equal(markBlanks(['x+1)'], [['x+1']]).allRight, true);
  assert.equal(markBlanks(['(x+2)'], [['x+1']]).allRight, false);
  assert.equal(markBlanks(['3,1'], [['(3,1)', '3,1']]).allRight, true);
});

// ---- content: every gap's key must appear in the box's own "Check my answer" text ----
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pages', 'books', 'gcse');
const decode = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&minus;/g, '-').replace(/&[a-z]+;/g, ' ').replace(/,/g, '');

test('every gap in a "Now you finish it" box is keyed, and its key appears in that box\'s worked answer', () => {
  let boxes = 0;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(join(dir, file), 'utf8');
    for (const box of html.match(/<div class="worked faded">[\s\S]*?<\/details>/g) ?? []) {
      const blanks = [...box.matchAll(/<span class="blank" data-answers="([^"]*)"[^>]*>___<\/span>/g)];
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

test('a gap marked exact needs the written form; a signed pair still counts as a pair', () => {
  assert.equal(markBlanks(['3/36'], [['1/12']], ['exact']).allRight, false);
  assert.equal(markBlanks(['1/12'], [['1/12']], ['exact']).allRight, true);
  assert.equal(markBlanks(['3/36'], [['1/12']], ['value']).allRight, true);
  assert.deepEqual(distinctGroups([['-3', '-5', '- 3', '- 5'], ['-3', '-5', '- 3', '- 5']], [0, 0]), [[0, 1]]);
  assert.deepEqual(distinctGroups([['9', '-4', '+9'], ['9', '-4', '+9']], [0, 0]), [[0, 1]]);
});
