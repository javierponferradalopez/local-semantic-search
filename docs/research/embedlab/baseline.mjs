// Probe 9. The baseline from report #3, measured again.
// Run as: node baseline.mjs [4.2.0|4.3.0]
// #3 measured `all-MiniLM-L6-v2` q8 at 4.4 ms per chunk in a batch of 32, with
// `@huggingface/transformers` 4.2.0. This machine is the same machine, so the
// number must be reproducible. The script runs the same shape of work with the
// library version named on the command line, so 4.3.0 can be compared with the
// version #3 used.
import { stats } from './common.mjs';

const version = process.argv[2] ?? '4.3.0';
const mod = version === '4.2.0'
  ? await import('transformers-4.2.0')
  : await import('@huggingface/transformers');
const { AutoModel, AutoTokenizer, env } = mod;
env.cacheDir = new URL('./.cache/', import.meta.url).pathname;
env.allowLocalModels = false;

const PARA = `Hexagonal architecture, also known as ports and adapters, is a software design pattern that isolates the core business logic of an application from the outside world. The core defines ports, which are interfaces that describe what the application needs or offers. Adapters implement those ports and connect the core to databases, message queues, web frameworks, and file systems. Because the core depends only on its own abstractions, it can be tested without any infrastructure. A test can replace a real database adapter with an in-memory one and the core will not notice the difference. This separation also makes it easy to swap technologies later. If the team decides to move from PostgreSQL to a vector database, only the adapter changes.`;
const CHUNKS = Array.from({ length: 32 }, (_, i) => `${PARA.slice(0, 900)} Variation ${i}.`);

const id = 'Xenova/all-MiniLM-L6-v2';
const tok = await AutoTokenizer.from_pretrained(id);
const model = await AutoModel.from_pretrained(id, { dtype: 'q8' });

async function run(batch) {
  const inputs = tok(batch, { padding: true, truncation: true });
  await model(inputs);
}

const out = { version: mod.env.version ?? version, id, dtype: 'q8' };
out.tokens_per_chunk = tok(CHUNKS[0], { truncation: true }).input_ids.dims[1];
for (const b of [1, 8, 32]) {
  const batch = CHUNKS.slice(0, b);
  for (let i = 0; i < 2; i++) await run(batch);
  const ts = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await run(batch);
    ts.push(performance.now() - t0);
  }
  const s = stats(ts);
  out[`batch_${b}`] = s;
  out[`per_chunk_${b}`] = +(s.median / b).toFixed(2);
  out[`chunks_per_second_${b}`] = Math.round((b * 1000) / s.median);
}
console.log(JSON.stringify(out));
