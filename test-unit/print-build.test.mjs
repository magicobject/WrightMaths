import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractKey, keyAnswer } from '../scripts/book-lib.mjs';
import { answerRuns, optionLetter, prettySymbols } from '../scripts/print/answers.mjs';
import { buildChapters, chapterOrder, hrefToId } from '../scripts/print/chapters.mjs';
import { cleanTree, shorthandRuns } from '../scripts/print/render.mjs';
import { collect, parseArgs, releaseProblems } from '../scripts/build-docx.mjs';
import { buildGraph } from '../scripts/book-lib.mjs';
import { runsToText } from '../scripts/print/omml.mjs';

// ----- keyAnswer: the one answer rule -----

test('keyAnswer: typed answers split on ; and the first is the answer', () => {
  assert.deepEqual(keyAnswer({ answers: '6,2;(6, 2)' }), { answer: '6,2', also: ['(6, 2)'] });
  assert.deepEqual(keyAnswer({ answers: '' }), { answer: '', also: [] });
});

test('keyAnswer: multiple choice gives the correct option, a "show that" gives the mark scheme', () => {
  assert.deepEqual(keyAnswer({ type: 'mc', correct: '3/5', answers: 'ignored' }), { answer: '3/5', also: [] });
  assert.equal(keyAnswer({ type: 'show' }).answer, 'Written answer: see the mark scheme');
});

test('extractKey uses keyAnswer, so the teacher key and the Word build cannot disagree', () => {
  const raw = '<div class="q" data-answers="5/8;0.625"><p class="qtext">x</p></div>'
    + '<div class="q" data-type="mc"><p class="qtext">y</p><ul class="options"><li>a</li><li data-correct>b</li></ul></div>'
    + '<div class="q" data-type="show"><p class="qtext">z</p></div>';
  const rows = extractKey(raw);
  assert.deepEqual(rows.map((r) => [r.answer, r.also]), [['5/8', ['0.625']], ['b', []], ['Written answer: see the mark scheme', []]]);
});

// ----- answers in print -----

test('typed answers become proper symbols and powers', () => {
  assert.equal(prettySymbols('2sqrt(3)'), '2\u221a3');
  assert.equal(prettySymbols('sqrt7'), '\u221a7');
  assert.equal(prettySymbols('x+-2'), 'x\u00b12');
  assert.equal(prettySymbols('10pi'), '10\u03c0');
  assert.equal(prettySymbols('pi'), '\u03c0');
  assert.equal(prettySymbols('x<=3'), 'x\u22643');
  assert.equal(prettySymbols('sin'), 'sin');
  assert.deepEqual(answerRuns('x^2+3x-4'), [{ t: 'x' }, { t: '2', sup: true }, { t: '+3x-4' }]);
  assert.deepEqual(answerRuns('10^-3'), [{ t: '10' }, { t: '-3', sup: true }]);
  assert.equal(optionLetter(0) + optionLetter(2), 'AC');
});

// ----- chapters -----

const topic = (id, title, needs = []) => ({ id, title, strand: 'n', tier: 'F', status: 'live', needs });

test('chapters are numbered in pyramid order: base first, then alphabetical, then the papers', () => {
  const graph = buildGraph([topic('c', 'Cats', ['a']), topic('b', 'Bats'), topic('a', 'Ants')]);
  assert.deepEqual(chapterOrder(graph).map((t) => t.id), ['a', 'b', 'c']);
  const chapters = buildChapters(graph, [{ id: 'paper', title: 'Paper' }]);
  assert.deepEqual(chapters.map((c) => [c.num, c.id, c.kind]), [[1, 'a', 'topic'], [2, 'b', 'topic'], [3, 'c', 'topic'], [4, 'paper', 'paper']]);
});

test('a new base topic renumbers the chapters above it (each print run is an edition)', () => {
  const before = buildChapters(buildGraph([topic('x', 'Xs')]), []);
  const after = buildChapters(buildGraph([topic('x', 'Xs'), topic('base', 'Base')]), []);
  assert.equal(before.find((c) => c.id === 'x').num, 1);
  assert.equal(after.find((c) => c.id === 'x').num, 2);
});

test('hrefToId only accepts a plain page of the book', () => {
  assert.equal(hrefToId('fractions.html'), 'fractions');
  assert.equal(hrefToId('fractions.html#s-adding'), 'fractions');
  assert.equal(hrefToId('https://example.com/a.html'), null);
  assert.equal(hrefToId('#top'), null);
  assert.equal(hrefToId(''), null);
});

// ----- the tree -----

test('cleanTree removes screen sentences from every paragraph, drops screen headings and records what it did', () => {
  const ctx = { page: 'p', removed: [] };
  const tree = [
    { t: 'h', level: 3, runs: [{ t: 'Units and typing' }] },
    { t: 'p', runs: [{ t: 'Keep. Tap a teal word to see it.' }] },
    { t: 'q', body: [{ t: 'qtext', runs: [{ t: 'Work out 3 + 4. Type it like 7.' }] }] },
  ];
  const clean = cleanTree(tree, ctx);
  assert.equal(clean.length, 2);
  assert.equal(runsToText(clean[0].runs), 'Keep.');
  assert.equal(runsToText(clean[1].body[0].runs), 'Work out 3 + 4.');
  assert.deepEqual(ctx.removed.map((r) => r.rule).sort(), ['tap-click', 'type-first']);
});

test('shorthandRuns keeps the glossary maths: {frac:} becomes a fraction, <sup> a power, entities are decoded', () => {
  const runs = shorthandRuns('{frac:3/8} of a m<sup>2</sup> &pound;5');
  assert.deepEqual(runs[0], { x: 'frac', num: [{ t: '3' }], den: [{ t: '8' }] });
  assert.equal(runsToText(runs), '3/8 of a m^2 \u00a35');
});

test('collect finds nodes anywhere in a tree', () => {
  const tree = [{ t: 'box', blocks: [{ t: 'q', n: 1 }, { t: 'section', blocks: [{ t: 'q', n: 2 }] }] }];
  assert.deepEqual(collect(tree, (n) => n.t === 'q').map((q) => q.n), [1, 2]);
});

// ----- command line and release mode -----

test('options: defaults and flags', () => {
  const o = parseArgs(['--pages', 'a,b', '--mono', '--no-hints', '--no-slips', '--release']);
  assert.deepEqual(o.pages, ['a', 'b']);
  assert.deepEqual([o.mono, o.noHints, o.noSlips, o.release], [true, true, true, true]);
  assert.match(o.out, /dist[\\/]gcse-book\.docx$/);
  assert.throws(() => parseArgs(['--nope']), /unknown option/);
});

test('--release fails on any placeholder or non-empty report', () => {
  const clean = { unknown: [], screenWording: [], screenOnlyQuestions: [], deadRefs: [], placeholders: {}, colourWordsInMono: [], figuresBelow300ppi: [], frontNeedsEdit: [], blockedRequests: [] };
  assert.deepEqual(releaseProblems(clean), []);
  assert.deepEqual(releaseProblems({ ...clean, placeholders: { '[TITLE]': 1 }, deadRefs: [{}] }), ['deadRefs', 'placeholders']);
});
