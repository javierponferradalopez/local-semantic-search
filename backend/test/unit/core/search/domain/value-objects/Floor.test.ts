import type {Match} from '../../../../../../src/core/search/domain/Match';
import {Floor} from '../../../../../../src/core/search/domain/value-objects/Floor';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';

const aRanked = (score: number): {bestMatch: Match} => ({
  bestMatch: {text: 'A paragraph about the trip.', score}
});

describe('Floor', () => {
  describe('.of', () => {
    it.each([0.78, 0.05, 0, -0.1, 1, -1])('should keep %j', value => {
      expect(Floor.of({value}).value).toBe(value);
    });

    it.each([78, 1.01, -1.01, Number.NaN, Number.POSITIVE_INFINITY])(
      'should refuse %j, which is not a cosine similarity',
      value => {
        expect(() => Floor.of({value})).toThrow(ValueObjectError);
      }
    );
  });

  describe('#isReachedBy', () => {
    const floor = Floor.of({value: 0.5});

    it('should be reached when the best Match is above it', () => {
      expect(floor.isReachedBy([aRanked(0.51)])).toBe(true);
    });

    it('should be reached when the best Match is equal to it', () => {
      expect(floor.isReachedBy([aRanked(0.5)])).toBe(true);
    });

    it('should not be reached when the best Match is under it', () => {
      expect(floor.isReachedBy([aRanked(0.49)])).toBe(false);
    });

    it('should compare only the first of the list', () => {
      expect(floor.isReachedBy([aRanked(0.49), aRanked(0.9)])).toBe(false);
    });

    it('should not be reached by an empty list', () => {
      expect(floor.isReachedBy([])).toBe(false);
    });
  });
});
