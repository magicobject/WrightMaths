// A-level glossary: algebra. Entry format: see the header of ../glossary.mjs.
// Every term in this file has strand 'al-algebra'.
export const TERMS = [
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
];
