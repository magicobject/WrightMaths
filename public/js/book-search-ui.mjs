// The search box in the header of the book's pages. It is the only code that touches the page;
// the matching itself is in book-search.mjs.
//
// Privacy: the index is one small file from this same site, fetched the first time the box is used (not on every
// page load). The query is never stored, never sent anywhere and never put in the address.
import { searchIndex, emptyAdvice } from './book-search.mjs?m=2';

const MAX_RESULTS = 6;
const KIND_LABEL = { Topic: 'Topic', Term: 'Word meaning', Page: 'Page' };

function init() {
  const form = document.querySelector('form.book-search');
  if (!form) return;
  const input = form.querySelector('input');
  const list = form.querySelector('.book-search-results');
  const empty = form.querySelector('.book-search-empty');
  const status = form.querySelector('#book-search-status');
  const indexUrl = new URL(form.dataset.index, document.baseURI);
  form.hidden = false;

  let entries = null;
  let loading = null;
  let active = -1;
  let shown = [];

  const load = () => {
    // A failed load is forgotten, so the next search tries again.
    loading ??= fetch(indexUrl, { credentials: 'omit', cache: 'no-cache' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('index not available'))))
      .then((data) => { entries = Array.isArray(data) ? data : []; })
      .catch(() => { entries = null; loading = null; });
    return loading;
  };

  const options = () => [...list.querySelectorAll('[role="option"]')];

  function setActive(index) {
    const items = options();
    items.forEach((item, i) => item.setAttribute('aria-selected', String(i === index)));
    active = index;
    if (index >= 0) {
      input.setAttribute('aria-activedescendant', items[index].id);
      items[index].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function close() {
    list.hidden = true;
    list.replaceChildren();
    empty.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    setActive(-1);
    shown = [];
  }

  function line(className, text) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
  }

  function render(query, results) {
    close();
    if (!results.length) {
      const message = document.createElement('span');
      message.textContent = `Nothing matched \u201c${query}\u201d. ${emptyAdvice(query)} `;
      const browse = document.createElement('a');
      browse.href = new URL('index.html', indexUrl).href;
      browse.textContent = 'Browse all topics';
      empty.replaceChildren(message, browse);
      empty.hidden = false;
      status.textContent = message.textContent;
      return;
    }
    const count = document.createElement('li');
    count.setAttribute('role', 'presentation');
    count.className = 'book-search-count';
    count.textContent = `${results.length} result${results.length === 1 ? '' : 's'}`;
    list.append(count);
    shown = results;
    results.forEach((entry, i) => {
      const item = document.createElement('li');
      item.setAttribute('role', 'presentation');
      const link = document.createElement('a');
      link.setAttribute('role', 'option');
      link.id = `book-search-option-${i}`;
      link.setAttribute('aria-selected', 'false');
      link.tabIndex = -1;
      link.href = new URL(entry.u, indexUrl).href;
      const badge = entry.k === 'Section'
        ? `Jump to this part \u00b7 Part of: ${entry.p}`
        : [i === 0 && entry.k === 'Topic' ? 'Start here' : '', KIND_LABEL[entry.k] ?? entry.k, entry.s].filter(Boolean).join(' \u00b7 ');
      link.append(line(`bs-badge bs-badge-${entry.k.toLowerCase()}`, badge), line('bs-title', entry.t));
      if (entry.d) link.append(line('bs-snippet', entry.d));
      item.append(link);
      list.append(item);
    });
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    status.textContent = `${results.length} result${results.length === 1 ? '' : 's'}. Use the up and down arrows, then Enter.`;
  }

  async function update() {
    const query = input.value.trim();
    if (!query) { close(); status.textContent = ''; return; }
    await load();
    if (input.value.trim() !== query) return; // typed on while the index loaded
    if (!entries) {
      close();
      empty.textContent = 'Search is not available, please reload the page.';
      empty.hidden = false;
      status.textContent = empty.textContent;
      return;
    }
    render(query, searchIndex(query, entries, MAX_RESULTS));
  }

  input.addEventListener('focus', load, { once: true });
  input.addEventListener('input', update);
  input.addEventListener('keydown', (event) => {
    const count = shown.length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!count) return;
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive(active === -1 ? (step === 1 ? 0 : count - 1) : (active + step + count) % count);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = options()[active === -1 ? 0 : active];
      if (target) location.href = target.href;
    } else if (event.key === 'Escape') {
      if (!list.hidden || !empty.hidden) { event.preventDefault(); close(); status.textContent = ''; } else if (input.value) { input.value = ''; }
    }
  });
  form.addEventListener('submit', (event) => event.preventDefault());
  // Keep focus in the box while a result is pressed, so the page does not lose its place first.
  list.addEventListener('mousedown', (event) => event.preventDefault());
  document.addEventListener('click', (event) => { if (!form.contains(event.target)) close(); });
  form.addEventListener('focusout', () => { setTimeout(() => { if (!form.contains(document.activeElement)) close(); }, 0); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
