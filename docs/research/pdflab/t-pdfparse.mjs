import { PDFParse } from 'pdf-parse'
import { readFile } from 'node:fs/promises'
const data = new Uint8Array(await readFile('fixtures/text.pdf'))
const parser = new PDFParse({ data })
const r = await parser.getText()
console.log('top-level keys:', Object.keys(r))
console.log('total:', r.total, 'pages len:', r.pages?.length)
console.log('pages[1]:', JSON.stringify(r.pages?.[1], null, 2).slice(0, 1200))
console.log('--- text (flat) ---')
console.log(JSON.stringify(r.text))
await parser.destroy()
