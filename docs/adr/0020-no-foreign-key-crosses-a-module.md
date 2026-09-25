---
kind: decision
status: accepted
---

# No foreign key crosses a module, and a deletion is a business operation

The tables of `ingestion/` reference a `Resource` by its `id` as a plain value.
No foreign key points from `chunks`, `pictures` or the `Vector` tables to the
tables of `resources/`, and no `ON DELETE CASCADE` exists. When the user deletes
a Resource, `resources` deletes its row and its `File` and raises `…Deleted`;
`ingestion` handles the event and deletes its `Chunk`, `Picture`, `Vector` and
the thumbnail it wrote.

Decided in
[What the ingest stage looks like in code](https://github.com/javierponferradalopez/local-semantic-search/issues/22).
Amends [ADR-0001](0001-postgres-with-pgvector-as-the-single-store.md) and
[ADR-0003](0003-two-contexts-share-one-glossary.md), which said that "the
foreign key from #8 keeps the lifecycle". The event keeps it now.

## Why

The owner's rule: a cascade is a business operation, and a relation declared in
the database with a cascade couples the domain to the infrastructure. A foreign
key without a cascade was examined and refused: the parent row is deleted before
the event is raised, so the children would still block it. The alternatives were
a synchronous call from `resources` into `ingestion`, or a two-phase deletion
with an intermediate state, which #10 §8 refused as a soft delete.

## Consequences

- A few milliseconds of orphan rows exist between the two deletions, and orphans
  stay if the process stops between them. The search never shows them: it reads
  the name and the URL with an `INNER JOIN` to the table of the Resource, and an
  orphan has no row to join. The future cron of
  [ADR-0018](0018-the-ingest-runs-after-the-response.md) collects them.
- Each module owns its keys in the `FileStore`. The `File` lives under a prefix
  of `resources`, the thumbnail under a prefix of `ingestion`.
- The `Citation` is still a `JOIN`. A `JOIN` needs no declared key.
- `ingestion` deletes its own output before it writes, on `…Created` as on
  `…Retried`, so a Retry needs no cleanup of its own.
