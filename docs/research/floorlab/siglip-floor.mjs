// Probe 1 for issue #19 -- the image space.
//
// Embeds the 16 images of fetch-images.sh with SigLIP2 base/16 fp32, then
// embeds every query of queries.mjs and records the cosine of the best image.
// The question is not "which image wins" but "how far apart are the best
// scores of a query that has an answer and of a query that has none".
//
// Usage: node siglip-floor.mjs

import { AutoTokenizer, AutoProcessor, RawImage, env,
         SiglipTextModel, SiglipVisionModel } from '@huggingface/transformers';
import { readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { performance } from 'node:perf_hooks';
import { rows } from './queries.mjs';

env.allowLocalModels = false;

const ID = 'onnx-community/siglip2-base-patch16-224-ONNX';
const DTYPE = 'fp32';
// SigLIP needs text padded to a fixed length. Dynamic padding returns noise
// and throws nothing. Measured in issue #7.
const TOK = { padding: 'max_length', max_length: 64, truncation: true };

const IMG_DIR = new URL('./images/', import.meta.url).pathname;
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const norm = (v) => { const n = Math.hypot(...v); return v.map((x) => x / n); };
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const vec = (t) => {
  const [rows_, dim] = t.dims.slice(-2);
  const d = Array.from(t.data);
  return Array.from({ length: rows_ }, (_, i) => norm(d.slice(i * dim, (i + 1) * dim)));
};
const f4 = (x) => x.toFixed(4);

const files = (await readdir(IMG_DIR))
  .filter((f) => EXT.has(extname(f).toLowerCase())).sort().map((f) => join(IMG_DIR, f));
if (!files.length) { console.error('no images -- run: sh fetch-images.sh'); process.exit(1); }

const t0 = performance.now();
const tok = await AutoTokenizer.from_pretrained(ID);
const proc = await AutoProcessor.from_pretrained(ID);
const tm = await SiglipTextModel.from_pretrained(ID, { dtype: DTYPE });
const vm = await SiglipVisionModel.from_pretrained(ID, { dtype: DTYPE });
console.log(`model ${ID} ${DTYPE}`);
console.log(`load ${Math.round(performance.now() - t0)} ms`);
console.log(`images ${files.length}\n`);

const imgVecs = [];
const perImg = [];
for (const f of files) {
  const t = performance.now();
  const out = await vm(await proc(await RawImage.read(f)));
  imgVecs.push(vec(out.pooler_output)[0]);
  perImg.push(performance.now() - t);
}
const sortedMs = [...perImg].sort((a, b) => a - b);
console.log(`index ${f4(perImg.reduce((a, b) => a + b, 0) / 1000)} s total, ` +
  `${sortedMs[sortedMs.length >> 1].toFixed(1)} ms median per image\n`);

const results = [];
for (const q of rows()) {
  const t = performance.now();
  const qv = vec((await tm(tok(q.text, TOK))).pooler_output)[0];
  const ms = performance.now() - t;
  const scored = files.map((f, i) => ({ file: basename(f), s: dot(qv, imgVecs[i]) }))
    .sort((a, b) => b.s - a.s);
  results.push({ ...q, ms, top1: scored[0].s, top1File: scored[0].file,
    top2: scored[1].s, median: scored[scored.length >> 1].s, min: scored[scored.length - 1].s });
}

console.log('bucket      variant      top1    top2    median  min     margin  winner                query');
for (const r of results) {
  console.log(
    `${r.bucket.padEnd(11)} ${r.variant.padEnd(12)} ${f4(r.top1)}  ${f4(r.top2)}  ` +
    `${f4(r.median)}  ${f4(r.min)}  ${f4(r.top1 - r.top2)}  ${r.top1File.padEnd(20)}  "${r.text}"`);
}

const by = (b, v) => results.filter((r) => r.bucket === b && (!v || r.variant === v));
const stat = (rs) => {
  if (!rs.length) return 'n/a';
  const v = rs.map((r) => r.top1).sort((a, b) => a - b);
  return `n=${v.length} min ${f4(v[0])} median ${f4(v[v.length >> 1])} max ${f4(v[v.length - 1])}`;
};

console.log('\n--- top-1 cosine by bucket and variant ---');
for (const b of ['present', 'absent', 'noise']) {
  console.log(`${b.padEnd(8)} all          ${stat(by(b))}`);
  for (const v of ['en-caption', 'es-caption', 'en-bare', 'es-bare']) {
    const rs = by(b, v);
    if (rs.length) console.log(`${''.padEnd(8)} ${v.padEnd(12)} ${stat(rs)}`);
  }
}

console.log('\n--- the gap ---');
for (const v of [null, 'en-caption', 'es-caption', 'en-bare', 'es-bare']) {
  const p = by('present', v).map((r) => r.top1);
  const a = [...by('absent', v), ...(v ? [] : by('noise'))].map((r) => r.top1);
  if (!p.length || !a.length) continue;
  const lo = Math.min(...p), hi = Math.max(...a);
  const overlap = p.filter((x) => x <= hi).length;
  console.log(`${(v ?? 'all').padEnd(12)} worst present ${f4(lo)}  best absent ${f4(hi)}  ` +
    `gap ${f4(lo - hi)}  present below best absent: ${overlap}/${p.length}`);
}

const qms = results.map((r) => r.ms).sort((a, b) => a - b);
console.log(`\nquery embed median ${qms[qms.length >> 1].toFixed(1)} ms`);
