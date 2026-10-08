---
kind: decision
status: accepted
---

# A local model costs the reference price of a hosted model

**The models run locally and have no bill. The Cost of each Model call uses the
list price of a hosted Voyage model of the same kind, fixed in the constant of
the model (`TEXT_MODEL`, `VISION_MODEL`, `RERANKER_MODEL`) beside its
`repository`. The Langfuse adapter sends the money in `costDetails`. Langfuse
gets no model definition.** The domain keeps no price.

Decided in
[Which price each local model gets in Langfuse](https://github.com/javierponferradalopez/local-semantic-search/issues/132).

| Model | Usage key with a price (USD for each unit) | Reference |
|---|---|---|
| Text model | `input`: 0.00000002 | `voyage-4-lite`, $0.02 for 1M tokens |
| Vision model | `image`: 0.0000301; `input`: 0.00000012 | `voyage-multimodal-3.5` |
| Reranker | `input`: 0.00000002 | `rerank-2.5-lite`, $0.02 for 1M tokens |

`pairs` gets no price. It stays in the Usage as information.

## Why a reference price

The Cost of a local model is compute. A reference price gives the same unit,
the dollar, to the three models and to a hosted model that replaces one. It
answers "what would this Session cost on a hosted model".

## Why in the constant, and sent by the code

The price changes with its model, so it stays beside the `repository`. A
`costDetails` from the code has priority in Langfuse, so no script and no step
by hand keeps a model definition in Langfuse in step with the code.

## Considered options

- **A custom model definition in Langfuse.** Refused: the price lives outside
  the repository, and a new model needs a step by hand.
- **Usage with no price.** Refused: the Usage of three models in three units
  does not add up to the Cost of a Session.

## Consequences

- **A change of a reference price is a commit.** Old observations keep their
  Cost.
- **A real hosted model needs no price here:** Langfuse knows its price.
