// Recorded audio for "Listen". A recording (a neural voice, or Greg's own) is looked
// up by a hash of the exact text it says, so editing a sentence quietly makes its
// old recording stop matching (the browser voice reads it instead) and the build
// tooling lists it as needing a new one. Clips are plain files on this site:
// nothing is fetched from anywhere else.
import { toSpoken } from './book-speech.mjs';

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
  clone.querySelectorAll('.listen, .qnum, .term-pop').forEach((n) => n.remove());
  clone.querySelectorAll('.frac').forEach((f) => {
    const top = f.querySelector('.fn')?.textContent ?? '';
    const bottom = f.querySelector('.fd')?.textContent ?? '';
    f.replaceWith(` the fraction ${top} over ${bottom}, `);
  });
  clone.querySelectorAll('sup').forEach((s) => {
    const p = s.textContent.trim();
    s.replaceWith(p === '2' ? ' squared ' : p === '3' ? ' cubed ' : ` to the power of ${p} `);
  });
  const picture = node.closest('.q')?.querySelector(':scope > .qfig desc')?.textContent;
  return toSpoken(clone.textContent) + (picture ? ` The picture shows: ${toSpoken(picture)}` : '');
}

/** Every Listen unit under a root: { hash, text }. Used by the page and by the tool that lists what needs recording. */
export function speechUnits(root = document) {
  const seen = new Map();
  for (const node of root.querySelectorAll('.qtext, .key')) {
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
  manifestPromise ??= fetch(`${AUDIO_DIR}manifest.json`, { credentials: 'omit' })
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return manifestPromise;
}

let current = null;

export function stopClip() {
  if (!current) return false;
  current.pause();
  current = null;
  return true;
}

export const isClipPlaying = () => current !== null;

/**
 * Play the recording for this text if there is one. Resolves true when a clip is
 * playing (the caller then says nothing itself), false when the caller should
 * fall back to the browser voice. `rate` is the student's reading speed.
 */
export async function playClip(text, rate = 0.92) {
  const manifest = await loadManifest();
  const file = clipFor(manifest, hashText(text));
  if (!file) return false;
  const audio = new Audio(`${AUDIO_DIR}${file}`);
  audio.playbackRate = Math.min(2, Math.max(0.5, rate / 0.92));
  audio.addEventListener('ended', () => { if (current === audio) current = null; });
  try {
    current = audio;
    await audio.play();
    return true;
  } catch {
    if (current === audio) current = null;
    return false;
  }
}
