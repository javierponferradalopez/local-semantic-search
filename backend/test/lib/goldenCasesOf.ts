import type {GoldenQuery} from '../../evals/GoldenQuery';
import type {Language, Manifest, Split} from '../../evals/Manifest';
import type {Tags} from './means';
import type {EvalCase} from './runEval';

// No Resource answers an absent Query.
export type Labels = {answers: readonly string[]; near: readonly string[]};

// A picture has no language.
type Resources = Readonly<Record<string, {subject: string; language?: Language}>>;

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

  // A Resource that a label forgets would lower the Near leak in silence.
  for (const [name, resource] of Object.entries(resources)) {
    if (resource.subject === subject && !answers.includes(name) && !near.includes(name)) {
      throw new Error(`${name} neither answers the Query "${query}" nor is Near to it.`);
    }
  }
};

const splitOf = (goldenQuery: GoldenQuery, subjects: Manifest['subjects']): Split =>
  'subject' in goldenQuery ? subjects[goldenQuery.subject] : goldenQuery.split;

// No tag rather than a false "no": a picture has no language, and an absent Query no answer.
const crossLanguageOf = (
  goldenQuery: GoldenQuery,
  resources: Resources
): 'yes' | 'no' | undefined => {
  const languages = answersOf(goldenQuery).map(name => resources[name].language);

  if (languages.length === 0 || languages.includes(undefined)) {
    return undefined;
  }

  return languages.some(language => language !== goldenQuery.language) ? 'yes' : 'no';
};

const tagsOf = (goldenQuery: GoldenQuery, {subjects, resources}: Corpus): Tags => {
  const crossLanguage = crossLanguageOf(goldenQuery, resources);
  const tags = {split: splitOf(goldenQuery, subjects), language: goldenQuery.language};

  return crossLanguage === undefined ? tags : {...tags, 'cross-language': crossLanguage};
};

// A wrong label throws, so it never changes a score in silence.
export const goldenCasesOf = (params: Params): EvalCase<string, Labels>[] => {
  checkTheManifest(params);

  return params.goldenSet.map(goldenQuery => {
    checkTheLabelsOf(goldenQuery, params);

    return {
      input: goldenQuery.query,
      expected: {answers: answersOf(goldenQuery), near: goldenQuery.near},
      tags: tagsOf(goldenQuery, params)
    };
  });
};
