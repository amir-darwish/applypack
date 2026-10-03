import { placeLabel } from '../countries';
import { WORKPLACE_LABEL, type WorkplaceCode } from '../location';

/*
 * Where a posting is, in one short line for a list row (pure): the
 * arrangement, then the first places by name and how many more there are —
 * "Remote · USA, Canada +3". It reads the structured columns (ADR 0031); a
 * row that has none keeps the posting's own words. The whole list is the
 * `title`, so nothing is lost to the "+3".
 */

/** How the three longest-named usual suspects are written in a row. */
const SHORT_NAME: Readonly<Record<string, string>> = { US: 'USA', GB: 'UK', AE: 'UAE' };

/** Places named before the rest become a count. */
const NAMED_PLACES = 2;

function name(code: string): string {
  return SHORT_NAME[code] ?? placeLabel(code);
}

/** The places a row names first: where the running searches hunt, and where the user lives. */
export function preferredPlaces(searches: readonly { countries: readonly string[]; residence: string | null }[]): string[] {
  return [...new Set(searches.flatMap((p) => [...p.countries, ...(p.residence ? [p.residence] : [])]))];
}

export interface PlaceInput {
  workplace: WorkplaceCode;
  countries: readonly string[];
  regions: readonly string[];
  location: string;
}

export interface PlaceLine {
  /** The short line a row shows. */
  text: string;
  /** Every place, for the row's tooltip. */
  title: string;
}

/**
 * `prefer` lists the codes to name first — the places the running searches
 * hunt in — so a posting open to seventy countries says "USA +69" to someone
 * searching the US, not "Albania, Andorra +68".
 */
export function placeLine(job: PlaceInput, prefer: readonly string[] = []): PlaceLine {
  const arrangement = job.workplace === 'UNKNOWN' ? '' : WORKPLACE_LABEL[job.workplace];
  const codes = job.countries.length > 0 ? job.countries : job.regions;
  if (codes.length === 0) {
    const words = job.location.trim() || arrangement || 'Remote';
    return { text: words, title: words };
  }
  const wanted = new Set(prefer);
  const ordered = [...codes].sort((a, b) => Number(wanted.has(b)) - Number(wanted.has(a)));
  const names = ordered.map(name);
  const shown = names.slice(0, NAMED_PLACES).join(', ');
  const more = names.length - NAMED_PLACES;
  const places = more > 0 ? `${shown} +${more}` : shown;
  const join = (list: string) => (arrangement ? `${arrangement} · ${list}` : list);
  return { text: join(places), title: join(names.join(', ')) };
}
