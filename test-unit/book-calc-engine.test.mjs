import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, calculate, formatNumber, tokenize, CalcError, BASIC, SCIENTIFIC } from '../public/js/book-calc-engine.mjs';

const val = (text, options) => evaluate(text, options);
const text = (t, options) => calculate(t, options).text;

test('the four operations follow the book: brackets, powers, then x and / left to right, then + and -', () => {
  assert.equal(val('3 + 4 × 2'), 11);
  assert.equal(val('(3 + 4) × 2'), 14);
  assert.equal(val('12 ÷ 3 × 2'), 8);
  assert.equal(val('20 − 4 − 3'), 13);
  assert.equal(val('2 + 3 ^ 2'), 11);
  assert.equal(val('2 ^ 3 ^ 2'), 512);
});

test('a minus in front of a power applies after it, as on school calculators', () => {
  assert.equal(val('-3 ^ 2'), -9);
  assert.equal(val('(-3) ^ 2'), 9);
  assert.equal(val('-3²'), -9);
  assert.equal(val('2 ^ -1'), 0.5);
  assert.equal(val('5 − -2'), 7);
});

test('squares, square roots and implicit multiplication', () => {
  assert.equal(val('7²'), 49);
  assert.equal(val('(1 + 2)²'), 9);
  assert.equal(val('√(49)'), 7);
  assert.equal(val('√49'), 7);
  assert.equal(val('√(3² + 4²)'), 5);
  assert.equal(val('2(3 + 4)'), 14);
  assert.equal(val('3√(16)'), 12);
  assert.equal(val('6 ÷ 2(1 + 2)'), 9);
});

test('unclosed brackets are closed at equals, stray closing brackets are an error', () => {
  assert.equal(val('√(9 + 16'), 5);
  assert.equal(val('(2 + 3'), 5);
  assert.throws(() => val('2 + 3)'), CalcError);
});

test('Ans is the previous answer', () => {
  assert.equal(val('Ans × 2', { ans: 21 }), 42);
  assert.equal(val('Ans + 1'), 1);
});

test('typing slips are syntax errors, impossible sums are math errors', () => {
  for (const bad of ['', '2 +', '× 3', '1.2.3', '2 3', '()', '2 ++', 'abc', '2 $ 3']) {
    assert.throws(() => val(bad), (e) => e instanceof CalcError && e.kind === 'syntax', bad);
  }
  for (const bad of ['1 ÷ 0', '√(-4)', '0 ^ -1']) {
    assert.throws(() => val(bad), (e) => e instanceof CalcError && e.kind === 'math', bad);
  }
  assert.equal(text('1 ÷ 0'), 'Math error');
  assert.equal(text('2 +'), 'Syntax error');
  assert.equal(calculate('2 +').ok, false);
});

test('answers show 10 significant figures like a real calculator', () => {
  assert.equal(text('0.1 + 0.2'), '0.3');
  assert.equal(text('1 ÷ 3'), '0.3333333333');
  assert.equal(text('2 ÷ 3'), '0.6666666667');
  assert.equal(text('√(2)'), '1.414213562');
  assert.equal(text('12345678 × 100'), '1234567800');
  assert.equal(text('12345678 × 1000'), '1.2345678E10');
  assert.equal(text('1.5 × 10 ^ 12'), '1.5E12');
  assert.equal(text('1 ÷ 10 ^ 10'), '1E-10');
  assert.equal(text('0'), '0');
  assert.equal(formatNumber(Infinity), 'Math error');
  assert.equal(formatNumber(-0.5), '-0.5');
});

test('the book\'s own worked numbers come out right', () => {
  assert.equal(text('73² − 27²'), '4600');
  assert.equal(text('√(52)'), '7.211102551');
  assert.equal(text('60 × 1.15'), '69');
  assert.equal(text('250 × 1.05 ^ 3'), '289.40625');
});

test('keyboard characters work as well as the printed symbols', () => {
  assert.equal(val('6*7'), 42);
  assert.equal(val('84/2'), 42);
  assert.equal(val('50-8'), 42);
});

test('the basic profile has no trigonometry; the scientific profile is ready for it', () => {
  assert.throws(() => val('sin(30)', { profile: BASIC }), CalcError);
  assert.equal(text('sin(30)', { profile: SCIENTIFIC }), '0.5');
  assert.equal(text('cos(60)', { profile: SCIENTIFIC }), '0.5');
  assert.equal(text('tan(45)', { profile: SCIENTIFIC }), '1');
  assert.equal(text('asin(1)', { profile: SCIENTIFIC }), '90');
  assert.equal(text('log(1000)', { profile: SCIENTIFIC }), '3');
  assert.equal(text('2π', { profile: SCIENTIFIC }), '6.283185307');
  assert.equal(text('50%', { profile: SCIENTIFIC }), '0.5');
  assert.throws(() => val('tan(90)', { profile: SCIENTIFIC }), (e) => e.kind === 'math');
  assert.deepEqual(tokenize('2+3').map((t) => t.t), ['num', '+', 'num']);
});
