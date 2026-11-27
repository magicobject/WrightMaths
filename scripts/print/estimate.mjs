// A rough page count for the printed book, worked out from the trees without a Word-to-PDF converter.
// It is a planning figure (about 20% either way), not a promise: Word's own count, or the exported PDF, is the real one.
// Use `npm run book:pdf-check` on the PDF for the number KDP will see.

import { allTexts } from './render.mjs';

// 8.5 x 11 in page, 0.75 in margins: about 9.5 in of text height. Calibri 11 pt with the book's spacing and boxes fits about
// 420 words a page in a chapter and about 520 in the denser answers, hints and glossary.
export const WORDS_PER_PAGE = { chapter: 420, answers: 520, hints: 520, glossary: 380, front: 400 };
export const TEXT_HEIGHT_IN = 9.5;
const ENTRIES_PER_INDEX_PAGE = 110; // two columns of about 55 lines
const TOC_LINES_PER_PAGE = 45;
export const LINES_PER_PAGE = 42; // answer and hint entries are short and each starts a line, so with short answers the line count, not the word count, fills the page

export const wordCount = (texts) => [...texts].reduce((n, t) => n + (String(t).match(/\S+/g)?.length ?? 0), 0);

/**
 * parts: { front, chapters, answers, hints, glossary } word counts; figureHeightIn: all placed figure heights added up;
 * lines (optional) { answers, hints }: the lines those parts take, when they are short enough that lines decide the page count;
 * chapterCount, tocEntries, indexEntries: counts. Returns the pages for each part and the total.
 */
export function estimatePages({ words, lines = {}, figureHeightIn = 0, chapterCount = 0, tocEntries = 0, indexEntries = 0 }) {
  const pages = (n, per) => Math.ceil(n / per);
  const front = pages(words.front, WORDS_PER_PAGE.front) + 2; // title and copyright pages
  const toc = Math.max(1, pages(tocEntries, TOC_LINES_PER_PAGE));
  // every chapter starts on a new page, so each wastes half a page on average
  const chapters = pages(words.chapters, WORDS_PER_PAGE.chapter) + Math.ceil(figureHeightIn / TEXT_HEIGHT_IN) + Math.ceil(chapterCount / 2);
  const answers = Math.max(pages(words.answers, WORDS_PER_PAGE.answers), pages(lines.answers ?? 0, LINES_PER_PAGE)) + 1;
  const hints = words.hints ? Math.max(pages(words.hints, WORDS_PER_PAGE.hints), pages(lines.hints ?? 0, LINES_PER_PAGE)) + 1 : 0;
  const glossary = pages(words.glossary, WORDS_PER_PAGE.glossary) + 1;
  const index = Math.max(1, pages(indexEntries, ENTRIES_PER_INDEX_PAGE)) + 1;
  const total = front + toc + chapters + answers + hints + glossary + index;
  return { front, contents: toc, chapters, answers, hints, glossary, index, total };
}

/** Words in the texts of a list of trees. */
export const wordsIn = (trees) => wordCount(trees.flatMap((t) => [...allTexts(t)]));
