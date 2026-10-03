export type Scores = Record<string, number>;

// Each tag names one way to split the cases, such as the split or the language.
export type Tags = Readonly<Record<string, string>>;

// The means of each value of each tag: split → tuning → F0.5.
export type MeansByTag = Record<string, Record<string, Scores>>;

type ScoredCase = {tags?: Tags; scores: Scores};

export const meansOf = (
  scorers: readonly string[],
  cases: readonly ScoredCase[]
): Scores => {
  const means: Scores = {};

  for (const scorer of scorers) {
    const scores = cases.flatMap(({scores}) => scores[scorer] ?? []);

    if (scores.length > 0) {
      means[scorer] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
  }

  return means;
};

export const meansByTagOf = (
  scorers: readonly string[],
  cases: readonly ScoredCase[]
): MeansByTag => {
  const casesByTag: Record<string, Record<string, ScoredCase[]>> = {};

  for (const scored of cases) {
    for (const [tag, value] of Object.entries(scored.tags ?? {})) {
      casesByTag[tag] ??= {};
      casesByTag[tag][value] ??= [];
      casesByTag[tag][value].push(scored);
    }
  }

  return Object.fromEntries(
    Object.entries(casesByTag).map(([tag, casesByValue]) => [
      tag,
      Object.fromEntries(
        Object.entries(casesByValue).map(([value, tagged]) => [
          value,
          meansOf(scorers, tagged)
        ])
      )
    ])
  );
};
