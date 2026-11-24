// Single source of truth for every mathematical term in the GCSE book.
// One definition per term: the book pages (via {term:id}), the glossary
// page and the print index are all generated from this file.
//
// Fields
//   id      lowercase-hyphenated, used in {term:id} and the glossary anchor
//   term    the word as printed
//   strand  n Number, a Algebra, r Ratio, g Geometry, p Probability, s Statistics
//   level   'F' (Foundation and Higher) or 'H' (Higher only)
//   def     plain-English definition. PLAIN TEXT (it is also shown in the pop-up)
//   example worked example; may use <sup>, {frac:3/4} and similar shorthand
//   watch   (optional) the usual trap or everyday-word clash
//   flip    (optional) the reverse side of this idea
//   see     (optional) ids of related terms

export const GLOSSARY = [
  // ---------- Number ----------
  {
    id: 'integer', term: 'Integer', strand: 'n', level: 'F',
    def: 'A whole number. It can be positive, negative or zero.',
    example: 'Integers: &hellip; &minus;2, &minus;1, 0, 1, 2 &hellip; Not integers: 2.5, {frac:1/2}, &minus;0.3.',
    watch: 'Zero is an integer. A fraction such as {frac:6/3} is an integer too, because it equals 2.',
    see: ['negative-number'],
  },
  {
    id: 'negative-number', term: 'Negative number', strand: 'n', level: 'F',
    def: 'A number below zero, written with a minus sign. On a number line it is to the left of zero.',
    example: 'Temperature drops from 3&deg;C to &minus;4&deg;C: a fall of 7 degrees. 3 &minus; 7 = &minus;4.',
    watch: 'Subtracting a negative adds: 5 &minus; (&minus;2) = 7.',
    see: ['integer'],
  },
  {
    id: 'factor', term: 'Factor', strand: 'n', level: 'F',
    def: 'A whole number that divides exactly into another number, with nothing left over.',
    example: 'The factors of 12 are 1, 2, 3, 4, 6 and 12, because 12 &divide; 4 = 3 exactly.',
    flip: 'Every factor has a partner: 3 &times; 4 = 12, so 3 and 4 are both factors of 12. A multiple is the same fact seen from the other side.',
    see: ['multiple', 'hcf', 'prime-number'],
  },
  {
    id: 'multiple', term: 'Multiple', strand: 'n', level: 'F',
    def: 'A number in the times table of another number: what you get by multiplying it by a whole number.',
    example: 'Multiples of 6: 6, 12, 18, 24, 30 &hellip;',
    flip: '18 is a multiple of 6 and 6 is a factor of 18: one fact, two views.',
    see: ['factor', 'lcm'],
  },
  {
    id: 'prime-number', term: 'Prime number', strand: 'n', level: 'F',
    def: 'A number with exactly two factors: 1 and itself.',
    example: 'Primes: 2, 3, 5, 7, 11, 13 &hellip; 9 is not prime because 3 &times; 3 = 9.',
    watch: '1 is not prime (it has only one factor). 2 is the only even prime.',
    see: ['factor'],
  },
  {
    id: 'hcf', term: 'Highest common factor (HCF)', strand: 'n', level: 'F',
    def: 'The biggest number that is a factor of two or more numbers.',
    example: 'Factors of 12: 1, 2, 3, 4, 6, 12. Factors of 18: 1, 2, 3, 6, 9, 18. The biggest in both lists is 6, so HCF(12, 18) = 6.',
    flip: 'The HCF is what you divide top and bottom by to simplify a fraction in one go: {frac:12/18} = {frac:2/3}.',
    see: ['factor', 'lcm', 'simplify-fraction'],
  },
  {
    id: 'lcm', term: 'Lowest common multiple (LCM)', strand: 'n', level: 'F',
    def: 'The smallest number that is a multiple of two or more numbers.',
    example: 'Multiples of 4: 4, 8, 12 &hellip; Multiples of 6: 6, 12 &hellip; The first in both is 12, so LCM(4, 6) = 12.',
    flip: 'The LCM of two denominators is the neatest common denominator for adding fractions.',
    see: ['multiple', 'hcf', 'common-denominator'],
  },
  {
    id: 'square-number', term: 'Square number', strand: 'n', level: 'F',
    def: 'The answer when a whole number is multiplied by itself.',
    example: '1, 4, 9, 16, 25, 36 &hellip; (1&sup2;, 2&sup2;, 3&sup2;, 4&sup2; &hellip;). 7&sup2; = 7 &times; 7 = 49.',
    flip: 'Squaring and square-rooting undo each other: 7&sup2; = 49 and &radic;49 = 7.',
    see: ['square-root', 'power'],
  },
  {
    id: 'square-root', term: 'Square root', strand: 'n', level: 'F',
    def: 'The positive number that, multiplied by itself, gives the number you started with. Written with the sign &radic;.',
    example: '&radic;81 = 9 because 9 &times; 9 = 81.',
    watch: 'Every positive number has two square roots (9 and &minus;9 both square to 81). The &radic; sign means the positive one; solving x&sup2; = 81 gives x = 9 or x = &minus;9.',
    flip: 'The inverse of squaring, for numbers 0 or more.',
    see: ['square-number', 'surd'],
  },
  {
    id: 'power', term: 'Power (index)', strand: 'n', level: 'F',
    def: 'A small raised number that says how many times to multiply a number by itself. The plural of index is indices.',
    example: '2<sup>5</sup> = 2 &times; 2 &times; 2 &times; 2 &times; 2 = 32. Here 2 is the base and 5 is the power.',
    watch: '2<sup>5</sup> is not 2 &times; 5.',
    flip: 'Roots undo powers.',
    see: ['indices-laws', 'square-number'],
  },
  {
    id: 'indices-laws', term: 'Laws of indices', strand: 'n', level: 'H',
    def: 'Rules for powers of the same base: add the powers when multiplying, subtract when dividing, multiply when raising a power to a power. A negative power means "one over"; a fractional power means a root.',
    example: 'a<sup>m</sup> &times; a<sup>n</sup> = a<sup>m+n</sup>; a<sup>&minus;n</sup> = {frac:1/a<sup>n</sup>}; 9<sup>1/2</sup> = &radic;9 = 3.',
    watch: 'The laws only work when the bases are the same.',
    see: ['power'],
  },
  {
    id: 'reciprocal', term: 'Reciprocal', strand: 'n', level: 'F',
    def: 'The number you multiply by to get 1. For a fraction, turn it upside down.',
    example: 'Reciprocal of {frac:3/4} is {frac:4/3}. Reciprocal of 5 is {frac:1/5}. {frac:3/4} &times; {frac:4/3} = 1.',
    watch: '0 has no reciprocal.',
    flip: 'Dividing by a number is the same as multiplying by its reciprocal.',
    see: ['fraction'],
  },
  {
    id: 'fraction', term: 'Fraction', strand: 'n', level: 'F',
    def: 'A number that describes equal parts of a whole. It is written with one number over another.',
    example: '{frac:3/8} means 3 of 8 equal parts. 3 pieces of a pizza cut into 8 equal slices.',
    watch: 'The parts must be equal. A shape cut into 3 unequal pieces does not show thirds.',
    see: ['numerator', 'denominator', 'equivalent-fractions'],
  },
  {
    id: 'numerator', term: 'Numerator', strand: 'n', level: 'F',
    def: 'The top number of a fraction. It counts how many parts you have.',
    example: 'In {frac:3/8} the numerator is 3: three parts.',
    watch: 'Memory hook: numerator = "number of parts" and it sits up top like a number on a roof.',
    see: ['denominator'],
  },
  {
    id: 'denominator', term: 'Denominator', strand: 'n', level: 'F',
    def: 'The bottom number of a fraction. It tells you how many equal parts the whole is cut into, and so how big each part is.',
    example: 'In {frac:3/8} the denominator is 8: the whole is cut into eighths.',
    watch: 'Bigger denominator, smaller parts: {frac:1/8} is smaller than {frac:1/4}. Denominators are never added when you add fractions.',
    see: ['numerator', 'common-denominator'],
  },
  {
    id: 'equivalent-fractions', term: 'Equivalent fractions', strand: 'n', level: 'F',
    def: 'Fractions that look different but have the same value. Multiply or divide top and bottom by the same number to make one.',
    example: '{frac:1/2} = {frac:2/4} = {frac:3/6} = {frac:50/100}.',
    watch: 'You must do the same thing to the top and the bottom. Adding the same number to both changes the value.',
    flip: 'Making a fraction bigger-looking (multiply top and bottom) and simplifying it (divide top and bottom).',
    see: ['simplify-fraction'],
  },
  {
    id: 'simplify-fraction', term: 'Simplify a fraction', strand: 'n', level: 'F',
    def: 'Write a fraction in its lowest terms: divide the top and bottom by the same number until nothing else divides both.',
    example: '{frac:12/18}: divide top and bottom by 6 to get {frac:2/3}. {frac:2/3} cannot be simplified further.',
    watch: 'Examiners expect the simplest form unless the question says otherwise. Divide by the HCF to finish in one step.',
    flip: 'Simplifying is the reverse of making an equivalent fraction.',
    see: ['equivalent-fractions', 'hcf'],
  },
  {
    id: 'improper-fraction', term: 'Improper fraction', strand: 'n', level: 'F',
    def: 'A fraction where the top is bigger than (or equal to) the bottom, so it is worth 1 or more. It is also called a top-heavy fraction.',
    example: '{frac:7/4} = 1 {frac:3/4}.',
    flip: 'Convert to a mixed number to see its size; convert from a mixed number before multiplying or dividing.',
    see: ['mixed-number'],
  },
  {
    id: 'mixed-number', term: 'Mixed number', strand: 'n', level: 'F',
    def: 'A whole number and a fraction written together.',
    example: '2 {frac:1/3} means 2 + {frac:1/3}. As an improper fraction: 2 {frac:1/3} = {frac:7/3}.',
    watch: 'To multiply or divide, convert to an improper fraction first: 2 {frac:1/3} &times; 3 = {frac:7/3} &times; 3 = 7. Do not treat the whole number and the fraction separately.',
    see: ['improper-fraction'],
  },
  {
    id: 'common-denominator', term: 'Common denominator', strand: 'n', level: 'F',
    def: 'A denominator that two or more fractions share. You need one before you can add or subtract fractions.',
    example: '{frac:1/3} + {frac:1/4}: use 12 as the common denominator. {frac:4/12} + {frac:3/12} = {frac:7/12}.',
    watch: 'You add the numerators only. {frac:1/3} + {frac:1/4} is not {frac:2/7}.',
    see: ['lcm', 'denominator'],
  },
  {
    id: 'percentage', term: 'Percentage', strand: 'n', level: 'F',
    def: 'A fraction out of 100. The symbol % means "per hundred".',
    example: '35% = {frac:35/100} = 0.35. 35% of 80 = 0.35 &times; 80 = 28.',
    flip: 'Writing a fraction as a percentage and a percentage as a fraction.',
    see: ['multiplier', 'fraction'],
  },
  {
    id: 'multiplier', term: 'Multiplier', strand: 'n', level: 'F',
    def: 'A single number you multiply by to make a percentage change in one step.',
    example: '15% decrease: multiplier 0.85. 7% increase: multiplier 1.07.',
    flip: 'To undo a percentage change, divide by the same multiplier.',
    see: ['reverse-percentage', 'depreciation'],
  },
  {
    id: 'reverse-percentage', term: 'Reverse percentage', strand: 'n', level: 'F',
    def: 'Working backwards from the value after a percentage change to find the original value.',
    example: 'After a 20% discount a coat costs &pound;48. Multiplier 0.8, so original = 48 &divide; 0.8 = &pound;60.',
    watch: 'Do not add 20% back onto &pound;48. The 20% was taken from the original, not from &pound;48.',
    see: ['multiplier'],
  },
  {
    id: 'depreciation', term: 'Depreciation', strand: 'n', level: 'H',
    def: 'When something loses value over time. If it loses the same percentage each year this is compound depreciation.',
    example: 'A car worth &pound;10 000 loses 15% a year. After 3 years: 10 000 &times; 0.85<sup>3</sup> = &pound;6141.25.',
    flip: 'Compound growth (such as interest) is the same idea with a multiplier bigger than 1.',
    see: ['multiplier'],
  },
  {
    id: 'surd', term: 'Surd', strand: 'n', level: 'H',
    def: 'A root that cannot be written as a whole number or a fraction. A surd is an exact answer, so keep it as a root.',
    example: '&radic;2 and 3&radic;5 are surds. &radic;16 is not (it is 4). &radic;18 = 3&radic;2.',
    watch: 'A calculator shows a rounded decimal. If a question says "exact", leave the surd in.',
    see: ['rationalising', 'square-root'],
  },
  {
    id: 'rationalising', term: 'Rationalising the denominator', strand: 'n', level: 'H',
    def: 'Rewriting a fraction so there is no surd on the bottom. Multiply top and bottom by a suitable surd.',
    example: '{frac:1/&radic;2} = {frac:&radic;2/2}. For 3 &minus; &radic;3 on the bottom, multiply by 3 + &radic;3: (3 &minus; &radic;3)(3 + &radic;3) = 9 &minus; 3 = 6.',
    see: ['surd'],
  },
  {
    id: 'estimate', term: 'Estimate', strand: 'n', level: 'F',
    def: 'A sensible approximate answer, found by rounding the numbers to easy ones first.',
    example: '48 &times; 21 &asymp; 50 &times; 20 = 1000. The exact answer is 1008.',
    flip: 'Estimating is how you check an answer is the right size.',
  },
  {
    id: 'decimal-place', term: 'Decimal place (d.p.)', strand: 'n', level: 'F',
    def: 'The position of a digit after the decimal point. "To 1 d.p." means one digit after the point.',
    example: '8.602 to 1 d.p. is 8.6. 7.2111 to 1 d.p. is 7.2. 3.95 to 1 d.p. is 4.0.',
    watch: 'Look at the next digit only: 5 or more rounds up. Keep the trailing zero (4.0) when asked for 1 d.p.',
    see: ['significant-figure'],
  },
  {
    id: 'significant-figure', term: 'Significant figure (s.f.)', strand: 'n', level: 'F',
    def: 'The digits of a number that matter, counting from the first digit that is not zero. "To 2 s.f." keeps the first two of them.',
    example: '4 372 to 2 s.f. is 4 400. 0.003 862 to 2 s.f. is 0.0039.',
    watch: 'Zeros at the start do not count. Zeros that hold the place value at the end are still needed (4 400, not 44).',
    see: ['decimal-place'],
  },

  {
    id: 'digit', term: 'Digit', strand: 'n', level: 'F',
    def: 'One of the ten symbols 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 used to write numbers.',
    example: '4,082 has four digits: 4, 0, 8 and 2. The number 52 is made of the digits 5 and 2.',
    watch: 'A digit is a symbol; its <i>value</i> depends on where it sits (see place value).',
    see: ['place-value'],
  },
  {
    id: 'place-value', term: 'Place value', strand: 'n', level: 'F',
    def: 'The idea that what a digit is worth depends on its position (its column) in the number.',
    example: 'In 4,082 the 8 is in the tens column, so it is worth 80, and the 4 is in the thousands column, so it is worth 4,000.',
    watch: 'A zero holds a column open: 4,082 is not 482. Columns to the right of the decimal point get ten times smaller each step: tenths, hundredths, thousandths.',
    flip: 'Reading a number (digits to values) and writing one from words (values to digits).',
    see: ['digit', 'decimal'],
  },
  {
    id: 'decimal', term: 'Decimal', strand: 'n', level: 'F',
    def: 'A number written with a decimal point. The digits after the point are parts of one: tenths, then hundredths, then thousandths.',
    example: '3.25 = 3 + 2 tenths + 5 hundredths. 0.7 means 7 tenths, which is {frac:7/10}.',
    watch: 'Compare decimals column by column from the left, not by length: 0.4 is bigger than 0.35.',
    see: ['place-value', 'decimal-place', 'fraction'],
  },
  {
    id: 'round', term: 'Round (rounding)', strand: 'n', level: 'F',
    def: 'Replace a number with a nearby simpler one to a stated accuracy, such as the nearest 10, a number of decimal places or a number of significant figures.',
    example: '3,468 to the nearest 100 is 3,500. 6.749 to 1 decimal place is 6.7.',
    watch: 'Look only at the digit just after the place you are rounding to: 5 or more rounds up, 4 or less rounds down.',
    flip: 'Rounding finds the nearest simple number; going backwards asks which numbers round to a given one (the whole numbers 35 to 44 all round to 40 to the nearest 10).',
    see: ['decimal-place', 'significant-figure', 'estimate'],
  },
  {
    id: 'sum', term: 'Sum', strand: 'n', level: 'F',
    def: 'The result of adding numbers together.',
    example: 'The sum of 7 and 5 is 12.',
    watch: 'In everyday English "a sum" can mean any calculation. In maths it is specifically the answer to an addition.',
    flip: 'The difference undoes the sum: if the sum of 7 and 5 is 12, the difference 12 &minus; 5 is 7.',
    see: ['difference', 'product'],
  },
  {
    id: 'difference', term: 'Difference', strand: 'n', level: 'F',
    def: 'The result of subtracting the smaller number from the larger: how far apart two numbers are.',
    example: 'The difference between 83 and 127 is 127 &minus; 83 = 44.',
    watch: 'On a number line the difference is always "higher minus lower", so it is never negative. From &minus;3 to 4 the difference is 4 &minus; (&minus;3) = 7.',
    see: ['sum', 'negative-number'],
  },
  {
    id: 'product', term: 'Product', strand: 'n', level: 'F',
    def: 'The result of multiplying numbers together.',
    example: 'The product of 6 and 4 is 24.',
    watch: 'In a shop a product is something you buy. In maths it is the answer to a multiplication.',
    flip: 'Dividing the product by one of the numbers gives back the other: 24 &divide; 6 = 4.',
    see: ['quotient', 'factor'],
  },
  {
    id: 'quotient', term: 'Quotient', strand: 'n', level: 'F',
    def: 'The result of dividing one number by another.',
    example: 'The quotient of 24 and 6 is 4. When 95 is divided by 4 the quotient is 23 (with remainder 3).',
    flip: 'Multiplying the quotient by the divisor (and adding the remainder) gives back the number you started with.',
    see: ['remainder', 'product'],
  },
  {
    id: 'remainder', term: 'Remainder', strand: 'n', level: 'F',
    def: 'What is left over when one whole number does not divide exactly into another.',
    example: '95 &divide; 4 = 23 remainder 3, because 4 &times; 23 = 92 and 95 &minus; 92 = 3.',
    watch: 'In a real problem a remainder usually means you need one more: 70 students in 16-seat minibuses need 5 minibuses, not 4.',
    flip: 'number = divisor &times; quotient + remainder.',
    see: ['quotient', 'factor'],
  },
  {
    id: 'number-line', term: 'Number line', strand: 'n', level: 'F',
    def: 'A straight line with numbers marked at equal spacing, increasing from left to right. It continues on the left of zero for negative numbers.',
    example: 'On a number line &minus;2 is to the right of &minus;10, so &minus;2 is the bigger number.',
    see: ['negative-number', 'integer'],
  },

  {
    id: 'bidmas', term: 'BIDMAS', strand: 'n', level: 'F',
    def: 'The agreed order for working out a calculation: Brackets, Indices (powers), Division and Multiplication together, then Addition and Subtraction together. Some people call it BODMAS or PEMDAS.',
    example: '3 + 4 &times; 2 = 3 + 8 = 11 (multiply before adding). (3 + 4) &times; 2 = 14 (brackets first).',
    watch: 'D and M have the same priority, and so do A and S: work left to right. 8 &divide; 2 &times; 4 = 16, not 1. A fraction bar and a root sign act like brackets.',
    flip: 'Building a calculation with brackets to hit a target, and unpicking it step by step.',
    see: ['operation', 'power'],
  },
  {
    id: 'operation', term: 'Operation', strand: 'n', level: 'F',
    def: 'A mathematical process such as add, subtract, multiply or divide. Squaring and square-rooting are operations too.',
    example: 'The four operations: +, &minus;, &times;, &divide;.',
    flip: 'Every operation has an inverse that undoes it.',
    see: ['inverse-operation', 'bidmas'],
  },
  {
    id: 'divisible', term: 'Divisible', strand: 'n', level: 'F',
    def: 'A number is divisible by another if it divides into it exactly, with no remainder.',
    example: '78 is divisible by 6 because 78 &divide; 6 = 13. 4,563 is divisible by 3 because its digits add up to 18, which is a multiple of 3.',
    watch: 'Quick tests: by 2 if it ends in an even digit; by 3 if the digit sum divides by 3, and by 9 if it divides by 9; by 5 if it ends in 0 or 5; by 10 if it ends in 0.',
    flip: 'If A is divisible by B, then B is a factor of A and A is a multiple of B.',
    see: ['factor', 'multiple'],
  },
  {
    id: 'prime-factorisation', term: 'Prime factorisation', strand: 'n', level: 'F',
    def: 'Writing a number as a product of prime numbers. Every whole number bigger than 1 has exactly one prime factorisation (ignoring order).',
    example: '84 = 2 &times; 2 &times; 3 &times; 7 = 2&sup2; &times; 3 &times; 7. A factor tree breaks a number into primes step by step.',
    watch: 'Keep splitting until every branch ends in a prime. 1 is not prime, so a branch never ends in 1.',
    flip: 'Break a number into primes, or multiply the primes together to rebuild it.',
    see: ['prime-number', 'factor', 'hcf'],
  },
  {
    id: 'cube-number', term: 'Cube number', strand: 'n', level: 'F',
    def: 'The answer when a whole number is multiplied by itself twice (three of the number multiplied together). It is the volume of a cube with that side length.',
    example: '1, 8, 27, 64, 125 &hellip; 4<sup>3</sup> = 4 &times; 4 &times; 4 = 64.',
    watch: 'A negative number cubed stays negative: (&minus;2)<sup>3</sup> = &minus;8.',
    flip: 'Cubing and cube-rooting undo each other.',
    see: ['cube-root', 'square-number', 'power'],
  },
  {
    id: 'cube-root', term: 'Cube root', strand: 'n', level: 'F',
    def: 'The number that, multiplied by itself twice, gives the number you started with. It is written with the sign &#8731;.',
    example: '&#8731;125 = 5 because 5 &times; 5 &times; 5 = 125.',
    watch: 'Unlike square roots, a cube root of a negative number exists: &#8731;(&minus;8) = &minus;2.',
    flip: 'The inverse of cubing.',
    see: ['cube-number', 'square-root'],
  },

  {
    id: 'work-out', term: 'Work out', strand: 'n', level: 'F',
    def: 'A question word: find the answer by doing the calculation. Show your steps when there are marks for working.',
    example: 'Work out 3 + 4 &times; 2. Answer: 4 &times; 2 = 8, then 3 + 8 = 11.',
    watch: '&ldquo;Calculate&rdquo; means almost the same. &ldquo;Write down&rdquo; means no working is needed.',
    see: ['calculate', 'write-down', 'show-that'],
  },
  {
    id: 'calculate', term: 'Calculate', strand: 'n', level: 'F',
    def: 'A question word: use maths to find a number. A calculator is usually allowed, and you should still show your working.',
    example: 'Calculate 15% of 80. Answer: 0.15 &times; 80 = 12.',
    watch: 'Look at the paper: some are non-calculator.',
    see: ['work-out', 'write-down'],
  },
  {
    id: 'show-that', term: 'Show that', strand: 'n', level: 'F',
    def: 'A question word: the answer is given to you, and you must prove it is right by writing every step. The marks are for the working.',
    example: 'Show that x = 4 is a solution of 3x &minus; 1 = 11. Write 3 &times; 4 &minus; 1 = 11.',
    watch: 'Do not just write the answer: it is already in the question.',
    see: ['work-out', 'explain-command'],
  },
  {
    id: 'explain-command', term: 'Explain', strand: 'n', level: 'F',
    def: 'A question word: give a reason in words (and numbers) for why something is true.',
    example: 'Explain why 1 is not a prime number. Answer: it has only one factor, and a prime needs exactly two.',
    watch: 'Use a full sentence with a because.',
    see: ['show-that', 'work-out'],
  },
  {
    id: 'write-down', term: 'Write down', strand: 'n', level: 'F',
    def: 'A question word: give the answer only. No working is needed.',
    example: 'Write down the next number in 2, 4, 6, 8. Answer: 10.',
    see: ['work-out', 'calculate'],
  },
  {
    id: 'composite-number', term: 'Composite number', strand: 'n', level: 'F',
    def: 'A whole number bigger than 1 that is not prime. It has more than two factors.',
    example: '12 is composite (factors 1, 2, 3, 4, 6, 12). 13 is prime.',
    watch: '1 is neither prime nor composite.',
    see: ['prime-number', 'factor'],
  },
  {
    id: 'factor-tree', term: 'Factor tree', strand: 'n', level: 'F',
    def: 'A diagram that splits a number into smaller factors, branch by branch, until every branch ends in a prime number.',
    example: '84 splits into 2 and 42; 42 splits into 2 and 21; 21 splits into 3 and 7. The primes are 2, 2, 3, 7.',
    see: ['prime-factorisation', 'prime-number'],
  },
  {
    id: 'divisor', term: 'Divisor', strand: 'n', level: 'F',
    def: 'The number you divide by.',
    example: 'In 84 &divide; 7 = 12 the divisor is 7.',
    watch: 'A divisor is also a factor when it divides exactly.',
    see: ['dividend', 'quotient', 'factor'],
  },
  {
    id: 'dividend', term: 'Dividend', strand: 'n', level: 'F',
    def: 'The number that is being divided.',
    example: 'In 84 &divide; 7 = 12 the dividend is 84.',
    see: ['divisor', 'quotient'],
  },
  {
    id: 'partitioning', term: 'Partitioning', strand: 'n', level: 'F',
    def: 'Splitting a number into easy parts so you can calculate in steps.',
    example: '36 &times; 24 = 36 &times; 20 + 36 &times; 4 = 720 + 144 = 864.',
    see: ['place-value'],
  },
  {
    id: 'digit-sum', term: 'Digit sum', strand: 'n', level: 'F',
    def: 'The total you get by adding the digits of a number. It helps you test divisibility by 3 and by 9.',
    example: '4,563 has digit sum 4 + 5 + 6 + 3 = 18, so it divides by 3 and by 9.',
    see: ['divisible', 'digit'],
  },
  {
    id: 'carry-borrow', term: 'Carrying and borrowing', strand: 'n', level: 'F',
    def: 'In written addition you <b>carry</b> a ten into the next column when a column adds to 10 or more. In written subtraction you <b>borrow</b> a ten from the next column when you cannot take away.',
    example: '8 + 4 = 12: write 2, carry 1 to the tens column.',
    watch: 'Borrowing here means taking a ten from the next column, not asking a friend.',
    see: ['place-value'],
  },
  {
    id: 'irrational', term: 'Irrational number', strand: 'n', level: 'H',
    def: 'A number that cannot be written as a fraction. Its decimal never ends and never repeats.',
    example: '&radic;2 = 1.41421&hellip; and &pi; are irrational. 0.333&hellip; is not irrational: it repeats, and equals {frac:1/3}.',
    watch: 'A decimal that goes on for ever is not always irrational. Repeating decimals are fractions.',
    see: ['surd', 'square-root'],
  },
  {
    id: 'proof', term: 'Proof', strand: 'n', level: 'F',
    def: 'A chain of reasons that shows a statement is true in every case, not just in the examples you tried.',
    example: 'Examples show 3, 4, 5 and 5, 12, 13 fit a&sup2; + b&sup2; = c&sup2;. A proof shows it works for every right-angled triangle.',
    watch: 'A few examples are evidence, not proof.',
    see: ['algebraic-proof'],
  },

  // ---------- Algebra ----------
  {
    id: 'unknown', term: 'Unknown (variable)', strand: 'a', level: 'F',
    def: 'A letter standing for a number. It is called an unknown when you are trying to find it, and a variable when it can take many values.',
    example: 'In 3x + 2 = 14 the unknown is x (and x = 4).',
    see: ['equation', 'expression'],
  },
  {
    id: 'term', term: 'Term', strand: 'a', level: 'F',
    def: 'One part of an expression. Terms are separated by + and &minus; signs, and each term keeps the sign in front of it.',
    example: '4x &minus; 7y + 3 has three terms: 4x, &minus;7y and 3.',
    watch: 'Not the same as "term" in sequences (the terms of a sequence are its numbers).',
    see: ['expression', 'coefficient'],
  },
  {
    id: 'coefficient', term: 'Coefficient', strand: 'a', level: 'F',
    def: 'The number multiplying a letter in a term.',
    example: 'In 5x the coefficient is 5. In &minus;3y it is &minus;3. In x it is 1.',
    see: ['term'],
  },
  {
    id: 'expression', term: 'Expression', strand: 'a', level: 'F',
    def: 'Letters and numbers combined with operations, with no equals sign. You can simplify an expression but you cannot solve it.',
    example: '3x + 5 is an expression. 3x + 5 = 20 is an equation.',
    watch: 'In everyday English "expression" means a look on your face or a way of saying something. In maths there is no equals sign.',
    see: ['equation', 'formula'],
  },
  {
    id: 'equation', term: 'Equation', strand: 'a', level: 'F',
    def: 'Two expressions with an equals sign between them, saying they have the same value. Solving it means finding the value of the unknown that makes it true.',
    example: '3x + 5 = 20 is true only when x = 5.',
    flip: 'Solving finds the unknown from the equation; building an equation turns a puzzle into symbols.',
    see: ['solve', 'inverse-operation'],
  },
  {
    id: 'solve', term: 'Solve', strand: 'a', level: 'F',
    def: 'Find the value (or values) of the unknown that make an equation true.',
    example: 'Solve 3x + 5 = 20: take 5 from both sides (3x = 15), then divide both by 3 (x = 5).',
    watch: 'Always check: put your answer back in. 3 &times; 5 + 5 = 20 &check;',
    see: ['equation', 'inverse-operation'],
  },
  {
    id: 'inverse-operation', term: 'Inverse operation', strand: 'a', level: 'F',
    def: 'The operation that undoes another. Adding undoes subtracting, and multiplying undoes dividing.',
    example: 'x + 7 = 12: the inverse of +7 is &minus;7, so x = 12 &minus; 7 = 5.',
    flip: 'This is the heart of the book: every operation has a partner that undoes it.',
    see: ['equation'],
  },
  {
    id: 'substitute', term: 'Substitute', strand: 'a', level: 'F',
    def: 'Replace a letter with a number, then work out the answer.',
    example: 'Substitute x = 4 into 3x &minus; 1: 3 &times; 4 &minus; 1 = 11.',
    flip: 'Substituting goes from a letter to a value. Solving goes from a value back to the letter.',
    see: ['formula'],
  },
  {
    id: 'formula', term: 'Formula', strand: 'a', level: 'F',
    def: 'A rule written with letters that links quantities. The plural is formulae.',
    example: 'Area of a rectangle: A = l &times; w. Perimeter of a rectangle: P = 2l + 2w.',
    see: ['substitute', 'expression'],
  },
  {
    id: 'expand', term: 'Expand (multiply out)', strand: 'a', level: 'F',
    def: 'Remove brackets by multiplying every term inside by what is outside. With two brackets, multiply every term in one by every term in the other.',
    example: ['3(x + 4) {term:identity|&equiv;} 3x + 12', '(x + 2)(x + 5) {term:identity|&equiv;} x&sup2; + 7x + 10'],
    flip: 'Factorising puts the brackets back.',
    see: ['factorise', 'identity'],
  },
  {
    id: 'factorise', term: 'Factorise', strand: 'a', level: 'F',
    def: 'Write an expression as a product of factors, with brackets. It is expanding in reverse.',
    example: ['6x + 9 {term:identity|&equiv;} 3(2x + 3)', 'x&sup2; + 7x + 10 {term:identity|&equiv;} (x + 2)(x + 5)'],
    watch: 'Check by expanding your answer: you should get the original back.',
    flip: 'The reverse of expand.',
    see: ['expand', 'identity'],
  },
  {
    id: 'consecutive', term: 'Consecutive', strand: 'a', level: 'F',
    def: 'Following one after another with no gaps.',
    example: 'Consecutive integers: n, n + 1, n + 2. Consecutive odd numbers: 2n &minus; 1, 2n + 1, 2n + 3.',
    see: ['algebraic-proof'],
  },
  {
    id: 'algebraic-proof', term: 'Algebraic proof', strand: 'a', level: 'H',
    def: 'Showing something is true for every number by using letters to stand for any number. A few examples are not a proof.',
    example: 'Sum of three consecutive integers: n + (n + 1) + (n + 2) = 3n + 3 = 3(n + 1), always a multiple of 3.',
    watch: 'Checking 1 + 2 + 3 and 4 + 5 + 6 is evidence, not proof.',
    see: ['consecutive'],
  },
  {
    id: 'quadratic', term: 'Quadratic', strand: 'a', level: 'F',
    def: 'An expression or equation where the highest power of the unknown is 2.',
    example: 'x&sup2; + 5x + 6 = 0 is a quadratic equation. Its graph is a U-shaped curve called a parabola.',
    see: ['completing-the-square', 'discriminant'],
  },
  {
    id: 'completing-the-square', term: 'Completing the square', strand: 'a', level: 'H',
    def: 'Rewriting x&sup2; + bx + c as (x + p)&sup2; + q. It shows the turning point of the graph straight away.',
    example: 'x&sup2; &minus; 6x + 11 = (x &minus; 3)&sup2; + 2, so the turning point is (3, 2).',
    see: ['quadratic', 'turning-point'],
  },
  {
    id: 'turning-point', term: 'Turning point', strand: 'a', level: 'H',
    def: 'The point where a graph changes direction: a minimum if it goes down then up, a maximum if it goes up then down.',
    example: 'For y = (x &minus; p)&sup2; + q the turning point is (p, q).',
    see: ['completing-the-square'],
  },
  {
    id: 'discriminant', term: 'Discriminant', strand: 'a', level: 'H',
    def: 'The expression b&sup2; &minus; 4ac from the quadratic formula. Its sign tells you how many real solutions ax&sup2; + bx + c = 0 has.',
    example: 'Positive: two solutions. Zero: one (repeated) solution. Negative: none, as you cannot square-root a negative.',
    see: ['quadratic'],
  },
  {
    id: 'function', term: 'Function', strand: 'a', level: 'H',
    def: 'A rule that turns each input into exactly one output.',
    example: 'f(x) = 3x &minus; 1 means "multiply by 3, then subtract 1". f(4) = 11.',
    see: ['composite-function', 'inverse-function'],
  },
  {
    id: 'composite-function', term: 'Composite function', strand: 'a', level: 'H',
    def: 'One function followed by another. fg(x) means do g first, then f.',
    example: 'f(x) = x + 1 and g(x) = 2x. fg(3) = f(6) = 7 but gf(3) = g(4) = 8.',
    watch: 'Order matters: fg and gf are usually different. The one nearest x goes first.',
    see: ['function'],
  },
  {
    id: 'inverse-function', term: 'Inverse function', strand: 'a', level: 'H',
    def: 'The function f<sup>&minus;1</sup> that undoes f.',
    example: 'f(x) = 3x &minus; 1: multiply by 3, then subtract 1. f<sup>&minus;1</sup>(x) = {frac:x + 1/3}: add 1, then divide by 3.',
    watch: 'f<sup>&minus;1</sup>(x) does not mean 1 over f(x).',
    flip: 'Undo the steps in reverse order.',
    see: ['function', 'inverse-operation'],
  },
  {
    id: 'sequence', term: 'Sequence', strand: 'a', level: 'F',
    def: 'A list of numbers that follow a rule. Each number is a term of the sequence.',
    example: '3, 7, 11, 15 &hellip; goes up by 4 each time.',
    see: ['nth-term'],
  },
  {
    id: 'nth-term', term: 'nth term', strand: 'a', level: 'F',
    def: 'A formula that gives any term of a sequence from its position n.',
    example: 'For 3, 7, 11, 15 &hellip; the nth term is 4n &minus; 1. The 10th term is 4 &times; 10 &minus; 1 = 39.',
    see: ['sequence', 'quadratic-sequence'],
  },
  {
    id: 'quadratic-sequence', term: 'Quadratic sequence', strand: 'a', level: 'H',
    def: 'A sequence whose nth term contains n&sup2;. The second differences (the gaps between the gaps) are constant.',
    example: '4, 9, 18, 31 &hellip; has first differences 5, 9, 13 and second differences 4, 4. The nth term is 2n&sup2; &minus; n + 3.',
    see: ['nth-term'],
  },
  {
    id: 'simultaneous-equations', term: 'Simultaneous equations', strand: 'a', level: 'F',
    def: 'Two (or more) equations that are true at the same time. Their solution is where their graphs cross.',
    example: 'x + y = 5 and x &minus; y = 1 are both true when x = 3 and y = 2.',
    see: ['equation'],
  },

  {
    id: 'like-terms', term: 'Like terms', strand: 'a', level: 'F',
    def: 'Terms that have exactly the same letter part, so they can be added or subtracted.',
    example: '3a and 5a are like terms: 3a + 5a = 8a. 3a and 3b are not, and neither are 3a and 3a&sup2;.',
    watch: 'Each term keeps the sign in front of it: in 5x + 2 &minus; x the x terms are 5x and &minus;x.',
    flip: 'Collecting like terms simplifies; the reverse is splitting a term up.',
    see: ['term', 'coefficient', 'expression'],
  },

  {
    id: 'identity', term: 'Identity (&equiv;)', strand: 'a', level: 'H',
    def: 'Two expressions that are equal for every value of the letters. It is written with the symbol &equiv; (three parallel lines), read as "is identically equal to" or "is equivalent to". An equation, written with =, is only true for some values.',
    example: ['2(x + 3) &equiv; 2x + 6 is true whatever x is', '2x + 6 = 10 is an equation: it is true only when x = 2'],
    watch: 'Expanding and factorising give identities. A single = is often used in exam answers too, but &equiv; shows you know the two sides are always the same.',
    flip: 'Expanding and factorising are the two directions of one identity.',
    see: ['equation', 'expand', 'factorise', 'algebraic-proof'],
  },

  {
    id: 'simplify', term: 'Simplify', strand: 'a', level: 'F',
    def: 'Make an expression shorter or neater without changing its value, for example by collecting like terms.',
    example: ['5x + 2 &minus; x + 4 simplifies to 4x + 6', 'a &times; a simplifies to a&sup2;'],
    watch: 'For fractions, simplifying means writing them in lowest terms (see Simplify a fraction).',
    see: ['like-terms', 'simplify-fraction', 'expression'],
  },

  // ---------- Ratio, proportion ----------
  {
    id: 'ratio', term: 'Ratio', strand: 'r', level: 'F',
    def: 'A way of comparing quantities. A ratio tells you the shares, not the actual numbers.',
    example: 'Boys to girls 3 : 5 means for every 3 boys there are 5 girls. If one part is x, there are 3x boys and 5x girls.',
    watch: 'Order matters: boys to girls (3 : 5) is not girls to boys.',
    flip: 'Sharing a total in a ratio, and finding the total (or a share) from one known amount.',
    see: ['proportion'],
  },
  {
    id: 'proportion', term: 'Proportion', strand: 'r', level: 'F',
    def: 'Two quantities are in proportion if one is always the same multiple of the other. When one doubles, so does the other.',
    example: 'If 3 pens cost &pound;2.40, then 6 pens cost &pound;4.80.',
    flip: 'Direct proportion (both rise together) and inverse proportion (one rises as the other falls).',
    see: ['ratio'],
  },
  {
    id: 'scale-factor', term: 'Scale factor', strand: 'r', level: 'F',
    def: 'The number all lengths are multiplied by in an enlargement. If lengths are multiplied by k, areas are multiplied by k&sup2; and volumes by k<sup>3</sup>.',
    example: 'Scale factor 3: a 2 cm line becomes 6 cm, a 4 cm&sup2; area becomes 36 cm&sup2;.',
    see: ['similar-shapes'],
  },
  {
    id: 'similar-shapes', term: 'Similar shapes', strand: 'r', level: 'F',
    def: 'Shapes that are enlargements of each other: the same shape, different size. All the angles match and all the lengths are in the same ratio.',
    example: 'Any two squares are similar. A square and a 2 by 1 rectangle are not.',
    watch: 'In everyday English "similar" means "a bit alike". In maths it is exact: same shape, scaled.',
    see: ['scale-factor'],
  },

  // ---------- Geometry ----------
  {
    id: 'right-angle', term: 'Right angle', strand: 'g', level: 'F',
    def: 'An angle of exactly 90&deg;, like the corner of a page. It is marked with a small square.',
    example: 'The corner of a rectangle.',
    see: ['perpendicular'],
  },
  {
    id: 'perpendicular', term: 'Perpendicular', strand: 'g', level: 'F',
    def: 'At right angles (90&deg;). Two lines that are not horizontal or vertical are perpendicular if their gradients multiply to &minus;1.',
    example: 'Gradients 2 and &minus;{frac:1/2} give 2 &times; (&minus;{frac:1/2}) = &minus;1, so those lines are perpendicular.',
    see: ['right-angle', 'tangent'],
  },
  {
    id: 'hypotenuse', term: 'Hypotenuse', strand: 'g', level: 'F',
    def: 'The longest side of a right-angled triangle. It is always opposite the right angle.',
    example: 'In a triangle with sides 3, 4 and 5, the hypotenuse is 5.',
    watch: 'Look for the right angle first, then pick the side opposite it. It is not just "the slanted one".',
    see: ['pythagoras-theorem'],
  },
  {
    id: 'pythagoras-theorem', term: "Pythagoras' theorem", strand: 'g', level: 'F',
    def: 'In a right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides: a&sup2; + b&sup2; = c&sup2;.',
    example: 'Sides 3 and 4: c&sup2; = 9 + 16 = 25, so c = 5.',
    watch: 'It works for right-angled triangles only. To find a short side, subtract: a&sup2; = c&sup2; &minus; b&sup2;.',
    flip: 'Find the hypotenuse (add the squares) or find a shorter side (subtract). The converse tests whether a triangle is right-angled.',
    see: ['hypotenuse', 'pythagorean-triple', 'converse'],
  },
  {
    id: 'pythagorean-triple', term: 'Pythagorean triple', strand: 'g', level: 'F',
    def: 'Three whole numbers that fit a&sup2; + b&sup2; = c&sup2;.',
    example: '3, 4, 5; 5, 12, 13; 8, 15, 17; 7, 24, 25. Doubling or tripling a triple gives another: 6, 8, 10.',
    see: ['pythagoras-theorem'],
  },
  {
    id: 'converse', term: 'Converse', strand: 'g', level: 'F',
    def: 'The reverse of a statement: swap "if" and "then". A converse is not automatically true, but for Pythagoras it is.',
    example: 'Theorem: right-angled &rArr; a&sup2; + b&sup2; = c&sup2;. Converse: if a&sup2; + b&sup2; = c&sup2; then the triangle is right-angled.',
    flip: 'This is the "two sides" idea in its purest form.',
    see: ['pythagoras-theorem'],
  },
  {
    id: 'isosceles-triangle', term: 'Isosceles triangle', strand: 'g', level: 'F',
    def: 'A triangle with two equal sides. The angles opposite the equal sides are also equal.',
    example: 'Two radii of a circle and the chord between their ends make an isosceles triangle.',
    see: ['radius'],
  },
  {
    id: 'radius', term: 'Radius', strand: 'g', level: 'F',
    def: 'The distance from the centre of a circle to its edge. The plural is radii.',
    example: 'The circle x&sup2; + y&sup2; = 25 has centre (0, 0) and radius 5.',
    see: ['diameter', 'chord'],
  },
  {
    id: 'diameter', term: 'Diameter', strand: 'g', level: 'F',
    def: 'A straight line across a circle through the centre. It is twice the radius.',
    example: 'Radius 4 cm, diameter 8 cm.',
    see: ['radius', 'chord'],
  },
  {
    id: 'chord', term: 'Chord', strand: 'g', level: 'F',
    def: 'A straight line joining two points on a circle. The longest chord is a diameter.',
    example: 'A string stretched between two points on a hoop.',
    see: ['diameter'],
  },
  {
    id: 'tangent', term: 'Tangent', strand: 'g', level: 'H',
    def: 'A straight line that touches a circle at exactly one point. It is perpendicular to the radius at that point.',
    example: 'A bike wheel resting on flat ground: the ground is a tangent.',
    see: ['radius', 'perpendicular'],
  },
  {
    id: 'cyclic-quadrilateral', term: 'Cyclic quadrilateral', strand: 'g', level: 'H',
    def: 'A four-sided shape with all four corners on a circle. Its opposite angles add up to 180&deg;.',
    example: 'If one angle is 110&deg;, the angle opposite is 70&deg;.',
    see: ['angle-in-semicircle'],
  },
  {
    id: 'angle-in-semicircle', term: 'Angle in a semicircle', strand: 'g', level: 'H',
    def: 'The circle theorem: an angle drawn from the two ends of a diameter to any point on the circle is 90&deg;.',
    example: 'A triangle with the diameter as one side and its third corner on the circle is right-angled.',
    flip: 'Converse: a right angle on the circle means its chord is a diameter.',
    see: ['diameter', 'angle-at-centre'],
  },
  {
    id: 'angle-at-centre', term: 'Angle at the centre', strand: 'g', level: 'H',
    def: 'The circle theorem: the angle at the centre of a circle is twice the angle at the circumference when both are made from the same arc (the same two points on the circle).',
    example: 'Angle at the circumference 35&deg;, so angle at the centre 70&deg;.',
    see: ['angle-in-semicircle', 'radius'],
  },
  {
    id: 'frustum', term: 'Frustum', strand: 'g', level: 'H',
    def: 'What is left of a cone or pyramid when the top is cut off by a cut parallel to the base.',
    example: 'A lampshade or a flowerpot.',
    see: ['similar-shapes'],
  },
  {
    id: 'included-angle', term: 'Included angle', strand: 'g', level: 'H',
    def: 'The angle between two given sides of a triangle.',
    example: 'The area formula {frac:1/2}ab sin C needs the included angle C between sides a and b.',
    see: ['cosine-rule'],
  },
  {
    id: 'sine-rule', term: 'Sine rule', strand: 'g', level: 'H',
    def: 'For any triangle: a / sin A = b / sin B = c / sin C. Use it when you know a side and the angle opposite it.',
    example: 'Side a = 6 opposite A = 30&deg;; find side b opposite B = 45&deg;.',
    watch: 'When finding an angle, there may be two answers (see ambiguous case).',
    see: ['ambiguous-case', 'cosine-rule'],
  },
  {
    id: 'cosine-rule', term: 'Cosine rule', strand: 'g', level: 'H',
    def: 'For any triangle: a&sup2; = b&sup2; + c&sup2; &minus; 2bc cos A. Use it when you know all three sides, or two sides and the angle between them.',
    example: 'It becomes Pythagoras when A = 90&deg;, because cos 90&deg; = 0.',
    see: ['sine-rule', 'included-angle'],
  },
  {
    id: 'ambiguous-case', term: 'Ambiguous case', strand: 'g', level: 'H',
    def: 'When the sine rule finds an angle there can be two answers, &theta; and 180&deg; &minus; &theta;, because they have the same sine.',
    example: 'sin 30&deg; = sin 150&deg; = 0.5.',
    see: ['sine-rule'],
  },
  {
    id: 'exact-trig-values', term: 'Exact trig values', strand: 'g', level: 'H',
    def: 'Values of sin, cos and tan you should know without a calculator.',
    example: 'sin 30&deg; = {frac:1/2}, cos 60&deg; = {frac:1/2}, tan 45&deg; = 1, sin 60&deg; = {frac:&radic;3/2}.',
    see: ['sine-rule'],
  },

  {
    id: 'angle', term: 'Angle', strand: 'g', level: 'F',
    def: 'A measure of turn between two lines that meet at a point. It is measured in degrees: a full turn is 360&deg;.',
    example: 'A right angle is 90&deg;. A straight line is 180&deg;.',
    watch: 'The size of an angle does not depend on how long the lines are drawn.',
    see: ['right-angle', 'acute-angle', 'obtuse-angle', 'reflex-angle'],
  },
  {
    id: 'acute-angle', term: 'Acute angle', strand: 'g', level: 'F',
    def: 'An angle that is less than 90&deg;.',
    example: '35&deg; and 89&deg; are acute.',
    watch: 'Exactly 90&deg; is a right angle, not acute.',
    see: ['angle', 'obtuse-angle'],
  },
  {
    id: 'obtuse-angle', term: 'Obtuse angle', strand: 'g', level: 'F',
    def: 'An angle that is more than 90&deg; and less than 180&deg;.',
    example: '120&deg; and 179&deg; are obtuse.',
    see: ['angle', 'acute-angle', 'reflex-angle'],
  },
  {
    id: 'reflex-angle', term: 'Reflex angle', strand: 'g', level: 'F',
    def: 'An angle that is more than 180&deg; and less than 360&deg;.',
    example: '270&deg; is reflex. A reflex angle plus the angle on the other side of the same point makes 360&deg;.',
    see: ['angle', 'obtuse-angle'],
  },
  {
    id: 'vertically-opposite', term: 'Vertically opposite angles', strand: 'g', level: 'F',
    def: 'The angles that face each other when two straight lines cross (an X shape). They are always equal.',
    example: 'If one angle is 48&deg;, the angle directly opposite is also 48&deg;, and each of the other two is 132&deg;.',
    watch: 'These are not the angles <i>next to</i> each other: those add to 180&deg;.',
    see: ['angle'],
  },
  {
    id: 'alternate-angles', term: 'Alternate angles', strand: 'g', level: 'F',
    def: 'Angles between two parallel lines, on opposite sides of the line that crosses them, forming a Z shape. Alternate angles are equal.',
    example: 'If one angle is 70&deg;, the alternate angle is also 70&deg;.',
    watch: 'Only equal when the two lines are parallel.',
    see: ['corresponding-angles', 'co-interior-angles', 'parallel'],
  },
  {
    id: 'corresponding-angles', term: 'Corresponding angles', strand: 'g', level: 'F',
    def: 'Angles in the same position at each of the two crossing points when a line crosses two parallel lines, forming an F shape. Corresponding angles are equal.',
    example: 'If the top-right angle at one crossing is 70&deg;, the top-right angle at the other is also 70&deg;.',
    watch: 'Only equal when the two lines are parallel.',
    see: ['alternate-angles', 'co-interior-angles', 'parallel'],
  },
  {
    id: 'co-interior-angles', term: 'Co-interior angles', strand: 'g', level: 'F',
    def: 'Angles between two parallel lines, on the same side of the line that crosses them, forming a C shape. Co-interior angles add up to 180&deg;.',
    example: 'If one angle is 70&deg;, its co-interior angle is 180 &minus; 70 = 110&deg;.',
    watch: 'Not equal (unless both are 90&deg;): they add to 180&deg;.',
    see: ['alternate-angles', 'corresponding-angles', 'parallel'],
  },
  {
    id: 'parallel', term: 'Parallel', strand: 'g', level: 'F',
    def: 'Lines that stay the same distance apart and never meet. They are marked with matching arrows.',
    example: 'The two long edges of a rectangle are parallel.',
    watch: 'Two lines that meet are never parallel.',
    see: ['perpendicular', 'alternate-angles'],
  },
  {
    id: 'polygon', term: 'Polygon', strand: 'g', level: 'F',
    def: 'A closed flat shape with straight sides. A shape with n sides has interior angles that add up to (n &minus; 2) &times; 180&deg;.',
    example: 'Triangle (3 sides), quadrilateral (4), pentagon (5), hexagon (6), octagon (8). Interior angles of a pentagon add to 540&deg;.',
    watch: 'The exterior angles of a polygon add up to 360&deg;.',
    flip: 'From the number of sides to the angle total, or from an angle back to the number of sides.',
    see: ['regular-polygon', 'angle'],
  },
  {
    id: 'regular-polygon', term: 'Regular polygon', strand: 'g', level: 'F',
    def: 'A polygon where all the sides are equal and all the angles are equal.',
    example: 'A square and an equilateral triangle are regular. Each interior angle of a regular hexagon is 120&deg;.',
    watch: 'A shape can have equal sides without equal angles (a rhombus), so it is not regular.',
    flip: 'Each exterior angle is 360 &divide; n, so n = 360 &divide; exterior angle.',
    see: ['polygon'],
  },

  {
    id: 'interior-angle', term: 'Interior angle', strand: 'g', level: 'F',
    def: 'An angle inside a shape, at one of its corners.',
    example: ['A triangle has three interior angles. They add up to 180&deg;.', 'The interior angles of a regular pentagon are each 108&deg;.'],
    watch: 'Interior means inside. The exterior angle at the same corner is outside.',
    flip: 'At each corner: interior angle + exterior angle = 180&deg;.',
    see: ['exterior-angle', 'polygon', 'regular-polygon'],
  },
  {
    id: 'exterior-angle', term: 'Exterior angle', strand: 'g', level: 'F',
    def: 'An angle outside a shape at a corner, between one side and the next side extended in a straight line.',
    example: ['A regular hexagon has exterior angles of 360 &divide; 6 = 60&deg;.', 'The exterior angles of a polygon add up to 360&deg;.'],
    watch: 'It is not the same as the interior angle. The two together make 180&deg;.',
    flip: 'Number of sides = 360 &divide; exterior angle (for a regular polygon).',
    see: ['interior-angle', 'polygon', 'regular-polygon'],
  },
  {
    id: 'perimeter', term: 'Perimeter', strand: 'g', level: 'F',
    def: 'The distance all the way round the edge of a shape.',
    example: ['A rectangle 5 cm by 3 cm has perimeter 5 + 3 + 5 + 3 = 16 cm.'],
    watch: 'Perimeter is a length (cm, m). Area is the space inside (cm&sup2;, m&sup2;).',
    see: ['area'],
  },
  {
    id: 'area', term: 'Area', strand: 'g', level: 'F',
    def: 'The amount of flat space inside a shape. It is measured in square units such as cm&sup2;.',
    example: ['A rectangle 5 cm by 3 cm has area 5 &times; 3 = 15 cm&sup2;.', 'A square with side 7 cm has area 7&sup2; = 49 cm&sup2;.'],
    watch: 'Do not mix it up with perimeter, the distance round the edge.',
    flip: 'From side length to area: square it. From area to side length: square-root it.',
    see: ['perimeter', 'square-number'],
  },
  {
    id: 'diagonal', term: 'Diagonal', strand: 'g', level: 'F',
    def: 'A straight line joining two corners of a shape that are not next to each other.',
    example: ['The diagonal of a 9 cm by 12 cm rectangle is 15 cm (Pythagoras).'],
    see: ['hypotenuse', 'polygon'],
  },

  // ---------- Probability and statistics ----------
  {
    id: 'probability', term: 'Probability', strand: 'p', level: 'F',
    def: 'A number from 0 to 1 that says how likely something is. 0 means impossible and 1 means certain.',
    example: 'A fair coin lands heads with probability {frac:1/2}. A fair dice shows a 6 with probability {frac:1/6}.',
    watch: 'Probabilities of all possible outcomes add up to 1.',
    flip: 'P(event) and P(not event) add to 1, so P(not) = 1 &minus; P.',
    see: ['tree-diagram'],
  },
  {
    id: 'tree-diagram', term: 'Tree diagram', strand: 'p', level: 'F',
    def: 'A diagram of branches showing all possible outcomes of two or more events, with probabilities on the branches. Multiply along the branches, add between the end results you want.',
    example: 'Two spins: P(head then head) = {frac:1/2} &times; {frac:1/2} = {frac:1/4}.',
    see: ['without-replacement', 'probability'],
  },
  {
    id: 'without-replacement', term: 'Without replacement', strand: 'p', level: 'F',
    def: 'When an item is taken and not put back, so the second pick has one fewer to choose from and the probabilities change.',
    example: 'A bag with 3 red and 2 blue counters. First pick red: {frac:3/5}. Second pick red (no replacement): {frac:2/4}.',
    see: ['tree-diagram'],
  },
  {
    id: 'mean', term: 'Mean', strand: 's', level: 'F',
    def: 'The average found by adding all the values and dividing by how many there are.',
    example: 'Mean of 2, 3, 7: (2 + 3 + 7) &divide; 3 = 4.',
    watch: 'In everyday English "mean" can mean unkind or "to signify". In maths it is the "fair share" average.',
    flip: 'From a mean and a count you can find the total: total = mean &times; number of values.',
    see: ['median', 'mode'],
  },
  {
    id: 'median', term: 'Median', strand: 's', level: 'F',
    def: 'The middle value when the data are in order. With two middle values, take the number halfway between them.',
    example: '2, 3, 7, 8, 20: the median is 7. For 2, 3, 7, 8 the median is 5.',
    see: ['mean', 'mode'],
  },
  {
    id: 'mode', term: 'Mode', strand: 's', level: 'F',
    def: 'The value that occurs most often.',
    example: '2, 3, 3, 7: the mode is 3.',
    see: ['mean', 'median'],
  },
  {
    id: 'range', term: 'Range', strand: 's', level: 'F',
    def: 'A measure of spread: the biggest value minus the smallest.',
    example: '2, 3, 7, 8, 20: range = 20 &minus; 2 = 18.',
    watch: 'The range is a single number, not "2 to 20".',
    see: ['mean'],
  },
  {
    "id": "simple-interest",
    "term": "Simple interest",
    "strand": "n",
    "level": "F",
    "def": "Interest worked out only on the starting amount, so the same amount is paid every year.",
    "example": "&pound;600 at 3% simple interest for 4 years. 3% of 600 = &pound;18 a year, so the interest is 4 &times; 18 = &pound;72.",
    "watch": "Simple interest does not earn interest on the interest. Compound interest does.",
    "flip": "Find the rate or the time from the interest paid: rate = interest &divide; (amount &times; years).",
    "see": [
      "percentage",
      "compound-interest"
    ]
  },
  {
    "id": "vat",
    "term": "VAT",
    "strand": "n",
    "level": "F",
    "def": "Value added tax: a percentage added to the price of most goods and services. The usual UK rate is 20%.",
    "example": "A bike costs &pound;250 before VAT. With 20% VAT: 250 &times; 1.2 = &pound;300.",
    "watch": "To take VAT out of a price that includes it, divide by 1.2. Taking 20% off does not work.",
    "flip": "Price without VAT = price with VAT &divide; 1.2.",
    "see": [
      "multiplier",
      "reverse-percentage"
    ]
  },
  {
    "id": "percentage-change",
    "term": "Percentage change",
    "strand": "n",
    "level": "F",
    "def": "How much an amount has changed, written as a percentage of the starting amount: change divided by original, times 100.",
    "example": "A price goes from &pound;80 to &pound;92. Change = 12. 12 &divide; 80 &times; 100 = 15%, so it is a 15% increase.",
    "watch": "Always divide by the original amount, not the new one.",
    "flip": "To go from a percentage change to the new amount, use a multiplier.",
    "see": [
      "multiplier",
      "reverse-percentage"
    ]
  },
  {
    "id": "equivalent-ratios",
    "term": "Equivalent ratios",
    "strand": "r",
    "level": "F",
    "def": "Ratios that describe the same split with different numbers. You get one by multiplying or dividing both sides by the same number.",
    "example": [
      "2 : 3 = 4 : 6 = 10 : 15.",
      "Divide 12 : 18 by 6 to get the simplest form, 2 : 3."
    ],
    "watch": "Adding the same number to both sides does not work: 2 : 3 is not the same as 4 : 5.",
    "flip": "Simplifying a ratio, and scaling it up.",
    "see": [
      "ratio",
      "equivalent-fractions"
    ]
  },
  {
    "id": "unitary-method",
    "term": "Unitary method",
    "strand": "r",
    "level": "F",
    "def": "Find the value of one unit first, then multiply to get the amount you want.",
    "example": "5 tiles cost &pound;12.50, so 1 tile costs &pound;2.50 and 8 tiles cost 8 &times; &pound;2.50 = &pound;20.",
    "flip": "Dividing to find one, then multiplying to find many.",
    "see": [
      "proportion",
      "ratio"
    ]
  },
  {
    "id": "best-buy",
    "term": "Best buy",
    "strand": "r",
    "level": "F",
    "def": "The deal that costs least for the same amount. Work out the price per unit (per 100 g, per litre, per item) for each and compare.",
    "example": "500 g for &pound;1.60 is 32p per 100 g. 750 g for &pound;2.25 is 30p per 100 g, so the 750 g pack is the better buy.",
    "watch": "A bigger pack is not always cheaper per unit. Always work it out.",
    "flip": "Price per unit, and how much you get for a pound.",
    "see": [
      "unitary-method",
      "proportion"
    ]
  },
  {
    "id": "map-scale",
    "term": "Map scale",
    "strand": "r",
    "level": "F",
    "def": "A ratio that compares a length on a map, plan or model with the real length. The same units are used on both sides.",
    "example": "A scale of 1 : 50 000 means 1 cm on the map is 50 000 cm (500 m) in real life.",
    "watch": "Change units at the end: multiply by the scale, then change centimetres to metres or kilometres.",
    "flip": "Map length to real length, and real length to map length.",
    "see": [
      "ratio",
      "scale-factor"
    ]
  },
  {
    "id": "subject",
    "term": "Subject (of a formula)",
    "strand": "a",
    "level": "F",
    "def": "The letter on its own on one side of a formula, usually the left. Making a letter the subject means rearranging the formula so that letter is alone.",
    "example": [
      "In v = u + at, the subject is v.",
      "Make t the subject: take u from both sides, then divide by a, to get t = {frac:v &minus; u/a}."
    ],
    "watch": "Use the same step on both sides, and divide the whole of the other side, not just one term.",
    "flip": "Substituting puts numbers in to find the output. Making a letter the subject builds the formula that finds an input.",
    "see": [
      "formula",
      "inverse-operation",
      "substitute"
    ]
  },
  {
    "id": "elimination",
    "term": "Elimination",
    "strand": "a",
    "level": "F",
    "def": "A way to solve simultaneous equations. Add or subtract the two equations so that one letter disappears, leaving one equation with one unknown. You may need to multiply an equation first so the letter matches.",
    "example": [
      "x + y = 7 and x &minus; y = 1. Add the equations: 2x = 8, so x = 4.",
      "Then 4 + y = 7, so y = 3."
    ],
    "watch": "Same signs on the letter you want to remove: subtract. Different signs: add. Multiply every term of an equation, including the number on the right.",
    "flip": "Check an answer by putting it back into both original equations.",
    "see": [
      "simultaneous-equations",
      "substitute"
    ]
  },
  {
    "id": "difference-of-two-squares",
    "term": "Difference of two squares",
    "strand": "a",
    "level": "H",
    "def": "An expression with one square taken away from another, such as x&sup2; &minus; 49. It factorises into two brackets that are the same except for the sign.",
    "example": [
      "x&sup2; &minus; 49 = (x + 7)(x &minus; 7)",
      "73&sup2; &minus; 27&sup2; = (73 + 27)(73 &minus; 27) = 4600"
    ],
    "watch": "x&sup2; + 49 does not factorise this way. You need the minus sign.",
    "flip": "Expanding (x + a)(x &minus; a) gives x&sup2; &minus; a&sup2;: the two middle terms cancel.",
    "see": [
      "factorise",
      "expand",
      "square-number"
    ]
  },
  {
    "id": "root-of-equation",
    "term": "Root (solution) of an equation",
    "strand": "a",
    "level": "H",
    "def": "A value of the unknown that makes the equation true. A quadratic can have two roots. On its graph, the roots are where the curve crosses the x-axis.",
    "example": "x&sup2; &minus; x &minus; 6 = 0 has roots x = 3 and x = &minus;2.",
    "flip": "Roots 2 and 5 come from the brackets (x &minus; 2)(x &minus; 5).",
    "see": [
      "solve",
      "quadratic",
      "parabola"
    ]
  },
  {
    "id": "parabola",
    "term": "Parabola",
    "strand": "a",
    "level": "H",
    "def": "The U-shaped curve that is the graph of a quadratic. If the x&sup2; term is negative, it is an upside-down U.",
    "example": "y = x&sup2; &minus; x &minus; 6 is a parabola that crosses the x-axis at x = &minus;2 and x = 3.",
    "see": [
      "quadratic",
      "turning-point",
      "root-of-equation"
    ]
  },
  {
    "id": "quadratic-formula",
    "term": "Quadratic formula",
    "strand": "a",
    "level": "H",
    "def": "A formula that solves any equation ax&sup2; + bx + c = 0 (with a not 0): x = (&minus;b &plusmn; &radic;(b&sup2; &minus; 4ac)) &divide; 2a.",
    "example": "x&sup2; &minus; 6x + 2 = 0 has a = 1, b = &minus;6, c = 2. So x = (6 &plusmn; &radic;28) &divide; 2 = 5.65 or 0.35 to 2 d.p.",
    "watch": "If b is negative, then &minus;b is positive. Take care with the signs.",
    "see": [
      "discriminant",
      "quadratic",
      "root-of-equation"
    ]
  },
  {
    "id": "opposite",
    "term": "Opposite (side)",
    "strand": "g",
    "level": "F",
    "def": "In a right-angled triangle, the side across from the angle you are using. It does not touch that angle.",
    "example": "If the angle is at the bottom right of a triangle with its right angle at the bottom left, the opposite side is the upright one.",
    "watch": "It changes if you pick the other angle. The hypotenuse never changes.",
    "flip": "Naming the sides from an angle, and choosing the angle from the sides.",
    "see": [
      "adjacent",
      "hypotenuse",
      "soh-cah-toa"
    ]
  },
  {
    "id": "adjacent",
    "term": "Adjacent (side)",
    "strand": "g",
    "level": "F",
    "def": "In a right-angled triangle, the side next to the angle you are using that is not the hypotenuse.",
    "example": "For a ladder against a wall, the ground is adjacent to the angle between the ladder and the ground.",
    "watch": "Two sides touch the angle. One is the hypotenuse, so adjacent is the other one.",
    "flip": "Naming the sides from an angle, and choosing the angle from the sides.",
    "see": [
      "opposite",
      "hypotenuse",
      "soh-cah-toa"
    ]
  },
  {
    "id": "sine",
    "term": "Sine (sin)",
    "strand": "g",
    "level": "F",
    "def": "For an angle in a right-angled triangle, sine is the opposite side divided by the hypotenuse.",
    "example": [
      "If the opposite is 3 and the hypotenuse is 5, sin x = {frac:3/5}.",
      "sin 30&deg; = 0.5."
    ],
    "watch": "Make sure your calculator is in degrees. In a right-angled triangle, sine is never more than 1.",
    "flip": "Finding a side with sin, and finding the angle with sin<sup>&minus;1</sup>.",
    "see": [
      "soh-cah-toa",
      "cosine",
      "inverse-trig"
    ]
  },
  {
    "id": "cosine",
    "term": "Cosine (cos)",
    "strand": "g",
    "level": "F",
    "def": "For an angle in a right-angled triangle, cosine is the adjacent side divided by the hypotenuse.",
    "example": [
      "If the adjacent is 4 and the hypotenuse is 5, cos x = {frac:4/5}.",
      "cos 60&deg; = 0.5."
    ],
    "watch": "Make sure your calculator is in degrees. In a right-angled triangle, cosine is never more than 1.",
    "flip": "Finding a side with cos, and finding the angle with cos<sup>&minus;1</sup>.",
    "see": [
      "soh-cah-toa",
      "sine",
      "inverse-trig"
    ]
  },
  {
    "id": "tan-ratio",
    "term": "Tan (the trig ratio)",
    "strand": "g",
    "level": "F",
    "def": "For an angle in a right-angled triangle, tan is the opposite side divided by the adjacent side. It is not the same as a tangent line to a circle.",
    "example": [
      "If the opposite is 3 and the adjacent is 4, tan x = {frac:3/4}.",
      "tan 45&deg; = 1."
    ],
    "watch": "Tan can be bigger than 1. It does not use the hypotenuse.",
    "flip": "Finding a side with tan, and finding the angle with tan<sup>&minus;1</sup>.",
    "see": [
      "soh-cah-toa",
      "sine",
      "cosine",
      "inverse-trig"
    ]
  },
  {
    "id": "soh-cah-toa",
    "term": "SOH CAH TOA",
    "strand": "g",
    "level": "F",
    "def": "A memory aid for the three trig ratios: Sin = Opposite / Hypotenuse, Cos = Adjacent / Hypotenuse, Tan = Opposite / Adjacent.",
    "example": "You know the adjacent side and want the hypotenuse. Adjacent and Hypotenuse is CAH, so use cos.",
    "flip": "Choosing the ratio from the sides, and naming the sides from the ratio.",
    "see": [
      "sine",
      "cosine",
      "tan-ratio",
      "opposite",
      "adjacent",
      "hypotenuse"
    ]
  },
  {
    "id": "inverse-trig",
    "term": "Inverse trig functions",
    "strand": "g",
    "level": "F",
    "def": "Calculator buttons (sin<sup>&minus;1</sup>, cos<sup>&minus;1</sup>, tan<sup>&minus;1</sup>) that turn a ratio back into an angle.",
    "example": "sin x = 0.5, so x = sin<sup>&minus;1</sup>(0.5) = 30&deg;.",
    "watch": "You usually press SHIFT or 2nd first. The sin<sup>&minus;1</sup> button is not 1 &divide; sin.",
    "flip": "Angle to ratio (sin), and ratio to angle (sin<sup>&minus;1</sup>).",
    "see": [
      "sine",
      "cosine",
      "tan-ratio"
    ]
  },
  {
    "id": "angle-of-elevation",
    "term": "Angle of elevation",
    "strand": "g",
    "level": "F",
    "def": "The angle measured up from the horizontal when you look up at something.",
    "example": "You stand 30 m from a tower and look up at the top. The angle between the horizontal and your line of sight is the angle of elevation.",
    "flip": "The angle of elevation from B up to A equals the angle of depression from A down to B.",
    "see": [
      "angle-of-depression",
      "tan-ratio"
    ]
  },
  {
    "id": "angle-of-depression",
    "term": "Angle of depression",
    "strand": "g",
    "level": "F",
    "def": "The angle measured down from the horizontal when you look down at something.",
    "example": "From a cliff top you look down at a boat. The angle between the horizontal and your line of sight is the angle of depression.",
    "watch": "It is measured from the horizontal, not from the cliff or the vertical.",
    "flip": "The angle of depression from A down to B equals the angle of elevation from B up to A.",
    "see": [
      "angle-of-elevation",
      "tan-ratio"
    ]
  },
  {
    "id": "compound-interest",
    "term": "Compound interest",
    "strand": "n",
    "level": "H",
    "def": "Interest that is added to the account each year, so later interest is worked out on the interest as well.",
    "example": "&pound;1000 at 5% a year for 3 years: 1000 &times; 1.05<sup>3</sup> = &pound;1157.63 (to the nearest penny).",
    "watch": "Three years at 5% is not 15%. You multiply by 1.05 three times.",
    "flip": "To find the starting amount, divide by the multiplier to the power n.",
    "see": [
      "multiplier",
      "simple-interest",
      "depreciation"
    ]
  },
  {
    "id": "perpendicular-height",
    "term": "Perpendicular height",
    "strand": "g",
    "level": "F",
    "def": "The height of a shape measured at a right angle to its base. It is not the length of a slanting side.",
    "example": [
      "A triangle has a base of 10 cm, slanting sides of 13 cm and a perpendicular height of 12 cm.",
      "Its area is &frac12; &times; 10 &times; 12 = 60 cm&sup2;. The 13 cm is not used."
    ],
    "watch": "The slanting side is always longer than the perpendicular height. Use the one at a right angle to the base.",
    "see": [
      "area",
      "perpendicular",
      "parallelogram"
    ]
  },
  {
    "id": "parallelogram",
    "term": "Parallelogram",
    "strand": "g",
    "level": "F",
    "def": "A four-sided shape with two pairs of parallel sides. Opposite sides are equal in length.",
    "example": [
      "Base 9 cm and perpendicular height 4 cm: area = 9 &times; 4 = 36 cm&sup2;."
    ],
    "flip": "From area to base: divide the area by the perpendicular height.",
    "see": [
      "area",
      "perpendicular-height",
      "trapezium"
    ]
  },
  {
    "id": "trapezium",
    "term": "Trapezium",
    "strand": "g",
    "level": "F",
    "def": "A four-sided shape with one pair of parallel sides. The plural is trapezia.",
    "example": [
      "Parallel sides 6 cm and 10 cm, height 4 cm between them.",
      "Area = &frac12; &times; (6 + 10) &times; 4 = 32 cm&sup2;."
    ],
    "watch": "Add the two parallel sides, then halve. The slanting sides are not used in the area.",
    "see": [
      "area",
      "perpendicular-height",
      "parallelogram"
    ]
  },
  {
    "id": "compound-shape",
    "term": "Compound shape",
    "strand": "g",
    "level": "F",
    "def": "A shape made by joining simpler shapes, such as rectangles, triangles and semicircles.",
    "example": [
      "An L-shape split into two rectangles: add their areas.",
      "Or draw a big rectangle round it and subtract the missing corner."
    ],
    "see": [
      "area",
      "perimeter"
    ]
  },
  {
    "id": "volume",
    "term": "Volume",
    "strand": "g",
    "level": "F",
    "def": "The amount of space inside a solid. It is measured in cubic units such as cm&sup3; and m&sup3;.",
    "example": [
      "A cuboid 6 cm by 4 cm by 3 cm has volume 6 &times; 4 &times; 3 = 72 cm&sup3;."
    ],
    "watch": "1 m&sup3; = 1 000 000 cm&sup3; and 1000 cm&sup3; = 1 litre.",
    "flip": "From volume to a missing length: divide the volume by the other measurements.",
    "see": [
      "cuboid",
      "prism",
      "area"
    ]
  },
  {
    "id": "cuboid",
    "term": "Cuboid",
    "strand": "g",
    "level": "F",
    "def": "A solid with six rectangular faces, like a brick or a shoebox.",
    "example": [
      "A cuboid 8 cm by 5 cm by 3 cm: volume 8 &times; 5 &times; 3 = 120 cm&sup3;."
    ],
    "see": [
      "volume",
      "surface-area",
      "prism"
    ]
  },
  {
    "id": "prism",
    "term": "Prism",
    "strand": "g",
    "level": "F",
    "def": "A solid with the same cross-section all the way along its length.",
    "example": [
      "Volume of a prism = area of cross-section &times; length.",
      "A triangular prism with a triangle of area 10 cm&sup2; and a length of 8 cm has volume 80 cm&sup3;."
    ],
    "see": [
      "cross-section",
      "volume",
      "cuboid"
    ]
  },
  {
    "id": "cross-section",
    "term": "Cross-section",
    "strand": "g",
    "level": "F",
    "def": "The flat shape you see when you slice straight through a solid. In a prism it is the same all the way along.",
    "example": [
      "Cut a pipe straight across and the cross-section is a ring.",
      "Cut a triangular tent straight across and the cross-section is a triangle."
    ],
    "see": [
      "prism",
      "volume",
      "area"
    ]
  },
  {
    "id": "surface-area",
    "term": "Surface area",
    "strand": "g",
    "level": "F",
    "def": "The total area of all the faces of a solid.",
    "example": [
      "A cuboid 5 cm by 4 cm by 2 cm has pairs of faces 20, 10 and 8 cm&sup2;.",
      "Surface area = 2 &times; (20 + 10 + 8) = 76 cm&sup2;."
    ],
    "watch": "Surface area is measured in square units, even though the solid is 3D.",
    "see": [
      "area",
      "cuboid",
      "volume"
    ]
  },
  {
    "id": "circle",
    "term": "Circle",
    "strand": "g",
    "level": "F",
    "def": "A round shape where every point on the edge is the same distance from the centre.",
    "example": [
      "A coin, a wheel and the top of a tin are circles.",
      "A circle with radius 3 cm has diameter 6 cm."
    ],
    "see": [
      "radius",
      "diameter",
      "circumference"
    ]
  },
  {
    "id": "circumference",
    "term": "Circumference",
    "strand": "g",
    "level": "F",
    "def": "The distance all the way round the edge of a circle. It is the perimeter of a circle.",
    "example": [
      "C = &pi; &times; d, or C = 2 &times; &pi; &times; r.",
      "A circle with diameter 10 cm has circumference &pi; &times; 10 = 31.4 cm (to 1 d.p.)."
    ],
    "watch": "A bit more than 3 times the diameter. Do not confuse it with the area, which uses r&sup2;.",
    "flip": "From circumference to diameter: divide by &pi;.",
    "see": [
      "pi",
      "diameter",
      "perimeter",
      "arc"
    ]
  },
  {
    "id": "pi",
    "term": "Pi (&pi;)",
    "strand": "g",
    "level": "F",
    "def": "The number you get when you divide the circumference of any circle by its diameter. It is about 3.14159, and its decimal digits never end or repeat.",
    "example": [
      "Circumference = &pi; &times; diameter. Area = &pi; &times; radius&sup2;.",
      "Use the &pi; button on your calculator. Only use 3.14 if the question says so."
    ],
    "watch": "Do not round &pi; early. Keep the full value on the calculator and round the final answer.",
    "see": [
      "circumference",
      "irrational",
      "circle"
    ]
  },
  {
    "id": "arc",
    "term": "Arc",
    "strand": "g",
    "level": "F",
    "def": "Part of the circumference of a circle: a curved piece of the edge.",
    "example": [
      "A sector with angle 90&deg; and radius 8 cm has an arc length of &frac14; &times; 2&pi; &times; 8 = 12.6 cm (to 1 d.p.)."
    ],
    "see": [
      "circumference",
      "sector",
      "chord"
    ]
  },
  {
    "id": "semicircle",
    "term": "Semicircle",
    "strand": "g",
    "level": "F",
    "def": "Half of a circle, cut along a diameter.",
    "example": [
      "A semicircle with diameter 8 cm has area &frac12; &times; &pi; &times; 4&sup2; = 25.1 cm&sup2;.",
      "Its perimeter is the curved edge plus the straight 8 cm."
    ],
    "watch": "The perimeter of a semicircle includes the straight edge, not just the curve.",
    "see": [
      "circle",
      "diameter",
      "arc"
    ]
  },
  {
    "id": "sector",
    "term": "Sector",
    "strand": "g",
    "level": "H",
    "def": "A slice of a circle between two radii and the arc that joins their ends.",
    "example": [
      "A sector with angle 72&deg; and radius 5 cm is {frac:72/360} = {frac:1/5} of the circle.",
      "Its area is &frac15; &times; &pi; &times; 5&sup2; = 15.7 cm&sup2; (to 1 d.p.)."
    ],
    "watch": "Find the fraction of the circle first: angle &divide; 360.",
    "see": [
      "arc",
      "radius",
      "circle"
    ]
  },
  {
    "id": "cylinder",
    "term": "Cylinder",
    "strand": "g",
    "level": "H",
    "def": "A solid with two equal circular ends and a curved side, like a tin of beans. It is a prism with a circle for its cross-section.",
    "example": [
      "Volume = &pi; &times; r&sup2; &times; h.",
      "Radius 4 cm and height 10 cm: volume = &pi; &times; 16 &times; 10 = 502.7 cm&sup3; (to 1 d.p.)."
    ],
    "see": [
      "circle",
      "prism",
      "volume"
    ]
  },
  {
    "id": "outcome",
    "term": "Outcome",
    "strand": "p",
    "level": "F",
    "def": "One possible result of an experiment or event, such as heads when you toss a coin.",
    "example": "Rolling a dice has 6 outcomes: 1, 2, 3, 4, 5 and 6. Two coins have 4 outcomes: HH, HT, TH and TT.",
    "watch": "HT and TH are different outcomes. List them both.",
    "flip": "If you know how many outcomes there are and how many are favourable, you can work out the probability.",
    "see": [
      "probability",
      "equally-likely"
    ]
  },
  {
    "id": "equally-likely",
    "term": "Equally likely",
    "strand": "p",
    "level": "F",
    "def": "Outcomes that each have the same chance of happening, such as the faces of a fair dice.",
    "example": "A fair spinner with 8 equal sectors: each sector has probability {frac:1/8}.",
    "watch": "Having three colours does not make each colour 1/3. That only works if the sectors are the same size.",
    "flip": "If outcomes are not equally likely, use relative frequency from an experiment instead.",
    "see": [
      "probability",
      "relative-frequency"
    ]
  },
  {
    "id": "sample-space",
    "term": "Sample space",
    "strand": "p",
    "level": "F",
    "def": "The list or table of every possible outcome. A sample-space diagram is a table that shows them all, so none are missed.",
    "example": "For two dice, the sample space has 36 pairs, from (1,1) to (6,6).",
    "flip": "Count the pairs you want in the table and divide by the total number of pairs to get a probability.",
    "see": [
      "outcome",
      "probability"
    ]
  },
  {
    "id": "relative-frequency",
    "term": "Relative frequency",
    "strand": "p",
    "level": "F",
    "def": "An estimate of a probability from an experiment: the number of times something happened divided by the number of trials.",
    "example": "A drawing pin lands point up 18 times in 50 drops. Relative frequency = 18 &divide; 50 = 0.36.",
    "watch": "More trials give a better estimate. A few trials can be very misleading.",
    "flip": "If you know the probability, expected number = probability &times; number of trials.",
    "see": [
      "probability",
      "expected-number"
    ]
  },
  {
    "id": "expected-number",
    "term": "Expected number",
    "strand": "p",
    "level": "F",
    "def": "How many times you would expect something to happen on average: probability times the number of trials.",
    "example": "P(6) = {frac:1/6}. In 120 rolls you expect {frac:1/6} &times; 120 = 20 sixes.",
    "watch": "It is an average, not a promise. You will not get exactly 20 sixes every time.",
    "flip": "Number of trials = expected number &divide; probability.",
    "see": [
      "probability",
      "relative-frequency"
    ]
  },
  {
    "id": "mutually-exclusive",
    "term": "Mutually exclusive",
    "strand": "p",
    "level": "F",
    "def": "Outcomes that cannot happen at the same time. For mutually exclusive outcomes, P(A or B) = P(A) + P(B).",
    "example": "On one roll of a dice, a 2 and a 5 are mutually exclusive, so P(2 or 5) = {frac:1/6} + {frac:1/6} = {frac:1/3}.",
    "watch": "Even and bigger than 3 can both be true (4 and 6), so you cannot just add those probabilities.",
    "flip": "If P(A or B) is not P(A) + P(B), the outcomes overlap.",
    "see": [
      "probability",
      "independent-events"
    ]
  },
  {
    "id": "independent-events",
    "term": "Independent events",
    "strand": "p",
    "level": "F",
    "def": "Events where one does not change the chance of the other. For independent events, P(A and B) = P(A) &times; P(B).",
    "example": "A coin and a dice: P(heads and 6) = {frac:1/2} &times; {frac:1/6} = {frac:1/12}.",
    "watch": "Picking without replacement is not independent: the first pick changes what is left.",
    "flip": "If P(A and B) is not P(A) &times; P(B), the events affect each other.",
    "see": [
      "probability",
      "tree-diagram",
      "without-replacement"
    ]
  },
  {
    "id": "venn-diagram",
    "term": "Venn diagram",
    "strand": "p",
    "level": "F",
    "def": "A diagram of overlapping circles in a box. Each circle is a set, the overlap is in both sets, and outside the circles is in neither.",
    "example": "30 students: 18 like football, 12 like rugby, 5 like both. Football only 13, both 5, rugby only 7, neither 5.",
    "watch": "Fill in the overlap first. Items in both sets must not be counted twice.",
    "flip": "From the numbers in each region you can read off probabilities, such as P(neither) = {frac:5/30}.",
    "see": [
      "probability",
      "tree-diagram"
    ]
  },
  {
    "id": "average",
    "term": "Average",
    "strand": "s",
    "level": "F",
    "def": "One number that stands for a whole set of data. The mean, median and mode are the three averages.",
    "example": "Data: 2, 3, 3, 7. Mean 3.75, median 3, mode 3. Each is a different kind of average.",
    "watch": "In maths there are three averages. In everyday speech &ldquo;average&rdquo; usually means the mean.",
    "flip": "From an average and how many values there are, you can work backwards to a missing value.",
    "see": [
      "mean",
      "median",
      "mode",
      "range"
    ]
  },
  {
    "id": "frequency-table",
    "term": "Frequency table",
    "strand": "s",
    "level": "F",
    "def": "A table that counts how many times each value occurs. The frequency (f) is the count.",
    "example": "Goals: 0, 1, 2 with frequencies 4, 5, 6. The mean is (0 &times; 4 + 1 &times; 5 + 2 &times; 6) &divide; 15 = 17 &divide; 15.",
    "watch": "The mode is the value with the biggest frequency, not the frequency itself.",
    "flip": "Mean = sum of (frequency &times; value) &divide; sum of frequencies.",
    "see": [
      "mean",
      "mode",
      "median"
    ]
  },
  {
    "id": "outlier",
    "term": "Outlier",
    "strand": "s",
    "level": "F",
    "def": "A value that is far away from the rest of the data. It can drag the mean a long way.",
    "example": "Pay: 24 000, 25 000, 26 000, 27 000, 98 000. The 98 000 is an outlier.",
    "watch": "The median is hardly changed by an outlier, but the mean and the range are.",
    "flip": "To describe typical data with an outlier, use the median instead of the mean.",
    "see": [
      "mean",
      "median"
    ]
  },
  {
    "id": "pie-chart",
    "term": "Pie chart",
    "strand": "s",
    "level": "F",
    "def": "A circle cut into sectors, where the angle of each sector shows its share of the whole. The angles add up to 360 degrees.",
    "example": "40 children, 15 chose cats. One child is 360 &divide; 40 = 9 degrees, so cats get 15 &times; 9 = 135 degrees.",
    "watch": "A pie chart with no total cannot be used to compare numbers between two charts.",
    "flip": "To read a pie chart backwards, divide an angle by the degrees for one item.",
    "see": [
      "percentage"
    ]
  },
  {
    "id": "scatter-graph",
    "term": "Scatter graph",
    "strand": "s",
    "level": "F",
    "def": "A graph of points, each showing two measurements for one person or thing, used to see whether the two are linked.",
    "example": "Plot hours of revision against test score for each student.",
    "watch": "A link on a scatter graph does not prove that one thing causes the other.",
    "flip": "Draw a line of best fit, then use it to estimate one value from the other.",
    "see": [
      "correlation",
      "line-of-best-fit"
    ]
  },
  {
    "id": "correlation",
    "term": "Correlation",
    "strand": "s",
    "level": "F",
    "def": "The link between two sets of data on a scatter graph. Positive: both go up together. Negative: one goes up as the other goes down. None: no pattern.",
    "example": "Age of a car and its value show negative correlation: older cars are worth less.",
    "watch": "Correlation shows a link, not a cause.",
    "see": [
      "scatter-graph",
      "line-of-best-fit"
    ]
  },
  {
    "id": "line-of-best-fit",
    "term": "Line of best fit",
    "strand": "s",
    "level": "F",
    "def": "A straight line drawn through the middle of the points on a scatter graph, with about as many points above it as below.",
    "example": "Draw it with a ruler, then read across from an x-value to estimate the y-value.",
    "watch": "It need not go through the origin. Estimates far outside the data (extrapolation) are unreliable.",
    "flip": "You can read a y-value from an x-value, or an x-value from a y-value.",
    "see": [
      "scatter-graph",
      "correlation"
    ]
  },
  {
    "id": "class-midpoint",
    "term": "Class midpoint",
    "strand": "s",
    "level": "H",
    "def": "The value halfway between the two ends of a class in a grouped table. It is used as the value for everything in that class when estimating the mean.",
    "example": "The class 10 &lt; t &le; 20 has midpoint (10 + 20) &divide; 2 = 15.",
    "watch": "Using midpoints gives only an estimate of the mean, not the exact mean.",
    "flip": "Estimated mean = sum of (frequency &times; midpoint) &divide; sum of frequencies.",
    "see": [
      "mean",
      "modal-class"
    ]
  },
  {
    "id": "modal-class",
    "term": "Modal class",
    "strand": "s",
    "level": "H",
    "def": "In a grouped table, the class with the biggest frequency.",
    "example": "If the class 10 &lt; t &le; 20 has the biggest frequency, it is the modal class.",
    "watch": "Give the class, not the frequency.",
    "see": [
      "mode",
      "class-midpoint"
    ]
  },
  {
    "id": "term-to-term-rule",
    "term": "Term-to-term rule",
    "strand": "a",
    "level": "F",
    "def": "A rule that tells you how to get from one term of a sequence to the next.",
    "example": "3, 7, 11, 15 &hellip; has the term-to-term rule \"add 4\".",
    "watch": "It is slow for a term far along the sequence. The nth term jumps straight there.",
    "flip": "From the terms to the rule: find the gap between neighbouring terms.",
    "see": [
      "sequence",
      "nth-term",
      "common-difference"
    ]
  },
  {
    "id": "position-to-term-rule",
    "term": "Position-to-term rule",
    "strand": "a",
    "level": "F",
    "def": "Another name for the nth term: a formula that gives a term of a sequence from its position n.",
    "example": "For 5, 8, 11, 14 &hellip; the position-to-term rule is 3n + 2. Put n = 10 to get the 10th term, 32.",
    "flip": "From the rule to a term: put in n. From the terms to the rule: use the common difference.",
    "see": [
      "nth-term",
      "term-to-term-rule"
    ]
  },
  {
    "id": "common-difference",
    "term": "Common difference",
    "strand": "a",
    "level": "F",
    "def": "The amount a linear sequence goes up or down by each time. It is also the number in front of n in the nth term.",
    "example": "20, 17, 14, 11 &hellip; has common difference &minus;3.",
    "watch": "If the terms go down, the common difference is negative.",
    "flip": "Given the common difference and the first term, write the sequence or its nth term.",
    "see": [
      "linear-sequence",
      "term-to-term-rule",
      "nth-term"
    ]
  },
  {
    "id": "linear-sequence",
    "term": "Linear sequence",
    "strand": "a",
    "level": "F",
    "def": "A sequence that goes up or down by the same amount each time. Its nth term has the form an + b.",
    "example": "4, 7, 10, 13 &hellip; goes up by 3, and its nth term is 3n + 1.",
    "watch": "If the gaps themselves change, it is not linear. Check the gaps first.",
    "flip": "Find the nth term from the terms: the gap is a, then fix the start to find b.",
    "see": [
      "common-difference",
      "nth-term",
      "quadratic-sequence"
    ]
  },
  {
    "id": "geometric-sequence",
    "term": "Geometric sequence",
    "strand": "a",
    "level": "F",
    "def": "A sequence where each term is the one before multiplied by the same number.",
    "example": "2, 6, 18, 54 &hellip; multiplies by 3. 80, 40, 20, 10 &hellip; multiplies by {frac:1/2}.",
    "watch": "The gaps are not equal. Divide neighbouring terms to find the multiplier.",
    "flip": "Going back along the sequence means dividing by the multiplier.",
    "see": [
      "sequence",
      "fibonacci-sequence",
      "multiplier"
    ]
  },
  {
    "id": "fibonacci-sequence",
    "term": "Fibonacci-type sequence",
    "strand": "a",
    "level": "F",
    "def": "A sequence where each term is the sum of the two terms before it.",
    "example": "1, 1, 2, 3, 5, 8, 13 &hellip; Another one starts 4, 5: 4, 5, 9, 14, 23 &hellip;",
    "watch": "You need to be told the first two terms.",
    "flip": "Going backwards, subtract: each term is the next one minus the one before.",
    "see": [
      "sequence",
      "geometric-sequence"
    ]
  },
  {
    "id": "coordinates",
    "term": "Coordinates",
    "strand": "a",
    "level": "F",
    "def": "A pair of numbers (x, y) that says where a point is on a grid: x is how far along, y is how far up.",
    "example": "The point (3, 2) is 3 along and 2 up. The point (&minus;4, 3) is 4 to the left and 3 up.",
    "watch": "x always comes first. Left and down are negative.",
    "flip": "From a point on the grid to its coordinates, and from coordinates to a point.",
    "see": [
      "axis",
      "origin",
      "quadrant"
    ]
  },
  {
    "id": "axis",
    "term": "Axis (axes)",
    "strand": "a",
    "level": "F",
    "def": "One of the two number lines on a graph. The x-axis goes across and the y-axis goes up.",
    "example": "On a cost graph, hours might go along the x-axis and pounds up the y-axis.",
    "watch": "Axes is the plural of axis.",
    "see": [
      "origin",
      "coordinates"
    ]
  },
  {
    "id": "origin",
    "term": "Origin",
    "strand": "a",
    "level": "F",
    "def": "The point (0, 0) where the x-axis and the y-axis cross.",
    "example": "The point (0, 5) is 5 above the origin.",
    "see": [
      "axis",
      "coordinates"
    ]
  },
  {
    "id": "quadrant",
    "term": "Quadrant",
    "strand": "a",
    "level": "F",
    "def": "One of the four regions the axes cut a grid into, numbered 1 to 4 anticlockwise from the top right.",
    "example": "(&minus;3, 6) is in quadrant 2 (top left), because x is negative and y is positive.",
    "watch": "The numbering goes anticlockwise, not left to right.",
    "see": [
      "coordinates",
      "axis"
    ]
  },
  {
    "id": "midpoint",
    "term": "Midpoint",
    "strand": "a",
    "level": "F",
    "def": "The point exactly halfway along a line segment. Add the x-coordinates and halve, and do the same for y.",
    "example": "The midpoint of (2, 4) and (8, 10) is ((2 + 8) &divide; 2, (4 + 10) &divide; 2) = (5, 7).",
    "watch": "Halve the totals. Do not give the gap between the points.",
    "flip": "Given the midpoint and one end, go the same step again to find the other end.",
    "see": [
      "coordinates",
      "gradient"
    ]
  },
  {
    "id": "gradient",
    "term": "Gradient",
    "strand": "a",
    "level": "F",
    "def": "How steep a line is: rise divided by run. A line that goes up to the right has a positive gradient, and one that goes down has a negative gradient.",
    "example": "A line through (1, 2) and (4, 11) rises 9 over a run of 3, so its gradient is 9 &divide; 3 = 3.",
    "watch": "It is rise &divide; run, not run &divide; rise. Check the sign against the picture.",
    "flip": "Given the gradient and a point, you can draw or write the line.",
    "see": [
      "y-intercept",
      "parallel",
      "perpendicular"
    ]
  },
  {
    "id": "y-intercept",
    "term": "y-intercept",
    "strand": "a",
    "level": "F",
    "def": "The value of y where a line crosses the y-axis (where x = 0). In y = mx + c it is c.",
    "example": "The line y = 3x &minus; 2 crosses the y-axis at (0, &minus;2), so its y-intercept is &minus;2.",
    "watch": "It is where the line meets the y-axis, not the x-axis.",
    "flip": "To find where a line crosses the x-axis, put y = 0 instead.",
    "see": [
      "gradient",
      "coordinates"
    ]
  },
  {
    "id": "base",
    "term": "Base (of a power)",
    "strand": "n",
    "level": "F",
    "def": "The number that is multiplied by itself in a power. In 5 to the power 3, the base is 5 and the index is 3.",
    "example": "5<sup>3</sup> = 5 &times; 5 &times; 5 = 125. The base is 5.",
    "watch": "The laws of indices only combine powers that have the same base.",
    "see": [
      "power",
      "indices-laws"
    ]
  },
  {
    "id": "standard-form",
    "term": "Standard form",
    "strand": "n",
    "level": "F",
    "def": "A way to write very big or very small numbers as a number from 1 up to (but not including) 10, times a power of 10.",
    "example": [
      "4 500 000 = 4.5 &times; 10<sup>6</sup>",
      "0.00072 = 7.2 &times; 10<sup>&minus;4</sup>"
    ],
    "watch": "45 &times; 10<sup>3</sup> is not in standard form, because 45 is not less than 10.",
    "flip": "Move the decimal point the other way to change standard form back into an ordinary number.",
    "see": [
      "power",
      "indices-laws",
      "place-value"
    ]
  },
  {
    "id": "metric-prefix",
    "term": "Metric prefix",
    "strand": "n",
    "level": "F",
    "def": "A short word or letter in front of a unit that stands for a power of 10, such as kilo (k), mega (M) and milli (m).",
    "example": [
      "kilo (k) = 10<sup>3</sup>, so 1 kW = 1000 W",
      "milli (m) = 10<sup>&minus;3</sup>, so 1 mA = 0.001 A"
    ],
    "flip": "To change to a bigger unit divide by the power of 10, and to a smaller unit multiply.",
    "see": [
      "standard-form",
      "power"
    ]
  },
];
