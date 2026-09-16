// Probe 4 for issue #19 -- what a cross-encoder reranker costs in Node.
//
// The map ruled out a reranker as a third model. This probe measures what that
// refusal bought: download size, load time from a warm cache, and latency per
// candidate pair, in Node with @huggingface/transformers on the CPU.
//
// It also records whether the reranker separates a relevant pair from an
// irrelevant one better than the bi-encoder cosine does, on the same corpus.
//
// Usage: node rerank-cost.mjs

import { AutoTokenizer, AutoModelForSequenceClassification, env } from '@huggingface/transformers';
import { performance } from 'node:perf_hooks';
import { PASSAGES, PRESENT, ABSENT, PRESENT_ES } from './corpus.mjs';

env.allowLocalModels = false;

const MODELS = [
  { id: 'Xenova/ms-marco-MiniLM-L-6-v2', note: 'English, 6 layers' },
  { id: 'jinaai/jina-reranker-v1-tiny-en', note: 'English, 4 layers' },
  { id: 'mixedbread-ai/mxbai-rerank-xsmall-v1', note: 'English' },
  { id: 'jinaai/jina-reranker-v2-base-multilingual', note: 'multilingual' },
  // Its fp32 export splits the weights into `model.onnx_data`, so it needs
  // `use_external_data_format`.
  { id: 'onnx-community/bge-reranker-v2-m3-ONNX', note: 'multilingual, XLM-R large',
    opts: { use_external_data_format: true } },
];
const DTYPE = 'fp32';

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const f4 = (x) => x.toFixed(4);

// Download size, straight from the Hub API. No download needed.
// `model.onnx` plus `model.onnx_data`, because a large export splits its weights
// into a side file and the `.onnx` alone then looks tiny.
async function size(id) {
  const r = await fetch(`https://huggingface.co/api/models/${id}/tree/main/onnx`);
  const list = await r.json();
  if (!Array.isArray(list)) return null;
  return list.filter((x) => x.path === 'onnx/model.onnx' || x.path === 'onnx/model.onnx_data')
    .reduce((s, x) => s + x.size, 0);
}

console.log('--- fp32 ONNX download size, from the Hub API ---');
for (const m of [...MODELS, { id: 'Xenova/bge-reranker-base', note: 'not run here' }]) {
  const s = await size(m.id);
  console.log(`${m.id.padEnd(46)} ${s ? `${(s / 1e6).toFixed(1)} MB` : 'n/a'}  (${m.note})`);
}

// The 50 rows that #11 puts on screen are the realistic reranker load.
const CANDIDATES = 50;
const pool = [];
while (pool.length < CANDIDATES) pool.push(PASSAGES[pool.length % PASSAGES.length][1]);

for (const m of MODELS) {
  console.log(`\n=== ${m.id} ${DTYPE} ===`);
  let tok, model;
  const t0 = performance.now();
  try {
    tok = await AutoTokenizer.from_pretrained(m.id);
    model = await AutoModelForSequenceClassification.from_pretrained(m.id,
      { dtype: DTYPE, ...(m.opts ?? {}) });
  } catch (e) {
    console.log(`FAILED to load: ${String(e).slice(0, 300)}`);
    continue;
  }
  console.log(`load (cold, includes download) ${Math.round(performance.now() - t0)} ms`);

  const score = async (query, texts) => {
    const inputs = tok(new Array(texts.length).fill(query), {
      text_pair: texts, padding: true, truncation: true,
    });
    const { logits } = await model(inputs);
    return Array.from(logits.data);
  };

  // warm up
  await score('warm up', [PASSAGES[0][1]]);

  // one pair at a time
  const one = [];
  for (let i = 0; i < 10; i++) {
    const t = performance.now();
    await score(PRESENT[i % PRESENT.length][1], [pool[i]]);
    one.push(performance.now() - t);
  }
  one.sort((a, b) => a - b);
  console.log(`1 pair at a time: median ${one[one.length >> 1].toFixed(1)} ms`);

  // the whole batch of 50, which is what a reranker over #11's result list costs
  const batch = [];
  for (let i = 0; i < 3; i++) {
    const t = performance.now();
    await score(PRESENT[i][1], pool);
    batch.push(performance.now() - t);
  }
  batch.sort((a, b) => a - b);
  const med = batch[batch.length >> 1];
  console.log(`${CANDIDATES} pairs in one batch: median ${med.toFixed(0)} ms ` +
    `(${(med / CANDIDATES).toFixed(1)} ms per candidate)`);

  // Separation, asked the way #11 asks it: the BEST logit of the whole corpus,
  // for a query that has an answer and for a query that has none.
  const all = PASSAGES.map(([, t]) => t);
  const presentTop = [], absentTop = [], esTop = [];
  let esRight = 0;
  for (const [, q] of PRESENT) presentTop.push(Math.max(...await score(q, all)));
  for (const [, q] of ABSENT) absentTop.push(Math.max(...await score(q, all)));
  for (const [tag, q] of PRESENT_ES) {
    const s = await score(q, all);
    const best = s.indexOf(Math.max(...s));
    esTop.push(s[best]);
    if (PASSAGES[best][0].startsWith(tag)) esRight++;
  }
  const stat = (v) => {
    const s = [...v].sort((a, b) => a - b);
    return `n=${s.length} min ${f4(s[0])} median ${f4(s[s.length >> 1])} max ${f4(s[s.length - 1])}`;
  };
  console.log(`top logit, english, answer present ${stat(presentTop)}`);
  console.log(`top logit, spanish, answer present ${stat(esTop)}  right subject ${esRight}/${esTop.length}`);
  console.log(`top logit, answer absent           ${stat(absentTop)}`);
  const lo = Math.min(...presentTop), hi = Math.max(...absentTop);
  console.log(`separation: worst english present ${f4(lo)} against best absent ${f4(hi)} -> gap ${f4(lo - hi)}`);
  console.log(`as sigmoid: worst present ${f4(sigmoid(lo))} best absent ${f4(sigmoid(hi))}`);
  console.log(`a logit of 0 as the gate: english ${presentTop.filter((x) => x > 0).length}/` +
    `${presentTop.length}, spanish ${esTop.filter((x) => x > 0).length}/${esTop.length}, ` +
    `absent ${absentTop.filter((x) => x > 0).length}/${absentTop.length}`);

  await model.dispose?.();
}
