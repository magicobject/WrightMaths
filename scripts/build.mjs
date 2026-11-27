#!/usr/bin/env node
// Assembles public/*.html from templates/ + src/pages/*.html + src/pages.config.mjs.
// Run `npm run build` after editing anything in templates/ or src/, and commit the
// regenerated public/*.html — Cloudflare serves that directory as-is.
//
// The GCSE book (public/books/gcse/) is built here too, from
// src/book/topics.mjs (topic graph) and src/book/glossary.mjs (terms); see
// docs/book-authoring.md.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NAV, PAGES } from '../src/pages.config.mjs';
import { STRANDS, TOPICS } from '../src/book/topics.mjs';
import { GLOSSARY } from '../src/book/glossary.mjs';
import { SPEC_REFS, SPEC_STATEMENTS } from '../src/book/spec-refs.mjs';
import { ROUTES, EXTRA, nextInRoute } from '../src/book/route.mjs';
import { TERM_FIGURES, figuresFor } from '../src/book/term-figures.mjs';
import {
  buildGraph, expandInline, addQuestionIds, countQuestions,
  renderPrereqs, renderUnlocks, renderPyramid, renderGlossaryPage, renderWords, renderPracticeTopics,
  buildAutoPatterns, autoLinkQuestionTerms,
  renderAnswerKey,
  extractKey, plainText, addHeadingIds,
} from './book-lib.mjs';
import { buildSearchIndex, renderSearchBox } from './book-search-lib.mjs';
import { loadShell, renderShell } from './page-shell.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const shell = loadShell(root);

// ---------- the GCSE book ----------

const topics = TOPICS.map((t) => ({ ...t, strandName: STRANDS[t.strand].short }));
const graph = buildGraph(topics, {
  hasPage: (id) => existsSync(join(root, `src/pages/books/gcse/${id}.html`)),
});
const glossaryById = new Map(GLOSSARY.map((g) => [g.id, g]));
if (glossaryById.size !== GLOSSARY.length) throw new Error('glossary: duplicate term id');
for (const g of GLOSSARY) {
  for (const s of g.see ?? []) {
    if (!glossaryById.has(s)) throw new Error(`glossary: "${g.id}" sees unknown term "${s}"`);
  }
}

const liveTopics = [...graph.values()].filter((t) => t.status === 'live');
const autoPatterns = buildAutoPatterns(GLOSSARY);
for (const id of Object.keys(TERM_FIGURES)) {
  if (!glossaryById.has(id)) throw new Error(`term-figures: "${id}" is not a glossary term`);
}
const usage = new Map(); // term id -> Set of topic ids that use it

const questionCounts = new Map(
  liveTopics.map((t) => [t.id, countQuestions(read(`src/pages/books/gcse/${t.id}.html`))]),
);

function renderBookContent(page, raw) {
  const topic = page.bookTopic ? graph.get(page.bookTopic) : null;
  let html = raw;
  if (topic) html = addQuestionIds(html, topic.id);
  html = html
    .replaceAll('{prereqs}', () => (topic ? renderPrereqs(topic.id, graph) : ''))
    .replaceAll('{unlocks}', () => (topic ? renderUnlocks(topic.id, graph) : ''))
    .replaceAll('{pyramid}', () => renderPyramid(graph))
    .replaceAll('{words}', () => (topic ? renderWords(topic.id, graph, glossaryById) : ''))
    .replaceAll('{practice-topics}', () => renderPracticeTopics(graph))
    .replaceAll('{teacher-table}', () => renderTeacherTable())
    .replaceAll('{spec-key}', () => renderSpecKey())
    .replaceAll('{routes}', () => renderRoutes())
    .replace(/\{qcount:([a-z0-9-]+)\}/g, (_, id) => {
      if (!questionCounts.has(id)) throw new Error(`qcount: "${id}" is not a live topic`);
      return String(questionCounts.get(id));
    });
  html = addHeadingIds(html);
  if (topic) html = html.replace(/<\/main>\s*$/, () => `${renderNextUp(topic.id)}</main>`);
  if (topic || ['practice', 'commands', 'diagnostic'].includes(page.book)) html = autoLinkQuestionTerms(html, autoPatterns);
  html = expandInline(html, { glossaryById, usage: topic ? usage : undefined, page: topic?.id ?? page.slug });
  // Anything still in braces that looks like shorthand is a typo: fail loudly.
  // Hidden pictures for the hover pop-ups of the terms used on this page.
  const usedTerms = [...html.matchAll(/data-term="([a-z0-9-]+)"/g)].map((m) => m[1]);
  const figs = figuresFor(usedTerms);
  if (figs.length) html += `\n<div hidden data-term-figures>${figs.map(([id, svg]) => `<figure data-term-figure="${id}">${svg}</figure>`).join('')}</div>`;
  const leftover = html.match(/\{(frac|term|qcount|prereqs|unlocks|pyramid|words|practice-topics)[:}]/);
  if (leftover) throw new Error(`${page.slug}: unexpanded shorthand ${leftover[0]}`);
  return html;
}

// Topic pages come from the graph, so their title/description are never written twice.
const bookTopicPages = liveTopics.map((t) => ({
  slug: `books/gcse/${t.id}`,
  bookTopic: t.id,
  title: `${t.title} | GCSE Maths Book | Wright Maths Tuition`,
  description: `GCSE maths: ${t.title}. Explanations, worked examples and check-your-knowledge questions with help when you are stuck.`,
}));

// Teacher answer keys: one printable page per live topic, generated from the same source as the questions.
const PAPERS = [
  { id: 'foundation', title: 'Practice papers, grades 4 to 6' },
  { id: 'stretch', title: 'Grade 7 to 9 stretch papers' },
];
const keyPages = [...liveTopics, ...PAPERS].map((t) => ({
  slug: `books/gcse/key/${t.id}`,
  book: 'key',
  keyTopic: t.id,
  base: '../../../',
  robots: 'noindex, nofollow', // the answers stay out of search results
  title: `${t.title}: teacher answer key | GCSE Maths Book | Wright Maths Tuition`,
  description: `Answers and mark schemes for every question on the ${t.title} page.`,
}));

function renderTeacherTable() {
  const rows = [...liveTopics].sort((a, b) => a.layer - b.layer || a.title.localeCompare(b.title)).map((t) => {
    const items = extractKey(read(`src/pages/books/gcse/${t.id}.html`));
    const marked = items.filter((r) => r.marks).length;
    const marks = items.reduce((n, r) => n + r.marks, 0);
    const refs = (SPEC_REFS[t.id] ?? []).join(', ') || '–';
    return `<tr><th scope="row"><a href="${t.id}.html">${t.title}</a></th><td>${t.tier === 'H' ? 'Higher' : 'Foundation and Higher'}</td><td>${t.strandName}</td><td>${items.length}</td><td>${marked} (${marks} marks)</td><td>${Math.max(1, Math.ceil(items.length / 12))}</td><td>${refs}</td><td><a href="key/${t.id}.html">Answer key</a></td></tr>`;
  });
  for (const p of PAPERS) {
    const items = extractKey(read(`src/pages/books/gcse/${p.id}.html`));
    const marked = items.filter((r) => r.marks).length;
    const marks = items.reduce((n, r) => n + r.marks, 0);
    rows.push(`<tr><th scope="row"><a href="${p.id}.html">${p.title}</a></th><td>${p.id === 'stretch' ? 'Higher' : 'Foundation and Higher'}</td><td>Mixed</td><td>${items.length}</td><td>${marked} (${marks} marks)</td><td>${Math.max(1, Math.ceil(marks / 20))}</td><td>\u2013</td><td><a href="key/${p.id}.html">Answer key</a></td></tr>`);
  }
  return `<div class="qtable-wide" tabindex="0" role="region" aria-label="Topics table (scroll sideways if it does not fit)"><table class="key-table"><caption>Every topic, with its answer key</caption><thead><tr><th scope="col">Topic</th><th scope="col">Tier</th><th scope="col">Strand</th><th scope="col">Questions</th><th scope="col">Marked questions</th><th scope="col">About (20-minute sessions)</th><th scope="col">Curriculum statements (DfE)</th><th scope="col">Key</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

function renderSpecKey() {
  const order = (c) => `${'NARGPS'.indexOf(c[0])}${String(Number(c.slice(1))).padStart(3, '0')}`;
  const items = Object.keys(SPEC_STATEMENTS).sort((a, b) => order(a).localeCompare(order(b))).map((c) => `<li><b>${c}</b> ${SPEC_STATEMENTS[c]}</li>`);
  return `<details class="spec-key"><summary>What the codes mean (short paraphrases)</summary><ul>${items.join('')}</ul></details>`;
}

function renderRoutes() {
  const link = (id) => {
    if (id.startsWith('@')) return `<a href="${EXTRA[id].href}">${EXTRA[id].title}</a>`;
    const t = graph.get(id);
    if (!t || t.status !== 'live') throw new Error(`route: "${id}" is not a live topic`);
    return `<a href="${id}.html">${t.title}</a>${t.tier === 'H' ? ' <span class="tier-tag">Higher</span>' : ''}`;
  };
  return ROUTES.map((r) => `<section class="route" id="route-${r.id}"><h2>${r.title}</h2><p>${r.blurb}</p><ol class="route-weeks">${r.weeks.map((w, i) => `<li><b>Week ${i + 1}:</b> ${w.map(link).join(', ')}</li>`).join('')}</ol></section>`).join('\n');
}

function renderNextUp(topicId) {
  const next = nextInRoute(topicId);
  if (!next) return '';
  const t = graph.get(next);
  if (!t || t.status !== 'live') return '';
  return `<section class="next-up"><div class="wrap narrow"><h2 id="s-what-next">What next?</h2><p>Next in the 12-week route: <a class="btn btn-gold" href="${next}.html">${t.title}</a> <a href="route.html">See all the routes</a></p></div></section>`;
}

// Pages that go into the book's search index (answer keys never do: they are all answers).
const searchPages = [];
function searchPageFor(page, html) {
  const topic = page.bookTopic ? graph.get(page.bookTopic) : null;
  return {
    href: `${page.slug.replace('books/gcse/', '')}.html`,
    title: plainText(page.title.split(' | ')[0]),
    kind: topic ? 'Topic' : 'Page',
    sub: topic ? topic.strandName : 'Book',
    snippet: topic ? topic.flip : page.description,
    sections: page.searchSections,
    aliases: [page.searchWords, topic?.aka, ...(topic?.words ?? []).map((id) => glossaryById.get(id)?.term)].filter(Boolean).join(' '),
    html,
  };
}

const bookPageDefaults = {
  base: '../../',
  active: null,
  extraCss: ['css/book.css'],
  extraBootScripts: ['js/book-boot.js'],
  extraModuleScripts: ['js/book.mjs', 'js/book-search-ui.mjs'],
};

// Hub, glossary and grade-guide pages are listed in PAGES (flagged with `book`);
// topic pages come from the graph above.
const allPages = [...PAGES, ...bookTopicPages, ...keyPages];

// Glossary last: it needs the term usage collected from every other book page.
const ordered = [
  ...allPages.filter((p) => p.book !== 'glossary'),
  ...allPages.filter((p) => p.book === 'glossary'),
];

for (const page of ordered) {
  const isBook = Boolean(page.book || page.bookTopic);
  const merged = isBook ? { ...bookPageDefaults, ...page } : page;
  let content = merged.keyTopic
    ? renderAnswerKey(graph.get(merged.keyTopic) ?? PAPERS.find((p) => p.id === merged.keyTopic), read(`src/pages/books/gcse/${merged.keyTopic}.html`))
    : read(`src/pages/${merged.slug}.html`).trimEnd();
  if (isBook && !merged.keyTopic) {
    content = renderBookContent(merged, content);
    if (merged.book === 'glossary') {
      const { jump, groups, count } = renderGlossaryPage(GLOSSARY, usage, graph, STRANDS, TERM_FIGURES, autoPatterns);
      content = content
        .replace('{glossary-jump}', () => jump)
        .replace('{glossary-entries}', () => expandInline(groups, { glossaryById, page: 'glossary' }))
        .replaceAll('{glossary-count}', () => String(count));
      if (/\{glossary-/.test(content)) throw new Error('glossary page: unexpanded glossary token');
    }
  }

  if (isBook && !merged.keyTopic) searchPages.push(searchPageFor(merged, content));

  const html = renderShell({ shell, nav: NAV, merged, content, isBook, searchBox: isBook ? renderSearchBox(merged.base ?? '') : '' });

  const outFile = join(root, 'public', `${merged.slug}.html`);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html);
  console.log(`built public/${merged.slug}.html`);
}

// The book's own search index: titles, headings, glossary words and short descriptions only (see docs/book-authoring.md).
const searchIndex = buildSearchIndex({ pages: searchPages, glossary: GLOSSARY, strands: STRANDS, glossaryHref: 'glossary.html' });
writeFileSync(join(root, 'public/books/gcse/search-index.json'), JSON.stringify(searchIndex));
console.log(`built public/books/gcse/search-index.json (${searchIndex.length} entries)`);

// The A-level book is built from its own script (it shares the helpers above).
await import('./build-alevel.mjs');
