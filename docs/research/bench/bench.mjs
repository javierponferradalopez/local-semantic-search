import { AutoTokenizer, AutoProcessor, CLIPTextModelWithProjection, CLIPVisionModelWithProjection,
         SiglipTextModel, SiglipVisionModel, AutoModel, RawImage, env } from '@huggingface/transformers';
import { performance } from 'node:perf_hooks';

env.allowLocalModels = false;

const IMGS = ['images/img1.jpg','images/img2.jpg','images/img3.jpg','images/img4.jpg'];
const PARA = `Hexagonal architecture, also known as ports and adapters, is a software design pattern
that isolates the core business logic of an application from the outside world. The core defines ports,
which are interfaces that describe what the application needs or offers. Adapters implement those ports
and connect the core to databases, message queues, web frameworks, and file systems. Because the core
depends only on its own abstractions, it can be tested without any infrastructure. A test can replace a
real database adapter with an in-memory one and the core will not notice the difference. This separation
also makes it easy to swap technologies later. If the team decides to move from PostgreSQL to a vector
database, only the adapter changes. The domain model, the use cases, and the tests stay the same. The
pattern was described by Alistair Cockburn in 2005 and it remains a common choice for systems that need
a long life and a clear boundary between policy and detail.`.replace(/\s+/g,' ');

const CHUNKS = Array.from({length: 8}, (_,i) => PARA.slice(0, 900) + ` Variation ${i}.`);

function stats(ts){ const s=[...ts].sort((a,b)=>a-b); const mean=ts.reduce((a,b)=>a+b,0)/ts.length;
  return {n:ts.length, mean:+mean.toFixed(1), median:+s[Math.floor(s.length/2)].toFixed(1), min:+s[0].toFixed(1), max:+s[s.length-1].toFixed(1)}; }

async function timeIt(fn, warm=2, runs=6){ for(let i=0;i<warm;i++) await fn(); const ts=[];
  for(let i=0;i<runs;i++){ const t0=performance.now(); await fn(); ts.push(performance.now()-t0);} return stats(ts); }

async function benchDual({name, id, dtype, TextCls, VisCls, textKey='text_embeds', imgKey='image_embeds'}) {
  const out = {name, id, dtype};
  try {
    let t0 = performance.now();
    const tok = await AutoTokenizer.from_pretrained(id);
    const proc = await AutoProcessor.from_pretrained(id);
    const tm = await TextCls.from_pretrained(id, { dtype });
    const vm = await VisCls.from_pretrained(id, { dtype });
    out.load_ms = Math.round(performance.now() - t0);

    // token limit probe
    const full = tok(PARA, {truncation:false, padding:false});
    const trunc = tok(PARA);
    out.tokens_untruncated = full.input_ids.dims[1];
    out.tokens_after_default_truncation = trunc.input_ids.dims[1];
    out.tokenizer_model_max_length = tok.model_max_length;

    // text embed, batch 1
    out.text_1 = await timeIt(async () => {
      const inp = tok(CHUNKS[0], {padding:true, truncation:true});
      const r = await tm(inp); out.dim = r[textKey]?.dims?.at(-1) ?? r.text_embeds?.dims?.at(-1) ?? Object.values(r)[0].dims.at(-1);
    });
    // text embed, batch 8
    out.text_8 = await timeIt(async () => {
      const inp = tok(CHUNKS, {padding:true, truncation:true});
      await tm(inp);
    }, 1, 4);

    // image embed, batch 1
    const raws = await Promise.all(IMGS.map(p => RawImage.read(p)));
    out.image_1 = await timeIt(async () => {
      const pv = await proc(raws[0]);
      const r = await vm(pv);
      out.img_dim = r[imgKey]?.dims?.at(-1) ?? Object.values(r)[0].dims.at(-1);
    }, 1, 5);
    // image embed batch 4
    out.image_4 = await timeIt(async () => {
      const pv = await proc(raws);
      await vm(pv);
    }, 1, 3);
    // preprocessing only
    out.preprocess_1 = await timeIt(async () => { await proc(raws[0]); }, 1, 5);
    out.decode_1 = await timeIt(async () => { await RawImage.read(IMGS[0]); }, 1, 5);
  } catch (e) { out.error = String(e).slice(0, 400); }
  return out;
}

const results = [];
const which = process.argv[2] || 'all';

if (which==='all'||which==='clip') results.push(await benchDual({name:'CLIP ViT-B/32 fp32', id:'Xenova/clip-vit-base-patch32', dtype:'fp32', TextCls:CLIPTextModelWithProjection, VisCls:CLIPVisionModelWithProjection}));
if (which==='all'||which==='clipq') results.push(await benchDual({name:'CLIP ViT-B/32 q8', id:'Xenova/clip-vit-base-patch32', dtype:'q8', TextCls:CLIPTextModelWithProjection, VisCls:CLIPVisionModelWithProjection}));
if (which==='all'||which==='siglip') results.push(await benchDual({name:'SigLIP base/16-224 fp32', id:'Xenova/siglip-base-patch16-224', dtype:'fp32', TextCls:SiglipTextModel, VisCls:SiglipVisionModel, textKey:'pooler_output', imgKey:'pooler_output'}));
if (which==='all'||which==='siglip2') results.push(await benchDual({name:'SigLIP2 base/16-224 q8', id:'onnx-community/siglip2-base-patch16-224-ONNX', dtype:'q8', TextCls:SiglipTextModel, VisCls:SiglipVisionModel, textKey:'pooler_output', imgKey:'pooler_output'}));

console.log(JSON.stringify(results, null, 2));
