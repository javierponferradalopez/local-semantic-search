import PDFParser from 'pdf2json'
const p = new PDFParser()
p.on('pdfParser_dataError', e => console.error('ERR', e))
p.on('pdfParser_dataReady', d => {
  console.log('top keys:', Object.keys(d))
  console.log('Pages:', d.Pages.length)
  const pg = d.Pages[1]
  console.log('page keys:', Object.keys(pg))
  console.log('W/H:', pg.Width, pg.Height)
  console.log('Texts[0..2]:', JSON.stringify(pg.Texts.slice(0,3), null, 2))
})
p.loadPDF('fixtures/text.pdf')
