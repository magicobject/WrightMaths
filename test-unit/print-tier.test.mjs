// The two-book (Foundation / Higher) rules: what counts as Higher, how what is left is numbered, and which chapters each book has.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph } from '../scripts/book-lib.mjs';
import { buildChapters } from '../scripts/print/chapters.mjs';
import { estimatePages, wordCount } from '../scripts/print/estimate.mjs';
import { parseArgs, propertiesFor } from '../scripts/build-docx.mjs';
import { runsToText } from '../scripts/print/omml.mjs';
import { chipsLeft, dropChipSentence, dropHigher, glossaryForTier, papersForTier, renumberQuestions, retitleFront } from '../scripts/print/tier.mjs';

const chip = { t: 'Higher', b: true, chip: true };
const h = (level, text, withChip = false) => ({ t: 'h', level, runs: [{ t: `${text} ` }, ...(withChip ? [chip] : [])] });
const p = (text) => ({ t: 'p', runs: [{ t: text }] });
const q = (n, text, withChip = false, extra = {}) => ({ t: 'q', n, body: [{ t: 'qtext', runs: [...(withChip ? [chip, { t: ' ' }] : []), { t: text }] }], ladder: [], wrong: [], solution: [], options: [], tags: { from: [] }, ...extra });
const texts = (blocks) => blocks.map((b) => (b.t === 'q' ? `Q${b.n}` : runsToText(b.runs).trim()));

// ----- the h2 rule -----

test('an h2 with the Higher chip takes everything up to the next h2 with it', () => {
  const blocks = [h(2, 'Basics'), p('keep 1'), h(2, 'Going further', true), p('cut 1'), h(3, 'a sub-heading'), q(1, 'cut question'), h(2, 'Why it works'), p('keep 2')];
  assert.deepEqual(texts(dropHigher(blocks)), ['Basics', 'keep 1', 'Why it works', 'keep 2']);
});

test('a Higher h2 at the end of its section takes the rest of that section only', () => {
  const blocks = [{ t: 'section', blocks: [h(2, 'A'), p('x'), h(2, 'B', true), p('y')] }, { t: 'section', blocks: [h(2, 'C'), p('z')] }];
  const out = dropHigher(blocks);
  assert.deepEqual(out.map((s) => texts(s.blocks)), [['A', 'x'], ['C', 'z']]);
});

test('an h3 with the chip ends at the next h3 or h2, not at a lower heading', () => {
  const blocks = [h(2, 'S'), h(3, 'Stretch', true), p('cut'), h(4, 'deeper'), p('cut too'), h(3, 'Next'), p('keep')];
  assert.deepEqual(texts(dropHigher(blocks)), ['S', 'Next', 'keep']);
  assert.deepEqual(texts(dropHigher([h(3, 'Stretch', true), p('cut'), h(2, 'New section'), p('keep')])), ['New section', 'keep']);
});

test('a section whose every block is Higher disappears, and so does a list item that was only a Higher sentence', () => {
  const blocks = [{ t: 'section', kind: 'ckw', blocks: [h(2, 'Check your knowledge: proof', true), q(1, 'proof')] }, { t: 'list', items: [[p('(Higher) prove it')], [p('keep me')]] }];
  const out = dropHigher(blocks);
  assert.equal(out.length, 1);
  assert.deepEqual(out[0].items.map((item) => texts(item)), [['keep me']]);
});

// ----- the question rule -----

test('a question with the chip in its text is Higher; one marked data-tier is Higher; the rest stay', () => {
  const blocks = [q(1, 'keep'), q(2, 'cut', true), q(3, 'also cut', false, { higher: true }), q(4, 'keep too')];
  assert.deepEqual(texts(dropHigher(blocks)), ['Q1', 'Q4']);
});

test('questions inside boxes and sections are found too, and a chip in a hint is not enough to remove the question', () => {
  const blocks = [{ t: 'section', blocks: [{ t: 'box', blocks: [q(1, 'cut', true), q(2, 'keep', false, { ladder: [[{ t: 'p', runs: [chip] }]] })] }] }];
  const kept = dropHigher(blocks)[0].blocks[0].blocks;
  assert.deepEqual(texts(kept), ['Q2']);
});

// ----- other places the label appears -----

test('a sentence that carries the chip, or the word Higher, is cut from its paragraph; the rest stays', () => {
  const runs = [{ t: 'This page is about right-angled triangles only. The sections marked ' }, chip, { t: ' are for the Higher tier. Last sentence.' }];
  assert.equal(runsToText(dropChipSentence(runs)).trim(), 'This page is about right-angled triangles only. Last sentence.');
  assert.equal(runsToText(dropChipSentence([{ t: 'Keep this. Higher tier: the next question. And this.' }])).trim(), 'Keep this. And this.');
  const [para] = dropHigher([{ t: 'p', runs: [{ t: 'Higher tier: only this.' }] }, p('kept')]);
  assert.equal(para.runs[0].t, 'kept');
});

test('words marked data-tier="H" inside a sentence are cut without losing the rest of the item', () => {
  const item = { t: 'p', runs: [{ t: 'work with zero and negative indices' }, { t: ', and (Higher) fractional indices', hi: true }] };
  const [out] = dropHigher([item]);
  assert.equal(runsToText(out.runs), 'work with zero and negative indices');
});

test('a Higher chip left in a heading is reported, one in a Higher-free page is not; a hint saying "higher" is not a label', () => {
  assert.equal(chipsLeft([h(2, 'x', true), p('fine'), { t: 'p', runs: [{ t: 'Higher tier' }] }]).length, 2);
  assert.equal(chipsLeft([p('fine'), q(1, 'the higher value', false, { ladder: [[p('Higher value minus lower value')]] })]).length, 0);
  assert.equal(chipsLeft(dropHigher([h(2, 'x', true), p('cut'), q(1, 'q', true)])).length, 0);
});

// ----- numbering -----

test('questions are numbered again from 1 in printed order, and the web number is kept', () => {
  const blocks = [q(1, 'a'), q(2, 'b', true), q(3, 'c'), { t: 'section', blocks: [q(4, 'd', true), q(5, 'e')] }];
  const kept = dropHigher(blocks);
  assert.equal(renumberQuestions(kept), 3);
  const numbered = [kept[0], kept[1], kept[2].blocks[0]];
  assert.deepEqual(numbered.map((x) => [x.n, x.webN]), [[1, 1], [2, 3], [3, 5]]);
});

// ----- chapters, glossary, front -----

const topic = (id, title, tier, needs = []) => ({ id, title, strand: 'n', tier, status: 'live', needs });
const PAPERS = [{ id: 'foundation', title: 'F paper' }, { id: 'stretch', title: 'H paper' }, { id: 'command-words', title: 'Words' }];

test('the Foundation book has the tier F topics, the foundation papers and the question words; the Higher book has every topic and the stretch papers', () => {
  const graph = buildGraph([topic('a', 'Ants', 'F'), topic('b', 'Bats', 'H', ['a']), topic('c', 'Cats', 'F', ['a'])]);
  const f = buildChapters(graph, papersForTier(PAPERS, 'foundation'), { tier: 'foundation' });
  assert.deepEqual(f.map((c) => [c.num, c.id]), [[1, 'a'], [2, 'c'], [3, 'foundation'], [4, 'command-words']]);
  const higher = buildChapters(graph, papersForTier(PAPERS, 'higher'), { tier: 'higher' });
  assert.deepEqual(higher.map((c) => [c.num, c.id]), [[1, 'a'], [2, 'b'], [3, 'c'], [4, 'stretch'], [5, 'command-words']]);
  assert.deepEqual(buildChapters(graph, papersForTier(PAPERS, null)).map((c) => c.id), ['a', 'b', 'c', 'foundation', 'stretch', 'command-words']);
});

test('the Foundation glossary leaves out the Higher-only entries', () => {
  const g = [{ id: 'a', level: 'F' }, { id: 'b', level: 'H' }];
  assert.deepEqual(glossaryForTier(g, 'foundation').map((x) => x.id), ['a']);
  assert.deepEqual(glossaryForTier(g, 'higher').map((x) => x.id), ['a', 'b']);
  assert.deepEqual(glossaryForTier(g, null).map((x) => x.id), ['a', 'b']);
});

test('the subtitle and the title property say which book it is; the whole book keeps "Foundation and Higher"', () => {
  const front = [{ t: 'section', kind: 'print-title', blocks: [h(1, 'GCSE Mathematics'), { t: 'p', cls: 'lead', runs: [{ t: 'Foundation and Higher' }] }, { t: 'p', cls: 'lead', runs: [{ t: 'Greg Wright' }] }] }];
  assert.deepEqual(texts(retitleFront(front, 'higher')[0].blocks), ['GCSE Mathematics', 'Higher', 'Greg Wright']);
  assert.deepEqual(texts(retitleFront(front, 'foundation')[0].blocks), ['GCSE Mathematics', 'Foundation', 'Greg Wright']);
  assert.equal(propertiesFor('foundation').title, 'GCSE Mathematics: Foundation');
  assert.equal(propertiesFor('higher').title, 'GCSE Mathematics: Higher');
  assert.equal(propertiesFor(null).title, 'GCSE Mathematics');
});

// ----- the command line -----

test('--tier chooses the file names, and the whole book is still the default', () => {
  assert.match(parseArgs([]).out, /dist[\\/]gcse-book\.docx$/);
  assert.match(parseArgs(['--tier', 'foundation']).out, /dist[\\/]gcse-foundation\.docx$/);
  assert.match(parseArgs(['--tier', 'higher']).out, /dist[\\/]gcse-higher\.docx$/);
  assert.match(parseArgs(['--tier', 'higher']).report, /print-report-higher\.json$/);
  assert.match(parseArgs(['--tier', 'higher', '--out', 'x.docx']).out, /x\.docx$/);
  assert.throws(() => parseArgs(['--tier', 'middle']), /--tier must be one of/);
});

// ----- the page estimate -----

test('the page estimate grows with words and figures and always has a total', () => {
  assert.equal(wordCount(['one two', ' three ']), 3);
  const small = estimatePages({ words: { front: 800, chapters: 4200, answers: 2600, hints: 1000, glossary: 3800 }, figureHeightIn: 19, chapterCount: 2, tocEntries: 20, indexEntries: 60 });
  const big = estimatePages({ words: { front: 800, chapters: 8400, answers: 2600, hints: 1000, glossary: 3800 }, figureHeightIn: 19, chapterCount: 2, tocEntries: 20, indexEntries: 60 });
  assert.equal(small.total, small.front + small.contents + small.chapters + small.answers + small.hints + small.glossary + small.index);
  assert.equal(big.chapters - small.chapters, 10);
  assert.equal(estimatePages({ words: { front: 0, chapters: 0, answers: 0, hints: 0, glossary: 0 } }).hints, 0);
});
