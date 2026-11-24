import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankVoice, bestVoice, isOnline, voiceLabel } from '../public/js/book-voice.mjs';
import { matches } from '../public/js/book-answer.mjs';

const voices = [
  { name: 'Microsoft David Desktop', lang: 'en-US', localService: true },
  { name: 'Microsoft Sonia Online (Natural) - English (United Kingdom)', lang: 'en-GB', localService: false },
  { name: 'Google UK English Female', lang: 'en-GB', localService: false },
  { name: 'Daniel (Enhanced)', lang: 'en-GB', localService: true },
  { name: 'Amelie', lang: 'fr-FR', localService: true },
];

test('by default only on-device voices are used, never an online one', () => {
  assert.equal(bestVoice(voices).name, 'Daniel (Enhanced)');
  assert.equal(bestVoice(voices.filter((v) => v.localService === false)), null);
});

test('an online voice is used only if the student chose it, and is labelled as online', () => {
  assert.equal(bestVoice(voices, 'Google UK English Female').name, 'Google UK English Female');
  assert.match(voiceLabel(voices[1]), /online: the text is sent/);
  assert.match(voiceLabel(voices[3]), /on this device/);
});

test('non-English voices are not offered, and a vanished choice falls back to the best local voice', () => {
  assert.equal(rankVoice(voices[4]), -1);
  assert.equal(bestVoice(voices, 'Gone Voice').name, 'Daniel (Enhanced)');
  assert.equal(isOnline({ name: 'Some Online voice', lang: 'en-GB' }), true);
});

test('the answer checker does not freeze on huge or hostile input', () => {
  for (const input of ['a' + ' '.repeat(100000) + 'x', '1'.repeat(100000) + 'x', '√'.repeat(50000)]) {
    const t = Date.now();
    assert.equal(matches(input, ['5']), false);
    assert.ok(Date.now() - t < 100, 'took too long');
  }
});
