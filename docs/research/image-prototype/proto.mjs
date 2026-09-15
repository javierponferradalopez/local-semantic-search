// Throwaway prototype for issue #7: does text-to-image search really work?
// Usage: node proto.mjs <images-dir> <queries-file>
// Embeds every image with each candidate CLIP-family model, embeds each query,
// ranks images by cosine, prints the table and writes results.html.

import { AutoTokenizer, AutoProcessor, RawImage, env,
         CLIPTextModelWithProjection, CLIPVisionModelWithProjection,
         SiglipTextModel, SiglipVisionModel } from '@huggingface/transformers';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { performance } from 'node:perf_hooks';

env.allowLocalModels = false;

const MODELS = [
  { name: 'CLIP ViT-B/32 fp32', id: 'Xenova/clip-vit-base-patch32', dtype: 'fp32',
    TextCls: CLIPTextModelWithProjection, VisCls: CLIPVisionModelWithProjection,
    textKey: 'text_embeds', imgKey: 'image_embeds', tokenWall: 77,
    tokOpts: { padding: true, truncation: true } },
  // SigLIP is trained on text padded to a fixed length. Dynamic padding returns
  // noise -- no error, just a ranking that means nothing. Measured, see issue #7.
  { name: 'SigLIP2 base/16 fp32', id: 'onnx-community/siglip2-base-patch16-224-ONNX', dtype: 'fp32',
    TextCls: SiglipTextModel, VisCls: SiglipVisionModel,
    textKey: 'pooler_output', imgKey: 'pooler_output', tokenWall: 64,
    tokOpts: { padding: 'max_length', max_length: 64, truncation: true } },
];

const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']);
const TOP = 8;

const norm = v => { const n = Math.hypot(...v); return v.map(x => x / n); };
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const vecs = (t) => { const [rows, dim] = t.dims.slice(-2); const d = Array.from(t.data);
  return Array.from({ length: rows }, (_, i) => norm(d.slice(i * dim, (i + 1) * dim))); };

const [dir, queriesFile] = process.argv.slice(2);
if (!dir || !queriesFile) { console.error('usage: node proto.mjs <images-dir> <queries-file>'); process.exit(1); }

const files = (await readdir(dir)).filter(f => EXT.has(extname(f).toLowerCase())).sort()
  .map(f => join(dir, f));
const queries = (await readFile(queriesFile, 'utf8')).split('\n').map(s => s.trim()).filter(Boolean);
console.log(`${files.length} images, ${queries.length} queries\n`);

const report = [];

for (const M of MODELS) {
  console.log(`=== ${M.name} ===`);
  const t0 = performance.now();
  const tok = await AutoTokenizer.from_pretrained(M.id);
  const proc = await AutoProcessor.from_pretrained(M.id);
  const tm = await M.TextCls.from_pretrained(M.id, { dtype: M.dtype });
  const vm = await M.VisCls.from_pretrained(M.id, { dtype: M.dtype });
  const loadMs = Math.round(performance.now() - t0);
  console.log(`load ${loadMs} ms`);

  // --- index every image, one at a time, timed
  const imgVecs = [], indexed = [], failed = [], perImg = [];
  for (const f of files) {
    try {
      const t = performance.now();
      const raw = await RawImage.read(f);
      const out = await vm(await proc(raw));
      imgVecs.push(vecs(out[M.imgKey])[0]);
      perImg.push(performance.now() - t);
      indexed.push(f);
    } catch (e) { failed.push([basename(f), String(e).slice(0, 120)]); }
  }
  const sorted = [...perImg].sort((a, b) => a - b);
  const median = sorted.length ? +sorted[sorted.length >> 1].toFixed(1) : 0;
  const total = +(perImg.reduce((a, b) => a + b, 0) / 1000).toFixed(1);
  console.log(`indexed ${indexed.length} images: ${total}s total, ${median} ms median/image`);
  if (failed.length) console.log(`skipped ${failed.length}:`, failed.map(f => f[0]).join(', '));

  // --- query
  const qResults = [];
  for (const q of queries) {
    const t = performance.now();
    // the accepted silent clamp: cut the query to the model's token wall
    let ids = tok(q, M.tokOpts);
    let clamped = false;
    if (tok(q, { truncation: false }).input_ids.dims[1] > M.tokenWall) {
      const words = q.split(' ');
      let cut = q;
      while (words.length && tok(cut, { truncation: false }).input_ids.dims[1] > M.tokenWall) { words.pop(); cut = words.join(' '); }
      ids = tok(cut, M.tokOpts); clamped = true;
    }
    const qv = vecs((await tm(ids))[M.textKey])[0];
    const ms = +(performance.now() - t).toFixed(1);
    const ranked = indexed.map((f, i) => ({ file: f, score: dot(qv, imgVecs[i]) }))
      .sort((a, b) => b.score - a.score).slice(0, TOP);
    qResults.push({ query: q, ms, clamped, ranked });
    console.log(`\n"${q}"  (${ms} ms${clamped ? ', CLAMPED' : ''})`);
    ranked.forEach((r, i) => console.log(`  ${i + 1}. ${r.score.toFixed(4)}  ${basename(r.file)}`));
  }
  console.log();
  report.push({ model: M.name, loadMs, median, total, indexed: indexed.length, failed, qResults });
}

// --- contact sheet
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const html = `<!doctype html><meta charset="utf-8"><title>Image search prototype</title>
<style>body{font:14px system-ui;margin:2rem;background:#111;color:#eee}h2{margin-top:2.5rem}
.q{margin:1.5rem 0;padding:1rem;background:#1b1b1b;border-radius:8px}
.row{display:flex;gap:.6rem;overflow-x:auto;padding-top:.6rem}
figure{margin:0;flex:0 0 150px}img{width:150px;height:150px;object-fit:cover;border-radius:6px;background:#000}
figcaption{font:11px ui-monospace;color:#aaa;margin-top:.3rem;word-break:break-all}
.s{color:#7fd}.meta{color:#888;font-size:12px}</style>
<h1>Does text-to-image search really work?</h1>
${report.map(r => `<h2>${esc(r.model)}</h2>
<p class=meta>${r.indexed} images indexed &middot; ${r.median} ms median/image &middot; ${r.total}s total &middot; load ${r.loadMs} ms${r.failed.length ? ` &middot; skipped ${r.failed.length}` : ''}</p>
${r.qResults.map(q => `<div class=q><b>${esc(q.query)}</b> <span class=meta>${q.ms} ms${q.clamped ? ' &middot; CLAMPED' : ''}</span>
<div class=row>${q.ranked.map((x, i) => `<figure><img src="file://${encodeURI(x.file)}"><figcaption>${i + 1}. <span class=s>${x.score.toFixed(3)}</span><br>${esc(basename(x.file))}</figcaption></figure>`).join('')}</div></div>`).join('')}`).join('')}`;
await writeFile(new URL('./results.html', import.meta.url), html);
console.log('wrote results.html');
