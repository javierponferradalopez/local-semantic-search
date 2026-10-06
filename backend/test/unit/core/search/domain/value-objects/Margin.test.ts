import type {Match} from '../../../../../../src/core/search/domain/Match';
import type {PictureResult} from '../../../../../../src/core/search/domain/PictureResult';
import {Margin} from '../../../../../../src/core/search/domain/value-objects/Margin';
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

const scoresOf = (results: readonly {bestMatch: {score: number}}[]): number[] =>
  results.map(({bestMatch}) => bestMatch.score);

describe('Margin', () => {
  describe('.of', () => {
    it.each([0, 0.02, 0.2, 1, 78])('should keep %j', value => {
      expect(Margin.of({value}).value).toBe(value);
    });

    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
      'should refuse %j, which is not a finite score',
      value => {
        expect(() => Margin.of({value})).toThrow(ValueObjectError);
      }
    );

    it.each([-0.01, -0.2, -1])('should refuse %j, which is below 0', value => {
      expect(() => Margin.of({value})).toThrow(ValueObjectError);
    });
  });

  describe('#cut', () => {
    const BEST = -0.1;
    const margin = Margin.of({value: 0.2});

    it('should keep the Results within the Margin of the first one', () => {
      const results = [aRanked(BEST), aRanked(BEST - 0.1), aRanked(BEST - 0.19)];

      expect(scoresOf(margin.cut(results))).toStrictEqual(scoresOf(results));
    });

    it('should keep a Result at exactly the first score minus the Margin', () => {
      const results = [aRanked(BEST), aRanked(BEST - margin.value)];

      expect(scoresOf(margin.cut(results))).toStrictEqual(scoresOf(results));
    });

    it('should remove a Result below the first score minus the Margin', () => {
      const results = [aRanked(BEST), aRanked(BEST - 0.1), aRanked(BEST - 0.21)];

      expect(scoresOf(margin.cut(results))).toStrictEqual([BEST, BEST - 0.1]);
    });

    it('should keep only the first Results of the list', () => {
      const results = [aRanked(BEST), aRanked(BEST - 0.3), aRanked(BEST - 0.1)];

      expect(scoresOf(margin.cut(results))).toStrictEqual([BEST]);
    });

    it('should always keep the first Result', () => {
      expect(
        scoresOf(Margin.of({value: 0}).cut([aRanked(BEST), aRanked(BEST - 0.01)]))
      ).toStrictEqual([BEST]);
    });

    it('should give no Result for an empty list', () => {
      expect(margin.cut([])).toStrictEqual([]);
    });

    it('should cut the Results of the search of Pictures, which have no text', () => {
      const results = [aPictureResult(0.1), aPictureResult(0.09), aPictureResult(-0.2)];

      expect(scoresOf(margin.cut(results))).toStrictEqual([0.1, 0.09]);
    });

    it('should not take a list that mixes the Results of the two models', () => {
      const mixed = [aPictureResult(0.49), aRanked(0.9)];

      // @ts-expect-error
      margin.cut(mixed);
    });
  });
});
