---
kind: decision
status: accepted
---

# A Floor gates a group and a Margin cuts it

**Each group of a `Search` has a `Floor` and a `Margin`, in the score of its own
model. When the best `Match` is below the `Floor`, the group is empty. Else the
group keeps each `Result` whose score is at least the score of the best `Result`
minus the `Margin`. Text: `Floor` −0.3 and `Margin` 0.2, in the logit of the
Reranker. Images: `Floor` 0.09 and `Margin` 0.02, in the cosine of the Vision
model. `get_matches` goes through the Reranker and the text `Floor`, with no
`Margin`.** The response has no score and no relevance band.

This supersedes
[ADR-0021](0021-a-floor-rejects-only-what-is-far-from-everything.md), and it
amends [ADR-0040](0040-a-reranker-gates-and-orders-the-text-group.md).
Decided in
[Which rule cuts each Result, in the text and the image groups](https://github.com/javierponferradalopez/local-semantic-search/issues/98),
[Does get_matches go through the Reranker and the cut](https://github.com/javierponferradalopez/local-semantic-search/issues/99)
and
[Does the agent get a relevance band](https://github.com/javierponferradalopez/local-semantic-search/issues/100).
Specified in
[The cut is specified and built](https://github.com/javierponferradalopez/local-semantic-search/issues/101).

## Why this needs a record

A reader will find two rules where ADR-0021 had one: a gate on the best `Match`,
and a `Margin` that removes `Results` from the list. ADR-0021 made the gate the
only rule on purpose. Without this record, a reader "fixes" the `Margin` back to
a gate on the best `Match` only, or replaces it with an absolute threshold on
each `Result`. The eval measured both, and both lose.

## Why "a human judges a grid by eye" no longer holds

ADR-0021 set each `Floor` low, because a list that does not answer costs little:
the owner judges a grid of pictures by eye in a second. Now an agent reads the
list too. It reads each `Result`, so each unrelated `Result` costs it context,
and it can mislead it. The baseline of the larger eval
([ADR-0041](0041-the-eval-measures-a-search-on-postgres.md)) shows 17.5 text
`Results` and 22.4 Pictures on average, with an F0.5 of 0.075 on `holdout` in
each group. "patas de un pulpo" shows the right `Resource` at −0.19, then
unrelated `Resources` at −1.70 and −2.58.

## The rule

- **The `Floor` is the gate of the best `Match`.** In a `Search`, it decides
  only if the group is empty.
- **The `Margin` cuts the list below the best `Result`.** A `Result` whose score
  is lower than the score of the best `Result` minus the `Margin` goes. A
  `Result` at exactly that value stays. The kept `Results` are always the first
  `Results` of the ordered list, so the shown list is a prefix, and the eval
  reads it so.
- **The two groups have the same shape.** Each group uses the score of its
  model: the logit of the Reranker for text, the cosine of the Vision model for
  images. A number never crosses from one model to the other.
- **The order does not change.** The Reranker orders the text group, the cosine
  orders the image group.

## Why a Margin

The baseline reports, `the-text-group-of-a-search` and
`the-image-group-of-a-search` in `backend/evals/reports/` at commit f51b1b5,
hold the full list of each case with the score of each `Result`, also when the
gate gives an empty list. So each rule was
simulated on the reports, with no new run: tuned on `tuning`, and judged on
`holdout` with the paired bootstrap of the eval. On text `holdout`, at the
`Floor` of the baseline (−0.58):

| Rule | F0.5 | Results shown (mean) |
|---|---|---|
| Baseline (gate on the best `Match` only) | 0.075 | 17.5 |
| Absolute threshold on each `Result` (−0.05) | 0.698 | 0.94 |
| `Margin` 0.3 | 0.787 | 1.39 |
| Cut at the first drop of more than 0.2 | 0.790 | 1.79 |
| Top-1 | 0.777 | 0.87 |

- **The absolute threshold loses** against the `Margin` (interval
  [0.022, 0.162]).
- **The `Margin`, the drop and the top-1 tie.** The `Margin` wins the tie: it is
  simpler than the drop, and it keeps the recall of a `Query` with two or more
  answers, which the top-1 loses (0.77 against 0.68).
- **The image group gives the same order**: `Margin` 0.02 gives 0.903, top-1
  0.900, an absolute threshold of 0.10 gives 0.851.

This agrees with
[What the community does to cut a ranked list](https://github.com/javierponferradalopez/local-semantic-search/issues/95):
no absolute threshold transfers from one corpus to another.

## The values

| Group | `Floor` | `Margin` | F0.5 `holdout` | Right empty `holdout` | Near leak `holdout` | Results shown |
|---|---|---|---|---|---|---|
| Text, baseline | −0.58 | none | 0.075 | 0.54 | 0.91 | 17.5 |
| Text, decided | **−0.3** | **0.2** | 0.773 | 0.69 | 0.17 | 1.07 |
| Images, baseline | 0.05 | none | 0.075 | 0.375 | 1.0 | 22.4 |
| Images, decided | **0.09** | **0.02** | 0.896 | 0.875 | 0.08 | 1.02 |

- **Text.** A `Margin` of 0.1, 0.2 and 0.3 tie on `tuning`, and 0.2 has the best
  recall of the three. A `Floor` of −0.25 loses on `tuning`.
- **Images.** The best cosine of a real `Query` is never below 0.08, so the
  `Floor` rises with almost no cost.
- **Both `Floors` are a tie "at the edge"**: the interval on `tuning` touches 0
  from below. The owner took them on purpose, to send less noise to the agent.

These numbers come from the simulation. The reports of the eval, not this
record, are what a later change of a `Floor` or a `Margin` cites.

## The procedure that tunes the values

F0.5 does not see the absent `Queries`, so a tuning on F0.5 alone pushes the
`Floor` down. Do these steps in this sequence:

1. Set the `Margin` to the value with the best F0.5 on `tuning`, at the current
   `Floor`.
2. Raise the `Floor` to the highest value whose F0.5 on `tuning` still ties with
   the current `Floor` (paired bootstrap).
3. Judge on `holdout`.

This is the same score with a higher value, not a second signal. Each later
front that changes the scores runs the procedure again and writes its numbers in
its report. For example, the context of a `Chunk` changes what the Reranker
reads. The `Floor` and the `Margin` of a group are measured together, on the
model and the dtype of its constant, so a change of either changes both.

## The rule of get_matches

`get_matches` is "More in this file" in the frontend and "read more" for the
agent. The agent can send other words than in its `Search`, so the reason "the
`Resource` already reached the `Floor`" does not hold, and nothing else checks
that a `Chunk` answers the new `Query`. The frontend and the agent have the same
rule.

1. The cosine gives the 20 best `Chunks` of the `Resource`
   (`MATCHES_FIRST_STAGE_LIMIT`).
2. The Reranker scores each pair of `Query` and `Chunk`, and orders the
   `Matches`, best first. When the first stage is empty, the Reranker is not
   called.
3. If the best `Match` is below the text `Floor`, the answer is empty. Else each
   `Match` below the text `Floor` goes, and the answer has the first 10
   (`MATCHES_LIMIT`).

**There is no `Margin`.** The `Margin` was tuned to choose between `Resources`:
in the `Search` it shows 1.07 `Results` on average. In one `Resource` that is
already useful, it often keeps only the `Chunk` that the `Search` already
showed, and "read more" gives nothing more. Here the task is to give each
`Chunk` that answers. The text `Floor` is a value that is already measured, in
the logit of the same model, so it crosses no corpus and no model.

**The rule is not measured.** The eval has no labels on a `Chunk`
([ADR-0041](0041-the-eval-measures-a-search-on-postgres.md)), so the owner
accepted it by reason. `get_matches` and the `Search` read one text `Floor`,
`RERANKER_MODEL.floor`, so a later front that measures it again changes both.
A call costs about 820 ms, the same as a `Search`.

## Why no score and no band

The decided cut was applied to the traces of the reports, `tuning` and
`holdout` together. Then the precision of the shown `Results` was measured by
their score:

| Text score | Results shown | Precision |
|---|---|---|
| [−0.3, 0) | 32 | 0.41 |
| [0, 0.5) | 73 | 0.84 |
| [0.5, 1) | 51 | 0.98 |
| ≥ 1 | 28 | 1.00 |

Images: [0.09, 0.10) gives 0.44, [0.10, 0.12) about 0.82, ≥ 0.12 gives 0.97.

About 20 % of the shown `Results` are wrong, and most of them are in a narrow low
zone above the `Floor`. The model causes this zone: its score measures how near
the subject is, not if the `Result` answers. A band makes the zone visible, but
it removes no noise, it adds a third value for each group to measure again at
each front, and it changes the contract. So the empty group stays the only
signal, and the agent reads the text and judges. A band waits for a better
model.

## What stands of ADR-0021

**The gate runs in the use case.** The adapters give the rows with their score
([ADR-0002](0002-grouping-by-resource-happens-in-sql.md)). `Search` and
`GetMatches` compare the scores with the `Floor`, and `Search` also cuts with the
`Margin`. The `Floor`
and the `Margin` are value objects of the search domain, so they do not move
into SQL. No port knows a `Floor` or a `Margin`: an embedder or a Reranker does
not know what "found nothing" means.

**The numbers live in the constant of their model.** The constant holds the
identity and the dtype of its model, and its `floor` and its `margin`:
`RERANKER_MODEL` beside its adapter in `core/search/infrastructure/transformers/`,
`VISION_MODEL` beside its adapter in `core/shared/infrastructure/transformers/`
([ADR-0007](0007-a-vector-carries-the-model-that-made-it.md)). The wiring gives
each use case its numbers from the same constant, so a number cannot drift from
its model. The Vision model embeds the `Query` verbatim, with no prefix and no
case change, as the probes of ADR-0021 and the eval did.

**A `Chunk` holds a letter or a digit.** This amends the rule *nothing is
dropped* of [ADR-0014](0014-the-cut-belongs-to-no-model.md). A probe added
eight short passages of the kind that a PDF page leaves with nothing to join.
One of them, `---`, became the best `Match` of 18 of 43 queries: each absent
subject, each string that is not language, and five real answers in Spanish.
`passage: ---` is five tokens, so its `Vector` is almost all prefix, and each
`Query` has the prefix too. Without it, no short passage got rank 1: page
numbers and lone headings did not cause a problem. So the factory of the text of
a `Chunk` refuses a text that holds no letter and no digit, `\p{L}` or `\p{N}`,
in the same place where it refuses a text that is empty after `trim()`, and the
cutter skips such a passage. The cost: a passage made only of punctuation or
emoji is not embedded.

## Considered options

- **Keep ADR-0021: a gate on the best `Match` only.** Refused: an F0.5 of 0.075,
  and an agent reads each unrelated `Result`.
- **An absolute threshold on each `Result`.** Refused: it loses against the
  `Margin` on `holdout`.
- **The best score minus the median of the list**, which ADR-0021 and ADR-0040
  refused. It is a gate on the whole list, not a cut below the best `Result`.
  It does not separate the text `Queries`, and the `Margin` was not measured
  against it.
- **A cut at the first large drop of the score.** It ties with the `Margin`, and
  it is less simple.
- **Top-1.** It ties with the `Margin`, and it loses the recall of a `Query`
  with two or more answers.
- **The `Margin` of the `Search` in `get_matches`.** Refused: it removes the
  "more".
- **The gate only in `get_matches`, with no cut on each `Match`.** Refused: it
  lets in the noise that this cut removes.
- **A band of two levels, Strength (`strong` / `weak`), with a Bar for each group
  in the score of its model**, tuned so that the precision of `strong` is at
  least 0.95 on `tuning`. Kept as the proposal when the question comes back,
  after a change of the model, if the share of `Results` in the low zone stays
  high.
- **The raw score in the response.** Refused: a logit or a cosine has no meaning
  for the agent, and it changes with each model.

## Consequences

- **A `Search` shows about one `Result` in each group.** A `Query` with two or
  more answers whose scores are near shows all of them.
- **The low zone above the `Floor` stays.** Text `Results` in [−0.3, 0) have a
  precision of 0.41. That is the known cost, and the next fronts (the context of
  a `Chunk`, a hybrid first stage) attack it.
- **`get_matches` costs about 820 ms for each call.** The owner accepted it.
- **`TEXT_RESULTS_LIMIT` (20) and the limit of the Pictures (24) do not change.**
  They set the width of the first stage, not what is shown.
- **The contract does not change.** An empty list from `get_matches` was
  already a valid answer, and "More in this file" says "Nothing more in this
  file for this search." for it.
- **A `Query` such as "hola" can still pass.** A second signal that says
  "nothing" is out of the scope of this cut.
