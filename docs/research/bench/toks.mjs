import { AutoTokenizer, env } from '@huggingface/transformers';
env.allowLocalModels=false;
const PARA=`Hexagonal architecture, also known as ports and adapters, is a software design pattern that isolates the core business logic of an application from the outside world. The core defines ports, which are interfaces that describe what the application needs or offers. Adapters implement those ports and connect the core to databases, message queues, web frameworks, and file systems. Because the core depends only on its own abstractions, it can be tested without any infrastructure. A test can replace a real database adapter with an in-memory one and the core will not notice the difference. This separation also makes it easy to swap technologies later.`;
console.log('chars', PARA.length, 'words', PARA.split(/\s+/).length);
const LIM={'Xenova/clip-vit-base-patch32':77,'Xenova/siglip-base-patch16-224':64,'onnx-community/siglip2-base-patch16-224-ONNX':64,'jinaai/jina-clip-v1':8192,'Xenova/all-MiniLM-L6-v2':512};
for (const [id,lim] of Object.entries(LIM)) {
  const t=await AutoTokenizer.from_pretrained(id);
  const n=t(PARA,{truncation:false}).input_ids.dims[1];
  console.log(`${id.padEnd(46)} tokens=${String(n).padStart(4)} limit=${String(lim).padStart(4)} kept=${Math.min(n,lim)} dropped=${n>lim?(100*(n-lim)/n).toFixed(0)+'%':'0%'}`);
}
