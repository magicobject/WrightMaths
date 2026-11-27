# Further Pure Mathematics: plan (draft 1, 27 Nov 2026)

A third interactive book, after GCSE and A-level Pure, covering the **pure content of A-level Further Mathematics**. [alevel-pure-syllabus.md](alevel-pure-syllabus.md) already says this book is planned and has no syllabus yet; this document is that plan.

**Status.** Written from general knowledge of the specifications, **not yet checked against them**. Before any topic is written, the syllabus must be verified the way the A-level one was (section 8). Board codes below are to be confirmed against the boards' own sites.

## 1. Aim and who it is for

Students taking Further Maths alongside A-level Maths, usually a strong minority of a sixth form, often taught in small groups or partly self-taught. Many schools cannot staff Further Maths fully, so the book must work **without a teacher**: more worked examples, more "why it works", and complete solutions.

## 2. The boards

All English Further Maths specifications share a DfE core (compulsory pure content) and then differ in options. Expected targets, to confirm:

| Board | Specification (to confirm) |
|---|---|
| AQA | A-level Further Mathematics 7367 |
| Pearson Edexcel | A-level Further Mathematics 9FM0 |
| OCR | Further Mathematics A, H245 |
| OCR (MEI) | Further Mathematics B (MEI), H645 |
| DfE | "Further mathematics AS and A level content" |

The book covers the **compulsory core pure** content first (common to every board), then the most common **pure options** (Further Pure 1/2 style content) as a second part, with board tags as in the A-level syllabus. Mechanics, statistics and decision maths options are out of scope.

## 3. Proposed areas (core pure, to verify)

| Code | Area | Indicative topics |
|---|---|---|
| FP | Proof | Proof by induction (sums, divisibility, matrices, inequalities) |
| FC | Complex numbers | Arithmetic, Argand diagram, modulus–argument, loci, de Moivre, nth roots, exponential form, roots of polynomials with real coefficients |
| FM | Matrices | Arithmetic, determinants, inverses (2×2, 3×3), linear transformations, invariant points and lines, solving systems and their geometry |
| FR | Roots of polynomials | Relations between roots and coefficients, transformed equations |
| FV | Vectors | Vector and Cartesian equations of lines and planes, scalar product, angles, intersections, distances |
| FS | Series | Standard sums (Σr, Σr², Σr³), method of differences, Maclaurin series |
| FK | Further calculus | Volumes of revolution, mean value, improper integrals, inverse trig and hyperbolic integrals, partial fractions with quadratic factors |
| FH | Hyperbolic functions | Definitions, graphs, identities, inverses in log form, calculus |
| FL | Polar coordinates | Curves, sketching, area |
| FD | Differential equations | Integrating factor, second-order linear with constant coefficients, simple harmonic motion and damping, coupled systems [some boards] |

Expected size: about 35–45 core topics. Each `needs` Y1/Y2 A-level topics by id, so the derived prerequisite panel can link straight into the A-level book.

## 4. How it is built

- Same machinery as the A-level book: MathML via `{m:}`/`{md:}`, generated figures, topic graph and glossary as single sources (`src/book/further/topics.mjs`, `glossary.mjs`), a build step alongside `build-alevel.mjs`, progress key `wm-further-v1`.
- **New figure needs:** Argand diagrams and loci, 3D lines and planes, polar curves, matrix transformations of the unit square. Each is a new `figure-lib` function, reviewed for accessible titles and descriptions.
- **Cross-book prerequisites.** The topic graph must be able to name an A-level topic as a prerequisite (`al:functions`). The build fails if that topic does not exist. This is the one genuinely new piece of architecture: `architect` reviews it before it is built.
- No voice, same as A-level.

## 5. Pedagogy additions

- **Induction is everywhere.** A "prove it by induction" Flip-it variant appears in series, matrices and complex numbers.
- **Geometry of algebra.** Every complex-number and matrix topic ends with a "see it" section tying the algebra to a picture.
- **Self-study support.** Each topic opens with a 5-minute "Do I remember enough?" check against its A-level prerequisites.

## 6. Pilot

Three topics that exercise the new machinery: `complex-basics` (Argand figures), `matrices-transformations` (transformation figures) and `proof-induction` (cross-book prerequisites to `al:proof-methods` and `al:series-arithmetic`).

## 7. Gates

As for the other books: maths-accuracy check by someone other than the author, axe on every page and state, no third-party requests, no data leaves the device. `ux-designer` reviews the first pilot page; `architect` reviews cross-book prerequisites.

## 8. Before writing: verify the syllabus

1. Read each board's specification and formula booklet; record versions read, as in A-level syllabus section 7.
2. Split core vs options per board and decide the option set.
3. Note where Further Maths content overlaps A-level Maths papers (e.g. some boards teach parts in AS Further Maths).

## 9. Questions for Greg

1. Public name of the book.
2. Core only first, or core plus options from the start?
3. AS Further Maths as a separate Part 1 (like A-level), or one book?
