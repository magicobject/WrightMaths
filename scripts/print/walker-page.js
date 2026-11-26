(function walkPage() {
  // Runs inside the page (JavaScript off, print media, light scheme). It turns <main> into a JSON tree.
  // It handles a closed set of elements; anything else is recorded in `unknown`, and a test fails if that list is not empty.
  // Anything the existing @media print CSS hides (display:none) is skipped, so that stylesheet decides what is screen-only.
  const unknown = [];
  let qIndex = 0;
  let figCount = 0;
  let curTags = null;

  const has = (el, name) => el.classList.contains(name);
  const tagOf = (el) => el.tagName.toLowerCase();
  const note = (el, where) => unknown.push({ where, tag: tagOf(el), cls: el.className && typeof el.className === 'string' ? el.className : '', text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) });

  // Screen-only parts that print CSS does not hide because they are built by script (and so are absent here), or only clipped.
  const SKIP_CLASS = ['sr-only', 'sr', 'listen', 'btn', 'crumbs', 'progress-line', 'hero-actions', 'read-tools', 'toc', 'fast-route', 'to-top', 'next-up', 'eyebrow', 'q-help', 'q-form', 'g-tools', 'q-calc'];
  const SKIP_TAG = new Set(['nav', 'button', 'noscript', 'script', 'style', 'template', 'select']);
  const TRANSPARENT_DIV = ['wrap', 'narrow', 'section-head', 'flip-grid', 'flip-side', 'qtable', 'qtable-wide', 'pairs', 'dq'];
  const SECTION_KINDS = ['hero', 'ckw', 'flip-section', 'exam-section', 'section-alt', 'print-title', 'print-copyright', 'print-how'];
  const P_KINDS = ['lead', 'intro', 'muted', 'sum-line', 'where-use', 'qtext', 'ar-keys'];
  const LIST_KINDS = ['facts', 'tick', 'traps', 'checklist', 'needs', 'steps', 'markscheme', 'method', 'legend'];
  const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'dl', 'table', 'figure', 'div', 'section', 'aside', 'details', 'article', 'hr']);

  function skip(el) {
    if (SKIP_TAG.has(tagOf(el)) || el.hidden) return true;
    if (SKIP_CLASS.some((c) => has(el, c))) return true;
    return getComputedStyle(el).display === 'none';
  }

  function runsOf(el) {
    const out = [];
    inline(el, {}, out);
    return out;
  }

  function inline(node, fmt, out) {
    for (const c of node.childNodes) {
      if (c.nodeType === 3) {
        const s = c.nodeValue.replace(/\s+/g, ' ');
        if (s) out.push({ t: s, ...fmt });
      } else if (c.nodeType === 1) {
        inlineEl(c, fmt, out);
      }
    }
  }

  function childByClass(el, name) {
    return [...el.children].find((c) => has(c, name));
  }

  function inlineEl(el, fmt, out) {
    const tag = tagOf(el);
    if (skip(el)) return;
    if (el.hasAttribute('data-print')) {
      // data-print="..." prints that text instead of the element (an empty value prints nothing)
      const text = el.getAttribute('data-print');
      if (text) out.push({ t: text, ...fmt });
      return;
    }
    if (tag === 'span' && has(el, 'frac')) {
      out.push({ x: 'frac', num: runsOf(childByClass(el, 'fn')), den: runsOf(childByClass(el, 'fd')) });
    } else if (tag === 'span' && /^column vector/.test(el.getAttribute('aria-label') || '')) {
      out.push({ x: 'cvec', rows: [...el.children].map(runsOf) });
    } else if (tag === 'span' && has(el, 'blank')) {
      out.push({ x: 'blank', answers: el.getAttribute('data-answers') || '' });
    } else if (tag === 'span' && curTags && (has(el, 'qtag-marks') || has(el, 'qtag-calc') || has(el, 'qtag-grade'))) {
      curTags[['qtag-marks', 'qtag-calc', 'qtag-grade'].find((c) => has(el, c)).slice(5)] = el.textContent.trim();
    } else if (tag === 'span' && has(el, 'chip')) {
      if (has(el, 'chip-higher')) out.push({ t: 'Higher', b: true, chip: true });
    } else if (tag === 'a' && has(el, 'qtag-from')) {
      if (curTags) curTags.from.push(el.getAttribute('href'));
    } else if (tag === 'a' && has(el, 'term')) {
      inline(el, { ...fmt, term: el.getAttribute('data-term') }, out);
    } else if (tag === 'a' && (el.getAttribute('href') || '').startsWith('#')) {
      inline(el, fmt, out); // a link within the page means nothing on paper: keep only its words
    } else if (tag === 'a') {
      out.push({ x: 'ref', href: el.getAttribute('href') || '', runs: runsOf(el) });
    } else if (tag === 'b' || tag === 'strong') {
      inline(el, { ...fmt, b: true }, out);
    } else if (tag === 'i' || tag === 'em') {
      inline(el, { ...fmt, i: true }, out);
    } else if (tag === 'sup') {
      inline(el, { ...fmt, sup: true }, out);
    } else if (tag === 'sub') {
      inline(el, { ...fmt, sub: true }, out);
    } else if (tag === 'code') {
      inline(el, { ...fmt, code: true }, out);
    } else if (tag === 'br') {
      out.push({ x: 'br' });
    } else if (tag === 'input' && el.closest('ul.checklist')) {
      // the tick box of an "I can..." list: the list draws its own
    } else if (tag === 'span' && (!el.className || has(el, 'kicker') || has(el, 'tier-tag') || has(el, 'muted') || has(el, 'qtag-paper'))) {
      inline(el, fmt, out);
    } else if (tag === 'label' && el.closest('ul.checklist')) {
      inline(el, fmt, out);
    } else {
      note(el, 'inline');
      inline(el, fmt, out);
    }
  }

  function flow(parent) {
    const blocks = [];
    let cur = [];
    const flush = () => {
      if (cur.some((r) => r.x || (r.t && r.t.trim()))) blocks.push({ t: 'p', runs: cur });
      cur = [];
    };
    for (const c of parent.childNodes) {
      if (c.nodeType === 3) {
        const s = c.nodeValue.replace(/\s+/g, ' ');
        if (s.trim() || cur.length) cur.push({ t: s });
      } else if (c.nodeType === 1) {
        if (tagOf(c) === 'summary') continue;
        if (BLOCK_TAGS.has(tagOf(c))) {
          flush();
          blocks.push(...block(c));
        } else {
          inlineEl(c, {}, cur);
        }
      }
    }
    flush();
    return blocks;
  }

  function list(el) {
    const tag = tagOf(el);
    const kind = LIST_KINDS.find((c) => has(el, c)) || '';
    if (el.className && !kind) note(el, 'block');
    const items = [...el.children].filter((c) => tagOf(c) === 'li' && !skip(c)).map((li) => flow(li));
    return { t: 'list', ordered: tag === 'ol', kind, items };
  }

  function table(el) {
    const caption = el.querySelector('caption');
    const rows = [...el.querySelectorAll('tr')].map((tr) => ({
      head: Boolean(tr.closest('thead')),
      cells: [...tr.children].filter((c) => /^t[dh]$/.test(tagOf(c))).map((c) => ({ th: tagOf(c) === 'th', colspan: Number(c.getAttribute('colspan') || 1), blocks: flow(c) })),
    }));
    return { t: 'table', caption: caption ? runsOf(caption) : null, rows };
  }

  function figure(el) {
    const svgs = [...el.querySelectorAll('svg')].filter((s) => !skip(s));
    if (!svgs.length) note(el, 'block');
    const figs = svgs.map((svg) => {
      figCount += 1;
      svg.setAttribute('data-print-fig', String(figCount));
      const r = svg.getBoundingClientRect();
      const desc = svg.querySelector('desc');
      const title = svg.querySelector('title');
      return { id: figCount, cssWidth: r.width, cssHeight: r.height, alt: (desc ? desc.textContent : title ? title.textContent : '').replace(/\s+/g, ' ').trim(), title: title ? title.textContent.replace(/\s+/g, ' ').trim() : '' };
    });
    const cap = el.querySelector('figcaption');
    return { t: 'fig', figs, caption: cap ? runsOf(cap) : null };
  }

  function question(el) {
    qIndex += 1;
    const qid = el.getAttribute('data-qid');
    if (qid && Number(qid.split('-').pop()) !== qIndex) unknown.push({ where: 'question number', tag: 'div', cls: 'q', text: `${qid} is question ${qIndex} in page order` });
    const type = el.getAttribute('data-type') || 'typed';
    const q = { t: 'q', n: qIndex, qid, type, answers: el.getAttribute('data-answers') || '', marks: Number(el.getAttribute('data-marks') || 0) || 0, body: [], options: [], ladder: [], wrong: [], solution: [], tags: { from: [] }, screenOnly: '' };
    if (!['typed', 'mc', 'show'].includes(type)) q.screenOnly = `question type "${type}"`;
    else if (el.querySelector('input, textarea, canvas, iframe, [draggable]')) q.screenOnly = 'has a form control or drag target';
    else if (getComputedStyle(el).display === 'none') q.screenOnly = 'hidden in print';
    curTags = q.tags;
    for (const c of el.children) {
      if (skip(c)) continue;
      const tag = tagOf(c);
      if (tag === 'ul' && has(c, 'options')) {
        q.options = [...c.children].filter((li) => tagOf(li) === 'li').map((li) => ({ runs: runsOf(li), correct: li.hasAttribute('data-correct'), why: li.getAttribute('data-why') || '' }));
      } else if (tag === 'ol' && has(c, 'ladder')) {
        q.ladder = [...c.children].filter((li) => tagOf(li) === 'li').map((li) => flow(li));
      } else if (tag === 'ul' && has(c, 'wrong')) {
        q.wrong = [...c.children].filter((li) => tagOf(li) === 'li').map((li) => ({ if: li.getAttribute('data-if') || '', runs: runsOf(li) }));
      } else if (tag === 'div' && has(c, 'solution')) {
        q.solution = flow(c);
      } else if (tag === 'p' && has(c, 'qtext')) {
        q.body.push({ t: 'qtext', runs: runsOf(c) });
      } else if (BLOCK_TAGS.has(tag)) {
        q.body.push(...block(c));
      } else {
        const runs = [];
        inlineEl(c, {}, runs);
        if (runs.length) q.body.push({ t: 'p', runs });
      }
    }
    curTags = null;
    return q;
  }

  function block(el) {
    const tag = tagOf(el);
    if (has(el, 'q') && tag === 'div') return [question(el)];
    if (skip(el)) return [];
    if (el.hasAttribute('data-print')) {
      const text = el.getAttribute('data-print');
      return text ? [{ t: 'p', cls: '', runs: [{ t: text }] }] : [];
    }
    if (/^h[1-6]$/.test(tag)) return [{ t: 'h', level: Number(tag[1]), id: el.id, runs: runsOf(el) }];
    if (tag === 'p') {
      if (el.className && !P_KINDS.some((c) => has(el, c))) note(el, 'block');
      return [{ t: 'p', cls: P_KINDS.find((c) => has(el, c)) || '', runs: runsOf(el) }];
    }
    if (tag === 'ul' || tag === 'ol') return [list(el)];
    if (tag === 'dl') {
      const items = [];
      for (const c of el.children) {
        if (tagOf(c) === 'dt') items.push({ term: runsOf(c), def: [] });
        else if (tagOf(c) === 'dd' && items.length) items[items.length - 1].def.push(...flow(c));
        else note(c, 'block');
      }
      return [{ t: 'dl', items }];
    }
    if (tag === 'table') return [table(el)];
    if (tag === 'figure') return [figure(el)];
    if (tag === 'hr') return [{ t: 'hr' }];
    if (tag === 'details') {
      const summary = el.querySelector(':scope > summary');
      if (has(el, 'check-line')) return [{ t: 'check', blocks: flow(el) }];
      if (has(el, 'recap')) return [{ t: 'recap', title: summary ? runsOf(summary) : [], blocks: flow(el) }];
      note(el, 'block');
      return flow(el);
    }
    if (tag === 'aside') {
      const kind = ['bys', 'words-strip'].find((c) => has(el, c)) || '';
      if (!kind) note(el, 'block');
      return [{ t: 'box', kind: kind === 'bys' ? (has(el, 'unlocks') ? 'unlocks' : 'bys') : 'words', blocks: flow(el) }];
    }
    if (tag === 'section') {
      const kind = SECTION_KINDS.find((c) => has(el, c)) || '';
      if (el.className && !kind) note(el, 'block');
      return [{ t: 'section', kind, blocks: flow(el) }];
    }
    if (tag === 'div') {
      if (has(el, 'worked')) return [{ t: 'box', kind: has(el, 'faded') ? 'faded' : 'worked', blocks: flow(el) }];
      if (has(el, 'key')) return [{ t: 'box', kind: 'key', blocks: flow(el) }];
      if (el.className && !TRANSPARENT_DIV.some((c) => has(el, c))) note(el, 'block');
      return flow(el);
    }
    note(el, 'block');
    return flow(el);
  }

  const main = document.querySelector('main');
  const h1 = main.querySelector('h1');
  return { title: h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '', blocks: flow(main), unknown, qCount: qIndex, figCount };
})
