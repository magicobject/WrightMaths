import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph, renderFraction, expandInline, addQuestionIds, countQuestions, buildAutoPatterns, autoLinkQuestionTerms, renderGlossaryPage } from '../scripts/book-lib.mjs';
import { TOPICS } from '../src/book/topics.mjs';
import { GLOSSARY } from '../src/book/glossary.mjs';

const topic = (id, needs = [], status = 'planned') => ({ id, title: id, strand: 'n', tier: 'F', status, needs });

test('buildGraph derives layers and unlocks from needs', () => {
  const g = buildGraph([topic('a'), topic('b', ['a']), topic('c', ['a', 'b'])]);
  assert.equal(g.get('a').layer, 0);
  assert.equal(g.get('b').layer, 1);
  assert.equal(g.get('c').layer, 2);
  assert.deepEqual(g.get('a').unlocks, ['b', 'c']);
});

test('buildGraph rejects unknown prerequisites, cycles and duplicates', () => {
  assert.throws(() => buildGraph([topic('a', ['zzz'])]), /unknown topic "zzz"/);
  assert.throws(() => buildGraph([topic('a', ['b']), topic('b', ['a'])]), /cycle/);
  assert.throws(() => buildGraph([topic('a'), topic('a')]), /duplicate/);
  assert.throws(() => buildGraph([topic('a', ['a'])]), /needs itself/);
});

test('buildGraph checks live topics have pages and planned ones do not', () => {
  assert.throws(() => buildGraph([topic('a', [], 'live')], { hasPage: () => false }), /no page/);
  assert.throws(() => buildGraph([topic('a', [], 'planned')], { hasPage: () => true }), /marked planned/);
  assert.doesNotThrow(() => buildGraph([topic('a', [], 'live')], { hasPage: () => true }));
});

test('the real topic list is a valid graph with a base layer', () => {
  const g = buildGraph(TOPICS.map((t) => ({ ...t, strandName: 'x' })));
  assert.ok([...g.values()].some((t) => t.layer === 0));
  for (const t of g.values()) {
    for (const need of t.needs) assert.ok(g.get(need).layer < t.layer, `${t.id} sits above ${need}`);
  }
});

test('renderFraction builds a stacked fraction and handles markup in the parts', () => {
  assert.match(renderFraction('3/4'), /<span class="fn">3<\/span>.*<span class="fd">4<\/span>/);
  const nested = renderFraction('1/a<sup>n</sup>');
  assert.match(nested, /<span class="fn">1<\/span>/);
  assert.match(nested, /<span class="fd">a<sup>n<\/sup><\/span>/);
  assert.match(renderFraction('x + 1/3'), /<span class="fn">x \+ 1<\/span>/);
  assert.throws(() => renderFraction('nonsense'), /bad fraction/);
});

test('expandInline links terms and records where they are used', () => {
  const glossaryById = new Map([['hcf', { id: 'hcf', term: 'Highest common factor', def: 'The "biggest" shared factor.' }]]);
  const usage = new Map();
  const out = expandInline('The {term:hcf} of {frac:12/18} and {term:hcf|HCF}.', { glossaryById, usage, page: 'fractions' });
  assert.match(out, /<a class="term" href="glossary.html#hcf" data-term="hcf" data-def="The &quot;biggest&quot; shared factor.">Highest common factor<\/a>/);
  assert.match(out, />HCF<\/a>/);
  assert.deepEqual([...usage.get('hcf')], ['fractions']);
});

test('expandInline fails loudly on an unknown term', () => {
  assert.throws(
    () => expandInline('{term:nope}', { glossaryById: new Map(), page: 'x' }),
    /unknown glossary term "nope"/,
  );
});

test('addQuestionIds numbers questions in order and countQuestions agrees', () => {
  const html = '<div class="q" data-answers="1"></div><div class="q" data-type="mc"></div><div class="quiet"></div>';
  const out = addQuestionIds(html, 'fractions');
  assert.match(out, /<div class="q" data-qid="fractions-1" data-answers="1">/);
  assert.match(out, /<div class="q" data-qid="fractions-2" data-type="mc">/);
  assert.equal(countQuestions(html), 2);
});

test('glossary: ids are unique, lowercase-hyphenated, and every "see" points at a real term', () => {
  const ids = GLOSSARY.map((g) => g.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate glossary id');
  for (const g of GLOSSARY) {
    assert.match(g.id, /^[a-z0-9-]+$/, g.id);
    assert.ok(g.def && g.def.length > 15, `${g.id} needs a real definition`);
    assert.ok(g.example, `${g.id} needs an example`);
    assert.ok(['n', 'a', 'r', 'g', 'p', 's'].includes(g.strand), `${g.id} has a bad strand`);
    assert.ok(['F', 'H'].includes(g.level), `${g.id} has a bad level`);
    for (const s of g.see ?? []) assert.ok(ids.includes(s), `${g.id} sees unknown "${s}"`);
    assert.doesNotMatch(g.def, /[{}]/, `${g.id}: the pop-up definition must be plain text`);
  }
});

test('autoLinkQuestionTerms links the first use of a term in the question text only, and leaves tags and entities alone', () => {
  const patterns = buildAutoPatterns([
    { id: 'interior-angle', term: 'Interior angle' },
    { id: 'hcf', term: 'Highest common factor (HCF)' },
    { id: 'work-out', term: 'Work out' },
  ]);
  const html = '<p class="qtext">Work out the <b>interior angle</b> of a pentagon. Is each interior angle 108&deg;? Find the HCF.</p><p>An interior angle elsewhere.</p>';
  const out = autoLinkQuestionTerms(html, patterns);
  assert.equal((out.match(/\{term:interior-angle\|/g) ?? []).length, 1);
  assert.match(out, /\{term:hcf\|HCF\}/);
  assert.doesNotMatch(out, /work-out/); // question words are never auto-linked
  assert.match(out, /<p>An interior angle elsewhere\.<\/p>/); // only the question text is touched
  assert.match(out, /108&deg;/);
});

test('every term picture belongs to a real glossary term', async () => {
  const { TERM_FIGURES } = await import('../src/book/term-figures.mjs');
  const ids = new Set(GLOSSARY.map((g) => g.id));
  for (const id of Object.keys(TERM_FIGURES)) assert.ok(ids.has(id), `${id} has a picture but is not in the glossary`);
  for (const svg of Object.values(TERM_FIGURES)) assert.match(svg, /role="img" aria-label="[^"]+"/);
});

test('answer keys: plainText and extractKey read a question page', async () => {
  const { plainText, extractKey } = await import('../scripts/book-lib.mjs');
  assert.equal(plainText('Work out {frac:3/4} of 20 &times; &pound;5'), 'Work out 3/4 of 20 × £5');
  assert.equal(plainText('{frac:x + 1/2}'), '(x + 1)/2');
  const raw = '<div class="q" data-answers="15;15.0" data-marks="2"><p class="qtext">[2 marks] Work out 3 &times; 5.</p><div class="solution"><p>3 &times; 5 = 15.</p><ul class="markscheme"><li><b>M1</b> multiply</li><li><b>A1</b> 15</li></ul></div></div>'
    + '<div class="q" data-type="mc"><p class="qtext">Pick.</p><ul class="options"><li data-correct>Right one</li><li data-why="no">Wrong</li></ul><div class="solution"><p>Because.</p></div></div>'
    + '<div class="q" data-type="show" data-marks="1"><p class="qtext">Show that.</p><div class="solution"><p>w</p><ul class="markscheme"><li><b>C1</b> done</li></ul></div></div>';
  const k = extractKey(raw);
  assert.equal(k.length, 3);
  assert.deepEqual([k[0].answer, k[0].also, k[0].marks, k[0].scheme.length], ['15', ['15.0'], 2, 2]);
  assert.equal(k[1].answer, 'Right one');
  assert.match(k[2].answer, /mark scheme/);
});

test('glossary entries link the technical terms they use, once each and never to themselves', () => {
  const strands = Object.fromEntries(['n', 'a', 'r', 'g', 'p', 's'].map((k) => [k, { short: k }]));
  const { groups } = renderGlossaryPage(GLOSSARY, new Map(), new Map(), strands, {}, buildAutoPatterns(GLOSSARY));
  const entry = (id) => groups.split('<article ').find((a) => a.startsWith(`class="g-entry`) && a.includes(`id="${id}"`)) ?? '';
  // Rationalising mentions a surd, so it must link to Surd.
  assert.match(entry('rationalising'), /\{term:surd\|surd\}/);
  for (const g of GLOSSARY) {
    const body = entry(g.id);
    const ids = [...body.matchAll(/\{term:([a-z0-9-]+)/g)].map((m) => m[1]);
    assert.ok(!ids.includes(g.id), `${g.id} links to itself`);
  }
});

test('a bare "side", "solution" or "variable" is never linked automatically (only "opposite side" / "adjacent side" style names are)', () => {
  const patterns = buildAutoPatterns(GLOSSARY);
  const linksTo = (text) => patterns.filter((p) => p.re.test(text)).map((p) => p.id);
  for (const word of ['Which side is the hypotenuse?', 'Find the solution.', 'a variable', 'the sides of the triangle']) {
    assert.deepEqual(linksTo(word).filter((id) => ['opposite', 'adjacent', 'root-of-equation', 'unknown'].includes(id)), [], word);
  }
  // the qualifiers in brackets ("of a circle", "the trig ratio") are not names either
  assert.deepEqual(linksTo('the area of a circle').filter((id) => id === 'segment'), []);
});
