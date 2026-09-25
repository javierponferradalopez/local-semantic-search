---
kind: decision
status: accepted
---

# The ingest runs after the response, and nothing recovers a stopped one

The upload request lands the `File`, writes the row in `Ingesting`, returns
`201` with that row and ends. The `Ingest` runs afterwards in the same process,
driven by a domain event
([ADR-0017](0017-three-contexts-speak-by-domain-events.md)). Nothing persists
the work: a process that stops leaves the row in `Ingesting`, and no sweep at
start-up repairs it. A cron that cures those rows is a future effort.

Decided in
[What the ingest stage looks like in code](https://github.com/javierponferradalopez/local-semantic-search/issues/22).
Reopens §3 of
[What happens when the user adds a file](https://github.com/javierponferradalopez/local-semantic-search/issues/10),
which made the request wait; removes the sweep of its §4; and removes the 422 row
of [ADR-0013](0013-an-error-is-a-list-of-codes.md), because a failure of the
`Ingest` never reaches the request that started it.

## Why the request no longer waits

The owner's objection, recorded in
[How content is cut into chunks](https://github.com/javierponferradalopez/local-semantic-search/issues/16):
the synchronous ingest of #10 was the one lock-in of the design. This lifts it.
The modules are independent and the upload returns at once. What was not built
stays not built: no job runner, no persistent queue, no progress, no
cancellation.

## What the user sees

The row appears at once in `Ingesting`, as #10 §9 drew it, and stays so until the
user reloads the page. No polling and no server-sent events. The `Reason` of a
`Failed` row travels only in the row, as a bare code, which
[The contract between the browser and the API](https://github.com/javierponferradalopez/local-semantic-search/issues/20)
already accepted.

## Why no sweep, and what it costs

The `Ingest` ends in two writes of two modules: `ingestion` commits its rows and
raises `…Ingested`; `resources` receives it and writes `Ready`. A process that
stops between the two, or during the pipeline, leaves a row in `Ingesting` for
ever. The owner chose to leave it. The state is visible, a cron will cure it, and
a sweep at start-up would be that cron written in the wrong place.

Two rules follow. **Delete is allowed in every state**, so a stuck row has an
exit; #10 §8 forbade it while `Ingesting` because of the foreign key, which
[ADR-0020](0020-no-foreign-key-crosses-a-module.md) removed. And **the search
filters by `Ready`** in the `JOIN` it already makes, so content under a row that
is not `Ready` is never found. This amends the query of
[What the user gets back from a search](https://github.com/javierponferradalopez/local-semantic-search/issues/11).

## Consequences

- [ADR-0008](0008-the-embedders-load-before-the-server-listens.md) stands on its
  first and third reasons. Its second, that a first upload which also loads a
  model looks broken, no longer applies.
- The e2e of
  [The testing strategy](https://github.com/javierponferradalopez/local-semantic-search/issues/21)
  that compared the two outputs of one failure has one output to check: the row,
  after the event has run.
- `Ingesting` in the glossary is "whose Ingest has not ended", because it can be a
  row nobody works on.
- The embedder ports stay singular. The 9 % that a batch of 32 buys is spent on
  work that no longer blocks anyone.
