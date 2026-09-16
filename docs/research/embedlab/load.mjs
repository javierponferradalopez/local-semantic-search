// Probe 3. Load one candidate at one dtype and get a vector out of it.
// Run as: node load.mjs <key> <dtype>
// One process per candidate, because a bad ONNX graph can abort the process.
import { AutoModel, AutoTokenizer } from '@huggingface/transformers';
import { byKey, PARA } from './common.mjs';

const [key, dtype = 'fp32'] = process.argv.slice(2);
const c = byKey(key);
if (!c) throw new Error(`unknown key ${key}`);

const out = { key, id: c.id, dtype };
try {
  let t0 = performance.now();
  const tok = await AutoTokenizer.from_pretrained(c.id);
  out.tokenizer_ms = Math.round(performance.now() - t0);
  out.tokenizer_class = tok.constructor.name;
  out.model_max_length = tok.model_max_length;

  t0 = performance.now();
  const model = await AutoModel.from_pretrained(c.id, { dtype });
  out.load_ms = Math.round(performance.now() - t0);
  out.model_class = model.constructor.name;
  out.model_type = model.config?.model_type ?? null;
  out.hidden_size = model.config?.hidden_size ?? null;
  out.max_position_embeddings = model.config?.max_position_embeddings ?? null;

  // A short text through the raw model, to see what the graph actually returns.
  const inputs = tok('a short sentence about invoices', { padding: true, truncation: true });
  out.input_names = Object.keys(inputs);
  const r = await model(inputs);
  out.output_names = Object.fromEntries(
    Object.entries(r).map(([k, v]) => [k, v?.dims ?? String(v).slice(0, 40)]),
  );

  // Warm reload, to separate download from session build.
  t0 = performance.now();
  await AutoModel.from_pretrained(c.id, { dtype });
  out.warm_load_ms = Math.round(performance.now() - t0);

  // Token counts on the shared paragraph.
  out.tokens_untruncated = tok(PARA, { truncation: false, padding: false }).input_ids.dims[1];
  out.tokens_default_truncation = tok(PARA, { truncation: true }).input_ids.dims[1];
  out.ok = true;
} catch (e) {
  out.ok = false;
  out.error = String(e?.message ?? e).slice(0, 400);
}
console.log(JSON.stringify(out));
