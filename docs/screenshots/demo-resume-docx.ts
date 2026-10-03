// The demo resume as a .docx, drawn by the app's own clean renderer from demo-resume.md:
//   npx tsx docs/screenshots/demo-resume-docx.ts   → docs/screenshots/demo-resume.docx
import fs from 'node:fs';
import path from 'node:path';
import { structureFromText } from '../../src/resume/structure-from-text';
import { renderDocx } from '../../src/resume/render/clean-docx';
import { knobsFrom } from '../../src/resume/render/knobs';

async function main(): Promise<void> {
  const text = fs.readFileSync(path.join(__dirname, 'demo-resume.md'), 'utf8');
  const bytes = await renderDocx(structureFromText(text), knobsFrom());
  fs.writeFileSync(path.join(__dirname, 'demo-resume.docx'), bytes);
  console.log(`demo-resume.docx, ${bytes.length} bytes`);
}

main().catch((err) => { console.error(err); process.exit(1); });
