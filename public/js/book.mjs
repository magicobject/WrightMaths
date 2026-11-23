// Interactive layer for the GCSE book. The pages read fine without it (hints
// and answers simply show in full); this upgrades each question with an answer
// box, a "Help, I'm stuck!" ladder, specific feedback and saved ticks.
//
// Privacy: progress lives in this browser's localStorage only. Nothing is sent
// anywhere, and every storage call is wrapped because storage can be blocked.
import { matches, rightValueWrongForm, splitList } from './book-answer.mjs';

const STORE_KEY = 'wm-gcse-v1';
const CHEERS = ['Yes!', 'Spot on.', 'Nailed it.', 'Correct.', 'That is it.', 'Right, nice work.'];
const NUDGES = [
  'Not quite. Have another go.',
  'Not quite yet. Try again, or open a hint.',
  'Still not there. A hint is not cheating: it is how you learn.',
];

// ---------- saved progress ----------

function load() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && typeof data === 'object') return { done: data.done ?? {}, ticks: data.ticks ?? {} };
  } catch { /* storage unavailable: carry on without saving */ }
  return { done: {}, ticks: {} };
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

const hashOf = (text) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
let uid = 0;

function pageKey() {
  const body = document.querySelector('[data-book-page]');
  return body?.dataset.topic ?? body?.dataset.bookPage ?? 'page';
}

function markDone(qid) {
  if (!store.done[qid]) {
    store.done[qid] = 1;
    save();
  }
  updateProgress();
}

// ---------- the rubber duck ----------
// Explaining a problem to someone else (even a rubber duck) often unsticks you.
// What is typed here stays on screen: it is never stored or sent anywhere.

const DUCK_SVG = '<svg class="duck" viewBox="0 0 90 72" aria-hidden="true" focusable="false">'
  + '<path class="duck-water" d="M2 62 Q12 56 22 62 T42 62 T62 62 T82 62" />'
  + '<ellipse class="duck-body" cx="38" cy="46" rx="27" ry="16"/><path class="duck-wing" d="M26 44 Q38 34 50 46 Q38 54 26 44Z"/>'
  + '<circle class="duck-body" cx="62" cy="24" r="14"/><path class="duck-beak" d="M74 24 L88 29 L74 33Z"/>'
  + '<circle class="duck-eye" cx="66" cy="20" r="2.6"/></svg>';

function duckRung(li, q) {
  li.className = 'duck-rung';
  li.innerHTML = `${DUCK_SVG}<div class="duck-body-text"><p class="duck-title"><b>Explain it to the duck</b></p>`
    + '<p>Explaining a problem to someone else, even a rubber duck, often makes the answer pop out. Programmers do it all the time. Tell the duck:</p>'
    + '<ol class="duck-prompts"><li>What is the question asking me to find?</li><li>What do I already know?</li><li>What did I try, and what happened?</li><li>Which step stopped making sense?</li></ol></div>';
  const area = el('textarea', {
    class: 'duck-text', rows: '4', maxlength: '600', 'aria-label': 'Tell the duck what is going on', placeholder: 'Type it, or just say it out loud',
  });
  const note = el('p', { class: 'muted duck-note', text: 'The duck only listens. What you type stays on this screen and is not saved or sent anywhere.' });
  const done = el('button', { type: 'button', class: 'btn-check', text: 'I have explained it: let me try again' });
  done.addEventListener('click', () => {
    area.value = '';
    q.querySelector('.q-input, .mc-option')?.focus();
  });
  li.querySelector('.duck-body-text').append(area, note, done);
}

// ---------- questions ----------

function enhanceQuestion(q, index) {
  const qid = q.dataset.qid ?? `${pageKey()}-${index + 1}`;
  q.dataset.qid = qid;
  q.classList.add('q-live');
  q.setAttribute('role', 'group');

  const ladder = q.querySelector(':scope > ol.ladder');
  const solution = q.querySelector(':scope > .solution');
  const wrongBox = q.querySelector(':scope > ul.wrong');
  const optionList = q.querySelector(':scope > ul.options');
  const text = q.querySelector(':scope > .qtext');
  const number = el('span', { class: 'qnum', 'aria-hidden': 'true', text: String(index + 1) });
  text?.prepend(number);

  const feedback = el('div', { class: 'q-feedback', role: 'status', 'aria-live': 'polite' });
  const rungs = ladder ? [...ladder.children].map((li) => li.innerHTML) : [];
  rungs.push({ duck: true });
  rungs.push('Still stuck? Show this question to your teacher, or ask a parent or carer to get in touch about lessons. A person can often unstick you in a minute.');
  let rungsShown = 0;
  let wrongCount = 0;
  let solved = false;

  const help = el('div', { class: 'q-help' });
  const hintList = el('ol', { class: 'rungs' });
  const helpBtn = el('button', { type: 'button', class: 'btn-stuck', text: "Help, I'm stuck!" });
  help.append(helpBtn, hintList);

  function showSolution() {
    if (solution) solution.classList.add('open');
  }

  function revealRung() {
    if (rungsShown < rungs.length) {
      const li = el('li');
      const rung = rungs[rungsShown];
      if (typeof rung === 'object') duckRung(li, q);
      else li.innerHTML = rung;
      hintList.append(li);
      rungsShown += 1;
      li.setAttribute('tabindex', '-1');
      li.focus({ preventScroll: false });
    }
    if (rungsShown >= rungs.length) {
      helpBtn.textContent = solution ? 'Show me the answer' : 'No more hints';
      helpBtn.dataset.final = '1';
      if (!solution) helpBtn.disabled = true;
    } else {
      helpBtn.textContent = `Another hint (${rungsShown + 1} of ${rungs.length})`;
    }
  }

  helpBtn.addEventListener('click', () => {
    if (helpBtn.dataset.final) {
      showSolution();
      helpBtn.disabled = true;
      return;
    }
    revealRung();
  });

  function success() {
    solved = true;
    q.classList.add('q-correct');
    feedback.className = 'q-feedback ok';
    feedback.textContent = `${CHEERS[hashOf(qid) % CHEERS.length]} `;
    showSolution();
    markDone(qid);
    helpBtn.disabled = true;
  }

  function failure(message) {
    wrongCount += 1;
    q.classList.add('q-tried');
    feedback.className = 'q-feedback oops';
    feedback.textContent = message ?? NUDGES[Math.min(wrongCount - 1, NUDGES.length - 1)];
  }

  if (q.dataset.type === 'mc' && optionList) {
    const items = [...optionList.children];
    const group = el('div', { class: 'mc', role: 'group', 'aria-label': 'Choose one answer' });
    for (const li of items) {
      const correct = li.hasAttribute('data-correct');
      const why = li.dataset.why;
      const btn = el('button', { type: 'button', class: 'mc-option' });
      btn.innerHTML = li.innerHTML;
      btn.addEventListener('click', () => {
        if (solved) return;
        if (correct) {
          btn.classList.add('is-right');
          success();
        } else {
          btn.classList.add('is-wrong');
          btn.setAttribute('aria-disabled', 'true');
          failure(why ?? NUDGES[Math.min(wrongCount, NUDGES.length - 1)]);
        }
      });
      group.append(btn);
    }
    optionList.after(group);
    group.after(feedback);
  } else {
    const answers = splitList(q.dataset.answers);
    const mode = q.dataset.mode === 'exact' ? 'exact' : 'value';
    const wrongs = wrongBox
      ? [...wrongBox.children].map((li) => ({ list: splitList(li.dataset.if), message: li.innerHTML }))
      : [];
    const inputId = `ans-${(uid += 1)}`;
    const input = el('input', {
      id: inputId, type: 'text', class: 'q-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'done',
    });
    const label = el('label', { class: 'sr-only', for: inputId, text: 'Your answer' });
    const check = el('button', { type: 'submit', class: 'btn-check', text: 'Check' });
    const form = el('form', { class: 'q-form', novalidate: '' }, label, input, check);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (solved) return;
      const value = input.value;
      if (value.trim() === '') {
        feedback.className = 'q-feedback oops';
        feedback.textContent = 'Type an answer first.';
        return;
      }
      if (matches(value, answers, mode)) {
        input.readOnly = true;
        success();
        return;
      }
      const specific = wrongs.find((w) => matches(value, w.list, mode));
      if (specific) {
        failure(null);
        feedback.innerHTML = specific.message;
      } else if (mode === 'exact' && rightValueWrongForm(value, answers)) {
        failure('That has the right value, but it is not in the form the question asked for (for example, not fully simplified). Have another look.');
      } else {
        failure(null);
      }
    });
    (text ?? q).after(form);
    form.after(feedback);
  }

  feedback.after(help);
  if (solution) help.after(solution);
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
    const bar = el('span', { class: 'bar', role: 'img', 'aria-label': `${got} of ${qs.length} questions right` });
    bar.append(el('span', { class: 'bar-fill', style: `width:${qs.length ? Math.round((got / qs.length) * 100) : 0}%` }));
    line.append(bar, el('span', { text: ` You have got ${got} of ${qs.length} questions right on this page.` }));
  }
  for (const node of document.querySelectorAll('[data-progress-for]')) {
    const id = node.dataset.progressFor;
    const total = Number(node.dataset.total);
    const got = Object.keys(store.done).filter((k) => k.startsWith(`${id}-`)).length;
    node.textContent = got > 0 ? `${got} of ${total} right` : `${total} questions`;
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
  const close = () => {
    if (open) {
      open.pop.remove();
      open.link.setAttribute('aria-expanded', 'false');
      open.link.removeAttribute('aria-describedby');
      open = null;
    }
  };
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a.term') : null;
    if (!link) {
      if (!(event.target instanceof Element) || !event.target.closest('.term-pop')) close();
      return;
    }
    event.preventDefault();
    if (open && open.link === link) { close(); return; }
    close();
    const id = `pop-${(uid += 1)}`;
    const href = link.getAttribute('href');
    const pop = el('span', { class: 'term-pop', id, role: 'note' });
    const def = el('span', { class: 'term-pop-def' });
    def.innerHTML = link.dataset.def ?? '';
    const more = el('a', { class: 'term-pop-more', href, text: 'Full entry in the glossary →' });
    pop.append(def, more);
    document.body.append(pop);
    // Place it under the word, kept inside the screen.
    const rect = link.getBoundingClientRect();
    const width = Math.min(pop.offsetWidth, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    pop.style.left = `${left + window.scrollX}px`;
    pop.style.top = `${rect.bottom + window.scrollY + 6}px`;
    link.setAttribute('aria-expanded', 'true');
    link.setAttribute('aria-describedby', id);
    more.focus({ preventScroll: true });
    open = { link, pop, scrollY: window.scrollY, width: window.innerWidth };
  });
  // Close after a real scroll (not the small nudge that comes from opening it).
  window.addEventListener('scroll', () => {
    if (open && Math.abs(window.scrollY - open.scrollY) > 120) close();
  }, { passive: true });
  window.addEventListener('resize', () => { if (open && window.innerWidth !== open.width) close(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) {
      const { link } = open;
      close();
      link.focus();
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
  const apply = () => {
    const strand = filter.value;
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    for (const entry of entries) {
      const okStrand = strand === 'all' || entry.dataset.strand === strand;
      const okText = query === '' || entry.textContent.toLowerCase().includes(query);
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
  apply();
}

// ---------- start-up ----------

function start() {
  document.querySelectorAll('.q').forEach(enhanceQuestion);
  enhanceChecklists();
  enhanceTerms();
  enhanceGlossary();
  updateProgress();
  document.querySelector('[data-reset-progress]')?.addEventListener('click', () => {
    if (window.confirm('Clear all your saved ticks and answers on this device?')) {
      store = { done: {}, ticks: {} };
      save();
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
