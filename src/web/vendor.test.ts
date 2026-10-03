import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/*
 * The two libraries the document pane loads are the only code in
 * src/web/public we did not write (vendor/README.md). They ship as npm built
 * them: an edit, or an upgrade that forgot its README row, fails here.
 */
const VENDOR = join(__dirname, 'public', 'vendor');
const PINNED: Record<string, { sha256: string; licence: string }> = {
  'docx-preview.min.js': { sha256: 'c4a133c65a112799e35b143c572dfff9e923a3bf39b5fd3b07a06aa0f8f530c2', licence: 'LICENSE-docx-preview.txt' },
  'jszip.min.js': { sha256: '7f839b2d4688b845c105ebf5d2f9803075f91ea0fe72bdaac176c3a04dd3d2c1', licence: 'LICENSE-jszip.md' },
};

test('every vendored file is the one its README row names, with its licence beside it', () => {
  const readme = readFileSync(join(VENDOR, 'README.md'), 'utf8');
  for (const [file, pin] of Object.entries(PINNED)) {
    const hash = createHash('sha256').update(readFileSync(join(VENDOR, file))).digest('hex');
    assert.equal(hash, pin.sha256, `${file} changed — upgrade it through vendor/README.md`);
    assert.ok(readme.includes(pin.sha256), `${file}'s hash is not in vendor/README.md`);
    assert.ok(existsSync(join(VENDOR, pin.licence)), `${pin.licence} is missing`);
  }
});

test('the vendored JSZip is the version the server runs', () => {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')) as { dependencies: Record<string, string> };
  const head = readFileSync(join(VENDOR, 'jszip.min.js'), 'utf8').slice(0, 200);
  assert.match(head, new RegExp(`JSZip v${pkg.dependencies.jszip!.replace(/[.^~]/g, (c) => (c === '.' ? '\\.' : ''))}\\b`));
});
