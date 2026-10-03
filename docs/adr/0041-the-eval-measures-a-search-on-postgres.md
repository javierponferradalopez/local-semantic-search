---
kind: decision
status: accepted
---

# The eval measures a Search on Postgres

**The eval measures the `Search` use case, not a model adapter. It runs on a real
Postgres, with the real models, and it ingests a versioned corpus through the
application. Each `Query` has the `Resources` that answer it and its Near
`Resources`. The main number is F0.5 of the list that a group shows. The subjects
of the corpus are split into `tuning` and `holdout`, and a paired bootstrap of F0.5
against the previous report says if a change wins, loses or ties.**

This amends [ADR-0016](0016-a-model-is-judged-by-an-eval-never-by-a-test.md).
Decided in
[What the larger eval measures](https://github.com/javierponferradalopez/local-semantic-search/issues/96),
and specified in
[The larger eval is specified and built](https://github.com/javierponferradalopez/local-semantic-search/issues/97).

## Why this needs a record

A reader will find an eval that starts a Postgres container, a slow `beforeAll`
that ingests the whole corpus, and two decorators of ports in `backend/test/lib/`.
ADR-0016 says that no Postgres takes part and that the eval ranks by cosine in
memory. So the eval looks like something to move back to memory. Do not do it.

## Why the eval runs the code that ships

The next fronts of
[A Search gives only useful content](https://github.com/javierponferradalopez/local-semantic-search/issues/94)
are a cut for each `Result`, the context of a `Chunk`, and a hybrid first stage. A
hybrid first stage is SQL: the tokenizer of Postgres, `ts_rank_cd`, the recall of an
ANN index. A copy of the first stage in memory cannot copy them, and it drifts from
the SQL that ships.

- LlamaIndex `RetrieverEvaluator`, the Elasticsearch Ranking Evaluation API and
  pyvespa `VespaEvaluator` all run the real engine.
- The [MetaNavT PR](https://github.com/joses2017smjh/MetaNavT/pull/4) shows an
  in-memory benchmark and an SQL API that drifted apart.

## How the eval runs

- **The eval mode of Vitest starts the Postgres container**, with the same
  `globalSetup` as the integration and e2e modes. The eval needs Docker.
- **The Ingest goes through the application**, as the owner adds a file. The eval
  starts the app with the real models, wipes the store one time, sends each file of
  the manifest, and waits until each `Resource` is Ready. A `Resource` that becomes
  Failed throws. The Ingest runs one time for each run, and the two reports share
  it.
- **The `Search` is the one of the wiring.** The eval makes one `Search` with the
  dependencies of the container and the same `Floors`. A new parameter of `Search`
  breaks the compile of the eval, so the eval cannot drift from the wiring in
  silence.
- **Two decorators read what the pipeline does not give.** A recording `Reranker`
  records the first stage and the scores of the Reranker. A recording
  `PictureResultReader` records the image `Results` and their scores. They give back
  what they wrap, so the production code does not change.
- **A failed group throws.** `Search` gives an empty group when a group fails. The
  eval detects the failure and throws, so an empty list is always an answer of the
  pipeline.
- The eval file mirrors the use case that it measures:
  `backend/test/eval/core/search/use-cases/Search.eval.ts`. The eval that the cap
  fits the wall of tokens stays beside the text adapter, as ADR-0016 decided.

## The labels

Labels are binary and on the `Resource`, not on the `Chunk`. A `Chunk` label ties
the eval to the cutter, and the front of the context of a `Chunk` changes the
cutter.

- Each real `Query` has a set of `Resources` that **answer** it, and a set of
  **Near** `Resources`: the same subject, but no answer.
- An **absent** `Query` has no `Resource` that answers it. It has a class: off the
  subject, a technical term of the owner, or noise.
- A **cross-language** `Query` is a `Query` in a language different from the
  language of a `Resource` that answers it. The manifest gives each language, so
  the eval calculates this.

The data step throws when a label names a `Resource` that is not in the corpus, a
file of the corpus is not in the manifest, a `Resource` both answers a `Query` and
is Near to it, a `Resource` of the subject of a `Query` neither answers it nor is
Near to it, a label crosses to a different subject, or a subject has no split.
A typo or a forgotten label then cannot change a score in silence.

## The scorers

For each `Query`, L is the list that the group shows, A is the set of `Resources`
that answer, and N is the set of Near `Resources`.

| Scorer | For | Value |
|---|---|---|
| **F0.5** | a real `Query` | `1.25·P·R / (0.25·P + R)`; 0 when L is empty or holds no `Resource` of A |
| Precision | a real `Query`, L not empty | \|L ∩ A\| / \|L\| |
| Recall | a real `Query` | \|L ∩ A\| / \|A\| |
| Right empty | an absent `Query` | 1 when L is empty, else 0 |
| Near leak | a `Query` with N not empty | 1 when L holds a `Resource` of N, else 0 |
| Reciprocal rank | a real `Query` | 1 / the rank of the first `Resource` of A in L; 0 when none |
| Recall@20 of the first stage | a real `Query`, text group | \|first stage ∩ A\| / \|A\| |

F0.5 gives precision two times the weight of recall, because an agent reads all of
the list, and passages on the same subject that do not answer hurt it (#95). A real
`Query` with an empty list gets 0, so a gate that hides real answers cannot look
good.

**The verdict of the `Floor` is removed**, with the two scorers of the best score.
Right empty and the 0 for an empty list measure the same thing, without the rule
"only the best `Match`". The scores of each `Result` stay in the line of each
`Query`, so a cut can be tuned with no new run.

The image group has the same labels and scorers, with no first stage: it has one
stage.

## The split: `tuning` and `holdout`

Each subject of the corpus has one split, fixed in the manifest. The split does not
change after the baseline.

- **`tuning`**, about two thirds of the subjects. A tuning reads only these.
- **`holdout`**, about one third. The tuning never sees them, so their number is
  honest about `Queries` that a change was not fitted to.

The names are not `dev` and `test`. In this repository `test` is the Vitest modes,
`backend/test/` and the default mode of Vitest, and `dev` is `pnpm dev`. Those names
make "the verdict of test" mean two things.

## When a change wins

The runner runs a paired bootstrap of the main scorer, F0.5, against the previous
report, for each split:

- The pairs are the `Queries` that are in both reports, matched by the `Query`. The
  difference is the current score minus the previous score.
- 10 000 resamples with replacement and a fixed seed, so two runs on the same
  reports give the same verdict. The 2.5 % and 97.5 % percentiles give the
  interval.
- **"win"** when the interval is above 0, **"loss"** when it is below 0, **"tie"**
  when it holds 0. The report gives the mean difference, the interval and the
  number of pairs.
- **The verdict of a front is the one of `holdout`.** The verdict of `tuning`
  shows only that a change fits the `Queries` that tuned it.
- With no previous report, the report says so and gives no verdict.

"The simpler option wins a tie" is a rule for the person who decides. The report
gives "tie" and nothing more.

## The reports

The text group and the image group are two reports,
`the-text-group-of-a-search` and `the-image-group-of-a-search`, in
`backend/evals/reports/`. They never share a score, as ADR-0016 decided. Each
report gives the mean of each scorer for all the `Queries` and for each split,
language and cross-language value, and one line for each `Query` with the list
that was shown and the score of each `Result`.

The first run on the current pipeline is the baseline. It is committed, and each
later front compares with it.

## What stands of ADR-0016

An eval gives a score, not a pass or a fail. Only a throw fails a run. The reports
are versioned in git. An eval never runs in CI. No test loads a model.

## Considered options

- **Keep the eval in memory, and prove the SQL in the integration tests.**
  Refused: an integration test proves that the SQL runs, not that it ranks well,
  and the hybrid front needs the number of the real first stage.
- **Labels on the `Chunk`.** Refused: they tie the eval to the cutter.
- **A split by `Query`.** Refused: the `Queries` of one subject share their
  `Resources`, so a tuning on some of them sees the `Resources` that judge the
  others.

Graded labels and an LLM that judges the `Results` are out of the scope of #97.
They were not refused.

## Consequences

- **The eval needs Docker**, as the integration and e2e tests do. Each run starts
  its own Postgres container and a temp directory for the Files, so a run never
  touches `backend/data/`.
- **A run takes minutes**, because it ingests the whole corpus with the real
  models. If it is too slow, the first move is to keep the container between runs,
  not to go back to memory.
- **The production code does not change for the eval.** The decorators wrap ports.
- **`GetMatches` is not measured.** It orders the `Chunks` of one `Resource`, and
  the eval has no `Chunk` labels.
- **`CONTEXT.md` does not change.** Answer, Near, F0.5 and the split are terms of
  the eval, not of the domain.
