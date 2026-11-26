// Checks on the PDF that Word exported, as pure functions over what was read from it (so they can be unit tested).
// Fonts and images come from pdfjs's operator list (see scripts/pdf-check.mjs); this file only judges them.

export const KDP_PAGE_LIMITS = [828, 776, 600];
export const MIN_PPI = 300;

/**
 * Images with their placed size, from a page's operator list. The current transform is tracked through save, restore and
 * transform, and an image is drawn into the unit square, so its placed width is the length of the transform's first column.
 * `OPS` is pdfjs's operator table. Returns [{ ppi, widthPx }].
 */
export function collectImages(fnArray, argsArray, OPS) {
  const out = [];
  const stack = [];
  let m = [1, 0, 0, 1, 0, 0];
  const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  fnArray.forEach((fn, i) => {
    const args = argsArray[i];
    if (fn === OPS.save) stack.push(m);
    else if (fn === OPS.restore) m = stack.pop() ?? m;
    else if (fn === OPS.transform) m = mul(m, args);
    else if (fn === OPS.paintImageXObject) {
      const widthPt = Math.hypot(m[0], m[1]);
      out.push({ widthPx: args[1], ppi: widthPt > 0 ? args[1] / (widthPt / 72) : Infinity });
    }
  });
  return out;
}

/** A font object from pdfjs counts as embedded when it was loaded from a font file in the PDF. */
export const fontIsEmbedded = (font) => !font.missingFile;
export const TRIM = { widthPt: 612, heightPt: 792, tolerancePt: 2 }; // 8.5 x 11 in

/**
 * `pdf`: { pageCount, pages: [{ width, height, text }], pdfa: boolean }. Returns [{ name, ok, detail }].
 * `limit` is KDP's page limit for the chosen ink and paper (828, 776 or 600).
 */
export function checkPdf(pdf, { limit = KDP_PAGE_LIMITS[0] } = {}) {
  const results = [];
  const add = (name, ok, detail) => results.push({ name, ok, detail });

  const wrongSize = pdf.pages.map((p, i) => ({ page: i + 1, p })).filter(({ p }) => Math.abs(p.width - TRIM.widthPt) > TRIM.tolerancePt || Math.abs(p.height - TRIM.heightPt) > TRIM.tolerancePt);
  add('page size is 8.5 x 11 in', wrongSize.length === 0, wrongSize.length ? `${wrongSize.length} pages differ, first is page ${wrongSize[0].page} (${wrongSize[0].p.width} x ${wrongSize[0].p.height} pt)` : `${pdf.pageCount} pages`);

  add(`page count is within KDP's limit of ${limit}`, pdf.pageCount <= limit && pdf.pageCount >= 24, `${pdf.pageCount} pages (KDP needs at least 24)`);

  const errors = pdf.pages.map((p, i) => ({ page: i + 1, p })).filter(({ p }) => /Error!/.test(p.text));
  add('no "Error!" text from a broken field', errors.length === 0, errors.length ? `on pages ${errors.slice(0, 8).map((e) => e.page).join(', ')}` : 'none');

  const contents = pdf.pages.slice(0, 40).find((p) => /^\s*Contents\b/.test(p.text));
  const entries = contents ? contents.text.split('\n').filter((l) => /\S.*\s\d+\s*$/.test(l)).length : 0;
  add('Contents is filled in', entries >= 10, contents ? `${entries} entries` : 'no Contents page found');

  const last = pdf.pages.slice(-60);
  const indexAt = last.findIndex((p) => /^\s*Index\b/.test(p.text));
  const words = indexAt < 0 ? 0 : last.slice(indexAt).reduce((n, p) => n + p.text.split(/\s+/).length, 0);
  add('Index is filled in', words >= 200, indexAt < 0 ? 'no Index page found' : `${words} words after the Index heading`);

  const loose = [...new Set(pdf.pages.flatMap((p) => (p.fonts ?? []).filter((f) => !f.embedded).map((f) => f.name)))];
  add('every font is embedded', loose.length === 0, loose.length ? `not embedded: ${loose.slice(0, 6).join(', ')}` : 'all embedded');

  const soft = pdf.pages.flatMap((p, i) => (p.images ?? []).map((img) => ({ page: i + 1, ...img }))).filter((img) => img.ppi < MIN_PPI);
  add(`every image is ${MIN_PPI} ppi or more`, soft.length === 0, soft.length ? `${soft.length} below, lowest ${Math.round(Math.min(...soft.map((s) => s.ppi)))} ppi on page ${soft.sort((a, b) => a.ppi - b.ppi)[0].page}` : 'all fine');

  add('exported as PDF/A', pdf.pdfa, pdf.pdfa ? 'PDF/A marker found' : 'no PDF/A marker: tick "ISO 19005-1 compliant (PDF/A)" when saving');
  return results;
}
