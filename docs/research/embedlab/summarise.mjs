// Turns the raw probe output into the tables that go in the report.
// Run as: node summarise.mjs
import { readFileSync, existsSync } from 'node:fs';

const read = (f) =>
  existsSync(f)
    ? readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
    : [];

const load = read('out_load.jsonl');
const speed = read('out_speed.jsonl');
const toks = read('out_tokens.jsonl');
const lang = read('out_lang.jsonl');
const mrl = read('out_matryoshka.jsonl');
const quant = read('out_quant.jsonl');

console.log('## Loaded\n');
console.log('| key | dtype | ok | class | dim | maxpos | tokenizer max | warm load ms | error |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const d of load) {
  console.log(`| ${d.key} | ${d.dtype} | ${d.ok} | ${d.model_class ?? ''} | ${d.hidden_size ?? ''} | ${d.max_position_embeddings ?? ''} | ${d.model_max_length ?? ''} | ${d.warm_load_ms ?? ''} | ${(d.error ?? '').slice(0, 90)} |`);
}

console.log('\n## Speed\n');
console.log('| key | dtype | tokens/chunk | batch 1 | batch 8 | batch 32 | per chunk @32 | query ms | RSS after load MB |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const d of speed) {
  if (!d.batch_1) { console.log(`| ${d.key} | ${d.dtype} | FAILED | | | | | | |`); continue; }
  console.log(`| ${d.key} | ${d.dtype} | ${d.tokens_per_chunk} | ${d.batch_1.median} | ${d.batch_8.median} | ${d.batch_32.median} | ${d.per_chunk_32} | ${d.query.median} | ${d.rss_after_load_mb} |`);
}

console.log('\n## Token window\n');
for (const d of toks) {
  console.log(`\n### ${d.key} ${d.dtype} (${d.id})`);
  console.log(`model_max_length=${d.model_max_length} max_position_embeddings=${d.max_position_embeddings}`);
  console.log(`paragraph=${d.tokens_of_paragraph} tok, long text=${d.tokens_of_long_text} tok`);
  console.log('tokenizer:', JSON.stringify(d.tokenizer));
  console.log('graph:', JSON.stringify(d.ladder));
}

console.log('\n## Language probe\n');
console.log('| key | dtype | mode | dim | hits@1 | ranks of the wanted passage | ranks of the other-language twin |');
console.log('| --- | --- | --- | --- | --- | --- | --- |');
for (const d of lang) {
  if (!d.queries) { console.log(`| ${d.key} | ${d.dtype} | | | FAILED | | |`); continue; }
  console.log(`| ${d.key} | ${d.dtype} | ${d.mode} | ${d.dim} | ${d.hits_at_1}/${d.total} | ${d.queries.map((q) => q.rank_want).join(' ')} | ${d.queries.map((q) => q.rank_cross).join(' ')} |`);
}

console.log('\n## Matryoshka\n');
for (const d of mrl) {
  if (!d.widths) continue;
  console.log(`\n### ${d.key} ${d.dtype} full=${d.full_dim} claimed=${JSON.stringify(d.claimed)}`);
  console.log('| width | identical ranking | same top-1 | mean score shift | hits@1 |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const [w, v] of Object.entries(d.widths)) {
    console.log(`| ${w} | ${v.identical_ranking} | ${v.same_top1} | ${v.mean_abs_score_shift} | ${v.hits_at_1} |`);
  }
}

console.log('\n## fp32 against q8\n');
console.log('| key | dim | long-text cos | identical ranking | same top-1 | hits@1 fp32 | hits@1 q8 |');
console.log('| --- | --- | --- | --- | --- | --- | --- |');
for (const d of quant) {
  if (!d.identical_ranking) { console.log(`| ${d.key} | | FAILED | | | | |`); continue; }
  console.log(`| ${d.key} | ${d.dim} | ${d.long_text_cos} | ${d.identical_ranking} | ${d.same_top1} | ${d.hits_at_1_fp32} | ${d.hits_at_1_q8} |`);
}
