// Probe 10. The two static embedding models, which the loader refuses.
// Run as: node static.mjs
// `sentence-transformers/static-retrieval-mrl-en-v1` ships an ONNX export but
// no `config.json` and no `tokenizer_config.json` at the top of the repo. Its
// tokenizer lives in `0_StaticEmbedding/tokenizer.json`. This script shows
// exactly where the plain call stops, and then tries the two obvious ways
// round it.
import { AutoModel, AutoTokenizer, PreTrainedTokenizer, env } from '@huggingface/transformers';

env.cacheDir = new URL('./.cache/', import.meta.url).pathname;
env.allowLocalModels = false;

const IDS = [
  'sentence-transformers/static-retrieval-mrl-en-v1',
  'sentence-transformers/static-similarity-mrl-multilingual-v1',
];

for (const id of IDS) {
  const out = { id, attempts: {} };

  try {
    await AutoTokenizer.from_pretrained(id);
    out.attempts.plain_tokenizer = 'ok';
  } catch (e) {
    out.attempts.plain_tokenizer = `FAIL ${String(e?.message ?? e).slice(0, 160)}`;
  }

  try {
    await AutoTokenizer.from_pretrained(id, { subfolder: '0_StaticEmbedding' });
    out.attempts.tokenizer_in_subfolder = 'ok';
  } catch (e) {
    out.attempts.tokenizer_in_subfolder = `FAIL ${String(e?.message ?? e).slice(0, 160)}`;
  }

  // The last way round: fetch tokenizer.json by hand and build the tokenizer
  // with an empty config.
  try {
    const r = await fetch(`https://huggingface.co/${id}/resolve/main/0_StaticEmbedding/tokenizer.json`);
    const json = await r.json();
    const tok = new PreTrainedTokenizer(json, {});
    const enc = tok('a short sentence about invoices');
    out.attempts.hand_built_tokenizer = `ok, ${enc.input_ids.dims[1]} tokens`;

    const model = await AutoModel.from_pretrained(id, { dtype: 'fp32' });
    const res = await model(enc);
    out.attempts.model = `ok, outputs ${Object.entries(res).map(([k, v]) => `${k}=${v.dims}`).join(' ')}`;
  } catch (e) {
    out.attempts.hand_built_tokenizer_or_model = `FAIL ${String(e?.message ?? e).slice(0, 200)}`;
  }

  // And the last question: does the ONNX file itself work, if you drop the
  // library and drive ONNX Runtime by hand?
  try {
    const ort = await import('onnxruntime-node');
    const url = `https://huggingface.co/${id}/resolve/main/onnx/model.onnx`;
    const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
    const session = await ort.InferenceSession.create(buf);
    out.attempts.raw_onnx_inputs = session.inputNames.join(',');
    out.attempts.raw_onnx_outputs = session.outputNames.join(',');

    const r = await fetch(`https://huggingface.co/${id}/resolve/main/0_StaticEmbedding/tokenizer.json`);
    const tok = new PreTrainedTokenizer(await r.json(), {});
    const enc = tok('a short sentence about invoices');
    const ids = enc.input_ids.tolist()[0].map((x) => BigInt(x));
    const feeds = {
      input_ids: new ort.Tensor('int64', BigInt64Array.from(ids), [1, ids.length]),
      attention_mask: new ort.Tensor('int64', BigInt64Array.from(ids.map(() => 1n)), [1, ids.length]),
    };
    const res = await session.run(feeds);
    const k = session.outputNames[0];
    out.attempts.raw_onnx_run = `ok, ${k}=${res[k].dims}`;
  } catch (e) {
    out.attempts.raw_onnx_run = `FAIL ${String(e?.message ?? e).slice(0, 200)}`;
  }

  console.log(JSON.stringify(out));
}
