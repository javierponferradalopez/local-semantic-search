import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const REPORTS_FOLDER = join(import.meta.dirname, '../../evals/reports');

export type EvalCase<Input, Expected> = {input: Input; expected: Expected};

type CaseResult<Input, Output, Expected> = {
  input: Input;
  output: Output;
  expected: Expected;
};

// A scorer gives undefined for a case it does not judge, and its mean leaves that case out.
export type Scorer<Input, Output, Expected> = {
  name: string;
  score: (
    result: CaseResult<Input, Output, Expected>
  ) => number | undefined | Promise<number | undefined>;
};

export type Count<Input, Output, Expected> = {
  name: string;
  holds: (result: CaseResult<Input, Output, Expected>) => boolean;
};

export type Eval<Input, Output, Expected> = {
  data: () => EvalCase<Input, Expected>[] | Promise<EvalCase<Input, Expected>[]>;
  task: (input: Input) => Promise<Output>;
  scorers: Scorer<Input, Output, Expected>[];
  counts: Count<Input, Output, Expected>[];
};

type Scores = Record<string, number>;

type CaseReport = {input: unknown; expected: unknown; scores: Scores};

type Report = {name: string; means: Scores; counts: Scores; cases: CaseReport[]};

// Nothing asserts a score, as ADR-0016 rules: only a throw fails the run.
export const runEval = <Input, Output, Expected>(
  name: string,
  evaluation: Eval<Input, Output, Expected>
): void => {
  it(name, async () => {
    const previous = await previousReportOf(name);
    const {cases, counts} = await caseReportsOf(name, evaluation);
    const report: Report = {
      name,
      means: meansOf(name, evaluation.scorers, cases),
      counts,
      cases
    };

    console.log(comparisonOf(report, previous));
    await writeFile(reportPathOf(name), `${JSON.stringify(report, null, 2)}\n`);
  });
};

const caseReportsOf = async <Input, Output, Expected>(
  name: string,
  {data, task, scorers, counts}: Eval<Input, Output, Expected>
): Promise<{cases: CaseReport[]; counts: Scores}> => {
  const cases = await data();

  if (cases.length === 0) {
    throw new Error(`The eval ${name} has no case.`);
  }

  if (scorers.length === 0) {
    throw new Error(`The eval ${name} has no scorer.`);
  }

  if (new Set(scorers.map(scorer => scorer.name)).size !== scorers.length) {
    throw new Error(`The eval ${name} has two scorers with the same name.`);
  }

  if (new Set(counts.map(count => count.name)).size !== counts.length) {
    throw new Error(`The eval ${name} has two counts with the same name.`);
  }

  const reports: CaseReport[] = [];
  const totals: Scores = Object.fromEntries(counts.map(count => [count.name, 0]));

  for (const {input, expected} of cases) {
    const output = await task(input);
    const scores: Scores = {};

    for (const scorer of scorers) {
      const score = await scorer.score({input, output, expected});

      if (score === undefined) {
        continue;
      }

      if (!Number.isFinite(score)) {
        throw new Error(`The scorer ${scorer.name} of the eval ${name} gave ${score}.`);
      }

      scores[scorer.name] = score;
    }

    for (const count of counts) {
      totals[count.name] += count.holds({input, output, expected}) ? 1 : 0;
    }

    reports.push({input, expected, scores});
  }

  return {cases: reports, counts: totals};
};

const meansOf = <Input, Output, Expected>(
  name: string,
  scorers: Scorer<Input, Output, Expected>[],
  cases: CaseReport[]
): Scores => {
  const means: Scores = {};

  for (const {name: scorer} of scorers) {
    const scores = cases.flatMap(report => report.scores[scorer] ?? []);

    if (scores.length === 0) {
      throw new Error(`The scorer ${scorer} of the eval ${name} judged no case.`);
    }

    means[scorer] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  return means;
};

const comparisonOf = (report: Report, previous: Report | undefined): string => {
  const previousCases = new Map(
    previous?.cases.map(previousCase => [keyOf(previousCase), previousCase.scores])
  );

  const caseLines = report.cases.map(
    currentCase =>
      `${keyOf(currentCase)}\n${scoreLinesOf(currentCase.scores, previousCases.get(keyOf(currentCase)))}`
  );

  const countLines =
    Object.keys(report.counts).length === 0
      ? []
      : [`The counts\n${scoreLinesOf(report.counts, previous?.counts, 0)}`];

  return [
    `The eval ${report.name}`,
    ...caseLines,
    `The mean\n${scoreLinesOf(report.means, previous?.means)}`,
    ...countLines
  ].join('\n\n');
};

const scoreLinesOf = (scores: Scores, previous: Scores | undefined, digits = 2): string =>
  Object.entries(scores)
    .map(([scorer, score]) => {
      const before = previous?.[scorer];
      const was =
        before === undefined ? 'no previous run' : `was ${before.toFixed(digits)}`;

      return `  ${scorer}: ${score.toFixed(digits)} (${was})`;
    })
    .join('\n');

const keyOf = ({input, expected}: CaseReport): string =>
  JSON.stringify({input, expected});

const reportPathOf = (name: string): string => join(REPORTS_FOLDER, `${name}.json`);

const previousReportOf = async (name: string): Promise<Report | undefined> => {
  try {
    return JSON.parse(await readFile(reportPathOf(name), 'utf8')) as Report;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
};
