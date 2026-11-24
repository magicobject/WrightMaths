# Writing for the GCSE book

The book lives at `/books/gcse/` (hidden pilot: not linked anywhere, not in the sitemap, `noindex`). This guide is for anyone adding a topic or a glossary term. The plan and the reasoning are in [textbook-plan.md](textbook-plan.md).

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
- **The duck's text box is never stored or sent.** Answer boxes are limited to 60 characters; the answer checker ignores input over 200 characters so it cannot freeze the tab.
- **Module imports are not cached for a year** (`public/_headers`): `book-answer.mjs`, `book-queue.mjs`, `book-voice.mjs` are imported without a version query.
- Every `.q` has an accessible name, every answer box and Listen button a distinct name, hints keep focus on the Help button and are announced politely, the term pop-up works by keyboard (Enter moves into it, Escape closes and returns focus), a skip link is the first Tab stop, and the footer headings follow the heading order.


## Recorded audio for Listen

Listen plays a recording when one exists for the exact sentence, and otherwise falls back to the student's on-device browser voice.

- Recordings are files in `public/audio/book/`, named by a hash of the text they say (`public/js/book-audio.mjs`), and listed in `manifest.json`. Editing a sentence changes its hash, so a stale recording can never play. `npm run book:audio -- status` shows what is covered and which recordings are out of date.
- `npm run book:audio -- todo` writes a numbered reading script (`audio-work/script.txt`, not committed). Record each line as `001.mp3`, `002.mp3`, ... and run `npm run book:audio -- import <folder>`.
- Or let a speech engine do it: set `WM_TTS_CMD` to a command that reads the sentence on standard input and writes `{out}` (and `WM_TTS_EXT`), then `npm run book:audio -- make`. Any engine that runs on this machine works; nothing is uploaded unless the engine you choose does that, so prefer a local one.
- The words a voice reads come from `public/js/book-speech.mjs` (symbols, units, "?" and so on); change a rule there and the hashes of affected sentences change, so they are re-listed for recording.
- Clips are served from this site only (`default-src 'self'` covers them). Keep each clip small (speech at 32 to 48 kbps is plenty).
