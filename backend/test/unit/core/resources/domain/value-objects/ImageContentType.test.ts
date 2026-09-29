import {IMAGE_CONTENT_TYPES, TEXT_CONTENT_TYPES} from 'contract/ContentType';
import {ImageContentType} from '../../../../../../src/core/resources/domain/value-objects/ImageContentType';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';

describe('ImageContentType', () => {
  describe('.of', () => {
    it.each([...IMAGE_CONTENT_TYPES])('should take %s', value => {
      expect(ImageContentType.of({value}).value).toBe(value);
    });

    it.each([...TEXT_CONTENT_TYPES])('should refuse %s, which is a text', value => {
      expect(() => ImageContentType.of({value})).toThrow(ValueObjectError);
    });

    it.each(['', 'PNG', 'jpg', 'tiff', 'heic', 'image/png'])(
      'should refuse %j, which the closed set does not hold',
      value => {
        expect(() => ImageContentType.of({value})).toThrow(ValueObjectError);
      }
    );
  });
});
