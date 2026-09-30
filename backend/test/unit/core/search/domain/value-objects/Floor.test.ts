import type {Match} from '../../../../../../src/core/search/domain/Match';
import type {PictureResult} from '../../../../../../src/core/search/domain/PictureResult';
import {Floor} from '../../../../../../src/core/search/domain/value-objects/Floor';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';

const RESOURCE_ID = '0196a1f2-7c3e-7b10-9a4d-3f5e6a7b8c9d';

const aRanked = (score: number): {bestMatch: Match} => ({
  bestMatch: {text: 'A paragraph about the trip.', score}
});

const aPictureResult = (score: number): PictureResult => ({
  resourceId: RESOURCE_ID,
  name: 'beach.jpg',
  fileKey: `resources/${RESOURCE_ID}`,
  thumbnailKey: `thumbnails/${RESOURCE_ID}`,
  bestMatch: {score}
});

describe('Floor', () => {
  describe('.of', () => {
    it.each([0.78, 0.05, 0, -0.1, 1, -1, -0.58, 78, 1.01, -1.01])(
      'should keep %j',
      value => {
        expect(Floor.of({value}).value).toBe(value);
      }
    );

    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
      'should refuse %j, which is not a finite score',
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

    it('should gate on a negative Floor as on a positive one', () => {
      const negative = Floor.of({value: -0.58});

      expect(negative.isReachedBy([aRanked(-0.57)])).toBe(true);
      expect(negative.isReachedBy([aRanked(-0.58)])).toBe(true);
      expect(negative.isReachedBy([aRanked(-0.59)])).toBe(false);
    });

    it('should gate the Results of the search of Pictures, which have no text', () => {
      expect(floor.isReachedBy([aPictureResult(0.51)])).toBe(true);
      expect(floor.isReachedBy([aPictureResult(0.49)])).toBe(false);
    });

    it('should not take a list that mixes the Results of the two models', () => {
      const mixed = [aPictureResult(0.49), aRanked(0.9)];

      // @ts-expect-error
      floor.isReachedBy(mixed);
    });
  });
});
