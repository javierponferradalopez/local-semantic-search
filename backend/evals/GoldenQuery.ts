import type {Language, Split} from './Manifest';

// The class of a Query that no Resource of the corpus answers.
export type Absence = 'off the subject' | 'technical term of the owner' | 'noise';

// A Near Resource is of the subject of the Query, and does not answer it.
type Labels = {query: string; language: Language; near: readonly string[]};

export type RealQuery = Labels & {
  subject: string;
  answers: readonly [string, ...string[]];
};

export type AbsentQuery = Labels & {absent: Absence} & (
    | {subject: string}
    | {split: Split}
  );

export type GoldenQuery = RealQuery | AbsentQuery;
