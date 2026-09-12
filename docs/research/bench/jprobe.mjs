import { AutoTokenizer, JinaCLIPTextModel, env } from '@huggingface/transformers';
env.allowLocalModels = false;
const id='jinaai/jina-clip-v1';
const tok=await AutoTokenizer.from_pretrained(id);
console.log('tokenizer_class/model_max_length =', tok.model_max_length);
for (const dt of ['q8','fp32']) {
  let tm;
  try { tm = await JinaCLIPTextModel.from_pretrained(id,{dtype:dt}); } catch(e){ console.log(dt,'LOAD FAIL',String(e).slice(0,200)); continue; }
  console.log('--- dtype', dt, '---');
  for (const n of [8,16,32,64,77,128,256,512,1024,2048,8192]) {
    const text = 'word '.repeat(n*2);
    const ids = tok(text,{truncation:true,max_length:n,padding:'max_length'});
    try { const r = await tm(ids); console.log(`  len=${String(n).padStart(5)} OK  keys=${Object.keys(r)} dim=${Object.values(r)[0].dims.at(-1)}`); }
    catch(e){ console.log(`  len=${String(n).padStart(5)} FAIL ${String(e).slice(0,140)}`); }
  }
}
