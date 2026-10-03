import {meansByTagOf, meansOf} from '../../lib/means';

const SCORERS = ['F0.5', 'right empty'];

const A_DEV_CASE = {tags: {split: 'dev', language: 'es'}, scores: {'F0.5': 1}};
const A_TEST_CASE = {tags: {split: 'test', language: 'es'}, scores: {'F0.5': 0.5}};
const AN_ABSENT_CASE = {tags: {split: 'dev', language: 'en'}, scores: {'right empty': 0}};

describe('means', () => {
  describe('meansOf', () => {
    it('should give the mean of each scorer over the cases that it judged', () => {
      expect(meansOf(SCORERS, [A_DEV_CASE, A_TEST_CASE, AN_ABSENT_CASE])).toStrictEqual({
        'F0.5': 0.75,
        'right empty': 0
      });
    });

    it('should give no mean to a scorer that judged no case', () => {
      expect(meansOf(SCORERS, [A_DEV_CASE])).toStrictEqual({'F0.5': 1});
    });
  });

  describe('meansByTagOf', () => {
    it('should give the means of each value of each tag', () => {
      expect(
        meansByTagOf(SCORERS, [A_DEV_CASE, A_TEST_CASE, AN_ABSENT_CASE])
      ).toStrictEqual({
        split: {dev: {'F0.5': 1, 'right empty': 0}, test: {'F0.5': 0.5}},
        language: {es: {'F0.5': 0.75}, en: {'right empty': 0}}
      });
    });

    it('should leave out of a tag the cases that do not carry it', () => {
      const aCrossLanguageCase = {
        tags: {...A_TEST_CASE.tags, 'cross-language': 'yes'},
        scores: {'F0.5': 0}
      };

      expect(
        meansByTagOf(SCORERS, [A_DEV_CASE, aCrossLanguageCase])['cross-language']
      ).toStrictEqual({yes: {'F0.5': 0}});
    });

    it('should give no means for cases with no tags', () => {
      expect(meansByTagOf(SCORERS, [{scores: {'F0.5': 1}}])).toStrictEqual({});
    });
  });
});
