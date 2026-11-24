#!/usr/bin/env node
// Assembles public/*.html from templates/ + src/pages/*.html + src/pages.config.mjs.
// Run `npm run build` after editing anything in templates/ or src/, and commit the
// regenerated public/*.html — Cloudflare serves that directory as-is.
//
// The hidden GCSE book (public/books/gcse/) is built here too, from
// src/book/topics.mjs (topic graph) and src/book/glossary.mjs (terms); see
// docs/book-authoring.md.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NAV, PAGES } from '../src/pages.config.mjs';
import { STRANDS, TOPICS } from '../src/book/topics.mjs';
import { GLOSSARY } from '../src/book/glossary.mjs';
import { TERM_FIGURES, figuresFor } from '../src/book/term-figures.mjs';
import {
  buildGraph, expandInline, addQuestionIds, countQuestions,
  renderPrereqs, renderUnlocks, renderPyramid, renderGlossaryPage, renderWords, renderPracticeTopics,
  buildAutoPatterns, autoLinkQuestionTerms,
} from './book-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const pageTemplate = read('templates/page.html');
const headerTemplate = read('templates/header.html').trimEnd();
const footerTemplate = read('templates/footer.html').trimEnd();

function readBuildNumber() {
  const file = join(root, 'build-number.json');
  if (!existsSync(file)) return '0000.00.00.000';
  const { date, build } = JSON.parse(readFileSync(file, 'utf8'));
  return `${date}.${String(build).padStart(3, '0')}`;
}

// Links that already point somewhere absolute are left alone; site-relative
// ones get the page's base ("" for top-level pages, "../../" for the book).
const isAbsolute = (href) => /^(tel:|mailto:|https?:|#|\/)/.test(href);
const withBase = (href, base) => (isAbsolute(href) ? href : `${base}${href}`);

function renderNavItems(activeHref, base) {
  return NAV.map(({ href, label }) => {
    const current = href === activeHref ? ' aria-current="page"' : '';
    return `        <li><a href="${withBase(href, base)}"${current}>${label}</a></li>`;
  }).join('\n');
}

const buildNumber = readBuildNumber();

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

// Give every <h2> without an id a stable one ("s-measuring-turns") so "On this page" links work with no script.
function addHeadingIds(html) {
  const used = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  return html.replace(/<h2>([\s\S]*?)<\/h2>/g, (whole, inner) => {
    const text = inner.replace(/<[^>]+>/g, ' ').replace(/\{[^}]*\}/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
    let id = `s-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`;
    if (id === 's-') id = 's-part';
    while (used.has(id)) id += '-x';
    used.add(id);
    return `<h2 id="${id}">${inner}</h2>`;
  });
}

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
    .replace(/\{qcount:([a-z0-9-]+)\}/g, (_, id) => {
      if (!questionCounts.has(id)) throw new Error(`qcount: "${id}" is not a live topic`);
      return String(questionCounts.get(id));
    });
  html = addHeadingIds(html);
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
  title: `${t.title} | GCSE Maths Book (pilot) | Wright Maths Tuition`,
  description: `GCSE maths: ${t.title}. Explanations, worked examples and check-your-knowledge questions with help when you are stuck.`,
}));

const bookPageDefaults = {
  base: '../../',
  active: null,
  robots: 'noindex, nofollow',
  extraCss: ['css/book.css'],
  extraBootScripts: ['js/book-boot.js'],
  extraModuleScripts: ['js/book.mjs'],
};

// Hub, glossary and grade-guide pages are listed in PAGES (flagged with `book`);
// topic pages come from the graph above.
const allPages = [...PAGES, ...bookTopicPages];

// Glossary last: it needs the term usage collected from every other book page.
const ordered = [
  ...allPages.filter((p) => p.book !== 'glossary'),
  ...allPages.filter((p) => p.book === 'glossary'),
];

for (const page of ordered) {
  const isBook = Boolean(page.book || page.bookTopic);
  const merged = isBook ? { ...bookPageDefaults, ...page } : page;
  const base = merged.base ?? '';
  const cta = merged.cta ?? { href: 'contact.html', text: 'Get in touch' };

  const footer = footerTemplate.replace('{{FOOTER_NAV_ITEMS}}', () =>
    NAV.map(({ href, label }) => `        <li><a href="${withBase(href, base)}">${label}</a></li>`).join('\n'),
  );
  const header = headerTemplate
    .replace('{{NAV_ITEMS}}', () => renderNavItems(merged.active, base))
    .replace('{{CTA_HREF}}', () => withBase(cta.href, base))
    .replace('{{CTA_TEXT}}', () => cta.text);

  let content = read(`src/pages/${merged.slug}.html`).trimEnd();
  if (isBook) {
    content = renderBookContent(merged, content);
    if (merged.book === 'glossary') {
      const { jump, groups, count } = renderGlossaryPage(GLOSSARY, usage, graph, STRANDS, TERM_FIGURES);
      content = content
        .replace('{glossary-jump}', () => jump)
        .replace('{glossary-entries}', () => expandInline(groups, { glossaryById, page: 'glossary' }))
        .replaceAll('{glossary-count}', () => String(count));
      if (/\{glossary-/.test(content)) throw new Error('glossary page: unexpanded glossary token');
    }
  }

  let extraHead = '';
  if (merged.robots) extraHead += `<meta name="robots" content="${merged.robots}">\n`;
  if (merged.canonical !== false) {
    const canonicalPath = merged.canonicalPath ?? `${merged.slug}.html`;
    extraHead += `<link rel="canonical" href="https://wrightmaths.uk/${canonicalPath}">\n`;
  }
  for (const css of merged.extraCss ?? []) {
    extraHead += `<link rel="stylesheet" href="${base}${css}?v={{BUILD_NUMBER}}">\n`;
  }
  for (const js of merged.extraBootScripts ?? []) {
    extraHead += `<script src="${base}${js}?v={{BUILD_NUMBER}}"></script>\n`;
  }
  const extraScripts = (merged.extraModuleScripts ?? [])
    .map((js) => `\n<script type="module" src="${base}${js}?v={{BUILD_NUMBER}}"></script>`)
    .join('');

  // Book pages load no third-party fonts: a child's IP address must not go to Google. They use the system font stack.
  const fonts = isBook ? '' : [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">',
    '',
  ].join('\n');
  const skip = isBook ? '<a class="skip-link" href="#main">Skip to the content</a>\n' : '';
  if (isBook) content = content.replace('<main class="book', '<main id="main" tabindex="-1" class="book');

  const html = pageTemplate
    .replace('{{FONTS}}', () => fonts)
    .replace('{{SKIP}}', () => skip)
    .replace('{{TITLE}}', () => merged.title)
    .replace('{{DESCRIPTION}}', () => merged.description)
    .replace('{{EXTRA_HEAD}}', () => extraHead)
    .replace('{{HEADER}}', () => header)
    .replace('{{CONTENT}}', () => content)
    .replace('{{FOOTER}}', () => footer)
    .replace('{{EXTRA_SCRIPTS}}', () => extraScripts)
    .replaceAll('{{BASE}}', base)
    .replaceAll('{{BUILD_NUMBER}}', buildNumber);

  const outFile = join(root, 'public', `${merged.slug}.html`);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html);
  console.log(`built public/${merged.slug}.html`);
}
