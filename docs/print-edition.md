# The GCSE book in print: the Word (.docx) build

**Status:** design, 26 Nov 2026. The goal is a single `.docx` of the whole GCSE book. Greg opens it in Word, checks it, saves it as PDF and uploads it to Amazon KDP. It comes from the same source as the website, so a fix to a topic page fixes both.

## What gets built

`npm run book:docx` writes `dist/gcse-book.docx`. `dist/` is already in `.gitignore`, so the file is never committed. It does not run on deploy: the website build is unchanged.

## How it works

1. `npm run build` makes the web pages as now.
2. `scripts/build-docx.mjs` opens each built page in Playwright's Chromium **with JavaScript turned off**. That gives the page's static form, with no Listen buttons, progress bars, pop-ups or answer boxes. Without JS the pages already show hints and solutions in full (`docs/book-authoring.md`).
3. A walker running in the page turns the `<main>` content into a small JSON tree: headings, paragraphs, runs (bold, italic, sup, sub), lists, tables, figures, MathML and questions. It **drops** everything in the "Dropped" list below and keeps the rest. Each figure `<svg>` is screenshotted to a PNG at 3× scale (about 300 dpi at print size).
4. Node turns the tree into a `.docx` with the `docx` package (a dev dependency pinned to a version at least two weeks old; no network at build time). MathML from `{frac:}`, `book-math` and `.frac` spans becomes native Word equations (OMML: fraction, power, subscript, root). Each equation keeps a linear text fallback in its alt text.

No third party is involved: everything runs locally, and the web pages and their privacy rules are untouched.

## Book structure

| Part | Contents | Source |
| --- | --- | --- |
| Front | Title page, copyright page, "How to use this book" (print version), Contents | New print-only source `src/print/gcse/front.html`. Title, author name, ISBN and copyright line are **placeholders for Greg**: never invented. |
| Chapters | One chapter per live topic, in pyramid order (base layer first, as the "whole book" route) | Built topic pages |
| Foundation and Stretch | The mixed review chapters | `foundation.html`, `stretch.html` |
| Answers | Per chapter: every exercise's answer and worked solution, the faded-example blanks, exam mark schemes, and **Common slips** (each wrong-answer message as "If you got X: …"). In a tier book these are **short** (see "Short answers and one hint" below) | Same `.q` markup |
| Hints | Per chapter: the "Help, I'm stuck!" ladders, numbered to match the questions | `ol.ladder` |
| Glossary | Every term with its definition and example | `src/book/glossary.mjs` |
| Index | A Word INDEX field built from XE entries: every glossary term at each page it is used (bold page where it is defined), topic titles and key ideas | `{term:}` usage plus headings |

Chapters, sections and exercises are numbered: Chapter 7, section 7.3, Exercise 7C, question 7C.4. The answers and hints use the same numbers. Cross-references ("Uses: Fractions" chips, "see Solving equations") become "see Chapter 9, Fractions".

The Contents and Index are Word fields. The docx asks Word to update fields on open (`updateFields`), so page numbers fill in when Greg opens it. The README explains this.

## Turning web parts into print

| Web element | In print |
| --- | --- |
| `div.q` question | Numbered question. `.facts` and the figure are kept; the answer box is dropped. |
| `ul.options` (multiple choice) | Options lettered A, B, C; the answer key gives the letter. |
| `span.blank` in "Now you finish it" | A ruled gap `________`, with the answers in the Answers section. |
| `details.check-line` | Moved to the Answers section. |
| `details.recap` (warm-up) | Printed open as "Warm-up" questions. |
| `ol.ladder` | Moved to the Hints section. |
| `ul.wrong` | Moved to the Answers section as Common slips. |
| `div.solution`, `ul.markscheme` | Moved to the Answers section. |
| `div.key`, `div.worked`, `flip-section`, `exam-section` | Kept, as shaded boxes and headings. |
| `ul.checklist` ("I can…") | Kept as tick boxes. |
| Figures | PNG, the width of the text column or less. Titles are not printed; the alt text is set from the SVG desc for accessibility. |
| Questions that only work on screen (no static form, e.g. glossary filter, drag, calculator) | Left out and listed in the build report, so each gets a deliberate print twin later. |

**Dropped:**
- Listen buttons, the reading options bar, progress lines and the "You have finished…" line;
- nav, breadcrumbs, the "On this page" list, "Skip to the lesson" and buttons;
- `.sr-only` text and "Text version of the picture" blocks;
- "Type it like…" and "Typing tip" sentences, and the "How to type surds" boxes;
- the calculator, the timed-set controls, and the search.

## Words that only make sense on screen

The build does not silently rewrite maths text. Instead, a source attribute decides what prints:

- `data-print="..."` on an element prints that text instead (e.g. a "Type it like 2√7 or 2sqrt7" sentence gets `data-print=""`).
- A small list of whole-sentence patterns in `scripts/print-rules.mjs` (for example "Type it like …", "Check my answer") is removed automatically.
- Anything else left that contains `type`, `click`, `tap`, `button` or `scroll` is **reported** by the build. A test fails if the report is not empty, so screen-only wording can't reach the book unnoticed.

## Page and type

- **Trim size: 8.5 × 11 in** (KDP's standard large paperback). Margins: 0.75 in outside, and 0.875 in on the gutter, which is enough for KDP's gutter at 500+ pages.
- Body in a print-safe font that ships with Windows (Calibri or Cambria) at 11 pt, with headings in the same family.
- **Colour or black and white: Greg to decide.** KDP colour printing costs much more. The build has a `--mono` switch that renders the figures and box shading in greys, so both versions can be priced.

## Tests

- **Unit tests** for the tree-to-docx pieces: the MathML to OMML conversion (fraction, power, root, nested), answer numbering, and the drop rules.
- **A build test** that makes the docx from a few pages and checks that:
  - it unzips;
  - it has chapters, exercises, Answers, Hints, Glossary and Index;
  - every question number has an answer;
  - no dropped string appears ("Listen", "Check my answer", "Type it like");
  - the screen-only wording report is empty.
- The full book build runs on demand (`npm run book:docx`), not in `npm test`, because it takes minutes.

## Changes after the architect review (these override anything above)

1. **Word is only for checking and exporting the PDF.** Never fix anything in Word: every fix goes to `src/`, or the next build loses it.
2. **One numbering scheme.** Question "7.12" is chapter 7, web question 12 (`data-qid`), the same as the teacher key's Q12. Exercises are labelled by their section heading, not letters. Chapter order is derived (layer, then title, as the teacher table) and never stored. A new base topic renumbers the chapters, so each print run is an edition.
3. **One answer rule.** Move the "what is the answer" logic out of `extractKey` into an exported `keyAnswer()` in `book-lib.mjs`, used by both the teacher keys and the docx. The build asserts, for every page, that the walker's question count equals `extractKey`'s.
4. **The walker handles a closed set of elements.** It runs with JS off, in print media and the light scheme, and blocks every request off 127.0.0.1. It skips anything the existing `@media print` CSS hides, so that stylesheet is the single source of truth for screen-only parts. Everything else it handles from a whitelist. Anything not on the whitelist goes to an `unknown` report, and **the test fails** if the report isn't empty.
5. **Maths is limited to what GCSE uses.** GCSE has no MathML.
   - `span.frac` becomes a Word fraction, with its numerator and denominator walked recursively.
   - The inline-styled column-vector spans become a bracketed Word matrix.
   - Powers and subscripts stay as superscript and subscript text.
   - The claim of alt text on equations is dropped (OMML can't hold it).
   - A shared `{cvec:}` shorthand is a later step, once the minor-fix batches have landed.
6. **Figures** are screenshotted in the print-emulated page with a white background. The pixel density is chosen from the placed width in inches, at 300 ppi or more. The output records the pixel and placed widths so a test can check the ppi. The `--mono` version uses a greyscale filter and reports any colour words ("the red counters") that greyscale would make meaningless.
7. **Word settings.**
   - Turn on `doNotAutoCompressPictures` and `updateFields`, with mirror margins and an exact 8.5 × 11 in page.
   - No bleed: nothing touches the page edge.
   - No hyperlinks.
   - The document properties' author is the imprint placeholder, never a username.
   - XE and INDEX are emitted as complex fields by one tested helper.
8. **The index is selective.**
   - A bold XE marks where a term is taught (the topic's `words` in `topics.mjs`).
   - A plain XE marks its first use in each other chapter.
   - Answers, Hints and the Glossary get none.
9. **Screen wording.** `scripts/print-rules.mjs` holds the phrase patterns ("type it", "tap", "click", "check my answer", "skip to", "pop-up" …) plus an allowlist, each entry with a reason. A bare "type" is not a pattern ("this type of triangle" is fine). There is also a manual **print proofread** gate for claims that only make sense on screen, which no lint can catch.
10. **Release mode and PDF preflight.**
    - `--release` fails if any placeholder or report is not empty.
    - `npm run book:pdf-check` checks the exported PDF: page size, page count against KDP's limit for the chosen ink and paper (828, 776 or 600), embedded fonts, image ppi of 300 or more, no "Error!" text, and a non-empty Contents and Index.
    - `--no-hints` and `--no-slips` exist, and the build reports the page count, so the cost decision has numbers behind it.

## Decisions for Greg (the build works without them, using placeholders)

1. Title, author name, ISBN, copyright line and imprint.
2. Colour or black and white, and the trim size.
3. Whether the Hints section is in the book. It adds pages, and so cost.
4. Which front-matter pages to include: the parents and teachers pages are left out by default.

## Two paperbacks: the Foundation book and the Higher book (26 Nov 2026)

One volume would be over KDP's page limit (828 pages black and white, 600 standard colour), so the book is published as **two paperbacks from the one source**, split so that **every question is in exactly one of them** (Greg, 26 Nov 2026): the Foundation book has the Foundation material, the Higher book has the Higher material only. The whole-book build above is unchanged and is still the default.

```
npm run book:docx -- --tier foundation     dist/gcse-foundation.docx   (report: dist/print-report-foundation.json)
npm run book:docx -- --tier higher         dist/gcse-higher.docx       (report: dist/print-report-higher.json)
npm run book:docx:both                     builds the two in turn
```

`--pages`, `--mono`, `--release`, `--no-hints` and `--out` work with `--tier` as before. KDP assigns an ISBN to each book, so `[ISBN]` stays the one placeholder in both.

| | Foundation book | Higher book |
| --- | --- | --- |
| Chapters | live topics with tier `F` in `src/book/topics.mjs`, in the usual order (layer, then title), then "Practice papers for grades 4 to 6", then "Question words explained" | the live topics with tier `H` in full, plus a short chapter (titled with the topic) for each Foundation topic that has Higher material, in the same derived order; then "Grade 7 to 9 stretch papers", then "Question words explained" |
| Content | all Higher content cut out (below) | the Higher content cut out of the Foundation topics, and nothing else of them |
| Glossary | entries whose `level` is not `H` | the `H` entries, plus any term a printed chapter uses |
| Index, Answers, Hints | only for what is printed | only for what is printed |
| Subtitle and title property | "Foundation", "GCSE Mathematics: Foundation" | "Higher", "GCSE Mathematics: Higher" |

The whole-book build keeps "Foundation and Higher" and its old shape. Chapter numbers count from 1 in each book, so Chapter 7 in the Foundation book is not Chapter 7 in the Higher book.

### The Higher book: the other half

For each Foundation topic that has Higher material the Higher book has a short chapter with the topic's title. It starts with one line: "The Higher parts of <title>. The rest of this topic is in the Foundation book." A Foundation topic with no Higher material has no chapter (algebra-basics, for example, only has a "Higher tier:" note). The Higher material is exactly what the Foundation book cuts, by the same rules (`keepOnlyHigher` is the complement of `dropHigher` in `scripts/print/tier.mjs`):

* a section or sub-section whose heading carries the chip, whole;
* a question that is Higher (the chip in its text, or `data-tier="H"`), on its own, under the nearest ordinary h2 so it has a heading;
* a list item that is a Higher one ("(Higher) find arc lengths ...") or the words marked `<span data-tier="H">` ("fractional indices").

Foundation text, and the notes about Higher ("Higher tier: the next question."), are not printed in this book. The two books together cover every question once: a unit test checks the rule on synthetic trees, and `test/print-tier.spec.ts` builds both books from the same pages and checks from the reports that the question lists have no overlap and add up to every question in the source (the Foundation papers are only in the Foundation book, the stretch papers only in the Higher book). The one deliberate exception is "Question words explained" (four questions), which is in both books because every topic's exam section points to it.

### What counts as Higher (Foundation book)

The rules are in `scripts/print/tier.mjs`, one function each, and unit tested.

1. **A heading with the Higher chip.** The heading and everything after it up to the next heading of the same or a higher level goes. An h2 takes its h3s and its questions with it (this is the "Check your knowledge: ... Higher" sets). An h3 with the chip ends at the next h3 or h2. The cut never crosses into a sibling section, and a section left empty goes too.
2. **A question with the chip in its question text,** or with `data-tier="H"` on its `<div class="q">`. That one question goes.
3. **Words inside a sentence marked `<span data-tier="H">...</span>`.** Used where a sentence is Foundation but has a Higher part (two "I can..." items in `indices.html`). The web page looks exactly as before.
4. **Any other paragraph or list item that carries the chip or a real Higher marker** ("Higher tier", "(Higher)", "Higher only", "Higher parts", "Higher chip", "marked Higher", "Foundation and Higher") loses that sentence; a paragraph that starts "Higher tier:" goes whole. Ordinary uses ("Higher value minus lower value") are not markers ("The sections marked Higher are for the Higher tier.", "Higher tier: the next question.", "(Higher) find arc lengths ..." in the "I can..." lists). A paragraph or item that is left empty goes.

After the cuts the build checks the Foundation chapters again. A chip or a Higher marker still in a paragraph outside a question is listed in the report as `higherLeftovers`, and `--release` fails if that list is not empty. (A hint or solution may say "higher" in the everyday sense, so questions are only checked for the chip.)

`data-tier="H"` is the way to say "this is Higher" where there is no chip. It was added to seven questions in `squares-roots.html` and two in `pythagoras.html` that sat under a "Higher tier: ..." note but had no chip of their own, so they would have been printed in the Foundation book.

### Question numbers

* **Whole book:** unchanged. Question 7.12 is question 12 of Chapter 7 on the web page (`data-qid`) and in the teacher key.
* **Foundation book and Higher book:** the questions that are printed in a chapter are numbered again **from 1 in printed order within each chapter, with no gaps**. Question 7.12 is the 12th question printed in Chapter 7 of the Foundation book. The chapter, the Answers section and the Hints section all use this number, so they always agree. It no longer matches the web page or the teacher key for a chapter that had questions left out (they are in the other book) (the report says how many were left out). The web number is kept in the tree as `webN` in case a table is ever wanted.

### References to a chapter in the other book

A cross-reference ("see Fractions") or a "Uses:" line that points at a topic not in this book prints "(in the Higher book)" (in the Higher book, "(in the Foundation book)") instead of a chapter number, and is not counted as a dead reference. In the Higher book a reference to a Foundation topic always says "(in the Foundation book)", even when that topic has a short Higher chapter, because the basics are in the other book. A reference to a page that is in neither book is still reported.

### The report

Each build's report adds `stats.tier`, `stats.questionsInOtherBook` (questions on the pages that are in the other book), `questionIds` (the id of every printed question, used by the coverage test), `stats.questionsPrinted`, `stats.figures` and `stats.pagesEstimate`.

The **page estimate** (`scripts/print/estimate.mjs`) is worked out from the word counts and figure heights, about 420 words a page in the chapters and 520 in the answers and hints. There is no Word-to-PDF converter here, so it is a planning figure, good to about 20%. The real count is the exported PDF: run `npm run book:pdf-check` on it.

### Tests

* `test-unit/print-tier.test.mjs`: the Higher rules (section by h2, h3, single question, nested sections, sentence cuts, words marked `data-tier`), the numbering, the chapter and glossary lists for each book, the front-matter wording and the command line.
* `test/print-tier.spec.ts`: builds a small Foundation book and a small Higher book from the same pages. Foundation: no Higher label, section or question survives (found from the source, not from a list), no printed question is graded 7 to 9, no orphan "See Identity" sentence, every printed question has an answer numbered the same. Higher: the Higher material of each page is there and the Foundation material is not, the lead-in lines, "(in the Foundation book)", numbering, glossary. Together: every question is in exactly one book.
* `test-unit/book-higher-tags.test.mjs`: a source lint. Any question graded 7 or more (outside `stretch.html`) must be marked Higher (chip, `data-tier="H"`, or in a Higher section), or the Foundation book would print it. Grade 6 is allowed because the Foundation paper is "grades 4 to 6".

## Short answers and one hint (Greg, 26 Nov 2026)

The first estimates for the two paperbacks were about 647 pages (Foundation) and 447 (Higher), mostly from the Answers and Hints. Greg decided to shorten them: **short answers plus one hint.** Both are the **default for a `--tier` book**; the whole book (no `--tier`) stays full unless asked.

| Part | Short (tier default) | Full |
| --- | --- | --- |
| Answer line | the same: typed answer (and "also accept"), the letter and option text for multiple choice, "Written answer: see the mark scheme" for a "show that" question (all from `keyAnswer`) | same |
| Worked solution | not printed | printed |
| Mark scheme (exam questions) | printed | printed (inside the solution) |
| "If you got ..." / "If you chose ..." lines | not printed | printed (unless `--no-slips`) |
| "Now you finish it" gap answers and check lines | printed | printed |
| Hints | the first clue of each ladder, labelled "Hint:" | the whole ladder, "Hint 1:", "Hint 2:" ... (unless `--no-hints`) |

**The one fallback.** A "show that" or written question whose answer is "see the mark scheme" but which has no mark scheme keeps its worked solution, so it still has an answer. The report lists these as `shortAnswerFallbacks` (and `stats.shortAnswerFallbacks` is the count); it is for information, not a `--release` failure.

**Switches.**

```
--short-answers   short answers      (default with --tier; opt in for the whole book)
--first-hint      first hint only    (default with --tier; opt in for the whole book)
--full-answers    full answers       (opt out, with --tier)
--all-hints       the whole ladder   (opt out, with --tier)
--no-hints, --no-slips                 work as before and combine with any of the above
```

With short answers the "If you got" lines are not printed, so `--no-slips` changes nothing there.

**The front matter follows the options.** `src/print/gcse/front.html` carries `data-print-if="word word"` on the paragraphs, list items and phrases that depend on them; the walker keeps an element only when every word is in force. The words come from `featuresFor` in `scripts/print/render.mjs`: `hints` or `no-hints`; `all-hints` or `first-hint`; `full-answers` or `short-answers`; `slips` or `no-slips`. So the "How to use this book" pages say "read the hint for that question" in the short book and "read Hint 1 only ... Hint 2" in the full one, and only mention the worked answer and the "If you got" lines when they are printed. `frontNeedsEdit` in the report still catches a mention the variants missed. The front matter says nothing about the website, which is still hidden.

**The page estimate** counts lines as well as words for the Answers and Hints, because a short answer is one short line and fills a page by lines, not words (`LINES_PER_PAGE`, 42, in `scripts/print/estimate.mjs`). It is still a planning figure, good to about 20%; the real count is the exported PDF.

**Tests.** `test-unit/print-build.test.mjs` (the answer line per question type, the mark-scheme and fallback rule, the first-hint rule, the option defaults, the front-matter features, the line-based estimate), `test/print-walker.spec.ts` (`data-print-if`, on `test/fixtures/print-if.html`) and `test/print-short.spec.ts` (builds small short and full tier books: no worked-solution text or "If you got" in the Answers, one hint per hinted question, every question answered once, the front matter accurate, and the opt-out flags restoring the old output).
