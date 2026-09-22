import {CreatedAt} from '../../../../../../src/core/resources/domain/value-objects/CreatedAt';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';

describe('CreatedAt', () => {
  describe('.of', () => {
    it('should take an instant', () => {
      const value = new Date('2026-09-22T10:00:00.000Z');

      expect(CreatedAt.of({value}).value).toStrictEqual(value);
    });

    it('should refuse a Date that names no instant', () => {
      expect(() => CreatedAt.of({value: new Date('the day before')})).toThrow(
        ValueObjectError
      );
    });
  });

  describe('.fromPrimitive', () => {
    it('should read the instant that an ISO string names', () => {
      const createdAt = CreatedAt.fromPrimitive({value: '2026-09-22T10:00:00.000Z'});

      expect(createdAt.value.toISOString()).toBe('2026-09-22T10:00:00.000Z');
    });
  });
});
