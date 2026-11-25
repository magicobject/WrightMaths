// The A-level glossary: Year 1 and Year 2 together, one list.
//
// Entry format (same as the GCSE glossary, src/book/glossary.mjs):
//   id        lower-case, hyphenated, unique
//   term      the word as it is shown (HTML entities allowed)
//   strand    an id from STRANDS in topics.mjs ('al-algebra' ...)
//   level     'Y1' or 'Y2': the year the term is first needed
//   def       ONE plain-English definition. It is also the hover pop-up, so it is plain text: no {m:...} shorthand
//   example   a string, or an array of strings; {m:...} maths shorthand and {term:id} links are allowed
//   watch     (optional) the common slip
//   flip      (optional) the reverse side of the idea
//   see       (optional) ids of related terms
//   aka       (optional) an array of other names, each a short string (used by search)
//
// This is the starter set. The full glossary is added in its own change.

export const GLOSSARY = [
  {
    id: 'quadratic',
    term: 'quadratic',
    strand: 'al-algebra',
    level: 'Y1',
    def: 'An expression or equation where the highest power of the unknown is 2, such as x squared plus 5x plus 4.',
    example: ['{m:x^2+5x+4} is a quadratic expression.', '{m:x^2+5x+4=0} is a quadratic equation.'],
    watch: 'A quadratic must have an x squared term. {m:5x+4} is not a quadratic.',
    flip: 'Solving a quadratic gives its roots. Starting from the roots, you can build the quadratic.',
    see: ['discriminant'],
    aka: ['quadratic equation'],
  },
  {
    id: 'discriminant',
    term: 'discriminant',
    strand: 'al-algebra',
    level: 'Y1',
    def: 'For a quadratic with coefficients a, b and c, the number b squared minus 4ac. Its sign tells you how many real roots there are.',
    example: 'For {m:x^2+5x+4}, the discriminant is {m:5^2-4*1*4=9}. It is positive, so there are two different real roots.',
    watch: 'The discriminant is not the answer to the equation. It only tells you how many roots there are.',
    see: ['quadratic'],
  },
  {
    id: 'derivative',
    term: 'derivative',
    strand: 'al-differentiation',
    level: 'Y1',
    def: 'The gradient function of a curve: a formula that gives the gradient of the curve at any point.',
    example: 'If {m:y=x^2}, the derivative is {m:frac(dy, dx)=2x}. At {m:x=3} the gradient is 6.',
    watch: 'The derivative is a function, not a single number. A gradient at one point is a value of the derivative.',
    flip: 'Integration reverses differentiation.',
    see: ['integral'],
    aka: ['gradient function differentiate'],
  },
  {
    id: 'integral',
    term: 'integral',
    strand: 'al-integration',
    level: 'Y1',
    def: 'The result of reversing differentiation, or the area under a curve between two values of x.',
    example: 'The integral of {m:2x} with respect to x is {m:x^2+c}.',
    watch: 'Do not forget the constant of integration +c when there are no limits.',
    flip: 'Differentiation reverses integration.',
    see: ['derivative'],
    aka: ['integrate antiderivative'],
  },
];
