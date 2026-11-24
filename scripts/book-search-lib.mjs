// Builds the book's search index (public/books/gcse/search-index.json). Pure functions: pages and glossary in,
// a list of small entries out. scripts/build.mjs feeds it the rendered pages; docs/book-authoring.md explains it.
//
// Entry: { t: title, u: link (relative to the book folder), k: kind, s?: strand, d?: snippet, a?: aliases, p?: page title }.
// Only titles, headings, glossary words and short descriptions go in. Questions, hints and solutions never do.

import { plainText } from './book-lib.mjs';

const ANSWER_BLOCK = /<(div|details|ul|ol)\b[^>]*\bclass="[^"]*\b(solution|wrong|ladder|check-line)\b[^"]*"[^>]*>/g;

/** The page with every solution, wrong-answer note, hint ladder and "check my answer" block removed (tags nest, so count them). */
export function stripAnswerBlocks(html) {
  let out = html;
  for (let m = ANSWER_BLOCK.exec(out); m; m = ANSWER_BLOCK.exec(out)) {
    const tag = m[1];
    const open = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
    open.lastIndex = m.index + m[0].length;
    let depth = 1;
    let end = out.length;
    for (let t = open.exec(out); t; t = open.exec(out)) {
      depth += t[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { end = t.index + t[0].length; break; }
    }
    out = out.slice(0, m.index) + out.slice(end);
    ANSWER_BLOCK.lastIndex = m.index;
  }
  return out;
}

/** The h2 and h3 headings that have an id (so a link can jump to them), as plain text. */
export function extractHeadings(html) {
  return [...html.matchAll(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/g)].flatMap(([, level, attrs, inner]) => {
    const id = /\bid="([^"]+)"/.exec(attrs)?.[1];
    const withoutChips = inner.replace(/<span class="chip[^>]*>[\s\S]*?<\/span>/g, '');
    const text = plainText(withoutChips).replace(/^\d+\.\s+/, '');
    return id && text.length > 1 ? [{ id, text, level: Number(level) }] : [];
  });
}

// Every topic page has these scaffolding headings ("Worked example: add"); the page itself is the useful result.
const SCAFFOLDING = /^(check your knowledge|worked example|faded example|going further|flip it|spot the mistake|mixed review|exam style|why it works|common traps|i can|what next|before you start|what this unlocks|learn it|warm-up|last time)/i;

const short = (text, max = 110) => {
  const t = plainText(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max).replace(/\s+\S*$/, '');
  return `${cut}\u2026`;
};

// Plain text only: HTML entities (&pi;) are decoded, so what is searched and shown is what a student sees.
const compact = (entry) => Object.fromEntries(Object.entries(entry).filter(([, v]) => v).map(([k, v]) => [k, k === 'u' || k === 'k' ? v : plainText(v)]));

// Everyday words a student types that no title uses, added as everyday names (`y`) of the page that answers them (page link -> words).
// A page that is not in this build is simply skipped, so a listed page can be added later without touching this.
export const SEARCH_SYNONYMS = {
  'percentages.html': 'percent per cent vat discount sale reduction reduced increase decrease interest tax tip profit loss off',
  'percentage-change.html': 'percent per cent vat interest compound simple growth decay depreciation increase decrease sale discount',
  'four-operations.html': 'multiplication multiplying times table tables long division short division bus stop addition subtraction plus minus',
  'factors-multiples.html': 'times table tables',
  'fractions.html': 'fractions of an amount fraction of a quantity',
  'rearranging-formulae.html': 'rearrange rearranged rearranging change the subject make the subject transpose',
  'squares-roots.html': 'sqrt root roots square root radical',
  'surds.html': 'sqrt root roots radical',
  'probability-basics.html': 'dice die coin coins spinner',
  'histograms-cumulative-frequency.html': 'quartile quartiles upper quartile lower quartile interquartile range box plot',
  'averages.html': 'quartile quartiles interquartile range',
  'diagnostic.html': 'get started getting started start beginning begin',
  'command-words.html': 'hence deduce justify evaluate sketch prove proof describe estimate explain',
  'teachers.html': 'set homework homework worksheet print printing printable link links class students',
  'parents.html': 'daughter son child children help my child helping parent mum dad carer',
  'how-to-use.html': 'listen audio read aloud voice dyslexia dyslexic screen reader accessible accessibility easy read font ruler tint print printing worksheet help keyboard shortcuts',
};

/**
 * pages: [{ href, title, kind, sub, snippet, aliases?, html }]   (href relative to the book folder)
 * glossary: the terms (id, term, strand, def, optional aka: ['other name', ...])
 * Headings that appear on more than `genericAfter` pages ("Check your knowledge") are left out: they would bury real results.
 */
export function buildSearchIndex({ pages, glossary, strands, glossaryHref, genericAfter = 6 }) {
  const counts = new Map();
  const headingsOf = pages.map((page) => {
    if (page.sections === false) return [];
    const found = extractHeadings(stripAnswerBlocks(page.html ?? '')).filter((h) => h.text.toLowerCase() !== page.title.toLowerCase());
    for (const text of new Set(found.map((h) => h.text.toLowerCase()))) counts.set(text, (counts.get(text) ?? 0) + 1);
    return found;
  });

  const index = [];
  pages.forEach((page, i) => {
    index.push(compact({ t: page.title, u: page.href, k: page.kind, s: page.sub, d: page.snippet && short(page.snippet), a: page.aliases, y: SEARCH_SYNONYMS[page.href] }));
    const seen = new Set();
    for (const h of headingsOf[i]) {
      const key = h.text.toLowerCase();
      if (counts.get(key) > genericAfter || seen.has(key) || SCAFFOLDING.test(h.text)) continue;
      seen.add(key);
      index.push(compact({ t: h.text, u: `${page.href}#${h.id}`, k: 'Section', p: page.title }));
    }
  });
  for (const g of glossary) {
    index.push(compact({ t: g.term, u: `${glossaryHref}#${g.id}`, k: 'Term', s: strands[g.strand]?.short, d: short(g.def), a: (g.aka ?? []).join(' ') }));
  }
  return index;
}

/**
 * The header search box (book pages only). Hidden until book-search-ui.mjs starts it, so nothing dead shows without JavaScript.
 * The index address is relative to the page, so it is always fetched from this site.
 */
export function renderSearchBox(base) {
  return `
    <form class="book-search" role="search" aria-label="Search the whole book" data-index="${base}books/gcse/search-index.json" autocomplete="off" hidden>
      <label class="sr-only" for="book-search-input">Search the whole book (topics, words and sections)</label>
      <input id="book-search-input" type="search" role="combobox" aria-expanded="false" aria-controls="book-search-results" aria-autocomplete="list" placeholder="Search the whole book" maxlength="60" spellcheck="false">
      <ul id="book-search-results" class="book-search-results" role="listbox" aria-label="Search results" tabindex="-1" hidden></ul>
      <p class="book-search-empty" id="book-search-empty" hidden></p>
      <p class="sr-only" id="book-search-status" role="status"></p>
    </form>`;
}
