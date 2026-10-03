# The words of the evals

This glossary is for a person who is new to search and RAG and wants to read the
reports in [`reports/`](../backend/evals/reports/). The words here are words of the eval, not of the
product. The words of the product, such as `Resource`, `Chunk`, `Result`, `Floor`
and `Reranker`, are in [`CONTEXT.md`](../CONTEXT.md).
[ADR-0041](adr/0041-the-eval-measures-a-search-on-postgres.md) records
why the eval is as it is.

## Read a report in this order

1. **`verdicts`**: did the change win, lose or tie against the previous report? Read
   the verdict of `holdout`.
2. **`means`**: the mean of each scorer over all the Queries. `F0.5` is the main one.
3. **`meansByTag`**: the same means for each split and each language. They show where
   a change helps and where it hurts.
4. **`cases`**: one line for each Query. A line is long, so read it with `jq`:

```sh
# F0.5, the number of shown Results, and the Query: one line for each Query.
jq -r '.cases[] | "\(.scores["F0.5"] // "-")\t\(.trace.shown)\t\(.input)"' \
  backend/evals/reports/the-text-group-of-a-search.json

# One Query in full, with its first 5 Results.
jq '.cases[] | select(.input == "can I freeze lentil soup")
    | {input, expected, scores, shown: .trace.shown, results: .trace.results[0:5]}' \
  backend/evals/reports/the-text-group-of-a-search.json
```

`pnpm run test:eval` also prints each Query with its scores beside the scores of the
previous report. To review a change, this output is easier to read than the file.

## The data

**Eval**: a run that measures how well the product does a task, and gives numbers.
A test passes or fails; an eval gives a score. Only an error stops an eval.

**Corpus**: the files that the eval ingests before it searches:
[`corpus/`](../backend/evals/corpus/) for the text group and [`image-corpus/`](../backend/evals/image-corpus/) for the
image group. Each picture of `image-corpus/` is a free picture that Openverse found,
resized to 512 pixels on its long edge. [`Manifest.ts`](../backend/evals/Manifest.ts) gives its
title, its creator, its source and its licence.

**Subject**: a topic of the corpus, such as lentils or a car insurance. Each file of
the corpus has one subject. [`Manifest.ts`](../backend/evals/Manifest.ts) gives the subject of each
file.

**Golden set**: the Queries of the eval, each with the Resources that are correct for
it. A person writes them by hand. They are in [`TextGoldenSet.ts`](../backend/evals/TextGoldenSet.ts)
and [`ImageGoldenSet.ts`](../backend/evals/ImageGoldenSet.ts). Other names for it: labelled data,
ground truth, qrels.

**Label**: what the golden set says about one Resource for one Query: it answers the
Query, it is Near, or it is of a different subject.

**Answer**: a Resource that answers the Query. In the report it is in
`expected.answers`.

**Near**: a Resource of the same subject as the Query that does not answer it. A
Near Resource is the hard case: it looks correct, but it is not. In the report it is
in `expected.near`.

**Real Query**: a Query that at least one Resource of the corpus answers.

**Absent Query**: a Query that no Resource of the corpus answers. The correct output
is an empty list. Its class is "off the subject", "technical term of the owner" or
"noise".

**Cross-language Query**: a Query in one language whose answer is in a different
language, such as a Query in English for a file in Spanish.

## The split

**Overfitting**: a change that you tune while you look at some Queries gets good on
those Queries, but not on new Queries. Its score is too good, and it lies.

**`tuning`**: about two thirds of the subjects. While you tune a change, you look only
at these. Machine learning calls this set the *validation set* or *dev set*.

**`holdout`**: the other third. You do not look at it while you tune. It shows how the
change does on Queries that it was not fitted to, so its verdict is the one that
counts. Machine learning calls this set the *test set*.

**Split by subject**: the eval splits the subjects, not the Queries. The Queries of one
subject share their Resources. If some were in `tuning` and others in `holdout`, the
tuning would see the Resources that judge the `holdout` Queries.

## The scorers

A **scorer** gives a number from 0 to 1 for each Query; 1 is the best. A scorer can
skip a Query that it does not apply to, and the mean leaves that Query out.

In the definitions, **the list** is the list of Resources that the group shows to the
person.

**Precision**: of the list, the part that answers. A list of 4 with 1 answer has a
precision of 0.25. Low precision means noise in the list. For a real Query with a list
that is not empty.

**Recall**: of the answers, the part that is in the list. 1 answer of 2 in the list
gives a recall of 0.5. Low recall means answers that the person does not see. For a
real Query.

**F0.5**: one number from precision and recall. It is an F-beta score with beta = 0.5,
so precision has two times the weight of recall. The reason: an agent reads all the
list, and a Resource of the subject that does not answer misleads it. It is 0 when the
list is empty or has no answer. This is the main scorer. For a real Query.

**Reciprocal rank**: 1 divided by the position of the first answer in the list. The
first answer at position 1 gives 1, at position 2 gives 0.5, and at position 4 gives
0.25. It shows if the best Result is at the top. Its mean is the *MRR* (mean
reciprocal rank). For a real Query.

**Right empty**: 1 when the list is empty, else 0. For an absent Query. It shows if
the product says "nothing" when it has nothing.

**Near leak**: 1 when the list has a Near Resource, else 0. Here a low number is good.
For a Query that has Near Resources.

**Recall@20 of the first stage**: of the answers, the part that the first stage finds
in its 20 Resources. If an answer is not there, the Reranker cannot show it. For a
real Query of the text group.

**First stage**: the fast search by Vector that finds the candidates. The Reranker
then gives each candidate a new score and orders them. Other names: retrieval,
candidate generation.

## The means

**`means`**: the mean of each scorer over the Queries that it judged.

**`meansByTag`**: the same means for each value of each tag: `split` (`tuning`,
`holdout`), `language` (`es`, `en`) and `cross-language`.

**`counts`**: the number of cases for which a condition is true. The Search evals have
no counts.

## The verdict

**Baseline**: the first report of the current pipeline. Git keeps it, and each later
change compares with the previous report.

**Pairs**: the Queries that are in the two reports, the current one and the previous
one. Each pair gives one difference: the current F0.5 minus the previous F0.5.

**Mean difference**: the mean of these differences. Above 0, the change helped on
average.

**Paired bootstrap**: a way to know if the mean difference is real or chance. It takes
a random sample of the pairs, with replacement, 10 000 times, and calculates the mean
difference of each sample. The seed is fixed, so two runs on the same reports give the
same verdict.

**95 % interval**: the range that holds 95 % of those sample means. A narrow range
means that the pairs agree.

**`win`**: all the interval is above 0. The change helps.

**`loss`**: all the interval is below 0. The change hurts.

**`tie`**: the interval holds 0. The eval cannot tell a gain from chance. When two
options tie, the person who decides takes the simpler option.

## The trace

The trace is the end of each case line. It keeps the scores of the pipeline, so that
you can tune a cut with no new run.

**`results`**: each Resource that the group scored, in order, with its score to 3
decimals. In the text group the score is the score of the Reranker. In the image group
it is the score of the Vision model.

**`firstStage`**: the candidates of the first stage, with their scores to 3 decimals.
Only the text group has it.

**`shown`**: how many Resources the group shows. They are always the first ones of
`results`, so `shown: 3` means the first 3 Results.

**Cut**: a rule that decides how many Results the group shows, such as the `Floor`.
To try a new cut, apply it to `results` and calculate the scorers again.

## Read more

- Precision, recall and MRR in a search:
  [Evaluating Search Quality in Information Retrieval Systems](https://unstructured.io/insights/evaluating-search-quality-in-ir-systems)
  and
  [Retrieval Metrics Tutorial: Recall@k and MRR Explained](https://medium.com/@rajnish_khatri/retrieval-metrics-tutorial-recall-k-and-mrr-explained-d2f12afb9c89).
- F-beta and F0.5:
  [What is F-Beta Score?](https://www.analyticsvidhya.com/blog/2024/12/f-beta-score/)
- Validation set, test set and overfitting:
  [Datasets, generalization, and overfitting](https://developers.google.com/machine-learning/crash-course/overfitting)
  of the Google Machine Learning Crash Course.
- The paired bootstrap:
  [Comparing NLP Models with Confidence: The Paired Bootstrap Test Explained](https://medium.com/ai-enthusiast/comparing-nlp-models-with-confidence-the-paired-bootstrap-test-explained-c9a88532ea3d)
  and
  [Why Pairing Your Bootstrap Is Necessary](https://dev.to/natnael_alemseged/why-pairing-your-bootstrap-is-necessary-and-when-it-stops-helping-2iim).
