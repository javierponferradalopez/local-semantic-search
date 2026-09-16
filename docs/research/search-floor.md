# Research #19 — Deciding that a search found nothing

Date: 2026-09-16. Facts only. This report does not choose an approach, and it
recommends no number.

Issue [#11](https://github.com/javierponferradalopez/local-semantic-search/issues/11)
decided the mechanism: a `Floor`, one per model, compared against the best
`Match` of a group only, with the rows above it shown unfiltered. This report
supplies the evidence that the decision did not have. It has two halves, and
they stay apart on purpose:

* **Part A — what is published.** Every claim carries a source URL in section 9.
* **Part B — what I measured.** Every number comes from this machine.

## The findings, in one page

* **"Gate on the best hit only" has no published company under that name.**
  Every vector store ships a *filter* over the whole list. The two parts of the
  idea do have company: score-distributional threshold optimisation in IR, and
  the maximum score as a weak query-performance predictor. Section 1.
* **SigLIP ships its own threshold.** `google/siglip2-base-patch16-224` carries
  `logit_scale` 4.724453 and `logit_bias` −16.771725, so its own neutral point
  is at cosine **0.148859**. SigLIP base/16 puts the same point at **0.110222**.
  The model states the number; a person does not pick it. Sections 2 and 5.
* **On 16 images and 85 queries, the image gap is 0.0263 of cosine.** The worst
  answered query scores 0.0817, the best unanswered one 0.0554. Gibberish scores
  **higher** than a real absent subject — "asdfghjkl" reaches 0.0850 and beats
  two real answers. Section 4.
* **How the query is written moves the score as far as whether the answer
  exists.** The four phrasings of the same twelve questions span 0.0260 at the
  worst case, against a 0.0263 gap. Section 4.3.
* **SigLIP2's own neutral point rejects 41 of 48 answered queries** on this
  corpus, and 0 of 37 unanswered ones. Section 5.3.
* **With a monolingual text model there is no text `Floor` at all.** In English
  the gap is 0.2011 with zero overlap; in Spanish 7 of 15 real questions score
  below the best unanswered one. Section 6.3.
* **A cross-encoder costs 70–313 ms per search for a small English model and
  3124 ms for the multilingual one**, over 50 candidates. In exchange it has a
  natural zero point that keeps 11 of 15 answered English queries and rejects
  8 of 8 unanswered ones, on four different rerankers, with nothing tuned.
  Section 7.

## 0. The test machine, and one caveat

| Item | Value |
| --- | --- |
| CPU | Apple M5, 10 cores |
| OS | macOS (Darwin 25.6.0) |
| Node | v24.11.0 |
| `@huggingface/transformers` | **4.3.0** |
| `onnxruntime-node` | 1.30.0 |
| Execution provider | CPU |

The probes are in `docs/research/floorlab/`. `sh fetch-images.sh` rebuilds the
image pool. `node siglip-floor.mjs`, `node siglip-calib.mjs`,
`node text-floor.mjs` and `node rerank-cost.mjs` produce sections 4 to 7. The
raw output is committed beside each script as `out-*.txt`.

**One caveat governs all the text numbers.** The `Text model` of this project is
not chosen — that is ticket #14. Section 6 uses `Xenova/all-MiniLM-L6-v2` as a
stand-in, only to show the shape of the question. **Every text number in this
report must be measured again after the text model is chosen.** Section 6.3
shows why this is not a formality: with a monolingual text model, a text `Floor`
does not exist at all.

---

# Part A — what is published

## 1. Is "gate on the best hit only" a known practice?

**Short answer: the number is published practice everywhere; the gate is not.**

I found no source that describes the exact mechanism of #11 — compare *only* the
top score against a constant, then show the rest of the list unfiltered. I looked
in IR literature, in vector-store documentation, and in RAG guidance. What exists
is close, but different in a way that matters.

### 1.1 What every store gives you is a filter, not a gate

Every store the map considered applies its threshold to **every row**.

* **Qdrant** has `score_threshold`, "a minimal score threshold for the result".
  It removes each point below the value.
* **Weaviate** has `distance` and `certainty` on a `nearVector` search. Both cut
  the whole list. The documentation warns that `certainty` only means something
  for cosine distance, because other metrics are unbounded, and it prefers
  `distance`.
* **Elasticsearch** has a `similarity` parameter on a kNN clause: "the minimum
  similarity required for a document to be considered a match". Again, every
  document.
* **OpenSearch** calls the same idea *radial search*: all points inside a
  maximum distance or above a minimum score.
* **Supabase** ships `match_threshold` in its semantic-search guide, inside the
  SQL function, applied to all rows.
* **Azure AI Search** does not offer a threshold at all. It returns `k` results
  and says that the original cosine value "can be useful in custom solutions that
  set up thresholds to trim results of low quality results" — that is, do it
  yourself, over the list.
* **pgvector**, the store #8 chose, has **no threshold parameter**. A threshold
  is a plain `WHERE` clause that you write. An open issue asks for a confidence
  score to compare against a threshold and has no maintainer answer.

So the published product shape is a filter. #11 chose a gate. The gate is not
warned against anywhere I could find; it is simply not written down.

### 1.2 The closest published relatives of a top-score gate

Three bodies of work reason about the top of the list rather than the whole list.

**Score-distributional threshold optimisation.** Classic IR treats the score
list as a mixture of two distributions, one for relevant and one for
non-relevant documents, and derives a cut-off from them. Arampatzis, Robertson
and Kamps state the problem directly: ranked retrieval "has no clear cut-off
point where to stop consulting results". The current recommendation is a
two-gamma mixture, with normal-exponential as a usable approximation. This is
published company for *having* a `Floor`. It is not company for a constant.

**Query performance prediction.** Post-retrieval predictors read the score list
to guess whether the query worked. The **maximum score** is one of the listed
simple predictors — the higher the top score, the more confident the system is.
The literature says it is "not often used without normalisation", because raw
score magnitude depends on the query. The stronger predictors — NQC, WIG, SMV —
all use the **spread** of the top scores, not one value. So "look at the top
score to decide if the query found anything" is a recognised idea with a known
weakness, and the known repair is normalisation or spread, not a constant.

**Relevance filtering in production search.** Rossi et al. (Walmart, CIKM 2024)
attack exactly this problem for embedding retrieval. Their statement of it
matches #11's: ANN search maximises recall and "lacks natural cutoffs", and
cosine scores are hard to interpret. Their answer is a **Cosine Adapter**: it
maps the raw cosine to an interpretable score with a **query-dependent** mapping
function, and only then applies one global threshold. In other words, the
published fix for a constant that does not travel is to make the score travel
first. They report a large precision gain for a modest recall cost, confirmed by
an online A/B test.

### 1.3 The published warnings

* A 2026 audit of cosine gates in agent systems ("Similarity Gates Approve
  Reversals") reports that fixed cosine cut-offs measure how much the wording
  changed, not whether the meaning holds. In its tests, balanced accuracy never
  passed 0.700, median 0.525, and one production guard caught 0 of 56
  meaning-breaking mutations. The subject is semantic equivalence, not retrieval
  relevance, so it is adjacent rather than identical. It is still the clearest
  published caution against trusting one cosine constant.
* A practical write-up on pgvector deduplication, "the threshold is a trap",
  reports that the same conceptual distance scored about **0.91 for
  title-only pairs and about 0.74 once the bodies were included**. The author
  dropped the threshold and showed ranked neighbours to a human instead.

**Conclusion for the ticket.** Gating on the best hit alone has no published
company under that name. The two things it is made of do have company: a floor
is a real IR problem with a real literature, and the top score is a recognised
but weak confidence signal. Nobody publishes the combination, and nobody
publishes an argument against it either.

## 2. SigLIP2 ships its own threshold, and that is the most useful find

CLIP produces a cosine with no absolute meaning. **SigLIP does not.** It trains
with a pairwise sigmoid loss, so the checkpoint carries two learned scalars, and
the model card computes a probability from them:

```
p = sigmoid( exp(logit_scale) * cos + logit_bias )
```

The bias exists because a training batch of N pairs holds N positives and
N(N−1) negatives. Without it the sigmoid would learn to answer "no" to
everything. The SigLIP paper initialises the temperature at log 10 and the bias
at −10, and both are then learned.

The two scalars are **not** in `config.json`. They are tensors in
`model.safetensors`. I read them straight out of the checkpoint with HTTP range
requests; the code is `siglip-calib.mjs`. The values are in section 5.

Three consequences that the ticket should have:

* This is a **published starting number**, and it is the only one I found that
  is not somebody's blog constant. It comes from the training run.
* It is **per checkpoint**. SigLIP2 base/16 and SigLIP base/16 do not agree, and
  the disagreement is large (section 5.1). A Hugging Face issue reports the
  practical symptom: the documented example prints 31.9% for SigLIP, and 0.0%
  for SigLIP2 with the same code and the same image.
* The probability is a **strictly increasing function of the cosine**, with a
  fixed scale and a fixed bias. So a gate on `p > 0.5` and a gate on
  `cos > −logit_bias / exp(logit_scale)` are the **same gate**. The sigmoid buys
  no extra separating power. What it buys is the origin of the number: the model
  states it instead of a person guessing it.

Published practitioners report that SigLIP probabilities look low even when the
match is right. An open_clip issue reports 0.22 for a correct label. That
matches what I measured (section 5.3).

## 3. Does a threshold survive a model change?

**No, and the literature accepts recalibration rather than fighting it.**

* "Mapping Similarity Spaces across Embedding Models with Synthetic Query
  Probing" (Discovery Science 2026) studies exactly this. Models "largely agree
  on rankings", but "their absolute scores exhibit systematic distortions", so a
  threshold cannot be reused across models without adjustment. Learned mappings
  (linear, isotonic, quantile; isotonic best) only *partially* align the spaces.
  The same work reports that changing the **corpus** moves the best threshold
  more than changing the embedding dimension inside one model family. Per-corpus
  calibration stays necessary even with the model held fixed.
* The practical guidance is the same everywhere: calibrate per model version,
  store the threshold next to the model id, and re-baseline when either changes.
  #11 already requires this — each `Floor` ships beside its model id.
* A real photo-search product shows it in the wild. The `facet` project keeps a
  per-model threshold table; its issue #145 records **8% for SigLIP2 and 22% for
  the older CLIP model**, and reports that a hard-coded 0.15 made SigLIP2 return
  nothing because its real matching scores sit at **0.05–0.07**. The same issue
  independently rediscovers the `max_length` padding trap that #7 measured.

I found no published threshold for text retrieval that claims to survive a model
change.

---

# Part B — what I measured

## 4. The image space: SigLIP2 base/16 fp32

Probe: `siglip-floor.mjs`. Model `onnx-community/siglip2-base-patch16-224-ONNX`,
`fp32`, text padded with `padding: 'max_length', max_length: 64` as #7 requires.

Corpus: **16 photographs** from the COCO 2017 validation set, rebuilt by
`fetch-images.sh`, which verifies each SHA-256. The set holds near neighbours on
purpose: two tennis photographs, a real bear and three teddy bears, snow and
sea, two indoor rooms.

Queries: **85**. Twelve subjects that the corpus really contains, each written
four ways — English caption, Spanish caption, English bare noun, Spanish bare
noun (48). Eight subjects that the corpus does not contain at all, written the
same four ways (32). Five strings that are not language (5).

Costs, warm cache: model load **1511 ms**; index 16 images in **1.5 s**,
48–96 ms median per image over two runs; query embedding **12–14 ms** median.
The first, cold run spent **388 s**, nearly all of it downloading 1.5 GB.

### 4.1 The distributions

Top-1 cosine, by bucket:

| Bucket | n | min | median | max |
| --- | --- | --- | --- | --- |
| answer is in the corpus | 48 | **0.0817** | 0.1290 | 0.1641 |
| answer is absent | 32 | −0.0108 | 0.0336 | **0.0554** |
| not language | 5 | 0.0508 | 0.0824 | **0.0850** |

All 48 "present" queries put an on-subject image at rank 1, in both languages.

### 4.2 How wide the gap is

Against the real "absent" queries the gap is **0.0263** of cosine
(0.0817 − 0.0554), with no overlap. Split by phrasing, the gap is wider, because
both ends move together:

| Phrasing | worst present | best absent | gap |
| --- | --- | --- | --- |
| English caption | 0.1077 | 0.0392 | **0.0685** |
| Spanish caption | 0.0877 | 0.0367 | **0.0510** |
| English bare noun | 0.0891 | 0.0554 | **0.0337** |
| Spanish bare noun | 0.0817 | 0.0520 | **0.0297** |

**The gibberish is the worst case, not the absent subject.** "asdfghjkl" scored
**0.0850**, above two real answers: "dormitorio" at 0.0817 and "teléfono móvil"
at 0.0834. Over the whole 85 queries the gap is therefore **−0.0033**: 2 of 48
present queries fall below the best no-language query. Four of the five
gibberish strings score 0.073–0.085, which is the band where the weakest real
answers live.

One measured detail separates them, and I report it as a number only. Gibberish
raises *everything*. Its top-1 stands **0.021–0.038** above the corpus median for
that query. A real answer stands **0.09–0.17** above it. A real absent subject
stands about 0.03 above it, like gibberish. So on this corpus the distance
between the best score and the middle of the list separates all three buckets,
while the best score alone does not. #11 decided the mechanism; this is
evidence, not a proposal.

### 4.3 What the language costs

Spanish scores lower than English for the same subject, everywhere:

| Phrasing pair | English median | Spanish median | difference |
| --- | --- | --- | --- |
| caption | 0.1385 | 0.1303 | −0.0082 |
| bare noun | 0.1338 | 0.1229 | −0.0109 |

The worst case matters more than the median, because a `Floor` is set by the
worst real answer it must not reject. There the language costs more: the worst
English caption is 0.1077 and the worst Spanish caption is 0.0877, a difference
of **0.0200** — about three quarters of the whole 0.0263 gap.

This reproduces and extends #7: **phrasing moves the worst case almost as much
as language does.** From English caption to English bare noun the worst case
falls from 0.1077 to 0.0891, which is 0.0186. From English caption to Spanish
caption it falls to 0.0877, which is 0.0200.

Put the four together and the point is hard to miss. The worst real answer is
0.1077 in the best phrasing and 0.0817 in the worst phrasing. **The four ways to
write the same twelve questions span 0.0260, and the whole gap between an
answered and an unanswered query is 0.0263.** How the user writes the query
moves the score as far as whether the answer exists at all.

## 5. The SigLIP sigmoid, measured

Probe: `siglip-calib.mjs`.

### 5.1 The two learned scalars

Read from `model.safetensors` on the Hub:

| Checkpoint | `logit_scale` | `exp(logit_scale)` | `logit_bias` | cosine where p = 0.5 |
| --- | --- | --- | --- | --- |
| `google/siglip2-base-patch16-224` | 4.724453 | 112.6689 | −16.771725 | **0.148859** |
| `google/siglip-base-patch16-224` | 4.764997 | 117.3308 | −12.932437 | **0.110222** |

The temperature hardly moved between the two generations. The bias moved by
3.84. That single number is why the same code prints 31.9% on SigLIP and 0.0%
on SigLIP2. **The model's own neutral point moved by 0.039 of cosine between two
checkpoints of the same family and the same size.**

### 5.2 A check against the published number, and what it exposes

The Hugging Face SigLIP documentation prints "31.9% that image 0 is 'a photo of
2 cats'" for the COCO image `000000039769.jpg`. That implies a cosine of
0.10376. On this machine, with `Xenova/siglip-base-patch16-224` in `fp32`
through ONNX, the same pair gives cosine **0.0979** and therefore **19.00%**.
The contrast pair "a photo of 2 dogs" gives 0.0184 and 0.00%.

The formula and the scalars are right; the cosine differs by **0.0059**, which
is the ONNX export and the `sharp` image resize against PIL. **A 0.0059
difference in cosine moved the calibrated probability by 12.9 percentage
points.** That is the size of the error that a change of image-decoding library
can inject into an absolute number.

### 5.3 The calibrated probability against the 85 queries

SigLIP2's own neutral point, `p > 0.5`, used as the gate:

| Bucket | passes | p min | p median | p max |
| --- | --- | --- | --- | --- |
| answer is in the corpus | **7 / 48** | 0.05% | 9.68% | 84.82% |
| answer is absent | 0 / 32 | 0.00% | 0.00% | 0.00% |
| not language | 0 / 5 | 0.00% | 0.06% | 0.08% |

The model's own number never says yes when it should say no. It says no 41 times
out of 48 when it should say yes. Examples: "a photo of a stop sign" 84.82%, "a
photo of teddy bears" 80.47%, "a photo of a brown bear" 34.04%, "a photo of two
cats" 8.97%, "una foto de una cocina" 0.10%.

Two facts follow, and both are measurements, not advice.

* Because `p` is a strictly increasing function of the cosine, this table is the
  cosine table of section 4.1 with a different label. Gating on `p` cannot
  separate better than gating on cosine. It can only put the number somewhere
  defensible.
* The number the model itself proposes, 0.148859, is far above the measured
  present band (median 0.1290, max 0.1641). On this corpus it is **not** a
  usable `Floor`. But it is the only candidate value in this report that no
  human picked.

The calibrated probability also makes the no-answer case very clear-cut: every
absent query lands at 0.00%, and the highest gibberish is 0.08%. In probability
terms the three buckets look well separated; in cosine terms they are 0.03
apart. It is the same data. The sigmoid only stretches the axis.

## 6. The text space — with a stand-in model

> **Read this first.** The `Text model` is not chosen. Ticket #14 chooses it.
> This section uses `Xenova/all-MiniLM-L6-v2` `fp32`, which is English-only, has
> 384 dimensions, and is not a candidate that anybody has argued for.
> **Do not carry these numbers into the product.** Re-run `text-floor.mjs`
> against the chosen model. The script takes the model id as its first argument.

Probe: `text-floor.mjs`. Corpus: 20 passages of chunk length over five subjects
that do not overlap — coffee, PostgreSQL, bicycle maintenance, Spanish cooking,
a rental contract. Queries: 15 whose answer is in the corpus, the same 15 in
Spanish, 8 about subjects the corpus never mentions, and 5 that are not
language.

Costs, warm cache: model load **92 ms**; index 20 passages in **57 ms**; query
embedding **1.1 ms** median.

### 6.1 The distributions

| Bucket | n | min | median | max |
| --- | --- | --- | --- | --- |
| English, answer in the corpus | 15 | **0.4452** | 0.6316 | 0.7757 |
| Spanish, answer in the corpus | 15 | 0.1101 | 0.2513 | 0.4735 |
| answer absent | 8 | 0.0774 | 0.1360 | **0.2440** |
| not language | 5 | 0.0483 | 0.1189 | 0.1511 |

### 6.2 The English gap is wide

**0.2011** of cosine (0.4452 − 0.2440), with zero overlap, and the right subject
at rank 1 for 15 of 15 queries. The image gap of section 4.2 is 0.0263, about
eight times smaller. Both numbers are cosines, but they come from two models and
two spaces, so this is a difference of size, not a like-for-like comparison —
that is the comparison #6 forbids. It is still the reason #11 needs two
`Floor`s: a value that is generous in one space is impossible in the other.

Note where the no-answer band is highest: "how do I tune a violin" scored 0.2440
against the bicycle-chain passage. Both are about adjusting a mechanical thing.
Gibberish stays lower here than in the image space, 0.0483 to 0.1511.

### 6.3 In Spanish the floor stops existing

`all-MiniLM-L6-v2` is an English model. With Spanish queries over the same
English corpus:

* The right subject reaches rank 1 for only **6 of 15** queries. Nine Spanish
  queries return a passage about a different subject, usually the Spanish
  omelette, whatever the question was.
* The top-1 band drops to 0.1101–0.4735, straight on top of the no-answer band.
* **7 of 15** real Spanish questions score **below** the best no-answer query.
  Any `Floor` that keeps those seven also passes "how do I tune a violin" and
  "aaaaaaaaaaaa".

The owner searches in Spanish. So for the text space this is the finding that
outranks every number above: **the text `Floor` is a property of the text
model's multilingual ability, not of the corpus.** With a monolingual model
there is no value that separates the two cases, and the `Floor` cannot be
calibrated at any setting. This belongs to #14 before it belongs to #11.

## 7. What a cross-encoder reranker costs, measured

Probe: `rerank-cost.mjs`. The map refused a reranker as a third model. This is
what the refusal gave up, on this machine, over the same 20-passage corpus as
section 6. Every model is `fp32` and runs on the CPU through
`AutoModelForSequenceClassification`.

### 7.1 Which ONNX rerankers exist, and which of them load in Node

| Model | fp32 ONNX | Loads in `@huggingface/transformers` 4.3.0 |
| --- | --- | --- |
| `Xenova/ms-marco-MiniLM-L-6-v2` | 91.0 MB | yes |
| `jinaai/jina-reranker-v1-tiny-en` | 132.4 MB | yes |
| `mixedbread-ai/mxbai-rerank-xsmall-v1` | 284.2 MB | yes |
| `Xenova/bge-reranker-base` | 1112.5 MB | not run |
| `jinaai/jina-reranker-v2-base-multilingual` | 1114.0 MB | **no** |
| `onnx-community/bge-reranker-v2-m3-ONNX` | 2271.7 MB | yes, with `use_external_data_format` |

Two Node-specific traps:

* `jina-reranker-v2-base-multilingual` fails with
  `Error: Unsupported model type: null`. Its `config.json` declares the
  architecture through `auto_map` and expects `trust_remote_code`, which
  Transformers.js does not have. The most-downloaded multilingual reranker on
  the Hub therefore does not run here at all.
* `bge-reranker-v2-m3` splits its fp32 weights into `model.onnx` (0.7 MB) plus
  `model.onnx_data` (2271 MB). Without `use_external_data_format: true` it fails
  with `External data path does not exist`. The Hub API size of `model.onnx`
  alone says 0.7 MB, which is wrong by a factor of 3400.

### 7.2 The cost

| Model | cold load with download | warm load | 1 pair | 50 pairs in one batch | per candidate |
| --- | --- | --- | --- | --- | --- |
| `ms-marco-MiniLM-L-6-v2` | 82 956 ms | **57 ms** | 2.6 ms | 98 ms | **2.0 ms** |
| `jina-reranker-v1-tiny-en` | 23 978 ms | **72 ms** | 1.8–4.3 ms | 70–73 ms | **1.4 ms** |
| `mxbai-rerank-xsmall-v1` | 22 547 ms | **259 ms** | 6.1–6.8 ms | 304–313 ms | **6.2 ms** |
| `bge-reranker-v2-m3` | 241 544 ms | not measured | **53.9 ms** | **3124 ms** | **62.5 ms** |

Fifty candidates — the row count #11 puts on screen — cost 70 ms to 313 ms with
the small English models, and **3124 ms** with the multilingual one. That is the
real bill: not the latency of one pair, but one batch on every query, on top of
the 1.1 ms the bi-encoder already spends, plus a third set of weights in memory
and a third download in the model-download script.

The cold column is the download, not the load. The four models together pulled
**about 2.8 GB**; the whole cache after every probe in this report reached 5.0 GB.

### 7.3 Does it separate better? On this corpus, not always

The question #11 asks a reranker is the gate question: does the **best** score
over the whole corpus tell an answered query from an unanswered one.

| Model | best logit, English present (min / median / max) | best logit, absent (min / median / max) | gap |
| --- | --- | --- | --- |
| `ms-marco-MiniLM-L-6-v2` | −6.69 / 3.91 / 8.24 | −11.18 / −11.01 / −10.24 | **+3.55** |
| `jina-reranker-v1-tiny-en` | −0.73 / 1.30 / 3.04 | −1.35 / −1.11 / −0.89 | **+0.16** |
| `mxbai-rerank-xsmall-v1` | −3.16 / 0.90 / 2.61 | −4.83 / −3.64 / −1.63 | **−1.53** |
| `bge-reranker-v2-m3` | −6.55 / 1.51 / 5.17 | −11.01 / −10.13 / −8.07 | **+1.51** |

Three of the four separate, and `ms-marco-MiniLM-L-6-v2` separates widest.
`mxbai-rerank-xsmall-v1` **overlaps**: its worst answered query scores 1.53
below its best unanswered query, which is the same failure the bi-encoder has in
Spanish. So "a cross-encoder is better calibrated" is true of the model, not of
the class, and it still has to be checked per model.

The cross-encoder does bring one thing the bi-encoder has not: **a natural zero
point.** These models train with a binary objective, so logit 0 is the boundary.
Used as the gate, with nothing tuned:

| Model | English present passes | Spanish present passes | absent passes |
| --- | --- | --- | --- |
| `ms-marco-MiniLM-L-6-v2` | 11 / 15 | 0 / 15 | **0 / 8** |
| `jina-reranker-v1-tiny-en` | 11 / 15 | 1 / 15 | **0 / 8** |
| `mxbai-rerank-xsmall-v1` | 11 / 15 | 0 / 15 | **0 / 8** |
| `bge-reranker-v2-m3` | 11 / 15 | 4 / 15 | **0 / 8** |

All four reject every unanswered query and keep 11 of 15 answered ones in
English, with no calibration at all. Compare section 5.3: SigLIP2's own neutral
point keeps 7 of 48. **This is the concrete thing the map gave up** — a
threshold that the model states rather than a number a person picks, and one
that behaves the same way across four different rerankers.

### 7.4 The Spanish column, and what it costs to fix

The three small models are English-only, and the Spanish column shows it: they
score a correct Spanish question like an unanswered one, and the gate keeps 0 or
1 of 15.

`bge-reranker-v2-m3` is multilingual, and it repairs the **ranking** completely:
it puts the right subject at rank 1 for **15 of 15** Spanish questions, where
the bi-encoder of section 6 manages 6 of 15 and the English rerankers 6 to 10 of
15. It does not repair the **gate**. Its worst Spanish answered query scores
−8.49 and its best unanswered query scores −8.07, so the two bands still
overlap, and the zero gate keeps only 4 of 15 Spanish queries.

The bill for that repair, measured: **2271.7 MB** to download, `fp32` weights
that ONNX splits into a side file, **53.9 ms** for one pair and **3124 ms** for
the fifty candidates of one search. Three seconds of extra latency on every
query, for a third model that improves the Spanish ranking and still cannot say
"found nothing" in Spanish without calibration.

## 8. What I did not test

* **The owner's real files.** The image pool is 16 stock photographs and the
  text corpus is 20 passages that I wrote. Both are small, clean and balanced.
  A personal library holds near-duplicates, screenshots, scanned pages and
  subjects that repeat. The `Floor` moves with the corpus, and the published
  work in section 3 says the corpus moves it more than the model does.
* **The real `Text model`.** Section 6 uses a stand-in. Nothing in section 6
  transfers.
* **Long queries.** Every query here is short. #7 already recorded that SigLIP2
  crashes over 64 tokens and that the query is clamped.
* **Quantised weights.** Everything is `fp32`. #7 measured that `q8` degrades
  the ranking of SigLIP2, so it would also move the scores, but I did not
  measure by how much.
* **Chunk size.** The text passages are all about 40 words. #16 decides the real
  chunk size, and the pgvector write-up in section 1.3 shows that the length of
  the text on both sides moves the cosine a lot.
* **Stability over time.** I ran each probe two or three times. The cosines
  repeat exactly; only the timings move.
* **Any threshold sweep with a metric.** I report distributions, not an
  optimum. No precision, no recall, no F1, no AUROC. The sample is far too
  small for those to mean anything.
* **The second query of "More in this file".** #11 scopes it to one `Resource`.
  It has its own score distribution and I did not look at it.
* **A reranker inside the product.** Section 7 measures the model alone. It does
  not measure a pipeline that retrieves 50 and reranks them, and it does not
  measure the memory cost of holding a third model warm beside the other two.

## 9. Sources

**SigLIP and its calibration**

* Zhai et al., *Sigmoid Loss for Language Image Pre-Training*, ICCV 2023 —
  https://arxiv.org/abs/2303.15343
* Hugging Face, SigLIP model documentation (the 31.9% example, and the
  `padding="max_length"` note) —
  https://huggingface.co/docs/transformers/en/model_doc/siglip
* Hugging Face, SigLIP2 model documentation —
  https://huggingface.co/docs/transformers/en/model_doc/siglip2
* `google/siglip2-base-patch16-224` — https://huggingface.co/google/siglip2-base-patch16-224
* `onnx-community/siglip2-base-patch16-224-ONNX` —
  https://huggingface.co/onnx-community/siglip2-base-patch16-224-ONNX
* transformers issue 38175, "Unexpected Zero Probabilities with
  siglip2-base-patch16-224" — https://github.com/huggingface/transformers/issues/38175
* open_clip issue 716, "SigLIP logits" (0.22 for a correct label) —
  https://github.com/mlfoundations/open_clip/issues/716
* `facet` issue 145, "Semantic search broken on SigLIP 2 profiles: padding,
  threshold calibration, and score reporting" (8% for SigLIP2, 22% for CLIP,
  real scores at 0.05–0.07) — https://github.com/ncoevoet/facet/issues/145

**Thresholds in the IR literature**

* Arampatzis, Robertson and Kamps, *Score Distributions in Information
  Retrieval*, ICTIR 2009 —
  https://e.humanities.uva.nl/publications/2009/aram_scor09.pdf
* Arampatzis and Robertson, *Modeling score distributions in information
  retrieval*, Information Retrieval 14(1), 2011 —
  https://link.springer.com/article/10.1007/s10791-010-9145-5
* Rossi et al. (Walmart), *Relevance Filtering for Embedding-based Retrieval*,
  CIKM 2024 — https://arxiv.org/abs/2408.04887
* *On Coherence-based Predictors for Dense Query Performance Prediction* —
  https://arxiv.org/abs/2310.11405
* *On the Limitations of Query Performance Prediction for Neural IR* —
  https://ceur-ws.org/Vol-3478/paper04.pdf
* *Mapping Similarity Spaces across Embedding Models with Synthetic Query
  Probing*, Discovery Science 2026 — https://arxiv.org/abs/2608.05857
* *Similarity Gates Approve Reversals: A Validity Audit of Embedding-Cosine
  Thresholds in Agent Systems* — https://arxiv.org/abs/2608.10216

**Thresholds in vector stores**

* Qdrant, Similarity search (`score_threshold`) —
  https://qdrant.tech/documentation/concepts/search/
* Weaviate, Distance metrics (`distance` and `certainty`) —
  https://docs.weaviate.io/weaviate/config-refs/distances
* Weaviate, Vector search — https://docs.weaviate.io/weaviate/concepts/search/vector-search
* Elasticsearch, kNN search (the `similarity` parameter) —
  https://www.elastic.co/docs/solutions/search/vector/knn
* OpenSearch, Understanding vector radial search —
  https://opensearch.org/blog/vector-radial-search/
* Azure AI Search, Vector relevance and ranking —
  https://learn.microsoft.com/en-us/azure/search/vector-search-ranking
* Supabase, Semantic search (`match_threshold`) —
  https://supabase.com/docs/guides/ai/semantic-search
* pgvector issue 219, "Returning confidence or similarity score upon returning
  nearest neighbors" — https://github.com/pgvector/pgvector/issues/219
* *Deduplicating feature requests with pgvector: the threshold is a trap* —
  https://dev.to/noahchenbuilds/deduplicating-feature-requests-with-pgvector-the-threshold-is-a-trap-5dk9

**Rerankers**

* `Xenova/ms-marco-MiniLM-L-6-v2` — https://huggingface.co/Xenova/ms-marco-MiniLM-L-6-v2
* `jinaai/jina-reranker-v1-tiny-en` — https://huggingface.co/jinaai/jina-reranker-v1-tiny-en
* `jinaai/jina-reranker-v2-base-multilingual` —
  https://huggingface.co/jinaai/jina-reranker-v2-base-multilingual
* `mixedbread-ai/mxbai-rerank-xsmall-v1` —
  https://huggingface.co/mixedbread-ai/mxbai-rerank-xsmall-v1
* `onnx-community/bge-reranker-v2-m3-ONNX` —
  https://huggingface.co/onnx-community/bge-reranker-v2-m3-ONNX
* `Xenova/bge-reranker-base` — https://huggingface.co/Xenova/bge-reranker-base
* BGE reranker documentation — https://bge-model.com/Introduction/reranker.html

**The image pool**

* COCO 2017 validation set — http://images.cocodataset.org/val2017/
