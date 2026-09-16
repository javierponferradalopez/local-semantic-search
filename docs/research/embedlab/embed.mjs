// A small embedder, written by hand so the pooling is visible and correct.
// The library pipeline hides two things this study must see: it always calls
// the tokenizer with `truncation: true` and no `max_length`, and it reads only
// `last_hidden_state`, `logits` or `token_embeddings` from the graph.
import { AutoModel, AutoTokenizer } from '@huggingface/transformers';

export async function makeEmbedder(c, dtype, opts = {}) {
  const tok = await AutoTokenizer.from_pretrained(c.id);
  const model = await AutoModel.from_pretrained(c.id, { dtype });

  const tokenizerOpts = { padding: true, truncation: true };
  if (opts.max_length) tokenizerOpts.max_length = opts.max_length;

  async function raw(texts) {
    const inputs = tok(texts, tokenizerOpts);
    const r = await model(inputs);
    return { inputs, r };
  }

  async function embed(texts) {
    const { inputs, r } = await raw(texts);
    // Some exports pool inside the graph. Use that when it is there.
    const pooled = r.sentence_embedding ?? r.pooler_output_no_dense ?? null;
    if (pooled && pooled.dims.length === 2) return normaliseRows(pooled.tolist());

    const t = r.last_hidden_state ?? r.token_embeddings ?? r.logits;
    if (!t) throw new Error(`no token tensor in output: ${Object.keys(r).join(',')}`);
    const h = t.tolist();
    const mask = inputs.attention_mask.tolist();
    const rows = h.map((seq, i) => {
      const m = mask[i].map(Number);
      if (c.pooling === 'cls' || c.pooling === 'first_token') return seq[0];
      if (c.pooling === 'last_token' || c.pooling === 'eos') {
        let last = m.length - 1;
        while (last > 0 && m[last] === 0) last--;
        return seq[last];
      }
      const dim = seq[0].length;
      const acc = new Array(dim).fill(0);
      let n = 0;
      for (let j = 0; j < seq.length; j++) {
        if (m[j] === 0) continue;
        n++;
        for (let k = 0; k < dim; k++) acc[k] += seq[j][k];
      }
      return acc.map((x) => x / Math.max(n, 1));
    });
    return normaliseRows(rows);
  }

  return { tok, model, embed, raw };
}

export function normaliseRows(rows) {
  return rows.map((v) => {
    let s = 0;
    for (const x of v) s += x * x;
    const inv = 1 / Math.sqrt(s || 1);
    return v.map((x) => x * inv);
  });
}
