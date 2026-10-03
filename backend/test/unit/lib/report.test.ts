import {verdictsOf} from '../../lib/bootstrap';
import {type Report, reportOf, reportTextOf} from '../../lib/report';

const A_CASE = {
  input: 'a Query',
  expected: {answers: ['stew.md'], near: []},
  tags: {split: 'tuning'},
  scores: {'F0.5': 0.8333333333333334},
  trace: {shown: 1, results: [{name: 'stew.md', score: 0.98765432}]}
};

const A_REPORT: Report = {
  name: 'the-text-group-of-a-search',
  means: {'F0.5': 0.4166666666666667},
  meansByTag: {split: {tuning: {'F0.5': 0.4166666666666667}}},
  counts: {},
  verdicts: {
    scorer: 'F0.5',
    previousReport: true,
    bySplit: {
      tuning: {meanDifference: 0, interval: [0, 0], pairs: 2, verdict: 'tie'}
    }
  },
  cases: [
    A_CASE,
    {...A_CASE, input: 'another Query', scores: {'F0.5': 0}, trace: undefined}
  ]
};

describe('report', () => {
  describe('reportTextOf', () => {
    it('should give each case one line', () => {
      const lines = reportTextOf(A_REPORT).split('\n');

      expect(lines.filter(line => line.includes('"input"'))).toStrictEqual([
        '    {"input":"a Query","expected":{"answers":["stew.md"],"near":[]},"tags":{"split":"tuning"},"scores":{"F0.5":0.8333333333333334},"trace":{"shown":1,"results":[{"name":"stew.md","score":0.988}]}},',
        '    {"input":"another Query","expected":{"answers":["stew.md"],"near":[]},"tags":{"split":"tuning"},"scores":{"F0.5":0}}'
      ]);
    });

    it('should indent the fields before the cases', () => {
      expect(reportTextOf(A_REPORT)).toMatch(
        /^{\n {2}"name": "the-text-group-of-a-search",\n {2}"means": {\n {4}"F0.5": 0.4166666666666667\n {2}},\n/
      );
    });

    it('should give the trace scores 3 decimals and keep the precision of the scores', () => {
      const [aCase] = reportOf(reportTextOf(A_REPORT)).cases;

      expect(aCase.scores).toStrictEqual({'F0.5': 0.8333333333333334});
      expect(aCase.trace).toStrictEqual({
        shown: 1,
        results: [{name: 'stew.md', score: 0.988}]
      });
    });

    it('should end with a new line', () => {
      expect(reportTextOf(A_REPORT).endsWith('\n  ]\n}\n')).toBe(true);
    });
  });

  describe('reportOf', () => {
    it('should read back a report that reportTextOf wrote', () => {
      const report = {...A_REPORT, cases: [{...A_CASE, trace: undefined}]};

      expect(reportOf(reportTextOf(report))).toStrictEqual(
        JSON.parse(JSON.stringify(report))
      );
    });

    it('should give the paired bootstrap the scores of each case of the previous report', () => {
      const previous = reportOf(reportTextOf(A_REPORT));

      expect(verdictsOf('F0.5', A_REPORT.cases, previous.cases).tuning).toStrictEqual({
        meanDifference: 0,
        interval: [0, 0],
        pairs: 2,
        verdict: 'tie'
      });
    });

    it('should read a report with no case', () => {
      expect(reportOf(reportTextOf({...A_REPORT, cases: []})).cases).toStrictEqual([]);
    });
  });
});
