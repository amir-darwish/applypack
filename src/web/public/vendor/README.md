# Vendored browser libraries

The one place `src/web/public/` holds code we did not write. Both files are
served as they came from npm, byte for byte, and loaded only by the Tailor
page's document pane (`../doc-pane.mjs`), and only when that pane opens.
`src/web/vendor.test.ts` holds each file to the hash below, so an edit or an
upgrade cannot land without this table changing with it.

| File | Package | Version | Licence | SHA-256 |
| --- | --- | --- | --- | --- |
| `docx-preview.min.js` | [docx-preview](https://www.npmjs.com/package/docx-preview) (`dist/docx-preview.min.js`) | 0.4.1 | Apache-2.0 (`LICENSE-docx-preview.txt`) | `c4a133c65a112799e35b143c572dfff9e923a3bf39b5fd3b07a06aa0f8f530c2` |
| `jszip.min.js` | [jszip](https://www.npmjs.com/package/jszip) (`dist/jszip.min.js`) | 3.10.2 | MIT, chosen from MIT or GPLv3 (`LICENSE-jszip.md`) | `7f839b2d4688b845c105ebf5d2f9803075f91ea0fe72bdaac176c3a04dd3d2c1` |

docx-preview reads a `.docx` and draws it as HTML: pages, tables, tab stops,
formulas, the document's own fonts and colours. It needs JSZip on
`window.JSZip`, which is why the UMD builds are used and loaded in that order.
JSZip is the same version the server already depends on (`package.json`).

To upgrade: `npm pack docx-preview@<version>`, copy `package/dist/docx-preview.min.js`
here, and update the version and the hash in this table and in the test.
