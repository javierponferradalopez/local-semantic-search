# Research #3 — Text and images in one search with Transformers.js

Date: 2026-09-12. Facts only. This report does not choose an approach.

## 0. Summary of what was verified

Everything in the "measured" tables below was run locally on this machine.
Everything else carries a source URL in section 8.

Test machine and versions:

| Item | Value |
| --- | --- |
| CPU | Apple M5, 10 cores |
| OS | macOS (Darwin 25.6.0) |
| Node | v24.11.0 |
| `@huggingface/transformers` | **4.2.0** (latest on npm, published 2026-04-22) |
| `onnxruntime-node` | 1.24.3 (a direct dependency of the above) |
| `sharp` | ^0.34.5 (a direct dependency; it decodes images in Node) |
| Execution provider | CPU |

Scripts are in `scratchpad/bench/` (`bench.mjs`, `bench2.mjs`, `trunc.mjs`,
`jprobe.mjs`, `gap.mjs`, `mobile.mjs`).

## 1. Does Transformers.js run multimodal models in Node?

Yes. This is not a browser-only library.

* The npm package declares a Node export condition. `package.json` of
  `@huggingface/transformers@4.2.0` maps `exports.node.import` to
  `./dist/transformers.node.mjs` and `exports.node.require` to
  `./dist/transformers.node.cjs`.
* It depends on `onnxruntime-node@1.24.3`. In Node the models run through the
  native ONNX Runtime, not through WASM.
* It depends on `sharp`. In Node, `RawImage.read('file.jpg')` decodes with
  `sharp`; there is no `<canvas>` need.
* Hugging Face publishes an official Node tutorial, "Server-side Inference in
  Node.js". It covers ESM and CommonJS, and `env.cacheDir` /
  `env.localModelPath` / `env.allowRemoteModels`.
* Models cache to `./node_modules/@huggingface/transformers/.cache/` by default.
  Set `env.cacheDir` to move that.

I loaded and ran CLIP, SigLIP, SigLIP2, JinaCLIP and MobileCLIP in Node with
this package. All five produced embeddings. See section 4.

### Supported architectures, read from the installed source

`node_modules/@huggingface/transformers/src/models/` contains 226 model
directories. The image-text ones are:

`clip`, `chinese_clip`, `siglip`, `jina_clip`, `clipseg`, `owlvit`, `owlv2`,
`groupvit`, `nomic_bert` (text only).

Note two things.

* **`jina_clip` is a first-class architecture.** `src/models/jina_clip/`
  holds `modeling_jina_clip.js`, `processing_jina_clip.js` and
  `image_processing_jina_clip.js`, and exports `JinaCLIPModel`,
  `JinaCLIPTextModel`, `JinaCLIPVisionModel`.
* **There is no `siglip2` directory, and none is needed.** The SigLIP2
  checkpoints declare `"model_type": "siglip"` in `config.json`, so the
  `siglip` classes load them. Verified against
  `google/siglip2-base-patch16-224/config.json` and
  `onnx-community/siglip2-base-patch16-224-ONNX/config.json`.
* **ColPali, ColQwen, VLM2Vec and similar late-interaction page retrievers are
  not in the architecture list.** They cannot be loaded by
  `@huggingface/transformers` 4.2.0.

## 2. Candidate models

"Node support" below means: I loaded it and got a vector out, on this machine,
with `@huggingface/transformers@4.2.0`.

| Model id | Task | Text dim | Image dim | Text token limit | ONNX on the Hub | Node support | Licence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Xenova/clip-vit-base-patch32` | text+image, one space | 512 | 512 | **77** (hard) | fp32, fp16, q8/int8/uint8, q4, q4f16, bnb4; split `text_model` + `vision_model` + fused `model` | verified | MIT (OpenAI CLIP) |
| `Xenova/clip-vit-base-patch16` | text+image, one space | 512 | 512 | **77** (hard) | same set | verified | MIT |
| `Xenova/clip-vit-large-patch14` | text+image, one space | 768 | 768 | **77** (hard) | same set | not run | MIT |
| `Xenova/siglip-base-patch16-224` | text+image, one space | 768 | 768 | **64** (hard) | same set | verified | Apache-2.0 (google) |
| `onnx-community/siglip2-base-patch16-224-ONNX` | text+image, one space | 768 | 768 | **64** (hard) | same set | verified | Apache-2.0 (google) |
| `jinaai/jina-clip-v1` | text+image, one space | 768 | 768 | **8192** | `text_model` + `vision_model` in fp32, fp16, int8/q8/uint8, q4, bnb4. **No fused `model.onnx`** | verified (fp32 text only — see 4.4) | **Apache-2.0** |
| `jinaai/jina-clip-v2` | text+image, one space | 1024 (Matryoshka down to 64) | 1024 | **8192** | fused `model.onnx` + 3.45 GB `model.onnx_data`; also fp16, q8, q4, q4f16, bnb4. **No split text/vision files** | not run (size) | **CC BY-NC 4.0 — non-commercial** |
| `Xenova/mobileclip_s0` | text+image, one space | 512 | 512 | **77**, and the text ONNX needs a **fixed 77-length input** | split text/vision, fp32/fp16/int8/q4/bnb4 | verified, with a caveat (see 4.5) | Apple ML research licence |
| `Xenova/all-MiniLM-L6-v2` | text only | 384 | — | 512 (256 trained) | fp32, fp16, q8, q4, bnb4 | verified | Apache-2.0 |

Other `transformers.js`-tagged image-text repos on the Hub, by 30-day
downloads: `Marqo/marqo-fashionSigLIP` (365k), `Marqo/marqo-fashionCLIP` (24k),
`Xenova/chinese-clip-*`, `onnx-community/CLIP-ViT-B-32-laion2B-s34B-b79K-ONNX`,
`onnx-community/TinyCLIP-ViT-8M-16-Text-3M-YFCC15M-ONNX`,
`Xenova/mobileclip_s1/s2/b/blt`, `Xenova/siglip-base-patch16-256/384/512`.
The Marqo ones are fashion-domain models, not general.

`onnx-community` publishes 16 SigLIP2 ONNX repos: base patch16 at 224/256/384/512,
base patch32-256, large patch16 at 256/384/512, giant-opt at 256/384,
so400m patch14 at 224/384 and patch16 at 256/384/512, and `-naflex`.

### ONNX download sizes (bytes from the Hub API)

| Repo | fp32 text | fp32 vision | q8 text | q8 vision |
| --- | --- | --- | --- | --- |
| `Xenova/clip-vit-base-patch32` | 254.1 MB | 351.7 MB | 64.5 MB | 89.1 MB |
| `Xenova/siglip-base-patch16-224` | 441.3 MB | 371.8 MB | 111.5 MB | 99.5 MB |
| `onnx-community/siglip2-base-patch16-224-ONNX` | 1129.5 MB | 371.8 MB | 283.4 MB | 94.6 MB |
| `jinaai/jina-clip-v1` | 547.5 MB | 343.9 MB | 138.1 MB | 87.9 MB |
| `Xenova/mobileclip_s0` | 169.8 MB | 45.5 MB | 42.8 MB | 11.8 MB |
| `Xenova/all-MiniLM-L6-v2` | 90.4 MB (single) | — | 23.0 MB | — |
| `jinaai/jina-clip-v2` | fused 3453.6 MB | (same file) | fused 874.4 MB | (same file) |

SigLIP2's text tower is large because its Gemma tokenizer has a 256,000-token
vocabulary (`vocab_size: 256000` in `text_config`), against 32,000 for SigLIP1.

## 3. The token limit, and how badly it hurts

### 3.1 The numbers, verified

| Model | `tokenizer.model_max_length` | Real ONNX limit | Evidence |
| --- | --- | --- | --- |
| CLIP (all variants) | 77 | 77 | `max_position_embeddings: 77` in `text_config` |
| SigLIP | 64 | 64 | `SiglipTextConfig.max_position_embeddings` defaults to **64**; `SiglipTokenizer.model_max_length` defaults to **64** |
| SigLIP2 | **not set** (sentinel 1e30) | 64 | runtime error, quoted below |
| JinaCLIP v1 | 8192 | 8192, in fp32 | probed, see 4.4 |
| all-MiniLM-L6-v2 | 512 | 512 | config |

### 3.2 Over-long text does not degrade. It crashes.

Feeding a 199-token paragraph to `Xenova/clip-vit-base-patch32` text ONNX:

```
Error: Non-zero status code returned while running Add node.
Name:'/text_model/embeddings/Add' ...
Attempting to broadcast an axis by a dimension other than 1.
```

Feeding a 181-token paragraph to SigLIP2 text ONNX gives the same class of
error, and it names the limit:

```
Attempting to broadcast an axis by a dimension other than 1. 64 by 181
```

This is the proof that SigLIP2's text position table is 64 wide.

### 3.3 A trap: SigLIP2's tokenizer will not truncate for you

`onnx-community/siglip2-base-patch16-224-ONNX/tokenizer_config.json` has
`model_max_length: 1000000000000000019884624838656` and
`tokenizer_class: GemmaTokenizer`. Because no real limit is set,
`tokenizer(text, { truncation: true })` returns the full sequence and the model
then crashes. You must pass `max_length: 64` yourself.

CLIP's tokenizer does carry `model_max_length: 77`, so `truncation: true` works.
Measured on a 128-token paragraph with CLIP:

```
{}                                         -> len 128
{"truncation":true}                        -> len 77
{"truncation":true,"max_length":77}        -> len 77
{"padding":"max_length","truncation":true} -> len 77
```

### 3.4 How much text is lost

Measured with the real tokenizers on the same ordinary technical
paragraph: 652 characters, 104 words.

| Model | tokens produced | tokens kept | text discarded |
| --- | --- | --- | --- |
| CLIP | 128 | 77 | **40 %** |
| SigLIP | 132 | 64 | **52 %** |
| SigLIP2 | 122 | 64 | **48 %** |
| JinaCLIP v1 | 130 | 130 | 0 % |
| all-MiniLM-L6-v2 | 130 | 130 | 0 % |

A longer 900-character chunk tokenised to 199 CLIP tokens. CLIP keeps 77, so it
drops about 61 %. In short: a CLIP or SigLIP text encoder can hold roughly
**one or two sentences**, not a paragraph.

### 3.5 A second effect: the retained part is also weakened

With `Xenova/clip-vit-base-patch32`, I embedded a paragraph truncated to 77
tokens, then embedded its first 40 words and its last 40 words on their own.

```
cos(truncated paragraph, first 40 words) = 0.6865
cos(truncated paragraph, last 40 words)  = 0.7064
```

The truncated vector is not close to the part it actually saw. A CLIP text
vector of a dense paragraph is a blurred average, not a faithful summary.
(One sample; treat as indicative, not as a benchmark.)

## 4. Measured speed on CPU

Method. Warm up, then time 3 to 6 runs, report the median in milliseconds.
"Image" includes the image processor (resize + normalise) but not JPEG decode.
JPEG decode with `sharp` measured separately: **median 3.1 ms** per COCO-sized
JPEG. Image preprocessing alone: **median 2.2 to 2.7 ms**. Test images are four
COCO val2017 JPEGs, 130 KB to 336 KB.

### 4.1 Image embedding, per image

| Model | dtype | batch 1 (median) | batch 4 (median) | per image in a batch of 4 |
| --- | --- | --- | --- | --- |
| CLIP ViT-B/32 | fp32 | **14.9 ms** | 51.3 ms | 12.8 ms |
| CLIP ViT-B/32 | q8 | **13.5 ms** | 46.0 ms | 11.5 ms |
| CLIP ViT-B/16 | q8 | 39.9 ms | 149.8 ms | 37.5 ms |
| SigLIP base/16-224 | fp32 | 38.5 ms | 137.8 ms | 34.5 ms |
| SigLIP2 base/16-224 | q8 | 39.8 ms | 156.4 ms | 39.1 ms |
| JinaCLIP v1 vision | q8 | 45.4 ms | 165.7 ms | 41.4 ms |
| MobileCLIP-S0 | fp32 | 32.3 ms | 111.4 ms | 27.9 ms |
| MobileCLIP-S0 | q8 vision | 32.5 ms | 109.8 ms | 27.5 ms |

Add ~3 ms for JPEG decode. So end to end, **CLIP ViT-B/32 costs about 17 ms per
image**, and a patch16 model about 42 ms.

Batching gives only a small win (about 15 %). ONNX Runtime already uses all
cores for one image.

Quantisation to q8 barely changes speed on this CPU. Its value is download size
and memory, not latency.

**MobileCLIP-S0 was slower than CLIP ViT-B/32 here** (32 ms against 14 ms),
even though it is the smaller model. Its speed claims come from Apple's CoreML
and GPU measurements, not from `onnxruntime-node` on a CPU.

### 4.2 Text embedding, per chunk

Chunk used: one 130-token paragraph, truncated per model.

| Model | dtype | batch 1 (median) | batch 8 (median) | per chunk at batch 8 |
| --- | --- | --- | --- | --- |
| all-MiniLM-L6-v2 (384d) | q8 | **5.1 ms** | 35.8 ms | 4.5 ms |
| all-MiniLM-L6-v2, batch 32 | q8 | — | 139.8 ms | **4.4 ms** |
| CLIP ViT-B/32 text (77 tok) | fp32 | 9.2 ms | 57.4 ms | 7.2 ms |
| CLIP ViT-B/32 text (77 tok) | q8 | 7.5 ms | 54.8 ms | 6.9 ms |
| CLIP ViT-B/32 text, short query | q8 | **1.5 ms** | — | — |
| SigLIP text (64 tok) | fp32 | 15.8 ms | 110.5 ms | 13.8 ms |
| SigLIP2 text (64 tok) | q8 | 11.0 ms | 96.1 ms | 12.0 ms |
| JinaCLIP v1 text (130 tok) | fp32 | **35.1 ms** | 259.4 ms | 32.4 ms |
| JinaCLIP v1 text (3842 tok) | fp32 | **3368.9 ms** | — | — |

Read the last row carefully. JinaCLIP v1 can take 8192 tokens, but attention is
quadratic. A 3842-token input took **3.4 seconds** on this CPU. Long context is
available; it is not cheap.

Throughput estimates from the medians: about **225 chunks/second** with
MiniLM q8 at batch 32; about **60 images/second** with CLIP ViT-B/32 q8;
about **25 images/second** with a patch16 model.

### 4.3 Model load time

Cold (download plus session build) against warm (from the on-disk cache):

| Model | cold | warm |
| --- | --- | --- |
| CLIP ViT-B/32 fp32 (both towers) | 63.2 s | — |
| CLIP ViT-B/32 q8 (both towers) | 8.9 s | — |
| SigLIP fp32 | 47.1 s | — |
| SigLIP2 q8 | 43.2 s | **0.70 s** |
| JinaCLIP v1 (fp32 text + q8 vision) | — | **0.33 s** |
| all-MiniLM-L6-v2 q8 | 3.4 s | — |

Warm load is well under a second. Cold load is dominated by the download.

### 4.4 JinaCLIP v1: the q8 text ONNX is broken above 16 tokens

I probed `JinaCLIPTextModel` at several sequence lengths.

| length | q8 | fp32 |
| --- | --- | --- |
| 8 | OK | OK |
| 16 | OK | OK |
| 32 | **FAIL** | OK |
| 64, 77, 128, 256, 512, 1024, 2048, 8192 | **FAIL** | OK |

The q8 failure is `Non-zero status code ... Sub node
'/transformer/encoder/layers.0/mixer/inner_attn/Sub' ... 16 by 133`. So the
quantised text export has a baked-in 16-token attention shape. **You must use
`dtype: 'fp32'` (or test fp16) for the JinaCLIP v1 text tower.** That is 547 MB,
not 138 MB.

The fp32 text tower ran clean to 8192 tokens and returned `text_embeds`, 768
dimensions.

### 4.5 Other practical traps found

* `JinaCLIPProcessor._call(text, images)` takes text first. Calling
  `processor(image)` treats the image as text and the vision model then reports
  `Missing the following inputs: pixel_values`. Call `processor(null, image)`.
* `Xenova/mobileclip_s0`'s text ONNX has a **fixed** 77-length input. You must
  pass `padding: 'max_length', max_length: 77`. `padding: true` crashes.
* `jinaai/jina-clip-v2` ships only a fused `model.onnx`. You cannot download the
  text tower alone. The fp32 weights are a single 3.45 GB external-data file.
* GitHub issue #1112 reports that the `image-feature-extraction` pipeline with
  `Xenova/clip-vit-base-patch32` fails with "Missing the following inputs:
  input_ids, attention_mask" since v3.2.2, because the pipeline loads the fused
  model. Using `CLIPVisionModelWithProjection` directly avoids this; that is
  what I did, and it worked.

## 5. Two indexes, one result list

### 5.1 Are scores from two different models comparable?

No source says yes. Several vendors say plainly that they are not.

* Microsoft, Azure AI Search: "Scores are generated by ranking algorithms that
  vary for each method. Each algorithm has its own range and magnitude."
* OpenSearch: "Different search methods ... produce scores on incompatible
  scales", and one method's "scoring pattern may dominate, reducing search
  quality."
* Milvus: "Each search may use different similarity metrics, resulting in varied
  score distributions", and the scores "cannot be directly compared". Milvus
  applies an `arctan` transform before weighting.
* Qdrant: dense and sparse "scores live on different scales that also shift per
  query."
* The RRF paper itself calls the inputs "uncalibrated" and says rank fusion
  "combines ranks without regard to the arbitrary scores returned by particular
  ranking methods."
* Steck, Ekanadham and Kallus, WWW 2024, show analytically that cosine
  similarity in learned embeddings can give "arbitrary and therefore meaningless
  similarities", because training choices change the geometry.

**Honest gap.** Every vendor statement above is framed as BM25 against dense, or
as one distance metric against another. I found no document that says, in those
words, "cosine from dense model A is not comparable with cosine from dense model
B". The reasoning transfers, but that exact sentence is an inference, not a
citation.

### 5.2 Reciprocal Rank Fusion, the named method

Cormack, Clarke and Büttcher, SIGIR 2009, pages 758-759. The formula, verbatim:

> RRFscore(d ∈ D) = Σ_{r∈R} 1/(k + r(d))

On the constant, verbatim:

> where k = 60 was fixed during a pilot investigation and not altered during
> subsequent validation.

and

> The results of the first, shown in table 1, indicated that k = 60 was
> near-optimal, but that the choice was not critical.

Their own Table 1 (TREC topics 351-400, 30 fused runs):

| k | 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 | 500 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MAP | .2072 | .2123 | .2134 | .2139 | .2138 | .2144 | .2145 | .2146 | **.2147** | .2145 | .2142 | .2098 |

So 60 is a convention, not an optimum. Their best value is k=80. The curve is
flat from about 20 to 100. Reported gain: RRF beat Condorcet, CombMNZ and the
best single system by 4 % to 5 %.

RRF needs no score at all, only ranks. That is exactly why it fits two models.

### 5.3 Production implementations

| System | API | k default | Local Docker? |
| --- | --- | --- | --- |
| Qdrant | Query API, `"query": {"fusion": "rrf"}`; `dbsf` for normalised sum | **2**, not 60 | yes, v1.10.0+ (`dbsf` v1.11.0+) |
| Milvus | `RRFRanker(k)`, range (0, 16384); `WeightedRanker` | 60 | yes, v2.4+ |
| Weaviate | `rankedFusion` (RRF) and `relativeScoreFusion` (min-max) | 60, hard-coded | yes |
| OpenSearch | `score-ranker-processor` (RRF) and `normalization-processor` | 60 | yes, RRF in 2.19+, normalisation in 2.10+ |
| Vespa | `reciprocal_rank_fusion(a, b, ...)`, `normalize_linear(f)` in `global-phase` | 60.0 | yes |
| LanceDB | `RRFReranker(K=60)` | 60 | yes, embedded |
| Elasticsearch | `rrf` retriever, `rank_constant` | 60 | **no — Enterprise licence** |
| Chroma | `Rrf(...)` | 60 | **no — Chroma Cloud only today** |
| pgvector / Postgres | none built in; the usual pattern is a `FULL OUTER JOIN` of two ranked CTEs | you choose | yes |
| Azure AI Search | RRF fires automatically for more than one query | 60 | no, managed |

Two details worth knowing.

* **Qdrant does not use k=60.** Its source
  (`lib/segment/src/common/reciprocal_rank_fusion.rs`) sets
  `DEFAULT_RRF_K = 2` and computes
  `1.0 / ((position + 1) / weight + k - 1.0)`. With `weight = 1` and
  zero-based `position`, that is `1/(rank + 1)`. In Cormack's terms Qdrant's
  effective constant is **1**, not 60. That is far more top-heavy than every
  other engine. Override with `{"rrf": {"k": 60}}`.
* **Elasticsearch gates RRF behind the Enterprise subscription.** A Basic
  cluster returns `"reason": "current license is non-compliant for [Reciprocal
  Rank Fusion (RRF)]"`. The `linear` retriever added in 8.18 / 9.0 is gated the
  same way.

### 5.4 Score normalisation, the named alternatives

**OpenSearch normalization-processor** (2.10+) documents three, with formulas:

* `min_max`: `(score - min) / (max - min)`; a 0.0 becomes 0.001. Supports fixed
  `lower_bounds` / `upper_bounds`, which is the theoretical-max idea.
* `l2`: `score_i / sqrt(Σ score_j²)`; preserves ratios inside a list.
* `z_score`: `(score - mean) / std_dev`; below-mean scores collapse to 0.001,
  which loses ordering.

Combination: `arithmetic_mean` (default), `geometric_mean`, `harmonic_mean`,
with optional `weights` in [0,1] that must sum to 1. OpenSearch's own guidance:
"min_max is recommended for most workloads ... Use l2 only if benchmarks show
that it performs better than min_max for your workload."

**Weaviate** offers both and states the trade-off. `relativeScoreFusion`
"retains more information from the original searches than rankedFusion", which
"only retains the rankings". `relativeScoreFusion` became the default in
**v1.24**; `rankedFusion` was the default up to v1.23.

**Milvus `WeightedRanker`** requires normalisation and does it for you with an
`arctan` map into [0,1], controlled by `norm_score`.

**Qdrant `dbsf`** (Distribution-Based Score Fusion, v1.11.0+) normalises with
`(s - (μ - 3σ)) / (6σ)` per query, then sums. That is a clipped z-score.

**Vespa** offers `normalize_linear(f)` = `(input - min) / (max - min)` over the
global top list, in the same `global-phase` as its RRF function.

### 5.5 Published evidence: RRF against normalisation

Two independent results, agreeing in direction. Normalisation wins on quality;
RRF wins on being parameter-free.

* **Bruch, Gai and Ingber, "An Analysis of Fusion Functions for Hybrid
  Retrieval", TOIS 2023.** From the abstract: "RRF is sensitive to its
  parameters ... convex combination fusion is generally agnostic to the choice
  of score normalization ... convex combination outperforms RRF in in-domain and
  out-of-domain settings." Their TM2C2 convex combination beat RRF(k=60) on
  every BEIR subset reported, for example NFCorpus .327 against .312, HotpotQA
  .699 against .675, FiQA .496 against .464. Their normalisation finding
  matters here: *which* normaliser you pick (min-max, z-score, theoretical) is a
  "minor detail", because rank-equivalent convex combinations exist for any
  linear transform. What matters is that you normalise at all, and that you tune
  the mixing weight. (The per-dataset decimals were extracted from the ar5iv
  HTML by a summarising model; the abstract-level claims are solid, the decimals
  should be re-checked against the PDF.)
* **OpenSearch's own benchmark**, published with RRF in 2.19: across six
  datasets RRF scored on average **3.86 % lower NDCG@10** than min_max +
  arithmetic_mean, and gave a 1.62 % p50 latency improvement. Their score
  spreads: min_max top/mid/bottom = 0.5 / 0.29481 / 0.0005; RRF = 0.01639 /
  0.01613 / 0.01429. The RRF range is nearly flat. That flatness is the
  information loss, made numeric.
* **Weaviate's FIQA test**: `relativeScoreFusion` gave "a ~6 % improvement in
  recall over the rankedFusion method". One vendor test on one dataset.

**Honest gap.** Every one of these benchmarks compares *lexical against dense*.
I found **no** published benchmark that compares RRF against normalisation for
**two dense models**, or for **text results against image results**. That is
unmeasured territory.

### 5.6 What multimodal systems actually do

Two live patterns. Both are supported by engines that run in local Docker.

**Pattern A — one CLIP index for everything.**

* **Weaviate `multi2vec-clip`**: one collection, one vector space, with
  `imageFields` and `textFields` feeding the same vector, and per-field weights.
  Runs locally, e.g. image
  `cr.weaviate.io/semitechnologies/multi2vec-clip:sentence-transformers-clip-ViT-B-32-multilingual-v1`,
  wired in with `CLIP_INFERENCE_API`. Gives `nearText` and `nearImage` over one
  index.
* **Marqo**: text and images in one index with one CLIP model
  (`treatUrlsAndPointersAsImages: true`), plus a `multimodal_combination` field
  that merges text and image fields with weights into a single vector. Marqo
  also has `searchMethod: "HYBRID"` with `retrievalMethod: "disjunction"`,
  `rankingMethod: "rrf"`, `alpha` and `rrfK`. (The `rrfK` default of 60 comes
  from a search extract, not from a page I fetched cleanly.)
* **Vespa** CLIP sample apps hold image embeddings in a
  `tensor<float>(i{},x[512])` field and combine keyword matching on captions
  with the CLIP vector in one rank profile.

**Pattern B — two vector fields from two different models in one collection,
fused server-side.** This is the closest match to "two indexes, one list".

* **Milvus 2.4+**: one collection can hold several vector fields "originating
  from different embedding models", up to 10 (`proxy.maxVectorFieldNum`). The
  current docs example is exactly this case: `text_dense` at 768, `image_dense`
  at 512, `text_sparse`, in one schema. Parallel ANN searches, merged by
  `RRFRanker` or `WeightedRanker`.
* **Qdrant**: named vectors let one point hold several vectors, "each of which
  can have their own dimensionality and metric". The Query API (v1.10.0+) runs
  several `prefetch` stages against different vector fields in parallel and
  fuses with `rrf` or `dbsf`. So one Qdrant collection can hold a 384-dim MiniLM
  vector and a 512-dim CLIP vector and fuse them in one request.
* **Weaviate named vectors** (v1.24+): each named vector "has its own index, its
  own compression, and its own vectorizer". Multi-target join strategies:
  `minimum` (default), `sum`, `average`, `manualWeights`, `relativeScore`.
  Note that the default, `minimum`, compares **raw distances across vector
  spaces** — the unsafe thing when the two spaces come from different models.
  `relativeScore` is the normalised option. `near_xxx` multi-target is v1.26+,
  `hybrid` multi-target is v1.27+.
* **Azure AI Search**: RRF fires whenever more than one query runs, including
  "multiple vector queries", with per-query `weight` multipliers.
* **OpenSearch**: a `hybrid` query takes up to 5 clauses. (Unverified: the docs
  do not explicitly confirm several `knn` clauses on *different* vector fields.)
* **LanceDB**: a dataset can have several vector columns of different
  dimensions, but its built-in `RRFReranker` is written for vector-plus-FTS.
  No built-in fusion across two vector columns was found.

### 5.7 Two extra facts measured here

**You cannot even compute a cosine between the two spaces.** `all-MiniLM-L6-v2`
returns 384 dimensions. CLIP ViT-B/32 returns 512. SigLIP, SigLIP2 and JinaCLIP
v1 return 768. JinaCLIP v2 returns 1024. The vectors are not the same length, so
the question is not "is the number meaningful" but "the operation does not
type-check". Two indexes are forced, unless one model does both jobs.

**Embedding the query twice is cheap.** Measured, q8, short query, median of 20
runs after warm-up:

| operation | median |
| --- | --- |
| MiniLM query vector | **0.90 ms** |
| CLIP text query vector | **1.83 ms** |
| both, issued together | **4.13 ms** |

So a two-index design pays under 5 ms per query for the second encoder. The cost
of two indexes is in ingest, storage and fusion logic, not in query latency.

## 6. The modality gap, measured here

If you put text chunks and images in one CLIP index, the two kinds of vector do
not mix. This is a named, published effect, and I reproduced it locally.

**The paper.** Liang, Zhang, Kwon, Yeung and Zou, "Mind the Gap: Understanding
the Modality Gap in Multi-modal Contrastive Representation Learning", NeurIPS
2022, pp. 17612-17625. From the abstract: "different data modalities (e.g.
images and text) are embedded at arm's length in their shared representation in
multi-modal models such as CLIP." Two causes: at initialisation a deep network's
representation "is restricted to a narrow cone", so the two encoders start
apart; then "contrastive learning keeps the different modalities separate by a
certain distance, which is influenced by the temperature parameter in the loss
function."

**My local measurement.** `Xenova/clip-vit-base-patch32`, fp32, 6 text strings
and 4 COCO images, all L2-normalised, cosine similarity:

| pair type | n | mean | min | max |
| --- | --- | --- | --- | --- |
| text-text | 15 | **0.4496** | 0.2603 | 0.7313 |
| image-image | 6 | **0.4506** | 0.3682 | 0.5578 |
| **text-image** | 24 | **0.1674** | 0.0491 | 0.3429 |

Within-modality similarity is about 2.7 times cross-modality similarity.

**What that does to a merged ranking.** I ranked the text query `"a cat"`
against one mixed pool of the same 6 texts and 4 images:

```
0.7645 TEXT   The invoice total is 1,240 euros, due on 30 September.
0.7109 TEXT   Hexagonal architecture isolates business logic from ...
0.6857 TEXT   Vector databases store embeddings and support ANN search.
0.6226 TEXT   a photo of a dog running on the beach
0.5305 TEXT   two cats sleeping on a pink sofa with two remote controls
0.5183 TEXT   a black and white cat lying on a blanket
0.2146 IMAGE  img1   (the photo of two cats)
0.1966 IMAGE  img2
0.1911 IMAGE  img4
0.1833 IMAGE  img3
```

Every text beat every image. An invoice line about euros scored 0.7645 against a
real photo of cats at 0.2146. A single CLIP index with a text query is biased
toward text, hard, regardless of relevance.

**Published evidence for the same effect in retrieval.** Li and Zhang et al.,
"Closing the Modality Gap for Mixed Modality Search" (2025), study exactly one
index holding image-only, text-only and multimodal documents. They build
**MixBench** from Google WIT, MSCOCO, OVEN and VisualNews, sampled 1:1:1. They
report a **U-shaped curve**: as text documents are replaced by semantically
identical screenshots, performance falls from 0.22 (all text) to 0.02 at 99 %
screenshots, then recovers to 0.36 when everything is a screenshot. Their stated
cause: "same-modality documents rank higher than semantically relevant
cross-modal results." Their fix, GR-CLIP, is **mean-centering calibration** —
subtract the modality-specific mean embedding before the similarity — reported
at "up to 26 percentage points improvement in NDCG@10" over CLIP, at "75× less
compute" than a VLM2Vec baseline.

Jina AI measured the gap on Flickr8k and found text-to-text cosines clustered
much higher than image-to-text cosines, "a surprisingly large gap".

**No vendor documents this.** I found no Weaviate, Marqo, Qdrant or Vespa page
that mentions the modality gap, warns about it, or ships a correction.
`multi2vec-clip` docs present the shared space as simply working. Mean-centering
and similar fixes exist only in research code today.

## 7. Can one model do long text and images?

Short answer: **two models can, and only one of those two is both
licence-clean and proven in Node today.** The models that top the multimodal
leaderboards in 2026 have no ONNX weights at all.

### 7.1 The models that do long text and images in one space

| Model | Text tokens | Dims | Params | Licence | ONNX | Transformers.js |
| --- | --- | --- | --- | --- | --- | --- |
| `jinaai/jina-clip-v1` | **8192** | 768, no Matryoshka | 222.7 M | **Apache-2.0** | split `text_model` + `vision_model`, 7 quantisations | **registered architecture**, verified running here |
| `jinaai/jina-clip-v2` | **8192** | 1024, Matryoshka [32…1024] | 865.3 M | **CC BY-NC 4.0** | fused only, 874 MB int8 / 3.45 GB fp32 | registered; processor tests exist in the repo, **no model forward-pass test** |
| `nomic-ai/nomic-embed-text-v1.5` + `nomic-ai/nomic-embed-vision-v1.5` | **8192** (text) | 768, Matryoshka [64…768] | 136.7 M + 92.9 M | **Apache-2.0** both | yes, both; smallest pair ≈ **173 MB** (111 MB text q4f16 + 62 MB vision q4) | `nomic_bert` registered; vision works through the `AutoModel` fallback |
| `jinaai/jina-embeddings-v5-omni-nano` | 8192 | 768, Matryoshka | 986.0 M | CC BY-NC 4.0 | **none official** | **no** |
| `jinaai/jina-embeddings-v4` | 32768 | 2048 + 128-dim multi-vector | 3.75 B | Qwen Research (non-commercial) | none official | **no** — `JinaEmbeddingsV4Model` is not registered |

**The Nomic shared-space claim is real.** The `nomic-embed-vision-v1.5` model
card states it "shares the same embedding space as nomic-embed-text-v1.5", and
"All Nomic Embed Text models are now multimodal!". The method is LiT-style: lock
the text encoder, align the vision encoder to it. Paper: Nussbaum, Duderstadt,
Mulyar, "Nomic Embed Vision: Expanding the Latent Space", arXiv:2406.18587.
Two model files, **one index**.

Two caveats for Nomic. It needs task prefixes (`search_document:`,
`search_query:`). And the vision side works through a pipeline fallback
(`image-feature-extraction` falls back to `AutoModel`) rather than an explicit
mapping; the maintainer closed issue #848 on **2026-02-10** saying it "should
work correctly now", which predates v4.0.0 (2026-03-30). **I did not run Nomic
vision on v4.2.0. That is unverified.**

**Retrieval quality trade, from the Nomic paper's Table 2 (DataComp):**

| Model | ImageNet | Dist. shifts | VTAB | **Retrieval** | Average |
| --- | --- | --- | --- | --- | --- |
| Nomic Embed v1.5 | 0.710 | 0.551 | 0.561 | 0.469 | **0.568** |
| CLIP ViT-B/16 | 0.684 | 0.559 | 0.546 | 0.527 | 0.563 |
| Jina CLIP v1 | 0.591 | 0.464 | 0.520 | **0.604** | 0.522 |

Nomic wins classification; JinaCLIP v1 wins retrieval by a wide margin
(0.604 against 0.469). Note: Figure 1 of the same paper gives a different
aggregation that I could not reconcile with Table 2.

**jina-clip-v2's own reported weaknesses**, from Jina's launch post: its text
encoder scores **3.8 % lower** than `jina-embeddings-v3` on retrieval, and it
trails NLLB-SigLIP on multilingual text-to-image by up to 3.1 %. So even the
best long-text CLIP is a compromise on pure text search.

**Why JinaCLIP's long context is credible.** Original CLIP caps at 77 tokens and
its *effective* context is under 20 tokens, because it trained on short captions.
JinaCLIP changed the training recipe: AI-generated long descriptions plus hard
negative triplets, in three stages (arXiv:2405.20204).

### 7.2 The models that cannot be used here

* **SigLIP and SigLIP 2**: text limit is **64**, fixed in the HF source
  (`configuration_siglip.py` line 52 and `configuration_siglip2.py` line 58, both
  `max_position_embeddings: int = 64`). No Google checkpoint overrides it.
  SigLIP2's `-naflex` variant declares `model_type: siglip2`, which Transformers.js
  does **not** support; the fixed-resolution variants declare `siglip` and do work.
* **CLIP and MobileCLIP**: 77 tokens, effectively under 20.
* **Marqo fashion/ecommerce models**: 64-77 tokens, and domain-specific. The
  ecommerce pair has no ONNX.
* **ColPali / ColQwen2 / ColQwen2.5**: LoRA adapters on 2.2-3.8 B VLMs,
  multi-vector late interaction at 128 dims per token (so you need MaxSim, not a
  plain vector index). **A Hub search for "colqwen onnx" returns zero repos.**
  Four stale ColPali exports exist with 0-2 downloads; one sibling repo is
  literally named `...-onnx-broken`.
* **The 2026 leaderboard leaders** — Qwen3-VL-Embedding-8B/2B, RzenEmbed-v2-7B,
  Ops-MM-embedding, GME-Qwen2-VL, VLM2Vec, mmE5, LLaVE, MoCa, B3 — are all
  decoder-VLMs of 2 to 11 B parameters. **None has ONNX in its official repo, and
  none is a registered Transformers.js architecture.** Qwen3-VL-Embedding has 30
  derivative repos: GGUF, MLX, FP8, AWQ, GPTQ, NVFP4, W4A16. Not one ONNX.
* **Meta Perception Encoder** (`facebook/PE-Core-*`): text context is **32 tokens**
  (72 for G/14), and the repos hold only a raw `.pt` with no `config.json`.
  `onnx-community/PE-Core-B16-224-ONNX` exists but ships raw graphs with no
  config, tokenizer or preprocessor.
* **LLM2CLIP**: needs a 7.5 B Llama-3 text tower. No ONNX anywhere.
* **Berkeley TULIP**: "HF Models (Coming Soon)". Checkpoints are `.ckpt` files on
  S3. No official HF repo exists.
* **API-only**: `voyage-multimodal-3` / `3.5` (32,000 tokens, 1024 dims, API
  only), Cohere `embed-v4.0` (128,000 tokens, 1536 dims, licensed Docker
  container for private deployment, weights not open), Gemini Embedding 2 (8,192
  tokens, API only). **OpenAI has no multimodal embedding model as of
  2026-09-12**; its embeddings endpoint is text only.

### 7.3 Leaderboard state, for context

**MMEB-V2 overall** (leaderboard space last modified 2026-09-11, newest scored
entry 2026-01-27):

| # | Model | Size (B) | Overall | Image | Video | VisDoc |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Qwen3-VL-Embedding-8B** (open, apache-2.0) | 8.14 | **77.82** | 80.12 | 67.15 | 82.36 |
| 2 | seed1.6-embedding-1215 (API) | ? | 75.08 | 77.99 | 67.74 | 76.23 |
| 3 | WeMM-Embedding-8B | 8.77 | 73.90 | 78.09 | 63.24 | 75.62 |
| 4 | Qwen3-VL-Embedding-2B (open) | 2.13 | 73.25 | 74.96 | 61.87 | 79.22 |
| 7 | RzenEmbed-v2-7B (open) | 8.29 | 71.12 | 75.92 | 55.73 | 75.45 |

The best open model beats every closed API on this board. It is also 8 B
parameters with no ONNX export.

**ViDoRe V3** launched 2026-02-27: 10 datasets, 26,000+ pages, 3,000+ queries,
6 languages. Two findings from the launch post matter here: the most accurate
pipeline at release was **text-only** (jina-embeddings-v4 + ZeRank2), and the
authors note that "a smaller embedding model plus a cross-encoder can match late
interaction".

ViDoRe-V1 reference scores: Ops-Colqwen3-4B 91.31, colpali-v1.3 84.57.

### 7.4 A note on the jina-clip-v2 packaging

`jinaai/jina-clip-v2` has **no** `text_model.onnx` and **no** `vision_model.onnx`.
So `JinaCLIPTextModel.from_pretrained()` — which defaults to
`model_file_name: 'text_model'` — will fail. You must load the full
`JinaCLIPModel`. The Transformers.js `JinaCLIPModel.forward` handles one-sided
calls by feeding a zero-sized `pixel_values` tensor for text-only input and a
1-token `input_ids` for image-only input (I read the source; the comment says
"the majority of time is spent in the vision encoder, so this shouldn't
significantly impact performance"). The cost is that you always hold the whole
graph in memory — 874 MB at int8 — even to embed a sentence.

A community split export exists at `beclab/jina-clip-v2-split-onnx`, with no
`config.json`, no Transformers.js tag, and non-standard file names.

## 8. Open questions and unverified claims

State these plainly at the grilling.

1. **No published benchmark compares RRF against score normalisation for two
   dense models, or for text-against-image lists.** Every benchmark found is
   lexical-against-dense. The conclusions are being extrapolated.
2. **No vector-database vendor documents the modality gap.** Not Weaviate, not
   Marqo, not Qdrant, not Vespa. Mean-centering and similar fixes exist only in
   research code.
3. **No authoritative source states, in those words, that cosine from dense model
   A is not comparable with cosine from dense model B.** All vendor statements
   are about BM25-against-dense or about differing distance metrics.
4. **jina-clip-v2 has no model forward-pass test in the Transformers.js repo**,
   only processor and image-processor tests. I did not run it (3.45 GB fp32 /
   874 MB int8).
5. **Nomic vision was not run on Transformers.js v4.2.0 here.** The maintainer's
   "should work correctly now" is from 2026-02-10, before v4.0.0.
6. **The Bruch et al. per-dataset decimals** were extracted from the ar5iv HTML by
   a summarising model. The abstract-level conclusions are solid; re-check the
   decimals against the PDF before quoting them.
7. **Marqo's `rrfK` default of 60** comes from a search extract, not from a page
   fetched cleanly (the Marqo search-API page 404'd).
8. **OpenSearch does not explicitly document** several `knn` clauses on
   *different* vector fields inside one `hybrid` query.
9. **All speed numbers here are from one Apple M5 laptop.** They will differ on
   other CPUs. The method is in section 4 and the scripts are in
   `scratchpad/bench/`; re-run them on the target hardware.
10. **The text-quality effect of CLIP truncation was measured on one paragraph**,
    not on a retrieval benchmark. The token-loss percentages are solid; the
    cosine numbers in 3.5 are indicative only.

## 9. Sources

### Transformers.js
* Transformers.js docs index — https://huggingface.co/docs/transformers.js/index
* Server-side inference in Node.js — https://huggingface.co/docs/transformers.js/en/tutorials/node
* Transformers.js v4 release post (2026-02-09) — https://huggingface.co/blog/transformersjs-v4
* npm package metadata — https://registry.npmjs.org/@huggingface/transformers
* Repo — https://github.com/huggingface/transformers.js
* Architecture registry — https://github.com/huggingface/transformers.js/blob/main/packages/transformers/src/models/registry.js
* JinaCLIP modeling source — https://github.com/huggingface/transformers.js/blob/main/packages/transformers/src/models/jina_clip/modeling_jina_clip.js
* Issue #1112, `image-feature-extraction` with the fused CLIP model — https://github.com/huggingface/transformers.js/issues/1112
* Issue #848, Nomic vision support — https://github.com/huggingface/transformers.js/issues/848

### Model cards and configs
* https://huggingface.co/Xenova/clip-vit-base-patch32
* https://huggingface.co/Xenova/clip-vit-base-patch16
* https://huggingface.co/Xenova/clip-vit-large-patch14
* https://huggingface.co/Xenova/siglip-base-patch16-224
* https://huggingface.co/onnx-community/siglip2-base-patch16-224-ONNX
* https://huggingface.co/onnx-community/siglip2-base-patch16-512-ONNX
* https://huggingface.co/google/siglip2-base-patch16-224
* https://huggingface.co/jinaai/jina-clip-v1
* https://huggingface.co/jinaai/jina-clip-v2
* https://huggingface.co/jinaai/jina-embeddings-v4
* https://huggingface.co/jinaai/jina-embeddings-v5-omni-nano
* https://huggingface.co/jinaai/jina-embeddings-v5-text-nano-retrieval
* https://huggingface.co/onnx-community/jina-embeddings-v5-omni-nano-ONNX
* https://huggingface.co/nomic-ai/nomic-embed-text-v1.5
* https://huggingface.co/nomic-ai/nomic-embed-vision-v1.5
* https://huggingface.co/Xenova/mobileclip_s0
* https://huggingface.co/plhery/mobileclip2-onnx
* https://huggingface.co/Marqo/marqo-fashionSigLIP
* https://huggingface.co/Marqo/marqo-fashionCLIP
* https://huggingface.co/Xenova/all-MiniLM-L6-v2
* https://huggingface.co/vidore/colpali-v1.3
* https://huggingface.co/vidore/colqwen2.5-v0.2
* https://huggingface.co/Qwen/Qwen3-VL-Embedding-8B
* https://huggingface.co/facebook/PE-Core-B16-224
* SigLIP text config default (64) — https://github.com/huggingface/transformers/blob/main/src/transformers/models/siglip/configuration_siglip.py
* SigLIP2 text config default (64) — https://github.com/huggingface/transformers/blob/main/src/transformers/models/siglip2/configuration_siglip2.py
* HF SigLIP docs — https://huggingface.co/docs/transformers/main/en/model_doc/siglip

### Papers
* Cormack, Clarke, Büttcher, "Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods", SIGIR 2009 — https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf
* Bruch, Gai, Ingber, "An Analysis of Fusion Functions for Hybrid Retrieval", TOIS 2023 — https://arxiv.org/abs/2210.11934
* Steck, Ekanadham, Kallus, "Is Cosine-Similarity of Embeddings Really About Similarity?", WWW 2024 — https://arxiv.org/abs/2403.05440
* Liang et al., "Mind the Gap: Understanding the Modality Gap in Multi-modal Contrastive Representation Learning", NeurIPS 2022 — https://arxiv.org/abs/2203.02053
* "Closing the Modality Gap for Mixed Modality Search" (MixBench, GR-CLIP) — https://arxiv.org/html/2507.19054
* Koukounas et al., "Jina CLIP: Your CLIP Model Is Also Your Text Retriever" — https://arxiv.org/pdf/2405.20204
* Nussbaum, Duderstadt, Mulyar, "Nomic Embed Vision: Expanding the Latent Space" — https://arxiv.org/abs/2406.18587
* MIEB, "Massive Image Embedding Benchmark" — https://arxiv.org/abs/2504.10471

### Vector database documentation
* Qdrant hybrid queries (RRF, DBSF) — https://qdrant.tech/documentation/search/hybrid-queries/
* Qdrant named vectors — https://qdrant.tech/documentation/manage-data/vectors/
* Milvus multi-vector search — https://milvus.io/docs/multi-vector-search.md
* Milvus RRFRanker — https://milvus.io/docs/rrf-ranker.md
* Milvus WeightedRanker — https://milvus.io/docs/weighted-ranker.md
* Weaviate hybrid search concepts — https://docs.weaviate.io/weaviate/concepts/search/hybrid-search
* Weaviate fusion algorithms blog — https://weaviate.io/blog/hybrid-search-fusion-algorithms
* Weaviate multi-vector search — https://weaviate.io/developers/weaviate/search/multi-vector
* Weaviate `multi2vec-clip` — https://weaviate.io/developers/weaviate/modules/retriever-vectorizer-modules/multi2vec-clip
* OpenSearch RRF announcement and benchmark — https://opensearch.org/blog/introducing-reciprocal-rank-fusion-hybrid-search/
* OpenSearch score-ranker-processor — https://docs.opensearch.org/latest/search-plugins/search-pipelines/score-ranker-processor/
* OpenSearch normalization-processor — https://docs.opensearch.org/latest/search-plugins/search-pipelines/normalization-processor/
* Vespa phased ranking — https://docs.vespa.ai/en/ranking/phased-ranking.html
* Elasticsearch RRF retriever — https://www.elastic.co/docs/reference/elasticsearch/rest-apis/rrf-retriever
* Elastic subscriptions (RRF tier) — https://www.elastic.co/subscriptions
* Azure AI Search hybrid ranking — https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking
* LanceDB reranking — https://docs.lancedb.com/reranking
* Supabase hybrid search with pgvector — https://supabase.com/docs/guides/ai/hybrid-search
* Marqo multimodal search — https://docs.marqo.ai/latest/other-resources/cookbook/model-selection/multimodal-search/

### Leaderboards and vendor posts
* MMEB leaderboard — https://huggingface.co/spaces/TIGER-Lab/MMEB-Leaderboard
* ViDoRe leaderboard — https://huggingface.co/spaces/vidore/vidore-leaderboard
* ViDoRe V3 launch post — https://huggingface.co/blog/antoineedy/vidore-v3-pipeline-framework-and-leaderboard
* Jina CLIP v2 launch — https://jina.ai/news/jina-clip-v2-multilingual-multimodal-embeddings-for-text-and-images/
* Jina CLIP v1 launch — https://jina.ai/news/jina-clip-v1-a-truly-multimodal-embeddings-model-for-text-and-image/
* Jina on the modality gap — https://jina.ai/news/the-what-and-why-of-text-image-modality-gap-in-clip-models/
* Jina embeddings v5 omni — https://jina.ai/news/jina-embeddings-v5-omni-multimodal-embeddings-for-text-image-audio-and-video/
* Nomic Embed Vision — https://www.nomic.ai/news/nomic-embed-vision
* Voyage multimodal embeddings — https://docs.voyageai.com/docs/multimodal-embeddings
* Cohere Embed v4 — https://docs.cohere.com/docs/cohere-embed
* Gemini embeddings — https://ai.google.dev/gemini-api/docs/embeddings
