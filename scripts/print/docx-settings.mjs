// Word settings the docx library cannot write: mirrored margins (inside and outside, for a printed book) and
// "do not compress pictures". Both go in word/settings.xml, in the places the file format puts them.

import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

/** Add the two settings to a .docx (a Uint8Array or Buffer). Returns a Buffer. */
export function patchSettings(docx) {
  const files = unzipSync(new Uint8Array(docx));
  let xml = strFromU8(files['word/settings.xml']);
  if (!xml.includes('<w:mirrorMargins')) {
    // mirrorMargins comes after displayBackgroundShape and before everything else the library writes
    xml = xml.includes('<w:displayBackgroundShape/>')
      ? xml.replace('<w:displayBackgroundShape/>', '<w:displayBackgroundShape/><w:mirrorMargins/>')
      : xml.replace(/(<w:settings[^>]*>)/, '$1<w:mirrorMargins/>');
  }
  if (!xml.includes('<w:doNotAutoCompressPictures')) {
    // doNotAutoCompressPictures comes after compat
    xml = xml.includes('</w:compat>') ? xml.replace('</w:compat>', '</w:compat><w:doNotAutoCompressPictures/>') : xml.replace('</w:settings>', '<w:doNotAutoCompressPictures/></w:settings>');
  }
  files['word/settings.xml'] = strToU8(xml);
  return Buffer.from(zipSync(files));
}
