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
