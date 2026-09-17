# The text model is multilingual-e5-small, 384 dimensions, fp32

The search needs one model to embed a `Chunk` and a `Query`. Twenty-one
repositories ran on this machine, and the measured quality of the two finalists
was equal. **The choice is `intfloat/multilingual-e5-small`, at its native 384
dimensions, in `fp32`.** It was not chosen for a better score. It was chosen
because more evidence supports its score.

Decided in
[Which text embedder the search uses](https://github.com/javierponferradalopez/local-semantic-search/issues/24),
on the facts of
[Which text embedding model](https://github.com/javierponferradalopez/local-semantic-search/issues/14).

## Why this needs a record

A reader will find a small model where larger ones scored better, and `fp32`
where a `q8` export exists with the best agreement of the whole study. Both
look like something to fix. Neither is.

## Multilingual, and the price

The owner searches in Spanish over a corpus that mixes Spanish and English.
Every model scored 10/10 in English, and **no English-only model reached 10/10
in Spanish**. The cross-language case decides it: the earlier baseline
`all-MiniLM-L6-v2` scores **2/10** for a Spanish query over an English passage.

The price is measured: 15.67 ms for each `Chunk` against 6.92 ms, and **1386 MB
resident against 169 MB**. The time is invisible beside the 56 ms for each
image that
[Does text-to-image search really work](https://github.com/javierponferradalopez/local-semantic-search/issues/7)
already accepted. The memory is real, and
[How the two models load and stay warm](https://github.com/javierponferradalopez/local-semantic-search/issues/15)
inherits it.

## Why the small size

`multilingual-e5-large` publishes MIRACL 66.5 against 60.8 for the small size.
That is a real gain, and it is refused for one reason:
[What happens when the user adds a file](https://github.com/javierponferradalopez/local-semantic-search/issues/10)
made the upload request **wait**, with no queue and no progress bar. A document
of about 500 `Chunk` costs about 8 s at the small size and about **50 s** at the
large one. Half a minute in front of a still window is a different product.

Matryoshka truncation was refused as the way to reach 384. The probe could not
validate it: at 256 dimensions a model that claims no MRL was perfect, and a
model that claims MRL was worse. A 384 width comes from a model that is natively
384.

## Considered options

- **`granite-embedding-97m-multilingual-r2`** — the finalist, and a defensible
  choice. Apache-2.0 and ungated, 1386 MB, 15.67 ms, no prefix to remember, and
  a long window that makes an oversized `Chunk` harmless. It lost on the
  strength of its evidence, not on its quality: it scored 10/10 on the mixed
  pool once, while its own sibling `granite-embedding-311m-r2` scored **5/10**.
  The e5 family scored 10/10 on the mixed pool at **all three sizes**. Against a
  probe of ten queries, three independent agreements are the only defence
  available.
- **`snowflake-arctic-embed-m-v2.0`** — refused on fragility, not on quality.
  It declares `model_type: "gte"`, which `@huggingface/transformers` 4.3.0 does
  not know, so it loads through a base-class fallback that nothing guarantees.
  Its tokenizer also declares 32,768 tokens while the graph dies at 8,193.
- **`paraphrase-multilingual-MiniLM-L12-v2`** — a similarity model, not a
  retrieval one. It ranks an English twin above its Spanish original, 6/10 on
  the mixed pool. Its trained window is 128 tokens, declared in a file that this
  library never opens.
- **`embeddinggemma-300m`** — a gated repository, and a licence that is not OSI
  and that propagates its restrictions downstream.
- **`jina-embeddings-v2-base-es`** — publishes no evaluation of any kind. Its
  card still carries the literal `<!-- TODO: add evaluation results here -->`.

`arctic-m-v2.0` publishes a CLEF table where `multilingual-e5-base` collapses,
at 34.6 against 53.9. It is the vendor measuring a rival, and the probe on this
machine, in this language pair, does not reproduce it at any of the three sizes.

## Why fp32

`q8` is **never faster** on this CPU, in any of the 21 models. It buys download
size and memory only, and
[How the repository is laid out](https://github.com/javierponferradalopez/local-semantic-search/issues/12)
already keeps the download out of the first upload with an explicit script.

This model has the best `q8` agreement of the study, 0.9991. That number is a
cosine agreement, not a ranking test in Spanish, and the note that #7 left on
#14 asks for the opposite: judge a dtype on ranking. For `nomic` the ranking was
measured, and Spanish fell from 7/10 to 5/10.

Above all, this model has the **narrowest score spread of the study** — 0.17,
against 0.63 for `all-MiniLM-L6-v2`.
[Where the two Floors are set](https://github.com/javierponferradalopez/local-semantic-search/issues/23)
must set a `Floor` on it, and
[Deciding that a search found nothing](https://github.com/javierponferradalopez/local-semantic-search/issues/19)
measured a separation of **-0.0033** over its probe set. Quantisation noise
belongs anywhere except in the narrowest spread.

`fp32` also keeps one rule for both towers. #7 fixed the vision model at `fp32`
for the same reason.

## Consequences

- **The vector column is 384 wide**, in the schema of
  [Which store holds the vectors](https://github.com/javierponferradalopez/local-semantic-search/issues/8).
- **The window is 512 tokens, and token 513 kills the process** with
  `Attempting to broadcast an axis by a dimension other than 1. 512 by 513`.
  The real ceiling for
  [How content is cut into chunks](https://github.com/javierponferradalopez/local-semantic-search/issues/16)
  is 512 minus the prefix and minus the special tokens, measured with this
  model's own tokenizer. It is never read from `model_max_length`, which the
  research found lies in three different shapes.
- **The adapter never sets `truncation: true`.** A silently shortened `Chunk` is
  a `Ready` `Resource` that lies about what it holds.
- **Each embedder port has two operations**, one for a `Chunk` and one for a
  `Query`. E5 needs the `query: ` and `passage: ` prefixes, and the prefix stays
  inside the adapter. The domain and the use cases never name a prefix. One
  integration test embeds the same text both ways and asserts that the two
  `Vector` differ; it needs no knowledge of the prefix.
- **The `Floor` is not portable.** The score spread varies 4x between models, so
  the `Floor` of #23 belongs to this model and travels with it.
- **A change of model or of dtype is a full re-Ingest.** It changes the `Vector`
  and it changes where the `Chunk` are cut, because the ceiling is measured with
  the model's own tokenizer. See
  [ADR-0007](0007-a-vector-carries-the-model-that-made-it.md).
