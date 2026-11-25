// Interactive layer for the GCSE book. The pages read fine without it (hints
// and answers simply show in full); this upgrades each question with an answer
// box, a "Help, I'm stuck!" ladder, specific feedback and saved ticks.
//
// Privacy: progress lives in this browser's localStorage only. Nothing is sent
// anywhere, and every storage call is wrapped because storage can be blocked.
import { matches, rightValueWrongForm, splitList, diagnose, feedbackOrDefault, decimalCommaTip } from './book-answer.mjs?m=39';
import { review, isDue, sanitize } from './book-queue.mjs?m=39';
import { rankVoice, bestVoice, voiceLabel } from './book-voice.mjs?m=39';
import { splitSentences } from './book-speech.mjs?m=41';
import { unitText, playClip, stopClip } from './book-audio.mjs?m=40';
import { enhanceFaded } from './book-blanks.mjs?m=39';
import { calcAllowed, layoutFor, createCalculator } from './book-calc.mjs?m=39';
import { parseRanges, rangeBanner } from './book-ranges.mjs?m=39';
import { isReviewMode, annotateForReview, startReviewMode } from './book-review.mjs?m=39';

const REVIEW = isReviewMode(window.location.search);

const STORE_KEY = 'wm-gcse-v1';
const CHEERS = ['Yes!', 'Spot on.', 'Nailed it.', 'Correct.', 'That is it.', 'Right, nice work.'];
const NUDGES = [
  'Not this one yet. Have another go.',
  'Not yet. A clue is there if you want one.',
  'A clue might help. Or write down what you know so far: that often shows what is wrong.',
];

// ---------- saved progress ----------

function load() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    const plain = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
    if (data && typeof data === 'object') return { done: plain(data.done), ticks: plain(data.ticks), days: Array.isArray(data.days) ? data.days : [], rq: sanitize(data.rq), diag: Array.isArray(data.diag) ? data.diag.filter((r) => r && Number.isFinite(r.score) && Number.isFinite(r.total) && r.total > 0).slice(-20) : [], marks: cleanMarks(data.marks) };
  } catch { /* storage unavailable: carry on without saving */ }
  return { done: {}, ticks: {}, days: [], rq: {}, diag: [], marks: {} };
}

// Marks you gave yourself on mark schemes: { questionId: [earned, available] }. Plain numbers only.
function cleanMarks(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (/^[a-z0-9-]{1,60}$/.test(k) && Array.isArray(v) && v.length === 2 && v.every(Number.isFinite) && v[1] > 0 && v[1] <= 20 && v[0] >= 0 && v[0] <= v[1]) out[k] = [v[0], v[1]];
  }
  return out;
}

let store = load();

function save() {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

// ---------- helpers ----------

const el = (tag, attrs = {}, ...kids) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const kid of kids) node.append(kid);
  return node;
};

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

const hashOf = (text) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
let uid = 0;

function pageKey() {
  const body = document.querySelector('[data-book-page]');
  return body?.dataset.topic ?? body?.dataset.bookPage ?? 'page';
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function markDone(qid, clean = false) {
  let changed = false;
  store.rq[qid] = review(store.rq[qid], clean, today());
  changed = true;
  if (!store.done[qid]) {
    store.done[qid] = 1;
    changed = true;
  }
  if (!store.days.includes(today())) {
    store.days.push(today());
    changed = true;
  }
  if (changed) save();
  updateProgress();
}

// ---------- the "think it through" clue ----------
// Putting a problem into words (typed, written or said quietly) often unsticks you.
// What is typed here stays on screen: it is never stored or sent anywhere.

function duckRung(li, q) {
  li.className = 'duck-rung';
  li.innerHTML = '<div class="duck-body-text"><p class="duck-title"><b>Think it through</b> <span class="muted">(optional)</span></p>'
    + '<p>Type what you know so far, even half an answer.</p>'
    + '<p>Write it on paper (or say it quietly in your head). Putting it into words often shows the next step.</p></div>';
  const starts = ['The question asks me to find\u2026', 'I already know\u2026', 'I tried\u2026 and then\u2026', 'I got stuck when\u2026'];
  const chips = el('div', { class: 'duck-chips', role: 'group', 'aria-label': 'Sentence starters' });
  const area = el('textarea', {
    class: 'duck-text', rows: '3', maxlength: '600', 'aria-label': 'What you know so far', placeholder: 'Type what you know so far, even half an answer',
  });
  for (const start of starts) {
    const chip = el('button', { type: 'button', class: 'duck-chip', text: start });
    chip.addEventListener('click', () => {
      const lineBreak = String.fromCharCode(10);
      area.value += (area.value && !area.value.endsWith(lineBreak) ? lineBreak : '') + start.replace('\u2026', ' ');
      area.focus();
    });
    chips.append(chip);
  }
  const note = el('p', { class: 'muted duck-note', text: 'What you type stays on this screen. It is not saved or sent anywhere.' });
  const done = el('button', { type: 'button', class: 'btn-check', text: 'Done: let me try again' });
  done.addEventListener('click', () => {
    area.value = '';
    q.querySelector('.q-input, .mc-option')?.focus();
  });
  const typed = el('details', { class: 'duck-typed' }, el('summary', { text: 'Type it here' }), chips, area, note);
  li.querySelector('.duck-body-text').append(typed, done);
}

// ---------- questions ----------

export function enhanceQuestion(q, index) {
  // Reviewer mode (?review=1): leave the question as plain markup so every hint and answer shows.
  if (REVIEW) {
    annotateForReview(q);
    return;
  }
  const qid = q.dataset.qid ?? `${pageKey()}-${index + 1}`;
  q.dataset.qid = qid;
  q.classList.add('q-live');
  q.setAttribute('role', 'group');
  const qtextNode = q.querySelector(':scope > .qtext');
  if (qtextNode) {
    qtextNode.id = qtextNode.id || `qt-${(uid += 1)}`;
    q.setAttribute('aria-labelledby', qtextNode.id);
  }

  const ladder = q.querySelector(':scope > ol.ladder');
  const solution = q.querySelector(':scope > .solution');
  const wrongBox = q.querySelector(':scope > ul.wrong');
  const optionList = q.querySelector(':scope > ul.options');
  const text = q.querySelector(':scope > .qtext');
  // "Type it like ..." tells a screen user how to enter the answer; on paper it is only noise, so it is marked to be left out of a worksheet.
  if (text && !text.querySelector('.type-hint')) {
    const html = text.innerHTML;
    const marked = html.replace(/Type it like [^<]*?\.(?=\s|$|<)/, (hint) => `<span class="type-hint">${hint}</span>`);
    if (marked !== html) text.innerHTML = marked;
  }
  const number = el('span', { class: 'qnum', 'aria-hidden': 'true', text: String(index + 1) });
  text?.prepend(number);

  const feedback = el('div', { class: 'q-feedback', role: 'status', 'aria-live': 'polite' });
  const rungs = ladder ? [...ladder.children].map((li) => li.innerHTML) : [];
  if ((ladder?.children.length ?? 0) > 1) rungs.push({ duck: true });
  rungs.push('Still stuck? Show a friend, or take a photo of the question to show your teacher. Everyone gets stuck, and a person can often unstick you in a minute.');
  let rungsShown = 0;
  let wrongCount = 0;
  let solved = false;

  const help = el('div', { class: 'q-help' });
  const hintList = el('ol', { class: 'rungs', 'aria-live': 'polite' });
  const helpBtn = el('button', { type: 'button', class: 'btn-stuck', text: 'Give me a clue' });
  help.append(helpBtn, hintList);

  function showSolution() {
    if (solution) solution.classList.add('open');
  }

  function revealRung() {
    if (rungsShown < rungs.length) {
      const li = el('li');
      const rung = rungs[rungsShown];
      const asking = typeof rung === 'string' && rung.startsWith('Still stuck?');
      if (typeof rung === 'object') duckRung(li, q);
      else {
        li.innerHTML = rung;
        if (asking) li.className = 'ask-rung';
      }
      // The letter is drawn by CSS for sighted readers; this is the same words for a screen reader ("Clue A").
      if (!asking) li.prepend(el('span', { class: 'sr-only', text: `Clue ${String.fromCharCode(65 + rungsShown)}: ` }));
      hintList.append(li);
      rungsShown += 1;
    }
    if (rungsShown >= rungs.length) {
      helpBtn.textContent = solution && !solved ? 'Show me the answer' : 'No more hints';
      helpBtn.dataset.final = '1';
      if (!solution || solved) helpBtn.disabled = true;
    } else {
      helpBtn.textContent = 'Another clue';
    }
  }

  helpBtn.addEventListener('click', () => {
    if (helpBtn.dataset.final) {
      showSolution();
      helpBtn.disabled = true;
      if (solution) {
        solution.setAttribute('tabindex', '-1');
        solution.focus({ preventScroll: false });
      }
      return;
    }
    revealRung();
  });

  // Mark scheme with tick boxes: the student ticks each mark they earned. Counted on screen only.
  function addSelfMarking() {
    const items = [...(solution?.querySelectorAll('ul.markscheme > li') ?? [])];
    if (items.length === 0) return;
    const total = el('p', { class: 'mark-total', role: 'status', 'aria-live': 'polite', text: `Tick each mark you earned. Marks: 0 of ${items.length}.` });
    const boxes = items.map((li, i) => {
      const box = el('input', { type: 'checkbox', class: 'mark-box', 'aria-label': `I earned mark ${i + 1} of ${items.length}` });
      li.prepend(box, ' ');
      return box;
    });
    const update = () => {
      const n = boxes.filter((x) => x.checked).length;
      store.marks[qid] = [n, items.length];
      save();
      total.textContent = `Marks: ${n} of ${items.length}.${n === items.length ? ' Full marks!' : n >= items.length - 1 ? ' So close: look at the mark you missed.' : ''}`;
      if (n === items.length && !solved) {
        solved = true;
        q.classList.add('q-correct');
        markDone(qid, wrongCount === 0 && rungsShown === 0);
      }
    };
    boxes.forEach((x) => x.addEventListener('change', update));
    solution.append(total);
  }

  // Clear then set, so a screen reader announces the same message again if the student repeats a slip.
  function say(cls, text, html) {
    feedback.className = 'q-feedback';
    feedback.textContent = '';
    setTimeout(() => {
      feedback.className = cls;
      if (html) feedback.innerHTML = html;
      else feedback.textContent = text;
    }, 40);
  }

  function success() {
    solved = true;
    q.classList.add('q-correct');
    q.dispatchEvent(new CustomEvent('wm-solved', { bubbles: true }));
    say('q-feedback ok', `${CHEERS[hashOf(qid) % CHEERS.length]} The worked solution is below.`);
    showSolution();
    markDone(qid, wrongCount === 0 && rungsShown === 0);
    setDoneBanner(q);
    // Keep Help available after a right answer, and start the hints again from Hint A.
    hintList.replaceChildren();
    rungsShown = 0;
    delete helpBtn.dataset.final;
    helpBtn.disabled = false;
    helpBtn.textContent = 'Another way to see it';
  }

  function failure(message, html) {
    wrongCount += 1;
    q.classList.add('q-tried');
    // An empty message (nothing specific to say) still gets a nudge, so a wrong answer is never met with silence.
    say('q-feedback oops', message || NUDGES[Math.min(wrongCount - 1, NUDGES.length - 1)], html);
  }

  // The value is right but the form is not what was asked for: not a mistake, so no cross.
  function nearly(messageHtml) {
    q.classList.add('q-tried');
    say('q-feedback nearly', '', messageHtml);
  }

  if (q.dataset.type === 'mc' && optionList) {
    const source = [...optionList.children];
    const items = shuffle([...source]);
    const group = el('div', { class: 'mc', role: 'group', 'aria-label': `Choose one answer for question ${index + 1}` });
    for (const li of items) {
      const correct = li.hasAttribute('data-correct');
      const why = li.dataset.why;
      const btn = el('button', { type: 'button', class: 'mc-option' });
      btn.innerHTML = li.innerHTML;
      // On screen the options are shuffled; a printed worksheet lists them in the written order, lettered A, B, C, D.
      const at = source.indexOf(li);
      btn.dataset.letter = String.fromCharCode(65 + at);
      btn.style.setProperty('--src', String(at));
      btn.addEventListener('click', () => {
        if (solved) return;
        if (correct) {
          btn.classList.add('is-right');
          success();
          group.querySelectorAll('.mc-option').forEach((o) => o.setAttribute('aria-disabled', 'true'));
        } else {
          btn.classList.add('is-wrong');
          btn.setAttribute('aria-disabled', 'true');
          btn.append(el('span', { class: 'sr-only', text: ' (incorrect)' }));
          failure(why ?? NUDGES[Math.min(wrongCount, NUDGES.length - 1)]);
        }
      });
      group.append(btn);
    }
    optionList.after(group);
    group.after(feedback);
  } else if (q.dataset.type === 'show') {
    // "Show that" / explain questions: written on paper, then marked against the mark scheme. Nothing typed, nothing stored.
    const reveal = el('button', { type: 'button', class: 'btn-check', text: 'I have written my answer: show me the mark scheme' });
    reveal.addEventListener('click', (event) => {
      showSolution();
      reveal.disabled = true;
      // A real press (not the timed set marking everything at once): move to the mark scheme and say what to do.
      if (event.isTrusted && solution) {
        solution.setAttribute('tabindex', '-1');
        solution.focus({ preventScroll: false });
        say('q-feedback', 'Mark scheme shown. Tick each mark you earned.');
      }
    });
    (q.querySelector(':scope > .qfig') ?? text ?? q).after(reveal);
    reveal.after(feedback);
  } else {
    const answers = splitList(q.dataset.answers);
    const mode = q.dataset.mode === 'exact' ? 'exact' : 'value';
    const wrongs = wrongBox
      ? [...wrongBox.children].map((li) => ({ list: splitList(li.dataset.if), message: li.innerHTML }))
      : [];
    const inputId = `ans-${(uid += 1)}`;
    // Number-only answers get the number pad on a phone; the symbol row below gives minus, fraction bar, point and percent.
    const numeric = answers.every((a) => /^[0-9.,]+$/.test(a));
    const input = el('input', {
      id: inputId, type: 'text', class: 'q-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'done', maxlength: '60',
      ...(numeric ? { inputmode: 'decimal' } : {}),
    });
    const symbols = el('div', { class: 'sym-row', role: 'group', 'aria-label': 'Symbol keys' });
    const symbolList = [['-', 'minus'], ['/', 'fraction bar'], ['.', 'decimal point'], ['%', 'percent']];
    if (answers.some((a) => a.includes('^'))) symbolList.push(['^', 'power']);
    if (answers.some((a) => a.includes(':'))) symbolList.push([':', 'colon']);
    for (const [ch, name] of symbolList) {
      const b = el('button', { type: 'button', class: 'sym-btn', text: ch, 'aria-label': `Type ${name}`, tabindex: '-1' });
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => {
        const at = input.selectionStart ?? input.value.length;
        input.setRangeText(ch, at, input.selectionEnd ?? at, 'end');
        input.focus();
      });
      symbols.append(b);
    }
    input.addEventListener('focus', () => {
      if (window.matchMedia('(max-width: 640px)').matches) setTimeout(() => input.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
    });
    const label = el('label', { class: 'sr-only', for: inputId, text: `Your answer to question ${index + 1}` });
    const check = el('button', { type: 'submit', class: 'btn-check', text: 'Check' });
    const form = el('form', { class: 'q-form', novalidate: '' }, label, input, check, symbols);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (solved) return;
      const value = input.value;
      if (value.trim() === '') {
        say('q-feedback oops', 'Type an answer first.');
        return;
      }
      // The question and its worked solution tell the checker which units are sensible (a typed "60 km" is not right for metres).
      const unitContext = `${text?.textContent ?? ''} ${solution?.textContent ?? ''}`;
      if (matches(value, answers, mode, unitContext)) {
        input.readOnly = true;
        success();
        const commaTip = decimalCommaTip(value, answers);
        if (commaTip) feedback.append(` ${commaTip}`);
        return;
      }
      const specific = wrongs.find((w) => matches(value, w.list, mode));
      const rightValue = mode === 'exact' && rightValueWrongForm(value, answers);
      if (rightValue) {
        nearly(specific ? specific.message : 'Right value! The question wants it in a different form (for example, fully simplified). One more step.');
      } else if (specific) {
        failure(null, specific.message);
      } else {
        failure(feedbackOrDefault(value, answers, unitContext));
      }
    });
    (q.querySelector(':scope > .qfig') ?? text ?? q).after(form);
    form.after(feedback);
  }

  feedback.after(help);
  if (solution) help.after(solution);
  // A calculator only where the question allows one (its tag, or data-calc); non-calculator questions never get the button.
  if (calcAllowed(q)) feedback.after(createCalculator(layoutFor(q)).root);
  addSelfMarking();
  ladder?.remove();
  wrongBox?.remove();
  optionList?.remove();

  if (store.done[qid]) q.classList.add('q-was-done');
}

// ---------- progress ----------

function updateProgress() {
  const key = pageKey();
  const line = document.querySelector('[data-topic-progress]');
  if (line) {
    const qs = [...document.querySelectorAll('.q')];
    const got = qs.filter((q) => store.done[q.dataset.qid]).length;
    line.innerHTML = '';
    const bar = el('span', { class: 'bar', role: 'img', 'aria-label': `${got} of ${qs.length} questions finished` });
    bar.append(el('span', { class: 'bar-fill', style: `width:${qs.length ? Math.round((got / qs.length) * 100) : 0}%` }));
    line.append(bar, el('span', { text: ` You have finished ${got} of ${qs.length} questions on this page.` }));
  }
  for (const node of document.querySelectorAll('[data-progress-for]')) {
    const id = node.dataset.progressFor;
    const total = Number(node.dataset.total);
    const got = Object.keys(store.done).filter((k) => k.startsWith(`${id}-`)).length;
    node.textContent = got > 0 ? `${got} of ${total} done` : `${total} questions`;
    node.classList.toggle('has-progress', got > 0);
  }
  return key;
}

// ---------- tick lists ----------

function enhanceChecklists() {
  for (const list of document.querySelectorAll('[data-checklist]')) {
    const id = list.dataset.checklist;
    const saved = store.ticks[id] ?? [];
    [...list.querySelectorAll('input[type="checkbox"]')].forEach((box, i) => {
      box.checked = Boolean(saved[i]);
      box.addEventListener('change', () => {
        const state = [...list.querySelectorAll('input[type="checkbox"]')].map((b) => b.checked);
        store.ticks[id] = state;
        save();
      });
    });
  }
}

// ---------- terms: tap a teal word for its meaning ----------

function enhanceTerms() {
  let open = null;
  let hideTimer = null;
  const close = () => {
    clearTimeout(hideTimer);
    if (open) {
      open.pop.remove();
      open.link.removeAttribute('aria-describedby');
      open = null;
    }
  };
  const scheduleHide = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(close, 250);
  };
  const show = (link, moveFocus) => {
    clearTimeout(hideTimer);
    if (open && open.link === link) {
      if (moveFocus) open.pop.querySelector('.term-pop-more')?.focus({ preventScroll: true });
      return;
    }
    close();
    const id = `pop-${(uid += 1)}`;
    const pop = el('span', { class: 'term-pop', id, role: 'note' });
    const def = el('span', { class: 'term-pop-def' });
    def.innerHTML = link.dataset.def ?? '';
    pop.append(def);
    const fig = link.dataset.term ? document.querySelector(`[data-term-figure="${link.dataset.term}"]`) : null;
    if (fig) {
      const box = el('span', { class: 'term-pop-fig' });
      box.innerHTML = fig.innerHTML;
      pop.append(box);
    }
    const more = el('a', { class: 'term-pop-more', href: link.getAttribute('href'), text: 'Full entry in the glossary \u2192' });
    pop.append(more);
    pop.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    pop.addEventListener('mouseleave', scheduleHide);
    document.body.append(pop);
    const rect = link.getBoundingClientRect();
    const width = Math.min(pop.offsetWidth, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    pop.style.left = `${left + window.scrollX}px`;
    pop.style.top = `${rect.bottom + window.scrollY + 6}px`;
    link.setAttribute('aria-describedby', id);
    if (moveFocus) more.focus({ preventScroll: true });
    open = { link, pop, scrollY: window.scrollY, width: window.innerWidth };
  };

  const canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  if (canHover) {
    document.addEventListener('mouseover', (event) => {
      const link = event.target instanceof Element ? event.target.closest('a.term') : null;
      if (link) show(link, false);
    });
    document.addEventListener('mouseout', (event) => {
      const link = event.target instanceof Element ? event.target.closest('a.term') : null;
      if (link) scheduleHide();
    });
  }
  let quiet = false; // true while focus is handed back after Escape, so the pop-up does not reopen
  document.addEventListener('focusin', (event) => {
    if (quiet) return;
    const link = event.target instanceof Element ? event.target.closest('a.term') : null;
    if (link) show(link, false);
  });
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a.term') : null;
    if (!link) {
      if (!(event.target instanceof Element) || !event.target.closest('.term-pop')) close();
      return;
    }
    event.preventDefault();
    // A mouse or touch click on an open pop-up closes it; the keyboard (Enter) moves into it instead.
    if (event.detail !== 0 && open && open.link === link && open.moved) { close(); return; }
    show(link, true);
    if (open) open.moved = true;
  });
  // Close after a real scroll (not the small nudge that comes from opening it).
  window.addEventListener('scroll', () => {
    const focusInside = document.activeElement && (document.activeElement === open?.link || document.activeElement.closest?.('.term-pop'));
    if (open && !focusInside && Math.abs(window.scrollY - open.scrollY) > 120) close();
  }, { passive: true });
  window.addEventListener('resize', () => { if (open && window.innerWidth !== open.width) close(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) {
      const { link } = open;
      close();
      quiet = true;
      link.focus();
      quiet = false;
    }
  });
}

// ---------- glossary page ----------

function enhanceGlossary() {
  const filter = document.querySelector('[data-glossary-filter]');
  const search = document.querySelector('[data-glossary-search]');
  const status = document.querySelector('[data-glossary-status]');
  if (!filter || !search) return;
  const entries = [...document.querySelectorAll('.g-entry')];
  // The two boxes on this page do different jobs, so they are named differently (the header box searches the whole book).
  const label = document.querySelector(`label[for="${search.id}"]`);
  if (label) label.textContent = 'Find a word in this glossary';
  // The same forgiving matching as the header search (typos, plurals, other names), loaded the first time it is needed.
  const terms = entries.map((e) => ({ t: e.querySelector('h3').firstChild.textContent.trim(), u: e.id, k: 'Term' }));
  let find = null;
  let finderRequested = false;
  const loadFinder = () => {
    if (finderRequested) return;
    finderRequested = true;
    import('./book-search.mjs?m=2').then((m) => { find = m.searchIndex; apply(); }, () => {});
  };
  const apply = () => {
    const strand = filter.value;
    const query = search.value.trim().toLowerCase();
    if (query) loadFinder();
    const similar = find && query ? new Set(find(query, terms, terms.length).map((t) => t.u)) : null;
    let shown = 0;
    for (const entry of entries) {
      const okStrand = strand === 'all' || entry.dataset.strand === strand;
      const okText = query === '' || entry.textContent.toLowerCase().includes(query) || (similar?.has(entry.id) ?? false);
      const visible = okStrand && okText;
      entry.hidden = !visible;
      if (visible) shown += 1;
    }
    for (const group of document.querySelectorAll('.g-letter')) {
      group.hidden = ![...group.querySelectorAll('.g-entry')].some((e) => !e.hidden);
    }
    status.textContent = `Showing ${shown} of ${entries.length} terms.`;
  };
  filter.addEventListener('change', apply);
  search.addEventListener('input', apply);
  search.addEventListener('focus', loadFinder, { once: true });
  apply();
}


// ---------- reading options ----------
// Size, an easy-read font stack, a tinted page and a reading ruler. Saved on this device only.

const READ_KEY = 'wm-gcse-read';

function loadRead() {
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    const d = raw ? JSON.parse(raw) : {};
    return {
      size: Math.min(3, Math.max(0, Number(d.size) || 0)), easy: Boolean(d.easy), tint: Boolean(d.tint), ruler: Boolean(d.ruler), nolisten: Boolean(d.nolisten),
      voice: typeof d.voice === 'string' ? d.voice : '', rate: [0.8, 0.92, 1.05].includes(Number(d.rate)) ? Number(d.rate) : 0.92,
    };
  } catch { return { size: 0, easy: false, tint: false, ruler: false, nolisten: false, voice: '', rate: 0.92 }; }
}

function applyRead(prefs) {
  const c = document.documentElement.classList;
  for (const n of [1, 2, 3]) c.remove(`read-big${n}`);
  if (prefs.size) c.add(`read-big${prefs.size}`);
  c.toggle('read-easy', prefs.easy);
  c.toggle('read-tint', prefs.tint);
  c.toggle('read-ruler-on', prefs.ruler);
  c.toggle('read-nolisten', prefs.nolisten);
}

function initReadingTools() {
  const main = document.querySelector('main.book');
  if (!main) return;
  const prefs = loadRead();
  applyRead(prefs);
  let sizeLabelNode = null;
  const persist = () => {
    try { window.localStorage.setItem(READ_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
    applyRead(prefs);
    if (sizeLabelNode) sizeLabelNode.textContent = `Text size ${prefs.size + 1} of 4`;
  };

  const details = el('details', { class: 'read-tools' });
  details.append(el('summary', { text: 'Reading options' }));
  const row = el('div', { class: 'read-row' });
  const smaller = el('button', { type: 'button', class: 'read-btn', 'aria-label': 'A\u2212, smaller text', text: 'A\u2212' });
  const bigger = el('button', { type: 'button', class: 'read-btn', 'aria-label': 'A+, bigger text', text: 'A+' });
  smaller.addEventListener('click', () => { prefs.size = Math.max(0, prefs.size - 1); persist(); });
  bigger.addEventListener('click', () => { prefs.size = Math.min(3, prefs.size + 1); persist(); });
  row.append(smaller, bigger);
  const toggle = (key, label) => {
    const b = el('button', { type: 'button', class: 'read-btn', 'aria-pressed': String(prefs[key]), text: label });
    b.addEventListener('click', () => {
      prefs[key] = !prefs[key];
      b.setAttribute('aria-pressed', String(prefs[key]));
      persist();
    });
    return b;
  };
  row.append(toggle('easy', 'Easy-read font'), toggle('tint', 'Tinted page'), toggle('ruler', 'Reading ruler'));
  // For anyone who never uses Listen, or finds the buttons a distraction: hide them everywhere.
  if ('speechSynthesis' in window) {
    const hideListen = toggle('nolisten', 'Hide the Listen buttons');
    hideListen.addEventListener('click', () => { if (prefs.nolisten) stopListening(); });
    row.append(hideListen);
  }
  const sizeLabel = el('span', { class: 'read-size', 'aria-live': 'polite', text: `Text size ${prefs.size + 1} of 4` });
  const reset = el('button', { type: 'button', class: 'read-btn read-reset', text: 'Reset' });
  reset.addEventListener('click', () => {
    Object.assign(prefs, { size: 0, easy: false, tint: false, ruler: false, nolisten: false, voice: '', rate: 0.92 });
    row.querySelectorAll('[aria-pressed]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    persist();
  });
  if ('speechSynthesis' in window) {
    const voiceField = el('label', { class: 'read-select', text: 'Voice ' });
    const voiceSelect = el('select', { 'aria-label': 'Voice for Listen' });
    const fillVoices = () => {
      const voices = window.speechSynthesis.getVoices().filter((v) => rankVoice(v) >= 0).sort((a, b) => rankVoice(b) - rankVoice(a));
      voiceSelect.replaceChildren(el('option', { value: '', text: 'Best on this device' }), ...voices.map((v) => {
        const o = el('option', { value: v.name, text: voiceLabel(v) });
        if (v.name === prefs.voice) o.selected = true;
        return o;
      }));
    };
    fillVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', fillVoices);
    voiceSelect.addEventListener('change', () => { prefs.voice = voiceSelect.value; persist(); });
    voiceField.append(voiceSelect);
    const rateLabel = el('label', { class: 'read-select', text: 'Speed ' });
    const rateSelect = el('select', { 'aria-label': 'Speed for Listen' });
    for (const [value, label] of [[0.8, 'Slow'], [0.92, 'Normal'], [1.05, 'Fast']]) {
      const o = el('option', { value: String(value), text: label });
      if (value === prefs.rate) o.selected = true;
      rateSelect.append(o);
    }
    rateSelect.addEventListener('change', () => { prefs.rate = Number(rateSelect.value); persist(); });
    rateLabel.append(rateSelect);
    row.append(voiceField, rateLabel);
  }
  row.append(sizeLabel, reset);
  sizeLabelNode = sizeLabel;
  details.append(row);
  const firstSection = main.querySelector('section');
  if (firstSection) firstSection.after(details); else main.prepend(details);
  initToc(main, details);

  const ruler = el('div', { class: 'read-ruler', 'aria-hidden': 'true' });
  document.body.append(ruler);
  const move = (y) => { ruler.style.top = `${y - ruler.offsetHeight / 2}px`; };
  window.addEventListener('mousemove', (e) => move(e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => { if (e.touches[0]) move(e.touches[0].clientY); }, { passive: true });
}

// ---------- on this page, and back to top ----------

function initToc(main, after) {
  const kind = main.dataset.bookPage;
  if (kind !== 'topic' && kind !== 'grades') return;
  const heads = [...main.querySelectorAll('section h2')].filter((h) => !h.closest('.bys, .words-strip, .ckw .q'));
  if (heads.length < 4) return;
  const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const used = new Set([...document.querySelectorAll('[id]')].map((n) => n.id));
  const list = el('ol');
  heads.forEach((h, i) => {
    if (!h.id) {
      let id = slug(h.textContent) || `part-${i + 1}`;
      while (used.has(id)) id += '-x';
      used.add(id);
      h.id = id;
    }
    const li = el('li');
    li.append(el('a', { href: `#${h.id}`, text: h.textContent.replace(/^\u270E\s*/, '').trim() }));
    list.append(li);
  });
  const toc = el('details', { class: 'toc' });
  toc.append(el('summary', { text: 'On this page' }), list);
  after.after(toc);
  if (kind === 'topic') addFastRoute(main, toc);

  const top = el('button', { type: 'button', class: 'to-top', 'aria-label': 'Back to top', text: 'Top \u2191' });
  top.hidden = true;
  top.addEventListener('click', () => {
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    document.querySelector('main')?.focus({ preventScroll: true });
  });
  document.body.append(top);
  // On a phone, fade the button while it would sit on top of a clue or a message, so no text is ever hidden by it.
  const dodge = () => {
    if (top.hidden || !window.matchMedia('(max-width: 640px)').matches) { top.classList.remove('top-fade'); return; }
    const t = top.getBoundingClientRect();
    const covers = [...document.querySelectorAll('.rungs li, .q-feedback.oops, .q-feedback.nearly')].some((n) => {
      const r = n.getBoundingClientRect();
      return r.width > 0 && r.bottom > t.top && r.top < t.bottom && r.right > t.left && r.left < t.right;
    });
    top.classList.toggle('top-fade', covers);
  };
  let dodgeQueued = false;
  const queueDodge = () => { if (!dodgeQueued) { dodgeQueued = true; window.requestAnimationFrame(() => { dodgeQueued = false; dodge(); }); } };
  window.addEventListener('scroll', () => { top.hidden = window.scrollY < 1200; queueDodge(); }, { passive: true });
  document.addEventListener('click', () => setTimeout(queueDodge, 60));
  document.addEventListener('focusin', (e) => { top.classList.toggle('top-away', Boolean(e.target.matches?.('.q-input, .duck-text, .timed-filter'))); });
  document.addEventListener('focusout', () => top.classList.remove('top-away'));
}

// A short bar for students who already know the basics: jump to the hard parts, or fold away the recaps and check sets.
function addFastRoute(main, after) {
  const find = (re) => [...main.querySelectorAll('section h2')].find((h) => re.test(h.textContent));
  find(/^Going further/i)?.closest('section')?.classList.add('going-further');
  find(/^Warm-up/i)?.closest('section')?.classList.add('warmup-sec');
  const bar = el('div', { class: 'fast-route', role: 'group', 'aria-label': 'Fast route for confident students' });
  bar.append(el('span', { class: 'fast-label', text: 'Know the basics?' }));
  for (const [re, label] of [[/^Exam style/i, 'Jump to exam style'], [/^Going further/i, 'Jump to going further'], [/^I can/i, 'Jump to the checklist']]) {
    const h = find(re);
    if (h && h.id) bar.append(el('a', { href: `#${h.id}`, class: 'fast-link', text: label }));
  }
  const FAST_KEY = 'wm-gcse-fast';
  const toggle = el('button', { type: 'button', class: 'fast-toggle', 'aria-pressed': 'false', text: 'Skip the basics' });
  const setFast = (on) => {
    main.classList.toggle('fast-route-on', on);
    toggle.setAttribute('aria-pressed', String(on));
    toggle.textContent = on ? 'Show everything again' : 'Skip the basics';
  };
  const announce = el('span', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
  toggle.addEventListener('click', () => {
    const on = !main.classList.contains('fast-route-on');
    setFast(on);
    try { window.localStorage.setItem(FAST_KEY, on ? '1' : '0'); } catch { /* storage may be unavailable */ }
    announce.textContent = on ? 'Showing only the harder parts.' : 'Showing everything.';
    // Skipping the basics lands you on the exam-style questions, so the page does not just go quiet under your feet.
    const exam = find(/^Exam style/i);
    if (on && exam) {
      const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      exam.setAttribute('tabindex', '-1');
      exam.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' });
      exam.focus({ preventScroll: true });
    }
  });
  try { if (window.localStorage.getItem(FAST_KEY) === '1') setFast(true); } catch { /* ignore */ }
  bar.append(toggle, announce);
  // Printing: questions only (a worksheet) or with the worked answers.
  const nameLine = el('p', { class: 'print-name', text: `Name: ____________________   Date: ____________   ${document.querySelector('h1')?.textContent ?? ''}` });
  main.prepend(nameLine);
  for (const [label, withAnswers] of [['Print worksheet (questions only)', false], ['Print with answers', true]]) {
    const btn = el('button', { type: 'button', class: 'fast-toggle', text: label });
    btn.addEventListener('click', () => {
      main.classList.toggle('print-answers', withAnswers);
      main.classList.toggle('print-sheet', !withAnswers);
      const done = () => { main.classList.remove('print-answers', 'print-sheet'); window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done);
      window.print();
    });
    bar.append(btn);
  }
  after.after(bar);
}

// ---------- listen (the browser's own voice; nothing is sent anywhere) ----------

// Only voices that run on this device are used unless the student picks an online one (see book-voice.mjs).
// Returns true when the browser voice started; `onEnd` runs when it finishes (or fails).
function speak(text, onEnd = () => {}) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const prefs = loadRead();
  const voice = bestVoice(window.speechSynthesis.getVoices(), prefs.voice);
  // No on-device voice: say nothing rather than let the browser pick one, which may be an online voice that sends the text away.
  if (!voice) return false;
  // Short sentences in turn sound more natural and avoid the browser cutting off long text.
  const sentences = splitSentences(text);
  sentences.forEach(({ text: sentence, question }, i) => {
    const u = new window.SpeechSynthesisUtterance(sentence);
    u.lang = voice?.lang ?? 'en-GB';
    if (voice) u.voice = voice;
    u.rate = prefs.rate;
    // A question lifts at the end (voices do this for a "?"); a touch more pitch helps flat voices.
    u.pitch = question ? 1.1 : 1;
    if (i === sentences.length - 1) { u.onend = onEnd; u.onerror = onEnd; }
    synth.speak(u);
  });
  return sentences.length > 0;
}

// One Listen button at a time: { btn, id } for the one that is loading or playing, so presses never overlap.
let listening = null;
let listenCounter = 0;

function listenState(btn, state) {
  const label = btn.dataset.label;
  btn.classList.toggle('is-playing', state === 'playing');
  btn.setAttribute('aria-pressed', String(state === 'playing'));
  if (state === 'loading') { btn.setAttribute('aria-busy', 'true'); btn.setAttribute('aria-disabled', 'true'); } else { btn.removeAttribute('aria-busy'); btn.removeAttribute('aria-disabled'); }
  if (state === 'loading') { btn.textContent = 'Loading voice\u2026'; btn.setAttribute('aria-label', `Loading voice for ${label}`); }
  else if (state === 'playing') { btn.textContent = 'Stop'; btn.setAttribute('aria-label', `Stop listening to ${label}`); }
  else { btn.textContent = 'Listen'; btn.setAttribute('aria-label', `Listen to ${label}`); }
}

function stopListening() {
  const was = listening;
  listening = null;
  stopClip();
  if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
  if (was) listenState(was.btn, 'idle');
}

function addListenButtons(root = document) {
  if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') return;
  // The list of recordings is fetched on the first press of Listen, not on every page.
  for (const node of root.querySelectorAll('.qtext, .key, .g-entry')) {
    if (node.querySelector(':scope > .listen') || node.querySelector(':scope > h3 > .listen')) continue;
    const number = node.querySelector('.qnum')?.textContent;
    const isEntry = node.classList.contains('g-entry');
    const entryName = isEntry ? node.querySelector('h3')?.firstChild?.textContent.trim() : '';
    const btn = el('button', { type: 'button', class: 'listen', 'aria-pressed': 'false', 'data-label': isEntry ? `the glossary entry for ${entryName}` : number ? `question ${number}` : 'this key idea', text: 'Listen' });
    btn.setAttribute('aria-label', `Listen to ${btn.dataset.label}`);
    btn.addEventListener('click', async () => {
      // A press while a voice is loading is ignored, so three quick presses never give three overlapping clips.
      if (btn.getAttribute('aria-busy') === 'true' || document.querySelector('.listen[aria-busy="true"]')) return;
      // A press on the one that is playing stops it; a press on another one stops that and starts this one.
      if (listening?.btn === btn) { stopListening(); return; }
      stopListening();
      listenCounter += 1;
      const id = listenCounter;
      listening = { btn, id };
      const end = () => {
        if (listening?.id !== id) return;
        listening = null;
        listenState(btn, 'idle');
      };
      listenState(btn, 'loading');
      const text = unitText(node);
      // A recording of exactly this text (made by the build tooling, or Greg's own voice) wins; otherwise the browser voice reads it.
      const played = await playClip(text, loadRead().rate, end);
      if (listening?.id !== id) return; // it ended while loading
      if (played) { listenState(btn, 'playing'); return; }
      if (speak(text, end)) listenState(btn, 'playing');
      else end();
    });
    (isEntry ? node.querySelector('h3') : node).append(btn);
  }
}

// ---------- mixed practice ("Give me five") ----------
// Pulls questions from the topic pages (same-origin only), favouring ones you have not finished.

async function startPractice() {
  const root = document.querySelector('[data-practice]');
  if (!root) return;
  const setBox = root.querySelector('[data-practice-set]');
  const status = root.querySelector('[data-practice-status]');
  const boxes = [...root.querySelectorAll('input[name="practice-topic"]')];
  const pool = new Map(); // topic id -> array of .q nodes
  const loadTopic = async (id) => {
    if (pool.has(id)) return pool.get(id);
    if (!/^[a-z0-9-]+$/.test(id)) return [];
    let res;
    try { res = await fetch(`${id}.html`); } catch { return []; }
    if (!res.ok) return [];
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const qs = [...doc.querySelectorAll('.q[data-qid]')];
    pool.set(id, qs);
    return qs;
  };
  let dealToken = 0;
  const deal = async () => {
    const mine = (dealToken += 1);
    const chosen = boxes.filter((b) => b.checked).map((b) => b.value);
    if (chosen.length === 0) { status.textContent = 'Pick at least one topic.'; return; }
    status.textContent = 'Getting your questions\u2026';
    let all = [];
    for (const id of chosen) all = all.concat(await loadTopic(id));
    if (mine !== dealToken) return; // a newer press replaced this one while its pages were loading
    if (all.length === 0) { status.textContent = 'Could not get questions. Check your connection, then press the button to try again.'; return; }
    shuffle(all);
    const now = today();
    const due = all.filter((q) => isDue(store.rq[q.dataset.qid], now));
    const rest = all.filter((q) => !due.includes(q));
    // Ready-to-revisit questions first (never more than three, so a backlog never feels like a debt),
    // then ones not finished yet, then anything else.
    rest.sort((a, b) => (store.done[a.dataset.qid] ? 1 : 0) - (store.done[b.dataset.qid] ? 1 : 0));
    const dueChosen = due.slice(0, 3);
    const five = shuffle([...dueChosen, ...rest.slice(0, 5 - dueChosen.length)]);
    setBox.replaceChildren();
    five.forEach((src, i) => {
      const q = document.importNode(src, true);
      setBox.append(q);
      enhanceQuestion(q, i);
    });
    addListenButtons(setBox);
    stopBtn.hidden = false;
    const n = store.days.length;
    const ready = due.length;
    status.textContent = `Five questions, mixed up. ${ready > 0 ? `${ready} ${ready === 1 ? 'question is' : 'questions are'} ready to revisit, and some are in this set. ` : ''}You have practised on ${n} ${n === 1 ? 'day' : 'days'} so far.`;
  };
  const stopBtn = el('button', { type: 'button', class: 'btn btn-ghost', text: 'Stop for today' });
  stopBtn.hidden = true;
  stopBtn.addEventListener('click', () => { status.textContent = 'Done for today. What you finished is saved on this device. See you next time.'; stopBtn.hidden = true; });
  status.after(stopBtn);
  setBox.addEventListener('wm-solved', () => {
    const all = setBox.querySelectorAll('.q');
    if (all.length > 0 && setBox.querySelectorAll('.q-correct').length === all.length) status.textContent = 'That is your five. Stop here, or press the button for five more.';
  });
  root.querySelector('[data-practice-new]')?.addEventListener('click', deal);
  boxes.forEach((b) => b.addEventListener('change', () => { status.textContent = 'Press the button for new questions.'; }));
  await deal();
}


// ---------- find your gaps (diagnostic) ----------
// Eleven questions scored in the browser. Results live in localStorage as plain numbers: nothing is sent anywhere.

function startDiagnostic() {
  const root = document.querySelector('[data-diagnostic]');
  if (!root) return;
  const items = [...root.querySelectorAll('.dq')];
  items.forEach((d, i) => {
    const id = `dq-${i + 1}`;
    const text = d.querySelector('.qtext');
    text.prepend(el('span', { class: 'qnum', 'aria-hidden': 'true', text: String(i + 1) }));
    const input = el('input', { id, type: 'text', class: 'q-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: '60' });
    d.append(el('label', { class: 'sr-only', for: id, text: `Your answer to question ${i + 1}` }), input);
  });
  // A half-finished check is kept only until the tab is closed (sessionStorage), so a reload does not lose it.
  const DRAFT_KEY = 'wm-gcse-diag-draft';
  const readDraft = () => { try { const v = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  const progress = el('p', { class: 'diag-progress', role: 'status', 'aria-live': 'polite' });
  root.querySelector('[data-diag-finish]').before(progress);
  const updateProgress = () => {
    const values = items.map((d) => d.querySelector('input').value);
    try { window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values.map((v) => v.slice(0, 60)))); } catch { /* storage may be unavailable */ }
    const n = values.filter((v) => v.trim() !== '').length;
    progress.textContent = n === 0 ? 'Answer what you can. Leave any you do not know: that is how we find your first topics.' : 'Saved while you work. Leave any you do not know.';
  };
  const draft = readDraft();
  items.forEach((d, i) => {
    const input = d.querySelector('input');
    if (typeof draft[i] === 'string') input.value = draft[i].slice(0, 60);
    input.addEventListener('input', updateProgress);
  });
  updateProgress();
  const results = root.querySelector('[data-diag-results]');
  const historyBox = root.querySelector('[data-diag-history]');
  const showHistory = () => {
    historyBox.replaceChildren();
    if (store.diag.length === 0) return;
    historyBox.append(el('h2', { text: 'Your earlier checks' }));
    const list = el('ul', { class: 'diag-list' });
    for (const r of store.diag.slice(-8)) {
      const li = el('li');
      const bar = el('span', { class: 'bar', role: 'img', 'aria-label': `${r.score} of ${r.total}` });
      bar.append(el('span', { class: 'bar-fill', style: `width:${Math.round((r.score / r.total) * 100)}%` }));
      li.append(el('span', { text: `${r.date}: ${r.score} of ${r.total} ` }), bar);
      list.append(li);
    }
    historyBox.append(list, el('p', { class: 'muted', text: 'Come back in about a month and check again.' }));
  };
  showHistory();
  root.querySelector('[data-diag-finish]').addEventListener('click', () => {
    const wrong = [];
    const rows = [];
    items.forEach((d, i) => {
      const input = d.querySelector('input');
      const ok = matches(input.value, splitList(d.dataset.answers), d.dataset.mode === 'exact' ? 'exact' : 'value');
      rows.push({ n: i + 1, ok, typed: input.value.trim(), answer: splitList(d.dataset.answers)[0] });
      if (!ok) wrong.push({ topic: d.dataset.topic, title: d.dataset.title, layer: Number(d.dataset.layer) });
    });
    const score = items.length - wrong.length;
    store.diag.push({ date: today(), score, total: items.length, wrong: wrong.map((w) => w.topic) });
    store.diag = store.diag.slice(-20);
    save();
    try { window.sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    results.replaceChildren();
    results.append(el('h2', { text: score === items.length ? 'Your foundations look secure' : 'Where to start' }));
    if (wrong.length === 0) {
      results.append(el('p', { text: 'Nothing to fix here. Try the Higher-tier extras or Give me five.' }));
    } else {
      results.append(el('p', { text: 'Start at the top of this list. Lower topics come first because the later ones stand on them.' }));
      const sorted = wrong.sort((a, b) => a.layer - b.layer);
      const ol = el('ol', { class: 'diag-start' });
      for (const w of sorted.slice(0, 3)) {
        const li = el('li');
        li.append(el('a', { href: `${w.topic}.html`, text: w.title }));
        ol.append(li);
      }
      results.append(ol);
      if (sorted.length > 3) {
        const more = el('details', { class: 'diag-more' });
        more.append(el('summary', { text: 'Other things to look at later' }));
        const ul2 = el('ul');
        for (const w of sorted.slice(3)) {
          const li = el('li');
          li.append(el('a', { href: `${w.topic}.html`, text: w.title }));
          ul2.append(li);
        }
        more.append(ul2);
        results.append(more);
      }
    }
    const details = el('details', { class: 'diag-answers' });
    details.append(el('summary', { text: 'See my answers' }));
    const ul = el('ul');
    for (const r of rows) ul.append(el('li', { text: `${r.n}. ${r.ok ? 'Right' : 'Not yet'}. You typed: ${r.typed || '(nothing)'}. Answer: ${r.answer}.` }));
    details.append(ul);
    results.append(details);
    const summary = `GCSE maths gaps check ${today()}: ${score} of ${items.length}. Start with: ${wrong.map((w) => w.title).join(', ') || 'nothing, all secure'}.`;
    const box = el('textarea', { class: 'duck-text', readonly: '', rows: '2', 'aria-label': 'Results you can copy for your teacher' });
    box.value = summary;
    results.append(el('p', { class: 'muted', text: 'To show your teacher, copy this line:' }), box);
    showHistory();
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ---------- my marks (hub) ----------
// A plain list of where the marks you gave yourself were lost, lowest first. Stays on this device.

function showMarksSummary() {
  const root = document.querySelector('[data-marks-summary]');
  if (!root) return;
  const byTopic = new Map();
  for (const [qid, [earned, total]] of Object.entries(store.marks)) {
    const topic = qid.replace(/-\d+$/, '');
    const row = byTopic.get(topic) ?? { earned: 0, total: 0 };
    row.earned += earned;
    row.total += total;
    byTopic.set(topic, row);
  }
  if (byTopic.size === 0) return;
  const list = root.querySelector('[data-marks-list]');
  const rows = [...byTopic.entries()].sort((a, b) => a[1].earned / a[1].total - b[1].earned / b[1].total);
  list.replaceChildren();
  for (const [topic, r] of rows) {
    const title = document.querySelector(`.pyr-node a[href="${topic}.html"]`)?.textContent?.trim() || (topic === 'stretch' ? 'Stretch papers' : topic);
    const li = el('li');
    li.append(el('a', { href: topic === 'stretch' ? 'stretch.html' : `${topic}.html`, text: title }), ` ${r.earned} of ${r.total} marks (${Math.round((r.earned / r.total) * 100)}%)`);
    list.append(li);
  }
  root.hidden = false;
}

// ---------- start-up ----------

// ---------- timed set (stretch papers) ----------
// Five questions, one minute per mark, hints hidden until time is up. The clock and the marks live on screen only.

function startTimed() {
  const main = document.querySelector('main[data-book-page="stretch"], main[data-book-page="foundation"]');
  if (!main) return;
  const all = [...main.querySelectorAll('.q')];
  const panel = el('section', { class: 'timed-panel' });
  const wrap = el('div', { class: 'wrap narrow' });
  const startBtn = el('button', { type: 'button', class: 'btn btn-navy', text: 'Start a timed set (5 questions)' });
  const filter = el('select', { class: 'timed-filter', 'aria-label': 'Calculator or non-calculator' });
  for (const [value, label] of [['', 'Calculator and non-calculator mixed'], ['Non-calculator', 'Non-calculator questions only'], ['Calculator', 'Calculator questions only']]) filter.append(el('option', { value, text: label }));
  // A topic picker built from the "Uses:" links on the questions.
  const topicOf = (q) => q.querySelector('.qtag-from')?.getAttribute('href') ?? '';
  const calcOf = (q) => q.querySelector('.qtag-calc')?.textContent.trim() ?? '';
  const topicFilter = el('select', { class: 'timed-filter', 'aria-label': 'Which topic' });
  topicFilter.append(el('option', { value: '', text: 'Any topic' }));
  const seen = new Map();
  for (const q of all) {
    const link = q.querySelector('.qtag-from');
    if (link && !seen.has(topicOf(q))) seen.set(topicOf(q), link.textContent.replace(/^Uses:\s*/, ''));
  }
  for (const [href, label] of [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]))) topicFilter.append(el('option', { value: href, text: label }));
  // Choices made before starting: no clock at all, extra time (+25%), or a clock that starts out hidden.
  const tickBox = (label) => {
    const box = el('input', { type: 'checkbox' });
    return { box, label: el('label', { class: 'timed-tick' }, box, ` ${label}`) };
  };
  const noClockTick = tickBox('No clock: practise without time (you still mark your answers and tick your marks)');
  const extraTick = tickBox('Extra time (+25%)');
  const hideClockTick = tickBox('Hide the clock (you can show it again any time)');
  const options = el('div', { class: 'timed-options', role: 'group', 'aria-label': 'Options for the timed set' }, noClockTick.label, extraTick.label, hideClockTick.label);
  noClockTick.box.addEventListener('change', () => {
    extraTick.box.disabled = noClockTick.box.checked;
    hideClockTick.box.disabled = noClockTick.box.checked;
  });
  const clock = el('p', { class: 'timed-clock', role: 'timer', 'aria-live': 'off' });
  const clockBtn = el('button', { type: 'button', class: 'btn btn-ghost', text: 'Hide the clock' });
  const pauseBtn = el('button', { type: 'button', class: 'btn btn-ghost', text: 'Pause' });
  const moreBtn = el('button', { type: 'button', class: 'btn btn-ghost', text: 'Add 5 minutes' });
  const status = el('p', { class: 'timed-status', role: 'status', 'aria-live': 'polite', tabindex: '-1' });
  const finishBtn = el('button', { type: 'button', class: 'btn btn-gold', text: 'Finish and mark my answers' });
  const leaveBtn = el('button', { type: 'button', class: 'btn btn-ghost', text: 'Back to all questions' });
  const running = [clockBtn, pauseBtn, moreBtn, finishBtn, leaveBtn];
  running.forEach((b) => { b.hidden = true; });
  wrap.append(el('h2', { text: 'Try it against the clock' }), el('p', { text: 'You get five questions and one minute for every mark, like a real paper. Hints stay hidden until time is up. Write your working on paper. You can pause, hide the clock or add time, or practise with no clock at all.' }), filter, topicFilter, options, startBtn, clockBtn, pauseBtn, moreBtn, status, finishBtn, leaveBtn, clock);
  panel.append(wrap);
  main.querySelector('.key')?.closest('section')?.after(panel);
  let timer = null;
  let focusTimer = null;
  let chosen = [];
  let left = 0;
  let paused = false;
  let hiddenSections = [];
  const helpOf = (q, hidden) => q.querySelectorAll('.q-help').forEach((h) => { h.hidden = hidden; });
  const timeLeft = () => `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const paint = () => { clock.textContent = `Time left: ${timeLeft()}`; };
  const tally = () => {
    const earned = chosen.reduce((n, q) => n + q.querySelectorAll('.mark-box:checked').length, 0);
    const total = chosen.reduce((n, q) => n + Number(q.dataset.marks || 0), 0);
    status.textContent = `Marks so far: ${earned} of ${total}.`;
  };
  const stop = (message) => {
    window.clearInterval(timer);
    main.classList.remove('timed-running');
    clock.textContent = message;
    status.textContent = message;
    chosen.forEach((q) => helpOf(q, false));
    finishBtn.hidden = false;
    pauseBtn.hidden = true;
    moreBtn.hidden = true;
  };
  const tick = () => {
    if (paused) return;
    left -= 1;
    paint();
    if (left === 300) status.textContent = '5 minutes left.';
    if (left === 60) status.textContent = '1 minute left.';
    if (left <= 0) stop('Time is up. Open each mark scheme and tick your marks.');
  };
  // A section whose questions are all hidden would show nothing but its heading, so it is hidden too (and shown again afterwards).
  const hideEmptySections = () => {
    hiddenSections = [...main.querySelectorAll('section')].filter((sec) => {
      const qs = [...sec.querySelectorAll('.q')];
      return qs.length > 0 && qs.every((q) => q.hidden);
    });
    hiddenSections.forEach((sec) => { sec.hidden = true; });
  };
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  startBtn.addEventListener('click', () => {
    const wantCalc = (q) => !filter.value || calcOf(q) === filter.value;
    const wantTopic = (q) => !topicFilter.value || topicOf(q) === topicFilter.value;
    let pool = all.filter((q) => wantCalc(q) && wantTopic(q));
    let note = '';
    if (pool.length === 0) {
      // Nothing of that exact kind: keep the calculator choice (it changes which skills you practise) and drop the topic.
      pool = all.filter(wantCalc);
      note = ' No questions matched both choices, so the topic was dropped.';
      if (pool.length === 0) pool = [...all];
    } else if (pool.length < 5) {
      note = ` Only ${plural(pool.length, 'question')} matched your choices, so this set is shorter.`;
    }
    for (let k = pool.length - 1; k > 0; k -= 1) {
      const m = Math.floor(Math.random() * (k + 1));
      [pool[k], pool[m]] = [pool[m], pool[k]];
    }
    chosen = pool.slice(0, 5);
    const noClock = noClockTick.box.checked;
    const minutes = chosen.reduce((n, q) => n + Number(q.dataset.marks || 0), 0);
    const extra = extraTick.box.checked && !noClock;
    left = Math.ceil(minutes * 60 * (extra ? 1.25 : 1));
    paused = false;
    pauseBtn.textContent = 'Pause';
    all.forEach((q) => { q.hidden = !chosen.includes(q); });
    hideEmptySections();
    chosen.forEach((q) => helpOf(q, true));
    startBtn.hidden = true;
    filter.hidden = true;
    topicFilter.hidden = true;
    options.hidden = true;
    [leaveBtn, finishBtn].forEach((b) => { b.hidden = false; });
    if (!noClock) [clockBtn, pauseBtn, moreBtn].forEach((b) => { b.hidden = false; });
    main.classList.add('timed-running');
    // The clock sits at the top of the page and sticks there, taking its own room so it never covers a question.
    main.prepend(clock);
    clock.hidden = noClock || hideClockTick.box.checked;
    clockBtn.textContent = clock.hidden ? 'Show the clock' : 'Hide the clock';
    window.clearTimeout(focusTimer);
    if (noClock) {
      status.textContent = `${plural(chosen.length, 'question')}, no clock. Press Finish when you are ready.${note}`;
    } else {
      const shown = Math.ceil(left / 60);
      status.textContent = `${plural(chosen.length, 'question')}, ${plural(shown, 'minute')}${extra ? ' (with 25% extra time)' : ''}.${note}`;
      paint();
      timer = window.setInterval(tick, 1000);
    }
    const first = chosen[0];
    first.scrollIntoView({ block: 'start' });
    // Say what the set is first: moving focus straight away would cut that announcement off.
    focusTimer = window.setTimeout(() => first.querySelector('.q-input, .mc-option, .btn-check')?.focus({ preventScroll: true }), 2500);
  });
  clockBtn.addEventListener('click', () => { clock.hidden = !clock.hidden; clockBtn.textContent = clock.hidden ? 'Show the clock' : 'Hide the clock'; });
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Carry on' : 'Pause';
    status.textContent = paused ? 'Paused. The clock is stopped.' : 'Carrying on.';
  });
  moreBtn.addEventListener('click', () => { left += 300; paint(); status.textContent = `5 minutes added. Time left: ${timeLeft()}.`; });
  finishBtn.addEventListener('click', () => {
    window.clearTimeout(focusTimer);
    stop('Marking time. Open each mark scheme and tick the marks you earned.');
    chosen.forEach((q) => {
      q.querySelectorAll('.btn-check').forEach((b) => { if (!b.disabled && /mark scheme/.test(b.textContent)) b.click(); });
      q.querySelector('.solution')?.classList.add('open');
    });
    finishBtn.hidden = true;
    tally();
    status.focus({ preventScroll: false });
  });
  main.addEventListener('change', (e) => { if (chosen.length && e.target.classList?.contains('mark-box')) tally(); });
  leaveBtn.addEventListener('click', () => {
    window.clearInterval(timer);
    window.clearTimeout(focusTimer);
    main.classList.remove('timed-running');
    all.forEach((q) => { q.hidden = false; helpOf(q, false); });
    hiddenSections.forEach((sec) => { sec.hidden = false; });
    hiddenSections = [];
    chosen = [];
    clock.textContent = '';
    clock.hidden = false;
    wrap.append(clock);
    status.textContent = '';
    startBtn.hidden = false;
    filter.hidden = false;
    topicFilter.hidden = false;
    options.hidden = false;
    running.forEach((b) => { b.hidden = true; });
    startBtn.focus();
  });
}

// "Set complete" under a Check-your-knowledge set once every question in it is done.
function setDoneBanner(q) {
  const section = q.closest('section.ckw');
  if (!section) return;
  const qs = [...section.querySelectorAll('.q')];
  if (qs.length === 0 || !qs.every((x) => store.done[x.dataset.qid])) return;
  if (section.querySelector('.set-done')) return;
  const wrap = section.querySelector('.wrap') ?? section;
  const next = section.nextElementSibling?.querySelector('h2');
  const banner = el('p', { class: 'set-done', role: 'status', text: `Set complete: ${qs.length} of ${qs.length} done. ` });
  if (next?.id) banner.append(el('a', { href: `#${next.id}`, text: `Next: ${next.textContent.replace(/^\u270E\s*/, '').trim()}` }));
  wrap.append(banner);
}

// Anchors on every question (#q12), and ?q=5-12 shows only those questions (a homework link).
function questionRanges() {
  const page = document.querySelector('main[data-book-page="topic"]');
  if (!page) return;
  const numberOf = (q) => Number((q.dataset.qid ?? '').replace(/^.*-/, ''));
  for (const q of document.querySelectorAll('.q[data-qid]')) { if (!q.id) q.id = `q${numberOf(q)}`; }
  const asked = parseRanges(new URLSearchParams(window.location.search).get('q'));
  // Only questions this page really has: a link that asks for 1-500 must not claim to show 1-500.
  const have = new Set([...document.querySelectorAll('.q[data-qid]')].map(numberOf));
  const wanted = new Set(asked.filter((n) => have.has(n)));
  if (wanted.size === 0) return;
  document.querySelectorAll('details.recap').forEach((d) => { d.open = true; });
  for (const q of document.querySelectorAll('.q[data-qid]')) q.hidden = !wanted.has(numberOf(q));
  for (const sec of document.querySelectorAll('main section')) {
    if (sec.querySelector('.q') && ![...sec.querySelectorAll('.q')].some((q) => !q.hidden)) sec.hidden = true;
  }
  const banner = el('p', { class: 'range-banner', role: 'status', text: `${rangeBanner([...wanted].sort((x, y) => x - y))} ` });
  banner.append(el('a', { href: window.location.pathname, text: 'Show the whole page' }));
  document.querySelector('main')?.prepend(banner);
}

// Teacher answer key pages: a button to show or hide the worked solutions.
function keyPageTools() {
  const main = document.querySelector('main[data-book-page="key"]');
  if (!main) return;
  const btn = el('button', { type: 'button', class: 'btn btn-navy', 'aria-pressed': 'false', text: 'Show worked solutions' });
  btn.addEventListener('click', () => {
    const on = main.classList.toggle('show-working');
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Hide worked solutions' : 'Show worked solutions';
  });
  main.querySelector('.hero-actions')?.prepend(btn);
}

function start() {
  if (REVIEW) startReviewMode();
  initReadingTools();
  document.querySelectorAll('.q').forEach(enhanceQuestion);
  if (!REVIEW) document.querySelectorAll('.worked.faded').forEach(enhanceFaded);
  addListenButtons();
  startPractice().catch((e) => console.error('practice failed', e));
  startDiagnostic();
  startTimed();
  questionRanges();
  keyPageTools();
  showMarksSummary();
  enhanceChecklists();
  enhanceTerms();
  enhanceGlossary();
  updateProgress();
  document.querySelector('[data-reset-progress]')?.addEventListener('click', () => {
    if (window.confirm('Clear all your saved ticks and answers on this device?')) {
      store = { done: {}, ticks: {}, days: [], rq: {}, diag: [], marks: {} };
      save();
      try { window.localStorage.removeItem(READ_KEY); } catch { /* storage may be unavailable */ }
      window.location.reload();
    }
  });
}

try {
  start();
} catch (error) {
  // If anything goes wrong, fall back to the plain page: hints and answers visible.
  document.documentElement.classList.remove('js');
  console.error('book.mjs failed; showing the static page.', error);
}
