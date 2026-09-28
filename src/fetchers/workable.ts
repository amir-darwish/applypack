import { z } from 'zod';
import { fetchWithRetry, sleep } from '../http';
import { logger } from '../logger';
import { workplaceFromText } from '../location';
import type { NormalizedJob } from '../types';
import { listedInFull } from './listing';

const ENDPOINT_TEMPLATE = (slug: string) =>
  `https://apply.workable.com/api/v3/accounts/${encodeURIComponent(slug)}/jobs`;
/**
 * The list comes a page at a time: the answer's `nextPage` goes back as the
 * next request's `token`. A board past the last page read is cut, and said
 * so — until the cap it used to be cut silently at page one (audit FETCH-5).
 */
const MAX_PAGES = 5;
const PAGE_DELAY_MS = 300;

// The list endpoint returns lightweight job metadata. Workable does NOT
// expose per-job descriptions on a public endpoint, so description stays
// empty — Claude classifies on the title alone (which is usually clear
// for engineering roles).
const WorkableLocationSchema = z
  .object({
    country: z.string().nullable().optional(),
    countryCode: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    region: z.string().nullable().optional(),
  })
  .passthrough();

const WorkableJobSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform((v) => String(v)),
    shortcode: z.string(),
    title: z.string(),
    remote: z.boolean().optional().default(false),
    location: WorkableLocationSchema.nullable().optional(),
    /** Every country a remote post accepts, `countryCode` each (verified live 2026-09-03). */
    locations: z.array(WorkableLocationSchema).optional().default([]),
    state: z.string().optional(),
    published: z.string().optional(),
    workplace: z.string().nullable().optional(),
  })
  .passthrough();

const WorkableResponseSchema = z
  .object({
    total: z.number().optional(),
    results: z.array(z.unknown()),
    nextPage: z.string().nullable().optional(),
  })
  .passthrough();

/** What one page says about the list: how many rows it carried, the board's total, and the token for the next page. */
export function workablePage(raw: unknown): { rows: number; total: number | null; nextPage: string | null } {
  const top = WorkableResponseSchema.safeParse(raw);
  if (!top.success) return { rows: 0, total: null, nextPage: null };
  return { rows: top.data.results.length, total: top.data.total ?? null, nextPage: top.data.nextPage || null };
}

export interface WorkableCompany {
  id: number;
  atsToken: string;
}

export async function fetchWorkable(
  company: WorkableCompany,
): Promise<NormalizedJob[]> {
  const out: NormalizedJob[] = [];
  let token: string | null = null;
  let read = 0;
  let total: number | null = null;
  // True once the pages ran out on their own — not at the cap, not on a failure.
  let whole = false;
  for (let page = 0; page < MAX_PAGES; page++) {
    if (page > 0) await sleep(PAGE_DELAY_MS);
    let data: unknown;
    try {
      const resp = await fetchWithRetry(ENDPOINT_TEMPLATE(company.atsToken), {
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '', workplace: [], department: [], ...(token !== null && { token }) }),
        },
      });
      data = await resp.json();
    } catch (err) {
      // The first page failing is the source failing, as it always was; a
      // later one keeps what the earlier pages brought.
      if (page === 0) throw err;
      logger.warn({ err, atsToken: company.atsToken, page }, 'workable: a later page failed; keeping the pages read');
      break;
    }
    out.push(...mapWorkableFeed(data, company.id, company.atsToken));
    const paging = workablePage(data);
    read += paging.rows;
    total = paging.total ?? total;
    if (paging.nextPage === null || (total !== null && read >= total)) {
      whole = total === null || read >= total;
      break;
    }
    token = paging.nextPage;
  }
  if (total !== null && read < total) {
    logger.warn({ atsToken: company.atsToken, total, read }, 'workable: board has more postings than the pages read');
  }
  if (whole) listedInFull(company.id);
  return out;
}

export function mapWorkableFeed(
  raw: unknown,
  companyId: number,
  slug: string,
): NormalizedJob[] {
  const top = WorkableResponseSchema.safeParse(raw);
  if (!top.success) return [];
  const out: NormalizedJob[] = [];
  for (const item of top.data.results) {
    const parsed = WorkableJobSchema.safeParse(item);
    if (!parsed.success) continue;
    const j = parsed.data;
    out.push({
      companyId,
      externalId: j.shortcode,
      title: j.title,
      url: `https://apply.workable.com/${slug}/j/${j.shortcode}/`,
      location: formatLocation(j),
      // Workable's public list endpoint omits the description body; Claude
      // classifies on the title alone for these roles.
      description: '',
      postedAt: j.published ? safeDate(j.published) : new Date(),
      locationHints: {
        countries: [j.location, ...j.locations].flatMap((l) => l?.countryCode ?? []),
        workplace: j.remote ? 'REMOTE' : workplaceFromText(j.workplace ?? ''),
      },
    });
  }
  return out;
}

function formatLocation(
  j: z.infer<typeof WorkableJobSchema>,
): string {
  const loc = j.location ?? {};
  const parts: string[] = [];
  const isRemote = j.remote || j.workplace === 'remote';
  if (isRemote) parts.push('Remote');
  const city = loc.city?.trim();
  const region = loc.region?.trim();
  const country = loc.country?.trim();
  const place = [city, region, country].filter(Boolean).join(', ');
  if (place.length > 0) parts.push(place);
  return parts.join(' · ') || (isRemote ? 'Remote' : '');
}

function safeDate(s: string): Date {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
