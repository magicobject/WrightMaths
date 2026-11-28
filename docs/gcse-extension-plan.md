# GCSE book: "I want to know more" extension work (plan, 28 Nov 2026)

## Aim
Give every live GCSE topic (43 today) an optional, clearly-marked **"I want to know more"** panel for curious and able students. It answers three questions:
1. **Deeper:** what is really going on, one level beyond GCSE.
2. **Where next:** which later topics in this book, the A-level book and the bridge courses build on it, as links.
3. **Elsewhere:** where the idea turns up in other subjects and in real life (physics, chemistry, computing, geography, economics, art, music).

It is extension, not assessment: nothing in it is needed for the GCSE, and the page reads the same without it.

## What already exists (reuse, do not duplicate)
- `src/book/topics.mjs` is the single source for `needs`; `unlocks` is derived. "Where next" inside the GCSE book comes from this, never typed by hand.
- Every topic already ends with a **Going further** question set and `{unlocks}`. The new panel sits next to Going further: Going further is *questions*, the panel is *reading and links*.
- The A-level book (`src/book/alevel/topics.mjs`) and bridge plans (`docs/university-bridge-plan.md`, `docs/entrance-exam-bridge-plan.md`) are the link targets beyond GCSE.

## Data model (single source)
New file `src/book/extensions.mjs`, one entry per GCSE topic id:

```js
export const EXTENSIONS = {
  pythagoras: {
    deeper: 'pythagoras-deeper',                     // id of an HTML fragment in src/pages/courses/gcse/more/
    later: [                                         // links beyond the GCSE book's own unlocks
      { book: 'alevel', id: 'vectors-3d', why: 'Distance between two points in 3D is Pythagoras twice.' },
    ],
    subjects: [
      { subject: 'Physics', note: 'Adding two forces at right angles gives the resultant.' },
      { subject: 'Computing', note: 'Games find the distance between two sprites this way.' },
    ],
  },
};
```

- **Build checks** (in `scripts/book-lib.mjs`, like the topic graph): unknown topic id, unknown `later` target id in its book, missing fragment, or a live topic with no entry once the rollout is finished (a flag turns this from a warning into a failure).
- GCSE-internal "where next" links are generated from derived `unlocks` plus a short `why` line, so a renamed or new topic updates itself.
- A-level books can later get the reverse link ("You met this in GCSE: ...") from the same data, for free.

## Page design
- A `<details class="know-more">` panel after Going further, summary text **"I want to know more"**, collapsed by default (no layout shift, keyboard and screen-reader native, works without JavaScript).
- Inside: `h3` headings for *Going deeper*, *Where this leads*, *Where else you'll meet it* (fits the `h2` section outline; no skipped levels).
- Length cap: about 250 words of reading plus up to two optional "try this" puzzles (with a "Help, I'm stuck!" ladder like every other question, but no marks and no progress tracking).
- Listen reads it like the rest of the page (write units out; voice rules in `book-authoring.md` apply, recordings added in the next audio pass).
- Print: hidden in both the worksheet and "Print with answers" printouts; a "Print this extension" option can come later if teachers ask.
- Colours: reuse existing book tokens; any new pairing is computed for WCAG AA and recorded next to the tokens.

## Rules
- No third-party requests: no embedded videos, no external images, no CDN. External reading (e.g. NRICH, Underground Mathematics) only as plain links with `rel="noopener"`, marked as leaving the site, and only to sites checked for being free and ad-free for children. List them in the extensions file so they can be audited in one place.
- No facts invented: every "elsewhere" claim must be checkable; historical names and dates checked against a source noted in a comment.
- **Maths accuracy gate** applies: someone other than the author checks every panel before the topic's panel is released.
- Children's data rule unchanged: opening the panel stores nothing (or at most a `localStorage` "seen" flag inside `wm-gcse-v1`).

## Tests (`test/book.spec.ts`, `test/accessibility.spec.ts`)
- Every live topic has a `details.know-more` with the three `h3`s (once the rollout flag is on).
- Every link in a panel resolves to a built page (internal) or is on the allow-list (external).
- axe-core in the panel's open state, light and dark, at 320px.
- No third-party requests with the panel open (existing check, open state added).

## Rollout
1. **Pilot (1 PR):** data file, build checks, template, tests, and panels for 3 topics from different strands: Pythagoras, Fractions, Sequences. `ux-designer` review of the panel at phone and desktop.
2. **By strand (one PR per strand, ~6 PRs):** Number, Algebra, Ratio, Geometry, Probability, Statistics. Each PR: author agent writes, a different agent does the maths accuracy check, tests green.
3. **Turn the flag on** so a missing panel fails the build.
4. **Reverse links** in the A-level book ("Where you met this before").

Effort guide: about 30 to 45 minutes per topic including checking, so roughly 25 to 30 hours for the 43 live topics.

## Open questions for Greg
- Name on the button: "I want to know more" (proposed) or "Curious?" / "Beyond the exam".
- Whether external links (NRICH etc.) are allowed at all, or the panel stays entirely inside wrightmaths.uk.
- Whether the A-level book is linked while it is still a hidden preview (proposal: link only once it is public; until then the panel names the A-level topic without a link).
