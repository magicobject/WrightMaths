// Drawing helpers for the A-level book's large diagrams. Every graph is drawn FROM the function that defines it,
// so a picture can never disagree with its equation. Output is plain inline SVG (no script, no request).
//
//   const p = plane({ xmin: -1, xmax: 6, ymin: -3, ymax: 10, xstep: 1, ystep: 2 });
//   p.curve((x) => x * x - 4 * x + 3);                       // the main curve (strand colour, solid)
//   p.curve((x) => 2 * x - 5, { cls: 'curve-b' });           // a second curve (dark, dashed)
//   p.point(1, 0, { label: '(1, 0)', dx: -10, dy: 28 });     // a point and its label
//   p.text(4.5, 8, 'y = x^2 - 4x + 3', { cls: 'alt' });      // text in graph coordinates; ^2 and _n become real scripts
//   return p.svg({ id: 'quad-roots', title: '…', desc: '…' });
//
// Classes (styled in public/css/book-alevel.css): curve, curve-b, curve-c, line, guide, tangent, shade, shade-hatch,
// pt, pt-open, svg-t (+ small, big, alt). Curves also differ by dash pattern, so colour is never the only cue.
//
// Rules for authors (see docs/alevel-book-authoring.md): a figure shows ONE idea; labels are at least the size the
// CSS gives (do not shrink them); mark the thing the text is about (a point, a gradient, a region) directly on the
// diagram; the <desc> says what the picture shows in words, and for a question figure never gives the answer.

const f = (n) => (Math.round(n * 100) / 100).toString();
const esc = (t) => String(t).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Text for a diagram: x^2 and x^(n+1) and u_n become real superscripts and subscripts; "-" before a digit is a true minus. */
export function label(s) {
  const ZW = '\u200b'; // a zero-width character: browsers ignore a dy on an EMPTY tspan, so the shift back needs one
  let out = esc(s).replace(/(^|[\s(])-(?=\d|[a-z(])/gi, '$1\u2212').replace(/ - /g, ' \u2212 ');
  out = out.replace(/\^\(([^)]*)\)/g, (_, a) => `<tspan dy="-0.5em" font-size="72%">${a}</tspan><tspan dy="0.5em">${ZW}</tspan>`);
  out = out.replace(/\^(-?\w+)/g, (_, a) => `<tspan dy="-0.5em" font-size="72%">${a.replace('-', '\u2212')}</tspan><tspan dy="0.5em">${ZW}</tspan>`);
  out = out.replace(/_\(([^)]*)\)/g, (_, a) => `<tspan dy="0.35em" font-size="72%">${a}</tspan><tspan dy="-0.35em">${ZW}</tspan>`);
  out = out.replace(/_(\w+)/g, (_, a) => `<tspan dy="0.35em" font-size="72%">${a}</tspan><tspan dy="-0.35em">${ZW}</tspan>`);
  return out;
}

export function plane({
  xmin = -5, xmax = 5, ymin = -5, ymax = 5, xstep = 1, ystep = 1,
  width = 720, height = 440, left = 64, right = 48, top = 44, bottom = 52,
  grid = true, xlabel = 'x', ylabel = 'y', ticks = true, tickLabels = true, xtickFormat = null, ytickFormat = null, axes = true,
} = {}) {
  const w = width - left - right;
  const h = height - top - bottom;
  const X = (x) => left + ((x - xmin) / (xmax - xmin)) * w;
  const Y = (y) => top + h - ((y - ymin) / (ymax - ymin)) * h;
  const parts = [];
  const defs = [];
  const clipId = `clip-${Math.random().toString(36).slice(2, 8)}`; // replaced by the caller's id in svg()
  const push = (s) => parts.push(s);

  // ---- grid, axes, ticks ----
  if (grid) {
    for (let x = Math.ceil(xmin / xstep) * xstep; x <= xmax + 1e-9; x += xstep) push(`<line class="grid" x1="${f(X(x))}" y1="${f(Y(ymin))}" x2="${f(X(x))}" y2="${f(Y(ymax))}"/>`);
    for (let y = Math.ceil(ymin / ystep) * ystep; y <= ymax + 1e-9; y += ystep) push(`<line class="grid" x1="${f(X(xmin))}" y1="${f(Y(y))}" x2="${f(X(xmax))}" y2="${f(Y(y))}"/>`);
  }
  const ax0 = Math.min(Math.max(0, ymin), ymax);
  const ay0 = Math.min(Math.max(0, xmin), xmax);
  if (axes) {
    push(`<line class="axis" x1="${f(X(xmin))}" y1="${f(Y(ax0))}" x2="${f(X(xmax))}" y2="${f(Y(ax0))}"/>`);
    push(`<line class="axis" x1="${f(X(ay0))}" y1="${f(Y(ymin))}" x2="${f(X(ay0))}" y2="${f(Y(ymax))}"/>`);
    // arrowheads
    push(`<polygon class="arrowhead" points="${f(X(xmax) + 10)},${f(Y(ax0))} ${f(X(xmax) - 4)},${f(Y(ax0) - 7)} ${f(X(xmax) - 4)},${f(Y(ax0) + 7)}"/>`);
    push(`<polygon class="arrowhead" points="${f(X(ay0))},${f(Y(ymax) - 10)} ${f(X(ay0) - 7)},${f(Y(ymax) + 4)} ${f(X(ay0) + 7)},${f(Y(ymax) + 4)}"/>`);
    push(`<text class="svg-t alt" x="${f(X(xmax) + 18)}" y="${f(Y(ax0) + 8)}" text-anchor="start">${label(xlabel)}</text>`);
    push(`<text class="svg-t alt" x="${f(X(ay0))}" y="${f(Y(ymax) - 18)}" text-anchor="middle">${label(ylabel)}</text>`);
  }
  if (ticks) {
    for (let x = Math.ceil(xmin / xstep) * xstep; x <= xmax + 1e-9; x += xstep) {
      if (Math.abs(x) < 1e-9) continue;
      push(`<line class="tick" x1="${f(X(x))}" y1="${f(Y(ax0) - 6)}" x2="${f(X(x))}" y2="${f(Y(ax0) + 6)}"/>`);
      if (tickLabels) push(`<text class="svg-t small" x="${f(X(x))}" y="${f(Y(ax0) + 32)}" text-anchor="middle">${label(xtickFormat ? xtickFormat(x) : String(Math.round(x * 1000) / 1000))}</text>`);
    }
    for (let y = Math.ceil(ymin / ystep) * ystep; y <= ymax + 1e-9; y += ystep) {
      if (Math.abs(y) < 1e-9) continue;
      push(`<line class="tick" x1="${f(X(ay0) - 6)}" y1="${f(Y(y))}" x2="${f(X(ay0) + 6)}" y2="${f(Y(y))}"/>`);
      if (tickLabels) push(`<text class="svg-t small" x="${f(X(ay0) - 12)}" y="${f(Y(y) + 6)}" text-anchor="end">${label(ytickFormat ? ytickFormat(y) : String(Math.round(y * 1000) / 1000))}</text>`);
    }
    if (tickLabels && axes) push(`<text class="svg-t small" x="${f(X(ay0) - 12)}" y="${f(Y(ax0) + 32)}" text-anchor="end">O</text>`);
  }

  const inside = (y) => Number.isFinite(y) && y >= ymin - (ymax - ymin) * 0.02 && y <= ymax + (ymax - ymin) * 0.02;

  // A path for y = fn(x), broken wherever the curve leaves the picture or jumps (asymptotes).
  const pathFor = (fn, from, to, samples) => {
    let d = '';
    let pen = false;
    let prev = null;
    const step = (to - from) / samples;
    for (let i = 0; i <= samples; i += 1) {
      const x = from + i * step;
      const y = fn(x);
      const ok = inside(y) && !(prev !== null && Math.abs(y - prev) > (ymax - ymin) * 0.6);
      if (ok) { d += `${pen ? 'L' : 'M'}${f(X(x))} ${f(Y(y))} `; pen = true; } else { pen = false; }
      prev = Number.isFinite(y) ? y : null;
    }
    return d.trim();
  };

  const api = {
    X, Y, w, h, xmin, xmax, ymin, ymax,
    /** y = fn(x) from `from` to `to` (default the whole picture). */
    curve(fn, { from = xmin, to = xmax, cls = 'curve', samples = 360 } = {}) { push(`<path class="${cls}" d="${pathFor(fn, from, to, samples)}"/>`); return api; },
    /** A curve given as x = fx(t), y = fy(t) for t from `t0` to `t1`. */
    parametric(fx, fy, t0, t1, { cls = 'curve', samples = 400 } = {}) {
      let d = '';
      for (let i = 0; i <= samples; i += 1) { const t = t0 + ((t1 - t0) * i) / samples; d += `${i ? 'L' : 'M'}${f(X(fx(t)))} ${f(Y(fy(t)))} `; }
      push(`<path class="${cls}" d="${d.trim()}"/>`); return api;
    },
    /** A straight segment between two points in graph coordinates. */
    line(x1, y1, x2, y2, { cls = 'line' } = {}) { push(`<line class="${cls}" x1="${f(X(x1))}" y1="${f(Y(y1))}" x2="${f(X(x2))}" y2="${f(Y(y2))}"/>`); return api; },
    /** A straight line y = m x + c across the whole picture. */
    straight(m, c, { cls = 'line' } = {}) { return api.line(xmin, m * xmin + c, xmax, m * xmax + c, { cls }); },
    vline(x, { cls = 'guide' } = {}) { return api.line(x, ymin, x, ymax, { cls }); },
    hline(y, { cls = 'guide' } = {}) { return api.line(xmin, y, xmax, y, { cls }); },
    /** A dashed guide from a point down to the x-axis and across to the y-axis (to read coordinates). */
    drop(x, y, { cls = 'guide' } = {}) { api.line(x, 0, x, y, { cls }); api.line(0, y, x, y, { cls }); return api; },
    /** A shaded region between two curves (or a curve and the x-axis when `lower` is omitted) from `from` to `to`. */
    shade(upper, lower = () => 0, from = xmin, to = xmax, { cls = 'shade', samples = 240 } = {}) {
      const pts = [];
      for (let i = 0; i <= samples; i += 1) { const x = from + ((to - from) * i) / samples; pts.push([x, upper(x)]); }
      for (let i = samples; i >= 0; i -= 1) { const x = from + ((to - from) * i) / samples; pts.push([x, lower(x)]); }
      push(`<polygon class="${cls}" points="${pts.map(([x, y]) => `${f(X(x))},${f(Math.min(Math.max(Y(y), top), top + h))}`).join(' ')}"/>`); return api;
    },
    /** A filled dot (open: a hollow ring, for a point that is not included). */
    point(x, y, { label: text = '', dx = 12, dy = -12, open = false, anchor = 'start', cls = '' } = {}) {
      push(`<circle class="${open ? 'pt-open' : 'pt'}" cx="${f(X(x))}" cy="${f(Y(y))}" r="7"/>`);
      if (text) push(`<text class="svg-t ${cls}" x="${f(X(x) + dx)}" y="${f(Y(y) + dy)}" text-anchor="${anchor}">${label(text)}</text>`);
      return api;
    },
    /** Text placed at graph coordinates (x, y). */
    text(x, y, t, { cls = '', anchor = 'middle', dx = 0, dy = 0 } = {}) { push(`<text class="svg-t ${cls}" x="${f(X(x) + dx)}" y="${f(Y(y) + dy)}" text-anchor="${anchor}">${label(t)}</text>`); return api; },
    /** Text placed at pixel coordinates inside the picture (for notes that are not about a point). */
    note(px, py, t, { cls = '', anchor = 'start' } = {}) { push(`<text class="svg-t ${cls}" x="${f(px)}" y="${f(py)}" text-anchor="${anchor}">${label(t)}</text>`); return api; },
    /** The tangent to y = fn(x) at x = a, drawn from a - span to a + span. */
    tangent(fn, a, { span = 1.5, cls = 'tangent', h: step = 1e-5 } = {}) {
      const m = (fn(a + step) - fn(a - step)) / (2 * step);
      return api.line(a - span, fn(a) - m * span, a + span, fn(a) + m * span, { cls });
    },
    /** Any extra SVG, in pixel coordinates (use sparingly). */
    raw(s) { push(s); return api; },
    defs(s) { defs.push(s); return api; },
    /** The finished <svg>. `id` makes the title/description ids unique on the page. */
    svg({ id, title, desc, cls = 'graph-svg', hatch = false }) {
      const hatchDef = hatch ? `<pattern id="${id}-hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#e4eefb"/><line x1="0" y1="0" x2="0" y2="12" stroke="#7d8fb3" stroke-width="3"/></pattern>` : '';
      const body = parts.join('').replaceAll('url(#hatch)', `url(#${id}-hatch)`);
      return `<svg class="${cls}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-t ${id}-d" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc><defs>${hatchDef}${defs.join('')}</defs>${body}</svg>`;
    },
  };
  void clipId;
  return api;
}

/** A plain number line (for inequalities and intervals). `marks`: [{ at, open, label }], `ranges`: [{ from, to }] shaded. */
export function numberLine({ min = -5, max = 5, step = 1, width = 720, height = 150, marks = [], ranges = [], id, title, desc } = {}) {
  const left = 40;
  const right = 40;
  const X = (x) => left + ((x - min) / (max - min)) * (width - left - right);
  const y0 = 80;
  let s = `<line class="axis" x1="${left - 10}" y1="${y0}" x2="${width - right + 10}" y2="${y0}"/>`;
  s += `<polygon class="arrowhead" points="${width - right + 22},${y0} ${width - right + 8},${y0 - 7} ${width - right + 8},${y0 + 7}"/>`;
  s += `<polygon class="arrowhead" points="${left - 22},${y0} ${left - 8},${y0 - 7} ${left - 8},${y0 + 7}"/>`;
  for (const r of ranges) s += `<line class="curve" x1="${f(X(Math.max(r.from, min)))}" y1="${y0}" x2="${f(X(Math.min(r.to, max)))}" y2="${y0}" style="stroke-width:10"/>`;
  for (let x = Math.ceil(min / step) * step; x <= max + 1e-9; x += step) {
    s += `<line class="tick" x1="${f(X(x))}" y1="${y0 - 8}" x2="${f(X(x))}" y2="${y0 + 8}"/><text class="svg-t small" x="${f(X(x))}" y="${y0 + 34}" text-anchor="middle">${label(String(Math.round(x * 1000) / 1000))}</text>`;
  }
  for (const m of marks) {
    s += `<circle class="${m.open ? 'pt-open' : 'pt'}" cx="${f(X(m.at))}" cy="${y0}" r="9"/>`;
    if (m.label) s += `<text class="svg-t" x="${f(X(m.at))}" y="${y0 - 24}" text-anchor="middle">${label(m.label)}</text>`;
  }
  return `<svg class="graph-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-t ${id}-d" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>${s}</svg>`;
}
