import type {GoldenQuery} from '../../../evals/GoldenQuery';
import {goldenCasesOf} from '../../lib/goldenCasesOf';

const SUBJECTS = {cooking: 'dev', cycling: 'test'} as const;

const RESOURCES = {
  'lentils.md': {subject: 'cooking'},
  'soup.md': {subject: 'cooking'},
  'bike.md': {subject: 'cycling'}
};

const CORPUS = ['lentils.md', 'soup.md', 'bike.md'];

const A_REAL_QUERY: GoldenQuery = {
  query: 'un guiso de lentejas',
  language: 'es',
  subject: 'cooking',
  answers: ['lentils.md'],
  near: ['soup.md']
};

const AN_ABSENT_QUERY: GoldenQuery = {
  query: 'zzzz',
  language: 'es',
  absent: 'noise',
  split: 'dev',
  near: []
};

describe('goldenCasesOf', () => {
  it('should give each Query with the Resources that answer it and its Near Resources', () => {
    expect(
      goldenCasesOf({
        subjects: SUBJECTS,
        resources: RESOURCES,
        corpus: CORPUS,
        goldenSet: [A_REAL_QUERY, AN_ABSENT_QUERY]
      })
    ).toStrictEqual([
      {
        input: 'un guiso de lentejas',
        expected: {answers: ['lentils.md'], near: ['soup.md']}
      },
      {input: 'zzzz', expected: {answers: [], near: []}}
    ]);
  });

  it('should throw when a label names a Resource that is not in the corpus', () => {
    expect(() =>
      goldenCasesOf({
        subjects: SUBJECTS,
        resources: RESOURCES,
        corpus: CORPUS,
        goldenSet: [{...A_REAL_QUERY, answers: ['lentejas.md']}]
      })
    ).toThrow('lentejas.md');
  });

  it('should throw when a file of the corpus is not in the manifest', () => {
    expect(() =>
      goldenCasesOf({
        subjects: SUBJECTS,
        resources: RESOURCES,
        corpus: [...CORPUS, 'stew.md'],
        goldenSet: [A_REAL_QUERY]
      })
    ).toThrow('stew.md');
  });

  it('should throw when one Resource answers a Query and is Near to it', () => {
    expect(() =>
      goldenCasesOf({
        subjects: SUBJECTS,
        resources: RESOURCES,
        corpus: CORPUS,
        goldenSet: [{...A_REAL_QUERY, near: ['lentils.md']}]
      })
    ).toThrow('lentils.md');
  });

  it('should throw when a label names a Resource of a different subject from its Query', () => {
    expect(() =>
      goldenCasesOf({
        subjects: SUBJECTS,
        resources: RESOURCES,
        corpus: CORPUS,
        goldenSet: [{...A_REAL_QUERY, near: ['bike.md']}]
      })
    ).toThrow('bike.md');
  });

  it('should throw when a Query with no subject names a Resource', () => {
    expect(() =>
      goldenCasesOf({
        subjects: SUBJECTS,
        resources: RESOURCES,
        corpus: CORPUS,
        goldenSet: [{...AN_ABSENT_QUERY, near: ['soup.md']}]
      })
    ).toThrow('soup.md');
  });

  it('should throw when the subject of a Resource has no split', () => {
    expect(() =>
      goldenCasesOf({
        subjects: SUBJECTS,
        resources: {...RESOURCES, 'bike.md': {subject: 'repairs'}},
        corpus: CORPUS,
        goldenSet: [A_REAL_QUERY]
      })
    ).toThrow('repairs');
  });

  it('should throw when the subject of a Query has no split', () => {
    expect(() =>
      goldenCasesOf({
        subjects: SUBJECTS,
        resources: RESOURCES,
        corpus: CORPUS,
        goldenSet: [{...A_REAL_QUERY, subject: 'gardening'}]
      })
    ).toThrow('gardening');
  });
});
