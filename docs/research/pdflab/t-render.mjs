import { renderPageAsImage, definePDFJSModule } from 'unpdf'
import { readFile, writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
await definePDFJSModule(() => import('pdfjs-dist/legacy/build/pdf.mjs'))
const buf = new Uint8Array(await readFile('fixtures/scanned.pdf'))
const t0 = performance.now()
const png = await renderPageAsImage(buf, 1, {
  scale: 2,
  canvasImport: () => import('@napi-rs/canvas'),
})
console.log('render ms:', Math.round(performance.now() - t0), 'bytes:', png.byteLength)
await writeFile('rendered.png', Buffer.from(png))
