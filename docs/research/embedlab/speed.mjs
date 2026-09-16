// Probe 6. Speed per chunk on this machine, and resident memory.
// Run as: node speed.mjs <key> <dtype>
// The chunk is one 900-character paragraph, the size a real chunker produces.
// Batch 32 is the number the #3 report used for its MiniLM baseline, so the
// numbers can be compared with it.
//
// Two different things are timed, because they differ by a lot:
//   forward  tokenizer + ONNX graph. This is what report #3 timed.
//   embed    the same, plus reading the hidden state into JavaScript and
//            pooling it there. This is what an application really pays.
import { byKey, CHUNKS, timeIt } from './common.mjs';
import { makeEmbedder } from './embed.mjs';

const [key, dtype = 'fp32'] = process.argv.slice(2);
const c = byKey(key);

const rss0 = process.memoryUsage().rss;
const t0 = performance.now();
const { tok, embed, raw } = await makeEmbedder(c, dtype);
const load_ms = Math.round(performance.now() - t0);
const rss1 = process.memoryUsage().rss;

const dp = c.dp ?? '';
const qp = c.qp ?? '';
const chunks = CHUNKS.map((t) => dp + t);

const out = { key, id: c.id, dtype, warm_load_ms: load_ms };
out.tokens_per_chunk = tok(chunks[0], { truncation: true }).input_ids.dims[1];

for (const b of [1, 8, 32]) {
  const batch = chunks.slice(0, b);
  const f = await timeIt(() => raw(batch), 2, b === 32 ? 3 : 5);
  const e = await timeIt(() => embed(batch), 2, b === 32 ? 3 : 5);
  out[`forward_${b}`] = f;
  out[`embed_${b}`] = e;
  out[`forward_per_chunk_${b}`] = +(f.median / b).toFixed(2);
  out[`embed_per_chunk_${b}`] = +(e.median / b).toFixed(2);
}
out.chunks_per_second_forward_32 = Math.round(32000 / out.forward_32.median);
out.chunks_per_second_embed_32 = Math.round(32000 / out.embed_32.median);

// A short query, which is what the search path pays.
out.query_forward = await timeIt(() => raw([`${qp}where is the invoice for March`]), 3, 20);
out.query_embed = await timeIt(() => embed([`${qp}where is the invoice for March`]), 3, 20);

const rss2 = process.memoryUsage().rss;
out.rss_before_load_mb = +(rss0 / 1048576).toFixed(0);
out.rss_after_load_mb = +(rss1 / 1048576).toFixed(0);
out.rss_after_work_mb = +(rss2 / 1048576).toFixed(0);
out.dim = (await embed(['probe']))[0].length;
console.log(JSON.stringify(out));
