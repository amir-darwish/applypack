/*
 * The same resume uploaded twice (TASKS R16): a second copy is a second row
 * to keep apart, and a scan the AI is paid for to read what it already read.
 * Two files are the same resume when their text is — the bytes of a .docx
 * change with every save of an unchanged document, the text does not.
 * Pure: store.ts compares.
 */

/** The text as a comparison sees it: line ends, runs of blanks and edges aside. */
export function resumeTextKey(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
}

/** The first resume whose text is this text, if any. */
export function sameTextAs<T extends { text: string }>(text: string, resumes: readonly T[]): T | null {
  const key = resumeTextKey(text);
  if (key.length === 0) return null;
  return resumes.find((r) => resumeTextKey(r.text) === key) ?? null;
}
