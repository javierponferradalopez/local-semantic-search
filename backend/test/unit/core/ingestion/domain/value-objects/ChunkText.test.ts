import {ChunkText} from '../../../../../../src/core/ingestion/domain/value-objects/ChunkText';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';

describe('ChunkText', () => {
  describe('.of', () => {
    it('should drop the space that surrounds a text', () => {
      expect(ChunkText.of({value: '\n  The cut follows the structure.  \n'}).value).toBe(
        'The cut follows the structure.'
      );
    });

    it.each(['', '   ', '\t\n'])('should refuse %j, which is empty', value => {
      expect(() => ChunkText.of({value})).toThrow(ValueObjectError);
    });

    it.each(['---', '* * *', '…', '🙂🙂'])(
      'should refuse %j, which holds no letter and no digit',
      value => {
        expect(() => ChunkText.of({value})).toThrow(ValueObjectError);
      }
    );

    it.each(['7', 'ñ', '二', '- 3 -'])(
      'should take %j, which holds a letter or a digit',
      value => {
        expect(ChunkText.of({value}).value).toBe(value);
      }
    );
  });
});
