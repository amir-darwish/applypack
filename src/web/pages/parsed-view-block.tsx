/** @jsxImportSource hono/jsx */
import type { FC } from 'hono/jsx';
import type { ParsedView } from '../parsed-view';
import { Badge } from '../ui';

/**
 * What a plain parser pulls out of the text (TASKS R12): the name, the
 * contacts, the sections and the roles with their dates. A part missing here
 * is a part an ATS is likely to miss too; a role without dates is the one a
 * recruiter's filter drops. On /resumes/:id and on the two-format comparison.
 */
export const ParsedViewBlock: FC<{ view: ParsedView }> = ({ view }) => (
  <div class="mb-4 space-y-3 text-sm">
    <div class="flex flex-wrap items-baseline gap-x-2">
      <span class="text-entity text-ink">{view.name ?? 'No name found'}</span>
      {view.headline && <span class="text-ink-muted">{view.headline}</span>}
    </div>
    <div class="flex flex-wrap gap-1.5">
      {view.contacts.map((c) => (
        <Badge tone={c.value ? 'ok' : 'warn'}>{c.value ? `${c.label}: ${c.value}` : `${c.label}: not found`}</Badge>
      ))}
    </div>
    <div>
      <span class="text-ink-muted">Sections: </span>
      <span class="text-ink">{view.sections.length > 0 ? view.sections.join(' · ') : 'none recognised'}</span>
    </div>
    {view.roles.length > 0 && (
      <ul class="space-y-1">
        {view.roles.map((r) => (
          <li class="flex flex-wrap items-center gap-2">
            <span class="text-ink">{r.company ? `${r.title}, ${r.company}` : r.title}</span>
            {r.dates ? <span class="text-xs text-ink-faint">{r.dates}</span> : <Badge tone="warn">no dates</Badge>}
            <span class="text-xs text-ink-faint">{r.bullets === 1 ? '1 bullet' : `${r.bullets} bullets`}</span>
          </li>
        ))}
      </ul>
    )}
    {view.education.length > 0 && (
      <div class="text-ink-muted">
        Education: {view.education.map((e) => (e.dates ? `${e.title} (${e.dates})` : e.title)).join(' · ')}
      </div>
    )}
  </div>
);
