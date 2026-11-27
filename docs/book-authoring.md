# Writing for the GCSE book

The book lives at `/books/gcse/`, public since 27 Nov 2026 (linked from the Books page; answer keys stay `noindex`). This guide is for anyone adding a topic or a glossary term. The plan and the reasoning are in [textbook-plan.md](textbook-plan.md).

## The one-paragraph version

Topics are listed once in `src/book/topics.mjs` with what they **need**. Terms are defined once in `src/book/glossary.mjs`. A topic page is plain HTML in `src/pages/books/gcse/<id>.html` using a few shorthands. `npm run build` stitches it all together and **fails loudly** if a prerequisite is missing, there is a cycle, a term is unknown, or a live topic has no page.

## Why a pyramid

Maths stands on itself: fractions on factors, equations on fractions and negatives, trigonometry on Pythagoras and ratio. So every topic declares what it needs, and the build works out two things for us:

- **layer**: how far up the pyramid a topic sits (a topic is one layer above its highest prerequisite);
- **unlocks**: what a topic opens up (the reverse of `needs`).

Those drive the pyramid on the hub, the "Before you start" box at the top of each topic and the "What this unlocks" box at the end. Never write them by hand.

## Add a topic

1. In `src/book/topics.mjs` add (or change from `planned` to `live`) an entry:
   `{ id, title, strand, tier, status, needs: [...], flip }`
   - `strand`: `n` Number, `a` Algebra, `r` Ratio, `g` Geometry, `p` Probability, `s` Statistics.
   - `tier`: `F` (Foundation and Higher) or `H` (Higher only).
   - `flip`: the reverse side of the topic, in plain words.
   - Foundations a new topic needs but that do not exist yet go in as `planned` entries. That is how the base of the pyramid gets built before it is written.
2. Create `src/pages/books/gcse/<id>.html`. Copy the shape of `fractions.html`.
3. `npm run build` and `npm test`.

### Page shape (every topic follows this)

1. Hero, then `{prereqs}` ("Before you start").
2. **Warm-up** question plus **Last time** questions from the base the topic stands on.
3. Learn it (short), a **worked example**, a **faded** example (the student finishes it).
4. A **Check your knowledge** set after *every* chunk (`<section class="ckw">`).
5. **Flip it**: the topic run backwards (`<section class="flip-section">`).
6. **Spot the mistake**, a **mixed review** (interleaving), **Exam style**.
7. Why it works, common traps, a Going further set, an "I can..." checklist and `{unlocks}`.

Use `h2` for sections, `h3` below them (never skip a level; the tests check).

## Shorthands

| Write | You get |
|---|---|
| `{term:hcf}` or `{term:hcf\|HCF}` | a teal, tappable word linking to its glossary entry; build fails if the id does not exist |
| `{frac:3/4}` | a stacked fraction (`{frac:x + 1/3}` and `{frac:1/a<sup>n</sup>}` also work) |
| `{prereqs}` / `{unlocks}` | the generated "Before you start" / "What this unlocks" boxes |
| `{pyramid}` | the pyramid (hub only) |
| `{qcount:fractions}` | the number of questions in a topic (computed) |

Highlight a term on its **first use in each section**, not every time.

## Questions

Every question is a `<div class="q" ...>` (exactly that start; the build numbers them `fractions-1`, `fractions-2`... **so do not reorder questions on a live topic without expecting students' saved ticks to shift**).

```html
<div class="q" data-answers="2/5" data-mode="exact">
  <p class="qtext">Work out ... Give your answer in its simplest form.</p>
  <ol class="ladder"><li>Hint 1: what is it asking?</li><li>Hint 2: the first step</li></ol>
  <ul class="wrong"><li data-if="6/15">Right value, but it can be simplified.</li></ul>
  <div class="solution"><p>The worked answer, and a check.</p></div>
</div>
```

- `data-answers`: accepted answers separated by `;`.
- `data-mode="value"` accepts any equal number (3/4, 6/8, 0.75, 75%); `data-mode="exact"` needs the written form (for "simplest form" and algebra).
- **Lists of answers.** A key written "a or b" or "a and b" (numbers) is right in any order, and with "x =" or a comma: but never with a different number, a dropped root or a flipped sign (a test over every page checks this). A list of things that are not numbers (for example "x(x-3) or x(x-2)") is compared as text: list each accepted order in `data-answers`, separated by `;`. Words (or, and, yes, no, none, true, false, not) are never read as algebra.
- `<ul class="wrong">`: a specific message for a specific wrong answer. **Write the message for the mistake that produces that number**, not "wrong". Aim for the two or three most common slips.
- Multiple choice: `data-type="mc"` with `<ul class="options">`; mark the right one `data-correct`; give each wrong one a `data-why`.
- Hints (`ladder`) go from "what is it asking" to "first step" to "next step". The script adds a final "ask a person" rung itself.
- Without JavaScript the hints and solutions simply show in full (which is also what the print edition uses).
- Decimal answers: say "to 1 decimal place" in the question and give the rounded value in `data-answers`.

## The glossary

Each entry in `src/book/glossary.mjs` has `id`, `term`, `strand`, `level` (`F`/`H`), `def` (plain English, **plain text** since it is also the pop-up), `example`, and optionally `watch` (the usual trap or an everyday-word clash), `flip` (the reverse side) and `see` (related ids). The glossary page, the pop-ups and the "Taught in" lists are all generated; the unit tests check every entry has a definition and an example and every `see` points at a real term.

## Colours

Strand colours and the "term" teal are defined as tokens at the top of `public/css/book.css`, with their contrast ratios recorded beside them. Any new pairing must be computed (WCAG relative luminance), not eyeballed.

## Known gap on the main site

axe-core now runs on every page (`test/accessibility.spec.ts`). The main site's pages have two colour-contrast failures that were there before: the gold `.kicker` labels on cream sections and the footer's first paragraph. The book's own stylesheet fixes both on book pages; the main pages are exempted from the colour-contrast rule only (every other rule is enforced) until `style.css` is changed. That changes how the live site looks, so it is Greg's call.

## Privacy

No accounts, no analytics, no cookies, nothing sent anywhere. Progress is stored in `localStorage` under `wm-gcse-v1`, on the student's device only. Any feature that would send data goes through `security-architect` and `security-engineer` first.

## Added in round 2 (feedback from student and expert testers)

**Diagrams.** Put a `<figure class="figure qfig">` immediately after a question's `<p class="qtext">`, inside the `.q`. It must have an SVG with `role="img"` and a `<title>` and `<desc>` that describe it without giving the answer; label unknowns with `?` or a letter; say "Not drawn to scale" when proportions are rough; ids must be unique on the page. Keep text inside the `viewBox`. The tests check ids, titles and that every page's figures render without console errors.

**Technical words in questions** are linked automatically at build time (first use per question), from the glossary. They show a definition on hover, focus or tap, plus a small picture if `src/book/term-figures.mjs` has one for that term id. Question words (work out, calculate...) are never auto-linked. To add a picture, add an entry keyed by the glossary id; the build fails if the id is not a glossary term.

**Warm-ups and recaps.** One warm-up question at most; fold recap questions into `<details class="recap"><summary>Quick recap of earlier topics (skip if you are happy)</summary>...</details>` so the lesson comes first. A faded example's answer goes in `<details class="check-line"><summary>Check my answer</summary>...</details>` so it is not given away.

**Higher-only sections** carry `<span class="chip chip-higher">Higher</span>` in their heading.

**Glossary examples** may be an array (one line each). Use the identity sign with `{term:identity|&equiv;}` only for Higher-tier notes.

**Spaced revisit.** A question answered right first time with no hint is scheduled to come back (1, 3, 7, 21, 60 days: `public/js/book-queue.mjs`). "Give me five" shows up to three due questions. Everything is in `localStorage`; the queue ignores malformed data.

**Find your gaps** (`diagnostic.html`) holds its own 11 questions (class `dq`, with `data-topic`, `data-layer`, `data-answers`); results are scored in the browser and kept as plain numbers.

## Privacy and accessibility rules (do not loosen)

- **No third-party requests from book pages.** Book pages load no web fonts (system font stack). A test fails if any book page requests another website. Adding a font means self-hosting it and asking Greg first.
- **Listen uses only voices that run on the device by default.** Some browser voices ("online", Google) send the text away; they are used only if the student picks one, and are labelled (`public/js/book-voice.mjs`).
- **The clue panel's text box is never stored or sent.** Answer boxes are limited to 60 characters; the answer checker ignores input over 200 characters so it cannot freeze the tab.
- **Helper modules are never cached for a year.** `book.mjs` is versioned by the build token and cached long, so it imports every helper module (`book-answer.mjs`, `book-queue.mjs`, ...) with a small `?m=NN` tag, and `public/_headers` sets `no-cache` on `/js/book-*.mjs`. Change the tag in all imports when a helper's exports change (a unit test checks every import has one).
- Every `.q` has an accessible name, every answer box and Listen button a distinct name, hints keep focus on the Help button and are announced politely, the term pop-up works by keyboard (Enter moves into it, Escape closes and returns focus), a skip link is the first Tab stop, and the footer headings follow the heading order.


## Book search

Every book page has a search box in the header (and only book pages: the rest of the site has none). Type "circle theorems" and the topic page is the first result; glossary words, command words, section headings, the practice papers and the parents and teachers pages are found the same way.

**How the index is built.** `npm run build` writes `public/books/gcse/search-index.json` (never edit it) from the finished pages, in `scripts/book-search-lib.mjs`. It holds only titles, headings, glossary words and short descriptions:

- every topic and page: its title, strand and a one-line description (a topic's "flip" line), plus the glossary words from its "Words you need" strip as extra names;
- every `h2` and `h3` that has an id (the build now gives every heading an id), as a "Section" result that links to the anchor and names the page it is in;
- every glossary term, with its strand and the start of its definition.

**Never indexed:** questions, hints, wrong-answer notes, worked solutions and "check my answer" blocks (they are stripped before headings are read), and the answer-key pages under `key/` (they are all answers). The teachers page is indexed on purpose, with "answer key" as one of its names, so a teacher typing that lands on the page that links to every key. Headings that are only scaffolding ("Check your knowledge", "Worked example: ...", "Going further"...) or that appear on more than six pages are left out so they do not bury real results.

**Make something findable.**

- A new topic or glossary term is picked up automatically on the next build.
- Give a glossary term other names with `aka: ['exponent']` (one string, words separated by spaces; it is matched as extra words and as a whole phrase).
- Give a hand-listed page (hub, practice papers...) other names with `searchWords: '...'` in `src/pages.config.mjs`.
- Everyday words a student types that no title uses ("times table", "vat", "sqrt", "dyslexia") go in `SEARCH_SYNONYMS` in `scripts/book-search-lib.mjs`, keyed by page link. They reach the index as `y` (everyday names) and beat a word that only sounds like the title. A page that is not in the build is skipped.
- Numbers are ignored, `%` means "percent", the root sign means "sqrt" and "year 10" is dropped (`cleanQuery` in `public/js/book-search.mjs`). A word of four letters or fewer is never found inside a longer word ("dice" is not "indices").
- A section is findable if its heading is an `h2` or `h3` with plain text. Write headings the way a student would say them.

**How results are ranked** (`public/js/book-search.mjs`, unit-tested in `test-unit/book-search.test.mjs`). Little words ("the", "where", "do") are ignored. Every remaining word must match something; if no entry matches them all, entries matching some are offered, ranked lower. A title word scores most (exact, then starts-with, then inside a word of four or more letters, then a typo: one slip in a word of five or more letters, two in nine or more; swapping two neighbouring letters is one slip), then other names (an exact other name beats a title that merely starts with the word, except for topics), then the name of the page a section sits in. Plurals and -ise/-ising endings are folded. A query that is the whole title (ignoring a bracket such as "(index)") wins outright, then a title that starts with the query. Ties go to topics, then pages, then terms, then shorter titles. Results are capped at six and each shows a badge: Topic (the first topic result says "Start here"), Word meaning, Page or "Jump to this part - Part of: page". A heading never outranks a topic with the same name. The glossary page has its own filter box ("Find a word in this glossary") that uses the same forgiving matcher. Give a topic other names with `aka` in `src/book/topics.mjs`; set `searchSections: false` on a page in `src/pages.config.mjs` to keep its headings out of results (the hub and parents pages do).

**Privacy (tested).** The index is fetched from this site only, the first time the box is focused (not on every page load). The query is never stored, sent or put in the address, there is no `localStorage`, and nothing is added to the Content Security Policy. The box is hidden until its script runs.

**Where the code is.** `public/js/book-search-ui.mjs` (the box; its own script tag, not part of `book.mjs`), `public/js/book-search.mjs` (the matcher, no page code), the box markup in `renderSearchBox` and the index in `buildSearchIndex` (`scripts/book-search-lib.mjs`), styles and colour contrasts at the end of `public/css/book.css`, tests in `test/book-search.spec.ts`.

## Recorded audio for Listen

Listen plays a recording when one exists for the exact sentence, and otherwise falls back to the student's on-device browser voice.

- Recordings are files in `public/audio/book/`, named by a hash of the text they say (`public/js/book-audio.mjs`), and listed in `manifest.json`. Editing a sentence changes its hash, so a stale recording can never play. `npm run book:audio -- status` shows what is covered and which recordings are out of date.
- `npm run book:audio -- todo` writes a numbered reading script (`audio-work/script.txt`, not committed). Record each line as `001.mp3`, `002.mp3`, ... and run `npm run book:audio -- import <folder>`.
- Or let a speech engine do it: set `WM_TTS_CMD` to a command that reads the sentence on standard input and writes `{out}` (and `WM_TTS_EXT`), then `npm run book:audio -- make`. Any engine that runs on this machine works; nothing is uploaded unless the engine you choose does that, so prefer a local one.
- The words a voice reads come from `public/js/book-speech.mjs` (symbols, units, "?" and so on); change a rule there and the hashes of affected sentences change, so they are re-listed for recording.
- Clips are served from this site only (`default-src 'self'` covers them). Keep each clip small (speech at 32 to 48 kbps is plenty).

## Write units out, because Listen reads exactly what is written

A voice says only the words on the page, so a bare number is spoken bare. Write angles as `180&deg;` (spoken "180 degrees"), lengths as `6 cm`, money as `&pound;15`, and say what a total is of ("the internal angles of a triangle add up to 180&deg;"). If a sentence reads fine on paper only because a diagram or the context fills the gap, add the missing words: recordings of it will be heard without the page.

## Two texts: what the student reads and what the voice reads

The voice does not read the page as written. `public/js/book-speech.mjs` turns the displayed words into spoken words: numbers become words ("4,872" is "four thousand, eight hundred and seventy-two", "0.643" is "zero point six four three", "045" is "zero four five"), symbols and units are spelled out, money is pounds and pence. Recordings are keyed to that spoken text.

Labels at the very start of a question (the Higher chip, a part letter like "(a)", "[3 marks]", the marks, calculator and grade tags, any number of them in a row) are not read, nor are tags anywhere in it such as "Uses: Fractions". After re-recording, run `npm run book:audio -- all` then `npm run book:review` so `/books/gcse/audio-review.html` plays the new clips: Listen reads just the question (`dropLeadingLabels` in `public/js/book-audio.mjs`).

When the automatic version is not good enough, give the sentence its own spoken wording with `data-say` on the `.qtext` or `.key` element, for example `<p class="qtext" data-say="x squared minus five x">x&sup2; &minus; 5x</p>`. The spoken text is what gets recorded; the displayed text is untouched. `npm run book:audio -- todo` lists the spoken text of every sentence that still needs a recording.

**Reviewing what the voice is given.** `npm run book:audio -- review` (add `--pages=a,b` for some pages) writes `audio-work/review.html` (not committed, not part of the site): every sentence with the words as written beside the words the voice is given. Sentences with notation the voice has to interpret (functions such as f(x), P(A), roots, angle signs, powers, any `data-say`) are coloured, with a tick box to show only those. Reading the spoken column is much quicker than listening, so do that first and listen only to the ones that look wrong.

Function notation is spoken as a teacher says it: `f(x)` is "f of x", `fg(x)` is "f of g of x", `f<sup>&minus;1</sup>(x)` is "f inverse of x", and `P(red)` is "the probability of red". Only a lone f, g or h (or a pair) straight before a bracket counts, so `h (cm)` and `6h(` are untouched.

### Recorded audio (whole book, 24 Nov 2026)

Voice chosen by Greg: Piper `en_GB-alba-medium` (dataset licence CC BY 4.0, credited on the book hub page). Every Listen sentence has a recording in `public/audio/book/` (Ogg Vorbis, about 40 kbps, named by a hash of the spoken text, listed in `manifest.json`).

**After you edit book text**, the recordings of the sentences you changed stop matching (the browser voice reads those until they are re-recorded). To refresh them:

1. `npm run build`, then `npm run book:audio -- status` (how many sentences have no recording, and how many recordings are out of date).
2. `npm run book:audio -- todo` writes the sentences that still need a recording to `audio-work/script.json`.
3. `python scripts/piper-batch.py --voice <path to en_GB-alba-medium.onnx>` records them (about 0.5 seconds a sentence), leaving a 0.45 second extra gap after each full stop (`--gap`; decimals are spoken as words, so there is never a stray stop). After changing `--gap` or the voice, add `--redo` to make every clip again (the clip's name is a hash of its text, not of how it sounds). It needs `pip install piper-tts soundfile` and the voice from `python -m piper.download_voices en_GB-alba-medium`.
4. `npm run book:audio -- prune` deletes recordings of sentences that no longer exist, then `npm run book:audio -- manifest` (prune does this too).

Add `--pages=topic-a,topic-b` to `status`, `todo` and `make` to work on chosen pages only (not to `prune`).

### Voice rules chosen by Greg (25 Nov 2026) - keep these when re-recording

These live in code (`public/js/book-speech.mjs`, `public/js/book-audio.mjs`, `scripts/piper-batch.py`) and are tested in `test-unit/book-speech.test.mjs`, so a re-record picks them up automatically. If the voice or engine changes, check each still holds:

- **Pauses between sentences:** a full stop is a slight pause, never a spoken "dot". `piper-batch.py` puts 0.45 s of extra silence after each full stop (`--gap`). Paragraphs and list items are joined with a space in `unitText` (they used to run together as "hundred.The", which Piper read as "dot").
- **The letter A** (a variable, a point, a label, "A-level") is said as the letter name, "ay" as in "hay" without the h. Piper reads a bare "A" as the article ("uh") and the spelling "ay" as "eye", so the spoken text uses the respelling `eigh` (`sayLetterA`). The article stays: "A tube of paint", "plus a bit". Not handled (rare, flagged in review): a lowercase variable `a` after a plain word, such as "add a to both sides".
- **Coordinates:** "(3, 4)" is "three comma four" and "(-2, 5)" is "minus two comma five". The word "comma" is spoken and the brackets are not (`coordinatesToWords`). A function such as f(x, y) keeps its brackets.
- **Column vectors:** the stacked numbers are said "vector minus one, two", with a slight pause (a comma) between the two (`unitText`, from the vector's `aria-label`).
- **Every clip** is re-recorded when these change: `python scripts/piper-batch.py --voice <onnx> --redo-before <Unix time you start>` (like `--redo`, but a stopped run restarts with the same value and skips what is already done), then `npm run book:audio -- prune`.
- **Check afterwards:** `npm run book:audio -- all`, `python scripts/audio-check.py` (transcribes each clip and compares it with its text), then `npm run book:review`, which builds the page for listening and flagging.
- **Ratios** (26 Nov 2026): "2 : 3" and "2:3" are said "two to three", and "1 : 2 : 5" is "one to two to five" (`ratiosToWords`). A colon with a space only after it is a sentence colon and is left alone, and so is a clock time such as 09:15.
- **Not decided:** times such as 09:15 are spoken "zero nine:fifteen" (Greg's call how they should sound).
