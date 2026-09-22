import {ResourceId} from '../../../../../../src/core/resources/domain/value-objects/ResourceId';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';
import {StringMother} from '../../../../../utils/object-mother/StringMother';

describe('ResourceId', () => {
  describe('.of', () => {
    it('should take a UUID', () => {
      const value = StringMother.randomUuid();

      expect(ResourceId.of({value}).value).toBe(value);
    });

    it('should take a UUID in capitals', () => {
      const value = StringMother.randomUuid().toUpperCase();

      expect(ResourceId.of({value}).value).toBe(value);
    });

    it.each([
      '',
      'notes',
      '3f2504e0-4f89-41d3-9a0c',
      '3f2504e0-4f89-41d3-9a0c-0305e82c3301-0305',
      '3f2504e0-4f89-41d3-9a0c-0305e82c330g'
    ])('should refuse %j, which is no UUID', value => {
      expect(() => ResourceId.of({value})).toThrow(ValueObjectError);
    });
  });

  describe('.random', () => {
    it('should give a UUID that .of takes', () => {
      const resourceId = ResourceId.random();

      expect(ResourceId.of({value: resourceId.value}).value).toBe(resourceId.value);
    });

    it('should give a different identifier on each call', () => {
      expect(ResourceId.random().value).not.toBe(ResourceId.random().value);
    });
  });
});
