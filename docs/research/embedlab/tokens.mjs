// Probe 4. The token window, and what happens when you go past it.
// Run as: node tokens.mjs <key> <dtype>
// Three questions:
//   1. what does the tokenizer say its limit is?
//   2. does `truncation: true` alone clip the sequence?
//   3. what does the ONNX graph do with a sequence that is too long --
//      correct answer, silent nonsense, or a crash?
import { AutoModel, AutoTokenizer, Tensor } from '@huggingface/transformers';
import { byKey, LONG, PARA } from './common.mjs';

const [key, dtype = 'fp32'] = process.argv.slice(2);
const c = byKey(key);
const out = { key, id: c.id, dtype };

const tok = await AutoTokenizer.from_pretrained(c.id);
out.model_max_length = tok.model_max_length;

// Question 1 and 2: the tokenizer alone.
out.tokenizer = {};
for (const [label, opts] of [
  ['default', {}],
  ['truncation:true', { truncation: true }],
  ['truncation+max_length:512', { truncation: true, max_length: 512 }],
  ['padding:max_length+truncation', { padding: 'max_length', truncation: true }],
]) {
  try {
    out.tokenizer[label] = tok(LONG, opts).input_ids.dims[1];
  } catch (e) {
    out.tokenizer[label] = `ERROR ${String(e?.message ?? e).slice(0, 120)}`;
  }
}
out.tokens_of_paragraph = tok(PARA, { truncation: false }).input_ids.dims[1];
out.tokens_of_long_text = tok(LONG, { truncation: false }).input_ids.dims[1];

// Question 3: the graph.
const model = await AutoModel.from_pretrained(c.id, { dtype });
out.max_position_embeddings = model.config?.max_position_embeddings ?? null;

const full = tok(LONG, { truncation: false });
const ids = full.input_ids.tolist()[0].map((x) => BigInt(x));
const wantsTypeIds = 'token_type_ids' in full;

function inputsOfLength(n) {
  const slice = ids.slice(0, n);
  const dims = [1, slice.length];
  const o = {
    input_ids: new Tensor('int64', BigInt64Array.from(slice), dims),
    attention_mask: new Tensor('int64', BigInt64Array.from(slice.map(() => 1n)), dims),
  };
  if (wantsTypeIds) o.token_type_ids = new Tensor('int64', BigInt64Array.from(slice.map(() => 0n)), dims);
  return o;
}

out.ladder = {};
for (const n of [32, 64, 128, 256, 512, 513, 1024, 2048, 4096, 8192]) {
  if (n > ids.length) {
    out.ladder[n] = 'text too short to test';
    continue;
  }
  try {
    const r = await model(inputsOfLength(n));
    const t = r.last_hidden_state ?? r.token_embeddings ?? r.sentence_embedding ?? Object.values(r)[0];
    const arr = t.data;
    let finite = true;
    for (let i = 0; i < Math.min(arr.length, 4096); i++) if (!Number.isFinite(Number(arr[i]))) finite = false;
    out.ladder[n] = `ok dims=${t.dims} finite=${finite}`;
  } catch (e) {
    out.ladder[n] = `FAIL ${String(e?.message ?? e).replace(/\s+/g, " ").slice(0, 400)}`;
  }
}
console.log(JSON.stringify(out));
