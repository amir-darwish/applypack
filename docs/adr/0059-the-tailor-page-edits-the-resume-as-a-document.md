# 0059 — The Tailor page edits the resume as a document, and a save is always one

**Status:** Accepted (2026-09-30). Extends [0038](./0038-save-patches-the-users-docx-in-place.md)
and [0039](./0039-clean-render-from-json-resume.md); amends 0038's "a refused
patch keeps a text version".

## Context

After a comparison the owner wanted three things in one place: every
suggestion applied with one press, the resume on the right looking like the
document it is and editable there, and a `.docx` and a `.pdf` to send — with
no AI drawing the file, so that nothing comes back "in another style".

What stood in the way, measured on the live install before a line was written
(the analysis of the same day):

- Both stored resumes were PDFs, so the patcher of ADR 0038 covered none of
  them. The path to a styled file was five steps and a minute of AI — Apply
  card by card, Save, the resume page, Clean version, Download.
- A save the patcher could not write kept a **Markdown** file as the new
  version, over the PDF.
- The clean version of the owner's own PDF read as someone else's resume:
  the skills table as eight labels above eight value lines, the centred
  name left, the blue places and links black, the rule under the header
  gone, the company and its place one bold line.
- Apply all, simulated with the page's own modules over the ten stored
  comparisons: 40 of 47 changes, 13 of 14 removals and 5 of 5 keywords land,
  no quote goes missing.
- Every browser editor that keeps a `.docx` a `.docx` is AGPL, commercial or
  a server larger than ApplyPack, and none edits a PDF (the table in the
  analysis). docx-preview 0.4.1 drew the structural twin of the old `.docx`
  in 70 ms — tables, tab stops, formulas, colours — and edits nothing, which
  is exactly the half we need.

## Decision

1. **The text stays the one model.** Score, highlights, Apply, Undo, the
   change sheet and the patcher all read the editor's text. The document is
   a view of it: `POST /resumes/:id/document` draws the draft
   (`resume/draft-document.ts`, pure) — the user's own `.docx` with the edits
   patched in, or the clean version with a sentence saying why — and nothing
   is stored.
2. **docx-preview draws it in the browser** (`public/doc-pane.mjs`), with
   JSZip, both vendored byte for byte under `public/vendor/` and pinned by
   hash (`vendor.test.ts`). It is the one exception to "`public/` is our own
   dependency-free code", loaded only when the pane opens. A drawing settles
   off-screen for the tab stops (500 ms) before it swaps in.
3. **A paragraph is edited in place, and the edit goes to the text.** A
   paragraph is found in the text by its words (`locateParagraph`: the n-th
   identical paragraph is the n-th identical line; a table cell is a part of
   its row). A line set in columns or holding a formula is refused with the
   way to Plain text. Enter keeps, Escape puts back, emptying removes the
   line.
4. **Apply all** runs every open card's own operation in page order on the
   text the one before it left (`public/apply-all.mjs`). Each edit keeps the
   exact change its operation made plus 32 characters either side
   (`withContext`), so it can be undone alone after others moved it; Undo all
   walks them backwards. Removals are included unless their box is unticked.
5. **Downloads need no save.** `.docx` is the drawn file. `.pdf` is the clean
   version's pdfkit render; for the user's own `.docx` the pane prints the
   drawn sheet from a frame of its own, with the file's page size and
   margins as `@page` — the browser's Save as PDF. LibreOffice is not used:
   none is installed where this was built, so it could not be verified, and
   the Docker image would carry 240 MB for it.
6. **A save is always a document.** A draft the patcher cannot write is
   saved as the clean `.docx` the pane showed, in the look read off the file
   it replaces (`draft-document.ts:cleanDocx`); a Markdown version is left
   only when that file would drop a line of the resume (`missingLines`). The
   saved `.docx` is a flow file the next save patches in place.
7. **A PDF's clean version is set the way its page looks.** `pdf-geometry.ts`
   reads each text item's place, size, weight and — character by character,
   by walking the operator list's fill colours in step with the text items —
   its colour, and the thin horizontal bands among the paths.
   `pdf-layout.ts` (pure) turns that into the columns a line is set in, the
   skills table's pairing, and a look per kind of line (name, label,
   contact, link, heading, company, place, title, dates, body, table label
   and values, a "Technology Stack:" label and list), the header and heading
   rules and justified text. The text reader takes the pairing and the
   company/place split only where the page proves them and the text still
   lines up; the writers draw each run in its kind's look. Measured on the
   owner's PDF: 0 of 2 883 characters left without a colour.
8. **The clean version never loses a line.** The structure reader keeps a
   resume's own section headings, the header lines no field reads and the
   line after a role's bullets; an all-caps list is not a heading. When the
   structured reading would still drop a line, the clean version is drawn
   line by line instead (`planLines`).
9. **The patcher learned two things** it needed for this: a table row is
   rewritten cell by cell when the edit keeps its cells (adding a skill to a
   skills table), and the read-back gate expects the marker the reader will
   give a line (a body line cut down to capitals reads back as a heading).

## Consequences

✅ One press applies a comparison; the resume is shown and edited as the
document it is; both files are one press more; no model draws either.

✅ A PDF-only resume enters the loop on its first save and keeps its look:
the clean `.docx` it becomes is patched in place from then on.

❌ docx-preview is not Word: it does not paginate, so the pane marks where a
page would end (an estimate), and a font the machine lacks is substituted.

❌ The PDF of the user's own `.docx` goes through the print dialog; the exact
PDF of a Word file is still Word's own Save as PDF.

❌ A save of a PDF replaces its bytes with the clean `.docx`, as a text
version replaced them before; the original stays wherever the user keeps it.

## When to revisit

- A user asks to format inside ApplyPack (fonts, a new table): that is an
  editor with its own document model (eigenpal docx-editor is the one with a
  usable licence), and ADR 0038's gates would have to cover its writer.
- LibreOffice turns up on the machines that run this: then `soffice
  --convert-to pdf` of the user's own `.docx` earns its place beside print.
- A PDF whose look the reader gets wrong in a way a user reports: the looks
  are read per kind of line, and a new kind is a new role.
