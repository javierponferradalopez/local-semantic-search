# Two contexts share one glossary, and Search never loads a Resource

`backend/src/core` is split into `ingestion/` and `search/`, the two demoable
capabilities of the product. The two contexts **share one glossary**, which
`CONTEXT.md` holds, and they share one database. The usual test for a bounded
context is language: a boundary exists when a word means different things on
each side. That test says there is one context here, because `Resource`,
`Chunk`, `Picture` and `Locator` mean exactly the same thing in both halves.

The split is kept because the business has two acts, and because the map's
specs are cut by capability and not by layer. The code and the plan then use
the same names.

Decided in
[How the repository is laid out](https://github.com/javierponferradalopez/local-semantic-search/issues/12).

## What holds the boundary

**`search/` never imports `Resource`.** The aggregate lives in `ingestion/`,
which writes it and owns its lifecycle.
[The words this project uses](https://github.com/javierponferradalopez/local-semantic-search/issues/9)
made `Result` and `Match` read models and said that a query port is not a
repository, so `search/` asks for rows and returns them. It has no reason to
load the aggregate. If it ever needs one, the boundary was wrong.

A shared kernel holds what both halves truly use: `Vector`, and the
`TextEmbedder` and `ImageEmbedder` ports. Ingestion embeds Chunks and Pictures,
Search embeds the Query, and the model is the same one.

**Amended by
[How the two models load and stay warm](https://github.com/javierponferradalopez/local-semantic-search/issues/15).**
`core/shared/` is a module with the same folders as a context, and it holds the
**adapters** of those two ports as well, in its `infrastructure/`. Any other
home makes a false dependency: an adapter inside `ingestion/` would make
`search/` import from `ingestion/` to wire itself, and an adapter inside
`src/api/` would make the HTTP edge the owner of the models, which the future
agent has no edge to ask. `core/shared/use-cases/` does not exist. A use case
that appears there is a sign that something is misplaced, because a use case is
a capability and the capabilities are two.

## Consequences

- **`Locator` stays in `ingestion/`.** The read model of a search carries the
  page and the box as plain values, because they go on the wire.
- **The glossary's "Content" section has no folder.** Its words are spread:
  most into `ingestion/`, `Vector` into the shared kernel. A third context for
  content would be a data layer with a business name.
- **One database serves both.** The foreign key from
  [ADR-0001](./0001-postgres-with-pgvector-as-the-single-store.md) crosses the
  boundary, which a strict reading of bounded contexts does not allow. It is
  accepted: one store was the decision, and the lifecycle of a Chunk belongs to
  its Resource.
- **A word that changes meaning on one side breaks the arrangement.** The day
  `Resource` means something else in `search/`, this stops being a naming
  choice and becomes a real boundary, with its own glossary.
