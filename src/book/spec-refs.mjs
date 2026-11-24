// Which national-curriculum content statements each topic covers, by topic id.
// Source: the DfE "GCSE mathematics: subject content and assessment objectives" (1 November 2013, ref DFE-00233-2013),
// statements numbered by strand: N1-16 Number, A1-25 Algebra, R1-16 Ratio, G1-25 Geometry, P1-9 Probability, S1-6 Statistics.
// The statement wording below is a short paraphrase; the mapping is the author's judgement and should be reviewed.
export const SPEC_REFS = {
  "place-value": [
    "N1",
    "N2",
    "N15"
  ],
  "four-operations": [
    "N2",
    "N14"
  ],
  "negative-numbers": [
    "N1",
    "N2"
  ],
  "order-of-operations": [
    "N3"
  ],
  "factors-multiples": [
    "N4"
  ],
  "squares-roots": [
    "N6",
    "N7"
  ],
  "shapes-angles": [
    "G1",
    "G3",
    "G4"
  ],
  "algebra-basics": [
    "A1",
    "A2",
    "A3",
    "A4"
  ],
  "fractions": [
    "N2",
    "N10",
    "N12",
    "R3"
  ],
  "solving-equations": [
    "A17",
    "A21"
  ],
  "pythagoras": [
    "G20"
  ],
  "percentages": [
    "R9",
    "N12"
  ],
  "ratio": [
    "R3",
    "R4",
    "R5",
    "R6",
    "R7",
    "N11"
  ],
  "rearranging-formulae": [
    "A5"
  ],
  "simultaneous-equations": [
    "A19",
    "A21"
  ],
  "quadratic-equations": [
    "A18",
    "A4"
  ],
  "trigonometry": [
    "G20",
    "G21"
  ],
  "percentage-change": [
    "R9",
    "R16"
  ],
  "indices": [
    "N6",
    "N7",
    "N9"
  ],
  "area-perimeter": [
    "G16",
    "G17"
  ],
  "circles": [
    "G9",
    "G17",
    "G18"
  ],
  "probability-basics": [
    "P6",
    "P7",
    "P8",
    "P9"
  ],
  "averages": [
    "S2",
    "S4",
    "S6"
  ],
  "sequences": [
    "A23",
    "A24",
    "A25"
  ],
  "coordinates-graphs": [
    "A8",
    "A9",
    "A10"
  ],
  "inequalities": [
    "A22"
  ],
  "direct-inverse-proportion": [
    "R10",
    "R13",
    "R14"
  ],
  "compound-measures": [
    "R1",
    "R11"
  ],
  "similarity": [
    "G5",
    "G7",
    "G19",
    "R12"
  ],
  "bearings": [
    "G15"
  ],
  "transformations": [
    "G7",
    "G8"
  ],
  "vectors": [
    "G24",
    "G25"
  ],
  "constructions-loci": [
    "G2"
  ],
  "circle-theorems": [
    "G10"
  ],
  "surds": [
    "N8"
  ],
  "bounds": [
    "N15",
    "N16"
  ],
  "algebraic-fractions": [
    "A4"
  ],
  "iteration": [
    "A20",
    "R16"
  ],
  "functions-graphs": [
    "A11",
    "A12",
    "A13",
    "A14"
  ],
  "sine-cosine-rules": [
    "G22",
    "G23"
  ],
  "histograms-cumulative-frequency": [
    "S3",
    "S4"
  ],
  "conditional-probability": [
    "P9"
  ]
};

export const SPEC_STATEMENTS = {
  "A1": "Use and interpret algebraic notation",
  "A2": "Substitute numbers into formulae and expressions",
  "A3": "Vocabulary of expressions, equations, formulae, identities, terms",
  "A4": "Simplify, expand and factorise algebraic expressions",
  "A5": "Rearrange formulae to change the subject",
  "A8": "Work with coordinates in all four quadrants",
  "A9": "Plot straight-line graphs; y = mx + c; line equations",
  "A10": "Interpret gradients and intercepts of linear functions",
  "A11": "Roots, intercepts and turning points of quadratic graphs",
  "A12": "Recognise and sketch standard function graphs, including trigonometric",
  "A13": "Sketch translations and reflections of a function",
  "A14": "Plot and interpret real-context and reciprocal/exponential graphs",
  "A17": "Solve linear equations algebraically and graphically",
  "A18": "Solve quadratics by factorising, completing the square, formula",
  "A19": "Solve simultaneous equations algebraically and graphically",
  "A20": "Find approximate solutions numerically using iteration",
  "A21": "Form and solve equations from situations",
  "A22": "Solve linear and quadratic inequalities; represent solutions",
  "A23": "Generate sequence terms from term-to-term or position-to-term rules",
  "A24": "Recognise triangular, square, arithmetic, geometric, quadratic sequences",
  "A25": "Find nth term of linear and quadratic sequences",
  "G1": "Conventional terms, notation and labelling for shapes",
  "G2": "Ruler and compass constructions; loci",
  "G3": "Angle facts, parallel lines, angle sums",
  "G4": "Properties of quadrilaterals, triangles and plane figures",
  "G5": "Triangle congruence criteria",
  "G7": "Congruent and similar shapes, transformations, enlargement",
  "G8": "Combinations of rotations, reflections and translations",
  "G9": "Circle definitions and properties",
  "G10": "Apply and prove standard circle theorems",
  "G15": "Measure lines and angles; maps, scale drawings, bearings",
  "G16": "Area of triangles, parallelograms, trapezia; volume of prisms",
  "G17": "Circle formulae; composite shapes; spheres, pyramids, cones",
  "G18": "Arc lengths and sector areas",
  "G19": "Congruence, similarity, length-area-volume relationships",
  "G20": "Pythagoras and trigonometric ratios in right-angled triangles",
  "G21": "Exact trigonometric values for special angles",
  "G22": "Sine rule and cosine rule",
  "G23": "Area of triangle using half ab sin C",
  "G24": "Describe translations as 2D vectors",
  "G25": "Vector arithmetic, column form, geometric proofs",
  "N1": "Order positive and negative numbers; use comparison symbols",
  "N2": "Four operations on integers, decimals, fractions; place value",
  "N3": "Inverse operations and priority of operations",
  "N4": "Primes, factors, multiples, HCF, LCM, prime factorisation",
  "N6": "Positive integer powers and roots; estimate powers and roots",
  "N7": "Calculate with roots and integer and fractional indices",
  "N8": "Exact calculation with surds; simplify and rationalise denominators",
  "N9": "Calculate and interpret numbers in standard form",
  "N10": "Convert between fractions and decimals, including recurring",
  "N11": "Use fractions within ratio problems",
  "N12": "Interpret fractions and percentages as operators",
  "N14": "Estimate answers and check calculations by approximation",
  "N15": "Round to decimal places or significant figures; error intervals",
  "N16": "Limits of accuracy; upper and lower bounds",
  "P6": "Enumerate outcomes with tables, grids, Venn and tree diagrams",
  "P7": "Possibility spaces and theoretical probability",
  "P8": "Probability of independent and dependent combined events",
  "P9": "Conditional probability using two-way tables, trees, Venn diagrams",
  "R1": "Convert between standard and compound units",
  "R3": "Express one quantity as a fraction of another",
  "R4": "Use ratio notation and simplify ratios",
  "R5": "Divide quantities in a ratio; ratio in context",
  "R6": "Express multiplicative relationships as ratios or fractions",
  "R7": "Use proportion as equality of ratios",
  "R9": "Percentages and percentage change, including reverse and simple interest",
  "R10": "Solve direct and inverse proportion problems",
  "R11": "Use compound units: speed, pay, unit price, density",
  "R12": "Compare lengths, areas, volumes; links to similarity",
  "R13": "Equations describing direct and inverse proportion",
  "R14": "Gradient as rate of change; proportion graphs",
  "R16": "Growth and decay, compound interest, iterative processes",
  "S2": "Construct and interpret charts and diagrams for categorical data",
  "S3": "Histograms and cumulative frequency graphs",
  "S4": "Compare distributions using averages, spread, box plots",
  "S6": "Scatter graphs, correlation, lines of best fit"
};
