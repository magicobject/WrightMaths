// Checks on the PDF that Word exported, as pure functions over what was read from it (so they can be unit tested).
// TODO (not checked yet, and reported as such): embedded fonts, and the ppi of each image. Both need the operator list of
// every page from pdfjs-dist; until then the README tells Greg to tick PDF/A when exporting, which makes Word embed fonts.

export const KDP_PAGE_LIMITS = [828, 776, 600];
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

  add('exported as PDF/A', pdf.pdfa, pdf.pdfa ? 'PDF/A marker found' : 'no PDF/A marker: tick "ISO 19005-1 compliant (PDF/A)" when saving');
  return results;
}
