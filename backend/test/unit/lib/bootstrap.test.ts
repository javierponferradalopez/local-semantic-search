import {verdictsOf} from '../../lib/bootstrap';

type Case = {input: string; tags: {split: string}; scores: {'F0.5': number}};

// The same spread of scores, so that only the gain between two reports changes the verdict.
const casesOf = (split: string, gain = 0): Case[] =>
  [0.1, 0.4, 0.2, 0.9, 0.5, 0.3, 0.7, 0.6].map((score, index) => ({
    input: `${split} Query ${index}`,
    tags: {split},
    scores: {'F0.5': Math.min(1, score + gain * (1 + (index % 3)))}
  }));

const PREVIOUS: Case[] = [...casesOf('tuning'), ...casesOf('holdout')];

describe('bootstrap', () => {
  describe('verdictsOf', () => {
    it('should give "tie" to two equal reports', () => {
      const verdicts = verdictsOf('F0.5', PREVIOUS, PREVIOUS);

      expect(verdicts.tuning).toStrictEqual({
        meanDifference: 0,
        interval: [0, 0],
        pairs: 8,
        verdict: 'tie'
      });
      expect(verdicts.holdout.verdict).toBe('tie');
    });

    it('should give "win" to a clear gain', () => {
      const current = [...casesOf('tuning'), ...casesOf('holdout', 0.05)];
      const verdicts = verdictsOf('F0.5', current, PREVIOUS);

      expect(verdicts.holdout.verdict).toBe('win');
      expect(verdicts.holdout.meanDifference).toBeCloseTo(0.09375);
      expect(verdicts.holdout.interval[0]).toBeGreaterThan(0);
      expect(verdicts.tuning.verdict).toBe('tie');
    });

    it('should give "loss" to a clear loss', () => {
      const verdicts = verdictsOf('F0.5', PREVIOUS, [
        ...casesOf('tuning', 0.05),
        ...casesOf('holdout', 0.05)
      ]);

      expect(verdicts.tuning.verdict).toBe('loss');
      expect(verdicts.holdout.verdict).toBe('loss');
      expect(verdicts.holdout.interval[1]).toBeLessThan(0);
    });

    it('should give "tie" to a gain or a loss whose 95 % interval holds 0', () => {
      const gains = [0.3, 0.2, 0.1, 0.1, -0.1, -0.2, 0.2, 0.1];
      const before = gains.map((_, index) => ({
        input: `Query ${index}`,
        tags: {split: 'holdout'},
        scores: {'F0.5': 0.5}
      }));
      const after = before.map((query, index) => ({
        ...query,
        scores: {'F0.5': 0.5 + gains[index]}
      }));
      const gain = verdictsOf('F0.5', after, before).holdout;
      const loss = verdictsOf('F0.5', before, after).holdout;

      expect(gain.meanDifference).toBeGreaterThan(0);
      expect(gain.verdict).toBe('tie');
      expect(loss.meanDifference).toBeLessThan(0);
      expect(loss.verdict).toBe('tie');
    });

    it('should give the same interval two times, as its seed is fixed', () => {
      const current = [...casesOf('tuning', 0.05), ...casesOf('holdout', 0.05)];

      expect(verdictsOf('F0.5', current, PREVIOUS)).toStrictEqual(
        verdictsOf('F0.5', current, PREVIOUS)
      );
    });

    it('should not pair a Query that is in only one report', () => {
      const aNewQuery = {
        input: 'a new Query',
        tags: {split: 'tuning'},
        scores: {'F0.5': 1}
      };
      const verdicts = verdictsOf('F0.5', [...PREVIOUS, aNewQuery], PREVIOUS.slice(1));

      expect(verdicts.tuning.pairs).toBe(7);
      expect(verdicts.holdout.pairs).toBe(8);
    });

    it('should not pair a Query that the scorer did not judge in a report', () => {
      const [first, ...others] = PREVIOUS;
      const unjudged = {...first, scores: {}};

      expect(verdictsOf('F0.5', [unjudged, ...others], PREVIOUS).tuning.pairs).toBe(7);
    });

    it('should not pair a Query that has no split', () => {
      const [first, ...others] = PREVIOUS;
      const {tags: _, ...withNoSplit} = first;
      const verdicts = verdictsOf('F0.5', [withNoSplit, ...others], PREVIOUS);

      expect(Object.keys(verdicts)).toStrictEqual(['tuning', 'holdout']);
      expect(verdicts.tuning.pairs).toBe(7);
    });
  });
});
