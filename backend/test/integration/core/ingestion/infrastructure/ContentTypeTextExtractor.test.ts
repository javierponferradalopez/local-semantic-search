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
  });
});
