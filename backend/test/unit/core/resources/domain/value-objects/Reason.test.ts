import {
  REASONS,
  Reason
} from '../../../../../../src/core/resources/domain/value-objects/Reason';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';

describe('Reason', () => {
  describe('.of', () => {
    it.each([...REASONS])('should take %s', value => {
      expect(Reason.of({value}).value).toBe(value);
    });

    it.each(['', 'No text found', 'no-text-found', 'unknown'])(
      'should refuse %j, which is no Reason',
      value => {
        expect(() => Reason.of({value})).toThrow(ValueObjectError);
      }
    );
  });
});
