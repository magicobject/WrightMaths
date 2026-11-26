// Private page for listening to every Listen recording and flagging the ones that sound wrong.
// Reads /audio/book/review.json (written by `npm run book:review`), plays the clips from this
// site, and keeps the reviewer's marks in this browser only. Nothing is sent anywhere.
const KEY = 'wm-audio-review-v1';
const PAGE_SIZE = 25;
const PAUSE_WORDS = /^(dot|period|stop|point)$/;
const base = new URL('../audio/book/', import.meta.url);

let rows = [];
let marks = {};
try { marks = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { marks = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(marks)); } catch { /* the page still works without saving */ } };

const state = { list: [], page: 0, cur: 0 };
let playing = null; // { audio, button }

const $ = (id) => document.getElementById(id);
function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v);
  }
  e.append(...kids);
  return e;
}

// Higher = more likely to be wrong: a spoken "dot", "period" or "stop" the text does not have is the strongest sign.
function score(r) {
  if (r.ratio === null) return 0;
  const dotty = r.extra.some((e) => e.split(' ').some((w) => PAUSE_WORDS.test(w)));
  const tooQuick = r.sec !== null && r.sec < r.t.length / 40;
  return (dotty ? 10 : 0) + (1 - r.ratio) * 5 + (tooQuick ? 3 : 0);
}

function stop() {
  if (playing) { playing.audio.pause(); playing.button.textContent = 'Listen'; playing = null; }
}
function toggle(r, button) {
  if (playing?.button === button) { stop(); return; }
  stop();
  const audio = new Audio(new URL(r.f, base).href);
  playing = { audio, button };
  button.textContent = 'Stop';
  audio.addEventListener('ended', () => { if (playing?.audio === audio) { button.textContent = 'Listen'; playing = null; } });
  audio.addEventListener('error', () => { button.textContent = 'Listen'; playing = null; });
  audio.play().catch(() => { button.textContent = 'Listen'; playing = null; });
}

function build() {
  stop();
  const f = $('ar-filter').value;
  let l = rows.slice();
  if (f === 'suspicious') { l = l.filter((r) => !marks[r.h]); l.sort((a, b) => score(b) - score(a)); }
  else if (f === 'unreviewed') l = l.filter((r) => !marks[r.h]);
  else if (f === 'flagged') l = l.filter((r) => marks[r.h]?.s === 'flag');
  else if (f === 'ok') l = l.filter((r) => marks[r.h]?.s === 'ok');
  state.list = l; state.cur = 0; state.page = 0;
  render();
}

function render() {
  const list = $('ar-list');
  list.replaceChildren();
  const done = rows.filter((r) => marks[r.h]).length;
  const flagged = rows.filter((r) => marks[r.h]?.s === 'flag').length;
  $('ar-count').textContent = `${state.list.length} shown. ${done} of ${rows.length} reviewed, ${flagged} flagged.`;
  state.list.slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE).forEach((r, i) => list.append(card(r, i)));
  const prev = el('button', { type: 'button', text: 'Previous 25' });
  prev.disabled = state.page === 0;
  prev.onclick = () => { state.page -= 1; state.cur = 0; stop(); render(); window.scrollTo(0, 0); };
  const next = el('button', { type: 'button', text: 'Next 25' });
  next.disabled = (state.page + 1) * PAGE_SIZE >= state.list.length;
  next.onclick = () => { state.page += 1; state.cur = 0; stop(); render(); window.scrollTo(0, 0); };
  list.append(el('div', { class: 'ar-row' }, prev, next));
  highlight();
}

function card(r, i) {
  const m = marks[r.h];
  const c = el('section', { class: `ar-item${m ? ` ${m.s}` : ''}`, 'aria-label': `Sentence ${r.n}` });
  const meta = [`#${r.n}`];
  if (r.ratio !== null) meta.push(`match ${Math.round(r.ratio * 100)}%`);
  if (r.sec !== null) meta.push(`${r.sec} s`);
  if (m) meta.push(m.s === 'flag' ? 'FLAGGED' : 'marked OK');
  c.append(el('p', { class: 'ar-meta', text: meta.join('  ·  ') }));
  c.append(el('p', { class: 'ar-text', text: r.t }));
  if (r.heard !== null) {
    const h = el('p', { class: 'ar-heard', text: `Heard: ${r.heard}` });
    if (r.extra.length || r.missing.length) {
      h.append(el('br'), el('span', { class: 'ar-warn', text: `${r.extra.length ? `Extra: ${r.extra.join(' / ')}. ` : ''}${r.missing.length ? `Missing: ${r.missing.join(' / ')}` : ''}` }));
    }
    c.append(h);
  }
  const listen = el('button', { type: 'button', text: 'Listen', 'aria-label': `Listen to sentence ${r.n}` });
  listen.onclick = () => { state.cur = i; highlight(); toggle(r, listen); };
  const note = el('input', { type: 'text', placeholder: 'What is wrong? (optional)', 'aria-label': `Note for sentence ${r.n}`, size: '30' });
  note.value = m?.note ?? '';
  note.oninput = () => { if (marks[r.h]) { marks[r.h].note = note.value; save(); } };
  const ok = el('button', { type: 'button', text: 'OK', 'aria-label': `Mark sentence ${r.n} as OK` });
  ok.onclick = () => mark(r, 'ok', note.value);
  const flag = el('button', { type: 'button', text: 'Flag', 'aria-label': `Flag sentence ${r.n}` });
  flag.onclick = () => mark(r, 'flag', note.value);
  const clear = el('button', { type: 'button', text: 'Clear', 'aria-label': `Clear the mark on sentence ${r.n}` });
  clear.onclick = () => { delete marks[r.h]; save(); render(); };
  c.append(el('div', { class: 'ar-row' }, listen, ok, flag, clear, note));
  c.addEventListener('click', () => { state.cur = i; highlight(); });
  return c;
}

function mark(r, s, noteText) {
  marks[r.h] = { s, note: noteText || '', n: r.n, t: r.t };
  save();
  const y = window.scrollY;
  const cur = state.cur;
  render();
  state.cur = cur; highlight();
  window.scrollTo(0, y);
}
const cards = () => [...document.querySelectorAll('.ar-item')];
function highlight() { cards().forEach((c, i) => c.classList.toggle('current', i === state.cur)); }
function go(d, play) {
  const cs = cards();
  state.cur = Math.max(0, Math.min(cs.length - 1, state.cur + d));
  highlight();
  const c = cs[state.cur];
  if (!c) return;
  c.scrollIntoView({ block: 'center' });
  if (play) { stop(); c.querySelector('button')?.click(); }
}

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, select, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
  const r = state.list[state.page * PAGE_SIZE + state.cur];
  if (e.key === 'j') go(1, true);
  else if (e.key === 'k') go(-1, true);
  else if (e.key === ' ' && !e.target.matches('button')) { e.preventDefault(); cards()[state.cur]?.querySelector('button')?.click(); }
  else if (e.key === 'f' && r) mark(r, 'flag', '');
  else if (e.key === 'o' && r) { mark(r, 'ok', ''); go(1, true); }
  else if (e.key === 'n') { e.preventDefault(); cards()[state.cur]?.querySelector('input')?.focus(); }
});

$('ar-filter').addEventListener('change', build);
$('ar-export').addEventListener('click', () => {
  const out = Object.entries(marks).filter(([, m]) => m.s === 'flag').map(([hash, m]) => ({ hash, number: m.n, text: m.t, note: m.note }));
  const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
  const a = el('a', { href: url, download: 'flagged-recordings.json' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

try {
  const res = await fetch(new URL('review.json', base));
  if (!res.ok) throw new Error(String(res.status));
  rows = await res.json();
  build();
} catch {
  $('ar-count').textContent = 'The recordings list could not be loaded. Run npm run book:review and rebuild.';
}
