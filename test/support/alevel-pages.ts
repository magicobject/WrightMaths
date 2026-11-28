// The hidden A-level book pilot (/courses/a-level/). Like the GCSE book (book-pages.ts) it is kept out of
// pages.ts: not in the nav, the sitemap or robots.txt, and not linked from any other page.
import type { BookPage } from './book-pages';

export const ALEVEL_HUB_PAGES: BookPage[] = [
  { path: '/courses/a-level/', titleContains: 'A-level Pure Maths, Year 1', heading: /^A-level Pure Maths, built from the ground up$/ },
  { path: '/courses/a-level/glossary.html', titleContains: 'Maths Glossary, Years 1 and 2', heading: /^The language of A-level pure maths$/ },
  { path: '/courses/a-level/how-to-use.html', titleContains: 'How to use this book', heading: /^How to use this book$/ },
];

// Live topic pages are added here as each one is released (and only then: a page in this list must exist).
export const ALEVEL_TOPICS: BookPage[] = [
  { path: '/courses/a-level/indices-surds.html', titleContains: 'Indices and surds', heading: /^Indices and surds$/ },
  { path: '/courses/a-level/integration-basics.html', titleContains: 'Integration as reverse differentiation', heading: /^Integration as reverse differentiation$/ },
  { path: '/courses/a-level/differentiation-basics.html', titleContains: 'Differentiation from first principles', heading: /^Differentiation from first principles$/ },
  { path: '/courses/a-level/differentiation-applications.html', titleContains: 'Tangents, normals and stationary points', heading: /^Tangents, normals and stationary points$/ },
  { path: '/courses/a-level/quadratics.html', titleContains: 'Quadratics', heading: /^Quadratics$/ },
  { path: '/courses/a-level/straight-lines.html', titleContains: 'Straight lines', heading: /^Straight lines$/ },
  { path: '/courses/a-level/circles.html', titleContains: 'Circles', heading: /^Circles$/ },
  { path: '/courses/a-level/simultaneous.html', titleContains: 'Simultaneous equations', heading: /^Simultaneous equations$/ },
  { path: '/courses/a-level/inequalities.html', titleContains: 'Inequalities', heading: /^Inequalities$/ },
  { path: '/courses/a-level/vectors-2d.html', titleContains: 'Vectors in two dimensions', heading: /^Vectors in two dimensions$/ },
  { path: '/courses/a-level/trig-triangles.html', titleContains: 'Trigonometry in triangles', heading: /^Trigonometry in triangles$/ },
  { path: '/courses/a-level/trig-graphs.html', titleContains: 'Trigonometric graphs and exact values', heading: /^Trigonometric graphs and exact values$/ },
  { path: '/courses/a-level/trig-identities.html', titleContains: 'Trigonometric identities and equations', heading: /^Trigonometric identities and equations$/ },
  { path: '/courses/a-level/binomial-positive.html', titleContains: 'Binomial expansion', heading: /^Binomial expansion \(positive whole-number powers\)$/ },
  { path: '/courses/a-level/proof-methods.html', titleContains: 'Proof: direct, exhaustion, counterexample', heading: /^Proof: direct, exhaustion, counterexample$/ },
  { path: '/courses/a-level/polynomials.html', titleContains: 'Polynomials and the factor theorem', heading: /^Polynomials and the factor theorem$/ },
  { path: '/courses/a-level/graphs-polynomials.html', titleContains: 'Graphs of polynomials and reciprocals', heading: /^Graphs of polynomials and reciprocals$/ },
  { path: '/courses/a-level/graph-transformations.html', titleContains: 'Transformations of graphs', heading: /^Transformations of graphs$/ },
  { path: '/courses/a-level/exponentials-logs.html', titleContains: 'Exponentials and logarithms', heading: /^Exponentials and logarithms$/ },
  { path: '/courses/a-level/definite-integrals.html', titleContains: 'Definite integrals and area', heading: /^Definite integrals and area$/ },
  { path: '/courses/a-level/exp-modelling.html', titleContains: 'Exponential modelling', heading: /^Exponential modelling$/ },
];

export const ALEVEL_PAGES: BookPage[] = [...ALEVEL_HUB_PAGES, ...ALEVEL_TOPICS];
