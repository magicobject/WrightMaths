// The books moved from /books/ to /courses/ on 27 Nov 2026. Old links and search results must keep working.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rules = readFileSync(join(import.meta.dirname, '..', 'public', '_redirects'), 'utf8').trim().split(/\r?\n/); // Windows checkouts turn the file's line endings into CRLF

test('every old /books address sends a permanent redirect to the same place under /courses', () => {
  assert.ok(rules.includes('/books /courses/ 301'));
  assert.ok(rules.includes('/books/ /courses/ 301'));
  assert.ok(rules.includes('/books/* /courses/:splat 301'));
});
