import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/*
 * The type ladder (DESIGN.md → Typography) is one class per step: text-title,
 * text-kpi, text-section, text-entity, text-sm for the body, text-label,
 * text-note and text-meta. A raw size had crept back in 334 times (TASKS U3),
 * each with its own line and weight, so this reads every page, primitive and
 * browser module and names the file and the class that stepped off it. No
 * exception is left since 2.40.0: the two big numbers that had one (a status
 * card's value, the score ring) are the KPI step now.
 */
const RAW_SIZE = /!?(?<![\w-])text-(?:\[\d+(?:\.\d+)?(?:px|rem)\]|xs|base|lg|[2-9]?xl)(?![\w-])/g;
const OFF_LADDER_HEADING = /\btext-sm font-semibold\b/g;

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return sources(path);
    return /\.(tsx|ts|mjs)$/.test(e.name) && !e.name.endsWith('.test.ts') ? [path] : [];
  });
}

test('the dashboard writes its sizes as steps of the type ladder (TASKS U3)', () => {
  const found: string[] = [];
  for (const file of sources(__dirname)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(RAW_SIZE)) found.push(`${relative(__dirname, file)}: ${m[0]}`);
    for (const m of text.matchAll(OFF_LADDER_HEADING)) found.push(`${relative(__dirname, file)}: ${m[0]} — a heading is text-entity`);
  }
  assert.deepEqual(
    found,
    [],
    'use text-meta (12/400), text-note (13/400), text-label (13/550), text-entity (15/600), text-section (18/650), text-kpi (32/700) or text-title (30/700)',
  );
});
