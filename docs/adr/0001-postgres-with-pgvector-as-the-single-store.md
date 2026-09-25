---
kind: decision
status: accepted
---

# Postgres with pgvector as the single store

> **Amended by [ADR-0020](0020-no-foreign-key-crosses-a-module.md).** No foreign
> key crosses a module. The lifecycle of a `Chunk` and a `Picture` is kept by the
> `…Deleted` event, not by the database. The `JOIN` for the citation stands. And
> the file-level record is two tables, a Text Resource and an Image Resource
> ([ADR-0019](0019-two-aggregates-with-the-same-fields.md)).

A local semantic search product needs a registry of the files it has ingested, the
chunks cut from them, the vectors, and the citation metadata. The owner's original
notes named Qdrant. We chose **Postgres with pgvector** instead, as the **only**
store: one container, one adapter, no second database beside it.

Qdrant was rejected on **shape**, not on weight or licence. The ingest screen lists
the Resources the user has created, so a file-level record is a first-class
concept. In Qdrant that record has no natural home — it becomes a collection without vectors,
or a walk over the payload. A vector store is a derived index; the source of truth
must not live inside it. MongoDB Atlas Local models the record well but costs ~612 MB
against ~155 MB, is SSPL rather than a permissive licence, runs a second `mongot`
process, creates indexes asynchronously, and loses the index if `/data/mongot` is
not mounted. All three candidates were measured in
[Running a vector store on a laptop](https://github.com/javierponferradalopez/local-semantic-search/issues/2);
server-side fusion, Qdrant's distinctive advantage, was made irrelevant by
[How text and images share one search](https://github.com/javierponferradalopez/local-semantic-search/issues/6),
which fuses nothing.

Decided in
[Which store holds the vectors](https://github.com/javierponferradalopez/local-semantic-search/issues/8).

## Consequences

- **The store holds two kinds of record.** A resource record — content type, name,
  path, checksum — carries **no vector** and is the source of truth. Chunk records
  carry the vector, the chunk text, and the citation position, and reference their
  resource. Deleting a resource cascades to its chunks through a foreign key.
- **The vector tables are rebuildable.** Drop them, re-ingest from the resource
  registry and the files on disk, and the system returns to the same state. This is
  the migration path when the embedding model changes and every vector must be
  recomputed.
- **Original files live in a folder the application owns**, beside the compose file.
  A stored path that resolves outside that folder is an error. The cost is duplicated
  disk, and an edit to the user's own copy is invisible to us.
- **The schema is declared in TypeScript with Drizzle.** Drizzle covers pgvector
  fully — `vector`/`halfvec`/`sparsevec`/`bit`, all six distance helpers, HNSW and
  IVFFlat operator classes — but it **cannot** declare `CREATE EXTENSION vector`.
  That line is hand-written into the first migration.
- **Drizzle stays in infrastructure.** Its inferred row types must not cross into the
  domain. No tool enforces this.
- **No HNSW index at first.** Exact search has perfect recall and no parameters to
  tune blind. When an index is added, the query's `ORDER BY` must be the bare distance
  expression ascending with a `LIMIT` — Drizzle's own guide wraps it as
  `1 - cosineDistance(...)` descending, which the planner does not match to the index.
