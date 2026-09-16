# Research #14 — Which text embedding model

Date: 2026-09-16. Facts only. This report does not choose a model.

## 0. Summary of what was verified

Everything in the "measured" tables below ran on this machine. Everything else
carries a source URL in section 12, and is marked as published, not measured.

Test machine and versions:

| Item | Value |
| --- | --- |
| CPU | Apple M5, 10 cores |
| RAM | 24 GB |
| OS | macOS 26.6.2 (Darwin 25.6.0) |
| Node | v24.11.0 |
| `@huggingface/transformers` | **4.3.0** — the current `latest` on npm, published 2026-09-16 |
| `onnxruntime-node` | 1.30.0 (a direct dependency of the above) |
| `@huggingface/tokenizers` | ^0.2.0 (**new** in 4.3.0; 4.2.0 had no such dependency) |
| Execution provider | CPU |

Ticket #14 names version 4.2.0. That version is no longer current. 4.3.0 was
published on the day of this report and is the version used here, except in
section 6.3, which runs the same work on both versions to compare them.

The scripts are in `docs/research/embedlab/`. One `.mjs` file per probe:
`registry.mjs`, `hub.mjs`, `load.mjs`, `tokens.mjs`, `longwall.mjs`,
`speed.mjs`, `lang.mjs`, `matryoshka.mjs`, `quant.mjs`, `static.mjs`,
`baseline.mjs`. The raw output is in the `out_*.jsonl` files beside them.

**28 model repositories were tried. 21 of them produced a vector in Node.
Seven could not be loaded at all.** The weight cache reached 12 GB.

## 1. What the library can load

`node_modules/@huggingface/transformers/src/models/` holds **219** model
directories in 4.3.0, and `registry.js` maps **435** `model_type` keys to
classes. The keys that matter to a text embedder are all present:

`bert`, `roberta`, `xlm-roberta`, `mpnet`, `distilbert`, `electra`,
`modernbert`, `nomic_bert`, `gemma3_text`, `qwen3`, `neobert`, `eurobert`.

Three keys are **absent**. In each case the library prints
`Unknown model class "<key>", attempting to construct from base class` and falls
back to `PreTrainedModel`. The fallback saves one of the three and not the other
two:

* **`gte`** — `Snowflake/snowflake-arctic-embed-m-v2.0` declares
  `"model_type": "gte"`. The fallback **works**: the model loads, embeds, and
  scores well in section 8. But nothing in the library was written for it, so a
  future release could change that without notice.
* **`new`** — `Alibaba-NLP/gte-multilingual-base` declares `"model_type": "new"`.
  Same fallback message. It fails later for a different reason (section 3).
* **`model2vec`** — `minishlab/potion-multilingual-128M` declares
  `"model_type": "model2vec"`. Same fallback message, then it fails (section 3).

`jina_clip` is a first-class architecture, as report #3 found. There is no
`jina_bert`: the Jina v2 text models declare `"model_type": "bert"` and load as
`BertModel`.

## 2. The candidates

"Loaded" below means: I called `AutoModel.from_pretrained` on this machine with
`@huggingface/transformers@4.3.0`, fed it real text, and got a finite vector
back.

| Repository | Licence | Architecture | Dim | Loaded | Multilingual claim |
| --- | --- | --- | --- | --- | --- |
| `Xenova/all-MiniLM-L6-v2` | Apache-2.0 | bert | 384 | yes | no — `language: en` |
| `Xenova/bge-small-en-v1.5` | (none on the mirror; MIT upstream) | bert | 384 | yes | no |
| `Xenova/bge-base-en-v1.5` | MIT | bert | 768 | yes | no |
| `Xenova/gte-small` | (none on the mirror; MIT upstream) | bert | 384 | yes | no |
| `Xenova/gte-base` | (none on the mirror; MIT upstream) | bert | 768 | yes | no |
| `Xenova/e5-small-v2` | (none on the mirror; MIT upstream) | bert | 384 | yes | no |
| `Xenova/multilingual-e5-small` | (none on the mirror; MIT upstream) | bert | 384 | yes | **yes, 100 languages** |
| `Xenova/multilingual-e5-base` | (none on the mirror; MIT upstream) | xlm-roberta | 768 | yes | **yes** |
| `Xenova/multilingual-e5-large` | (none on the mirror; MIT upstream) | xlm-roberta | 1024 | yes (q8) | **yes** |
| `nomic-ai/nomic-embed-text-v1.5` | Apache-2.0 | nomic_bert | 768 | yes | no — `language: en` |
| `Snowflake/snowflake-arctic-embed-s` | Apache-2.0 | bert | 384 | yes | no explicit claim |
| `Snowflake/snowflake-arctic-embed-m-v1.5` | Apache-2.0 | bert | 768 | yes | no explicit claim |
| `Snowflake/snowflake-arctic-embed-m-v2.0` | Apache-2.0 | **gte (fallback)** | 768 | yes (q8) | **yes, 74 languages** |
| `Snowflake/snowflake-arctic-embed-l-v2.0` | Apache-2.0 | xlm-roberta | 1024 | yes (q8) | **yes, 74 languages** |
| `Xenova/paraphrase-multilingual-MiniLM-L12-v2` | (none on the mirror; Apache-2.0 upstream) | bert | 384 | yes | **yes, 50 languages** |
| `jinaai/jina-embeddings-v2-base-es` | **Apache-2.0** | bert | 768 | yes | **yes, Spanish + English** |
| `onnx-community/embeddinggemma-300m-ONNX` | **gemma** | gemma3_text | 768 | yes | **yes, 100+ languages** |
| `onnx-community/Qwen3-Embedding-0.6B-ONNX` | (none; Apache-2.0 upstream) | qwen3 | 1024 | yes (q8) | **yes, 100+ languages** |
| `mixedbread-ai/mxbai-embed-large-v1` | Apache-2.0 | bert | 1024 | yes (q8) | no — `language: en` |
| `ibm-granite/granite-embedding-97m-multilingual-r2` | Apache-2.0 | modernbert | 384 | yes (fp32) | **yes, 200+ languages** |
| `ibm-granite/granite-embedding-311m-multilingual-r2` | Apache-2.0 | modernbert | 768 | yes (fp32) | **yes, 200+ languages** |
| `jinaai/jina-embeddings-v2-small-en` | Apache-2.0 | bert | 512 | **no** | no |
| `jinaai/jina-embeddings-v3` | **CC BY-NC 4.0** | (none declared) | 1024 | **no** | yes |
| `sentence-transformers/static-retrieval-mrl-en-v1` | Apache-2.0 | (none declared) | 1024 | **no** | no |
| `sentence-transformers/static-similarity-mrl-multilingual-v1` | Apache-2.0 | (none declared) | 1024 | **no** | yes |
| `ibm-granite/granite-embedding-107m-multilingual` | Apache-2.0 | xlm-roberta | 384 | **no** | yes |
| `Alibaba-NLP/gte-multilingual-base` | Apache-2.0 | new | 768 | **no** | yes |
| `minishlab/potion-multilingual-128M` | MIT | model2vec | 256 | **no** | yes |

### Download size, from the Hub API

`fp32` is `onnx/model.onnx` plus its external data file. `q8` is
`onnx/model_quantized.onnx`, which is the file the library fetches for
`dtype: 'q8'`.

| Repository | fp32 | q8 |
| --- | --- | --- |
| `Xenova/all-MiniLM-L6-v2` | **90.4 MB** | **23.0 MB** |
| `Xenova/bge-small-en-v1.5` | 133.1 MB | 34.0 MB |
| `Xenova/gte-small` | 133.1 MB | 34.0 MB |
| `Xenova/e5-small-v2` | 133.1 MB | 34.0 MB |
| `Snowflake/snowflake-arctic-embed-s` | 133.1 MB | 34.0 MB |
| `ibm-granite/granite-embedding-97m-multilingual-r2` | 390.0 MB | **no file the library can use** (98.2 MB, wrong name) |
| `Xenova/bge-base-en-v1.5` | 435.8 MB | 110.1 MB |
| `Xenova/gte-base` | 435.8 MB | 110.1 MB |
| `Snowflake/snowflake-arctic-embed-m-v1.5` | 435.9 MB | 110.1 MB |
| `Xenova/multilingual-e5-small` | 470.3 MB | 118.3 MB |
| `Xenova/paraphrase-multilingual-MiniLM-L12-v2` | 470.3 MB | 118.3 MB |
| `nomic-ai/nomic-embed-text-v1.5` | 547.3 MB | 137.3 MB |
| `jinaai/jina-embeddings-v2-base-es` | 641.4 MB | 161.8 MB |
| `Xenova/multilingual-e5-base` | 1110.1 MB | 278.6 MB |
| `Snowflake/snowflake-arctic-embed-m-v2.0` | 1226.1 MB | 310.9 MB |
| `onnx-community/embeddinggemma-300m-ONNX` | 1235.0 MB | 309.5 MB |
| `ibm-granite/granite-embedding-311m-multilingual-r2` | 1247.2 MB | **no file the library can use** (313.4 MB, wrong name) |
| `mixedbread-ai/mxbai-embed-large-v1` | 1336.9 MB | 337.0 MB |
| `Xenova/multilingual-e5-large` | 2235.9 MB | 561.8 MB |
| `Snowflake/snowflake-arctic-embed-l-v2.0` | 2267.6 MB | 569.7 MB |
| `onnx-community/Qwen3-Embedding-0.6B-ONNX` | 2400.6 MB | 613.5 MB |
| `jinaai/jina-embeddings-v3` | 2292.9 MB | none |

A multilingual model pays for its vocabulary. `multilingual-e5-small` has the
same 12 layers and the same 384 dimensions as `bge-small`, but its file is
470 MB against 133 MB, because its XLM-R vocabulary holds 250,002 tokens
against 30,522.

## 3. The seven repositories that will not load

These are not slow or weak. They do not run.

**`jinaai/jina-embeddings-v2-small-en` and `jina-embeddings-v2-base-en`** put
their ONNX at the top of the repository (`model.onnx`,
`model-w-mean-pooling.onnx`). The library looks in the `onnx/` folder:

```
Could not locate file: "https://huggingface.co/jinaai/jina-embeddings-v2-small-en/resolve/main/onnx/model.onnx"
```

The Spanish sister repository `jina-embeddings-v2-base-es` does use `onnx/`, so
it loads. The two English ones do not. `ibm-granite/granite-embedding-107m-multilingual`
fails the same way, for the same reason.

**`jinaai/jina-embeddings-v3`** downloads its 2.3 GB of weights and then fails
when ONNX Runtime builds the session:

```
External data path validation failed for initializer:
roberta.embeddings.word_embeddings.parametrizations.weight.0.lora_B.
Error: tensorprotoutils.cc:461 ValidateExternalDataPathFromDir
```

Its `config.json` also declares no `model_type`, so the library falls back to
the base class first. This model is **CC BY-NC 4.0** in any case. See section 4.

**`sentence-transformers/static-retrieval-mrl-en-v1` and
`static-similarity-mrl-multilingual-v1`** have no `config.json` and no
`tokenizer_config.json` at the top of the repository. The tokenizer sits in
`0_StaticEmbedding/tokenizer.json`. Every path stops:

| Attempt | Result |
| --- | --- |
| `AutoTokenizer.from_pretrained(id)` | `Cannot read properties of undefined (reading 'tokenizer_class')` |
| the same with `subfolder: '0_StaticEmbedding'` | same error |
| `new PreTrainedTokenizer(tokenizer.json, {})` by hand | **works**, 9 tokens |
| `AutoModel.from_pretrained(id)` | `Could not locate file: ".../config.json"` |
| the ONNX graph driven by `onnxruntime-node` by hand | **works** |

So the weights are sound. The graph takes `input_ids` and `attention_mask` and
returns `sentence_embedding` at 1024 dimensions, and it runs. What is missing is
the metadata that `@huggingface/transformers` needs. To use these models you
would write your own tokenizer wiring and your own session, outside the library.

**`minishlab/potion-multilingual-128M`** builds a session and then fails on the
forward pass:

```
An error occurred during model execution: "Missing the following inputs: offsets."
```

The graph is an embedding bag. It wants an `offsets` tensor that the library
never produces.

**`Alibaba-NLP/gte-multilingual-base`** has no ONNX export in the official
repository at all. The `onnx` file list is empty.

## 4. Licence

One candidate carries a non-commercial clause. **State this loudly at the
grilling.**

> **`jinaai/jina-embeddings-v3` is CC BY-NC 4.0.** Its own model card says:
> "note that the models is licensed under CC BY-NC 4.0. For commercial usage
> inquiries, feel free to contact us." CC BY-NC 4.0 §2(a)(1) grants the licence
> "for NonCommercial purposes only", and §1 defines NonCommercial as "not
> primarily intended for or directed towards commercial advantage or monetary
> compensation". This is the same trap that removed `jina-clip-v2` in #3.

`jinaai/jina-embeddings-v2-base-es` is genuinely **Apache-2.0**. The repository
front matter says so, and the Hub API agrees. It is the one Jina model here that
speaks Spanish and carries no commercial restriction.

**`google/embeddinggemma-300m` is not non-commercial, but it is not an open
licence either.** The Gemma Terms of Use §3.2 list the only use restrictions:

> "You must not use any of the Gemma Services: for the restricted uses set forth
> in the Gemma Prohibited Use Policy ... or in violation of applicable laws and
> regulations."

Commerce is not in that list. Three things still follow from it. §3.1 makes you
pass the restrictions on to your own users as an enforceable term, and ship a
notice. Google "reserves the right to restrict (remotely or otherwise) usage".
And the `google/embeddinggemma-300m` repository is **gated**: a plain fetch of
its README returns "Access to model google/embeddinggemma-300m is restricted".
The `onnx-community` mirror used here is not gated.

Everything else is Apache-2.0 or MIT. Note that several `Xenova/*` mirrors
declare **no licence field at all** — `bge-small`, `gte-small`, `gte-base`,
`e5-small-v2`, `multilingual-e5-*`, `paraphrase-multilingual-MiniLM-L12-v2`.
The upstream repositories are MIT or Apache-2.0, but the file you download comes
from a repository that states nothing.

## 5. The token window, and what over-long input does

### 5.1 The measured wall

The probe feeds the graph a sequence of a known length and records what happens.

| Model | tokenizer `model_max_length` | `truncation: true` clips at | graph accepts | graph at one token more |
| --- | --- | --- | --- | --- |
| all-MiniLM-L6-v2 | 512 | **512** | 512 | **crash at 513** |
| bge-small / bge-base | 512 | 512 | 512 | crash at 513 |
| gte-small / gte-base | 512 | 512 | 512 | crash at 513 |
| e5-small-v2 | 512 | 512 | 512 | crash at 513 |
| multilingual-e5 small / base / large | 512 | 512 | 512 | crash at 513 |
| paraphrase-multilingual-MiniLM-L12-v2 | 512 | 512 | 512 | crash at 513 |
| arctic-embed-s / m-v1.5 | 512 | 512 | 512 | crash at 513 |
| mxbai-embed-large-v1 | 512 | 512 | 512 | crash at 513 |
| **jina-embeddings-v2-base-es** | **512** | **512** | **4096 and more** | — |
| embeddinggemma-300m | 2048 | 2048 | 2048 | **crash at 4096** |
| nomic-embed-text-v1.5 | 8192 | 8192 | 4096 tested, no crash | not reached |
| **arctic-embed-m-v2.0** | **32768** | 32768 | **8192** | **crash at 8193** |
| arctic-embed-l-v2.0 | 8192 | 8192 | 4096 tested, no crash | not reached |
| granite-embedding-97m / 311m-r2 | 32768 | 32768 | 4096 tested, no crash | not reached |
| Qwen3-Embedding-0.6B | **131072** | 131072 | 4096 tested, no crash | not reached |

The crash is a hard ONNX Runtime error, not a warning and not a silent result.
The full text, from `all-MiniLM-L6-v2` fp32 at 513 tokens:

```
Non-zero status code returned while running Add node. Name:'/embeddings/Add_1'
Status Message: .../element_wise_ops.h:583 void
onnxruntime::BroadcastIterator::Append(ptrdiff_t, ptrdiff_t)
axis == 1 || axis == largest was false. Attempting to broadcast an axis by a
dimension other than 1. 512 by 513
```

This is the same failure class that #3 found on CLIP and SigLIP2. The position
table is a fixed tensor, and one token past it stops the graph.

### 5.2 Good news: every tokenizer here truncates correctly

Report #3 found a SigLIP2 tokenizer with `model_max_length` set to a sentinel,
where `truncation: true` silently did nothing. **No text embedder in this study
has that fault.** Every `model_max_length` above is a real number, and
`tokenizer(text, { truncation: true })` clipped a 4,874-token text to exactly
that number.

One repository does carry the sentinel: `jinaai/jina-embeddings-v2-small-en` and
`-base-en` declare `model_max_length: 2147483648`. Neither of them loads at all
(section 3), so the trap is never reached here. If the ONNX ever moves into an
`onnx/` folder, the trap comes back.

### 5.3 The opposite fault: a tokenizer that throws text away

**`jinaai/jina-embeddings-v2-base-es` is the mirror image of the SigLIP2 trap.**
Its model card advertises 8192 tokens. Its `config.json` sets
`max_position_embeddings: 8192`. Its graph really did accept 4096 tokens here.
But its `tokenizer_config.json` says `model_max_length: 512`, so the library's
default `truncation: true` throws away **everything past 512 tokens, and says
nothing**. You get a vector. It is a vector of the first eighth of your chunk.

You must pass `max_length: 8192` yourself to get the advertised window.

### 5.4 The `padding: 'max_length'` trap

Report #3 needed `padding: 'max_length'` to make SigLIP work. Here it is a trap
instead. `tokenizer(text, { padding: 'max_length', truncation: true })` pads to
`model_max_length`, so it produces a **32,768-token** sequence for
`arctic-embed-m-v2.0` and granite R2, and a **131,072-token** sequence for
Qwen3-Embedding. That is not a window you want to pay for by accident.

### 5.5 A window that is declared is not a window that is tested

`arctic-embed-m-v2.0` declares a 32,768-token tokenizer limit over a graph whose
`max_position_embeddings` is **8192**. Qwen3 declares 131,072 over 32,768. The
probe text only reached 4,874 tokens, so `tokens.mjs` never entered the space
between those two numbers. Section 6.4 pushes into it with synthetic input, and
finds that `arctic-embed-m-v2.0` does crash there — at token 8,193, exactly where
its graph ends and four times before its tokenizer would have clipped.

## 6. Speed on this CPU

### 6.1 Method

The chunk is one 900-character paragraph, which the tokenizers turn into about
190 tokens. That is a realistic chunk for this product. Warm up twice, then take
the median of five runs (three at batch 32). Everything runs from a warm weight
cache, one process at a time, with nothing else running.

Two different numbers are reported, because they differ by a lot:

* **forward** — the tokenizer plus the ONNX graph. This is what #3 timed.
* **embed** — the same, plus reading the hidden state into JavaScript and
  pooling it there. This is what an application really pays.

### 6.2 Measured, per chunk

Sorted by the forward time per chunk. `RSS` is the resident memory of the Node
process straight after the weights load.

| Model | dtype | tokens | forward batch 1 | forward batch 32 | **ms per chunk** | embed ms per chunk | chunks/s | query ms | RSS MB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| all-MiniLM-L6-v2 | fp32 | 190 | 5.7 | 203.8 | **6.37** | 7.47 | 157 | 1.4 | 262 |
| all-MiniLM-L6-v2 | q8 | 190 | 6.6 | 221.4 | **6.92** | 8.68 | 145 | 0.9 | 169 |
| bge-small-en-v1.5 | fp32 | 190 | 14.3 | 415.3 | **12.98** | 14.45 | 77 | 2.5 | 306 |
| arctic-embed-s | fp32 | 190 | 13.0 | 417.6 | **13.05** | 14.12 | 77 | 2.6 | 319 |
| e5-small-v2 | fp32 | 192 | 12.0 | 426.0 | **13.31** | 15.18 | 75 | 2.1 | 306 |
| gte-small | fp32 | 190 | 13.0 | 431.7 | **13.49** | 14.91 | 74 | 2.0 | 317 |
| arctic-embed-s | q8 | 190 | 13.2 | 444.4 | **13.89** | 14.97 | 72 | 2.0 | 187 |
| bge-small-en-v1.5 | q8 | 190 | 14.9 | 454.8 | **14.21** | 15.89 | 70 | 1.9 | 187 |
| gte-small | q8 | 190 | 13.5 | 461.1 | **14.41** | 15.86 | 69 | 1.6 | 187 |
| e5-small-v2 | q8 | 192 | 13.6 | 465.1 | **14.53** | 15.97 | 69 | 1.5 | 187 |
| paraphrase-multilingual-MiniLM-L12-v2 | fp32 | 205 | 15.1 | 475.7 | **14.87** | 16.22 | 67 | 2.2 | 1606 |
| multilingual-e5-small | fp32 | 207 | 16.7 | 485.9 | **15.18** | 16.99 | 66 | 2.0 | 1601 |
| **granite-embedding-97m-r2** | fp32 | 183 | 15.0 | 501.4 | **15.67** | 16.56 | 64 | 2.3 | 1386 |
| paraphrase-multilingual-MiniLM-L12-v2 | q8 | 205 | 16.4 | 510.9 | **15.97** | 17.47 | 63 | 1.5 | 716 |
| **multilingual-e5-small** | q8 | 207 | 18.0 | 518.5 | **16.20** | 18.30 | 62 | 2.4 | 714 |
| arctic-embed-m-v1.5 | q8 | 190 | 30.0 | 936.0 | **29.25** | 29.50 | 34 | 4.1 | 319 |
| gte-base | q8 | 190 | 30.8 | 999.6 | **31.24** | 34.63 | 32 | 2.5 | 318 |
| arctic-embed-m-v1.5 | fp32 | 190 | 28.3 | 1000.8 | **31.27** | 31.40 | 32 | 5.6 | 694 |
| bge-base-en-v1.5 | q8 | 190 | 31.0 | 1001.5 | **31.30** | 32.86 | 32 | 4.5 | 317 |
| gte-base | fp32 | 190 | 27.9 | 1038.3 | **32.45** | 35.89 | 31 | 5.6 | 693 |
| bge-base-en-v1.5 | fp32 | 190 | 26.3 | 1069.7 | **33.43** | 36.81 | 30 | 5.8 | 692 |
| multilingual-e5-base | q8 | 207 | 34.3 | 1077.4 | **33.67** | 36.24 | 30 | 3.2 | 1103 |
| multilingual-e5-base | fp32 | 207 | 34.4 | 1145.3 | **35.79** | 38.48 | 28 | 5.6 | **2959** |
| arctic-embed-m-v2.0 | q8 | 205 | 39.6 | 1297.3 | **40.54** | 40.38 | 25 | 3.9 | 1161 |
| jina-embeddings-v2-base-es | q8 | 189 | 46.7 | 1298.3 | **40.57** | 42.99 | 25 | 3.1 | 456 |
| embeddinggemma-300m | fp32 | 190 | 39.9 | 1315.8 | **41.12** | 41.57 | 24 | 7.9 | 850 |
| nomic-embed-text-v1.5 | fp32 | 194 | 42.1 | 1322.5 | **41.33** | 44.36 | 24 | 7.6 | 807 |
| nomic-embed-text-v1.5 | q8 | 194 | 42.7 | 1356.7 | **42.40** | 45.49 | 24 | 4.3 | 409 |
| embeddinggemma-300m | q8 | 190 | 69.1 | 1382.9 | **43.22** | 43.03 | 23 | **41.9** | 437 |
| jina-embeddings-v2-base-es | fp32 | 189 | 37.1 | 1397.2 | **43.66** | 45.61 | 23 | 7.1 | 1351 |
| granite-embedding-311m-r2 | fp32 | 183 | 46.5 | 1522.2 | **47.57** | 50.05 | 21 | 7.4 | **3959** |
| mxbai-embed-large-v1 | q8 | 190 | 90.3 | 2747.1 | **85.85** | 89.08 | 12 | 12.6 | 744 |
| arctic-embed-l-v2.0 | q8 | 205 | 108.3 | 3023.3 | **94.48** | 94.00 | 11 | 8.3 | 1842 |
| multilingual-e5-large | q8 | 207 | 101.9 | 3180.6 | **99.39** | 100.82 | 10 | 9.3 | 1838 |
| Qwen3-Embedding-0.6B | q8 | 184 | 157.3 | 4926.6 | **153.96** | 156.80 | 6 | 26.7 | 1573 |

Six things in that table are worth saying out loud.

**The range is 24 times wide.** `all-MiniLM-L6-v2` costs 6.4 ms per chunk and
`Qwen3-Embedding-0.6B` costs 154 ms. For a corpus of 10,000 chunks that is 64
seconds against 26 minutes, on this laptop, for one ingest.

**q8 buys no speed on this CPU.** On the small models it is a little *slower*
than fp32 — `bge-small` 14.21 ms against 12.98, `arctic-embed-s` 13.89 against
13.05. On the base models it is a little faster — `bge-base` 31.30 against
33.43. The two dtypes are within a few per cent of each other either way. This
repeats what #3 found on the vision side. Buy q8 for its download size and its
memory, never for its speed.

**Pooling in JavaScript costs 5 to 25 %.** The `embed` column is the `forward`
column plus reading the hidden state out of the tensor and averaging it in JS.
For `all-MiniLM-L6-v2` q8 that is 6.92 ms against 8.68 ms — a quarter more. The
models whose ONNX pools inside the graph and returns `sentence_embedding`
(`arctic-embed-m-v1.5`, `arctic-embed-m-v2.0`, `embeddinggemma`) pay almost
nothing, because there is no hidden state to read.

**Memory is not the download size.** `multilingual-e5-base` at fp32 holds
**2959 MB** resident, and `granite-embedding-311m-r2` at fp32 holds **3959 MB**,
because ONNX Runtime keeps its arena beside the weights. `multilingual-e5-small`
at fp32 already costs 1601 MB, five times its 470 MB file, for a 384-dimension
model. On a laptop that runs an editor and a browser, this is a real number.

**A short query is cheap for almost everything.** Under 3 ms for every small
model. The exception is stark: `embeddinggemma-300m` at q8 takes **41.9 ms** for
a short query, against 7.9 ms at fp32 — five times slower on a 6-token input,
while the batch-32 numbers of the two dtypes are the same. #6 counts on the query
embedding being cheap; this one is not.

**Batch 32 does not pay.** For `all-MiniLM-L6-v2` q8 the per-chunk cost went from
6.6 ms at batch 1 to 6.92 ms at batch 32. ONNX Runtime already uses all ten cores
for one chunk, so batching only adds padding waste. #3 found the same on images.

### 6.3 The `all-MiniLM-L6-v2` baseline from #3, measured again

Report #3 measured `all-MiniLM-L6-v2` q8 at **4.4 ms per chunk** in a batch of
32, with `@huggingface/transformers` 4.2.0. `baseline.mjs` runs the same shape of
work. It is a separate script with no pooling in it, so it times the same thing
#3 timed. Both library versions are installed side by side, so the only thing
that changes is the library.

| Library | tokens per chunk | batch 1 | batch 8 | batch 32 | **ms per chunk at batch 32** | chunks per second |
| --- | --- | --- | --- | --- | --- | --- |
| 4.2.0 (the version #3 used) | 156 | 7.1 ms | 44.2 ms | 173.5 ms | **5.42 ms** | 184 |
| 4.3.0 (current) | 156 | 5.2 ms | 40.2 ms | 173.0 ms | **5.41 ms** | 185 |

**The two versions are the same, to within noise.** The baseline reproduces at
5.4 ms per chunk, not 4.4 ms — about 23 % slower than #3 recorded. The library
version is not the cause. The remaining difference is the machine state and the
exact text, so treat 4.4 and 5.4 as the same measurement taken twice, and
compare models inside one table rather than across reports.

### 6.4 How far the long windows really go

`longwall.mjs` builds `input_ids` by hand, so the sequence can be pushed past
the length of any real test text. It stops as soon as one step costs more than
12 seconds, because the next step costs about four times as much again.

**`Snowflake/snowflake-arctic-embed-m-v2.0` — the wall is at 8192, not 32768.**

| tokens | result |
| --- | --- |
| 2048 | ok in **779 ms** |
| 4096 | ok in **2,343 ms** |
| 8192 | ok in **8,803 ms** |
| **8193** | **crash** |

```
Non-zero status code returned while running Gather node.
Name:'/0/auto_model/embeddings/word_embeddings/Gather'
```

This is a trap of the same family as the SigLIP2 one in #3, turned inside out.
Its tokenizer says the limit is **32,768**. Its graph dies at **8,193**. So
`tokenizer(text, { truncation: true })` clips at 32,768, hands the graph a legal
sequence by the tokenizer's rule, and the graph stops. **You must pass
`max_length: 8192` yourself.**

Read the timings as well. 8,192 tokens cost **8.8 seconds** for one chunk. A
long window exists; it is not affordable.

**`onnx-community/embeddinggemma-300m-ONNX` — the wall is at 2048, and it is
honest about it.** 2,048 tokens took 1,021 ms. 4,096 crashed in the rotary
embedding:

```
Non-zero status code returned while running RotaryEmbedding node.
Name:'/model/layers.0/attn/k_rotary/RotaryEmbedding'
```

Its tokenizer also says 2,048, so `truncation: true` protects it.

**Three models were abandoned, and the reason is itself a measurement.** At
8,192 tokens `nomic-embed-text-v1.5` q8 reached **5.4 GB** resident,
`snowflake-arctic-embed-l-v2.0` q8 reached **12.7 GB** and
`jina-embeddings-v2-base-es` q8 reached **13.2 GB**, and none of the three
returned inside the budget. On a 24 GB laptop, one 8,000-token chunk is not a
chunk; it is the whole machine. `granite-embedding-97m-multilingual-r2` and
`Qwen3-Embedding-0.6B` were stopped for the same reason at 16,384 and above.
Their results are missing from `out_longwall.jsonl` because the script prints
only when it finishes.

## 7. Dimensions, and whether Matryoshka truncation really works

Six models claim Matryoshka Representation Learning: `nomic-embed-text-v1.5`
(64…768), `arctic-embed-m-v1.5` and `arctic-embed-l-v2.0` (256),
`embeddinggemma-300m` (128/256/512) and the two granite R2 models (128…768). The probe cuts the vector,
renormalises it, and re-ranks the twenty passages of section 8. Every other
model is cut the same way as a control, to show what a plain cut costs.

`same top-1` counts, out of twenty queries, how often the cut vector still puts
the same passage first as the full vector. `shift` is the mean absolute change
in cosine over all 400 query-passage pairs.

| Model | claims MRL | 64 | 128 | 256 | 512 | full |
| --- | --- | --- | --- | --- | --- | --- |
| all-MiniLM-L6-v2 (384) | no | 14/20 | 15/20 | 18/20 | — | 20/20 |
| bge-small (384) | no | 14/20 | 16/20 | 18/20 | — | 20/20 |
| gte-small (384) | no | 15/20 | 17/20 | 19/20 | — | 20/20 |
| gte-base (768) | no | 15/20 | 18/20 | 18/20 | 18/20 | 20/20 |
| e5-small-v2 (384) | no | 11/20 | 15/20 | 18/20 | — | 20/20 |
| multilingual-e5-small (384) | no | 16/20 | 19/20 | **20/20** | — | 20/20 |
| multilingual-e5-base (768) | no | 14/20 | 18/20 | 19/20 | **20/20** | 20/20 |
| multilingual-e5-large (1024) | no | 14/20 | 18/20 | **20/20** | **20/20** | 20/20 |
| jina-embeddings-v2-base-es (768) | no | 13/20 | 17/20 | 19/20 | **20/20** | 20/20 |
| **nomic-embed-text-v1.5 (768)** | **yes** | 18/20 | 18/20 | 16/20 | 18/20 | 20/20 |
| **arctic-embed-m-v1.5 (768)** | **yes, 256** | — | — | 19/20 | — | 20/20 |
| **arctic-embed-l-v2.0 (1024)** | **yes, 256** | — | — | 18/20 | — | 20/20 |
| **embeddinggemma-300m (768)** | **yes** | — | 18/20 | 18/20 | 19/20 | 20/20 |
| **granite-r2-97m (384)** | **yes** | — | 16/20 | 19/20 | — | 20/20 |
| **granite-r2-311m (768)** | **yes** | — | 19/20 | 19/20 | 19/20 | 20/20 |
| Qwen3-Embedding-0.6B (1024) | user-set | 13/20 | 16/20 | 19/20 | 18/20 | 20/20 |

Two honest readings of this table.

**Truncation works everywhere, and the claim adds nothing visible here.** At 256
dimensions every model keeps 16 to 20 of its twenty top-1 answers, whether it
claims Matryoshka or not. `multilingual-e5-small`, which claims nothing, is
perfect at 256. `nomic-embed-text-v1.5`, which claims 64 to 768, is worse at 256
(16/20) than at 64 (18/20). **Twenty passages cannot separate a trained
Matryoshka model from an untrained one.** The published numbers can — see
section 9 — but this probe cannot, and I will not pretend it does.

**No cut preserves the whole ranking.** `identical_ranking` was 0/20 at every
width below the full vector, for every model. The top-1 answer survives; the
order below it always moves. If the product ever shows more than the first row,
a cut vector changes what the user sees.

One number stands out, from the `mean_abs_score_shift` field of
`out_matryoshka.jsonl`: granite R2 at 97 M shifts its cosines by **0.35** on
average at 128 dimensions, ten times more than most models, while still keeping
16 of 20 top-1 answers. The scores move a long way; the order mostly does not. A `Floor`
constant tuned at 384 dimensions would be meaningless at 128.

## 8. Spanish and English — a probe, not a benchmark

Decision #7 established that the owner searches in Spanish, and that an
English-only vision model failed there. Most of this product is text, so the
same question must be asked of the text embedder. This section asks it by
measurement. **It is a probe. Twenty passages prove nothing about MTEB.**

### 8.1 The probe set

Ten facts. Each fact is written twice, once in Spanish and once in English, and
each fact has a query in each language. The queries never copy the words of
their passage. The facts come in confusable pairs — two about a home, two about
a vaccine, two about software structure, two about a bill, two about insurance —
so a model must separate near neighbours and not only find the topic.

Four separate retrieval tasks are scored, each one recall@1 over ten passages:

* **es→es** a Spanish query over the ten Spanish passages. **This is the owner's
  case.**
* **en→en** an English query over the ten English passages. The control.
* **es→en** a Spanish query over the ten English passages. Cross-language.
* **en→es** an English query over the ten Spanish passages.

A fifth number, **mixed**, ranks a Spanish query over all twenty passages at
once, which is what a real mixed-language corpus looks like.

### 8.2 Measured

| Model | dtype | dim | **es→es** | en→en | es→en | en→es | mixed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| all-MiniLM-L6-v2 | q8 | 384 | **7/10** | 10/10 | 5/10 | 2/10 | 7/10 |
| bge-small-en-v1.5 | fp32 | 384 | **7/10** | 10/10 | 3/10 | 5/10 | 7/10 |
| bge-base-en-v1.5 | fp32 | 768 | **8/10** | 10/10 | 6/10 | 5/10 | 8/10 |
| gte-small | fp32 | 384 | **8/10** | 10/10 | 3/10 | 5/10 | 8/10 |
| gte-base | fp32 | 768 | **9/10** | 10/10 | 6/10 | 7/10 | 9/10 |
| e5-small-v2 | fp32 | 384 | **6/10** | 10/10 | 5/10 | 6/10 | 6/10 |
| arctic-embed-s | fp32 | 384 | **7/10** | 10/10 | 5/10 | 5/10 | 7/10 |
| arctic-embed-m-v1.5 | fp32 | 768 | **6/10** | 10/10 | 7/10 | 8/10 | 6/10 |
| nomic-embed-text-v1.5 | fp32 | 768 | **7/10** | 10/10 | 5/10 | 7/10 | 7/10 |
| nomic-embed-text-v1.5 | q8 | 768 | **5/10** | 10/10 | 5/10 | 8/10 | 5/10 |
| mxbai-embed-large-v1 | q8 | 1024 | **6/10** | 10/10 | 5/10 | 7/10 | 6/10 |
| paraphrase-multilingual-MiniLM-L12-v2 | fp32 | 384 | **8/10** | 10/10 | 8/10 | 10/10 | 6/10 |
| Qwen3-Embedding-0.6B | q8 | 1024 | **9/10** | 10/10 | 9/10 | 9/10 | 7/10 |
| granite-embedding-311m-r2 | fp32 | 768 | **9/10** | 10/10 | 9/10 | 10/10 | 5/10 |
| **multilingual-e5-small** | fp32 | 384 | **10/10** | 10/10 | 8/10 | 10/10 | 10/10 |
| **multilingual-e5-small** | q8 | 384 | **10/10** | 10/10 | 9/10 | 10/10 | 10/10 |
| **multilingual-e5-base** | fp32 | 768 | **10/10** | 10/10 | 10/10 | 10/10 | 10/10 |
| **multilingual-e5-large** | q8 | 1024 | **10/10** | 10/10 | 10/10 | 10/10 | 10/10 |
| **arctic-embed-m-v2.0** | q8 | 768 | **10/10** | 10/10 | 10/10 | 10/10 | 9/10 |
| **arctic-embed-l-v2.0** | q8 | 1024 | **10/10** | 10/10 | 10/10 | 10/10 | 8/10 |
| **jina-embeddings-v2-base-es** | fp32 | 768 | **10/10** | 10/10 | 10/10 | 10/10 | 8/10 |
| **embeddinggemma-300m** | fp32 | 768 | **10/10** | 10/10 | 10/10 | 10/10 | 9/10 |
| **granite-embedding-97m-r2** | fp32 | 384 | **10/10** | 10/10 | 10/10 | 10/10 | 10/10 |

### 8.3 What the numbers say

**Every model scores 10/10 in English. None of the English-only models scores
10/10 in Spanish.** The split is clean, and the English-only column is the
control that proves the probe is not simply hard.

The failures are ordinary retrieval failures, not nonsense. `all-MiniLM-L6-v2`
in Spanish put the car-insurance passage above the mortgage passage for
"¿a cuánto está el interés del préstamo de la casa?", and put the flu passage
above the travel-insurance passage for "¿me devuelven el vuelo si anulo las
vacaciones?" — the right answer fell to rank 7. `bge-small` sent the right
answer to rank 9 on the same query. These are the two-in-ten and three-in-ten
misses a user would notice.

**Cross-language is where the English-only models collapse.** For an English
query over Spanish passages, `all-MiniLM-L6-v2` scored **2/10**. Its mean
reciprocal rank was 0.475, which means the right passage was usually second or
third, not first. This matters as soon as one corpus holds both languages, and
this report cannot say how often that happens in the owner's files.

**A similarity model is not a retrieval model.**
`paraphrase-multilingual-MiniLM-L12-v2` is perfect at en→es (10/10) and good at
es→es (8/10), but only **6/10** on the mixed pool. It is trained on parallel
sentence pairs, so it puts the English translation of a passage above the
Spanish original that the Spanish query asked for. Its own family says the
static multilingual sibling is "not intended for retrieval use cases". The same
warning applies here.

**The mixed pool separates the multilingual models from each other.**
`multilingual-e5` at every size, and `granite-r2-97m`, hold 10/10. `embeddinggemma`
and `arctic-m-v2.0` hold 9/10. `jina-v2-base-es` and `arctic-l-v2.0` drop to
8/10. `granite-r2-311m` drops to **5/10** — the bigger granite model is worse on
the mixed pool than the smaller one, because it ranks the English twin above the
Spanish original.

**Score spread differs by an order of magnitude.** The mean gap between the top
and the bottom of a twenty-passage list was 0.63 for `all-MiniLM-L6-v2` and
`jina-v2-base-es`, 0.30 for `bge-small`, and 0.17 for `gte-base` and
`multilingual-e5-small`. A `Floor` constant is not portable between models. #11
already fixed that the `Floor` is a gate and not a filter, but the number itself
will have to be found again for whichever model is chosen.

### 8.4 The prefix, and what forgetting it costs

Several of these models ask for a prefix: `query: ` / `passage: ` for the E5
family, `Represent this sentence for searching relevant passages: ` for BGE and
Arctic v1, `search_query: ` / `search_document: ` for Nomic,
`task: search result | query: ` for EmbeddingGemma, and an instruction line for
Qwen3. Every number in section 8.2 was measured **with** the prefix the model
card asks for.

`lang.mjs` takes a `noprefix` argument, which drops it. Measured on six models:

| Model | dtype | es→es with / without | en→en with / without | es→en with / without | mixed with / without |
| --- | --- | --- | --- | --- | --- |
| e5-small-v2 | fp32 | 6/10 → **7/10** | 10/10 → 10/10 | 5/10 → 5/10 | 6/10 → **7/10** |
| bge-small-en-v1.5 | fp32 | 7/10 → **8/10** | 10/10 → **9/10** | 3/10 → **4/10** | 7/10 → **8/10** |
| arctic-embed-s | fp32 | 7/10 → **6/10** | 10/10 → 10/10 | 5/10 → **2/10** | 7/10 → **6/10** |
| nomic-embed-text-v1.5 | fp32 | 7/10 → 7/10 | 10/10 → 10/10 | 5/10 → 5/10 | 7/10 → 7/10 |
| multilingual-e5-small | q8 | 10/10 → **9/10** | 10/10 → 10/10 | 9/10 → 9/10 | 10/10 → **9/10** |
| embeddinggemma-300m | q8 | 10/10 → 10/10 | 10/10 → 10/10 | 10/10 → 10/10 | 9/10 → **10/10** |

The prefix moves the answer, and it does not always move it the right way. It
helps `multilingual-e5-small` and `arctic-embed-s`, it does nothing for
`nomic-embed-text-v1.5`, and on `e5-small-v2`, `bge-small` and the mixed pool of
`embeddinggemma-300m` the **no-prefix** run scored higher. On twenty queries a difference
of one is noise, so read this as "the prefix is not free and is not obviously
worth it on a set this small", not as a result. The honest statement is that
prefixes must be tested on the real corpus, and that whichever choice is made,
the ingest and the query path must make the same one.

## 9. Published retrieval quality — not measured here

Everything in this section comes from a model card or a paper. **None of it was
measured on this machine, and none of it is this corpus.** The older cards report
the MTEB v1 56-task average. Only EmbeddingGemma, Qwen3 and granite R2 report the
v2 suites, so the two families of numbers are not comparable with each other.

### 9.1 English

| Model | params | MTEB v1 average (56) | MTEB Retrieval (15) |
| --- | --- | --- | --- |
| all-MiniLM-L6-v2 | 22.7 M | not published | not published |
| gte-small | 33.4 M | 61.36 | 49.46 |
| bge-small-en-v1.5 | 33.4 M | 62.17 | 51.68 |
| e5-small-v2 | 33.4 M | 59.93 | 49.04 |
| arctic-embed-s | 33.2 M | — | 51.98 |
| gte-base | 109.5 M | 62.39 | 51.14 |
| bge-base-en-v1.5 | 109.5 M | 63.55 | 53.25 |
| arctic-embed-m-v1.5 | 108.9 M | — | 55.14 (54.2 at 256 dims) |
| nomic-embed-text-v1.5 | 136.7 M | 62.28 at 768; 61.96 at 512; 61.04 at 256; 59.34 at 128; 56.10 at 64 | not published |
| mxbai-embed-large-v1 | 335.1 M | **64.68** | **54.39** |

`all-MiniLM-L6-v2` publishes no MTEB number of its own. The Sentence Transformers
static-embedding blog measures it at **0.5623 NanoBEIR NDCG@10**, as the dense
baseline it compares against.

### 9.2 Multilingual, and the few numbers that separate Spanish

| Model | params | benchmark | score |
| --- | --- | --- | --- |
| multilingual-e5-small | 117.7 M | MIRACL dev nDCG@10 | 60.8 |
| multilingual-e5-base | 278.0 M | MIRACL dev nDCG@10 | 62.3 |
| multilingual-e5-large | 559.9 M | MIRACL dev nDCG@10 | 66.5 |
| arctic-embed-m-v2.0 | 305.4 M | BEIR (15) / MIRACL (4) | 55.4 / 55.2 |
| arctic-embed-l-v2.0 | 567.8 M | BEIR (15) / MIRACL (4) | 55.6 / 55.8 |
| embeddinggemma-300m | 302.9 M | MTEB Multilingual v2, mean(Task) | 61.15 at 768; 60.71 at 512; 59.68 at 256; 58.23 at 128 |
| Qwen3-Embedding-0.6B | 595.8 M | MTEB Multilingual, mean(Task) | **64.33** |
| granite-embedding-97m-r2 | 97.4 M | MTEB Multilingual Retrieval (18) | 60.3 |
| granite-embedding-311m-r2 | 311.7 M | MTEB Multilingual Retrieval (18) | **65.2** |
| granite-embedding-107m-multilingual (R1) | 107.0 M | **MTEB Spanish (2)** | **48.7** |
| granite-embedding-278m-multilingual (R1) | 278.0 M | **MTEB Spanish (2)** | **52.6** |
| jina-embeddings-v3 | 572.3 M | Spanish task average | 47.75 |
| bge-m3 (dense) | ~568 M | **MIRACL es** | **56.1** |
| multilingual-e5-large | 559.9 M | **MIRACL es** (from the BGE-M3 paper) | **52.9** |
| paraphrase-multilingual-MiniLM-L12-v2 | 117.7 M | none published | — |
| jina-embeddings-v2-base-es | 160.9 M | **none published** — the card still says `<!-- TODO: add evaluation results here -->` | — |

**Only five Spanish-separated numbers exist in public**, and they come from three
different papers with three different task sets. IBM publishes MTEB Spanish for
the R1 granite pair but not for R2. No vendor publishes a Spanish split for
EmbeddingGemma, Qwen3, arctic v2 or `jina-embeddings-v2-base-es`. Section 8 is
the only Spanish evidence in this report that was measured at all.

### 9.3 The models the cards call English-only, in their own words

* **gte-small / gte-base**: "This model exclusively caters to English texts, and
  any lengthy texts will be truncated to a maximum of 512 tokens."
* **e5-small-v2**: "This model only works for English texts."
* **jina-embeddings-v2-base-en**: "an English, monolingual embedding model".
* **all-MiniLM-L6-v2**, **nomic-embed-text-v1.5**, **mxbai-embed-large-v1**:
  `language: en` in the card front matter.
* **bge-small/base-en-v1.5**: the card's own model list marks them "English".
* **arctic-embed-s / m-v1.5**: **no explicit statement either way.** There is no
  `language` tag on the repository. The evidence is indirect: English-only
  benchmarks, a `bert-base-uncased` lineage, and Snowflake's own v2 release note
  that v2 is the generation built "with multilingual workloads in mind". Section
  8 measures the consequence; the card does not state it.

## 10. Quantisation: is q8 only smaller, or also worse?

`quant.mjs` loads the same model twice, at fp32 and at q8, and compares the two.
`long cos` is the cosine between the two vectors of the same 900-character text.
`same top-1` counts, out of twenty queries, how often both versions put the same
passage first over the twenty-passage pool.

| Model | dim | long cos | same top-1 | identical ranking | recall@1 fp32 | recall@1 q8 |
| --- | --- | --- | --- | --- | --- | --- |
| all-MiniLM-L6-v2 | 384 | 0.9948 | 20/20 | 1/20 | 17/20 | 17/20 |
| bge-small-en-v1.5 | 384 | 0.9979 | 20/20 | 0/20 | 16/20 | 16/20 |
| bge-base-en-v1.5 | 768 | 0.9797 | 19/20 | 0/20 | 18/20 | **17/20** |
| gte-small | 384 | 0.9986 | 20/20 | 0/20 | 18/20 | 18/20 |
| gte-base | 768 | 0.9905 | 20/20 | 0/20 | 19/20 | 19/20 |
| e5-small-v2 | 384 | 0.9976 | 19/20 | 1/20 | 16/20 | 17/20 |
| multilingual-e5-small | 384 | **0.9991** | 20/20 | 2/20 | 20/20 | 20/20 |
| multilingual-e5-base | 768 | 0.9878 | 20/20 | 0/20 | 20/20 | 20/20 |
| arctic-embed-s | 384 | 0.9857 | 20/20 | 0/20 | 17/20 | 17/20 |
| arctic-embed-m-v1.5 | 768 | 0.9942 | 19/20 | 0/20 | 16/20 | 16/20 |
| paraphrase-multilingual-MiniLM-L12-v2 | 384 | 0.9968 | 19/20 | 8/20 | 12/20 | **11/20** |
| embeddinggemma-300m | 768 | 0.9820 | 20/20 | 0/20 | 18/20 | 18/20 |
| **nomic-embed-text-v1.5** | 768 | **0.9638** | 18/20 | 0/20 | 17/20 | **15/20** |
| **jina-embeddings-v2-base-es** | 768 | **0.9478** | 20/20 | 0/20 | 14/20 | 14/20 |

**No q8 export here is broken in the way JinaCLIP v1's was.** #3 found a q8 text
tower that crashed above 16 tokens. Nothing of that kind happened: every q8
export ran to its full window and returned finite numbers.

**One model does change its answers.** `nomic-embed-text-v1.5` agrees with its
own fp32 vector at only 0.9638, loses two of twenty top-1 answers, and — the
number that matters here — drops from **7/10 to 5/10 on the Spanish task** of
section 8. That is the same shape of fault #7 recorded for SigLIP2 q8: not a
crash, a worse ranking. `jina-embeddings-v2-base-es` has the lowest agreement of
all, 0.9478, but its ranking survived on this small set, so it is a warning and
not a result.

**The full ranking never survives quantisation.** `identical ranking` is 0 or
close to 0 for almost every model. The first row is stable; the order below it
is not. This is the same shape of result as section 7.

And q8 buys no speed on this CPU. See section 6. What it buys is a smaller
download and less memory.

## 11. What I did not test

State these plainly at the grilling.

1. **Retrieval quality on a real corpus.** Section 8 is twenty passages that I
   wrote. It is a probe. It separates English-only from multilingual, and that
   is all it is fit for. It cannot rank two multilingual models against each
   other, and it says nothing about PDFs, tables, invoices or code.
2. **Matryoshka against its own claim.** Section 7 shows that a plain cut works
   about as well on models that do not claim MRL. With twenty passages this can
   not be otherwise. The published numbers in 9.1 for Nomic and EmbeddingGemma
   are the only real evidence on this point, and they are vendor self-reports.
3. **The window above 4,096 tokens on most long-context models.** Section 6.4
   found the wall for `arctic-embed-m-v2.0` and `embeddinggemma-300m` only.
   `nomic-embed-text-v1.5`, `arctic-embed-l-v2.0`, `jina-embeddings-v2-base-es`,
   `granite-embedding-97m-r2` and `Qwen3-Embedding-0.6B` were stopped on memory
   and time, so their real ceiling is **unknown**. And the input was synthetic
   token ids, so nothing here says whether a long chunk gives a *good* vector,
   only whether the graph survives it.
4. **fp16 and q4.** Only fp32 and q8 were run. Most repositories also ship
   `fp16`, `q4`, `q4f16` and `bnb4`. `q4` is often **larger** than `q8` on these
   graphs, which is worth knowing before anyone reaches for it.
5. **`granite-embedding-97m/311m-r2` at int8.** Their int8 file is named
   `model_quint8_avx2.onnx`. `@huggingface/transformers` asks for
   `model_quantized.onnx`, so `dtype: 'q8'` returns a 404. Only fp32 was
   measured. The file exists and could be loaded with a custom `model_file_name`,
   which I did not try.
6. **`bge-m3`.** It is MIT, multilingual, 8192 tokens, and it has an official
   ONNX export. It was not run: 2.27 GB of fp32 external data, and no
   `model_quantized.onnx`. Its published MIRACL Spanish score, 56.1, is the best
   Spanish number found anywhere in section 9.
7. **`nomic-embed-text-v2-moe`** has no ONNX export at all, so it was not tried.
8. **The static embedding models, end to end.** Section 3 proves the ONNX graph
   runs under `onnxruntime-node`. I did not then write the tokenizer wiring and
   measure their speed or their quality. The published claim is ~125x faster than
   `multilingual-e5-small` on CPU, and the multilingual one is explicitly "not
   intended for retrieval use cases".
9. **Batch sizes above 32, and concurrency.** One process, one batch at a time.
10. **Every speed number is from one Apple M5 laptop.** Re-run
    `docs/research/embedlab/speed.mjs` on the target hardware.
11. **The MTEB leaderboard itself.** Its table is rendered in the browser, so it
    returns no data to a fetch. Every published score in section 9 comes from a
    model card or a paper, not from the live leaderboard.
12. **Chunking.** This report gives the token ceiling of each model. It does not
    say what chunk size retrieves best.

## 12. Sources

### Library
* Transformers.js docs — https://huggingface.co/docs/transformers.js/index
* Server-side inference in Node.js — https://huggingface.co/docs/transformers.js/en/tutorials/node
* npm package metadata — https://registry.npmjs.org/@huggingface/transformers
* Architecture registry — https://github.com/huggingface/transformers.js/blob/main/packages/transformers/src/models/registry.js

### Model cards
* https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 · https://huggingface.co/Xenova/all-MiniLM-L6-v2
* https://huggingface.co/BAAI/bge-small-en-v1.5 · https://huggingface.co/BAAI/bge-base-en-v1.5
* https://huggingface.co/thenlper/gte-small · https://huggingface.co/thenlper/gte-base
* https://huggingface.co/intfloat/e5-small-v2
* https://huggingface.co/intfloat/multilingual-e5-small · .../multilingual-e5-base · .../multilingual-e5-large
* https://huggingface.co/nomic-ai/nomic-embed-text-v1.5 · https://huggingface.co/nomic-ai/nomic-embed-text-v2-moe
* https://huggingface.co/Snowflake/snowflake-arctic-embed-s · .../snowflake-arctic-embed-m-v1.5 · .../snowflake-arctic-embed-m-v2.0 · .../snowflake-arctic-embed-l-v2.0
* https://huggingface.co/jinaai/jina-embeddings-v2-base-en · .../jina-embeddings-v2-small-en · .../jina-embeddings-v2-base-es · .../jina-embeddings-v3
* https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
* https://huggingface.co/sentence-transformers/static-retrieval-mrl-en-v1 · .../static-similarity-mrl-multilingual-v1
* https://huggingface.co/google/embeddinggemma-300m · https://huggingface.co/onnx-community/embeddinggemma-300m-ONNX
* https://huggingface.co/Qwen/Qwen3-Embedding-0.6B · https://huggingface.co/onnx-community/Qwen3-Embedding-0.6B-ONNX
* https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1
* https://huggingface.co/ibm-granite/granite-embedding-97m-multilingual-r2 · .../granite-embedding-311m-multilingual-r2 · .../granite-embedding-107m-multilingual · .../granite-embedding-278m-multilingual
* https://huggingface.co/BAAI/bge-m3 · https://huggingface.co/Alibaba-NLP/gte-multilingual-base · https://huggingface.co/minishlab/potion-multilingual-128M

### Papers and posts
* Multilingual E5 technical report — https://arxiv.org/abs/2402.05672
* BGE-M3 — https://arxiv.org/html/2402.03216v4
* jina-embeddings-v3 — https://arxiv.org/html/2409.10173v3
* Arctic Embed 2.0 — https://arxiv.org/abs/2412.04506
* Static embedding models, Sentence Transformers — https://huggingface.co/blog/static-embeddings

### Licences
* CC BY-NC 4.0 legal code — https://creativecommons.org/licenses/by-nc/4.0/legalcode.en
* Gemma Terms of Use — https://ai.google.dev/gemma/terms
* Gemma Prohibited Use Policy — https://ai.google.dev/gemma/prohibited_use_policy

### Leaderboards
* MTEB leaderboard — https://huggingface.co/spaces/mteb/leaderboard (the table is
  rendered in the browser and returns no data to a fetch)
