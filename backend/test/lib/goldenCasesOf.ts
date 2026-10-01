import type {GoldenQuery} from '../../evals/GoldenQuery';
import type {Manifest} from '../../evals/Manifest';
import type {EvalCase} from './runEval';

// No Resource answers an absent Query.
export type Labels = {answers: readonly string[]; near: readonly string[]};

type Resources = Readonly<Record<string, {subject: string}>>;

type Params = {
  subjects: Manifest['subjects'];
  resources: Resources;
  corpus: readonly string[];
  goldenSet: readonly GoldenQuery[];
};

type Corpus = Omit<Params, 'goldenSet'>;

const answersOf = (goldenQuery: GoldenQuery): readonly string[] =>
  'answers' in goldenQuery ? goldenQuery.answers : [];

const subjectOf = (goldenQuery: GoldenQuery): string | undefined =>
  'subject' in goldenQuery ? goldenQuery.subject : undefined;

const checkTheSplitOf = (subjects: Manifest['subjects'], subject: string): void => {
  if (!(subject in subjects)) {
    throw new Error(`The subject ${subject} has no split.`);
  }
};

const checkTheManifest = ({subjects, resources, corpus}: Corpus): void => {
  for (const {subject} of Object.values(resources)) {
    checkTheSplitOf(subjects, subject);
  }

  for (const name of corpus) {
    if (!(name in resources)) {
      throw new Error(`The corpus holds ${name}, which is not in the manifest.`);
    }
  }
};

const checkTheLabelsOf = (
  goldenQuery: GoldenQuery,
  {subjects, resources, corpus}: Corpus
): void => {
  const {query, near} = goldenQuery;
  const answers = answersOf(goldenQuery);
  const subject = subjectOf(goldenQuery);

  if (subject !== undefined) {
    checkTheSplitOf(subjects, subject);
  }

  for (const name of [...answers, ...near]) {
    if (!corpus.includes(name)) {
      throw new Error(`The Query "${query}" names ${name}, which is not in the corpus.`);
    }

    // The split is by subject, so a label that crosses a subject crosses the split.
    if (resources[name].subject !== subject) {
      throw new Error(
        `The Query "${query}" names ${name}, which is not of the subject ${subject ?? 'of the Query'}.`
      );
    }
  }

  for (const name of answers) {
    if (near.includes(name)) {
      throw new Error(`${name} answers the Query "${query}" and is Near to it.`);
    }
  }
};

// A wrong label throws, so it never changes a score in silence.
export const goldenCasesOf = (params: Params): EvalCase<string, Labels>[] => {
  checkTheManifest(params);

  return params.goldenSet.map(goldenQuery => {
    checkTheLabelsOf(goldenQuery, params);

    return {
      input: goldenQuery.query,
      expected: {answers: answersOf(goldenQuery), near: goldenQuery.near}
    };
  });
};
