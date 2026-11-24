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

test('one of a unit is singular, and a unit that describes a thing is singular too', () => {
  assert.equal(toSpoken('each 1 cm long'), 'each 1 centimetre long');
  assert.equal(toSpoken('1 m'), '1 metre');
  assert.equal(toSpoken('1.5 m long'), '1.5 metres long');
  assert.equal(toSpoken('0.5 kg'), '0.5 kilograms');
  assert.equal(toSpoken('a 3 m length of conduit'), 'a 3 metre length of conduit');
  assert.equal(toSpoken('a 6 m pole'), 'a 6 metre pole');
  assert.equal(toSpoken('a 5 kg weight'), 'a 5 kilogram weight');
  assert.equal(toSpoken('3 m long and 4 m wide'), '3 metres long and 4 metres wide');
  assert.equal(toSpoken('12 cm²'), '12 centimetres squared');
  assert.equal(toSpoken('1 cm²'), '1 centimetre squared');
  assert.equal(toSpoken('the number 21 cm'), 'the number 21 centimetres');
});

test('brackets are tidy, quotation marks are not spoken, apostrophes are plain', () => {
  assert.equal(toSpoken('(−2) × (−2)'), '(minus 2) times (minus 2)');
  assert.equal(toSpoken('Work out 7 − (−3).'), 'Work out 7 minus (minus 3).');
  assert.equal(toSpoken('Tia says: “A regular pentagon.” What went wrong?'), 'Tia says: A regular pentagon. What went wrong?');
  assert.equal(toSpoken('Don’t forget'), "Don't forget");
});

test('a pound amount at the end of a sentence keeps its full stop after "pounds"', () => {
  assert.equal(toSpoken('A board costs £15. The price rises.'), 'A board costs 15 pounds. The price rises.');
  assert.equal(toSpoken('It costs £8.40. Offcuts are free.'), 'It costs 8.40 pounds. Offcuts are free.');
  assert.equal(toSpoken('Pay £1,250.50, then stop.'), 'Pay 1,250.50 pounds, then stop.');
  assert.equal(toSpoken('£12'), '12 pounds');
});
