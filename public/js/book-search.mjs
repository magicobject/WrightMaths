// The matcher behind the book's search box. Pure: no DOM, no network, nothing stored, so it is unit-tested
// with plain `node --test` (test-unit/book-search.test.mjs) and used as-is in the browser.
//
// An index entry is { t: title, u: link, k: kind, s?: strand, d?: snippet, a?: aliases, y?: everyday names added by the builder, p?: page it sits in }.
// Every word of the query must match something in the entry; the best match per word counts:
//   title word: exact 10, starts-with 8, inside a word (4+ letters) 3, a typo 3
//   other name (alias): exact 9, starts-with 5, a typo 2
//   page the section sits in: exact 3, starts-with 2
// A typo is one slip (a letter wrong, missing, extra or two swapped) in words of 5+ letters, two in words of 9+.
// Plurals and -ise/-ising endings are folded. Little words ("the", "where", "do") are ignored. If no entry matches
// every word, entries matching some of them are offered instead, ranked lower.
// A query that is the whole title wins outright.

export function normalize(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u03b1-\u03c9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const KEEP = new Set(['series', 'species', 'axis', 'analysis', 'basis']);
const STOP = new Set(['by', 'a', 'an', 'the', 'do', 'does', 'i', 'of', 'in', 'to', 'is', 'are', 'what', 'where', 'how', 'can', 'my', 'me', 'for', 'and', 'or', 'on', 'with', 'it', 'be', 'you', 'about', 'when', 'why', 'which']);

/** Folds a plural to its singular and -ise/-ising to a common root: theorems -> theorem, rationalising -> rationalis. */
export function stem(word) {
  if (word.length <= 3 || KEEP.has(word)) return word;
  if (word.length > 6 && /(ising|ised|ises|ise|izing|ized|izes|ize)$/.test(word)) return word.replace(/(ising|ised|ises|ise|izing|ized|izes|ize)$/, 'is');
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (/(ss|us|is)$/.test(word)) return word;
  if (/(xes|ches|shes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

const words = (text) => (text ? normalize(text).split(' ').filter(Boolean).map(stem) : []);

// What a student types is not always a word: "15% of 80", "2x+3", "year 10", the root sign. These are turned into
// the words the index knows ("percent", "algebra"), and bare numbers are dropped, since no title contains one.
const ROOT_SIGN = String.fromCharCode(0x221a);
const REWRITES = [
  [/%/g, ' percent '],
  [new RegExp(ROOT_SIGN, 'g'), ' sqrt '],
  [/\byear\s*\d+\b/g, ' '],
  [/\b\d+[a-z]\b|\b[a-z]\s*[+\-=^]\s*\d+/g, ' algebra '],
];

/** The query with numbers and symbols turned into plain words: "increase by 20%" -> "increase by percent". */
export function cleanQuery(query) {
  let text = String(query).toLowerCase();
  for (const [pattern, replacement] of REWRITES) text = text.replace(pattern, replacement);
  return normalize(text).split(' ').filter((w) => w && !/^\d+$/.test(w)).join(' ');
}

/** Advice for the "nothing matched" message: a number or % gets different advice from a misspelt word. */
export function emptyAdvice(query) {
  if (/[\d%]/.test(String(query))) return 'Try one word, like \u201cpercentages\u201d or \u201cratio\u201d.';
  return 'Check the spelling, or try one word, like \u201ccircle\u201d.';
}

// Damerau-Levenshtein distance (a swap of two neighbouring letters is one slip), giving up once it must exceed max.
function distance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = [Array.from({ length: b.length + 1 }, (_, j) => j)];
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      let d = Math.min(rows[i - 1][j] + 1, row[j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, rows[i - 2][j - 2] + 1);
      row[j] = d;
    }
    rows.push(row);
  }
  return rows[a.length][b.length];
}

const allowedTypos = (word) => (word.length >= 9 ? 2 : word.length >= 5 ? 1 : 0);

// Points for one query word against a list of entry words, given the points for exact / prefix / typo.
function wordScore(q, list, [exact, prefix, typo]) {
  let best = 0;
  for (const w of list) {
    if (w === q) return exact;
    if (q.length >= 2 && w.startsWith(q)) best = Math.max(best, prefix);
    else if (typo && allowedTypos(q) && distance(q, w, allowedTypos(q)) <= allowedTypos(q)) best = Math.max(best, typo);
  }
  return best;
}

const prepared = new WeakMap();
function prepare(entry) {
  let p = prepared.get(entry);
  if (!p) {
    const titleNorm = normalize(entry.t);
    const core = entry.t.replace(/\([^)]*\)/g, ''); // "Pi (\u03c0)" is the whole title "Pi" for ranking
    p = { titleNorm, aliasNorm: normalize(entry.a ?? ''), aliasStem: ' ' + words(entry.a).join(' ') + ' ', synStem: entry.y ? ' ' + words(entry.y).join(' ') + ' ' : ' ', syn: words(entry.y), title: words(entry.t), alias: words(entry.a), parent: words(entry.p), titleStem: words(core).join(' '), coreNorm: normalize(core) };
    prepared.set(entry, p);
  }
  return p;
}

const KIND_ORDER = { Topic: 3, Page: 2, Term: 1 };

// Score of one entry for the query. With requireAll every word must match (else 0); without it any one word will do.
function score(entry, { queryNorm, tokens, queryStem }, requireAll) {
  const p = prepare(entry);
  let total = 0;
  let inTitle = 0;
  let matched = 0;
  for (const q of tokens) {
    const title = wordScore(q, p.title, [10, 8, 3]);
    let best = title;
    if (title === 0 && q.length >= 5 && p.titleNorm.includes(q)) best = 3; // never inside a short word: "dice" is not in "indices"
    best = Math.max(best, wordScore(q, p.alias, [9, 5, 2]), wordScore(q, p.syn, [9, 5, 2]), wordScore(q, p.parent, [3, 2, 0]));
    if (best === 0) {
      if (requireAll) return 0;
      continue;
    }
    matched++;
    if (title > 0 || best === 3) inTitle++;
    total += best;
  }
  if (!matched) return 0;
  if (p.titleStem === queryStem) total += entry.k === 'Section' ? 200 : p.coreNorm === queryNorm ? 1050 : 1000; // a heading with the same name does not outrank the topic
  else if (p.titleStem.startsWith(queryStem)) total += 200;
  if (inTitle === tokens.length) total += 60;
  if (queryNorm.includes(' ') && p.aliasNorm.includes(queryNorm)) total += 80; // the whole phrase is one of its other names
  if (entry.k !== 'Topic' && p.aliasStem.includes(` ${queryStem} `)) total += 300; // an exact other name beats a title that merely starts with it
  if (p.synStem.includes(` ${queryStem} `)) total += 320; // an everyday name for the page ("times table", "sqrt") beats a word that merely sounds like it
  total += KIND_ORDER[entry.k] ?? 0;
  if (entry.k === 'Section') total *= 0.8; // titles and glossary words come before a heading in the middle of a page
  return total - p.titleNorm.length * 0.01;
}

function rank(query, entries, limit, requireAll) {
  return entries
    .map((entry) => ({ entry, score: score(entry, query, requireAll) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.entry);
}

/** The best `limit` entries for a query, best first. An empty query finds nothing. */
export function searchIndex(query, entries, limit = 8) {
  const queryNorm = cleanQuery(query);
  let tokens = words(queryNorm);
  if (!tokens.length) return [];
  const content = queryNorm.split(' ').filter((w) => !STOP.has(w)).map(stem);
  if (tokens.length > 1 && content.length) tokens = content;
  const q = { queryNorm, tokens, queryStem: tokens.join(' ') };
  if (tokens.length === 1 && STOP.has(queryNorm)) return [];
  const all = rank(q, entries, limit, true);
  if (all.length || tokens.length < 2) return all;
  return rank(q, entries, limit, false);
}
