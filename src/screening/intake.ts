import { createHash } from 'node:crypto';
import { basename, dirname, extname } from 'node:path';
import { ACCEPTED_EXTENSIONS } from '../resume/resume-text';
import { readZipEntries, ZipError } from '../resume/zip';
import { hamming64, MAX_HAMMING_DISTANCE, simhash64 } from '../fingerprint';

/*
 * Bulk intake of applicant files (TASKS §19 stage 2): what an upload
 * expands to, and how a second copy of the same person is recognised.
 * Pure — the route reads the multipart form and the store writes the rows.
 */

/** A batch is a hiring round, not a talent pool (ADR 0048): the cap keeps one screening one job's applicants. */
export const MAX_APPLICANTS_PER_SCREENING = 300;
/** A whole folder at once — the per-screening cap is the real ceiling. */
const MAX_FILES_PER_UPLOAD = 300;
/** Three hundred PDFs of a page or two. */
export const MAX_BATCH_UPLOAD_MB = 200;
/** One resume, inflated — the same ceiling as a single upload (upload.ts); a zip entry past it is not read. */
const MAX_ENTRY_BYTES = 5 * 1024 * 1024;

export interface UploadFile {
  name: string;
  bytes: Buffer;
}

export interface ExpandedFile extends UploadFile {
  /** The archive it came out of, for the table's "from folder.zip" note. */
  archive: string | null;
}

export interface ExpandedUploads {
  files: ExpandedFile[];
  badArchives: string[];
  /** Zip entries past MAX_ENTRY_BYTES, not read. */
  oversized: string[];
  /** Archives holding more entries than the reader will open. */
  truncatedArchives: string[];
  /** Files of a type the extractor cannot read (a photo, a spreadsheet) — a folder drop carries them; they are not applicants. */
  notResumes: string[];
}

const ZIP_EXTENSION = '.zip';
const SKIPPED_ENTRY = /(^|\/)(__MACOSX\/|\.|~\$|thumbs\.db$)/i;

export function isAcceptedResume(filename: string): boolean {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(extname(filename).toLowerCase());
}

/**
 * Zips opened, everything else passed through; entries an OS adds to an
 * archive (`__MACOSX`, dotfiles, Word's `~$` locks) are skipped, and so is
 * any file of a type the extractor cannot read — a folder dropped whole
 * carries photos and spreadsheets, and those are not applicants. A file
 * name may carry its folder path ("Ivan Petrenko/CV.pdf"): the page sends
 * it that way so a folder per candidate stays readable in the table.
 */
export function expandUploads(files: UploadFile[]): ExpandedUploads {
  const out: ExpandedFile[] = [];
  const badArchives: string[] = [];
  const oversized: string[] = [];
  const truncatedArchives: string[] = [];
  const notResumes: string[] = [];
  const take = (name: string, bytes: Buffer, archive: string | null): void => {
    if (out.length >= MAX_FILES_PER_UPLOAD) return;
    if (SKIPPED_ENTRY.test(name) || bytes.length === 0) return;
    if (!isAcceptedResume(name)) {
      notResumes.push(name);
      return;
    }
    out.push({ name, bytes, archive });
  };
  for (const f of files) {
    if (out.length >= MAX_FILES_PER_UPLOAD) break;
    if (extname(f.name).toLowerCase() !== ZIP_EXTENSION) {
      take(f.name, f.bytes, null);
      continue;
    }
    try {
      const { entries, skipped, truncated } = readZipEntries(f.bytes, MAX_ENTRY_BYTES);
      oversized.push(...skipped);
      if (truncated) truncatedArchives.push(f.name);
      for (const entry of entries) take(entry.name, entry.data, f.name);
    } catch (err) {
      if (err instanceof ZipError) badArchives.push(f.name);
      else throw err;
    }
  }
  return { files: out, badArchives, oversized, truncatedArchives, notResumes };
}

/** "Ivan Petrenko/CV.pdf (from batch.zip)" — what the table shows for a file. */
export function displayName(file: ExpandedFile): string {
  const name = file.name.replace(/^\.?\/+/, '');
  return file.archive ? `${name} (from ${file.archive})` : name;
}

export interface TextFingerprint {
  hash: string;
  simhash: bigint | null;
}

/** Exact and near-duplicate keys of one resume's text. */
/** A file no text came out of is known by its bytes, so the same scan twice is one row and two different scans never collide. */
export function fingerprintBytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex').slice(0, 32);
}

export function fingerprintText(text: string): TextFingerprint {
  const canon = text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  return { hash: createHash('sha256').update(canon).digest('hex').slice(0, 32), simhash: simhash64(text) };
}

export interface KnownApplicant {
  id: number;
  number: number;
  email: string | null;
  phone: string | null;
  hash: string;
  simhash: bigint | null;
}

export type DuplicateKind =
  /** Byte for byte the same text — the file was added before; nothing to score twice. */
  | 'same-text'
  /** The same person (email, phone) or a near-identical text — another document of theirs, scored like any other. */
  | 'same-person';

/**
 * What an incoming resume repeats, if anything. The same text is a re-upload
 * and is not added; the same person with a different document is a second
 * version — a candidate who applied twice, or a folder with a CV and a
 * cover letter — and each version is scored, labelled as №K's.
 */
export function findDuplicate(
  candidate: { email: string | null; phone: string | null } & TextFingerprint,
  known: KnownApplicant[],
): { kind: DuplicateKind; match: KnownApplicant } | null {
  const digits = (s: string | null): string => (s ?? '').replace(/\D/g, '');
  for (const k of known) {
    if (k.hash === candidate.hash) return { kind: 'same-text', match: k };
  }
  for (const k of known) {
    if (candidate.email && k.email && candidate.email.toLowerCase() === k.email.toLowerCase()) return { kind: 'same-person', match: k };
    if (digits(candidate.phone).length >= 9 && digits(candidate.phone) === digits(k.phone)) return { kind: 'same-person', match: k };
    if (candidate.simhash !== null && k.simhash !== null && hamming64(candidate.simhash, k.simhash) <= MAX_HAMMING_DISTANCE) {
      return { kind: 'same-person', match: k };
    }
  }
  return null;
}

/** One uploaded file after reading: what the intake decides from, before anything is written. */
export interface ReadFile {
  /** Null when no text came out of the file. */
  text: string | null;
  email: string | null;
  phone: string | null;
  print: TextFingerprint;
}

/** Another document of a person already in the list (`id`), or of one added earlier in this same upload (`add`). */
export type SameAs = { id: number } | { add: number } | null;

export interface IntakePlan {
  /** The files to add, in upload order: `file` indexes the input, `add` in `sameAs` indexes this list. */
  adds: { file: number; sameAs: SameAs }[];
  /** Files whose text is already here, or earlier in this upload — nothing new to read. */
  repeats: number[];
}

/**
 * Each file's fate, decided before anything is written (TASKS H23/H25): the
 * dedupe the upload used to make one insert at a time, so one transaction
 * can write the lot. A later file is compared with the earlier ones of the
 * same upload as with the rows already stored; a file with no text is added
 * as unreadable and compared with nothing.
 */
export function planIntake(files: ReadFile[], known: KnownApplicant[]): IntakePlan {
  // An earlier file of this upload stands in the pool with a negative id: -1 - its place in `adds`.
  const pool = [...known];
  const plan: IntakePlan = { adds: [], repeats: [] };
  files.forEach((f, i) => {
    if (f.text === null) {
      plan.adds.push({ file: i, sameAs: null });
      return;
    }
    const dup = findDuplicate({ email: f.email, phone: f.phone, ...f.print }, pool);
    if (dup?.kind === 'same-text') {
      plan.repeats.push(i);
      return;
    }
    const sameAs: SameAs = dup === null ? null : dup.match.id < 0 ? { add: -1 - dup.match.id } : { id: dup.match.id };
    pool.push({ id: -1 - plan.adds.length, number: 0, email: f.email, phone: f.phone, ...f.print });
    plan.adds.push({ file: i, sameAs });
  });
  return plan;
}

/* ---------- cover letters (TASKS E3, Q9) ---------- */

/** A file name that says it is a cover letter, in the languages the corpus writes them. */
const LETTER_NAME =
  /cover(?:ing)?[\s_.-]*letter|anschreiben|motivation(?:s)?(?:schreiben|[\s_.-]*letter)|lettre[\s_.-]*de[\s_.-]*motivation|carta[\s_.-]*de[\s_.-]*presentaci|list[\s_.-]*motywacyjny|супровідн|мотиваційн|сопроводительн|мотивационн/iu;
/** How a letter opens. */
const SALUTATION =
  /^(?:dear|hello|hi|to whom it may concern|sehr geehrte|liebe|шановн|добрий день|уважаем|здравствуйте|szanown|dzień dobry|madame|monsieur)(?![\p{L}])/iu;
/** How a letter closes. */
const VALEDICTION =
  /^(?:sincerely|yours (?:sincerely|faithfully|truly)|kind regards|best regards|warm regards|regards|best wishes|mit freundlichen grüßen|viele grüße|з повагою|с уважением|z poważaniem|cordialement)(?![\p{L}])/iu;
/** A resume's own section headings: two of them make a file a resume, whatever else it says. */
const RESUME_HEADING =
  /^#*\s*(?:experience|work experience|professional experience|employment history|education|skills|technical skills|projects|досвід(?: роботи)?|освіта|навички|опыт(?: работы)?|образование|навыки|berufserfahrung|ausbildung|kenntnisse|doświadczenie|wykształcenie|umiejętności)(?![\p{L}])/iu;
/** Where a salutation is looked for, and a valediction, in non-empty lines. */
const SALUTATION_LINES = 3;
const VALEDICTION_LINES = 6;
const HEADING_MAX_CHARS = 40;
/** A letter is a page; a longer file that merely opens politely is a resume. */
const LETTER_MAX_CHARS = 6_000;

/**
 * Why a file is a cover letter rather than a resume, or null: its file name
 * says so, or — with no resume heading anywhere — it opens with a salutation
 * and closes with a valediction. Two resume headings make a file a resume
 * whatever its name: a letter on top of a CV is still the CV.
 */
export function coverLetterSignal(fileName: string, text: string): 'name' | 'text' | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const headings = lines.filter((l) => l.length <= HEADING_MAX_CHARS && RESUME_HEADING.test(l)).length;
  if (headings >= 2) return null;
  if (LETTER_NAME.test(basename(fileName))) return 'name';
  const shaped =
    headings === 0 &&
    text.length <= LETTER_MAX_CHARS &&
    lines.slice(0, SALUTATION_LINES).some((l) => SALUTATION.test(l)) &&
    lines.slice(-VALEDICTION_LINES).some((l) => VALEDICTION.test(l));
  return shaped ? 'text' : null;
}

export interface UploadedDocument {
  /** The file's name with its folder path, as the upload carries it. */
  name: string;
  archive: string | null;
  email: string | null;
  phone: string | null;
}

/** Words a file name spends on what the document is rather than whose it is. */
const DOCUMENT_WORDS = new Set(['cv', 'resume', 'résumé', 'lebenslauf', 'curriculum', 'vitae', 'cover', 'covering', 'letter', 'motivation', 'anschreiben', 'final', 'updated', 'new', 'en', 'de', 'ua', 'pl']);

function stem(name: string): string {
  return basename(name, extname(name))
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter((w) => w.length > 1 && !DOCUMENT_WORDS.has(w))
    .join(' ');
}

const folderOf = (d: UploadedDocument): string => `${d.archive ?? ''}::${dirname(d.name.replace(/^\.?\/+/, ''))}`;
const digitsOf = (s: string | null): string => (s ?? '').replace(/\D/g, '');

/**
 * Whose each cover letter is, or null: the only resume in its folder (a
 * folder per candidate, or an upload of one CV and one letter), else the
 * resume with its email or phone — this upload's first, then the ones already
 * stored — else the only resume whose file name has the same stem once "CV"
 * and "cover letter" are taken out ("Ann_Lee_CV.pdf", "Ann_Lee_Cover_Letter.pdf").
 * `add` indexes `resumes`.
 */
export function letterOwners(letters: UploadedDocument[], resumes: UploadedDocument[], known: KnownApplicant[]): SameAs[] {
  const byFolder = new Map<string, number[]>();
  resumes.forEach((r, i) => byFolder.set(folderOf(r), [...(byFolder.get(folderOf(r)) ?? []), i]));
  const samePerson = (a: { email: string | null; phone: string | null }, b: { email: string | null; phone: string | null }): boolean =>
    (a.email !== null && b.email !== null && a.email.toLowerCase() === b.email.toLowerCase()) ||
    (digitsOf(a.phone).length >= 9 && digitsOf(a.phone) === digitsOf(b.phone));
  return letters.map((letter) => {
    const inFolder = byFolder.get(folderOf(letter)) ?? [];
    if (inFolder.length === 1) return { add: inFolder[0]! };
    const byContact = resumes.findIndex((r) => samePerson(letter, r));
    if (byContact !== -1) return { add: byContact };
    const stored = known.find((k) => samePerson(letter, k));
    if (stored) return { id: stored.id };
    const own = stem(letter.name);
    const byStem = own === '' ? [] : resumes.flatMap((r, i) => (stem(r.name) === own ? [i] : []));
    return byStem.length === 1 ? { add: byStem[0]! } : null;
  });
}
