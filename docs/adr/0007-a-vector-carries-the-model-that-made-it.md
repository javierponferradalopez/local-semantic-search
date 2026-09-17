# A Vector carries the model that made it

A `Vector` means nothing on its own. It means something only against the model
that calculated it. **Every stored `Vector` carries the identity of that model —
its repository, its dtype and its width — and the search only reads the `Vector`
of the model in use.**

Decided in
[Which text embedder the search uses](https://github.com/javierponferradalopez/local-semantic-search/issues/24).

## Why this needs a record

Today one text model and one vision model exist, and the identity is the same
value in every row. A reader will see a column that never varies and will want
to delete it. The column exists for the day it does vary, and that day fails
**in silence** without it: half the store lives in one space and half in
another, and the search returns nonsense without one error.

This record is separate from
[ADR-0006](0006-the-text-model-is-multilingual-e5-small.md) on purpose. The day
the model changes, ADR-0006 is superseded. This rule is what makes that day
safe, so it must survive it.

## Why the Vector, and not the Resource

A `Resource` is not conditioned by the model. Its name, its `Checksum`, its
`Content type` and its `File` are the same under any model. The record of a
`Resource` holds no vector at all, by the decision of
[Which store holds the vectors](https://github.com/javierponferradalopez/local-semantic-search/issues/8).
A mark on the `Resource` would state a fact about a row that does not hold the
thing the fact describes.

The `Vector` is what the model produces, and the glossary already says so — *the
list of numbers that a model calculates*. It named the model and did not keep
it. This closes that gap.

It also makes a rule checkable that was only a convention.
[How text and images share one search](https://github.com/javierponferradalopez/local-semantic-search/issues/6)
forbids any comparison between the text space and the vision space. Until now
that was discipline. Now a comparison of two `Vector` from two models is an
error that the type can refuse.

## What a change of model makes stale

Not only the `Vector`. **The `Chunk` as well, its cuts included** — the ceiling
of
[How content is cut into chunks](https://github.com/javierponferradalopez/local-semantic-search/issues/16)
is measured with the tokenizer of the model, and another model counts other
tokens. So the repair is a complete `Ingest`, never a re-embedding of the same
passages.

## Consequences

- **No key identifies a `Chunk` inside its `Resource` alone.** Every uniqueness
  includes the model. A constraint over `(resource, position)` is the one thing
  that would force a change to a table that holds data.
- **The search filters by the model in use from the first day**, when only one
  model exists and the predicate removes nothing. A query written as *all the
  chunks* is the line that breaks the day a second generation exists.
- **The vector column keeps its declared width**, `vector(384)`. A column with
  no width accepts a 768 beside a 384, and Postgres says nothing until a
  distance operation fails far from the cause. A future model of another width
  arrives as a **second table**, which adds rows and rewrites none. The store
  already holds two widths in two places, for a `Chunk` and for a `Picture`.
- **At start-up, a `Resource` whose `Vector` are not from the model in use
  becomes `Failed`.** This invents no mechanism:
  [What happens when the user adds a file](https://github.com/javierponferradalopez/local-semantic-search/issues/10)
  already sweeps `Ingesting` rows at start-up, already keeps the `File` of a
  `Failed` `Resource`, and already offers **Retry**, which deletes the partial
  output first.
- **The window of degradation is visible, not hidden.** A `Resource` that is not
  yet ingested again cannot appear in a search under any design. `Failed` says
  so on the screen, with an action beside it. A silent filter would leave a row
  that says `Ready` and never appears — the lying success that
  [ADR-0005](0005-a-pdf-yields-text-and-nothing-else.md) refused.
- **The `Floor` is not covered by this guard.** It is configuration, not stored
  data, so a model that changes without its `Floor` breaks the empty answer in
  silence. The `Floor` and the identity of the model must travel together in one
  piece of configuration. This is a constraint for
  [Where the two Floors are set](https://github.com/javierponferradalopez/local-semantic-search/issues/23).
- **Two generations are expressible with no change to the schema.** A `Resource`
  can hold two sets of `Chunk`, each with a `Vector` that names its model, and
  the search reads one of them. The data has the shape. What version one does
  not build is the process that fills the new set while the old one still
  serves — that needs background work, a queue and progress, which #10 refused.
