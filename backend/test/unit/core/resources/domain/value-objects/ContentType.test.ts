import {CONTENT_TYPES} from 'contract/ContentType';
import {ContentType} from '../../../../../../src/core/resources/domain/value-objects/ContentType';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';

describe('ContentType', () => {
  describe('.of', () => {
    it.each([...CONTENT_TYPES])('should take %s', value => {
      expect(ContentType.of({value}).value).toBe(value);
    });

    it.each(['', 'PDF', 'pdf ', 'image_jpeg', 'application/pdf'])(
      'should refuse %j, which the closed set does not hold',
      value => {
        expect(() => ContentType.of({value})).toThrow(ValueObjectError);
      }
    );
  });
});
