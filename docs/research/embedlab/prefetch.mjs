// Fills the weight cache. Nothing is measured here.
// Run as: node prefetch.mjs <key> <dtype>
// Downloads dominate the wall clock, so `run-prefetch.sh` runs several of
// these at the same time. Every measurement then runs from a warm cache, one
// process at a time, so the timings are not polluted by the network.
import { AutoModel, AutoTokenizer } from '@huggingface/transformers';
import { byKey } from './common.mjs';

const [key, dtype = 'fp32'] = process.argv.slice(2);
const c = byKey(key);
try {
  await AutoTokenizer.from_pretrained(c.id);
  await AutoModel.from_pretrained(c.id, { dtype });
  console.log(`cached ${key} ${dtype}`);
} catch (e) {
  console.log(`failed ${key} ${dtype}: ${String(e?.message ?? e).slice(0, 200)}`);
}
