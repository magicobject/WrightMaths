import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isReviewMode } from '../public/js/book-review.mjs';

test('reviewer mode is on only for ?review=1', () => {
  assert.equal(isReviewMode('?review=1'), true);
  assert.equal(isReviewMode('?x=2&review=1'), true);
  assert.equal(isReviewMode(''), false);
  assert.equal(isReviewMode('?review=0'), false);
  assert.equal(isReviewMode('?review=true'), false);
  assert.equal(isReviewMode(undefined), false);
});
