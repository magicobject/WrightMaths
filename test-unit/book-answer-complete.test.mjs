import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matches, hasNonLinearBracket } from '../public/js/book-answer.mjs';

test('factorise completely (complete: linear) rejects every partial factorisation', () => {
  const key = ['(x-1)(x+1)(x+2)'];
  const complete = { complete: 'linear' };
  assert.equal(matches('(x-1)(x+1)(x+2)', key, 'exact', '', complete), true);
  assert.equal(matches('(x+2)(x-1)(x+1)', key, 'exact', '', complete), true);
  assert.equal(matches('(x-1)(x^2+3x+2)', key, 'exact', '', complete), false);
  assert.equal(matches('(x^2-1)(x+2)', key, 'exact', '', complete), false);
  assert.equal(matches('(x+2)(x^2-1)', key, 'exact', '', complete), false);
  assert.equal(matches('(x+1)(x^2+x-2)', key, 'exact', '', complete), false);
  // the other four "factorise completely" questions on the page, each with its partial form
  const cases = [
    ['(x-1)(x-2)(x+3)', '(x-1)(x^2+x-6)'],
    ['(x-3)(x+2)(2x-1)', '(x-3)(2x^2+3x-2)'],
    ['(x-2)(x+2)(x-3)', '(x-2)(x^2-x-6)'],
    ['(x-2)(2x+3)(x+1)', '(x-2)(2x^2+5x+3)'],
  ];
  for (const [full, partial] of cases) {
    assert.equal(matches(full, [full], 'exact', '', complete), true, full);
    assert.equal(matches(partial, [full], 'exact', '', complete), false, partial);
  }
  assert.equal(hasNonLinearBracket('(x-1)(x^2+3x+2)'), true);
  assert.equal(hasNonLinearBracket('(x-1)(x+1)(x+2)'), false);
  assert.equal(hasNonLinearBracket('(x+1)^2(x-3)'), false);
  assert.equal(hasNonLinearBracket('(2x-1)(x+3)'), false);
  assert.equal(hasNonLinearBracket('(x²-1)(x+2)'), true);
});

test('without the opt-in, the default behaviour is unchanged', () => {
  assert.equal(matches('(x+1)^2', ['(x+1)(x+1)'], 'exact'), true);
  assert.equal(matches('(x+3)(x+4)', ['(x+3)(x+4)'], 'exact'), true);
  assert.equal(matches('(x+4)(x+3)', ['(x+3)(x+4)'], 'exact'), true);
});

test('a list asked for as "1 or 2" is right when typed "1,2" (not read as 1.2)', () => {
  assert.equal(matches('1,2', ['1 or 2'], 'value'), true);
  assert.equal(matches('2,1', ['1 or 2'], 'value'), true);
  assert.equal(matches('-3,2', ['-3 or 2'], 'value'), true);
  assert.equal(matches('1,3', ['1 or 2'], 'value'), false);
  assert.equal(matches('1.2', ['1 or 2'], 'value'), false);
  assert.equal(matches('1.2', ['1.2'], 'value'), true);
});

test('a pair key such as (4,1) is also right typed "4 and 1", in that order only', () => {
  const key = ['(4,1)', '4,1', 'a=4,b=1'];
  assert.equal(matches('4 and 1', key, 'exact'), true);
  assert.equal(matches('4 1', key, 'exact'), true);
  assert.equal(matches('(4,1)', key, 'exact'), true);
  assert.equal(matches('1 and 4', key, 'exact'), false);
  assert.equal(matches('(1,4)', key, 'exact'), false);
});
