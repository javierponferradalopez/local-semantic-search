import {UnsupportedContentTypeError} from '../../../../../src/core/resources/domain/errors/UnsupportedContentTypeError';
import {ExtensionContentTypeResolver} from '../../../../../src/core/resources/infrastructure/ExtensionContentTypeResolver';

describe('ExtensionContentTypeResolver', () => {
  const resolver = new ExtensionContentTypeResolver();

  describe('#resolveText', () => {
    it.each([
      ['the notes.pdf', 'pdf'],
      ['the notes.txt', 'plain_text'],
      ['the notes.md', 'markdown'],
      ['THE NOTES.MD', 'markdown'],
      ['the.notes.of.today.md', 'markdown']
    ])('should read the Content type of %s as %s', (name, contentType) => {
      expect(resolver.resolveText(name).value).toBe(contentType);
    });

    it.each(['the notes.docx', 'the notes', '.md', 'the notes.md.zip'])(
      'should refuse %j, whose extension names no Content type',
      name => {
        expect(() => resolver.resolveText(name)).toThrow(UnsupportedContentTypeError);
      }
    );

    it.each(['the beach.png', 'the diagram.svg'])(
      'should refuse %j, whose extension names an image Content type',
      name => {
        expect(() => resolver.resolveText(name)).toThrow(UnsupportedContentTypeError);
      }
    );
  });

  describe('#resolveImage', () => {
    it.each([
      ['the beach.jpg', 'jpeg'],
      ['the beach.jpeg', 'jpeg'],
      ['THE BEACH.JPG', 'jpeg'],
      ['the screenshot.png', 'png'],
      ['the beach.webp', 'webp'],
      ['the loop.gif', 'gif'],
      ['the beach.avif', 'avif'],
      ['the.diagram.of.today.svg', 'svg']
    ])('should read the Content type of %s as %s', (name, contentType) => {
      expect(resolver.resolveImage(name).value).toBe(contentType);
    });

    it.each(['the scan.tiff', 'the scan.tif', 'the photo.heic', 'the beach', '.png'])(
      'should refuse %j, whose extension names no Content type',
      name => {
        expect(() => resolver.resolveImage(name)).toThrow(UnsupportedContentTypeError);
      }
    );

    it.each(['the notes.pdf', 'the notes.txt', 'the notes.md'])(
      'should refuse %j, whose extension names a text Content type',
      name => {
        expect(() => resolver.resolveImage(name)).toThrow(UnsupportedContentTypeError);
      }
    );
  });
});
