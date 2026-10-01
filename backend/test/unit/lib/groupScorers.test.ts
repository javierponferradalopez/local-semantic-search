import {
  f05,
  firstStageRecall,
  nearLeak,
  precision,
  recall,
  reciprocalRank,
  rightEmpty
} from '../../lib/groupScorers';

const REAL = {answers: ['lentils.md', 'stew.md'], near: ['soup.md']};
const ABSENT = {answers: [], near: []};

const shown = (...names: string[]): {shown: string[]} => ({shown: names});

describe('groupScorers', () => {
  describe('f05', () => {
    it('should give 1 to a list with only answers, all of them', () => {
      expect(f05({output: shown('stew.md', 'lentils.md'), expected: REAL})).toBe(1);
    });

    it('should weigh precision two times as much as recall', () => {
      expect(f05({output: shown('lentils.md'), expected: REAL})).toBeCloseTo(5 / 6);
      expect(
        f05({
          output: shown('lentils.md', 'stew.md', 'soup.md', 'bike.md'),
          expected: REAL
        })
      ).toBeCloseTo(5 / 9);
    });

    it('should give 0 to an empty list', () => {
      expect(f05({output: shown(), expected: REAL})).toBe(0);
    });

    it('should give 0 to a list with no answer', () => {
      expect(f05({output: shown('soup.md', 'bike.md'), expected: REAL})).toBe(0);
    });

    it('should not judge an absent Query', () => {
      expect(f05({output: shown(), expected: ABSENT})).toBeUndefined();
    });
  });

  describe('precision', () => {
    it('should give the share of the list that answers', () => {
      expect(
        precision({output: shown('lentils.md', 'soup.md', 'bike.md'), expected: REAL})
      ).toBeCloseTo(1 / 3);
    });

    it('should give 1 to a list with only answers', () => {
      expect(precision({output: shown('lentils.md'), expected: REAL})).toBe(1);
    });

    it('should not judge an empty list', () => {
      expect(precision({output: shown(), expected: REAL})).toBeUndefined();
    });

    it('should not judge an absent Query', () => {
      expect(precision({output: shown('soup.md'), expected: ABSENT})).toBeUndefined();
    });
  });

  describe('recall', () => {
    it('should give the share of the answers that the list holds', () => {
      expect(recall({output: shown('soup.md', 'stew.md'), expected: REAL})).toBe(0.5);
    });

    it('should give 0 to an empty list', () => {
      expect(recall({output: shown(), expected: REAL})).toBe(0);
    });

    it('should not judge an absent Query', () => {
      expect(recall({output: shown(), expected: ABSENT})).toBeUndefined();
    });
  });

  describe('rightEmpty', () => {
    it('should give 1 to an absent Query with an empty list', () => {
      expect(rightEmpty({output: shown(), expected: ABSENT})).toBe(1);
    });

    it('should give 0 to an absent Query with a list', () => {
      expect(rightEmpty({output: shown('bike.md'), expected: ABSENT})).toBe(0);
    });

    it('should not judge a real Query', () => {
      expect(rightEmpty({output: shown(), expected: REAL})).toBeUndefined();
    });
  });

  describe('nearLeak', () => {
    it('should give 1 to a list with a Near Resource', () => {
      expect(nearLeak({output: shown('lentils.md', 'soup.md'), expected: REAL})).toBe(1);
    });

    it('should give 0 to a list with no Near Resource', () => {
      expect(nearLeak({output: shown('lentils.md', 'bike.md'), expected: REAL})).toBe(0);
    });

    it('should give 0 to an empty list', () => {
      expect(nearLeak({output: shown(), expected: REAL})).toBe(0);
    });

    it('should judge an absent Query with Near Resources', () => {
      expect(
        nearLeak({output: shown('soup.md'), expected: {answers: [], near: ['soup.md']}})
      ).toBe(1);
    });

    it('should not judge a Query with no Near Resource', () => {
      expect(nearLeak({output: shown('bike.md'), expected: ABSENT})).toBeUndefined();
    });
  });

  describe('reciprocalRank', () => {
    it('should give 1 / the rank of the first answer', () => {
      expect(
        reciprocalRank({output: shown('soup.md', 'bike.md', 'stew.md'), expected: REAL})
      ).toBeCloseTo(1 / 3);
    });

    it('should give 1 when an answer is first', () => {
      expect(
        reciprocalRank({output: shown('lentils.md', 'soup.md'), expected: REAL})
      ).toBe(1);
    });

    it('should give 0 to a list with no answer', () => {
      expect(reciprocalRank({output: shown(), expected: REAL})).toBe(0);
    });

    it('should not judge an absent Query', () => {
      expect(
        reciprocalRank({output: shown('bike.md'), expected: ABSENT})
      ).toBeUndefined();
    });
  });

  describe('firstStageRecall', () => {
    it('should give the share of the answers that the first stage holds', () => {
      expect(
        firstStageRecall({
          output: {shown: [], firstStage: ['bike.md', 'stew.md', 'soup.md']},
          expected: REAL
        })
      ).toBe(0.5);
    });

    it('should not read the list that the group shows', () => {
      expect(
        firstStageRecall({
          output: {shown: ['lentils.md', 'stew.md'], firstStage: ['bike.md']},
          expected: REAL
        })
      ).toBe(0);
    });

    it('should not judge an absent Query', () => {
      expect(
        firstStageRecall({output: {shown: [], firstStage: ['bike.md']}, expected: ABSENT})
      ).toBeUndefined();
    });
  });
});
