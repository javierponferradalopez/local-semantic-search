import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';
import {Vector} from '../../../../../../src/core/shared/domain/value-objects/Vector';

const MODEL = {repository: 'intfloat/multilingual-e5-small', dtype: 'fp32', width: 3};

describe('Vector', () => {
  describe('.of', () => {
    it('should carry the identity of the model that made it', () => {
      const vector = Vector.of({values: [0.6, 0, 0.8], model: MODEL});

      expect(vector.value).toEqual([0.6, 0, 0.8]);
      expect(vector.model).toEqual({
        repository: 'intfloat/multilingual-e5-small',
        dtype: 'fp32',
        width: 3
      });
    });

    it('should keep the identity of the model and not its Floor', () => {
      const modelWithItsFloor = {...MODEL, floor: 0.78};

      const vector = Vector.of({values: [0.6, 0, 0.8], model: modelWithItsFloor});

      expect(vector.model).not.toHaveProperty('floor');
    });

    it.each([[[]], [[0.6, 0.8]], [[0.5, 0.5, 0.5, 0.5]]])(
      'should refuse %j, which does not hold the width of its model',
      values => {
        expect(() => Vector.of({values, model: MODEL})).toThrow(ValueObjectError);
      }
    );

    it('should refuse a Vector of no number, even when its model has no width', () => {
      expect(() => Vector.of({values: [], model: {...MODEL, width: 0}})).toThrow(
        ValueObjectError
      );
    });

    it.each([[Number.NaN], [Number.POSITIVE_INFINITY], [Number.NEGATIVE_INFINITY]])(
      'should refuse %s, which is not a finite number',
      number => {
        expect(() => Vector.of({values: [0.6, number, 0.8], model: MODEL})).toThrow(
          ValueObjectError
        );
      }
    );

    it('should not change when the numbers it was made from change', () => {
      const values = [0.6, 0, 0.8];
      const model = {...MODEL};

      const vector = Vector.of({values, model});
      values[0] = 1;
      model.repository = 'another/model';

      expect(vector.value).toEqual([0.6, 0, 0.8]);
      expect(vector.model.repository).toBe('intfloat/multilingual-e5-small');
    });
  });
});
