// A-level glossary: sequences, series and the binomial expansion. Entry format: see the header of ../glossary.mjs.
// Every term in this file has strand 'al-sequences'.
//
// {m:...} cannot draw nCr, so the one place that needs it uses this small piece of MathML (the same markup {m:...} produces).
const sym = (v) => (/^\d+$/.test(String(v)) ? `<mn>${v}</mn>` : `<mi>${v}</mi>`);
const nCr = (n, r) => `<math alttext="${n}C${r}"><mmultiscripts><mi>C</mi>${sym(r)}<none/><mprescripts/><none/>${sym(n)}</mmultiscripts></math>`;

export const TERMS = [
  // ---------- Binomial expansion (Year 1, then Year 2) ----------
  {
    id: 'factorial', term: 'Factorial, n!', strand: 'al-sequences', level: 'Y1',
    def: 'The product of all the whole numbers from n down to 1, written n! and read "n factorial". By agreement, 0! is 1.',
    example: [
      '{m:5! = 5*4*3*2*1 = 120}.',
      'Cancel before you multiply: {m:frac(7!, 5!) = 7*6 = 42}.',
    ],
    watch: '{m:(2n)!} is not {m:2 * n!}. Factorials grow very fast: {m:10! = 3628800}.',
    flip: 'n! counts the ways to put n different things in a line.',
    see: ['ncr', 'pascals-triangle'],
  },
  {
    id: 'ncr', term: 'nCr (binomial coefficient)', strand: 'al-sequences', level: 'Y1', aka: ['binomial coefficient', 'n choose r', 'combination'],
    def: 'The number of ways to choose r things from n, written nCr and read "n choose r". It equals n! divided by the product of r! and (n - r)!.',
    example: [
      'The formula is nCr = {m:frac(n!, r!(n - r)!)}.',
      'For example, ' + nCr(5, 2) + ' = {m:frac(5!, 2!3!) = frac(120, 12) = 10}.',
      'Your calculator has an nCr button.',
    ],
    watch: 'nCr is the same as nC(n - r), so ' + nCr(5, 2) + ' = ' + nCr(5, 3) + '. Also ' + nCr('n', 0) + ' = ' + nCr('n', 'n') + ' = 1. You need r to be no bigger than n.',
    flip: 'The values of nCr are the numbers in row n of {term:pascals-triangle|Pascal\u2019s triangle}.',
    see: ['factorial', 'pascals-triangle', 'binomial-expansion'],
  },
  {
    id: 'pascals-triangle', term: 'Pascal&rsquo;s triangle', strand: 'al-sequences', level: 'Y1',
    def: 'A triangle of numbers in which each number is the sum of the two above it. Row n gives the binomial coefficients for a power n.',
    example: [
      'Rows 0 to 5: 1 / 1 1 / 1 2 1 / 1 3 3 1 / 1 4 6 4 1 / 1 5 10 10 5 1.',
      'Row 4 gives {m:(a + b)^4 = a^4 + 4a^3 b + 6a^2 b^2 + 4a b^3 + b^4}.',
    ],
    watch: 'The top row, a single 1, is row 0. Row n goes with the power n. Pascal\u2019s triangle is quick for small n. For large n use {term:ncr|nCr}.',
    see: ['ncr', 'binomial-expansion'],
  },
  {
    id: 'binomial-expansion', term: 'Binomial expansion', strand: 'al-sequences', level: 'Y1', aka: ['binomial theorem'],
    def: 'Writing (a + b) to a whole-number power n as a sum of n + 1 terms, using the binomial coefficients nCr.',
    example: [
      '{m:(1 + 2x)^3 = 1 + 3(2x) + 3(2x)^2 + (2x)^3 = 1 + 6x + 12x^2 + 8x^3}.',
      'The term in {m:a^(n - r) b^r} is ' + nCr('n', 'r') + ' {m:a^(n - r) b^r}.',
    ],
    watch: 'Put brackets round the whole second term: {m:(2x)^2 = 4x^2}, not {m:2x^2}. In {m:(a - b)^n} the signs alternate. There are always n + 1 terms.',
    flip: 'The coefficients in a binomial expansion are the numbers in {term:pascals-triangle|Pascal\u2019s triangle}.',
    see: ['ncr', 'pascals-triangle', 'ascending-powers', 'binomial-expansion-rational'],
  },
  {
    id: 'ascending-powers', term: 'Ascending powers', strand: 'al-sequences', level: 'Y1',
    def: 'Written with the lowest power of x first: the constant term, then x, then x squared, and so on.',
    example: '{m:1 + 6x + 12x^2 + 8x^3} is in ascending powers of x.',
    watch: '"The first three terms in ascending powers of x" means the three terms with the lowest powers. For {m:(2 + x)^5}, the first term is {m:2^5 = 32}, then comes the term in x.',
    see: ['binomial-expansion'],
  },
  {
    id: 'binomial-expansion-rational', term: 'Binomial expansion for any rational power', strand: 'al-sequences', level: 'Y2', aka: ['binomial series', 'negative power expansion', 'fractional power expansion'],
    def: 'The expansion of (1 + x) to a power n that is negative or a fraction. It goes on forever and is only valid for some values of x.',
    example: [
      '{m:(1 + x)^n = 1 + nx + frac(n(n - 1), 2!) x^2 + frac(n(n - 1)(n - 2), 3!) x^3} &hellip;',
      '{m:(1 + x)^(-1) = 1 - x + x^2 - x^3} &hellip; for {m:abs(x) < 1}.',
      '{m:(1 + x)^(1/2) = 1 + frac(1, 2) x - frac(1, 8) x^2} &hellip; for {m:abs(x) < 1}.',
      'For {m:(a + bx)^n}, take out {m:a^n} first: {m:a^n (1 + frac(b, a) x)^n}.',
    ],
    watch: 'The expansion does not stop, so it is only an approximation if you keep a few terms. For a whole-number power n it stops at the term in {m:x^n} and is true for every x. If the bracket is {m:(a + bx)^n} with a not 1, you must factor out {m:a^n} before using the formula.',
    see: ['binomial-expansion', 'binomial-validity'],
  },
  {
    id: 'binomial-validity', term: 'Range of validity', strand: 'al-sequences', level: 'Y2', aka: ['valid for', 'validity of an expansion'],
    def: 'The values of x for which an infinite expansion gives the true value of the function. For (1 + x) to a power that is not a positive whole number, it is |x| < 1.',
    example: [
      '{m:(1 + 2x)^(-3)} is valid when {m:abs(2x) < 1}, so when {m:abs(x) < frac(1, 2)}.',
      '{m:abs(x) < frac(1, 2)} means {m:-frac(1, 2) < x < frac(1, 2)}.',
    ],
    watch: 'Put the whole of the term you are expanding inside the modulus. For {m:(2 + x)^(-1) = frac(1, 2)(1 + frac(x, 2))^(-1)}, the condition is {m:abs(frac(x, 2)) < 1}, so {m:abs(x) < 2}, not {m:abs(x) < 1}.',
    see: ['binomial-expansion-rational'],
  },

  // ---------- Sequences and recurrence (Year 2) ----------
  {
    id: 'sequence', term: 'Sequence', strand: 'al-sequences', level: 'Y2',
    def: 'A list of numbers in a fixed order that follows a rule.',
    example: '3, 7, 11, 15 &hellip; (add 4 each time). 1, 2, 4, 8 &hellip; (double each time).',
    watch: 'Order matters. 1, 2, 3 and 3, 2, 1 are different sequences. A sequence may stop (it is finite) or go on forever (it is infinite).',
    see: ['sequence-term', 'nth-term', 'term-to-term-rule', 'series'],
  },
  {
    id: 'sequence-term', term: 'Term of a sequence', strand: 'al-sequences', level: 'Y2',
    def: 'One number in a sequence. The first term is the number in position 1, the second term is in position 2, and so on.',
    example: 'In 3, 7, 11, 15 &hellip; the first term is 3 and the third term is 11.',
    watch: 'Count the first term as position 1, not 0, unless the question says otherwise.',
    see: ['sequence', 'sequence-notation'],
  },
  {
    id: 'sequence-notation', term: 'Sequence notation, u_n', strand: 'al-sequences', level: 'Y2', aka: ['u n', 'a n', 'subscript notation'],
    def: 'The letter u with a small n below it means the term in position n. The next term is u with n + 1 below it. Some books use a or x instead of u.',
    example: [
      'In 3, 7, 11, 15 &hellip;: {m:u_1 = 3} and {m:u_3 = 11}.',
      '{m:u_(n + 1)} is the term after {m:u_n}.',
    ],
    watch: '{m:u_(n + 1)} is the next term. It is not {m:u_n + 1}, which is one more than the term {m:u_n}.',
    see: ['sequence-term', 'nth-term', 'recurrence-relation'],
  },
  {
    id: 'nth-term', term: 'nth term (position-to-term rule)', strand: 'al-sequences', level: 'Y2', aka: ['general term', 'position to term'],
    def: 'A formula that gives any term of a sequence straight from its position n.',
    example: [
      '{m:u_n = 2n + 1} gives {m:u_1 = 3}, {m:u_2 = 5}, {m:u_3 = 7} &hellip;',
      'The 10th term is {m:u_10 = 2*10 + 1 = 21}.',
    ],
    watch: 'Substitute the position n, not the value of the term. To check a formula, test it on the first two terms.',
    flip: 'A {term:term-to-term-rule|term-to-term rule} gets one term from the one before. The nth term formula jumps straight to any term.',
    see: ['term-to-term-rule', 'arithmetic-sequence', 'geometric-sequence'],
  },
  {
    id: 'term-to-term-rule', term: 'Term-to-term rule', strand: 'al-sequences', level: 'Y2',
    def: 'A rule that gives each term from the term before it.',
    example: 'Start at 3 and use "double and add 1": 3, 7, 15, 31 &hellip;',
    watch: 'You need a starting term as well as the rule. The same rule with a different start gives a different sequence.',
    flip: 'Written with symbols, a term-to-term rule is a {term:recurrence-relation}.',
    see: ['recurrence-relation', 'nth-term'],
  },
  {
    id: 'recurrence-relation', term: 'Recurrence relation', strand: 'al-sequences', level: 'Y2', aka: ['iteration formula', 'recursive formula'],
    def: 'An equation that gives each term of a sequence in terms of the one before it, together with the starting value.',
    example: [
      '{m:u_(n + 1) = 2u_n + 1}, {m:u_1 = 3}.',
      'Then {m:u_2 = 2*3 + 1 = 7}, {m:u_3 = 2*7 + 1 = 15}, {m:u_4 = 31}.',
    ],
    watch: 'Without the starting value the relation does not give one sequence. Work through the terms in order; you cannot skip to {m:u_10} without finding the ones before it.',
    flip: 'Some recurrence relations settle on a limit. Put L for both {m:u_n} and {m:u_(n + 1)} to find it.',
    see: ['term-to-term-rule', 'limit-of-a-sequence', 'sequence-notation'],
  },
  {
    id: 'increasing-sequence', term: 'Increasing sequence', strand: 'al-sequences', level: 'Y2',
    def: 'A sequence in which every term is bigger than the one before it.',
    example: '2, 5, 8, 11 &hellip; is increasing. {m:u_n = frac(n, n + 1)} gives {m:frac(1, 2), frac(2, 3), frac(3, 4)} &hellip;, which is also increasing.',
    watch: 'Increasing does not mean the terms go on to infinity. The second example never gets above 1. To prove a sequence is increasing, show that {m:u_(n + 1) - u_n > 0} for every n.',
    flip: 'In a decreasing sequence every term is smaller than the one before.',
    see: ['decreasing-sequence', 'convergent'],
  },
  {
    id: 'decreasing-sequence', term: 'Decreasing sequence', strand: 'al-sequences', level: 'Y2',
    def: 'A sequence in which every term is smaller than the one before it.',
    example: '20, 17, 14, 11 &hellip; is decreasing. 1, {m:frac(1, 2)}, {m:frac(1, 4)} &hellip; is also decreasing.',
    watch: 'A sequence of negative numbers can be decreasing even though the terms look bigger in size: {m:-1, -3, -9} &hellip;',
    flip: 'In an increasing sequence every term is bigger than the one before.',
    see: ['increasing-sequence'],
  },
  {
    id: 'periodic-sequence', term: 'Periodic sequence', strand: 'al-sequences', level: 'Y2', aka: ['order of a sequence', 'cycle'],
    def: 'A sequence that repeats the same block of terms again and again. The number of terms in one block is the period (or order).',
    example: [
      '1, 3, 2, 1, 3, 2, 1, 3, 2 &hellip; has period 3. In symbols, {m:u_(n + 3) = u_n}.',
      'To find {m:u_100}: {m:100 = 3*33 + 1}, so the 100th term matches the 1st term, which is 1.',
      '{m:u_n = sin(90n deg)} gives 1, 0, &minus;1, 0, 1, 0 &hellip; with period 4.',
    ],
    watch: 'Divide the position by the period and look at the remainder. A remainder of 0 means the last term of the block, not the first.',
    see: ['recurrence-relation', 'oscillating-sequence'],
  },
  {
    id: 'oscillating-sequence', term: 'Oscillating sequence', strand: 'al-sequences', level: 'Y2',
    def: 'A sequence whose terms keep going up and then down (or the reverse) instead of moving in one direction.',
    example: '{m:u_n = (-1)^n} gives &minus;1, 1, &minus;1, 1 &hellip; {m:u_n = (-frac(1, 2))^n} gives {m:-frac(1, 2), frac(1, 4), -frac(1, 8)} &hellip;',
    watch: 'An oscillating sequence may still settle on a limit. The second example gets closer and closer to 0. The first example does not settle.',
    see: ['periodic-sequence', 'convergent', 'divergent'],
  },
  {
    id: 'limit-of-a-sequence', term: 'Limit of a sequence', strand: 'al-sequences', level: 'Y2', aka: ['tends to', 'limit'],
    def: 'The value that the terms of a sequence get closer to, as close as you like, as n gets bigger.',
    example: [
      '{m:u_n = 3 + frac(4, n)} gives 7, 5, 4.33 &hellip; The terms get closer to 3, so the limit is 3.',
      '{m:u_(n + 1) = frac(u_n, 2) + 3}: if there is a limit L, then {m:L = frac(L, 2) + 3}, so {m:L = 6}.',
    ],
    watch: 'The terms need not ever reach the limit. Only use "put L for {m:u_n} and {m:u_(n + 1)}" when the sequence does converge. For this rule it does, because each step halves the distance to 6.',
    see: ['convergent', 'recurrence-relation'],
  },
  {
    id: 'convergent', term: 'Convergent', strand: 'al-sequences', level: 'Y2', aka: ['converges', 'convergence'],
    def: 'A sequence or series that settles on one fixed value. The terms of a sequence get closer to a limit, or the sums of a series get closer to one number.',
    example: [
      'The sequence 1, {m:frac(1, 2)}, {m:frac(1, 4)}, {m:frac(1, 8)} &hellip; converges to 0.',
      'The series {m:1 + frac(1, 2) + frac(1, 4) + frac(1, 8)} &hellip; converges to 2.',
    ],
    watch: 'For a series it is not enough that the terms get smaller. The series {m:1 + frac(1, 2) + frac(1, 3) + frac(1, 4)} &hellip; has terms that shrink towards 0, but its sum grows without limit.',
    flip: 'A sequence or series that does not settle is {term:divergent}.',
    see: ['divergent', 'limit-of-a-sequence', 'sum-to-infinity'],
  },
  {
    id: 'divergent', term: 'Divergent', strand: 'al-sequences', level: 'Y2', aka: ['diverges', 'divergence'],
    def: 'A sequence or series that does not settle on one fixed value. It may grow without limit or keep jumping about.',
    example: [
      '2, 4, 8, 16 &hellip; grows without limit.',
      '1, &minus;1, 1, &minus;1 &hellip; stays small but never settles, so it is divergent too.',
      'The series {m:1 + 2 + 4 + 8} &hellip; is divergent.',
    ],
    watch: 'Divergent does not always mean "goes to infinity". A sequence that jumps between two values also diverges.',
    flip: 'A sequence or series that settles is {term:convergent}.',
    see: ['convergent', 'oscillating-sequence'],
  },

  // ---------- Series and sigma (Year 2) ----------
  {
    id: 'series', term: 'Series', strand: 'al-sequences', level: 'Y2',
    def: 'The sum of the terms of a sequence.',
    example: 'The sequence 2, 4, 6, 8 gives the series {m:2 + 4 + 6 + 8 = 20}.',
    watch: 'A sequence is a list. A series is the sum of that list. In everyday speech "a series of events" means a list, not a sum.',
    see: ['sequence', 'partial-sum', 'sigma-notation'],
  },
  {
    id: 'partial-sum', term: 'Sum of the first n terms, S_n', strand: 'al-sequences', level: 'Y2', aka: ['partial sum', 'S n'],
    def: 'The total of the first n terms of a series, written with a capital S and a small n below it.',
    example: [
      'For 2, 4, 6, 8 &hellip;: {m:S_3 = 2 + 4 + 6 = 12}.',
      'Each term is the difference of two sums: {m:u_n = S_n - S_(n - 1)}. Here {m:u_3 = S_3 - S_2 = 12 - 6 = 6}.',
    ],
    watch: '{m:S_n} is a total. {m:u_n} is one term. They are different numbers.',
    see: ['series', 'arithmetic-series', 'geometric-series'],
  },
  {
    id: 'sigma-notation', term: 'Sigma notation', strand: 'al-sequences', level: 'Y2', aka: ['summation notation', 'capital sigma'],
    def: 'The Greek capital letter sigma means "add up". The numbers below and above it say where to start and where to stop, and the expression after it says what to add.',
    example: [
      '{m:sum(r=1, 4) 2r = 2 + 4 + 6 + 8 = 20}. Read it as "the sum of 2r for r from 1 to 4".',
      '{m:sum(r=3, 6) r^2 = 9 + 16 + 25 + 36 = 86}.',
    ],
    watch: 'The number of terms is the top minus the bottom, plus 1. The letter r is only a counter. A constant counts too: {m:sum(r=1, 4) 5 = 5 + 5 + 5 + 5 = 20}, which is {m:5*4}.',
    see: ['series', 'partial-sum'],
  },

  // ---------- Arithmetic (Year 2) ----------
  {
    id: 'arithmetic-sequence', term: 'Arithmetic sequence', strand: 'al-sequences', level: 'Y2', aka: ['arithmetic progression', 'AP'],
    def: 'A sequence in which you add the same number each time to get the next term.',
    example: [
      '3, 7, 11, 15 &hellip; adds 4 each time.',
      'The nth term is {m:u_n = a + (n - 1)d}, where a is the first term and d is the common difference. Here {m:u_n = 3 + 4(n - 1) = 4n - 1}.',
    ],
    watch: 'It is {m:(n - 1)d}, not {m:nd}. There is one fewer step than the position number. Check with n = 1: you must get a.',
    flip: 'A sequence is arithmetic if the difference between each term and the one before is the same number.',
    see: ['common-difference', 'arithmetic-series'],
  },
  {
    id: 'common-difference', term: 'Common difference', strand: 'al-sequences', level: 'Y2',
    def: 'The fixed number added each time in an arithmetic sequence, written d. It can be negative.',
    example: '20, 17, 14, 11 &hellip; has {m:d = 17 - 20 = -3}.',
    watch: 'Take a term minus the one before it: {m:u_2 - u_1}. The other way round gives the wrong sign.',
    see: ['arithmetic-sequence', 'common-ratio'],
  },
  {
    id: 'arithmetic-series', term: 'Arithmetic series', strand: 'al-sequences', level: 'Y2',
    def: 'The sum of the terms of an arithmetic sequence.',
    example: [
      'The sum of the first n terms is {m:S_n = frac(n, 2)(2a + (n - 1)d)}, or {m:S_n = frac(n, 2)(a + l)}, where l is the last term.',
      '{m:3 + 7 + 11 + 15 + 19}: n = 5, so {m:S_5 = frac(5, 2)(3 + 19) = 55}.',
      'The sum 1 + 2 + &hellip; + 100 is {m:frac(100, 2)(1 + 100) = 5050}.',
    ],
    watch: 'Use the right n. If a question gives the last term, work out how many terms there are first: {m:n = frac(l - a, d) + 1}.',
    flip: 'Why it works: write the sum forwards and backwards and add. Every pair totals {m:a + l}, and there are n pairs, which is {m:2S_n}.',
    see: ['arithmetic-sequence', 'partial-sum', 'sigma-notation'],
  },

  // ---------- Geometric (Year 2) ----------
  {
    id: 'geometric-sequence', term: 'Geometric sequence', strand: 'al-sequences', level: 'Y2', aka: ['geometric progression', 'GP'],
    def: 'A sequence in which you multiply by the same number each time to get the next term.',
    example: [
      '3, 6, 12, 24 &hellip; multiplies by 2 each time.',
      'The nth term is {m:u_n = a r^(n - 1)}, where a is the first term and r is the common ratio. Here {m:u_n = 3*2^(n - 1)}, so {m:u_4 = 3*8 = 24}.',
    ],
    watch: 'The power is {m:n - 1}, not n. It is only r that is raised to the power: {m:a r^(n - 1)} is not {m:(ar)^(n - 1)}.',
    flip: 'A sequence is geometric if each term divided by the one before gives the same number.',
    see: ['common-ratio', 'geometric-series'],
  },
  {
    id: 'common-ratio', term: 'Common ratio', strand: 'al-sequences', level: 'Y2',
    def: 'The fixed number you multiply by each time in a geometric sequence, written r. It can be a fraction or negative.',
    example: '81, 27, 9, 3 &hellip; has {m:r = frac(27, 81) = frac(1, 3)}. 5, &minus;10, 20 &hellip; has {m:r = -2}.',
    watch: 'Divide a term by the one before it. Subtracting finds the common difference instead.',
    see: ['geometric-sequence', 'common-difference', 'sum-to-infinity'],
  },
  {
    id: 'geometric-series', term: 'Geometric series', strand: 'al-sequences', level: 'Y2',
    def: 'The sum of the terms of a geometric sequence.',
    example: [
      'The sum of the first n terms is {m:S_n = frac(a(1 - r^n), 1 - r)}, which equals {m:frac(a(r^n - 1), r - 1)}.',
      '{m:3 + 6 + 12 + 24 + 48}: {m:a = 3}, {m:r = 2}, {m:n = 5}, so {m:S_5 = frac(3(2^5 - 1), 2 - 1) = 93}.',
    ],
    watch: 'The formula fails when {m:r = 1}, because it divides by 0. Then every term is a, so {m:S_n = na}. Use the form with {m:r^n - 1} on top when {m:r > 1}: it keeps the numbers positive.',
    flip: 'Why it works: take {m:S_n} and {m:rS_n}, subtract, and nearly every term cancels.',
    see: ['geometric-sequence', 'sum-to-infinity', 'partial-sum'],
  },
  {
    id: 'sum-to-infinity', term: 'Sum to infinity', strand: 'al-sequences', level: 'Y2', aka: ['infinite geometric series', 'S infinity'],
    def: 'The number that the sum of a geometric series settles on when you keep adding terms forever. It exists only when r is between -1 and 1.',
    example: [
      '{m:S_(infinity) = frac(a, 1 - r)} for {m:abs(r) < 1}.',
      '{m:1 + frac(1, 2) + frac(1, 4)} &hellip; has {m:a = 1}, {m:r = frac(1, 2)}, so {m:S_(infinity) = frac(1, 1/2) = 2}.',
      '{m:8 - 4 + 2 - 1} &hellip; has {m:r = -frac(1, 2)}, so {m:S_(infinity) = frac(8, 3/2) = frac(16, 3)}.',
    ],
    watch: 'Check that {m:abs(r) < 1} first. If it is not, the series is divergent and has no sum to infinity. The word infinity does not mean the answer is infinite: it means you add infinitely many terms.',
    flip: 'Why it works: as n grows, {m:r^n} shrinks to 0 when {m:abs(r) < 1}, so {m:S_n} gets closer to {m:frac(a, 1 - r)}.',
    see: ['geometric-series', 'convergent', 'common-ratio'],
  },
];
