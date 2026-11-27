# A-level Pure Mathematics: common syllabus (draft 2, verified 25 Nov 2026)

The content base for the A-level book. One book, all English boards.

**Status.** Draft 1 was written from memory. Draft 2 has been checked against the specifications themselves (section 7 says exactly what was and was not read). Corrections from that check are folded in below. Nothing here is copied from a specification or a textbook: topic names and groupings are ours, and the specifications are cited by code and section only.

## 1. Why one syllabus works

All English A-level Mathematics specifications teach the same DfE subject content (first teaching 2017). The pure content is therefore about 95% identical across the four English boards:

| Board | Specification | Version read |
|---|---|---|
| AQA | A-level Mathematics 7357 | v1.3, Jan 2018 (still the version AQA links) |
| Pearson Edexcel | A-level Mathematics 9MA0 | Issue 4, Feb 2020 |
| OCR | Mathematics A, H240 | v3.1, Aug 2026 |
| OCR (MEI) | Mathematics B (MEI), H640 | v3.1, Aug 2026 |
| DfE | "Mathematics AS and A level content" | Dec 2014 |

**Correction to draft 1.** There is no WJEC Eduqas A-level Mathematics: the draft's "Eduqas A540QS" was wrong. WJEC's own A-level (a Wales-only, unitised qualification, "not available to centres in England") was read and recorded as a cross-check, but it is not a target board for this book.

The differences between boards are in how and where content is examined (paper structure), which formulae are given, notation habits, and emphasis (MEI's technology and Comprehension paper). The book covers the **union** of the English boards' pure content, with a small number of board tags (section 5).

Not covered by this syllabus:
- Mechanics and Statistics (the applied strands). Pure only.
- Further Maths content (complex numbers, matrices, hyperbolics, volumes of revolution, polar coordinates, second-order differential equations and so on). A separate "Further Pure" book is planned; it has no syllabus yet.
- CCEA (Northern Ireland): not read. Compare it separately before claiming coverage.

## 2. Structure

Ten content areas, as the DfE sets them, plus three overarching themes that run through everything. (AQA, Edexcel and OCR A all use the same ten areas; their letter codes differ from ours, so cite by area name.)

| Code | Area |
|---|---|
| P | Proof |
| A | Algebra and functions |
| C | Coordinate geometry |
| S | Sequences and series |
| T | Trigonometry |
| E | Exponentials and logarithms |
| D | Differentiation |
| I | Integration |
| N | Numerical methods |
| V | Vectors |

Overarching themes (taught inside topics, tagged on questions):
- **OT1 Mathematical argument, language and proof**, including set language and notation (∈, ∪, ∩, intervals) and the definition of a function.
- **OT2 Mathematical problem solving.**
- **OT3 Mathematical modelling**, including assumptions, refining a model and its limits.

**Two parts.** Each topic is **Y1** (the AS content, also the first year of A-level) or **Y2** (A-level only). The split follows the DfE content, where AS items are marked and everything else is A-level only. The book is Part 1 (Y1) and Part 2 (Y2); a student sitting AS needs Part 1 alone.

## 3. Assumed knowledge

Everything in Higher GCSE: linear and quadratic equations, simultaneous equations (linear and linear/quadratic), indices and surds, straight-line graphs, Pythagoras, right-angled trigonometry, sine and cosine rules, circle theorems, 2D vectors, basic sequences, graphs of quadratic, cubic and reciprocal functions. The first chapter of Part 1 is a short bridge with a retrieval check on exactly these. Where a GCSE book page exists it is linked; where not, it is listed as a gap.

## 4. The common syllabus

IDs follow `src/book/topics.mjs`. `Needs` is the prerequisite graph; layers and "unlocks" are derived in the build, never written by hand. Board tags: **[AQA] [Edx] [OCR] [MEI]** mean "only this board's text asks for it"; **[all]** means every English board. **[beyond]** means no board's text requires it: optional enrichment, never needed for an exam.

### P. Proof

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `proof-methods` | Proof: direct, exhaustion, counterexample | Y1 | GCSE algebra | Language of proof; deduction with algebra; exhaustion; counterexample; ⇒ ⇔ ∴; set language (OT1.4) |
| `proof-contradiction` | Proof by contradiction | Y2 | `proof-methods` | √2 irrational; infinitely many primes; applying the method to unfamiliar proofs |

### A. Algebra and functions

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `indices-surds` | Indices and surds | Y1 | GCSE | Rational exponents; surd arithmetic including algebraic surds; rationalising denominators; equations with fractional indices that become quadratics [OCR] |
| `quadratics` | Quadratics | Y1 | `indices-surds` | Factorising, formula, completing the square; discriminant; sketching; quadratics in a function of x (including trig, exponential, log forms) |
| `simultaneous` | Simultaneous equations | Y1 | `quadratics` | Linear/linear and linear/quadratic, by substitution and elimination; interpretation as intersections |
| `inequalities` | Inequalities | Y1 | `quadratics`, `straight-lines` | Linear and quadratic, including with brackets and fractions that reduce to these; set and interval notation, "and"/"or"; regions on a graph |
| `polynomials` | Polynomials and the factor theorem | Y1 | `quadratics` | Division by linear factors only; factor theorem; factorising and solving cubics and quartics. The remainder theorem is not named by AQA: include as a short, tagged extra |
| `graphs-polynomials` | Graphs of polynomials and reciprocals | Y1 | `polynomials` | Cubic, quartic, a/x, a/x², asymptotes of the form y = a/(x + b) + c; roots, repeated roots, stationary-point features; intersections solve equations; proportionality (y ∝ powers and roots of x) and its graphs |
| `graph-transformations` | Transformations of graphs | Y1 | `graphs-polynomials` | f(x) + a, f(x + a), af(x), f(ax), −f(x), f(−x); combinations; applied to polynomials, reciprocals, trig, exponential |
| `functions` | Functions | Y2 | `graph-transformations` | Mapping vs function; domain and range (the largest domain a formula allows); composite fg (do g first); inverse, reflection in y = x; functions in modelling, limits and refinements |
| `modulus` | The modulus function | Y2 | `functions`, `inequalities` | **Core:** y = \|ax + b\|; equations and inequalities with one modulus sign; \|x − a\| < b as a bound. **[beyond]:** \|f(x)\| and f(\|x\|) for non-linear f, several modulus signs (no English board's text asks for these) |
| `algebraic-fractions` | Algebraic fractions and partial fractions | Y2 | `polynomials` | Simplify, add, multiply, divide; partial fractions with linear factors including a repeated factor, numerators constant or linear, at most three terms. Improper fractions (numerator degree ≥ denominator) are not stated by any board: **[beyond]** |

### C. Coordinate geometry in the (x, y) plane

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `straight-lines` | Straight lines | Y1 | GCSE | y = mx + c, y − y₁ = m(x − x₁), ax + by + c = 0; parallel and perpendicular; distance, midpoint; modelling |
| `circles` | Circles | Y1 | `straight-lines`, `quadratics` | (x − a)² + (y − b)² = r² and x² + y² + 2gx + 2fy + c = 0; the three circle properties (angle in a semicircle, perpendicular from the centre bisects a chord, radius perpendicular to tangent); tangent and normal; line and circle intersection; circumcircle of a triangle [Edx]; do two circles meet [OCR] |
| `parametric` | Parametric equations | Y2 | `functions`, `trig-identities` | Parameter to Cartesian; domain of the parameter; the circle in parametric form; using parametric equations in modelling. Other named curves are not required [beyond] |

### S. Sequences and series

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `binomial-positive` | Binomial expansion (positive integer n) | Y1 | `indices-surds` | Pascal's triangle, ⁿCᵣ and factorials, (a + bx)ⁿ, a given term, approximations; link to binomial probability |
| `sequences` | Sequences and recurrence relations | Y2 | `functions` | Term-to-term and position-to-term; increasing, decreasing, periodic; convergent vs divergent (informal) |
| `series-arithmetic` | Arithmetic sequences and series | Y2 | `sequences` | nth term, sum; **the proof of the sum formula**; sum of the first n natural numbers; Σ notation; modelling |
| `series-geometric` | Geometric sequences and series | Y2 | `sequences`, `indices-surds` | nth term, sum to n (with its proof), sum to infinity with \|r\| < 1; using logs and inequalities with exponentials to find n; modelling |
| `binomial-general` | Binomial expansion (rational n) | Y2 | `binomial-positive`, `algebraic-fractions` | (1 + x)ⁿ and (a + bx)ⁿ, validity \|bx/a\| < 1; finding a particular term; combined with partial fractions |

### T. Trigonometry

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `trig-triangles` | Trigonometry in triangles | Y1 | GCSE | Sine and cosine rules, area ½ab sin C, bearings; the ambiguous case [OCR]; problems in 2D (3D as extension) |
| `trig-graphs` | Trigonometric graphs and exact values | Y1 | `trig-triangles` | Unit-circle definitions for any angle; graphs of sin, cos, tan with amplitude and period of a sin x, sin bx, tan bx (full transformations in `graph-transformations`); exact values in degrees; periodicity and symmetry |
| `trig-identities` | Trigonometric identities and equations | Y1 | `trig-graphs`, `quadratics` | tan θ = sin θ / cos θ; sin²θ + cos²θ = 1; solving equations in an interval, including multiples or shifts of the angle and quadratics in sin, cos, tan. (Formal identity proofs are DfE A-level only: they live in `trig-compound`.) |
| `radians` | Radians, arcs and sectors | Y2 | `trig-graphs` | Radian measure; exact values and trig graphs in radians; s = rθ; A = ½r²θ; segment area; small-angle approximations. **Open check:** OCR H240's table layout could not be read reliably for this item; the DfE places radians at A-level only, which this book follows |
| `trig-reciprocal-inverse` | Reciprocal and inverse trigonometric functions | Y2 | `functions`, `trig-identities` | sec, cosec, cot and graphs; arcsin, arccos, arctan with domains and ranges; 1 + tan²θ = sec²θ, 1 + cot²θ = cosec²θ |
| `trig-compound` | Addition formulae, double angle, R-form and proof | Y2 | `trig-reciprocal-inverse` | sin(A ± B), cos(A ± B), tan(A ± B) with their geometric proofs [AQA, Edx, OCR: "understand"; MEI gives the starting point]; double angle; r cos(θ ± α) and r sin(θ ± α) forms; equations with a cos θ + b sin θ = c; proving identities; trig in context |

### E. Exponentials and logarithms

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `exponentials-logs` | Exponentials and logarithms | Y1 | `indices-surds` | y = aˣ, eˣ and y = e^(ax+b) + c; logs as inverses; the three laws; solving aˣ = b by taking logs of both sides; e^(ax+b) = p and ln(ax + b) = q; inequalities with exponentials. **Change of base is excluded by OCR A, MEI and WJEC and not in AQA's text; Edexcel says students "may use" it: [beyond]** |
| `exp-modelling` | Exponential modelling | Y1 | `exponentials-logs`, `straight-lines` | Growth and decay, meaning of the constants, behaviour for large t; reducing y = axⁿ and y = kbˣ to a straight line using logs and reading n, log a, log b, log k from gradient and intercept; the gradient of eᵏˣ; assumptions and refinement |

### D. Differentiation

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `differentiation-basics` | Differentiation from first principles | Y1 | `graph-transformations`, `indices-surds` | Gradient as a limit; f′(x), dy/dx; xⁿ for any rational n; sums and multiples; second derivative; **first principles for small positive integer powers of x**; sketching the gradient function from a graph; the derivative as a rate of change |
| `differentiation-applications` | Tangents, normals and stationary points | Y1 | `differentiation-basics`, `straight-lines` | Tangents and normals; increasing and decreasing; stationary points and their nature; optimisation in context |
| `differentiation-standard` | Differentiating standard functions | Y2 | `differentiation-basics`, `exponentials-logs`, `trig-compound`, `radians` | eᵏˣ, aᵏˣ, ln x, sin kx, cos kx, tan kx; **first principles for sin x and cos x** |
| `differentiation-rules` | Chain, product, quotient and inverse | Y2 | `differentiation-standard` | The three rules and combinations; dy/dx = 1/(dx/dy) (differentiating via inverse functions); connected rates of change. The derivatives of sec, cosec and cot and the quotient rule are given in every board's formula sheet: students use them, they do not memorise them |
| `differentiation-implicit-param` | Implicit and parametric differentiation | Y2 | `differentiation-rules`, `parametric` | First derivative only; tangents and normals; constructing a differential equation from a rate-of-change statement starts here |
| `curve-sketching` | Convexity and points of inflection | Y2 | `differentiation-rules` | f″ > 0 or < 0 (concave up / down); points of inflection, stationary and not; when f′ = f″ = 0 the point may be a max, min or inflection; sketching with every tool |

### I. Integration

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `integration-basics` | Integration as reverse differentiation | Y1 | `differentiation-basics` | ∫xⁿ dx, +c, sums; integrating after expanding; finding f(x) from f′(x) and a point; ∫f(ax + b) dx |
| `definite-integrals` | Definite integrals and area | Y1 | `integration-basics` | Fundamental theorem of calculus; area under a curve, and between a line and a curve; areas below the axis |
| `area-between-curves` | Area between curves and integration as a limit | Y2 | `definite-integrals` | **Y2 per the DfE:** area between two curves; integration as the limit of a sum. Extra: integrating with respect to y [MEI]; area under a parametric curve [Edx, OCR A; not AQA, MEI] |
| `integration-standard` | Integrating standard functions | Y2 | `integration-basics`, `differentiation-standard` | eᵏˣ, 1/x, sin kx, cos kx; sec²kx as the reverse of tan kx; ∫f′/f dx and the reverse chain rule by inspection; squares of trig functions via double-angle identities [Edx, OCR] |
| `integration-substitution` | Integration by substitution | Y2 | `integration-standard`, `differentiation-rules` | One substitution, given or chosen; changing limits |
| `integration-parts` | Integration by parts | Y2 | `integration-standard`, `differentiation-rules` | ∫u dv/dx dx; repeated application; ∫ln x dx. Reduction formulae are excluded by every board; the "cycle" (e^x sin x) cases are not stated by any board: **[beyond]** |
| `integration-fractions` | Integrating with partial fractions | Y2 | `integration-standard`, `algebraic-fractions` | Linear denominators including a repeated factor; other simple rational forms |
| `differential-equations` | First-order differential equations | Y2 | `integration-substitution`, `exp-modelling` | Constructing from information (kinematics, population, price and demand); separable variables; general and particular solutions; sketching solution families; interpreting the model |

### N. Numerical methods

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `roots-change-of-sign` | Locating roots | Y2 | `functions` | Sign change and continuity; failures (discontinuities, repeated roots) |
| `iteration` | Iterative methods and Newton–Raphson | Y2 | `roots-change-of-sign`, `differentiation-standard`, `sequences` | xₙ₊₁ = g(xₙ); cobweb and staircase diagrams; convergence; Newton–Raphson and when it fails (near a stationary point). The condition \|g′(a)\| < 1 is stated by OCR A only; WJEC says convergence conditions are not required: **[OCR]** |
| `trapezium-rule` | The trapezium rule | Y2 | `definite-integrals` | Approximating definite integrals; over- and under-estimates from the shape (concavity); stating limits between which an area lies [AQA, Edx]. Simpson's rule is excluded |

### V. Vectors

| ID | Topic | Y | Needs | Content |
|---|---|---|---|---|
| `vectors-2d` | Vectors in two dimensions | Y1 | GCSE | Column and **i**, **j** notation; magnitude and direction; unit vectors; position vectors; AB = **b** − **a**; the triangle and parallelogram laws; geometric proof (parallel, collinear, ratio) |
| `vectors-3d` | Vectors in three dimensions | Y2 | `vectors-2d` | **i**, **j**, **k**; magnitude; distance; geometric problems. No scalar product (Further Maths). OCR A excludes the direction of a 3D vector |

**Count:** 47 topics (21 Y1, 26 Y2) in 10 areas. Applied-flavoured items in the specifications (trig and vectors in forces and kinematics, numerical methods in context) are taught as short "in context" notes inside the topics, not as separate pure topics.

## 5. Where the boards differ

| Area | Difference | How the book handles it |
|---|---|---|
| Paper structure | **AQA:** Paper 1 pure only; Paper 2 pure + mechanics; Paper 3 pure + statistics. **Edexcel:** Papers 1 and 2 pure only; Paper 3 statistics and mechanics. **OCR A:** Paper 1 pure; Paper 2 pure + statistics; Paper 3 pure + mechanics. **OCR MEI:** Paper 1 pure + mechanics; Paper 2 pure + statistics; Paper 3 pure + a **Comprehension** section on an unseen passage of pure content. All three papers of every board are 2 hours except MEI Paper 3 (75 marks). | A short "how it is examined" note per board on the teachers page. No content difference. (Draft 1 had AQA's papers wrong.) |
| Formulae | See the next table. Every board gives the same core set. | A "learn" or "given" marker on every formula, using the lists below. |
| Notation | All boards list **both** sin⁻¹ and arcsin; **cosec**, not csc; f′(x) and dy/dx; \|a\|; gf(x); ⁿCᵣ and stacked (n over r); eˣ and exp x; ln x. | The book uses sin⁻¹ (it matches GCSE and calculators) and names arcsin once and in the glossary. Decision recorded for Greg. |
| Technology | MEI expects graphing software, spreadsheets and optionally CAS, and may show software printouts. | "Try it" prompts; no extra content. |
| Proofs to know | AP and GP sum proofs [AQA/Edx spec text; WJEC]; the geometric proof of addition formulae [Edx/OCR A]. | Included. |
| Exclusions common to all | Reduction formulae; Simpson's rule; complex roots; second derivatives of implicit/parametric curves; dot products. | Stated once on the contents page, so no student wonders. |

**Formulae.** Learn (every board, "without being provided"): the quadratic formula; laws of indices and logs; y − y₁ = m(x − x₁) and m₁m₂ = −1; nth terms of AP and GP; sine and cosine rules; ½ab sin C; sin²θ + cos²θ = 1, sec²θ = 1 + tan²θ, cosec²θ = 1 + cot²θ; sin 2A, cos 2A, tan 2A; arc length and sector area; derivatives of xⁿ, sin kx, cos kx, eᵏˣ, ln x; the product and chain rules; the matching integrals and ∫f′(g(x))g′(x) dx; area under a curve; the magnitude of a vector.

Given in the exam sheet (AQA and OCR confirmed; Edexcel's booklet itself was not opened, so its contents here are inferred and must be checked): binomial series (positive integer and rational n); AP and GP sums and the sum to infinity; small-angle approximations; sin/cos/tan (A ± B); the derivatives of tan, sec, cosec, cot; the quotient rule; differentiation from first principles; ∫f′/f dx; integration by parts; Newton–Raphson; the trapezium rule.

## 6. Proposed order of working

1. Agree the structure and topic list (section 4) with Greg.
2. Load the topic graph into `src/book/alevel/topics.mjs`, following the GCSE graph (single source, derived layers, build fails on a cycle or unknown prerequisite).
3. Pilot with the three Year 1 topics that exercise everything: `quadratics` → `differentiation-basics` → `integration-basics`.
4. Maths-accuracy gate as for GCSE: no topic released until someone other than its author has checked every answer, hint and solution.

## 7. What was and was not verified

**Read in full (25 Nov 2026):** AQA 7357 v1.3 (content, notation Appendix A, formulae Appendix B) and the AQA formulae booklet; Edexcel 9MA0 Issue 4 (pure content, Appendices 1 and 2); OCR H240 and H640 v3.1 (content, notation, formulae, assessment); the DfE content document (Dec 2014); WJEC Wales Version 2 (March 2019).

**Not read or not confirmed:**
- CCEA: nothing read.
- The Edexcel formulae booklet itself, and past or sample papers for every board. "Not required" in this document means "the specification text does not list it"; papers could still stretch beyond the text.
- Whether Edexcel Issue 4 is still the newest issue, and Pearson's clarification notices.
- OCR H240's Stage 1 / Stage 2 split for radians (the extracted table was unreadable). The DfE says A-level only, which this document follows; check the PDF before release.
- The WJEC Wales formulae booklet.

**All ◇ items from draft 1 are now resolved:**
1. **Change of base:** excluded or absent in every board except Edexcel's optional "may use". Beyond core.
2. **Partial fractions:** repeated linear factors required everywhere; improper fractions not stated by any board.
3. **Parametric integration:** required by Edexcel and OCR A; not AQA, not MEI, not the DfE.
4. **Implicit differentiation:** first derivative only, with tangents and normals.
5. **First principles:** small positive integer powers of x (all boards), plus sin x and cos x (A-level). Never e^x, ln x or tan x.

## 8. Questions for Greg

1. **Title and naming.** What is the book called? (Public naming is yours.)
2. **Beyond-spec items.** Is it right to include **[beyond]** items as clearly marked optional enrichment (for example general |f(x)|), or leave them out entirely so every page is exactly exam content?
3. **arcsin or sin⁻¹.** The book defaults to sin⁻¹ (matches GCSE). Say if you would rather lead with arcsin.
