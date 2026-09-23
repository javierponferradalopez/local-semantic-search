import {UnsupportedContentTypeError} from '../../../../../src/core/resources/domain/errors/UnsupportedContentTypeError';
import {ExtensionContentTypeResolver} from '../../../../../src/core/resources/infrastructure/ExtensionContentTypeResolver';

describe('ExtensionContentTypeResolver', () => {
  const resolver = new ExtensionContentTypeResolver();

  describe('#resolve', () => {
    it.each([
      ['the notes.pdf', 'pdf'],
      ['the notes.txt', 'plain_text'],
      ['the notes.md', 'markdown'],
      ['THE NOTES.MD', 'markdown'],
      ['the.notes.of.today.md', 'markdown']
    ])('should read the Content type of %s as %s', (name, contentType) => {
      expect(resolver.resolve(name).value).toBe(contentType);
    });

    it.each(['the notes.docx', 'the notes', '.md', 'the notes.md.zip'])(
      'should refuse %j, whose extension names no Content type',
      name => {
        expect(() => resolver.resolve(name)).toThrow(UnsupportedContentTypeError);
      }
    );
  });
});
