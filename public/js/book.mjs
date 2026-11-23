// Interactive layer for the GCSE book. The pages read fine without it (hints
// and answers simply show in full); this upgrades each question with an answer
// box, a "Help, I'm stuck!" ladder, specific feedback and saved ticks.
//
// Privacy: progress lives in this browser's localStorage only. Nothing is sent
// anywhere, and every storage call is wrapped because storage can be blocked.
import { matches, rightValueWrongForm, splitList, diagnose } from './book-answer.mjs';

const STORE_KEY = 'wm-gcse-v1';
const CHEERS = ['Yes!', 'Spot on.', 'Nailed it.', 'Correct.', 'That is it.', 'Right, nice work.'];
const NUDGES = [
  'Not quite. Have another go.',
  'Not quite yet. Open a hint if you want one.',
  'Still not there. Try a hint, or explain it to the duck: that often shows what is wrong.',
];

// ---------- saved progress ----------

function load() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && typeof data === 'object') return { done: data.done ?? {}, ticks: data.ticks ?? {}, days: Array.isArray(data.days) ? data.days : [] };
  } catch { /* storage unavailable: carry on without saving */ }
  return { done: {}, ticks: {}, days: [] };
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

function markDone(qid) {
  let changed = false;
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
  li.innerHTML = `${DUCK_SVG}<div class="duck-body-text"><p class="duck-title"><b>Tell the duck</b> <span class="muted">(optional)</span></p>`
    + '<p>Saying a problem out loud often makes it clear. The duck will not judge. It is a duck. Tap a start, or just talk.</p></div>';
  const starts = ['The question asks me to find…', 'I already know…', 'I tried… and then…', 'I got stuck when…'];
  const chips = el('div', { class: 'duck-chips', role: 'group', 'aria-label': 'Sentence starters' });
  const area = el('textarea', {
    class: 'duck-text', rows: '3', maxlength: '600', 'aria-label': 'Tell the duck what is going on', placeholder: 'Type it, or just say it out loud',
  });
  for (const start of starts) {
    const chip = el('button', { type: 'button', class: 'duck-chip', text: start });
    chip.addEventListener('click', () => {
      const lineBreak = String.fromCharCode(10);
      area.value += (area.value && !area.value.endsWith(lineBreak) ? lineBreak : '') + start.replace('…', ' ');
      area.focus();
    });
    chips.append(chip);
  }
  const note = el('p', { class: 'muted duck-note', text: 'The duck only listens. What you type stays on this screen and is not saved or sent anywhere.' });
  const done = el('button', { type: 'button', class: 'btn-check', text: 'Done: let me try again' });
  done.addEventListener('click', () => {
    area.value = '';
    q.querySelector('.q-input, .mc-option')?.focus();
  });
  li.querySelector('.duck-body-text').append(chips, area, note, done);
}

// ---------- questions ----------

export function enhanceQuestion(q, index) {
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
  if ((ladder?.children.length ?? 0) > 1) rungs.push({ duck: true });
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

  // The value is right but the form is not what was asked for: not a mistake, so no cross.
  function nearly(messageHtml) {
    q.classList.add('q-tried');
    feedback.className = 'q-feedback nearly';
    feedback.innerHTML = messageHtml;
  }

  if (q.dataset.type === 'mc' && optionList) {
    const items = shuffle([...optionList.children]);
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
      const rightValue = mode === 'exact' && rightValueWrongForm(value, answers);
      if (rightValue) {
        nearly(specific ? specific.message : 'Right value! The question wants it in a different form (for example, fully simplified). One more step.');
      } else if (specific) {
        failure(null);
        feedback.innerHTML = specific.message;
      } else {
        failure(mode === 'value' ? diagnose(value, answers) : null);
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
    const bar = el('span', { class: 'bar', role: 'img', 'aria-label': `${got} of ${qs.length} questions finished` });
    bar.append(el('span', { class: 'bar-fill', style: `width:${qs.length ? Math.round((got / qs.length) * 100) : 0}%` }));
    line.append(bar, el('span', { text: ` You have finished ${got} of ${qs.length} questions on this page. No rush.` }));
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


// ---------- reading options ----------
// Size, an easy-read font stack, a tinted page and a reading ruler. Saved on this device only.

const READ_KEY = 'wm-gcse-read';

function loadRead() {
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    const d = raw ? JSON.parse(raw) : {};
    return { size: Math.min(3, Math.max(0, Number(d.size) || 0)), easy: Boolean(d.easy), tint: Boolean(d.tint), ruler: Boolean(d.ruler) };
  } catch { return { size: 0, easy: false, tint: false, ruler: false }; }
}

function applyRead(prefs) {
  const c = document.documentElement.classList;
  for (const n of [1, 2, 3]) c.remove(`read-big${n}`);
  if (prefs.size) c.add(`read-big${prefs.size}`);
  c.toggle('read-easy', prefs.easy);
  c.toggle('read-tint', prefs.tint);
  c.toggle('read-ruler-on', prefs.ruler);
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
  const smaller = el('button', { type: 'button', class: 'read-btn', 'aria-label': 'Smaller text', text: 'A\u2212' });
  const bigger = el('button', { type: 'button', class: 'read-btn', 'aria-label': 'Bigger text', text: 'A+' });
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
  const sizeLabel = el('span', { class: 'read-size', 'aria-live': 'polite', text: `Text size ${prefs.size + 1} of 4` });
  const reset = el('button', { type: 'button', class: 'read-btn read-reset', text: 'Reset' });
  reset.addEventListener('click', () => {
    Object.assign(prefs, { size: 0, easy: false, tint: false, ruler: false });
    row.querySelectorAll('[aria-pressed]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    persist();
  });
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

  const top = el('button', { type: 'button', class: 'to-top', 'aria-label': 'Back to top', text: 'Top \u2191' });
  top.hidden = true;
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.append(top);
  window.addEventListener('scroll', () => { top.hidden = window.scrollY < 1200; }, { passive: true });
}

// ---------- listen (the browser's own voice; nothing is sent anywhere) ----------

function spokenText(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll('.listen, .qnum, .term-pop').forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

function addListenButtons(root = document) {
  if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') return;
  for (const node of root.querySelectorAll('.qtext, .key')) {
    if (node.querySelector(':scope > .listen')) continue;
    const btn = el('button', { type: 'button', class: 'listen', 'aria-label': 'Listen to this', text: 'Listen' });
    btn.addEventListener('click', () => {
      const synth = window.speechSynthesis;
      if (synth.speaking) { synth.cancel(); return; }
      const u = new window.SpeechSynthesisUtterance(spokenText(node));
      u.lang = 'en-GB';
      synth.speak(u);
    });
    node.append(btn);
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
    const res = await fetch(`${id}.html`);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const qs = [...doc.querySelectorAll('.q[data-qid]')];
    pool.set(id, qs);
    return qs;
  };
  const deal = async () => {
    const chosen = boxes.filter((b) => b.checked).map((b) => b.value);
    if (chosen.length === 0) { status.textContent = 'Pick at least one topic.'; return; }
    status.textContent = 'Getting your questions\u2026';
    let all = [];
    for (const id of chosen) all = all.concat(await loadTopic(id));
    shuffle(all);
    all.sort((a, b) => (store.done[a.dataset.qid] ? 1 : 0) - (store.done[b.dataset.qid] ? 1 : 0));
    const five = shuffle(all.slice(0, Math.min(10, all.length))).slice(0, 5);
    setBox.replaceChildren();
    five.forEach((src, i) => {
      const q = document.importNode(src, true);
      setBox.append(q);
      enhanceQuestion(q, i);
    });
    addListenButtons(setBox);
    const n = store.days.length;
    status.textContent = `Five questions, mixed up. You have practised on ${n} ${n === 1 ? 'day' : 'days'} so far.`;
  };
  root.querySelector('[data-practice-new]')?.addEventListener('click', deal);
  boxes.forEach((b) => b.addEventListener('change', () => { status.textContent = 'Press the button for new questions.'; }));
  await deal();
}

// ---------- start-up ----------

function start() {
  initReadingTools();
  document.querySelectorAll('.q').forEach(enhanceQuestion);
  addListenButtons();
  startPractice().catch((e) => console.error('practice failed', e));
  enhanceChecklists();
  enhanceTerms();
  enhanceGlossary();
  updateProgress();
  document.querySelector('[data-reset-progress]')?.addEventListener('click', () => {
    if (window.confirm('Clear all your saved ticks and answers on this device?')) {
      store = { done: {}, ticks: {}, days: [] };
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
