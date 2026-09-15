# Prototype: does text-to-image search really work?

Throwaway prototype for issue #7. It is not project code and it never moves to
`master`. It names package versions, model ids and measured timings that go
stale.

Measured on the owner's laptop (Darwin 25.6.0, Node v24.11.0,
`@huggingface/transformers` ^4.2.0) over 27 of the owner's own images.

## What is here

- `proto.mjs` — indexes a folder of images with each candidate model, embeds the
  queries, prints the ranking and writes a `results.html` contact sheet.
- `diag.mjs` — the wiring diagnosis: CLIP in `q8` against `fp32`, SigLIP2 with
  dynamic padding against fixed-length padding.
- `queries.txt` — the owner's five queries, and the same five in English.
- `lang.txt` — the accent and phrasing check.
- `run-owner-queries.txt`, `run-language-check.txt` — the raw output.

## How to run

```
npm install
node proto.mjs <images-dir> queries.txt
```

## Findings

**SigLIP2 base/16 `fp32` is the model.** It separates far better than CLIP
ViT-B/32 and it understands Spanish. The owner searches in Spanish.

**SigLIP needs text padded to a fixed length.** With dynamic padding the ranking
is noise and nothing throws: the whale came seventh for "a whale in the ocean",
every score sat near zero. With `padding: 'max_length', max_length: 64` the same
model answers correctly. Whoever writes the adapter must pad to the fixed
length.

**`q8` quantization degrades the ranking.** CLIP in `q8` put a traditional
attire photo above the lion cub for "a lion cub"; the same model in `fp32`
corrected it. SigLIP2 in `fp32` separates better than in `q8`. The earlier
research measured `q8` for speed only, so this cost was not on the bill.

**CLIP ViT-B/32 does not understand Spanish.** For "mujer" it returned a hammer
first and the photo of the woman seventh. For "persona nadando", a hammer again.
It only survived "martillo" and "playa".

**Accents carry meaning.** "animales acuaticos" ranked a lotus fourth;
"animales acuáticos" replaced it with the diver and raised every score. The
query must reach the embedder verbatim — no accent stripping, no normalizing.

**Caption-shaped queries beat bare nouns.** "playa" missed the third beach and
ranked a woman third; "una foto de una playa" ranked the three beaches 1-2-3.
These models are trained on captions. Phrasing correctly halves the residual
English advantage: bare, "playa" 0.1086 against "a beach" 0.1274; as captions,
"una foto de una playa" 0.1197 against "a photo of a beach" 0.1291.

**Speed on this laptop, SigLIP2 `fp32`:** 56 ms per image indexing — 27 images
in 1.7 s, so roughly a minute for a thousand and nine and a half minutes for ten
thousand. A query embeds in 10-12 ms. The model loads from cache in 1.7 s.

## What the prototype could not test

The set is 27 stock photographs, not the owner's real library. It does have
repeated subjects — three beaches, two penguin photographs, several people, two
workshops — so the ranking between near neighbours was exercised. A library of
thousands, with many near-identical photographs, was not.
