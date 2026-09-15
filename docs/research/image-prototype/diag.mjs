import { AutoTokenizer, AutoProcessor, RawImage, env,
         CLIPTextModelWithProjection, CLIPVisionModelWithProjection,
         SiglipTextModel, SiglipVisionModel } from '@huggingface/transformers';
import { readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
env.allowLocalModels = false;

const DIR = process.argv[2];
const files = (await readdir(DIR)).filter(f => /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(f)).sort().map(f => join(DIR, f));
const Q = ['a whale in the ocean', 'a lion cub', 'a bird'];
const norm = v => { const n = Math.sqrt(v.reduce((s,x)=>s+x*x,0)); return v.map(x => x/n); };
const dot = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
const vec1 = t => { const dim = t.dims.at(-1); return norm(Array.from(t.data).slice(0,dim)); };

async function run(label, id, dtype, TextCls, VisCls, tk, ik, tokOpts) {
  const tok = await AutoTokenizer.from_pretrained(id);
  const proc = await AutoProcessor.from_pretrained(id);
  const tm = await TextCls.from_pretrained(id, { dtype });
  const vm = await VisCls.from_pretrained(id, { dtype });
  const iv = [];
  for (const f of files) iv.push(vec1((await vm(await proc(await RawImage.read(f))))[ik]));
  console.log(`\n### ${label}`);
  for (const q of Q) {
    const qv = vec1((await tm(tok(q, tokOpts)))[tk]);
    const r = files.map((f,i)=>({f:basename(f).split('-')[1], s:dot(qv,iv[i])})).sort((a,b)=>b.s-a.s);
    console.log(`  "${q}" -> ` + r.slice(0,3).map(x=>`${x.f} ${x.s.toFixed(3)}`).join(' | '));
  }
}

const which = process.argv[3] || 'all';
const C = 'Xenova/clip-vit-base-patch32', S = 'onnx-community/siglip2-base-patch16-224-ONNX';
if (which==='all'||which==='a') await run('CLIP q8 (current)', C,'q8', CLIPTextModelWithProjection, CLIPVisionModelWithProjection,'text_embeds','image_embeds',{padding:true,truncation:true});
if (which==='all'||which==='b') await run('CLIP fp32', C,'fp32', CLIPTextModelWithProjection, CLIPVisionModelWithProjection,'text_embeds','image_embeds',{padding:true,truncation:true});
if (which==='all'||which==='c') await run('SigLIP2 q8 dynamic pad (current)', S,'q8', SiglipTextModel, SiglipVisionModel,'pooler_output','pooler_output',{padding:true,truncation:true});
if (which==='all'||which==='d') await run('SigLIP2 q8 max_length pad', S,'q8', SiglipTextModel, SiglipVisionModel,'pooler_output','pooler_output',{padding:'max_length',max_length:64,truncation:true});
if (which==='all'||which==='e') await run('SigLIP2 fp32 max_length pad', S,'fp32', SiglipTextModel, SiglipVisionModel,'pooler_output','pooler_output',{padding:'max_length',max_length:64,truncation:true});
