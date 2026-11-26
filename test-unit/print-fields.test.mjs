import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { strFromU8, unzipSync } from 'fflate';
import { field, fieldQuote, indexField, pageField, tocField, xe } from '../scripts/print/fields.mjs';
import { patchSettings } from '../scripts/print/docx-settings.mjs';

async function build(children, options = {}) {
  const buffer = await Packer.toBuffer(new Document({ ...options, sections: [{ children: [new Paragraph({ children })] }] }));
  return { buffer, files: unzipSync(new Uint8Array(buffer)) };
}
const body = async (children) => strFromU8((await build(children)).files['word/document.xml']).split('<w:body>')[1];

test('a field is begin, instruction, separate, result, end, in that order', async () => {
  const xml = await body(field('PAGE', [new TextRun('7')]));
  const order = [...xml.matchAll(/w:fldCharType="(\w+)"|<w:instrText[^>]*>([^<]*)<|<w:t[^>]*>([^<]*)</g)].map((m) => m[1] ?? m[2]?.trim() ?? m[3]);
  assert.deepEqual(order, ['begin', 'PAGE', 'separate', '7', 'end']);
});

test('an index entry is hidden, has no result, and is bold only where a term is taught', async () => {
  const plain = await body(xe('fraction'));
  assert.match(plain, /<w:vanish\/>/);
  assert.doesNotMatch(plain, /separate/);
  assert.match(plain, /XE &quot;fraction&quot; <\/w:instrText>/);
  assert.match(await body(xe('fraction', { bold: true })), /XE &quot;fraction&quot; \\b <\/w:instrText>/);
});

test('field arguments are quoted: a quote becomes two single quotes and a backslash is doubled', () => {
  assert.equal(fieldQuote('say "hi"'), '"say \'\'hi\'\'"');
  assert.equal(fieldQuote('a\\b'), '"a\\\\b"');
});

test('the contents field lists chapters and has no hyperlinks; the index field makes two columns', async () => {
  const toc = await body(tocField([new TextRun('x')]));
  assert.match(toc, /TOC \\o &quot;1-1&quot;/);
  assert.doesNotMatch(toc, /\\h/);
  assert.match(await body(indexField([new TextRun('x')])), /INDEX \\c &quot;2&quot;/);
  assert.match(await body(pageField([new TextRun('1')])), /> PAGE </);
});

test('the Word settings: update fields on open, mirrored margins, do not compress pictures, in schema order', async () => {
  const { buffer } = await build([new TextRun('x')], { features: { updateFields: true } });
  const xml = strFromU8(unzipSync(new Uint8Array(patchSettings(buffer)))['word/settings.xml']);
  assert.match(xml, /<w:updateFields\/>/);
  assert.match(xml, /<w:displayBackgroundShape\/><w:mirrorMargins\/>/);
  assert.match(xml, /<\/w:compat><w:doNotAutoCompressPictures\/>/);
  // asking twice changes nothing
  const again = strFromU8(unzipSync(new Uint8Array(patchSettings(patchSettings(buffer))))['word/settings.xml']);
  assert.equal(again, xml);
});
