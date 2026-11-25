# A-level Pure Mathematics: common syllabus (draft 1, 25 Nov 2026)

The content base for the planned A-level book. One book, all boards.

**Status and honesty note.** The backbone below is the DfE content for A-level Mathematics (2017), which every English board must follow. The board comparison in section 5 is written from knowledge of the specifications and **has not yet been checked line by line against the current specification PDFs**. Section 7 is that check. Nothing here is copied from a specification or textbook; topic names and groupings are our own.

## 1. Why one syllabus works

Since the 2017 reform, AQA (7357), Pearson Edexcel (9MA0), OCR A (H240), OCR MEI (H640) and WJEC Eduqas (A540QS) all teach the same DfE subject content. So the pure content is about **95% identical** across boards. The differences are in where it is examined (paper structure), the formulae a board gives or does not give, notation habits, and emphasis (for example MEI's use of technology and its Comprehension paper). The book therefore covers the **union** of the boards' pure content, with a small number of board-specific notes (section 5).

Not covered by this syllabus:
- Mechanics and Statistics (the applied strands). Pure only, as requested. The book's topic graph can take an applied branch later.
- Further Maths content: complex numbers, matrices, hyperbolics, volumes of revolution, polar coordinates, second-order differential equations and so on. Where students often ask, a "Beyond A-level" pointer is enough.
- CCEA (Northern Ireland) and WJEC's Wales-only A-level, which are unit-based and not on the DfE structure. Compare them separately before claiming coverage.

## 2. Structure

Ten content areas, as the DfE sets them, plus the three overarching themes that run through everything.

| Code | Area | Colour (contrast-check before use) |
|---|---|---|
| P | Proof | to decide |
| A | Algebra and functions | |
| C | Coordinate geometry | |
| S | Sequences and series | |
| T | Trigonometry | |
| E | Exponentials and logarithms | |
| D | Differentiation | |
| I | Integration | |
| N | Numerical methods | |
| V | Vectors | |

Overarching themes (taught inside topics, not as separate chapters, and tagged on questions):
- **OT1 Mathematical argument, language and proof.** Notation, logical connectives (implies, if and only if), clear working.
- **OT2 Mathematical problem solving.** Modelling a situation, choosing a method, interpreting the answer, evaluating it.
- **OT3 Mathematical modelling.** Assumptions, refinement, limits of a model.

**Two parts.** Each topic is tagged **Y1** (the AS content, also the first year of A-level) or **Y2** (A-level only). The book is built as Part 1 (Y1) and Part 2 (Y2), so a student sitting AS needs Part 1 alone. Y2 topics build on Y1 ones, never the other way round.

## 3. Assumed knowledge

Everything in the Higher GCSE content, in particular: manipulating and solving linear and quadratic equations, simultaneous equations (linear and linear/quadratic), indices and surds, straight-line graphs, Pythagoras, right-angled trigonometry, sine and cosine rules, circle theorems, vectors in 2D, basic sequences, and the GCSE-level graphs of quadratic, cubic and reciprocal functions. Each A-level topic names the GCSE topics it leans on, and the first chapter of Part 1 is a short bridge ("Is your GCSE ready?") with a retrieval check on exactly those.

The existing GCSE book can supply the bridging topics (see `src/book/topics.mjs`); where a GCSE page does not yet exist it is listed as a gap, not linked.

## 4. The common syllabus

IDs follow the existing convention (`src/book/topics.mjs`): lower-case, hyphenated, and the `needs` column is the prerequisite graph. Layers and "unlocks" are derived in the build, never written by hand. "Core" content is in every board; items marked ◇ need a board check (section 5).

### P. Proof

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `proof-methods` | Proof: direct, exhaustion, counterexample | Y1 | none (GCSE algebra) | Language of proof; proof by deduction with algebra; proof by exhaustion; disproof by counterexample; the symbols ⇒, ⇔, ∴ |
| `proof-contradiction` | Proof by contradiction | Y2 | `proof-methods` | Standard results: irrationality of √2; infinitely many primes |

### A. Algebra and functions

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `indices-surds` | Indices and surds | Y1 | GCSE | Laws of indices for rational exponents; surd arithmetic; rationalising denominators |
| `quadratics` | Quadratics | Y1 | `indices-surds` | Solve by factorising, formula, completing the square; the discriminant; sketch graphs; quadratics in disguise (substitution) |
| `simultaneous` | Simultaneous equations | Y1 | `quadratics` | Linear/linear and linear/quadratic, algebraic and graphical; interpretation as intersections |
| `inequalities` | Inequalities | Y1 | `quadratics` | Linear and quadratic inequalities; set and interval notation; regions on a graph |
| `polynomials` | Polynomials and the factor theorem | Y1 | `quadratics` | Algebraic division, remainder theorem, factor theorem, factorising cubics, solving cubics |
| `graphs-polynomials` | Graphs of polynomials and reciprocals | Y1 | `polynomials` | Cubic, quartic, y = a/x and a/x²; roots, repeated roots, asymptotes; intersections solve equations; proportionality graphs |
| `graph-transformations` | Transformations of graphs | Y1 | `graphs-polynomials` | Translations, stretches, reflections: f(x) + a, f(x + a), af(x), f(ax), −f(x), f(−x); combining them |
| `functions` | Functions | Y2 | `graph-transformations` | Mapping vs function, domain and range; composite and inverse functions; graph of f and f⁻¹ |
| `modulus` | The modulus function | Y2 | `functions`, `inequalities` | y = \|f(x)\|, y = f(\|x\|); solving modulus equations and inequalities; sketching |
| `algebraic-fractions` | Algebraic fractions and partial fractions | Y2 | `polynomials` | Simplify, add, multiply, divide; partial fractions with linear factors, including a repeated factor ◇ (and improper fractions) |

### C. Coordinate geometry in the (x, y) plane

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `straight-lines` | Straight lines | Y1 | GCSE | y = mx + c, y − y₁ = m(x − x₁), ax + by + c = 0; gradient, parallel and perpendicular; distance, midpoint; modelling with lines |
| `circles` | Circles | Y1 | `straight-lines`, `quadratics` | (x − a)² + (y − b)² = r²; completing the square to find centre and radius; tangent and normal; circle theorems used algebraically; line/circle intersection |
| `parametric` | Parametric equations | Y2 | `functions`, `trig-identities` | Parametric to Cartesian; common curves (circle, parabola); using in modelling (projectiles) |

### S. Sequences and series

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `binomial-positive` | Binomial expansion (positive integer n) | Y1 | `indices-surds` | Pascal's triangle, nCr and factorial notation, (a + bx)ⁿ, finding a given term, approximations |
| `sequences` | Sequences and recurrence relations | Y2 | `functions` | Term-to-term and position-to-term rules; increasing, decreasing, periodic; recurrence in modelling; convergence of an iteration to a limit |
| `series-arithmetic` | Arithmetic sequences and series | Y2 | `sequences` | nth term, sum formula, sigma notation, modelling |
| `series-geometric` | Geometric sequences and series | Y2 | `sequences`, `indices-surds` | nth term, sum to n, sum to infinity and convergence (\|r\| < 1), modelling |
| `binomial-general` | Binomial expansion (any rational n) | Y2 | `binomial-positive`, `algebraic-fractions` | (1 + x)ⁿ for rational n, validity \|x\| < 1; (a + bx)ⁿ; using with partial fractions and approximations |

### T. Trigonometry

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `trig-triangles` | Trigonometry in triangles | Y1 | GCSE | Sine and cosine rules (including the ambiguous case), area ½ab sin C, problems in 2D and 3D |
| `trig-graphs` | Trigonometric graphs and exact values | Y1 | `trig-triangles` | Graphs of sin, cos, tan and their transformations; exact values (0, 30, 45, 60, 90, multiples); periodicity and symmetry |
| `trig-identities` | Trigonometric identities and equations | Y1 | `trig-graphs`, `quadratics` | tan θ = sin θ / cos θ, sin²θ + cos²θ = 1; solving equations in a given interval, including quadratics in sin, cos, tan; proof by identity |
| `radians` | Radians, arcs and sectors | Y2 | `trig-graphs` | Radian measure; arc length and sector area; small-angle approximations for sin, cos, tan |
| `trig-reciprocal-inverse` | Reciprocal and inverse trigonometric functions | Y2 | `functions`, `trig-identities` | sec, cosec, cot and their graphs; arcsin, arccos, arctan with domain and range; identities 1 + tan²θ = sec²θ, 1 + cot²θ = cosec²θ |
| `trig-compound` | Addition formulae, double angle and R-form | Y2 | `trig-reciprocal-inverse` | sin(A ± B), cos(A ± B), tan(A ± B); double-angle formulae; a sin x + b cos x = R sin(x + α); proofs and equations; maximum and minimum |

### E. Exponentials and logarithms

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `exponentials-logs` | Exponentials and logarithms | Y1 | `indices-surds` | y = aˣ and the graph of eˣ; logarithms as inverses; laws of logs; solving aˣ = b; natural log; change of base ◇ |
| `exp-modelling` | Exponential modelling | Y1 | `exponentials-logs`, `straight-lines` | Growth and decay; reduce y = axⁿ and y = kbˣ to straight lines using logs; interpret gradient and intercept; assumptions and limits |

### D. Differentiation

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `differentiation-basics` | Differentiation from first principles | Y1 | `graph-transformations`, `indices-surds` | Gradient of a curve as a limit; f′(x) and dy/dx; differentiating xⁿ, sums and constant multiples; the second derivative |
| `differentiation-applications` | Tangents, normals and stationary points | Y1 | `differentiation-basics`, `straight-lines` | Tangent and normal equations; increasing and decreasing; stationary points and their nature; optimisation and modelling; sketching |
| `differentiation-standard` | Differentiating standard functions | Y2 | `differentiation-basics`, `exponentials-logs`, `trig-compound`, `radians` | eᵏˣ, aᵏˣ, ln x, sin kx, cos kx (sin and cos from first principles) and tan kx; constants and sums |
| `differentiation-rules` | Chain, product and quotient rules | Y2 | `differentiation-standard` | The three rules and combinations; derivatives of sec, cosec, cot; connected rates of change |
| `differentiation-implicit-param` | Implicit and parametric differentiation | Y2 | `differentiation-rules`, `parametric` | dy/dx for implicit relations and parametric curves; tangents and normals; related rates |
| `curve-sketching` | Convexity and points of inflection | Y2 | `differentiation-rules` | f″(x) > 0 or < 0; points of inflection; sketching with all the tools |

### I. Integration

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `integration-basics` | Integration as reverse differentiation | Y1 | `differentiation-basics` | ∫xⁿ dx, constant of integration, sums; finding f(x) from f′(x) and a point |
| `definite-integrals` | Definite integrals and area | Y1 | `integration-basics` | The fundamental theorem of calculus; area under a curve and between curves; areas below the axis; integration as the limit of a sum |
| `integration-standard` | Integrating standard functions | Y2 | `integration-basics`, `differentiation-standard` | eᵏˣ, 1/x, sin kx, cos kx, sec²kx; ∫f′(x)/f(x) dx; reverse chain rule by inspection |
| `integration-substitution` | Integration by substitution | Y2 | `integration-standard`, `differentiation-rules` | Substitutions given and chosen; changing limits |
| `integration-parts` | Integration by parts | Y2 | `integration-standard`, `differentiation-rules` | ∫u dv/dx dx; repeated parts; ln x and the "cycle" cases |
| `integration-fractions` | Integrating with partial fractions | Y2 | `integration-standard`, `algebraic-fractions` | Rational functions by partial fractions then integration |
| `differential-equations` | First-order differential equations | Y2 | `integration-substitution`, `exp-modelling` | Separable variables; general and particular solutions; setting up from a context (growth, decay, rates); interpreting the model |

### N. Numerical methods

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `roots-change-of-sign` | Locating roots | Y2 | `functions` | Sign change and continuity; when it fails (discontinuities, repeated roots) |
| `iteration` | Iterative methods and Newton–Raphson | Y2 | `roots-change-of-sign`, `differentiation-standard`, `sequences` | xₙ₊₁ = g(xₙ); cobweb and staircase diagrams; convergence; Newton–Raphson and its failure |
| `trapezium-rule` | The trapezium rule | Y2 | `definite-integrals` | Approximating definite integrals; over- and under-estimates by shape; comparing with the exact value |

### V. Vectors

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `vectors-2d` | Vectors in two dimensions | Y1 | GCSE | Column and i, j notation; magnitude and direction; addition, scalar multiples; position vectors; geometric proof (collinear, parallel, ratio) |
| `vectors-3d` | Vectors in three dimensions | Y2 | `vectors-2d` | i, j, k; magnitude; position vectors and distance; geometric problems and modelling (not scalar/dot products, which are Further Maths) |

**Count:** 46 topics (21 Y1, 25 Y2) in 10 areas. For scale, the GCSE book plan is about 70 topics, so this is about two thirds of it; A-level topics are denser, so expect larger pages.

## 5. Where the boards differ (to verify)

The pure content statements are the same. The differences worth recording are:

| Area | Difference | How the book handles it |
|---|---|---|
| Paper structure | **Edexcel** Papers 1 and 2 are pure only; Paper 3 is statistics and mechanics. **AQA** mixes pure with applied in Papers 1 and 2. **OCR A** has Paper 1 pure, with pure in Papers 2 and 3 alongside statistics and mechanics. **MEI** mixes pure with mechanics or statistics and adds a **Comprehension** paper on unseen material. **Eduqas** has two pure components and one applied. | A "Where it appears" strip per topic naming which boards test it, and a short note on exam style. Not different content. |
| Formulae provided | Boards differ in what they give in the exam (for instance, binomial, integration, and trigonometric identities). | A **formula page per topic** marked "learn" or "given by most boards"; the safe default is learn. Verify per board (section 7). |
| Notation | sin⁻¹ and arcsin; `f′(x)` and `dy/dx`; `\|x\|`; `cosec` and `csc`; the factorial and binomial forms. | The book uses the ones DfE and the boards' notation lists share, with the alternatives named once in the glossary. |
| Technology | **MEI** expects regular graphing software and spreadsheets (and the "Comprehension" paper tests reading mathematics). | "Try it" boxes and an interactive grapher in the book; no extra content. |
| Edge detail ◇ | Partial fractions (repeated factors, improper fractions), change of base for logs, how many "from first principles" derivations, parametric integration, how far implicit differentiation is expected. | Cover the **union**; mark each extra bit with a board tag. |

## 6. Proposed order of working

1. Agree the structure (section 2) and the topic list (section 4) with Greg: open questions below.
2. Load the topic graph into a new `src/book/alevel-topics.mjs`, following the GCSE one (single source, derived layers, build fails on a cycle or an unknown prerequisite). The existing graph builder can be reused once it takes the book name as a parameter.
3. Pilot with the three-topic Y1 spine that exercises everything: `quadratics` → `differentiation-basics` → `integration-basics`.
4. Maths-accuracy gate as for GCSE: no topic released until someone other than its author has checked every answer, hint and solution.

## 7. Verification still to do

For each board, check the current specification and its formulae and notation lists against sections 4 and 5, and note anything extra or missing:
- AQA 7357, Pearson Edexcel 9MA0, OCR A H240, OCR MEI H640, WJEC Eduqas A540QS.
- Every ◇ item in section 4.
- The "given in the formulae booklet" lists.

Specifications are copyrighted: record **what** is in scope in our own words and cite the specification code and section, do not paste its wording.

## 8. Questions for Greg

1. **Title and naming.** What is the book called? (Public naming is yours; the GCSE one is also untitled.)
2. **Pure only for now?** The plan leaves mechanics and statistics for a later branch. Is that the intent, or should the book add them before launch?
3. **Part split.** Is two parts (AS/Y1, then Y2) the right shape, or should it be one sequence?
4. **Own location.** `/books/alevel/` hidden, like the GCSE pilot, on the same rules (noindex, no links, no third-party requests, local progress only)?
5. **Pilot topics.** Is `quadratics` → `differentiation-basics` → `integration-basics` the right first three, or would you pick differently?
