# Research: how to get text out of a PDF in Node

Ticket: [#4](https://github.com/javierponferradalopez/local-semantic-search/issues/4) — part of #1, blocks #9.
Date of the research: 2026-09-12. All versions and dates are from that day.

**Recommendation in one line: use `unpdf` as the primary library, and `pdfjs-dist` as the fallback.**

All measurements below come from real runs on Node v24.11.0, macOS (darwin 25.6.0). The
test files and scripts are in the scratchpad folder `pdflab/`. I did not add any
dependency to the product.

---

## 1. Summary of the answer

1. Every serious option in Node is Mozilla's PDF.js underneath. The choice is not
   "which parser", it is "which wrapper around PDF.js".
2. PDF.js gives the page number and the position of each text run. The citation
   constraint is satisfied. A flat string is not necessary.
3. A scanned PDF gives zero characters. You can detect this reliably in one pass.
   Local OCR in Node is possible and it works. I ran it.
4. Chunk inside a page first. Do not merge the pages into one string.
5. There are no licence problems with the recommended set. Two known libraries
   (`mupdf`, `node-poppler`) do have licence friction. Avoid them.

---

## 2. Comparison of the candidate libraries

| Library | Version | Last release | Licence | TS types | Plain Node | Page numbers | Position (x/y) | Install size | Runtime deps |
|---|---|---|---|---|---|---|---|---|---|
| [`pdfjs-dist`](https://www.npmjs.com/package/pdfjs-dist) | 6.3.289 | 2026-08-29 | Apache-2.0 | Yes (`types/src/pdf.d.ts`) | Yes, `legacy` build | Yes | Yes (`transform` matrix) | 35 MB | none |
| [`unpdf`](https://www.npmjs.com/package/unpdf) | 1.8.1 | 2026-08-13 | MIT | Yes (`.d.mts`) | Yes | Yes | Yes (`extractTextItems`) | 2.5 MB | **none** |
| [`pdf-parse`](https://www.npmjs.com/package/pdf-parse) | 2.4.5 | 2025-10-20 | Apache-2.0 | Yes | Yes | Yes (`pages[].num`) | No | 80 MB | `pdfjs-dist@5.4.296`, `@napi-rs/canvas@0.1.80` |
| [`pdf2json`](https://www.npmjs.com/package/pdf2json) | 4.1.0 | 2026-09-11 | Apache-2.0 | Yes | Yes | Yes (`x`, `y`) | Yes | 11 MB | none |
| [`pdfreader`](https://www.npmjs.com/package/pdfreader) | 3.0.8 | 2025-11-01 | MIT | Yes | Yes | Yes | Yes | small | `pdf2json` |
| [`mupdf`](https://www.npmjs.com/package/mupdf) | 1.28.1 | 2026-09-06 | **AGPL-3.0-or-later** | Yes | Yes | Yes | Yes | large | WASM |
| [`node-poppler`](https://www.npmjs.com/package/node-poppler) | 11.0.0 | 2026-09-01 | MIT wrapper, **GPL binaries** | Yes | Yes (native binary) | Yes | Yes | native | Poppler |
| [`pdf-text-extract`](https://www.npmjs.com/package/pdf-text-extract) | 1.5.0 | **2017-03-24** | BSD | No | Needs `pdftotext` | Partly | No | — | native |
| [`pdf-lib`](https://www.npmjs.com/package/pdf-lib) | 1.17.1 | **2021-11-06** | MIT | Yes | Yes | — | — | — | — |

### Health signals

Weekly downloads and repository activity, read on 2026-09-12:

| Library | Weekly downloads | Stars | Last commit | Open issues |
|---|---|---|---|---|
| `pdfjs-dist` (mozilla/pdf.js) | 19,688,474 | 53,861 | 2026-09-12 | 417 |
| `pdf-parse` (mehmet-kozan) | 6,468,339 | 220 | **2026-03-17** | 28 |
| `unpdf` (unjs) | 2,568,072 | 1,233 | 2026-08-14 | **1** |
| `tesseract.js` (naptha) | 2,295,831 | 38,694 | 2026-05-17 | 50 |
| `pdf2json` (modesty) | 364,850 | 2,212 | 2026-09-11 | 79 |
| `node-poppler` | 63,298 | — | — | — |
| `pdfreader` | 50,614 | — | — | — |

### Notes on each candidate

**`pdfjs-dist` — the engine.** This is Mozilla's PDF.js. It is the reference
implementation. It is released every month. It ships its own TypeScript types.
In Node you must import the `legacy` build, as the official Node example does:

```js
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
```

Source: [mozilla/pdf.js `examples/node/getinfo.mjs`](https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs).
The package declares `engines.node: ">=22.13.0 || >=24"`. The cost is the raw API:
you drive the page loop, you read a 6-number transformation matrix, and you build
the lines yourself.

**`unpdf` — the wrapper we want.** From the UnJS group. It **bundles** a build of
PDF.js, so it has **zero runtime dependencies**. The only peer dependency,
`@napi-rs/canvas`, is marked optional and is needed only to render a page as an
image. The bundled engine on 1.8.1 is PDF.js **6.1.200** (I read it with
`getResolvedPDFJS()`), which is one minor version behind the standalone package.
`getDocumentProxy()` returns a **real PDF.js `PDFDocumentProxy`**, so nothing is
hidden: you can always drop to the full PDF.js API from the same object. I verified
this — `pdf.getPage(2).getTextContent()` through the unpdf proxy returns the exact
same item objects as raw `pdfjs-dist`.

**`pdf-parse` — do not use.** The v2 rewrite is good on paper, but:
- The last v2 release is **2.4.5 on 2025-10-20**. The last commit on the repository
  is **2026-03-17**. That is about eleven months with no release, while PDF.js
  shipped four major-ish releases.
- It pins `pdfjs-dist@5.4.296`, a **whole major version behind** the current 6.x.
  You inherit old parser bugs and you cannot update the engine yourself.
- The newest thing published on the registry is **1.1.4 (2025-10-29)**, a patch on
  the legacy 1.x line. Two lines of the same name is a supply-chain smell for a
  portfolio project.
- It installs **80 MB**, because it hard-depends on both `pdfjs-dist` and an exact
  pin of `@napi-rs/canvas`.
- `getText()` gives the page number but **no coordinates**. Its flat `.text` field
  injects `-- 1 of 2 --` separators into the text. That string would go into the
  embeddings.

**`pdf2json` — a fair alternative, but a worse shape.** It is active (4.1.0 on
2026-09-11) and Apache-2.0. It gives `x`/`y` per text run. But it uses **its own
coordinate units**: for a 612x792 pt page it reports `Width: 38.25, Height: 49.5`,
that is points divided by 16. Text is also URI-encoded inside `R[].T`, so you must
call `decodeURIComponent`. Extra mapping for no extra benefit.

**`mupdf` and `node-poppler` — licence problem, see section 6.**

**`pdf-text-extract` and `pdf-lib` — dead or wrong tool.** `pdf-text-extract` has
not been released since **2017** and it shells out to the `pdftotext` binary.
`pdf-lib` has not been released since **2021** and it writes PDFs; it does not
extract text at all.

---

## 3. The data shape each library returns

This is the decisive part of the ticket. The citation constraint needs file, page
and position. All the outputs below are real, captured from a two-page test PDF.

### 3.1 `pdfjs-dist` — full detail, raw

```js
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
const doc = await getDocument({ data, useSystemFonts: true }).promise
const page = await doc.getPage(2)
const tc = await page.getTextContent()
```

`tc` has the keys `items`, `styles`, `lang`. One item:

```json
{
  "str": "Chapter Two: Chunking",
  "dir": "ltr",
  "width": 189.072,
  "height": 18,
  "transform": [18, 0, 0, 18, 72, 700],
  "fontName": "g_d0_f1",
  "hasEOL": false
}
```

The `transform` array is `[a, b, c, d, e, f]`. **`e` is x and `f` is y**, in PDF
points, with the origin at the bottom-left of the page. `a` is the font size.
`hasEOL` tells you where a line ends. The page box comes from
`page.getViewport({ scale: 1 }).viewBox`, here `[0, 0, 612, 792]`.

This is everything we need, but you must do the matrix work yourself.

### 3.2 `unpdf` — three levels, all useful

**Level 1, text per page** (`mergePages` off by default):

```js
const { totalPages, text } = await extractText(pdf)
```
```json
{
  "totalPages": 2,
  "text": [
    "Local Semantic Search\nChapter One: Extraction\nThe quick brown fox jumps over the lazy dog.\nPage one carries a citation anchor.",
    "Chapter Two: Chunking\nChunks must record which page they came from.\nColumn A text here. Column B text here."
  ]
}
```

The array index **is** the page index. This alone satisfies "which file, which page".
Note there are **no page-separator markers injected into the text**, unlike `pdf-parse`.

**Level 2, positioned items per page** — `extractTextItems()`, added in unpdf 1.7:

```js
const { totalPages, items } = await extractTextItems(pdf)
// items: StructuredTextItem[][]  — one array per page
```
```json
{
  "str": "Chapter Two: Chunking",
  "x": 72,
  "y": 700,
  "width": 189.072,
  "height": 18,
  "fontSize": 18,
  "fontFamily": "sans-serif",
  "dir": "ltr",
  "hasEOL": false
}
```

**This is the exact shape the citation constraint asks for.** `x` and `y` are already
decoded from the transformation matrix. `fontSize` is already extracted. No matrix
maths in our domain code. This is the single strongest argument for `unpdf`.

**Level 3, the escape hatch.** `getDocumentProxy()` returns the real PDF.js document,
so `getPage()`, `getTextContent()`, `getOperatorList()` and `getAnnotations()` all
stay available.

### 3.3 `pdf-parse` — page numbers, no position

```js
const r = await new PDFParse({ data }).getText()
// keys: ['pages', 'text', 'total']
```
```json
{ "text": "Chapter Two: Chunking\nChunks must record...", "num": 2 }
```

Only `text` and `num`. The typed contract confirms it:

```ts
export interface PageTextResult { num: number; text: string }
export declare class TextResult {
  pages: Array<PageTextResult>
  text: string
  total: number
  getPageText(num: number): string
}
```

The flat `r.text` is polluted:

```
"...Page one carries a citation anchor.\n\n-- 1 of 2 --\n\nChapter Two: Chunking..."
```

### 3.4 `pdf2json` — position, but in its own units

```json
{
  "x": 4.25,
  "y": 5,
  "w": 189.072,
  "clr": 0,
  "A": "left",
  "R": [{ "T": "Chapter Two: Chunking", "S": -1, "TS": [0, 21, 0, 0] }]
}
```

`x: 4.25` is 72 points divided by 16. `T` is normally URI-encoded. Page size is
reported as `Width: 38.25, Height: 49.5`.

---

## 4. The scanned PDF

### 4.1 What happens

Nothing breaks. No error is thrown. **You silently get an empty string**, which is
the dangerous case: a naive pipeline indexes an empty document and reports success.

I built an image-only PDF (a rasterised page wrapped as a PDF) and ran unpdf on it:

```json
{ "totalPages": 1, "text": [""] }
```

### 4.2 How to detect it programmatically

Two signals together. Never use only one.

1. **Character density per page.** Count the characters the text layer gives, and
   divide by the page area in square inches. A real text page is far above zero.
2. **Image paint operations.** Ask PDF.js for the operator list and count the
   image-painting operators. A scan is one big image and nothing else.

```js
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs'

const page = await doc.getPage(n)

const tc = await page.getTextContent()
const chars = tc.items.reduce((a, i) => a + (i.str?.trim().length ?? 0), 0)

const ops = await page.getOperatorList()
const imageOps = ops.fnArray.filter(fn =>
  fn === OPS.paintImageXObject ||
  fn === OPS.paintJpegXObject ||
  fn === OPS.paintInlineImageXObject ||
  fn === OPS.paintImageMaskXObject).length

const [, , w, h] = page.getViewport({ scale: 1 }).viewBox
const charsPerIn2 = chars / ((w / 72) * (h / 72))

const needsOcr = charsPerIn2 < 5 && imageOps > 0
```

Measured output of that probe on my two fixtures:

```
fixtures/text.pdf    [{"page":1,"chars":123,"charsPerIn2":1.3,"imageOps":0},
                      {"page":2,"chars":104,"charsPerIn2":1.1,"imageOps":0}]
fixtures/scanned.pdf [{"page":1,"chars":0,"charsPerIn2":0,"imageOps":1}]
```

The separation is clean: `chars > 0, imageOps = 0` against `chars = 0, imageOps = 1`.
My fixtures are sparse test pages, so their density is low; on a real prose page the
density is much higher, which widens the gap further. **Decide per page, not per
document** — a real report often mixes typed pages and scanned inserts.

### 4.3 Local OCR in Node — it works, and I measured it

The whole path runs locally. I ran it end to end:

1. Detect the empty text layer (above).
2. Render the page to a PNG with `unpdf`'s `renderPageAsImage`, which needs the
   optional peer `@napi-rs/canvas` (MIT, 1.0.9, 2026-09-09):

```js
import { renderPageAsImage, definePDFJSModule } from 'unpdf'
await definePDFJSModule(() => import('pdfjs-dist/legacy/build/pdf.mjs'))
const png = await renderPageAsImage(buf, 1, {
  scale: 2,
  canvasImport: () => import('@napi-rs/canvas'),
})
```

3. OCR the PNG with `tesseract.js` (Apache-2.0, 7.0.0, 2025-12-15):

```js
const worker = await createWorker('eng', 1, { langPath: '.', cachePath: '.' })
const r = await worker.recognize('rendered.png')
```

**Measured result:** render 190 ms, OCR **confidence 95**, and the text came back
correct and complete:

```
"Local Semantic Search\n\nChapter One: Extraction\nThe quick brown fox jumps over the lazy dog.\nPage one carries a citation anchor.\n"
```

**Measured cost:**

| Item | Cost |
|---|---|
| Worker start, first time (includes the model download) | 1052 ms |
| `recognize()` on one page at 150 DPI | **142 ms** |
| `eng.traineddata` model file | **5.0 MB** |
| `tesseract.js-core` (WASM) on disk | **43 MB** |
| Render one page to PNG at scale 2 | 190 ms |

142 ms is for a sparse test page. A dense A4 page of prose is realistically in the
0.5 to 2 s range per page. Assume **about 1 s per page**, single-threaded, and use a
Tesseract scheduler with several workers to use more cores.

**Important for the "everything runs local" rule:** by default `tesseract.js`
**downloads `eng.traineddata` from a CDN on first use**. That is a hidden network
call. Pass `langPath` and `cachePath` pointing at a folder we ship or populate once,
as I did above; then it is fully offline. This must be an explicit decision, not a
default.

**OCR output shape** — it also carries position, so an OCR citation is possible:

```js
const r = await worker.recognize(png, {}, { blocks: true })
// r.data.confidence -> 95
// block keys: ['bbox', 'text', 'confidence', 'blocktype', 'paragraphs']
```
```json
{ "text": "Local", "bbox": { "x0": 153, "y0": 165, "x1": 237, "y1": 193 }, "conf": 96 }
```

Note the coordinate systems differ: Tesseract `bbox` is in **pixels of the rendered
image, origin top-left**; PDF.js is in **points, origin bottom-left**. Convert with
the render scale and the page height, or the citations will point to the wrong place.

### 4.4 The ONNX alternative

If Tesseract accuracy is not enough later:

- [`ppu-paddle-ocr`](https://www.npmjs.com/package/ppu-paddle-ocr) — **6.5.1,
  2026-09-08, MIT**. Runs PP-OCRv5 on ONNX Runtime in plain Node. Actively
  released. The strongest current option.
- [`@gutenye/ocr-node`](https://www.npmjs.com/package/@gutenye/ocr-node) — 1.4.8,
  MIT, but the last publish is **2024-12-13**. Stale.
- [`onnxruntime-node`](https://www.npmjs.com/package/onnxruntime-node) — 1.29.0,
  MIT. The base runtime if we ever load a model ourselves.

Reported accuracy of PP-OCRv5 beats Tesseract's LSTM models by roughly 5 to 15
character points on receipts and modern fonts, per the comparison write-ups linked
in the sources. **Do not do this in version one.** Tesseract.js is Apache-2.0,
proven, and good enough. Keep OCR behind a port so the engine can be swapped.

---

## 5. How extraction meets chunking

### 5.1 The page is not a semantic unit, but it is the citation unit

A page break is a printing accident. A sentence, a paragraph and a table routinely
cross it. So:

- **Chunk inside a page first.** Group the text items of one page into lines with
  `hasEOL` and `y`, group lines into paragraphs, then split paragraphs to the token
  budget. Every chunk then holds exactly one page number and a real bounding box.
- **Allow a chunk to join the next page only when the paragraph clearly continues**
  (the last line of page N is not terminated and the first line of page N+1 is not a
  heading). Record such a chunk as a **page range**, `pageStart` and `pageEnd`, not a
  single page. Design the citation metadata for a range from day one; a single page
  is the case where start equals end.
- **Never call `extractText(pdf, { mergePages: true })` for indexing.** It returns one
  flat string and destroys the page boundary. That is exactly the shape the ticket
  calls a poor fit. It is fine for a quick preview, nothing else.

### 5.2 What the libraries make easy

- `unpdf.extractText()` returns `text: string[]`, one entry per page. Per-page
  chunking is the default path, not extra work.
- `unpdf.extractTextItems()` returns `items: StructuredTextItem[][]`, per page, with
  `x`, `y`, `fontSize` and `hasEOL`. This is what you need to rebuild paragraphs, to
  detect headings by font size, and to store a bounding box on each chunk.
- `pdf-parse` makes per-page easy but cannot give a bounding box, and pollutes the
  flat text with `-- n of m --`.
- `pdfjs-dist` alone makes everything possible but nothing easy.

### 5.3 The reading-order trap

PDF.js returns text items in **content-stream order, not visual reading order**. On
my two-column fixture the order came out correct:

```
LEFT line one      x=72  y=700
LEFT line two      x=72  y=680
LEFT line three    x=72  y=660
RIGHT line one     x=320 y=700
RIGHT line two     x=320 y=680
RIGHT line three   x=320 y=660
```

But that is luck: it is correct only because the producer wrote the stream in that
order. A different producer can interleave the columns and you get "LEFT line one
RIGHT line one LEFT line two ...", which is nonsense once embedded. Two-column
academic papers are a common source of this. See
[mozilla/pdf.js#18201](https://github.com/mozilla/pdf.js/issues/18201).

**This is the reason to keep `x` and `y`.** With positions you can cluster items by
`x` into columns and sort within each column. With a flat string you cannot repair
it, and you cannot even detect it. A flat-string library is a dead end here.

### 5.4 Practical starting point

Start with roughly **400 to 512 tokens per chunk**, split on paragraph boundaries,
and measure before tuning. Recent work reports that chunk **overlap gave no
measurable retrieval benefit** and only raised indexing cost, so start at zero
overlap and add it only if the numbers say so. Store on every chunk: file path, file
hash, page start, page end, chunk ordinal, bounding box, and the exact text.

---

## 6. Licences

For an open-source portfolio project, the safe set is permissive: MIT, Apache-2.0, BSD.

| Package | Licence | Verdict |
|---|---|---|
| `unpdf` | **MIT** | Clean. |
| `pdfjs-dist` | **Apache-2.0** | Clean. Includes a patent grant, which is a plus. |
| `@napi-rs/canvas` | **MIT** | Clean. Optional, only for rendering. |
| `tesseract.js` | **Apache-2.0** | Clean. |
| Tesseract `*.traineddata` models | **Apache-2.0** | Clean. Redistributable if we ship them. |
| `pdf-parse` | **Apache-2.0** | Licence fine; rejected for maintenance reasons. |
| `pdf2json` | **Apache-2.0** in `package.json` | Fine. GitHub shows `NOASSERTION` because the licence file is not in a standard form — cosmetic, but worth a note. |
| `pdfreader` | MIT | Fine, but it is a thin layer on `pdf2json`. |
| `ppu-paddle-ocr` | **MIT** | Clean, if we ever need it. |
| `onnxruntime-node` | **MIT** | Clean. |
| **`mupdf`** | **AGPL-3.0-or-later** | **Avoid.** Strong copyleft with a network clause. Artifex sells a commercial licence precisely for this. It would force the AGPL on our project and on anyone who runs it as a service. |
| **`node-poppler`** | MIT wrapper over **GPL** Poppler binaries | **Avoid.** The npm wrapper is MIT, but it ships and executes Poppler command-line tools which are GPL-2.0/GPL-3.0. It also needs native binaries, which fights the "runs locally, installs cleanly" goal. |
| `pdf-text-extract` | BSD | Licence fine, package dead since 2017. |

**Conclusion: no licence problem in the recommended stack.** The whole path —
`unpdf` (MIT) + `pdfjs-dist` (Apache-2.0) + `@napi-rs/canvas` (MIT) +
`tesseract.js` (Apache-2.0) — is permissive and safe to publish.

---

## 7. Recommendation

### Primary: `unpdf` (1.8.1, MIT)

1. **It gives the citation shape directly.** `extractTextItems()` returns per-page
   arrays with `x`, `y`, `width`, `height`, `fontSize` and `hasEOL` already decoded.
   No matrix maths leaks into the domain layer. Nothing else on this list does that.
2. **Per-page text is the default.** `extractText()` returns `string[]`, one entry
   per page, with no injected separators. The page number is the array index.
3. **Zero runtime dependencies, 2.5 MB.** Compare with 80 MB for `pdf-parse`.
   `@napi-rs/canvas` is an optional peer, installed only when we add OCR.
4. **No lock-in.** `getDocumentProxy()` returns a real PDF.js `PDFDocumentProxy`. I
   confirmed that `getTextContent()` through it returns byte-identical items to raw
   `pdfjs-dist`. If unpdf ever lacks something, we drop one level without a rewrite.
   This makes the primary and the fallback the *same engine* — a very cheap escape.
5. **Healthy.** MIT, first-class TypeScript types, `engines.node: ">=22"`, 2.57M
   weekly downloads, **1 open issue**, last commit 2026-08-14.
6. It also covers `renderPageAsImage`, which we need anyway to feed OCR.

**The one real drawback:** unpdf 1.8.1 bundles PDF.js **6.1.200** while the current
`pdfjs-dist` is **6.3.289**. It lags the engine by weeks. This is mitigated by
`definePDFJSModule()`, which lets us point unpdf at our own `pdfjs-dist` version.

### Fallback: `pdfjs-dist` (6.3.289, Apache-2.0)

Use it directly when:
- unpdf lags a PDF.js fix we need, or
- we need a low-level API unpdf does not wrap, above all
  `getOperatorList()` for the scanned-page detection in section 4.2, or
- unpdf ever goes unmaintained.

It is the engine under every option here, Mozilla-backed, released monthly,
Apache-2.0 with a patent grant, with its own types. It cannot disappear. The
migration cost is near zero because unpdf hands us the same object.

### Rejected, with the reason

- **`pdf-parse`** — no coordinates, pins a PDF.js major behind, 80 MB, no release in
  about eleven months, two confusing version lines on npm.
- **`pdf2json`** — active and Apache-2.0, but non-standard units and URI-encoded
  text, for no benefit over unpdf.
- **`mupdf`** — AGPL-3.0. Not usable for this project.
- **`node-poppler`** — GPL binaries plus a native dependency.
- **`pdf-lib`**, **`pdf-text-extract`** — dead, or not a text extractor.

### For OCR: `tesseract.js` (7.0.0, Apache-2.0), behind a port

Proven, permissive, and measured working here at 95 confidence. Ship the
`traineddata` locally with `langPath` so no network call happens at runtime. Put it
behind an `OcrPort` so `ppu-paddle-ocr` (ONNX, MIT) can replace it later without
touching the domain.

### Suggested boundary for the hexagon

One driven port, something like `PdfTextExtractorPort`, returning a page-indexed
structure with positions, plus a separate `OcrPort`. Two adapters for the first:
an `unpdf` adapter, and a thin `pdfjs-dist` adapter kept as the fallback. The
scanned-page decision belongs in the adapter (it needs `getOperatorList`), but the
*policy* threshold belongs in the domain.

---

## 8. Open questions for the implementation ticket (#9)

1. What density threshold marks a page as scanned? My fixtures suggest the gap is
   wide, but it must be tuned on real documents.
2. Do we OCR eagerly at index time, or lazily? Eager is simpler and about 1 s per
   page; a 300-page scan is 5 minutes.
3. Do we ship `eng.traineddata` (5 MB) in the repository, or fetch it once at
   install time? The "everything runs local" rule pushes towards shipping it.
4. Do we store the bounding box per chunk from version one, or only the page number?
   Storing it is cheap now and expensive to backfill.
5. Encrypted and password-protected PDFs are not covered in this report.

---

## 9. Sources

Registry and repository data was read on **2026-09-12** with `npm view`, the npm
downloads API, and the GitHub API.

**Libraries**
- [pdfjs-dist on npm](https://www.npmjs.com/package/pdfjs-dist)
- [mozilla/pdf.js on GitHub](https://github.com/mozilla/pdf.js)
- [PDF.js API documentation (`TextItem`, `getTextContent`)](https://mozilla.github.io/pdf.js/api/draft/api.js.html)
- [PDF.js Node example `getinfo.mjs`](https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs)
- [unpdf on npm](https://www.npmjs.com/package/unpdf)
- [unjs/unpdf README](https://github.com/unjs/unpdf)
- [pdf-parse on npm](https://www.npmjs.com/package/pdf-parse)
- [mehmet-kozan/pdf-parse on GitHub](https://github.com/mehmet-kozan/pdf-parse)
- [pdf-parse documentation site](https://mehmet-kozan.github.io/pdf-parse/)
- [pdf2json on GitHub](https://github.com/modesty/pdf2json)
- [pdfreader on npm](https://www.npmjs.com/package/pdfreader)
- [mupdf on npm (AGPL-3.0-or-later)](https://www.npmjs.com/package/mupdf)
- [node-poppler on GitHub](https://github.com/Fdawgs/node-poppler)
- [pdf-lib on npm](https://www.npmjs.com/package/pdf-lib)
- [pdf-text-extract on npm](https://www.npmjs.com/package/pdf-text-extract)

**Reading order**
- [pdf.js issue #18201 — getTextContent breaks up text inconsistently](https://github.com/mozilla/pdf.js/issues/18201)
- [Nutrient — server-side text extraction with PDF.js in Node](https://www.nutrient.io/blog/pdfjs-server-side-text-extraction/)

**OCR**
- [tesseract.js on npm](https://www.npmjs.com/package/tesseract.js)
- [naptha/tesseract.js README](https://github.com/naptha/tesseract.js)
- [ppu-paddle-ocr on npm](https://www.npmjs.com/package/ppu-paddle-ocr)
- [gutenye/ocr on GitHub](https://github.com/gutenye/ocr)
- [onnxruntime-node on npm](https://www.npmjs.com/package/onnxruntime-node)
- [Deterministic OCR in JavaScript: PaddleOCR for Node, Bun, Deno and the Browser (May 2026)](https://dev.to/awalariansyah/deterministic-ocr-in-javascript-paddleocr-for-node-bun-deno-and-the-browser-2bgn)
- [On-device OCR reviewed — PaddleOCR vs Tesseract vs transformer OCR](https://lofttools.com/blog/on-device-ocr-reviewed/)
- [Modal — 8 top open-source OCR models compared](https://modal.com/blog/8-top-open-source-ocr-models-compared)
- [@napi-rs/canvas on GitHub](https://github.com/Brooooooklyn/canvas)

**Chunking**
- [Firecrawl — best chunking strategies for RAG in 2026](https://www.firecrawl.dev/blog/best-chunking-strategies-rag)
- [Empirical evaluation of PDF parsing and chunking for financial QA with RAG (arXiv 2604.12047)](https://arxiv.org/pdf/2604.12047)
- [Vision-guided chunking for RAG (arXiv 2506.16035)](https://arxiv.org/pdf/2506.16035)
- [Citation-enforced RAG (arXiv 2603.14170)](https://arxiv.org/pdf/2603.14170)

**Experiments**
All runs are reproducible from `pdflab/` in the scratchpad: `t-pdfjs.mjs`,
`t-unpdf.mjs`, `t-items.mjs`, `t-pdfparse.mjs`, `t-pdf2json.mjs`, `t-scanned.mjs`,
`t-render.mjs`, `t-ocr.mjs`, `t-cols.mjs`, with fixtures built by Ghostscript
(`ps2pdf`) and `sips`. Node v24.11.0, npm 11.6.1, macOS darwin 25.6.0.
