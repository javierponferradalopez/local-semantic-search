// Probe 3 for issue #19 -- the calibrated sigmoid of SigLIP.
//
// SigLIP trains with a sigmoid loss. The checkpoint therefore ships two learned
// scalars, `logit_scale` and `logit_bias`, and the model card computes
//
//     p = sigmoid(exp(logit_scale) * cos + logit_bias)
//
// This probe does three things.
//
//  1. Reads both scalars straight out of the checkpoint on the Hub with HTTP
//     range requests, for SigLIP2 base/16 and for SigLIP base/16.
//  2. Reproduces the number in the Hugging Face SigLIP documentation --
//     "31.9% that image 0 is 'a photo of 2 cats'" -- with SigLIP base/16 on
//     the same COCO image, which proves the formula and the scalars.
//  3. Runs every query of queries.mjs through SigLIP2 and prints the
//     calibrated probability of the best image beside the raw cosine.
//
// Usage: node siglip-calib.mjs

import { AutoTokenizer, AutoProcessor, RawImage, env,
         SiglipTextModel, SiglipVisionModel } from '@huggingface/transformers';
import { readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { rows } from './queries.mjs';

env.allowLocalModels = false;

const IMG_DIR = new URL('./images/', import.meta.url).pathname;
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const TOK = { padding: 'max_length', max_length: 64, truncation: true };

const norm = (v) => { const n = Math.hypot(...v); return v.map((x) => x / n); };
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const vec = (t) => {
  const [n, dim] = t.dims.slice(-2);
  const d = Array.from(t.data);
  return Array.from({ length: n }, (_, i) => norm(d.slice(i * dim, (i + 1) * dim)));
};
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const f4 = (x) => x.toFixed(4);
const pct = (x) => `${(x * 100).toFixed(2)}%`;

// --- 1. read the two learned scalars out of the safetensors on the Hub -------

async function scalars(repo) {
  const url = `https://huggingface.co/${repo}/resolve/main/model.safetensors`;
  const range = async (a, b) => {
    const r = await fetch(url, { headers: { Range: `bytes=${a}-${b}` } });
    return new Uint8Array(await r.arrayBuffer());
  };
  const head = await range(0, 7);
  const n = Number(new DataView(head.buffer).getBigUint64(0, true));
  const hdr = JSON.parse(new TextDecoder().decode(await range(8, 8 + n - 1)));
  const read = async (key) => {
    const [a, b] = hdr[key].data_offsets;
    const raw = await range(8 + n + a, 8 + n + b - 1);
    return new DataView(raw.buffer).getFloat32(0, true);
  };
  return { logit_scale: await read('logit_scale'), logit_bias: await read('logit_bias') };
}

const REPOS = ['google/siglip2-base-patch16-224', 'google/siglip-base-patch16-224'];
const CONST = {};
console.log('--- learned scalars, read from the checkpoint ---');
for (const repo of REPOS) {
  const s = await scalars(repo);
  CONST[repo] = s;
  const t = Math.exp(s.logit_scale);
  console.log(`${repo}`);
  console.log(`  logit_scale ${s.logit_scale.toFixed(6)}  exp(logit_scale) ${t.toFixed(4)}`);
  console.log(`  logit_bias  ${s.logit_bias.toFixed(6)}`);
  console.log(`  p = 0.5 at cosine ${(-s.logit_bias / t).toFixed(6)}`);
}

// --- images ------------------------------------------------------------------

const files = (await readdir(IMG_DIR))
  .filter((f) => EXT.has(extname(f).toLowerCase())).sort().map((f) => join(IMG_DIR, f));
if (!files.length) { console.error('no images -- run: sh fetch-images.sh'); process.exit(1); }

async function load(id, dtype = 'fp32') {
  return {
    tok: await AutoTokenizer.from_pretrained(id),
    proc: await AutoProcessor.from_pretrained(id),
    tm: await SiglipTextModel.from_pretrained(id, { dtype }),
    vm: await SiglipVisionModel.from_pretrained(id, { dtype }),
  };
}

// --- 2. reproduce the documented 31.9% with SigLIP base/16 -------------------

console.log('\n--- check against the published number ---');
console.log('Hugging Face SigLIP docs: "31.9% that image 0 is \'a photo of 2 cats\'"');
const cats = files.find((f) => basename(f).startsWith('000000039769'));
try {
  const m1 = await load('Xenova/siglip-base-patch16-224');
  const iv = vec((await m1.vm(await m1.proc(await RawImage.read(cats)))).pooler_output)[0];
  const c1 = CONST['google/siglip-base-patch16-224'];
  const t1 = Math.exp(c1.logit_scale);
  for (const text of ['a photo of 2 cats', 'a photo of 2 dogs']) {
    const tv = vec((await m1.tm(m1.tok(text, TOK))).pooler_output)[0];
    const cos = dot(iv, tv);
    console.log(`  "${text}"  cosine ${f4(cos)}  logit ${(t1 * cos + c1.logit_bias).toFixed(4)}  ` +
      `p ${pct(sigmoid(t1 * cos + c1.logit_bias))}`);
  }
} catch (e) {
  console.log(`  SigLIP base/16 failed: ${String(e).slice(0, 160)}`);
}

// --- 3. SigLIP2, raw cosine beside the calibrated probability ----------------

console.log('\n--- SigLIP2 base/16 fp32: cosine and calibrated probability ---');
const ID2 = 'onnx-community/siglip2-base-patch16-224-ONNX';
const c2 = CONST['google/siglip2-base-patch16-224'];
const t2 = Math.exp(c2.logit_scale);
const m2 = await load(ID2);
const imgVecs = [];
for (const f of files) imgVecs.push(vec((await m2.vm(await m2.proc(await RawImage.read(f)))).pooler_output)[0]);

const results = [];
for (const q of rows()) {
  const qv = vec((await m2.tm(m2.tok(q.text, TOK))).pooler_output)[0];
  const scored = files.map((f, i) => ({ file: basename(f), s: dot(qv, imgVecs[i]) }))
    .sort((a, b) => b.s - a.s);
  const cos = scored[0].s;
  results.push({ ...q, cos, p: sigmoid(t2 * cos + c2.logit_bias), file: scored[0].file });
}

console.log('bucket      variant      cosine  logit     p            query');
for (const r of results) {
  console.log(`${r.bucket.padEnd(11)} ${r.variant.padEnd(12)} ${f4(r.cos)}  ` +
    `${(t2 * r.cos + c2.logit_bias).toFixed(4).padStart(8)}  ${pct(r.p).padStart(10)}  "${r.text}"`);
}

const by = (b) => results.filter((r) => r.bucket === b);
console.log('\n--- how many top-1 hits pass p > 0.5 (the model\'s own neutral point) ---');
for (const b of ['present', 'absent', 'noise']) {
  const rs = by(b);
  const pass = rs.filter((r) => r.p > 0.5).length;
  const ps = rs.map((r) => r.p).sort((a, b) => a - b);
  console.log(`${b.padEnd(8)} ${pass}/${rs.length} pass   p min ${pct(ps[0])} ` +
    `median ${pct(ps[ps.length >> 1])} max ${pct(ps[ps.length - 1])}`);
}
