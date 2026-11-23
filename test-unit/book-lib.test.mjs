import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph, renderFraction, expandInline, addQuestionIds, countQuestions } from '../scripts/book-lib.mjs';
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
  assert.match(out, /<a class="term" href="glossary.html#hcf" data-def="The &quot;biggest&quot; shared factor.">Highest common factor<\/a>/);
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
