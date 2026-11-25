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
  assert.match(feedbackFor('900', ['1000']), /Close, but not yet/);
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

test('an algebraic fraction that could still be cancelled is not accepted as the simplified answer', () => {
  assert.ok(!matches('(x+3)(x-1)/(2(x-1))', ['(x+3)/2'], 'exact'));
  assert.ok(matches('(x+3)/2', ['(x+3)/2'], 'exact'));
  assert.ok(matches('(x+3)/(2)', ['(x+3)/2'], 'exact'));
});

test('inequalities written another way are accepted', () => {
  const ok = (typed, key) => assert.ok(matches(typed, [key], 'exact'), `${typed} should match ${key}`);
  const no = (typed, key) => assert.ok(!matches(typed, [key], 'exact'), `${typed} should not match ${key}`);
  ok('4>x>=-1', '-1<=x<4'); ok('4>x≥-1', '-1<=x<4'); ok('x>=-1 and x<4', '-1<=x<4'); ok('x>=-1,x<4', '-1<=x<4');
  ok('x<4 and x>=-1', '-1<=x<4');
  ok('x<-3 or 4<x', 'x<-3 or x>4'); ok('x<-3;x>4', 'x<-3 or x>4'); ok('x>7.', 'x>7'); ok('x>=5.0', 'x>=5');
  ok('6.50<=x<7.50', '6.5<=x<7.5'); ok('-2>=x', 'x<=-2'); ok('x≤3', 'x<=3');
  no('x>7', 'x>=7'); no('-1<x<4', '-1<=x<4'); no('x<-3 or x>5', 'x<-3 or x>4');
  ok('2 3 4 5 6', '2,3,4,5,6'); ok('{2,3,4,5,6}', '2,3,4,5,6'); ok('2;3;4', '2,3,4');
});

test('several letters, bracketed halves, cancelled fractions and surds with brackets', () => {
  const ok = (typed, key) => assert.ok(matches(typed, [key], 'exact'), `${typed} should match ${key}`);
  const no = (typed, key) => assert.ok(!matches(typed, [key], 'exact'), `${typed} should not match ${key}`);
  ok('(1/2)(a+b)', '1/2(a+b)'); ok('b-(1/2)a', '-1/2a+b'); ok('-(1/2)a+b', '-1/2a+b'); ok('b+(-a)', 'b-a'); ok('(b-a)', 'b-a');
  ok('2a+1/2b', '2a+(1/2)b');
  no('6x/9', '2x/3'); no('(x^2-9)/(x^2+x-6)', '(x-3)/(x-2)'); no('2x/x^2', '2/x');
  ok('(2+x)/3', '(x+2)/3');
  ok('(3+√5)/2', '(3+sqrt5)/2'); ok('(3+sqrt(5))/2', '(3+sqrt5)/2'); ok('(√2)/2', 'sqrt2/2'); ok('3sqrt(2)/2', '3sqrt2/2');
  ok('3sqrt2', '3√2'); ok('3 sqrt(2)', '3√2');
});

test('2/3x is ambiguous and is not accepted for 2x/3', () => {
  assert.ok(!matches('2/3x', ['2x/3'], 'exact'));
  assert.ok(matches('2x/3', ['2x/3'], 'exact'));
  assert.ok(matches('-1/2a+b', ['-1/2a+b'], 'exact'));
});

// ---------- round 6: units, percentages, decimal commas, algebra, typing ----------

test('spoken units after a plain number are ignored', async () => {
  const { matches: m } = await import('../public/js/book-answer.mjs');
  for (const typed of ['1.98 seconds', '1.98s', '1.98 sec', '1.98 secs', '1.98 second']) assert.ok(m(typed, ['1.98']), typed);
  for (const typed of ['7.5 hours', '7.5h', '7.5 hrs', '7.5 hr', '7.5 hour']) assert.ok(m(typed, ['7.5']), typed);
  for (const typed of ['6 minutes', '6 mins', '6 min']) assert.ok(m(typed, ['6']), typed);
  for (const typed of ['8.83 m/s', '8.83m/s', '8.83 km/h', '8.83 mph']) assert.ok(m(typed, ['8.83']), typed);
  assert.ok(m('10 units', ['10']));
  assert.ok(m('10 unit', ['10']));
  assert.ok(m('84 pounds', ['84']));
  assert.ok(m('2.7 g/cm3', ['2.7']));
  assert.ok(!m('1.99 seconds', ['1.98']));
});

test('a unit is not cut off an algebra answer such as 3h', async () => {
  const { matches: m } = await import('../public/js/book-answer.mjs');
  assert.ok(!m('3', ['3h'], 'exact'));
  assert.ok(m('3h', ['3h'], 'exact'));
});

const SPEED_Q = 'A runner goes at 12 m/s for 5 seconds. How far does she go? Answer in metres. D = S x T = 12 x 5 = 60 m.';
const DENSITY_Q = 'A block of metal has a mass of 540 g and a volume of 200 cm3. What is its density? Answer in g/cm3. D = 540 / 200 = 2.7 g/cm3.';
const MASS_Q = 'A metal has a density of 8 g/cm3. What is the mass of 25 cm3 of it? Answer in grams. M = 8 x 25 = 200 g.';
const MPH_Q = 'A car travels 180 miles in 4 hours. What is its average speed in mph? S = 180 / 4 = 45 mph.';

test('a typed unit must suit the question; no unit is always fine', async () => {
  const { matches: m } = await import('../public/js/book-answer.mjs');
  assert.ok(m('60', ['60'], 'value', SPEED_Q));
  assert.ok(m('60 m', ['60'], 'value', SPEED_Q));
  assert.ok(m('60 metres', ['60'], 'value', SPEED_Q));
  assert.ok(m('60m', ['60'], 'value', SPEED_Q));
  assert.ok(!m('60 km', ['60'], 'value', SPEED_Q));
  assert.ok(!m('60 seconds', ['60'], 'value', SPEED_Q));
  assert.ok(m('2.7', ['2.7'], 'value', DENSITY_Q));
  assert.ok(m('2.7 g/cm3', ['2.7'], 'value', DENSITY_Q));
  assert.ok(!m('2.7 kg', ['2.7'], 'value', DENSITY_Q));
  assert.ok(m('200 g', ['200'], 'value', MASS_Q));
  assert.ok(m('200 grams', ['200'], 'value', MASS_Q));
  assert.ok(!m('200 kg', ['200'], 'value', MASS_Q));
  assert.ok(m('84 pounds', ['84'], 'value', 'A coat costs 70 pounds plus 20%. How much now?'));
  assert.ok(m('10 units', ['10'], 'value', SPEED_Q));
  assert.ok(!m('45 km/h', ['45'], 'value', MPH_Q));
  assert.ok(m('45 mph', ['45'], 'value', MPH_Q));
});

test('a wrong unit gets an honest nudge, not a pass', async () => {
  const { unitMismatch, feedbackFor: f } = await import('../public/js/book-answer.mjs');
  assert.equal(unitMismatch('60 km', SPEED_Q), true);
  assert.equal(unitMismatch('60', SPEED_Q), false);
  assert.match(f('60 km', ['60'], SPEED_Q), /Check the unit/);
  assert.doesNotMatch(f('61 km', ['60'], SPEED_Q) ?? '', /Check the unit/);
});

test('a percentage is not accepted where the key is a bare decimal or number', async () => {
  const { matches: m, feedbackFor: f } = await import('../public/js/book-answer.mjs');
  assert.ok(!m('35%', ['0.35']));
  assert.ok(m('0.35', ['0.35']));
  assert.ok(!m('108%', ['1.08']));
  assert.ok(m('1.08', ['1.08']));
  assert.ok(m('75%', ['3/4']), 'a fraction key still takes a percentage');
  assert.ok(m('35%', ['35%', '35']));
  assert.match(f('35%', ['0.35']), /percentage\. Write it as a decimal/);
  assert.match(f('5%', ['5']), /without the % sign/);
});

test('a decimal comma is read as a decimal point, and thousands still work', async () => {
  const { matches: m, decimalCommaTip } = await import('../public/js/book-answer.mjs');
  assert.ok(m('5,60', ['5.6']));
  assert.ok(m('5,6', ['5.6']));
  assert.equal(parseNumber('1,250'), 1250);
  assert.equal(parseNumber('1,250.5'), 1250.5);
  assert.equal(decimalCommaTip('5,60', ['5.6']), 'Use a decimal point: 5.60');
  assert.equal(decimalCommaTip('5.60', ['5.6']), null);
  assert.equal(decimalCommaTip('1,250', ['1250']), null);
  assert.ok(!m('2,50', ['2,5']), 'a keyed pair stays a pair');
  assert.ok(m('2,5', ['2,5']));
});

test('equivalent algebra: bracketed fractions, decimal coefficients, two-letter prefixes', async () => {
  const { matches: m } = await import('../public/js/book-answer.mjs');
  assert.ok(m('(2/3)x', ['2x/3', '(2x)/3'], 'exact'));
  assert.ok(!m('2/3x', ['2x/3', '(2x)/3'], 'exact'), 'still ambiguous without brackets');
  assert.ok(m('1.5x', ['3x/2', '(3x)/2'], 'exact'));
  assert.ok(m('(3/2)x', ['3x/2', '(3x)/2'], 'exact'));
  assert.ok(m('0.5(y-1)', ['(y-1)/2', 'y/2-1/2'], 'exact'));
  assert.ok(m('0.5y-0.5', ['(y-1)/2', 'y/2-1/2'], 'exact'));
  assert.ok(!m('0.5y-0.6', ['(y-1)/2', 'y/2-1/2'], 'exact'));
  assert.ok(m('AB=b-a', ['-a+b', 'b-a'], 'exact'));
  assert.ok(m('ab = b - a', ['-a+b', 'b-a'], 'exact'));
  assert.ok(m('x = 5', ['5']));
});

test('plus or minus before a root of letters is accepted, however it is typed', async () => {
  const { matches: m } = await import('../public/js/book-answer.mjs');
  for (const typed of ['±sqrt(a)', '+-sqrt(a)', '+/-sqrt(a)', 's = +-sqrt(a)', '±√a']) assert.ok(m(typed, ['sqrt(a)', '√a'], 'exact'), typed);
  for (const typed of ['±sqrt(y-3)', '+-sqrt(y-3)', '+/-sqrt(y-3)']) assert.ok(m(typed, ['sqrt(y-3)', '√(y-3)'], 'exact'), typed);
  assert.ok(!m('±sqrt(b)', ['sqrt(a)', '√a'], 'exact'));
  assert.ok(!m('+-sqrt(5)', ['sqrt(5)'], 'exact'), 'a numeric root is not given a free pass');
});

test('roots and pi typed in words', async () => {
  const { matches: m } = await import('../public/js/book-answer.mjs');
  assert.ok(m('2 root 3', ['2sqrt(3)', '2√3'], 'exact'));
  assert.ok(m('2 root3', ['2sqrt(3)', '2√3'], 'exact'));
  assert.ok(m('2 square root 3', ['2sqrt(3)'], 'exact'));
  const Q = 'A circle has a radius of 5 cm. Its circumference is ___π cm. Type the number that goes in front of the π.';
  for (const typed of ['10', '10π', '10 π', '10pi', '10 pi']) assert.ok(m(typed, ['10'], 'value', Q), typed);
  assert.ok(!m('11pi', ['10'], 'value', Q));
  assert.ok(!m('10pi', ['10'], 'value', 'How many sides has a decagon? Type a number.'));
  assert.ok(m('10pi', ['10pi'], 'exact'));
});

test('"minus 2" in words gets a nudge to type the sign', async () => {
  const { matches: m, feedbackFor: f } = await import('../public/js/book-answer.mjs');
  assert.equal(f('minus 2', ['-2']), 'Type a minus sign: -2');
  assert.equal(f('negative 3.5', ['-3.5']), 'Type a minus sign: -3.5');
  assert.ok(!m('minus 2', ['-2']));
});

test('the same digits in a different order get an order nudge', async () => {
  const { feedbackFor: f } = await import('../public/js/book-answer.mjs');
  assert.equal(f('0.53', ['0.35']), 'Check the order of your digits.');
  assert.equal(f('53', ['35']), 'Check the order of your digits.');
  assert.doesNotMatch(f('44', ['35']) ?? '', /order/);
  assert.doesNotMatch(f('11', ['11']) ?? '', /order/);
});

test('feedbackOrDefault never returns an empty message', async () => {
  const { feedbackOrDefault } = await import('../public/js/book-answer.mjs');
  for (const [typed, key] of [['7', '1000'], ['zzz', 'x+1'], ['', '5'], ['5', '5']]) {
    assert.ok(feedbackOrDefault(typed, [key]).length > 0, `${typed} vs ${key}`);
  }
});

test('100 is not "close" to 84, but 900 is close to 1000', async () => {
  const { closeness } = await import('../public/js/book-answer.mjs');
  assert.equal(closeness('100', ['84']), 'far');
  assert.equal(closeness('900', ['1000']), 'range');
});
