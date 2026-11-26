import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED, SENTENCE_RULES, dropHeading, reportScreenWords, sentenceRanges, stripScreenWording } from '../scripts/print-rules.mjs';
import { runsToText } from '../scripts/print/omml.mjs';

const text = (s) => [{ t: s }];
const strip = (runs) => runsToText(stripScreenWording(runs).runs);

test('a sentence that tells the student to type is removed, the rest stays', () => {
  assert.equal(strip(text('Write 0.35 as a fraction. Type your answer like 3/8. Then simplify.')), 'Write 0.35 as a fraction. Then simplify.');
  assert.equal(strip(text('Write down the point. (Type it like 2sqrt7.)')), 'Write down the point.');
});

test('a sentence that runs across a fraction is removed with the fraction in it', () => {
  const runs = [{ t: 'Work it out. Type it like ' }, { x: 'frac', num: text('3'), den: text('8') }, { t: '. Then check.' }];
  const result = stripScreenWording(runs);
  assert.equal(runsToText(result.runs), 'Work it out. Then check.');
  assert.deepEqual(result.removed.map((r) => r.rule), ['type-first']);
});

test('clauses: skip-if-you-are-happy and a typed example are cut out of a sentence that is otherwise needed', () => {
  assert.equal(strip(text('Quick recap of earlier topics (skip if you are happy)')), 'Quick recap of earlier topics');
  assert.equal(strip(text('Write the new point, typed (2, 5).')), 'Write the new point.');
});

test('"type" as a plain English word is not touched: this type of triangle', () => {
  const s = 'What type of triangle is it? Type of angle matters here.';
  assert.equal(strip(text(s)), s);
  assert.deepEqual(reportScreenWords(s), []);
});

test('whole screen sentences: skip to, tap or click, check my answer, pop-up, scroll', () => {
  for (const s of ['Skip to the lesson', 'Tap a teal word anywhere on the page to see this again.', 'Click here.', 'Press Check my answer when you are ready.', 'A pop-up shows the meaning.', 'Scroll sideways to see the table.']) {
    assert.equal(strip(text(`Keep this. ${s}`)), 'Keep this.', s);
  }
  assert.ok(SENTENCE_RULES.every((r) => r.why), 'every rule says why');
});

test('what is left over is reported unless the allowlist says why it is fine', () => {
  assert.deepEqual(reportScreenWords('Use the button to see more').map((h) => h.word), ['button']);
  assert.deepEqual(reportScreenWords('Press the inverse button on your calculator'), []);
  assert.deepEqual(reportScreenWords('A water tap fills a tank'), []);
  assert.deepEqual(reportScreenWords('A bag has 5 red buttons'), []);
  assert.deepEqual(reportScreenWords('Please tap it'), [{ word: 'tap', context: 'Please tap it' }]);
  assert.ok(ALLOWED.every((a) => a.why), 'every allowlist entry says why');
});

test('sentences are split after . ? ! and a closing bracket, not inside a number', () => {
  const s = 'Costs 5.60 pounds. Is it? Yes! (Done.) End';
  assert.deepEqual(sentenceRanges(s).map(([a, b]) => s.slice(a, b).trim()), ['Costs 5.60 pounds.', 'Is it?', 'Yes!', '(Done.)', 'End']);
});

test('headings that are only about typing are dropped', () => {
  assert.equal(dropHeading('Units and typing'), true);
  assert.equal(dropHeading('How to type surds'), true);
  assert.equal(dropHeading('Types of triangle'), false);
});

test('a sentence about calculator keys is kept, and calculator words are not reported', async () => {
  const { stripScreenWording, reportScreenWords } = await import('../scripts/print-rules.mjs');
  const runs = [{ t: 'Use Ans: type 1 =, then (Ans + 10) ÷ 3 = = =. Type your answer to 2 d.p.' }];
  const { runs: out } = stripScreenWording(runs);
  assert.match(out.map((r) => r.t).join(''), /Use Ans: type 1 =/);
  assert.doesNotMatch(out.map((r) => r.t).join(''), /Type your answer/);
  assert.deepEqual(reportScreenWords('Keep all the digits with the Ans button.'), []);
  assert.deepEqual(reportScreenWords('A Fibonacci-type sequence adds the last two terms.'), []);
  assert.deepEqual(reportScreenWords('You can type either 045 or 45 in the answer box.').map((h) => h.word), ['type', 'answer box']);
});

test('a calculator sentence that also talks about the answer box is still screen talk', async () => {
  const { stripScreenWording, reportScreenWords } = await import('../scripts/print-rules.mjs');
  const { runs } = stripScreenWording([{ t: 'Use your calculator, then type the answer in the answer box. Next.' }]);
  assert.doesNotMatch(runs.map((r) => r.t).join(''), /answer box/);
  assert.equal(reportScreenWords('These are quick checks with an answer box.').length, 1);
});
