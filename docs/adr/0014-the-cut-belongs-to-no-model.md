---
kind: decision
status: accepted
---

# The cut belongs to no model

> **Amended by [ADR-0021](0021-a-floor-rejects-only-what-is-far-from-everything.md).**
> The rule *nothing is dropped* now reads: nothing that holds a letter or a
> digit is dropped. A passage with no letter and no digit, such as `---`, is
> not a `Chunk`. Everything else stands.
>
> **Amended by [ADR-0042](0042-a-floor-gates-a-group-and-a-margin-cuts-it.md).**
> ADR-0042 supersedes ADR-0021 and writes again the rule of the letter or the
> digit, with its evidence. The rule does not change.

**A `Chunk` is cut by the structure of its format and by a size in Unicode code
points. No tokenizer takes part in the cut. The text model embeds any `Chunk`
the cutter gives it, whatever its density, and never makes the `Ingest` fail.**
The cut of a `Chunk` is therefore the same under every model, and a change of
model does not move it.

Decided in
[A cut that no model owns](https://github.com/javierponferradalopez/local-semantic-search/issues/25),
which revises
[How content is cut into chunks](https://github.com/javierponferradalopez/local-semantic-search/issues/16).
The numbers come from
[How many characters a token holds](https://github.com/javierponferradalopez/local-semantic-search/issues/26).

## What this replaces

[ADR-0011](0011-the-cut-follows-the-structure-the-format-gives.md) made the
token of the text model the unit of the cut, with a target of 300 tokens against
a wall the adapter owns. That tied every cut to one tokenizer, and it forced the
consequence that [ADR-0007](0007-a-vector-carries-the-model-that-made-it.md)
recorded: a change of model moves the cuts, so it is a complete re-`Ingest`.
Both of those statements stop holding. The structure of the cut, the refusal of
overlap, the refusal of the three geometry repairs, the page rule and *one text,
not two* all stand.

## The semantics and the size are two different questions

The cut answers two questions in two steps, and neither step asks the model.

**First, the structure.** The cutter groups by what the format marks for free,
and guesses nothing:

- In a Markdown file, **a heading is a boundary**. It closes the `Chunk` in
  progress and opens the next one, so a `Chunk` never spans two sections. A
  heading is never emitted alone: it travels with the paragraph that follows
  it, and with the paragraph before it when nothing follows. **A fenced code
  block is one passage**: a blank line inside it is not a paragraph break. A
  list is paragraphs like any other.
- In a text file, the passage is a paragraph, marked by a blank line.
- In a PDF, the passage is a sentence, inside a page, and **a `Chunk` never
  crosses a page**, as before.

The cut does not try to detect the importance of a sentence. Local coherence is
the whole goal.

**Second, the size, in Unicode code points.** Not UTF-8 bytes, which make a
Spanish paragraph measure more than the same paragraph in English; not words,
which a table of numbers or a URL does not have; not the `length` of a
JavaScript string, which counts UTF-16 units and doubles an emoji. Three
numbers, all in code points, none of them from a model:

| Number | Value | What it is |
|---|---|---|
| Target | **1200** | The preferred cut point. Passages accumulate until the next would pass it. |
| Minimum | **200** | A passage under it is not emitted alone if it can join. |
| Cap | **1500** | The largest `Chunk`. A single passage over it is split. |

The ladder for a passage over the cap is **paragraph, then sentence, then a hard
cut** at the last whitespace before the cap, and at the cap exactly when there is
no whitespace. The hard cut is the only place where a `Chunk` can split a
sentence.

The target equals the 300 tokens of ADR-0011 for the reason ADR-0011 gave, which
stands: a `Vector` holds 384 numbers whether it describes one paragraph or
five. The cap is the largest value at which prose in Spanish and in English fits
the three tokenizers the study measured, so the split described below fires only
on dense Markdown, code, tables of numbers and strings with no spaces.

## The adapter promises to embed anything

A cap in code points cannot guarantee the 512-token wall: a string with no
spaces can cost one token per character. [Which text embedder the search
uses](https://github.com/javierponferradalopez/local-semantic-search/issues/24)
left a net in the adapter for that case, which made the `Resource` `Failed`.
**That net is gone.** No `Resource` fails because the cut and the model
disagree about a size, since that failure would be ours and the user could do
nothing about it.

Instead the port promises: **given any non-empty text of up to the cap, the
adapter returns one `Vector`.** The adapter is the one piece that knows the
tokenizer, so it keeps the wall. When a text passes the wall, the adapter cuts
it into windows of tokens that fit, embeds each window, takes the mean of the
vectors and normalises it. Every character of the text reaches the model, so
this is not the truncation #24 refused, which drops text and makes a `Ready`
row lie. The `Vector` of a table of numbers comes out blurred, not false, which
is the line ADR-0011 drew.

The promise is proven **once per adapter, never over the corpus.** Each adapter
carries one integration test that embeds the worst cases at the length of the
cap — digits, a string with no spaces, characters the vocabulary does not know —
and asserts that a `Vector` comes back and that two different inputs give two
different `Vector`. The second assertion exists because the study saw a
WordPiece tokenizer turn 3000 digits into a single unknown token: no crash, and
nothing embedded.

## Two pieces of configuration, not one

ADR-0011 kept the model, the `Floor`, the target, the minimum and the cut
version in one constant, because the wall belonged to the model and everything
moved together. Now the cut and the model change on their own, which is the
point. So there are **two constants**: one for the model, with its identity and
its `Floor`, which ADR-0007 requires to travel together; and one for the cut,
with the target, the minimum, the cap and the version of the rule. A change of
one never needs an edit of the other.

## Consequences

- **A `Chunk` is the same under every model.** What a change of model makes
  stale is the `Vector` alone, never the `Chunk`. The section *What a change
  of model makes stale* of ADR-0007 no longer holds.
- **The cutter has no dependency on the text model**, not even on its
  tokenizer. A unit test can run the whole cut with no weight on disk.
- **The port has two operations and a promise.** The promise covers both the
  passage and the `Query`, so a long `Query` is embedded and never refused.
- **The newlines of a PDF page are still not collapsed**, now with a measurement
  behind it: they cost zero tokens in the model in use. The hyphens at line ends
  cost two tokens each; de-hyphenation stays declined for the reason ADR-0011
  gave, since a hyphen is not always a broken word.
- **The cut version stays on the `Chunk`** ([ADR-0010](0010-a-chunk-carries-the-rule-that-cut-it.md)),
  and the uniqueness of a `Chunk` inside its `Resource` is the cut version
  and the position, with no model in it.
