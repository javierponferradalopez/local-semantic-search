# A Chunk knows its page and nothing else

The glossary held a `Locator` — *the place, inside its Resource, where a Chunk or
a Picture was*, with a shape that changed per `Content type`. **The word is
removed. A `Chunk` carries a page, and the page is empty when its `Content type`
has no pages.**

Decided in
[How content is cut into chunks](https://github.com/javierponferradalopez/local-semantic-search/issues/16).

## Why the word went

The `Locator` was invented in
[The words this project uses](https://github.com/javierponferradalopez/local-semantic-search/issues/9),
when it had three shapes to cover: a page and a box in a PDF, an offset in a text
file, and a place inside a `Resource` for a `Picture`. Two of the three have
since gone.

- **A `Picture` has no place.**
  [ADR-0005](0005-a-pdf-yields-text-and-nothing-else.md) made a PDF yield text
  and nothing else, so a `Picture` only ever comes from an image file and its
  place is always the whole `File`. A value that never varies locates nothing.
- **The offset in a text file was dropped.** It shows nothing in version one —
  [What the user gets back from a search](https://github.com/javierponferradalopez/local-semantic-search/issues/11)
  gives a page only to a type that has pages, and a browser has no anchor for a
  character position. For a text file the text of the `Chunk` **is** the whole
  citation.
- **The box in a PDF was dropped.** It was stored and never painted, for a
  viewer that version one does not build.

What remains is one page, and it can be empty. That is a column, not a concept.

## What this costs

**The day a viewer arrives, the box returns as a new column and a change of
signature in several places**, not as a value slotting into a shape that was
waiting for it. That is the price of leaving no empty shapes, which this map has
paid before — most recently when
[Which text embedder the search uses](https://github.com/javierponferradalopez/local-semantic-search/issues/24)
found `Picture.locator` already empty and refused to keep it as a placeholder.

**A box is recoverable, and cheaply.** The `File` of a `Resource` is kept for
ever by
[What happens when the user adds a file](https://github.com/javierponferradalopez/local-semantic-search/issues/10),
and #16 made a full re-ingest a routine script. The original argument for
storing the box — *computing it later means re-reading every file* — was true
when
[What the user gets back from a search](https://github.com/javierponferradalopez/local-semantic-search/issues/11)
made it, and is no longer the obstacle it was.

## Consequences

- **The `Ingest` reads a PDF at level 1.** `unpdf.extractText()` returns one
  string per page. `extractTextItems()` was
  [the single strongest argument for `unpdf`](https://github.com/javierponferradalopez/local-semantic-search/issues/4)
  because it gave the citation shape; with no box, no PDF paragraph heuristic and
  no column repair, nothing in the `Ingest` needs an item, a coordinate or an
  operator list. `unpdf` still stands on its other grounds: per-page text with no
  injected markers, 2.5 MB, no runtime dependencies, MIT.
- **Four glossary entries change.** `Locator` is deleted. `Chunk` carries a page.
  `Picture` loses its place. `Match` carries its score alone. `Citation` is made
  from a `Resource` and, where there is one, a page.
- **Opening a text result lands at the top of the file.** A PDF jumps with
  `#page=N`; a text file has nothing to jump to, so a passage found in a long
  file must be found again by eye. This is a gap in #11, which is closed, and it
  is recorded on the map rather than repaired here.
