// Recorded audio for "Listen". A recording (a neural voice, or Greg's own) is looked
// up by a hash of the exact text it says, so editing a sentence quietly makes its
// old recording stop matching (the browser voice reads it instead) and the build
// tooling lists it as needing a new one. Clips are plain files on this site:
// nothing is fetched from anywhere else.
import { toSpoken } from './book-speech.mjs?m=42';

export const AUDIO_DIR = '/audio/book/';
export const AUDIO_TYPES = ['mp3', 'm4a', 'ogg', 'wav'];

/** A 64-bit hash (cyrb53 style, two 32-bit halves) as 16 hex characters. Stable across browsers and Node. */
export function hashText(text) {
  const s = String(text);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

/** The exact words for one Listen button: the question or key idea, plus what its picture shows. */
export function unitText(node) {
  const clone = node.cloneNode(true);
  const entry = node.matches?.('.g-entry');
  // A glossary entry reads as: the term, its meaning, examples, watch-out and flip-it, then what its picture shows.
  // The strand chips, "See also" and "Taught in" lines are for the eye and are left out.
  if (entry) clone.querySelectorAll('.chip, .g-see, .g-used, .g-fig').forEach((n) => n.remove());
  clone.querySelectorAll('.listen, .qnum, .term-pop').forEach((n) => n.remove());
  if (entry) {
    clone.querySelector('h3')?.append('. ');
    clone.querySelectorAll('p, .g-line, p > b').forEach((n) => n.append(' '));
  }
  clone.querySelectorAll('.frac').forEach((f) => {
    const top = f.querySelector('.fn')?.textContent ?? '';
    const bottom = f.querySelector('.fd')?.textContent ?? '';
    f.replaceWith(` the fraction ${top} over ${bottom}, `);
  });
  clone.querySelectorAll('sup').forEach((s) => {
    const p = s.textContent.trim();
    // f<sup>-1</sup>(x) is "f inverse of x", not "f to the power of minus one"
    const inverse = /^[−-]1$/.test(p) && /(^|[^A-Za-z0-9])[fgh]$/.test(s.previousSibling?.textContent ?? '') && /^\(/.test(s.nextSibling?.textContent ?? '');
    s.replaceWith(inverse ? ' inverse' : p === '2' ? ' squared ' : p === '3' ? ' cubed ' : ` to the power of ${p} `);
  });
  const picture = entry
    ? node.querySelector('.g-fig svg')?.getAttribute('aria-label')
    : node.closest('.q')?.querySelector(':scope > .qfig desc')?.textContent;
  // data-say: the author's own words for the voice, read instead of the displayed words
  const said = node.getAttribute?.('data-say');
  return toSpoken(said ?? clone.textContent) + (picture ? ` The picture shows: ${toSpoken(picture)}` : '');
}

/** Every Listen unit under a root: { hash, text }. Used by the page and by the tool that lists what needs recording. */
export function speechUnits(root = document) {
  const seen = new Map();
  for (const node of root.querySelectorAll('.qtext, .key, .g-entry')) {
    const text = unitText(node);
    if (text) seen.set(hashText(text), text);
  }
  return [...seen].map(([hash, text]) => ({ hash, text }));
}

/** The file name for a hash in a manifest, or null. Only plain file names of known audio types are accepted. */
export function clipFor(manifest, hash) {
  const file = manifest && typeof manifest === 'object' ? manifest[hash] : null;
  if (typeof file !== 'string') return null;
  const ok = new RegExp(`^${hash}\\.(${AUDIO_TYPES.join('|')})$`);
  return ok.test(file) ? file : null;
}

let manifestPromise = null;
export function loadManifest() {
  manifestPromise ??= fetch(`${AUDIO_DIR}manifest.json`, { credentials: 'omit', cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return manifestPromise;
}

let current = null; // { audio, onEnd } for the clip that is playing

/** Stop the clip that is playing (if any) and tell whoever started it. True when something was stopped. */
export function stopClip() {
  if (!current) return false;
  const { audio, onEnd } = current;
  current = null;
  audio.pause();
  onEnd?.();
  return true;
}

export const isClipPlaying = () => current !== null;

/**
 * Play the recording for this text if there is one. Resolves true when a clip is
 * playing (the caller then says nothing itself), false when the caller should
 * fall back to the browser voice. `rate` is the student's reading speed;
 * `onEnd` is called once when the clip ends or is stopped.
 */
export async function playClip(text, rate = 0.92, onEnd = null) {
  const manifest = await loadManifest();
  const file = clipFor(manifest, hashText(text));
  if (!file) return false;
  const audio = new Audio(`${AUDIO_DIR}${file}`);
  audio.playbackRate = Math.min(2, Math.max(0.5, rate / 0.92));
  const mine = { audio, onEnd };
  const finished = () => { if (current === mine) { current = null; onEnd?.(); } };
  audio.addEventListener('ended', finished);
  audio.addEventListener('error', finished);
  try {
    current = mine;
    await audio.play();
    return true;
  } catch {
    if (current === mine) current = null;
    return false;
  }
}
