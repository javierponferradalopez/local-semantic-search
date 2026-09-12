import { AutoTokenizer, AutoProcessor, CLIPTextModelWithProjection, CLIPVisionModelWithProjection, RawImage, env } from '@huggingface/transformers';
import { performance } from 'node:perf_hooks';
env.allowLocalModels=false;
const IMGS=['images/img1.jpg','images/img2.jpg','images/img3.jpg','images/img4.jpg'];
const raws=await Promise.all(IMGS.map(p=>RawImage.read(p)));
const st=ts=>{const s=[...ts].sort((a,b)=>a-b);return{n:ts.length,mean:+(ts.reduce((a,b)=>a+b)/ts.length).toFixed(1),median:+s[s.length>>1].toFixed(1)};};
const T=async(fn,w=1,r=5)=>{for(let i=0;i<w;i++)await fn();const ts=[];for(let i=0;i<r;i++){const t=performance.now();await fn();ts.push(performance.now()-t);}return st(ts);};
for (const [id,dt] of [['Xenova/mobileclip_s0','q8'],['Xenova/mobileclip_s0','fp32'],['Xenova/clip-vit-base-patch32','q8']]) {
  const o={id,dt};
  try{
    const tok=await AutoTokenizer.from_pretrained(id), proc=await AutoProcessor.from_pretrained(id);
    const tm=await CLIPTextModelWithProjection.from_pretrained(id,{dtype:dt});
    const vm=await CLIPVisionModelWithProjection.from_pretrained(id,{dtype: id.includes('mobileclip')?'fp32':dt});
    o.model_max_length=tok.model_max_length;
    o.text_1=await T(async()=>{const r=await tm(tok('a photo of a cat on a sofa',{padding:'max_length',truncation:true,max_length:77}));o.dim=r.text_embeds.dims.at(-1);});
    o.image_1=await T(async()=>{const r=await vm(await proc(raws[0]));o.img_dim=r.image_embeds.dims.at(-1);},1,6);
    o.image_4=await T(async()=>{await vm(await proc(raws));},1,3);
  }catch(e){o.error=String(e).slice(0,200);}
  console.log(JSON.stringify(o));
}
