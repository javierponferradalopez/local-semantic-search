import {Checksum} from '../../../../../../src/core/resources/domain/value-objects/Checksum';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';
import {StringMother} from '../../../../../utils/object-mother/StringMother';

describe('Checksum', () => {
  describe('.of', () => {
    it('should take a hexadecimal digest', () => {
      const value = StringMother.randomChecksum();

      expect(Checksum.of({value}).value).toBe(value);
    });

    it.each(['', 'ABCDEF', 'abcg', 'abc def', '0x1f', 'abcdef\n'])(
      'should refuse %j, which is not hexadecimal',
      value => {
        expect(() => Checksum.of({value})).toThrow(ValueObjectError);
      }
    );
  });
});
