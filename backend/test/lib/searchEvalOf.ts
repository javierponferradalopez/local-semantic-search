import {readdir} from 'node:fs/promises';
import type {GoldenCase} from '../../evals/GoldenCase';
import type {Vector} from '../../src/core/shared/domain/value-objects/Vector';
import type {Eval, EvalCase} from './runEval';

type Expected = GoldenCase['expected'];

export type Ranking<Match extends {score: number}> = {name: string; bestMatch: Match}[];

export type Candidate<Match extends {score: number}> = {
  name: string;
  match: Omit<Match, 'score'>;
  vector: Vector;
};

type Judged<Match extends {score: number}> = {output: Ranking<Match>; expected: Expected};

type Params<Match extends {score: number}> = {
  corpusFolder: string;
  goldenSet: readonly GoldenCase[];
  rankingOf: (query: string) => Promise<Ranking<Match>>;
  passesTheFloor: (ranking: Ranking<Match>) => boolean;
};

// A dotfile, such as .gitkeep, is not a Resource.
export const namesIn = async (corpusFolder: string): Promise<string[]> =>
  (await readdir(corpusFolder)).filter(name => !name.startsWith('.'));

const cosineOf = ({value: a}: Vector, {value: b}: Vector): number => {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const norm = (values: readonly number[]): number => Math.hypot(...values);

  return dot / (norm(a) * norm(b));
};

// In memory, as ADR-0016 rules: the SQL of the grouping is proved by integration.
export const bestFirst = <Match extends {score: number}>(
  query: Vector,
  candidates: readonly Candidate<Match>[]
): Ranking<Match> => {
  const bestMatches = new Map<string, Match>();

  for (const candidate of candidates) {
    const score = cosineOf(query, candidate.vector);
    const best = bestMatches.get(candidate.name);

    if (best === undefined || score > best.score) {
      // TypeScript cannot join Omit<Match, 'score'> and the score back into a generic Match.
      bestMatches.set(candidate.name, {...candidate.match, score} as Match);
    }
  }

  return Array.from(bestMatches, ([name, bestMatch]) => ({name, bestMatch})).sort(
    (first, second) => second.bestMatch.score - first.bestMatch.score
  );
};

// A Query with no answer in the corpus has no rank.
const reciprocalRank = <Match extends {score: number}>({
  output,
  expected
}: Judged<Match>): number | undefined => {
  if (expected === null) {
    return undefined;
  }

  const index = output.findIndex(({name}) => name === expected);

  return index === -1 ? 0 : 1 / (index + 1);
};

// The score the Floor compares, so the report gives the numbers that set the Floor.
const bestScoreWhen =
  (answered: boolean) =>
  <Match extends {score: number}>({
    output,
    expected
  }: Judged<Match>): number | undefined =>
    (expected !== null) === answered ? output[0]?.bestMatch.score : undefined;

// ADR-0016 and ADR-0021: the ranking and the gate, on the owner's corpus and in the owner's words.
export const searchEvalOf = <Match extends {score: number}>({
  corpusFolder,
  goldenSet,
  rankingOf,
  passesTheFloor
}: Params<Match>): Eval<string, Ranking<Match>, Expected> => ({
  data: async (): Promise<EvalCase<string, Expected>[]> => {
    const names = new Set(await namesIn(corpusFolder));

    return goldenSet.map(({query, expected}) => {
      if (expected !== null && !names.has(expected)) {
        throw new Error(
          `The golden set expects ${expected}, which is not in the corpus.`
        );
      }

      return {input: query, expected};
    });
  },
  task: rankingOf,
  scorers: [
    {name: 'reciprocal rank', score: reciprocalRank},
    {
      name: 'verdict of the Floor',
      score: ({output, expected}: Judged<Match>): number =>
        passesTheFloor(output) === (expected !== null) ? 1 : 0
    },
    {name: 'best score of a real Query', score: bestScoreWhen(true)},
    {name: 'best score of an absent Query', score: bestScoreWhen(false)}
  ],
  counts: [
    {
      name: 'real Query the Floor rejects',
      holds: ({output, expected}: Judged<Match>): boolean =>
        expected !== null && !passesTheFloor(output)
    },
    {
      name: 'absent Query the Floor lets in',
      holds: ({output, expected}: Judged<Match>): boolean =>
        expected === null && passesTheFloor(output)
    }
  ]
});
