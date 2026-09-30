---
kind: decision
status: accepted
---

# A reranker gates and orders the text group

**The text group of a `Search` has two stages. The vector search of
`multilingual-e5-small` gives the best `Chunk` of each of the 20 best
`Resources`. Then the Reranker `gte-multilingual-reranker-base` `q8` scores each
pair of `Query` and `Chunk`, one pair for each call. Its score orders the text
`Results`, and the text `Floor` is a score of the Reranker, −0.58.** The image
group does not change.

This amends [ADR-0021](0021-a-floor-rejects-only-what-is-far-from-everything.md).
Decided in
[The text Floor does not reject a Query with no answer](https://github.com/javierponferradalopez/local-semantic-search/issues/88),
on the facts of
[Which reranker can say that a text search found nothing](https://github.com/javierponferradalopez/local-semantic-search/issues/89).
The report is on the branch `research/reranker`.

## Why this needs a record

A reader will find a second text model that runs on each keystroke, a `Floor`
that is a negative logit and not a cosine, a `q8` file where every other model
is `fp32`, and a model config that the adapter changes before it loads it. Each
one looks like something to fix.

## Why a reranker

ADR-0021 accepted a text `Floor` that almost never fires. On the owner's corpus
the cost shows on every `Query`: `bici`, `chorizo` and `asdkjh qwe` pass 0.78
on two Markdown `Resources` that are about neither subject. A bi-encoder
compares two `Vectors` that it calculated apart, and every value falls between
0.69 and 0.93. A cross-encoder reads the `Query` and the `Chunk` together. On
both corpora of #89, a Reranker score of 0 rejects 36 of 36 absent and noise
`Queries` on every model.

## Why this model

| Model | Kept, let in at the best constant | Right `Resource` first | 20 pairs | Resident | Licence |
|---|---|---|---|---|---|
| `gte-multilingual-reranker-base` `q8` | 56/57, 4/36 | 57/57 | 820 ms | 1136 MB | Apache-2.0 |
| `bge-reranker-v2-m3` `q8` | 56/57, 3/36 | 57/57 | 1986 ms | 1839 MB | |
| `jina-reranker-v2-base-multilingual` `q8` | 57/57, 6/36 | 56/57 | 719 ms | 1037 MB | CC-BY-NC-4.0 |
| `Qwen3-Reranker-0.6B` `q8` | 54/57, 0/36 | 57/57 | 4776 ms | 3297 MB | |
| `mmarco-mMiniLMv2-L12` `fp32` | 52/57, 1/36 | 50/57 | 274 ms | 1590 MB | |
| `multilingual-e5-small` today | 50/57, 3/36 at 0.83 | 47/57 | — | — | |

- **`gte`** keeps the most real answers at 0 (43 of 57) and ranks the right
  `Resource` first in 57 of 57. `multilingual-e5-small` does it in 47 of 57.
- **`Qwen3`** separates best, but 20 pairs take almost 5 s. The frontend sends a
  `Search` 300 ms after the last keystroke and does not cancel the old one.
- **`bge`** takes 2.4 times as long as `gte` for the same verdicts.
- **`jina`** is as fast, but its licence forbids commercial use.
- **mMiniLM** is fast, but it ranks the right `Resource` first less often than
  the bi-encoder of today.

## Why the model config is changed

`@huggingface/transformers` 4.3.0 does not load `gte-multilingual-reranker-base`
with its own `config.json`: `Unsupported model type: new`. 4.3.0 is the latest
version. The adapter passes the same config with `model_type: "xlm-roberta"`.
This value selects only the JavaScript class that feeds the ONNX graph. The
graph does not change, and the tokenizer is XLM-RoBERTa. The eval, not a test,
shows if a later version of the library breaks this.

ADR-0006 refused `snowflake-arctic-embed-m-v2.0` because it loads through a
fallback. Here no other model gives the same verdicts at this latency, and the
change is explicit in one constant, not a silent fallback.

## Why q8

This is the opposite of [ADR-0006](0006-the-text-model-is-multilingual-e5-small.md),
for the reasons that ADR-0006 measured. For the Reranker, `q8` is faster than
`fp32` (820 ms against 840 ms for 20 pairs), and it keeps 1136 MB resident
against 3415 MB. The server already keeps about 3 GB. `q8` moves the best
constant from −0.44 to −0.58 and flips 1 of 93 verdicts at 0, so the `Floor` is
measured on `q8`, never copied from `fp32`. `fp16` is slower than `fp32` on this
CPU.

## What the Reranker reads

It reads the best `Chunk` of each `Resource`, as the SQL of
[ADR-0002](0002-grouping-by-resource-happens-in-sql.md) gives it. More `Chunks`
raise the real answers and the noise together, and at the best constant the
verdict hardly changes (`fp32`: 54 of 57 on best1, 55 of 57 on every `Chunk`). The
cost grows with the pairs.

The vector search gives **20** `Results`, not 50. 50 pairs take 1804 ms, and
20 pairs take 820 ms. A `Resource` that the bi-encoder does not put in its 20
best does not come back.

The adapter scores **one pair for each call**. A padded batch pads each pair to
the longest `Chunk`, and it is 2.7 times slower for 50 pairs.

## Where the gate runs, and where the number lives

The gate stays in the `Search` use case, as ADR-0021 decided. The Reranker
takes the `Query` and the text `Results` and
gives them back with the score of the Reranker on their best `Match`, best
first. `Search` compares the first `Result` with the text `Floor`.

The port is `Reranker`, in `core/search/domain/services/`, because only the
search reads it. The `Floor` lives in the constant that holds the identity, the
dtype and the config of the Reranker, beside its adapter in
`core/search/infrastructure/transformers/`, as ADR-0021 put it for each model. `TEXT_MODEL` loses its `floor`. A `Floor` is now a score of the
model that judges its group, not a cosine: a logit has no upper or lower bound.

The Reranker loads before the server listens, as
[ADR-0008](0008-the-embedders-load-before-the-server-listens.md) decides for
the embedders, and `models:fetch` downloads it.

## Why −0.58

It is the middle of the best run of constants for `q8` on best1 over both
corpora (−0.61 to −0.54). It keeps 56 of 57 real answers and lets 4 of 36
absent or noise `Queries` in. On the owner's corpus alone the best constant
is −0.62, and it keeps 26 of 27 and lets in 0 of 20. Logit 0 was refused: it
rejects 14 of 57 real answers, and ADR-0021 decided that a `Floor` leans low, because a hidden real answer costs
more than a list that the owner judges by eye.

## Considered options

- **Keep ADR-0021 and accept the cost.** Refused: the owner sees every Text
  Resource on every `Query`.
- **A text `Floor` of 0.80 or more on `multilingual-e5-small`.** It rejects real
  answers in Spanish.
- **A relative signal, the best score minus the median.** Its gap is −0.018 on
  text, and it reopens #11.
- **The Reranker only as a gate, with the cosine order kept.** Refused: the
  Reranker already scores each `Result`, and it orders better.

## Consequences

- **The Reranker adds latency to each `Search`.** About 98 ms on the owner's
  corpus today, and up to about 820 ms at 20 Text Resources.
- **About 1.1 GB more stays resident.**
- **The text eval measures the two stages together.** Its golden set adds
  absent `Queries` in the owner's words against technical Markdown, as #88 asks.
  The number that the eval gives, not this record, is what a later change of the
  `Floor` cites.
- **`GetMatches` does not change.** It lists the `Matches` of one `Resource` in
  cosine order, and it has no `Floor`.
- **A change of the Reranker is not a re-Ingest.** The Reranker stores nothing.
  A change of its dtype or its model changes its `Floor`, in the same constant.
