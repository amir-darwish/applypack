import path from 'node:path';
import { pathToFileURL } from 'node:url';

/*
 * The browser's line diff, on the server (ADR 0038). The change sheet and the
 * .docx patcher have to agree on what an edit is, so there is one
 * implementation — src/web/public/line-diff.mjs — and this is the bridge to
 * it, the way keyword-matcher.ts bridges to target.mjs.
 */

export interface DiffLine {
  i: number;
  text: string;
}

export type DiffOp =
  | { op: 'keep'; a: DiffLine; b: DiffLine }
  | { op: 'change'; a: DiffLine; b: DiffLine }
  | { op: 'delete'; a: DiffLine }
  | { op: 'insert'; b: DiffLine };

interface LineDiffModule {
  diffLines(before: string, after: string): DiffOp[];
}

// A file URL, as keyword-matcher.ts explains.
const MODULE_URL = pathToFileURL(path.resolve('src/web/public/line-diff.mjs')).href;

let mod: Promise<LineDiffModule> | undefined;

export function loadLineDiff(): Promise<LineDiffModule> {
  mod ??= import(MODULE_URL) as Promise<LineDiffModule>;
  return mod;
}
