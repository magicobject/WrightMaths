import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { normalize, stem, searchIndex } from '../public/js/book-search.mjs?m=1';
import { extractHeadings, stripAnswerBlocks, buildSearchIndex } from '../scripts/book-search-lib.mjs';

const entries = [
  { t: 'Circle theorems', u: 'circle-theorems.html', k: 'Topic', s: 'Geometry', d: 'Angles in circles' },
  { t: 'Circles', u: 'circles.html', k: 'Topic', s: 'Geometry' },
  { t: 'Circle', u: 'glossary.html#circle', k: 'Term', s: 'Geometry', d: 'A round shape' },
  { t: 'Alternate segment theorem', u: 'circle-theorems.html#s-alt', k: 'Section', p: 'Circle theorems' },
  { t: 'Highest common factor', u: 'glossary.html#hcf', k: 'Term', s: 'Number', a: 'HCF greatest common divisor' },
  { t: 'Percentages', u: 'percentages.html', k: 'Topic', s: 'Ratio' },
  { t: 'Simultaneous equations', u: 'simultaneous-equations.html', k: 'Topic', s: 'Algebra' },
];
const first = (q) => searchIndex(q, entries, 8)[0]?.u;

test('normalize lowercases and drops punctuation', () => {
  assert.equal(normalize('  Circle  Theorems! '), 'circle theorems');
  assert.equal(normalize("Pythagoras'"), 'pythagoras');
});

test('stem folds simple plurals', () => {
  assert.equal(stem('theorems'), stem('theorem'));
  assert.equal(stem('boxes'), stem('box'));
  assert.equal(stem('series'), 'series');
});

test('an exact title match ranks first, ahead of longer titles and sections', () => {
  assert.equal(first('circle theorems'), 'circle-theorems.html');
  assert.equal(first('circles'), 'circles.html');
  assert.equal(first('circle'), 'glossary.html#circle');
});

test('plural and singular both find the page', () => {
  assert.equal(first('circle theorem'), 'circle-theorems.html');
  assert.equal(first('percentage'), 'percentages.html');
});

test('a prefix finds the page while typing', () => {
  assert.equal(first('simult'), 'simultaneous-equations.html');
  assert.equal(first('circle th'), 'circle-theorems.html');
});

test('a small typo still finds the page (longer words only)', () => {
  assert.equal(first('percentges'), 'percentages.html');
  assert.equal(first('simultanous equations'), 'simultaneous-equations.html');
  assert.deepEqual(searchIndex('cat', entries), []);
});

test('aliases find a term, and every word of the query must match', () => {
  assert.equal(first('hcf'), 'glossary.html#hcf');
  assert.equal(first('greatest common divisor'), 'glossary.html#hcf');
  assert.deepEqual(searchIndex('banana split', entries), []);
});

test('sections are found through their page name but rank below the page itself', () => {
  const urls = searchIndex('circle theorems', entries, 8).map((e) => e.u);
  assert.ok(urls.includes('circle-theorems.html#s-alt'));
  assert.ok(urls.indexOf('circle-theorems.html') < urls.indexOf('circle-theorems.html#s-alt'));
});

test('empty and whitespace queries return nothing, and the limit is respected', () => {
  assert.deepEqual(searchIndex('   ', entries), []);
  assert.equal(searchIndex('circle', entries, 2).length, 2);
});

test('extractHeadings returns h2 and h3 with ids and plain text, and skips ones without an id', () => {
  const html = '<h1>Title</h1><h2 id="a">Learn <span>it</span> &amp; more</h2><h3>No id</h3><h3 id="b">Deep</h3>';
  assert.deepEqual(extractHeadings(html), [{ id: 'a', text: 'Learn it & more', level: 2 }, { id: 'b', text: 'Deep', level: 3 }]);
});

test('extractHeadings drops the Higher chip and the leading section number', () => {
  const html = '<h2 id="a">3. Tangents <span class="chip chip-higher">Higher</span></h2>';
  assert.deepEqual(extractHeadings(html), [{ id: 'a', text: 'Tangents', level: 2 }]);
});

test('stripAnswerBlocks removes solutions, wrong-answer notes, hints and check lines, including nested tags', () => {
  const html = '<div class="q"><p>Q</p><ol class="ladder"><li>hint</li></ol><div class="solution"><div><h3 id="x">SECRET</h3></div></div><details class="check-line"><summary>Check</summary>ANS</details></div><h2 id="k">Keep</h2>';
  const out = stripAnswerBlocks(html);
  assert.ok(!/SECRET|hint|ANS/.test(out));
  assert.match(out, /Keep/);
});

test('buildSearchIndex makes page, section and term entries and never answers', () => {
  const pages = [{ href: 'fractions.html', title: 'Fractions', kind: 'Topic', sub: 'Number', snippet: 'Parts of a whole', html: '<h2 id="s-adding">Adding fractions</h2><div class="solution"><h3 id="z">LEAK</h3></div>' }];
  const glossary = [{ id: 'numerator', term: 'Numerator', strand: 'n', def: 'The top number of a fraction.', aka: ['top number'] }];
  const index = buildSearchIndex({ pages, glossary, strands: { n: { short: 'Number' } }, glossaryHref: 'glossary.html' });
  assert.deepEqual(index.map((e) => e.u), ['fractions.html', 'fractions.html#s-adding', 'glossary.html#numerator']);
  assert.deepEqual(index[1], { t: 'Adding fractions', u: 'fractions.html#s-adding', k: 'Section', p: 'Fractions' });
  assert.equal(index[2].a, 'top number');
  assert.ok(!JSON.stringify(index).includes('LEAK'));
});

test('headings repeated on many pages are left out so "Check your knowledge" does not drown the results', () => {
  const pages = Array.from({ length: 8 }, (_, i) => ({ href: `p${i}.html`, title: `P${i}`, kind: 'Topic', sub: 'Number', html: `<h2 id="c">Check your knowledge</h2><h2 id="u">Unique ${i}</h2>` }));
  const index = buildSearchIndex({ pages, glossary: [], strands: {}, glossaryHref: 'g.html' });
  assert.ok(!index.some((e) => e.t === 'Check your knowledge'));
  assert.equal(index.filter((e) => e.k === 'Section').length, 8);
});

test('the built index (when built) is small, relative to the book, and finds the key things', () => {
  const file = new URL('../public/books/gcse/search-index.json', import.meta.url);
  if (!existsSync(file)) return; // npm run build creates it
  const raw = readFileSync(file, 'utf8');
  assert.ok(raw.length < 150_000, `index is ${raw.length} bytes`);
  const index = JSON.parse(raw);
  for (const e of index) assert.ok(!/^(https?:|\/\/)/.test(e.u), e.u);
  assert.equal(searchIndex('circle theorems', index, 8)[0].u, 'circle-theorems.html');
  assert.ok(searchIndex('hcf', index, 8).some((e) => e.k === 'Term'));
  assert.ok(!index.some((e) => e.u.startsWith('key/')), 'answer keys are not searchable');
});

// ---- round 2: fixes from the tester and UX reviews ----
const more = [
  ...entries,
  { t: 'Triangles', u: 'triangles.html', k: 'Topic', s: 'Geometry' },
  { t: 'Fractions', u: 'fractions.html', k: 'Topic', s: 'Number' },
  { t: 'Trigonometry', u: 'trigonometry.html', k: 'Topic', s: 'Geometry', a: 'sohcahtoa soh cah toa' },
  { t: 'Rationalising the denominator', u: 'glossary.html#rationalising', k: 'Term', s: 'Number' },
  { t: 'Power (index)', u: 'glossary.html#power', k: 'Term', s: 'Number', a: 'exponent' },
  { t: 'Exponential growth', u: 'exponential.html', k: 'Topic', s: 'Ratio' },
  { t: 'Elevation', u: 'glossary.html#elevation', k: 'Term', s: 'Geometry' },
  { t: 'VAT', u: 'glossary.html#vat', k: 'Term', s: 'Ratio' },
  { t: 'Find Your Gaps', u: 'diagnostic.html', k: 'Page', s: 'Book', a: 'quiz test gaps where to start' },
  { t: 'Angles in a triangle add up to 180', u: 'shapes-angles.html#s-tri', k: 'Section', p: 'Shapes and angles' },
  { t: 'Shapes and angles', u: 'shapes-angles.html', k: 'Topic', s: 'Geometry', a: 'angle sum' },
  { t: 'Pi (\u03c0)', u: 'glossary.html#pi', k: 'Term', s: 'Number', a: 'pi' },
];
const firstMore = (q) => searchIndex(q, more, 8)[0]?.u;

test('transposed letters count as one typo', () => {
  assert.equal(firstMore('circel theorem'), 'circle-theorems.html');
  assert.equal(firstMore('cirlce'), 'circles.html');
  assert.equal(firstMore('triangel'), 'triangles.html');
  assert.equal(firstMore('fractoin'), 'fractions.html');
});

test('other names and word endings: sohcahtoa, rationalise', () => {
  assert.equal(firstMore('sohcahtoa'), 'trigonometry.html');
  assert.equal(firstMore('soh cah toa'), 'trigonometry.html');
  assert.equal(firstMore('rationalise'), 'glossary.html#rationalising');
});

test('little words are ignored, and if not every word matches, entries matching some words are offered', () => {
  assert.equal(firstMore('where do I start'), 'diagnostic.html');
  assert.equal(firstMore('angle sum'), 'shapes-angles.html');
  assert.ok(searchIndex('angles in a triangle', more, 8).some((e) => e.u === 'shapes-angles.html#s-tri'));
  assert.deepEqual(searchIndex('the', more), []);
});

test('whole words beat mid-word matches, and short fragments never match mid-word', () => {
  assert.deepEqual(searchIndex('vat', more).map((e) => e.t), ['VAT']);
  assert.equal(firstMore('exponent'), 'glossary.html#power');
});

test('Greek letters can be searched', () => {
  assert.equal(firstMore('\u03c0'), 'glossary.html#pi');
});

test('typo matching does not make short words match everything', () => {
  assert.deepEqual(searchIndex('cube', more), []);
});

test('the built index has no HTML entities, no one-letter headings, no meta sections, and no "past papers"', () => {
  const file = new URL('../public/books/gcse/search-index.json', import.meta.url);
  if (!existsSync(file)) return;
  const index = JSON.parse(readFileSync(file, 'utf8'));
  for (const e of index) {
    assert.ok(!/&[a-z#0-9]+;/i.test(JSON.stringify(e)), e.t);
    assert.ok(e.k !== 'Section' || e.t.length > 1, e.t);
    assert.ok(!/past papers?/i.test(e.a ?? ''), e.t);
  }
  assert.ok(!index.some((e) => /private by design/i.test(e.t)));
  assert.ok(!index.some((e) => e.u.startsWith('parents.html#')), 'the parents page itself is indexed, not its sections');
  assert.equal(searchIndex('pi', index, 3)[0].t, 'Pi (\u03c0)');
  assert.ok(searchIndex('gcd', index, 3).some((e) => e.u === 'glossary.html#hcf'));
  assert.equal(searchIndex('sohcahtoa', index, 3)[0].u, 'trigonometry.html');
  assert.equal(searchIndex('where do i start', index, 3)[0].u, 'diagnostic.html');
  assert.equal(searchIndex('exponent', index, 3)[0].u, 'glossary.html#power');
  assert.equal(searchIndex('rationalise', index, 3)[0].u, 'glossary.html#rationalising');
});
