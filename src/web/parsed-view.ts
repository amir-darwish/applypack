import { structureFromText } from '../resume/structure-from-text';

/*
 * "What a parser reads" on /resumes/:id (TASKS R12): the name, the contacts,
 * the sections and the roles with their dates, as a plain reader pulls them
 * out of the extracted text — no model. What is missing here is what a
 * recruiter's ATS is likely to miss too. Pure: structure-from-text.ts reads.
 */

export interface ParsedView {
  name: string | null;
  headline: string | null;
  contacts: { label: string; value: string | null }[];
  /** The sections found, in reading order of the kinds the reader knows. */
  sections: string[];
  roles: { title: string; company: string | null; dates: string | null; bullets: number }[];
  education: { title: string; dates: string | null }[];
}

const dates = (start: string | null, end: string | null): string | null =>
  start || end ? `${start ?? '?'} – ${end ?? '?'}` : null;

/** The separators a reader leaves at the edge of a flattened table row: "Acme |" is Acme. */
const EDGE_SEPARATORS = /^[\s|·•,]+|[\s|·•,]+$/g;
const tidy = (s: string | null): string | null => s?.replace(EDGE_SEPARATORS, '') || null;

export function parsedView(text: string): ParsedView {
  const r = structureFromText(text);
  const sections = [
    r.basics.summary ? 'Summary' : null,
    r.skills.length > 0 ? `Skills (${r.skills.length === 1 ? '1 group' : `${r.skills.length} groups`})` : null,
    r.work.length > 0 ? `Experience (${r.work.length === 1 ? '1 role' : `${r.work.length} roles`})` : null,
    r.education.length > 0 ? 'Education' : null,
    r.languages.length > 0 ? 'Languages' : null,
    r.certificates.length > 0 ? 'Certificates' : null,
    r.projects.length > 0 ? 'Projects' : null,
    ...r.extras.map((e) => e.heading),
  ].filter((s): s is string => s !== null);
  return {
    name: r.basics.name,
    headline: r.basics.label,
    contacts: [
      { label: 'Email', value: r.basics.email },
      { label: 'Phone', value: r.basics.phone },
      { label: 'Link', value: r.basics.url ?? r.basics.profiles[0] ?? null },
      { label: 'Location', value: r.basics.location },
    ],
    sections,
    roles: r.work.map((w) => ({
      title: tidy(w.position ?? w.name) ?? 'A role with no title',
      company: w.position ? tidy(w.name) : null,
      dates: dates(w.startDate, w.endDate),
      bullets: w.highlights.length,
    })),
    education: r.education.map((e) => ({
      title: tidy([e.studyType, e.area, e.institution].filter(Boolean).join(', ')) ?? 'no name found',
      dates: dates(e.startDate, e.endDate),
    })),
  };
}
