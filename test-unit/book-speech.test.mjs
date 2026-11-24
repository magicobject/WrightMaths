import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSpoken, splitSentences } from '../public/js/book-speech.mjs';

test('a question mark is kept, never spoken as words', () => {
  const out = toSpoken('What is 3 + 4?');
  assert.equal(out, 'What is 3 plus 4?');
  assert.doesNotMatch(out, /question mark/i);
});

test('questions are flagged so the voice can lift its pitch', () => {
  const s = splitSentences('Here is a sum. What is 3 plus 4? Well done!');
  assert.deepEqual(s.map((x) => x.question), [false, true, false]);
});

test('decimals are not split into sentences', () => {
  assert.equal(splitSentences('It costs 0.4 of a pound. Next.').length, 2);
});

test('maths symbols and signs are said as words', () => {
  assert.equal(toSpoken('x = -3'), 'x equals minus 3');
  assert.equal(toSpoken('5 − 2'), '5 minus 2');
  assert.equal(toSpoken('6 × 7 ÷ 2'), '6 times 7 divided by 2');
  assert.equal(toSpoken('x²'), 'x squared');
  assert.equal(toSpoken('√49'), 'square root of 49');
  assert.equal(toSpoken('3/4 of £12.50'), '3 over 4 of 12.50 pounds');
  assert.equal(toSpoken('20%'), '20 percent');
  assert.equal(toSpoken('x ≤ 5'), 'x is less than or equal to 5');
});

test('units are spoken in full only straight after a number', () => {
  assert.equal(toSpoken('12 cm²'), '12 centimetres squared');
  assert.equal(toSpoken('5km and 3 kg'), '5 kilometres and 3 kilograms');
  assert.equal(toSpoken('the cm is a unit'), 'the cm is a unit');
});

test('hard words get a spoken form, and abbreviations are expanded', () => {
  assert.equal(toSpoken('Use BIDMAS, e.g. brackets first.'), 'Use bid mass, for example brackets first.');
});
