// A tiny static server for the Word build: 127.0.0.1 only, on a free port, serving public/ plus a few extra folders.
// The path it opens is checked to stay inside the folder it belongs to.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };

/**
 * `mounts` maps a URL prefix to a folder, longest prefix first, e.g. { '/__front/': 'src/print/gcse', '/': 'public' }.
 * Returns { port, close }.
 */
export async function startServer(mounts) {
  const entries = Object.entries(mounts).sort((a, b) => b[0].length - a[0].length).map(([prefix, dir]) => [prefix, resolve(dir)]);
  const server = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const hit = entries.find(([prefix]) => url.startsWith(prefix));
      if (!hit) throw new Error('no mount');
      const [prefix, dir] = hit;
      const file = resolve(dir, `.${sep}${url.slice(prefix.length)}`);
      if (file !== dir && !file.startsWith(dir + sep)) throw new Error('outside the folder');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return { port: server.address().port, close: () => new Promise((ok) => server.close(ok)) };
}
