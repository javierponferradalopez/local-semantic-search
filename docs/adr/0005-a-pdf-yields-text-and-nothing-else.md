# A PDF yields text and nothing else

A PDF can hold artwork, and its pages can be rasterised. The glossary defines a
`Picture` by its origin — *an image that comes from a Resource* — so a diagram on
page 4 fits the word. **The Ingest does not make it. A PDF produces `Chunk` and
never a `Picture`, and a PDF with no text layer is a `Failed` `Resource`.**

Decided in
[Whether OCR rescues a scanned PDF](https://github.com/javierponferradalopez/local-semantic-search/issues/18).

## Why this needs a record

Three earlier tickets point the other way, so a reader will look for the code
that makes a `Picture` from a PDF and will not find it.

- [How text and images share one search](https://github.com/javierponferradalopez/local-semantic-search/issues/6)
  named the gap: *"Most diagrams live inside PDFs, not as loose image files"*,
  and sent the question to the next ticket.
- [What happens when the user adds a file](https://github.com/javierponferradalopez/local-semantic-search/issues/10)
  received it — *"this ticket has to decide what a PDF actually yields"* — and
  never answered it, in its resolution or in its open questions.
- [The words this project uses](https://github.com/javierponferradalopez/local-semantic-search/issues/9)
  named `Chunk` and `Picture` by their origin, so that *"a PDF whose artwork
  becomes an image row"* would need no new word.

So the decision was open, and it was open by accident.

## What is refused, and why

**Embedded artwork.** The image row has no place to cite.
[What the user gets back from a search](https://github.com/javierponferradalopez/local-semantic-search/issues/11)
decided that an image row is a thumbnail and a file name, because *"a `Picture`
is its whole `Resource`"*. A diagram from page 4 does not fit that row. A PDF
also repeats logos, rules and background artwork on every page, and the filter
that separates a diagram from a decoration is a guess with no ground truth.

**Rasterised pages.** The same PDF would then rank in both groups, with two
scores from two spaces. That is the comparison that
[How text and images share one search](https://github.com/javierponferradalopez/local-semantic-search/issues/6)
refused to invent, coming back through a different door.

**OCR.** It is a third model, after two. The model must be pinned to a local
folder, or `tesseract.js` gets it from a CDN and breaks the local rule in
silence. It gives pixel coordinates from the top left, while PDF.js gives points
from the bottom left — two shapes of `Locator` for **one** `Content type`, which
the glossary does not permit. It costs about one second for each real page,
against a request that waits with no progress bar. And a scanned PDF **does not
declare its language**: `tesseract.js` loads one data file for each language,
and to know the language you must first read the page.

## The cost, in full

- **The query that motivates the image feature is not answered for a diagram
  inside a PDF.** *"A diagram of a pipeline"* finds loose image files only. The
  caption and the text around the diagram are still `Chunk`, so the PDF is found
  by its words — but not by what the picture shows.
- **A scanned PDF is `Failed`.** This is the honest result, not a limitation to
  hide. §7 of
  [What happens when the user adds a file](https://github.com/javierponferradalopez/local-semantic-search/issues/10)
  made a `Ready` `Resource` with no content the thing to avoid.

## Consequences

- **The rule is zero, for the whole file.** A PDF is `Failed` only when it gives
  no text at all. A mixed PDF is `Ready` with the pages that had text, and its
  scanned pages leave no trace. A limit for each page, or a share of the pages,
  was refused: a blank page and a full-page photograph are legitimate, and a
  share is a number that nobody can defend.
- **The Ingest does not need `getOperatorList()`.**
  [Getting text out of a PDF in Node](https://github.com/javierponferradalopez/local-semantic-search/issues/4)
  proposed it to find which page to rasterise. No page is rasterised, and an
  empty PDF and a scanned PDF end the same way, so the second signal buys
  nothing. `unpdf` alone reads a PDF.
- **Two models stay two.**
  [How the two models load and stay warm](https://github.com/javierponferradalopez/local-semantic-search/issues/15)
  is written for two, and it stays correct.
- **The door stays open.** A `Failed` `Resource` keeps its `File` on disk and
  offers **Retry**. The day OCR enters, it enters as a second action on a row
  that already exists. Two questions come with it, and neither is answered here:
  whether the `Locator` carries its unit or OCR converts, and which languages
  are loaded.
