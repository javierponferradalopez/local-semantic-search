import {
  CONTENT_TYPES,
  IMAGE_CONTENT_TYPES,
  TEXT_CONTENT_TYPES
} from 'contract/ContentType';
import {
  CONTENT_TYPE_BY_EXTENSION,
  IMAGE_CONTENT_TYPE_BY_EXTENSION,
  TEXT_CONTENT_TYPE_BY_EXTENSION
} from 'contract/ContentTypeByExtension';

describe('the table of Content type by extension', () => {
  it.each([
    ['.pdf', 'pdf'],
    ['.txt', 'plain_text'],
    ['.md', 'markdown']
  ])('should give %s the text Content type %s', (extension, contentType) => {
    expect(TEXT_CONTENT_TYPE_BY_EXTENSION.get(extension)).toBe(contentType);
    expect(CONTENT_TYPE_BY_EXTENSION.get(extension)).toBe(contentType);
    expect(IMAGE_CONTENT_TYPE_BY_EXTENSION.has(extension)).toBe(false);
  });

  it.each([
    ['.jpg', 'jpeg'],
    ['.jpeg', 'jpeg'],
    ['.png', 'png'],
    ['.webp', 'webp'],
    ['.gif', 'gif'],
    ['.avif', 'avif'],
    ['.svg', 'svg']
  ])('should give %s the image Content type %s', (extension, contentType) => {
    expect(IMAGE_CONTENT_TYPE_BY_EXTENSION.get(extension)).toBe(contentType);
    expect(CONTENT_TYPE_BY_EXTENSION.get(extension)).toBe(contentType);
    expect(TEXT_CONTENT_TYPE_BY_EXTENSION.has(extension)).toBe(false);
  });

  it.each(['.docx', '.tiff', '.tif', '.heic', 'md', '.MD', ''])(
    'should give nothing for %j, which the table does not hold',
    extension => {
      expect(CONTENT_TYPE_BY_EXTENSION.get(extension)).toBeUndefined();
    }
  );

  it('should reach every text Content type from its half of the table', () => {
    expect(
      [...new Set(TEXT_CONTENT_TYPE_BY_EXTENSION.values())].toSorted()
    ).toStrictEqual([...TEXT_CONTENT_TYPES].toSorted());
  });

  it('should reach every image Content type from its half of the table', () => {
    expect(
      [...new Set(IMAGE_CONTENT_TYPE_BY_EXTENSION.values())].toSorted()
    ).toStrictEqual([...IMAGE_CONTENT_TYPES].toSorted());
  });

  it('should reach every Content type of the closed set', () => {
    expect([...new Set(CONTENT_TYPE_BY_EXTENSION.values())].toSorted()).toStrictEqual(
      [...CONTENT_TYPES].toSorted()
    );
  });
});
