// Study routes through the book. Topic ids only; titles and links are generated, so a route can never point at a page that does not exist.
// The build fails if an id is not a live topic. "extra" entries link to the practice pages.

export const ROUTES = [
  {
    id: 'resit',
    title: 'Resit to a grade 4 (8 weeks)',
    blurb: 'For anyone who needs a grade 4 and has a fixed date. Foundation topics only, in the order that works best. Do the Find my gaps check first and start where it points.',
    weeks: [
      ['place-value', 'four-operations'],
      ['negative-numbers', 'order-of-operations'],
      ['fractions', 'factors-multiples'],
      ['percentages', 'ratio'],
      ['algebra-basics', 'solving-equations'],
      ['shapes-angles', 'area-perimeter', 'pythagoras'],
      ['averages', 'probability-basics', 'sequences'],
      ['@foundation'],
    ],
  },
  {
    id: 'full',
    title: 'The whole book (12 weeks)',
    blurb: 'Four topics a week, base first. Each topic has about 50 to 100 questions: you do not have to finish every set. Use "Skip the basics" if a topic feels easy.',
    weeks: [
      ['place-value', 'four-operations', 'negative-numbers', 'order-of-operations'],
      ['factors-multiples', 'squares-roots', 'fractions', 'algebra-basics'],
      ['shapes-angles', 'area-perimeter', 'percentages', 'ratio'],
      ['solving-equations', 'indices', 'probability-basics', 'sequences'],
      ['coordinates-graphs', 'pythagoras', 'averages', 'circles'],
      ['direct-inverse-proportion', 'percentage-change', 'inequalities', 'rearranging-formulae'],
      ['simultaneous-equations', 'quadratic-equations', 'similarity', 'transformations'],
      ['surds', 'trigonometry', 'bearings', 'compound-measures'],
      ['histograms-cumulative-frequency', 'conditional-probability', 'constructions-loci', 'circle-theorems'],
      ['bounds', 'vectors', 'algebraic-fractions', 'functions-graphs'],
      ['sine-cosine-rules', 'iteration', '@foundation'],
      ['@stretch'],
    ],
  },
  {
    id: 'weak',
    title: 'Two or three weak topics only (3 weeks)',
    blurb: 'For a student who is wobbling on algebra and ratio and is fine with the rest. Three short blocks: algebra first, then ratio, then percentages, which uses both. Do about three 20-minute sessions on each. Stop and move on if the "Check your knowledge" questions at the end of a topic come out right.',
    weeks: [
      ['algebra-basics'],
      ['ratio'],
      ['percentages'],
    ],
  },
  {
    id: 'top',
    title: 'Grade 7 to 9 top-up (6 weeks)',
    blurb: 'For students already secure at grade 6 who want the Higher material. Skip any topic you can already do.',
    weeks: [
      ['surds', 'indices', 'bounds'],
      ['quadratic-equations', 'functions-graphs', 'iteration'],
      ['sine-cosine-rules', 'circle-theorems', 'vectors'],
      ['conditional-probability', 'histograms-cumulative-frequency', 'algebraic-fractions'],
      ['percentage-change', 'direct-inverse-proportion', 'similarity'],
      ['@stretch'],
    ],
  },
];

export const EXTRA = {
  '@foundation': { href: 'foundation.html', title: 'Practice papers, grades 4 to 6' },
  '@stretch': { href: 'stretch.html', title: 'Grade 7 to 9 stretch papers' },
};

/** The order used for the "Next" link at the end of a topic page: the whole-book route. */
export function nextInRoute(id) {
  const order = ROUTES.find((r) => r.id === 'full').weeks.flat().filter((x) => !x.startsWith('@'));
  const i = order.indexOf(id);
  return i >= 0 && i + 1 < order.length ? order[i + 1] : null;
}
