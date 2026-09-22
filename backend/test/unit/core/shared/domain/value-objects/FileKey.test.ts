import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';
import {FileKey} from '../../../../../../src/core/shared/domain/value-objects/FileKey';
import {StringMother} from '../../../../../utils/object-mother/StringMother';

describe('FileKey', () => {
  describe('.of', () => {
    it('should take a key under the folder of its module', () => {
      const value = `resources/${StringMother.randomUuid()}/notes.md`;

      const fileKey = FileKey.of({value});

      expect(fileKey.value).toBe(value);
    });

    it.each(['', '   ', 'resources//notes.md', 'resources/ /notes.md'])(
      'should refuse %j, which holds an empty segment',
      value => {
        expect(() => FileKey.of({value})).toThrow(ValueObjectError);
      }
    );

    it.each(['../secrets.env', 'resources/../../secrets.env', 'resources/./notes.md'])(
      'should refuse %s, which escapes its folder',
      value => {
        expect(() => FileKey.of({value})).toThrow(ValueObjectError);
      }
    );

    it('should refuse a key that is absolute', () => {
      expect(() => FileKey.of({value: '/etc/passwd'})).toThrow(ValueObjectError);
    });
  });
});
