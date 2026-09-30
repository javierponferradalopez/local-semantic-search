---
kind: decision
status: accepted
---

# A model is judged by an eval, never by a test

> **Amended by [ADR-0021](0021-a-floor-rejects-only-what-is-far-from-everything.md).**
> Each eval has two scorers, not one: the reciprocal rank, and the verdict of
> the `Floor`. The golden set also holds queries whose answer is not in the
> corpus. Everything else stands.
>
> **Amended by [ADR-0040](0040-a-reranker-gates-and-orders-the-text-group.md).**
> The text eval ranks with the two stages of the text group: the cosine of the
> Text model, then the score of the Reranker.

**No automated test loads a model. What a model does — the prefix its adapter
writes, the width of its `Vector`, and above all whether the right `Resource`
comes first — is measured by an eval, and an eval gives a score, not a pass or
a fail.** The unit, integration and e2e suites prove the code around the
models with `Vector` written by hand, and the e2e suite loads the real models
only because it boots the whole application.

Decided in
[The testing strategy](https://github.com/javierponferradalopez/local-semantic-search/issues/21).

## Why a test is the wrong instrument

A test asserts that a behaviour holds. The behaviour of a model is a ranking,
and a ranking moves every time the cutter or the model changes — and
[A cut that no model owns](https://github.com/javierponferradalopez/local-semantic-search/issues/25)
just changed the cutter. A test that asserts *"mujer" returns the woman first*
turns every such change into a false regression, and the threshold that keeps
it green is lowered the day it gets in the way. The other cost is CI:
[How the repository is laid out](https://github.com/javierponferradalopez/local-semantic-search/issues/12)
ruled that CI never downloads a model, so a test that needs one could never run
where tests are meant to run.

## What an eval is

An eval is a Vitest file, `*.eval.ts`, in the mirror of `infrastructure/` next
to the model adapter it measures, run by its own mode `eval` and its own script.
It is written with a runner of this repository that follows the shape of
Evalite — `{ data, task, scorers }` — without taking Evalite as a dependency:

- `data` is the golden set, in TypeScript: each case holds a `Query` and the
  name of the `Resource` expected first. The corpus it points at lives in
  `backend/evals/corpus/`, about ten small `Resource` across the admitted
  `Content type`, and the `Query` are in Spanish, with a few in English.
- `task` reads and cuts the corpus with the real reader and cutter adapters,
  embeds the `Chunk` — or the `Picture` — and the `Query` with the real model
  adapter, ranks by cosine in memory, and returns the `Resource` ordered by their
  best `Match`. No Postgres takes part: the SQL is proved elsewhere.
- The scorer is the reciprocal rank: 1 when the expected `Resource` is first,
  0.5 when second, 0 when absent. The mean of a suite is its MRR.

The verdict is the difference with the previous run. The runner writes one
report per eval in `backend/evals/reports/`, versioned in git, and prints the
score of each case beside the previous one. A change of model or of cutter
therefore carries its evidence in the same commit.

The promise of [ADR-0014](0014-the-cut-belongs-to-no-model.md) — that the cap
in code points fits the token wall of the model — is one more eval beside the
text adapter, because it is a fact about the model and the tokenizer that
`bootstrap` fetches.

## Consequences

- The text and image groups are two eval files, one per model adapter, and
  they never share a score, as the glossary says their `Vector` never compare.
- An eval needs the weights and never runs in CI.
- The search quality that #12 recorded as *judged by eye* now has a number,
  and the number is read, not gated.
