// Probe 8. Is the q8 export only smaller, or is it also worse?
// Run as: node quant.mjs <key>
// Loads the same model twice, at fp32 and at q8, and compares:
//   * the cosine between the two vectors of the same text (agreement);
//   * the ranking each one produces over the probe set (behaviour).
// The #3 report found a q8 text tower that crashed above 16 tokens and a
// vision q8 that changed the ranking. Speed is not the only thing q8 changes.
import { byKey, cos, PASSAGES, QUERIES } from './common.mjs';
import { makeEmbedder } from './embed.mjs';

const key = process.argv[2];
const c = byKey(key);
const dp = c.dp ?? '';
const qp = c.qp ?? '';

async function run(dtype) {
  const { embed } = await makeEmbedder(c, dtype);
  const p = [];
  for (const x of PASSAGES) p.push((await embed([dp + x.text]))[0]);
  const q = [];
  for (const x of QUERIES) q.push((await embed([qp + x.text]))[0]);
  const long = (await embed([dp + PASSAGES.map((x) => x.text).join(' ')]))[0];
  return { p, q, long };
}

const a = await run('fp32');
const b = await run('q8');

function ranking(qv, ps) {
  return PASSAGES.map((x, i) => ({ id: x.id, s: cos(qv, ps[i]) }))
    .sort((x, y) => y.s - x.s);
}

const out = { key, id: c.id, dim: a.p[0].length };
out.passage_cos_fp32_vs_q8 = PASSAGES.map((x, i) => `${x.id}:${cos(a.p[i], b.p[i]).toFixed(4)}`);
out.query_cos_fp32_vs_q8 = QUERIES.map((x, i) => `${x.id}:${cos(a.q[i], b.q[i]).toFixed(4)}`);
out.long_text_cos = +cos(a.long, b.long).toFixed(4);

let same = 0;
let sameTop = 0;
const changed = [];
for (let i = 0; i < QUERIES.length; i++) {
  const ra = ranking(a.q[i], a.p);
  const rb = ranking(b.q[i], b.p);
  if (ra.map((x) => x.id).join('>') === rb.map((x) => x.id).join('>')) same++;
  else changed.push({ q: QUERIES[i].id, fp32: ra.map((x) => x.id), q8: rb.map((x) => x.id) });
  if (ra[0].id === rb[0].id) sameTop++;
}
out.identical_ranking = `${same}/${QUERIES.length}`;
out.same_top1 = `${sameTop}/${QUERIES.length}`;
out.changed = changed;
out.hits_at_1_fp32 = `${QUERIES.filter((q, i) => ranking(a.q[i], a.p)[0].id === `${q.lang}-${q.fact}`).length}/${QUERIES.length}`;
out.hits_at_1_q8 = `${QUERIES.filter((q, i) => ranking(b.q[i], b.p)[0].id === `${q.lang}-${q.fact}`).length}/${QUERIES.length}`;
console.log(JSON.stringify(out));
