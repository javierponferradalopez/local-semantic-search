import {Query} from '../../../../../../src/core/search/domain/value-objects/Query';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';

describe('Query', () => {
  describe('.of', () => {
    it.each([
      'animales acuáticos',
      'Coche ROJO',
      '  una foto de una playa\n',
      'naïve café, straße',
      'é'
    ])('should keep %j exactly as the user typed it', value => {
      expect(Query.of({value}).value).toBe(value);
    });

    it('should keep a long text whole', () => {
      const value = 'vehículo '.repeat(2000);

      expect(Query.of({value}).value).toBe(value);
    });

    it.each(['', '   ', '\t\n', ' ', '　'])('should refuse %j, which is empty', value => {
      expect(() => Query.of({value})).toThrow(ValueObjectError);
    });
  });
});
