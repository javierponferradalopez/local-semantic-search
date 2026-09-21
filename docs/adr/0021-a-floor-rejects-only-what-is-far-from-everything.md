# A Floor rejects only what is far from everything

**Each `Floor` is a low constant. It keeps every real answer that the probes
found, and it rejects only a `Query` whose best `Match` is far from the whole
corpus. The image `Floor` is cosine 0.05 on SigLIP2 base/16 `fp32`. The text
`Floor` is cosine 0.78 on `multilingual-e5-small` `fp32`.** A `Query` with no
meaning passes both, and the group shows results. The gate runs in the `Search`
use case, the number lives in the constant that names the model, and an eval
measures the gate on the owner's own corpus.

Decided in
[Where the two Floors are set](https://github.com/javierponferradalopez/local-semantic-search/issues/23),
on the facts of
[Deciding that a search found nothing](https://github.com/javierponferradalopez/local-semantic-search/issues/19).
The report is on the branch `research/search-floor`, sections 4 to 6.4.

## Why this needs a record

A reader will find two small numbers that look arbitrary, and a gate that almost
never fires in the text group. Both numbers were measured, and a higher number
hides real answers. This record says why the gate is permissive on purpose.

## Why low

[What the user gets back from a search](https://github.com/javierponferradalopez/local-semantic-search/issues/11)
made the `Floor` decide only the empty answer, so the cost of a wrong number is
not symmetric. A `Floor` that is too high hides a real answer, and the user has
no way to know. A `Floor` that is too low shows results that do not answer, and
the user judges them by eye. A grid of pictures is judged in a second. So each
`Floor` leans low, and the worst real answer sets it.

**The image space.** SigLIP2 base/16 `fp32`, 16 photographs, 85 queries in
four phrasings. The best `Match` of a real answer lies between 0.0817 and
0.1641. The best `Match` of an absent subject lies between −0.0108 and 0.0554.
The best `Match` of a string that is not language reaches 0.0850, above two real
answers. Spanish costs 0.0200 at the worst case, and the owner searches in
Spanish. A `Floor` of **0.05** leaves 0.03 under the worst real answer, which is
more than the whole gap of 0.0263 between an answered and an unanswered
`Query`, and it still rejects most absent subjects.

**The text space.** `multilingual-e5-small` `fp32`, 20 passages, 43 queries.
Every value lies between 0.69 and 0.93. The worst real answer is 0.7910, in
Spanish. The best `Query` with no answer is a string that is not language, at
0.8243. The English gap is 0.0016, 125 times narrower than the 0.2011 that a
stand-in model had shown. A `Floor` of **0.78** leaves 0.011 under the worst
real answer, rejects a minority of the absent subjects and rejects no string
that is not language. The same model ranks the right subject first in 30 of 30
queries, Spanish included. It orders well and it cannot say "nothing".

## Considered options

- **The neutral point that SigLIP2 publishes, cosine 0.148859.** It is the only
  number that no person picked. It rejects 41 of 48 real answers, and it moved
  0.039 between two checkpoints of the same family and size.
- **No `Floor` in a group.** A gate that never closes is worse than a gate that
  is honest and permissive, and the glossary says that each model has one.
- **A spread signal, the best score minus the median of the list.** It
  separates real, absent and nonsense on 16 images, and it does not separate
  them in text, where its gap is −0.018. It is also a different mechanism from
  the one #11 decided, and it is not proven where the corpus has more rows than
  the fifty the search reads.
- **A text `Floor` that bites, 0.80 or more.** It rejects real answers in
  Spanish.
- **A reranker.** Already out of scope on the map.

## Where the gate runs, and where the number lives

The adapter returns the grouped rows with their score
([ADR-0002](0002-grouping-by-resource-happens-in-sql.md)), and the `Search`
use case compares the first row with the `Floor`. The gate is one comparison
and the `Floor` is a concept of the search domain, so it does not move into
SQL. The query port returns rows with a score and nothing else.

The `Floor` lives in the constant that holds the identity, the dtype and the
width of its model
([ADR-0007](0007-a-vector-carries-the-model-that-made-it.md),
[ADR-0014](0014-the-cut-belongs-to-no-model.md)), beside the adapter in
`core/shared/`. The adapter reads the identity from it, and the wiring gives
`Search` its two `Floor` from the same constant. The embedder port keeps two
operations and does not expose a `Floor`: an embedder does not know what
"found nothing" means. The `Floor` is written as a cosine similarity, which is
what the research measured, and the pgvector adapter translates it to a
distance.

## The eval measures the gate

This amends [ADR-0016](0016-a-model-is-judged-by-an-eval-never-by-a-test.md).
The golden set of each eval adds queries whose answer is **not** in the corpus,
and each eval has a second scorer: 1 when the verdict of the gate is right, so
an answered `Query` passes and an unanswered `Query` is rejected. The score is
read, not gated, as ADR-0016 says. The two numbers above come from 16 COCO
photographs and 28 passages, not from the owner's corpus and not in the owner's
words; the eval is the one place where they are checked against both.

## A Chunk holds a letter or a digit

This amends the rule *nothing is dropped* of ADR-0014. The probe added eight
short passages of the kind a PDF page leaves with nothing to join. One of them,
`---`, became the best `Match` of 18 of 43 queries: every absent subject, every
string that is not language, and five real answers in Spanish. `passage: ---`
is five tokens, so its `Vector` is almost all prefix, and the prefix is in every
`Query` too. Without it, no short passage reached rank 1: page numbers and lone
headings behave.

So the factory of the text of a `Chunk` refuses a text that holds no letter and
no digit, `\p{L}` or `\p{N}`, in the same place where it refuses a text that is
empty after `trim()`, and the cutter skips such a passage. The cost: a passage
made only of punctuation or emoji is not embedded.

## Consequences

- **In the text group the `Floor` almost never fires.** A `Query` with no
  meaning shows passages. Accepted, and written on the map.
- **Each `Floor` belongs to its model.** A change of model changes the constant
  that holds both, so the two cannot drift apart.
- **The eval reports how many real queries the `Floor` rejects on every run.**
  That number, not this record, is what a later change of the `Floor` cites.
- **The Spanish collapse of the stand-in does not repeat.** With
  `multilingual-e5-small`, 30 of 30 queries rank the right subject first.
