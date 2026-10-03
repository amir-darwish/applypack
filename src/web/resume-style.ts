import { blankStyle, inferFromDocx, inferFromPdf, type InferredStyle } from '../resume/style-infer';

/*
 * The typography of a resume's own file (style-infer.ts), kept per resume
 * version: a PDF's takes 20–90 ms to read, and the Tailor page's document is
 * redrawn after every edit. Two callers — the document route and Save — so
 * that a saved clean version is set exactly as the pane drew it.
 */

const CACHE_MAX = 20;
const cache = new Map<string, InferredStyle>();

export async function resumeStyle(
  resume: { id: number; updatedAt: Date },
  file: { sourceFilename: string; original: Uint8Array },
): Promise<InferredStyle> {
  const key = `${resume.id}:${resume.updatedAt.getTime()}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const bytes = Buffer.from(file.original);
  const style = /\.docx$/i.test(file.sourceFilename)
    ? inferFromDocx(bytes)
    : /\.pdf$/i.test(file.sourceFilename)
      ? await inferFromPdf(bytes)
      : blankStyle();
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(key, style);
  return style;
}
