import { test } from 'node:test';
import assert from 'node:assert/strict';
import { get } from 'node:http';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startServer } from '../scripts/print/server.mjs';

const request = (port, path) => new Promise((ok, no) => {
  get({ host: '127.0.0.1', port, path }, (res) => { res.resume(); res.on('end', () => ok(res.statusCode)); }).on('error', no);
});

test('the Word build server binds to 127.0.0.1, serves its folder and refuses to leave it', async () => {
  const base = mkdtempSync(join(tmpdir(), 'wm-print-'));
  const root = join(base, 'public');
  mkdirSync(root);
  writeFileSync(join(root, 'ok.html'), '<p>ok</p>');
  writeFileSync(join(base, 'secret.txt'), 'outside the folder');
  const server = await startServer({ '/': root });
  try {
    assert.equal(server.host, '127.0.0.1');
    assert.equal(await request(server.port, '/ok.html'), 200);
    for (const path of ['/../secret.txt', '/%2e%2e/secret.txt', '/..%5csecret.txt', '/%2e%2e%5csecret.txt', '/ok.html%00.txt', '/nope.html']) {
      assert.equal(await request(server.port, path), 404, path);
    }
  } finally {
    await server.close();
  }
});

test('a mount only serves its own prefix, and the longest prefix wins', async () => {
  const base = mkdtempSync(join(tmpdir(), 'wm-print-'));
  mkdirSync(join(base, 'a'));
  mkdirSync(join(base, 'b'));
  writeFileSync(join(base, 'a', 'x.txt'), 'a');
  writeFileSync(join(base, 'b', 'x.txt'), 'b');
  const server = await startServer({ '/': join(base, 'a'), '/other/': join(base, 'b') });
  try {
    assert.equal(await request(server.port, '/x.txt'), 200);
    assert.equal(await request(server.port, '/other/x.txt'), 200);
    assert.equal(await request(server.port, '/other/../x.txt'), 200); // the client path is normalised by the URL parser, and stays inside a mount
    // the URL parser reads %2e%2e as .., so this is /x.txt and never reaches above the root mount
    assert.equal(await request(server.port, '/other/%2e%2e/%2e%2e/x.txt'), 200);
  } finally {
    await server.close();
  }
});
