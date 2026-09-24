# Three contexts, and Resources and Ingestion speak by domain events

> **Amended by [ADR-0023](0023-modules-depend-inward-and-write-only-their-own.md).**
> `resources/`, `ingestion/` and `search/` are modules of one bounded context,
> not contexts. The one import allowed between `resources` and `ingestion` is no
> longer `domain/events/` alone: a module can import the domain of another, and
> every dependency points inward. A module still writes only its own aggregates,
> and it asks another module for a change by an event. The events, the bus and
> the cycle stand.
>
> **Amended by [ADR-0024](0024-the-bus-is-emittery.md).** The bus is emittery,
> not written by hand. By default the publisher does not wait for the handlers,
> but it can wait when it needs to. A handler is application code and does the
> work itself.

`backend/src/core` holds three contexts. `resources/` owns the aggregates, the
landing, the list, the deletion and Retry. `ingestion/` owns the pipeline and the
tables of `Chunk`, `Picture` and `Vector`. `search/` is unchanged. `resources`
and `ingestion` communicate by domain events only, and the one import allowed
between them, in both directions, is `domain/events/`.

Decided in
[What the ingest stage looks like in code](https://github.com/javierponferradalopez/local-semantic-search/issues/22).
Amends [ADR-0003](0003-two-contexts-share-one-glossary.md), which fixed two
contexts and said that a third context for the content would be "a data layer
with a business name".

## Why a third context

`resources` is not a data layer. It has use cases of its own: create, list,
delete, retry. What it does not know is how a file becomes searchable. It never imports
`Chunk`, `Picture` or `Vector`. `ingestion` in turn never imports the aggregate.
An event gives it the `id`, the `Content type` and the key of the `File`, and it
answers with an event. The boundary is the one ADR-0003 drew for `search/`: a
context asks for what it needs and loads no aggregate of another.

## The events, and where they live

Each event lives in the module that raises it, and its name says what happened.
`resources` raises `TextResourceCreated`, `ImageResourceCreated`,
`TextResourceRetried`, `ImageResourceRetried`, `TextResourceDeleted` and
`ImageResourceDeleted`. `ingestion` raises `TextResourceIngested`,
`ImageResourceIngested`, `TextResourceIngestFailed` and
`ImageResourceIngestFailed`, the last two with a `Reason`. `Reason` is declared
in `ingestion/domain/`, because it travels in an event of `ingestion`.

This makes a cycle: each module imports the events of the other. The cycle is
accepted and bounded to `domain/events/`. A shared kernel for the events was
refused, so that an event stays where the fact occurred. A one-way dependency,
where `ingestion` calls a use case of `resources` to record the outcome, was
refused because one module would command the other.

## The bus

In process, written by hand, with four promises. It publishes after the
transaction of the publisher commits, so no handler reads a row that does not
exist yet. The publisher does not wait for the handlers. Every handler catches
its own errors, and the handlers of `ingestion` turn any `throw` into an
`…IngestFailed`. Nothing persists, so a process that stops loses the work in
flight ([ADR-0018](0018-the-ingest-runs-after-the-response.md)).

## Consequences

- The `Ingest state` lives on the aggregates of `resources`, and only `resources`
  writes it, when it receives the events of `ingestion`.
- The handlers of `resources` for `…Ingested` and `…IngestFailed` ignore an `id`
  that no longer exists, because Delete is allowed in every state (ADR-0018).
- Retry is a use case of `resources`. It admits only `Failed`, sets `Ingesting`
  and raises `…Retried`, which `ingestion` handles as it handles `…Created`.
- The handlers of `ingestion` are thin subscribers in `infrastructure/` that call
  a use case: `IngestTextResource` or `IngestImageResource`. The use cases are
  tested in unit with their ports mocked and no bus.
- `core/shared/` keeps `Vector`, the two embedder ports and their adapters, as
  ADR-0003 amended says. No event lives there.
