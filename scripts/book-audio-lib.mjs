// Pure helpers for the recorded-audio tooling (scripts/book-audio.mjs). No file I/O or
// browser here, so test-unit/book-audio.test.mjs can exercise them directly.
import { AUDIO_TYPES } from '../public/js/book-audio.mjs';

const CLIP_NAME = new RegExp(`^([0-9a-f]{16})\\.(${AUDIO_TYPES.join('|')})$`);

/** From the file names in the audio folder, the manifest { hash: "hash.ext" }. Other files are ignored. */
export function buildManifest(fileNames) {
  const manifest = {};
  for (const name of [...fileNames].sort()) {
    const m = CLIP_NAME.exec(name);
    if (m) manifest[m[1]] = name;
  }
  return manifest;
}

/** Units (from the pages) that have no recording yet, in book order. */
export function missingUnits(units, manifest) {
  return units.filter((u) => !manifest[u.hash]);
}

/** Recordings whose text no longer appears anywhere in the book (the sentence was edited or removed). */
export function orphanClips(units, manifest) {
  const live = new Set(units.map((u) => u.hash));
  return Object.keys(manifest).filter((h) => !live.has(h));
}

/** A numbered reading script: "001  <text>". The number is what a recording is named after when imported. */
export function scriptSheet(units) {
  const width = Math.max(3, String(units.length).length);
  return units.map((u, i) => ({ number: String(i + 1).padStart(width, '0'), hash: u.hash, text: u.text }));
}

/** Which unit a recording file name such as "012.mp3" belongs to, given the sheet. */
export function unitForRecording(sheet, fileName) {
  const m = /^(\d+)\.([a-z0-9]+)$/i.exec(fileName);
  if (!m || !AUDIO_TYPES.includes(m[2].toLowerCase())) return null;
  const row = sheet.find((r) => Number(r.number) === Number(m[1]));
  return row ? { hash: row.hash, ext: m[2].toLowerCase() } : null;
}

/** Fill {out} in the engine command template with a quoted path. Throws when the template has no {out}. */
export function engineCommand(template, outPath) {
  if (!template || !template.includes('{out}')) throw new Error('WM_TTS_CMD must contain {out}, the file the engine writes');
  return template.replaceAll('{out}', `"${outPath}"`);
}

const escapeHtml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The words on the page, tidied for comparing with what is spoken: spaces collapsed, nothing else changed. */
export const tidyDisplay = (text) => String(text).replace(/\s+/g, ' ').trim();

/**
 * One self-contained web page (its own small script, nothing loaded from elsewhere, nothing sent anywhere) listing, for every
 * sentence a Listen button reads, the words on the page next to the words the voice is given.
 * rows: { page, display, spoken, hash, says, recorded }. Rows whose spoken words differ from the page words (numbers, symbols,
 * data-say) are marked, so a reviewer can read those first.
 */
// Rows worth listening to first: the voice must work out what a symbol or function means (almost every sentence differs a
// little, because numbers become words, so "differs" alone would not narrow the list).
const NOTATION = /(?<![A-Za-z0-9])[A-Za-z]{1,2}\(|[√π≤≥≠∠^⁻]|P\(/;
export const needsEars = (r) => Boolean(r.says) || NOTATION.test(r.display);

export function reviewPage(rows, { generated = '' } = {}) {
  const notation = rows.filter(needsEars);
  const body = rows.map((r, i) => {
    const tags = [needsEars(r) ? 'notation' : '', r.says ? 'data-say' : '', r.recorded ? 'recorded' : 'no recording'].filter(Boolean);
    return `<tr class="${needsEars(r) ? 'notation' : 'plain'}" id="r${i + 1}"><td class="n">${i + 1}</td><td class="pg">${escapeHtml(r.page)}</td>`
      + `<td>${escapeHtml(tidyDisplay(r.display))}</td><td class="sp">${escapeHtml(r.spoken)}</td><td class="tg">${escapeHtml(tags.join(', '))}</td></tr>`;
  }).join('\n');
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>What the Listen voice says</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#1a1a2e;--line:#c9ccd8;--mark:#fff3b0;--mark-fg:#1a1a2e;--sp:#0b3d91}
@media (prefers-color-scheme:dark){:root{--bg:#14161f;--fg:#eceef6;--line:#3a3e52;--mark:#4a4300;--mark-fg:#fff6c2;--sp:#9ec1ff}}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif}
h1{font-size:1.4rem;margin:0 0 4px}p{max-width:70ch}
label{margin-right:16px}table{border-collapse:collapse;width:100%;margin-top:12px}
th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
th{position:sticky;top:0;background:var(--bg)}
tr.notation td.sp{background:var(--mark);color:var(--mark-fg)}td.sp{color:var(--sp)}td.n,td.tg,td.pg{white-space:nowrap;font-size:.85rem}
</style></head><body>
<h1>What the Listen voice says</h1>
<p>${rows.length} sentences. ${notation.length} use notation the voice has to interpret (a function such as f(x), a probability P(A), a root, an angle sign, a power, or a <code>data-say</code> override); their &ldquo;What the voice is given&rdquo; cell is coloured. Numbers, units and money are turned into words in all of them, so every row differs a little. Read that column as if you were the voice. If one is wrong, fix the rule in <code>public/js/book-speech.mjs</code> or add <code>data-say</code> to that sentence in <code>src/pages/courses/gcse/</code>, then run <code>npm run book:audio -- make</code>.${generated ? ` Made ${escapeHtml(generated)}.` : ''}</p>
<p><label><input type="checkbox" id="only"> Show only the sentences with notation</label> <label>Search <input type="search" id="q"></label></p>
<table><thead><tr><th>#</th><th>Page</th><th>What is written</th><th>What the voice is given</th><th>Notes</th></tr></thead>
<tbody>
${body}
</tbody></table>
<script>
const only=document.getElementById('only'),q=document.getElementById('q'),rows=[...document.querySelectorAll('tbody tr')];
function apply(){const t=q.value.toLowerCase();for(const r of rows){r.hidden=(only.checked&&!r.classList.contains('notation'))||(t&&!r.textContent.toLowerCase().includes(t));}}
only.addEventListener('change',apply);q.addEventListener('input',apply);
</script>
</body></html>
`;
}
