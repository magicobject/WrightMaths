// A-level glossary: vectors in two and three dimensions. Entry format: see the header of ../glossary.mjs.
// Every term in this file has strand 'al-vectors'.
//
// {m:...} cannot draw a column of numbers, so col() makes one (the same markup {m:...} produces): col(3, -2) is a column with 3 over -2.
const entry = (x) => {
  const s = String(x);
  if (/^-\d/.test(s)) return `<mo>&minus;</mo><mn>${s.slice(1)}</mn>`;
  return /^\d/.test(s) ? `<mn>${s}</mn>` : `<mi>${s}</mi>`;
};
const col = (...v) => `<math alttext="column vector (${v.join(', ')})"><mrow><mo>(</mo><mtable>${v.map((x) => `<mtr><mtd>${entry(x)}</mtd></mtr>`).join('')}</mtable><mo>)</mo></mrow></math>`;

export const TERMS = [
  // ---------- Vectors in two dimensions (Year 1) ----------
  {
    id: 'vector', term: 'Vector', strand: 'al-vectors', level: 'Y1',
    def: 'A quantity that has both a size and a direction. It is drawn as an arrow: the length shows the size and the arrow points the way.',
    example: 'A move of 3 across and 2 up is a vector. So is a displacement of 5 km due north.',
    watch: 'Two vectors are equal when they have the same size and the same direction. Where the arrow is drawn does not matter.',
    flip: 'A {term:scalar} has size only.',
    see: ['scalar', 'column-vector', 'vector-notation', 'magnitude'],
  },
  {
    id: 'scalar', term: 'Scalar', strand: 'al-vectors', level: 'Y1',
    def: 'A quantity with size only and no direction: an ordinary number.',
    example: 'The numbers 5, &minus;2 and 0.5 are scalars. So is a speed of 20 metres per second.',
    watch: 'Speed is a scalar. Velocity is a vector, because it has a direction too. A scalar multiplies a vector, as in {m:3a}.',
    flip: 'A {term:vector} has size and direction.',
    see: ['vector', 'scalar-multiple'],
  },
  {
    id: 'vector-notation', term: 'Vector notation', strand: 'al-vectors', level: 'Y1', aka: ['bold', 'underline', 'arrow notation'],
    def: 'Ways of writing a vector: a bold letter in print, a letter underlined by hand, or two letters with an arrow over them to show the start and end.',
    example: [
      'In print, a bold a. By hand, a underlined.',
      '{m:vec(AB)} is the vector that goes from A to B.',
    ],
    watch: 'The order of the letters matters. {m:vec(AB)} goes from A to B. {m:vec(BA)} goes the other way, so {m:vec(BA) = -vec(AB)}.',
    see: ['vector', 'negative-vector', 'position-vector'],
  },
  {
    id: 'column-vector', term: 'Column vector', strand: 'al-vectors', level: 'Y1',
    def: 'A vector written as numbers in a column inside brackets. The top number is the move across (in the x direction) and the bottom number is the move up (in the y direction).',
    example: [
      col(3, 2) + ' means 3 across and 2 up.',
      col(-1, 4) + ' means 1 to the left and 4 up.',
      'A vector in three dimensions has three numbers: ' + col(2, -3, 5) + '.',
    ],
    watch: 'A column vector is a move, not a place. It is not a fraction and it is not the point (3, 2). The point (3, 2) is where you end up if you start at the origin.',
    see: ['component', 'i-j-notation', 'position-vector'],
  },
  {
    id: 'component', term: 'Component', strand: 'al-vectors', level: 'Y1', aka: ['components', 'resolve'],
    def: 'One of the numbers that make up a vector: how far it goes along each axis.',
    example: [
      'The vector ' + col(3, -2) + ' has x-component 3 and y-component {m:-2}.',
      'A vector of magnitude 10 at {m:30deg} above the x-axis has components {m:10 cos 30deg = 8.66} across and {m:10 sin 30deg = 5} up.',
    ],
    watch: 'Components can be negative. A negative x-component means the vector points to the left.',
    flip: 'Putting the components back together with Pythagoras gives the {term:magnitude}.',
    see: ['column-vector', 'magnitude', 'direction-of-a-vector'],
  },
  {
    id: 'i-j-notation', term: 'i and j notation', strand: 'al-vectors', level: 'Y1', aka: ['unit vectors i and j', 'base vectors'],
    def: 'A way of writing vectors using two special vectors: i, which is 1 across, and j, which is 1 up. Every two-dimensional vector is a number of i plus a number of j.',
    example: [
      'i is ' + col(1, 0) + ' and j is ' + col(0, 1) + '.',
      col(3, -2) + ' = 3i &minus; 2j.',
    ],
    watch: 'Here i is a vector, not the square root of &minus;1 and not a counting number. The letters are written in bold in print. Do not drop the letter: write 3i &minus; 2j, not 3 &minus; 2.',
    see: ['column-vector', 'unit-vector', 'ijk-notation'],
  },
  {
    id: 'unit-vector', term: 'Unit vector', strand: 'al-vectors', level: 'Y1', aka: ['hat', 'a hat', 'vector of length 1'],
    def: 'A vector with magnitude 1. The unit vector in the direction of a is a divided by its magnitude, and is written with a small hat over the letter.',
    example: [
      'For {m:a = 3i + 4j}: {m:abs(a) = 5}, so {m:hat(a) = frac(3i + 4j, 5) = 0.6i + 0.8j}.',
      'Check: {m:sqrt(0.6^2 + 0.8^2) = 1}.',
    ],
    watch: 'i and j are unit vectors, but they are not the only ones. Any direction has a unit vector.',
    flip: 'Every vector is its magnitude times the unit vector in its direction: {m:a = abs(a) hat(a)}.',
    see: ['magnitude', 'i-j-notation', 'scalar-multiple'],
  },
  {
    id: 'magnitude', term: 'Magnitude', strand: 'al-vectors', level: 'Y1', aka: ['modulus of a vector', 'length of a vector', 'size'],
    def: 'The size, or length, of a vector. It comes from Pythagoras on the components, and it is never negative.',
    example: [
      'For ' + col(3, 4) + ': {m:abs(a) = sqrt(3^2 + 4^2) = 5}.',
      'For {m:2i - 3j + 5k}: {m:sqrt(2^2 + (-3)^2 + 5^2) = sqrt(38)}.',
    ],
    watch: 'The signs disappear when you square. A magnitude is never negative. In general {m:abs(a + b)} is not {m:abs(a) + abs(b)}. They are equal only when a and b point the same way.',
    see: ['component', 'unit-vector', 'distance-in-3d'],
  },
  {
    id: 'direction-of-a-vector', term: 'Direction of a vector', strand: 'al-vectors', level: 'Y1', aka: ['angle of a vector'],
    def: 'The way a vector points, usually given as the angle it makes with the positive x-axis, measured anticlockwise.',
    example: [
      col(3, 4) + ': {m:tan theta = frac(4, 3)}, so {m:theta = 53.1deg} to 1 decimal place.',
      col(-3, -4) + ' points into the lower left. The calculator gives {m:53.1deg}. The direction is {m:180deg + 53.1deg = 233.1deg}.',
    ],
    watch: 'Sketch the vector before you use inverse tangent. The calculator cannot tell which quadrant the vector is in.',
    flip: 'Given a magnitude and a direction, the components are {m:abs(a) cos theta} across and {m:abs(a) sin theta} up.',
    see: ['component', 'magnitude'],
  },
  {
    id: 'vector-addition', term: 'Vector addition', strand: 'al-vectors', level: 'Y1', aka: ['triangle law', 'adding vectors'],
    def: 'Adding vectors by adding their components. In a drawing, put the tail of the second arrow at the head of the first: the sum goes from the start of the first to the end of the second.',
    example: [
      col(3, 1) + ' + ' + col(2, 4) + ' = ' + col(5, 5) + '.',
      'In a triangle ABC, {m:vec(AB) + vec(BC) = vec(AC)}.',
    ],
    watch: 'Adding vectors does not add the lengths unless the vectors point the same way. The order does not matter: {m:a + b = b + a}.',
    flip: 'Subtracting undoes adding.',
    see: ['resultant', 'vector-subtraction', 'negative-vector'],
  },
  {
    id: 'resultant', term: 'Resultant', strand: 'al-vectors', level: 'Y1', aka: ['resultant vector'],
    def: 'The single vector that has the same effect as two or more vectors acting together: their sum.',
    example: 'The resultant of ' + col(3, 1) + ' and ' + col(2, 4) + ' is ' + col(5, 5) + '.',
    watch: 'Find the resultant by adding components, then find its magnitude if you need the size.',
    see: ['vector-addition', 'magnitude'],
  },
  {
    id: 'vector-subtraction', term: 'Vector subtraction', strand: 'al-vectors', level: 'Y1', aka: ['subtracting vectors'],
    def: 'Subtracting one vector from another by subtracting their components. It is the same as adding the negative of the vector.',
    example: [
      col(5, 2) + ' &minus; ' + col(1, 4) + ' = ' + col(4, -2) + '.',
      'With position vectors {m:vec(AB) = b - a}: the end minus the start.',
    ],
    watch: 'The order matters. {m:b - a} is the vector from A to B. {m:a - b} is the vector from B to A. Subtract every component, not only the first.',
    see: ['vector-addition', 'negative-vector', 'position-vector'],
  },
  {
    id: 'negative-vector', term: 'Negative of a vector', strand: 'al-vectors', level: 'Y1',
    def: 'A vector with the same magnitude as a but the opposite direction, written &minus;a.',
    example: [
      'If a is ' + col(2, -3) + ', then -a is ' + col(-2, 3) + '.',
      '{m:vec(BA) = -vec(AB)}.',
    ],
    watch: 'Change the sign of every component. {m:a + (-a)} is the {term:zero-vector}.',
    see: ['vector-subtraction', 'zero-vector', 'vector-notation'],
  },
  {
    id: 'scalar-multiple', term: 'Scalar multiple', strand: 'al-vectors', level: 'Y1',
    def: 'A vector multiplied by a number. Each component is multiplied by the number. The magnitude is multiplied by the size of the number, and the direction is reversed if the number is negative.',
    example: [
      '3' + col(2, -1) + ' = ' + col(6, -3) + '.',
      '&minus;2' + col(2, -1) + ' = ' + col(-4, 2) + '. It is twice as long and points the opposite way.',
    ],
    watch: 'Multiply every component, not just the first.',
    flip: 'If two vectors are scalar multiples of each other, they are {term:parallel-vectors|parallel}.',
    see: ['scalar', 'parallel-vectors', 'unit-vector'],
  },
  {
    id: 'parallel-vectors', term: 'Parallel vectors', strand: 'al-vectors', level: 'Y1',
    def: 'Vectors that point in the same direction or in opposite directions. One is a scalar multiple of the other.',
    example: [
      col(2, 3) + ' and ' + col(6, 9) + ' are parallel, because the second is 3 times the first.',
      col(-4, -6) + ' is {m:-2} times ' + col(2, 3) + ', so it is parallel too, pointing the opposite way.',
    ],
    watch: 'Parallel vectors need not be equal and need not be the same length. Check that the components are in the same ratio. {m:2i + 3j} and {m:4i + 5j} are not parallel.',
    flip: 'If {m:a = kb} for some number k, the vectors are parallel.',
    see: ['scalar-multiple', 'collinear'],
  },
  {
    id: 'zero-vector', term: 'Zero vector', strand: 'al-vectors', level: 'Y1', aka: ['null vector'],
    def: 'The vector with no length, written as a bold 0. All its components are 0.',
    example: '{m:vec(AB) + vec(BA)} is the zero vector: you end up back where you started.',
    watch: 'It is a vector, not just the number 0. It has no direction.',
    see: ['negative-vector'],
  },
  {
    id: 'position-vector', term: 'Position vector', strand: 'al-vectors', level: 'Y1',
    def: 'The vector from the origin O to a point. Its components are the coordinates of the point.',
    example: [
      'The point A (3, -2) has position vector {m:vec(OA) = a}, which is ' + col(3, -2) + '.',
      'For any two points, {m:vec(AB) = b - a}: the end minus the start.',
      'The midpoint of AB has position vector {m:frac(a + b, 2)}.',
    ],
    watch: 'A position vector always starts at the origin. The vector {m:vec(AB)} between two points does not.',
    see: ['displacement', 'column-vector', 'dividing-in-a-ratio'],
  },
  {
    id: 'displacement', term: 'Displacement', strand: 'al-vectors', level: 'Y1',
    def: 'The vector from one position to another: the straight-line move, with its direction.',
    example: 'From A (1, 2) to B (4, 6) the displacement is ' + col(3, 4) + '. Its magnitude is 5, which is the distance in a straight line.',
    watch: 'Displacement is not the distance travelled. Walk 3 m east and then 3 m west: you travelled 6 m, but your displacement is the {term:zero-vector}.',
    see: ['position-vector', 'vector'],
  },
  {
    id: 'collinear', term: 'Collinear', strand: 'al-vectors', level: 'Y1', aka: ['on one line'],
    def: 'Lying on one straight line. Points are collinear when they are all on the same line.',
    example: [
      'Show that A (1, 1), B (3, 2) and C (7, 4) are collinear.',
      '{m:vec(AB)} = ' + col(2, 1) + ' and {m:vec(BC)} = ' + col(4, 2) + ' = {m:2 vec(AB)}.',
      'The vectors are parallel and share the point B, so A, B and C are collinear.',
    ],
    watch: 'Parallel is not enough. Two parallel vectors on different lines would not make the points collinear. Say that the vectors share a point.',
    see: ['parallel-vectors', 'vector-proof'],
  },
  {
    id: 'dividing-in-a-ratio', term: 'Point dividing a line in a ratio', strand: 'al-vectors', level: 'Y1', aka: ['section formula', 'ratio', 'position vector of a point on a line'],
    def: 'A point P on the line AB with AP : PB = m : n. Its position vector is found by moving from A the fraction m/(m + n) of the way to B.',
    example: [
      'If {m:AP : PB = m : n}, then {m:p = a + frac(m, m + n)(b - a) = frac(n a + m b, m + n)}.',
      'A (1, 2), B (7, 8), {m:AP : PB = 1 : 2}: {m:p = frac(2a + b, 3) = frac(1, 3)} ' + col(9, 12) + ' = ' + col(3, 4) + '.',
    ],
    watch: 'The part of the ratio for A goes with b, and the part for B goes with a. Check: when P is nearer A, it should be nearer a in the formula.',
    see: ['position-vector', 'collinear', 'vector-proof'],
  },
  {
    id: 'vector-proof', term: 'Vector proof', strand: 'al-vectors', level: 'Y1', aka: ['geometric proof', 'proof using vectors'],
    def: 'A proof in geometry in which you write the sides of a shape as vectors, combine them, and show that two vectors are parallel, collinear or in a given ratio.',
    example: [
      'In triangle OAB, M is the midpoint of OA and N is the midpoint of OB. Let {m:vec(OA) = a} and {m:vec(OB) = b}.',
      '{m:vec(MN) = vec(MO) + vec(ON) = -frac(1, 2)a + frac(1, 2)b = frac(1, 2)(b - a) = frac(1, 2) vec(AB)}.',
      'So MN is parallel to AB and half its length.',
    ],
    watch: 'Choose two vectors from one corner as a and b, and write every other vector in terms of them. Finish with a sentence that says what you have shown.',
    see: ['collinear', 'parallel-vectors', 'dividing-in-a-ratio', 'position-vector'],
  },

  // ---------- Vectors in three dimensions (Year 2) ----------
  {
    id: 'ijk-notation', term: 'i, j and k notation', strand: 'al-vectors', level: 'Y2', aka: ['unit vectors i j k'],
    def: 'The way of writing three-dimensional vectors using three unit vectors at right angles: i along the x-axis, j along the y-axis and k along the z-axis.',
    example: [
      '{m:2i - 3j + 5k} = ' + col(2, -3, 5) + '.',
      'Its magnitude is {m:sqrt(2^2 + (-3)^2 + 5^2) = sqrt(38)}.',
    ],
    watch: 'Include every letter, and write 0 if a component is missing. {m:3i + 2k} has a zero j-component: it is ' + col(3, 0, 2) + '.',
    see: ['i-j-notation', 'three-d-axes', 'magnitude'],
  },
  {
    id: 'three-d-axes', term: 'Three-dimensional axes', strand: 'al-vectors', level: 'Y2', aka: ['x y z axes', '3D coordinates', 'right-handed axes'],
    def: 'Three axes, x, y and z, all at right angles to each other and meeting at the origin. A point is given by three coordinates (x, y, z).',
    example: 'The point (2, 3, 4) is 2 along the x-axis, 3 along the y-axis and 4 up the z-axis. Its position vector is {m:2i + 3j + 4k}.',
    watch: 'The usual layout is right-handed: if you turn from the x-axis to the y-axis the way a screw turns, the z-axis points the way the screw goes. Drawings of 3D axes show distances at an angle, so they are not to scale.',
    see: ['ijk-notation', 'distance-in-3d', 'position-vector'],
  },
  {
    id: 'distance-in-3d', term: 'Distance in three dimensions', strand: 'al-vectors', level: 'Y2', aka: ['length of a line in 3D'],
    def: 'The distance between two points in space. It is the square root of the sum of the squares of the differences in x, y and z.',
    example: [
      '{m:d = sqrt((x_2 - x_1)^2 + (y_2 - y_1)^2 + (z_2 - z_1)^2)}.',
      'From (1, 2, 3) to (4, 6, 15): the differences are 3, 4 and 12, so {m:d = sqrt(9 + 16 + 144) = sqrt(169) = 13}.',
    ],
    watch: 'Square each difference before you add. The distance is the magnitude of the vector between the points.',
    flip: 'In a box with sides a, b and c, the longest diagonal is {m:sqrt(a^2 + b^2 + c^2)}.',
    see: ['magnitude', 'three-d-axes', 'displacement'],
  },
];
