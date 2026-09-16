// Probe 11. Where is the real wall on the long-context models?
// Run as: node longwall.mjs <key> <dtype>
// The token probe of `tokens.mjs` stops at 4096, because that is as long as the
// test text gets. Here the input_ids are made by hand, so the sequence can go
// to 32768 and the graph can be pushed until it breaks. The time per call is
// reported too, because attention is quadratic and a long window that takes
// ten seconds is not a usable window.
import { AutoModel, AutoTokenizer, Tensor } from '@huggingface/transformers';
import { byKey } from './common.mjs';

const [key, dtype = 'fp32'] = process.argv.slice(2);
const c = byKey(key);
const out = { key, id: c.id, dtype, steps: {} };

const tok = await AutoTokenizer.from_pretrained(c.id);
const model = await AutoModel.from_pretrained(c.id, { dtype });
out.model_max_length = tok.model_max_length;
out.max_position_embeddings = model.config?.max_position_embeddings ?? null;

// A real word repeated, so the ids are valid for every vocabulary.
const unit = tok('invoice ', { add_special_tokens: false }).input_ids.tolist()[0];
const wantsTypeIds = 'token_type_ids' in tok('a');

function inputsOfLength(n) {
  const ids = [];
  while (ids.length < n) ids.push(...unit);
  const slice = ids.slice(0, n).map((x) => BigInt(x));
  const dims = [1, n];
  const o = {
    input_ids: new Tensor('int64', BigInt64Array.from(slice), dims),
    attention_mask: new Tensor('int64', BigInt64Array.from(slice.map(() => 1n)), dims),
  };
  if (wantsTypeIds) o.token_type_ids = new Tensor('int64', BigInt64Array.from(slice.map(() => 0n)), dims);
  return o;
}

// Attention is quadratic, so a long window is not free. Stop as soon as one
// step costs more than the budget: a window that takes a minute per chunk is
// not a window this product can use, and the next step would take four times
// as long again.
const BUDGET_MS = 12000;

for (const n of [2048, 4096, 8192, 8193, 16384, 32768]) {
  try {
    const t0 = performance.now();
    const r = await model(inputsOfLength(n));
    const ms = Math.round(performance.now() - t0);
    if (ms > BUDGET_MS) {
      out.steps[n] = `ok in ${ms} ms, over the ${BUDGET_MS} ms budget, stopped here`;
      break;
    }
    const t = r.sentence_embedding ?? r.last_hidden_state ?? r.token_embeddings ?? Object.values(r)[0];
    let finite = true;
    for (let i = 0; i < Math.min(t.data.length, 4096); i++) {
      if (!Number.isFinite(Number(t.data[i]))) finite = false;
    }
    out.steps[n] = `ok in ${ms} ms, dims=${t.dims}, finite=${finite}`;
  } catch (e) {
    out.steps[n] = `FAIL ${String(e?.message ?? e).replace(/\s+/g, ' ').slice(0, 220)}`;
    break;
  }
}
console.log(JSON.stringify(out));
