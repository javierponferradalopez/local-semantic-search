import { createWorker } from 'tesseract.js'
const w = await createWorker('eng', 1, { langPath: '.', cachePath: '.' })
const r = await w.recognize('rendered.png')
console.log('conf:', r.data.confidence)
console.log('text:', JSON.stringify(r.data.text))
await w.terminate()
