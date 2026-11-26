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
| Answers | Per chapter: every exercise's answer and worked solution, the faded-example blanks, exam mark schemes, and **Common slips** (each wrong-answer message as "If you got X: …") | Same `.q` markup |
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
