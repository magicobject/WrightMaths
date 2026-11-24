import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRanges, rangeLabel, rangeBanner } from '../public/js/book-ranges.mjs';

test('a single range, a list of ranges and single numbers are read as written', () => {
  assert.deepEqual(parseRanges('5-8'), [5, 6, 7, 8]);
  assert.deepEqual(parseRanges('1-3,40-42'), [1, 2, 3, 40, 41, 42]);
  assert.deepEqual(parseRanges('7'), [7]);
  assert.deepEqual(parseRanges('9,2,2,1'), [1, 2, 9]);
});

test('"5 to 8" (what 5+to+8 becomes in a link) is read as 5-8', () => {
  assert.deepEqual(parseRanges('5 to 8'), [5, 6, 7, 8]);
});

test('parts that make no sense are ignored, never guessed at', () => {
  assert.deepEqual(parseRanges('-5'), []);
  assert.deepEqual(parseRanges('12-5'), []);
  assert.deepEqual(parseRanges('5-'), []);
  assert.deepEqual(parseRanges('abc'), []);
  assert.deepEqual(parseRanges(''), []);
  assert.deepEqual(parseRanges(null), []);
  assert.deepEqual(parseRanges('3-5,12-5,x,9-'), [3, 4, 5]);
});

test('a huge range is capped', () => {
  assert.equal(parseRanges('1-9999').length, 301);
});

test('the banner joins runs of numbers and says question or questions', () => {
  assert.equal(rangeLabel([1, 2, 3, 40, 41, 42]), '1-3 and 40-42');
  assert.equal(rangeLabel([1, 2, 3, 7, 40, 41, 42]), '1-3, 7 and 40-42');
  assert.equal(rangeLabel([5]), '5');
  assert.equal(rangeBanner([1, 2, 3, 40, 41, 42]), 'Showing questions 1-3 and 40-42 only.');
  assert.equal(rangeBanner([7]), 'Showing question 7 only.');
  assert.equal(rangeBanner([5, 6]), 'Showing questions 5-6 only.');
});
