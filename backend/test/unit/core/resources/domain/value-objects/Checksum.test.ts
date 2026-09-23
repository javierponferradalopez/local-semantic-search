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

  describe('.ofBytes', () => {
    it('should give a digest that .of takes', () => {
      const checksum = Checksum.ofBytes({bytes: Buffer.from('the notes', 'utf8')});

      expect(Checksum.of({value: checksum.value}).value).toBe(checksum.value);
    });

    it('should give the same digest to the same bytes', () => {
      const bytes = Buffer.from('the notes', 'utf8');

      expect(Checksum.ofBytes({bytes}).value).toBe(Checksum.ofBytes({bytes}).value);
    });

    it('should give a different digest to bytes that differ by one letter', () => {
      const first = Checksum.ofBytes({bytes: Buffer.from('the notes', 'utf8')});
      const second = Checksum.ofBytes({bytes: Buffer.from('the note', 'utf8')});

      expect(first.value).not.toBe(second.value);
    });

    it('should give a digest to no bytes at all', () => {
      const checksum = Checksum.ofBytes({bytes: Buffer.alloc(0)});

      expect(Checksum.of({value: checksum.value}).value).toBe(checksum.value);
    });
  });
});
