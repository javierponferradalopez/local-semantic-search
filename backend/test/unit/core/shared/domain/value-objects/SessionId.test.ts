import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';
import {SessionId} from '../../../../../../src/core/shared/domain/value-objects/SessionId';
import {StringMother} from '../../../../../utils/object-mother/StringMother';

describe('SessionId', () => {
  describe('.of', () => {
    it('should take a UUID', () => {
      const value = StringMother.randomUuid();

      expect(SessionId.of({value}).value).toBe(value);
    });

    it('should take a UUID in capitals', () => {
      const value = StringMother.randomUuid().toUpperCase();

      expect(SessionId.of({value}).value).toBe(value);
    });

    it.each([
      '',
      'a-session',
      '3f2504e0-4f89-41d3-9a0c',
      '3f2504e0-4f89-41d3-9a0c-0305e82c3301-0305',
      'a-3f2504e0-4f89-41d3-9a0c-0305e82c3301',
      '3f2504e0-4f89-41d3-9a0c-0305e82c330g'
    ])('should refuse %j, which is no UUID', value => {
      expect(() => SessionId.of({value})).toThrow(ValueObjectError);
    });
  });
});
