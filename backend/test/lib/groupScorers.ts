import type {Labels} from './goldenCasesOf';

// The names of the Results that a group shows, in their order.
export type Shown = {shown: readonly string[]};

// The first stage is what the Reranker received.
export type TextGroup = Shown & {firstStage: readonly string[]};

type Judged<Output> = {output: Output; expected: Labels};

const answersIn = (names: readonly string[], {answers}: Labels): number =>
  names.filter(name => answers.includes(name)).length;

const isAbsent = ({answers}: Labels): boolean => answers.length === 0;

export const precision = ({
  output: {shown},
  expected
}: Judged<Shown>): number | undefined =>
  isAbsent(expected) || shown.length === 0
    ? undefined
    : answersIn(shown, expected) / shown.length;

export const recall = ({output: {shown}, expected}: Judged<Shown>): number | undefined =>
  isAbsent(expected) ? undefined : answersIn(shown, expected) / expected.answers.length;

// Precision weighs two times as much as recall, and an empty list scores 0.
export const f05 = (judged: Judged<Shown>): number | undefined => {
  const r = recall(judged);
  const p = precision(judged);

  if (r === undefined) {
    return undefined;
  }

  return p === undefined || r === 0 ? 0 : (1.25 * p * r) / (0.25 * p + r);
};

export const rightEmpty = ({
  output: {shown},
  expected
}: Judged<Shown>): number | undefined =>
  isAbsent(expected) ? Number(shown.length === 0) : undefined;

export const nearLeak = ({
  output: {shown},
  expected: {near}
}: Judged<Shown>): number | undefined =>
  near.length === 0 ? undefined : Number(shown.some(name => near.includes(name)));

export const reciprocalRank = ({
  output: {shown},
  expected
}: Judged<Shown>): number | undefined => {
  if (isAbsent(expected)) {
    return undefined;
  }

  const index = shown.findIndex(name => expected.answers.includes(name));

  return index === -1 ? 0 : 1 / (index + 1);
};

export const firstStageRecall = ({
  output: {firstStage},
  expected
}: Judged<TextGroup>): number | undefined =>
  isAbsent(expected)
    ? undefined
    : answersIn(firstStage, expected) / expected.answers.length;
