import { AutoTokenizer, CLIPTextModelWithProjection, env } from '@huggingface/transformers';
env.allowLocalModels = false;
const PARA = `Hexagonal architecture, also known as ports and adapters, is a software design pattern that isolates the core business logic of an application from the outside world. The core defines ports, which are interfaces that describe what the application needs or offers. Adapters implement those ports and connect the core to databases, message queues, web frameworks, and file systems. Because the core depends only on its own abstractions, it can be tested without any infrastructure. A test can replace a real database adapter with an in-memory one and the core will not notice the difference. This separation also makes it easy to swap technologies later.`;
const tok = await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch32');
console.log('model_max_length =', tok.model_max_length);
for (const opts of [ {}, {truncation:true}, {truncation:true, max_length:77}, {padding:'max_length', truncation:true} ]) {
  const r = tok(PARA, opts);
  console.log(JSON.stringify(opts), '-> len', r.input_ids.dims[1]);
}
const m = await CLIPTextModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32', {dtype:'fp32'});
// try feeding the over-long sequence
try {
  const r = await m(tok(PARA, {}));
  console.log('OVER-LONG FORWARD: ok, dims', r.text_embeds.dims);
} catch (e) { console.log('OVER-LONG FORWARD ERROR:', String(e).slice(0,300)); }
// cosine between full-para-truncated and its first 77 tokens worth of text
function cos(a,b){let d=0,na=0,nb=0;for(let i=0;i<a.length;i++){d+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}return d/Math.sqrt(na*nb);}
const short = PARA.split(' ').slice(0,40).join(' ');
const tail  = PARA.split(' ').slice(-40).join(' ');
const e1 = (await m(tok(PARA,{truncation:true,max_length:77}))).text_embeds.tolist()[0];
const e2 = (await m(tok(short,{truncation:true,max_length:77}))).text_embeds.tolist()[0];
const e3 = (await m(tok(tail,{truncation:true,max_length:77}))).text_embeds.tolist()[0];
console.log('cos(truncated-para, first-40-words) =', cos(e1,e2).toFixed(4));
console.log('cos(truncated-para, last-40-words)  =', cos(e1,e3).toFixed(4));
