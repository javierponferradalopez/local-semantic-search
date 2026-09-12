import { extractText, getDocumentProxy } from 'unpdf'
import { readFile } from 'node:fs/promises'
const pdf = await getDocumentProxy(new Uint8Array(await readFile('fixtures/scanned.pdf')))
console.log(JSON.stringify(await extractText(pdf)))
