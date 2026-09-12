import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { readFile } from 'node:fs/promises'

async function probe(file) {
  const data = new Uint8Array(await readFile(file))
  const doc = await getDocument({ data, useSystemFonts: true }).promise
  const out = []
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n)
    const tc = await page.getTextContent()
    const chars = tc.items.reduce((a, i) => a + (i.str?.trim().length ?? 0), 0)
    const ops = await page.getOperatorList()
    const imageOps = ops.fnArray.filter(fn =>
      fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject ||
      fn === OPS.paintInlineImageXObject || fn === OPS.paintImageMaskXObject).length
    const [, , w, h] = page.getViewport({ scale: 1 }).viewBox
    const areaIn2 = (w / 72) * (h / 72)
    out.push({ page: n, chars, charsPerIn2: +(chars / areaIn2).toFixed(1), imageOps })
  }
  console.log(file, JSON.stringify(out))
  
}
await probe('fixtures/text.pdf')
await probe('fixtures/scanned.pdf')
