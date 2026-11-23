# GCSE Online Maths Textbook: plan (draft 1, 23 Nov 2026)

Working title: **to be decided by Greg** (public naming). Placeholder: "the Book".

## 1. Aim

An online GCSE maths textbook that a 14 to 16 year old actually wants to open: colourful, interactive, and built so that things *stick*. Online first; the same source later produces a print edition to sell. Lives inside WrightMaths (`/book/`), and is the best advert the tuition has.

Success looks like a student who can say "I got that one" within two minutes of landing on any page.

## 2. Principles (every page is judged against these)

1. **Success first.** Every topic opens with a question the student can already nearly answer. Early wins, then stretch.
2. **Two sides of every idea.** Each topic has a "Flip it" section (see 5).
3. **Words are first-class.** Every mathematical term is highlighted, defined once in plain English, and findable (see 6).
4. **Never stuck for long.** Every question has a "Help, I'm stuck!" ladder (see 7).
5. **Learning science built in, not bolted on** (see 4).
6. **Kind to children.** No accounts, no tracking, no data leaves the device (see 9).
7. **Print-ready from day one.** Content is structured data, not hand-built pages (see 8).
8. **Original content only.** Nothing copied from other textbooks or past papers; exam boards are named only to tag where a topic is examined.

## 3. Coverage: "most of the syllabus"

GCSE maths content is set by the DfE and is shared by AQA, Edexcel, OCR and WJEC, so one book covers all boards. Six strands, Foundation and Higher marked per topic (F = both tiers, H = Higher only):

| Strand | Colour (to be contrast-checked) | Units (approx. topics) |
|---|---|---|
| Number | Blue | Place value, four operations, fractions/decimals/percentages, factors/multiples/primes, powers and roots, standard form, surds (H), bounds, estimation (~14) |
| Algebra | Purple | Notation, expand/factorise, solving linear and quadratic, formulae, sequences, graphs, simultaneous equations, inequalities, functions (H), iteration (H) (~18) |
| Ratio, proportion, rates of change | Orange | Ratio, scale, proportion, percentage change, reverse percentages, compound measures, gradient as rate, direct/inverse proportion (~9) |
| Geometry and measures | Green | Angles, polygons, area/perimeter/volume, Pythagoras, trigonometry, circles, transformations, constructions, vectors (H), circle theorems (H), similarity (~20) |
| Probability | Pink | Basic and experimental probability, tree diagrams, Venn diagrams, conditional probability (~5) |
| Statistics | Teal | Averages, charts, scatter graphs, cumulative frequency (H), histograms (H), sampling (~7) |

About **70 to 75 topics**. Each topic = about 6 to 10 screens (see 5). This is a large build, so it is delivered in phases (section 10), not all at once.

Gaps and judgement calls (needs a check against the current DfE content document and each board's own specification before launch): exact F/H boundaries, and which topics boards weight differently (for example formulae to learn versus given).

## 4. Learning psychology: how it will stick

| Technique | How the Book does it |
|---|---|
| Retrieval practice | Every page opens with 3 "Last time" questions from earlier topics; closing quiz is closed-book first |
| Spaced repetition | A "Revisit" queue resurfaces topics at growing gaps (1, 3, 7, 21 days), kept on the device |
| Interleaving | Mixed-topic "Shuffle" sets unlocked after a topic, so students must choose the method, not just apply it |
| Worked, then faded examples | Fully worked example, then a half-done one, then a blank one. Steps are revealed one at a time |
| Concrete, pictorial, abstract | Each idea starts with a picture or manipulative (area model, number line, algebra tiles), then symbols |
| Dual coding | Colour-matched diagram and working: the same colour marks the same quantity in both |
| Error-focused learning | "Spot the mistake" questions; wrong answers get a *specific* reason ("you added the denominators") not just a red cross |
| Confidence marking | Before checking, the student taps "sure / maybe / guess"; the Book uses the gap between confidence and result to choose what to revisit |
| Growth mindset, success-driven | Progress shown as "skills unlocked" and a topic map filling with colour. Streaks reward returning, never punish a missed day. No leaderboards, no timers by default |
| Goal gradients | A visible "3 more to master this" bar on every topic |
| Real-life hooks | Each topic opens with a real situation (gaming, sport, money, music), checked for being believable to teenagers |

Mastery levels per skill: **Seen, Practised, Secure, Exam-ready**, reached by correct answers across *different days* and *different question styles*, not by repeating one question.

## 5. Page anatomy (every topic)

1. **Hook:** a real-world question and a quick first try.
2. **Last time:** 3 retrieval questions.
3. **Learn it:** short explanation, key terms highlighted, picture or manipulative.
4. **Watch it:** worked example, revealed step by step; then a faded one.
5. **Try it:** interactive questions, easy to hard, with instant specific feedback.
6. **Flip it:** the reverse (see below).
7. **Spot the mistake.**
8. **Exam style:** longer multi-step question with marks and a mark-scheme-style self-check (written originally).
9. **Wrap-up:** key terms recap, "What I can now do" tick list, and the next topic.

### Flip it: the reverse side

Every topic pairs a forward skill with its inverse, and questions are presented both ways (forward, then "work backwards"). Examples:

- multiplication and division; addition and subtraction
- powers and roots; expanding and factorising
- solving an equation (undoing operations) and building one
- percentage increase and reverse percentage
- Pythagoras: find the long side, and find a short side
- area and "what side length gives this area?"
- mean from data, and "what number makes this mean?"
- gradient from points, and a line from a gradient
- probability from a diagram, and drawing a diagram from a probability
- trigonometry: find the side, and find the angle

Each topic's metadata lists its flip partner, so the two are linked in both directions and can appear together on a topic map.

## 6. Mathematical language

- Every term is marked up in the source (`{term:denominator}`), and the build turns the first use per section into a highlighted, tappable word with a one-sentence plain definition, a picture where useful, and "see also" links. Works on touch, mouse and keyboard.
- **Glossary** page: A to Z, filterable by strand, each term showing where it is taught and examined.
- **Word cards**: flip-card self-test (term to meaning, meaning to term; this is also a "flip" exercise).
- **Maths-speak** boxes: words that mean something different in maths than in daily life (*product, mean, volume, similar, expression*), and word origins where they help memory (*hypotenuse*, *coefficient*).
- Question wording is kept in exam-board command-word style (*Work out*, *Show that*, *Explain*), with a command words guide.
- One definition per term, held in one place (single source of truth), so the book, glossary and print index can never disagree.

## 7. "Help, I'm stuck!"

A ladder on every question, revealed one rung at a time, so the student always does the final thinking:

1. **What is it asking?** Plain-English rewording, key words highlighted.
2. **Where do I start?** A nudge about the method, not the answer.
3. **Show me a similar one:** a parameterised worked example with different numbers.
4. **Show me the step:** reveals only the next step.
5. **Go back a bit:** links to the prerequisite topic if the skill underneath looks shaky (detected from the wrong answer).
6. **Ask a person:** a link to book a WrightMaths lesson. This is the one place the book sells, kept honest and unpushy.

Using help is never penalised in the student's own view. It earns a gentle "come back to this one tomorrow" in the Revisit queue.

## 8. Architecture

Static site, matching the repo: no backend, strict CSP kept (`script-src 'self'`, no third party code).

- **Content as data.** Topics are structured source files (`content/book/<strand>/<topic>.md` plus front matter for metadata: strand, tier, prerequisites, flip partner, terms, board tags). One build produces the web pages *and* the print edition. Nothing under `public/` is hand-edited (existing rule).
- **Maths rendering.** KaTeX, run at **build time** (no runtime script, works without JS, prints crisply). Fonts self-hosted.
- **Question engine.** Small, vanilla ES modules served from `/js/`. Question types: numeric/algebraic answer, multiple choice, drag to order/match, fill the steps, sliders and manipulatives (number line, algebra tiles, graph with sliders, angle and transformation tools), term-matching.
  - **Parameterised generators** make fresh numbers every time (so retries are not memorised) with a unit test per generator that checks answers and that every wrong-answer feedback fires.
  - **Equivalent-answer checking** (for example 0.5, 1/2, 50%) done carefully and tested.
- **Progressive enhancement.** Every page reads fine with no JS (questions show with answers in an "answers" section); JS upgrades them to interactive. This is also what makes the print edition cheap.
- **Progress** stored on the device only (localStorage, wrapped in try/catch). Optional later: export/import progress as a short code, so no accounts are needed.
- **Print edition.** Print stylesheet plus a build step to PDF (Playwright or Paged.js) from the same content. Interactive items fall back to their static form, with answers collected at the back and QR codes linking to the online version. Interior and cover for print-on-demand (for example KDP) or a printer, to be decided later.
- **Accessibility.** Set up the axe-core suite *first* (this repo does not have one yet; its CLAUDE.md requires that before accessibility work). Colour never carries meaning alone; contrast computed per colour pairing; keyboard-operable manipulatives; reduced-motion respected; dyslexia-friendly typography options (font, spacing, background tint).

## 9. Safeguarding and data

The audience is children. Keep it simple and safe:

- No accounts, no analytics, no cookies, no third-party embeds. Progress stays in the browser.
- No free-text input sent anywhere. No chat.
- Any later feature that sends data (teacher classes, accounts) goes through `security-architect` and `security-engineer` before it is built, and is a separate decision.
- Online-safety wording on the "Ask a person" link goes through the existing safeguarding page.

## 10. Phases

| Phase | What | Done when |
|---|---|---|
| 0. Foundations | Axe suite; content schema; build step for `/book/`; question engine v1; glossary build; design tokens (strand colours, contrast-checked) | One empty-but-wired topic builds, passes the tests and axe, prints to PDF |
| 1. Pilot unit | 3 topics across 2 strands (suggest: *Fractions*, *Solving equations*, *Pythagoras*), complete with Flip it, stuck ladder, glossary, Revisit queue | Real students try it (Greg's tutees) and we learn what sticks; fix before scaling |
| 2. Number and Algebra | The two largest strands | Foundation core covered |
| 3. Ratio, Geometry, Probability, Statistics | Remaining strands | Whole F course covered |
| 4. Higher tier extras | Surds, circle theorems, vectors, histograms, etc. | Whole specification covered |
| 5. Print edition | Typeset, proofread, index, answers, covers; sale route | Decision by Greg on route and price |

Each topic follows the repo's rules: own branch and PR, `/updates` entry, build tag, `npm test` and `npm audit --omit=dev` green. Maths content and question generators are reviewed by someone other than the author (tester agent, plus Greg for maths accuracy), since "no agent checks its own work".

## 11. Risks

- **Scale.** About 70 topics is months of work; the pilot is there to prove the template before committing to the rest.
- **Accuracy.** One wrong worked answer in a maths book is costly. Mitigation: generators unit-tested, every example verified by code where possible, Greg reviews each topic.
- **Copyright.** Original wording, diagrams and questions only. Exam-style questions written fresh, not adapted from papers.
- **Engagement versus gimmicks.** Rewards must follow real mastery, otherwise students learn to game it.
- **Print versus interactive.** Some interactives have no print form; each needs a deliberate static twin.
- **Content weight.** Hundreds of pages need to stay fast on cheap phones. Budget per page to be set in Phase 0.

## 12. Decisions

**Made (23 Nov 2026)**
- Pilot topics: Fractions, Solving equations, Pythagoras. Live (hidden) at `/books/gcse/`, not linked from anywhere.
- Maths is a pyramid, so the topic graph (what each topic needs) is a first-class part of the build, and the foundation layers are planned alongside the pilot (section 13).
- Glossary entries carry a definition, an example, a trap warning, the reverse side of the idea and where it is taught.
- A "How to raise your grade" guide covers what changes at each step from grade 1 to 9.
- "Check your knowledge" sets follow every chunk, not just the end of a topic.
- Colour: one colour per strand, one teal for mathematical words, every pairing contrast-checked.

**Still open**
1. Public **name** of the book.
2. **Access model**: free online with print for sale, free sample plus paid full access, or all paid.
3. Visual character: a mascot or not; playful versus cool in tone.
4. **Print route** (later): self-publish on demand, or a printer run.
5. When to **link** it from the site (it stays hidden until Greg says).

## 13. Building the base (the pyramid)

Maths stands on itself, so the order of writing follows the topic graph in `src/book/topics.mjs`, bottom up:

1. **Base layer (in progress):** place value, add/subtract/multiply/divide and negative numbers are written. Still to do: order of operations, factors and multiples, squares and roots, shapes and angles, algebra basics (the pilot topics already name these as prerequisites, so they are on the pyramid as "coming soon").
2. **Then what the pilot unlocks:** percentages, ratio, rearranging formulae, simultaneous equations, quadratics, trigonometry, repeated percentage change.
3. Only then the wider strands (probability, statistics, the rest of geometry).

Each layer is checked before the one above is written: a topic is not released until the topics it needs are, and `npm test` and the build keep the graph honest (no gaps, no cycles).
