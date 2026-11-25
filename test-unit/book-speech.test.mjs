import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSpoken, splitSentences } from '../public/js/book-speech.mjs';

test('a question mark is kept, never spoken as words', () => {
  const out = toSpoken('What is 3 + 4?');
  assert.equal(out, 'What is three plus four?');
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
  assert.equal(toSpoken('x = -3'), "x equals minus three");
  assert.equal(toSpoken('5 − 2'), "five minus two");
  assert.equal(toSpoken('6 × 7 ÷ 2'), "six times seven divided by two");
  assert.equal(toSpoken('x²'), 'x squared');
  assert.equal(toSpoken('√49'), "square root of forty-nine");
  assert.equal(toSpoken('3/4 of £12.50'), "three over four of twelve pounds fifty");
  assert.equal(toSpoken('20%'), "twenty percent");
  assert.equal(toSpoken('x ≤ 5'), "x is less than or equal to five");
});

test('units are spoken in full only straight after a number', () => {
  assert.equal(toSpoken('12 cm²'), "twelve centimetres squared");
  assert.equal(toSpoken('5km and 3 kg'), "five kilometres and three kilograms");
  assert.equal(toSpoken('the cm is a unit'), 'the cm is a unit');
});

test('hard words get a spoken form, and abbreviations are expanded', () => {
  assert.equal(toSpoken('Use BIDMAS, e.g. brackets first.'), 'Use bid mass, for example brackets first.');
});

test('one of a unit is singular, and a unit that describes a thing is singular too', () => {
  assert.equal(toSpoken('each 1 cm long'), "each one centimetre long");
  assert.equal(toSpoken('1 m'), "one metre");
  assert.equal(toSpoken('1.5 m long'), "one point five metres long");
  assert.equal(toSpoken('0.5 kg'), "zero point five kilograms");
  assert.equal(toSpoken('a 3 m length of conduit'), "a three metre length of conduit");
  assert.equal(toSpoken('a 6 m pole'), "a six metre pole");
  assert.equal(toSpoken('a 5 kg weight'), "a five kilogram weight");
  assert.equal(toSpoken('3 m long and 4 m wide'), "three metres long and four metres wide");
  assert.equal(toSpoken('12 cm²'), "twelve centimetres squared");
  assert.equal(toSpoken('1 cm²'), "one centimetre squared");
  assert.equal(toSpoken('the number 21 cm'), "the number twenty-one centimetres");
});

test('brackets are tidy, quotation marks are not spoken, apostrophes are plain', () => {
  assert.equal(toSpoken('(−2) × (−2)'), "(minus two) times (minus two)");
  assert.equal(toSpoken('Work out 7 − (−3).'), "Work out seven minus (minus three).");
  assert.equal(toSpoken('Tia says: “A regular pentagon.” What went wrong?'), 'Tia says: A regular pentagon. What went wrong?');
  assert.equal(toSpoken('Don’t forget'), "Don't forget");
});

test('a pound amount at the end of a sentence keeps its full stop after "pounds"', () => {
  assert.equal(toSpoken('A board costs £15. The price rises.'), "A board costs fifteen pounds. The price rises.");
  assert.equal(toSpoken('It costs £8.40. Offcuts are free.'), "It costs eight pounds forty. Offcuts are free.");
  assert.equal(toSpoken('Pay £1,250.50, then stop.'), "Pay one thousand, two hundred and fifty pounds fifty, then stop.");
  assert.equal(toSpoken('£12'), "twelve pounds");
});

test('numbers are spoken as words, in British English', async () => {
  const { numberToWords, numbersToWords } = await import('../public/js/book-speech.mjs');
  for (const [n, words] of [['0', 'zero'], ['7', 'seven'], ['13', 'thirteen'], ['20', 'twenty'], ['47', 'forty-seven'], ['100', 'one hundred'],
    ['180', 'one hundred and eighty'], ['203', 'two hundred and three'], ['1000', 'one thousand'], ['1005', 'one thousand and five'],
    ['4872', 'four thousand, eight hundred and seventy-two'], ['10000', 'ten thousand'], ['2300000', 'two million, three hundred thousand'],
    ['045', 'zero four five'], ['007', 'zero zero seven']]) assert.equal(numberToWords(n), words, n);
  assert.equal(numbersToWords('a 4,872 and 10 000 and 0.643 and 2.5'), 'a four thousand, eight hundred and seventy-two and ten thousand and zero point six four three and two point five');
  assert.equal(numbersToWords('5x + 3'), 'five x + three');
  assert.equal(numbersToWords('x2 and T0 and H2O stay as labels, the 3rd too'), 'x2 and T0 and H2O stay as labels, the 3rd too');
});

test('toSpoken says numbers as words, money as pounds and pence, and bearings digit by digit', () => {
  assert.equal(toSpoken('What is 4,872 ÷ 24?'), 'What is four thousand, eight hundred and seventy-two divided by twenty-four?');
  assert.equal(toSpoken('Round 7.456 to 1 decimal place.'), 'Round seven point four five six to one decimal place.');
  assert.equal(toSpoken('It costs £4.50. Offcuts are £0.50, or £15.'), 'It costs four pounds fifty. Offcuts are fifty pence, or fifteen pounds.');
  assert.equal(toSpoken('Type 045 for a bearing of 45°.'), 'Type zero four five for a bearing of forty-five degrees.');
  assert.equal(toSpoken('[3 marks] 20%'), '[three marks] twenty percent');
});

test('function notation is read as "f of x"', () => {
  assert.equal(toSpoken('f(x) = 5x − 3. Work out f(4)'), 'f of x equals five x minus three. Work out f of four');
  assert.equal(toSpoken('Find g(x + 1) when g(t) = t².'), 'Find g of (x plus one) when g of t equals t squared.');
  assert.equal(toSpoken('f(−2)'), 'f of minus two');
  assert.equal(toSpoken('a(b) and of(x)'), 'a(b) and of(x)');
});

test('composites, inverses and probabilities are read the way a teacher says them', () => {
  assert.equal(toSpoken('fg(x)'), 'f of g of x');
  assert.equal(toSpoken('gf(2)'), 'g of f of two');
  assert.equal(toSpoken('fg(x + 1)'), 'f of g of (x plus one)');
  assert.equal(toSpoken('f(g(x))'), 'f of (g of x)');
  assert.equal(toSpoken('f⁻¹(x)'), 'f inverse of x');
  assert.equal(toSpoken('P(red)'), 'the probability of red');
  assert.equal(toSpoken('P(A and B)'), 'the probability of A and B');
  assert.equal(toSpoken('P(6) = 1/6'), 'the probability of six equals one over six');
});

test('only a lone f, g or h (or a pair) before a bracket is a function', () => {
  assert.equal(toSpoken('a height h (in cm)'), 'a height h (in cm)');
  assert.equal(toSpoken('6h(2 + 1)'), 'six h(two plus one)');
  assert.equal(toSpoken('if(x)'), 'if(x)');
  assert.equal(toSpoken('Sophia(x)'), 'Sophia(x)');
  assert.equal(toSpoken('fgh(x)'), 'fgh(x)');
});
