import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ContentTypeTextExtractor} from '../../../../../src/core/ingestion/infrastructure/ContentTypeTextExtractor';

const FIXTURES = join(import.meta.dirname, '../../../../fixtures');

describe('ContentTypeTextExtractor', () => {
  const extractor = new ContentTypeTextExtractor();

  describe('#extract', () => {
    it('should read a text file as one text', async () => {
      const bytes = await readFile(join(FIXTURES, 'long-text.txt'));

      expect(await extractor.extract(bytes, 'plain_text')).toStrictEqual([
        bytes.toString('utf8')
      ]);
    });

    it('should read a Markdown file as one text, with its markup', async () => {
      const bytes = await readFile(join(FIXTURES, 'markdown-with-headings.md'));

      expect(await extractor.extract(bytes, 'markdown')).toStrictEqual([
        bytes.toString('utf8')
      ]);
    });

    it('should read an empty text file as one empty text', async () => {
      const bytes = await readFile(join(FIXTURES, 'empty.txt'));

      expect(await extractor.extract(bytes, 'plain_text')).toStrictEqual(['']);
    });

    it('should drop the byte order mark of UTF-8', async () => {
      const bytes = Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        Buffer.from('The notes.')
      ]);

      expect(await extractor.extract(bytes, 'plain_text')).toStrictEqual(['The notes.']);
    });

    it('should read a PDF as one text for each page, in the order of the pages', async () => {
      const bytes = await readFile(join(FIXTURES, 'two-pages-with-text.pdf'));

      expect(await extractor.extract(bytes, 'pdf')).toStrictEqual([
        'Page one of the fixture.\nAn extractor reads this text.',
        'Page two of the fixture.\nIts text differs from page one.'
      ]);
    });

    it('should read a scanned PDF as one empty text for each page, and throw nothing', async () => {
      const bytes = await readFile(join(FIXTURES, 'scanned-with-no-text.pdf'));

      expect(await extractor.extract(bytes, 'pdf')).toStrictEqual(['', '']);
    });
  });
});
