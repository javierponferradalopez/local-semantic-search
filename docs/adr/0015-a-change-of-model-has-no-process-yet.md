# A Vector is a row per model, and a change of model has no process yet

**A `Chunk` and a `Picture` hold no `Vector`. Each has one `Vector` per model
that embedded it, in a table keyed by the content and the model, one table per
width. The search reads the `Vector` of the model in use and nothing else.**
What happens to the stored content the day the model changes is **not decided**:
the data has the shape for it, and the process is written that day.

Decided in
[A cut that no model owns](https://github.com/javierponferradalopez/local-semantic-search/issues/25).

## Why the table that #16 refused is now built

[How content is cut into chunks](https://github.com/javierponferradalopez/local-semantic-search/issues/16)
refused a `Vector` apart from its `Chunk` on one premise: *a `Chunk` is not
model-independent*, because its cut was measured with the tokenizer of the
model. [ADR-0014](0014-the-cut-belongs-to-no-model.md) removes that premise. A
`Chunk` is now the same text under every model, so the same `Chunk` can carry
one `Vector` from each model, and re-embedding the stored text without opening
the `File` becomes possible.

The other arguments #16 gave against tables stand and are respected: there is
still **no table of models with a runtime `status`**, because a row cannot build
an adapter or download weights; and there is still no `embedding_status`,
because the `Ingest state` of the `Resource` is the one answer to *is this
file ready*.

## The shape

- A `Chunk` row holds the text, the page, the position and the cut version.
  Its uniqueness inside its `Resource` is the cut version and the position.
- A `Picture` row holds what a `Picture` holds today, and no `Vector`. The
  `Picture` follows the same shape as the `Chunk`, so that a change of the
  vision model needs no re-reading of the image either, and the schema tells one
  story.
- A `Vector` row is keyed by the content it describes and the identity of the
  model, and its column declares its width, `vector(384)` today. **A model of
  another width arrives as another table**, as ADR-0007 already said. Version one
  has one table per kind of content, and the model in use decides which table
  the search reads.
- **The search filters by the model in use from the first day**, when the
  predicate removes nothing. This is the one rule of ADR-0007 that this record
  keeps as it was.

## What is deliberately not decided

The owner refused every piece of machinery that anticipates a change of model,
by name:

- **No sweep at start-up.** ADR-0007 made a `Resource` whose `Vector` are from
  another model become `Failed` at start-up. That step is removed. The start-up
  is clean: it loads the models and listens.
- **No re-embed path in Retry.** Retry does what
  [What happens when the user adds a file](https://github.com/javierponferradalopez/local-semantic-search/issues/10)
  says, and knows nothing about models.
- **No script that walks the stored `Chunk`** to check whether they fit a new
  model, and no check at start-up that does the same. A corpus of millions of
  `Chunk` cannot be tokenized to answer a question the adapter's promise
  ([ADR-0014](0014-the-cut-belongs-to-no-model.md)) already answers once, in a
  test.
- **No re-cut script written in advance.** [ADR-0010](0010-a-chunk-carries-the-rule-that-cut-it.md)
  described a script that re-cuts the corpus with the search up, and a mark on
  every `Resource` at start-up. The mark goes, for the same reason as the sweep.
  The version stamp stays, so that the day the rule changes the script can tell
  one generation from the other.

The stated cost, accepted: **after a change of model, and until a migration is
written, a `Resource` that says `Ready` has no `Vector` the search reads, and
it is never found.** This is the silent state the map refused in ADR-0005 and
ADR-0007. It is accepted here because it cannot occur in version one, where the
model never changes, and because the machinery that prevents it is the beginning
of the migration process the owner has chosen to design when it is needed.

## Consequences

- **`Ready` means: stored with the `Vector` of the model in use.** The glossary
  says so.
- **The `Vector` of a model that is not in use is never read and never
  deleted** by version one. It sits in its table until a migration decides.
- **Two generations of `Vector` fit in the schema with no change**, as ADR-0007
  already noted, and now two generations of `Chunk` do as well. What is missing
  is the process, and the process alone.
- **The section *What a change of model makes stale* of ADR-0007 is replaced**
  by this record and by ADR-0014: stale is the `Vector`, and only the `Vector`.
