import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, review, isDue, sanitize, DAYS } from '../public/js/book-queue.mjs';

test('addDays handles month and year ends', () => {
  assert.equal(addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-02-27', 3), '2026-03-02');
});

test('the first clean answer enters box 1, due tomorrow; help or a miss enters box 0, also due tomorrow', () => {
  assert.deepEqual(review(undefined, true, '2026-11-23'), { b: 1, due: '2026-11-24', last: '2026-11-23', miss: 0 });
  assert.deepEqual(review(undefined, false, '2026-11-23'), { b: 0, due: '2026-11-24', last: '2026-11-23', miss: 1 });
});

test('a same-day repeat or an early review never promotes a question', () => {
  const r = review(undefined, true, '2026-11-23');
  assert.equal(review(r, true, '2026-11-23'), r);
  const spaced = { b: 2, due: '2026-12-01', last: '2026-11-24', miss: 0 };
  assert.equal(review(spaced, true, '2026-11-28'), spaced);
});

test('a clean review on or after the due date moves up a box with a longer gap; a miss drops it', () => {
  let r = review(undefined, true, '2026-11-23'); // box 1, due 24th
  r = review(r, true, '2026-11-24');
  assert.equal(r.b, 2);
  assert.equal(r.due, addDays('2026-11-24', DAYS[2]));
  const down = review(r, false, r.due);
  assert.ok(down.b < r.b);
  assert.equal(down.miss, 1);
});

test('boxes stay between 0 and 5, and the top box is not offered again', () => {
  let r = { b: 5, due: '2026-01-01', last: '2025-12-01', miss: 0 };
  assert.equal(isDue(r, '2026-11-23'), false);
  r = review({ b: 4, due: '2026-01-01', last: '2025-12-01', miss: 0 }, true, '2026-02-01');
  assert.equal(r.b, 5);
  r = review({ b: 0, due: '2026-01-01', last: '2025-12-01', miss: 3 }, false, '2026-02-01');
  assert.equal(r.b, 0);
});

test('isDue is true only on or after the due date', () => {
  const r = { b: 2, due: '2026-11-30', last: '2026-11-23', miss: 0 };
  assert.equal(isDue(r, '2026-11-29'), false);
  assert.equal(isDue(r, '2026-11-30'), true);
  assert.equal(isDue(undefined, '2026-11-30'), false);
});

test('sanitize drops malformed or hostile records', () => {
  const good = { b: 1, due: '2026-11-24', last: '2026-11-23', miss: 0 };
  const out = sanitize({ 'fractions-1': good, '__proto__': good, 'x y': good, 'a-1': { b: 9, due: '2026-11-24', last: '2026-11-23' }, 'a-2': { b: 1, due: 'tomorrow', last: '2026-11-23' }, 'a-3': 'nope', 'a-4': { b: 1, due: '2026-11-24', last: '2026-11-23', miss: -5 } });
  assert.deepEqual(Object.keys(out).sort(), ['a-4', 'fractions-1']);
  assert.equal(out['a-4'].miss, 0);
  assert.deepEqual(sanitize(null), {});
  assert.deepEqual(sanitize([1, 2]), {});
  assert.deepEqual(sanitize('x'), {});
});
