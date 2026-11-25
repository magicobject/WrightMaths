// Pure helpers for building the GCSE book (public/books/gcse/). No file I/O
// here so test-unit/book-lib.test.mjs can exercise every function directly.

export const STRAND_CLASS = { n: 'number', a: 'algebra', r: 'ratio', g: 'geometry', p: 'probability', s: 'statistics' };

export function escapeAttr(text) {
  return String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

// Entities in a glossary definition (&sup2;, &radic; ...) must reach the page
// intact, so for the pop-up attribute only quotes and tags are escaped.
function escapeDefAttr(text) {
  return String(text).replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

// ---------- topic graph ----------

/** Validate the topic list and derive `layer` (depth in the pyramid) and `unlocks`. */
export function buildGraph(topics, { hasPage = null } = {}) {
  const byId = new Map();
  for (const t of topics) {
    if (byId.has(t.id)) throw new Error(`topics: duplicate id "${t.id}"`);
    byId.set(t.id, { ...t, unlocks: [], layer: -1 });
  }
  for (const t of byId.values()) {
    for (const need of t.needs) {
      if (!byId.has(need)) throw new Error(`topics: "${t.id}" needs unknown topic "${need}"`);
      if (need === t.id) throw new Error(`topics: "${t.id}" needs itself`);
      byId.get(need).unlocks.push(t.id);
    }
    if (hasPage && t.status === 'live' && !hasPage(t.id)) {
      throw new Error(`topics: "${t.id}" is live but has no page`);
    }
    if (hasPage && t.status === 'planned' && hasPage(t.id)) {
      throw new Error(`topics: "${t.id}" has a page but is marked planned`);
    }
  }
  const state = new Map(); // id -> 'visiting' | 'done'
  const layerOf = (id, trail = []) => {
    const t = byId.get(id);
    if (state.get(id) === 'done') return t.layer;
    if (state.get(id) === 'visiting') throw new Error(`topics: cycle ${[...trail, id].join(' -> ')}`);
    state.set(id, 'visiting');
    t.layer = t.needs.length === 0 ? 0 : 1 + Math.max(...t.needs.map((n) => layerOf(n, [...trail, id])));
    state.set(id, 'done');
    return t.layer;
  };
  for (const id of byId.keys()) layerOf(id);
  return byId;
}

// ---------- shorthand expansion ----------

/** Turn "3/4" into a stacked fraction. Splits at the first "/" that is not part of a closing tag. */
export function renderFraction(body) {
  let split = -1;
  for (let i = 0; i < body.length; i += 1) {
    if (body[i] === '/' && body[i - 1] !== '<') { split = i; break; }
  }
  if (split < 1) throw new Error(`bad fraction shorthand: {frac:${body}}`);
  const top = body.slice(0, split).trim();
  const bottom = body.slice(split + 1).trim();
  return `<span class="frac"><span class="fn">${top}</span><span class="sr"> over </span><span class="fd">${bottom}</span></span>`;
}

/**
 * Expand {frac:..} and {term:id|text} in `html`. Terms are looked up in
 * `glossaryById`; an unknown term throws, so a typo can never ship. When
 * `usage` is given, each term records which page used it.
 */
export function expandInline(html, { glossaryById, usage, page }) {
  return html
    .replace(/\{frac:([^}]+)\}/g, (_, body) => renderFraction(body))
    .replace(/\{term:([a-z0-9-]+)(?:\|([^}]*))?\}/g, (_, id, label) => {
      const entry = glossaryById.get(id);
      if (!entry) throw new Error(`unknown glossary term "${id}" used in ${page}`);
      if (usage && page) {
        if (!usage.has(id)) usage.set(id, new Set());
        usage.get(id).add(page);
      }
      const text = label ?? entry.term;
      return `<a class="term" href="glossary.html#${id}" data-term="${id}" data-def="${escapeDefAttr(entry.def)}">${text}</a>`;
    });
}

/** Give every <div class="q" ...> a stable data-qid ("fractions-1", "fractions-2" ...). */
export function addQuestionIds(html, slug) {
  let n = 0;
  return html.replace(/<div class="q"/g, () => {
    n += 1;
    return `<div class="q" data-qid="${slug}-${n}"`;
  });
}

export function countQuestions(html) {
  return (html.match(/<div class="q"/g) ?? []).length;
}

// ---------- generated blocks ----------

const link = (t, graph) => {
  const topic = graph.get(t);
  return topic.status === 'live'
    ? `<a href="${topic.id}.html">${topic.title}</a>`
    : `${topic.title} <span class="soon">coming soon</span>`;
};

function chip(topic) {
  return `<span class="chip chip-${STRAND_CLASS[topic.strand]}">${topic.strandName}</span>`;
}

export function renderPrereqs(id, graph) {
  const t = graph.get(id);
  if (t.needs.length === 0) {
    return `<aside class="bys" aria-labelledby="bys-title">
    <h2 id="bys-title">Before you start: the base of the pyramid</h2>
    <p>Maths is built like a pyramid, each topic standing on the ones below. This topic is at the very bottom, so there is nothing underneath it to check first. Everything else in the book stands on it.</p>
  </aside>`;
  }
  const items = t.needs.map((n) => {
    const need = graph.get(n);
    return `<li class="${need.status}">${link(n, graph)} ${chip(need)}</li>`;
  }).join('\n      ');
  return `<aside class="bys" aria-labelledby="bys-title">
    <h2 id="bys-title">Before you start: what this stands on</h2>
    <p>Maths is built like a pyramid, each topic standing on the ones below. This topic needs:</p>
    <ul class="needs">
      ${items}
    </ul>
    <p>The "Last time" questions below are a quick check of that base. If they feel shaky, build the base first.</p>
  </aside>`;
}

export function renderUnlocks(id, graph) {
  const t = graph.get(id);
  if (t.unlocks.length === 0) return '';
  const items = t.unlocks.map((u) => {
    const up = graph.get(u);
    return `<li class="${up.status}">${link(u, graph)} ${chip(up)}</li>`;
  }).join('\n      ');
  return `<aside class="bys unlocks" aria-labelledby="unlocks-title">
    <h2 id="unlocks-title">What this unlocks</h2>
    <p>Get this secure and these topics open up:</p>
    <ul class="needs">
      ${items}
    </ul>
  </aside>`;
}

export function renderPyramid(graph) {
  const layers = new Map();
  for (const t of graph.values()) {
    if (!layers.has(t.layer)) layers.set(t.layer, []);
    layers.get(t.layer).push(t);
  }
  const top = Math.max(...layers.keys());
  const rows = [];
  for (let layer = top; layer >= 0; layer -= 1) {
    const nodes = (layers.get(layer) ?? []).map((t) => {
      const needs = t.needs.length
        ? `<span class="needs-line">builds on ${t.needs.map((n) => graph.get(n).title).join(', ')}</span>`
        : '<span class="needs-line">the very base</span>';
      const inner = `<span class="node-title">${t.title}${t.tier === 'H' ? ' <span class="tier-tag">Higher</span>' : ''}</span>${needs}`;
      const body = t.status === 'live'
        ? `<a href="${t.id}.html" data-topic-id="${t.id}">${inner}</a>`
        : `<span class="planned-node">${inner}<span class="soon">coming soon</span></span>`;
      const progress = t.status === 'live'
        ? `<span class="node-progress" data-progress-for="${t.id}" data-total="{qcount:${t.id}}"></span>`
        : '';
      return `<li class="pyr-node strand-${STRAND_CLASS[t.strand]} ${t.status}">${body}${progress}</li>`;
    }).join('\n        ');
    const label = layer === 0 ? 'Base layer' : `Layer ${layer}`;
    rows.push(`      <li class="pyr-layer"><h3 class="layer-label">${label}</h3>
        <ul class="pyr-row">
        ${nodes}
        </ul>
      </li>`);
  }
  return `<ol class="pyramid" aria-label="Topic pyramid, highest layer first">
${rows.join('\n')}
    </ol>`;
}

export function renderGlossaryPage(glossary, usage, graph, strands, figures = {}, patterns = []) {
  const sorted = [...glossary].sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
  const byId = new Map(glossary.map((g) => [g.id, g]));
  const letters = [...new Set(sorted.map((g) => g.term[0].toUpperCase()))];
  const jump = letters.map((l) => `<a href="#letter-${l}">${l}</a>`).join(' ');

  const entryHtml = (g) => {
    const used = usage.get(g.id) ? [...usage.get(g.id)].sort() : [];
    const usedHtml = used.length
      ? `<p class="g-used"><b>Taught in:</b> ${used.map((s) => `<a href="${s}.html">${graph.get(s)?.title ?? s}</a>`).join(', ')}</p>`
      : '';
    const see = (g.see ?? []).filter((s) => byId.has(s))
      .map((s) => `<a href="#${s}">${byId.get(s).term}</a>`).join(', ');
    // Technical words used inside an entry link to their own entries (first use only, never to itself).
    const already = new Set([g.id]);
    const link = (t) => (t ? linkTermsInText(t, patterns, already) : t);
    const parts = [
      `<p class="g-def">${link(g.def)}</p>`,
      figures[g.id] ? `<div class="g-fig">${figures[g.id]}</div>` : '',
      g.example ? (Array.isArray(g.example) ? `<p class="g-example"><b>Examples:</b>${g.example.map((line) => `<span class="g-line">${link(line)}</span>`).join('')}</p>` : `<p class="g-example"><b>Example:</b> ${link(g.example)}</p>`) : '',
      g.watch ? `<p class="g-watch"><b>Watch out:</b> ${link(g.watch)}</p>` : '',
      g.flip ? `<p class="g-flip"><b>Flip it:</b> ${link(g.flip)}</p>` : '',
      see ? `<p class="g-see"><b>See also:</b> ${see}</p>` : '',
      usedHtml,
    ].filter(Boolean).join('\n          ');
    const level = g.level === 'H' ? '<span class="chip chip-higher">Higher</span>' : '';
    return `<article class="g-entry strand-${STRAND_CLASS[g.strand]}" id="${g.id}" data-strand="${STRAND_CLASS[g.strand]}">
          <h3>${g.term} <span class="chip chip-${STRAND_CLASS[g.strand]}">${strands[g.strand].short}</span> ${level}</h3>
          ${parts}
        </article>`;
  };

  const groups = letters.map((l) => {
    const entries = sorted.filter((g) => g.term[0].toUpperCase() === l).map(entryHtml).join('\n        ');
    return `<section class="g-letter" id="letter-${l}" aria-labelledby="letter-${l}-h">
        <h2 id="letter-${l}-h" class="g-letter-h">${l}</h2>
        ${entries}
      </section>`;
  }).join('\n      ');

  return { jump, groups, count: glossary.length };
}

/** The "Words you need" strip at the top of a topic: the glossary terms it uses, with their plain definitions. */
export function renderWords(id, graph, glossaryById) {
  const t = graph.get(id);
  const words = t.words ?? [];
  if (words.length === 0) return '';
  const items = words.map((w) => {
    const g = glossaryById.get(w);
    if (!g) throw new Error(`topics: "${id}" lists unknown word "${w}"`);
    return `<dt>{term:${w}}</dt><dd>${g.def}</dd>`;
  }).join('\n      ');
  return `<aside class="words-strip" aria-labelledby="words-title">
    <h2 id="words-title">Words you need</h2>
    <p class="muted">Tap a teal word anywhere on the page to see this again.</p>
    <dl>
      ${items}
    </dl>
  </aside>`;
}

/** Topic checkboxes for the mixed-practice page. */
export function renderPracticeTopics(graph) {
  const live = [...graph.values()].filter((t) => t.status === 'live').sort((a, b) => a.layer - b.layer || a.title.localeCompare(b.title));
  const items = live.map((t) => `<li><label><input type="checkbox" name="practice-topic" value="${t.id}"${t.layer <= 3 ? ' checked' : ''}> ${t.title}</label></li>`).join('\n        ');
  return `<fieldset class="practice-topics">
      <legend>Topics to mix (the lower layers are ticked: add more when you are ready)</legend>
      <ul>
        ${items}
      </ul>
    </fieldset>`;
}

// ---------- automatic term links inside questions ----------

// Words that are everywhere in questions or too general to be worth a pop-up on every use.
const NEVER_AUTO = new Set(['work-out', 'calculate', 'write-down', 'show-that', 'explain-command', 'term', 'round', 'operation', 'proof', 'unknown', 'sum', 'mean']);

function termNames(g) {
  const plain = String(g.term).replace(/&[a-z]+;/gi, '');
  const main = plain.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  const inParens = [...plain.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].trim());
  return [main, ...inParens]
    .filter((n) => n.length >= 3 && !/[.]/.test(n) && /^[A-Za-z' -]+$/.test(n))
    .map((n) => n.toLowerCase());
}

/** Build the list of {id, re} patterns, longest names first. */
export function buildAutoPatterns(glossary) {
  const out = [];
  for (const g of glossary) {
    if (NEVER_AUTO.has(g.id)) continue;
    for (const name of termNames(g)) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
      out.push({ id: g.id, len: name.length, re: new RegExp(`(?<![A-Za-z])(${escaped})(?:s|es)?(?![A-Za-z])`, 'i') });
    }
  }
  return out.sort((a, b) => b.len - a.len);
}

/**
 * Link the first use of each glossary term in the question text (<p class="qtext">) as {term:id|text}.
 * Only plain text is touched: tags, entities and existing {..} shorthands are left alone.
 */
export function autoLinkQuestionTerms(html, patterns) {
  return html.replace(/(<p class="qtext">)([\s\S]*?)(<\/p>)/g, (whole, open, inner, close) => open + linkTermsInText(inner, patterns) + close);
}

/**
 * Link the first use of each glossary term inside one piece of page source as {term:id|text}.
 * `already` is a Set of term ids not to link (ids already linked, or the entry's own id); it is added to
 * as terms are linked, so passing the same Set for several pieces links each term once across them.
 */
export function linkTermsInText(inner, patterns, already = new Set()) {
  for (const m of inner.matchAll(/\{term:([a-z0-9-]+)/g)) already.add(m[1]);
  const parts = inner.split(/(<[^>]+>|\{[^}]*\}|&[a-z#0-9]+;)/i);
  for (const { id, re } of patterns) {
    if (already.has(id)) continue;
    for (let i = 0; i < parts.length; i += 1) {
      const piece = parts[i];
      if (!piece || /^(<|\{|&)/.test(piece)) continue;
      const m = re.exec(piece);
      if (!m) continue;
      const before = piece.slice(0, m.index);
      const matched = piece.slice(m.index, m.index + m[0].length);
      const after = piece.slice(m.index + m[0].length);
      parts.splice(i, 1, before, `{term:${id}|${matched}}`, after);
      already.add(id);
      break;
    }
  }
  return parts.join('');
}


// ---------- teacher answer keys ----------
// Built from the same page source as the questions, so a key can never disagree with its page.

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', pound: '\u00a3', times: '\u00d7', divide: '\u00f7',
  minus: '\u2212', deg: '\u00b0', sup2: '\u00b2', sup3: '\u00b3', radic: '\u221a', asymp: '\u2248', hellip: '\u2026',
  rarr: '\u2192', larr: '\u2190', pi: '\u03c0', plusmn: '\u00b1', le: '\u2264', ge: '\u2265', ne: '\u2260', frac12: '\u00bd',
  ldquo: '\u201c', rdquo: '\u201d', lsquo: '\u2018', rsquo: '\u2019', ndash: '\u2013', mdash: '\u2014', middot: '\u00b7',
  equiv: '\u2261', theta: '\u03b8', alpha: '\u03b1', beta: '\u03b2', micro: '\u00b5', ohm: '\u03a9', Omega: '\u03a9',
};

/** Plain text of a fragment of page source: shorthands and tags removed, entities decoded. */
export function plainText(html) {
  return String(html)
    .replace(/\{frac:([^}]*?)\/([^}/]*)\}/g, (_, t, u) => `${/^[\w.]+$/.test(t.trim()) ? t.trim() : `(${t.trim()})`}/${/^[\w.]+$/.test(u.trim()) ? u.trim() : `(${u.trim()})`}`)
    .replace(/\{term:[^|}]*\|([^}]*)\}/g, '$1')
    .replace(/\{term:([^}]*)\}/g, '$1')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<sup>([^<]*)<\/sup>/g, '^$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z0-9]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

const esc = (t) => String(t).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** One entry per question on a topic page: number, text, answer, marks and mark scheme. */
export function extractKey(raw) {
  const parts = raw.split(/(?=<div class="q")/).filter((p) => p.startsWith('<div class="q"'));
  return parts.map((part, i) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(part)?.[1] ?? '';
    const attr = (name) => new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1];
    const type = attr('data-type');
    const marks = Number(attr('data-marks') ?? 0) || 0;
    const qtext = plainText(/<p class="qtext">([\s\S]*?)<\/p>/.exec(part)?.[1] ?? '').replace(/^\[\d+ marks?\]\s*/, '');
    const figure = plainText(/<figure[^>]*>[\s\S]*?<svg[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/.exec(part)?.[1] ?? '');
    let answer = '';
    let also = [];
    if (type === 'mc') {
      answer = plainText(/<li data-correct[^>]*>([\s\S]*?)<\/li>/.exec(part)?.[1] ?? '');
    } else if (type === 'show') {
      answer = 'Written answer: see the mark scheme';
    } else {
      const list = plainText(attr('data-answers') ?? '').split(';').map((x) => x.trim()).filter(Boolean);
      answer = list[0] ?? '';
      also = list.slice(1);
    }
    const solution = /<div class="solution">([\s\S]*?)<\/div>\s*<\/div>/.exec(part)?.[1] ?? /<div class="solution">([\s\S]*?)<\/div>/.exec(part)?.[1] ?? '';
    const scheme = [...solution.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => plainText(m[1]));
    const working = plainText(solution.replace(/<ul class="markscheme">[\s\S]*?<\/ul>/, ''));
    return { n: i + 1, type: type ?? 'typed', text: qtext, figure, answer, also, marks, scheme: marks > 0 ? scheme : [], working };
  });
}

/** The printable answer-key page for one topic. */
export function renderAnswerKey(topic, raw) {
  const rows = extractKey(raw);
  const body = rows.map((r) => {
    const q = r.text + (r.figure ? ` [Figure: ${r.figure}]` : '');
    const also = r.also.length ? ` <span class="muted">(also accept: ${esc(r.also.join(', '))})</span>` : '';
    const marksCell = r.marks ? `${r.marks}` : '';
    const scheme = r.scheme.length ? `<ol class="key-scheme">${r.scheme.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : '';
    const working = r.working ? `<div class="key-working"><b>Working:</b> ${esc(r.working.length > 700 ? `${r.working.slice(0, 697)}...` : r.working)}</div>` : '';
    return `<tr id="q${r.n}"><th scope="row">${r.n}</th><td>${esc(q)}</td><td><b>${esc(r.answer)}</b>${also}${scheme}${working}</td><td>${marksCell}</td></tr>`;
  }).join('\n');
  const total = rows.reduce((n, r) => n + r.marks, 0);
  return `<main class="book" data-book-page="key">
<section class="hero book-hero">
  <div class="wrap" style="grid-template-columns:1fr;">
    <div>
      <span class="eyebrow">Teacher answer key</span>
      <h1>${esc(topic.title)}: answers</h1>
      <p class="lead">${rows.length} questions, ${rows.filter((r) => r.marks).length} of them marked (${total} marks in all). Question numbers match the page. Use your browser's Print for a copy.</p>
      <div class="hero-actions">
        <a class="btn btn-gold" href="../${topic.id}.html">Open the questions</a>
        <a class="btn btn-ghost" href="../teachers.html">Back to the teacher page</a>
      </div>
    </div>
  </div>
</section>
<section>
  <div class="wrap">
    <div class="qtable-wide" tabindex="0" role="region" aria-label="Answer key table (scroll sideways if it does not fit)">
    <table class="key-table">
      <caption>Answers for ${esc(topic.title)}</caption>
      <thead><tr><th scope="col">No.</th><th scope="col">Question</th><th scope="col">Answer</th><th scope="col">Marks</th></tr></thead>
      <tbody>
${body}
      </tbody>
    </table>
    </div>
  </div>
</section>
</main>`;
}
