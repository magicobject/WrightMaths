// The matcher behind the book's search box. Pure: no DOM, no network, nothing stored, so it is unit-tested
// with plain `node --test` (test-unit/book-search.test.mjs) and used as-is in the browser.
//
// An index entry is { t: title, u: link, k: kind, s?: strand, d?: snippet, a?: aliases, p?: page it sits in }.
// Every word of the query must match something in the entry; the best match per word counts:
//   title word: exact 10, starts-with 8, inside a word 4, one typo 3
//   alias word: exact 7, starts-with 5, one typo 2
//   page the section sits in: exact 3, starts-with 2
// Plurals are folded ("theorems" = "theorem"). A query that is the whole title wins outright.

export function normalize(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const KEEP = new Set(['series', 'species', 'axis', 'analysis', 'basis']);

/** Folds a plural to its singular: theorems -> theorem, boxes -> box, probabilities -> probability. */
export function stem(word) {
  if (word.length <= 3 || KEEP.has(word)) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (/(ss|us|is)$/.test(word)) return word;
  if (/(xes|ches|shes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

const words = (text) => (text ? normalize(text).split(' ').filter(Boolean).map(stem) : []);

// Levenshtein distance, giving up (returning max + 1) once it must exceed max.
function distance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, row[j]);
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
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
    p = { titleNorm, aliasNorm: normalize(entry.a ?? ''), title: words(entry.t), alias: words(entry.a), parent: words(entry.p), titleStem: words(entry.t).join(' ') };
    prepared.set(entry, p);
  }
  return p;
}

const KIND_ORDER = { Topic: 3, Page: 2, Term: 1 };

function score(entry, queryNorm, tokens, queryStem) {
  const p = prepare(entry);
  let total = 0;
  let inTitle = 0;
  for (const q of tokens) {
    const title = wordScore(q, p.title, [10, 8, 3]);
    let best = title;
    if (title === 0 && q.length >= 3 && p.titleNorm.includes(q)) best = 4;
    best = Math.max(best, wordScore(q, p.alias, [7, 5, 2]), wordScore(q, p.parent, [3, 2, 0]));
    if (best === 0) return 0;
    if (title > 0 || best === 4) inTitle++;
    total += best;
  }
  if (p.titleStem === queryStem) total += p.titleNorm === queryNorm ? 1050 : 1000;
  else if (p.titleStem.startsWith(queryStem)) total += 200;
  if (inTitle === tokens.length) total += 60;
  if (tokens.length > 1 && p.aliasNorm.includes(queryNorm)) total += 80; // the whole phrase is one of its other names
  total += KIND_ORDER[entry.k] ?? 0;
  return total - p.titleNorm.length * 0.01;
}

/** The best `limit` entries for a query, best first. An empty query finds nothing. */
export function searchIndex(query, entries, limit = 8) {
  const queryNorm = normalize(query);
  const tokens = words(query);
  if (!tokens.length) return [];
  const queryStem = tokens.join(' ');
  return entries
    .map((entry) => ({ entry, score: score(entry, queryNorm, tokens, queryStem) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.entry);
}
