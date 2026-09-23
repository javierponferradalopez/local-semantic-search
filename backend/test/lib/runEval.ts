import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const REPORTS_FOLDER = join(import.meta.dirname, '../../evals/reports');

export type EvalCase<Input, Expected> = {input: Input; expected: Expected};

export type Scorer<Input, Output, Expected> = {
  name: string;
  score: (result: {
    input: Input;
    output: Output;
    expected: Expected;
  }) => number | Promise<number>;
};

export type Eval<Input, Output, Expected> = {
  data: () => EvalCase<Input, Expected>[] | Promise<EvalCase<Input, Expected>[]>;
  task: (input: Input) => Promise<Output>;
  scorers: Scorer<Input, Output, Expected>[];
};

type Scores = Record<string, number>;

type CaseReport = {input: unknown; expected: unknown; scores: Scores};

type Report = {name: string; means: Scores; cases: CaseReport[]};

// Nothing asserts a score, as ADR-0016 rules: only a throw fails the run.
export const runEval = <Input, Output, Expected>(
  name: string,
  evaluation: Eval<Input, Output, Expected>
): void => {
  it(name, async () => {
    const previous = await previousReportOf(name);
    const cases = await caseReportsOf(name, evaluation);
    const report: Report = {name, means: meansOf(cases), cases};

    console.log(comparisonOf(report, previous));
    await writeFile(reportPathOf(name), `${JSON.stringify(report, null, 2)}\n`);
  });
};

const caseReportsOf = async <Input, Output, Expected>(
  name: string,
  {data, task, scorers}: Eval<Input, Output, Expected>
): Promise<CaseReport[]> => {
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

  const reports: CaseReport[] = [];

  for (const {input, expected} of cases) {
    const output = await task(input);
    const scores: Scores = {};

    for (const scorer of scorers) {
      const score = await scorer.score({input, output, expected});

      if (!Number.isFinite(score)) {
        throw new Error(`The scorer ${scorer.name} of the eval ${name} gave ${score}.`);
      }

      scores[scorer.name] = score;
    }

    reports.push({input, expected, scores});
  }

  return reports;
};

const meansOf = (cases: CaseReport[]): Scores => {
  const means: Scores = {};

  for (const scorer of Object.keys(cases[0].scores)) {
    const total = cases.reduce((sum, report) => sum + report.scores[scorer], 0);
    means[scorer] = total / cases.length;
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

  return [
    `The eval ${report.name}`,
    ...caseLines,
    `The mean\n${scoreLinesOf(report.means, previous?.means)}`
  ].join('\n\n');
};

const scoreLinesOf = (scores: Scores, previous: Scores | undefined): string =>
  Object.entries(scores)
    .map(([scorer, score]) => {
      const before = previous?.[scorer];
      const was = before === undefined ? 'no previous run' : `was ${before.toFixed(2)}`;

      return `  ${scorer}: ${score.toFixed(2)} (${was})`;
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
