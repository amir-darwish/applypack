import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { displayName, expandUploads, findDuplicate, fingerprintBytes, fingerprintText, isAcceptedResume, coverLetterSignal, letterOwners, planIntake, type ReadFile, type UploadedDocument } from './intake';

/** The same in-memory zip writer zip.test.ts uses. */
function buildZip(entries: { name: string; data: Buffer }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8');
    const payload = deflateRawSync(e.data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(e.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    name.copy(local, 30);
    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(payload.length, 20);
    central.writeUInt32LE(e.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    locals.push(local, payload);
    centrals.push(central);
    offset += local.length + payload.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, eocd]);
}

test('expandUploads opens zips, skips OS litter and non-resume types, passes files through', () => {
  const zip = buildZip([
    { name: 'batch/', data: Buffer.alloc(0) },
    { name: 'batch/anna.pdf', data: Buffer.from('pdf') },
    { name: 'batch/__MACOSX/._anna.pdf', data: Buffer.from('junk') },
    { name: 'batch/.DS_Store', data: Buffer.from('junk') },
    { name: 'batch/~$draft.docx', data: Buffer.from('lock') },
    { name: 'batch/notes.xlsx', data: Buffer.from('xlsx') },
  ]);
  const { files, badArchives, oversized, notResumes } = expandUploads([
    { name: 'batch.zip', bytes: zip },
    { name: 'Ivan Petrenko/CV.docx', bytes: Buffer.from('docx') },
    { name: 'Ivan Petrenko/photo.jpg', bytes: Buffer.from('jpg') },
    { name: 'broken.zip', bytes: Buffer.from('not a zip at all, sorry') },
  ]);
  assert.deepEqual(
    files.map((f) => [f.name, f.archive]),
    [
      ['batch/anna.pdf', 'batch.zip'],
      ['Ivan Petrenko/CV.docx', null],
    ],
    'a folder path stays on the name',
  );
  assert.deepEqual(badArchives, ['broken.zip']);
  assert.deepEqual(oversized, []);
  assert.deepEqual(notResumes, ['batch/notes.xlsx', 'Ivan Petrenko/photo.jpg']);
  assert.equal(displayName(files[0]!), 'batch/anna.pdf (from batch.zip)');
  assert.equal(displayName({ name: './x/CV.pdf', bytes: Buffer.alloc(0), archive: null }), 'x/CV.pdf');
  assert.ok(isAcceptedResume('anna.PDF'));
  assert.ok(!isAcceptedResume('notes.xlsx'));
});

test('findDuplicate: the same text is a re-upload, the same person is another version', () => {
  const body = 'Backend engineer with eight years of Java and Spring Boot. Built payment systems at a bank, ran migrations, owned the on-call rotation, mentored four engineers, spoke at two conferences about resilience patterns and message brokers. '.repeat(4);
  const a = fingerprintText(body);
  const known = [{ id: 1, number: 1, email: 'a@x.io', phone: '+380 67 123 45 67', hash: a.hash, simhash: a.simhash }];
  assert.equal(findDuplicate({ email: null, phone: null, ...fingerprintText(body.toUpperCase()) }, known)?.kind, 'same-text', 'case does not make a new text');
  assert.equal(findDuplicate({ email: 'A@X.IO', phone: null, hash: 'other', simhash: null }, known)?.kind, 'same-person', 'same email, other document');
  assert.equal(findDuplicate({ email: null, phone: '0671234567', hash: 'other', simhash: null }, known), null, 'a local number is not the international one');
  assert.equal(findDuplicate({ email: null, phone: '380 (67) 123-45-67', hash: 'other', simhash: null }, known)?.kind, 'same-person', 'the same digits are the same phone');
  const edited = `Updated 2026\n${body}`;
  assert.equal(findDuplicate({ email: null, phone: null, ...fingerprintText(edited) }, known)?.kind, 'same-person', 'a re-upload with a new line on top is a version');
  assert.equal(findDuplicate({ email: 'b@y.io', phone: null, ...fingerprintText('Completely different frontend resume about React and design systems. '.repeat(8)) }, known), null);
});

test('fingerprintBytes: the same bytes are one hash, different bytes are not, and it is a 32-char hex', () => {
  const a = fingerprintBytes(Buffer.from('%PDF-1.4 scanned'));
  assert.equal(a, fingerprintBytes(Buffer.from('%PDF-1.4 scanned')));
  assert.notEqual(a, fingerprintBytes(Buffer.from('%PDF-1.4 scanned ')));
  assert.match(a, /^[0-9a-f]{32}$/);
});

test('planIntake decides the whole upload before a row is written (TASKS H23/H25)', () => {
  const cv = (who: string, extra = '') => `${who} — QA engineer. Built Playwright suites for payments; ran the release train. ${extra}`.repeat(6);
  const read = (text: string | null, email: string | null = null): ReadFile => ({
    text,
    email,
    phone: null,
    print: text === null ? { hash: `bytes-${Math.random()}`, simhash: null } : fingerprintText(text),
  });
  const stored = { id: 41, number: 7, email: 'old@x.io', phone: null, ...fingerprintText(cv('Old')) };
  const plan = planIntake(
    [
      read(cv('Ann'), 'ann@x.io'), // new
      read(cv('Old')), // the same text as a stored row: a repeat
      read(cv('Ann', 'Cover letter attached.'), 'ann@x.io'), // Ann's second document, earlier in this upload
      read(null), // unreadable: added, compared with nothing
      read(cv('Ann'), 'ann@x.io'), // Ann's first file again, in the same upload: a repeat
      read(cv('Bob'), 'old@x.io'), // the stored applicant's email: another of theirs
    ],
    [stored],
  );
  assert.deepEqual(plan.repeats, [1, 4]);
  assert.deepEqual(plan.adds, [
    { file: 0, sameAs: null },
    { file: 2, sameAs: { add: 0 } },
    { file: 3, sameAs: null },
    { file: 5, sameAs: { id: 41 } },
  ]);
});

// TASKS E3 (Q9): a cover letter is attached to its person, never scored.
const LETTER = `Dear Hiring Team,

I am writing to apply for the QA Automation Engineer role. At Acme I built the Playwright suite that cut our regression cycle from three days to four hours.

I would welcome a conversation.

Kind regards,
Ann Lee`;
const CV = `Ann Lee
QA Automation Engineer

EXPERIENCE
Acme — QA Engineer, 2021 – Present

SKILLS
Playwright, TypeScript`;

test('coverLetterSignal reads the name, or a salutation and a valediction with no resume heading', () => {
  assert.equal(coverLetterSignal('Ann Lee/letter.pdf', LETTER), 'text', 'the text alone says it');
  assert.equal(coverLetterSignal('Ann_Lee_Cover_Letter.pdf', 'Short note about me.'), 'name', 'the file name alone says it');
  assert.equal(coverLetterSignal('Anschreiben.docx', 'Sehr geehrte Damen und Herren'), 'name');
  assert.equal(coverLetterSignal('Ann Lee/cv.pdf', CV), null);
  assert.equal(coverLetterSignal('cv_and_cover_letter.pdf', `${LETTER}\n\n${CV}`), null, 'a letter on top of a CV is the CV');
  assert.equal(coverLetterSignal('notes.txt', 'Hello team, I shipped the release. Regards from Kyiv are not a signature.'), null);
  assert.equal(coverLetterSignal('ann.pdf', `${LETTER}\n\nEXPERIENCE\nAcme 2021 – Present`), null, 'one resume heading and it is not a letter by its words');
});

test('letterOwners: the folder, then the email or phone, then the file name', () => {
  const doc = (name: string, email: string | null = null, phone: string | null = null, archive: string | null = null): UploadedDocument => ({ name, archive, email, phone });
  const resumes = [doc('Ann Lee/cv.pdf', 'ann@x.io'), doc('Bob Stone/cv.pdf', 'bob@x.io'), doc('Cara_Diaz_CV.pdf'), doc('Dan_Fox_resume.pdf', null, '+48 600 100 200')];
  const known = [{ id: 41, number: 7, email: 'eve@x.io', phone: null, hash: 'h', simhash: null }];
  assert.deepEqual(
    letterOwners(
      [
        doc('Ann Lee/letter.pdf'), // her folder
        doc('letter-bob.pdf', 'BOB@x.io'), // his email
        doc('Cara_Diaz_Cover_Letter.pdf'), // the same stem
        doc('motivation.pdf', null, '600 100 200'), // the number without its country code is another number
        doc('eve-letter.pdf', 'eve@x.io'), // a stored applicant's email
        doc('Stranger_Cover_Letter.pdf'), // nobody's
      ],
      resumes,
      known,
    ),
    [{ add: 0 }, { add: 1 }, { add: 2 }, null, { id: 41 }, null],
  );
  // Two files at the top of an upload, one of them a resume: the letter is that person's.
  assert.deepEqual(letterOwners([doc('letter.pdf')], [doc('cv.pdf')], []), [{ add: 0 }]);
  // The same folder name in two archives is two folders.
  assert.deepEqual(letterOwners([doc('x/letter.pdf', null, null, 'b.zip')], [doc('x/cv.pdf', null, null, 'a.zip')], []), [null]);
});
