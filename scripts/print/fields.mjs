// Word fields as complex fields (begin, instruction, separate, result, end), built in one place.
// XE (index entry), INDEX, TOC and PAGE are all made here, so one test covers them.

import { BuilderElement, Run } from 'docx';

const fldChar = (type) => new Run({ children: [new BuilderElement({ name: 'w:fldChar', attributes: { type: { key: 'w:fldCharType', value: type } } })] });

const instrText = (instruction, props = {}) => new Run({
  ...props,
  children: [new BuilderElement({ name: 'w:instrText', attributes: { space: { key: 'xml:space', value: 'preserve' } }, children: [` ${instruction} `] })],
});

/**
 * A complex field as an array of runs: { instruction } is the field code, `result` the text shown until Word updates it
 * (an array of runs; empty for an XE entry, which shows nothing).
 */
export function field(instruction, result = [], { hidden = false } = {}) {
  const props = hidden ? { vanish: true } : {};
  return [
    new Run({ ...props, children: [new BuilderElement({ name: 'w:fldChar', attributes: { type: { key: 'w:fldCharType', value: 'begin' } } })] }),
    instrText(instruction, props),
    ...(result.length ? [fldChar('separate'), ...result] : []),
    new Run({ ...props, children: [new BuilderElement({ name: 'w:fldChar', attributes: { type: { key: 'w:fldCharType', value: 'end' } } })] }),
  ];
}

/** Quote text for a field argument: a double quote inside becomes two single quotes, a backslash is doubled. */
export const fieldQuote = (text) => `"${String(text).replaceAll('\\', '\\\\').replaceAll('"', "''")}"`;

/** A hidden index entry. `bold` makes the page number bold in the index (where a term is taught). */
export function xe(text, { bold = false } = {}) {
  return field(`XE ${fieldQuote(text)}${bold ? ' \\b' : ''}`, [], { hidden: true });
}

/** The index itself, in two columns. Word fills it in when fields are updated. */
export const indexField = (placeholder) => field('INDEX \\c "2" \\z "2057"', placeholder);

/** The contents list: heading 1 only (chapters and the parts at the back), no hyperlinks. */
export const tocField = (placeholder) => field('TOC \\o "1-1" \\z \\u', placeholder);

/** The current page number. */
export const pageField = (placeholder) => field('PAGE', placeholder);
