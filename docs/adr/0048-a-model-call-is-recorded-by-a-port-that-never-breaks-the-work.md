---
kind: decision
status: accepted
---

# A Model call is recorded by a port that never breaks the work

**Each model adapter calls the port `ModelCallRecorder` one time for each Model
call, also when the call throws, with its Usage. The port `OperationRunner`
opens the trace at the two edges: an API middleware, and the bus around each
handler. The trace is lazy: it starts at the first Model call, so an operation
with no Model call sends nothing. A failure of the record never breaks a Search
or an Ingest.** Langfuse Cloud is one adapter of each port. A silent adapter
with no effect takes its place when the keys of Langfuse are not set.

Decided in
[The shape and the place of the cost port](https://github.com/javierponferradalopez/local-semantic-search/issues/131),
from the facts of
[What the Langfuse SDK gives to count the cost of a local model](https://github.com/javierponferradalopez/local-semantic-search/issues/127)
and
[What we measure in each model call, and its name](https://github.com/javierponferradalopez/local-semantic-search/issues/129).

## Why the adapter records

Only the adapter knows the Usage: its tokenizer counts the tokens that the model
reads. A decorator around the port sees the arguments and the Vectors, not the
tokens. So the three `Transformers…` adapters get the recorder in `load()`.

## Why at the edges, and lazy

The use cases do not change: an API middleware opens the operation of each
request, and the bus opens one for each handler, from an empty context, so an
Ingest has its own trace. The polling of `GET /resources`
([ADR-0039](0039-the-frontend-polls-the-ingest-state-while-a-resource-is-ingesting.md))
calls no model; a lazy trace keeps it out of Langfuse.

## Why it never breaks the work

The Cost is information about the work, not part of it. `record()` is
synchronous and catches each error. When the trace cannot open, the work runs
with no trace. The SDK exports in the background, and it drops a batch when
Langfuse does not answer. `main.ts` calls `shutdown()` on `SIGTERM` and
`SIGINT`, so the last spans leave before the process stops.

## Considered options

- **A decorator for each model port.** Refused: it cannot count the tokens.
- **The use cases open the trace.** Refused: each use case changes, and a new
  one can forget it.
- **The Langfuse SDK called from the adapters, with no port.** Refused: the
  domain gets a dependency on a vendor, and the eval and the tests call
  Langfuse.

## Consequences

- **The keys of Langfuse are optional.** With none, the silent adapters run.
  With some but not all, the start fails.
- **A Picture goes to Langfuse as a WebP of 320 px**, not the full `Pixels`, so
  the queue of spans stays small.
