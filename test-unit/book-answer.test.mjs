import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNumber, matches, rightValueWrongForm, textKey, splitList, diagnose } from '../public/js/book-answer.mjs';

test('parseNumber reads integers, decimals, fractions, mixed numbers and percentages', () => {
  assert.equal(parseNumber('12'), 12);
  assert.equal(parseNumber(' -3.5 '), -3.5);
  assert.equal(parseNumber('3/4'), 0.75);
  assert.equal(parseNumber('3 / 4'), 0.75);
  assert.equal(parseNumber('1 1/2'), 1.5);
  assert.equal(parseNumber('-1 1/2'), -1.5);
  assert.equal(parseNumber('75%'), 0.75);
  assert.equal(parseNumber('1,250'), 1250);
});

test('parseNumber ignores currency, units and a leading "x ="', () => {
  assert.equal(parseNumber('£35'), 35);
  assert.equal(parseNumber('x = 5'), 5);
  assert.equal(parseNumber('13cm'), 13);
  assert.equal(parseNumber('90°'), 90);
  assert.equal(parseNumber('25 cm²'), 25);
});

test('parseNumber accepts a proper minus sign and rejects non-numbers', () => {
  assert.equal(parseNumber('−2'), -2);
  assert.equal(parseNumber('abc'), null);
  assert.equal(parseNumber(''), null);
  assert.equal(parseNumber('1/0'), null);
  assert.equal(parseNumber('6x-1'), null);
});

test('value mode accepts every equivalent form of the same number', () => {
  for (const form of ['3/4', '6/8', '0.75', '75%', '0.750']) {
    assert.ok(matches(form, ['3/4'], 'value'), form);
  }
  assert.ok(!matches('2/3', ['3/4'], 'value'));
  assert.ok(matches('1 5/12', ['17/12'], 'value'));
  assert.ok(matches('17/12', ['17/12', '1 5/12'], 'value'));
});

test('value mode does not accept a near miss', () => {
  assert.ok(!matches('7.21', ['7.2'], 'value'));
  assert.ok(matches('7.2', ['7.2'], 'value'));
  assert.ok(!matches('', ['7.2'], 'value'));
});

test('exact mode needs the written form asked for, not just the value', () => {
  assert.ok(matches('2/5', ['2/5'], 'exact'));
  assert.ok(!matches('6/15', ['2/5'], 'exact'));
  assert.ok(!matches('0.4', ['2/5'], 'exact'));
  assert.ok(matches('1 1/2', ['3/2', '1 1/2'], 'exact'));
  assert.ok(matches('3/2', ['3/2', '1 1/2'], 'exact'));
  assert.ok(matches(' 2 / 5 ', ['2/5'], 'exact'));
});

test('rightValueWrongForm spots an unsimplified answer', () => {
  assert.ok(rightValueWrongForm('6/15', ['2/5']));
  assert.ok(!rightValueWrongForm('2/5', ['2/5']));
  assert.ok(!rightValueWrongForm('3/7', ['2/5']));
});

test('algebra answers are compared as normalised text', () => {
  assert.ok(matches('6x-1', ['6x-1', '-1+6x'], 'exact'));
  assert.ok(matches('6x − 1', ['6x-1'], 'exact'));
  assert.ok(matches('-1 + 6x', ['6x-1', '-1+6x'], 'exact'));
  assert.ok(!matches('6x+1', ['6x-1'], 'exact'));
});

test('surd answers accept the common ways of typing a root', () => {
  const answers = ['3√2', '3sqrt2', '3sqrt(2)'];
  assert.ok(matches('3√2', answers, 'exact'));
  assert.ok(matches('3 sqrt(2)', answers, 'exact'));
  assert.ok(matches('3sqrt 2', answers, 'exact'));
  assert.ok(!matches('2√3', answers, 'exact'));
  assert.equal(textKey('sqrt(18)'), '√18');
});

test('splitList trims and drops empty items', () => {
  assert.deepEqual(splitList('3/2; 1 1/2 ;'), ['3/2', '1 1/2']);
  assert.deepEqual(splitList(undefined), []);
});

test('diagnose spots a wrong sign and a slipped decimal point, and nothing else', () => {
  assert.match(diagnose('8', ['-8']), /sign/);
  assert.match(diagnose('-5', ['5']), /sign/);
  assert.match(diagnose('340', ['34']), /10 times too big/);
  assert.match(diagnose('3.4', ['34']), /10 times too small/);
  assert.match(diagnose('4800', ['48']), /100 times too big/);
  assert.equal(diagnose('7', ['8']), null);
  assert.equal(diagnose('abc', ['8']), null);
  assert.equal(diagnose('0', ['0']), null);
});

test('typing styles students use are all accepted: x=, pound sign, units, true minus, en dash, % and fractions', () => {
  assert.ok(matches('x = 5', ['5']));
  assert.ok(matches('£35', ['35']));
  assert.ok(matches('−75 m', ['-75']));
  assert.ok(matches('–75', ['-75']));
  assert.ok(matches('-75', ['-75']));
  assert.ok(matches('0.5', ['1/2']));
  assert.ok(matches('50%', ['1/2']));
  assert.ok(matches('4.0', ['4;4.00'.split(';')[0]]));
});

test('a temperature typed with the unit is accepted', () => {
  assert.ok(matches('5\u00b0C', ['5']));
  assert.ok(matches('\u22125 \u00b0C', ['-5']));
  assert.ok(matches('-5\u00b0', ['-5']));
});

test('two solutions typed with a repeated "x =" still match', () => {
  const answers = ['-4 and 3', '3 and -4', '-4,3', '-4 or 3'];
  assert.ok(matches('x=-4 or x=3', answers, 'exact'));
  assert.ok(matches('x = -4 and x = 3', answers, 'exact'));
  assert.ok(matches('-4, x=3', answers, 'exact'));
  assert.ok(!matches('x=-4 or x=5', answers, 'exact'));
});

test('feedbackFor is honest about how far off an answer is', async () => {
  const { feedbackFor, closeness } = await import('../public/js/book-answer.mjs');
  assert.equal(closeness('7', ['1000']), 'far');
  assert.equal(closeness('900', ['1000']), 'range');
  assert.equal(closeness('999', ['1000']), 'near');
  assert.equal(feedbackFor('7', ['1000']), null);
  assert.match(feedbackFor('900', ['1000']), /right area/);
  assert.match(feedbackFor('8.602', ['8.6']), /Very near/);
  assert.match(feedbackFor('5%', ['5']), /without the % sign/);
  assert.match(feedbackFor('abc', ['12']), /number/);
});

test('a pair typed in brackets matches the bare pair', () => {
  assert.ok(matches('(2,5)', ['2,5'], 'exact'));
  assert.ok(matches('x=2, y=5', ['2,5'], 'exact'));
});

test('cubic and small area units are ignored in a typed answer', () => {
  for (const typed of ['72 cm³', '72cm3', '72 cm^3', '72 litres', '72 l', '72 ml', '9503.3 mm²', '9503.3 mm2']) {
    const key = typed.startsWith('9503') ? '9503.3' : '72';
    assert.ok(matches(typed, [key], 'value'), typed);
  }
  assert.ok(!matches('73 cm³', ['72'], 'value'));
});

test('standard form needs its multiplication sign, and bracketed whole-number indices are tolerated', async () => {
  const { feedbackFor } = await import('../public/js/book-answer.mjs');
  const key = ['4.6x10^6'];
  for (const ok of ['4.6x10^6', '4.6*10^6', '4.6 x 10^6', '4.6×10^6', '4.6X10^6']) assert.ok(matches(ok, key, 'exact'), ok);
  for (const bad of ['4.610^6', '4.6 10^6', '46x10^5']) assert.ok(!matches(bad, key, 'exact'), bad);
  assert.ok(matches('a^(8)', ['a^8'], 'exact'));
  assert.ok(matches('7^(-2)', ['7^-2'], 'exact'));
  assert.match(feedbackFor('4.6E6', key), /x10\^6/);
});

test('the same algebra written another way is accepted, but only in an acceptable form', async () => {
  const { sameAlgebra, feedbackFor } = await import('../public/js/book-answer.mjs');
  const ok = (typed, key) => assert.ok(matches(typed, [key], 'exact'), `${typed} should match ${key}`);
  const no = (typed, key) => assert.ok(!matches(typed, [key], 'exact'), `${typed} should not match ${key}`);
  ok('n*3+1', '3n+1'); ok('1+3n', '3n+1'); ok('+3n+1', '3n+1'); ok('11-n*2', '11-2n'); ok('-n*2+11', '11-2n');
  ok('y=x*3-2', '3x-2'); ok('y=.5x+7', '0.5x+7'); ok('y=7+x/2', '0.5x+7');
  ok('n*n+n', 'n^2+n'); ok('n^2*2+3', '2n^2+3'); ok('(x+4)(x+3)', '(x+3)(x+4)');
  no('2(x+1)', '2x+2');            // not expanded
  no('x^2+7x-2x-14', 'x^2+5x-14'); // not simplified
  no('x^2+7x+12', '(x+3)(x+4)');   // not factorised
  no('3n+2', '3n+1');
  assert.equal(sameAlgebra('x^2+7x-2x-14', 'x^2+5x-14'), 'longer');
  assert.match(feedbackFor('x^2+7x-2x-14', ['x^2+5x-14']), /form asked for/);
  ok('yes.', 'yes'); ok('3 4', '3,4'); ok('16;10', '16,10');
});
