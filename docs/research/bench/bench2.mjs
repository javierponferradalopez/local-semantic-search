import { AutoTokenizer, AutoProcessor, SiglipTextModel, SiglipVisionModel,
         JinaCLIPTextModel, JinaCLIPVisionModel, AutoModel, RawImage, env } from '@huggingface/transformers';
import { performance } from 'node:perf_hooks';
env.allowLocalModels = false;
const IMGS=['images/img1.jpg','images/img2.jpg','images/img3.jpg','images/img4.jpg'];
const PARA=`Hexagonal architecture, also known as ports and adapters, is a software design pattern that isolates the core business logic of an application from the outside world. The core defines ports, which are interfaces that describe what the application needs or offers. Adapters implement those ports and connect the core to databases, message queues, web frameworks, and file systems. Because the core depends only on its own abstractions, it can be tested without any infrastructure. A test can replace a real database adapter with an in-memory one and the core will not notice the difference. This separation also makes it easy to swap technologies later.`;
const CHUNKS=Array.from({length:8},(_,i)=>PARA+` Variation ${i}.`);
const st=ts=>{const s=[...ts].sort((a,b)=>a-b);return{n:ts.length,mean:+(ts.reduce((a,b)=>a+b)/ts.length).toFixed(1),median:+s[s.length>>1].toFixed(1),min:+s[0].toFixed(1),max:+s[s.length-1].toFixed(1)};};
const T=async(fn,w=1,r=5)=>{for(let i=0;i<w;i++)await fn();const ts=[];for(let i=0;i<r;i++){const t=performance.now();await fn();ts.push(performance.now()-t);}return st(ts);};

const which=process.argv[2];
const out={which};
const raws=await Promise.all(IMGS.map(p=>RawImage.read(p)));

if(which==='siglip2'){
  const id='onnx-community/siglip2-base-patch16-224-ONNX';
  let t0=performance.now();
  const tok=await AutoTokenizer.from_pretrained(id), proc=await AutoProcessor.from_pretrained(id);
  const tm=await SiglipTextModel.from_pretrained(id,{dtype:'q8'}), vm=await SiglipVisionModel.from_pretrained(id,{dtype:'q8'});
  out.load_ms=Math.round(performance.now()-t0);
  const opts={padding:'max_length',truncation:true,max_length:64};
  out.tokens_full=tok(PARA,{truncation:false}).input_ids.dims[1];
  out.tokens_trunc64=tok(PARA,opts).input_ids.dims[1];
  out.text_1=await T(async()=>{const r=await tm(tok(CHUNKS[0],opts));out.dim=r.pooler_output.dims.at(-1);});
  out.text_8=await T(async()=>{await tm(tok(CHUNKS,opts));},1,4);
  out.image_1=await T(async()=>{const r=await vm(await proc(null, raws[0]));out.img_dim=r.pooler_output.dims.at(-1);},1,5);
  out.image_4=await T(async()=>{await vm(await proc(null, raws));},1,3);
}
if(which==='jina1'){
  const id='jinaai/jina-clip-v1';
  let t0=performance.now();
  const tok=await AutoTokenizer.from_pretrained(id), proc=await AutoProcessor.from_pretrained(id);
  const tm=await JinaCLIPTextModel.from_pretrained(id,{dtype:'fp32'}), vm=await JinaCLIPVisionModel.from_pretrained(id,{dtype:'q8'});
  out.load_ms=Math.round(performance.now()-t0);
  out.tokenizer_model_max_length=tok.model_max_length;
  out.tokens_full=tok(PARA,{truncation:false}).input_ids.dims[1];
  out.text_1=await T(async()=>{const r=await tm(tok(CHUNKS[0],{padding:true,truncation:true}));out.text_keys=Object.keys(r);out.dim=Object.values(r)[0].dims.at(-1);});
  out.text_8=await T(async()=>{await tm(tok(CHUNKS,{padding:true,truncation:true}));},1,4);
  out.image_1=await T(async()=>{const r=await vm(await proc(null, raws[0]));out.img_keys=Object.keys(r);out.img_dim=Object.values(r)[0].dims.at(-1);},1,5);
  out.image_4=await T(async()=>{await vm(await proc(null, raws));},1,3);
  // long text: 2000 words
  const LONG=Array(30).fill(PARA).join(' ');
  const n=tok(LONG,{truncation:true}).input_ids.dims[1];
  out.long_tokens=n;
  out.text_long=await T(async()=>{await tm(tok(LONG,{padding:true,truncation:true}));},1,3);
}
if(which==='minilm'){
  const id='Xenova/all-MiniLM-L6-v2';
  let t0=performance.now();
  const tok=await AutoTokenizer.from_pretrained(id);
  const m=await AutoModel.from_pretrained(id,{dtype:'q8'});
  out.load_ms=Math.round(performance.now()-t0);
  out.tokenizer_model_max_length=tok.model_max_length;
  out.tokens_full=tok(PARA,{truncation:false}).input_ids.dims[1];
  out.tokens_trunc=tok(PARA,{truncation:true}).input_ids.dims[1];
  out.text_1=await T(async()=>{const r=await m(tok(CHUNKS[0],{padding:true,truncation:true}));out.dim=r.last_hidden_state.dims.at(-1);});
  out.text_8=await T(async()=>{await m(tok(CHUNKS,{padding:true,truncation:true}));},1,4);
  out.text_32=await T(async()=>{await m(tok(Array.from({length:32},(_,i)=>PARA+i),{padding:true,truncation:true}));},1,3);
}
console.log(JSON.stringify(out,null,2));
