import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toMathML, toLinear, expandMath, mathToLinear } from '../scripts/book-math.mjs';

test('plain-text form reads as it was written', () => {
  assert.equal(toLinear('x^2+5x+4'), 'x^2 + 5x + 4');
  assert.equal(toLinear('frac(x^2+5x+4, x-1)'), '(x^2 + 5x + 4)/(x - 1)');
  assert.equal(toLinear('frac(dy, dx)'), 'dy/dx');
  assert.equal(toLinear('e^(2x)'), 'e^2x'.replace('2x', '(2x)'));
  assert.equal(toLinear('-3x+2'), '-3x + 2');
  assert.equal(toLinear('u_(n+1)'), 'u_(n + 1)');
  assert.equal(toLinear('x >= 2'), 'x >= 2');
  assert.equal(toLinear('f(1, 2)'), 'f(1, 2)');
  assert.equal(toLinear('int(0, 2) x^2 dx'), 'integral from 0 to 2 of x^2 dx');
  assert.equal(toLinear('sum(r=1, n) r'), 'sum from r = 1 to n of r');
  assert.equal(toLinear('sin(30deg)'), 'sin(30°)');
  assert.equal(toLinear('abs(x-3)'), '|x - 3|');
});

test('MathML has a real structure and a text alternative', () => {
  const m = toMathML('frac(1, 2)');
  assert.match(m, /^<math alttext="1\/2"><mfrac><mrow><mn>1<\/mn><\/mrow><mrow><mn>2<\/mn><\/mrow><\/mfrac><\/math>$/);
  assert.match(toMathML('x^2'), /<msup><mi>x<\/mi><mn>2<\/mn><\/msup>/);
  assert.match(toMathML('a-b'), /<mo>−<\/mo>/);
  assert.match(toMathML('int(0, 1) x dx'), /<msubsup><mo>∫<\/mo>/);
  assert.match(toMathML('x', { display: true }), /display="block"/);
  assert.match(toMathML('sin x'), /<mi mathvariant="normal">sin<\/mi>/);
  assert.match(toMathML('a<b'), /<mo>&lt;<\/mo>/);
});

test('a typo fails loudly', () => {
  for (const bad of ['x^', '(x+1', 'x+1)', 'frac(1)', 'sqrt(', 'x | y', 'int(1)', '', '{', 'sum(r=1)']) {
    assert.throws(() => toMathML(bad), /maths shorthand/, bad);
  }
});

test('expandMath and mathToLinear handle whole pages of text', () => {
  const html = '<p>Solve {m:x^2=4}.</p>{md:y=x^2}';
  assert.match(expandMath(html), /<p>Solve <span class="mw"><math alttext="x\^2 = 4">.*<\/math>\.<\/span><\/p>/);
  assert.match(expandMath(html), /<span class="eq"><math display="block"/);
  assert.equal(mathToLinear(html), '<p>Solve x^2 = 4.</p>y = x^2');
});

test('a long inline formula breaks at its equals signs, and punctuation stays with the last piece', () => {
  const out = expandMath('<p>{m:(x+3)^2-4=x^2+6x+9-4=x^2+6x+5}.</p>');
  assert.ok(out.match(/<math /g).length >= 3);
  assert.match(out, /<math alttext="= x\^2 \+ 6x \+ 5">.*<\/math>\.<\/span><\/p>$/);
  assert.match(out, /<span class="mw"><math alttext="= x\^2 \+ 6x \+ 5">/);
});

test('column vectors, nCr, set symbols, arrows and primes', () => {
  assert.match(toMathML('col(1, 2)'), /<mtable><mtr><mtd><mn>1<\/mn><\/mtd><\/mtr><mtr><mtd><mn>2<\/mn><\/mtd><\/mtr><\/mtable>/);
  assert.equal(toLinear('col(3, -4, 5)'), 'column vector (3, -4, 5)');
  assert.match(toMathML('nCr(n, r)'), /<mmultiscripts><mi>C<\/mi>/);
  assert.equal(toLinear('nCr(5, 2)'), '5C2');
  assert.equal(toLinear('x elementof reals'), 'x in R');
  assert.equal(toLinear("f'(x)"), "f'(x)");
  assert.match(toMathML("f''(x)"), /<mo>\u2033<\/mo>/);
  assert.match(toMathML('a implies b'), /<mo>\u21d2<\/mo>/);
  assert.match(toMathML('x=3 plusminus 2'), /<mo>\u00b1<\/mo>/);
  assert.equal(toLinear('S_(infinity)'), 'S_infinity');
});

test('a fraction next to other terms is bracketed in the plain-text form', () => {
  assert.equal(toLinear('27^(frac(2, 3))'), '27^(2/3)');
  assert.equal(toLinear('frac(1, 2) x'), '(1/2)x');
  assert.equal(toLinear('x = frac(a, b)'), 'x = a/b');
  assert.equal(toLinear('frac(x + 1, x - 2)'), '(x + 1)/(x - 2)');
});
