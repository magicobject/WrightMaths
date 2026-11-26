// The order and numbers of the chapters. Nothing here is stored: the order comes from the topic graph, so a new base topic
// renumbers the chapters and each print run is an edition.

/** Live topics in book order: base of the pyramid first (layer), then alphabetical by title. */
export function chapterOrder(graph) {
  return [...graph.values()]
    .filter((t) => t.status === 'live')
    .sort((a, b) => a.layer - b.layer || a.title.localeCompare(b.title));
}

/** The chapter list: every live topic, then the two mixed-practice papers. Each gets a number from 1. */
export function buildChapters(graph, papers) {
  const entries = [
    ...chapterOrder(graph).map((t) => ({ id: t.id, title: t.title, kind: 'topic', words: t.words ?? [] })),
    ...papers.map((p) => ({ id: p.id, title: p.shortTitle ?? p.title, kind: 'paper', words: [] })),
  ];
  return entries.map((e, i) => ({ ...e, num: i + 1 }));
}

/** "fractions.html#top" -> "fractions". Anything that is not a plain page in the book gives null. */
export function hrefToId(href) {
  const m = /^([a-z0-9-]+)\.html(?:#.*)?$/.exec(href ?? '');
  return m ? m[1] : null;
}
