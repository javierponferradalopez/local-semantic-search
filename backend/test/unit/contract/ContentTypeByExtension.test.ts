import {CONTENT_TYPES} from 'contract/ContentType';
import {CONTENT_TYPE_BY_EXTENSION} from 'contract/ContentTypeByExtension';

describe('the table of Content type by extension', () => {
  it.each([
    ['.pdf', 'pdf'],
    ['.txt', 'plain_text'],
    ['.md', 'markdown']
  ])('should give %s the Content type %s', (extension, contentType) => {
    expect(CONTENT_TYPE_BY_EXTENSION.get(extension)).toBe(contentType);
  });

  it.each(['.docx', 'md', '.MD', ''])(
    'should give nothing for %j, which the table does not hold',
    extension => {
      expect(CONTENT_TYPE_BY_EXTENSION.get(extension)).toBeUndefined();
    }
  );

  it('should reach every Content type of the closed set', () => {
    expect([...CONTENT_TYPE_BY_EXTENSION.values()].toSorted()).toStrictEqual(
      [...CONTENT_TYPES].toSorted()
    );
  });
});
