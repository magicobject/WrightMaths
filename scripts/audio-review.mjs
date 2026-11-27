// Writes public/audio/book/review.json: the list behind the private review page
// (/courses/gcse/audio-review.html, not linked from anywhere), which plays every Listen
// recording and lets Greg flag the ones that sound wrong.
//
//   npm run book:audio -- all     (writes audio-work/all.json, every sentence)
//   python scripts/audio-check.py (optional: what a speech model heard, to rank suspicious clips)
//   npm run book:review           (this script)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORK = join(ROOT, 'audio-work');
const CLIPS = join(ROOT, 'public', 'audio', 'book');
const all = JSON.parse(readFileSync(join(WORK, 'all.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(CLIPS, 'manifest.json'), 'utf8'));

const checks = new Map();
const checkFile = join(WORK, 'check.jsonl');
if (existsSync(checkFile)) {
  for (const line of readFileSync(checkFile, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    checks.set(r.hash, r); // a later line replaces an earlier duplicate
  }
}

// Keep the checks already in review.json (check.jsonl lives in the untracked audio-work/), keyed by hash,
// so a rebuild after re-recording drops deleted clips without losing the transcriptions of the rest.
const reviewFile = join(CLIPS, 'review.json');
if (existsSync(reviewFile)) {
  for (const r of JSON.parse(readFileSync(reviewFile, 'utf8'))) {
    if (r.heard !== null && !checks.has(r.h)) checks.set(r.h, { heard: r.heard, ratio: r.ratio, extra: r.extra, missing: r.missing, seconds: r.sec });
  }
}

// Only clips whose text is still current are listed (a clip checked before its sentence changed would mislead).
const rows = all.filter((r) => manifest[r.hash]).map((r) => {
  const c = checks.get(r.hash);
  return { n: r.number, h: r.hash, t: r.text, f: manifest[r.hash], heard: c?.heard ?? null, ratio: c?.ratio ?? null, extra: c?.extra ?? [], missing: c?.missing ?? [], sec: c?.seconds ?? null };
});
writeFileSync(join(CLIPS, 'review.json'), `${JSON.stringify(rows)}\n`);
console.log(`public/audio/book/review.json written: ${rows.length} clips, ${rows.filter((r) => r.heard !== null).length} with a transcription check.`);
