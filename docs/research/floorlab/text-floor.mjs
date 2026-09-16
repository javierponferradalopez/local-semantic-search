// Probe 2 for issue #19 -- the text space.
//
// WARNING. The text model of this project is NOT chosen yet. This probe uses
// `Xenova/all-MiniLM-L6-v2` fp32 as a stand-in, so that the shape of the
// question can be seen. Every number here must be measured again when the
// text model is chosen. Do not carry these numbers into the product.
//
// Usage: node text-floor.mjs

import { pipeline, env } from '@huggingface/transformers';
import { performance } from 'node:perf_hooks';
import { PASSAGES, PRESENT, ABSENT, NOISE, PRESENT_ES } from './corpus.mjs';

env.allowLocalModels = false;

const ID = process.argv[2] ?? 'Xenova/all-MiniLM-L6-v2';
const DTYPE = 'fp32';
const f4 = (x) => x.toFixed(4);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

const t0 = performance.now();
const extract = await pipeline('feature-extraction', ID, { dtype: DTYPE });
console.log(`model ${ID} ${DTYPE}`);
console.log(`load ${Math.round(performance.now() - t0)} ms`);

const embed = async (text) => {
  const out = await extract(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
};

const t1 = performance.now();
const docVecs = [];
for (const [, text] of PASSAGES) docVecs.push(await embed(text));
console.log(`passages ${PASSAGES.length}, index ${Math.round(performance.now() - t1)} ms\n`);

const ask = async (bucket, tag, text) => {
  const t = performance.now();
  const qv = await embed(text);
  const ms = performance.now() - t;
  const scored = PASSAGES.map(([id], i) => ({ id, s: dot(qv, docVecs[i]) }))
    .sort((a, b) => b.s - a.s);
  const hit = bucket.startsWith('present') ? scored[0].id.startsWith(tag) : null;
  return { bucket, tag, text, ms, top1: scored[0].s, top1Id: scored[0].id, hit,
    top2: scored[1].s, median: scored[scored.length >> 1].s, min: scored[scored.length - 1].s };
};

const results = [];
for (const [tag, q] of PRESENT) results.push(await ask('present', tag, q));
for (const [tag, q] of PRESENT_ES) results.push(await ask('present-es', tag, q));
for (const [tag, q] of ABSENT) results.push(await ask('absent', tag, q));
for (const q of NOISE) results.push(await ask('noise', 'noise', q));

console.log('bucket      top1    top2    median  min     correct  winner     query');
for (const r of results) {
  console.log(`${r.bucket.padEnd(11)} ${f4(r.top1)}  ${f4(r.top2)}  ${f4(r.median)}  ` +
    `${f4(r.min)}  ${(r.hit === null ? '-' : r.hit ? 'yes' : 'NO ').padEnd(7)}  ` +
    `${r.top1Id.padEnd(9)}  "${r.text}"`);
}

const by = (b) => results.filter((r) => r.bucket === b);
const stat = (rs) => {
  const v = rs.map((r) => r.top1).sort((a, b) => a - b);
  return `n=${v.length} min ${f4(v[0])} median ${f4(v[v.length >> 1])} max ${f4(v[v.length - 1])}`;
};

console.log('\n--- top-1 cosine by bucket ---');
for (const b of ['present', 'present-es', 'absent', 'noise']) console.log(`${b.padEnd(11)} ${stat(by(b))}`);

const correct = by('present').filter((r) => r.hit).length;
const correctEs = by('present-es').filter((r) => r.hit).length;
console.log(`\nright subject at rank 1: english ${correct}/${by('present').length}, ` +
  `spanish ${correctEs}/${by('present-es').length}`);

console.log('\n--- the gap ---');
const noAnswer = [...by('absent'), ...by('noise')].map((r) => r.top1);
for (const b of ['present', 'present-es']) {
  const p = by(b).map((r) => r.top1);
  const lo = Math.min(...p), hi = Math.max(...noAnswer);
  console.log(`${b.padEnd(11)} worst present ${f4(lo)}  best no-answer ${f4(hi)}  ` +
    `gap ${f4(lo - hi)}  present below best no-answer: ${p.filter((x) => x <= hi).length}/${p.length}`);
}

const qms = results.map((r) => r.ms).sort((a, b) => a - b);
console.log(`\nquery embed median ${qms[qms.length >> 1].toFixed(1)} ms`);
