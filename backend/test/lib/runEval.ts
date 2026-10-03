import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {type Bootstrap, verdictsOf} from './bootstrap';
import {type MeansByTag, meansByTagOf, meansOf, type Scores, type Tags} from './means';

const REPORTS_FOLDER = join(import.meta.dirname, '../../evals/reports');

export type EvalCase<Input, Expected> = {input: Input; expected: Expected; tags?: Tags};

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
  // What the line of a case holds beside its scores, so that you can tune a cut with no new run.
  trace?: (output: Output) => unknown;
  // The scorer that the paired bootstrap compares with the previous report, for each split.
  mainScorer?: string;
};

type CaseReport = {
  input: unknown;
  expected: unknown;
  tags?: Tags;
  scores: Scores;
  trace?: unknown;
};

// The holdout split gives the verdict on a change; you tune on the tuning split.
type Verdicts =
  | {scorer: string; previousReport: false}
  | {scorer: string; previousReport: true; bySplit: Record<string, Bootstrap>};

type Report = {
  name: string;
  means: Scores;
  meansByTag?: MeansByTag;
  counts: Scores;
  verdicts?: Verdicts;
  cases: CaseReport[];
};

// Nothing asserts a score, as ADR-0016 rules: only a throw fails the run.
export const runEval = <Input, Output, Expected>(
  name: string,
  evaluation: Eval<Input, Output, Expected>
): void => {
  it(name, async () => {
    const previous = await previousReportOf(name);
    const {cases, counts} = await caseReportsOf(name, evaluation);
    const scorers = evaluation.scorers.map(scorer => scorer.name);
    const meansByTag = meansByTagOf(scorers, cases);
    const report: Report = {
      name,
      means: meansOf(scorers, cases),
      // An eval with no tags keeps the report that it gave before the tags.
      meansByTag: Object.keys(meansByTag).length === 0 ? undefined : meansByTag,
      counts,
      verdicts: verdictsAgainst(evaluation.mainScorer, cases, previous),
      cases
    };

    // A golden set can hold no case that a scorer judges, such as a Near leak with no Near Resource.
    for (const scorer of scorers.filter(scorer => !(scorer in report.means))) {
      console.log(
        `The scorer ${scorer} of the eval ${name} judged no case, so it has no mean.`
      );
    }

    console.log(comparisonOf(report, previous));
    await writeFile(reportPathOf(name), `${JSON.stringify(report, null, 2)}\n`);
  });
};

const caseReportsOf = async <Input, Output, Expected>(
  name: string,
  {data, task, scorers, counts, trace, mainScorer}: Eval<Input, Output, Expected>
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

  if (mainScorer !== undefined && !scorers.some(scorer => scorer.name === mainScorer)) {
    throw new Error(
      `The main scorer ${mainScorer} of the eval ${name} is not a scorer of it.`
    );
  }

  if (new Set(counts.map(count => count.name)).size !== counts.length) {
    throw new Error(`The eval ${name} has two counts with the same name.`);
  }

  const reports: CaseReport[] = [];
  const totals: Scores = Object.fromEntries(counts.map(count => [count.name, 0]));

  for (const {input, expected, tags} of cases) {
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

    reports.push({input, expected, tags, scores, trace: trace?.(output)});
  }

  return {cases: reports, counts: totals};
};

const verdictsAgainst = (
  scorer: string | undefined,
  cases: readonly CaseReport[],
  previous: Report | undefined
): Verdicts | undefined => {
  if (scorer === undefined) {
    return undefined;
  }

  return previous === undefined
    ? {scorer, previousReport: false}
    : {scorer, previousReport: true, bySplit: verdictsOf(scorer, cases, previous.cases)};
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

  const tagLines = Object.entries(report.meansByTag ?? {}).flatMap(
    ([tag, meansByValue]) =>
      Object.entries(meansByValue).map(
        ([value, means]) =>
          `The mean for the ${tag} ${value}\n${scoreLinesOf(means, previous?.meansByTag?.[tag]?.[value])}`
      )
  );

  return [
    `The eval ${report.name}`,
    ...caseLines,
    `The mean\n${scoreLinesOf(report.means, previous?.means)}`,
    ...tagLines,
    ...countLines,
    ...verdictLinesOf(report.verdicts)
  ].join('\n\n');
};

const verdictLinesOf = (verdicts: Verdicts | undefined): string[] => {
  if (verdicts === undefined) {
    return [];
  }

  if (!verdicts.previousReport) {
    return [`The verdict of ${verdicts.scorer}\n  no previous report, so no verdict`];
  }

  const lines = Object.entries(verdicts.bySplit).map(
    ([
      split,
      {
        meanDifference,
        interval: [low, high],
        pairs,
        verdict
      }
    ]) =>
      `  ${split}: ${verdict}, mean difference ${meanDifference.toFixed(3)}, 95 % interval [${low.toFixed(3)}, ${high.toFixed(3)}], ${pairs} pairs`
  );

  return [`The verdict of ${verdicts.scorer}\n${lines.join('\n')}`];
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
