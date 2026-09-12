import { extractTextItems, getDocumentProxy } from 'unpdf'
import { readFile } from 'node:fs/promises'
const pdf = await getDocumentProxy(new Uint8Array(await readFile('fixtures/text.pdf')))
const { totalPages, items } = await extractTextItems(pdf)
console.log('totalPages:', totalPages, '| items is per-page array:', Array.isArray(items), items.length)
console.log('page 2, first 2 items:')
console.log(JSON.stringify(items[1].slice(0, 2), null, 2))
