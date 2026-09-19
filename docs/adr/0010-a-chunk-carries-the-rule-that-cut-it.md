# A Chunk carries the rule that cut it, and an old cut keeps serving

[ADR-0007](0007-a-vector-carries-the-model-that-made-it.md) made a `Vector` carry
its model, and made a `Resource` whose `Vector` are from another model become
`Failed` at start-up. **A change of the cut rule alone does not touch the model,
so that guard never fires.** A `Chunk` therefore carries the version of the rule
that cut it — and, unlike a stale model, a stale cut leaves the `Resource`
`Ready` and searchable.

Decided in
[How content is cut into chunks](https://github.com/javierponferradalopez/local-semantic-search/issues/16).

## The gap this closes

ADR-0007 covered one direction only. A change of model changes where the `Chunk`
are cut, because the ceiling is measured with the tokenizer of the model, so the
stamp on the `Vector` sees it. The reverse is silent: change the target size from
300 to 450, or write the column repair that #16 declined, and the model is the
same, the stamp is the same, and every old `Resource` keeps saying `Ready` with
passages cut by a rule that no longer exists.

That is not a distant case. The target size of a `Chunk` is a judgement with
nothing measured behind it, so **it is the most likely single change in the life
of this product.**

## Why a version and not the number

The first choice was to stamp the target size itself, which moves on its own and
asks nobody to remember anything. It was reversed when the same session declined
**two** repairs by name — a paragraph heuristic for a PDF, and the repair of
content-stream order — and each of them changes where the cut falls while the
number stays at 300.

The cost stands and is accepted: **a version must be raised by hand, and a
version that is forgotten claims that old and new are the same when they are
not.** It sits in the same constant as the model identity and the target size, so
the edit that changes the rule and the edit that raises the version are next to
each other.

## Why an old cut keeps serving, and an old model does not

The difference is not caution, it is what the stamp means.

- **Two `Vector` from two models are incomparable.** The search must filter by the
  model in use, so a `Resource` not yet re-ingested cannot appear in any result.
  `Failed` says so on screen with an action beside it. ADR-0007 stands.
- **Two `Chunk` from two cut rules are comparable.** They live in one space and
  the search does not filter by the cut version. What differs is the evenness of
  the quality, not the meaning of the number.

So a stale cut becomes **a mark on a `Resource` that is still `Ready` and still
found**, and the owner re-ingests at their own pace. Forcing `Failed` here would
take a silent unevenness and turn it into a self-inflicted total outage at
start-up, since a change of the rule makes the whole corpus stale at once and
[What happens when the user adds a file](https://github.com/javierponferradalopez/local-semantic-search/issues/10)
refused every bulk operation.

## What this buys, and it was the point

A re-cut of the whole corpus runs **with no window in which the search is
blind**:

1. The rule changes in the constant and the version is raised.
2. At start-up every `Resource` is marked stale. All of them keep serving their
   old `Chunk`.
3. A script walks the stored `File` and calls the `Ingest` use case for each one,
   writing the new `Chunk` beside the old and deleting the old for that
   `Resource` when it finishes.
4. Both generations are searchable while it runs, and the `DISTINCT ON` of
   [What the user gets back from a search](https://github.com/javierponferradalopez/local-semantic-search/issues/11)
   keeps one row per `Resource`, so no duplicate reaches the screen.

The script is **resumable and idempotent with nothing written for it**: killed
half way and started again, it skips what already carries the current version.

None of this is a job runner. There is no queue, no progress and no moment of
switching, so #10 is untouched. What version one does not have is the
**automation** — and that, not the shape of the data, is what a deployment would
have to add.

## Consequences

- **The search filters by model and not by cut version.** The first is a refusal
  the type can make; the second is a fact about how a passage was made.
- **Uniqueness of a `Chunk` inside its `Resource` now includes two terms**, the
  model and the cut version, which is what lets two generations sit in one table.
- **A change of algorithm with no change of version passes unseen.** That hole is
  the accepted price of a stamp a person raises.
- **A rebuild of the store is not needed to adopt this later.** The column is one
  `ALTER TABLE ADD COLUMN` and one `UPDATE`, because until the day it is added
  only one rule has ever run.
