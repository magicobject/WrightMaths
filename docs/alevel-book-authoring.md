# Writing for the A-level book

The book lives at `/books/a-level/` (hidden pilot: not linked from the site, not in the sitemap, `noindex`). The content plan is [alevel-pure-syllabus.md](alevel-pure-syllabus.md): 47 topics, 10 areas, Year 1 and Year 2, checked against the AQA, Edexcel, OCR A and OCR MEI specifications. **Read [book-authoring.md](book-authoring.md) first**: the A-level book works the same way as the GCSE book. This guide lists only what is different or new.

## What is different from the GCSE book

| | GCSE book | A-level book |
|---|---|---|
| Voice | Listen buttons and recorded clips | **None, at all.** No `data-say`, no audio, no mention of Listen or voices. Every page has `data-audio="off"` (added by the build) |
| Strands | 6 (`n a r g p s`) | 10 areas, ids `al-proof`, `al-algebra`, `al-coordinate`, `al-sequences`, `al-trigonometry`, `al-exponentials`, `al-differentiation`, `al-integration`, `al-numerical`, `al-vectors` |
| Levels | Foundation / Higher (`tier`) | `year: 1` or `2` on a topic; glossary `level: 'Y1'` or `'Y2'` |
| Maths | HTML entities, `<sup>`, `{frac:}` | native **MathML** from `{m:...}` and `{md:...}` (below). `{frac:}` and `<sup>` still work in running text |
| Figures | hand-written SVG | **generated** by `src/book/alevel/figure-lib.mjs`, one file per topic (below) |
| Source | `src/book/topics.mjs`, `glossary.mjs`, `src/pages/books/gcse/` | `src/book/alevel/topics.mjs`, `glossary.mjs`, `figures/`, `src/pages/books/a-level/` |
| Build | `scripts/build.mjs` | `scripts/build-alevel.mjs` (run by `npm run build`) |
| Progress key | `wm-gcse-v1` | `wm-a-level-v1`, kept separate |

## Add a topic

1. In `src/book/alevel/topics.mjs` change the topic's `status` from `'planned'` to `'live'`, fill in `words` (the glossary ids shown in "Words you need").
2. Create `src/pages/books/a-level/<id>.html` (copy the page shape from `docs/book-authoring.md`; same sections: hero, `{prereqs}`, `{words}`, warm-up and recap, numbered lessons with Key idea / Worked / faded example, a Check-your-knowledge set after every chunk, one Flip-it section, spot the mistake, mixed review, exam style, why it works, common traps, "I can", `{unlocks}`). The root element is `<main class="book strand-<area-id>" data-book-page="topic" data-topic="<id>">`, for example `strand-al-algebra`.
3. Every term in its `words` list and every `{term:id}` must exist in `src/book/alevel/glossary.mjs`.
4. Add the page to `ALEVEL_TOPICS` in `test/support/alevel-pages.ts`.
5. `npm run build` and `npm test`.

Minimums per topic page (the tests enforce them): at least 30 questions (`.q`), at least 6 `section.ckw` sets, one `.solution` and one `ol.ladder` per question, exactly one `section.flip-section`.

## Maths: `{m:...}` and `{md:...}`

`{m:...}` is inline maths. `{md:...}` is a display equation on its own line. Both become MathML with a text alternative. A typo fails the build.

| Write | You get |
|---|---|
| `{m:x^2+5x+4}` | x² + 5x + 4 |
| `{m:x^(n+1)}`, `{m:e^(2x)}`, `{m:u_n}`, `{m:u_(n+1)}` | powers and subscripts. A power binds to the one thing in front of it; use brackets for more |
| `{m:frac(x+1, x-2)}` | a stacked fraction |
| `{m:frac(dy, dx)}`, `{m:frac(d^2y, dx^2)}` | derivatives (d and the letter are separate pieces) |
| `{m:sqrt(x+1)}`, `{m:root(3, x)}` | roots |
| `{m:abs(x-3)}` | modulus (never type `\|x\|`: the build refuses it) |
| `{m:int(0, 2) x^2 dx}` | a definite integral; `{m:int() x^2 dx}` is an integral with no limits |
| `{m:sum(r=1, n) r^2}` | sigma with limits |
| `{m:lim(x -> 0) frac(sin x, x)}` | a limit |
| `{m:sin(30deg)}`, `{m:30deg}` | degrees |
| `{m:x >= 2}`, `{m:x <= 2}`, `{m:x != 2}`, `{m:a*b}`, `{m:-3}` | ≥ ≤ ≠ × and a true minus |
| `{m:pi}`, `{m:theta}`, `{m:alpha}`, `{m:Delta}`, `{m:infinity}` | Greek letters and ∞ |
| `{m:"for all x"}` | words inside an equation |
| `{m:vec(AB)}`, `{m:hat(a)}` | a vector arrow, a unit-vector hat |
| `~` | a small space |

Words `sin cos tan sec cosec cot arcsin arccos arctan ln log exp lim` are drawn upright. Any other run of letters is single-letter variables (`dx` is d and x).

**Where it may and may not go.** `{m:}` works in lesson text, `qtext`, solutions, hints, wrong-answer messages and glossary `example`/`watch`/`flip`. It must **not** go in an HTML attribute at all (`data-why`, `data-answers`, `title`: the build fails if it finds it there; write plain text and entities such as `x&sup2;` instead). It must **not** go in a glossary `def` (that is also the pop-up, which is plain text).

**Typed answers** are plain one-line text, not maths markup: `data-answers="x^2+5x+4"`. The checker (`public/js/book-answer.mjs`) understands single-letter variables, `+ - * / ^` and brackets, so equivalent algebra is accepted. **It does not understand function names** (`sin`, `ln`, `e^x`): for answers containing them, set `data-mode="exact"` and list every accepted written form, separated by `;`. Say in the question how the answer must be written ("Give your answer in the form ...").

## Figures

Every figure is generated from the function that defines it (`src/book/alevel/figure-lib.mjs`), so a picture cannot disagree with its equation.

- One file per topic: `src/book/alevel/figures/<topic-id>.mjs` exporting `FIGURES = { '<topic-id>-<name>': () => svg }`. The id **must** start with the file's name. Use `plane()` and `numberLine()`; see the header of `figure-lib.mjs`.
- On a page: `<figure class="figure-lg">{fig:quadratics-roots}<figcaption>...</figcaption></figure>` for a lesson figure, and `<figure class="qfig-lg">{fig:...}</figure>` straight after `p.qtext` for a question figure.
- **Large and clear:** a figure shows ONE idea. Put the labels on the diagram itself (the points, the gradient, the shaded area), not in the caption. Never shrink the label sizes. Mark the thing the text is about. Use `curve` then `curve-b` (dashed) then `curve-c` (dotted) so lines differ by style as well as colour. Use `shade` for areas, with a label saying what is shaded.
- **Every concept gets a diagram**, and so does every worked example that has one (a graph, a number line, a triangle, a region). If a worked example has no natural picture, say why in a comment.
- **`desc`** says in words what the picture shows (shape, key points, labels). On a question figure it must **not** give the answer.
- Figure ids are unique on a page. Do not use more than three figures in one screenful of text.

## Language rules (hard, and checked in review)

The reader may be 16, tired, and new to a big idea. Write for them.

1. **Short sentences, one idea each.** Aim for 15 words or fewer. Active voice. "Differentiate the function" not "The function is to be differentiated".
2. **Define before use.** A new word is written as `{term:id}` on its first use in each section, and defined in the glossary. A new symbol is read out in words the first time ("dy by dx, read as 'the derivative of y with respect to x'").
3. **Say what to act on.** "Find the gradient of the curve at x = 2", never "Find it".
4. **One word for one thing.** Use the glossary's term every time (never "gradient function" in one place and "slope formula" in another). Command words follow the glossary: *solve*, *find*, *show that*, *hence*, *sketch*, *prove*, *state*, *write down*.
5. **State order, direction and units.** "From smallest to largest", "in radians", "to 3 significant figures", "give exact values".
6. **No filler or false ease.** Never "simply", "just", "obviously", "easy", "clearly".
7. **Say what a result means.** After a calculation, one sentence on what the answer tells you ("The discriminant is negative, so the curve does not cross the x-axis").
8. **Exam boards.** Name a board only for content that differs ([AQA], [Edx], [OCR], [MEI]), and say "not needed for the other boards".
9. **Notation.** Use sin⁻¹ (name arcsin once), cosec (never csc), f′(x) and dy/dx, gf(x), ⁿCᵣ and the stacked form. The book is pure only: no mechanics or statistics contexts except short "in context" notes.
10. **Be exact about the maths.** Never write "x = ±3" for "x = 3 or x = −3" without saying so. Never divide by an expression that could be zero without saying why it cannot be.

## Glossary

`src/book/alevel/glossary.mjs`: one list for Year 1 and Year 2 together. Format and rules are in the file's header. Every term has a plain-English `def` (one sentence, plain text), at least one `example`, a `watch` where there is a common slip, and a `flip` where the idea has a reverse side. Add a picture in `src/book/alevel/term-figures.mjs` for visual terms (tangent, normal, asymptote, stationary point, radian, ...). `level` is the year the term is first needed.

## No voice, no tracking

- No Listen button, no recorded audio, no speech code reachable from an A-level page, and no `data-say` attribute. The tests fail if any appears.
- No third-party request from any page (no fonts, no CDN, no embeds). A test fails if one is made.
- Progress is `localStorage` only, key `wm-a-level-v1`. Nothing is sent anywhere. Any feature that would send data needs `security-architect` and `security-engineer` first.

## Accuracy gate

A topic is not released until someone other than its author has checked every answer, wrong-answer message, hint and solution, and the language review has passed. Reviewers recompute answers with a script wherever possible. Record both reviews in the pull request.
