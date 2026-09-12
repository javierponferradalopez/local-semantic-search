import { AutoTokenizer, AutoProcessor, CLIPTextModelWithProjection, CLIPVisionModelWithProjection, RawImage, env } from '@huggingface/transformers';
env.allowLocalModels = false;
const id='Xenova/clip-vit-base-patch32';
const tok=await AutoTokenizer.from_pretrained(id);
const proc=await AutoProcessor.from_pretrained(id);
const tm=await CLIPTextModelWithProjection.from_pretrained(id,{dtype:'fp32'});
const vm=await CLIPVisionModelWithProjection.from_pretrained(id,{dtype:'fp32'});
const norm=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
const cos=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const texts=[
 'two cats sleeping on a pink sofa with two remote controls',
 'a photo of a dog running on the beach',
 'Hexagonal architecture isolates business logic from infrastructure using ports and adapters.',
 'The invoice total is 1,240 euros, due on 30 September.',
 'a black and white cat lying on a blanket',
 'Vector databases store embeddings and support approximate nearest neighbour search.',
];
const T=(await tm(tok(texts,{padding:true,truncation:true}))).text_embeds.tolist().map(norm);
const imgs=await Promise.all(['images/img1.jpg','images/img2.jpg','images/img3.jpg','images/img4.jpg'].map(p=>RawImage.read(p)));
const I=(await vm(await proc(imgs))).image_embeds.tolist().map(norm);
const pairs=(A,B,same)=>{const v=[];for(let i=0;i<A.length;i++)for(let j=same?i+1:0;j<B.length;j++)v.push(cos(A[i],B[j]));return v;};
const st=v=>({n:v.length,mean:+(v.reduce((a,b)=>a+b)/v.length).toFixed(4),min:+Math.min(...v).toFixed(4),max:+Math.max(...v).toFixed(4)});
console.log('text-text  :',JSON.stringify(st(pairs(T,T,true))));
console.log('image-image:',JSON.stringify(st(pairs(I,I,true))));
console.log('text-image :',JSON.stringify(st(pairs(T,I,false))));
console.log('\nRanking one query against a MIXED pool of 6 texts + 4 images (single CLIP index):');
const q=(await tm(tok(['a cat'],{padding:true,truncation:true}))).text_embeds.tolist().map(norm)[0];
const pool=[...texts.map((t,i)=>({kind:'TEXT',label:t.slice(0,50),v:T[i]})),...I.map((v,i)=>({kind:'IMAGE',label:'img'+(i+1),v}))];
pool.map(p=>({...p,s:cos(q,p.v)})).sort((a,b)=>b.s-a.s).forEach(p=>console.log(p.s.toFixed(4),p.kind,p.label));
