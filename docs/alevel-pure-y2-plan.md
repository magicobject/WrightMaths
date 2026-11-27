# A-level Pure, Year 2: plan (draft 1, 27 Nov 2026)

The second half of the A-level Pure book at `/courses/a-level/`. The content is already fixed: the 26 topics marked **Y2** in [alevel-pure-syllabus.md](alevel-pure-syllabus.md) (checked against AQA 7357, Edexcel 9MA0, OCR H240 and MEI H640). This plan is about **order, batching, the extra page types Year 2 needs, and the gates**, not about re-deciding the syllabus. It works the same way as Year 1: read [alevel-book-authoring.md](alevel-book-authoring.md) and [book-authoring.md](book-authoring.md) first.

## 1. Aim

A student who has finished Part 1 (Year 1) can work through Part 2 on their own and sit any English board's full A-level pure papers. Part 2 should also feel different: Year 2 is where A-level stops being "more GCSE" and becomes calculus-heavy, proof-aware mathematics, so the book leans harder on *why it works* and on linking topics together.

## 2. What Year 2 adds that Year 1 did not have

| Need | Why | What we build |
|---|---|---|
| **Longer chains of prerequisites** | Y2 topics sit on several Y1 topics at once (e.g. `differentiation-standard` needs four). | The derived "you need" panel already handles it; add a "quick refresh" link to each Y1 recap set, not just the topic page. |
| **Synoptic questions** | Year 2 papers mix areas freely (trig + calculus + parametric in one question). | A new page type, **Mixed problems** (one per area pair, about 8), built once the topics in it are live. Same question markup as topic pages. |
| **Proofs that must be known** | Sum of AP and GP, addition formulae, first principles for sin and cos. | A "Proofs you should be able to write" box in the topics that own them, and a single **Proofs index** page linking every one. |
| **Formula sheet awareness** | Y2 is where "given" formulae multiply (quotient rule, parts, Newton–Raphson). | Every formula gets the "learn" or "given" marker from syllabus section 5; the Edexcel booklet must be read first (it is still an open check). |
| **Figures that move** | Cobwebs, staircases, tangent lines in Newton–Raphson, families of DE solutions. | Static figures from `figure-lib.mjs` as today; one optional step-through control per figure (no library, no third-party script). Design and accessibility review before it is used widely. |

## 3. Build order (batches)

Ordered so every batch only needs topics already live. Each batch is one PR per topic, as with Year 1.

| Batch | Topics | Depends on (Y1 live?) |
|---|---|---|
| 1. Foundations | `proof-contradiction`, `functions`, `algebraic-fractions`, `radians` | Y1 proof, transformations, polynomials, trig graphs |
| 2. Functions onward | `modulus`, `sequences`, `trig-reciprocal-inverse`, `roots-change-of-sign` | Batch 1 |
| 3. Series and trig | `series-arithmetic`, `series-geometric`, `trig-compound`, `binomial-general` | Batch 2 |
| 4. Calculus core | `differentiation-standard`, `differentiation-rules`, `integration-standard`, `parametric` | Batch 3 |
| 5. Calculus techniques | `differentiation-implicit-param`, `curve-sketching`, `integration-substitution`, `integration-parts`, `integration-fractions`, `area-between-curves` | Batch 4 |
| 6. Capstones | `iteration`, `trapezium-rule`, `differential-equations`, `vectors-3d` | Batch 5 |
| 7. Joining it up | Mixed problems pages, Proofs index, a full Part 2 review | All of the above |

`vectors-3d` only needs `vectors-2d` and can be pulled forward into any batch if a writer is free.

## 4. Page anatomy

Unchanged from Year 1 (30+ questions, 6+ Check-your-knowledge sets, one Flip-it, a ladder and solution on every question, wrong-answer messages for the common slips). Two additions for Year 2, enforced by `test/alevel-book.spec.ts` once agreed:
- **"Where this goes next"**: one short paragraph per topic naming the Further Pure topic or university idea it leads to (e.g. Maclaurin series after `binomial-general`). Keeps the bridge books (separate plans) connected.
- **Exam-style section uses mixed-area questions** at least twice per topic.

## 5. Gates

- **Maths accuracy gate**, as now: nobody releases their own topic; a different agent checks every answer, hint, wrong-answer message and solution.
- **Accessibility**: axe on every page, light and dark, open states, 320px (already in `test/accessibility.spec.ts` once each page is in `test/support/alevel-pages.ts`).
- **Privacy**: no third-party requests; progress stays in `wm-a-level-v1`.
- **ux-designer** review of the first Mixed problems page and of the step-through figure before either pattern is repeated.

## 6. Open checks before writing starts

1. Read the Edexcel formula booklet (syllabus section 7 lists it as unread).
2. Confirm the OCR H240 placement of radians (syllabus section 7).
3. Decide whether **[beyond]** items (|f(x)|, improper partial fractions, the e^x sin x cycle in parts) are written now or later. Syllabus question 2 is still open with Greg.

## 7. Questions for Greg

1. Is "Part 2" the right public name, or should Year 2 have its own title on the Courses page?
2. Should Year 2 stay a hidden preview like Year 1, or go public topic by topic as each passes the accuracy gate?
3. Is a print edition of Year 2 wanted (as for GCSE), so figures need a print-safe version from the start?
