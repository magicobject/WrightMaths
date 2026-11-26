import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractKey, keyAnswer } from '../scripts/book-lib.mjs';
import { answerRuns, optionLetter, prettySymbols } from '../scripts/print/answers.mjs';
import { buildChapters, chapterOrder, hrefToId } from '../scripts/print/chapters.mjs';
import { answerLineRuns, cleanTree, featuresFor, hintsFor, renderBlocks, shorthandRuns, solutionFor } from '../scripts/print/render.mjs';
import { collect, parseArgs, placeholdersIn, PROPERTIES, releaseProblems } from '../scripts/build-docx.mjs';
import { buildGraph } from '../scripts/book-lib.mjs';
import { runsToText } from '../scripts/print/omml.mjs';
import { estimatePages } from '../scripts/print/estimate.mjs';

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

test('the renderer throws instead of dropping things: an unknown node, a figure with no screenshot', () => {
  const ctx = { page: 'p', figures: new Map(), byId: new Map(), deadRefs: [], figureLog: [], chapter: { num: 1 } };
  assert.throws(() => renderBlocks([{ t: 'mystery' }], ctx), /cannot print a "mystery" node/);
  assert.throws(() => renderBlocks([{ t: 'fig', figs: [{ id: 9, cssWidth: 100 }] }], ctx), /figure 9 on p has no screenshot/);
  assert.doesNotThrow(() => renderBlocks([{ t: 'check', blocks: [] }, { t: 'hr' }], ctx));
});

test('glossary text keeps bold and italic', () => {
  const runs = shorthandRuns('a <b>bold</b> and <i>slanted</i> word');
  assert.deepEqual(runs.filter((r) => r.b || r.i).map((r) => [r.t, Boolean(r.b)]), [['bold', true], ['slanted', false]]);
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

test('placeholders in the document properties stop --release even when the pages have none', () => {
  const clean = { unknown: [], screenWording: [], screenOnlyQuestions: [], deadRefs: [], placeholders: {}, colourWordsInMono: [], figuresBelow300ppi: [], frontNeedsEdit: [], blockedRequests: [] };
  // The real properties are filled in (Greg, 26 Nov 2026); a placeholder there would still be counted.
  assert.deepEqual(placeholdersIn(Object.values(PROPERTIES)), {});
  assert.equal(PROPERTIES.creator, 'Greg Wright');
  const inProperties = placeholdersIn(['[IMPRINT]', '[IMPRINT]', 'x', '[TITLE]']);
  assert.deepEqual(inProperties, { '[IMPRINT]': 2, '[TITLE]': 1 });
  assert.deepEqual(releaseProblems({ ...clean, placeholders: inProperties }), ['placeholders']);
});

test('the answer line of every question type goes through keyAnswer', () => {
  const opt = (t, correct = false) => ({ runs: [{ t }], correct });
  const mc = { n: 1, type: 'mc', answers: '', options: [opt('3/5'), opt('4/7', true)] };
  assert.equal(runsToText(answerLineRuns(mc)), 'B  4/7');
  assert.equal(runsToText(answerLineRuns({ n: 2, type: 'show', answers: '', options: [] })), keyAnswer({ type: 'show' }).answer);
  assert.equal(runsToText(answerLineRuns({ n: 3, type: 'typed', answers: '5/8;0.625', options: [] })), '5/8  (also accept: 0.625)');
  assert.throws(() => answerLineRuns({ n: 4, type: 'mc', answers: '', options: [opt('x')] }), /no option has data-correct/);
});

test('--release fails on any placeholder or non-empty report', () => {
  const clean = { unknown: [], screenWording: [], screenOnlyQuestions: [], deadRefs: [], placeholders: {}, colourWordsInMono: [], figuresBelow300ppi: [], frontNeedsEdit: [], blockedRequests: [] };
  assert.deepEqual(releaseProblems(clean), []);
  assert.deepEqual(releaseProblems({ ...clean, placeholders: { '[TITLE]': 1 }, deadRefs: [{}] }), ['deadRefs', 'placeholders']);
});

// ----- short answers and the first hint -----

const para = (t) => ({ t: 'p', runs: [{ t }] });
const scheme = { t: 'list', kind: 'markscheme', items: [[para('M1 for method')], [para('A1 for 7')]] };

test('short answers: the answer line is the same for every question type, and the worked solution goes', () => {
  const opt = (t, correct = false) => ({ runs: [{ t }], correct });
  const typed = { n: 1, type: 'typed', answers: '5/8;0.625', options: [], solution: [para('5 + 3 = 8')] };
  const mc = { n: 2, type: 'mc', answers: '', options: [opt('3/5'), opt('4/7', true)], solution: [para('because')] };
  assert.equal(runsToText(answerLineRuns(typed)), '5/8  (also accept: 0.625)');
  assert.equal(runsToText(answerLineRuns(mc)), 'B  4/7');
  assert.deepEqual(solutionFor(typed, true), { blocks: [], fallback: false });
  assert.deepEqual(solutionFor(mc, true), { blocks: [], fallback: false });
  // full answers keep everything
  assert.deepEqual(solutionFor(typed, false).blocks, typed.solution);
});

test('short answers: an exam question keeps its mark scheme and loses the working', () => {
  const exam = { n: 3, type: 'typed', marks: 2, answers: '7', options: [], solution: [para('Working: 3 + 4 = 7'), scheme] };
  assert.deepEqual(solutionFor(exam, true), { blocks: [scheme], fallback: false });
});

test('short answers: a "show that" question has the mark scheme; with none it keeps its worked solution and is counted', () => {
  const withScheme = { n: 4, type: 'show', answers: '', options: [], solution: [para('Proof'), scheme] };
  const without = { n: 5, type: 'show', answers: '', options: [], solution: [para('Proof: x = 2')] };
  const empty = { n: 6, type: 'show', answers: '', options: [], solution: [] };
  assert.deepEqual(solutionFor(withScheme, true), { blocks: [scheme], fallback: false });
  assert.deepEqual(solutionFor(without, true), { blocks: without.solution, fallback: true });
  assert.deepEqual(solutionFor(empty, true), { blocks: [], fallback: false });
});

test('first hint: only the first clue of a ladder; all of them otherwise', () => {
  const q = { ladder: [[para('one')], [para('two')], [para('three')]] };
  assert.deepEqual(hintsFor(q, true), [[para('one')]]);
  assert.equal(hintsFor(q, false).length, 3);
  assert.deepEqual(hintsFor({ ladder: [] }, true), []);
});

test('options: a tier book is short by default, the whole book is full by default, and the flags override', () => {
  const on = (o) => [o.shortAnswers, o.firstHint];
  assert.deepEqual(on(parseArgs([])), [false, false]);
  assert.deepEqual(on(parseArgs(['--short-answers'])), [true, false]);
  assert.deepEqual(on(parseArgs(['--first-hint'])), [false, true]);
  assert.deepEqual(on(parseArgs(['--tier', 'foundation'])), [true, true]);
  assert.deepEqual(on(parseArgs(['--tier', 'higher'])), [true, true]);
  assert.deepEqual(on(parseArgs(['--tier', 'higher', '--full-answers'])), [false, true]);
  assert.deepEqual(on(parseArgs(['--tier', 'higher', '--all-hints'])), [true, false]);
  assert.deepEqual(on(parseArgs(['--tier', 'foundation', '--full-answers', '--all-hints'])), [false, false]);
  const noHints = parseArgs(['--tier', 'foundation', '--no-hints', '--no-slips']);
  assert.deepEqual([noHints.noHints, noHints.noSlips, noHints.shortAnswers], [true, true, true]);
});

test('the front matter features say what the build prints', () => {
  assert.deepEqual(featuresFor({}), ['hints', 'all-hints', 'full-answers', 'slips']);
  assert.deepEqual(featuresFor({ shortAnswers: true, firstHint: true }), ['hints', 'first-hint', 'short-answers', 'no-slips']);
  assert.deepEqual(featuresFor({ noHints: true, noSlips: true }), ['no-hints', 'full-answers', 'no-slips']);
});

test('the page estimate counts lines when answers are short', () => {
  const words = { front: 0, chapters: 0, answers: 100, hints: 100, glossary: 0 };
  const byWords = estimatePages({ words });
  const byLines = estimatePages({ words, lines: { answers: 840, hints: 420 } });
  assert.equal(byLines.answers - byWords.answers, 19); // 840 lines at 42 a page is 20 pages, not 1
  assert.equal(byLines.hints - byWords.hints, 9);
});
