import type {Scores, Tags} from './means';

const RESAMPLES = 10_000;
const SEED = 20_261_003;

export type Verdict = 'win' | 'loss' | 'tie';

export type Bootstrap = {
  meanDifference: number;
  interval: [low: number, high: number];
  pairs: number;
  verdict: Verdict;
};

type ScoredCase = {input: unknown; tags?: Tags; scores: Scores};

export const verdictsOf = (
  scorer: string,
  current: readonly ScoredCase[],
  previous: readonly ScoredCase[]
): Record<string, Bootstrap> =>
  Object.fromEntries(
    Object.entries(differencesBySplitOf(scorer, current, previous)).map(
      ([split, differences]) => [split, bootstrapOf(differences)]
    )
  );

const differencesBySplitOf = (
  scorer: string,
  current: readonly ScoredCase[],
  previous: readonly ScoredCase[]
): Record<string, number[]> => {
  const previousScores = new Map(
    previous.map(({input, scores}) => [JSON.stringify(input), scores[scorer]])
  );
  const differencesBySplit: Record<string, number[]> = {};

  for (const {input, tags, scores} of current) {
    const score = scores[scorer];
    const before = previousScores.get(JSON.stringify(input));

    if (tags?.split === undefined || score === undefined || before === undefined) {
      continue;
    }

    differencesBySplit[tags.split] ??= [];
    differencesBySplit[tags.split].push(score - before);
  }

  return differencesBySplit;
};

const bootstrapOf = (differences: readonly number[]): Bootstrap => {
  const random = mulberry32(SEED);
  const means = Array.from({length: RESAMPLES}, () =>
    meanOf(
      Array.from(
        differences,
        () => differences[Math.floor(random() * differences.length)]
      )
    )
  ).sort((a, b) => a - b);
  const interval: Bootstrap['interval'] = [
    percentileOf(means, 0.025),
    percentileOf(means, 0.975)
  ];

  return {
    meanDifference: meanOf(differences),
    interval,
    pairs: differences.length,
    verdict: interval[0] > 0 ? 'win' : interval[1] < 0 ? 'loss' : 'tie'
  };
};

const meanOf = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const percentileOf = (sorted: readonly number[], share: number): number =>
  sorted[Math.round(share * (sorted.length - 1))];

// Math.random takes no seed, and two runs on the same reports must give the same verdict.
const mulberry32 = (seed: number): (() => number) => {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
};
