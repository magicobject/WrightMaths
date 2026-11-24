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
