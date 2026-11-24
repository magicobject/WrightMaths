import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { hashText, clipFor } from '../public/js/book-audio.mjs';
import { buildManifest, missingUnits, orphanClips, scriptSheet, unitForRecording, engineCommand } from '../scripts/book-audio-lib.mjs';

test('the hash is 16 hex characters, stable, and changes with any edit to the text', () => {
  const h = hashText('What is 3 plus 4?');
  assert.match(h, /^[0-9a-f]{16}$/);
  assert.equal(hashText('What is 3 plus 4?'), h);
  assert.notEqual(hashText('What is 3 plus 5?'), h);
  assert.notEqual(hashText('What is 3 plus 4? '), h);
  // Pinned so a change to the hash (which would orphan every recording) is noticed.
  assert.equal(hashText('abc'), '7a91f9f91ac18c8d');
});

test('a manifest entry is only trusted if it is exactly "<hash>.<audio type>"', () => {
  const h = hashText('hello');
  assert.equal(clipFor({ [h]: `${h}.mp3` }, h), `${h}.mp3`);
  assert.equal(clipFor({ [h]: '../secret.mp3' }, h), null);
  assert.equal(clipFor({ [h]: `${h}.html` }, h), null);
  assert.equal(clipFor({ [h]: `${hashText('other')}.mp3` }, h), null);
  assert.equal(clipFor(null, h), null);
  assert.equal(clipFor({}, h), null);
});

test('manifest, missing and orphan lists', () => {
  const a = hashText('a'); const b = hashText('b'); const gone = hashText('gone');
  const manifest = buildManifest([`${a}.mp3`, `${gone}.wav`, 'manifest.json', 'notes.txt']);
  assert.deepEqual(Object.keys(manifest).sort(), [a, gone].sort());
  const units = [{ hash: a, text: 'a' }, { hash: b, text: 'b' }];
  assert.deepEqual(missingUnits(units, manifest).map((u) => u.hash), [b]);
  assert.deepEqual(orphanClips(units, manifest), [gone]);
});

test('imported recordings are matched to the numbered script', () => {
  const sheet = scriptSheet([{ hash: hashText('a'), text: 'a' }, { hash: hashText('b'), text: 'b' }]);
  assert.equal(sheet[1].number, '002');
  assert.deepEqual(unitForRecording(sheet, '002.MP3'), { hash: hashText('b'), ext: 'mp3' });
  assert.equal(unitForRecording(sheet, '009.mp3'), null);
  assert.equal(unitForRecording(sheet, '002.exe'), null);
});

test('the engine command needs {out} and quotes the path', () => {
  assert.equal(engineCommand('piper --output_file {out}', '/x/y.wav'), 'piper --output_file "/x/y.wav"');
  assert.throws(() => engineCommand('piper', '/x/y.wav'));
});

test('every recording in the shipped manifest exists as a file', () => {
  const dir = new URL('../public/audio/book/', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8'));
  for (const [hash, file] of Object.entries(manifest)) {
    assert.equal(clipFor(manifest, hash), file, `${hash} entry is malformed`);
    assert.ok(existsSync(new URL(file, dir)), `${file} is listed but missing`);
  }
});
