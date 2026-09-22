import {ResourceName} from '../../../../../../src/core/resources/domain/value-objects/ResourceName';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';

describe('ResourceName', () => {
  describe('.of', () => {
    it('should take a name', () => {
      expect(ResourceName.of({value: 'notes.md'}).value).toBe('notes.md');
    });

    it('should drop the space that surrounds a name', () => {
      expect(ResourceName.of({value: '  the notes.md  '}).value).toBe('the notes.md');
    });

    it.each(['', '   ', '\t\n'])('should refuse %j, which is empty', value => {
      expect(() => ResourceName.of({value})).toThrow(ValueObjectError);
    });
  });
});
