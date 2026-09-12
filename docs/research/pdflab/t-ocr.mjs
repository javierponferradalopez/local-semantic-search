import { createWorker } from 'tesseract.js'
import { performance } from 'node:perf_hooks'
const t0 = performance.now()
const worker = await createWorker('eng')
const t1 = performance.now()
console.log('worker init (incl. model download) ms:', Math.round(t1 - t0))
const r = await worker.recognize('fixtures/page1.png', {}, { blocks: true })
const t2 = performance.now()
console.log('recognize ms:', Math.round(t2 - t1))
console.log('confidence:', r.data.confidence)
console.log('text:', JSON.stringify(r.data.text))
const b = r.data.blocks?.[0]
console.log('block keys:', b && Object.keys(b))
const line = b?.paragraphs?.[0]?.lines?.[0]
console.log('line:', JSON.stringify({ text: line?.text, bbox: line?.bbox, conf: line?.confidence }))
const word = line?.words?.[0]
console.log('word:', JSON.stringify({ text: word?.text, bbox: word?.bbox, conf: word?.confidence }))
await worker.terminate()
