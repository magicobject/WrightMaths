#!/usr/bin/env node
// Builds the hidden A-level book (public/books/a-level/) from src/book/alevel/ (topic graph, glossary, pages)
// and src/pages/books/a-level/*.html. scripts/build.mjs runs this at the end, so `npm run build` and the
// pre-commit hook build both books; it can also be run on its own.
//
// It shares the page shell (scripts/page-shell.mjs) and the helpers (scripts/book-lib.mjs, book-math.mjs) with
// the GCSE book. Differences by design: no voice output at all, ten strands instead of six, Year 1 / Year 2
// instead of Foundation / Higher, and maths written as native MathML ({m:...}).

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { NAV } from '../src/pages.config.mjs';
import { STRANDS, TOPICS } from '../src/book/alevel/topics.mjs';
import { GLOSSARY } from '../src/book/alevel/glossary.mjs';
import { TERM_FIGURES } from '../src/book/alevel/term-figures.mjs';
import { ALEVEL_PAGES, alevelTopicTitle, alevelTopicDescription, alevelKeyTitle } from '../src/book/alevel/pages.mjs';
import { figuresFor } from '../src/book/term-figures.mjs';
import {
  buildGraph, expandInline, addQuestionIds, countQuestions,
  renderPrereqs, renderUnlocks, renderPyramid, renderGlossaryPage, renderWords,
  buildAutoPatterns, autoLinkQuestionTerms, NEVER_AUTO,
  renderAnswerKey, plainText, addHeadingIds,
} from './book-lib.mjs';
import { buildSearchIndex, renderSearchBox } from './book-search-lib.mjs';
import { loadShell, renderShell } from './page-shell.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const BOOK = 'a-level';

// Figures: src/book/alevel/figures/<topic-id>.mjs each export FIGURES = { '<topic-id>-<name>': () => '<svg ...>' }.
// A page writes {fig:topic-id-name}; the build draws it. An unknown id, or an id that does not start with its file's
// name, fails the build.
const FIGURES = {};
for (const file of readdirSync(join(root, 'src/book/alevel/figures')).filter((f) => f.endsWith('.mjs')).sort()) {
  const owner = file.replace(/\.mjs$/, '');
  const mod = await import(pathToFileURL(join(root, 'src/book/alevel/figures', file)).href);
  for (const [id, draw] of Object.entries(mod.FIGURES ?? {})) {
    if (!id.startsWith(`${owner}-`)) throw new Error(`figures/${file}: "${id}" must start with "${owner}-"`);
    if (FIGURES[id]) throw new Error(`figures: duplicate id "${id}"`);
    FIGURES[id] = draw;
  }
}
const expandFigures = (html, where) => html.replace(/\{fig:([a-z0-9-]+)\}/g, (_, id) => {
  if (!FIGURES[id]) throw new Error(`${where}: unknown figure "${id}"`);
  return FIGURES[id]();
});
const SRC = `src/pages/books/${BOOK}`;
const shell = loadShell(root);

const topics = TOPICS.map((t) => ({ ...t, strandName: STRANDS[t.strand].short }));
const graph = buildGraph(topics, { hasPage: (id) => existsSync(join(root, `${SRC}/${id}.html`)) });

const glossaryById = new Map(GLOSSARY.map((g) => [g.id, g]));
if (glossaryById.size !== GLOSSARY.length) throw new Error('a-level glossary: duplicate term id');
for (const g of GLOSSARY) {
  if (!STRANDS[g.strand]) throw new Error(`a-level glossary: "${g.id}" has unknown strand "${g.strand}"`);
  if (g.level !== 'Y1' && g.level !== 'Y2') throw new Error(`a-level glossary: "${g.id}" needs level 'Y1' or 'Y2'`);
  for (const s of g.see ?? []) {
    if (!glossaryById.has(s)) throw new Error(`a-level glossary: "${g.id}" sees unknown term "${s}"`);
  }
}
for (const id of Object.keys(TERM_FIGURES)) {
  if (!glossaryById.has(id)) throw new Error(`a-level term-figures: "${id}" is not a glossary term`);
}

const liveTopics = [...graph.values()].filter((t) => t.status === 'live');
// Words that are everywhere in A-level questions or too general to be worth a pop-up on every use.
const NEVER_AUTO_ALEVEL = new Set([...NEVER_AUTO, 'function', 'equation', 'solve', 'expression', 'graph', 'gradient-word']);
const autoPatterns = buildAutoPatterns(GLOSSARY, NEVER_AUTO_ALEVEL);
const usage = new Map();
const questionCounts = new Map(liveTopics.map((t) => [t.id, countQuestions(read(`${SRC}/${t.id}.html`))]));

const levelChip = (g) => (g.level === 'Y2' ? '<span class="chip chip-year2">Year 2</span>' : '<span class="chip chip-year">Year 1</span>');

function renderBookContent(page, raw) {
  const topic = page.bookTopic ? graph.get(page.bookTopic) : null;
  let html = raw;
  if (topic) html = addQuestionIds(html, topic.id);
  html = html
    .replaceAll('{prereqs}', () => (topic ? renderPrereqs(topic.id, graph) : ''))
    .replaceAll('{unlocks}', () => (topic ? renderUnlocks(topic.id, graph) : ''))
    .replaceAll('{pyramid}', () => renderPyramid(graph))
    .replaceAll('{words}', () => (topic ? renderWords(topic.id, graph, glossaryById) : ''))
    .replaceAll('{year1-list}', () => renderYearList(1))
    .replaceAll('{year2-list}', () => renderYearList(2))
    .replace(/\{qcount:([a-z0-9-]+)\}/g, (_, id) => {
      if (!questionCounts.has(id)) throw new Error(`qcount: "${id}" is not a live topic`);
      return String(questionCounts.get(id));
    });
  // {m:...} inside an attribute (data-why, data-answers, title ...) would put MathML and quotes inside the quotes and silently break the page.
  const inAttribute = html.match(/[\w-]+="[^"]*\{md?:[^"]*"/);
  if (inAttribute) throw new Error(`${page.slug}: maths shorthand inside an attribute (use plain text and entities there): ${inAttribute[0].slice(0, 80)}`);
  html = expandFigures(html, page.slug);
  html = addHeadingIds(html);
  if (topic) html = autoLinkQuestionTerms(html, autoPatterns);
  html = expandInline(html, { glossaryById, usage: topic ? usage : undefined, page: topic?.id ?? page.slug });
  const usedTerms = [...html.matchAll(/data-term="([a-z0-9-]+)"/g)].map((m) => m[1]);
  const figs = figuresFor(usedTerms, TERM_FIGURES);
  if (figs.length) html += `\n<div hidden data-term-figures>${figs.map(([id, svg]) => `<figure data-term-figure="${id}">${svg}</figure>`).join('')}</div>`;
  const leftover = html.match(/\{(frac|term|qcount|prereqs|unlocks|pyramid|words|year1-list|year2-list|m|md|fig)[:}]/);
  if (leftover) throw new Error(`${page.slug}: unexpanded shorthand ${leftover[0]}`);
  return html;
}

// A plain list of topics for one year, for the hub (it works without the pyramid and without JavaScript).
function renderYearList(year) {
  const items = [...graph.values()].filter((t) => t.year === year).map((t) => {
    const chip = `<span class="chip chip-${t.strand}">${t.strandName}</span>`;
    return t.status === 'live'
      ? `<li><a href="${t.id}.html">${t.title}</a> ${chip}</li>`
      : `<li>${t.title} ${chip} <span class="soon">coming soon</span></li>`;
  }).join('\n        ');
  return `<ul class="year-list" aria-label="Year ${year} topics">\n        ${items}\n      </ul>`;
}

const bookTopicPages = liveTopics.map((t) => ({
  slug: `books/${BOOK}/${t.id}`,
  bookTopic: t.id,
  title: alevelTopicTitle(t),
  description: alevelTopicDescription(t),
}));
const keyPages = liveTopics.map((t) => ({
  slug: `books/${BOOK}/key/${t.id}`,
  book: 'key',
  keyTopic: t.id,
  base: '../../../',
  title: alevelKeyTitle(t),
  description: `Answers and mark schemes for every question on the ${t.title} page.`,
}));

const pageDefaults = {
  base: '../../',
  active: null,
  robots: 'noindex, nofollow',
  extraCss: ['css/book.css', 'css/book-alevel.css'],
  extraBootScripts: ['js/book-boot.js'],
  extraModuleScripts: ['js/book.mjs', 'js/book-search-ui.mjs'],
};

const allPages = [...ALEVEL_PAGES, ...bookTopicPages, ...keyPages];
// Glossary last: it needs the term usage collected from every other page.
const ordered = [...allPages.filter((p) => p.book !== 'glossary'), ...allPages.filter((p) => p.book === 'glossary')];

const searchPages = [];
for (const page of ordered) {
  const merged = { ...pageDefaults, ...page };
  let content = merged.keyTopic
    ? renderAnswerKey(graph.get(merged.keyTopic), expandFigures(read(`${SRC}/${merged.keyTopic}.html`), merged.slug), {
      openHref: `../${merged.keyTopic}.html`, backHref: '../index.html', backText: 'Back to the book', bookId: BOOK,
    })
    : read(`src/pages/${merged.slug}.html`).trimEnd();
  if (!merged.keyTopic) {
    content = renderBookContent(merged, content);
    if (merged.book === 'glossary') {
      const { jump, groups, count } = renderGlossaryPage(GLOSSARY, usage, graph, STRANDS, TERM_FIGURES, autoPatterns, { levelChip });
      content = content
        .replace('{glossary-jump}', () => jump)
        .replace('{glossary-entries}', () => expandInline(groups, { glossaryById, page: 'glossary' }))
        .replaceAll('{glossary-count}', () => String(count));
      if (/\{glossary-/.test(content)) throw new Error('a-level glossary page: unexpanded glossary token');
    }
    // No voice output anywhere in this book: every page says so, and book.mjs skips all of it.
    content = content.replace('<main class="book', `<main id="main" tabindex="-1" data-book-id="${BOOK}" data-audio="off" class="book`);
    const topic = merged.bookTopic ? graph.get(merged.bookTopic) : null;
    searchPages.push({
      href: `${merged.slug.replace(`books/${BOOK}/`, '')}.html`,
      title: plainText(merged.title.split(' | ')[0]),
      kind: topic ? 'Topic' : 'Page',
      sub: topic ? topic.strandName : 'Book',
      snippet: topic ? topic.flip : merged.description,
      sections: merged.searchSections,
      aliases: [merged.searchWords, topic?.aka, ...(topic?.words ?? []).map((id) => glossaryById.get(id)?.term)].filter(Boolean).join(' '),
      html: content,
    });
  } else {
    content = content.replace('<main class="book', '<main id="main" tabindex="-1" class="book');
  }

  const html = renderShell({ shell, nav: NAV, merged, content, isBook: true, searchBox: renderSearchBox(merged.base ?? '', `books/${BOOK}`) });
  const outFile = join(root, 'public', `${merged.slug}.html`);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html);
  console.log(`built public/${merged.slug}.html`);
}

const searchIndex = buildSearchIndex({ pages: searchPages, glossary: GLOSSARY, strands: STRANDS, glossaryHref: 'glossary.html', synonyms: {} });
writeFileSync(join(root, `public/books/${BOOK}/search-index.json`), JSON.stringify(searchIndex));
console.log(`built public/books/${BOOK}/search-index.json (${searchIndex.length} entries)`);
