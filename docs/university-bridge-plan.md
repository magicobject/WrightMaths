# Bridge to university mathematics: plan (draft 1, 27 Nov 2026)

A book for the summer between A-level and a maths (or maths-heavy) degree, and for the first term. It turns "calculating with confidence" into "reading and writing proofs about definitions".

**Status.** Proposal. No external syllabus exists for this, so the content below is our own choice, drawn from what first-year courses commonly start with. Universities differ; before publishing, compare against a sample of published first-year module outlines and say which were read.

## 1. The gap

At A-level, mathematics is mostly methods. At university, the first weeks are definitions, theorems and proofs, with notation many students have never seen (∀, ∃, ⊆, ε). Students who were top of their class often struggle not with difficulty but with **what is being asked**. Most universities publish a bridging reading list; few students finish it.

## 2. Who it is for

- Students holding a maths, physics, engineering, computing or economics offer.
- Further Maths is helpful but not required: each chapter states what it assumes, linking to the A-level and Further Pure books.

## 3. Proposed chapters

| # | Chapter | Key ideas |
|---|---|---|
| 1 | The language of mathematics | Statements, quantifiers ∀ ∃, negating them, implication and its converse and contrapositive |
| 2 | Sets and functions | Set notation, subsets, unions, Cartesian products; injective, surjective, bijective; images and preimages |
| 3 | Proof techniques | Direct, contrapositive, contradiction, induction (weak and strong), cases, counterexamples; writing proofs well |
| 4 | Numbers | Integers, divisibility, primes, Euclid's algorithm, modular arithmetic; rationals and irrationals; what the real numbers are (informally) |
| 5 | Inequalities and absolute value | Triangle inequality, AM–GM, bounding expressions: the toolkit for analysis |
| 6 | Sequences and limits | The ε–N definition, proving limits, divergence, monotone bounded sequences |
| 7 | Series | Convergence tests, geometric and harmonic series, why rearranging can go wrong |
| 8 | Continuity and differentiability | ε–δ, the intermediate value theorem, what A-level calculus was assuming |
| 9 | Linear algebra first steps | Vectors in ℝⁿ, linear independence, span, matrices as linear maps |
| 10 | Groups, a first look | Symmetries, the axioms, examples and non-examples |
| 11 | How to study at university | Reading a proof line by line, lecture notes, problem sheets, asking for help |

About 11 chapters of 3–5 sections each. Optional strands for physics/engineering (vector calculus preview) and computing (logic and discrete maths) can follow if wanted.

## 4. How it differs from the other books

- **Proof-checking questions.** Many questions show a "proof" and ask which line is wrong, or ask the student to order the lines of a proof (drag-and-drop with a keyboard alternative). These can be auto-checked, unlike free-written proofs.
- **Definitions first.** Every section starts with a boxed definition and two examples and one non-example.
- **Quantifier practice** as short, frequent, auto-marked drills (negate this statement; true or false).
- Free-written proofs get a model answer and a self-marking checklist.

## 5. Build and gates

Same machinery as the A-level book (MathML, generated figures, topic graph and glossary as single sources, cross-book prerequisites from the Further Pure plan). The proof-ordering question type is new: `architect` and `ux-designer` review it before it is built, and axe plus keyboard-only testing (`tester`) before release. Maths accuracy gate as for every book. No data leaves the device.

## 6. Pilot

Chapters 1 and 3 (language and proof techniques): they need no new figures, test the new question types, and are useful to every A-level student too.

## 7. Questions for Greg

1. Name, and whether it sits under Courses or as a separate "Next steps" section.
2. Maths-degree focus only, or include the physics/engineering and computing strands?
3. Should it be written with a university partner reviewing it, or kept independent?
