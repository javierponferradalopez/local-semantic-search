import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { readFile } from 'node:fs/promises'
const data = new Uint8Array(await readFile('fixtures/text.pdf'))
const doc = await getDocument({ data, useSystemFonts: true }).promise
console.log('numPages:', doc.numPages)
const page = await doc.getPage(2)
console.log('viewport:', JSON.stringify(page.getViewport({scale:1}).viewBox))
const tc = await page.getTextContent()
console.log('keys of textContent:', Object.keys(tc))
console.log('first 4 items:')
console.log(JSON.stringify(tc.items.slice(0,4), null, 2))
console.log('styles sample:', JSON.stringify(Object.entries(tc.styles).slice(0,1), null, 2))
