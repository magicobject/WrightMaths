# GCSE book: lesson plans for teachers (plan, 28 Nov 2026)

## Aim
Generate a ready-to-teach **three-part lesson plan** for each GCSE topic (or each lesson-sized chunk of a topic), linking straight back into the book, so a teacher can run the lesson from the plan and the book together.

1. **Starter (about 10 minutes): look back.** Remind students of the foundations the topic stands on.
2. **Main lesson (about 35 minutes): the topic itself.**
3. **Plenary (about 15 minutes): look ahead.** Where this fits in later work, in the book and beyond.

## Generated, not hand-written (single source)
Most of a plan already exists in the book's sources, so the plan is built, not retyped:

| Lesson part | Comes from |
|---|---|
| Starter: prior knowledge | `needs` in `src/book/topics.mjs`; the topic's **Warm-up** and **Last time** questions; "Words you need" (`words`) from `src/book/glossary.mjs` |
| Main: teaching sequence | The page's own sections in order: Learn it, worked example, faded example, each **Check your knowledge** set, Flip it, Spot the mistake |
| Main: misconceptions | The wrong-answer messages and common traps already on the page |
| Main: differentiation | Foundation/Higher `tier`; "Help, I'm stuck!" ladders for support; Going further for stretch |
| Plenary: looking ahead | Derived `unlocks`, plus the "Where this leads" part of the extension panel (`docs/gcse-extension-plan.md`), the topic's **Flip it** and its "I can..." checklist as exit check |
| Timings and lesson count | The sessions estimate already in the teachers' topics table |

Only one thing needs writing by hand per topic: a small `src/book/lessons.mjs` entry that splits a topic into lessons and adds teacher-only notes:

```js
export const LESSONS = {
  pythagoras: [
    { title: 'Finding the hypotenuse', sections: ['learn-1', 'ckw-1'], questions: '1-8',
      hook: 'Is a 32-inch TV 32 inches wide?', notes: 'Watch for squaring before adding.' },
    { title: 'Finding a shorter side', sections: ['learn-2', 'ckw-2', 'flip'], questions: '9-16' },
  ],
};
```

The build checks every section id and question range exists on the topic page, so a plan can never point at a question that has moved.

## Output
- One page per lesson at `/courses/gcse/lessons/<topic>-<n>.html`, built by `scripts/build.mjs` like the answer keys, `noindex` and out of the sitemap (same as `key/`).
- Layout: a one-page summary (objectives, prior knowledge, key words, resources, timings) then the three parts, then a "Links into the book" list. Prints to two A4 sides.
- Every link goes back into the book with the existing deep links: `topic.html#section`, `topic.html?q=5-12` for a question set, `#q12` for one question, `key/<topic>.html` for answers, the printable worksheet button.
- An index on `teachers.html`: a "Lesson plans" column in the existing topics table, and a scheme-of-work view following the study routes in `route.html` (8-week resit, 12-week whole book, 6-week Higher top-up).
- Optional later: a "Present" mode that shows the starter questions full-screen for the board.

## Rules
- No third-party requests; no accounts; nothing sent anywhere. Plans are static pages.
- **Maths accuracy gate** for the hand-written parts (hooks, notes); generated parts inherit the topic's already-checked content.
- Headings fit the outline (`h1` lesson title, `h2` the three parts, `h3` within). axe-core on every plan page, light and dark, at 320px and in print.

## Tests
- Every live topic has at least one lesson (once the rollout flag is on); every `sections` id and `questions` range resolves on the topic page.
- Every lesson page's starter links only to topics in that topic's `needs` (or their warm-ups); its plenary links only to derived `unlocks` or extension links.
- Lesson pages are `noindex` and absent from `sitemap.xml`; no third-party requests.

## Rollout
1. **Pilot (1 PR):** `lessons.mjs`, generator, template, tests, and plans for Pythagoras, Fractions and Sequences. Ask a real teacher (Greg to choose who) to try one lesson and say what is missing.
2. **Fill in by strand** (one PR per strand), with `tester` checking a sample of links and print layout, and `ux-designer` reviewing the printed page.
3. **Scheme-of-work view** on the teachers' page.
4. Turn on the "every live topic has a lesson" check.

Best done **after the extension pilot**, so the plenary can use the "Where this leads" data from day one.

## Open questions for Greg
- Lesson length: 60 minutes (10/35/15) assumed; some schools run 50 or 100 minute lessons. Offer a 50 and 100 minute variant?
- Should plans be public (helpful marketing for teachers) or kept `noindex` like the answer keys (proposed: `noindex` for the pilot).
- Any teacher you would like to pilot it with.
