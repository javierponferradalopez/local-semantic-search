import type {Bootstrap} from './bootstrap';
import type {MeansByTag, Scores, Tags} from './means';

const TRACE_DECIMALS = 3;

export type CaseReport = {
  input: unknown;
  expected: unknown;
  tags?: Tags;
  scores: Scores;
  trace?: unknown;
};

// The holdout split gives the verdict on a change; you tune on the tuning split.
export type Verdicts =
  | {scorer: string; previousReport: false}
  | {scorer: string; previousReport: true; bySplit: Record<string, Bootstrap>};

export type Report = {
  name: string;
  means: Scores;
  meansByTag?: MeansByTag;
  counts: Scores;
  verdicts?: Verdicts;
  cases: CaseReport[];
};

// ADR-0041: one line for each case.
export const reportTextOf = ({cases, ...head}: Report): string => {
  const headText = JSON.stringify(head, null, 2).replace(/\n}$/, '');
  const caseLines = cases.map(caseReport => `    ${caseLineOf(caseReport)}`);
  const casesText = caseLines.length === 0 ? '[]' : `[\n${caseLines.join(',\n')}\n  ]`;

  return `${headText},\n  "cases": ${casesText}\n}\n`;
};

export const reportOf = (text: string): Report => JSON.parse(text) as Report;

// The scores keep their full precision, because the paired bootstrap pairs them with the next report.
const caseLineOf = (caseReport: CaseReport): string =>
  JSON.stringify({...caseReport, trace: roundedOf(caseReport.trace)});

const roundedOf = (value: unknown): unknown => {
  if (typeof value === 'number') {
    return Number(value.toFixed(TRACE_DECIMALS));
  }

  if (Array.isArray(value)) {
    return value.map(roundedOf);
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, roundedOf(item)])
    );
  }

  return value;
};
