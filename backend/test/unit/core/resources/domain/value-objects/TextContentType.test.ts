import {IMAGE_CONTENT_TYPES, TEXT_CONTENT_TYPES} from 'contract/ContentType';
import {TextContentType} from '../../../../../../src/core/resources/domain/value-objects/TextContentType';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';

describe('TextContentType', () => {
  describe('.of', () => {
    it.each([...TEXT_CONTENT_TYPES])('should take %s', value => {
      expect(TextContentType.of({value}).value).toBe(value);
    });

    it.each([...IMAGE_CONTENT_TYPES])('should refuse %s, which is an image', value => {
      expect(() => TextContentType.of({value})).toThrow(ValueObjectError);
    });

    it.each(['', 'PDF', 'pdf ', 'application/pdf'])(
      'should refuse %j, which the closed set does not hold',
      value => {
        expect(() => TextContentType.of({value})).toThrow(ValueObjectError);
      }
    );
  });
});
