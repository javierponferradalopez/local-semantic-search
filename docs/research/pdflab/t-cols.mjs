import { extractText, getDocumentProxy } from 'unpdf'
import { readFile } from 'node:fs/promises'
const pdf = await getDocumentProxy(new Uint8Array(await readFile('fixtures/cols.pdf')))
const { text } = await extractText(pdf)
console.log('--- unpdf extractText page 1 ---')
console.log(text[0])
const tc = await (await pdf.getPage(1)).getTextContent()
console.log('--- raw items (str | x | y) ---')
for (const i of tc.items) if (i.str.trim()) console.log(`${i.str.padEnd(18)} x=${i.transform[4]} y=${i.transform[5]}`)
