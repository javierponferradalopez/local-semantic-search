# The cut follows the structure the format gives

A `Chunk` is cut by accumulating whole passages up to a target of **300 tokens**,
measured with the tokenizer of the text model, against a wall of **512 minus the
special tokens minus the prefix**. The passage is a paragraph in a text file or a
Markdown file, and a sentence in a PDF. **There is no overlap.**

Decided in
[How content is cut into chunks](https://github.com/javierponferradalopez/local-semantic-search/issues/16).

## Two numbers, not one

- **The wall** is what kills the process. Token 513 does not degrade and does not
  truncate: it stops the graph, as
  [Which text embedding model](https://github.com/javierponferradalopez/local-semantic-search/issues/14)
  measured on every 512-token model in the study. The adapter never sets
  `truncation: true`, so the cutter **asks** the adapter for the ceiling instead
  of holding a number of its own.
- **The target** is a question of search quality. A `Vector` holds 384 numbers
  whether it describes 50 tokens or 500, so a passage that covers three subjects
  averages the three.
  [What the user gets back from a search](https://github.com/javierponferradalopez/local-semantic-search/issues/11)
  shows the text of the best `Match` clamped in the row, so a long `Chunk` also
  makes the row show a fragment that may not hold what matched.

300 is below the 400–512 that
[Getting text out of a PDF in Node](https://github.com/javierponferradalopez/local-semantic-search/issues/4)
cited, because that figure comes from work where a language model reads the
passage and discards what it does not need. Here the readers are a person looking
at one clamped row and a vector of 384 numbers, and both prefer a passage about
one thing.

**The target is a preferred cut point, not a limit.** The accumulator overruns
300, up to the wall, rather than emit a `Chunk` below a minimum of 50 tokens.
That is what carries a heading into the section it belongs to. A passage with
nothing left to join — the end of a page, the end of a file — is emitted as it
is, however short. **Nothing is dropped.**

## Why there is no overlap

Overlap repairs a blind cut: it exists so that a sentence split across a boundary
is whole somewhere. A cut that stops at a paragraph or a sentence never splits
one, so overlap buys insurance against a risk that the rule already removed. This
agrees with the work #4 cited, which finds no measurable benefit, but it does not
rest on it.

## Why a PDF is cut by sentences and a text file by paragraphs

A text file and a Markdown file mark a paragraph with a blank line, which is a
universal convention and free to read. A PDF marks nothing: `unpdf` returns
strings per page, and finding a paragraph inside one means guessing from vertical
gaps or indentation. Sentences are in the characters; paragraphs in a PDF are in
the geometry. **The rule takes what the format gives and guesses nothing.**

## Three repairs declined, and what each costs

Every one of them is a heuristic over geometry, and each would sit on top of the
one before it.

- **A paragraph heuristic for a PDF.** Cost: a PDF is cut at sentence
  boundaries, so a chunk can start mid-paragraph.
- **The repair of content-stream order.** PDF.js returns items in the order of
  the content stream, not in reading order
  ([pdf.js#18201](https://github.com/mozilla/pdf.js/issues/18201)), so a
  two-column document can interleave. Sorting by `y` would make it worse for the
  common case, because a two-column PDF from LaTeX usually writes one column and
  then the other, which is already correct. Real column detection is a third
  guess. Cost: **a two-column academic PDF is searched badly, and nothing on the
  screen says so.**
- **De-hyphenation.** A PDF breaks a word across a line with a hyphen, and the
  reconstruction keeps it. Cost: a word broken at a line end does not match a
  search for that word.

This is not the lying success that
[ADR-0005](0005-a-pdf-yields-text-and-nothing-else.md) refused. There the row
said `Ready` with **nothing** in it. Here the `Chunk` hold the right words in a
poor order, so the `Vector` is blurred, not false. The search gets worse; it does
not lie.

**The door stays open by construction**, which is the pattern of ADR-0005: the
`File` is kept for ever, and
[ADR-0010](0010-a-chunk-carries-the-rule-that-cut-it.md) makes a re-cut of the
whole corpus a script that runs with the search still up.

## The text that is stored is the text that is embedded

One text, not two. What the source gives is what is stored and what reaches the
model: `extractText()` for a PDF, the decoded string for a text file, **Markdown
with its markup**, never a cleaned copy beside a raw one.

Markdown is not stripped: stripping needs a parser, the markup marks the
paragraph the cut already uses, and a heading travels into its section by the
minimum rule and puts the title of the section inside its `Vector`. The cost is
that a Markdown table becomes a `Chunk` of pipes and dashes, and a long URL
spends tokens from the 300.

The newlines that `unpdf` puts between the lines of a page are **not collapsed**.
The reason first given for collapsing them was that the row reads better, which
is an interface need conditioning stored data — and it is also false, since HTML
collapses whitespace on its own. Whether a newline costs tokens in a SentencePiece
tokenizer was not measured, so it decides nothing.

## Consequences

- **A `Chunk` never crosses a page.** The page is one number and
  `#page=N` is one jump. Joining across a page break needs the paragraph
  heuristic that is declined above. The cost is the tail of each page, around 100
  tokens on a dense page, emitted on its own.
- **The text of a `Chunk` is a value object whose factory refuses text that is
  empty after `trim()`**, and it stores the trimmed value. The cutter must never
  offer a blank passage; the refusal exists so that a cutter that regresses fails
  loudly instead of storing a vector of nothing. A blank page inside a healthy
  PDF is dropped while cutting and never reaches the factory.
- **A `Resource` whose `Ingest` produces zero `Chunk` is `Failed`.** One rule for
  every `Content type`, not one per type: an empty text file is the same lie as
  the scanned PDF of ADR-0005 if it sits there saying `Ready`.
- **The `Ingest` needs no coordinates.** With no box, no paragraph heuristic and
  no column repair, `unpdf.extractText()` is the whole of what a PDF gives.
- **The target, the minimum, the wall and the cut version live in one constant
  beside the model identity and the `Floor`**, because a model changed without
  its `Floor`, or a cut changed without its version, breaks the search in
  silence.
