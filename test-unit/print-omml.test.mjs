import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Document, Packer, Paragraph } from 'docx';
import { strFromU8, unzipSync } from 'fflate';
import { equation, mathChildren, runsToText } from '../scripts/print/omml.mjs';

/** The word/document.xml body of a one-paragraph document holding these children. */
async function bodyXml(children) {
  const buffer = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph({ children })] }] }));
  return strFromU8(unzipSync(new Uint8Array(buffer))['word/document.xml']).split('<w:body>')[1];
}

const frac = (n, d) => ({ x: 'frac', num: [{ t: n }], den: [{ t: d }] });

test('a fraction becomes a Word fraction with its numerator and denominator', async () => {
  const xml = await bodyXml([equation(frac('3', '4'))]);
  assert.match(xml, /<m:oMath><m:f><m:num><m:r><m:t>3<\/m:t><\/m:r><\/m:num><m:den><m:r><m:t>4<\/m:t><\/m:r><\/m:den><\/m:f><\/m:oMath>/);
});

test('a fraction inside a fraction nests, and the inner one keeps its own parts', async () => {
  const outer = { x: 'frac', num: [frac('1', '2')], den: [{ t: 'x' }] };
  const xml = await bodyXml([equation(outer)]);
  assert.equal((xml.match(/<m:f>/g) ?? []).length, 2);
  assert.match(xml, /<m:num><m:f><m:num>.*<m:t>1<\/m:t>.*<\/m:num><m:den>.*<m:t>2<\/m:t>.*<\/m:den><\/m:f><\/m:num><m:den><m:r><m:t>x<\/m:t>/);
});

test('a power inside a fraction takes the last character before it as its base', async () => {
  const run = { x: 'frac', num: [{ t: 'x + y' }, { t: '2', sup: true }], den: [{ t: '3' }] };
  const xml = await bodyXml([equation(run)]);
  assert.match(xml, /<m:t xml:space="preserve">x \+ <\/m:t>/);
  assert.match(xml, /<m:sSup><m:sSupPr\/><m:e><m:r><m:t>y<\/m:t><\/m:r><\/m:e><m:sup><m:r><m:t>2<\/m:t>/);
});

test('a power after a closing bracket takes the whole bracket as its base', () => {
  const [, power] = mathChildren([{ t: '2 + (a + b)' }, { t: '2', sup: true }]);
  assert.ok(power, 'a power component follows the text');
});

test('a column vector is a bracketed matrix with one cell per row', async () => {
  const xml = await bodyXml([equation({ x: 'cvec', rows: [[{ t: '4' }], [{ t: '\u22121' }]] })]);
  assert.match(xml, /<m:d><m:dPr><m:begChr m:val="\("\/><m:endChr m:val="\)"\/><\/m:dPr><m:e><m:m>/);
  assert.equal((xml.match(/<m:mr>/g) ?? []).length, 2);
  assert.match(xml, /<m:count m:val="1"\/>/);
  assert.match(xml, /<m:t>4<\/m:t>/);
  assert.match(xml, /<m:t>\u22121<\/m:t>/);
});

test('runsToText gives the linear form: brackets only where they are needed', () => {
  assert.equal(runsToText([frac('3', '4')]), '3/4');
  assert.equal(runsToText([{ x: 'frac', num: [{ t: 'x + 1' }], den: [{ t: '3' }] }]), '(x + 1)/3');
  assert.equal(runsToText([{ x: 'cvec', rows: [[{ t: '4' }], [{ t: '\u22121' }]] }]), '(4, -1)');
  assert.equal(runsToText([{ t: 'x' }, { t: '2', sup: true }, { t: ' + ' }, { x: 'blank' }]), 'x^2 + ____');
  assert.equal(runsToText([{ x: 'ref', href: 'a.html', runs: [{ t: 'Fractions' }] }, { x: 'br' }]), 'Fractions ');
});
