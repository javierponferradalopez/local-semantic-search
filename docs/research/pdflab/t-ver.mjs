import { getResolvedPDFJS } from 'unpdf'
const m = await getResolvedPDFJS()
console.log('unpdf bundled pdf.js version:', m.version, 'build:', m.build)
